import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence, Variants, Transition } from 'framer-motion';
import { flushSync } from 'react-dom';
import { BagSizes, BookingState, BookingStatus, ServiceType } from './types';
import { User } from 'firebase/auth';
// Deployment trigger: 2026-01-23 01:35 (Recovery from rollback)

// Lazy load components
const loadLandingRenewal = () => import('./components/LandingRenewal');
const loadAdminDashboard = () => import('./components/AdminDashboard');
const loadBranchAdminPage = () => import('./components/BranchAdminPage');

const LandingRenewal = lazy(loadLandingRenewal);
const AdminDashboard = lazy(loadAdminDashboard);
import AdminLoginPage from './components/AdminLoginPage';
const ManualPage = lazy(() => import('./components/ManualPage'));
const BookingSuccess = lazy(() => import('./components/BookingSuccess'));
const TossPaymentSuccessPage = lazy(() => import('./components/TossPaymentSuccessPage'));
const TossPaymentFailPage = lazy(() => import('./components/TossPaymentFailPage'));
const PartnershipPage = lazy(() => import('./components/PartnershipPage'));
const ServicesPage = lazy(() => import('./components/ServicesPage'));
const TermsPage = lazy(() => import('./components/TermsPage'));
const PrivacyPage = lazy(() => import('./components/PrivacyPage'));
const UserTrackingPage = lazy(() => import('./components/UserTrackingPage'));
const StaffScanPage = lazy(() => import('./components/StaffScanPage'));
const BookingPage = lazy(() => import('./components/BookingPage'));
const LocationsPage = lazy(() => import('./components/LocationsPage'));
const MyPage = lazy(() => import('./components/MyPage'));
const BranchAdminPage = lazy(loadBranchAdminPage);
const QnaPage = lazy(() => import('./components/QnaPage'));
const VisionPage = lazy(() => import('./components/VisionPage'));
const RefundPage = lazy(() => import('./components/RefundPage'));



const Footer = lazy(() => import('./components/Footer'));
const ChatBot = lazy(() => import('./components/ChatBot'));
import ErrorBoundary from './components/ErrorBoundary';
import NoticePopup from './components/NoticePopup';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import SEO from './components/SEO';
import { ko as adminKoTranslations } from './translations_split/ko';

import { auth } from './firebaseApp';
import { StorageService } from './services/storageService';
import { clearAdminAuthSession, ensureActiveAdminSession, hasActiveAdminSession, isSupabaseAdminAuthEnabled } from './services/adminAuthService';
import { useLocations } from './src/domains/location/hooks/useLocations';
import { useCurrentUser } from './src/domains/user/hooks/useCurrentUser';

import { useAppStore } from './src/store/appStore';
import { useBookingStore } from './src/store/bookingStore';

const EMPTY_ADMIN_INFO = { name: '', jobTitle: '', role: 'staff', email: '', branchId: '', loginAt: 0 };
const DASHBOARD_ADMIN_ROLES = new Set(['super', 'hq', 'finance', 'cs']);
const ADMIN_LANG = 'ko';
const isSafeInternalPath = (path: unknown): path is string => typeof path === 'string' && /^\/(?!\/)/.test(path);

const isDashboardAdmin = (role?: string, jobTitle?: string) => {
  const normalizedRole = (role || '').trim().toLowerCase();
  const normalizedTitle = (jobTitle || '').trim().toUpperCase();

  return (
    DASHBOARD_ADMIN_ROLES.has(normalizedRole) ||
    normalizedTitle.includes('CEO') ||
    normalizedTitle.includes('MASTER') ||
    normalizedTitle.includes('CTO') ||
    normalizedTitle.includes('CFO')
  );
};

const getAdminHomePath = (role?: string, jobTitle?: string, branchId?: string) => {
  if (isDashboardAdmin(role, jobTitle) || !branchId) {
    return '/admin/dashboard';
  }

  return `/admin/branch/${branchId}`;
};

const resolveAdminRedirectPath = (candidatePath: unknown, fallbackPath: string) => {
  if (!isSafeInternalPath(candidatePath)) {
    return fallbackPath;
  }

  if (candidatePath === '/admin') {
    return fallbackPath;
  }

  return candidatePath;
};

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    lang,
    setLang,
    setAdminInfo: setPersistedAdminInfo,
    clearAdminInfo: clearPersistedAdminInfo,
  } = useAppStore();
  const [adminInfo, setAdminInfo] = useState(() => {
    // [스봉이] 금붕어 기억력 방지! 로컬 스토리지에서 이전의 영광을 되찾아옵니다 💅✨
    const saved = localStorage.getItem('beeliber_admin_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // [스봉이] 사장님 지침! 한국 시간 기준 24시간 넘으면 가차 없이 쫓아냅니다 🙄💅
        const now = Date.now();
        const loginTime = parsed.loginAt || 0;
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        
        if (now - loginTime > TWENTY_FOUR_HOURS) {
          console.warn("[App] ⏰ 어드민 세션이 만료되었습니다 (24시간 경과).");
          localStorage.removeItem('beeliber_admin_info');
          clearPersistedAdminInfo();
          return EMPTY_ADMIN_INFO;
        }

        if (isSupabaseAdminAuthEnabled() && !hasActiveAdminSession()) {
          console.warn("[App] 🔒 Supabase 관리자 세션이 없어 기존 어드민 캐시를 비웁니다.");
          localStorage.removeItem('beeliber_admin_info');
          clearPersistedAdminInfo();
          return EMPTY_ADMIN_INFO;
        }
        
        console.log("[App] 🔐 어드민 세션 복구 성공! ✨");
        return parsed;
      } catch (e) {
        console.error("Failed to parse admin info", e);
      }
    }
    return EMPTY_ADMIN_INFO;
  });
  const {
    preSelectedBooking, setPreSelectedBooking,
    lastBooking, setLastBooking,
    customerBranchCode, setCustomerBranchCode,
    customerBranch, setCustomerBranch
  } = useBookingStore();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const adminHomePath = getAdminHomePath(adminInfo.role, adminInfo.jobTitle, adminInfo.branchId);
  const shouldLoadBookingLocations =
    location.pathname === '/booking' ||
    location.pathname === '/booking-success' ||
    /^\/admin\/branch\/[^/]+\/booking$/.test(location.pathname);
  const { data: bookingLocations = [] } = useLocations({ enabled: shouldLoadBookingLocations });

  const [t, setT] = useState<any>(null);
  const adminT = adminKoTranslations;

  useEffect(() => {
    let isMounted = true;
    const loadTranslations = async () => {
      try {
        let loadedT;
        switch (lang) {
          case 'en': { const m = await import('./translations_split/en'); loadedT = m.en; break; }
          case 'zh':
          case 'zh-CN': { const m = await import('./translations_split/zh'); loadedT = m.zh; break; }
          case 'zh-HK': { const m = await import('./translations_split/zh-HK'); loadedT = m.zhHK; break; }
          case 'zh-TW': { const m = await import('./translations_split/zh-TW'); loadedT = m.zhTW; break; }
          case 'ja': { const m = await import('./translations_split/ja'); loadedT = m.ja; break; }
          case 'ko':
          default: { const m = await import('./translations_split/ko'); loadedT = m.ko; break; }
        }
        if (isMounted) setT(loadedT);
      } catch (error) {
        console.error("Failed to load translation:", error);
        if (isMounted) {
          const fallback = await import('./translations_split/ko');
          setT(fallback.ko);
        }
      }
    };
    loadTranslations();
    return () => { isMounted = false; };
  }, [lang]);

  useEffect(() => {
    const checkBranch = async () => {
      const path = location.pathname;
      if (path.startsWith('/branch/')) {
        const code = path.split('/').pop();
        if (code) {
          setCustomerBranchCode(code);
          try {
            const branch = await StorageService.getBranchByCode(code);
            if (branch) {
              setCustomerBranch(branch);
            } else {
              setCustomerBranch(null);
            }
          } catch (e) { console.error("Error fetching branch via code", e); }
        }
      } else if (customerBranchCode && !path.startsWith('/branch/')) {
        setCustomerBranchCode(null);
        setCustomerBranch(null);
      }
    };
    checkBranch();
  }, [location.pathname, customerBranchCode, setCustomerBranchCode, setCustomerBranch]);

  useEffect(() => {
    localStorage.setItem('beeliber_lang', lang);
  }, [lang]);

  useEffect(() => {
    // [스봉이] 어드민 정보를 잊지 않도록 도장 꾹! 🛡️✨
    if (adminInfo.name) {
      localStorage.setItem('beeliber_admin_info', JSON.stringify(adminInfo));
    } else {
      localStorage.removeItem('beeliber_admin_info');
      clearPersistedAdminInfo();
    }
  }, [adminInfo, clearPersistedAdminInfo]);

  useEffect(() => {
    if (!adminInfo.name || !isSupabaseAdminAuthEnabled()) {
      return;
    }

    let disposed = false;

    const syncAdminSession = async () => {
      const session = await ensureActiveAdminSession();
      if (disposed || session) {
        return;
      }

      console.warn('[App] Supabase 관리자 세션이 24시간 창을 넘어 만료되어 접근을 정리합니다.');
      setAdminInfo(EMPTY_ADMIN_INFO);
      localStorage.removeItem('beeliber_admin_info');
      clearPersistedAdminInfo();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncAdminSession();
      }
    };

    const handleWindowFocus = () => {
      void syncAdminSession();
    };

    void syncAdminSession();

    const sessionTimer = window.setInterval(() => {
      void syncAdminSession();
    }, 5 * 60 * 1000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      disposed = true;
      window.clearInterval(sessionTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [adminInfo.name, clearPersistedAdminInfo]);

  const handleLocationSelect = (
    id: string,
    type: ServiceType = ServiceType.STORAGE,
    date?: string,
    returnDate?: string,
    bagCounts?: BagSizes
  ) => {
    setPreSelectedBooking({
      pickupLocation: id,
      serviceType: type,
      date,
      returnDate,
      bagCounts
    });
    navigate('/booking');
  };

  const handleBookingSuccess = async (booking: BookingState) => {
    console.log("[App] handleBookingSuccess triggered with data:", booking);
    const finalBooking = {
      ...booking,
      userId: booking.userId || currentUser?.uid, // 🛡️ [스봉이] 여기서도 한 번 더 챙겨야 안심이죠!
      id: booking.id || `${(booking.pickupLocation || 'UNK').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      status: booking.status || '접수완료',
      createdAt: booking.createdAt || new Date().toISOString()
    };
    console.log("[App] Final Booking prepared. Waiting for server confirmation.", finalBooking);

    try {
      const savedBooking = await StorageService.saveBooking(finalBooking);
      const confirmedBooking = {
        ...finalBooking,
        ...savedBooking,
        id: savedBooking.id || finalBooking.id,
        userId: savedBooking.userId || finalBooking.userId,
        status: savedBooking.status || '접수완료',
      };

      setLastBooking(confirmedBooking);
      navigate('/booking-success');
      console.log("[App] Booking saved to Firestore successfully.", confirmedBooking);
    } catch (saveError: any) {
      console.error("[App] Booking Save failed:", saveError);
      const detail = saveError?.details ? JSON.stringify(saveError.details) : (saveError?.message || saveError);
      const errorMsg = lang === 'ko'
        ? `앗, 사장님. 예약 저장이 끝나기 전에 성공 화면으로 넘기면 안 되잖아요.\n이번엔 저장을 중단했고요, 오류는 이거예요.\n\n${detail}\n\n같은 화면에서 다시 시도해 주세요. 계속 이러면 제가 더 깊게 잡아드릴게요.`
        : `Oops. The booking could not be confirmed.\n\n${detail}\n\nPlease stay on this page and try again.`;
      alert(errorMsg);
    }
  };

  const handleBranchManualBookingSuccess = async (booking: BookingState) => {
    console.log("[App] handleBranchManualBookingSuccess triggered:", booking);
    try {
      const finalBooking = {
        ...booking,
        status: BookingStatus.CONFIRMED, // 수동 예약은 즉시 확정 💅
        createdAt: new Date().toISOString()
      };
      await StorageService.saveBooking(finalBooking);
      alert('지점 수동 예약이 성공적으로 저장되었습니다. 💅');
      navigate(`/admin/branch/${adminInfo.branchId}`);
    } catch (e) {
      console.error(e);
      alert('수동 예약 저장 실패');
    }
  };

  const handlePaidBookingReady = (booking: BookingState) => {
    setLastBooking(booking);
    navigate('/booking-success', { replace: true });
  };

  const handleAdminLogout = () => {
    // [스봉이] 흔적도 없이 깨끗하게 치워드릴게요. 💅✨
    clearAdminAuthSession().catch((error) => {
      console.warn('[App] Supabase 관리자 로그아웃 후처리 실패:', error);
    });
    setAdminInfo(EMPTY_ADMIN_INFO);
    clearPersistedAdminInfo();
    localStorage.removeItem('beeliber_admin_info');
    navigate('/');
  };

  // Legacy navigations handler to not break hardcoded prop strings in subcomponents
  const legacyNavigate = (view: string) => {
    switch (view) {
      case 'ADMIN_LOGIN': return navigate('/admin');
      case 'ADMIN': return navigate('/admin/dashboard');
      case 'MANUAL': return navigate('/manual');
      case 'PARTNERSHIP': return navigate('/partnership');
      case 'SERVICES': return navigate('/services');
      case 'TERMS': return navigate('/terms');
      case 'PRIVACY': return navigate('/privacy');
      case 'REFUND': return navigate('/refund');
      case 'BOOKING_SUCCESS': return navigate('/booking-success');
      case 'TRACKING': return navigate('/tracking');
      case 'QNA': return navigate('/qna');
      case 'STAFF_SCAN': return navigate('/staff/scan');
      case 'MYPAGE': return navigate('/mypage');
      case 'BOOKING': return navigate('/booking');
      case 'LOCATIONS': return navigate('/locations');
      case 'BRANCH_ADMIN':
        if (adminInfo.branchId) return navigate(`/admin/branch/${adminInfo.branchId}`);
        return navigate('/admin');
      case 'VISION': return navigate('/vision');
      case 'USER': default: return navigate('/');
    }
  };


  const BranchAdminGuard = ({ children }: { children: React.ReactNode }) => {
    const hasAdminAccess = Boolean(adminInfo.name) && (!isSupabaseAdminAuthEnabled() || hasActiveAdminSession());
    if (!hasAdminAccess) return <Navigate to="/admin" replace />;

    if (isDashboardAdmin(adminInfo.role, adminInfo.jobTitle)) {
      return <Navigate to="/admin/dashboard" replace />;
    }

    const pathSegments = location.pathname.split('/');
    const urlBranchId = pathSegments[3] || '';
    if (adminInfo.branchId && urlBranchId !== adminInfo.branchId) {
      return <Navigate to={`/admin/branch/${adminInfo.branchId}`} replace />;
    }

    return <>{children}</>;
  };

  const AdminGuard = ({ children }: { children: React.ReactNode }) => {
    const hasAdminAccess = Boolean(adminInfo.name) && (!isSupabaseAdminAuthEnabled() || hasActiveAdminSession());
    if (!hasAdminAccess) {
      return <Navigate to="/admin" replace state={{ from: `${location.pathname}${location.search}` }} />;
    }

    if (!isDashboardAdmin(adminInfo.role, adminInfo.jobTitle)) {
      if (adminInfo.branchId) return <Navigate to={`/admin/branch/${adminInfo.branchId}`} replace />;
      return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
  };

  const AdminAccessGuard = ({ children }: { children: React.ReactNode }) => {
    const hasAdminAccess = Boolean(adminInfo.name) && (!isSupabaseAdminAuthEnabled() || hasActiveAdminSession());
    if (!hasAdminAccess) {
      return <Navigate to="/admin" replace state={{ from: `${location.pathname}${location.search}` }} />;
    }

    return <>{children}</>;
  };

  const pageVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // 💅 예약 성공 페이지는 플리커 방지를 위해 x 이동 없이 fade-only 전환
  const fadeVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const pageTransition: Transition = {
    duration: 0.35,
    ease: [0.23, 1, 0.32, 1],
  };

  const fastTransition: Transition = {
    duration: 0.2,
    ease: 'easeOut',
  };

  const AnimatedRoute = ({ children, fade }: { children: React.ReactNode; fade?: boolean }) => (
    <motion.div
      initial={isInitialLoad ? "animate" : "initial"}
      animate="animate"
      exit="exit"
      variants={fade ? fadeVariants : pageVariants}
      transition={fade ? fastTransition : pageTransition}
      style={{ willChange: 'opacity' }}
    >
      {children}
    </motion.div>
  );

  let branchSchema: any = undefined;
  if (customerBranch) {
    branchSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": `Beeliber - ${customerBranch.name}`,
      "image": "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&q=80&w=1200",
      "url": `https://bee-liber.com/branch/${customerBranchCode}`,
      "telephone": customerBranch.contactNumber || "+82-10-1234-5678",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": customerBranch.address || "[본사 상세 주소 입력]",
        "addressLocality": customerBranch.city || "Seoul",
        "addressRegion": customerBranch.region || "Seoul",
        "postalCode": customerBranch.postalCode || "04050",
        "addressCountry": "KR"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": customerBranch.operatingHours?.start || "09:00",
          "closes": customerBranch.operatingHours?.end || "18:00"
        }
      ],
      "priceRange": "₩10,000 - ₩50,000"
    };
  }

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (t) {
      // Small delay to ensure styles are ready before removing overlay
      const timer = setTimeout(() => setIsInitialLoad(false), 50);
      return () => clearTimeout(timer);
    }
  }, [t]);

  const LoaderOverlay = React.memo(({ show }: { show: boolean }) => (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-14 h-14 border-[3px] border-bee-yellow/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-14 h-14 border-[3px] border-bee-yellow border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-bee-yellow text-[10px] font-black tracking-[0.4em] animate-pulse">BEELIBER</p>
              <p className="text-white/40 text-[8px] font-bold tracking-widest uppercase">Initializing System</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  ));

  const isDarkBg = location.pathname === '/' || location.pathname.startsWith('/branch/');

  return (
    <div className={`w-full font-sans selection:bg-bee-yellow selection:text-bee-black overflow-x-hidden ${isDarkBg ? 'bg-black' : 'bg-slate-50'}`}>
      <LoaderOverlay show={isInitialLoad || !t} />

      {t && (
        <>
          <SEO
            title={customerBranch ? `Beeliber - ${customerBranch.name}` : t.seo?.title}
            description={t.seo?.description}
            keywords={t.seo?.keywords}
            lang={lang}
            path={location.pathname}
            schema={branchSchema}
          />
          <ErrorBoundary>
            <Suspense fallback={<LoaderOverlay show={true} />}>
              <AnimatePresence mode="wait" initial={false}>
                <Routes location={location} key={location.pathname}>
                  {/* USER */}
                  <Route path="/" element={<AnimatedRoute><LandingRenewal t={t} lang={lang} onNavigate={(view) => legacyNavigate(view as string)} onLangChange={setLang} onAdminClick={() => navigate('/admin')} onLoginClick={() => setShowLoginModal(true)} onMyPageClick={() => navigate('/mypage')} user={currentUser} onSuccess={handleBookingSuccess} branchCode={customerBranchCode || undefined} branchData={customerBranch || undefined} /></AnimatedRoute>} />
                  <Route path="/branch/:code" element={<AnimatedRoute><LandingRenewal t={t} lang={lang} onNavigate={(view) => legacyNavigate(view as string)} onLangChange={setLang} onAdminClick={() => navigate('/admin')} onLoginClick={() => setShowLoginModal(true)} onMyPageClick={() => navigate('/mypage')} user={currentUser} onSuccess={handleBookingSuccess} branchCode={customerBranchCode || undefined} branchData={customerBranch || undefined} /></AnimatedRoute>} />

                  {/* OTHER */}
                  <Route path="/services" element={<AnimatedRoute><ServicesPage onBack={() => navigate('/')} t={t.services_page} landingT={t.landing_renewal} /></AnimatedRoute>} />
                  <Route path="/locations" element={<AnimatedRoute><LocationsPage onBack={() => navigate('/')} onSelectLocation={handleLocationSelect} t={t} lang={lang} onLangChange={setLang} user={currentUser} initialLocationId={preSelectedBooking?.pickupLocation} /></AnimatedRoute>} />
                  <Route path="/booking" element={<AnimatedRoute><BookingPage t={t} lang={lang} locations={bookingLocations} initialLocationId={preSelectedBooking?.pickupLocation} initialServiceType={preSelectedBooking?.serviceType as ServiceType | undefined} initialDate={preSelectedBooking?.date} initialReturnDate={preSelectedBooking?.returnDate} initialBagSizes={preSelectedBooking?.bagCounts} onBack={() => navigate('/locations')} onSuccess={handleBookingSuccess} user={currentUser} customerBranchId={customerBranch?.id} customerBranchRates={customerBranch?.commissionRates} /></AnimatedRoute>} />
                  <Route path="/payments/toss/success" element={<AnimatedRoute fade><TossPaymentSuccessPage lang={lang} onBookingReady={handlePaidBookingReady} onBackToBooking={() => navigate('/booking', { replace: true })} /></AnimatedRoute>} />
                  <Route path="/payments/toss/fail" element={<AnimatedRoute fade><TossPaymentFailPage lang={lang} onBackToBooking={() => navigate('/booking', { replace: true })} /></AnimatedRoute>} />
                  <Route path="/booking-success" element={<AnimatedRoute fade><BookingSuccess booking={lastBooking} locations={bookingLocations} onBack={() => navigate('/')} t={t} lang={lang} /></AnimatedRoute>} />
                  <Route path="/tracking" element={<AnimatedRoute><UserTrackingPage onBack={() => navigate('/')} t={t} lang={lang} /></AnimatedRoute>} />
                  <Route path="/partnership" element={<AnimatedRoute><PartnershipPage onBack={() => navigate('/')} t={t} /></AnimatedRoute>} />
                  <Route path="/manual" element={<AnimatedRoute><ManualPage onBack={() => navigate('/')} t={t.manual} /></AnimatedRoute>} />
                  <Route path="/terms" element={<AnimatedRoute><TermsPage onBack={() => navigate('/')} t={t} /></AnimatedRoute>} />
                  <Route path="/privacy" element={<AnimatedRoute><PrivacyPage onBack={() => navigate('/')} t={t} /></AnimatedRoute>} />
                  <Route path="/refund" element={<AnimatedRoute><RefundPage onBack={() => navigate('/privacy')} t={t} /></AnimatedRoute>} />
                  <Route path="/qna" element={<AnimatedRoute><QnaPage onBack={() => navigate('/')} t={t} lang={lang} /></AnimatedRoute>} />
                  
                  <Route path="/vision" element={<AnimatedRoute><VisionPage /></AnimatedRoute>} />

                  {/* ADMIN */}
                  <Route path="/admin" element={<AdminLoginPage onLogin={(name, jobTitle, role, email, branchId) => {
                    const info = { name, jobTitle, role, email: email || '', branchId: branchId || '', loginAt: Date.now() };
                    const fallbackPath = getAdminHomePath(role, jobTitle, branchId);
                    const nextPath = resolveAdminRedirectPath((location.state as { from?: string } | null)?.from, fallbackPath);

                    flushSync(() => {
                      setAdminInfo(info);
                      setPersistedAdminInfo({ name, jobTitle, branchId: branchId || '' });
                    });
                    localStorage.setItem('beeliber_admin_info', JSON.stringify(info));

                    void (async () => {
                      if (nextPath === '/admin/dashboard') {
                        await loadAdminDashboard();
                      } else if (nextPath.startsWith('/admin/branch/')) {
                        await loadBranchAdminPage();
                      }

                      navigate(nextPath, { replace: true });
                    })();
                  }} onCancel={() => navigate('/')} />} />
                  <Route path="/admin/dashboard" element={<AdminGuard><AnimatedRoute><AdminDashboard onBack={handleAdminLogout} onStaffMode={() => navigate('/staff/scan')} adminName={adminInfo.name} jobTitle={adminInfo.jobTitle} adminRole={adminInfo.role} adminEmail={adminInfo.email} scanId={new URLSearchParams(location.search).get('scan') || undefined} lang={ADMIN_LANG} t={adminT} /></AnimatedRoute></AdminGuard>} />
                  <Route path="/admin/branch/:branchId" element={<BranchAdminGuard><AnimatedRoute><BranchAdminPage branchId={adminInfo.branchId} lang={ADMIN_LANG} t={adminT} onBack={handleAdminLogout} /></AnimatedRoute></BranchAdminGuard>} />
                  <Route path="/admin/branch/:branchId/booking" element={<BranchAdminGuard><AnimatedRoute><BookingPage t={adminT} lang={ADMIN_LANG} locations={bookingLocations} initialLocationId={adminInfo.branchId} onBack={() => navigate(`/admin/branch/${adminInfo.branchId}`)} onSuccess={handleBranchManualBookingSuccess} user={currentUser} /></AnimatedRoute></BranchAdminGuard>} />
                  <Route path="/staff/scan" element={<AdminAccessGuard><AnimatedRoute><StaffScanPage onBack={() => navigate(adminHomePath)} adminName={adminInfo.name} t={adminT} lang={ADMIN_LANG} /></AnimatedRoute></AdminAccessGuard>} />
                  <Route path="/mypage" element={<AnimatedRoute><div className="fixed inset-0 z-0 pointer-events-none"><LandingRenewal t={t} lang={lang} onNavigate={(view) => legacyNavigate(view as string)} onLangChange={setLang} onAdminClick={() => navigate('/admin')} onLoginClick={() => setShowLoginModal(true)} onMyPageClick={() => navigate('/mypage')} user={currentUser} onSuccess={handleBookingSuccess} branchCode={customerBranchCode || undefined} branchData={customerBranch || undefined} /><div className="absolute inset-0 bg-black/50 pointer-events-auto" /></div><MyPage t={t} onClose={() => { navigate(-1); }} /></AnimatedRoute>} />

                  {/* FALLBACK */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </Suspense>
          </ErrorBoundary>

          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Footer t={t} onNavigate={(val) => legacyNavigate(val)} />} />
              <Route path="/branch/:code" element={<Footer t={t} onNavigate={(val) => legacyNavigate(val)} />} />
              <Route path="/services" element={<Footer t={t} onNavigate={(val) => legacyNavigate(val)} />} />
              <Route path="/tracking" element={<Footer t={t} onNavigate={(val) => legacyNavigate(val)} />} />
              <Route path="*" element={null} />
            </Routes>
          </Suspense>

          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<ChatBot t={t.chatbot} lang={lang} />} />
              <Route path="/branch/:code" element={<ChatBot t={t.chatbot} lang={lang} />} />
              <Route path="*" element={null} />
            </Routes>
          </Suspense>

          {/* Legacy MyPage Handler - Now integrated into Router but keeping this as safe check if needed */}

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
        </>
      )}
    </div>
  );
};

export default App;
// Final push verification commit - Beeliber Smart Multi-language v1.1
