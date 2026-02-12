
import React, { useState, useEffect } from 'react';
import { PartnershipInquiry } from '../types';
import { StorageService } from '../services/storageService';

interface PartnershipPageProps {
  onBack: () => void;
  t: any;
}

const PartnershipPage: React.FC<PartnershipPageProps> = ({ onBack, t }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    contact: '',
    location: '',
    businessType: '',
    message: ''
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contact) {
      alert(t.partnership.alert_fill);
      return;
    }
    setIsSubmitting(true);

    const newInquiry: PartnershipInquiry = {
      id: `PQ-${Date.now()}`,
      ...formData,
      createdAt: new Date().toISOString()
    };

    await StorageService.saveInquiry(newInquiry);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-bee-light flex flex-col font-sans">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-1 cursor-pointer" onClick={onBack}>
          <span className="text-2xl font-black italic text-bee-yellow">bee</span>
          <span className="text-2xl font-black text-bee-black">liber</span>
        </div>
        <button onClick={onBack} className="text-sm font-bold text-bee-grey hover:text-bee-black">
          <i className="fa-solid fa-arrow-left mr-2"></i> {t.partnership.back}
        </button>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 md:py-24">
        {isSuccess ? (
          <div className="bg-white rounded-[40px] p-12 md:p-20 shadow-2xl text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-bee-yellow rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-yellow-100">
              <i className="fa-solid fa-handshake text-bee-black text-3xl"></i>
            </div>
            <h1 className="text-4xl font-black text-bee-black mb-4 tracking-tight">{t.partnership.success}</h1>
            <p className="text-bee-grey text-lg font-medium leading-relaxed mb-10">
              {t.partnership.successSub}
            </p>
            <button onClick={onBack} className="px-10 py-4 bg-bee-black text-bee-yellow font-black rounded-2xl hover:scale-105 transition-all">
              {t.partnership.back_to_main}
            </button>
          </div>
        ) : (
          <div className="space-y-12 animate-fade-in-up">
            <div className="text-center">
              <h1 className="text-5xl font-black text-bee-black mb-4 tracking-tighter italic">{t.partnership.title}</h1>
              <p className="text-bee-grey text-lg font-medium">{t.partnership.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-2">{t.partnership.company}</label>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Beeliber Co., Ltd." className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 font-bold focus:border-bee-yellow outline-none transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-2">{t.partnership.contact}</label>
                  <input type="text" name="contact" value={formData.contact} onChange={handleChange} placeholder="010-0000-0000" className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 font-bold focus:border-bee-yellow outline-none transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-2">{t.partnership.location}</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Seoul, Myeong-dong" className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 font-bold focus:border-bee-yellow outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-2">{t.partnership.businessType}</label>
                  <input type="text" name="businessType" value={formData.businessType} onChange={handleChange} placeholder="Hotel / Travel Agency" className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 font-bold focus:border-bee-yellow outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-2">{t.partnership.message}</label>
                <textarea name="message" value={formData.message} onChange={handleChange} placeholder={t.partnership.message_placeholder} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 font-medium focus:border-bee-yellow outline-none transition-all min-h-[200px]" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-bee-black text-bee-yellow font-black text-xl rounded-3xl hover:shadow-2xl transition-all shadow-xl flex items-center justify-center gap-3">
                {isSubmitting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                {t.partnership.submit}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default PartnershipPage;
