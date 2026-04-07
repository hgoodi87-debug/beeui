import React from 'react';
import { getSupabaseBaseUrl, getSupabaseConfig } from '../../services/supabaseRuntime';
import { getActiveAdminRequestHeaders } from '../../services/adminAuthService';

interface AiOutput {
  id: string;
  use_case: string;
  entity_id: string | null;
  prompt_snapshot: Record<string, string> | null;
  generated_content: Record<string, string> | null;
  policy_check: { passed: boolean; violations: string[] } | null;
  status: string;
  created_by: string | null;
  reviewer_id: string | null;
  reviewed_at: string | null;
  final_content: Record<string, string> | null;
  created_at: string;
}

// use_case별 표시 이름
const USE_CASE_LABELS: Record<string, string> = {
  translation: '번역',
  cs_reply: 'CS 답변',
  branch_guide: '지점 안내',
};

// translation use_case 필드 라벨
const TRANSLATION_FIELD_LABELS: Record<string, string> = {
  en: '지점명 EN', ja: '지점명 JA', zh: '지점명 ZH',
  zh_tw: '지점명 ZH-TW', zh_hk: '지점명 ZH-HK',
  address_en: '주소 EN', address_ja: '주소 JA', address_zh: '주소 ZH',
  address_zh_tw: '주소 ZH-TW', address_zh_hk: '주소 ZH-HK',
  pickupGuide_en: '픽업 안내 EN', pickupGuide_ja: '픽업 안내 JA',
  pickupGuide_zh: '픽업 안내 ZH', pickupGuide_zh_tw: '픽업 안내 ZH-TW',
  pickupGuide_zh_hk: '픽업 안내 ZH-HK',
  description_en: '설명 EN', description_ja: '설명 JA', description_zh: '설명 ZH',
  description_zh_tw: '설명 ZH-TW', description_zh_hk: '설명 ZH-HK',
};

async function fetchPendingOutputs(): Promise<AiOutput[]> {
  const SUPABASE_URL = getSupabaseBaseUrl();
  const headers = await getActiveAdminRequestHeaders();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_outputs?status=in.(ai_review_pending,ai_policy_failed)&order=created_at.desc`,
    {
      headers: {
        ...headers,
        apikey: getSupabaseConfig().anonKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function callRpc(rpcName: string, params: Record<string, string>): Promise<void> {
  const SUPABASE_URL = getSupabaseBaseUrl();
  const headers = await getActiveAdminRequestHeaders();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpcName}`, {
    method: 'POST',
    headers: {
      ...headers,
      apikey: getSupabaseConfig().anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
}

async function patchGeneratedContent(outputId: string, content: Record<string, string>): Promise<void> {
  const SUPABASE_URL = getSupabaseBaseUrl();
  const headers = await getActiveAdminRequestHeaders();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_outputs?id=eq.${outputId}`, {
    method: 'PATCH',
    headers: {
      ...headers,
      apikey: getSupabaseConfig().anonKey,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ generated_content: content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
}

function highlightViolations(text: string, violations: string[]): React.ReactNode {
  if (!violations.length) return text;
  const parts: React.ReactNode[] = [];
  let remaining = text;
  for (const v of violations) {
    const idx = remaining.indexOf(v);
    if (idx === -1) continue;
    parts.push(remaining.slice(0, idx));
    parts.push(
      <mark key={v + idx} className="bg-red-300 text-red-900 font-black px-0.5 rounded">
        {v}
      </mark>
    );
    remaining = remaining.slice(idx + v.length);
  }
  parts.push(remaining);
  return <>{parts}</>;
}

function ContentField({
  label, value, violations,
}: { label: string; value: string; violations: string[] }) {
  const hasViolation = violations.some(v => value.includes(v));
  return (
    <div className={`rounded-xl p-3 border ${hasViolation ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
      <div className="text-[10px] font-black text-gray-400 uppercase mb-1">{label}</div>
      <p className="text-xs font-bold text-gray-700 leading-relaxed whitespace-pre-wrap">
        {violations.length ? highlightViolations(value, violations) : value}
      </p>
    </div>
  );
}

function DetailPanel({
  out,
  onApprove,
  onReject,
  actionLoading,
  isEditing,
  editedContent,
  isDirty,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onContentChange,
}: {
  out: AiOutput;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: boolean;
  isEditing: boolean;
  editedContent: Record<string, string> | null;
  isDirty: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onContentChange: (field: string, value: string) => void;
}) {
  const content = out.generated_content ?? {};
  const displayContent = (isEditing ? editedContent : null) ?? content;
  const violations = out.policy_check?.violations ?? [];
  const passed = out.policy_check?.passed ?? true;
  const isTranslation = out.use_case === 'translation';
  const isCsReply = out.use_case === 'cs_reply';

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex-shrink-0 pb-3 border-b border-gray-100 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black bg-bee-yellow/20 text-bee-black px-2 py-0.5 rounded-full">
            {USE_CASE_LABELS[out.use_case] ?? out.use_case}
          </span>
          {passed ? (
            <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              ✓ 정책 통과
            </span>
          ) : (
            <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              ⚠ 정책 위반
            </span>
          )}
          {/* 편집 토글 */}
          {!isEditing ? (
            <button
              onClick={onStartEdit}
              className="ml-auto text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full hover:bg-gray-200 transition-all flex items-center gap-1"
            >
              <i className="fa-solid fa-pen text-[9px]"></i> 편집
            </button>
          ) : (
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={onCancelEdit}
                disabled={actionLoading}
                className="text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full hover:bg-gray-200 transition-all"
              >
                취소
              </button>
              <button
                onClick={onSaveEdit}
                disabled={actionLoading || !isDirty}
                className="text-[10px] font-black text-white bg-blue-500 px-2 py-0.5 rounded-full hover:bg-blue-600 transition-all disabled:opacity-40 flex items-center gap-1"
              >
                {actionLoading ? <i className="fa-solid fa-spinner animate-spin text-[9px]"></i> : null}
                저장
              </button>
            </div>
          )}
        </div>
        {out.entity_id && (
          <p className="text-[10px] text-gray-400 mt-1.5">
            <span className="font-bold">엔티티:</span> {out.entity_id}
          </p>
        )}
        {out.prompt_snapshot && (
          <p className="text-[10px] text-gray-400 mt-0.5">
            {isCsReply && out.prompt_snapshot.inquiry_preview && (
              <><span className="font-bold">문의 미리보기:</span> {out.prompt_snapshot.inquiry_preview}</>
            )}
            {isTranslation && out.prompt_snapshot.location_name && (
              <><span className="font-bold">지점:</span> {out.prompt_snapshot.location_name}</>
            )}
          </p>
        )}
      </div>

      {/* 정책 위반 항목 */}
      {violations.length > 0 && (
        <div className="flex-shrink-0 mb-3 flex flex-wrap gap-1">
          {violations.map(v => (
            <span key={v} className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              ✕ {v}
            </span>
          ))}
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {isEditing ? (
          /* 편집 모드: textarea */
          isCsReply ? (
            <div className="rounded-xl p-3 border border-blue-200 bg-blue-50">
              <div className="text-[10px] font-black text-blue-400 uppercase mb-1">CS 답변 초안 (편집 중)</div>
              <textarea
                className="w-full text-xs font-bold text-gray-700 leading-relaxed bg-transparent resize-none outline-none min-h-[120px]"
                value={displayContent.reply ?? ''}
                onChange={e => onContentChange('reply', e.target.value)}
                autoFocus
              />
            </div>
          ) : (
            Object.entries(content).map(([key, originalValue]) =>
              originalValue ? (
                <div key={key} className="rounded-xl p-3 border border-blue-200 bg-blue-50">
                  <div className="text-[10px] font-black text-blue-400 uppercase mb-1">
                    {TRANSLATION_FIELD_LABELS[key] ?? key}
                  </div>
                  <textarea
                    className="w-full text-xs font-bold text-gray-700 leading-relaxed bg-transparent resize-none outline-none min-h-[48px]"
                    value={displayContent[key] ?? originalValue}
                    onChange={e => onContentChange(key, e.target.value)}
                    rows={2}
                  />
                </div>
              ) : null
            )
          )
        ) : (
          /* 보기 모드 */
          isCsReply && content.reply ? (
            <ContentField label="CS 답변 초안" value={content.reply} violations={violations} />
          ) : isTranslation ? (
            Object.entries(content).map(([key, value]) =>
              value ? (
                <ContentField
                  key={key}
                  label={TRANSLATION_FIELD_LABELS[key] ?? key}
                  value={value}
                  violations={violations}
                />
              ) : null
            )
          ) : (
            Object.entries(content).map(([key, value]) =>
              value ? <ContentField key={key} label={key} value={value} violations={violations} /> : null
            )
          )
        )}
        {Object.keys(content).length === 0 && (
          <p className="text-xs text-gray-400 italic py-8 text-center">생성된 콘텐츠가 없습니다.</p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex-shrink-0 flex gap-3 pt-4 mt-4 border-t border-gray-100">
        <button
          onClick={() => onApprove(out.id)}
          disabled={actionLoading || out.status === 'ai_policy_failed'}
          className="flex-1 bg-green-500 text-white font-black py-3 rounded-2xl text-sm hover:bg-green-600 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          title={out.status === 'ai_policy_failed' ? '정책 위반 항목은 승인할 수 없습니다' : ''}
        >
          {actionLoading
            ? <i className="fa-solid fa-spinner animate-spin"></i>
            : <i className={`fa-solid ${isCsReply ? 'fa-copy' : 'fa-check'}`}></i>
          }
          {isTranslation ? '승인 (번역 적용)' : isCsReply ? '승인 + 복사' : '승인'}
        </button>
        <button
          onClick={() => onReject(out.id)}
          disabled={actionLoading}
          className="flex-1 bg-red-100 text-red-700 font-black py-3 rounded-2xl text-sm hover:bg-red-200 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-xmark"></i>
          반려
        </button>
      </div>
    </div>
  );
}

const AIReviewTab: React.FC = () => {
  const [outputs, setOutputs] = React.useState<AiOutput[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<AiOutput | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPendingOutputs();
      setOutputs(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  // 인라인 에디터 상태
  const [editedContent, setEditedContent] = React.useState<Record<string, string> | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  // selected 변경 시 편집 상태 초기화
  React.useEffect(() => {
    setEditedContent(null);
    setIsEditing(false);
  }, [selected?.id]);

  const isDirty = editedContent !== null &&
    JSON.stringify(editedContent) !== JSON.stringify(selected?.generated_content);

  const handleApprove = async (outputId: string) => {
    setActionLoading(true);
    try {
      const out = outputs.find(o => o.id === outputId);

      // auto-save if dirty (편집 내용 먼저 저장)
      if (isDirty && editedContent) {
        await patchGeneratedContent(outputId, editedContent);
      }

      // RPC: auth.uid()가 reviewer_id로 서버에서 결정됨
      await callRpc('approve_ai_output', { p_output_id: outputId });

      // CS 승인 후 클립보드 복사
      if (out?.use_case === 'cs_reply') {
        const replyText = (editedContent ?? out.generated_content)?.reply;
        if (replyText) {
          await navigator.clipboard.writeText(replyText).catch(() => {
            showToast('클립보드 복사 실패 — 직접 선택해서 복사해 주세요', 'error');
          });
        }
      }

      const label = out?.use_case === 'translation' ? '번역이 지점에 적용'
        : out?.use_case === 'cs_reply' ? 'CS 답변 확정 + 복사됨'
        : '승인';
      showToast(`✓ ${label}되었습니다.`);
      setSelected(null);
      setEditedContent(null);
      await load();
    } catch (e) {
      showToast(`승인 실패: ${e}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (outputId: string) => {
    if (!confirm('이 AI 생성 콘텐츠를 반려하시겠습니까?')) return;
    setActionLoading(true);
    try {
      // ai_policy_failed 포함 처리 (RPC fix: IN ('ai_review_pending', 'ai_policy_failed'))
      await callRpc('reject_ai_output', { p_output_id: outputId });
      showToast('반려 처리되었습니다.');
      setSelected(null);
      setEditedContent(null);
      await load();
    } catch (e) {
      showToast(`반려 실패: ${e}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartEdit = () => {
    setEditedContent({ ...(selected?.generated_content ?? {}) });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedContent(null);
    setIsEditing(false);
  };

  const handleContentChange = (field: string, value: string) => {
    setEditedContent(prev => ({ ...(prev ?? selected?.generated_content ?? {}), [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!selected || !editedContent) return;
    setActionLoading(true);
    try {
      await patchGeneratedContent(selected.id, editedContent);
      showToast('✓ 수정 내용 저장됨');
      setIsEditing(false);
      // 로컬 상태 동기화
      setSelected({ ...selected, generated_content: editedContent });
    } catch (e) {
      showToast(`저장 실패: ${e}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = outputs.filter(o => o.status === 'ai_review_pending').length;

  return (
    <div className="relative">
      {/* 토스트 */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl font-black text-sm shadow-2xl whitespace-nowrap transition-all ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-bee-black flex items-center gap-2">
            AI 검수함
            {pendingCount > 0 && (
              <span className="text-xs font-black bg-bee-yellow text-bee-black px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Claude가 생성한 콘텐츠를 검토하고 승인/반려합니다.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-1.5"
        >
          <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin' : ''}`}></i>
          새로고침
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-bold mb-4">
          <i className="fa-solid fa-triangle-exclamation mr-2"></i>{error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <i className="fa-solid fa-spinner animate-spin text-2xl text-bee-yellow"></i>
        </div>
      ) : outputs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-4">✨</div>
          <p className="text-sm font-black text-gray-500">모두 검수했어요!</p>
          <p className="text-xs text-gray-400 mt-1">지점 탭이나 예약 상세에서 AI 콘텐츠를 생성해보세요.</p>
        </div>
      ) : (
        /* 2-컬럼 스플릿 레이아웃 */
        <div className="flex gap-4" style={{ minHeight: '60vh' }}>
          {/* 좌: 큐 목록 */}
          <div className={`flex-shrink-0 space-y-2 overflow-y-auto ${selected ? 'w-72 hidden md:block' : 'w-full md:w-72'}`}>
            {outputs.map(out => {
              const passed = out.policy_check?.passed ?? true;
              const isSelected = selected?.id === out.id;
              return (
                <button
                  key={out.id}
                  onClick={() => setSelected(out)}
                  className={`w-full text-left bg-white rounded-2xl border p-3 hover:border-bee-yellow transition-all shadow-sm ${isSelected ? 'border-bee-yellow bg-bee-yellow/5' : 'border-gray-100'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-gray-700 truncate">
                      {USE_CASE_LABELS[out.use_case] ?? out.use_case}
                      {out.entity_id && <span className="text-gray-400 font-bold"> · {out.entity_id.slice(0, 8)}</span>}
                    </span>
                    {!passed && (
                      <span className="flex-shrink-0 text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                        위반
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${out.status === 'ai_review_pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                      {out.status === 'ai_review_pending' ? '검수 대기' : '정책 실패'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(out.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 우: 상세 패널 */}
          {selected ? (
            <div className={`flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${selected ? 'block' : 'hidden md:block'}`}
              style={{ maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
              {/* 모바일 뒤로가기 */}
              <button
                onClick={() => setSelected(null)}
                className="md:hidden text-xs font-bold text-gray-500 mb-3 flex items-center gap-1"
              >
                <i className="fa-solid fa-chevron-left"></i> 목록으로
              </button>
              <DetailPanel
                out={selected}
                onApprove={handleApprove}
                onReject={handleReject}
                actionLoading={actionLoading}
                isEditing={isEditing}
                editedContent={editedContent}
                isDirty={isDirty}
                onStartEdit={handleStartEdit}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={handleSaveEdit}
                onContentChange={handleContentChange}
              />
            </div>
          ) : (
            <div className="flex-1 hidden md:flex items-center justify-center text-center">
              <div>
                <i className="fa-regular fa-hand-pointer text-3xl text-gray-200 mb-3 block"></i>
                <p className="text-sm font-bold text-gray-400">항목을 선택하면 내용을 검수할 수 있습니다.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIReviewTab;
