
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
    const listLayoutClass = 'flex flex-col gap-2 md:gap-3';

    return (
        <div className="space-y-4">
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
                            className={`group relative flex items-center gap-4 p-4 md:p-5 bg-white rounded-[1.5rem] md:rounded-[2rem] border transition-all duration-300 ${count > 0 ? 'border-bee-yellow bg-bee-yellow/[0.03] shadow-lg' : 'border-gray-100 shadow-sm'}`}
                        >
                            {/* Visual Image Section 💅 */}
                            <div className="relative w-20 h-20 md:w-28 md:h-28 shrink-0 flex items-center justify-center bg-gray-50/50 rounded-2xl overflow-hidden group-hover:bg-white transition-colors duration-500">
                                <div className={`absolute inset-0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${count > 0 ? 'bg-bee-yellow/10 opacity-100' : 'bg-gray-200/20'}`} />
                                <img
                                    src={visual.imageSrc}
                                    alt={label}
                                    className="relative w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>

                            {/* Content Section 💅 */}
                            <div className="flex-1 min-w-0 pr-2">
                                <div className="flex flex-col">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[9px] font-black text-bee-black/30 uppercase tracking-[0.15em] font-montserrat">
                                            {isDelivery ? 'Delivery' : 'Storage'}
                                        </span>
                                        {count > 0 && (
                                            <span className="px-2 py-0.5 bg-bee-yellow text-bee-black text-[10px] font-black rounded-full shadow-sm animate-pulse-subtle">
                                                SELECTED
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-[17px] md:text-[20px] font-black tracking-tight text-gray-900 leading-tight mb-1.5">
                                        {label}
                                    </h4>
                                    <p className="text-[11px] md:text-[12px] font-medium text-gray-400 line-clamp-1 italic mb-3">
                                        {description}
                                    </p>
                                    
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex flex-col">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-[18px] md:text-[22px] font-black text-bee-yellow font-montserrat leading-none">
                                                    ₩{unitPrice.toLocaleString()}
                                                </span>
                                                <span className="text-[8px] md:text-[9px] font-bold text-gray-300 uppercase font-montserrat tracking-tighter">
                                                    {isDelivery ? '/Trip' : '/4h'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center bg-gray-50 rounded-md p-0.5 border border-gray-100/50 shadow-inner">
                                            <button
                                                onClick={() => onCountChange(category.id, -1)}
                                                className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-sm hover:bg-white text-gray-300 disabled:opacity-20 transition-all active:scale-90"
                                                disabled={count === 0}
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="w-5 md:w-6 text-center font-black text-[14px] md:text-[16px] text-gray-800 font-montserrat select-none">
                                                {count}
                                            </span>
                                            <button
                                                onClick={() => onCountChange(category.id, 1)}
                                                className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-sm bg-bee-black text-bee-yellow shadow-sm hover:scale-105 active:scale-90 transition-all"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
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
                    className="w-full py-2.5 bg-bee-yellow text-bee-black font-[1000] rounded-full shadow-lg shadow-bee-yellow/10 hover:shadow-bee-yellow/20 transition-all active:scale-[0.98] mt-1 text-[10px] uppercase tracking-[0.12em] border border-bee-yellow/20"
                >
                    {t.common?.confirm || 'Confirm'}
                </button>
            )}
        </div>
    );
};

export default React.memo(BaggageCounter);
