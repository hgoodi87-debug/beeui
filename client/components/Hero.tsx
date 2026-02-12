
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { StorageTier } from '../types';
import './Hero.css';

interface HeroProps {
  onStorageClick?: () => void;
  t: any;
  lang: string;
}

const DEFAULT_HERO_IMAGE = "/hero_main.jpg";

const ReviewCount: React.FC<{ start: number; end: number }> = ({ start, end }) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 2000;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentCount = Math.floor(progress * (end - start) + start);
      setCount(currentCount);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [start, end]);

  return <span>{count.toLocaleString()}</span>;
};

const ReviewSlider: React.FC<{ reviews: { name: string; text: string }[] }> = ({ reviews }) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (!reviews || reviews.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % reviews.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [reviews?.length]);

  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="h-10 overflow-hidden relative w-full">
      {reviews.map((review, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-all duration-700 flex items-center gap-2 ${idx === currentIdx ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
        >
          <span className="text-[15px] font-black text-bee-black/30 w-12">{review.name}</span>
          <span className="text-[15px] font-black text-bee-black truncate flex-1">"{review.text}"</span>
        </div>
      ))}
    </div>
  );
};

const Hero: React.FC<HeroProps> = ({ onStorageClick, t, lang }) => {
  const [heroConfig, setHeroConfig] = useState<{ desktop: string; mobile: string | null; videoUrl?: string; reviewCount: number }>({
    desktop: DEFAULT_HERO_IMAGE,
    mobile: DEFAULT_HERO_IMAGE,
    videoUrl: undefined,
    reviewCount: 3840
  });
  const [startPrice, setStartPrice] = useState<number | null>(null);

  const getDirectVideoUrl = (url?: string) => {
    if (!url) return "";
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/file\/d\/([^\/]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}&confirm=t`;
      }
    }
    return url;
  };

  useEffect(() => {
    // 1. Load initial fallback from localStorage
    const savedHero = localStorage.getItem('beeliber_hero_config');
    if (savedHero) {
      try {
        const config = JSON.parse(savedHero);
        if (config.imageUrl) {
          setHeroConfig(prev => ({
            ...prev,
            desktop: config.imageUrl,
            mobile: config.mobileImageUrl || null,
            videoUrl: getDirectVideoUrl(config.videoUrl) || prev.videoUrl,
            reviewCount: config.reviewCount || 3840
          }));
        }
      } catch (e) {
        console.error("Failed to load hero config", e);
      }
    }

    // 2. Subscribe to Firestore for real-time updates
    const unsubscribe = StorageService.subscribeHeroConfig((config) => {
      if (config) {
        setHeroConfig({
          desktop: config.imageUrl || DEFAULT_HERO_IMAGE,
          mobile: config.mobileImageUrl || null,
          videoUrl: getDirectVideoUrl(config.videoUrl),
          reviewCount: config.reviewCount || 3840
        });
      }
    });

    const loadPrices = async () => {
      try {
        const tiers = await StorageService.getStorageTiers();
        if (tiers && tiers.length > 0) {
          setStartPrice(tiers[0].prices.S);
        }
      } catch (e) {
        console.error("Failed to load start price", e);
      }
    };
    loadPrices();

    return () => unsubscribe();
  }, []);

  const handleStorageClick = () => {
    if (onStorageClick) {
      onStorageClick();
    } else {
      const element = document.getElementById('booking');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.dispatchEvent(new CustomEvent('switch-booking-mode', { detail: 'STORAGE' }));
      }
    }
  };


  return (
    <div className="relative pt-24 pb-20 md:pt-40 md:pb-32 bg-transparent overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,203,5,0.05),transparent_70%)]"></div>

      <div className="max-w-4xl mx-auto px-6 text-center space-y-12 md:space-y-16 relative z-10">
        {/* Top Label */}
        <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-bee-yellow/10 rounded-full border border-bee-yellow/20 animate-fade-in mx-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bee-yellow opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-bee-yellow"></span>
          </span>
          <span className="text-[10px] md:text-xs font-black text-bee-black uppercase tracking-[0.2em]">{t.hero.trust_badge}</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-6 md:space-y-8">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-bee-black leading-[1.1] tracking-tighter">
            <span className="block opacity-0 animate-fade-in-up hero-animation-delay-1">
              {t.hero.title1}
            </span>
            <span
              className="block text-bee-yellow italic opacity-0 animate-fade-in-up mt-2 relative inline-block shrink-0 hero-animation-delay-2"
            >
              <span className="relative z-10">{t.hero.title2}</span>
              <span className="absolute -bottom-2 left-0 w-full h-3 md:h-4 bg-bee-yellow/20 -z-10 rounded-full"></span>
            </span>
          </h1>
          <p className="text-base md:text-xl text-bee-black/70 font-bold leading-relaxed max-w-2xl mx-auto animate-fade-in-up break-keep hero-animation-delay-4">
            {t.hero.subtitle}
          </p>
        </div>

        {/* Simplified CTA Button */}
        <div className="flex justify-center pt-4 animate-fade-in-up hero-animation-delay-6">
          <button
            title="Book a Branch"
            aria-label="Book a Branch"
            onClick={onStorageClick}
            className="group relative px-10 py-5 bg-bee-black text-white rounded-2xl md:rounded-[32px] font-black text-lg md:text-xl tracking-widest overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:scale-[1.05] active:scale-95 transition-all duration-300"
          >
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-bee-yellow translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <div className="flex items-center gap-4">
              <i className="fa-solid fa-map-location-dot text-bee-yellow text-2xl group-hover:scale-110 transition-transform"></i>
              <span>{t.hero.book_branch || '지점 예약 (지도)'}</span>
            </div>
          </button>
        </div>

        {/* Trust Indicator */}
        <div className="pt-12 border-t border-gray-100 animate-fade-in hero-animation-delay-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex -space-x-3">
              {[15, 20, 32, 45].map(id => (
                <img key={id} src={`https://i.pravatar.cc/100?img=${id}`} alt="User" className="w-10 h-10 rounded-full border-4 border-white shadow-sm" />
              ))}
            </div>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              <span className="text-bee-black">{heroConfig.reviewCount.toLocaleString()}+</span> {t.hero.trust_indicator_suffix || 'Global travelers joined'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
