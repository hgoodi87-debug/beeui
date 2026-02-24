const fs = require('fs');

let content = fs.readFileSync('client/App.tsx', 'utf8');
let lines = content.split('\n');

const startIndex = lines.findIndex(line => line.includes('const renderView = () => {'));
const endIndex = lines.findIndex((line, i) => i > startIndex && line.includes('  return (') && lines[i + 1] && lines[i + 1].includes('<div className="w-full'));

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find start or end index", startIndex, endIndex);
    process.exit(1);
}

const routesBlock = `
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
          onAdminClick={() => navigate('ADMIN_LOGIN')}
          onLoginClick={() => setShowLoginModal(true)}
          onMyPageClick={() => navigate('MYPAGE')}
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
              onCancel={() => navigate('USER')}
            />
          </motion.div>
        } />
        
        <Route path="/admin/dashboard" element={
          !adminInfo.name ? <Navigate to="/admin" replace /> :
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
        } />

        <Route path="/admin/branch/:branchId" element={
          !adminInfo.name ? <Navigate to="/admin" replace /> :
          <motion.div key="branch-admin" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <BranchAdminPage
              branchId={location.pathname.split('/').pop() || ''}
              lang={lang}
              t={t}
              onBack={() => navigate('USER')}
            />
          </motion.div>
        } />

        <Route path="/manual" element={
          <motion.div key="manual" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <ManualPage onBack={() => navigate('USER')} t={t.manual} />
          </motion.div>
        } />

        <Route path="/locations" element={
          <motion.div key="locations" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <LocationsPage
              onBack={() => navigate('USER')}
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
            <PartnershipPage onBack={() => navigate('USER')} t={t} />
          </motion.div>
        } />

        <Route path="/services" element={
          <motion.div key="services" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <ServicesPage onBack={() => navigate('USER')} t={t.services_page} landingT={t.landing_renewal} />
          </motion.div>
        } />

        <Route path="/terms" element={
           <motion.div key="terms" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
             <TermsPage onBack={() => navigate('USER')} t={t} />
           </motion.div>
        } />

        <Route path="/privacy" element={
           <motion.div key="privacy" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
             <PrivacyPage onBack={() => navigate('USER')} t={t} />
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
              onBack={() => navigate('LOCATIONS')}
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
              onBack={() => navigate('USER')}
              t={t}
              lang={lang}
            />
          </motion.div>
        } />

        <Route path="/tracking" element={
          <motion.div key="tracking" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <UserTrackingPage
              onBack={() => navigate('USER')}
              t={t}
              lang={lang}
            />
          </motion.div>
        } />

        <Route path="/staff/scan" element={
          <motion.div key="staff-scan" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
            <StaffScanPage
              onBack={() => navigate('ADMIN')}
              adminName={adminInfo.name}
              t={t}
              lang={lang}
            />
          </motion.div>
        } />

        <Route path="/mypage" element={
          <MyPage
            t={t}
            onClose={() => navigate('USER')}
          />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  };
`;

lines.splice(startIndex, endIndex - startIndex, routesBlock);
fs.writeFileSync('client/App.tsx', lines.join('\n'));
console.log('App.tsx renderRoutes applied properly');
