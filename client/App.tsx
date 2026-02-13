

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants, Transition } from 'framer-motion';
import { BookingState, LocationOption, BookingStatus } from './types';
// Deployment trigger: 2026-01-23 01:35 (Recovery from rollback)

import LandingRenewal from './components/LandingRenewal';
import BeeAIReservation from './components/BeeAIReservation';
import BookingWidget from './components/BookingWidget';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import AdminDashboard from './components/AdminDashboard';

import AdminLoginPage from './components/AdminLoginPage';
import ManualPage from './components/ManualPage';
import LocationsPage from './components/LocationsPage';
import ErrorBoundary from './components/ErrorBoundary';

import BookingSuccess from './components/BookingSuccess';
import PartnershipPage from './components/PartnershipPage';
import ServicesPage from './components/ServicesPage';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import NoticePopup from './components/NoticePopup';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import UserTrackingPage from './components/UserTrackingPage';
import StaffScanPage from './components/StaffScanPage';
import BookingPage from './components/BookingPage'; // [NEW] Added BookingPage
import SEO from './components/SEO';
import MyPage from './components/MyPage';
import { translations } from './translations';
import { auth } from './firebaseApp';
import { StorageService } from './services/storageService';

type ViewType = 'USER' | 'ADMIN_LOGIN' | 'ADMIN' | 'MANUAL' | 'LOCATIONS' | 'PARTNERSHIP' | 'SERVICES' | 'TERMS' | 'PRIVACY' | 'BOOKING_SUCCESS' | 'TRACKING' | 'STAFF_SCAN' | 'MYPAGE' | 'BOOKING';

const App: React.FC = () => {
  // Helper to determine view from URL path
  const getViewFromPath = (path: string): ViewType => {
    if (path.startsWith('/admin/dashboard')) return 'ADMIN';
    if (path.startsWith('/admin') || path.startsWith('/yn')) return 'ADMIN_LOGIN';
    if (path.startsWith('/manual')) return 'MANUAL';
    if (path.startsWith('/locations')) return 'LOCATIONS';
    if (path.startsWith('/partnership')) return 'PARTNERSHIP';
    if (path.startsWith('/services')) return 'SERVICES';
    if (path.startsWith('/terms')) return 'TERMS';
    if (path.startsWith('/privacy')) return 'PRIVACY';
    if (path.startsWith('/booking-success')) return 'BOOKING_SUCCESS';
    if (path.startsWith('/tracking')) return 'TRACKING';
    if (path.startsWith('/staff/scan')) return 'STAFF_SCAN';
    if (path.startsWith('/mypage')) return 'MYPAGE';
    if (path.startsWith('/booking')) return 'BOOKING';
    return 'USER';
  };

  const getPathFromView = (view: ViewType): string => {
    switch (view) {
      case 'ADMIN_LOGIN': return '/admin';
      case 'ADMIN': return '/admin/dashboard';
      case 'MANUAL': return '/manual';
      case 'LOCATIONS': return '/locations';
      case 'PARTNERSHIP': return '/partnership';
      case 'SERVICES': return '/services';
      case 'TERMS': return '/terms';
      case 'PRIVACY': return '/privacy';
      case 'BOOKING_SUCCESS': return '/booking-success';
      case 'TRACKING': return '/tracking';
      case 'STAFF_SCAN': return '/staff/scan';
      case 'MYPAGE': return '/mypage';
      case 'BOOKING': return '/booking'; // New path for booking page
      case 'USER': default: return '/';
    }
  };

  const [view, setView] = useState<ViewType>(() => getViewFromPath(window.location.pathname));
  // Initialize language from localStorage or default to 'ko'
  const [lang, setLang] = useState(() => localStorage.getItem('beeliber_lang') || 'ko');
  const [adminInfo, setAdminInfo] = useState({ name: '', jobTitle: '' });
  const [preSelectedBooking, setPreSelectedBooking] = useState<{
    pickupLocation: string,
    serviceType: 'STORAGE' | 'DELIVERY',
    date?: string,
    bagCounts?: { S: number, M: number, L: number, XL: number }
  } | null>(null);
  const [preSelectedStorageId, setPreSelectedStorageId] = useState<string | null>(null); // Keep for backward compat if needed, or remove
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [lastBooking, setLastBooking] = useState<BookingState | null>(null);
  const [locations, setLocations] = useState<LocationOption[]>([]);

  useEffect(() => {
    StorageService.getLocations().then(setLocations).catch(console.error);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // No longer require non-anonymous login logic here as we use currentUser state
  const isLoggedIn = !!currentUser && !currentUser.isAnonymous;

  const ensureAuthAndExecute = (action: () => void) => {
    // Since we handle anonymous auth in firebaseApp.ts, we can just execute the action.
    // If for some reason auth is not ready, we wait for it.
    if (auth.currentUser) {
      action();
    } else {
      // This case should be rare due to auto-login in firebaseApp.ts
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          unsubscribe();
          action();
        }
      });
    }
  };

  // Persist language choice
  useEffect(() => {
    localStorage.setItem('beeliber_lang', lang);
  }, [lang]);

  const t = translations[lang] || translations['ko'];

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setView(getViewFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Centralized Navigation Function
  const navigate = (newView: ViewType) => {
    const path = getPathFromView(newView);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleLocationSelect = (
    id: string,
    type: 'STORAGE' | 'DELIVERY' = 'STORAGE',
    date?: string,
    bagCounts?: { S: number, M: number, L: number, XL: number }
  ) => {
    setPreSelectedBooking({
      pickupLocation: id,
      serviceType: type,
      date,
      bagCounts
    });
    navigate('BOOKING');
  };

  const handleBookingScroll = (type: 'DELIVERY' | 'STORAGE') => {
    const element = document.getElementById('booking');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      // Switch booking mode within the widget
      window.dispatchEvent(new CustomEvent('switch-booking-mode', { detail: type }));
    }
  };

  const handleFinalBookClick = (action: () => void) => {
    ensureAuthAndExecute(action);
  };

  const handleBookingSuccess = async (booking: any) => {
    try {
      // AI bookings might be missing fields
      const finalBooking = {
        ...booking,
        id: booking.id || `${(booking.pickupLocation || 'UNK').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
        status: booking.status || '접수완료',
        createdAt: booking.createdAt || new Date().toISOString()
      };

      // Save to Firebase (Critical Step)
      await StorageService.saveBooking(finalBooking);
      console.log("[App] Booking saved:", finalBooking.id);

      setLastBooking(finalBooking);
      navigate('BOOKING_SUCCESS');
    } catch (saveError: any) {
      console.error("[App] Booking Save failed:", saveError);
      alert(`예약 저장 중 오류가 발생했습니다.\n\n${saveError.message || saveError}\n관리자에게 문의해주세요.`);
    }
  };

  const [scanId] = useState(() => new URLSearchParams(window.location.search).get('scan'));

  // Animation variants for page transitions
  const pageVariants: Variants = {
    initial: { opacity: 0, x: 20, scale: 0.99 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -20, scale: 1.01 },
  };

  const pageTransition: Transition = {
    duration: 0.4,
    ease: [0.23, 1, 0.32, 1], // iOS style ease-out
  };

  const renderView = () => {
    // Security Check: Redirect to login if accessing dashboard without info
    if (view === 'ADMIN' && !adminInfo.name) {
      return (
        <motion.div key="admin-login-required" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
          <AdminLoginPage
            onLogin={(name, jobTitle) => {
              setAdminInfo({ name, jobTitle });
              navigate('ADMIN');
            }}
            onCancel={() => navigate('USER')}
          />
        </motion.div>
      );
    }

    switch (view) {
      case 'ADMIN':
        return (
          <motion.div key="admin" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <AdminDashboard
              onBack={() => navigate('USER')}
              onStaffMode={() => navigate('STAFF_SCAN')}
              adminName={adminInfo.name}
              jobTitle={adminInfo.jobTitle}
              scanId={scanId || undefined}
              lang={lang}
              t={t}
            />
          </motion.div>
        );

      case 'ADMIN_LOGIN':
        return (
          <motion.div key="admin-login" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <AdminLoginPage
              onLogin={(name, jobTitle) => {
                setAdminInfo({ name, jobTitle });
                navigate('ADMIN');
              }}
              onCancel={() => navigate('USER')}
            />
          </motion.div>
        );

      case 'MANUAL':
        return (
          <motion.div key="manual" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <ManualPage onBack={() => navigate('USER')} t={t.manual} />
          </motion.div>
        );

      case 'LOCATIONS':
        return (
          <motion.div key="locations" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <ErrorBoundary fallback={<div className="p-10 text-center">지도를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</div>}>
              <LocationsPage
                onBack={() => navigate('USER')}
                onSelectLocation={(id, type, date, bags) => ensureAuthAndExecute(() => handleLocationSelect(id, type, date, bags))}
                onSuccess={handleBookingSuccess}
                t={t}
                lang={lang}
                onLangChange={setLang}
                user={currentUser}
                initialLocationId={preSelectedBooking?.pickupLocation}
              />
            </ErrorBoundary>
          </motion.div>
        );

      case 'PARTNERSHIP':
        return (
          <motion.div key="partnership" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <PartnershipPage onBack={() => navigate('USER')} t={t} />
          </motion.div>
        );

      case 'SERVICES':
        return (
          <motion.div key="services" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <ServicesPage onBack={() => navigate('USER')} t={t.services_page} landingT={t.landing_renewal} />
          </motion.div>
        );

      case 'TERMS':
        return (
          <motion.div key="terms" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <TermsPage onBack={() => navigate('USER')} t={t} />
          </motion.div>
        );

      case 'PRIVACY':
        return (
          <motion.div key="privacy" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <PrivacyPage onBack={() => navigate('USER')} t={t} />
          </motion.div>
        );

      case 'BOOKING':
        return (
          <motion.div key="booking-page" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <BookingPage
              t={t}
              lang={lang}
              locations={locations}
              initialLocationId={preSelectedBooking?.pickupLocation}
              initialServiceType={preSelectedBooking?.serviceType as any}
              initialDate={preSelectedBooking?.date}
              initialBagSizes={preSelectedBooking?.bagCounts}
              onBack={() => navigate('LOCATIONS')}
              onSuccess={handleBookingSuccess}
              user={currentUser}
            />
          </motion.div>
        );

      case 'BOOKING_SUCCESS':
        return (
          <motion.div key="booking-success" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <BookingSuccess
              booking={lastBooking}
              locations={locations}
              onBack={() => navigate('USER')}
              t={t}
              lang={lang}
            />
          </motion.div>
        );

      case 'TRACKING':
        return (
          <motion.div key="tracking" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <UserTrackingPage
              onBack={() => navigate('USER')}
              t={t}
              lang={lang}
            />
          </motion.div>
        );

      case 'STAFF_SCAN':
        return (
          <motion.div key="staff-scan" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <StaffScanPage
              onBack={() => navigate('ADMIN')}
              adminName={adminInfo.name}
              t={t}
              lang={lang}
            />
          </motion.div>
        );

      case 'USER':
      default:
        return (
          <motion.div key="user-landing" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <LandingRenewal
              t={t}
              lang={lang}
              onNavigate={navigate}
              onLangChange={setLang}
              onAdminClick={() => navigate('ADMIN_LOGIN')}
              onLoginClick={() => setShowLoginModal(true)}
              onMyPageClick={() => navigate('MYPAGE')}
              user={currentUser}
              onSuccess={handleBookingSuccess}
            />
          </motion.div>
        );
    }
  };

  return (
    <div className="w-full bg-slate-50 font-sans selection:bg-bee-yellow selection:text-bee-black overflow-x-hidden">
      <SEO
        title={view === 'USER' ? t.seo?.title : `${t.nav[view.toLowerCase()] || t.seo?.title} - Beeliber`}
        description={t.seo?.description}
        keywords={t.seo?.keywords}
        lang={lang}
        path={window.location.pathname}
      />
      <AnimatePresence mode="wait">
        {renderView()}
      </AnimatePresence>

      {view === 'MYPAGE' && (
        <MyPage
          t={t}
          onClose={() => navigate('USER')}
        />
      )}

      {view === 'USER' && (
        <Footer
          t={t}
          onTermsClick={() => navigate('TERMS')}
          onPrivacyClick={() => navigate('PRIVACY')}
          onAdminClick={() => navigate('ADMIN_LOGIN')}
        />
      )}
      {view === 'USER' && (
        <ChatBot t={t.chatbot} lang={lang} />
      )}
      <NoticePopup t={t} />
      <LoginModal
        isOpen={showLoginModal}
        t={t}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => setShowLoginModal(false)}
        onSwitchToSignup={() => { setShowLoginModal(false); setShowSignupModal(true); }}
      />
      <SignupModal
        isOpen={showSignupModal}
        t={t}
        onClose={() => setShowSignupModal(false)}
        onSignupSuccess={() => setShowSignupModal(false)}
        onSwitchToLogin={() => { setShowSignupModal(false); setShowLoginModal(true); }}
      />
    </div>
  );
};

export default App;
// Final push verification commit - Beeliber Smart Multi-language v1.1
