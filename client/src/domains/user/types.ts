export interface DiscountCode {
    id?: string;
    code: string;
    amountPerBag: number;
    description: string;
    isActive: boolean;
    allowedService?: 'DELIVERY' | 'STORAGE' | 'ALL';
}

export interface ChatMessage {
    id?: string;
    role: 'user' | 'model' | 'admin';
    text: string;
    timestamp: string;
    sessionId: string;
    userName?: string;
    userEmail?: string;
    isRead?: boolean;
}

export interface ChatSession {
    id?: string;
    sessionId: string;
    userName: string;
    userEmail: string;
    lastMessage: string;
    timestamp: string;
    isBotDisabled?: boolean;
    unreadCount?: number;
}

export type AdminStatus = 'invited' | 'active' | 'suspended' | 'resigned' | 'locked';

export interface AdminUser {
    id: string;
    name: string;
    jobTitle: string;
    email?: string;
    phone?: string;
    loginId?: string;
    password?: string;
    role?: 'super' | 'branch' | 'staff' | 'partner' | 'driver' | 'finance' | 'cs';
    branchId?: string;
    status?: AdminStatus;
    permissions?: string[];
    orgType?: 'HQ' | 'HUB' | 'PARTNER' | 'DRIVER_GROUP';
    security?: {
        lastLoginAt?: string;
        failedLoginCount?: number;
        isLocked?: boolean;
        passwordChangedAt?: string;
        twoFactorEnabled?: boolean;
    };
    memo?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    points: number;
    level: 'BRONZE' | 'SILVER' | 'GOLD' | 'VIP';
    createdAt: string;
}

export interface UserCoupon {
    id: string;
    uid: string;
    codeId: string;
    code: string;
    amountPerBag: number;
    description: string;
    isUsed: boolean;
    usedAt?: string;
    expiryDate: string;
    issuedAt: string;
}
