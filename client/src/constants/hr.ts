/**
 * HR Admin Role & Permission Constants 👤🛡️
 */

export interface HRRole {
  id: string;
  label: string;
  color: string;
  desc: string;
}

export interface HRStatusConfig {
  label: string;
  color: string;
  icon: string;
}

export const HR_ROLES = [
  { id: 'super', label: '슈퍼관리자', color: 'bee-black', desc: '시스템 전체 제어 및 권한 관리' },
  { id: 'hq', label: '본사운영팀', color: 'blue-600', desc: '본사 차원의 운영 및 지점 관리' },
  { id: 'branch', label: '브랜치', color: 'bee-yellow', desc: '담당 지점의 운영 및 정산 관리' }, // [스봉이] '허브매니저'에서 '브랜치'로 깍쟁이처럼 변경 💅
  { id: 'finance', label: '재무/정산', color: 'emerald-600', desc: '정산 원장 및 월간 정산 통제' },
  { id: 'cs', label: 'CS팀', color: 'sky-500', desc: '고객 예약 및 클레임 대응' },
  { id: 'partner', label: '외부협업사', color: 'purple-500', desc: '지점 관리 등 제한적 권한' },
  { id: 'driver', label: '배송기사', color: 'orange-500', desc: '배송 관련 정보 접근' },
  { id: 'staff', label: '일반스태프', color: 'gray-500', desc: '일반 운영 업무 수행' },
];

export const HR_PERMISSIONS = {
  // 예약 관련
  BOOKING_VIEW: 'booking:view',
  BOOKING_EDIT: 'booking:edit',
  BOOKING_CANCEL: 'booking:cancel',
  BOOKING_MANUAL: 'booking:manual',

  // 정산 관련
  SETTLEMENT_VIEW: 'settlement:view',
  SETTLEMENT_CLOSE: 'settlement:close',
  SETTLEMENT_ADJUST: 'settlement:adjust',
  SETTLEMENT_MONTHLY: 'settlement:monthly',

  // 인사/보안 관련
  HR_VIEW: 'hr:view',
  HR_EDIT: 'hr:edit',
  HR_ROLE_ASSIGN: 'hr:role_assign',
  HR_AUDIT_LOG: 'hr:audit_log',

  // 지점/시스템 관련
  LOCATION_EDIT: 'location:edit',
  SYSTEM_CONFIG: 'system:config',
};

export const HR_STATUS_CONFIG = {
  invited: { label: '초대대기', color: 'bg-yellow-100 text-yellow-700', icon: 'fa-envelope' },
  active: { label: '활성', color: 'bg-green-100 text-green-700', icon: 'fa-check-circle' },
  suspended: { label: '권한제한', color: 'bg-orange-100 text-orange-700', icon: 'fa-pause-circle' },
  resigned: { label: '퇴사', color: 'bg-gray-100 text-gray-400', icon: 'fa-user-minus' },
  locked: { label: '잠김', color: 'bg-red-100 text-red-700', icon: 'fa-lock' },
};

export const ORG_TYPES = [
  { id: 'HQ', label: '본사 (HQ)' },
  { id: 'HUB', label: '허브 지점 (Hub)' },
  { id: 'PARTNER', label: '제휴 파트너 (Partner)' },
  { id: 'DRIVER_GROUP', label: '기사 그룹 (Driver Group)' },
];
