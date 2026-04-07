/**
 * 한국 회계처리 양식 XLSX 내보내기
 * 시트 구성:
 *   1. 손익계산서
 *   2. 매출 거래장
 *   3. 지출 거래장 (계정과목 순 / 고정비·유동비 구분 / 법카·개인 구분)
 *   4. 통합 계정원장
 *   5. 고정비 명세
 *   6. 유동비 명세
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

// 고정비 판단 기준 계정과목 (명시적 costType 없을 때 기본값)
const FIXED_ACCOUNTS = new Set([
  '801 급여',
  '840 임차료',
  '870 보험료',
  '880 통신비',
]);

function resolveExpenseAccount(category: string): string {
  const key = Object.keys(EXPENSE_ACCOUNT).find(k =>
    category.toLowerCase().includes(k.toLowerCase())
  );
  return key ? EXPENSE_ACCOUNT[key] : '899 잡비';
}

/** costType 명시 없을 경우 계정과목으로 추론 */
function resolveCostType(e: Expenditure): '고정비' | '유동비' {
  if (e.costType === 'fixed') return '고정비';
  if (e.costType === 'variable') return '유동비';
  const acct = resolveExpenseAccount(e.category);
  return FIXED_ACCOUNTS.has(acct) ? '고정비' : '유동비';
}

function resolvePaymentType(e: Expenditure): '법인카드' | '개인비용' {
  if (e.paymentType === 'corporate_card') return '법인카드';
  if (e.paymentType === 'personal') return '개인비용';
  return '개인비용'; // 기본값
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
function hStyle(bg: string) {
  return {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: bg } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { bottom: { style: 'thin', color: { rgb: 'CCCCCC' } } },
  };
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
  expenditures: Expenditure[],
  startDate: string,
  endDate: string
): XLSX.WorkSheet {
  const today = new Date().toLocaleDateString('ko-KR');
  const totalRevenue = numFmt(revenueStats?.total);
  const totalExpenditure = numFmt(revenueStats?.expenditure);
  const netProfit = totalRevenue - totalExpenditure;
  const vat = Math.round(totalRevenue / 11);
  const revenueExVat = totalRevenue - vat;
  const marginRate = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // 고정비 / 유동비 합계
  const fixedTotal = expenditures.filter(e => resolveCostType(e) === '고정비').reduce((s, e) => s + numFmt(e.amount), 0);
  const varTotal   = expenditures.filter(e => resolveCostType(e) === '유동비').reduce((s, e) => s + numFmt(e.amount), 0);
  // 법카 / 개인 합계
  const corpTotal  = expenditures.filter(e => resolvePaymentType(e) === '법인카드').reduce((s, e) => s + numFmt(e.amount), 0);
  const persTotal  = expenditures.filter(e => resolvePaymentType(e) === '개인비용').reduce((s, e) => s + numFmt(e.amount), 0);

  const rows: any[][] = [
    ['빌리버 (Beeliber) — 손익계산서 (Income Statement)'],
    [`조회 기간: ${startDate} ~ ${endDate}`, '', '', `출력일: ${today}`],
    [],
    ['구 분', '계정과목', '금 액 (₩)', '비 고'],
    ['Ⅰ. 매출액', '', '', ''],
    ['', '401 서비스매출 (VAT 포함)', numFmt(totalRevenue), ''],
    ['', '(-)부가세 예정액', -vat, '약 1/11 산출'],
    ['', '  순매출액', revenueExVat, ''],
    [], ['  ※ 월별 매출 내역', '', '', ''],
    ['  월', '건수', '매출액', '누적매출'],
    ...accountingMonthlyStats.map(s => [`  ${s.month}`, `${s.count}건`, numFmt(s.total), numFmt(s.cumulative)]),
    [],
    ['Ⅱ. 영업비용', '', '', ''],
    ['', '800~899 판매관리비 합계', numFmt(totalExpenditure), ''],
    ['', '  - 고정비 소계', fixedTotal, '임차료·급여·보험·통신 등'],
    ['', '  - 유동비 소계', varTotal, '식대·교통·광고·소모품 등'],
    ['', '  - 법인카드 지출', corpTotal, ''],
    ['', '  - 개인비용 지출', persTotal, ''],
    [],
    ['Ⅲ. 영업이익 (Ⅰ-Ⅱ)', '', netProfit, ''],
    ['', '마진율', `${marginRate}%`, ''],
    [],
    ['결제수단별 매출', '', '', ''],
    ['카드', '현금', '네이버페이', '카카오페이'],
    [numFmt(revenueStats?.card), numFmt(revenueStats?.cash), numFmt(revenueStats?.naver), numFmt(revenueStats?.kakao)],
    ['페이팔', '애플페이', '삼성페이', '해외결제 합계'],
    [numFmt(revenueStats?.paypal), numFmt(revenueStats?.apple), numFmt(revenueStats?.samsung), numFmt((revenueStats?.alipay || 0) + (revenueStats?.wechat || 0))],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 26 }, { wch: 34 }, { wch: 18 }, { wch: 24 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
  ];
  applyHeaderStyle(ws, 'A4:D4', '111827');
  return ws;
}

// ── Sheet 2: 매출 거래장 ─────────────────────────────────
function buildSalesSheet(accountingDailyStats: any[], revenueStats: any): XLSX.WorkSheet {
  const headers = [
    '거래일자', '전표번호', '계정과목(차변)', '계정과목(대변)',
    '차변금액(₩)', '대변금액(₩)', '잔액(₩)', '예약건수', '적 요',
  ];
  let cumulative = 0;
  let voucherNo = 1;
  const dataRows = accountingDailyStats.map(s => {
    cumulative += numFmt(s.total);
    return [
      s.date,
      `SL-${String(voucherNo++).padStart(4, '0')}`,
      resolvePaymentAccount('card'),
      '401 서비스매출',
      numFmt(s.total),
      numFmt(s.total),
      cumulative,
      s.count,
      `예약 ${s.count}건 매출`,
    ];
  });
  dataRows.push(['합 계', '', '', '', numFmt(revenueStats?.total), numFmt(revenueStats?.total), '', numFmt(revenueStats?.count), '']);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 24 }];
  applyHeaderStyle(ws, 'A1:I1', '1D4ED8');
  return ws;
}

// ── Sheet 3: 지출 거래장 (계정과목 순 / 고정비·유동비 / 법카·개인 구분) ─────
function buildExpenseSheet(expenditures: Expenditure[]): XLSX.WorkSheet {
  const headers = [
    '거래일자', '전표번호', '계정과목(차변)', '계정과목(대변)',
    '차변금액(₩)', '대변금액(₩)', '비용구분', '결제구분', '거래처/지점', '적 요',
  ];

  // 계정과목 코드 번호 기준 정렬 → 같은 계정 안에서는 날짜 순
  const sorted = [...expenditures].sort((a, b) => {
    const acctA = resolveExpenseAccount(a.category);
    const acctB = resolveExpenseAccount(b.category);
    if (acctA !== acctB) return acctA.localeCompare(acctB);
    return a.date.localeCompare(b.date);
  });

  let voucherNo = 1;
  const dataRows = sorted.map(e => [
    e.date,
    `EX-${String(voucherNo++).padStart(4, '0')}`,
    resolveExpenseAccount(e.category),
    '101 현금',
    numFmt(e.amount),
    numFmt(e.amount),
    resolveCostType(e),
    resolvePaymentType(e),
    e.branchId || 'HQ 본사',
    e.description || e.category,
  ]);

  // ── 계정과목별 소계
  const catMap: Record<string, number> = {};
  expenditures.forEach(e => {
    const acct = resolveExpenseAccount(e.category);
    catMap[acct] = (catMap[acct] || 0) + numFmt(e.amount);
  });
  dataRows.push([], ['※ 계정과목별 소계', '', '', '', '', '', '', '', '', '']);
  Object.entries(catMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([acct, amt]) => {
      dataRows.push(['', acct, '', '', amt, amt, '', '', '', '']);
    });

  // ── 고정비 / 유동비 소계
  const fixedTotal = sorted.filter(e => resolveCostType(e) === '고정비').reduce((s, e) => s + numFmt(e.amount), 0);
  const varTotal   = sorted.filter(e => resolveCostType(e) === '유동비').reduce((s, e) => s + numFmt(e.amount), 0);
  dataRows.push([], ['※ 비용구분 소계', '', '', '', '', '', '', '', '', '']);
  dataRows.push(['', '고정비 합계', '', '', fixedTotal, fixedTotal, '고정비', '', '', '']);
  dataRows.push(['', '유동비 합계', '', '', varTotal,   varTotal,   '유동비', '', '', '']);

  // ── 법카 / 개인 소계
  const corpTotal = sorted.filter(e => resolvePaymentType(e) === '법인카드').reduce((s, e) => s + numFmt(e.amount), 0);
  const persTotal = sorted.filter(e => resolvePaymentType(e) === '개인비용').reduce((s, e) => s + numFmt(e.amount), 0);
  dataRows.push([], ['※ 결제구분 소계', '', '', '', '', '', '', '', '', '']);
  dataRows.push(['', '법인카드 합계', '', '', corpTotal, corpTotal, '', '법인카드', '', '']);
  dataRows.push(['', '개인비용 합계', '', '', persTotal, persTotal, '', '개인비용', '', '']);

  const totalExp = expenditures.reduce((s, e) => s + numFmt(e.amount), 0);
  dataRows.push(['합 계', '', '', '', totalExp, totalExp, '', '', '', '']);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  ws['!cols'] = [
    { wch: 14 }, { wch: 14 }, { wch: 26 }, { wch: 16 },
    { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 30 },
  ];
  applyHeaderStyle(ws, 'A1:J1', 'EF4444');
  return ws;
}

// ── Sheet 4: 통합 계정원장 ───────────────────────────────
function buildLedgerSheet(accountingDailyStats: any[], expenditures: Expenditure[]): XLSX.WorkSheet {
  const headers = [
    '거래일자', '전표번호', '유 형', '계정과목(차변)', '계정과목(대변)',
    '차변금액(₩)', '대변금액(₩)', '잔액(₩)', '비용구분', '결제구분', '적 요',
  ];

  type LedgerRow = {
    date: string; voucher: string; type: '매출' | '지출';
    debitAcct: string; creditAcct: string; debit: number; credit: number;
    costType: string; payType: string; memo: string;
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
      costType: '',
      payType: '',
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
      costType: resolveCostType(e),
      payType: resolvePaymentType(e),
      memo: e.description || e.category,
    });
  });

  entries.sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  const dataRows = entries.map(e => {
    balance += e.type === '매출' ? e.debit : -e.debit;
    return [e.date, e.voucher, e.type, e.debitAcct, e.creditAcct, e.debit, e.credit, balance, e.costType, e.payType, e.memo];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  ws['!cols'] = [
    { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 26 }, { wch: 20 },
    { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 30 },
  ];
  applyHeaderStyle(ws, 'A1:K1', '4B0082');
  return ws;
}

// ── Sheet 5: 고정비 명세 ─────────────────────────────────
function buildFixedCostSheet(expenditures: Expenditure[]): XLSX.WorkSheet {
  const headers = [
    '거래일자', '계정과목', '카테고리', '금 액 (₩)', '결제구분', '거래처/지점', '적 요',
  ];

  const fixed = expenditures
    .filter(e => resolveCostType(e) === '고정비')
    .sort((a, b) => {
      const acctA = resolveExpenseAccount(a.category);
      const acctB = resolveExpenseAccount(b.category);
      if (acctA !== acctB) return acctA.localeCompare(acctB);
      return a.date.localeCompare(b.date);
    });

  const dataRows = fixed.map(e => [
    e.date,
    resolveExpenseAccount(e.category),
    e.category,
    numFmt(e.amount),
    resolvePaymentType(e),
    e.branchId || 'HQ 본사',
    e.description || '',
  ]);

  // 계정과목별 소계
  const acctMap: Record<string, number> = {};
  fixed.forEach(e => {
    const a = resolveExpenseAccount(e.category);
    acctMap[a] = (acctMap[a] || 0) + numFmt(e.amount);
  });
  dataRows.push([], ['※ 계정과목별 소계', '', '', '', '', '', '']);
  Object.entries(acctMap).sort((a, b) => a[0].localeCompare(b[0])).forEach(([acct, amt]) => {
    dataRows.push(['', acct, '', amt, '', '', '']);
  });

  const totalFixed = fixed.reduce((s, e) => s + numFmt(e.amount), 0);
  dataRows.push(['고정비 합계', '', '', totalFixed, '', '', '']);

  // 법카 / 개인 구분 소계
  const corpF = fixed.filter(e => resolvePaymentType(e) === '법인카드').reduce((s, e) => s + numFmt(e.amount), 0);
  const persF = fixed.filter(e => resolvePaymentType(e) === '개인비용').reduce((s, e) => s + numFmt(e.amount), 0);
  dataRows.push([], ['법인카드 소계', '', '', corpF, '법인카드', '', '']);
  dataRows.push(['개인비용 소계', '', '', persF, '개인비용', '', '']);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  ws['!cols'] = [{ wch: 14 }, { wch: 26 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 18 }, { wch: 30 }];
  applyHeaderStyle(ws, 'A1:G1', '059669');
  return ws;
}

// ── Sheet 6: 유동비 명세 ─────────────────────────────────
function buildVariableCostSheet(expenditures: Expenditure[]): XLSX.WorkSheet {
  const headers = [
    '거래일자', '계정과목', '카테고리', '금 액 (₩)', '결제구분', '거래처/지점', '적 요',
  ];

  const variable = expenditures
    .filter(e => resolveCostType(e) === '유동비')
    .sort((a, b) => {
      const acctA = resolveExpenseAccount(a.category);
      const acctB = resolveExpenseAccount(b.category);
      if (acctA !== acctB) return acctA.localeCompare(acctB);
      return a.date.localeCompare(b.date);
    });

  const dataRows = variable.map(e => [
    e.date,
    resolveExpenseAccount(e.category),
    e.category,
    numFmt(e.amount),
    resolvePaymentType(e),
    e.branchId || 'HQ 본사',
    e.description || '',
  ]);

  const acctMap: Record<string, number> = {};
  variable.forEach(e => {
    const a = resolveExpenseAccount(e.category);
    acctMap[a] = (acctMap[a] || 0) + numFmt(e.amount);
  });
  dataRows.push([], ['※ 계정과목별 소계', '', '', '', '', '', '']);
  Object.entries(acctMap).sort((a, b) => a[0].localeCompare(b[0])).forEach(([acct, amt]) => {
    dataRows.push(['', acct, '', amt, '', '', '']);
  });

  const totalVar = variable.reduce((s, e) => s + numFmt(e.amount), 0);
  dataRows.push(['유동비 합계', '', '', totalVar, '', '', '']);

  const corpV = variable.filter(e => resolvePaymentType(e) === '법인카드').reduce((s, e) => s + numFmt(e.amount), 0);
  const persV = variable.filter(e => resolvePaymentType(e) === '개인비용').reduce((s, e) => s + numFmt(e.amount), 0);
  dataRows.push([], ['법인카드 소계', '', '', corpV, '법인카드', '', '']);
  dataRows.push(['개인비용 소계', '', '', persV, '개인비용', '', '']);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  ws['!cols'] = [{ wch: 14 }, { wch: 26 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 18 }, { wch: 30 }];
  applyHeaderStyle(ws, 'A1:G1', 'D97706');
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

  XLSX.utils.book_append_sheet(wb, buildPLSheet(revenueStats, accountingMonthlyStats, expenditures, startDate, endDate), '손익계산서');
  XLSX.utils.book_append_sheet(wb, buildSalesSheet(accountingDailyStats, revenueStats), '매출 거래장');
  XLSX.utils.book_append_sheet(wb, buildExpenseSheet(expenditures), '지출 거래장');
  XLSX.utils.book_append_sheet(wb, buildLedgerSheet(accountingDailyStats, expenditures), '통합 계정원장');
  XLSX.utils.book_append_sheet(wb, buildFixedCostSheet(expenditures), '고정비 명세');
  XLSX.utils.book_append_sheet(wb, buildVariableCostSheet(expenditures), '유동비 명세');

  const filename = `빌리버_회계장부_${startDate}_${endDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}
