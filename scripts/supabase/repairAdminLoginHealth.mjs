import { readFile, writeFile } from 'node:fs/promises';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const config = {
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'beeliber-main',
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
  supabaseUrl: (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, ''),
  supabaseSecretKey: (process.env.SUPABASE_SECRET_KEY || '').trim(),
  supabasePublishableKey: (process.env.SUPABASE_PUBLISHABLE_KEY || '').trim(),
  apply: process.env.SUPABASE_APPLY === 'true',
  previewLimit: Number(process.env.ADMIN_LOGIN_HEALTH_PREVIEW_LIMIT || 30),
  signInRetryCount: Number(process.env.ADMIN_LOGIN_HEALTH_SIGNIN_RETRY_COUNT || 3),
  signInRetryDelayMs: Number(process.env.ADMIN_LOGIN_HEALTH_SIGNIN_RETRY_DELAY_MS || 1200),
  reportPath:
    process.env.ADMIN_LOGIN_HEALTH_REPORT_PATH
    || '/Users/cm/Desktop/beeliber/beeliber-main/docs/ADMIN_LOGIN_HEALTH_REPORT.json',
};

const usage = `
[스봉이] 관리자 로그인 건강검진 / 보정기

필수 env
- SUPABASE_URL
- SUPABASE_SECRET_KEY
- SUPABASE_PUBLISHABLE_KEY

선택 env
- FIREBASE_PROJECT_ID (기본값: beeliber-main)
- FIREBASE_SERVICE_ACCOUNT_PATH 또는 GOOGLE_APPLICATION_CREDENTIALS
- FIREBASE_SERVICE_ACCOUNT_JSON
- SUPABASE_APPLY=true (없으면 dry-run)
- ADMIN_LOGIN_HEALTH_PREVIEW_LIMIT=30
- ADMIN_LOGIN_HEALTH_SIGNIN_RETRY_COUNT=3
- ADMIN_LOGIN_HEALTH_SIGNIN_RETRY_DELAY_MS=1200
- ADMIN_LOGIN_HEALTH_REPORT_PATH=/abs/path/report.json
`.trim();

if (process.argv.includes('--help')) {
  console.log(usage);
  process.exit(0);
}

if (!config.supabaseUrl || !config.supabaseSecretKey || !config.supabasePublishableKey) {
  console.error('SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY 는 꼭 넣어주세요.');
  console.log(usage);
  process.exit(1);
}

const normalizeText = (value) => String(value || '').trim();
const normalizeLower = (value) => normalizeText(value).toLowerCase();
const normalizeName = (value) => normalizeLower(value).replace(/\s+/g, '').normalize('NFC');
const normalizeEmail = (value) => {
  const email = normalizeLower(value);
  return email.includes('@') ? email : '';
};
const hasPassword = (data) => normalizeText(data?.password).length > 0;
const isUidMappedRecord = (docId, data) => Boolean(data?.uid && data.uid === docId);

const inferRole = (docId, data) => {
  const role = normalizeLower(data?.role);
  if (['super', 'hq', 'finance', 'cs', 'branch', 'staff', 'driver', 'partner'].includes(role)) {
    return role;
  }

  const title = normalizeText(data?.jobTitle).toUpperCase();
  if (title.includes('CEO') || title.includes('MASTER') || title.includes('GENERAL MANAGER') || docId === 'admin-8684') {
    return 'super';
  }

  return data?.branchId ? 'branch' : 'staff';
};

const isBranchLoginAllowed = (docId, data) => {
  const role = inferRole(docId, data);
  return Boolean(data?.branchId) && !['super', 'hq', 'finance', 'cs'].includes(role);
};

const getIdentifiers = (docId, data) =>
  new Set(
    [
      docId,
      data?.name,
      data?.loginId,
      data?.email,
      isBranchLoginAllowed(docId, data) ? data?.branchId : '',
    ]
      .map(normalizeName)
      .filter(Boolean)
  );

const getCompleteness = (data) =>
  [
    data?.email,
    data?.loginId,
    hasPassword(data) ? 'password' : '',
    data?.phone,
    data?.branchId,
    data?.role,
    data?.orgType,
    data?.memo,
    Array.isArray(data?.permissions) && data.permissions.length > 0 ? 'permissions' : '',
  ].filter(Boolean).length;

const getFreshness = (data) =>
  new Date(data?.updatedAt || data?.lastLogin || data?.createdAt || data?.security?.lastLoginAt || 0).getTime();

const sortAdminDocs = (left, right) => {
  const leftData = left.data || {};
  const rightData = right.data || {};

  const credentialDiff = Number(hasPassword(rightData)) - Number(hasPassword(leftData));
  if (credentialDiff !== 0) return credentialDiff;

  const canonicalDiff = Number(isUidMappedRecord(left.docId, leftData)) - Number(isUidMappedRecord(right.docId, rightData));
  if (canonicalDiff !== 0) return canonicalDiff;

  const roleDiff = Number(inferRole(right.docId, rightData) === 'super') - Number(inferRole(left.docId, leftData) === 'super');
  if (roleDiff !== 0) return roleDiff;

  const completenessDiff = getCompleteness(rightData) - getCompleteness(leftData);
  if (completenessDiff !== 0) return completenessDiff;

  return getFreshness(rightData) - getFreshness(leftData);
};

const parseJsonResponse = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

const supabaseRequest = async (path, options = {}) => {
  const response = await fetch(`${config.supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: config.supabaseSecretKey,
      Authorization: `Bearer ${config.supabaseSecretKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const body = await parseJsonResponse(response);
  if (!response.ok) {
    const error = new Error(
      typeof body === 'object' && body && 'msg' in body
        ? String(body.msg)
        : typeof body === 'object' && body && 'message' in body
          ? String(body.message)
          : `Supabase request failed (${response.status})`
    );
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
};

const signInCache = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const signInWithSupabasePassword = async (email, password) => {
  const cacheKey = `${email}::${password}`;
  if (signInCache.has(cacheKey)) {
    return signInCache.get(cacheKey);
  }

  let result = {
    ok: false,
    status: 0,
    body: null,
  };

  for (let attempt = 0; attempt < config.signInRetryCount; attempt += 1) {
    const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: config.supabasePublishableKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const body = await parseJsonResponse(response);
    result = {
      ok: response.ok,
      status: response.status,
      body,
    };

    const bodyMessage =
      typeof body === 'object' && body && 'msg' in body
        ? String(body.msg)
        : typeof body === 'object' && body && 'message' in body
          ? String(body.message)
          : '';

    const isRateLimited = response.status === 429 || bodyMessage.includes('rate limit');
    if (!isRateLimited || response.ok || attempt === config.signInRetryCount - 1) {
      break;
    }

    await sleep(config.signInRetryDelayMs);
  }

  signInCache.set(cacheKey, result);
  return result;
};

const initFirebase = async () => {
  if (!getApps().length) {
    if (config.firebaseServiceAccountJson) {
      initializeApp({
        credential: cert(JSON.parse(config.firebaseServiceAccountJson)),
        projectId: config.firebaseProjectId,
      });
    } else if (config.firebaseServiceAccountPath) {
      const raw = await readFile(config.firebaseServiceAccountPath, 'utf8');
      initializeApp({
        credential: cert(JSON.parse(raw)),
        projectId: config.firebaseProjectId,
      });
    } else {
      initializeApp({
        credential: applicationDefault(),
        projectId: config.firebaseProjectId,
      });
    }
  }

  return getFirestore();
};

const fetchAllAuthUsers = async () => {
  const result = await supabaseRequest('/auth/v1/admin/users?page=1&per_page=1000');
  return Array.isArray(result?.users) ? result.users : [];
};

const getPrimaryIdentifier = (docId, data) => {
  if (normalizeText(data?.loginId)) {
    return { type: 'loginId', value: normalizeText(data.loginId) };
  }

  if (isBranchLoginAllowed(docId, data)) {
    return { type: 'branchId', value: normalizeText(data.branchId) };
  }

  if (normalizeEmail(data?.email)) {
    return { type: 'email', value: normalizeEmail(data.email) };
  }

  return null;
};

const summarizeRows = (rows, title) => {
  console.log(`\n[${title}]`);
  rows.slice(0, config.previewLimit).forEach((row) => {
    console.log(`- ${row}`);
  });
  if (rows.length > config.previewLimit) {
    console.log(`... 외 ${rows.length - config.previewLimit}건`);
  }
};

const main = async () => {
  const db = await initFirebase();
  const snapshot = await db.collection('admins').get();
  const docs = snapshot.docs.map((doc) => ({
    docId: doc.id,
    data: doc.data() || {},
  }));

  const authUsers = await fetchAllAuthUsers();
  const authByLegacyId = new Map(
    authUsers
      .map((user) => [String(user.app_metadata?.legacy_admin_doc_id || ''), user])
      .filter(([legacyId]) => legacyId)
  );

  const candidates = [];
  docs.forEach((doc) => {
    if (doc.docId === 'admin-8684') {
      return;
    }

    if (!hasPassword(doc.data)) {
      return;
    }

    const primaryIdentifier = getPrimaryIdentifier(doc.docId, doc.data);
    if (!primaryIdentifier) {
      return;
    }

    candidates.push({
      docId: doc.docId,
      name: normalizeText(doc.data.name),
      identifierType: primaryIdentifier.type,
      identifierValue: primaryIdentifier.value,
      password: normalizeText(doc.data.password),
    });
  });

  const uniqueCandidates = new Map();
  candidates.forEach((candidate) => {
    const key = `${candidate.identifierType}::${normalizeName(candidate.identifierValue)}`;
    if (!uniqueCandidates.has(key)) {
      uniqueCandidates.set(key, candidate);
    }
  });

  const healthyRows = [];
  const repairRows = [];
  const manualRows = [];
  const firebaseUpdates = new Map();

  for (const candidate of uniqueCandidates.values()) {
    const identifierKey = normalizeName(candidate.identifierValue);
    const matchingDocs = docs
      .filter((doc) => getIdentifiers(doc.docId, doc.data).has(identifierKey))
      .sort(sortAdminDocs);
    const selected = matchingDocs.find((doc) => normalizeText(doc.data.password) === candidate.password) || null;

    if (!selected) {
      manualRows.push({
        docId: candidate.docId,
        name: candidate.name,
        identifierType: candidate.identifierType,
        identifierValue: candidate.identifierValue,
        reason: 'matching admin document not found',
      });
      continue;
    }

    const directEmail = normalizeEmail(selected.data.email)
      || (candidate.identifierType === 'email' ? normalizeEmail(candidate.identifierValue) : '');
    const directResult = directEmail
      ? await signInWithSupabasePassword(directEmail, candidate.password)
      : { ok: false, status: 0, body: { code: 'missing_email' } };

    if (directResult.ok) {
      healthyRows.push({
        docId: candidate.docId,
        name: candidate.name,
        identifierType: candidate.identifierType,
        identifierValue: candidate.identifierValue,
        selectedDocId: selected.docId,
        authEmail: directEmail,
      });
      continue;
    }

    const alternateEmails = [
      ...new Set(
        matchingDocs
          .map((doc) => authByLegacyId.get(doc.docId)?.email)
          .filter(Boolean)
          .map((email) => normalizeEmail(email))
          .filter(Boolean)
      ),
    ];

    let workingAlternate = '';
    for (const email of alternateEmails) {
      const result = await signInWithSupabasePassword(email, candidate.password);
      if (result.ok) {
        workingAlternate = email;
        break;
      }
    }

    if (workingAlternate) {
      repairRows.push({
        docId: candidate.docId,
        name: candidate.name,
        identifierType: candidate.identifierType,
        identifierValue: candidate.identifierValue,
        selectedDocId: selected.docId,
        fromEmail: directEmail || '',
        toEmail: workingAlternate,
      });

      matchingDocs.forEach((doc) => {
        firebaseUpdates.set(doc.docId, workingAlternate);
      });
      continue;
    }

    manualRows.push({
      docId: candidate.docId,
      name: candidate.name,
      identifierType: candidate.identifierType,
      identifierValue: candidate.identifierValue,
      selectedDocId: selected.docId,
      attemptedEmail: directEmail || '',
      authCandidates: alternateEmails,
      reason:
        typeof directResult.body === 'object' && directResult.body && 'msg' in directResult.body
          ? String(directResult.body.msg)
          : typeof directResult.body === 'object' && directResult.body && 'message' in directResult.body
            ? String(directResult.body.message)
            : `sign-in failed (${directResult.status})`,
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: config.apply ? 'APPLY' : 'DRY_RUN',
    totalFirebaseDocs: docs.length,
    totalAuthUsers: authUsers.length,
    checkedAccounts: uniqueCandidates.size,
    healthyAccounts: healthyRows.length,
    repairableAccounts: repairRows.length,
    manualAccounts: manualRows.length,
    healthyRows,
    repairRows,
    manualRows,
  };

  await writeFile(config.reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('[스봉이] 관리자 로그인 건강검진 결과');
  console.log(`- 모드: ${report.mode}`);
  console.log(`- Firebase admins docs: ${report.totalFirebaseDocs}`);
  console.log(`- Supabase auth users: ${report.totalAuthUsers}`);
  console.log(`- 점검 대상: ${report.checkedAccounts}`);
  console.log(`- 바로 로그인 가능: ${report.healthyAccounts}`);
  console.log(`- 자동 보정 가능: ${report.repairableAccounts}`);
  console.log(`- 수동 확인 필요: ${report.manualAccounts}`);
  console.log(`- 리포트: ${config.reportPath}`);

  summarizeRows(
    healthyRows.map((row) => `${row.name || row.selectedDocId} -> ${row.identifierType}:${row.identifierValue} / ${row.authEmail}`),
    '정상 로그인 계정'
  );
  summarizeRows(
    repairRows.map((row) => `${row.name || row.selectedDocId} -> ${row.identifierType}:${row.identifierValue} / ${row.fromEmail || '(빈값)'} => ${row.toEmail}`),
    '자동 보정 후보'
  );
  summarizeRows(
    manualRows.map((row) => `${row.name || row.selectedDocId || row.docId} -> ${row.identifierType}:${row.identifierValue} / ${row.reason}`),
    '수동 확인 필요'
  );

  if (!config.apply) {
    console.log('\n[스봉이] dry-run 끝났어요. 실제 보정은 SUPABASE_APPLY=true 로 다시 돌리면 됩니다.');
    return;
  }

  if (firebaseUpdates.size === 0) {
    console.log('\n[스봉이] 자동으로 맞출 Firebase 이메일 드리프트는 없었어요.');
    return;
  }

  const batch = db.batch();
  const now = new Date().toISOString();
  for (const [docId, email] of firebaseUpdates.entries()) {
    batch.set(
      db.collection('admins').doc(docId),
      {
        email,
        updatedAt: now,
      },
      { merge: true }
    );
  }
  await batch.commit();

  console.log(`\n[스봉이] Firebase admins 이메일 매핑 ${firebaseUpdates.size}건 보정 끝났어요.`);
};

main().catch((error) => {
  const status = error?.status ? ` status=${error.status}` : '';
  const details = error?.body ? `\n${JSON.stringify(error.body, null, 2)}` : '';
  console.error(`[스봉이] 관리자 로그인 건강검진 실패${status}: ${error.message}${details}`);
  process.exit(1);
});
