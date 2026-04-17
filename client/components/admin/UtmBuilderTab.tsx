/**
 * UtmBuilderTab — UTM 파라미터 빌더 & 히스토리
 * 팀원 전용 도구: 캠페인 URL을 표준화된 방식으로 생성하고 클립보드 복사.
 * 히스토리는 localStorage에 최대 50개 보관.
 */

import React, { useState, useEffect } from 'react';

// ─── UTM 컨벤션 ───────────────────────────────────────────────────────────
const UTM_SOURCES = [
  'instagram', 'threads', 'twitter', 'facebook',
  'youtube', 'naver', 'google', 'kakao', 'line',
  'xiaohongshu', 'email', 'offline', 'direct',
];
const UTM_MEDIUMS = [
  'paid_social', 'organic_social', 'cpc', 'organic',
  'email', 'referral', 'display', 'affiliate', 'qr', 'none',
];
const BASE_URLS = [
  'https://bee-liber.com',
  'https://bee-liber.com/booking',
  'https://bee-liber.com/storage',
  'https://bee-liber.com/delivery',
  'https://bee-liber.com/branches',
];

interface HistoryEntry {
  id: string;
  fullUrl: string;
  source: string;
  medium: string;
  campaign: string;
  createdAt: string;
}

const HISTORY_KEY = 'beeliber_utm_history';
const MAX_HISTORY = 50;

const loadHistory = (): HistoryEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveHistory = (entry: HistoryEntry) => {
  const prev = loadHistory();
  const next = [entry, ...prev].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
};

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────
const UtmBuilderTab: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState('https://bee-liber.com');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [content, setContent] = useState('');
  const [term, setTerm] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  // 캠페인 자동완성 힌트
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const campaignHint = `${yyyymm}_kr_storage_awareness`;

  const buildUrl = (): string => {
    try {
      const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
      if (source)   url.searchParams.set('utm_source', source.toLowerCase().replace(/\s+/g, '_'));
      if (medium)   url.searchParams.set('utm_medium', medium.toLowerCase().replace(/\s+/g, '_'));
      if (campaign) url.searchParams.set('utm_campaign', campaign.toLowerCase().replace(/\s+/g, '_'));
      if (content)  url.searchParams.set('utm_content', content.toLowerCase().replace(/\s+/g, '_'));
      if (term)     url.searchParams.set('utm_term', term.toLowerCase().replace(/\s+/g, '_'));
      return url.toString();
    } catch {
      return baseUrl;
    }
  };

  const fullUrl = buildUrl();
  const isValid = source.trim() !== '' && medium.trim() !== '' && campaign.trim() !== '';

  const copy = (url: string, id: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleGenerate = () => {
    if (!isValid) return;
    const entry: HistoryEntry = {
      id: `utm_${Date.now()}`,
      fullUrl,
      source,
      medium,
      campaign,
      createdAt: new Date().toISOString(),
    };
    saveHistory(entry);
    setHistory(loadHistory());
    copy(fullUrl, entry.id);
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-[#F5C842] flex items-center justify-center">
            <i className="fa-solid fa-link text-[#111]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">UTM 링크 빌더</h2>
            <p className="text-xs text-gray-400">캠페인 URL을 표준 규칙으로 생성합니다</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── 빌더 폼 ── */}
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 space-y-4">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">링크 설정</p>

          {/* Base URL */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">랜딩 페이지 URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://bee-liber.com/..."
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F5C842]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {BASE_URLS.map((u) => (
                <button key={u} onClick={() => setBaseUrl(u)}
                  className="text-xs px-2 py-1 rounded-lg bg-gray-100 hover:bg-[#F5C842] hover:text-[#111] transition-colors font-mono">
                  {u.replace('https://bee-liber.com', '~')}
                </button>
              ))}
            </div>
          </div>

          {/* UTM Source */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">
              utm_source <span className="text-red-400">*</span>
              <span className="text-gray-300 ml-1">유입 플랫폼</span>
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="instagram"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C842]"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {UTM_SOURCES.map((s) => (
                <button key={s} onClick={() => setSource(s)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors font-mono ${source === s ? 'bg-[#F5C842] text-[#111] font-black' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* UTM Medium */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">
              utm_medium <span className="text-red-400">*</span>
              <span className="text-gray-300 ml-1">매체 유형</span>
            </label>
            <input
              type="text"
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              placeholder="paid_social"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C842]"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {UTM_MEDIUMS.map((m) => (
                <button key={m} onClick={() => setMedium(m)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors font-mono ${medium === m ? 'bg-[#F5C842] text-[#111] font-black' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* UTM Campaign */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">
              utm_campaign <span className="text-red-400">*</span>
              <span className="text-gray-300 ml-1">캠페인 식별자</span>
            </label>
            <input
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder={campaignHint}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F5C842]"
            />
            <p className="text-xs text-gray-400 mt-1">포맷: <span className="font-mono">{'{YYYYMM}_{지역}_{상품}_{목적}'}</span></p>
          </div>

          {/* UTM Content (선택) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                utm_content <span className="text-gray-300">(선택)</span>
              </label>
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="reels_v01_feed"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F5C842]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                utm_term <span className="text-gray-300">(선택)</span>
              </label>
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="2535_traveler_tw"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F5C842]"
              />
            </div>
          </div>

          {/* 생성된 URL 미리보기 */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-400 mb-2">생성 URL 미리보기</p>
            <p className="text-xs font-mono text-gray-700 break-all leading-relaxed">{fullUrl}</p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!isValid}
            className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all ${
              isValid
                ? 'bg-[#F5C842] text-[#111] hover:brightness-95 active:scale-[0.98]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}>
            {copied === (history[0]?.id ?? '') ? (
              <span><i className="fa-solid fa-check mr-2 text-green-600" />복사 완료!</span>
            ) : (
              <span><i className="fa-solid fa-copy mr-2" />생성 & 복사</span>
            )}
          </button>
        </div>

        {/* ── 규칙 & 히스토리 ── */}
        <div className="space-y-4">
          {/* 네이밍 규칙 */}
          <div className="bg-[#111] rounded-[28px] p-6 text-white">
            <p className="text-xs font-black text-[#F5C842] uppercase tracking-widest mb-3">네이밍 규칙</p>
            <ul className="space-y-2 text-xs text-white/70">
              <li><i className="fa-solid fa-check text-[#F5C842] mr-2" />모두 소문자 + snake_case</li>
              <li><i className="fa-solid fa-check text-[#F5C842] mr-2" />공백 없음 (공백 → 언더스코어)</li>
              <li><i className="fa-solid fa-check text-[#F5C842] mr-2" />한글 금지 (인코딩 이슈)</li>
              <li><i className="fa-solid fa-check text-[#F5C842] mr-2" />최대 50자</li>
            </ul>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold text-white/50">campaign 예시</p>
              {[
                `${yyyymm}_kr_storage_awareness`,
                `${yyyymm}_jp_delivery_conversion`,
                `${yyyymm}_tw_combo_retention`,
              ].map((ex) => (
                <button key={ex} onClick={() => setCampaign(ex)}
                  className="block w-full text-left text-xs font-mono bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 transition-colors">
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* 히스토리 */}
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">최근 생성 내역</p>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-600 font-bold">
                  전체 삭제
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-gray-300 text-center py-4">생성된 UTM 링크가 없습니다.</p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {history.map((entry) => (
                  <div key={entry.id} className="bg-gray-50 rounded-2xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono bg-[#F5C842] text-[#111] px-2 py-0.5 rounded-lg font-black">{entry.source}</span>
                      <span className="text-xs font-mono text-gray-400">{entry.medium}</span>
                      <span className="text-xs text-gray-300 ml-auto">{new Date(entry.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <p className="text-xs font-mono text-gray-600 truncate mb-2">{entry.campaign}</p>
                    <p className="text-xs font-mono text-gray-400 truncate">{entry.fullUrl}</p>
                    <button
                      onClick={() => copy(entry.fullUrl, entry.id)}
                      className="mt-2 text-xs font-bold text-[#111] bg-white border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-[#F5C842] hover:border-[#F5C842] transition-colors w-full">
                      {copied === entry.id ? <span className="text-green-600"><i className="fa-solid fa-check mr-1" />복사됨</span> : <span><i className="fa-solid fa-copy mr-1" />복사</span>}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UtmBuilderTab;
