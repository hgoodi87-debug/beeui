/**
 * Firebase → Supabase 전체 데이터 마이그레이션 스크립트
 *
 * 사용법:
 *   SUPABASE_URL=... SUPABASE_SECRET_KEY=... node scripts/supabase/migrateFirebaseData.mjs
 *   SUPABASE_APPLY=true 추가 시 실제 적용 (기본: dry-run)
 *
 * Firebase 인증:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json
 *   또는 FIREBASE_SERVICE_ACCOUNT_JSON='{ ... }'
 */

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';

// ─── Config ──────────────────────────────────────────────────────
const config = {
  supabaseUrl: (process.env.SUPABASE_URL || '').trim(),
  supabaseSecretKey: (process.env.SUPABASE_SECRET_KEY || '').trim(),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'beeliber-main',
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
  apply: process.env.SUPABASE_APPLY === 'true',
  collections: (process.env.MIGRATE_COLLECTIONS || 'all').split(',').map(s => s.trim()),
};

if (!config.supabaseUrl || !config.supabaseSecretKey) {
  console.error('❌ SUPABASE_URL 과 SUPABASE_SECRET_KEY 필수');
  process.exit(1);
}

// ─── Firebase Init ───────────────────────────────────────────────
async function initFirebase() {
  if (getApps().length) return getFirestore();
  let cred;
  if (config.firebaseServiceAccountJson) {
    cred = cert(JSON.parse(config.firebaseServiceAccountJson));
  } else if (config.firebaseServiceAccountPath) {
    const raw = await readFile(config.firebaseServiceAccountPath, 'utf8');
    cred = cert(JSON.parse(raw));
  } else {
    console.error('❌ Firebase 인증 정보 없음 (GOOGLE_APPLICATION_CREDENTIALS 설정 필요)');
    process.exit(1);
  }
  initializeApp({ credential: cred, projectId: config.firebaseProjectId });
  return getFirestore();
}

// ─── Supabase REST Helper ────────────────────────────────────────
async function supabaseUpsert(table, rows, onConflict) {
  if (!rows.length) return { count: 0 };
  const url = `${config.supabaseUrl}/rest/v1/${table}`;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': config.supabaseSecretKey,
    'Authorization': `Bearer ${config.supabaseSecretKey}`,
    'Prefer': onConflict ? `resolution=merge-duplicates` : 'return=minimal',
  };
  // 50개씩 배치
  let total = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(batch) });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase ${table} 삽입 실패 [${res.status}]: ${err}`);
    }
    total += batch.length;
  }
  return { count: total };
}

// ─── 컬렉션 읽기 헬퍼 ─────────────────────────────────────────
async function readCollection(db, name) {
  const snap = await db.collection(name).get();
  return snap.docs.map(d => ({ _docId: d.id, ...d.data() }));
}

// ─── 변환 함수들 ──────────────────────────────────────────────

function transformLocations(docs) {
  return docs.map(d => ({
    short_code: d.shortCode || d._docId,
    name: d.name || '',
    name_en: d.name_en || null, name_ja: d.name_ja || null,
    name_zh: d.name_zh || null, name_zh_tw: d.name_zh_tw || null, name_zh_hk: d.name_zh_hk || null,
    type: d.type || 'PARTNER',
    address: d.address || null, address_en: d.address_en || null,
    address_ja: d.address_ja || null, address_zh: d.address_zh || null,
    address_zh_tw: d.address_zh_tw || null, address_zh_hk: d.address_zh_hk || null,
    description: d.description || null, description_en: d.description_en || null,
    description_ja: d.description_ja || null, description_zh: d.description_zh || null,
    description_zh_tw: d.description_zh_tw || null, description_zh_hk: d.description_zh_hk || null,
    pickup_guide: d.pickupGuide || null, pickup_guide_en: d.pickupGuide_en || null,
    pickup_guide_ja: d.pickupGuide_ja || null, pickup_guide_zh: d.pickupGuide_zh || null,
    pickup_guide_zh_tw: d.pickupGuide_zh_tw || null, pickup_guide_zh_hk: d.pickupGuide_zh_hk || null,
    business_hours: d.businessHours || null, business_hours_en: d.businessHours_en || null,
    business_hours_ja: d.businessHours_ja || null, business_hours_zh: d.businessHours_zh || null,
    business_hours_zh_tw: d.businessHours_zh_tw || null, business_hours_zh_hk: d.businessHours_zh_hk || null,
    supports_delivery: d.supportsDelivery ?? false,
    supports_storage: d.supportsStorage ?? true,
    is_origin: d.isOrigin ?? false,
    is_destination: d.isDestination ?? false,
    lat: d.lat || null, lng: d.lng || null,
    origin_surcharge: d.originSurcharge || 0,
    destination_surcharge: d.destinationSurcharge || 0,
    image_url: d.imageUrl || null,
    is_active: d.isActive ?? true,
    is_partner: d.isPartner ?? false,
    branch_code: d.branchCode || null,
    owner_name: d.ownerName || null,
    phone: d.phone || d.contactNumber || null,
    commission_rate_delivery: d.commissionRates?.delivery || 0,
    commission_rate_storage: d.commissionRates?.storage || 0,
  }));
}

function transformDailyClosings(docs) {
  return docs.map(d => ({
    date: d.date,
    total_revenue: d.totalRevenue || 0,
    cash_revenue: d.cashRevenue || 0, card_revenue: d.cardRevenue || 0,
    apple_revenue: d.appleRevenue || 0, samsung_revenue: d.samsungRevenue || 0,
    wechat_revenue: d.wechatRevenue || 0, alipay_revenue: d.alipayRevenue || 0,
    naver_revenue: d.naverRevenue || 0, kakao_revenue: d.kakaoRevenue || 0,
    paypal_revenue: d.paypalRevenue || 0,
    actual_cash_on_hand: d.actualCashOnHand || 0,
    difference: d.difference || 0,
    notes: d.notes || null,
    closed_by: d.closedBy || 'unknown',
  }));
}

function transformExpenditures(docs) {
  return docs.map(d => ({
    date: d.date,
    category: d.category || 'etc',
    amount: d.amount || 0,
    description: d.description || null,
    created_by: d.createdBy || 'unknown',
  }));
}

function transformInquiries(docs) {
  return docs.map(d => ({
    company_name: d.companyName || d.location || 'Unknown',
    contact_name: d.contactName || null,
    position: d.position || null,
    email: d.email || null,
    phone: d.phone || null,
    message: d.message || null,
    location: d.location || null,
    business_type: d.businessType || null,
    status: d.status || 'NEW',
    assigned_admin_id: d.assignedAdminId || null,
    notes: d.notes || null,
  }));
}

function transformBranchProspects(docs) {
  return docs.map(d => ({
    name: d.name || 'Unknown',
    address: d.address || null,
    lat: d.lat || null, lng: d.lng || null,
    contact_person: d.contactPerson || null,
    phone: d.phone || null, email: d.email || null,
    status: d.status || 'PROSPECTING',
    potential_score: d.potentialScore || 0,
    notes: d.notes || null,
    expected_open_date: d.expectedOpenDate || null,
  }));
}

function transformNotices(docs) {
  return docs.map(d => ({
    title: d.title || 'Untitled',
    category: d.category || 'NOTICE',
    is_active: d.isActive ?? true,
    image_url: d.imageUrl || null,
    content: d.content || null,
    link_url: d.linkUrl || null,
    start_date: d.startDate || null,
    end_date: d.endDate || null,
  }));
}

function transformPromoCodes(docs) {
  return docs.map(d => ({
    code: d.code || d._docId,
    amount_per_bag: d.amountPerBag || 0,
    description: d.description || null,
    is_active: d.isActive ?? true,
    allowed_service: d.allowedService || 'ALL',
  }));
}

function transformChatSessions(docs) {
  return docs.map(d => ({
    session_id: d.sessionId || d._docId,
    user_name: d.userName || null,
    user_email: d.userEmail || null,
    last_message: d.lastMessage || null,
    is_bot_disabled: d.isBotDisabled ?? false,
    unread_count: d.unreadCount || 0,
  }));
}

function transformChatMessages(docs) {
  return docs.map(d => ({
    session_id: d.sessionId || 'unknown',
    role: d.role || 'user',
    text: d.text || '',
    user_name: d.userName || null,
    user_email: d.userEmail || null,
    is_read: d.isRead ?? false,
  }));
}

function transformTipsAreas(docs) {
  return docs.map(d => ({
    area_slug: d.area_slug || d._docId,
    area_name_ko: d.area_name?.ko || null,
    area_name_en: d.area_name?.en || null,
    area_name_ja: d.area_name?.ja || null,
    area_name_zh: d.area_name?.zh || null,
    headline_ko: d.headline?.ko || null,
    headline_en: d.headline?.en || null,
    intro_text_ko: d.intro_text?.ko || null,
    intro_text_en: d.intro_text?.en || null,
    cover_image_url: d.cover_image_url || null,
    is_priority_area: d.is_priority_area ?? false,
    sort_order: d.order || 0,
  }));
}

function transformTipsThemes(docs) {
  return docs.map(d => ({
    theme_slug: d.theme_slug || d._docId,
    theme_name_ko: d.theme_name?.ko || null,
    theme_name_en: d.theme_name?.en || null,
    description_ko: d.description?.ko || null,
    description_en: d.description?.en || null,
    icon: d.icon || null,
    sort_order: d.order || 0,
    is_active: d.is_active ?? true,
  }));
}

function transformTipsContents(docs) {
  return docs.map(d => ({
    slug: d.slug || d._docId,
    title_ko: d.title?.ko || null,
    title_en: d.title?.en || null,
    title_ja: d.title?.ja || null,
    title_zh: d.title?.zh || null,
    summary_ko: d.summary?.ko || null,
    summary_en: d.summary?.en || null,
    body_ko: d.body?.ko || null,
    body_en: d.body?.en || null,
    body_ja: d.body?.ja || null,
    body_zh: d.body?.zh || null,
    content_type: d.content_type || 'landmark',
    area_slug: d.area_slug || null,
    cover_image_url: d.cover_image_url || null,
    recommended_time: d.recommended_time || null,
    audience_tags: d.audience_tags || [],
    theme_tags: d.theme_tags || [],
    official_url: d.official_url || null,
    source_name: d.source_name || null,
    start_date: d.start_date || null,
    end_date: d.end_date || null,
    publish_status: d.publish_status || 'draft',
    language_available: d.language_available || ['ko', 'en'],
    author_id: d.author_id || null,
    reviewer_id: d.reviewer_id || null,
    quality_score: d.quality_score || null,
    priority_score: d.priority_score || null,
    is_foreigner_friendly: d.is_foreigner_friendly ?? true,
  }));
}

function transformSettings(docs) {
  return docs.map(d => ({
    key: d._docId,
    value: (() => {
      const { _docId, ...rest } = d;
      return rest;
    })(),
  }));
}

// ─── 마이그레이션 작업 정의 ──────────────────────────────────────
const MIGRATIONS = [
  { name: 'locations',       firebase: 'locations',       table: 'locations',              transform: transformLocations },
  { name: 'daily_closings',  firebase: 'daily_closings',  table: 'daily_closings',         transform: transformDailyClosings },
  { name: 'expenditures',    firebase: 'expenditures',    table: 'expenditures',           transform: transformExpenditures },
  { name: 'inquiries',       firebase: 'inquiries',       table: 'partnership_inquiries',   transform: transformInquiries },
  { name: 'prospects',       firebase: 'branch_prospects', table: 'branch_prospects',       transform: transformBranchProspects },
  { name: 'notices',         firebase: 'notices',         table: 'system_notices',          transform: transformNotices },
  { name: 'promo_codes',     firebase: 'promo_codes',     table: 'discount_codes',          transform: transformPromoCodes },
  { name: 'chat_sessions',   firebase: 'chat_sessions',   table: 'chat_sessions',          transform: transformChatSessions },
  { name: 'chats',           firebase: 'chats',           table: 'chat_messages',           transform: transformChatMessages },
  { name: 'tips_areas',      firebase: 'tips_areas',      table: 'cms_areas',              transform: transformTipsAreas },
  { name: 'tips_themes',     firebase: 'tips_themes',     table: 'cms_themes',             transform: transformTipsThemes },
  { name: 'tips_contents',   firebase: 'tips_contents',   table: 'cms_contents',           transform: transformTipsContents },
  { name: 'settings',        firebase: 'settings',        table: 'app_settings',           transform: transformSettings },
];

// ─── 메인 실행 ───────────────────────────────────────────────────
async function main() {
  console.log('🐝 Beeliber Firebase → Supabase 데이터 마이그레이션');
  console.log(`   모드: ${config.apply ? '🔴 실제 적용' : '🟢 DRY-RUN (미리보기)'}`);
  console.log(`   대상: ${config.collections.join(', ')}\n`);

  const db = await initFirebase();
  const results = [];

  for (const mig of MIGRATIONS) {
    if (config.collections[0] !== 'all' && !config.collections.includes(mig.name)) {
      continue;
    }

    try {
      console.log(`📦 [${mig.name}] Firebase '${mig.firebase}' 읽는 중...`);
      const docs = await readCollection(db, mig.firebase);
      console.log(`   → ${docs.length}건 읽음`);

      if (!docs.length) {
        results.push({ name: mig.name, read: 0, written: 0, status: 'SKIP (empty)' });
        continue;
      }

      const rows = mig.transform(docs);
      console.log(`   → ${rows.length}건 변환 완료`);

      // 미리보기: 첫 2건
      if (rows.length > 0) {
        console.log(`   📋 샘플:`, JSON.stringify(rows[0], null, 2).slice(0, 300));
      }

      if (config.apply) {
        const res = await supabaseUpsert(mig.table, rows);
        console.log(`   ✅ Supabase '${mig.table}'에 ${res.count}건 삽입 완료`);
        results.push({ name: mig.name, read: docs.length, written: res.count, status: 'OK' });
      } else {
        console.log(`   ⏭️  DRY-RUN: ${rows.length}건 삽입 대기 (SUPABASE_APPLY=true로 실행하세요)`);
        results.push({ name: mig.name, read: docs.length, written: 0, status: 'DRY-RUN' });
      }
    } catch (err) {
      console.error(`   ❌ [${mig.name}] 실패:`, err.message);
      results.push({ name: mig.name, read: 0, written: 0, status: `ERROR: ${err.message.slice(0, 80)}` });
    }
    console.log('');
  }

  // ─── 최종 리포트 ──────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════');
  console.log('📊 마이그레이션 결과 리포트');
  console.log('════════════════════════════════════════════');
  console.table(results);

  const ok = results.filter(r => r.status === 'OK' || r.status.startsWith('DRY'));
  const fail = results.filter(r => r.status.startsWith('ERROR'));
  console.log(`\n✅ 성공: ${ok.length} / ❌ 실패: ${fail.length} / 총: ${results.length}`);

  if (!config.apply) {
    console.log('\n💡 실제 적용하려면: SUPABASE_APPLY=true 추가하세요');
  }
}

main().catch(err => {
  console.error('❌ 치명적 오류:', err);
  process.exit(1);
});
