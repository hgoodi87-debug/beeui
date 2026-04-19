/**
 * 지점 운영시간 문자열("09:00 - 21:00")을 파싱해 현재 KST 시각 기준 운영 여부 반환.
 * 파싱 불가 시 true(운영 중) 반환.
 */
export function isWithinBusinessHours(businessHoursStr: string): boolean {
    const match = businessHoursStr.match(/(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/);
    if (!match) return true;

    const openH = parseInt(match[1], 10);
    const openM = parseInt(match[2], 10);
    const closeH = parseInt(match[3], 10);
    const closeM = parseInt(match[4], 10);

    // KST = UTC+9
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
    const kst = new Date(utcMs + 9 * 3_600_000);

    const current = kst.getHours() * 60 + kst.getMinutes();
    const open = openH * 60 + openM;
    const close = closeH * 60 + closeM;

    return current >= open && current < close;
}

/**
 * 지점 상태 반환:
 * - 'closed': isActive === false (아예 미운영)
 * - 'open_now': 운영 시간 내
 * - 'bookable': 운영 시간 외 (예약은 가능)
 */
export type BranchStatus = 'closed' | 'open_now' | 'bookable';

export function getBranchStatus(isActive: boolean, businessHours?: string): BranchStatus {
    if (!isActive) return 'closed';
    if (businessHours && isWithinBusinessHours(businessHours)) return 'open_now';
    if (!businessHours) return 'open_now';
    return 'bookable';
}
