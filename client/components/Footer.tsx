import React from 'react';
import { MapPin, Mail, Phone, ArrowUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface FooterProps {
  t: any;
  onNavigate?: (view: any) => void;
}

const SUPPORTED_URL_LANGS = new Set(['ko', 'en', 'zh', 'zh-tw', 'zh-hk', 'ja']);

const Footer: React.FC<FooterProps> = ({ t, onNavigate }) => {
  const location = useLocation();
  const firstSegment = location.pathname.split('/').filter(Boolean)[0]?.toLowerCase() || '';
  const currentLang = SUPPORTED_URL_LANGS.has(firstSegment) ? firstSegment : '';

  if (!currentLang) {
    return null;
  }

  const buildHref = (suffix = '') => `/${currentLang}${suffix}`;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-bee-black py-16 md:py-24 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-8">
          {/* Brand & Social */}
          <div className="space-y-6 md:space-y-8 flex flex-col items-center md:items-start md:w-1/3">
            <div className="flex items-center gap-1">
              <span className="text-4xl font-black text-white">bee</span>
              <span className="text-4xl font-black text-bee-yellow italic pr-1">liber</span>
            </div>
            <p className="text-gray-400 font-medium leading-relaxed text-sm text-center md:text-left">
              {t.footer?.desc || "Experience the freedom of travel without baggage."}
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              <a href="https://www.instagram.com/beeliber" target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram" className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center hover:bg-bee-yellow group transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white group-hover:text-bee-black transition-colors">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
                </svg>
              </a>
              <a href="https://www.threads.net/@beeliber" target="_blank" rel="noopener noreferrer" title="Threads" aria-label="Threads" className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center hover:bg-bee-yellow group transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white group-hover:text-bee-black transition-colors">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="none"/>
                  <path d="M16.5 10.5c-.28-.42-.65-.77-1.1-1.02-.9-.5-2.1-.6-3.15-.15-.55.23-1.02.6-1.37 1.07-.36.47-.57 1.03-.6 1.6-.03.57.12 1.14.43 1.62.31.48.76.85 1.29 1.05.53.2 1.12.22 1.67.06.54-.16 1.02-.5 1.35-.96.33-.46.49-1.01.46-1.57m-4.3 2.85c-.58-.28-1-.8-1.15-1.42-.15-.62-.04-1.28.3-1.82.34-.54.88-.93 1.5-1.07.62-.14 1.28-.01 1.8.36" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.5 7.5c0 0 .5 4 1 5.5s2 4 4.5 4c1.5 0 2.5-.5 3-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.5 8c0 0-.5-1.5-2-2s-3.5-.5-5 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Service, Legal, Contact Links Container designed to be horizontal */}
          <div className="flex flex-row justify-between md:justify-end gap-x-8 gap-y-12 md:gap-x-16 flex-wrap md:flex-nowrap md:w-2/3">
            {/* Service Links */}
            <div className="space-y-4 md:space-y-6 flex-1 min-w-[120px]">
              <h3 className="font-bold text-lg md:text-xl text-white tracking-tight">{t.footer?.service || "Service"}</h3>
              <ul className="space-y-0 text-sm md:text-base text-gray-400">
                <li><a href={buildHref()} onClick={(e) => { e.preventDefault(); scrollToTop(); onNavigate?.('USER'); }} className="block py-2 hover:text-bee-yellow transition-colors">{t.footer?.home || "Home"}</a></li>
                <li><a href={buildHref('/locations')} onClick={(e) => { e.preventDefault(); scrollToTop(); onNavigate?.('LOCATIONS'); }} className="block py-2 hover:text-bee-yellow transition-colors">{t.footer?.locations || "Branch Locations"}</a></li>
                <li><a href={buildHref('/services')} onClick={(e) => { e.preventDefault(); scrollToTop(); onNavigate?.('SERVICES'); }} className="block py-2 hover:text-bee-yellow transition-colors">{t.footer?.pricing || "Pricing"}</a></li>
                <li><a href={buildHref('/qna')} onClick={(e) => { e.preventDefault(); scrollToTop(); onNavigate?.('QNA'); }} className="block py-2 hover:text-bee-yellow transition-colors">{t.footer?.tips || "Travel Tips"}</a></li>
                <li><a href={buildHref('/vision')} onClick={(e) => { e.preventDefault(); scrollToTop(); onNavigate?.('VISION'); }} className="block py-2 hover:text-bee-yellow transition-colors">Brand Vision</a></li>
                <li><a href={buildHref('/qna')} onClick={(e) => { e.preventDefault(); scrollToTop(); onNavigate?.('QNA'); }} className="block py-2 hover:text-bee-yellow transition-colors">Q&A</a></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="space-y-4 md:space-y-6 flex-1 min-w-[120px]">
              <h3 className="font-bold text-lg md:text-xl text-white tracking-tight">{t.footer?.legal || "Legal"}</h3>
              <ul className="space-y-0 text-sm md:text-base text-gray-400">
                <li><a href={buildHref('/privacy')} onClick={(e) => { e.preventDefault(); scrollToTop(); onNavigate?.('PRIVACY'); }} className="block py-2 hover:text-bee-yellow transition-colors">{t.footer?.privacy || "Privacy Policy"}</a></li>
                <li><a href={buildHref('/terms')} onClick={(e) => { e.preventDefault(); scrollToTop(); onNavigate?.('TERMS'); }} className="block py-2 hover:text-bee-yellow transition-colors">{t.footer?.terms || "Terms of Service"}</a></li>
                <li><a href={buildHref('/refund')} onClick={(e) => { e.preventDefault(); scrollToTop(); onNavigate?.('REFUND'); }} className="block py-2 hover:text-bee-yellow transition-colors">{t.footer?.refund || "Refund Policy"}</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4 md:space-y-6 flex-[2] min-w-[200px]">
              <h3 className="font-bold text-lg md:text-xl text-white tracking-tight">{t.footer?.contact || "Contact Us"}</h3>
              <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-400">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-bee-yellow shrink-0" />
                  <span>{t.footer?.address || "Seoul Station Branch, 123 Han River Blvd, Seoul, South Korea"}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-bee-yellow shrink-0" />
                  <a href={`mailto:${t.footer?.email || 'support@bee-liber.com'}`} title={t.footer?.email || 'support@bee-liber.com'} aria-label={`Email us at ${t.footer?.email || 'support@bee-liber.com'}`} className="block py-2 hover:text-bee-yellow">
                    {t.footer?.email || 'support@bee-liber.com'}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-bee-yellow shrink-0" />
                  <a href={`tel:${t.footer?.phone || '+82-2-1234-5678'}`} title={t.footer?.phone || '+82-2-1234-5678'} aria-label={`Call us at ${t.footer?.phone || '+82-2-1234-5678'}`} className="block py-2 hover:text-bee-yellow">
                    {t.footer?.phone || '+82-2-1234-5678'}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Beeliber Co., Ltd. All rights reserved.
          </p>
          <button
            onClick={scrollToTop}
            title={t.footer?.back_to_top || "Back to Top"}
            aria-label={t.footer?.back_to_top || "Back to Top"}
            className="flex items-center gap-2 text-xs font-bold text-bee-yellow hover:text-white transition-colors py-3 px-2"
          >
            {t.footer?.back_to_top || "Back to Top"} <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
