import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    lang?: string;
    path?: string;
    schema?: object; // Add schema prop
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords,
    lang = 'ko',
    path = '',
    schema
}) => {
    const siteUrl = 'https://bee-liber.com';
    const currentUrl = `${siteUrl}${path}`;

    // Default values if props are not provided
    const defaultTitle = '빌리버(Beeliber) - 짐 없이 떠나는 무중력 여행 | 프리미엄 짐배송·짐보관';
    const defaultDescription = '캐리어 걱정 없는 서울 여행의 시작. 호텔-공항 당일 짐 배송 및 스마트 짐 보관 서비스를 무중력 상태처럼 가볍게 경험하세요. (Beeliber: Premium Luggage Freedom)';
    const defaultKeywords = ' 짐배송, 캐리어 보관, 캐리어 배송, 인천공항 짐배송, 홍대 캐리어 보관, 가방 없는 여행, 여행, 캐리어 , 짐보관소';

    const metaTitle = title || defaultTitle;
    const metaDescription = description || defaultDescription;
    const metaKeywords = keywords || defaultKeywords;
    const ogImage = "https://bee-liber.com/favicon.svg"; // 명품 브랜드는 로고 이미지가 중요하니까요 💅

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <html lang={lang} />
            <title>{metaTitle}</title>
            <meta name="description" content={metaDescription} />
            <meta name="keywords" content={metaKeywords} />
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={metaTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={ogImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={currentUrl} />
            <meta property="twitter:title" content={metaTitle} />
            <meta property="twitter:description" content={metaDescription} />
            <meta property="twitter:image" content={ogImage} />

            {/* Dynamic Schema Injection */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}

            {/* Alternate Language Links for SEO (Hreflang) */}
            <link rel="alternate" hrefLang="ko" href={`${siteUrl}${path}`} />
            <link rel="alternate" hrefLang="en" href={`${siteUrl}${path}?lang=en`} />
            <link rel="alternate" hrefLang="ja" href={`${siteUrl}${path}?lang=ja`} />
            <link rel="alternate" hrefLang="zh" href={`${siteUrl}${path}?lang=zh`} />
            <link rel="alternate" hrefLang="zh-TW" href={`${siteUrl}${path}?lang=zh-TW`} />
            <link rel="alternate" hrefLang="zh-HK" href={`${siteUrl}${path}?lang=zh-HK`} />
            <link rel="alternate" hrefLang="x-default" href={`${siteUrl}${path}`} />
        </Helmet>
    );
};

export default SEO;
