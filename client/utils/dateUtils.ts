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
 * @param dateStr "YYYY-MM-DD"
 * @param timeStr "HH:mm"
 */
export const isPastKSTTime = (dateStr: string, timeStr: string): boolean => {
    const nowKST = formatKSTDate();

    // If date is in the future, it's not past
    if (dateStr > nowKST) return false;

    // If date is in the past, it's definitely past
    if (dateStr < nowKST) return true;

    // If date is today, compare hours and minutes
    const [h, m] = timeStr.split(':').map(Number);
    const currentH = getKSTHours();
    const currentM = getKSTMinutes();

    if (h < currentH) return true;
    if (h === currentH && m <= currentM) return true;

    return false;
};
