/**
 * Google Search Console API 프록시
 * 환경변수:
 *   GOOGLE_SA_KEY   — 서비스 계정 JSON 전체 (Supabase Secret)
 *   GSC_SITE_URL    — Search Console 속성 URL (예: sc-domain:bee-liber.com)
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

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const siteUrl = Deno.env.get("GSC_SITE_URL");
    if (!siteUrl) throw new Error("GSC_SITE_URL 환경변수가 없습니다.");

    const token = await getGoogleAccessToken([
      "https://www.googleapis.com/auth/webmasters.readonly",
    ]);

    const url = new URL(req.url);
    const days = Math.min(parseInt(url.searchParams.get("days") || "30"), 90);
    const startDate = daysAgoStr(days);
    const endDate = daysAgoStr(1); // GSC는 어제까지만

    const encodedSite = encodeURIComponent(siteUrl);
    const apiBase = `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const base = { startDate, endDate, rowLimit: 25 };

    const [dailyRes, queryRes, pageRes, countryRes, deviceRes] = await Promise.all([
      // ── 1. 일별 클릭/노출/CTR/순위 ──────────────────────
      fetch(apiBase, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...base,
          dimensions: ["date"],
          rowLimit: days,
        }),
      }),
      // ── 2. 검색어 Top 25 ──────────────────────────────
      fetch(apiBase, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...base, dimensions: ["query"] }),
      }),
      // ── 3. 페이지 Top 25 ──────────────────────────────
      fetch(apiBase, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...base, dimensions: ["page"] }),
      }),
      // ── 4. 국가별 ──────────────────────────────────────
      fetch(apiBase, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...base, dimensions: ["country"] }),
      }),
      // ── 5. 기기별 ──────────────────────────────────────
      fetch(apiBase, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...base, dimensions: ["device"] }),
      }),
    ]);

    const [daily, queries, pages, countries, devices] = await Promise.all([
      dailyRes.json(),
      queryRes.json(),
      pageRes.json(),
      countryRes.json(),
      deviceRes.json(),
    ]);

    const parseRows = (report: any) =>
      (report.rows || []).map((r: any) => ({
        key: r.keys?.[0] || "",
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: Math.round((r.ctr || 0) * 1000) / 10, // % 소수점 1자리
        position: Math.round((r.position || 0) * 10) / 10,
      }));

    const allDaily = parseRows(daily);
    const totals = allDaily.reduce(
      (acc: any, r: any) => ({
        clicks: acc.clicks + r.clicks,
        impressions: acc.impressions + r.impressions,
      }),
      { clicks: 0, impressions: 0 },
    );
    const avgCtr = totals.impressions > 0
      ? Math.round((totals.clicks / totals.impressions) * 1000) / 10
      : 0;
    const avgPos = allDaily.length > 0
      ? Math.round(allDaily.reduce((s: number, r: any) => s + r.position, 0) / allDaily.length * 10) / 10
      : 0;

    return json({
      kpi: {
        clicks: totals.clicks,
        impressions: totals.impressions,
        ctr: avgCtr,
        position: avgPos,
      },
      daily: allDaily.map((r: any) => ({ ...r, date: r.key, key: undefined })),
      queries: parseRows(queries),
      pages: parseRows(pages),
      countries: parseRows(countries),
      devices: parseRows(devices),
    });
  } catch (e: any) {
    console.error("[google-search-console]", e);
    return json({ error: e.message }, 500);
  }
});
