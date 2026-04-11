/**
 * GA4 Data API 프록시
 * 환경변수:
 *   GOOGLE_SA_KEY      — 서비스 계정 JSON 전체 (Supabase Secret)
 *   GA4_PROPERTY_ID    — GA4 속성 숫자 ID (예: 123456789)
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getGoogleAccessToken } from "../_shared/google-auth.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const propertyId = Deno.env.get("GA4_PROPERTY_ID");
    if (!propertyId) throw new Error("GA4_PROPERTY_ID 환경변수가 없습니다.");

    const token = await getGoogleAccessToken([
      "https://www.googleapis.com/auth/analytics.readonly",
    ]);

    const baseUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // 날짜 범위: 쿼리 파라미터로 받거나 기본 30일
    const url = new URL(req.url);
    const days = Math.min(parseInt(url.searchParams.get("days") || "30"), 90);
    const dateRange = { startDate: `${days}daysAgo`, endDate: "today" };

    // ── 1. 일별 세션 + 사용자 ────────────────────────────────
    const [dailyRes, channelRes, countryRes, pageRes, kpiRes] = await Promise.all([
      fetch(`${baseUrl}:runReport`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          dateRanges: [dateRange],
          dimensions: [{ name: "date" }],
          metrics: [
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "screenPageViews" },
          ],
          orderBys: [{ dimension: { dimensionName: "date" } }],
        }),
      }),
      // ── 2. 채널별 세션 ────────────────────────────────────
      fetch(`${baseUrl}:runReport`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          dateRanges: [dateRange],
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          metrics: [{ name: "sessions" }, { name: "activeUsers" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 10,
        }),
      }),
      // ── 3. 국가별 세션 ────────────────────────────────────
      fetch(`${baseUrl}:runReport`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          dateRanges: [dateRange],
          dimensions: [{ name: "country" }],
          metrics: [{ name: "sessions" }, { name: "activeUsers" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 10,
        }),
      }),
      // ── 4. 페이지별 조회 수 ───────────────────────────────
      fetch(`${baseUrl}:runReport`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          dateRanges: [dateRange],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }, { name: "sessions" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 15,
        }),
      }),
      // ── 5. 전체 KPI (단일 숫자) ───────────────────────────
      fetch(`${baseUrl}:runReport`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          dateRanges: [dateRange],
          metrics: [
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "newUsers" },
            { name: "screenPageViews" },
            { name: "bounceRate" },
            { name: "averageSessionDuration" },
          ],
        }),
      }),
    ]);

    const [daily, channel, country, page, kpi] = await Promise.all([
      dailyRes.json(),
      channelRes.json(),
      countryRes.json(),
      pageRes.json(),
      kpiRes.json(),
    ]);

    // ── 파싱 헬퍼 ────────────────────────────────────────────
    const parseRows = (report: any, dimKeys: string[], metricKeys: string[]) =>
      (report.rows || []).map((row: any) => {
        const obj: Record<string, string | number> = {};
        dimKeys.forEach((k, i) => { obj[k] = row.dimensionValues?.[i]?.value || ""; });
        metricKeys.forEach((k, i) => { obj[k] = parseFloat(row.metricValues?.[i]?.value || "0"); });
        return obj;
      });

    const kpiValues = kpi.rows?.[0]?.metricValues || [];
    const getKpi = (i: number) => parseFloat(kpiValues[i]?.value || "0");

    return json({
      kpi: {
        sessions: getKpi(0),
        activeUsers: getKpi(1),
        newUsers: getKpi(2),
        pageViews: getKpi(3),
        bounceRate: Math.round(getKpi(4) * 100),
        avgSessionDuration: Math.round(getKpi(5)),
      },
      daily: parseRows(daily, ["date"], ["sessions", "activeUsers", "pageViews"]).map((r: any) => ({
        ...r,
        date: `${r.date.slice(0, 4)}-${r.date.slice(4, 6)}-${r.date.slice(6, 8)}`,
      })),
      channels: parseRows(channel, ["channel"], ["sessions", "users"]),
      countries: parseRows(country, ["country"], ["sessions", "users"]),
      pages: parseRows(page, ["path"], ["views", "sessions"]),
    });
  } catch (e: any) {
    console.error("[google-analytics]", e);
    return json({ error: e.message }, 500);
  }
});
