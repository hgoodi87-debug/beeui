import React from 'react';
import { getSupabaseBaseUrl } from '../../services/supabaseRuntime';
import { getActiveAdminRequestHeaders } from '../../services/adminAuthService';

interface AiOutput {
  id: string;
  use_case: string;
  entity_id: string | null;
  generated_content: Record<string, string>;
  policy_check: { passed: boolean; violations: string[] };
  status: string;
  created_at: string;
}

const LANG_LABELS: Record<string, string> = {
  en: '영어 (EN)',
  ja: '일본어 (JA)',
  zh: '중국어 간체 (ZH)',
  zh_tw: '대만 번체 (ZH-TW)',
  zh_hk: '홍콩 번체 (ZH-HK)',
};

const TRANSLATION_FIELD_LABELS: Record<string, string> = {
  en: '지점명 EN',
  ja: '지점명 JA',
  zh: '지점명 ZH',
  zh_tw: '지점명 ZH-TW',
  zh_hk: '지점명 ZH-HK',
  address_en: '주소 EN',
  address_ja: '주소 JA',
  address_zh: '주소 ZH',
  address_zh_tw: '주소 ZH-TW',
  address_zh_hk: '주소 ZH-HK',
  pickupGuide_en: '픽업 안내 EN',
  pickupGuide_ja: '픽업 안내 JA',
  pickupGuide_zh: '픽업 안내 ZH',
  pickupGuide_zh_tw: '픽업 안내 ZH-TW',
  pickupGuide_zh_hk: '픽업 안내 ZH-HK',
  description_en: '설명 EN',
  description_ja: '설명 JA',
  description_zh: '설명 ZH',
  description_zh_tw: '설명 ZH-TW',
  description_zh_hk: '설명 ZH-HK',
};

async function fetchPendingOutputs(): Promise<AiOutput[]> {
  const SUPABASE_URL = getSupabaseBaseUrl();
  const headers = await getActiveAdminRequestHeaders();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_outputs?status=in.(ai_review_pending,ai_policy_failed)&order=created_at.desc`,
    {
      headers: {
        ...headers,
        apikey: (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''),
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
      apikey: (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
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

  const load = async () => {
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
  };

  React.useEffect(() => { load(); }, []);

  const handleApprove = async (outputId: string) => {
    setActionLoading(true);
    try {
      await callRpc('approve_ai_output', { p_output_id: outputId, p_reviewer_id: '' });
      showToast('승인 완료! 지점 번역이 업데이트되었습니다. ✓');
      setSelected(null);
      await load();
    } catch (e) {
      showToast(`승인 실패: ${e}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (outputId: string) => {
    if (!confirm('이 AI 생성 번역을 반려하시겠습니까?')) return;
    setActionLoading(true);
    try {
      await callRpc('reject_ai_output', { p_output_id: outputId, p_reviewer_id: '' });
      showToast('반려 처리되었습니다.');
      setSelected(null);
      await load();
    } catch (e) {
      showToast(`반려 실패: ${e}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 토스트 */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-bee-black">AI 검수함</h2>
          <p className="text-xs text-gray-400 mt-0.5">Claude가 생성한 번역을 검토하고 승인/반려합니다.</p>
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
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-bold">
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
          <p className="text-xs text-gray-400 mt-1">지점 탭에서 AI 번역을 생성해보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {outputs.map(out => (
            <div
              key={out.id}
              onClick={() => setSelected(out)}
              className={`bg-white rounded-2xl border p-4 cursor-pointer hover:border-bee-yellow transition-all shadow-sm ${selected?.id === out.id ? 'border-bee-yellow' : 'border-gray-100'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-gray-700">
                    {out.entity_id ? `지점: ${out.entity_id}` : out.use_case}
                  </span>
                  <span className="ml-2 text-[10px] text-gray-400">
                    {new Date(out.created_at).toLocaleString('ko-KR')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {out.policy_check?.passed ? (
                    <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      ✓ 정책 통과
                    </span>
                  ) : (
                    <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      ⚠ 정책 위반
                    </span>
                  )}
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${out.status === 'ai_review_pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {out.status === 'ai_review_pending' ? '검수 대기' : '정책 실패'}
                  </span>
                </div>
              </div>

              {/* 정책 위반 단어 하이라이트 */}
              {out.policy_check?.violations?.length > 0 && (
                <div className="mt-2 text-[10px] text-red-600 font-bold">
                  위반 단어: {out.policy_check.violations.map(v => (
                    <span key={v} className="bg-red-100 px-1.5 py-0.5 rounded mr-1">{v}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 상세 패널 */}
      {selected && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-t-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-bee-black">번역 검수</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* 생성된 번역 내용 */}
            <div className="space-y-3">
              {Object.entries(selected.generated_content).map(([key, value]) => {
                if (!value) return null;
                const isViolation = selected.policy_check?.violations?.some(v => value.includes(v));
                return (
                  <div key={key} className={`rounded-xl p-3 border ${isViolation ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="text-[10px] font-black text-gray-400 uppercase mb-1">
                      {TRANSLATION_FIELD_LABELS[key] || key}
                    </div>
                    <p className="text-xs font-bold text-gray-700 leading-relaxed">
                      {selected.policy_check?.violations?.length ? (
                        highlightViolations(value, selected.policy_check.violations)
                      ) : (
                        value
                      )}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleApprove(selected.id)}
                disabled={actionLoading}
                className="flex-1 bg-green-500 text-white font-black py-3 rounded-2xl text-sm hover:bg-green-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-check"></i>}
                승인 (locations 업데이트)
              </button>
              <button
                onClick={() => handleReject(selected.id)}
                disabled={actionLoading}
                className="flex-1 bg-red-500 text-white font-black py-3 rounded-2xl text-sm hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-xmark"></i>
                반려
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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

export default AIReviewTab;
