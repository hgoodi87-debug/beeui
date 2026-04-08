/**
 * 일자별 + 결제수단별 예약 현황 Word 문서 내보내기
 * HTML-as-Word 방식 (추가 라이브러리 불필요)
 */
import { BookingStatus, type BookingState } from '../types';

const PAYMENT_LABELS: Record<string, string> = {
  card:    '카드',
  cash:    '현금',
  naver:   '네이버페이',
  kakao:   '카카오페이',
  paypal:  '페이팔',
  apple:   '애플페이',
  samsung: '삼성페이',
  alipay:  '알리페이',
  wechat:  '위챗페이',
};

const PAYMENT_ORDER = ['card', 'cash', 'naver', 'kakao', 'paypal', 'apple', 'samsung', 'alipay', 'wechat'];

function fmt(n: number) {
  return '₩' + n.toLocaleString('ko-KR');
}

interface DayMethodRow {
  method: string;
  label: string;
  count: number;
  amount: number;
}

interface DaySummary {
  date: string;
  rows: DayMethodRow[];
  dayTotal: number;
  dayCount: number;
}

function buildDaySummaries(bookings: BookingState[], startDate: string, endDate: string): DaySummary[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const activeBookings = bookings.filter(b => {
    if (b.isDeleted) return false;
    if (b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REFUNDED) return false;
    const d = new Date(b.pickupDate || '');
    return d >= start && d <= end;
  });

  // date → method → {count, amount}
  const map: Record<string, Record<string, { count: number; amount: number }>> = {};

  activeBookings.forEach(b => {
    const date = b.pickupDate || '날짜불명';
    const method = b.paymentMethod || 'cash';
    if (!map[date]) map[date] = {};
    if (!map[date][method]) map[date][method] = { count: 0, amount: 0 };
    map[date][method].count++;
    map[date][method].amount += (b.settlementHardCopyAmount ?? b.finalPrice ?? 0);
  });

  return Object.keys(map)
    .sort()
    .map(date => {
      const methodMap = map[date];
      const rows: DayMethodRow[] = PAYMENT_ORDER
        .filter(m => methodMap[m])
        .map(m => ({
          method: m,
          label: PAYMENT_LABELS[m] || m,
          count: methodMap[m].count,
          amount: methodMap[m].amount,
        }));

      // 알 수 없는 결제수단 추가
      Object.keys(methodMap).forEach(m => {
        if (!PAYMENT_ORDER.includes(m)) {
          rows.push({ method: m, label: m, count: methodMap[m].count, amount: methodMap[m].amount });
        }
      });

      const dayTotal = rows.reduce((s, r) => s + r.amount, 0);
      const dayCount = rows.reduce((s, r) => s + r.count, 0);

      return { date, rows, dayTotal, dayCount };
    });
}

function buildHTML(summaries: DaySummary[], startDate: string, endDate: string): string {
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const grandTotal = summaries.reduce((s, d) => s + d.dayTotal, 0);
  const grandCount = summaries.reduce((s, d) => s + d.dayCount, 0);

  // 결제수단별 전체 합계
  const methodTotals: Record<string, { count: number; amount: number }> = {};
  summaries.forEach(d => {
    d.rows.forEach(r => {
      if (!methodTotals[r.label]) methodTotals[r.label] = { count: 0, amount: 0 };
      methodTotals[r.label].count += r.count;
      methodTotals[r.label].amount += r.amount;
    });
  });

  const methodSummaryRows = Object.entries(methodTotals)
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([label, v]) => `
      <tr>
        <td style="padding:6px 12px;border:1px solid #ddd;">${label}</td>
        <td style="padding:6px 12px;border:1px solid #ddd;text-align:center;">${v.count}건</td>
        <td style="padding:6px 12px;border:1px solid #ddd;text-align:right;font-weight:bold;">₩${v.amount.toLocaleString('ko-KR')}</td>
        <td style="padding:6px 12px;border:1px solid #ddd;text-align:right;color:#888;">
          ${grandTotal > 0 ? ((v.amount / grandTotal) * 100).toFixed(1) : 0}%
        </td>
      </tr>`)
    .join('');

  const dailyTableRows = summaries.map(d => {
    const methodRows = d.rows.map((r, i) => `
      <tr>
        ${i === 0 ? `<td style="padding:6px 12px;border:1px solid #ddd;vertical-align:top;font-weight:bold;white-space:nowrap;" rowspan="${d.rows.length}">${d.date}</td>` : ''}
        <td style="padding:6px 12px;border:1px solid #ddd;">${r.label}</td>
        <td style="padding:6px 12px;border:1px solid #ddd;text-align:center;">${r.count}건</td>
        <td style="padding:6px 12px;border:1px solid #ddd;text-align:right;">₩${r.amount.toLocaleString('ko-KR')}</td>
      </tr>`).join('');

    const totalRow = `
      <tr style="background:#fffbe6;">
        <td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;text-align:right;font-size:11px;color:#888;" colspan="2">일 합계</td>
        <td style="padding:6px 12px;border:1px solid #ddd;text-align:center;font-weight:bold;">${d.dayCount}건</td>
        <td style="padding:6px 12px;border:1px solid #ddd;text-align:right;font-weight:bold;">${fmt(d.dayTotal)}</td>
      </tr>`;

    return methodRows + totalRow;
  }).join('');

  return `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>빌리버 일자별 결제수단 현황</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: '맑은 고딕', 'Malgun Gothic', sans-serif; font-size: 10pt; color: #111; }
    h1 { font-size: 16pt; font-weight: bold; margin-bottom: 4px; }
    h2 { font-size: 12pt; font-weight: bold; margin: 24px 0 8px; border-bottom: 2px solid #ffcb05; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 16px; }
    th { background: #111; color: #ffcb05; padding: 8px 12px; border: 1px solid #333; font-weight: bold; text-align: center; }
    .meta { font-size: 9pt; color: #666; margin-bottom: 24px; }
    .grand { background: #111; color: #ffcb05; font-weight: bold; }
    .grand td { padding: 8px 12px; border: 1px solid #333; }
    .section-break { page-break-before: always; }
  </style>
</head>
<body>

  <h1>🐝 빌리버 (Beeliber) — 일자별 결제수단 현황</h1>
  <p class="meta">
    조회 기간: <strong>${startDate} ~ ${endDate}</strong> &nbsp;|&nbsp;
    출력일: ${today} &nbsp;|&nbsp;
    총 ${grandCount}건 / ${fmt(grandTotal)}
  </p>

  <!-- 1. 결제수단별 전체 요약 -->
  <h2>결제수단별 전체 요약</h2>
  <table>
    <thead>
      <tr>
        <th>결제수단</th>
        <th>건수</th>
        <th>금액</th>
        <th>비중</th>
      </tr>
    </thead>
    <tbody>
      ${methodSummaryRows}
    </tbody>
    <tfoot>
      <tr class="grand">
        <td><strong>합 계</strong></td>
        <td style="text-align:center;"><strong>${grandCount}건</strong></td>
        <td style="text-align:right;"><strong>${fmt(grandTotal)}</strong></td>
        <td style="text-align:right;"><strong>100%</strong></td>
      </tr>
    </tfoot>
  </table>

  <!-- 2. 일자별 결제수단 상세 -->
  <h2>일자별 결제수단 상세</h2>
  <table>
    <thead>
      <tr>
        <th style="width:100px;">날짜</th>
        <th>결제수단</th>
        <th style="width:60px;">건수</th>
        <th style="width:120px;">금액</th>
      </tr>
    </thead>
    <tbody>
      ${dailyTableRows || '<tr><td colspan="4" style="text-align:center;color:#999;padding:20px;">해당 기간 예약 데이터 없음</td></tr>'}
    </tbody>
    <tfoot>
      <tr class="grand">
        <td colspan="2"><strong>총 합계</strong></td>
        <td style="text-align:center;"><strong>${grandCount}건</strong></td>
        <td style="text-align:right;"><strong>${fmt(grandTotal)}</strong></td>
      </tr>
    </tfoot>
  </table>

</body>
</html>`;
}

export function exportPaymentMethodWordDoc(opts: {
  bookings: BookingState[];
  startDate: string;
  endDate: string;
}) {
  const { bookings, startDate, endDate } = opts;
  const summaries = buildDaySummaries(bookings, startDate, endDate);
  const html = buildHTML(summaries, startDate, endDate);

  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `빌리버_결제수단별_${startDate}_${endDate}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
