const fs = require('fs');

let content = fs.readFileSync('client/App.tsx', 'utf8');

// 1. Add lazy and Suspense imports
if (!content.includes('import React, { useState, useEffect, lazy, Suspense }')) {
    content = content.replace(
        /import React, { useState, useEffect } from 'react';/,
        "import React, { useState, useEffect, lazy, Suspense } from 'react';"
    );
}

// 2. Modify component imports to lazy imports
const componentsToLazyLoad = [
    'LandingRenewal', 'BeeAIReservation', 'AdminDashboard', 'AdminLoginPage',
    'ManualPage', 'BookingSuccess', 'PartnershipPage', 'ServicesPage',
    'TermsPage', 'PrivacyPage', 'UserTrackingPage', 'StaffScanPage',
    'BookingPage', 'LocationsPage', 'MyPage', 'BranchAdminPage'
];

componentsToLazyLoad.forEach(component => {
    const importRegex = new RegExp(\`import \${component} from './components/\${component}';\`, 'g');
  content = content.replace(importRegex, \`const \${component} = lazy(() => import('./components/\${component}'));\`);
});

// 3. Update Suspense fallback around renderRoutes
if (!content.includes('<Suspense fallback=')) {
  content = content.replace(
    /<AnimatePresence mode="wait">\s*\{renderRoutes\(\)\}\s*<\/AnimatePresence>/,
    \`<AnimatePresence mode="wait">
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-bee-yellow border-t-transparent rounded-full animate-spin"></div></div>}>
            {renderRoutes()}
          </Suspense>
        </AnimatePresence>\`
  );
}

// 4. Remove all view state and old navigation code
// Remove lines 62 to 182 logic manually.
// Regex is too risky, let's parse lines.
let lines = content.split('\\n');

// Find getPathFromView and remove it
let getPathMatchStart = lines.findIndex(line => line.includes('const getPathFromView = (view: ViewType): string => {'));
if (getPathMatchStart !== -1) {
  let getPathMatchEnd = lines.findIndex((line, i) => i > getPathMatchStart && line.startsWith('  };'));
  if (getPathMatchEnd !== -1) {
    lines.splice(getPathMatchStart, getPathMatchEnd - getPathMatchStart + 1);
  }
}

// Reload lines as index might have changed
content = lines.join('\\n');
lines = content.split('\\n');

// Find view state
let viewStateIndex = lines.findIndex(line => line.includes('const [view, setView] = useState<ViewType>'));
if (viewStateIndex !== -1) {
  lines.splice(viewStateIndex, 1);
}

// Find preSelectedStorageId and remove
let preStorageIndex = lines.findIndex(line => line.includes('const [preSelectedStorageId, setPreSelectedStorageId]'));
if (preStorageIndex !== -1) {
  lines.splice(preStorageIndex, 1);
}

// Find handlePopState useEffect
let popStateStart = lines.findIndex(line => line.includes('const handlePopState = () => {'));
if (popStateStart !== -1) {
  let useEffectStart = popStateStart - 1; // useEffect line
  let useEffectEnd = popStateStart + 5; // roughly 6 lines total
  lines.splice(useEffectStart - 1, useEffectEnd - useEffectStart + 2); // Including comment
}

// Replace the navigate function
let navStart = lines.findIndex(line => line.includes('const navigate = (newView: ViewType) => {'));
if (navStart !== -1) {
  let navEnd = navStart + 7;
  lines.splice(navStart - 1, navEnd - navStart + 2); // remove old navigate
}

// Now add the new navigate function above handleLocationSelect
content = lines.join('\\n');

const newNavigateCode = \`
  // React Router wrapper for legacy code compatibility
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
\`;

content = content.replace(/  const handleLocationSelect = \(/, newNavigateCode + '\\n  const handleLocationSelect = (');

// Remove getViewFromPath
let getViewIndexStart = content.indexOf('  const getViewFromPath = (path: string): ViewType => {');
if (getViewIndexStart !== -1) {
  let getViewIndexEnd = content.indexOf('  };\\n\\n', getViewIndexStart);
  if (getViewIndexEnd !== -1) {
    content = content.replace(content.substring(getViewIndexStart, getViewIndexEnd + 6), '');
  }
}

// Finally remove the unused ViewType 'view' variable check from bottom 
// Wait, the bottom had MyPage wrapped with {view === 'MYPAGE' && (
content = content.replace(/\{view === 'MYPAGE' && \\(|\\{view === 'MYPAGE' && /g, '{false && (');
// Actually, MyPage is already injected into Routes properly, so we should just remove the bottom block altogether
const myPageBlock = \`      {view === 'MYPAGE' && (
        <MyPage
          t={t}
          onClose={() => navigate('USER')}
        />
      )}\`;
content = content.replace(myPageBlock, '');
content = content.replace(/      \\{false && \\(\n        <MyPage\n          t=\\{t\\}\n          onClose=\\{\\(\\) => navigate\\('USER'\\)\\}\n        />\n      \\)\\}/s, '');

fs.writeFileSync('client/App.tsx', content);
console.log('App.tsx React.lazy and Suspense applied!');
