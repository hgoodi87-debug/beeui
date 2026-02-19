
import React from "react";
import { Plus, Minus, Package } from "lucide-react";

interface BaggageCounterProps {
    t: any;
    lang: string;
    baggageCounts: any;
    onCountChange: (size: 'S' | 'M' | 'L' | 'XL', delta: number) => void;
    onConfirm?: () => void;
    deliveryPrices?: any;
    currentService?: 'SAME_DAY' | 'SCHEDULED' | 'STORAGE';
}

// Global Storage Rates from pricing.ts (to avoid duplicates, though usually imported)
const STORAGE_RATES = {
    S: { hours4: 4000 },
    M: { hours4: 4000 },
    L: { hours4: 6000 },
    XL: { hours4: 7000 }
};

const BaggageCounter: React.FC<BaggageCounterProps> = ({ t, lang, baggageCounts, onCountChange, onConfirm, deliveryPrices, currentService }) => {
    const sizes: ('S' | 'M' | 'L' | 'XL')[] = ['S', 'M', 'L', 'XL'];
    const tBooking = t.booking || {};
    const isDelivery = currentService === 'SAME_DAY' || currentService === 'SCHEDULED';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pl-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {t.locations_page?.select_baggage_title || "Luggage Selection"}
                </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {sizes.map((size) => {
                    const count = baggageCounts[size] || 0;
                    const unitPrice = isDelivery
                        ? (deliveryPrices?.[size] || 20000)
                        : (STORAGE_RATES[size]?.hours4 || 4000);

                    return (
                        <div key={size} className="flex flex-col p-2.5 border border-gray-100 rounded-2xl bg-white hover:border-bee-yellow transition-all gap-2 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                    <Package className="text-gray-400" size={16} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[8px] text-gray-500 font-bold truncate mb-0.5 uppercase tracking-tighter">
                                        {size === 'S' ? (tBooking.size_s || 'S-Size') :
                                            size === 'M' ? (tBooking.size_m || 'M-Size') :
                                                size === 'L' ? (tBooking.size_l || 'L-Size') :
                                                    (tBooking.size_xl || 'XL-Size')}
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="font-black text-sm">{size}</span>
                                        <div className="flex flex-col mt-1 gap-0.5">
                                            <span className="text-[10px] text-bee-yellow font-black tracking-tight leading-none">
                                                ₩{unitPrice.toLocaleString()}
                                            </span>
                                            {!isDelivery && (
                                                <span className="text-[8px] text-bee-yellow/70 font-bold tracking-tight leading-none">
                                                    {t.locations_page?.bag_unit_4h || (lang.startsWith('ko') ? '/4시간~' : '/4h~')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1.5 border-t border-gray-50">
                                <button
                                    title="Decrease"
                                    onClick={() => onCountChange(size, -1)}
                                    className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                    disabled={count === 0}
                                >
                                    <Minus className="w-2 h-2" />
                                </button>
                                <span className="font-black text-xs">{count}</span>
                                <button
                                    title="Increase"
                                    onClick={() => onCountChange(size, 1)}
                                    className="w-5 h-5 rounded-full bg-bee-black text-bee-yellow flex items-center justify-center hover:bg-gray-800 transition-colors shadow-sm"
                                >
                                    <Plus className="w-2 h-2" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

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

export default BaggageCounter;
