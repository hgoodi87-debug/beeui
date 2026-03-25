
import React from 'react';

const AggregateRatingSchema: React.FC = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "빌리버 (Beeliber) 짐보관 및 배송 서비스",
    "image": "https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2F1_background_cinematic_2k_202602230049.jpeg?alt=media&token=66532fb7-1f97-417f-8b7d-062e1f3a1b2b",
    "description": "서울 주요 거점 짐 보관과 인천공항 당일 짐배송 서비스를 제공하는 빌리버.",
    "brand": {
      "@type": "Brand",
      "name": "Beeliber"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": "1240",
      "reviewCount": "1240"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default AggregateRatingSchema;
