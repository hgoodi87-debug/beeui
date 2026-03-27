import { getActiveAdminRequestHeaders } from './adminAuthService';
import { StorageService } from './storageService';

export type StorageUploadProvider = 'firebase' | 'supabase';

export type StorageBucketKind =
  | 'brand-public'
  | 'branch-public'
  | 'ops-private'
  | 'customer-private'
  | 'backoffice-private';

export type StorageEntityType =
  | 'branding'
  | 'notice'
  | 'branch'
  | 'booking'
  | 'bag'
  | 'claim'
  | 'customer'
  | 'backoffice'
  | 'employee'
  | 'settlement';

export type SignedUploadMethod = 'PUT' | 'POST';

export interface SignedUploadRequest {
  bucketKind: StorageBucketKind;
  entityType: StorageEntityType;
  entityId?: string;
  contentType: string;
  fileExtension: string;
  branchCode?: string;
  branchType?: 'hub' | 'partner';
  assetCategory?: string;
  serviceType?: 'delivery' | 'storage' | 'claim';
  eventType?: 'pickup' | 'dropoff' | 'checkin' | 'checkout' | 'damage';
  bookingId?: string;
  bagId?: string;
  customerId?: string;
  topic?: string;
  domain?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface SignedUploadResponse {
  bucketId: StorageBucketKind;
  objectPath: string;
  uploadUrl: string;
  publicUrl?: string;
  method?: SignedUploadMethod;
  headers?: Record<string, string>;
  expiresAt?: string;
}

interface ManagedUploadOptions {
  file: File | Blob;
  firebasePath: string;
  signedUploadRequest?: SignedUploadRequest;
  fallbackReason?: string;
}

const STORAGE_UPLOAD_PROVIDER =
  import.meta.env.VITE_STORAGE_UPLOAD_PROVIDER === 'supabase' ? 'supabase' : 'firebase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const SIGNED_UPLOAD_ENDPOINT = import.meta.env.VITE_SUPABASE_STORAGE_SIGNED_UPLOAD_ENDPOINT?.trim()
  || (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/signed-upload` : '');
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || '';

const ALLOWED_PUBLIC_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'svg']);
const ALLOWED_PRIVATE_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'heic', 'heif']);
const ALLOWED_BACKOFFICE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'pdf']);

const normalizeExtension = (input?: string) => (input || '').trim().toLowerCase().replace(/^\./, '');

const sanitizeIdSegment = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const parseResponse = async (response: Response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) {
    throw new Error(message);
  }
};

const validateExtensionForBucket = (bucketKind: StorageBucketKind, fileExtension: string) => {
  const normalizedExtension = normalizeExtension(fileExtension);
  const allowList =
    bucketKind === 'brand-public' || bucketKind === 'branch-public'
      ? ALLOWED_PUBLIC_IMAGE_EXTENSIONS
      : bucketKind === 'backoffice-private'
        ? ALLOWED_BACKOFFICE_EXTENSIONS
        : ALLOWED_PRIVATE_IMAGE_EXTENSIONS;

  assert(
    allowList.has(normalizedExtension),
    `허용되지 않은 파일 확장자입니다: ${normalizedExtension || 'unknown'}`
  );
};

const validateSignedUploadRequest = (request: SignedUploadRequest) => {
  assert(request.bucketKind, '업로드 버킷 정보가 필요합니다.');
  assert(request.entityType, '업로드 엔터티 타입이 필요합니다.');
  assert(request.contentType?.trim(), '파일 Content-Type이 필요합니다.');

  validateExtensionForBucket(request.bucketKind, request.fileExtension);

  if (request.bucketKind === 'branch-public') {
    assert(request.branchCode, '지점 공개 자산은 branchCode가 필요합니다.');
    assert(request.branchType, '지점 공개 자산은 branchType이 필요합니다.');
    assert(request.assetCategory, '지점 공개 자산은 assetCategory가 필요합니다.');
  }

  if (request.bucketKind === 'ops-private') {
    assert(request.branchCode, '운영 증빙 업로드는 branchCode가 필요합니다.');
    assert(request.serviceType, '운영 증빙 업로드는 serviceType이 필요합니다.');
    assert(request.eventType, '운영 증빙 업로드는 eventType이 필요합니다.');
    assert(request.bookingId, '운영 증빙 업로드는 bookingId가 필요합니다.');
  }

  if (request.bucketKind === 'customer-private') {
    assert(request.customerId, '고객 전용 업로드는 customerId가 필요합니다.');
    assert(request.topic, '고객 전용 업로드는 topic이 필요합니다.');
  }

  if (request.bucketKind === 'backoffice-private') {
    assert(request.domain, '백오피스 업로드는 domain이 필요합니다.');
  }
};

export const getStorageUploadProvider = (): StorageUploadProvider => STORAGE_UPLOAD_PROVIDER;

export const isSupabaseStorageUploadEnabled = () =>
  getStorageUploadProvider() === 'supabase' &&
  Boolean(SIGNED_UPLOAD_ENDPOINT) &&
  Boolean(SUPABASE_PUBLISHABLE_KEY);

export const inferFileExtension = (fileName?: string, contentType?: string) => {
  const fromName = normalizeExtension(fileName?.split('.').pop());
  if (fromName) return fromName;

  const normalizedType = (contentType || '').trim().toLowerCase();
  if (normalizedType.includes('svg')) return 'svg';
  if (normalizedType.includes('jpeg')) return 'jpeg';
  if (normalizedType.includes('jpg')) return 'jpg';
  if (normalizedType.includes('png')) return 'png';
  if (normalizedType.includes('webp')) return 'webp';
  if (normalizedType.includes('heic')) return 'heic';
  if (normalizedType.includes('heif')) return 'heif';
  if (normalizedType.includes('pdf')) return 'pdf';

  return '';
};

const buildSupabasePublicObjectUrl = (bucketId: StorageBucketKind, objectPath: string) => {
  assert(SUPABASE_URL, 'Supabase URL이 설정되지 않았습니다.');
  const encodedPath = objectPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${SUPABASE_URL}/storage/v1/object/public/${bucketId}/${encodedPath}`;
};

const resolveSignedUploadTargetUrl = (uploadUrl: string) => {
  if (!uploadUrl || !SUPABASE_URL.startsWith('/')) {
    return uploadUrl;
  }

  try {
    const parsed = new URL(uploadUrl);
    const proxiedPath = parsed.pathname.startsWith('/storage/v1/')
      ? parsed.pathname
      : parsed.pathname.startsWith('/object/upload/sign/')
        ? `/storage/v1${parsed.pathname}`
        : parsed.pathname;
    return `${SUPABASE_URL}${proxiedPath}${parsed.search}`;
  } catch {
    return uploadUrl;
  }
};

const uploadManagedAsset = async ({
  file,
  firebasePath,
  signedUploadRequest,
  fallbackReason,
}: ManagedUploadOptions) => {
  const shouldUseSupabase = Boolean(signedUploadRequest) && isSupabaseStorageUploadEnabled();

  if (!shouldUseSupabase) {
    return StorageService.uploadFile(file, firebasePath);
  }

  if (fallbackReason) {
    console.info(`[StorageUpload] ${fallbackReason} Firebase 업로드로 유지합니다.`);
    return StorageService.uploadFile(file, firebasePath);
  }

  const signedUpload = await requestSupabaseSignedUpload(signedUploadRequest!);
  const uploaded = await uploadWithSignedUrl(file, signedUpload);

  if (signedUpload.publicUrl) {
    return signedUpload.publicUrl;
  }

  if (uploaded.bucketId === 'brand-public' || uploaded.bucketId === 'branch-public') {
    return buildSupabasePublicObjectUrl(uploaded.bucketId, uploaded.objectPath);
  }

  throw new Error('비공개 버킷 업로드는 아직 앱에서 표시용 URL 계약이 연결되지 않았습니다.');
};

export const buildHeroSignedUploadRequest = (
  file: File | Blob,
  options: {
    assetCategory: 'hero-image' | 'hero-mobile-image' | 'hero-video';
    entityId?: string;
    originalFileName?: string;
  }
): SignedUploadRequest => ({
  bucketKind: 'brand-public',
  entityType: 'branding',
  entityId: options.entityId,
  assetCategory: options.assetCategory,
  contentType: file.type || 'application/octet-stream',
  fileExtension: inferFileExtension(options.originalFileName || ('name' in file ? file.name : ''), file.type),
  metadata: {
    assetCategory: options.assetCategory,
    originalFileName: options.originalFileName || ('name' in file ? file.name : null),
  },
});

export const buildBranchAssetSignedUploadRequest = (
  file: File | Blob,
  options: {
    branchCode: string;
    branchType: 'hub' | 'partner';
    assetCategory: 'main' | 'pickup' | 'thumb' | 'cover';
    entityId?: string;
    originalFileName?: string;
  }
): SignedUploadRequest => ({
  bucketKind: 'branch-public',
  entityType: 'branch',
  entityId: options.entityId,
  branchCode: sanitizeIdSegment(options.branchCode),
  branchType: options.branchType,
  assetCategory: options.assetCategory,
  contentType: file.type || 'application/octet-stream',
  fileExtension: inferFileExtension(options.originalFileName || ('name' in file ? file.name : ''), file.type),
  metadata: {
    assetCategory: options.assetCategory,
    originalFileName: options.originalFileName || ('name' in file ? file.name : null),
  },
});

export const buildNoticeSignedUploadRequest = (
  file: File | Blob,
  options: {
    noticeId?: string;
    originalFileName?: string;
  }
): SignedUploadRequest => ({
  bucketKind: 'brand-public',
  entityType: 'notice',
  entityId: options.noticeId,
  assetCategory: 'notice-image',
  contentType: file.type || 'application/octet-stream',
  fileExtension: inferFileExtension(options.originalFileName || ('name' in file ? file.name : ''), file.type),
  metadata: {
    assetCategory: 'notice-image',
    originalFileName: options.originalFileName || ('name' in file ? file.name : null),
  },
});

export const uploadHeroManagedAsset = async (
  file: File | Blob,
  options: {
    assetCategory: 'hero-image' | 'hero-mobile-image' | 'hero-video';
    firebasePath: string;
    entityId?: string;
    originalFileName?: string;
  }
) => {
  const signedUploadRequest =
    options.assetCategory === 'hero-video'
      ? undefined
      : buildHeroSignedUploadRequest(file, {
          assetCategory: options.assetCategory,
          entityId: options.entityId,
          originalFileName: options.originalFileName,
        });

  return uploadManagedAsset({
    file,
    firebasePath: options.firebasePath,
    signedUploadRequest,
    fallbackReason:
      options.assetCategory === 'hero-video'
        ? '히어로 영상은 아직 Supabase public 비디오 정책이 준비되지 않아'
        : undefined,
  });
};

export const uploadBranchManagedAsset = async (
  file: File | Blob,
  options: {
    firebasePath: string;
    branchCode: string;
    branchType: 'hub' | 'partner';
    assetCategory: 'main' | 'pickup' | 'thumb' | 'cover';
    entityId?: string;
    originalFileName?: string;
  }
) =>
  uploadManagedAsset({
    file,
    firebasePath: options.firebasePath,
    signedUploadRequest: buildBranchAssetSignedUploadRequest(file, {
      branchCode: options.branchCode,
      branchType: options.branchType,
      assetCategory: options.assetCategory,
      entityId: options.entityId,
      originalFileName: options.originalFileName,
    }),
  });

export const uploadNoticeManagedAsset = async (
  file: File | Blob,
  options: {
    firebasePath: string;
    noticeId?: string;
    originalFileName?: string;
  }
) =>
  uploadManagedAsset({
    file,
    firebasePath: options.firebasePath,
    signedUploadRequest: buildNoticeSignedUploadRequest(file, {
      noticeId: options.noticeId,
      originalFileName: options.originalFileName,
    }),
  });

export const requestSupabaseSignedUpload = async (
  request: SignedUploadRequest
): Promise<SignedUploadResponse> => {
  assert(
    SIGNED_UPLOAD_ENDPOINT,
    'Supabase signed upload endpoint가 설정되지 않았습니다.'
  );

  validateSignedUploadRequest(request);
  const authHeaders = await getActiveAdminRequestHeaders();

  const response = await fetch(SIGNED_UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
      ...authHeaders,
    },
    body: JSON.stringify(request),
  });

  const body = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof body === 'object' && body && 'message' in body
        ? String((body as { message?: string }).message)
        : typeof body === 'object' && body && 'error' in body
          ? String((body as { error?: string }).error)
        : 'Supabase signed upload URL 발급에 실패했습니다.';
    throw new Error(message);
  }

  assert(
    typeof body === 'object' &&
      body !== null &&
      'uploadUrl' in body &&
      'objectPath' in body &&
      'bucketId' in body,
    'Supabase signed upload 응답 형식이 올바르지 않습니다.'
  );

  return body as SignedUploadResponse;
};

export const uploadWithSignedUrl = async (
  file: File | Blob,
  signedUpload: SignedUploadResponse
) => {
  const response = await fetch(resolveSignedUploadTargetUrl(signedUpload.uploadUrl), {
    method: signedUpload.method || 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      ...(signedUpload.headers || {}),
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error('signed upload 파일 전송에 실패했습니다.');
  }

  return {
    bucketId: signedUpload.bucketId,
    objectPath: signedUpload.objectPath,
    publicUrl: signedUpload.publicUrl || null,
  };
};
