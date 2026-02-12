import React from 'react';
import BookingWidget from './BookingWidget';
import { LocationOption, BookingState, ServiceType } from '../types';

interface SidebarBookingProps {
    t: any;
    lang: string;
    onLangChange?: (lang: string) => void;
    onSuccess?: (booking: BookingState) => void;
    selectedLocation: LocationOption;
    onBack: () => void;
    locations: LocationOption[];
    initialServiceType?: ServiceType;
}

const SidebarBooking: React.FC<SidebarBookingProps> = ({ t, lang, selectedLocation, onBack, onSuccess, initialServiceType, locations }) => {
    return (
        <div className="flex flex-col h-full bg-white animate-fade-in-right relative overflow-y-auto no-scrollbar">
            {/* Header / Back Button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                <button onClick={onBack} className="text-gray-400 hover:text-bee-black transition-colors flex items-center gap-2">
                    <i className="fa-solid fa-arrow-left text-lg"></i>
                    <span className="text-xs font-bold text-gray-500">{t.locations_page?.back || 'Back'}</span>
                </button>
                <div className="text-xs font-black italic tracking-wider text-bee-black pr-2">
                    {lang === 'ko' ? selectedLocation.name :
                        lang.startsWith('en') ? (selectedLocation.name_en || selectedLocation.name) :
                            lang.startsWith('ja') ? (selectedLocation.name_ja || selectedLocation.name_en || selectedLocation.name) :
                                (selectedLocation.name_zh || selectedLocation.name_en || selectedLocation.name)}
                </div>
            </div>

            {/* Standard Booking Widget Container */}
            <div className="flex-1">
                <BookingWidget
                    lang={lang}
                    t={t}
                    onSuccess={onSuccess}
                    preSelectedBooking={{
                        id: selectedLocation.id,
                        type: initialServiceType === ServiceType.STORAGE ? 'STORAGE' : 'DELIVERY'
                    }}
                />
            </div>
        </div>
    );
};

export default SidebarBooking;

