import { StorageTier, PriceSettings } from '../../types';

interface SystemTabProps {
    deliveryPrices: PriceSettings;
    updateDeliveryPrice: (size: keyof PriceSettings, val: number) => void;
    storageTiers: StorageTier[];
    updateStoragePrice: (id: string, size: keyof PriceSettings, val: number) => void;
}

const SystemTab: React.FC<SystemTabProps> = ({
    deliveryPrices,
    updateDeliveryPrice,
    storageTiers,
    updateStoragePrice
}) => {
    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">가격 정책 및 할증 설정</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-lg md:text-xl font-black flex items-center gap-3 mb-6"><span className="w-2 h-8 bg-bee-yellow rounded-full"></span>배송 기본 요금 (Delivery)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {(['S', 'M', 'L', 'XL'] as const).map(size => (
                            <div key={size} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">{size} Size</label>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-400">₩</span>
                                    <input
                                        type="number"
                                        value={deliveryPrices[size]}
                                        onChange={(e) => updateDeliveryPrice(size, Number(e.target.value))}
                                        title={`${size} 사이즈 배송 요금`}
                                        className="bg-transparent font-black text-xl w-full outline-none"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 space-y-6">
                    <h3 className="text-lg md:text-xl font-black flex items-center gap-3"><span className="w-2 h-8 bg-bee-blue rounded-full"></span>보관 요금 (Storage)</h3>
                    <div className="space-y-4">
                        {storageTiers.map(tier => (
                            <div key={tier.id} className="border border-gray-100 rounded-3xl p-5 hover:shadow-md transition-all">
                                <h4 className="font-black text-bee-black mb-4 text-sm md:text-base">{tier.label}</h4>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['S', 'M', 'L', 'XL'] as const).map(size => (
                                        <div key={size} className="bg-gray-50 p-2 rounded-xl text-center">
                                            <div className="text-[9px] font-black text-gray-400 uppercase mb-1">{size}</div>
                                            <input
                                                type="number"
                                                value={tier.prices[size]}
                                                onChange={(e) => updateStoragePrice(tier.id, size, Number(e.target.value))}
                                                title={`${tier.label} - ${size} 사이즈 보관 요금`}
                                                className="w-full bg-transparent text-center font-bold text-xs md:text-sm outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemTab;
