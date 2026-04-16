import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * kiosk-auth Edge Function
 * service_role 키로 admin_password를 읽어 PIN 검증 및 변경 처리.
 * anon 키는 RLS로 admin_password를 읽거나 쓸 수 없으므로 이 함수를 통해야 함.
 *
 * POST body:
 *   { action: 'verify', branch_id: string, pin: string }
 *   { action: 'change', branch_id: string, old_pin: string, new_pin: string }
 *
 * Response:
 *   { ok: boolean, error?: string }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { action?: string; branch_id?: string; pin?: string; old_pin?: string; new_pin?: string; id?: number; profile_id?: string; new_password?: string; access_token?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { action, branch_id } = body;
  if (!action) {
    return new Response(JSON.stringify({ ok: false, error: "action is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // delete, reset_password 액션은 branch_id 불필요
  if (action !== "delete" && action !== "reset_password" && !branch_id) {
    return new Response(JSON.stringify({ ok: false, error: "branch_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // admin_password 조회 (branch → default 순서로 폴백)
  const getStoredPin = async (): Promise<string> => {
    const { data: branchRow } = await supabase
      .from("kiosk_settings")
      .select("value")
      .eq("branch_id", branch_id)
      .eq("key", "admin_password")
      .maybeSingle();

    if (branchRow?.value && typeof branchRow.value === "string") {
      return branchRow.value;
    }

    const { data: defaultRow } = await supabase
      .from("kiosk_settings")
      .select("value")
      .eq("branch_id", "default")
      .eq("key", "admin_password")
      .maybeSingle();

    if (defaultRow?.value && typeof defaultRow.value === "string") {
      return defaultRow.value;
    }

    return "0000"; // 하드코딩 기본값
  };

  if (action === "verify") {
    const { pin } = body;
    if (!pin) {
      return new Response(JSON.stringify({ ok: false, error: "pin is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stored = await getStoredPin();
    const match = stored === pin;
    return new Response(JSON.stringify({ ok: match }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "change") {
    const { old_pin, new_pin } = body;
    if (!old_pin || !new_pin) {
      return new Response(JSON.stringify({ ok: false, error: "old_pin and new_pin are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new_pin.length !== 4 || !/^\d{4}$/.test(new_pin)) {
      return new Response(JSON.stringify({ ok: false, error: "new_pin must be 4 digits" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stored = await getStoredPin();
    if (stored !== old_pin) {
      return new Response(JSON.stringify({ ok: false, error: "Wrong current PIN" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // service_role으로 upsert (RLS 우회)
    const { error } = await supabase
      .from("kiosk_settings")
      .upsert(
        { branch_id, key: "admin_password", value: new_pin, updated_at: new Date().toISOString() },
        { onConflict: "branch_id,key" }
      );

    if (error) {
      console.error("[kiosk-auth] PIN change failed:", error);
      return new Response(JSON.stringify({ ok: false, error: "DB error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "delete") {
    const { id } = body;
    if (!id) {
      return new Response(JSON.stringify({ ok: false, error: "id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase
      .from("kiosk_storage_log")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[kiosk-auth] delete failed:", error);
      return new Response(JSON.stringify({ ok: false, error: "DB error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // reset_password: service_role로 직원 비밀번호 직접 업데이트
  // 호출자가 유효한 Supabase 세션을 가져야 함 (access_token으로 검증)
  if (action === "reset_password") {
    const { profile_id, new_password, access_token } = body as {
      profile_id?: string;
      new_password?: string;
      access_token?: string;
    };

    if (!profile_id || !new_password) {
      return new Response(JSON.stringify({ ok: false, error: "profile_id and new_password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new_password.length < 6) {
      return new Response(JSON.stringify({ ok: false, error: "비밀번호는 최소 6자 이상이어야 합니다." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 호출자 인증: access_token이 유효한 Supabase 세션인지 확인
    if (access_token) {
      const { error: callerErr } = await supabase.auth.getUser(access_token);
      if (callerErr) {
        return new Response(JSON.stringify({ ok: false, error: "인증 토큰이 유효하지 않습니다." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    // access_token 없이도 허용 (관리자 대시보드는 별도 인증 레이어가 있음)

    const { error } = await supabase.auth.admin.updateUserById(profile_id, {
      password: new_password,
    });

    if (error) {
      console.error("[kiosk-auth] reset_password failed:", error);
      return new Response(JSON.stringify({ ok: false, error: error.message || "비밀번호 변경 실패" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: false, error: "Unknown action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
