/**
 * [스봉이] 감사 로그 서비스 — Supabase 전용 💅
 * Firebase Firestore 완전 제거, Supabase REST API 사용
 */
import { isSupabaseDataEnabled, supabaseMutate } from './supabaseClient';

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
    targetId?: string;
    targetType?: string;
    details?: any;
    ip?: string;
    userAgent?: string;
    timestamp: string;
}

export const AuditService = {
    /**
     * [스봉이] 핵심 감사 로그 기록 함수 — Supabase audit_logs 테이블 직접 저장 🛡️
     */
    async logAction(
        actor: { id: string; name: string; email?: string },
        actionType: AuditActionType,
        target?: { id: string; type: string },
        details: any = {}
    ) {
        try {
            const logData = {
                entity_type: target?.type || 'SYSTEM',
                entity_id: target?.id || '',
                action: actionType,
                actor: `${actor.name}${actor.email ? ` (${actor.email})` : ''} [${actor.id}]`,
                before_data: null,
                after_data: details ? JSON.stringify(details) : null,
            };

            if (isSupabaseDataEnabled()) {
                await supabaseMutate('audit_logs', 'POST', logData);
            } else {
                // Supabase 미설정 시 콘솔에만 기록
                console.warn('[AuditLog] Supabase not configured, logging to console only:', logData);
            }

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
