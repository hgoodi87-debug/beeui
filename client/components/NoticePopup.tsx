
import React, { useState, useEffect } from 'react';
import { SystemNotice } from '../types';

interface NoticePopupProps {
  t: any;
}

const NoticePopup: React.FC<NoticePopupProps> = ({ t }) => {
  const [notice, setNotice] = useState<SystemNotice | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Get notice data from localStorage
    const savedNotice = localStorage.getItem('beeliber_notice');
    if (savedNotice) {
      const parsedNotice: SystemNotice = JSON.parse(savedNotice);

      // 2. Check if notice is active and has content
      if (parsedNotice.isActive && (parsedNotice.imageUrl || parsedNotice.content)) {
        
        // 3. Check "Don't show today" flag
        const hideDate = localStorage.getItem('beeliber_notice_hidden_date');
        const today = new Date().toISOString().split('T')[0];

        if (hideDate !== today) {
          setNotice(parsedNotice);
          setIsOpen(true);
        }
      }
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDontShowToday = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('beeliber_notice_hidden_date', today);
    setIsOpen(false);
  };

  if (!isOpen || !notice) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden max-w-md w-full flex flex-col animate-zoom-in relative">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-bee-light">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-bee-yellow animate-pulse"></span>
            <span className="font-black text-bee-black text-sm uppercase tracking-widest">
              {t.notice?.title || 'NOTICE'}
            </span>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-gray-400 hover:text-bee-black transition-all">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          {notice.imageUrl && (
            <div className="w-full">
               <img src={notice.imageUrl} alt="Notice" className="w-full h-auto object-cover" />
            </div>
          )}
          {notice.content && (
            <div className="p-8">
               <p className="text-bee-black whitespace-pre-wrap leading-relaxed font-medium">
                 {notice.content}
               </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center gap-4">
          <button 
            onClick={handleDontShowToday}
            className="text-xs font-bold text-gray-400 hover:text-bee-black transition-all flex items-center gap-2 px-2"
          >
            <i className="fa-regular fa-calendar-xmark"></i>
            {t.notice?.dont_show_today || "Don't show today"}
          </button>
          
          <button 
            onClick={handleClose} 
            className="px-8 py-3 bg-bee-black text-white rounded-xl text-sm font-black hover:bg-gray-800 transition-all shadow-lg"
          >
            {t.notice?.close || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticePopup;
