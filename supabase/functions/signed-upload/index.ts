import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  authenticateAdminRequest,
  CORS_HEADERS,
  EdgeHttpError,
  isUuid,
  jsonResponse,
  normalizeLower,
  normalizeText,
  normalizeUpper,
  requestSupabase,
  requestSupabaseTable,
  sanitizeSegment,
} from "../_shared/admin-auth.ts";

const SUPPORTED_BUCKETS = new Set(["brand-public", "branch-public", "backoffice-private"]);
const HQ_WRITE_ROLES = new Set(["super", "hq", "staff", "finance", "cs"]);
const BRANCH_SCOPED_ROLES = new Set(["branch", "partner"]);
const PUBLIC_BUCKETS = new Set(["brand-public", "branch-public"]);
const BUCKET_CONFIG: Record<string, {
  public: boolean;
  file_size_limit: number;
  allowed_mime_types: string[];
}> = {
  "brand-public": {
    public: true,
    file_size_limit: 10 * 1024 * 1024,
    allowed_mime_types: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  },
  "branch-public": {
    public: true,
    file_size_limit: 15 * 1024 * 1024,
    allowed_mime_types: ["image/png", "image/jpeg", "image/webp"],
  },
  "backoffice-private": {
    public: false,
    file_size_limit: 25 * 1024 * 1024,
    allowed_mime_types: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
  },
};

const ALLOWED_EXTENSIONS: Record<string, Set<string>> = {
  "brand-public": new Set(["png", "jpg", "jpeg", "webp", "svg"]),
  "branch-public": new Set(["png", "jpg", "jpeg", "webp"]),
  "backoffice-private": new Set(["png", "jpg", "jpeg", "webp", "pdf"]),
};

const ALLOWED_CONTENT_TYPES: Record<string, Set<string>> = {
  "brand-public": new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
  "branch-public": new Set(["image/png", "image/jpeg", "image/webp"]),
  "backoffice-private": new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]),
};

const ALLOWED_ASSET_CATEGORIES: Record<string, Set<string>> = {
  "brand-public": new Set(["hero-image", "hero-mobile-image", "notice-image"]),
  "branch-public": new Set(["main", "pickup", "thumb", "cover"]),
};

const sanitizeMetadataValue = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean" || typeof value === "number") return value;
  return String(value).slice(0, 300);
};

const sanitizeMetadata = (input: unknown) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return Object.entries(input).reduce<Record<string, string | number | boolean | null>>((acc, [key, value]) => {
    const safeKey = sanitizeSegment(key);
    if (!safeKey) return acc;
    acc[safeKey] = sanitizeMetadataValue(value);
    return acc;
  }, {});
};

const encodeObjectPath = (objectPath: string) =>
  objectPath.split("/").map((segment) => encodeURIComponent(segment)).join("/");

const validateFileSignature = ({
  bucketKind,
  fileExtension,
  contentType,
}: {
  bucketKind: string;
  fileExtension: string;
  contentType: string;
}) => {
  const normalizedExtension = normalizeLower(fileExtension).replace(/^\./, "");
  const normalizedContentType = normalizeLower(contentType);

  if (!ALLOWED_EXTENSIONS[bucketKind]?.has(normalizedExtension)) {
    throw new EdgeHttpError(400, "허용되지 않은 파일 확장자입니다.");
  }

  if (!ALLOWED_CONTENT_TYPES[bucketKind]?.has(normalizedContentType)) {
    throw new EdgeHttpError(400, "허용되지 않은 파일 형식입니다.");
  }
};

const validateRequest = (body: Record<string, unknown>) => {
  const request = {
    bucketKind: normalizeLower(body.bucketKind),
    entityType: normalizeLower(body.entityType),
    entityId: normalizeText(body.entityId),
    contentType: normalizeLower(body.contentType),
    fileExtension: normalizeLower(body.fileExtension).replace(/^\./, ""),
    branchCode: normalizeUpper(body.branchCode),
    branchType: sanitizeSegment(body.branchType),
    assetCategory: sanitizeSegment(body.assetCategory),
    domain: sanitizeSegment(body.domain),
    metadata: sanitizeMetadata(body.metadata),
  };

  if (!SUPPORTED_BUCKETS.has(request.bucketKind)) {
    throw new EdgeHttpError(400, "현재 단계에서 지원하지 않는 버킷입니다.");
  }

  if (!request.entityType) {
    throw new EdgeHttpError(400, "entityType이 필요합니다.");
  }

  validateFileSignature(request);

  if (request.bucketKind === "brand-public") {
    if (!["branding", "notice"].includes(request.entityType)) {
      throw new EdgeHttpError(400, "브랜드 공개 자산 entityType은 branding 또는 notice여야 합니다.");
    }
    if (request.entityType === "branding" && !["hero-image", "hero-mobile-image"].includes(request.assetCategory)) {
      throw new EdgeHttpError(400, "브랜드 자산 카테고리가 올바르지 않습니다.");
    }
    if (request.entityType === "notice" && request.assetCategory !== "notice-image") {
      throw new EdgeHttpError(400, "공지 공개 자산 카테고리는 notice-image만 허용됩니다.");
    }
    if (!ALLOWED_ASSET_CATEGORIES["brand-public"].has(request.assetCategory)) {
      throw new EdgeHttpError(400, "허용되지 않은 브랜드 공개 자산 카테고리입니다.");
    }
  }

  if (request.bucketKind === "branch-public") {
    if (request.entityType !== "branch") {
      throw new EdgeHttpError(400, "지점 자산 entityType은 branch여야 합니다.");
    }
    if (!request.branchCode || !request.branchType) {
      throw new EdgeHttpError(400, "지점 자산은 branchCode와 branchType이 필요합니다.");
    }
    if (!["hub", "partner"].includes(request.branchType)) {
      throw new EdgeHttpError(400, "branchType은 hub 또는 partner만 허용됩니다.");
    }
    if (!ALLOWED_ASSET_CATEGORIES["branch-public"].has(request.assetCategory)) {
      throw new EdgeHttpError(400, "허용되지 않은 지점 자산 카테고리입니다.");
    }
  }

  if (request.bucketKind === "backoffice-private") {
    if (!["notice", "backoffice"].includes(request.entityType)) {
      throw new EdgeHttpError(400, "백오피스 업로드 entityType은 notice 또는 backoffice여야 합니다.");
    }
    if (!request.domain) {
      throw new EdgeHttpError(400, "백오피스 업로드는 domain이 필요합니다.");
    }
  }

  return request;
};

const assertUploadScope = ({
  request,
  adminRole,
  adminBranchCode,
}: {
  request: ReturnType<typeof validateRequest>;
  adminRole: string;
  adminBranchCode: string;
}) => {
  if (request.bucketKind === "brand-public" || request.bucketKind === "backoffice-private") {
    if (!HQ_WRITE_ROLES.has(adminRole)) {
      throw new EdgeHttpError(403, "본사 관리자만 접근할 수 있습니다.");
    }
    return;
  }

  if (request.bucketKind === "branch-public") {
    if (HQ_WRITE_ROLES.has(adminRole)) {
      return;
    }

    if (!BRANCH_SCOPED_ROLES.has(adminRole)) {
      throw new EdgeHttpError(403, "지점 자산 업로드 권한이 없습니다.");
    }

    if (!request.branchCode || !adminBranchCode || request.branchCode !== adminBranchCode) {
      throw new EdgeHttpError(403, "본인 지점 자산만 업로드할 수 있습니다.");
    }
  }
};

const buildObjectPath = (request: ReturnType<typeof validateRequest>) => {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const yyyymm = `${year}${month}`;
  const fileName = `${crypto.randomUUID()}.${request.fileExtension}`;

  if (request.bucketKind === "brand-public") {
    const namespace = request.entityType === "notice" ? "notice" : "branding";
    return `${namespace}/${request.assetCategory}/${yyyymm}/${fileName}`;
  }

  if (request.bucketKind === "branch-public") {
    return `${request.branchType}/${request.branchCode}/${request.assetCategory}/${yyyymm}/${fileName}`;
  }

  return `${request.domain}/${year}/${month}/${sanitizeSegment(request.entityId || "draft") || "draft"}/${fileName}`;
};

const buildPublicUrl = (supabaseUrl: string, bucketId: string, objectPath: string) =>
  `${supabaseUrl}/storage/v1/object/public/${bucketId}/${encodeObjectPath(objectPath)}`;

const ensureBucketExists = async (bucketId: string) => {
  const buckets = await requestSupabase<Array<{
    id?: string;
  }>>("/storage/v1/bucket");

  const alreadyExists = buckets.some((bucket) => normalizeText(bucket.id) === bucketId);
  if (alreadyExists) {
    return;
  }

  const config = BUCKET_CONFIG[bucketId];
  if (!config) {
    throw new EdgeHttpError(400, "현재 단계에서 지원하지 않는 버킷입니다.");
  }

  await requestSupabase("/storage/v1/bucket", {
    method: "POST",
    body: JSON.stringify({
      id: bucketId,
      name: bucketId,
      public: config.public,
      file_size_limit: config.file_size_limit,
      allowed_mime_types: config.allowed_mime_types,
    }),
  });
};

const resolveBranchRowId = async (branchCode?: string) => {
  const normalizedBranchCode = normalizeText(branchCode);
  if (!normalizedBranchCode) return null;

  const rows = await requestSupabaseTable<{ id: string }>(
    "branches",
    `select=id&branch_code=eq.${encodeURIComponent(normalizedBranchCode)}&limit=1`,
  );
  return normalizeText(rows[0]?.id) || null;
};

const createSignedUploadUrl = async (supabaseUrl: string, bucketId: string, objectPath: string) => {
  const body = await requestSupabase<Record<string, unknown>>(
    `/storage/v1/object/upload/sign/${bucketId}/${encodeObjectPath(objectPath)}`,
    {
      method: "POST",
      body: JSON.stringify({ upsert: false }),
    },
  );

  const token =
    normalizeText(body?.token)
    || normalizeText((body as { data?: { token?: string } }).data?.token);
  const path =
    normalizeText(body?.path)
    || normalizeText((body as { data?: { path?: string } }).data?.path)
    || objectPath;
  const signedUrlCandidate =
    normalizeText((body as { signedURL?: string }).signedURL)
    || normalizeText((body as { signedUrl?: string }).signedUrl)
    || normalizeText((body as { url?: string }).url)
    || normalizeText((body as { data?: { signedURL?: string } }).data?.signedURL)
    || normalizeText((body as { data?: { signedUrl?: string } }).data?.signedUrl)
    || normalizeText((body as { data?: { url?: string } }).data?.url);

  let uploadUrl = "";
  if (signedUrlCandidate.startsWith("http://") || signedUrlCandidate.startsWith("https://")) {
    uploadUrl = signedUrlCandidate;
  } else if (signedUrlCandidate) {
    uploadUrl = `${supabaseUrl}${signedUrlCandidate.startsWith("/") ? "" : "/"}${signedUrlCandidate}`;
  } else if (token) {
    uploadUrl =
      `${supabaseUrl}/storage/v1/object/upload/sign/${bucketId}/${encodeObjectPath(path)}?token=${
        encodeURIComponent(token)
      }`;
  }

  if (!uploadUrl) {
    throw new EdgeHttpError(502, "Supabase signed upload URL 형식이 올바르지 않습니다.");
  }

  return {
    objectPath: path,
    uploadUrl,
  };
};

const createPendingStorageAsset = async ({
  bucketId,
  objectPath,
  entityType,
  entityId,
  uploadedByUserId,
  branchCode,
  assetCategory,
  metadata,
  authBridge,
}: {
  bucketId: string;
  objectPath: string;
  entityType: string;
  entityId: string;
  uploadedByUserId: string;
  branchCode: string;
  assetCategory: string;
  metadata: Record<string, string | number | boolean | null>;
  authBridge: string;
}) => {
  const branchId = await resolveBranchRowId(branchCode);

  await requestSupabase(
    "/rest/v1/storage_assets",
    {
      method: "POST",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        bucket_id: bucketId,
        object_path: objectPath,
        entity_type: entityType,
        entity_id: isUuid(entityId) ? entityId : null,
        branch_id: branchId,
        uploaded_by_user_id: uploadedByUserId || null,
        metadata: {
          ...metadata,
          bucket_kind: bucketId,
          original_entity_id: entityId || null,
          branch_code: branchCode || null,
          asset_category: assetCategory || null,
          upload_status: "pending",
          auth_bridge: authBridge || "supabase-admin-session",
        },
      }),
    },
  ).catch((error) => {
    if (
      error instanceof EdgeHttpError
      && error.status === 404
      && (
        error.logMessage.includes("public.storage_assets")
        || error.logMessage.includes("schema cache")
      )
    ) {
      console.warn("[signed-upload] storage_assets table is missing, skipping pending asset record.");
      return;
    }

    throw error;
  });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    if (req.method !== "POST") {
      throw new EdgeHttpError(405, "POST 요청만 허용됩니다.");
    }

    const authContext = await authenticateAdminRequest(req);
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new EdgeHttpError(400, "업로드 요청 형식이 올바르지 않습니다.");
    }

    const request = validateRequest(body as Record<string, unknown>);
    assertUploadScope({
      request,
      adminRole: normalizeLower(authContext.adminContext.role),
      adminBranchCode: normalizeUpper(authContext.adminContext.branchCode),
    });

    const supabaseUrl = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
    const objectPath = buildObjectPath(request);
    await ensureBucketExists(request.bucketKind);
    const signedUpload = await createSignedUploadUrl(supabaseUrl, request.bucketKind, objectPath);

    await createPendingStorageAsset({
      bucketId: request.bucketKind,
      objectPath: signedUpload.objectPath,
      entityType: request.entityType,
      entityId: request.entityId,
      uploadedByUserId: authContext.uid,
      branchCode: request.branchCode,
      assetCategory: request.assetCategory,
      metadata: request.metadata,
      authBridge: `${authContext.provider}-admin-session`,
    });

    return jsonResponse({
      bucketId: request.bucketKind,
      objectPath: signedUpload.objectPath,
      uploadUrl: signedUpload.uploadUrl,
      method: "PUT",
      headers: {},
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      publicUrl: PUBLIC_BUCKETS.has(request.bucketKind)
        ? buildPublicUrl(supabaseUrl, request.bucketKind, signedUpload.objectPath)
        : undefined,
    });
  } catch (error) {
    if (error instanceof EdgeHttpError) {
      console.warn("[signed-upload]", error.logMessage);
      return jsonResponse({ message: error.message, error: error.message }, error.status);
    }

    console.error("[signed-upload] unexpected error:", error);
    return jsonResponse({
      message: "signed upload URL 발급에 실패했습니다.",
      error: "signed upload URL 발급에 실패했습니다.",
    }, 500);
  }
});
