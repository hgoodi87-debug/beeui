
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
    const listLayoutClass = 'grid grid-cols-1 gap-2.5';

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between pl-1">
                <label className="text-[10px] font-black text-gray-500 tracking-[0.18em] uppercase">
                    {t.locations_page?.select_baggage_title || "Luggage Selection"}
                </label>
            </div>

            <div className={listLayoutClass}>
                {categories.map((category) => {
                    const count = getBagCategoryCount(baggageCounts, category.id);
                    const unitPrice = isDelivery
                        ? getStoragePriceForCategory(deliveryPrices || DEFAULT_DELIVERY_PRICES, category.id)
                        : getStoragePriceForCategory(baseStoragePrices, category.id);
                    const visual = getBagCategoryVisualMeta(category.id);
                    const label = getBagCategoryLabel(category.id, lang);
                    const description = getBagCategoryDescription(category.id, lang, serviceType);

                    return (
                        <div
                            key={category.id}
                            className="overflow-hidden rounded-[1rem] border border-gray-100 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-bee-yellow/70 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]"
                        >
                            <div className="p-3 sm:p-3.5 space-y-2">
                                <div className="grid grid-cols-[3.35rem_minmax(0,1fr)_auto] items-start gap-2.5">
                                    <div className={`flex h-[3.35rem] w-[3.35rem] shrink-0 items-center justify-center rounded-[0.9rem] bg-gradient-to-br ${visual.accentClassName}`}>
                                        <img
                                            src={visual.imageSrc}
                                            alt={label}
                                            className="h-9 w-9 object-contain"
                                            loading="lazy"
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="text-[8px] font-black uppercase tracking-[0.1em] text-gray-400 whitespace-nowrap">
                                            {isDelivery ? (lang.startsWith('ko') ? '배송 품목' : 'Delivery item') : (lang.startsWith('ko') ? '보관 품목' : 'Storage item')}
                                        </div>
                                        <div className="mt-0.5 text-[0.98rem] sm:text-[1rem] font-black leading-tight text-bee-black break-keep">
                                            {label}
                                        </div>
                                        <p className="mt-1 text-[10px] font-semibold leading-[1.35] text-gray-500 break-keep">
                                            {description}
                                        </p>
                                    </div>

                                    <div className={`shrink-0 rounded-[0.95rem] px-2 py-1.5 text-center min-w-[3.45rem] ${visual.chipClassName}`}>
                                        <div className="text-[8px] font-black tracking-[0.08em] uppercase opacity-70 whitespace-nowrap">
                                            {lang.startsWith('ko') ? '선택' : 'Qty'}
                                        </div>
                                        <div className="mt-0.5 text-[1.35rem] font-black leading-none">{count}</div>
                                    </div>
                                </div>

                                <div className="flex items-end justify-between gap-2.5 rounded-[0.95rem] bg-gray-50/70 px-2.5 py-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[8px] font-black uppercase tracking-[0.1em] text-gray-400 whitespace-nowrap">
                                            {isDelivery ? (lang.startsWith('ko') ? '1회 기준' : 'Per trip') : (lang.startsWith('ko') ? '4시간 기준' : 'Base 4h')}
                                        </div>
                                        <div className="mt-1 text-[1.12rem] sm:text-[1.2rem] font-black leading-none text-bee-yellow whitespace-nowrap">
                                            ₩{unitPrice.toLocaleString()}
                                        </div>
                                        <div className="mt-1 text-[9px] font-bold leading-[1.25] text-gray-500 break-keep">
                                            {isDelivery
                                                ? (lang.startsWith('ko') ? '결제 즉시 반영' : 'Added instantly')
                                                : (lang.startsWith('ko') ? '4시간 이후 1시간 추가' : 'Hourly after 4h')}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 rounded-full bg-white px-1 py-1 shrink-0">
                                        <button
                                            title="Decrease"
                                            onClick={() => onCountChange(category.id, -1)}
                                            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-45"
                                            disabled={count === 0}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-5 text-center text-[0.95rem] font-black text-bee-black">{count}</span>
                                        <button
                                            title="Increase"
                                            onClick={() => onCountChange(category.id, 1)}
                                            className="flex h-7 w-7 items-center justify-center rounded-full bg-bee-black text-bee-yellow transition-colors hover:bg-gray-800 shadow-sm"
                                        >
                                            <Plus className="h-3 w-3" />
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
                    className="w-full py-2.5 bg-bee-yellow text-bee-black font-[1000] rounded-full shadow-lg shadow-bee-yellow/10 hover:shadow-bee-yellow/20 transition-all active:scale-[0.98] mt-1 text-[11px] uppercase tracking-[0.14em] border border-bee-yellow/20"
                >
                    {t.common?.confirm || 'Confirm'}
                </button>
            )}
        </div>
    );
};

export default React.memo(BaggageCounter);
