"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, Info, ChevronRight, X } from "lucide-react";

interface BeeSizeSimulatorProps {
    t?: any;
    lang?: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function BeeSizeSimulator({ t, lang = "ko", isOpen, onClose }: BeeSizeSimulatorProps) {
    const [userHeight, setUserHeight] = useState(170); // 기본 키 170cm
    const [selectedSize, setSelectedSize] = useState(0);

    // [BEE-DATA] 정밀 사이즈 데이터
    const s = t?.size_simulator || {
        header_title: "BEE 사이즈 체크",
        header_subtitle: "내 키와 직접 비교해보세요! 윙윙~",
        height_label: "내 키 설정하기",
        size_m_range: "18~23인치",
        size_m_desc: "기내용/단기여행",
        size_l_range: "24~26인치",
        size_l_desc: "일주일 여행용",
        size_xl_range: "27~30인치",
        size_xl_desc: "장기/이민 가방",
        hook_text: "\"고객님 키에는 {size} 사이즈가 딱이네요!\"",
        hook_sub: "이대로 예약을 도와드릴까요? 윙윙~ ✨",
        info_note: "본 시물레이션은 실제 촬영된 이미지를 기반으로 한 안내 가이드이며, 여행 가방의 브랜드 및 디자인에 따라 약간의 차이가 있을 수 있습니다. 윙윙~!"
    };

    const LUGGAGE_DATA = [
        { label: "M", range: s.size_m_range, height: 58, color: "#ffcb05", desc: s.size_m_desc },
        { label: "L", range: s.size_l_range, height: 68, color: "#FFA500", desc: s.size_l_desc },
        { label: "XL", range: s.size_xl_range, height: 76, color: "#FF8C00", desc: s.size_xl_desc },
    ];

    const humanDisplayHeight = 320;
    const scaleFactor = humanDisplayHeight / userHeight;
    const luggageDisplayHeight = (LUGGAGE_DATA[selectedSize].height + 15) * scaleFactor;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4 text-left">
            <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl animate-scale-up custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-10 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                    <X className="text-gray-500 w-5 h-5" />
                </button>

                <div className="p-6 md:p-10 bg-white">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 bg-bee-yellow rounded-2xl flex items-center justify-center shadow-lg text-bee-black">
                            <Ruler className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black italic text-bee-black">{s.header_title}</h4>
                            <p className="text-[10px] text-yellow-600 font-bold uppercase tracking-widest">{s.header_subtitle}</p>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12 items-center">
                        {/* 1. Simulator Visual Area */}
                        <div className="relative w-full lg:w-1/2 h-[450px] bg-white rounded-[32px] border border-gray-100 shadow-inner flex items-end justify-center pb-12 gap-8 overflow-hidden px-4">
                            <div className="absolute left-0 right-0 border-b border-dashed border-gray-200" style={{ bottom: `${humanDisplayHeight + 48}px` }}>
                                <span className="text-[10px] text-gray-400 ml-2">Head Line</span>
                            </div>

                            {/* Person Illustration */}
                            <motion.div
                                className="relative flex flex-col items-center flex-shrink-0"
                                style={{ height: humanDisplayHeight }}
                                animate={{ height: humanDisplayHeight }}
                                transition={{ type: "spring", stiffness: 100 }}
                            >
                                <div className="w-16 h-16 bg-gray-200 rounded-full mb-1" />
                                <div className="w-24 flex-1 bg-gray-200 rounded-t-[40px] relative">
                                    <div className="absolute bottom-0 w-full h-1/2 flex justify-around">
                                        <div className="w-8 h-full bg-gray-200 rounded-b-full border-r border-white/50" />
                                        <div className="w-8 h-full bg-gray-200 rounded-b-full" />
                                    </div>
                                </div>
                                <span className="absolute -bottom-8 text-[11px] font-bold text-gray-400 whitespace-nowrap">YOU ({userHeight}cm)</span>
                            </motion.div>

                            {/* Luggage Illustration */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedSize}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="relative flex flex-col items-center flex-shrink-0"
                                >
                                    <motion.div
                                        className="w-32 md:w-40 rounded-t-[24px] rounded-b-[12px] border-4 border-black relative shadow-2xl overflow-hidden group"
                                        style={{
                                            height: luggageDisplayHeight,
                                            backgroundColor: LUGGAGE_DATA[selectedSize].color
                                        }}
                                        transition={{ type: "spring", stiffness: 100 }}
                                    >
                                        <div className="absolute inset-x-2 top-2 bottom-2 border-2 border-black/10 rounded-xl" />
                                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-black/10" />
                                        <div className="absolute inset-x-0 top-1/4 h-1 bg-black/10" />
                                        <div className="absolute inset-x-0 bottom-1/4 h-1 bg-black/10" />
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-black rounded-t-lg" />
                                    </motion.div>
                                    <div className="flex gap-12 mt-[-4px]">
                                        <div className="w-4 h-4 bg-black rounded-full shadow-lg" />
                                        <div className="w-4 h-4 bg-black rounded-full shadow-lg" />
                                    </div>
                                    <span className="absolute -bottom-8 text-xs font-black text-black whitespace-nowrap">{LUGGAGE_DATA[selectedSize].label} SIZE</span>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* 2. Controls Area */}
                        <div className="w-full lg:w-1/2 space-y-8">
                            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-sm font-black text-bee-black">{s.height_label}</label>
                                    <div className="px-3 py-1 bg-bee-yellow rounded-full text-xs font-black shadow-sm text-bee-black">
                                        {userHeight} cm
                                    </div>
                                </div>
                                <input
                                    type="range" min="140" max="200" step="1"
                                    value={userHeight}
                                    onChange={(e) => setUserHeight(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-bee-yellow"
                                />
                                <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
                                    <span>140cm</span>
                                    <span>200cm</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {LUGGAGE_DATA.map((size, i) => (
                                    <button
                                        key={size.label}
                                        onClick={() => setSelectedSize(i)}
                                        className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between text-left group ${selectedSize === i ? "border-bee-yellow bg-yellow-50 shadow-md scale-[1.02]" : "border-gray-100 bg-white hover:border-yellow-200"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-white shadow-inner"
                                                style={{ backgroundColor: size.color }}
                                            >
                                                {size.label}
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-bee-black">{size.range}</p>
                                                <p className="text-[11px] text-gray-400 font-medium">{size.desc}</p>
                                            </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedSize === i ? "border-bee-yellow bg-bee-yellow" : "border-gray-200"
                                            }`}>
                                            {selectedSize === i && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full bg-bee-black p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-black/80 transition-all shadow-xl active:scale-95"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl animate-bounce">🐝</div>
                                    <div className="space-y-0.5 text-left">
                                        <p className="text-white group-hover:text-bee-yellow text-[11px] font-bold leading-tight">
                                            {s.hook_text.replace("{size}", LUGGAGE_DATA[selectedSize].label)}
                                        </p>
                                        <p className="text-gray-400 group-hover:text-white text-[10px] font-medium">{s.hook_sub}</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-bee-yellow group-hover:text-white w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-100 flex items-start gap-2 text-[10px] text-gray-400 font-medium">
                        <Info size={12} className="mt-0.5 flex-shrink-0" />
                        <p>{s.info_note}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
