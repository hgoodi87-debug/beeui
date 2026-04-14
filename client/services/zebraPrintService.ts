/**
 * Zebra Browser Print 서비스 연동 (GX420d, 203 DPI, 4"×6" label)
 * 사전 조건: Zebra Browser Print 앱이 http://localhost:9100 에서 실행 중이어야 함
 */

const BROWSER_PRINT_URL = 'http://localhost:9100';

export interface ZebraPrinter {
  name: string;
  uid: string;
  provider: string;
  manufacturer: string;
  connection: string;
}

export const isZebraBrowserPrintAvailable = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${BROWSER_PRINT_URL}/available`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
};

export const getZebraPrinters = async (): Promise<ZebraPrinter[]> => {
  const res = await fetch(`${BROWSER_PRINT_URL}/available`, { method: 'GET' });
  if (!res.ok) throw new Error('Zebra Browser Print 서비스에 연결할 수 없습니다.');
  const data = await res.json();
  return (data.printer || []) as ZebraPrinter[];
};

export const sendZPL = async (zpl: string, printer?: ZebraPrinter): Promise<void> => {
  let target = printer;
  if (!target) {
    const printers = await getZebraPrinters();
    if (printers.length === 0) {
      throw new Error('연결된 Zebra 프린터가 없습니다. USB 연결과 Browser Print 서비스를 확인해주세요.');
    }
    target = printers[0];
  }
  const res = await fetch(`${BROWSER_PRINT_URL}/write`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device: target, data: zpl }),
  });
  if (!res.ok) throw new Error(`프린터 전송 실패 [${res.status}]`);
};

export interface BookingLabelParams {
  serviceType: string;
  customerName: string;
  pickupDate: string;
  pickupTime: string;
  originName: string;
  destName: string;
  codeLabel: string;
  displayCode: string;
  // 추가 정보
  bags?: number;
  bagSummary?: string;
  dropoffDate?: string;
  nametagId?: string | number;
  status?: string;
  userEmail?: string;
}

/**
 * ZPL 라벨 — GX420d 203DPI, 4"×6" (812×1218 dots)
 *
 * Zone 1   0 ~ 135  : 헤더 (beeliber + 서비스 타입)
 * Zone 2 148 ~ 436  : 정보 그리드 (고객명·일정 / 루트)
 * Zone 3 450 ~ 638  : 예약 코드 (대형)
 * Zone 4 652 ~ 960  : 추가 정보 4칸 그리드 (짐·반납일·네임태그·상태)
 * Zone 5 974 ~ 976  : 구분선
 * Zone 6 988 ~ 1025 : 푸터
 *        1025~1218  : 절취 여백
 */
export const buildBookingLabelZPL = (params: BookingLabelParams): string => {
  const {
    serviceType, customerName, pickupDate, pickupTime,
    originName, destName, codeLabel, displayCode,
    bags, bagSummary, dropoffDate, nametagId, status, userEmail,
  } = params;

  // ZPL 특수문자 이스케이프
  const esc = (s: string | number | undefined) =>
    String(s || '-').replace(/\^/g, '').replace(/~/g, '').trim() || '-';

  const printDate = new Date().toLocaleDateString('en-CA');

  // 추가 정보 4칸
  const info1Label = 'BAGS';
  const info1Value = bags ? `${bags}` : '-';
  const info2Label = serviceType === 'DELIVERY' ? 'DROPOFF' : 'RETURN';
  const info2Value = esc(dropoffDate);
  const info3Label = 'NAMETAG';
  const info3Value = esc(nametagId);
  const info4Label = 'STATUS';
  const info4Value = esc(status);

  return `^XA
^CI28
^PW812
^LL1218
^LH0,0
^MMT
^MNY
~TA000
~JSN
^LT0
^PON
^PMN
^PR4,4

^FX === Zone 1: Header ===
^FO0,0^GB812,135,135,B^FS
^FO22,22^A0N,92,92^FR^FDbeeliber^FS
^FO524,36^A0N,62,62^FR^FD${esc(serviceType)}^FS

^FX === Zone 2: Info grid ===
^FO0,148^GB812,4,4,B^FS

^FO22,162^A0N,26,26^FDCUSTOMER^FS
^FO22,196^A0N,66,66^FD${esc(customerName)}^FS

^FO22,278^A0N,26,26^FDSCHEDULE^FS
^FO22,312^A0N,52,52^FD${esc(pickupDate)}^FS
^FO22,372^A0N,56,56^FD${esc(pickupTime)}^FS

^FO438,155^GB360,268,4^FS
^FO455,168^A0N,26,26^FDROUTE^FS
^FO455,202^A0N,50,50^FD${esc(originName)}^FS
^FO455,260^A0N,36,36^FD>>^FS
^FO455,300^A0N,50,50^FD${esc(destName)}^FS

^FX === Zone 3: Reservation Code ===
^FO0,442^GB812,6,6,B^FS
^FO22,458^A0N,28,28^FD${esc(codeLabel)}^FS
^FO22,496^A0N,128,88^FD${esc(displayCode)}^FS

^FX === Zone 4: 추가 정보 4칸 그리드 ===
^FO0,654^GB812,6,6,B^FS

^FX 1칸: BAGS (좌상)
^FO22,668^A0N,24,24^FD${info1Label}^FS
^FO22,700^A0N,56,56^FD${info1Value}^FS

^FX 2칸: DROPOFF/RETURN (우상)
^FO430,668^A0N,24,24^FD${info2Label}^FS
^FO430,700^A0N,50,50^FD${info2Value}^FS

^FX 세로 구분선
^FO406,660^GB4,300,4^FS

^FX 가로 구분선
^FO22,810^GB768,3,3^FS

^FX 3칸: NAMETAG (좌하)
^FO22,822^A0N,24,24^FD${info3Label}^FS
^FO22,854^A0N,56,56^FD${info3Value}^FS

^FX 4칸: STATUS (우하)
^FO430,822^A0N,24,24^FD${info4Label}^FS
^FO430,854^A0N,50,50^FD${info4Value}^FS

^FX === Zone 5: Footer ===
^FO0,974^GB812,4,4,B^FS
^FO22,988^A0N,28,28^FDBEELIBER GLOBAL LOGISTICS^FS
^FO580,988^A0N,28,28^FD${printDate}^FS

^XZ`;
};
