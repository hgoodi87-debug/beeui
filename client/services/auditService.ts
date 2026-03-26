import { db } from '../firebaseApp';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * [스봉이] 감사 로그 액션 타입 정의
 * 보안 및 운영상의 중요 이벤트를 분류합니다.
 */
export type AuditActionType = 
    | 'LOGIN' 
    | 'REFUND' 
    | 'STATUS_CHANGE' 
    | 'PII_VIEW' 
    | 'PII_UNMASK' 
    | 'RESTORE' 
    | 'CONFIG_CHANGE' 
    | 'MANUAL_BOOKING' 
    | 'SETTLEMENT_CONFIRM'
    | 'DELETE';

export interface AuditLogData {
    actorId: string;
    actorName: string;
    actorEmail?: string;
    actionType: AuditActionType;
    targetId?: string;      // 예약 ID, 관리자 ID 등
    targetType?: string;    // 'BOOKING', 'ADMIN', 'SYSTEM' 등
    details?: any;          // 변경 전/후 데이터 등
    ip?: string;
    userAgent?: string;
    timestamp: any;
}

export const AuditService = {
    /**
     * [스봉이] 핵심 감사 로그 기록 함수
     * 어떤 관리자가 어떤 중요한 작업을 수행했는지 영구히 기록합니다. 🛡️
     */
    async logAction(
        actor: { id: string; name: string; email?: string },
        actionType: AuditActionType,
        target?: { id: string; type: string },
        details: any = {}
    ) {
        try {
            const logData: AuditLogData = {
                actorId: actor.id,
                actorName: actor.name,
                actorEmail: actor.email,
                actionType,
                targetId: target?.id,
                targetType: target?.type,
                details,
                timestamp: serverTimestamp(),
                userAgent: navigator.userAgent
            };

            await addDoc(collection(db, 'audit_logs'), logData);
            console.log(`[AuditLog] ${actionType} recorded successfully. 💅`);
        } catch (e) {
            console.error('[AuditLog] Failed to record action:', e);
            // 감사 로그 기록 실패는 치명적일 수 있으나, 서비스 중단은 막아야 함
        }
    },

    /**
     * [스봉이] 개인정보(PII) 조회 로그 특화 함수
     */
    async logPiiView(actor: any, targetId: string, field: string) {
        return this.logAction(actor, 'PII_VIEW', { id: targetId, type: 'BOOKING' }, { field });
    }
};
