/**
 * Utilities for handling Korea Standard Time (KST, UTC+9)
 */

/**
 * Returns a Date object adjusted to KST
 */
export const getKSTDate = (date: Date = new Date()): Date => {
    // Current UTC time + 9 hours
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const kstOffset = 9 * 60 * 60000;
    return new Date(utc + kstOffset);
};

/**
 * Formats a Date object to YYYY-MM-DD in KST
 */
export const formatKSTDate = (date: Date = new Date()): string => {
    const kst = getKSTDate(date);
    const year = kst.getFullYear();
    const month = String(kst.getMonth() + 1).padStart(2, '0');
    const day = String(kst.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Gets the current hour in KST (0-23)
 */
export const getKSTHours = (date: Date = new Date()): number => {
    return getKSTDate(date).getHours();
};

/**
 * Gets the current minute in KST (0-59)
 */
export const getKSTMinutes = (date: Date = new Date()): number => {
    return getKSTDate(date).getMinutes();
};

/**
 * Checks if a specific time on a specific date is in the past relative to KST now.
 * @param dateStr "YYYY-MM-DD" 혹은 "YYYY-MM-DD HH:mm"
 * @param timeStr "HH:mm" (dateStr에 시간이 포함되지 않은 경우 사용)
 */
export const isPastKSTTime = (dateStr: string, timeStr?: string): boolean => {
    const nowKST = getKSTDate();
    const nowStr = formatKSTDate(nowKST);

    let targetDateStr = dateStr;
    let targetTimeStr = timeStr;

    if (dateStr.includes(' ')) {
        [targetDateStr, targetTimeStr] = dateStr.split(' ');
    }

    if (!targetTimeStr) return false;

    // If date is in the future, it's not past
    if (targetDateStr > nowStr) return false;

    // If date is in the past, it's definitely past
    if (targetDateStr < nowStr) return true;

    // If date is today, compare hours and minutes
    const [h, m] = targetTimeStr.split(':').map(Number);
    const currentH = nowKST.getHours();
    const currentM = nowKST.getMinutes();

    // 30 minutes buffer for safe booking
    const bufferMinutes = 30;
    const totalCurrentMinutes = (currentH * 60) + currentM;
    const totalSlotMinutes = (h * 60) + m;

    if (totalSlotMinutes < totalCurrentMinutes + bufferMinutes) return true;

    return false;
};

/**
 * Returns a localized date string using Intl.DateTimeFormat
 */
export const getLocalizedDate = (dateStr: string, lang: string = 'ko'): string => {
    if (!dateStr) return '';
    const cleanDateStr = dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr;
    const date = new Date(cleanDateStr);
    if (isNaN(date.getTime())) return dateStr;

    const localeMap: Record<string, string> = {
        'ko': 'ko-KR',
        'en': 'en-US',
        'ja': 'ja-JP',
        'zh': 'zh-CN',
        'zh-TW': 'zh-TW',
        'zh-HK': 'zh-HK'
    };

    const locale = localeMap[lang] || 'en-US';

    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: lang === 'ko' ? 'short' : undefined
    }).format(date);
};

/**
 * Generates 30-minute time slots based on start and end hours
 */
export const generateTimeSlots = (startHour: number = 0, endHour: number = 24, interval: number = 30): string[] => {
    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
        for (let min = 0; min < 60; min += interval) {
            slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
        }
    }
    // Add the final end hour if it's not 24:00 (which is usually represented as 00:00 next day, but for slots we use end)
    if (endHour <= 24) {
        slots.push(`${endHour.toString().padStart(2, '0')}:00`);
    }
    return slots;
};

/**
 * Finds the first available time slot from a list of slots
 */
export const getFirstAvailableSlot = (dateStr: string, slots: string[]): string | null => {
    for (const slot of slots) {
        if (!isPastKSTTime(dateStr, slot)) {
            return slot;
        }
    }
    return slots.length > 0 ? slots[0] : null;
};

/**
 * Returns number of days in a month
 */
export const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

/**
 * Returns the day of the week for the first day of the month (0 = Sunday)
 */
export const getFirstDayOfMonth = (year: number, month: number): number => {
    // Adjust for KST? Actually standardized Date objects are fine for relative offsets
    return new Date(year, month, 1).getDay();
};

/**
 * Calculates the number of days between two dates (YYYY-MM-DD or full ISO strings)
 */
export const calculateDaysDifference = (date1: string, date2: string): number => {
    if (!date1 || !date2) return 0;
    const d1 = new Date(date1.split(' ')[0]);
    const d2 = new Date(date2.split(' ')[0]);
    const diffTime = d2.getTime() - d1.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};
