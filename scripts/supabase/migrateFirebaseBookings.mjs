/**
 * Firebase bookings -> Supabase reservation bundle migration.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SECRET_KEY=... FIREBASE_SERVICE_ACCOUNT_PATH=... node scripts/supabase/migrateFirebaseBookings.mjs
 *   SUPABASE_APPLY=true 추가 시 실제 적용
 */

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const config = {
  supabaseUrl: (process.env.SUPABASE_URL || '').trim(),
  supabaseSecretKey: (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'beeliber-main',
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
  apply: process.env.SUPABASE_APPLY === 'true',
  collections: (process.env.MIGRATE_BOOKING_COLLECTIONS || 'bookings,archived_bookings').split(',').map((value) => value.trim()).filter(Boolean),
};

if (!config.supabaseUrl || !config.supabaseSecretKey) {
  console.error('❌ SUPABASE_URL 과 SUPABASE_SECRET_KEY 필수');
  process.exit(1);
}

async function initFirebase() {
  if (getApps().length) return getFirestore();

  let credential;
  if (config.firebaseServiceAccountJson) {
    credential = cert(JSON.parse(config.firebaseServiceAccountJson));
  } else if (config.firebaseServiceAccountPath) {
    const raw = await readFile(config.firebaseServiceAccountPath, 'utf8');
    credential = cert(JSON.parse(raw));
  } else {
    console.error('❌ Firebase 인증 정보 없음 (FIREBASE_SERVICE_ACCOUNT_PATH 또는 GOOGLE_APPLICATION_CREDENTIALS 필요)');
    process.exit(1);
  }

  initializeApp({
    credential,
    projectId: config.firebaseProjectId,
  });

  return getFirestore();
}

function stableUuid(input) {
  const hex = createHash('sha1').update(String(input)).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function normalizeString(value) {
  const normalized = String(value || '').trim();
  return normalized || '';
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeBagSizes(rawBagSizes = {}) {
  return {
    handBag: toNumber(rawBagSizes.handBag ?? rawBagSizes.S),
    carrier: toNumber(rawBagSizes.carrier) + toNumber(rawBagSizes.M) + toNumber(rawBagSizes.L),
    strollerBicycle: toNumber(rawBagSizes.strollerBicycle ?? rawBagSizes.XL),
  };
}

function toIsoString(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function toDateString(value) {
  const normalized = normalizeString(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function toTimeString(value, fallback = '00:00:00') {
  const normalized = normalizeString(value);
  if (!normalized) return fallback;
  if (/^\d{2}:\d{2}:\d{2}$/.test(normalized)) return normalized;
  if (/^\d{2}:\d{2}$/.test(normalized)) return `${normalized}:00`;
  return fallback;
}

function buildScheduledAt(dateValue, timeValue, fallbackIso) {
  const date = toDateString(dateValue);
  if (!date) return fallbackIso || new Date().toISOString();
  const time = toTimeString(timeValue);
  return `${date}T${time}+09:00`;
}

function mapLegacyReservationStatus(legacyBooking) {
  const legacyStatus = normalizeString(legacyBooking.status);
  if (legacyStatus === '취소됨' || legacyStatus === '환불완료') {
    return 'cancelled';
  }

  if (normalizeString(legacyBooking.paymentStatus) === 'pending' && normalizeString(legacyBooking.paymentMethod) === 'card') {
    return 'payment_pending';
  }

  return 'reservation_confirmed';
}

function mapLegacyOpsStatus(legacyBooking) {
  const legacyStatus = normalizeString(legacyBooking.status);
  const serviceType = normalizeString(legacyBooking.serviceType).toUpperCase();

  switch (legacyStatus) {
    case '완료':
      return 'completed';
    case '목적지도착':
      return 'arrived_at_destination';
    case '이동중':
      return 'in_transit';
    case '보관중':
      return 'pickup_completed';
    case '예약완료':
    case '접수완료':
      return 'pickup_ready';
    default:
      if (serviceType === 'STORAGE' && legacyStatus === '완료') {
        return 'completed';
      }
      return null;
  }
}

function mapLegacyPaymentStatus(legacyBooking) {
  const legacyStatus = normalizeString(legacyBooking.status);
  const paymentMethod = normalizeString(legacyBooking.paymentMethod);
  const paymentStatus = normalizeString(legacyBooking.paymentStatus);

  if (legacyStatus === '환불완료') return 'refunded';
  if (legacyStatus === '취소됨') return 'failed';
  if (paymentStatus === 'pending') return 'pending';
  if (paymentMethod) return 'paid';
  return 'paid';
}

function mapPaymentProvider(legacyBooking) {
  const raw = normalizeString(legacyBooking.paymentProvider);
  if (raw) return raw;
  if (normalizeString(legacyBooking.paymentMethod) === 'cash') return 'manual';
  return 'legacy';
}

async function fetchSupabaseRows(path) {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: config.supabaseSecretKey,
      Authorization: `Bearer ${config.supabaseSecretKey}`,
      'Accept-Profile': 'public',
      'Content-Profile': 'public',
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase lookup 실패 [${response.status}] ${path}: ${await response.text()}`);
  }

  return response.json();
}

async function supabaseUpsert(table, rows) {
  if (!rows.length) {
    return { count: 0 };
  }

  const url = `${config.supabaseUrl}/rest/v1/${table}`;
  let total = 0;

  for (let index = 0; index < rows.length; index += 50) {
    const batch = rows.slice(index, index + 50);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.supabaseSecretKey,
        Authorization: `Bearer ${config.supabaseSecretKey}`,
        'Accept-Profile': 'public',
        'Content-Profile': 'public',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      throw new Error(`Supabase ${table} upsert 실패 [${response.status}]: ${await response.text()}`);
    }

    total += batch.length;
  }

  return { count: total };
}

function uniqueById(rows) {
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

function readBookingCollectionSnapshot(snapshot, source) {
  return snapshot.docs.map((doc) => ({
    source,
    legacyId: doc.id,
    ...doc.data(),
  }));
}

function resolveLocationCode(legacyBooking, kind) {
  const rawCode = kind === 'pickup'
    ? normalizeString(legacyBooking.pickupLocation)
    : normalizeString(legacyBooking.dropoffLocation);
  const locationObject = kind === 'pickup' ? legacyBooking.pickupLoc : legacyBooking.returnLoc;

  return normalizeString(
    locationObject?.shortCode
      || locationObject?.id
      || rawCode
  ).toUpperCase();
}

function resolveLocationName(legacyBooking, kind) {
  const locationObject = kind === 'pickup' ? legacyBooking.pickupLoc : legacyBooking.returnLoc;
  return normalizeString(locationObject?.name || (kind === 'pickup' ? legacyBooking.pickupLocation : legacyBooking.dropoffLocation));
}

function buildMigrationBundle(legacyBookings, lookups) {
  const customers = [];
  const reservations = [];
  const bookingDetails = [];
  const reservationItems = [];
  const payments = [];
  const warnings = [];

  for (const legacyBooking of legacyBookings) {
    const sourceKey = `${legacyBooking.source}:${legacyBooking.legacyId}`;
    const serviceType = normalizeString(legacyBooking.serviceType).toUpperCase() === 'DELIVERY' ? 'HUB_TO_AIRPORT' : 'STORAGE';
    const serviceId = lookups.serviceByCode.get(serviceType) || lookups.serviceByCode.get('STORAGE') || '';

    const pickupCode = resolveLocationCode(legacyBooking, 'pickup');
    const dropoffCode = resolveLocationCode(legacyBooking, 'dropoff');
    const pickupLocationId = lookups.locationByCode.get(pickupCode) || null;
    const dropoffLocationId = lookups.locationByCode.get(dropoffCode) || null;
    const branchCode = pickupCode || dropoffCode || 'HQ-SEOUL';
    const branchId = lookups.branchByCode.get(branchCode) || lookups.branchByCode.get('HQ-SEOUL') || '';

    if (!serviceId || !branchId) {
      warnings.push({
        legacyId: legacyBooking.legacyId,
        source: legacyBooking.source,
        type: 'missing-lookup',
        serviceType,
        branchCode,
      });
      continue;
    }

    const email = normalizeEmail(legacyBooking.userEmail);
    const customerKey = email || normalizeString(legacyBooking.userId) || sourceKey;
    const customerId = stableUuid(`legacy-customer:${customerKey}`);
    const reservationId = stableUuid(`legacy-reservation:${sourceKey}`);
    const bookingDetailId = stableUuid(`legacy-booking-detail:${sourceKey}`);
    const reservationNo = `LEGACY-${legacyBooking.legacyId}`;
    const reservationCode = normalizeString(legacyBooking.reservationCode) || reservationNo;
    const createdAt = toIsoString(legacyBooking.createdAt) || new Date().toISOString();
    const updatedAt = toIsoString(legacyBooking.updatedAt) || createdAt;
    const scheduledAt = buildScheduledAt(legacyBooking.pickupDate, legacyBooking.pickupTime, createdAt);
    const bagSizes = normalizeBagSizes(legacyBooking.bagSizes);
    const totalAmount = toNumber(legacyBooking.finalPrice || legacyBooking.price);

    customers.push({
      id: customerId,
      full_name: normalizeString(legacyBooking.userName) || 'Legacy Customer',
      language_code: normalizeString(legacyBooking.language) || 'en',
      email: email || null,
      phone: null,
      created_at: createdAt,
    });

    reservations.push({
      id: reservationId,
      reservation_no: reservationNo,
      customer_id: customerId,
      branch_id: branchId,
      service_id: serviceId,
      scheduled_at: scheduledAt,
      status: mapLegacyReservationStatus(legacyBooking),
      ops_status: mapLegacyOpsStatus(legacyBooking),
      issue_status: null,
      risk_level: 'low',
      approval_mode: 'auto',
      currency: 'KRW',
      total_amount: totalAmount,
      notes: `legacy_firebase_source=${legacyBooking.source}; legacy_booking_id=${legacyBooking.legacyId}; legacy_status=${normalizeString(legacyBooking.status) || 'unknown'}`,
      created_at: createdAt,
      updated_at: updatedAt,
    });

    bookingDetails.push({
      id: bookingDetailId,
      reservation_id: reservationId,
      sns_channel: normalizeString(legacyBooking.snsChannel) || null,
      sns_id: normalizeString(legacyBooking.snsId) || null,
      country: normalizeString(legacyBooking.country) || null,
      pickup_location_id: pickupLocationId,
      pickup_address: normalizeString(legacyBooking.pickupAddress || legacyBooking.pickupLoc?.address) || null,
      pickup_address_detail: normalizeString(legacyBooking.pickupAddressDetail) || null,
      pickup_image_url: normalizeString(legacyBooking.pickupImageUrl || legacyBooking.pickupLoc?.pickupImageUrl) || null,
      pickup_date: toDateString(legacyBooking.pickupDate),
      pickup_time: toTimeString(legacyBooking.pickupTime, '00:00:00'),
      dropoff_location_id: dropoffLocationId,
      dropoff_address: normalizeString(legacyBooking.dropoffAddress || legacyBooking.returnLoc?.address) || null,
      dropoff_address_detail: normalizeString(legacyBooking.dropoffAddressDetail) || null,
      dropoff_date: toDateString(legacyBooking.dropoffDate),
      delivery_time: toTimeString(legacyBooking.deliveryTime, '00:00:00'),
      return_date: toDateString(legacyBooking.returnDate),
      return_time: legacyBooking.returnTime ? toTimeString(legacyBooking.returnTime, '00:00:00') : null,
      insurance_level: toNumber(legacyBooking.insuranceLevel) || null,
      insurance_bag_count: toNumber(legacyBooking.insuranceBagCount) || null,
      use_insurance: Boolean(legacyBooking.useInsurance),
      base_price: toNumber(legacyBooking.price),
      final_price: totalAmount,
      promo_code: normalizeString(legacyBooking.promoCode) || null,
      discount_amount: toNumber(legacyBooking.discountAmount),
      weight_surcharge_5kg: toNumber(legacyBooking.weightSurcharge5kg),
      weight_surcharge_10kg: toNumber(legacyBooking.weightSurcharge10kg),
      payment_method: normalizeString(legacyBooking.paymentMethod) || null,
      payment_provider: mapPaymentProvider(legacyBooking),
      payment_order_id: normalizeString(legacyBooking.paymentOrderId) || null,
      payment_key: normalizeString(legacyBooking.paymentKey) || null,
      payment_receipt_url: normalizeString(legacyBooking.paymentReceiptUrl) || null,
      payment_approved_at: mapLegacyPaymentStatus(legacyBooking) === 'paid' ? updatedAt : null,
      agreed_to_terms: Boolean(legacyBooking.agreedToTerms),
      agreed_to_privacy: Boolean(legacyBooking.agreedToPrivacy),
      agreed_to_high_value: Boolean(legacyBooking.agreedToHighValue),
      reservation_code: reservationCode,
      language: normalizeString(legacyBooking.language) || 'en',
      image_url: normalizeString(legacyBooking.imageUrl) || null,
      service_type: normalizeString(legacyBooking.serviceType) || 'STORAGE',
      user_name: normalizeString(legacyBooking.userName) || null,
      user_email: email || normalizeString(legacyBooking.userEmail) || null,
      pickup_location: resolveLocationName(legacyBooking, 'pickup') || pickupCode || null,
      dropoff_location: resolveLocationName(legacyBooking, 'dropoff') || dropoffCode || null,
      settlement_status: normalizeString(legacyBooking.status) || null,
      created_at: createdAt,
    });

    const bagItemPlan = [
      ['SHOPPING_BAG', bagSizes.handBag],
      ['SUITCASE', bagSizes.carrier],
      ['SPECIAL', bagSizes.strollerBicycle],
    ];

    for (const [bagCode, quantity] of bagItemPlan) {
      if (!quantity) continue;
      const baggageTypeId = lookups.baggageTypeByCode.get(bagCode);
      if (!baggageTypeId) {
        warnings.push({
          legacyId: legacyBooking.legacyId,
          source: legacyBooking.source,
          type: 'missing-baggage-type',
          bagCode,
        });
        continue;
      }

      reservationItems.push({
        id: stableUuid(`legacy-reservation-item:${sourceKey}:${bagCode}`),
        reservation_id: reservationId,
        baggage_type_id: baggageTypeId,
        quantity,
        size_note: null,
        requires_manual_review: bagCode === 'SPECIAL',
        created_at: createdAt,
      });
    }

    payments.push({
      id: stableUuid(`legacy-payment:${sourceKey}`),
      reservation_id: reservationId,
      provider: mapPaymentProvider(legacyBooking),
      payment_key: normalizeString(legacyBooking.paymentKey) || null,
      status: mapLegacyPaymentStatus(legacyBooking),
      amount: totalAmount,
      paid_at: mapLegacyPaymentStatus(legacyBooking) === 'paid' || mapLegacyPaymentStatus(legacyBooking) === 'refunded' ? updatedAt : null,
      failed_reason: mapLegacyPaymentStatus(legacyBooking) === 'failed' ? 'legacy_cancelled' : null,
      created_at: createdAt,
    });
  }

  return {
    customers: uniqueById(customers),
    reservations: uniqueById(reservations),
    bookingDetails: uniqueById(bookingDetails),
    reservationItems: uniqueById(reservationItems),
    payments: uniqueById(payments),
    warnings,
  };
}

async function main() {
  console.log('🐝 Beeliber Firebase bookings -> Supabase migration');
  console.log(`   모드: ${config.apply ? '🔴 APPLY' : '🟢 DRY-RUN'}`);
  console.log(`   대상 컬렉션: ${config.collections.join(', ')}`);

  const db = await initFirebase();
  const [services, branches, locations, baggageTypes] = await Promise.all([
    fetchSupabaseRows('services?select=id,code'),
    fetchSupabaseRows('branches?select=id,branch_code'),
    fetchSupabaseRows('locations?select=id,short_code'),
    fetchSupabaseRows('baggage_types?select=id,code'),
  ]);

  const lookups = {
    serviceByCode: new Map(services.map((row) => [normalizeString(row.code).toUpperCase(), row.id])),
    branchByCode: new Map(branches.map((row) => [normalizeString(row.branch_code).toUpperCase(), row.id])),
    locationByCode: new Map(locations.map((row) => [normalizeString(row.short_code).toUpperCase(), row.id])),
    baggageTypeByCode: new Map(baggageTypes.map((row) => [normalizeString(row.code).toUpperCase(), row.id])),
  };

  const legacyBookings = [];
  for (const collectionName of config.collections) {
    const snapshot = await db.collection(collectionName).get();
    legacyBookings.push(...readBookingCollectionSnapshot(snapshot, collectionName));
  }

  console.log(`   Firebase bookings 읽음: ${legacyBookings.length}건`);

  const bundle = buildMigrationBundle(legacyBookings, lookups);
  console.log(`   customers: ${bundle.customers.length}`);
  console.log(`   reservations: ${bundle.reservations.length}`);
  console.log(`   booking_details: ${bundle.bookingDetails.length}`);
  console.log(`   reservation_items: ${bundle.reservationItems.length}`);
  console.log(`   payments: ${bundle.payments.length}`);
  console.log(`   warnings: ${bundle.warnings.length}`);

  if (bundle.warnings.length) {
    console.log('   warning sample:', JSON.stringify(bundle.warnings.slice(0, 5), null, 2));
  }

  if (!config.apply) {
    console.log('💡 SUPABASE_APPLY=true 로 실행하면 실제 적재됩니다.');
    return;
  }

  const results = [];
  results.push(['customers', await supabaseUpsert('customers', bundle.customers)]);
  results.push(['reservations', await supabaseUpsert('reservations', bundle.reservations)]);
  results.push(['booking_details', await supabaseUpsert('booking_details', bundle.bookingDetails)]);
  results.push(['reservation_items', await supabaseUpsert('reservation_items', bundle.reservationItems)]);
  results.push(['payments', await supabaseUpsert('payments', bundle.payments)]);

  console.log('\n✅ 적용 완료');
  console.table(results.map(([name, result]) => ({ table: name, written: result.count })));
}

main().catch((error) => {
  console.error('❌ migrateFirebaseBookings failed:', error);
  process.exit(1);
});
