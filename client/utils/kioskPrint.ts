/**
 * kioskPrint — Zebra GX420d ZPL 직접 전송 (4"×6", 203 DPI)
 * Zebra Browser Print 서비스가 localhost:9100 에서 실행 중이어야 함
 */

import { sendZPL } from '../services/zebraPrintService';

export interface KioskReceiptData {
  tag: number;
  rowLabel: string;
  branchName: string;
  branchSlug?: string;  // ASCII 영문 (ZPL ^CI28 미사용 시 한글 대체)
  smallQty: number;
  carrierQty: number;
  duration: number;
  startTime: string;
  pickupTime: string;
  originalPrice: number;
  discount: number;
  payment: string;
  date: string;
}

/** ZPL 특수문자 이스케이프 (한글은 ASCII 대체 필요 — ^CI28 미사용) */
const esc = (s: string | number | undefined) =>
  String(s ?? '-').replace(/\^/g, '').replace(/~/g, '').trim() || '-';

/**
 * 키오스크 접수 라벨 ZPL 생성
 *
 * 레이아웃 (812×1218 dots, 4"×6", 203 DPI):
 *   Zone 1   0~370  : TAG 번호 (대형) | ZONE 구역
 *   Zone 2 370~490  : 지점명·날짜
 *   Zone 3 490~690  : 가방 수량·시간·픽업 예정
 *   Zone 4 690~940  : 금액·결제 수단
 *   Zone 5 940~     : 푸터
 *
 * 주의: ^CI28(UTF-8) 미사용 — GX420d 일부 펌웨어 미지원으로 공백 출력됨.
 *       branchName 등 한글 필드는 라틴 문자로 교체 필요.
 */
function buildKioskLabelZPL(data: KioskReceiptData): string {
  const finalPrice = Math.max(0, data.originalPrice - data.discount);
  const printTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  const bagLine = [
    data.smallQty > 0 ? `SMALL ${data.smallQty}` : '',
    data.carrierQty > 0 ? `CARRIER ${data.carrierQty}` : '',
  ].filter(Boolean).join('  /  ') || '-';

  const paymentLabel =
    data.payment === '미수금' ? 'DEFERRED' :
    data.payment === '완료'   ? 'PAID'     :
    data.payment === '현금'   ? 'CASH'     :
    data.payment === '카드'   ? 'CARD'     :
    esc(data.payment);

  return `^XA
^PW812
^LL1218
^LH0,0
^MMT

^FX === Zone 1: TAG (left) | ZONE (right) ===
^FO510,0^GB4,370,4^FS

^FO22,14^A0N,32,32^FDTAG^FS
^FO22,52^A0N,250,110^FD#${esc(data.tag)}^FS

^FO524,14^A0N,32,32^FDZONE^FS
^FO524,52^A0N,260,260^FD${esc(data.rowLabel)}^FS

^FX === Zone 2: Branch + Date ===
^FO0,370^GB812,4,4^FS

^FO22,382^A0N,22,22^FDBRANCH^FS
^FO22,412^A0N,48,48^FD${esc(data.branchSlug ?? data.branchName)}^FS

^FO430,382^A0N,22,22^FDDATE^FS
^FO430,412^A0N,48,48^FD${esc(data.date)}^FS

^FX === Zone 3: Bags + Times ===
^FO0,490^GB812,4,4^FS

^FO22,502^A0N,22,22^FDBAGS^FS
^FO22,532^A0N,48,48^FD${bagLine}^FS

^FO430,502^A0N,22,22^FDCHECK-IN^FS
^FO430,532^A0N,48,48^FD${esc(data.startTime)}^FS

^FO22,592^A0N,22,22^FDDURATION^FS
^FO22,622^A0N,48,48^FD${esc(data.duration)} HRS^FS

^FO430,592^A0N,22,22^FDPICKUP BY^FS
^FO430,622^A0N,48,48^FD${esc(data.pickupTime)}^FS

^FX === Zone 4: Price + Payment ===
^FO0,690^GB812,5,5^FS

^FO22,704^A0N,24,24^FDTOTAL^FS
^FO22,736^A0N,110,110^FD${finalPrice.toLocaleString()}^FS
^FO22,856^A0N,38,38^FDKRW^FS

^FO430,704^A0N,24,24^FDPAYMENT^FS
^FO430,736^A0N,76,76^FD${paymentLabel}^FS

^FX === Zone 5: Footer ===
^FO0,940^GB812,4,4^FS
^FO22,954^A0N,24,24^FDBEELIBER GLOBAL LOGISTICS^FS
^FO640,954^A0N,24,24^FD${printTime}^FS

^XZ`;
}

export async function printKioskReceipt(data: KioskReceiptData): Promise<void> {
  try {
    const zpl = buildKioskLabelZPL(data);
    console.debug('[KioskPrint] ZPL 전송:', zpl);
    await sendZPL(zpl);
  } catch (err: any) {
    console.error('[KioskPrint] 실패:', err);
    alert(`라벨 프린터 오류: ${err?.message || err}\n\nZebra Browser Print 앱이 실행 중인지 확인해주세요.`);
  }
}
