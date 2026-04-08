import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
    SEO_DEFAULT_OG_IMAGE,
    SITE_URL,
    STATIC_ROUTE_META,
    getLocalizedRouteMeta
} from '../src/constants/seoRouteMeta';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    lang?: string;
    path?: string;
    schema?: object;
    ogImage?: string; // 💅 동적 OG 이미지 지원 추가
    ogType?: 'website' | 'article'; // 💅 페이지 성격에 따른 타입 지원
    noIndex?: boolean;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords,
    lang = 'ko',
    path = '',
    schema,
    ogImage: customOgImage,
    ogType = 'website',
    noIndex = false
}) => {
    // 💅 [스봉이] 언어 접두사를 제거하여 순수 경로만 추출합니다. (e.g., /ko/services -> /services)
    const rawPath = path.split('?')[0] || '/';
    const langPattern = /^\/(ko|en|zh-tw|zh-hk|ja|zh)(\/|$)/i;
    const cleanPath = rawPath.replace(langPattern, '/').replace(/\/$/, '') || '/';
    const normalizedLang = ['ko', 'en', 'zh-tw', 'zh-hk', 'ja', 'zh'].includes(lang.toLowerCase())
        ? lang.toLowerCase()
        : 'zh-tw';
    const canonicalPath = langPattern.test(rawPath)
        ? (rawPath.replace(/\/$/, '') || '/')
        : `/${normalizedLang}${cleanPath === '/' ? '' : cleanPath}`;

    const canonicalUrl = `${SITE_URL}${canonicalPath}`;
    const currentUrl = canonicalUrl;
    // lang 기반 다국어 메타 → 없으면 한국어 fallback → 없으면 하드코딩 fallback
    const localizedMeta = getLocalizedRouteMeta(lang, cleanPath);
    const routeDefault = localizedMeta ?? STATIC_ROUTE_META[cleanPath];

    // Default values
    const defaultTitle = routeDefault?.title || '빌리버 | 서울 짐보관 · 인천공항 당일 짐배송';
    const defaultDescription = routeDefault?.description || '서울 주요 거점 스마트 짐 거치부터 인천공항 당일 짐배송까지. 체크아웃 후 짐 걱정 없이 온전한 자유를 만끽하세요.';
    const defaultKeywords = routeDefault?.keywords || '서울 짐보관, 홍대 짐보관, 서울역 짐보관, 명동 짐보관, 캐리어 배송, 인천공항 짐배송, 당일 짐배송, 체크아웃 후 자유여행, 서울 여행 필수 앱';

    const metaTitle = title || defaultTitle;
    const metaDescription = description || defaultDescription;
    const metaKeywords = keywords || defaultKeywords;
    const ogImg = customOgImage || SEO_DEFAULT_OG_IMAGE;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <html lang={lang} />
            <title>{metaTitle}</title>
            <meta name="description" content={metaDescription} />
            <meta name="keywords" content={metaKeywords} />
            <meta name="robots" content={noIndex ? 'noindex, follow' : 'index, follow'} />
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:site_name" content="Beeliber" />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={metaTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={ogImg} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@beeliber" />
            <meta name="twitter:url" content={currentUrl} />
            <meta name="twitter:title" content={metaTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={ogImg} />

            {/* Dynamic Schema Injection */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}

            {/* Alternate Language Links (Hreflang) — sitemap.xml과 동일한 코드 사용 */}
            <link rel="alternate" hrefLang="ko" href={`${SITE_URL}/ko${cleanPath === '/' ? '' : cleanPath}`} />
            <link rel="alternate" hrefLang="en" href={`${SITE_URL}/en${cleanPath === '/' ? '' : cleanPath}`} />
            <link rel="alternate" hrefLang="ja" href={`${SITE_URL}/ja${cleanPath === '/' ? '' : cleanPath}`} />
            <link rel="alternate" hrefLang="zh-CN" href={`${SITE_URL}/zh${cleanPath === '/' ? '' : cleanPath}`} />
            <link rel="alternate" hrefLang="zh-TW" href={`${SITE_URL}/zh-tw${cleanPath === '/' ? '' : cleanPath}`} />
            <link rel="alternate" hrefLang="zh-HK" href={`${SITE_URL}/zh-hk${cleanPath === '/' ? '' : cleanPath}`} />
            <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/zh-tw${cleanPath === '/' ? '' : cleanPath}`} />
        </Helmet>
    );
};

export default SEO;
