const fs = require('fs');

const originalContent = fs.readFileSync('client/App.tsx', 'utf8');

// The new App.tsx content is almost mostly static logic based on React Router.
const newAppTsx = \`
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence, Variants, Transition } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { BookingState, LocationOption, BookingStatus, Branch, ServiceType } from './types';
import { User } from 'firebase/auth';
// Deployment trigger: 2026-01-23 01:35 (Recovery from rollback)

const LandingRenewal = lazy(() => import('./components/LandingRenewal'));
const BeeAIReservation = lazy(() => import('./components/BeeAIReservation'));
const BookingWidget = lazy(() => import('./components/BookingWidget'));
const Footer = lazy(() => import('./components/Footer'));
const ChatBot = lazy(() => import('./components/ChatBot'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

const AdminLoginPage = lazy(() => import('./components/AdminLoginPage'));
const ManualPage = lazy(() => import('./components/ManualPage'));

const ErrorBoundary = lazy(() => import('./components/ErrorBoundary'));

const BookingSuccess = lazy(() => import('./components/BookingSuccess'));
const PartnershipPage = lazy(() => import('./components/PartnershipPage'));
const ServicesPage = lazy(() => import('./components/ServicesPage'));
const TermsPage = lazy(() => import('./components/TermsPage'));
const PrivacyPage = lazy(() => import('./components/PrivacyPage'));
const NoticePopup = lazy(() => import('./components/NoticePopup'));
const LoginModal = lazy(() => import('./components/LoginModal'));
const SignupModal = lazy(() => import('./components/SignupModal'));
const UserTrackingPage = lazy(() => import('./components/UserTrackingPage'));
const StaffScanPage = lazy(() => import('./components/StaffScanPage'));
const BookingPage = lazy(() => import('./components/BookingPage'));
const LocationsPage = lazy(() => import('./components/LocationsPage'));
const SEO = lazy(() => import('./components/SEO'));
const MyPage = lazy(() => import('./components/MyPage'));
const BranchAdminPage = lazy(() => import('./components/BranchAdminPage'));
import { translations } from './translations';
import { auth } from './firebaseApp';
import { StorageService } from './services/storageService';
import { useLocations } from './src/domains/location/hooks/useLocations';
import { useCurrentUser } from './src/domains/user/hooks/useCurrentUser';

type ViewType = 'USER' | 'ADMIN_LOGIN' | 'ADMIN' | 'MANUAL' | 'PARTNERSHIP' | 'SERVICES' | 'TERMS' | 'PRIVACY' | 'BOOKING_SUCCESS' | 'TRACKING' | 'STAFF_SCAN' | 'MYPAGE' | 'BOOKING' | 'LOCATIONS' | 'BRANCH_ADMIN';

const App: React.FC = () => {
  const routerNavigate = useNavigate();
  const location = useLocation();

  const [lang, setLang] = useState(() => localStorage.getItem('beeliber_lang') || 'ko');
  const [adminInfo, setAdminInfo] = useState({ name: '', jobTitle: '', branchId: '' });
  const [preSelectedBooking, setPreSelectedBooking] = useState<{
    pickupLocation: string,
    serviceType: 'STORAGE' | 'DELIVERY',
    date?: string,
    returnDate?: string,
    bagCounts?: { S: number, M: number, L: number, XL: number }
  } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const { data: locations = [] } = useLocations();
  const [lastBooking, setLastBooking] = useState<BookingState | null>(null);

  const [customerBranchCode, setCustomerBranchCode] = useState<string | null>(null);
  const [customerBranch, setCustomerBranch] = useState<Branch | null>(null);

  useEffect(() => {
    const checkBranch = async () => {
      const path = location.pathname;
      if (path.startsWith('/branch/')) {
        const code = path.split('/').pop();
        if (code) {
          setCustomerBranchCode(code);
          try {
            const branches = await StorageService.getBranches();
            const branch = branches.find(b => b.branchCode === code && b.isActive);
            if (branch) {
              setCustomerBranch(branch);
            }
          } catch (e) { console.error("Error fetching branch via code", e); }
        }
      }
    };
    checkBranch();
  }, [location.pathname]);

  const isLoggedIn = !!currentUser && !currentUser.isAnonymous;

  const ensureAuthAndExecute = (action: () => void) => {
    if (auth.currentUser) {
      action();
    } else {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          unsubscribe();
          action();
        }
      });
    }
  };

  useEffect(() => {
    localStorage.setItem('beeliber_lang', lang);
  }, [lang]);

  const t = translations[lang] || translations['ko'];

  const navigate = (newView: ViewType | string) => {
    switch (newView) {
      case 'ADMIN_LOGIN': return routerNavigate('/admin');
      case 'ADMIN': return routerNavigate('/admin/dashboard');
      case 'MANUAL': return routerNavigate('/manual');
      case 'PARTNERSHIP': return routerNavigate('/partnership');
      case 'SERVICES': return routerNavigate('/services');
      case 'TERMS': return routerNavigate('/terms');
      case 'PRIVACY': return routerNavigate('/privacy');
      case 'BOOKING_SUCCESS': return routerNavigate('/booking-success');
      case 'TRACKING': return routerNavigate('/tracking');
      case 'STAFF_SCAN': return routerNavigate('/staff/scan');
      case 'MYPAGE': return routerNavigate('/mypage');
      case 'BOOKING': return routerNavigate('/booking');
      case 'LOCATIONS': return routerNavigate('/locations');
      case 'BRANCH_ADMIN': {
        const id = adminInfo.branchId || location.pathname.split('/').pop() || '';
        return routerNavigate(\`/admin/branch/\${id}\`);
      }
      case 'USER': default: return routerNavigate('/');
    }
  };

  const handleLocationSelect = (
    id: string,
    type: 'STORAGE' | 'DELIVERY' = 'STORAGE',
    date?: string,
    returnDate?: string,
    bagCounts?: { S: number, M: number, L: number, XL: number }
  ) => {
    setPreSelectedBooking({
      pickupLocation: id,
      serviceType: type,
      date,
      returnDate,
      bagCounts
    });
    routerNavigate('/booking');
  };

  const handleBookingScroll = (type: 'DELIVERY' | 'STORAGE') => {
    const element = document.getElementById('booking');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent('switch-booking-mode', { detail: type }));
    }
  };

  const handleFinalBookClick = (action: () => void) => {
    ensureAuthAndExecute(action);
  };

  const handleBookingSuccess = async (booking: BookingState) => {
    try {
      console.log("[App] handleBookingSuccess started for:", booking.id || 'NEW');

      const finalBooking = {
        ...booking,
        id: booking.id || \`\${(booking.pickupLocation || 'UNK').substring(0, 3).toUpperCase()}-\${Date.now().toString().slice(-6)}\`,
        status: booking.status || '접수완료',
        createdAt: booking.createdAt || new Date().toISOString()
      };

      setLastBooking(finalBooking);
      console.log("[App] lastBooking state scheduled:", finalBooking.id);

      await StorageService.saveBooking(finalBooking);
      console.log("[App] Booking saved to Cloud:", finalBooking.id);

      routerNavigate('/booking-success');
    } catch (saveError: any) {
      console.error("[App] Booking Save failed:", saveError);
      alert(\`예약 저장 중 오류가 발생했습니다.\\n\\n\${saveError.message || saveError}\\n관리자에게 문의해주세요.\`);
    }
  };

  const [scanId] = useState(() => new URLSearchParams(window.location.search).get('scan'));

  const pageVariants: Variants = {
    initial: { opacity: 0, x: 20, scale: 0.99 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -20, scale: 1.01 },
  };

  const pageTransition: Transition = {
    duration: 0.4,
    ease: [0.23, 1, 0.32, 1], // iOS style ease-out
  };

  const handleError = (error: Error, info: React.ErrorInfo) => {
    console.error("[App] Component Crash:", error, info);
  };

  const isUserView = location.pathname === '/' || location.pathname.startsWith('/branch/') || location.pathname.startsWith('/notice');

  const renderRoutes = () => {
    let branchSchema = undefined;
    if (customerBranch) {
      branchSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": \`Beeliber - \${customerBranch.name}\`,
        "image": "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&q=80&w=1200",
        "url": \`https://bee-liber.com/branch/\${customerBranchCode}\`,
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

    const LandingElement = (
      <motion.div key="landing" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
        <SEO
          title={customerBranch ? \`Beeliber - \${customerBranch.name} Luggage Delivery & Storage\` : t.meta_title}
          description={customerBranch ? \`Professional luggage storage and delivery service at \${customerBranch.name}. Same-day luggage delivery between hotel and airport.\` : t.meta_description}
          keywords={t.meta_keywords}
          schema={branchSchema}
        />
        <LandingRenewal
          t={t}
          lang={lang}
          onNavigate={navigate}
          onLangChange={setLang}
          onAdminClick={() => routerNavigate('/admin')}
          onLoginClick={() => setShowLoginModal(true)}
          onMyPageClick={() => routerNavigate('/mypage')}
          user={currentUser}
          onSuccess={handleBookingSuccess}
          branchCode={customerBranchCode || undefined}
        />
      </motion.div>
    );

    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={LandingElement} />
        <Route path="/branch/:branchCode" element={LandingElement} />
        <Route path="/notice*" element={LandingElement} />
        
        <Route path="/admin" element={
          <motion.div key="admin-login" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <AdminLoginPage
              onLogin={(name, jobTitle, branchId) => {
                setAdminInfo({ name, jobTitle, branchId: branchId || '' });
                if (branchId) {
                  routerNavigate(\`/admin/branch/\${branchId}\`);
                } else {
                  routerNavigate('/admin/dashboard');
                }
              }}
              onCancel={() => routerNavigate('/')}
            />
          </motion.div>
        } />
        
        <Route path="/admin/dashboard" element={
          !adminInfo.name ? <Navigate to="/admin" replace /> :
          <motion.div key="admin" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <AdminDashboard
              onBack={() => routerNavigate('/')}
              onStaffMode={() => routerNavigate('/staff/scan')}
              adminName={adminInfo.name}
              jobTitle={adminInfo.jobTitle}
              scanId={scanId || undefined}
              lang={lang}
              t={t}
            />
          </motion.div>
        } />

        <Route path="/admin/branch/:branchId" element={
          !adminInfo.name ? <Navigate to="/admin" replace /> :
          <motion.div key="branch-admin" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <BranchAdminPage
              branchId={location.pathname.split('/').pop() || ''}
              lang={lang}
              t={t}
              onBack={() => routerNavigate('/')}
            />
          </motion.div>
        } />

        <Route path="/manual" element={
          <motion.div key="manual" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <ManualPage onBack={() => routerNavigate('/')} t={t.manual} />
          </motion.div>
        } />

        <Route path="/locations" element={
          <motion.div key="locations" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <LocationsPage
              onBack={() => routerNavigate('/')}
              onSelectLocation={handleLocationSelect}
              t={t}
              lang={lang}
              onLangChange={setLang}
              user={currentUser}
              initialLocationId={preSelectedBooking?.pickupLocation}
            />
          </motion.div>
        } />

        <Route path="/partnership" element={
          <motion.div key="partnership" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <PartnershipPage onBack={() => routerNavigate('/')} t={t} />
          </motion.div>
        } />

        <Route path="/services" element={
          <motion.div key="services" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <ServicesPage onBack={() => routerNavigate('/')} t={t.services_page} landingT={t.landing_renewal} />
          </motion.div>
        } />

        <Route path="/terms" element={
           <motion.div key="terms" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
             <TermsPage onBack={() => routerNavigate('/')} t={t} />
           </motion.div>
        } />

        <Route path="/privacy" element={
           <motion.div key="privacy" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
             <PrivacyPage onBack={() => routerNavigate('/')} t={t} />
           </motion.div>
        } />

        <Route path="/booking" element={
          <motion.div key="booking-page" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <BookingPage
              t={t}
              lang={lang}
              locations={locations}
              initialLocationId={preSelectedBooking?.pickupLocation}
              initialServiceType={preSelectedBooking?.serviceType as ServiceType | undefined}
              initialDate={preSelectedBooking?.date}
              initialReturnDate={preSelectedBooking?.returnDate}
              initialBagSizes={preSelectedBooking?.bagCounts}
              onBack={() => routerNavigate('/locations')}
              onSuccess={handleBookingSuccess}
              user={currentUser}
              customerBranchId={customerBranch?.id}
              customerBranchRates={customerBranch?.commissionRates}
            />
          </motion.div>
        } />

        <Route path="/booking-success" element={
          <motion.div key="booking-success" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <BookingSuccess
              booking={lastBooking}
              locations={locations}
              onBack={() => routerNavigate('/')}
              t={t}
              lang={lang}
            />
          </motion.div>
        } />

        <Route path="/tracking" element={
          <motion.div key="tracking" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <UserTrackingPage
              onBack={() => routerNavigate('/')}
              t={t}
              lang={lang}
            />
          </motion.div>
        } />

        <Route path="/staff/scan" element={
          <motion.div key="staff-scan" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <StaffScanPage
              onBack={() => routerNavigate('/admin/dashboard')}
              adminName={adminInfo.name}
              t={t}
              lang={lang}
            />
          </motion.div>
        } />

        <Route path="/mypage" element={
          <MyPage
            t={t}
            onClose={() => routerNavigate('/')}
          />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  };

  return (
    <div className="w-full bg-slate-50 font-sans selection:bg-bee-yellow selection:text-bee-black overflow-x-hidden">
      <SEO
        title={isUserView ? t.seo?.title : \`\${t.seo?.title} - Beeliber\`}
        description={t.seo?.description}
        keywords={t.seo?.keywords}
        lang={lang}
        path={location.pathname}
      />
      <ErrorBoundary>
        <AnimatePresence mode="wait">
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-bee-yellow border-t-transparent rounded-full animate-spin"></div></div>}>
            {renderRoutes()}
          </Suspense>
        </AnimatePresence>
      </ErrorBoundary>

      {isUserView && (
        <Suspense fallback={null}>
          <Footer
            t={t}
            onNavigate={navigate}
          />
        </Suspense>
      )}
      {isUserView && (
        <Suspense fallback={null}>
          <ChatBot t={t.chatbot} lang={lang} />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <NoticePopup t={t} />
      </Suspense>
      
      <Suspense fallback={null}>
        <LoginModal
          isOpen={showLoginModal}
          t={t}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={() => setShowLoginModal(false)}
          onSwitchToSignup={() => { setShowLoginModal(false); setShowSignupModal(true); }}
        />
      </Suspense>
      <Suspense fallback={null}>
        <SignupModal
          isOpen={showSignupModal}
          t={t}
          onClose={() => setShowSignupModal(false)}
          onSignupSuccess={() => setShowSignupModal(false)}
          onSwitchToLogin={() => { setShowSignupModal(false); setShowLoginModal(true); }}
        />
      </Suspense>
    </div>
  );
};

export default App;
// Final push verification commit - Beeliber Smart Multi-language v1.1
\`

fs.writeFileSync('client/App.tsx', newAppTsx);
console.log('App.tsx fully refactored with code splitting and proper React Router implementation!');
