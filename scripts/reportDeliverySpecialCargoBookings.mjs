import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const config = {
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'beeliber-main',
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
  reportPath:
    process.env.DELIVERY_SPECIAL_CARGO_REPORT_PATH
    || '/Users/cm/Desktop/beeliber/beeliber-main/docs/DELIVERY_SPECIAL_CARGO_AUDIT.json',
  markdownPath:
    process.env.DELIVERY_SPECIAL_CARGO_MARKDOWN_PATH
    || '/Users/cm/Desktop/beeliber/beeliber-main/docs/DELIVERY_SPECIAL_CARGO_AUDIT.md',
  previewLimit: Number(process.env.DELIVERY_SPECIAL_CARGO_PREVIEW_LIMIT || 50),
};

const usage = `
[스봉이] 배송 예약 특수화물(XL) 점검 리포트

선택 env
- FIREBASE_PROJECT_ID (기본값: beeliber-main)
- FIREBASE_SERVICE_ACCOUNT_PATH 또는 GOOGLE_APPLICATION_CREDENTIALS
- FIREBASE_SERVICE_ACCOUNT_JSON
- DELIVERY_SPECIAL_CARGO_REPORT_PATH=/abs/path/report.json
- DELIVERY_SPECIAL_CARGO_MARKDOWN_PATH=/abs/path/report.md
- DELIVERY_SPECIAL_CARGO_PREVIEW_LIMIT=50
`.trim();

if (process.argv.includes('--help')) {
  console.log(usage);
  process.exit(0);
}

const normalizeText = (value) => String(value || '').trim();
const normalizeUpper = (value) => normalizeText(value).toUpperCase();
const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const initFirebase = async () => {
  if (!getApps().length) {
    if (config.firebaseServiceAccountJson) {
      initializeApp({
        credential: cert(JSON.parse(config.firebaseServiceAccountJson)),
        projectId: config.firebaseProjectId,
      });
    } else if (config.firebaseServiceAccountPath) {
      const serviceAccount = (await import(config.firebaseServiceAccountPath, { with: { type: 'json' } }).catch(() => null))?.default;
      if (serviceAccount) {
        initializeApp({
          credential: cert(serviceAccount),
          projectId: config.firebaseProjectId,
        });
      } else {
        const { readFile } = await import('node:fs/promises');
        const raw = await readFile(config.firebaseServiceAccountPath, 'utf8');
        initializeApp({
          credential: cert(JSON.parse(raw)),
          projectId: config.firebaseProjectId,
        });
      }
    } else {
      initializeApp({
        credential: applicationDefault(),
        projectId: config.firebaseProjectId,
      });
    }
  }

  return getFirestore();
};

const getNormalizedBagSizes = (bagSizes = {}) => ({
  S: Math.max(0, toNumber(bagSizes.S)),
  M: Math.max(0, toNumber(bagSizes.M)),
  L: Math.max(0, toNumber(bagSizes.L)),
  XL: Math.max(0, toNumber(bagSizes.XL)),
});

const buildAffectedBooking = (doc) => {
  const data = doc.data() || {};
  const serviceType = normalizeUpper(data.serviceType);
  const bagSizes = getNormalizedBagSizes(data.bagSizes);
  const normalizedBagCount = bagSizes.S + bagSizes.M + bagSizes.L;
  const currentBagCount = Math.max(0, toNumber(data.bags));
  const xlCount = bagSizes.XL;

  if (serviceType !== 'DELIVERY' || xlCount <= 0) {
    return null;
  }

  return {
    id: doc.id,
    reservationCode: normalizeText(data.reservationCode),
    status: normalizeText(data.status),
    pickupDate: normalizeText(data.pickupDate),
    pickupLocation: normalizeText(data.pickupLocation),
    dropoffLocation: normalizeText(data.dropoffLocation),
    userName: normalizeText(data.userName),
    userEmail: normalizeText(data.userEmail),
    serviceType,
    currentBags: currentBagCount,
    currentBagSizes: bagSizes,
    normalizedBags: normalizedBagCount,
    normalizedBagSizes: {
      ...bagSizes,
      XL: 0,
    },
    xlCount,
    finalPrice: toNumber(data.finalPrice),
    createdAt: normalizeText(data.createdAt),
    updatedAt: normalizeText(data.updatedAt),
  };
};

const buildMarkdown = (report) => {
  const lines = [
    '# Delivery Special Cargo Audit',
    '',
    `- generatedAt: ${report.generatedAt}`,
    `- projectId: ${report.projectId}`,
    `- scannedCollections: ${report.scannedCollections.join(', ')}`,
    `- totalDocumentsScanned: ${report.totalDocumentsScanned}`,
    `- affectedBookings: ${report.affectedBookings}`,
    `- affectedArchivedBookings: ${report.affectedArchivedBookings}`,
    `- totalXLCountInDelivery: ${report.totalXLCountInDelivery}`,
    '',
    '## Preview',
    '',
    '| collection | id | reservationCode | status | pickupDate | userName | xlCount | currentBags | normalizedBags |',
    '| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: |',
  ];

  report.preview.forEach((item) => {
    lines.push(
      `| ${item.collection} | ${item.id} | ${item.reservationCode || '-'} | ${item.status || '-'} | ${item.pickupDate || '-'} | ${item.userName || '-'} | ${item.xlCount} | ${item.currentBags} | ${item.normalizedBags} |`
    );
  });

  if (report.preview.length === 0) {
    lines.push('| - | - | - | - | - | - | 0 | 0 | 0 |');
  }

  lines.push('', '## Notes', '', '- 이 리포트는 데이터를 수정하지 않습니다.', '- 배송 예약에서 XL만 제거했을 때의 예상 bag count를 같이 보여줍니다.');

  return `${lines.join('\n')}\n`;
};

const main = async () => {
  const db = await initFirebase();
  const collectionNames = ['bookings', 'archived_bookings'];
  const affected = [];
  let totalDocumentsScanned = 0;

  for (const collectionName of collectionNames) {
    const snapshot = await db.collection(collectionName).get();
    totalDocumentsScanned += snapshot.size;

    snapshot.docs.forEach((doc) => {
      const item = buildAffectedBooking(doc);
      if (item) {
        affected.push({
          collection: collectionName,
          ...item,
        });
      }
    });
  }

  affected.sort((left, right) => {
    const leftDate = Date.parse(left.pickupDate || left.createdAt || 0);
    const rightDate = Date.parse(right.pickupDate || right.createdAt || 0);
    return rightDate - leftDate;
  });

  const report = {
    generatedAt: new Date().toISOString(),
    projectId: config.firebaseProjectId,
    scannedCollections: collectionNames,
    totalDocumentsScanned,
    affectedBookings: affected.filter((item) => item.collection === 'bookings').length,
    affectedArchivedBookings: affected.filter((item) => item.collection === 'archived_bookings').length,
    totalXLCountInDelivery: affected.reduce((sum, item) => sum + item.xlCount, 0),
    previewLimit: config.previewLimit,
    preview: affected.slice(0, config.previewLimit),
    affected,
  };

  await mkdir(dirname(config.reportPath), { recursive: true });
  await mkdir(dirname(config.markdownPath), { recursive: true });
  await writeFile(config.reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await writeFile(config.markdownPath, buildMarkdown(report), 'utf8');

  console.log(`[스봉이] 배송 XL 점검 끝났어요. affected=${affected.length}, xlTotal=${report.totalXLCountInDelivery}`);
  console.log(`[스봉이] JSON: ${config.reportPath}`);
  console.log(`[스봉이] MD: ${config.markdownPath}`);
};

main().catch((error) => {
  console.error('[스봉이] 배송 XL 점검 중 사고가 났어요.', error);
  console.log(usage);
  process.exit(1);
});
