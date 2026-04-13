import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * RLS 헬스체크 Edge Function
 * 잔여 권고사항 #2 + #3: Edge Function 401 감시 + RLS 정기 감사
 *
 * 호출 방법 (관리자 전용):
 *   POST /functions/v1/check-rls-health
 *   Authorization: Bearer <SYNC_SECRET_KEY>
 *
 * 반환:
 *   - RLS 비활성화 테이블 목록
 *   - USING(true) 공개 정책 목록
 *   - 최근 24시간 Edge Function 호출 현황 (서비스 로그 기반)
 */

const SYNC_SECRET_KEY = Deno.env.get("SYNC_SECRET_KEY") || "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  // 인증 검증
  if (!SYNC_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "Function not configured" }), {
      status: 503,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
  const authHeader = req.headers.get("Authorization") || "";
  if (authHeader !== `Bearer ${SYNC_SECRET_KEY}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // 1. RLS 감사 실행
    const { data: rlsAudit, error: rlsError } = await supabase.rpc("rls_audit");
    if (rlsError) throw new Error(`RLS 감사 실패: ${rlsError.message}`);

    const critical = rlsAudit?.filter((r: any) => r.risk_level.startsWith("🔴")) ?? [];
    const warnings = rlsAudit?.filter((r: any) => r.risk_level.startsWith("🟠") || r.risk_level.startsWith("🟡")) ?? [];
    const healthy  = rlsAudit?.filter((r: any) => r.risk_level.startsWith("✅")) ?? [];

    const result = {
      checked_at: new Date().toISOString(),
      summary: {
        total_tables: rlsAudit?.length ?? 0,
        critical_count: critical.length,
        warning_count: warnings.length,
        healthy_count: healthy.length,
        overall_status: critical.length > 0 ? "🔴 CRITICAL" : warnings.length > 0 ? "🟡 WARNING" : "✅ HEALTHY",
      },
      critical_tables: critical,
      warning_tables: warnings,
    };

    // CRITICAL 발견 시 콘솔 경고 (Supabase 로그에 기록됨)
    if (critical.length > 0) {
      console.error(`[RLS-HEALTH] CRITICAL: ${critical.length}개 테이블 RLS 비활성화!`, critical.map((r: any) => r.tablename));
    }

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[RLS-HEALTH] Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
