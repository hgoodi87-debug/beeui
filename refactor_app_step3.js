const fs = require('fs');

let content = fs.readFileSync('client/App.tsx', 'utf8');

// 1. Add Zustand Store Imports
if (!content.includes('import { useAppStore }')) {
  content = content.replace(
    /import { useCurrentUser } from '\.\/src\/domains\/user\/hooks\/useCurrentUser';/,
    `import { useCurrentUser } from './src/domains/user/hooks/useCurrentUser';
import { useAppStore } from './src/store/appStore';
import { useBookingStore } from './src/store/bookingStore';`
  );
}

// 2. Replace useState calls with Zustand hooks
const replaceMap = {
  // lang
  "const [lang, setLang] = useState(() => localStorage.getItem('beeliber_lang') || 'ko');":
    "const lang = useAppStore(state => state.lang);\n  const setLang = useAppStore(state => state.setLang);",

  // adminInfo
  "const [adminInfo, setAdminInfo] = useState({ name: '', jobTitle: '', branchId: '' });":
    "const adminInfo = useAppStore(state => state.adminInfo);\n  const setAdminInfo = useAppStore(state => state.setAdminInfo);",

  // preSelectedBooking
  "const [preSelectedBooking, setPreSelectedBooking] = useState<{":
    "const preSelectedBooking = useBookingStore(state => state.preSelectedBooking);\n  const setPreSelectedBooking = useBookingStore(state => state.setPreSelectedBooking); //",

  // lastBooking
  "const [lastBooking, setLastBooking] = useState<BookingState | null>(null);":
    "const lastBooking = useBookingStore(state => state.lastBooking);\n  const setLastBooking = useBookingStore(state => state.setLastBooking);",

  // customerBranchCode
  "const [customerBranchCode, setCustomerBranchCode] = useState<string | null>(null);":
    "const customerBranchCode = useBookingStore(state => state.customerBranchCode);\n  const setCustomerBranchCode = useBookingStore(state => state.setCustomerBranchCode);",

  // customerBranch
  "const [customerBranch, setCustomerBranch] = useState<Branch | null>(null);":
    "const customerBranch = useBookingStore(state => state.customerBranch);\n  const setCustomerBranch = useBookingStore(state => state.setCustomerBranch);"
};

for (const [key, value] of Object.entries(replaceMap)) {
  if (key.includes('pickupLocation: string,')) {
    // regex replace for the multi-line signature
    content = content.replace(/    pickupLocation: string,\n    serviceType: 'STORAGE' \| 'DELIVERY',\n    date\?: string,\n    returnDate\?: string,\n    bagCounts\?: \{ S: number, M: number, L: number, XL: number \}\n  \} \| null>\(null\);/g, value);
  } else {
    content = content.replace(key, value);
  }
}

// Remove localStorage useEffect for lang (handled by persist middleware!)
const langEffect = `  useEffect(() => {
    localStorage.setItem('beeliber_lang', lang);
  }, [lang]);`;
content = content.replace(langEffect, '');

fs.writeFileSync('client/App.tsx', content);
console.log('App.tsx Zustand refactoring completed!');
