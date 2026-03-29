import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const config = {
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'beeliber-main',
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
  supabaseUrl: (process.env.SUPABASE_URL || '').trim(),
  supabaseSecretKey: (process.env.SUPABASE_SECRET_KEY || '').trim(),
  apply: process.env.SUPABASE_APPLY === 'true',
  updateExisting: process.env.SUPABASE_AUTH_UPDATE_EXISTING === 'true',
  updatePassword: process.env.SUPABASE_AUTH_UPDATE_PASSWORD === 'true',
  allowSyntheticEmail: process.env.SUPABASE_ALLOW_SYNTHETIC_EMAIL === 'true',
  syntheticEmailDomain: normalizeDomain(process.env.SUPABASE_SYNTHETIC_EMAIL_DOMAIN || 'staff.bee-liber.invalid'),
  maxPreviewRows: Number(process.env.SUPABASE_SYNC_PREVIEW_LIMIT || 20)
};

const usage = `
[스봉이] Supabase Phase 1 Auth 동기화기

필수 env
- SUPABASE_URL
- SUPABASE_SECRET_KEY

선택 env
- FIREBASE_PROJECT_ID (기본값: beeliber-main)
- FIREBASE_SERVICE_ACCOUNT_PATH 또는 GOOGLE_APPLICATION_CREDENTIALS
- FIREBASE_SERVICE_ACCOUNT_JSON
- SUPABASE_APPLY=true  (없으면 dry-run)
- SUPABASE_AUTH_UPDATE_EXISTING=true
- SUPABASE_AUTH_UPDATE_PASSWORD=true
- SUPABASE_ALLOW_SYNTHETIC_EMAIL=true
- SUPABASE_SYNTHETIC_EMAIL_DOMAIN=staff.bee-liber.invalid
- SUPABASE_SYNC_PREVIEW_LIMIT=20
`.trim();

const printHelpAndExit = (code = 0) => {
  console.log(usage);
  process.exit(code);
};

if (process.argv.includes('--help')) {
  printHelpAndExit(0);
}

if (!config.supabaseUrl || !config.supabaseSecretKey) {
  console.error('SUPABASE_URL 과 SUPABASE_SECRET_KEY 는 꼭 넣어주세요.');
  printHelpAndExit(1);
}

const normalizeText = (value) => String(value || '').trim();
const normalizeLower = (value) => normalizeText(value).toLowerCase();
function normalizeDomain(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, '');
}
const normalizeEmail = (value) => {
  const email = normalizeLower(value);
  if (!email || !email.includes('@')) return '';
  return email;
};
const sanitizeAsciiToken = (value) =>
  normalizeText(value)
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

const buildSyntheticEmail = (admin) => {
  const docToken = sanitizeAsciiToken(admin.id || 'legacy-admin') || 'legacy-admin';
  const readableToken =
    sanitizeAsciiToken(admin.loginId)
    || sanitizeAsciiToken(admin.name)
    || sanitizeAsciiToken(admin.branchId)
    || 'staff';
  const hash = createHash('sha1').update(String(admin.id || readableToken)).digest('hex').slice(0, 10);
  const local = `legacy-${readableToken.slice(0, 20)}-${docToken.slice(0, 20)}-${hash}`.slice(0, 64);
  return `${local}@${config.syntheticEmailDomain}`;
};

const resolveAdminEmail = (admin) => {
  const email = normalizeEmail(admin.email);
  if (email) {
    return { email, synthetic: false };
  }

  if (!config.allowSyntheticEmail) {
    return { email: '', synthetic: false };
  }

  return {
    email: buildSyntheticEmail(admin),
    synthetic: true
  };
};

const sanitizeJson = (value) => JSON.parse(JSON.stringify(value));

const hasPassword = (admin) => normalizeText(admin.password).length > 0;
const isUidMappedRecord = (admin) => Boolean(admin.uid && admin.uid === admin.id);
const getFreshness = (admin) => new Date(admin.updatedAt || admin.createdAt || 0).getTime();
const getCompleteness = (admin) =>
  [
    admin.email,
    admin.loginId,
    hasPassword(admin) ? 'password' : '',
    admin.phone,
    admin.branchId,
    admin.role,
    admin.orgType,
    admin.memo,
    admin.updatedAt,
    Array.isArray(admin.permissions) && admin.permissions.length > 0 ? 'permissions' : ''
  ].filter(Boolean).length;

const initFirebase = async () => {
  if (!getApps().length) {
    if (config.firebaseServiceAccountJson) {
      initializeApp({
        credential: cert(JSON.parse(config.firebaseServiceAccountJson)),
        projectId: config.firebaseProjectId
      });
    } else if (config.firebaseServiceAccountPath) {
      const raw = await readFile(config.firebaseServiceAccountPath, 'utf8');
      initializeApp({
        credential: cert(JSON.parse(raw)),
        projectId: config.firebaseProjectId
      });
    } else {
      initializeApp({
        credential: applicationDefault(),
        projectId: config.firebaseProjectId
      });
    }
  }

  return getFirestore();
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
  const isRestRequest = path.startsWith('/rest/v1/');
  const response = await fetch(`${config.supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: config.supabaseSecretKey,
      Authorization: `Bearer ${config.supabaseSecretKey}`,
      'Content-Type': 'application/json',
      ...(isRestRequest ? {
        'Accept-Profile': 'public',
        'Content-Profile': 'public',
      } : {}),
      ...(options.headers || {})
    }
  });

  const body = await parseJsonResponse(response);
  if (!response.ok) {
    const message =
      typeof body === 'object' && body && 'message' in body
        ? String(body.message)
        : typeof body === 'object' && body && 'msg' in body
          ? String(body.msg)
          : `Supabase request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
};

const fetchAllAuthUsers = async () => {
  const result = await supabaseRequest('/auth/v1/admin/users?page=1&per_page=1000');
  return Array.isArray(result?.users) ? result.users : [];
};

const canonicalizeAdmins = (admins) => {
  const groups = new Map();
  const ungrouped = [];

  admins.forEach((admin) => {
    const name = normalizeLower(admin.name);
    const email = normalizeEmail(admin.email);
    const loginId = normalizeLower(admin.loginId);

    if (!name && !email && !loginId) {
      ungrouped.push(admin);
      return;
    }

    const key = [
      name,
      email,
      loginId,
      normalizeLower(admin.role),
      normalizeLower(admin.jobTitle),
      normalizeLower(admin.branchId),
      normalizeLower(admin.orgType)
    ].join('|');

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(admin);
  });

  const canonicalAdmins = [];
  const duplicateDocs = [];

  for (const group of groups.values()) {
    group.sort((a, b) => {
      const credentialDiff = Number(hasPassword(b)) - Number(hasPassword(a));
      if (credentialDiff !== 0) return credentialDiff;

      const canonicalDiff = Number(isUidMappedRecord(a)) - Number(isUidMappedRecord(b));
      if (canonicalDiff !== 0) return canonicalDiff;

      const completenessDiff = getCompleteness(b) - getCompleteness(a);
      if (completenessDiff !== 0) return completenessDiff;

      return getFreshness(b) - getFreshness(a);
    });

    canonicalAdmins.push(group[0]);
    duplicateDocs.push(...group.slice(1));
  }

  return {
    canonicalAdmins,
    duplicateDocs,
    ungrouped
  };
};

const roleCodeFromLegacy = (admin) => {
  const role = normalizeLower(admin.role);
  switch (role) {
    case 'super':
      return 'super_admin';
    case 'hq':
      return 'hq_admin';
    case 'finance':
      return 'finance_staff';
    case 'cs':
      return 'cs_staff';
    case 'driver':
      return 'driver';
    case 'partner':
      return 'partner_manager';
    case 'branch':
      return 'hub_manager';
    default:
      return 'ops_staff';
  }
};

const buildUserPayload = (admin) => {
  const resolvedEmail = resolveAdminEmail(admin);
  const payload = {
    email: resolvedEmail.email,
    password: normalizeText(admin.password),
    email_confirm: true,
    user_metadata: {
      display_name: normalizeText(admin.name) || resolvedEmail.email,
      login_id: normalizeText(admin.loginId) || null,
      job_title: normalizeText(admin.jobTitle) || null,
      synthetic_email: resolvedEmail.synthetic || false
    },
    app_metadata: {
      source: 'firebase_admins',
      legacy_admin_doc_id: admin.id,
      role_code: roleCodeFromLegacy(admin),
      org_type: normalizeText(admin.orgType || '') || null,
      synthetic_email: resolvedEmail.synthetic || false
    }
  };

  if (!payload.password) {
    delete payload.password;
  }

  return sanitizeJson(payload);
};

const summarizePreviewRows = (rows, title) => {
  console.log(`\n[${title}]`);
  rows.slice(0, config.maxPreviewRows).forEach((row) => {
    console.log(`- ${row}`);
  });
  if (rows.length > config.maxPreviewRows) {
    console.log(`... 외 ${rows.length - config.maxPreviewRows}건`);
  }
};

const main = async () => {
  const db = await initFirebase();
  const adminsSnap = await db.collection('admins').get();
  const admins = adminsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const { canonicalAdmins, duplicateDocs, ungrouped } = canonicalizeAdmins(admins);
  const authUsers = await fetchAllAuthUsers();
  const authUsersByEmail = new Map(
    authUsers
      .map((user) => [normalizeEmail(user.email), user])
      .filter(([email]) => email)
  );

  const creatable = [];
  const updatable = [];
  const skipped = [];
  let syntheticEmailCount = 0;

  canonicalAdmins.forEach((admin) => {
    const { email, synthetic } = resolveAdminEmail(admin);

    if (!email) {
      skipped.push(`${admin.name || admin.id} -> email 없음`);
      return;
    }

    if (synthetic) {
      syntheticEmailCount += 1;
    }

    if (!hasPassword(admin)) {
      skipped.push(`${admin.name || admin.id} <${email}> -> 비밀번호 없음`);
      return;
    }

    const existing = authUsersByEmail.get(email);
    if (existing) {
      updatable.push({ admin, existing });
      return;
    }

    creatable.push(admin);
  });

  console.log('[스봉이] Firebase -> Supabase Phase 1 Auth 동기화 요약');
  console.log(`- 모드: ${config.apply ? 'APPLY' : 'DRY_RUN'}`);
  console.log(`- Firebase admins: ${admins.length}`);
  console.log(`- canonical admins: ${canonicalAdmins.length}`);
  console.log(`- duplicate docs ignored: ${duplicateDocs.length}`);
  console.log(`- ungrouped docs: ${ungrouped.length}`);
  console.log(`- existing Supabase auth users: ${authUsers.length}`);
  console.log(`- create 대상: ${creatable.length}`);
  console.log(`- existing user 후보: ${updatable.length}`);
  console.log(`- synthetic email 적용: ${syntheticEmailCount}`);
  console.log(`- skipped: ${skipped.length}`);

  summarizePreviewRows(
    creatable.map((admin) => {
      const { email, synthetic } = resolveAdminEmail(admin);
      return `${admin.name || admin.id} <${email}> -> create (${roleCodeFromLegacy(admin)}${synthetic ? ', synthetic' : ''})`;
    }),
    '생성 대상 미리보기'
  );
  summarizePreviewRows(
    updatable.map(({ admin, existing }) => {
      const { email, synthetic } = resolveAdminEmail(admin);
      return `${admin.name || admin.id} <${email}> -> existing (${existing.id}${synthetic ? ', synthetic' : ''})`;
    }),
    '기존 계정 미리보기'
  );
  summarizePreviewRows(skipped, '보류 대상 미리보기');

  if (!config.apply) {
    console.log('\n[스봉이] dry-run 끝났어요. 실제 생성은 SUPABASE_APPLY=true 를 붙이면 됩니다.');
    return;
  }

  for (const admin of creatable) {
    const payload = buildUserPayload(admin);
    await supabaseRequest('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  if (config.updateExisting) {
    for (const { admin, existing } of updatable) {
      const payload = buildUserPayload(admin);
      if (!config.updatePassword) {
        delete payload.password;
      }

      await supabaseRequest(`/auth/v1/admin/users/${existing.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    }
  }

  console.log('\n[스봉이] Auth 동기화 반영 끝났어요. 다음은 supabase:sync-phase1-org 순서로 넘기면 됩니다.');
};

main().catch((error) => {
  const status = error?.status ? ` status=${error.status}` : '';
  const details = error?.body ? `\n${JSON.stringify(error.body, null, 2)}` : '';
  console.error(`[스봉이] Phase 1 Auth 동기화 실패${status}: ${error.message}${details}`);
  process.exit(1);
});
