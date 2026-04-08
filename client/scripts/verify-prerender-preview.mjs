const baseUrl = (process.env.SEO_PREVIEW_BASE_URL || 'http://localhost:4177').replace(/\/+$/, '');

const checks = [
  {
    path: '/ko/locations',
    expectedTitle: '지점 안내 | 빌리버 서울 짐보관 지점 찾기',
    expectedCanonical: 'https://bee-liber.com/ko/locations',
  },
  {
    path: '/ko/storage/hongdae',
    expectedTitle: '홍대입구역 &amp; 연남동 짐보관 | Beeliber 핸즈프리',
    expectedCanonical: 'https://bee-liber.com/ko/storage/hongdae',
  },
  {
    path: '/ko/delivery/hongdae',
    expectedTitle: '홍대입구역 &amp; 연남동 당일 짐배송 | 빌리버',
    expectedCanonical: 'https://bee-liber.com/ko/delivery/hongdae',
  },
  {
    path: '/robots.txt',
    expectedText: 'Sitemap: https://bee-liber.com/sitemap.xml',
  },
  {
    path: '/sitemap.xml',
    expectedText: 'https://bee-liber.com/ko/delivery/hongdae',
  },
];

const extractTitle = (html) => {
  const match = html.match(/<title>(.*?)<\/title>/i);
  return match ? match[1] : null;
};

const extractCanonical = (html) => {
  const match = html.match(/<link rel="canonical" href="([^"]+)"/i);
  return match ? match[1] : null;
};

let hasFailure = false;

for (const check of checks) {
  const targetUrl = `${baseUrl}${check.path}`;
  const response = await fetch(targetUrl);
  const body = await response.text();

  if (!response.ok) {
    console.error(`[verify-prerender-preview] FAIL ${check.path} -> HTTP ${response.status}`);
    hasFailure = true;
    continue;
  }

  if (check.expectedText) {
    const ok = body.includes(check.expectedText);
    console.log(
      `[verify-prerender-preview] ${ok ? 'OK' : 'FAIL'} ${check.path} text="${check.expectedText}"`
    );
    if (!ok) {
      hasFailure = true;
    }
    continue;
  }

  const actualTitle = extractTitle(body);
  const actualCanonical = extractCanonical(body);
  const titleOk = actualTitle === check.expectedTitle;
  const canonicalOk = actualCanonical === check.expectedCanonical;

  console.log(
    `[verify-prerender-preview] ${(titleOk && canonicalOk) ? 'OK' : 'FAIL'} ${check.path} title="${actualTitle}" canonical="${actualCanonical}"`
  );

  if (!titleOk || !canonicalOk) {
    hasFailure = true;
  }
}

if (hasFailure) {
  process.exitCode = 1;
} else {
  console.log('[verify-prerender-preview] All checks passed.');
}
