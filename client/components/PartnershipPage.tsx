
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Handshake,
  ArrowLeft,
  TrendingUp,
  Users,
  ShieldCheck,
  Globe,
  Send,
  CheckCircle2,
  ChevronRight,
  Building2,
  MessageSquare,
  Phone,
  MapPin
} from 'lucide-react';
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

    try {
      await StorageService.saveInquiry(newInquiry);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
      }, 1500);
    } catch (error) {
      console.error("Failed to save inquiry:", error);
      alert(t.booking.error_processing || "Retry later");
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const benefits = [
    { icon: <TrendingUp className="w-8 h-8" />, title: t.partnership.benefit1_t, desc: t.partnership.benefit1_d, color: "bg-blue-500/10 text-blue-600" },
    { icon: <Users className="w-8 h-8" />, title: t.partnership.benefit2_t, desc: t.partnership.benefit2_d, color: "bg-orange-500/10 text-orange-600" },
    { icon: <Globe className="w-8 h-8" />, title: t.partnership.benefit3_t, desc: t.partnership.benefit3_d, color: "bg-purple-500/10 text-purple-600" },
    { icon: <ShieldCheck className="w-8 h-8" />, title: t.partnership.benefit4_t, desc: t.partnership.benefit4_d, color: "bg-green-500/10 text-green-600" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none overflow-x-hidden">

      {/* 1. STICKY NAV */}
      <nav className="sticky top-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-black/5 px-6 md:px-12 py-5 flex justify-between items-center">
        <div className="flex items-center gap-1 cursor-pointer group" onClick={onBack}>
          <div className="w-8 h-8 bg-bee-yellow rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Handshake size={18} className="text-black" />
          </div>
          <span className="text-xl font-black italic text-bee-yellow ml-1">bee</span>
          <span className="text-xl font-black text-bee-black">liber</span>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          <ArrowLeft size={14} /> {t.partnership.back}
        </button>
      </nav>

      <main className="flex-1">

        {/* 2. HERO SECTION */}
        <section className="relative pt-20 pb-24 px-6 overflow-hidden">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10"
            >
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block px-4 py-1.5 rounded-full bg-bee-yellow/10 border border-bee-yellow/20 text-[10px] font-black tracking-[0.3em] text-bee-yellow uppercase mb-10 shadow-sm"
              >
                {t.partnership.hero_badge || "Global Partnership"}
              </motion.span>

              <h1 className="text-6xl md:text-[92px] font-black leading-[1.0] tracking-tighter mb-10 text-black whitespace-pre-line drop-shadow-sm">
                {t.partnership.hero_title}
              </h1>

              <p className="text-xl md:text-2xl text-black/40 font-bold leading-relaxed mb-16 max-w-xl">
                {t.partnership.hero_desc}
              </p>

              <div className="flex flex-wrap gap-5">
                <div className="flex items-center gap-3 px-6 py-4 rounded-3xl bg-gray-50 border border-black/5 shadow-sm hover:shadow-md transition-shadow">
                  <CheckCircle2 className="text-bee-yellow w-6 h-6" />
                  <span className="text-sm font-black text-black/60 uppercase tracking-tight">Worldwide Network</span>
                </div>
                <div className="flex items-center gap-3 px-6 py-4 rounded-3xl bg-gray-50 border border-black/5 shadow-sm hover:shadow-md transition-shadow">
                  <CheckCircle2 className="text-bee-yellow w-6 h-6" />
                  <span className="text-sm font-black text-black/60 uppercase tracking-tight">AI Driven Platform</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "backOut" }}
              className="relative aspect-square lg:aspect-[4/5] rounded-[4rem] md:rounded-[6rem] overflow-hidden shadow-[0_80px_160px_-40px_rgba(0,0,0,0.2)] group"
            >
              <img
                src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80"
                alt="Partnership Hero"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3000ms]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-16 left-16 right-16">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex items-center gap-6 p-8 bg-white/10 backdrop-blur-3xl rounded-[3rem] border border-white/20 shadow-2xl"
                >
                  <div className="w-16 h-16 bg-bee-yellow rounded-2xl flex items-center justify-center shadow-xl">
                    <TrendingUp size={32} className="text-black" />
                  </div>
                  <div>
                    <div className="text-white text-2xl font-black tracking-tight mb-1">{t.partnership.benefit1_t}</div>
                    <div className="text-white/40 text-sm font-bold uppercase tracking-widest">Growth with Beeliber</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[1000px] h-[1000px] bg-bee-yellow/10 rounded-full blur-[160px] -z-10" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[140px] -z-10" />
        </section>

        {/* 3. BENEFITS GRID */}
        <section className="py-32 px-6 bg-gray-50/80">
          <div className="max-w-[1400px] mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-24"
            >
              <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-6">{t.partnership.benefits_title}</h2>
              <div className="w-24 h-2 bg-bee-yellow mx-auto rounded-full shadow-lg" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {benefits.map((benefit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.6 }}
                  className="bg-white p-12 rounded-[3.5rem] shadow-[0_4px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] hover:-translate-y-4 transition-all duration-500 group"
                >
                  <div className={`w-20 h-20 ${benefit.color} rounded-[2rem] flex items-center justify-center mb-10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500`}>
                    {benefit.icon}
                  </div>
                  <h3 className="text-2xl font-black mb-6 text-black tracking-tight">{benefit.title}</h3>
                  <p className="text-black/40 text-base font-bold leading-relaxed px-2">
                    {benefit.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. PREMIUM FORM SECTION */}
        <section className="py-40 px-6">
          <div className="max-w-6xl mx-auto">

            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success-card"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="bg-bee-yellow rounded-[5rem] p-20 md:p-32 shadow-[0_80px_160px_-40px_rgba(255,203,5,0.4)] text-center relative overflow-hidden"
                >
                  <div className="relative z-10 text-bee-black">
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-12 shadow-2xl"
                    >
                      <Handshake size={64} />
                    </motion.div>
                    <h2 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-none">{t.partnership.success}</h2>
                    <p className="text-2xl font-bold opacity-60 mb-16 max-w-2xl mx-auto">
                      {t.partnership.successSub}
                    </p>
                    <button
                      onClick={onBack}
                      className="group px-16 py-7 bg-black text-bee-yellow font-black text-xl rounded-[2.5rem] hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-4 mx-auto"
                    >
                      {t.partnership.back_to_main}
                      <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/10 skew-y-12 scale-150 rounded-full blur-[80px]" />
                </motion.div>
              ) : (
                <motion.div
                  key="form-container"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-24"
                >
                  <div className="text-center">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className="text-5xl md:text-[100px] font-black text-black tracking-tighter mb-8 italic leading-none"
                    >
                      {t.partnership.form_title}
                    </motion.h2>
                    <p className="text-black/40 text-xl font-bold uppercase tracking-widest">
                      {t.partnership.subtitle}
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="bg-gray-50/50 p-10 md:p-32 rounded-[6rem] border border-black/5 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.08)] space-y-16"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16">

                      {/* Company Name */}
                      <div className="space-y-5">
                        <label className="flex items-center gap-3 text-[11px] font-black uppercase text-black/30 tracking-[0.3em] ml-4">
                          <Building2 size={14} /> {t.partnership.company}
                        </label>
                        <input
                          type="text" name="companyName" value={formData.companyName} onChange={handleChange}
                          placeholder="e.g. Grand Seoul Hotel"
                          className="w-full bg-white border-2 border-transparent rounded-[2.5rem] py-8 px-10 font-black text-black text-lg shadow-sm focus:bg-white focus:border-bee-yellow focus:ring-8 focus:ring-bee-yellow/10 outline-none transition-all placeholder:text-black/10"
                          required
                        />
                      </div>

                      {/* Contact */}
                      <div className="space-y-5">
                        <label className="flex items-center gap-3 text-[11px] font-black uppercase text-black/30 tracking-[0.3em] ml-4">
                          <Phone size={14} /> {t.partnership.contact}
                        </label>
                        <input
                          type="text" name="contact" value={formData.contact} onChange={handleChange}
                          placeholder="010-0000-0000"
                          className="w-full bg-white border-2 border-transparent rounded-[2.5rem] py-8 px-10 font-black text-black text-lg shadow-sm focus:bg-white focus:border-bee-yellow focus:ring-8 focus:ring-bee-yellow/10 outline-none transition-all placeholder:text-black/10"
                          required
                        />
                      </div>

                      {/* Location */}
                      <div className="space-y-5">
                        <label className="flex items-center gap-3 text-[11px] font-black uppercase text-black/30 tracking-[0.3em] ml-4">
                          <MapPin size={14} /> {t.partnership.location}
                        </label>
                        <input
                          type="text" name="location" value={formData.location} onChange={handleChange}
                          placeholder="Seoul, Myeong-dong"
                          className="w-full bg-white border-2 border-transparent rounded-[2.5rem] py-8 px-10 font-black text-black text-lg shadow-sm focus:bg-white focus:border-bee-yellow focus:ring-8 focus:ring-bee-yellow/10 outline-none transition-all placeholder:text-black/10"
                        />
                      </div>

                      {/* Business Type */}
                      <div className="space-y-5">
                        <label className="flex items-center gap-3 text-[11px] font-black uppercase text-black/30 tracking-[0.3em] ml-4">
                          <TrendingUp size={14} /> {t.partnership.businessType}
                        </label>
                        <input
                          type="text" name="businessType" value={formData.businessType} onChange={handleChange}
                          placeholder="Hotel / Travel Agency / Cafe"
                          className="w-full bg-white border-2 border-transparent rounded-[2.5rem] py-8 px-10 font-black text-black text-lg shadow-sm focus:bg-white focus:border-bee-yellow focus:ring-8 focus:ring-bee-yellow/10 outline-none transition-all placeholder:text-black/10"
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-5">
                      <label className="flex items-center gap-3 text-[11px] font-black uppercase text-black/30 tracking-[0.3em] ml-4">
                        <MessageSquare size={14} /> {t.partnership.message}
                      </label>
                      <textarea
                        name="message" value={formData.message} onChange={handleChange}
                        placeholder={t.partnership.message_placeholder}
                        className="w-full bg-white border-2 border-transparent rounded-[3rem] py-10 px-10 font-bold text-black text-lg shadow-sm focus:bg-white focus:border-bee-yellow focus:ring-8 focus:ring-bee-yellow/10 outline-none transition-all min-h-[300px] placeholder:text-black/10 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group w-full py-10 bg-black text-bee-yellow font-black text-3xl rounded-[3.5rem] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] flex items-center justify-center gap-6 relative overflow-hidden"
                    >
                      <AnimatePresence mode="wait">
                        {isSubmitting ? (
                          <motion.div
                            key="loader"
                            initial={{ rotate: 0 }}
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          >
                            <div className="w-10 h-10 border-[6px] border-bee-yellow/20 border-t-bee-yellow rounded-full shadow-lg" />
                          </motion.div>
                        ) : (
                          <motion.div key="btn-content" className="flex items-center gap-6">
                            <Send className="w-8 h-8 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500" />
                            {t.partnership.submit}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-1000 pointer-events-none" />
                    </button>

                    <p className="text-center text-[10px] font-black text-black/10 uppercase tracking-[0.5em] pt-10">
                      Beeliber Global Partner Network © 2026
                    </p>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* 5. VISIONARY FOOTER */}
        <section className="pb-48 px-6 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto py-24 border-t border-black/5"
          >
            <Handshake size={48} className="mx-auto text-bee-yellow mb-10 opacity-30" />
            <blockquote className="text-3xl md:text-5xl font-black italic text-black/30 leading-tight mb-12 tracking-tighter">
              "Expanding the horizons of travel, together with Beeliber."
            </blockquote>
            <div className="flex items-center justify-center gap-6">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center opacity-70 border border-black/5">
                <Handshake size={24} />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.3em] text-black/20">Beeliber Strategic Alliance</span>
            </div>
          </motion.div>
        </section>

      </main>

      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default PartnershipPage;
