
import React, { useState } from 'react';
import { BookingState, BookingStatus } from '../types';
import { StorageService } from '../services/storageService';
import { motion, AnimatePresence } from 'framer-motion';

const TrackingWidget: React.FC<{ t: any; onClose?: () => void; isModal?: boolean }> = ({ t, onClose, isModal = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [results, setResults] = useState<BookingState[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!name.trim() || !email.trim()) {
      alert(t.booking?.alert_fill_info || "이름과 이메일을 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      // 기존 이메일 단독 조회에서 이름+이메일 복합 조회로 변경 (보안 강화)
      const userBookings = await StorageService.searchBookingsByNameAndEmail(name, email);
      // 최신순 정렬
      userBookings.sort((a, b) => new Date(b.createdAt || b.pickupDate || '').getTime() - new Date(a.createdAt || a.pickupDate || '').getTime());

      setResults(userBookings);
      setHasSearched(true);
    } catch (error) {
      console.error(error);
      alert(t.common?.error_msg || (lang === 'ko' ? "조회 중 오류가 발생했습니다." : "An error occurred during search."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const Content = (
    <div className={`relative ${isModal ? 'w-full' : 'max-w-6xl mx-auto px-6 relative z-10'}`}>
      {isModal && (
        <button
          title="Close Tracking"
          aria-label="Close Tracking"
          onClick={onClose}
          className="absolute -top-2 -right-2 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-50"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      )}

      <div className={`text-center ${isModal ? 'mb-8' : 'mb-12 animate-fade-in'}`}>
        <h2 className={`${isModal ? 'text-2xl' : 'text-3xl md:text-4xl'} font-black text-white mb-4 tracking-tight`}>{t.tracking?.title}</h2>
        <p className="text-gray-400 font-medium text-sm md:text-base">{t.tracking?.desc}</p>
      </div>

      <div className={`${isModal ? 'w-full' : 'max-w-4xl mx-auto'} bg-white/5 border border-white/10 p-3 rounded-[2rem] flex flex-col md:flex-row gap-3 mb-8 backdrop-blur-sm`}>
        <div className="flex-1 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-bee-yellow transition-colors">
              <i className="fa-solid fa-user"></i>
            </div>
            <input
              type="text"
              title="User Name"
              placeholder={t.tracking?.name_placeholder || t.booking?.name || "Name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:bg-white/10 focus:border-bee-yellow/50 placeholder:text-gray-600 font-bold transition-all text-sm"
            />
          </div>
          <div className="flex-1 relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-bee-yellow transition-colors">
              <i className="fa-solid fa-envelope"></i>
            </div>
            <input
              type="email"
              title="Email Address"
              placeholder={t.tracking?.placeholder || "Email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:bg-white/10 focus:border-bee-yellow/50 placeholder:text-gray-600 font-bold transition-all text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading}
          title="Search Booking"
          aria-label="Search Booking"
          className="md:w-auto w-full bg-bee-yellow hover:bg-yellow-400 text-bee-black px-8 py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.1)] hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap text-sm"
        >
          {isLoading ? (
            <i className="fa-solid fa-circle-notch animate-spin"></i>
          ) : (
            <i className="fa-solid fa-magnifying-glass"></i>
          )}
          {t.tracking?.btn || "Search"}
        </button>
      </div>

      <AnimatePresence>
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`space-y-4 ${isModal ? 'max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar' : ''}`}
          >
            {results && results.length > 0 ? (
              results.map((booking, idx) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${booking.serviceType === 'DELIVERY' ? 'bg-bee-yellow text-bee-black' : 'bg-bee-blue text-white'}`}>
                        <i className={`fa-solid ${booking.serviceType === 'DELIVERY' ? 'fa-truck-fast' : 'fa-warehouse'}`}></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">{booking.id}</span>
                          <span className="text-[9px] font-black text-bee-yellow uppercase tracking-widest">{booking.serviceType}</span>
                        </div>
                        <h3 className="text-base font-bold text-white group-hover:text-bee-yellow transition-colors cursor-pointer">
                          {booking.pickupDate} <span className="text-white/50 text-xs font-normal">| {booking.pickupTime}</span>
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-xs font-bold text-white/60 truncate max-w-[60%]">
                        {booking.pickupLocation}
                        {booking.serviceType === 'DELIVERY' && <i className="fa-solid fa-arrow-right mx-2 text-bee-yellow/50"></i>}
                        {booking.serviceType === 'DELIVERY' && booking.dropoffLocation}
                      </span>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black ${booking.status === BookingStatus.CANCELLED ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        booking.status === BookingStatus.COMPLETED ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          'bg-bee-yellow text-bee-black shadow-[0_0_15px_rgba(255,215,0,0.3)]'
                        }`}>
                        {(t.status_mapping && booking.status && t.status_mapping[booking.status])
                          ? t.status_mapping[booking.status]
                          : booking.status}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-sm">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-magnifying-glass text-xl text-gray-500"></i>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t.tracking?.noResult || (lang === 'ko' ? "조회된 예약이 없습니다." : "No bookings found.")}</h3>
                <p className="text-gray-500 text-xs">{t.tracking?.check_info || (lang === 'ko' ? "입력하신 정보가 정확한지 다시 한 번 확인해주세요." : "Please double-check your information.")}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (isModal) return Content;

  return (
    <section id="tracking" className="py-24 bg-[#0b0a14] relative overflow-hidden">
      {Content}
    </section>
  );
};

export default TrackingWidget;
