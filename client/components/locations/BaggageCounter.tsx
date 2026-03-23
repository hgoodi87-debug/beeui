
import React from "react";
import { Plus, Minus } from "lucide-react";
import { STORAGE_RATES } from "../../utils/pricing";
import {
    BagCategoryId,
    DEFAULT_DELIVERY_PRICES,
    getBagCategoryDescription,
    getBagCategoriesForService,
    getBagCategoryCount,
    getBagCategoryLabel,
    getStoragePriceForCategory,
    getBagCategoryVisualMeta,
} from "../../src/domains/booking/bagCategoryUtils";
import { ServiceType } from "../../types";

interface BaggageCounterProps {
    t: any;
    lang: string;
    baggageCounts: any;
    onCountChange: (categoryId: BagCategoryId, delta: number) => void;
    onConfirm?: () => void;
    deliveryPrices?: any;
    currentService?: 'SAME_DAY' | 'SCHEDULED' | 'STORAGE';
}

const BaggageCounter: React.FC<BaggageCounterProps> = ({ t, lang, baggageCounts, onCountChange, onConfirm, deliveryPrices, currentService }) => {
    const isDelivery = currentService === 'SAME_DAY' || currentService === 'SCHEDULED';
    const serviceType = isDelivery ? ServiceType.DELIVERY : ServiceType.STORAGE;
    const categories = getBagCategoriesForService(serviceType);
    const baseStoragePrices = {
        handBag: STORAGE_RATES.handBag.hours4,
        carrier: STORAGE_RATES.carrier.hours4,
        strollerBicycle: STORAGE_RATES.strollerBicycle.hours4,
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pl-1">
                <label className="text-xs font-black text-gray-500 tracking-[0.24em] uppercase">
                    {t.locations_page?.select_baggage_title || "Luggage Selection"}
                </label>
            </div>

            <div className={`grid gap-4 ${isDelivery ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
                {categories.map((category) => {
                    const count = getBagCategoryCount(baggageCounts, category.id);
                    const unitPrice = isDelivery
                        ? getStoragePriceForCategory(deliveryPrices || DEFAULT_DELIVERY_PRICES, category.id)
                        : getStoragePriceForCategory(baseStoragePrices, category.id);
                    const visual = getBagCategoryVisualMeta(category.id);
                    const label = getBagCategoryLabel(category.id, lang);
                    const description = getBagCategoryDescription(category.id, lang, serviceType);

                    return (
                        <div key={category.id} className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:border-bee-yellow/70 hover:shadow-[0_20px_50px_rgba(15,23,42,0.09)]">
                            <div className="p-4 sm:p-5 space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-gray-400">
                                            {isDelivery ? (lang.startsWith('ko') ? '배송 품목' : 'Delivery item') : (lang.startsWith('ko') ? '보관 품목' : 'Storage item')}
                                        </div>
                                        <div className="mt-1 text-xl font-black leading-tight text-bee-black break-keep">
                                            {label}
                                        </div>
                                    </div>
                                    <div className={`shrink-0 rounded-2xl px-4 py-2 text-center ${visual.chipClassName}`}>
                                        <div className="text-[10px] font-black tracking-[0.2em] uppercase opacity-70">
                                            {lang.startsWith('ko') ? '선택' : 'Qty'}
                                        </div>
                                        <div className="mt-1 text-2xl font-black leading-none">{count}</div>
                                    </div>
                                </div>

                                <div className={`flex h-32 items-center justify-center rounded-[1.5rem] bg-gradient-to-br ${visual.accentClassName}`}>
                                    <img
                                        src={visual.imageSrc}
                                        alt={label}
                                        className="h-20 w-20 object-contain"
                                        loading="lazy"
                                    />
                                </div>

                                <p className="min-h-[48px] text-xs font-semibold leading-5 text-gray-500 break-keep">
                                    {description}
                                </p>

                                <div className="flex items-end justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            {isDelivery ? (lang.startsWith('ko') ? '1회 기준' : 'Per trip') : (lang.startsWith('ko') ? '4시간 기준' : 'Base 4h')}
                                        </div>
                                        <div className="mt-1 text-2xl font-black leading-none text-bee-yellow">
                                            ₩{unitPrice.toLocaleString()}
                                        </div>
                                        {!isDelivery && (
                                            <div className="mt-1 text-[11px] font-bold text-gray-500">
                                                {t.locations_page?.bag_unit_4h || (lang.startsWith('ko') ? '기본 4시간부터 계산' : 'Starts at 4 hours')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 rounded-full bg-gray-50 px-2 py-2">
                                        <button
                                            title="Decrease"
                                            onClick={() => onCountChange(category.id, -1)}
                                            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-45"
                                            disabled={count === 0}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-7 text-center text-lg font-black text-bee-black">{count}</span>
                                        <button
                                            title="Increase"
                                            onClick={() => onCountChange(category.id, 1)}
                                            className="flex h-10 w-10 items-center justify-center rounded-full bg-bee-black text-bee-yellow transition-colors hover:bg-gray-800 shadow-sm"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {isDelivery && (
                <p className="text-[10px] font-bold text-red-500 px-1">
                    {lang.startsWith('ko') ? '배송은 쇼핑백, 손가방과 캐리어만 접수 가능합니다.' : 'Delivery supports shopping bags, handbags, and suitcases only.'}
                </p>
            )}

            {onConfirm && (
                <button
                    onClick={onConfirm}
                    className="w-full py-4 bg-bee-yellow text-bee-black font-[1000] rounded-full shadow-lg shadow-bee-yellow/10 hover:shadow-bee-yellow/20 transition-all active:scale-[0.98] mt-2 text-[12px] uppercase tracking-[0.2em] border border-bee-yellow/20"
                >
                    {t.common?.confirm || 'Confirm'}
                </button>
            )}
        </div>
    );
};

export default React.memo(BaggageCounter);
