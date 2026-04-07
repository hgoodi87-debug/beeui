/**
 * 한국 회계처리 양식 XLSX 내보내기
 * 계정과목: 매출, 비용, 부가세 분리
 * 시트 구성: 손익계산서 / 매출 거래장 / 지출 거래장 / 통합 계정원장
 */
import * as XLSX from 'xlsx';
import type { Expenditure } from '../src/domains/shared/types';

// ── 계정과목 매핑 ────────────────────────────────────────
const EXPENSE_ACCOUNT: Record<string, string> = {
  '유류비':         '831 교통비',
  '교통비':         '831 교통비',
  '파트너십 운송비': '832 파트너운송비',
  '파트너운송비':   '832 파트너운송비',
  '운송비':         '832 파트너운송비',
  '식대':           '812 식대',
  '식비':           '812 식대',
  '회식':           '812 식대',
  '소모품':         '820 소모품비',
  '소모품비':       '820 소모품비',
  '임차료':         '840 임차료',
  '광고':           '850 광고선전비',
  '광고비':         '850 광고선전비',
  '마케팅':         '850 광고선전비',
  '수수료':         '860 지급수수료',
  '플랫폼':         '860 지급수수료',
  '인건비':         '801 급여',
  '급여':           '801 급여',
  '보험':           '870 보험료',
  '통신':           '880 통신비',
  '통신비':         '880 통신비',
  '수리':           '890 수선비',
  '기타':           '899 잡비',
};

function resolveExpenseAccount(category: string): string {
  const key = Object.keys(EXPENSE_ACCOUNT).find(k =>
    category.toLowerCase().includes(k.toLowerCase())
  );
  return key ? EXPENSE_ACCOUNT[key] : '899 잡비';
}

const PAYMENT_ACCOUNT: Record<string, string> = {
  card:     '110 외상매출금(카드)',
  cash:     '101 현금',
  naver:    '110 외상매출금(네이버페이)',
  kakao:    '110 외상매출금(카카오페이)',
  paypal:   '110 외상매출금(PayPal)',
  apple:    '110 외상매출금(애플페이)',
  samsung:  '110 외상매출금(삼성페이)',
  alipay:   '110 외상매출금(알리페이)',
  wechat:   '110 외상매출금(위챗페이)',
};

function resolvePaymentAccount(method: string): string {
  return PAYMENT_ACCOUNT[method?.toLowerCase()] ?? '110 외상매출금(기타)';
}

// ── 스타일 헬퍼 ─────────────────────────────────────────
function hStyle(bg: string, bold = true) {
  return { font: { bold, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: bg } }, alignment: { horizontal: 'center', vertical: 'center' }, border: { bottom: { style: 'thin', color: { rgb: 'CCCCCC' } } } };
}
function numFmt(val: number) { return Number(val) || 0; }

function applyHeaderStyle(ws: XLSX.WorkSheet, range: string, bg: string) {
  const ref = XLSX.utils.decode_range(range);
  for (let C = ref.s.c; C <= ref.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: ref.s.r, c: C });
    if (!ws[addr]) ws[addr] = {};
    ws[addr].s = hStyle(bg);
  }
}

// ── Sheet 1: 손익계산서 ──────────────────────────────────
function buildPLSheet(
  revenueStats: any,
  accountingMonthlyStats: any[],
  startDate: string,
  endDate: string
): XLSX.WorkSheet {
  const today = new Date().toLocaleDateString('ko-KR');
  const totalRevenue = numFmt(revenueStats?.total);
  const totalExpenditure = numFmt(revenueStats?.expenditure);
  const netProfit = totalRevenue - totalExpenditure;
  const vat = Math.round(totalRevenue / 11); // 부가세 (10/110 = 1/11)
  const revenueExVat = totalRevenue - vat;
  const marginRate = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  const rows: any[][] = [
    ['빌리버 (Beeliber) — 손익계산서 (Income Statement)'],
    [`조회 기간: ${startDate} ~ ${endDate}`, '', '', `출력일: ${today}`],
    [],
    ['구 분', '계정과목', '금 액 (₩)', '비 고'],
    // 매출
    ['Ⅰ. 매출액', '', '', ''],
    ['', '401 서비스매출 (VAT 포함)', numFmt(totalRevenue), ''],
    ['', '(-)부가세 예정액', -vat, '약 1/11 산출'],
    ['', '  순매출액', revenueExVat, ''],
    // 월별
    [], ['  ※ 월별 매출 내역', '', '', ''],
    ['  월', '건수', '매출액', '누적매출'],
    ...accountingMonthlyStats.map(s => [
      `  ${s.month}`,
      `${s.count}건`,
      numFmt(s.total),
      numFmt(s.cumulative),
    ]),
    [],
    // 비용
    ['Ⅱ. 영업비용', '', '', ''],
    ['', '800~899 판매관리비 합계', numFmt(totalExpenditure), ''],
    [],
    // 손익
    ['Ⅲ. 영업이익 (Ⅰ-Ⅱ)', '', netProfit, ''],
    ['', '마진율', `${marginRate}%`, ''],
    [],
    ['결제수단별 매출', '', '', ''],
    ['카드', '현금', '네이버페이', '카카오페이'],
    [
      numFmt(revenueStats?.card),
      numFmt(revenueStats?.cash),
      numFmt(revenueStats?.naver),
      numFmt(revenueStats?.kakao),
    ],
    ['페이팔', '애플페이', '삼성페이', '해외결제 합계'],
    [
      numFmt(revenueStats?.paypal),
      numFmt(revenueStats?.apple),
      numFmt(revenueStats?.samsung),
      numFmt((revenueStats?.alipay || 0) + (revenueStats?.wechat || 0)),
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 26 }, { wch: 32 }, { wch: 18 }, { wch: 20 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
  ];
  applyHeaderStyle(ws, 'A4:D4', '111827');
  return ws;
}

// ── Sheet 2: 매출 거래장 ─────────────────────────────────
function buildSalesSheet(
  accountingDailyStats: any[],
  revenueStats: any
): XLSX.WorkSheet {
  const headers = [
    '거래일자', '전표번호', '계정과목(차변)', '계정과목(대변)',
    '차변금액(₩)', '대변금액(₩)', '잔액(₩)', '예약건수', '적 요',
  ];

  let cumulative = 0;
  let voucherNo = 1;
  const dataRows = accountingDailyStats.map(s => {
    cumulative += numFmt(s.total);
    const row = [
      s.date,
      `SL-${String(voucherNo++).padStart(4, '0')}`,
      resolvePaymentAccount('card'),   // 혼합 결제 → 대표 차변
      '401 서비스매출',
      numFmt(s.total),
      numFmt(s.total),
      cumulative,
      s.count,
      `예약 ${s.count}건 매출`,
    ];
    return row;
  });

  // 합계행
  const totalRevenue = numFmt(revenueStats?.total);
  const totalCount   = numFmt(revenueStats?.count);
  dataRows.push([
    '합 계', '', '', '',
    totalRevenue, totalRevenue, '', totalCount, '',
  ]);

  const rows = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 18 },
    { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 24 },
  ];
  applyHeaderStyle(ws, 'A1:I1', '1D4ED8');
  return ws;
}

// ── Sheet 3: 지출 거래장 ─────────────────────────────────
function buildExpenseSheet(expenditures: Expenditure[]): XLSX.WorkSheet {
  const headers = [
    '거래일자', '전표번호', '계정과목(차변)', '계정과목(대변)',
    '차변금액(₩)', '대변금액(₩)', '거래처/지점', '적 요',
  ];

  const sorted = [...expenditures].sort((a, b) => a.date.localeCompare(b.date));
  let voucherNo = 1;

  const dataRows = sorted.map(e => [
    e.date,
    `EX-${String(voucherNo++).padStart(4, '0')}`,
    resolveExpenseAccount(e.category),
    '101 현금',
    numFmt(e.amount),
    numFmt(e.amount),
    e.branchId || 'HQ 본사',
    e.description || e.category,
  ]);

  // 카테고리별 소계
  const catMap: Record<string, number> = {};
  expenditures.forEach(e => {
    const acct = resolveExpenseAccount(e.category);
    catMap[acct] = (catMap[acct] || 0) + numFmt(e.amount);
  });
  dataRows.push([], ['※ 계정과목별 소계', '', '', '', '', '', '', '']);
  Object.entries(catMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([acct, amt]) => {
      dataRows.push(['', acct, '', '', amt, amt, '', '']);
    });

  const totalExp = expenditures.reduce((s, e) => s + numFmt(e.amount), 0);
  dataRows.push(['합 계', '', '', '', totalExp, totalExp, '', '']);

  const rows = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 14 }, { wch: 14 }, { wch: 26 }, { wch: 16 },
    { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 30 },
  ];
  applyHeaderStyle(ws, 'A1:H1', 'EF4444');
  return ws;
}

// ── Sheet 4: 통합 계정원장 ───────────────────────────────
function buildLedgerSheet(
  accountingDailyStats: any[],
  expenditures: Expenditure[],
): XLSX.WorkSheet {
  const headers = [
    '거래일자', '전표번호', '유 형', '계정과목(차변)', '계정과목(대변)',
    '차변금액(₩)', '대변금액(₩)', '잔액(₩)', '적 요',
  ];

  type LedgerRow = {
    date: string;
    voucher: string;
    type: '매출' | '지출';
    debitAcct: string;
    creditAcct: string;
    debit: number;
    credit: number;
    memo: string;
  };

  const entries: LedgerRow[] = [];

  accountingDailyStats.forEach((s, i) => {
    entries.push({
      date: s.date,
      voucher: `SL-${String(i + 1).padStart(4, '0')}`,
      type: '매출',
      debitAcct: '110 외상매출금',
      creditAcct: '401 서비스매출',
      debit: numFmt(s.total),
      credit: numFmt(s.total),
      memo: `예약 ${s.count}건 매출`,
    });
  });

  expenditures.forEach((e, i) => {
    entries.push({
      date: e.date,
      voucher: `EX-${String(i + 1).padStart(4, '0')}`,
      type: '지출',
      debitAcct: resolveExpenseAccount(e.category),
      creditAcct: '101 현금',
      debit: numFmt(e.amount),
      credit: numFmt(e.amount),
      memo: e.description || e.category,
    });
  });

  entries.sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  const dataRows = entries.map(e => {
    balance += e.type === '매출' ? e.debit : -e.debit;
    return [e.date, e.voucher, e.type, e.debitAcct, e.creditAcct, e.debit, e.credit, balance, e.memo];
  });

  const rows = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 26 }, { wch: 20 },
    { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 30 },
  ];
  applyHeaderStyle(ws, 'A1:I1', '4B0082');
  return ws;
}

// ── 메인 Export 함수 ─────────────────────────────────────
export function exportKoreanAccountingXLSX(opts: {
  revenueStats: any;
  accountingDailyStats: any[];
  accountingMonthlyStats: any[];
  expenditures: Expenditure[];
  startDate: string;
  endDate: string;
}) {
  const { revenueStats, accountingDailyStats, accountingMonthlyStats, expenditures, startDate, endDate } = opts;

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, buildPLSheet(revenueStats, accountingMonthlyStats, startDate, endDate), '손익계산서');
  XLSX.utils.book_append_sheet(wb, buildSalesSheet(accountingDailyStats, revenueStats), '매출 거래장');
  XLSX.utils.book_append_sheet(wb, buildExpenseSheet(expenditures), '지출 거래장');
  XLSX.utils.book_append_sheet(wb, buildLedgerSheet(accountingDailyStats, expenditures), '통합 계정원장');

  const filename = `빌리버_회계장부_${startDate}_${endDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}
