import React from 'react';
import { Instagram, Facebook, Twitter, MapPin, Mail, Phone, ArrowUp } from 'lucide-react';

interface FooterProps {
  t: any;
  onTermsClick?: () => void;
  onPrivacyClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ t, onTermsClick, onPrivacyClick }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-bee-black py-24 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand & Social */}
          <div className="space-y-8">
            <div className="flex items-center gap-1">
              <span className="text-4xl font-black italic text-bee-yellow">bee</span>
              <span className="text-4xl font-black text-white">liber</span>
            </div>
            <p className="text-gray-400 font-medium leading-relaxed text-sm">
              {t.footer?.desc || "Experience the freedom of travel without baggage."}
            </p>
            <div className="flex gap-4">
              <a href="#" title="Instagram" aria-label="Instagram" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-bee-yellow hover:text-bee-black transition-all">
                <Instagram size={18} className="text-white hover:text-bee-black" />
              </a>
              <a href="#" title="Facebook" aria-label="Facebook" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-bee-yellow hover:text-bee-black transition-all">
                <Facebook size={18} className="text-white hover:text-bee-black" />
              </a>
              <a href="#" title="Twitter" aria-label="Twitter" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-bee-yellow hover:text-bee-black transition-all">
                <Twitter size={18} className="text-white hover:text-bee-black" />
              </a>
            </div>
          </div>

          {/* Service Links */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-white">{t.footer?.service || "Service"}</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><button title={t.footer?.home || "Home"} aria-label={t.footer?.home || "Home"} onClick={() => window.scrollTo(0, 0)} className="hover:text-bee-yellow transition-colors">{t.footer?.home || "Home"}</button></li>
              <li><button title={t.footer?.locations || "Branch Locations"} aria-label={t.footer?.locations || "Branch Locations"} className="hover:text-bee-yellow transition-colors">{t.footer?.locations || "Branch Locations"}</button></li>
              <li><button title={t.footer?.pricing || "Pricing"} aria-label={t.footer?.pricing || "Pricing"} className="hover:text-bee-yellow transition-colors">{t.footer?.pricing || "Pricing"}</button></li>
              <li><button title={t.footer?.pricing || "Pricing"} aria-label={t.footer?.pricing || "Pricing"} className="hover:text-bee-yellow transition-colors">{t.footer?.pricing || "Pricing"}</button></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-white">{t.footer?.legal || "Legal"}</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><button title={t.footer?.privacy || "Privacy Policy"} aria-label={t.footer?.privacy || "Privacy Policy"} onClick={onPrivacyClick} className="hover:text-bee-yellow transition-colors">{t.footer?.privacy || "Privacy Policy"}</button></li>
              <li><button title={t.footer?.terms || "Terms of Service"} aria-label={t.footer?.terms || "Terms of Service"} onClick={onTermsClick} className="hover:text-bee-yellow transition-colors">{t.footer?.terms || "Terms of Service"}</button></li>
              <li><button title={t.footer?.cookie || "Cookie Policy"} aria-label={t.footer?.cookie || "Cookie Policy"} className="hover:text-bee-yellow transition-colors">{t.footer?.cookie || "Cookie Policy"}</button></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-white">{t.footer?.contact || "Contact Us"}</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-bee-yellow shrink-0" />
                <span>{t.footer?.address || "Seoul Station Branch, 123 Han River Blvd, Seoul, South Korea"}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-bee-yellow shrink-0" />
                <a href={`mailto:${t.footer?.email || 'support@bee-liber.com'}`} title={t.footer?.email || 'support@bee-liber.com'} aria-label={`Email us at ${t.footer?.email || 'support@bee-liber.com'}`} className="hover:text-bee-yellow">
                  {t.footer?.email || 'support@bee-liber.com'}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-bee-yellow shrink-0" />
                <a href={`tel:${t.footer?.phone || '+82-2-1234-5678'}`} title={t.footer?.phone || '+82-2-1234-5678'} aria-label={`Call us at ${t.footer?.phone || '+82-2-1234-5678'}`} className="hover:text-bee-yellow">
                  {t.footer?.phone || '+82-2-1234-5678'}
                </a>
              </li>
            </ul>
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
            className="flex items-center gap-2 text-xs font-bold text-bee-yellow hover:text-white transition-colors"
          >
            {t.footer?.back_to_top || "Back to Top"} <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
