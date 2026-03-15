import React from 'react';
import { Helmet } from 'react-helmet-async';

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
    const siteUrl = 'https://bee-liber.com';
    // 💅 [스봉이] 쿼리 파라미터가 섞이지 않도록 정규화된 Canonical URL 생성
    const cleanPath = path.split('?')[0];
    const canonicalUrl = `${siteUrl}${cleanPath}`;
    const currentUrl = `${siteUrl}${path}`;

    // Default values
    const defaultTitle = '빌리버(Beeliber) - 서울 여행이 가벼워지는 순간 | 짐 보관 & 공항 당일 배송 💅';
    const defaultDescription = '서울 여행의 시작과 끝을 무거운 가방 없이. 홍대, 서울역 등 주요 거점 짐 보관부터 인천공항 당일 배송까지. 비리버(Beeliber)와 함께 가장 서울다운 여행을 즐기세요. ✨';
    const defaultKeywords = '서울 짐보관, 홍대 짐보관, 서울역 짐보관, 명동 짐보관, 캐리어 배송, 인천공항 짐배송, 당일 짐배송, 호텔 짐보내기, 서울 여행 마지막 날, 체크아웃 후 짐보관';

    const metaTitle = title || defaultTitle;
    const metaDescription = description || defaultDescription;
    const metaKeywords = keywords || defaultKeywords;
    const ogImg = customOgImage || "https://bee-liber.com/og-main.png"; // 💅 프리미엄 메인 OG 이미지 (가칭)

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
            <link rel="alternate" hrefLang="ko-KR" href={`${siteUrl}${cleanPath}`} />
            <link rel="alternate" hrefLang="en" href={`${siteUrl}${cleanPath}?lang=en`} />
            <link rel="alternate" hrefLang="ja-JP" href={`${siteUrl}${cleanPath}?lang=ja`} />
            <link rel="alternate" hrefLang="zh-CN" href={`${siteUrl}${cleanPath}?lang=zh`} />
            <link rel="alternate" hrefLang="zh-TW" href={`${siteUrl}${cleanPath}?lang=zh-TW`} />
            <link rel="alternate" hrefLang="zh-HK" href={`${siteUrl}${cleanPath}?lang=zh-HK`} />
            <link rel="alternate" hrefLang="x-default" href={`${siteUrl}${cleanPath}`} />
        </Helmet>
    );
};

export default SEO;

