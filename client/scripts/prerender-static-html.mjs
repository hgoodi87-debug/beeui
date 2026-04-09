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

// FAQ content for /qna route — injected as FAQPage JSON-LD + noscript body text
const FAQ_ITEMS = [
  {
    q: '짐배송 서비스는 어디서 어디로 배송되나요?',
    a: '빌리버는 서울 주요 거점(홍대, 연남, 명동, 이태원, 동대문 등)에서 인천국제공항 T1·T2로 당일 짐배송 서비스를 제공합니다. 체크아웃 후 짐을 맡기고 가볍게 여행하세요.',
  },
  {
    q: '짐 보관 서비스 요금은 얼마인가요?',
    a: '캐리어(대형) 8,000원/일, 핸드백·소형 가방 6,000원/일입니다. 짐배송은 캐리어 25,000원, 핸드백 10,000원(인천공항 기준)입니다. bee-liber.com에서 온라인 예약 시 즉시 확인 가능합니다.',
  },
  {
    q: '짐 보관 서비스는 안전한가요?',
    a: '모든 보관 예약은 실시간 CCTV와 스마트 보안 씰로 보호됩니다. 글로벌 수준의 안심 보험이 기본 적용되어 소중한 짐을 안전하게 지킵니다.',
  },
  {
    q: '예약 취소 및 환불은 어떻게 되나요?',
    a: '서비스 시작 24시간 전까지 취소 시 전액 환불됩니다. 서비스 시작 후 취소는 환불이 불가합니다. 자세한 내용은 이용약관을 확인해주세요.',
  },
  {
    q: '운영 시간은 어떻게 되나요?',
    a: '빌리버 거점 운영 시간은 09:00~21:00입니다. 짐배송 픽업은 예약 시 선택한 시간대에 방문합니다.',
  },
];

const buildFaqJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
});

// Route-specific noscript static content for non-JS crawlers
const buildNoscriptContent = (routePath, meta) => {
  const baseContent = `<h1>${meta.title}</h1><p>${meta.description}</p>`;

  if (routePath === '/qna') {
    const faqHtml = FAQ_ITEMS.map(
      ({ q, a }) => `<dt>${q}</dt><dd>${a}</dd>`
    ).join('');
    return `${baseContent}<dl>${faqHtml}</dl>`;
  }

  if (routePath === '/services') {
    return `${baseContent}
<ul>
  <li><strong>짐보관 (Storage)</strong>: 캐리어 8,000원/일, 핸드백 6,000원/일 | 09:00~21:00</li>
  <li><strong>당일 짐배송 (Airport Delivery)</strong>: 캐리어 25,000원, 핸드백 10,000원 | 인천공항 T1·T2</li>
  <li><strong>예약</strong>: bee-liber.com 온라인 예약 전용</li>
</ul>`;
  }

  if (routePath === '/locations') {
    return `${baseContent}
<ul>
  <li>홍대바오 (Hongdae Bao) | 弘大 — 마포구 와우산로</li>
  <li>연남 (Yeonnam) | 延南 — 마포구 연남동</li>
  <li>이태원 (Itaewon) | 梨泰院 — 용산구 이태원로</li>
  <li>동대문 (Dongdaemun) | 東大門 — 중구 을지로</li>
  <li>마포 (Mapo) | 麻浦 — 마포구</li>
  <li>명동본점 (Myeongdong) | 明洞 — 중구 명동</li>
</ul>`;
  }

  if (routePath.startsWith('/storage/') || routePath.startsWith('/delivery/')) {
    return `${baseContent}`;
  }

  return baseContent;
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

  // Inject FAQPage JSON-LD only on /qna route
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try {
      const data = JSON.parse(s.textContent);
      if (data['@type'] === 'FAQPage') s.remove();
    } catch (_) {}
  });
  if (routePath === '/qna') {
    const faqScript = document.createElement('script');
    faqScript.setAttribute('type', 'application/ld+json');
    faqScript.textContent = JSON.stringify(buildFaqJsonLd(), null, 2);
    document.head.appendChild(faqScript);
  }

  // Update SEO noscript fallback with route-specific content
  const seoNoscript = Array.from(document.querySelectorAll('noscript')).find(
    (n) => n.textContent && n.textContent.includes('Beeliber') && n.querySelector && n.querySelector('div')
  );
  if (seoNoscript) {
    const noscriptContent = buildNoscriptContent(routePath, meta);
    seoNoscript.innerHTML = `<div style="font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#111">${noscriptContent}</div>`;
  }

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
