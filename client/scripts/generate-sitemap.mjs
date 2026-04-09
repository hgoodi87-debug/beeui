import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_PRERENDER_ROUTES, SITE_URL } from './seoBuildData.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');
const lastmod = new Date().toISOString().slice(0, 10);

const LANGS = [
  { code: 'zh-tw', hreflang: 'zh-TW' },
  { code: 'zh-hk', hreflang: 'zh-HK' },
  { code: 'en',    hreflang: 'en' },
  { code: 'ja',    hreflang: 'ja' },
  { code: 'zh',    hreflang: 'zh-CN' },
  { code: 'ko',    hreflang: 'ko' },
];

const routePriority = (routePath) => {
  if (routePath === '/') return '1.0';
  if (routePath === '/locations' || routePath === '/services') return '0.9';
  if (routePath === '/qna') return '0.8';
  if (routePath === '/tracking' || routePath === '/partnership') return '0.7';
  if (routePath === '/vision' || routePath === '/terms' || routePath === '/privacy') return '0.5';
  if (routePath.startsWith('/storage/') || routePath.startsWith('/delivery/')) return '0.8';
  return '0.6';
};

const routeChangeFreq = (routePath) => {
  if (routePath === '/') return 'daily';
  if (routePath === '/locations' || routePath === '/services' || routePath === '/qna') return 'weekly';
  if (routePath.startsWith('/storage/') || routePath.startsWith('/delivery/')) return 'weekly';
  return 'monthly';
};

const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const buildLangUrl = (langCode, routePath) => {
  const suffix = routePath === '/' ? '' : routePath;
  return `${SITE_URL}/${langCode}${suffix}`;
};

const buildHreflangLinks = (routePath) => {
  const links = LANGS.map(({ code, hreflang }) =>
    `      <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(buildLangUrl(code, routePath))}" />`
  );
  // x-default → zh-tw
  links.push(`      <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(buildLangUrl('zh-tw', routePath))}" />`);
  return links.join('\n');
};

// Core routes: homepage + main service pages (high crawl priority)
const CORE_ROUTE_PATHS = new Set(['/', '/locations', '/services', '/qna', '/tracking', '/partnership', '/vision', '/terms', '/privacy', '/refund', '/manual', '/mypage', '/booking']);

const sortedRoutes = [...ALL_PRERENDER_ROUTES].sort((a, b) => {
  if (a.path === '/') return -1;
  if (b.path === '/') return 1;
  return a.path.localeCompare(b.path);
});

const coreRoutes = sortedRoutes.filter((r) => CORE_ROUTE_PATHS.has(r.path));
const locationRoutes = sortedRoutes.filter((r) => !CORE_ROUTE_PATHS.has(r.path));

const buildUrlEntries = (routes) => {
  const entries = [];
  for (const route of routes) {
    for (const { code } of LANGS) {
      const loc = buildLangUrl(code, route.path);
      entries.push(`  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${routeChangeFreq(route.path)}</changefreq>
    <priority>${routePriority(route.path)}</priority>
${buildHreflangLinks(route.path)}
  </url>`);
    }
  }
  return entries;
};

const buildSitemapXml = (entries) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;

const coreEntries = buildUrlEntries(coreRoutes);
const locationEntries = buildUrlEntries(locationRoutes);

const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-core.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-locations.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>
`;

await fs.mkdir(publicDir, { recursive: true });
// sitemap.xml = sitemap index (Google discovers core + locations separately)
await fs.writeFile(sitemapPath, sitemapIndexXml, 'utf8');
await fs.writeFile(path.join(publicDir, 'sitemap-core.xml'), buildSitemapXml(coreEntries), 'utf8');
await fs.writeFile(path.join(publicDir, 'sitemap-locations.xml'), buildSitemapXml(locationEntries), 'utf8');
console.log(`[generate-sitemap] Core: ${coreEntries.length} URLs, Locations: ${locationEntries.length} URLs → sitemap index`);
