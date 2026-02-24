import React, { useState, useEffect, useMemo } from 'react';
import { app, db, storage } from '../firebaseApp';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  addDoc
} from 'firebase/firestore';
import { BookingState, BookingStatus, ServiceType, LocationOption, LocationType, DiscountCode, PriceSettings, StorageTier, RoutePrice, AdminUser, PartnershipInquiry, SystemNotice, HeroConfig, GoogleCloudConfig, PrivacyPolicyData, TermsPolicyData, SnsType, BagSizes, CashClosing, Expenditure, AdminTab, Branch, BranchProspect } from '../types';
import { LOCATIONS as INITIAL_LOCATIONS } from '../constants';
import { StorageService } from '../services/storageService';
import { useBookings } from '../src/domains/booking/hooks/useBookings';
import { useLocations } from '../src/domains/location/hooks/useLocations';
import { useQueryClient } from '@tanstack/react-query';
import { sendMessageToGemini } from '../services/geminiService';
import DailyDetailModal from './admin/DailyDetailModal';
import OverviewTab from './admin/OverviewTab';
import LogisticsTab from './admin/LogisticsTab';
import LocationsTab from './admin/LocationsTab';
import DailySettlementTab from './admin/DailySettlementTab';
import AccountingTab from './admin/AccountingTab';
import NoticeTab from './admin/NoticeTab';
import PartnershipTab from './admin/PartnershipTab';
import HRTab from './admin/HRTab';
import SystemTab from './admin/SystemTab';
import CloudTab from './admin/CloudTab';
import PrivacyEditorTab from './admin/PrivacyEditorTab';
import TermsEditorTab from './admin/TermsEditorTab';
import BookingDetailModal from './admin/BookingDetailModal';
import ManualBookingModal from './admin/ManualBookingModal';
import ChatTab from './admin/ChatTab';
import DiscountTab from './admin/DiscountTab';
import ReportsTab from './admin/ReportsTab';


const DEFAULT_DELIVERY_PRICES: PriceSettings = { S: 20000, M: 20000, L: 25000, XL: 29000 };
const INITIAL_STORAGE_TIERS: StorageTier[] = [
  { id: 'st-4h', label: '4시간 이하 (Under 4h)', prices: { S: 2000, M: 3000, L: 5000, XL: 7000 } },
  { id: 'st-1d', label: '1일 (24시간)', prices: { S: 8000, M: 10000, L: 15000, XL: 20000 } },
  { id: 'st-week', label: '7일 (장기)', prices: { S: 40000, M: 55000, L: 80000, XL: 110000 } }
];

// HERO constant removed


const CLOUD_PLACEHOLDERS: Record<string, string> = {
  apiKey: "예: AIzaSy... (API Key)",
  authDomain: "예: project-id.firebaseapp.com",
  projectId: "예: project-id (프로젝트 ID)",
  storageBucket: "예: project-id.appspot.com",
  messagingSenderId: "예: 123456789... (Sender ID)",
  appId: "예: 1:123456789:web:... (App ID)"
};

const LOCATION_TYPE_OPTIONS = [
  { value: LocationType.PARTNER, label: '파트너지점 (Partner Branch)' },
  { value: LocationType.AIRPORT, label: '공항 (Airport)' },
  { value: LocationType.HOTEL, label: '호텔 (Hotel)' },
  { value: LocationType.AIRBNB, label: '에어비앤비 (Airbnb)' },
  { value: LocationType.GUESTHOUSE, label: '게스트하우스 (Guesthouse)' },
  { value: LocationType.OTHER, label: '기타 (Other)' },
];

interface AdminDashboardProps {
  onBack: () => void;
  onStaffMode?: () => void;
  adminName?: string;
  jobTitle?: string;
  scanId?: string;
  lang: string;
  t: any;
}

declare global {
  interface Window {
    naver: any;
  }
}

// Helper for safer JSON parsing
const safeJsonParse = (key: string, fallback: any) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return (parsed !== null && parsed !== undefined) ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
};

// Helper to get KST Date string YYYY-MM-DD
const getKSTDateString = () => {
  const now = new Date();
  // KST is UTC+9
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return kst.toISOString().split('T')[0];
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, onStaffMode, adminName, jobTitle, scanId, lang, t }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  // New: Status Tabs state
  type StatusTab = 'ALL' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  const [activeStatusTab, setActiveStatusTab] = useState<StatusTab>('ALL');

  const queryClient = useQueryClient();
  const { data: allBookings = [] } = useBookings();
  const [globalBranchFilter, setGlobalBranchFilter] = useState<string>('ALL');

  const bookings = useMemo(() => {
    if (globalBranchFilter === 'ALL') return allBookings;
    return allBookings.filter(b =>
      b.branchId === globalBranchFilter ||
      b.pickupLocation === globalBranchFilter ||
      b.dropoffLocation === globalBranchFilter
    );
  }, [allBookings, globalBranchFilter]);

  const { data: locations = [] } = useLocations();
  const [deliveryPrices, setDeliveryPrices] = useState<PriceSettings>(DEFAULT_DELIVERY_PRICES);
  const [storageTiers, setStorageTiers] = useState<StorageTier[]>(INITIAL_STORAGE_TIERS);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [inquiries, setInquiries] = useState<PartnershipInquiry[]>([]);
  const [branchProspects, setBranchProspects] = useState<BranchProspect[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // QR Scan Handling
  const [scannedBooking, setScannedBooking] = useState<BookingState | null>(null);
  const [isScanDetailVisible, setIsScanDetailVisible] = useState(false);

  useEffect(() => {
    if (scanId && bookings.length > 0) {
      const found = bookings.find(b => b.id === scanId);
      if (found) {
        setScannedBooking(found);
        setIsScanDetailVisible(true);
      }
    }
  }, [scanId, bookings]);

  // Notice State
  const [notice, setNotice] = useState<SystemNotice>({ isActive: false, imageUrl: '', content: '' });

  // Hero Config State
  const [heroConfig, setHeroConfig] = useState<HeroConfig>({
    imageUrl: '',
    mobileImageUrl: '',
    videoUrl: ''
  });


  // Add state for sending email
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  // Add state for processing refund
  const [refundingId, setRefundingId] = useState<string | null>(null);

  // Today KST State for automatic refresh
  const [todayKST, setTodayKST] = useState(getKSTDateString());
  const [selectedDetailDate, setSelectedDetailDate] = useState<string | null>(null);

  // Detail Modal & Edit State
  const [selectedBooking, setSelectedBooking] = useState<BookingState | null>(null);
  const [isManualBooking, setIsManualBooking] = useState(false);
  const [manualBookingForm, setManualBookingForm] = useState<Partial<BookingState>>({
    serviceType: ServiceType.DELIVERY,
    pickupLocation: '',
    dropoffLocation: '',
    pickupDate: new Date().toISOString().split('T')[0],
    pickupTime: '10:00',
    deliveryTime: '16:00',
    bags: 1,
    bagSizes: { S: 1, M: 0, L: 0, XL: 0 },
    userName: '',
    userEmail: '',
    snsType: SnsType.NONE,
    snsId: '',
    status: BookingStatus.PENDING,
    dropoffAddressDetail: '',
    finalPrice: 0,
    selectedStorageTierId: INITIAL_STORAGE_TIERS[0].id,
    paymentMethod: 'card',
    dropoffDate: new Date().toISOString().split('T')[0],
    useInsurance: false,
    insuranceLevel: 1,
    insuranceBagCount: 0,
    discountAmount: 0
  });

  // Function to handle email resend
  const handleResendEmail = async (booking: BookingState) => {
    if (!booking.id) return;
    if (!confirm(`Is it okay to resend the voucher email to ${booking.userName} (${booking.userEmail})?`)) return;

    setSendingEmailId(booking.id);
    try {
      const functions = getFunctions(app, 'us-central1');
      const resendVoucher = httpsCallable(functions, 'resendBookingVoucher');
      await resendVoucher({ bookingId: booking.id });
      alert('Email sent successfully!');
    } catch (error: any) {
      console.error("Failed to send email:", error);
      alert(`Failed to send email: ${error.message}`);
    } finally {
      setSendingEmailId(null);
    }
  };

  // Function to handle Refund
  const handleRefund = async (booking: BookingState) => {
    if (!booking.id) return;
    // Final Confirmation Popup
    if (!confirm(`[최종 확인]\n\n예약번호: ${booking.id}\n고객명: ${booking.userName}\n\n정말로 반품(환불) 처리하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

    setRefundingId(booking.id);
    try {
      const functions = getFunctions(app, 'us-central1');
      const processRefund = httpsCallable(functions, 'processBookingRefund');
      await processRefund({ bookingId: booking.id });
      alert('반품(환불) 처리가 완료되었습니다.');
      // Update local state to reflect change immediately (optional, or rely on snapshot)
    } catch (error: any) {
      console.error("Failed to process refund:", error);
      alert(`반품 처리 실패: ${error.message}`);
    } finally {
      setRefundingId(null);
    }
  };

  // Cloud Config State
  const [cloudConfig, setCloudConfig] = useState<GoogleCloudConfig>({
    apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '',
    isActive: false, enableWorkspaceAutomation: false, enableGeminiAutomation: true, googleChatWebhookUrl: ''
  });

  // Location Form State
  const [locForm, setLocForm] = useState<Partial<LocationOption>>({
    id: '',
    shortCode: '',
    name: '',
    type: LocationType.HOTEL,
    supportsDelivery: true,
    supportsStorage: true,
    isOrigin: true,
    isDestination: true,
    originSurcharge: 0,
    destinationSurcharge: 0,
    lat: 37.5665,
    lng: 126.9780,
    address: '',
    description: '',
    pickupGuide: '',
    pickupImageUrl: '',
    imageUrl: '',
    businessHours: '',
    businessHours_en: '',
    businessHours_ja: '',
    businessHours_zh: '',
    isActive: true
  });

  const [adminForm, setAdminForm] = useState<Partial<AdminUser>>({
    name: '',
    jobTitle: '',
    password: ''
  });
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);


  // Accounting / Revenue State
  const [revenueStartDate, setRevenueStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenueEndDate, setRevenueEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [cashClosing, setCashClosing] = useState({
    actualCash: 0,
    notes: ''
  });
  const [closings, setClosings] = useState<CashClosing[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);

  // Update dates when todayKST or activeTab changes
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayStr = firstDay.toISOString().split('T')[0];

    // Change: For Daily Settlement, default to today only. For others, default to month-to-date.
    if (activeTab === 'DAILY_SETTLEMENT') {
      setRevenueStartDate(todayKST);
    } else {
      setRevenueStartDate(firstDayStr);
    }

    setRevenueEndDate(todayKST);
    setExpForm(prev => ({ ...prev, date: todayKST }));
  }, [todayKST, activeTab]);
  const [expForm, setExpForm] = useState<Partial<Expenditure>>({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: 0,
    description: ''
  });

  const revenueStats = useMemo(() => {
    const start = new Date(revenueStartDate);
    const end = new Date(revenueEndDate);
    end.setHours(23, 59, 59, 999);

    const targetBookings = bookings.filter(b => {
      const d = new Date(b.pickupDate || '');
      // Strict exclusion: No deleted, no cancelled, no refunded
      return d >= start && d <= end &&
        !b.isDeleted &&
        b.status !== BookingStatus.CANCELLED &&
        b.status !== BookingStatus.REFUNDED;
    });

    const targetExps = expenditures.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });

    // Detailed stats for the period
    const totalRevenue = targetBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    const totalExp = targetExps.reduce((sum, e) => sum + (e.amount || 0), 0);

    const cash = targetBookings.filter(b => b.paymentMethod === 'cash').reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    const card = targetBookings.filter(b => b.paymentMethod === 'card').reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    const apple = targetBookings.filter(b => b.paymentMethod === 'apple').reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    const samsung = targetBookings.filter(b => b.paymentMethod === 'samsung').reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    const wechat = targetBookings.filter(b => b.paymentMethod === 'wechat').reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    const alipay = targetBookings.filter(b => b.paymentMethod === 'alipay').reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    const naver = targetBookings.filter(b => b.paymentMethod === 'naver').reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    const kakao = targetBookings.filter(b => b.paymentMethod === 'kakao').reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    const paypal = targetBookings.filter(b => b.paymentMethod === 'paypal').reduce((sum, b) => sum + (b.finalPrice || 0), 0);

    return { total: totalRevenue, cash, card, apple, samsung, wechat, alipay, naver, kakao, paypal, count: targetBookings.length, expenditure: totalExp };
  }, [bookings, expenditures, revenueStartDate, revenueEndDate]);

  const accountingDailyStats = useMemo(() => {
    const statsMap: Record<string, { date: string, count: number, total: number, cumulative: number }> = {};
    const start = new Date(revenueStartDate);
    const end = new Date(revenueEndDate);
    end.setHours(23, 59, 59, 999);

    const targetBookings = bookings.filter(b => {
      const d = new Date(b.pickupDate || '');
      return d >= start && d <= end && !b.isDeleted && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REFUNDED;
    });

    targetBookings.forEach(b => {
      const dateKey = b.pickupDate || 'Unknown';
      if (!statsMap[dateKey]) {
        statsMap[dateKey] = { date: dateKey, count: 0, total: 0, cumulative: 0 };
      }
      statsMap[dateKey].count++;
      statsMap[dateKey].total += (b.finalPrice || 0);
    });

    const sortedStats = Object.values(statsMap).sort((a, b) => a.date.localeCompare(b.date));
    let acc = 0;
    sortedStats.forEach(s => {
      acc += s.total;
      s.cumulative = acc;
    });

    return sortedStats.reverse(); // Latest first
  }, [bookings, revenueStartDate, revenueEndDate]);

  const accountingMonthlyStats = useMemo(() => {
    const statsMap: Record<string, { month: string, count: number, total: number, cumulative: number }> = {};
    const start = new Date(revenueStartDate);
    const end = new Date(revenueEndDate);
    end.setHours(23, 59, 59, 999);

    const targetBookings = bookings.filter(b => {
      const d = new Date(b.pickupDate || '');
      return d >= start && d <= end && !b.isDeleted && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REFUNDED;
    });

    targetBookings.forEach(b => {
      const dateKey = b.pickupDate || 'Unknown';
      if (dateKey === 'Unknown') return;
      const monthKey = dateKey.slice(0, 7); // YYYY-MM
      if (!statsMap[monthKey]) {
        statsMap[monthKey] = { month: monthKey, count: 0, total: 0, cumulative: 0 };
      }
      statsMap[monthKey].count++;
      statsMap[monthKey].total += (b.finalPrice || 0);
    });

    const sortedStats = Object.values(statsMap).sort((a, b) => a.month.localeCompare(b.month));
    let acc = 0;
    sortedStats.forEach(s => {
      acc += s.total;
      s.cumulative = acc;
    });

    return sortedStats.reverse(); // Latest first
  }, [bookings, revenueStartDate, revenueEndDate]);

  const dailySettlementStats = useMemo(() => {
    const start = new Date(revenueStartDate);
    const end = new Date(revenueEndDate);
    end.setHours(23, 59, 59, 999);

    const targetBookings = bookings.filter(b => {
      const d = new Date(b.pickupDate || '');
      return d >= start && d <= end && !b.isDeleted && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REFUNDED;
    });

    const targetExps = expenditures.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });

    // Counts
    const deliveryBookings = targetBookings.filter(b => b.serviceType === ServiceType.DELIVERY);
    const storageBookings = targetBookings.filter(b => b.serviceType === ServiceType.STORAGE);

    // Bag Sizes
    const bagSizes = { S: 0, M: 0, L: 0, XL: 0 };
    targetBookings.forEach(b => {
      if (b.bagSizes) {
        bagSizes.S += (b.bagSizes.S || 0);
        bagSizes.M += (b.bagSizes.M || 0);
        bagSizes.L += (b.bagSizes.L || 0);
        bagSizes.XL += (b.bagSizes.XL || 0);
      }
    });

    // Revenue by channel (Method)
    const revenueByMethod = {
      card: 0,
      cash: 0,
      apple: 0,
      samsung: 0,
      wechat: 0,
      alipay: 0,
      naver: 0,
      kakao: 0,
      paypal: 0
    };
    targetBookings.forEach(b => {
      const method = b.paymentMethod || 'cash'; // Default to cash if unspecified
      if (method in revenueByMethod) {
        revenueByMethod[method as keyof typeof revenueByMethod] += (b.finalPrice || 0);
      }
    });

    const totalRevenue = targetBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    const totalExp = targetExps.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Expenditure breakdown by category
    const expByCategory: Record<string, number> = {};
    targetExps.forEach(e => {
      const cat = e.category || '기타';
      expByCategory[cat] = (expByCategory[cat] || 0) + (e.amount || 0);
    });

    // Discounts
    // Note: We don't have a direct 'discountAmount' in BookingState, 
    // but we can infer it if we know the base price vs final price.
    // For now, let's aggregate finalPrice and mention if it uses a discountCode.
    const bookingsWithDiscount = targetBookings.filter(b => b.discountCode);
    const discountCodeCounts: Record<string, number> = {};
    bookingsWithDiscount.forEach(b => {
      if (b.discountCode) {
        discountCodeCounts[b.discountCode] = (discountCodeCounts[b.discountCode] || 0) + 1;
      }
    });

    // Cash Closing for this period
    const periodClosing = closings.find(c => c.date === revenueEndDate);

    const netProfit = totalRevenue - totalExp;
    const vat = Math.floor(totalRevenue * 0.1); // Assuming 10% VAT
    return {
      totalRevenue,
      totalExp,
      netProfit: totalRevenue - totalExp,
      vat: Math.round(totalRevenue / 11),
      deliveryCount: deliveryBookings.length,
      storageCount: storageBookings.length,
      bagSizes,
      revenueByMethod,
      expByCategory,
      discountCodeCounts
    };
  }, [bookings, expenditures, revenueStartDate, revenueEndDate]);

  const filteredExpenditures = useMemo(() => {
    const start = new Date(revenueStartDate);
    const end = new Date(revenueEndDate);
    end.setHours(23, 59, 59, 999);

    return expenditures.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [expenditures, revenueStartDate, revenueEndDate]);

  const handleCashClose = async () => {
    if (!confirm('마감 처리 하시겠습니까?')) return;
    const diff = revenueStats.cash - cashClosing.actualCash;

    try {
      await StorageService.saveCashClosing({
        date: revenueEndDate,
        totalRevenue: revenueStats.total,
        cashRevenue: revenueStats.cash,
        cardRevenue: revenueStats.card,
        appleRevenue: revenueStats.apple,
        samsungRevenue: revenueStats.samsung,
        wechatRevenue: revenueStats.wechat,
        alipayRevenue: revenueStats.alipay,
        naverRevenue: revenueStats.naver,
        kakaoRevenue: revenueStats.kakao,
        paypalRevenue: revenueStats.paypal,
        actualCashOnHand: cashClosing.actualCash,
        difference: diff,
        notes: cashClosing.notes,
        closedBy: adminName || 'Admin',
        createdAt: new Date().toISOString()
      });
      alert('시재 마감이 완료되었습니다.');
      setCashClosing({ actualCash: 0, notes: '' });
    } catch (e) {
      console.error(e);
      alert('마감 처리 실패');
    }
  };

  const handleSaveExpenditure = async () => {
    if (!expForm.category || !expForm.amount) {
      alert('항목과 금액을 입력해주세요.');
      return;
    }
    try {
      await StorageService.saveExpenditure({
        ...expForm,
        createdBy: adminName || 'Admin',
        createdAt: new Date().toISOString()
      } as Expenditure);
      alert('지출 내역이 저장되었습니다.');
      setExpForm({
        date: new Date().toISOString().split('T')[0],
        category: '',
        amount: 0,
        description: ''
      });
    } catch (e) {
      console.error(e);
      alert('저장 실패');
    }
  };

  const deleteExpenditure = async (id: string) => {
    if (!confirm('지출 내역을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'expenditures', id));
    } catch (e) {
      console.error(e);
      alert('삭제 실패');
    }
  };

  const handleExportCSV = () => {
    // 1. Filter bookings based on the currently selected revenue range
    const start = new Date(revenueStartDate);
    const end = new Date(revenueEndDate);
    end.setHours(23, 59, 59, 999);

    const filteredForExport = bookings.filter(b => {
      const d = new Date(b.pickupDate || '');
      return d >= start && d <= end && !b.isDeleted;
    }).sort((a, b) => (b.pickupDate || '').localeCompare(a.pickupDate || ''));

    if (filteredForExport.length === 0 && closings.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    const BOM = '\uFEFF';
    let csvContent = BOM;

    // --- Section 1: Detailed Booking Records ---
    const bookingHeaders = ['예약번호', '상태', '성함', '픽업날짜', '반납날짜', '픽업장소', '반납장소', '서비스타입', '결제금액', '생성일'];
    csvContent += bookingHeaders.join(',') + '\n';

    const bookingRows = filteredForExport.map(b => {
      const pickupLoc = locations.find(l => l.id === b.pickupLocation)?.name || b.pickupLocation;
      const dropoffLoc = locations.find(l => l.id === b.dropoffLocation)?.name || b.dropoffLocation;
      return [
        b.id,
        b.status,
        `"${(b.userName || '').replace(/"/g, '""')}"`,
        b.pickupDate,
        b.returnDate || '-',
        `"${(pickupLoc || '').replace(/"/g, '""')}"`,
        `"${(dropoffLoc || '').replace(/"/g, '""')}"`,
        b.serviceType,
        b.finalPrice,
        b.createdAt
      ].join(',');
    });
    csvContent += bookingRows.join('\n') + '\n\n';

    // --- Section 2: Cash Closing Summary (Legacy) ---
    csvContent += '--- 시재 마감 내역 (Cash Closings) ---\n';
    const closingHeaders = ['마감날짜', '총 매출', '카드 매출', '현금 매출', '실제 시재', '차액', '메모', '마감자', '생성일'];
    csvContent += closingHeaders.join(',') + '\n';

    const closingRows = closings.map(c => [
      c.date,
      c.totalRevenue,
      c.cardRevenue,
      c.cashRevenue,
      c.actualCashOnHand,
      c.difference,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
      c.closedBy,
      c.createdAt
    ].join(','));
    csvContent += closingRows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `beeliber_detail_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Privacy Policy Form
  const [privacyForm, setPrivacyForm] = useState<PrivacyPolicyData>({
    title: '개인정보처리방침',
    last_updated: '',
    intro: '',
    content: []
  });

  // Terms of Service Form
  const [termsForm, setTermsForm] = useState<TermsPolicyData>({
    title: '서비스 이용약관',
    last_updated: '',
    intro: '',
    content: []
  });

  // Function to refresh static data manually
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['locations'] }),
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
      ]);

      const [loadedInquiries, loadedProspects] = await Promise.all([
        StorageService.getInquiries(),
        StorageService.getBranchProspects()
      ]);

      if (Array.isArray(loadedInquiries)) {
        loadedInquiries.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setInquiries(loadedInquiries);
      } else {
        setInquiries([]);
      }

      if (Array.isArray(loadedProspects)) {
        loadedProspects.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setBranchProspects(loadedProspects);
      } else {
        setBranchProspects([]);
      }

      // Sync local storage items using safe parse
      const cloudDeliveryPrices = await StorageService.getDeliveryPrices();
      if (cloudDeliveryPrices) {
        setDeliveryPrices(cloudDeliveryPrices);
      } else {
        setDeliveryPrices(safeJsonParse('beeliber_delivery_prices', DEFAULT_DELIVERY_PRICES));
      }

      const cloudTiers = await StorageService.getStorageTiers();
      if (cloudTiers && Array.isArray(cloudTiers)) {
        setStorageTiers(cloudTiers);
      } else {
        setStorageTiers(safeJsonParse('beeliber_storage_tiers', INITIAL_STORAGE_TIERS));
      }

      const savedNotice = safeJsonParse('beeliber_notice', null);
      if (savedNotice) setNotice(savedNotice);

      const savedPrivacy = await StorageService.getPrivacyPolicy();
      if (savedPrivacy) setPrivacyForm(savedPrivacy);

      const savedTerms = await StorageService.getTermsPolicy();
      if (savedTerms) setTermsForm(savedTerms);

      const savedCloud = StorageService.getCloudConfig();
      if (savedCloud) setCloudConfig(savedCloud);

    } catch (error) {
      console.error("Failed to refresh data", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Visual delay
    }
  };

  // Initial Load & Subscriptions
  useEffect(() => {
    refreshData();

    // Subscribe to real-time updates for Inquiries and Prospects (Bookings and Locs handled by hooks)
    const unsubscribeInquiries = StorageService.subscribeInquiries((data) => {
      setInquiries(Array.isArray(data) ? data : []);
    });

    const unsubscribeProspects = StorageService.subscribeBranchProspects((data) => {
      setBranchProspects(Array.isArray(data) ? data : []);
    });

    // Listen for visibility change (tab focus) to refresh static data
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const unsubscribeClosings = StorageService.subscribeCashClosings((data) => {
      setClosings(Array.isArray(data) ? data : []);
    });

    const unsubscribeExps = StorageService.subscribeExpenditures((data) => {
      setExpenditures(Array.isArray(data) ? data : []);
    });

    const unsubscribeAdmins = StorageService.subscribeAdmins((data) => {
      setAdmins(Array.isArray(data) ? data : []);
    });

    // KST Refresh Timer - Check every minute if day has changed
    const timer = setInterval(() => {
      const currentKST = getKSTDateString();
      setTodayKST(prev => {
        if (prev !== currentKST) {
          console.log("KST Day changed!", currentKST);
          return currentKST;
        }
        return prev;
      });
    }, 60000);

    return () => {
      clearInterval(timer);
      unsubscribeInquiries();
      unsubscribeProspects();
      unsubscribeClosings();
      unsubscribeExps();
      unsubscribeAdmins();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Status Tab Configuration - Filtered for "Daily Reset" feel
  const STATUS_TABS: { id: StatusTab; label: string; count: number }[] = useMemo(() => {
    // Basic filter: Current Day + (Delivery vs Storage vs Trash)
    const baseBookings = bookings.filter(b => {
      // 1. Trash check
      if (activeTab === 'TRASH') return b.isDeleted === true;
      if (b.isDeleted) return false;

      // 2. Service type check
      if (activeTab === 'DELIVERY_BOOKINGS' && b.serviceType !== ServiceType.DELIVERY) return false;
      if (activeTab === 'STORAGE_BOOKINGS' && b.serviceType !== ServiceType.STORAGE) return false;

      // 3. Date check (Today KST)
      // FIX: Show all PENDING, TRANSIT, STORAGE, ARRIVED bookings regardless of date
      // COMPLETED, CANCELLED, REFUNDED only show for today
      const incompleteStatuses = [BookingStatus.PENDING, BookingStatus.TRANSIT, BookingStatus.STORAGE, BookingStatus.ARRIVED];
      const isStatusIncomplete = incompleteStatuses.includes(b.status as any);

      if (isStatusIncomplete) return true;
      return b.pickupDate === todayKST;
    });

    return [
      { id: 'ALL', label: '종합 (All)', count: baseBookings.length },
      { id: 'PENDING', label: '접수완료', count: baseBookings.filter(b => b.status === BookingStatus.PENDING).length },
      { id: 'ACTIVE', label: '이동/보관중', count: baseBookings.filter(b => b.status === BookingStatus.TRANSIT || b.status === BookingStatus.STORAGE || b.status === BookingStatus.ARRIVED).length },
      { id: 'COMPLETED', label: '완료', count: baseBookings.filter(b => b.status === BookingStatus.COMPLETED).length },
      { id: 'CANCELLED', label: '취소/환불', count: baseBookings.filter(b => b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REFUNDED).length },
    ];
  }, [bookings, activeTab, todayKST]);

  // Filter Bookings for Current Tab
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // 1. Service Type Filter
      if (activeTab === 'DELIVERY_BOOKINGS' && b.serviceType !== ServiceType.DELIVERY) return false;
      if (activeTab === 'STORAGE_BOOKINGS' && b.serviceType !== ServiceType.STORAGE) return false;

      // 2. Trash Bin Filter
      if (activeTab === 'TRASH') {
        return b.isDeleted === true;
      } else {
        if (b.isDeleted === true) return false;

        // FIX: Show all PENDING, TRANSIT, STORAGE, ARRIVED bookings regardless of date
        // Hide past bookings only if they are COMPLETED, CANCELLED, or REFUNDED
        const incompleteStatuses = [BookingStatus.PENDING, BookingStatus.TRANSIT, BookingStatus.STORAGE, BookingStatus.ARRIVED];
        const isStatusIncomplete = incompleteStatuses.includes(b.status as any);

        if (!isStatusIncomplete) {
          if (b.pickupDate && b.pickupDate < todayKST) return false;
          if (b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REFUNDED) return false;
        }
      }

      if (activeStatusTab !== 'ALL') {
        if (activeStatusTab === 'PENDING' && b.status !== BookingStatus.PENDING) return false;
        if (activeStatusTab === 'ACTIVE' && ![BookingStatus.TRANSIT, BookingStatus.STORAGE, BookingStatus.ARRIVED].includes(b.status as any)) return false;
        if (activeStatusTab === 'COMPLETED' && b.status !== BookingStatus.COMPLETED) return false;
        if (activeStatusTab === 'CANCELLED' && ![BookingStatus.CANCELLED, BookingStatus.REFUNDED].includes(b.status as any)) return false;
      }
      return true;
    });
  }, [bookings, activeTab, activeStatusTab, todayKST]);

  // Daily Statistics Calculation (Aggregated by pickupDate)
  const dailyStats = useMemo(() => {
    const stats: Record<string, { date: string, count: number, total: number }> = {};

    // Filter for last 3 months (~90 days)
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 90);

    // FIX: Use ALL bookings (unfiltered) to show historic data in stats
    bookings.forEach(booking => {
      if (!booking.pickupDate || booking.isDeleted) return;
      const bookingDate = new Date(booking.pickupDate);

      if (bookingDate >= limitDate) {
        const dateKey = booking.pickupDate;
        if (!stats[dateKey]) {
          stats[dateKey] = { date: dateKey, count: 0, total: 0 };
        }
        stats[dateKey].count += 1;
        stats[dateKey].total += (booking.finalPrice || 0);
      }
    });

    // Sort by date descending
    return Object.values(stats).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings]); // Depend on original bookings

  const totalRevenue3Months = useMemo(() => {
    return dailyStats.reduce((acc, curr) => acc + curr.total, 0);
  }, [dailyStats]);


  const focusLocation = (loc: LocationOption) => {
    setLocForm(loc);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateDeliveryPrice = (size: keyof PriceSettings, price: number) => {
    const newPrices = { ...deliveryPrices, [size]: price };
    setDeliveryPrices(newPrices);
    localStorage.setItem('beeliber_delivery_prices', JSON.stringify(newPrices));
    // Also save to Firestore
    StorageService.saveDeliveryPrices(newPrices).catch(console.error);
  };

  const updateStoragePrice = (tierId: string, size: keyof PriceSettings, price: number) => {
    const updated = storageTiers.map(tier => {
      if (tier.id === tierId) {
        return { ...tier, prices: { ...tier.prices, [size]: price } };
      }
      return tier;
    });
    setStorageTiers(updated);
    localStorage.setItem('beeliber_storage_tiers', JSON.stringify(updated));
    // Also save to Firestore
    StorageService.saveStorageTiers(updated).catch(console.error);
  };

  const addLocation = async () => {
    // 1. Validation - Sanitize inputs
    const trimmedId = locForm.id?.trim();
    const trimmedName = locForm.name?.trim();
    const trimmedShortCode = locForm.shortCode?.trim() || (trimmedId ? trimmedId.split('-')[0].toUpperCase() : '');
    const trimmedDesc = locForm.description?.trim() || trimmedName || '';

    if (!trimmedId || !trimmedName) {
      alert('지점 ID와 명칭을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      // 2. Prepare cleaned data
      const newLoc: LocationOption = {
        ...(locForm as LocationOption),
        id: trimmedId,
        name: trimmedName,
        shortCode: trimmedShortCode,
        description: trimmedDesc
      };

      await StorageService.saveLocation(newLoc);

      await StorageService.saveLocation(newLoc);

      setLocForm({
        id: '', shortCode: '', name: '', type: LocationType.HOTEL, supportsDelivery: true, supportsStorage: true,
        isOrigin: true, isDestination: true, originSurcharge: 0, destinationSurcharge: 0,
        lat: 37.5665, lng: 126.9780, address: '', description: '',
        pickupGuide: '', pickupImageUrl: '',
        businessHours: '', businessHours_en: '', businessHours_ja: '', businessHours_zh: ''
      });

      alert('지점 정보가 성공적으로 저장되었습니다.');
      refreshData(); // Sync full state

    } catch (e: any) {
      console.error("Failed to save location", e);
      let errorMsg = "지점 저장 중 오류가 발생했습니다.";
      if (e.code === 'permission-denied' || e.message?.includes('permission')) {
        errorMsg += "\n(권한 오류: CLOUD 탭에서 '저장소 활성화'를 끄고 로컬 모드를 사용하거나, Firebase 규칙을 확인하세요.)";
      } else if (e.message) {
        errorMsg += `\n(${e.message})`;
      }
      alert(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // CSV Helpers
  const downloadCSV = () => {
    // BOM for Excel UTF-8
    const BOM = '\uFEFF';
    const headers = ['id', 'name', 'type', 'description', 'address', 'lat', 'lng', 'shortCode', 'supportsDelivery', 'supportsStorage', 'originSurcharge', 'destinationSurcharge'];

    const rows = locations.map(l => [
      l.id,
      `"${(l.name || '').replace(/"/g, '""')}"`, // Escape quotes
      l.type,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      l.lat,
      l.lng,
      l.shortCode,
      l.supportsDelivery,
      l.supportsStorage,
      l.originSurcharge || 0,
      l.destinationSurcharge || 0
    ].join(','));

    const csvContent = BOM + headers.join(',') + '\n' + rows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'beeliber_locations.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        // Split lines and handle standard CSV parsing (basic implementation)
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) {
          alert("유효하지 않은 CSV 파일입니다 (데이터 없음).");
          return;
        }

        // Basic parser (ignores fancy quote escaping for simplicity in this demo, assumes standard generated CSV)
        // For robust parsing, a library like papa-parse is recommended, but we'll do a simple split for now
        // leveraging the fact we generated it. 
        // NOTE: This simple split might break if descriptions contain commas. 
        // Let's assume the user edits safely or we use a regex.

        const newLocations: LocationOption[] = [];

        // Skip header
        for (let i = 1; i < lines.length; i++) {
          // Regex to match CSV fields including quoted ones
          const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          // Fallback to simple split if regex fails or for unquoted
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

          if (cols.length < 5) continue;

          const loc: LocationOption = {
            id: cols[0],
            name: cols[1],
            type: (cols[2] as any) || LocationType.OTHER,
            description: cols[3],
            address: cols[4],
            lat: parseFloat(cols[5] || '0'),
            lng: parseFloat(cols[6] || '0'),
            shortCode: cols[7] || '',
            supportsDelivery: cols[8] === 'true',
            supportsStorage: cols[9] === 'true',
            originSurcharge: parseInt(cols[10] || '0'),
            destinationSurcharge: parseInt(cols[11] || '0')
          };

          if (loc.id) newLocations.push(loc);
        }

        if (confirm(`${newLocations.length}개의 지점 데이터를 가져와서 저장하시겠습니까?\n기존 데이터는 덮어씌워집니다.`)) {
          // Save each
          for (const l of newLocations) {
            await StorageService.saveLocation(l);
          }
          alert("가져오기 완료! 화면을 새로고침합니다.");
          refreshData();
        }

      } catch (err) {
        console.error(err);
        alert("CSV 파싱 중 오류가 발생했습니다.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const savePrivacy = async () => {
    try {
      await StorageService.savePrivacyPolicy(privacyForm);
      alert('개인정보 처리방침이 저장되었습니다.');
    } catch (e) {
      console.error(e);
      alert('저장 실패!');
    }
  };

  const addPrivacyArticle = () => {
    setPrivacyForm(prev => ({
      ...prev,
      content: [...prev.content, { title: '', text: '' }]
    }));
  };

  const updatePrivacyArticle = (idx: number, field: 'title' | 'text', val: string) => {
    setPrivacyForm(prev => {
      const newContent = [...prev.content];
      newContent[idx] = { ...newContent[idx], [field]: val };
      return { ...prev, content: newContent };
    });
  };

  const removePrivacyArticle = (idx: number) => {
    setPrivacyForm(prev => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== idx)
    }));
  };

  // Terms Helpers
  const saveTerms = async () => {
    try {
      await StorageService.saveTermsPolicy(termsForm);
      alert('이용약관이 저장되었습니다.');
    } catch (e) {
      console.error(e);
      alert('저장 실패!');
    }
  };

  const addTermsArticle = () => {
    setTermsForm(prev => ({
      ...prev,
      content: [...prev.content, { title: '', text: '' }]
    }));
  };

  const updateTermsArticle = (idx: number, field: 'title' | 'text', val: string) => {
    setTermsForm(prev => {
      const newContent = [...prev.content];
      newContent[idx] = { ...newContent[idx], [field]: val };
      return { ...prev, content: newContent };
    });
  };

  const removeTermsArticle = (idx: number) => {
    setTermsForm(prev => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== idx)
    }));
  };



  // New Geocoding Function using Tmap API
  const findCoordinates = async () => {
    if (!locForm.address) {
      alert('주소를 입력해주세요.');
      return;
    }

    setIsGeocoding(true);
    try {
      // Use Tmap Geocoding API
      const response = await fetch(`https://apis.openapi.sk.com/tmap/geo/fullAddrGeo?version=1&addressFlag=F00&coordType=WGS84GEO&fullAddr=${encodeURIComponent(locForm.address)}&appKey=cpM4cvO0Q07LXnCDEzdrNaiwgjTVephR9lQpi2uL`);
      const data = await response.json();
      const info = data.coordinateInfo;

      if (info && info.coordinate && info.coordinate.length > 0) {
        const { newLat, newLon } = info.coordinate[0];
        if (newLat && newLon) {
          setLocForm(prev => ({
            ...prev,
            lat: parseFloat(newLat),
            lng: parseFloat(newLon)
          }));
          alert(`위치를 찾았습니다!\n위도: ${newLat}\n경도: ${newLon}\n\n이제 '저장하기'를 눌러 지점을 업데이트하세요.`);
        } else {
          alert('좌표 정보를 찾을 수 없습니다.');
        }
      } else {
        alert('해당 주소의 정확한 위치를 찾을 수 없습니다. 도로명 주소로 다시 시도해보세요.');
      }
    } catch (e) {
      console.error("Geocoding failed", e);
      alert('좌표 검색 중 오류가 발생했습니다.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const deleteLocation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('지점을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.')) return;

    try {
      await StorageService.deleteLocation(id);

      if (locForm.id === id) {
        setLocForm({
          id: '', shortCode: '', name: '', type: LocationType.HOTEL, supportsDelivery: true, supportsStorage: true,
          isOrigin: true, isDestination: true, originSurcharge: 0, destinationSurcharge: 0,
          lat: 37.5665, lng: 126.9780, address: '', description: ''
        });
      }

      refreshData();
    } catch (e) {
      console.error("Failed to delete location", e);
      alert("지점 삭제 중 오류가 발생했습니다.");
    }
  };

  const saveAdmin = async () => {
    if (!adminForm.name || !adminForm.password || !adminForm.jobTitle) {
      alert('이름, 직책, 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const finalId = adminForm.id || `admin-${Date.now()}`;
      const cleanForm: AdminUser = {
        ...adminForm,
        id: finalId,
        name: adminForm.name?.trim() || '',
        jobTitle: adminForm.jobTitle?.trim() || '',
        password: adminForm.password?.trim() || '',
        createdAt: adminForm.createdAt || new Date().toISOString()
      };

      await StorageService.saveAdmin(cleanForm);
      setAdminForm({ name: '', jobTitle: '', password: '' });
      alert(adminForm.id ? '직원 정보가 수정되었습니다.' : '직원이 등록되었습니다.');
    } catch (e) {
      console.error("Failed to save admin", e);
      alert("직원 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAdmin = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await StorageService.deleteAdmin(id);
      alert("삭제되었습니다.");
    } catch (e) {
      console.error("Delete error", e);
      alert("삭제 실패");
    }
  };

  const cancelAdminEdit = () => {
    setAdminForm({ name: '', jobTitle: '', password: '' });
  };

  const updateStatus = async (id: string, status: BookingStatus) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
    } catch (e) { console.error(e); }
  };

  const handleManualBookingSave = async () => {
    try {
      setIsSaving(true);
      const newBooking = {
        ...manualBookingForm,
        createdAt: new Date().toISOString()
      } as BookingState;

      await StorageService.saveBooking(newBooking);

      // Notify Google Chat
      await StorageService.notifyNewBookingInChat(newBooking);

      alert('예약이 성공적으로 추가되었습니다.');
      setIsManualBooking(false);
      refreshData();
    } catch (e) {
      console.error(e);
      alert('예약 추가 실패');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateManualPrice = (form: Partial<BookingState>) => {
    if (form.serviceType === ServiceType.DELIVERY) {
      const bags = (form.bagSizes as BagSizes) || { S: 0, M: 0, L: 0, XL: 0 };
      let price = (bags.S * deliveryPrices.S) + (bags.M * deliveryPrices.M) + (bags.L * deliveryPrices.L) + (bags.XL * deliveryPrices.XL);
      // Insurance Surcharge (Only if useInsurance is true)
      if (form.useInsurance && form.insuranceLevel && form.insuranceBagCount) {
        price += (Number(form.insuranceLevel) * 10000 * Number(form.insuranceBagCount));
      }

      // Apply Manual Discount
      const discount = Number(form.discountAmount || 0);
      return Math.max(0, price - discount);
    } else {
      const start = new Date(`${form.pickupDate}T${form.pickupTime}`);
      const end = new Date(`${form.dropoffDate || form.pickupDate}T${form.deliveryTime}`);
      const diffMs = end.getTime() - start.getTime();
      const h = Math.max(0, diffMs / (1000 * 60 * 60));

      const hRate = storageTiers.find(t => t.id === 'st-4h')?.prices || INITIAL_STORAGE_TIERS[0].prices;
      const dRate = storageTiers.find(t => t.id === 'st-1d')?.prices || INITIAL_STORAGE_TIERS[1].prices;
      const wRate = storageTiers.find(t => t.id === 'st-week')?.prices || INITIAL_STORAGE_TIERS[2].prices;

      const resolveInternal = (targetH: number, size: keyof PriceSettings): number => {
        if (targetH <= 0) return 0;
        const hr = hRate[size];
        const dr = dRate[size];
        const wr = wRate[size];

        if (targetH <= 12) {
          const units = Math.ceil(targetH / 4);
          return units * hr;
        }

        if (targetH <= 168) {
          const days = Math.ceil(targetH / 24);
          return Math.min(days * dr, wr);
        }

        const extraHours = targetH - 168;
        const extraDays = Math.ceil(extraHours / 24);
        return wr + (extraDays * dr);
      };

      const bags = (form.bagSizes as BagSizes) || { S: 0, M: 0, L: 0, XL: 0 };
      const price = (resolveInternal(h, 'S') * (bags.S || 0)) +
        (resolveInternal(h, 'M') * (bags.M || 0)) +
        (resolveInternal(h, 'L') * (bags.L || 0)) +
        (resolveInternal(h, 'XL') * (bags.XL || 0));

      // Apply Manual Discount
      const discount = Number(form.discountAmount || 0);
      return Math.max(0, price - discount);
    }
  };

  const handleAddBagToManual = (size: keyof BagSizes) => {
    const currentBagSizes = (manualBookingForm.bagSizes as BagSizes) || { S: 0, M: 0, L: 0, XL: 0 };
    const newBagSizes = { ...currentBagSizes, [size]: (currentBagSizes[size] || 0) + 1 };
    const totalBags = Object.values(newBagSizes).reduce((a, b) => a + b, 0);

    const updatedForm = { ...manualBookingForm, bagSizes: newBagSizes, bags: totalBags };
    setManualBookingForm({
      ...updatedForm,
      finalPrice: calculateManualPrice(updatedForm)
    });
  };

  const handleResetManualBags = () => {
    setManualBookingForm(prev => ({
      ...prev,
      bagSizes: { S: 0, M: 0, L: 0, XL: 0 },
      bags: 0,
      finalPrice: 0
    }));
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm('예약 내역을 휴지통으로 이동하시겠습니까?')) return;
    try {
      await updateDoc(doc(db, 'bookings', id), { isDeleted: true });
    } catch (e) {
      console.error(e);
      alert("삭제 실패");
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm('예약 내역을 복구하시겠습니까?')) return;
    try {
      await updateDoc(doc(db, 'bookings', id), { isDeleted: false });
    } catch (e) {
      console.error(e);
      alert("복구 실패");
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('정말로 영구 삭제하시겠습니까? 복구할 수 없습니다.')) return;
    try {
      await deleteDoc(doc(db, 'bookings', id));
    } catch (e) {
      console.error(e);
      alert("영구 삭제 실패");
    }
  };

  const handlePrintLabel = (booking: BookingState) => {
    const originName = locations.find(l => l.id === booking.pickupLocation)?.name || booking.pickupLocation;
    const destName = locations.find(l => l.id === booking.dropoffLocation)?.name || booking.dropoffLocation;

    const printWindow = window.open('', '', 'width=1200,height=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Beeliber Label - ${booking.id}</title>
          <style>
            @page { size: 750mm 500mm landscape; margin: 0; }
            * { box-sizing: border-box; }
            body {
              font-family: 'Inter', 'Apple SD Gothic Neo', sans-serif;
              margin: 0;
              padding: 30mm;
              width: 750mm;
              height: 500mm;
              display: flex;
              flex-direction: column;
              background-color: #fff;
              color: #000;
              overflow: hidden;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 15px solid #ffcb05;
              padding-bottom: 15mm;
              margin-bottom: 20mm;
            }
            .logo { font-size: 100px; font-weight: 1000; font-style: italic; letter-spacing: -5px; }
            .service-type {
              font-size: 60px;
              font-weight: 900;
              background: #000;
              color: #ffcb05;
              padding: 8mm 25mm;
              border-radius: 30px;
              text-transform: uppercase;
            }

            .main-content {
              flex: 1;
              display: grid;
              grid-template-columns: 1.2fr 1fr;
              gap: 30mm;
            }

            .info-box {
              background: #fdfdfd;
              border: 5px solid #f0f0f0;
              border-radius: 60px;
              padding: 20mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }

            .label {
              font-size: 32px;
              color: #999;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 8px;
              margin-bottom: 10mm;
            }
            .value {
              font-size: 85px;
              font-weight: 1000;
              line-height: 1.1;
              word-break: break-all;
            }

            .highlight-value {
              color: #ffcb05;
              background: #000;
              display: inline-block;
              padding: 5mm 15mm;
              border-radius: 20px;
            }

            .booking-id-section {
              grid-column: span 2;
              background: #ffcb05;
              padding: 15mm;
              border-radius: 50px;
              text-align: center;
              margin-top: 10mm;
            }
            .booking-id-label {
              font-size: 32px;
              font-weight: 900;
              color: rgba(0,0,0,0.5);
              letter-spacing: 15px;
              margin-bottom: 5mm;
            }
            .booking-id-value {
              font-size: 180px;
              font-weight: 1000;
              letter-spacing: -5px;
              color: #000;
            }

            .footer {
              margin-top: 20mm;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-top: 4px solid #f0f0f0;
              padding-top: 10mm;
              font-size: 28px;
              font-weight: bold;
              color: #bbb;
              letter-spacing: 2px;
            }

            .route-info {
              display: flex;
              flex-direction: column;
              gap: 10mm;
            }
            .route-step {
               display: flex;
               align-items: center;
               gap: 10mm;
            }
            .route-dot {
              width: 30px;
              height: 30px;
              border-radius: 50%;
              background: #ffcb05;
            }
            .route-arrow { color: #ffcb05; font-size: 60px; margin-left: 20mm; margin-top: -5mm; margin-bottom: -5mm; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">beeliber</div>
            <div class="service-type">${booking.serviceType}</div>
          </div>

          <div class="main-content">
            <div class="info-box">
              <div class="info-group">
                <div class="label">Customer</div>
                <div class="value">${booking.userName}</div>
              </div>
              <div class="info-group" style="margin-top: 15mm;">
                <div class="label">Schedule</div>
                <div class="value">
                  ${booking.pickupDate}<br/>
                  <span class="highlight-value">${booking.pickupTime}</span>
                </div>
              </div>
            </div>

            <div class="info-box" style="border-left: 15px solid #ffcb05;">
              <div class="label">Route</div>
              <div class="route-info">
                <div class="route-step">
                   <div class="route-dot"></div>
                   <div class="value">${originName}</div>
                </div>
                <div class="route-arrow">↓</div>
                <div class="route-step">
                   <div class="route-dot" style="background: #000;"></div>
                   <div class="value">${destName}</div>
                </div>
              </div>
            </div>

            <div class="booking-id-section">
                <div class="booking-id-label">DELIVERY CODE</div>
                <div class="booking-id-value">${booking.id}</div>
            </div>
          </div>

          <div class="footer">
             <div>BEELIBER GLOBAL LOGISTICS</div>
             <div>PRINTED: ${new Date().toLocaleString()}</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking || !selectedBooking.id) return;
    setIsSaving(true);
    try {
      await StorageService.updateBooking(selectedBooking.id, selectedBooking);
      alert('예약 정보가 성공적으로 업데이트되었습니다.');
      setSelectedBooking(null);
      refreshData();
    } catch (e: any) {
      console.error("Failed to update booking:", e);
      alert(`업데이트 실패: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const runAiAnalysis = async (booking: BookingState) => {
    setAnalyzingId(booking.id || 'temp');
    const prompt = `
        다음 예약 정보를 분석하여 물류 최적화 제안과 고객 응대 팁을 한 줄로 요약해줘:
        출발: ${booking.pickupLocation}, 도착: ${booking.dropoffLocation}
        가방: ${booking.bags}개, 날짜: ${booking.pickupDate}
        고객: ${booking.userName}
      `;
    try {
      const response = await sendMessageToGemini([{ role: 'user', text: prompt }], "분석 요청");
      await StorageService.updateBooking(booking.id!, { aiAnalysis: response });
      // Subscription will update state automatically
    } catch (e) {
      alert("AI 분석 실패");
    } finally {
      setAnalyzingId(null);
    }
  };

  // generateMascot removed


  const saveCloudSettings = () => {
    StorageService.saveCloudConfig(cloudConfig);
  };

  const handleMigration = async () => {
    if (!confirm("로컬 스토리지의 모든 데이터를 클라우드로 전송하시겠습니까?\n(기존 클라우드 데이터와 ID가 겹칠 경우 덮어씌워집니다.)")) return;

    setIsMigrating(true);
    try {
      await StorageService.migrateLocalToCloud();
      alert("데이터 백업(마이그레이션)이 완료되었습니다.");
    } catch (e: any) {
      console.error(e);
      // Enhanced error handling for permission issues
      if (e.code === 'permission-denied' || e.message?.includes('permission') || e.message?.includes('Missing or insufficient permissions')) {
        alert(
          "🚨 권한 오류 (Permission Denied)\n\n" +
          "Firestore 데이터베이스에 쓸 권한이 없습니다.\n" +
          "Firebase Console > Firestore Database > 규칙(Rules) 탭에서\n" +
          "규칙을 'allow read, write: if true;' 로 변경해주세요.\n\n" +
          "(자세한 코드는 Cloud 탭의 도움말을 참고하세요)"
        );
      } else {
        alert(`마이그레이션 실패: ${e.message}`);
      }
    } finally {
      setIsMigrating(false);
    }
  };
  const handleNoticeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await StorageService.uploadFile(file, `notices/${Date.now()}_${file.name}`);
        setNotice({ ...notice, imageUrl: url });
      } catch (e: any) {
        console.error("Notice upload error:", e);
        alert(`공지 이미지 업로드 실패: ${e.message || "알 수 없는 오류"}\n(Firebase Storage Rules를 확인하세요.)`);
      }
    }
  };

  const handlePickupImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await StorageService.uploadFile(file, `locations/${Date.now()}_pickup_${file.name}`);
        setLocForm({ ...locForm, pickupImageUrl: url });
      } catch (e: any) {
        console.error("Pickup image upload error:", e);
        alert(`수령 위치 이미지 업로드 실패: ${e.message || "알 수 없는 오류"}`);
      }
    }
  };

  const handleLocationImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await StorageService.uploadFile(file, `locations/${Date.now()}_main_${file.name}`);
        setLocForm({ ...locForm, imageUrl: url });
      } catch (e: any) {
        console.error("Location main image upload error:", e);
        alert(`지점 대표 이미지 업로드 실패: ${e.message || "알 수 없는 오류"}`);
      }
    }
  };


  const saveNotice = () => {
    localStorage.setItem('beeliber_notice', JSON.stringify(notice));
    alert('공지사항이 저장되었습니다.');
  };

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

  const saveHero = async () => {
    setIsSaving(true);
    try {
      const configWithDirectUrl = {
        ...heroConfig,
        videoUrl: getDirectVideoUrl(heroConfig.videoUrl)
      };
      await StorageService.saveHeroConfig(configWithDirectUrl);
      setHeroConfig(configWithDirectUrl);
      alert('히어로 섹션 설정이 저장되었습니다.');
    } catch (e) {
      console.error(e);
      alert('저장 실패');
    } finally {
      setIsSaving(false);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'mobileImageUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await StorageService.uploadFile(file, `hero/${Date.now()}_${file.name}`);
        setHeroConfig({ ...heroConfig, [field]: url });
        alert(`이미지 업로드 성공! [${field === 'imageUrl' ? 'PC' : '모바일'}] 저장 버튼을 눌러야 최종 반영됩니다.`);
      } catch (e: any) {
        console.error("Hero upload error:", e);
        alert(`히어로 이미지 업로드 실패: ${e.message || "알 수 없는 오류"}\n\n사유: Firebase Storage 규칙(Rules)이나 인증 상태를 확인하세요.`);
      }
    }
  };

  const handleHeroVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic size check (e.g., 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert("영상 파일이 너무 큽니다. 50MB 이하의 파일을 권장합니다.");
        return;
      }
      setIsSaving(true);
      try {
        const url = await StorageService.uploadFile(file, `hero/videos/${Date.now()}_${file.name}`);
        setHeroConfig({ ...heroConfig, videoUrl: url });
        alert("영상 업로드가 완료되었습니다. 반드시 아래 '히어로 설정 저장하기' 버튼을 눌러야 확정됩니다. 🐝");
      } catch (e: any) {
        console.error("Hero video upload error:", e);
        alert(`히어로 영상 업로드 실패: ${e.message || "알 수 없는 오류"}\n\n사유: 파일 용량 초과(50MB) 또는 Firebase Storage 권한 부족일 수 있습니다.`);
      } finally {
        setIsSaving(false);
      }
    }
  };


  const getStatusStyle = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING: return 'text-amber-600 bg-bee-yellow/20';
      case BookingStatus.STORAGE: return 'text-blue-700 bg-bee-blue/20';
      case BookingStatus.TRANSIT: return 'text-indigo-600 bg-indigo-100';
      case BookingStatus.ARRIVED: return 'text-emerald-700 bg-emerald-100';
      case BookingStatus.COMPLETED: return 'text-green-700 bg-green-100';
      case BookingStatus.CANCELLED: return 'text-red-500 bg-red-50';
      case BookingStatus.REFUNDED: return 'text-red-700 bg-red-100';
      default: return 'text-bee-grey bg-gray-100';
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm('제휴 문의를 완료(삭제) 하시겠습니까?')) return;
    try {
      await StorageService.deleteInquiry(id);
      alert("삭제되었습니다.");
    } catch (e) { alert("삭제 실패"); }
  };

  const clearClosingHistory = async () => {
    if (!confirm('정말로 모든 시재 마감 히스토리를 초기화하시겠습니까?')) return;
    try {
      await StorageService.clearCashClosings();
      alert("히스토리 데이터가 초기화되었습니다.");
    } catch (e) { alert("초기화 실패"); }
  };

  // Modal: DailyDetailModal is now in ./admin/DailyDetailModal.tsx

  // renderOverview extracted to ./admin/OverviewTab.tsx

  return (
    <div className="min-h-screen bg-gray-50 text-bee-black font-sans flex relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-bee-yellow/10 rounded-full blur-[150px] pointer-events-none"></div>

      <DailyDetailModal
        selectedDetailDate={selectedDetailDate}
        setSelectedDetailDate={setSelectedDetailDate}
        bookings={bookings}
        expenditures={expenditures}
        setSelectedBooking={setSelectedBooking}
      />

      {/* CEMS Sidebar */}
      <aside className="w-64 bg-white/80 backdrop-blur-3xl border-r border-gray-200 text-bee-black hidden lg:flex flex-col sticky top-0 h-screen z-50 overflow-hidden shadow-2xl">
        <div className="p-8 flex items-center gap-2">
          <span className="text-2xl font-black italic text-bee-yellow">bee</span>
          <span className="text-2xl font-black text-bee-black">liber</span>
        </div>

        <div className="px-6 flex-1 overflow-y-auto no-scrollbar space-y-8 py-4">
          {/* Main Dashboard Group */}
          <div>
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 px-2">Logistics Control</div>
            <nav className="space-y-1">
              {[
                { id: 'OVERVIEW', label: 'CEMS Dashboard', icon: 'fa-chart-pie' },
                { id: 'DELIVERY_BOOKINGS', label: '배송 예약 관리', icon: 'fa-truck-fast' },
                { id: 'STORAGE_BOOKINGS', label: '보관 예약 관리', icon: 'fa-warehouse' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-bee-yellow text-bee-black shadow-lg shadow-bee-yellow/20' : 'hover:bg-gray-100 text-gray-500 hover:text-bee-black lg:hover:pl-5'}`}
                >
                  <i className={`fa-solid ${item.icon} w-5`}></i>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Finance Group */}
          <div>
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 px-2">Finance & Settlement</div>
            <nav className="space-y-1">
              {[
                { id: 'DAILY_SETTLEMENT', label: '일일 정산', icon: 'fa-calendar-check' },
                { id: 'ACCOUNTING', label: '매출 결산 보고', icon: 'fa-receipt' },
                { id: 'REPORTS', label: '실적 리포트', icon: 'fa-chart-pie' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-bee-yellow text-bee-black shadow-lg shadow-bee-yellow/20' : 'hover:bg-gray-100 text-gray-500 hover:text-bee-black lg:hover:pl-5'}`}
                >
                  <i className={`fa-solid ${item.icon} w-5`}></i>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Customer Support Group */}
          <div>
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 px-2">Customer Support</div>
            <nav className="space-y-1">
              {[
                { id: 'CHATS', label: '실시간 채팅 관리', icon: 'fa-comments' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-bee-yellow text-bee-black shadow-lg shadow-bee-yellow/20' : 'hover:bg-gray-100 text-gray-500 hover:text-bee-black lg:hover:pl-5'}`}
                >
                  <i className={`fa-solid ${item.icon} w-5`}></i>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Configuration Group */}
          <div>
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 px-2">System Admin</div>
            <nav className="space-y-1">
              {[
                { id: 'LOCATIONS', label: '지점 통합 관리', icon: 'fa-location-dot' },
                { id: 'DISCOUNTS', label: '할인 코드 관리', icon: 'fa-tags' },
                { id: 'SYSTEM', label: '가격 정책 설정', icon: 'fa-sliders' },
                { id: 'HR', label: '직원 권한 관리', icon: 'fa-user-tie' },
                { id: 'PARTNERSHIP_INQUIRIES', label: '제휴 문의', icon: 'fa-handshake' },
                { id: 'NOTICE', label: '공지사항 관리', icon: 'fa-bullhorn' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-bee-yellow text-bee-black shadow-lg shadow-bee-yellow/20' : 'hover:bg-gray-100 text-gray-500 hover:text-bee-black lg:hover:pl-5'}`}
                >
                  <i className={`fa-solid ${item.icon} w-5`}></i>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-gray-200 bg-white/50 space-y-3">
          <div className="flex flex-col">
            <span className="text-xs font-black text-bee-yellow uppercase">{jobTitle}</span>
            <span className="text-sm font-bold text-bee-black mb-2">{adminName} 님</span>
          </div>

          {onStaffMode && (
            <button
              onClick={onStaffMode}
              className="w-full flex items-center justify-center gap-2 p-3 bg-bee-yellow text-bee-black hover:bg-white rounded-xl text-xs font-black transition-all shadow-lg"
            >
              <i className="fa-solid fa-qrcode"></i> 스태프 모드 전환
            </button>
          )}

          <button onClick={onBack} className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-all text-gray-600">
            <i className="fa-solid fa-power-off"></i> 시스템 종료
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        <header className="bg-white/80 backdrop-blur-3xl border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40 lg:hidden shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black italic text-bee-yellow">bee</span>
            <span className="text-xl font-black text-bee-black">liber</span>
          </div>
          <button title="Logout" aria-label="Logout" onClick={onBack} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 transition-colors rounded-xl flex items-center justify-center text-gray-500"><i className="fa-solid fa-power-off"></i></button>
        </header>

        {/* Global Toolbar */}
        <div className="bg-white/80 backdrop-blur-3xl border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 lg:top-0 z-40 shadow-lg hidden lg:flex">
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-gray-100 flex items-center gap-3 rounded-full border border-gray-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Server Live</span>
            </div>
            <div className="text-xs font-bold text-gray-400">
              <i className="fa-regular fa-calendar mr-1"></i> {todayKST} (KST)
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={globalBranchFilter}
              onChange={(e) => setGlobalBranchFilter(e.target.value)}
              title="지점 필터"
              aria-label="지점 필터"
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-bee-black focus:border-bee-yellow hover:border-gray-300 outline-none cursor-pointer transition-colors"
            >
              <option value="ALL">전체 지점 보관/배송</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name} - 지점</option>
              ))}
            </select>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent rounded-xl text-xs font-black transition-all flex items-center gap-2"
            >
              <i className={`fa-solid fa-rotate-right ${isRefreshing ? 'animate-spin' : ''}`}></i>
              Refresh
            </button>
          </div>
        </div>

        <main className="flex-1 p-6 lg:p-12 overflow-y-auto">

          {activeTab === 'OVERVIEW' && (
            <OverviewTab
              todayKST={todayKST}
              bookings={bookings}
              locations={locations}
              setActiveTab={setActiveTab}
              setActiveStatusTab={setActiveStatusTab}
              dailyStats={dailyStats}
            />
          )}

          {(activeTab === 'DELIVERY_BOOKINGS' || activeTab === 'STORAGE_BOOKINGS') && (
            <LogisticsTab
              activeTab={activeTab}
              activeStatusTab={activeStatusTab}
              setActiveStatusTab={(s: string) => setActiveStatusTab(s as any)}
              filteredBookings={filteredBookings}
              isRefreshing={isRefreshing}
              locations={locations}
              updateStatus={updateStatus}
              getStatusStyle={getStatusStyle}
              handleResendEmail={handleResendEmail}
              sendingEmailId={sendingEmailId}
              handleRefund={handleRefund}
              refundingId={refundingId}
              handleRestore={handleRestore}
              handlePermanentDelete={handlePermanentDelete}
              handlePrintLabel={handlePrintLabel}
              handleSoftDelete={handleSoftDelete}
              setSelectedBooking={setSelectedBooking}
              onAddManual={() => setIsManualBooking(true)}
            />
          )}

          {activeTab === 'LOCATIONS' && (
            <LocationsTab
              locForm={locForm}
              setLocForm={setLocForm}
              LOCATION_TYPE_OPTIONS={LOCATION_TYPE_OPTIONS}
              findCoordinates={findCoordinates}
              isGeocoding={isGeocoding}
              handlePickupImageUpload={handlePickupImageUpload}
              handleLocationImageUpload={handleLocationImageUpload}
              isSaving={isSaving}
              addLocation={addLocation}
              locations={locations}
              focusLocation={focusLocation}
              deleteLocation={deleteLocation}
              lang={lang}
              t={t}
            />
          )}


          {activeTab === 'DAILY_SETTLEMENT' && (
            <DailySettlementTab
              revenueEndDate={revenueEndDate}
              setRevenueStartDate={setRevenueStartDate}
              setRevenueEndDate={setRevenueEndDate}
              dailySettlementStats={dailySettlementStats}
              cashClosing={cashClosing}
              setCashClosing={setCashClosing}
              handleCashClose={handleCashClose}
              expForm={expForm}
              setExpForm={setExpForm}
              handleSaveExpenditure={handleSaveExpenditure}
              closings={closings}
              clearClosingHistory={clearClosingHistory}
              bookings={bookings}
              expenditures={filteredExpenditures}
              deleteExpenditure={deleteExpenditure}
              setSelectedBooking={setSelectedBooking}
            />
          )}

          {activeTab === 'ACCOUNTING' && (
            <AccountingTab
              revenueStartDate={revenueStartDate}
              setRevenueStartDate={setRevenueStartDate}
              revenueEndDate={revenueEndDate}
              setRevenueEndDate={setRevenueEndDate}
              handleExportCSV={handleExportCSV}
              revenueStats={revenueStats}
              accountingDailyStats={accountingDailyStats}
              accountingMonthlyStats={accountingMonthlyStats}
              setSelectedDetailDate={setSelectedDetailDate}
              expForm={expForm}
              setExpForm={setExpForm}
              handleSaveExpenditure={handleSaveExpenditure}
              expenditures={filteredExpenditures}
              deleteExpenditure={deleteExpenditure}
            />
          )}

          {activeTab === 'REPORTS' && (
            <ReportsTab bookings={bookings} />
          )}

          {activeTab === 'NOTICE' && (
            <NoticeTab
              notice={notice}
              setNotice={setNotice}
              handleNoticeImageUpload={handleNoticeImageUpload}
              saveNotice={saveNotice}
            />
          )}

          {activeTab === 'PARTNERSHIP_INQUIRIES' && (
            <PartnershipTab
              inquiries={inquiries}
              deleteInquiry={deleteInquiry}
            />
          )}

          {activeTab === 'HR' && (
            <HRTab
              admins={admins}
              adminForm={adminForm}
              setAdminForm={setAdminForm}
              showAdminPassword={showAdminPassword}
              setShowAdminPassword={setShowAdminPassword}
              saveAdmin={saveAdmin}
              deleteAdmin={deleteAdmin}
              isSaving={isSaving}
              locations={locations}
            />
          )}

          {activeTab === 'SYSTEM' && (
            <SystemTab
              deliveryPrices={deliveryPrices}
              updateDeliveryPrice={updateDeliveryPrice}
              storageTiers={storageTiers}
              updateStoragePrice={updateStoragePrice}
            />
          )}

          {activeTab === 'DISCOUNTS' && (
            <DiscountTab />
          )}

          {activeTab === 'CLOUD' && (
            <CloudTab
              cloudConfig={cloudConfig}
              setCloudConfig={setCloudConfig}
              CLOUD_PLACEHOLDERS={CLOUD_PLACEHOLDERS}
              saveCloudSettings={saveCloudSettings}
              handleMigration={handleMigration}
              isMigrating={isMigrating}
            />
          )}

          {activeTab === 'PRIVACY_EDITOR' && (
            <PrivacyEditorTab
              privacyForm={privacyForm}
              setPrivacyForm={setPrivacyForm}
              savePrivacy={savePrivacy}
              addPrivacyArticle={addPrivacyArticle}
              updatePrivacyArticle={updatePrivacyArticle as any}
              removePrivacyArticle={removePrivacyArticle}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'TERMS_EDITOR' && (
            <TermsEditorTab
              termsForm={termsForm}
              setTermsForm={setTermsForm}
              saveTerms={saveTerms}
              addTermsArticle={addTermsArticle}
              updateTermsArticle={updateTermsArticle as any}
              removeTermsArticle={removeTermsArticle}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'CHATS' && (
            <ChatTab />
          )}
        </main>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. RESERVATION DETAIL MODAL (VIEW & EDIT) */}
      {/* ------------------------------------------------------------------ */}
      <BookingDetailModal
        selectedBooking={selectedBooking}
        setSelectedBooking={setSelectedBooking}
        locations={locations}
        getStatusStyle={getStatusStyle}
        handlePrintLabel={handlePrintLabel}
        handleUpdateBooking={handleUpdateBooking}
        isSaving={isSaving}
        handleResendEmail={handleResendEmail}
        sendingEmailId={sendingEmailId}
      />

      {/* 2. MANUAL BOOKING MODAL */}
      <ManualBookingModal
        isManualBooking={isManualBooking}
        setIsManualBooking={setIsManualBooking}
        manualBookingForm={manualBookingForm}
        setManualBookingForm={setManualBookingForm}
        locations={locations}
        storageTiers={storageTiers}
        deliveryPrices={deliveryPrices}
        calculateManualPrice={calculateManualPrice}
        handleResetManualBags={handleResetManualBags}
        handleAddBagToManual={handleAddBagToManual}
        handleManualBookingSave={handleManualBookingSave}
        isSaving={isSaving}
      />

      {/* 3. QUICK SCAN STATUS MODAL */}
      {isScanDetailVisible && scannedBooking && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-scale-up border-4 border-bee-yellow">
            <div className="p-8 text-center bg-bee-yellow">
              <div className="w-20 h-20 bg-bee-black rounded-3xl flex items-center justify-center text-4xl text-bee-yellow mx-auto mb-4 shadow-xl animate-bounce-soft">
                <i className="fa-solid fa-qrcode"></i>
              </div>
              <h2 className="text-2xl font-black text-bee-black">바우처 스캔 결과</h2>
              <p className="text-xs font-bold text-bee-black/60 uppercase tracking-widest mt-1">Booking ID: {scannedBooking.id}</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase">성함</span>
                  <span className="font-black text-bee-black">{scannedBooking.userName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] font-black text-gray-400 uppercase">보관/출발</span>
                  <span className="font-bold text-gray-700">{locations.find(l => l.id === scannedBooking.pickupLocation)?.name || scannedBooking.pickupLocation}</span>
                </div>
                {scannedBooking.serviceType === ServiceType.DELIVERY && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[10px] font-black text-gray-400 uppercase">도착지</span>
                    <span className="font-bold text-gray-700">{locations.find(l => l.id === scannedBooking.dropoffLocation)?.name || scannedBooking.dropoffLocation}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase">현재 상태</span>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black ${getStatusStyle(scannedBooking.status || BookingStatus.PENDING)}`}>
                    {scannedBooking.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-center text-gray-400 uppercase tracking-widest">상태 즉시 변경</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { status: BookingStatus.PENDING, label: '접수완료', icon: 'fa-check' },
                    { status: BookingStatus.TRANSIT, label: '이동중', icon: 'fa-truck-moving' },
                    { status: BookingStatus.ARRIVED, label: '목적지도착', icon: 'fa-location-dot' },
                    { status: BookingStatus.COMPLETED, label: '완료', icon: 'fa-flag-checkered' }
                  ].map((item) => (
                    <button
                      key={item.status}
                      disabled={isSaving}
                      onClick={async () => {
                        if (!scannedBooking.id) return;
                        setIsSaving(true);
                        try {
                          await StorageService.updateBooking(scannedBooking.id, { status: item.status });
                          // scannedBooking is local state for the modal, keep it updated for UI
                          setScannedBooking({ ...scannedBooking, status: item.status });
                          alert(`상태가 [${item.label}] (으)로 변경되었습니다.`);
                        } catch (e) {
                          console.error(e);
                          alert('상태 변경 실패');
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all group ${scannedBooking.status === item.status ? 'bg-bee-black border-bee-black text-bee-yellow' : 'bg-white border-gray-100 text-gray-400 hover:border-bee-yellow hover:text-bee-black'}`}
                    >
                      <i className={`fa-solid ${item.icon} text-lg mb-2`}></i>
                      <span className="text-[10px] font-black">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 pt-0">
              <button
                onClick={() => {
                  setIsScanDetailVisible(false);
                  // Clean up URL
                  const url = new URL(window.location.href);
                  url.searchParams.delete('scan');
                  window.history.replaceState({}, '', url.toString());
                }}
                className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
              >
                창 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div >

  );
};







export default AdminDashboard;
