
import React from "react";

interface LandingTrustBadgeProps {
    t: any;
}

const LandingTrustBadge: React.FC<LandingTrustBadgeProps> = ({ t }) => {
    return (
        <section className="py-20 bg-bee-yellow/5 border-y border-bee-yellow/10">
            <div className="max-w-4xl mx-auto px-6 text-center">
                <img src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EC%86%8C%EA%B0%9C%2F%EC%89%B4%EB%93%9C.png?alt=media&token=8547086f-b37a-45a9-8e7f-70038b4daff4" alt="Shield" className="w-16 h-16 mx-auto mb-6 drop-shadow-lg" />
                <h2 className="text-3xl font-black mb-4">{t.hero?.insurance_title || 'Fully Insured'}</h2>
                <p className="text-gray-500 text-lg mb-8 break-keep">
                    {t.hero?.insurance_desc || "We provide compensation up to 500,000 KRW (approx $380) per bag for any loss or damage. Travel with total peace of mind."}
                </p>
                <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm text-sm font-bold text-gray-600">
                    <i className="fa-solid fa-check-circle text-green-500"></i>
                    {t.hero?.insurance_badge_text || 'Safety Guarantee Policy Applied'}
                </div>
            </div>
        </section>
    );
};

export default LandingTrustBadge;
