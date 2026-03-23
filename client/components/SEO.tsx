import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
    SEO_DEFAULT_OG_IMAGE,
    SITE_URL,
    STATIC_ROUTE_META
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
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords,
    lang = 'ko',
    path = '',
    schema,
    ogImage: customOgImage,
    ogType = 'website'
}) => {
    // 💅 [스봉이] 쿼리 파라미터가 섞이지 않도록 정규화된 Canonical URL 생성
    const cleanPath = path.split('?')[0] || '/';
    const canonicalUrl = `${SITE_URL}${cleanPath}`;
    const currentUrl = `${SITE_URL}${path}`;
    const routeDefault = STATIC_ROUTE_META[cleanPath];

    // Default values
    const defaultTitle = routeDefault?.title || '빌리버 | 서울 짐보관 · 인천공항 당일 짐배송';
    const defaultDescription = routeDefault?.description || '서울 주요 거점 짐 보관부터 인천공항 당일 짐배송까지. 체크아웃 후 무거운 짐 없이 가볍게 여행하세요.';
    const defaultKeywords = routeDefault?.keywords || '서울 짐보관, 홍대 짐보관, 서울역 짐보관, 명동 짐보관, 캐리어 배송, 인천공항 짐배송, 당일 짐배송, 호텔 짐보내기, 체크아웃 후 짐보관';

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

            {/* Alternate Language Links (Hreflang) */}
            <link rel="alternate" hrefLang="ko-KR" href={`${SITE_URL}${cleanPath}`} />
            <link rel="alternate" hrefLang="en" href={`${SITE_URL}${cleanPath}?lang=en`} />
            <link rel="alternate" hrefLang="ja-JP" href={`${SITE_URL}${cleanPath}?lang=ja`} />
            <link rel="alternate" hrefLang="zh-CN" href={`${SITE_URL}${cleanPath}?lang=zh`} />
            <link rel="alternate" hrefLang="zh-TW" href={`${SITE_URL}${cleanPath}?lang=zh-TW`} />
            <link rel="alternate" hrefLang="zh-HK" href={`${SITE_URL}${cleanPath}?lang=zh-HK`} />
            <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${cleanPath}`} />
        </Helmet>
    );
};

export default SEO;
