import React from 'react';
import { Instagram, Facebook, Twitter, MapPin, Mail, Phone, ArrowUp } from 'lucide-react';

interface FooterProps {
  t: any;
  onNavigate?: (view: any) => void;
}

const Footer: React.FC<FooterProps> = ({ t, onNavigate }) => {
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
              <span className="text-4xl font-black italic text-bee-yellow">bee</span>
              <span className="text-4xl font-black text-white">liber</span>
            </div>
            <p className="text-gray-400 font-medium leading-relaxed text-sm text-center md:text-left">
              {t.footer?.desc || "Experience the freedom of travel without baggage."}
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
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

          {/* Service, Legal, Contact Links Container designed to be horizontal */}
          <div className="flex flex-row justify-between md:justify-end gap-x-8 gap-y-12 md:gap-x-16 flex-wrap md:flex-nowrap md:w-2/3">
            {/* Service Links */}
            <div className="space-y-4 md:space-y-6 flex-1 min-w-[120px]">
              <h3 className="font-bold text-lg text-white">{t.footer?.service || "Service"}</h3>
              <ul className="space-y-3 md:space-y-4 text-sm text-gray-400">
                <li><button onClick={() => { scrollToTop(); onNavigate?.('USER'); }} className="hover:text-bee-yellow transition-colors">{t.footer?.home || "Home"}</button></li>
                <li><button onClick={() => { scrollToTop(); onNavigate?.('LOCATIONS'); }} className="hover:text-bee-yellow transition-colors">{t.footer?.locations || "Branch Locations"}</button></li>
                <li><button onClick={() => { scrollToTop(); onNavigate?.('SERVICES'); }} className="hover:text-bee-yellow transition-colors">{t.footer?.pricing || "Pricing"}</button></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="space-y-4 md:space-y-6 flex-1 min-w-[120px]">
              <h3 className="font-bold text-lg text-white">{t.footer?.legal || "Legal"}</h3>
              <ul className="space-y-3 md:space-y-4 text-sm text-gray-400">
                <li><button onClick={() => { scrollToTop(); onNavigate?.('PRIVACY'); }} className="hover:text-bee-yellow transition-colors">{t.footer?.privacy || "Privacy Policy"}</button></li>
                <li><button onClick={() => { scrollToTop(); onNavigate?.('TERMS'); }} className="hover:text-bee-yellow transition-colors">{t.footer?.terms || "Terms of Service"}</button></li>
                <li><button onClick={() => { scrollToTop(); onNavigate?.('ADMIN_LOGIN'); }} className="hover:text-bee-yellow transition-colors">{t.footer?.admin || "Admin Portal"}</button></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4 md:space-y-6 flex-[2] min-w-[200px]">
              <h3 className="font-bold text-lg text-white">{t.footer?.contact || "Contact Us"}</h3>
              <ul className="space-y-3 md:space-y-4 text-sm text-gray-400">
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
