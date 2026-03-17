/**
 * [스봉이] 개인정보 보호를 위한 마스킹 유틸리티 🛡️
 */

/**
 * 성함 마스킹 (예: 홍길동 -> 홍*동, Steve Jobs -> St*** Jobs)
 */
export const maskName = (name: string): string => {
    if (!name) return '';
    if (name.length <= 1) return name;
    if (name.length === 2) return name[0] + '*';
    const mid = Math.floor(name.length / 2);
    return name.substring(0, mid - 1) + '*'.repeat(name.length > 3 ? 2 : 1) + name.substring(mid + 1);
};

/**
 * 전화번호 마스킹 (예: 010-1234-5678 -> 010-****-5678)
 */
export const maskPhone = (phone: string): string => {
    if (!phone) return '';
    const parts = phone.split('-');
    if (parts.length === 3) {
        return `${parts[0]}-****-${parts[2]}`;
    }
    if (phone.length > 7) {
        return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
    }
    return '***-****';
};

/**
 * 이메일 마스킹 (예: beeliber@gmail.com -> bee****@gmail.com)
 */
export const maskEmail = (email: string): string => {
    if (!email || !email.includes('@')) return email;
    const [user, domain] = email.split('@');
    if (user.length <= 2) return '**@' + domain;
    return user.substring(0, 3) + '*'.repeat(user.length - 3) + '@' + domain;
};

/**
 * ID 마스킹 (예: beeliber123 -> bee******)
 */
export const maskId = (id: string): string => {
    if (!id) return '';
    if (id.length <= 3) return '***';
    return id.substring(0, 3) + '*'.repeat(id.length - 3);
};
