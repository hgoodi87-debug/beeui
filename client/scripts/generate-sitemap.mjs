import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_PRERENDER_ROUTES, SITE_URL } from './seoBuildData.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');
const lastmod = new Date().toISOString().slice(0, 10);

const routePriority = (routePath) => {
  if (routePath === '/') {
    return '1.0';
  }
  if (routePath === '/locations' || routePath === '/services') {
    return '0.9';
  }
  if (routePath === '/qna') {
    return '0.8';
  }
  if (routePath === '/tracking' || routePath === '/partnership') {
    return '0.7';
  }
  if (routePath === '/vision' || routePath === '/terms' || routePath === '/privacy') {
    return '0.5';
  }
  if (routePath.startsWith('/storage/')) {
    return '0.8';
  }
  if (routePath.startsWith('/delivery/')) {
    return '0.8';
  }
  return '0.6';
};

const routeChangeFreq = (routePath) => {
  if (routePath === '/') {
    return 'daily';
  }
  if (routePath === '/locations' || routePath === '/services' || routePath === '/qna') {
    return 'weekly';
  }
  if (routePath.startsWith('/storage/') || routePath.startsWith('/delivery/')) {
    return 'weekly';
  }
  return 'monthly';
};

const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const sortedRoutes = [...ALL_PRERENDER_ROUTES].sort((a, b) => {
  if (a.path === '/') return -1;
  if (b.path === '/') return 1;
  return a.path.localeCompare(b.path);
});

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sortedRoutes
  .map((route) => {
    const loc = `${SITE_URL}${route.path}`;
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${routeChangeFreq(route.path)}</changefreq>
    <priority>${routePriority(route.path)}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>
`;

await fs.mkdir(publicDir, { recursive: true });
await fs.writeFile(sitemapPath, sitemapXml, 'utf8');
console.log(`[generate-sitemap] Wrote ${sortedRoutes.length} URLs to ${sitemapPath}`);
