import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  ALL_PRERENDER_ROUTES,
  buildDeliveryLanderMeta,
  buildStorageLanderMeta,
  SEO_BUILD_LOCATIONS,
  SEO_DEFAULT_OG_IMAGE,
  SITE_URL,
  STATIC_ROUTE_META,
} from './seoBuildData.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const fallbackFileName = '__spa-fallback.html';

const LANGS = [
  { code: 'zh-tw', hreflang: 'zh-TW', htmlLang: 'zh-TW' },
  { code: 'zh-hk', hreflang: 'zh-HK', htmlLang: 'zh-HK' },
  { code: 'en', hreflang: 'en', htmlLang: 'en' },
  { code: 'ja', hreflang: 'ja', htmlLang: 'ja' },
  { code: 'zh', hreflang: 'zh-CN', htmlLang: 'zh-CN' },
  { code: 'ko', hreflang: 'ko', htmlLang: 'ko' },
];

const buildLangUrl = (langCode, routePath) => {
  const suffix = routePath === '/' ? '' : routePath;
  return `${SITE_URL}/${langCode}${suffix}`;
};

const buildAlternateLinks = (routePath) => [
  ...LANGS.map(({ code, hreflang }) => ({
    hrefLang: hreflang,
    href: buildLangUrl(code, routePath),
  })),
  { hrefLang: 'x-default', href: buildLangUrl('zh-tw', routePath) },
];

const locationMetaMap = new Map(SEO_BUILD_LOCATIONS.map((location) => [location.slug, location]));

const ensureMeta = (document, attrName, attrValue) => {
  let node = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attrName, attrValue);
    document.head.appendChild(node);
  }
  return node;
};

const resolveRouteMeta = (routePath) => {
  const staticMeta = STATIC_ROUTE_META[routePath];
  if (staticMeta) {
    return staticMeta;
  }

  const [routeBase, slug] = routePath.split('/').filter(Boolean);
  if ((routeBase === 'storage' || routeBase === 'delivery') && slug) {
    const locationMeta = locationMetaMap.get(slug);
    if (!locationMeta) {
      return null;
    }

    return routeBase === 'delivery'
      ? buildDeliveryLanderMeta(locationMeta)
      : buildStorageLanderMeta(locationMeta);
  }

  return null;
};

const renderRouteHtml = (html, routePath, meta, lang) => {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const canonicalUrl = buildLangUrl(lang.code, routePath);

  document.documentElement.setAttribute('lang', lang.htmlLang);
  document.title = meta.title;

  ensureMeta(document, 'name', 'description').setAttribute('content', meta.description);
  ensureMeta(document, 'name', 'keywords').setAttribute('content', meta.keywords || '');
  ensureMeta(document, 'property', 'og:type').setAttribute('content', routePath === '/' ? 'website' : 'article');
  ensureMeta(document, 'property', 'og:url').setAttribute('content', canonicalUrl);
  ensureMeta(document, 'property', 'og:title').setAttribute('content', meta.title);
  ensureMeta(document, 'property', 'og:description').setAttribute('content', meta.description);
  ensureMeta(document, 'property', 'og:image').setAttribute('content', SEO_DEFAULT_OG_IMAGE);
  ensureMeta(document, 'name', 'twitter:card').setAttribute('content', 'summary_large_image');
  ensureMeta(document, 'name', 'twitter:url').setAttribute('content', canonicalUrl);
  ensureMeta(document, 'name', 'twitter:title').setAttribute('content', meta.title);
  ensureMeta(document, 'name', 'twitter:description').setAttribute('content', meta.description);
  ensureMeta(document, 'name', 'twitter:image').setAttribute('content', SEO_DEFAULT_OG_IMAGE);

  document.head
    .querySelectorAll('link[rel="canonical"]')
    .forEach((node) => node.remove());

  const canonicalLink = document.createElement('link');
  canonicalLink.setAttribute('rel', 'canonical');
  canonicalLink.setAttribute('href', canonicalUrl);
  document.head.appendChild(canonicalLink);

  document.head
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach((node) => node.remove());

  buildAlternateLinks(routePath).forEach((link) => {
    const alternate = document.createElement('link');
    alternate.setAttribute('rel', 'alternate');
    alternate.setAttribute('hreflang', link.hrefLang);
    alternate.setAttribute('href', link.href);
    document.head.appendChild(alternate);
  });

  return dom.serialize();
};

const writeRouteHtml = async (html, routePath, langCode) => {
  const routeSuffix = routePath === '/' ? '' : routePath.replace(/^\//, '');
  const indexOutputPath = path.join(distDir, langCode, routeSuffix, 'index.html');
  const cleanUrlOutputPath = routeSuffix
    ? path.join(distDir, langCode, `${routeSuffix}.html`)
    : path.join(distDir, `${langCode}.html`);

  await fs.mkdir(path.dirname(indexOutputPath), { recursive: true });
  await fs.writeFile(indexOutputPath, html, 'utf8');
  await fs.mkdir(path.dirname(cleanUrlOutputPath), { recursive: true });
  await fs.writeFile(cleanUrlOutputPath, html, 'utf8');
};

const main = async () => {
  const baseHtmlPath = path.join(distDir, 'index.html');
  const baseHtml = await fs.readFile(baseHtmlPath, 'utf8');
  await fs.writeFile(path.join(distDir, fallbackFileName), baseHtml, 'utf8');

  let generatedCount = 0;

  for (const route of ALL_PRERENDER_ROUTES) {
    const meta = resolveRouteMeta(route.path);
    if (!meta) {
      continue;
    }
    for (const lang of LANGS) {
      const renderedHtml = renderRouteHtml(baseHtml, route.path, meta, lang);
      await writeRouteHtml(renderedHtml, route.path, lang.code);
      generatedCount += 1;
    }
  }

  console.log(
    `[prerender-static-html] Generated ${generatedCount} route HTML files and ${fallbackFileName}.`
  );
};

main().catch((error) => {
  console.error('[prerender-static-html] failed:', error);
  process.exitCode = 1;
});
