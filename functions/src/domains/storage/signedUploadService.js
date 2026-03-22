const crypto = require('node:crypto');

const SUPPORTED_BUCKETS = new Set(['brand-public', 'branch-public', 'backoffice-private']);
const HQ_WRITE_ROLES = new Set(['super', 'staff', 'finance', 'cs']);
const BRANCH_SCOPED_ROLES = new Set(['branch', 'partner']);
const PUBLIC_BUCKETS = new Set(['brand-public', 'branch-public']);

const ALLOWED_EXTENSIONS = {
  'brand-public': new Set(['png', 'jpg', 'jpeg', 'webp', 'svg']),
  'branch-public': new Set(['png', 'jpg', 'jpeg', 'webp']),
  'backoffice-private': new Set(['png', 'jpg', 'jpeg', 'webp', 'pdf']),
};

const ALLOWED_CONTENT_TYPES = {
  'brand-public': new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  'branch-public': new Set(['image/png', 'image/jpeg', 'image/webp']),
  'backoffice-private': new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
};

const ALLOWED_ASSET_CATEGORIES = {
  'brand-public': new Set(['hero-image', 'hero-mobile-image']),
  'branch-public': new Set(['main', 'pickup', 'thumb', 'cover']),
};

class SignedUploadHttpError extends Error {
  constructor(status, message, logMessage) {
    super(message);
    this.name = 'SignedUploadHttpError';
    this.status = status;
    this.logMessage = logMessage || message;
  }
}

const normalizeText = (value) => String(value || '').trim();

const normalizeLower = (value) => normalizeText(value).toLowerCase();

const normalizeUpper = (value) => normalizeText(value).toUpperCase();

const sanitizeSegment = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const sanitizeMetadataValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }

  return String(value).slice(0, 300);
};

const sanitizeMetadata = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  return Object.entries(input).reduce((acc, [key, value]) => {
    const safeKey = sanitizeSegment(key);
    if (!safeKey) {
      return acc;
    }

    acc[safeKey] = sanitizeMetadataValue(value);
    return acc;
  }, {});
};

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalizeText(value));

const encodeObjectPath = (objectPath) =>
  objectPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

const parseBearerToken = (req) => {
  const authHeader = normalizeText(req.headers.authorization);
  if (!authHeader.startsWith('Bearer ')) {
    throw new SignedUploadHttpError(401, '관리자 인증이 필요합니다.', 'Missing bearer token.');
  }

  const token = normalizeText(authHeader.slice(7));
  if (!token) {
    throw new SignedUploadHttpError(401, '관리자 인증이 필요합니다.', 'Empty bearer token.');
  }

  return token;
};

const validateFileSignature = ({ bucketKind, fileExtension, contentType }) => {
  const normalizedExtension = normalizeLower(fileExtension).replace(/^\./, '');
  const normalizedContentType = normalizeLower(contentType);

  if (!ALLOWED_EXTENSIONS[bucketKind]?.has(normalizedExtension)) {
    throw new SignedUploadHttpError(400, '허용되지 않은 파일 확장자입니다.', `Rejected extension for ${bucketKind}: ${normalizedExtension}`);
  }

  if (!ALLOWED_CONTENT_TYPES[bucketKind]?.has(normalizedContentType)) {
    throw new SignedUploadHttpError(400, '허용되지 않은 파일 형식입니다.', `Rejected content type for ${bucketKind}: ${normalizedContentType}`);
  }

  return { normalizedExtension, normalizedContentType };
};

const assertUploadScope = ({ request, adminContext }) => {
  const role = normalizeLower(adminContext.role);
  const bucketKind = request.bucketKind;

  if (bucketKind === 'brand-public') {
    if (!HQ_WRITE_ROLES.has(role)) {
      throw new SignedUploadHttpError(403, '본사 관리자만 브랜드 자산을 업로드할 수 있습니다.', `Role ${role} cannot write brand-public.`);
    }
    return;
  }

  if (bucketKind === 'branch-public') {
    if (HQ_WRITE_ROLES.has(role)) {
      return;
    }

    if (!BRANCH_SCOPED_ROLES.has(role)) {
      throw new SignedUploadHttpError(403, '지점 자산 업로드 권한이 없습니다.', `Role ${role} cannot write branch-public.`);
    }

    const requestedBranchCode = normalizeUpper(request.branchCode);
    const adminBranchCode = normalizeUpper(adminContext.branchId);

    if (!requestedBranchCode || !adminBranchCode || requestedBranchCode !== adminBranchCode) {
      throw new SignedUploadHttpError(403, '본인 지점 자산만 업로드할 수 있습니다.', `Scoped role ${role} attempted branch-public write for ${requestedBranchCode} with admin branch ${adminBranchCode}.`);
    }
    return;
  }

  if (bucketKind === 'backoffice-private') {
    if (!HQ_WRITE_ROLES.has(role)) {
      throw new SignedUploadHttpError(403, '백오피스 문서는 본사 관리자만 업로드할 수 있습니다.', `Role ${role} cannot write backoffice-private.`);
    }
    return;
  }

  throw new SignedUploadHttpError(400, '현재 단계에서 지원하지 않는 버킷입니다.', `Unsupported bucket in endpoint draft: ${bucketKind}`);
};

const buildObjectPath = (request) => {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const yyyymm = `${year}${month}`;
  const objectId = crypto.randomUUID();
  const fileName = `${objectId}.${request.fileExtension}`;

  if (request.bucketKind === 'brand-public') {
    return `branding/${request.assetCategory}/${yyyymm}/${fileName}`;
  }

  if (request.bucketKind === 'branch-public') {
    return `${request.branchType}/${request.branchCode}/${request.assetCategory}/${yyyymm}/${fileName}`;
  }

  if (request.bucketKind === 'backoffice-private') {
    const domain = sanitizeSegment(request.domain || 'general');
    const entityId = sanitizeSegment(request.entityId || 'draft');
    return `${domain}/${year}/${month}/${entityId}/${fileName}`;
  }

  throw new SignedUploadHttpError(400, '지원하지 않는 버킷 경로입니다.');
};

const validateRequest = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new SignedUploadHttpError(400, '업로드 요청 형식이 올바르지 않습니다.', 'Request body must be an object.');
  }

  const request = {
    bucketKind: normalizeLower(body.bucketKind),
    entityType: normalizeLower(body.entityType),
    entityId: normalizeText(body.entityId),
    contentType: normalizeLower(body.contentType),
    fileExtension: normalizeLower(body.fileExtension).replace(/^\./, ''),
    branchCode: normalizeUpper(body.branchCode),
    branchType: sanitizeSegment(body.branchType),
    assetCategory: sanitizeSegment(body.assetCategory),
    domain: sanitizeSegment(body.domain),
    metadata: sanitizeMetadata(body.metadata),
  };

  if (!SUPPORTED_BUCKETS.has(request.bucketKind)) {
    throw new SignedUploadHttpError(400, '현재 초안 단계에서 지원하지 않는 버킷입니다.', `Unsupported bucketKind: ${request.bucketKind}`);
  }

  if (!request.entityType) {
    throw new SignedUploadHttpError(400, 'entityType이 필요합니다.');
  }

  validateFileSignature(request);

  if (request.bucketKind === 'brand-public') {
    if (request.entityType !== 'branding') {
      throw new SignedUploadHttpError(400, '브랜드 자산 entityType은 branding이어야 합니다.');
    }
    if (!ALLOWED_ASSET_CATEGORIES['brand-public'].has(request.assetCategory)) {
      throw new SignedUploadHttpError(400, '허용되지 않은 브랜드 자산 카테고리입니다.');
    }
  }

  if (request.bucketKind === 'branch-public') {
    if (request.entityType !== 'branch') {
      throw new SignedUploadHttpError(400, '지점 자산 entityType은 branch여야 합니다.');
    }
    if (!request.branchCode || !request.branchType) {
      throw new SignedUploadHttpError(400, '지점 자산은 branchCode와 branchType이 필요합니다.');
    }
    if (!['hub', 'partner'].includes(request.branchType)) {
      throw new SignedUploadHttpError(400, 'branchType은 hub 또는 partner만 허용됩니다.');
    }
    if (!ALLOWED_ASSET_CATEGORIES['branch-public'].has(request.assetCategory)) {
      throw new SignedUploadHttpError(400, '허용되지 않은 지점 자산 카테고리입니다.');
    }
  }

  if (request.bucketKind === 'backoffice-private') {
    if (request.entityType !== 'notice' && request.entityType !== 'backoffice') {
      throw new SignedUploadHttpError(400, '백오피스 업로드 entityType은 notice 또는 backoffice여야 합니다.');
    }
    if (!request.domain) {
      throw new SignedUploadHttpError(400, '백오피스 업로드는 domain이 필요합니다.');
    }
  }

  return request;
};

const buildStorageAssetRow = ({ request, objectPath, uid }) => {
  const metadata = {
    ...request.metadata,
    bucket_kind: request.bucketKind,
    original_entity_id: request.entityId || null,
    branch_code: request.branchCode || null,
    asset_category: request.assetCategory || null,
    upload_status: 'pending',
    auth_bridge: 'firebase-admin-session',
  };

  return {
    bucket_id: request.bucketKind,
    object_path: objectPath,
    entity_type: request.entityType,
    entity_id: isUuid(request.entityId) ? request.entityId : null,
    branch_id: null,
    uploaded_by_user_id: uid,
    metadata,
  };
};

const fetchJson = async (url, options, fallbackMessage) => {
  const response = await fetch(url, options);
  const text = await response.text();

  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const detail =
      typeof body === 'object' && body && 'message' in body
        ? body.message
        : typeof body === 'object' && body && 'error' in body
          ? body.error
          : typeof body === 'string' && body
            ? body
            : fallbackMessage;

    throw new SignedUploadHttpError(502, fallbackMessage, `${fallbackMessage}: ${detail}`);
  }

  return body;
};

const createPendingStorageAsset = async ({ supabaseUrl, serviceRoleKey, row }) => {
  await fetchJson(
    `${supabaseUrl}/rest/v1/storage_assets`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    },
    'storage_assets pending 메타 기록에 실패했습니다.'
  );
};

const createSignedUploadUrl = async ({ supabaseUrl, serviceRoleKey, bucketId, objectPath }) => {
  const encodedPath = encodeObjectPath(objectPath);
  const body = await fetchJson(
    `${supabaseUrl}/storage/v1/object/upload/sign/${bucketId}/${encodedPath}`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ upsert: false }),
    },
    'Supabase signed upload URL 발급에 실패했습니다.'
  );

  const token =
    normalizeText(body?.token) ||
    normalizeText(body?.data?.token);
  const path =
    normalizeText(body?.path) ||
    normalizeText(body?.data?.path) ||
    objectPath;
  const signedUrlCandidate =
    normalizeText(body?.signedURL) ||
    normalizeText(body?.signedUrl) ||
    normalizeText(body?.url) ||
    normalizeText(body?.data?.signedURL) ||
    normalizeText(body?.data?.signedUrl) ||
    normalizeText(body?.data?.url);

  let uploadUrl = '';
  if (signedUrlCandidate.startsWith('http://') || signedUrlCandidate.startsWith('https://')) {
    uploadUrl = signedUrlCandidate;
  } else if (signedUrlCandidate) {
    uploadUrl = `${supabaseUrl}${signedUrlCandidate.startsWith('/') ? '' : '/'}${signedUrlCandidate}`;
  } else if (token) {
    uploadUrl = `${supabaseUrl}/storage/v1/object/upload/sign/${bucketId}/${encodeObjectPath(path)}?token=${encodeURIComponent(token)}`;
  }

  if (!uploadUrl) {
    throw new SignedUploadHttpError(502, 'Supabase signed upload URL 형식이 올바르지 않습니다.');
  }

  return {
    objectPath: path,
    uploadUrl,
    token,
  };
};

const buildPublicUrl = ({ supabaseUrl, bucketId, objectPath }) =>
  `${supabaseUrl}/storage/v1/object/public/${bucketId}/${encodeObjectPath(objectPath)}`;

const assertConfigured = () => {
  const supabaseUrl = normalizeText(process.env.SUPABASE_URL);
  const serviceRoleKey = normalizeText(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new SignedUploadHttpError(
      503,
      'signed upload 서버 설정이 아직 준비되지 않았습니다.',
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return { supabaseUrl, serviceRoleKey };
};

const authenticateAdmin = async ({ req, admin, getAdminContext }) => {
  const bearerToken = parseBearerToken(req);
  let decodedToken;

  try {
    decodedToken = await admin.auth().verifyIdToken(bearerToken);
  } catch (error) {
    throw new SignedUploadHttpError(401, '관리자 인증이 만료되었거나 올바르지 않습니다.', `Firebase token verification failed: ${error.message}`);
  }

  const adminContext = await getAdminContext(decodedToken.uid);
  if (!adminContext) {
    throw new SignedUploadHttpError(403, '관리자 권한이 필요합니다.', `Missing adminContext for uid ${decodedToken.uid}`);
  }

  return {
    uid: decodedToken.uid,
    adminContext,
  };
};

const handleSignedUploadRequest = async ({ req, admin, getAdminContext }) => {
  if (req.method !== 'POST') {
    throw new SignedUploadHttpError(405, 'POST 요청만 허용됩니다.');
  }

  const { supabaseUrl, serviceRoleKey } = assertConfigured();
  const { uid, adminContext } = await authenticateAdmin({ req, admin, getAdminContext });
  const request = validateRequest(req.body);

  assertUploadScope({ request, adminContext });

  const objectPath = buildObjectPath(request);
  const signedUpload = await createSignedUploadUrl({
    supabaseUrl,
    serviceRoleKey,
    bucketId: request.bucketKind,
    objectPath,
  });

  await createPendingStorageAsset({
    supabaseUrl,
    serviceRoleKey,
    row: buildStorageAssetRow({
      request,
      objectPath: signedUpload.objectPath,
      uid,
    }),
  });

  return {
    bucketId: request.bucketKind,
    objectPath: signedUpload.objectPath,
    uploadUrl: signedUpload.uploadUrl,
    method: 'PUT',
    headers: {},
    expiresAt: new Date(Date.now() + (2 * 60 * 60 * 1000)).toISOString(),
    publicUrl: PUBLIC_BUCKETS.has(request.bucketKind)
      ? buildPublicUrl({
          supabaseUrl,
          bucketId: request.bucketKind,
          objectPath: signedUpload.objectPath,
        })
      : undefined,
  };
};

const isSignedUploadHttpError = (error) => error instanceof SignedUploadHttpError;

module.exports = {
  handleSignedUploadRequest,
  isSignedUploadHttpError,
};
