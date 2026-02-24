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
    const defaultTitle = 'Beeliber - Global Luggage Delivery & Storage (Hongdae, Luggage Storage, Airport)';
    const defaultDescription = 'Professional luggage storage and delivery service in Hongdae, Luggage Storage, and Airports. Same-day luggage delivery between hotel and airport.';
    const defaultKeywords = 'luggage storage, luggage delivery, hongdae storage, luggage storage lockers, airport luggage delivery, 짐보관, 짐배송';

    const metaTitle = title || defaultTitle;
    const metaDescription = description || defaultDescription;
    const metaKeywords = keywords || defaultKeywords;

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
            {/* Image should ideally be dynamic too, but using default for now */}
            <meta property="og:image" content="https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&q=80&w=1200" />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={currentUrl} />
            <meta property="twitter:title" content={metaTitle} />
            <meta property="twitter:description" content={metaDescription} />
            <meta property="twitter:image" content="https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&q=80&w=1200" />

            {/* Dynamic Schema Injection */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}

            {/* Alternate Language Links for SEO */}
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
