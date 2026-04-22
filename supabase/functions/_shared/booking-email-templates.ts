export interface VoucherEmailTemplateInput {
  bookingId: string;
  reservationCode: string;
  userName: string;
  serviceType: string;
  pickupLabel: string;
  pickupDate: string;
  pickupTime: string;
  dropoffLabel: string;
  dropoffDate: string;
  deliveryTime: string;
  finalPrice: number;
  bagSummary: string;
  nametagNumber?: string;
  pickupImageUrl?: string;
  pickupGuide?: string;
  pickupAddress?: string;
  pickupMapUrl?: string;
  adminNote?: string;
  paymentMethod?: string;
  paidAt?: string;
}

export interface ArrivalEmailTemplateInput {
  bookingId: string;
  reservationCode: string;
  destinationLabel: string;
  arrivalDate: string;
  arrivalTime: string;
  pickupGuide?: string;
  pickupImageUrl?: string;
  mapUrl?: string;
}

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatCurrency = (value: number) => `₩${Number(value || 0).toLocaleString("ko-KR")}`;

const buildQrCodeUrl = (reservationCode: string) => {
  // QR은 직원 스캔용 — /staff/scan 으로 연결
  const staffUrl = `https://bee-liber.com/staff/scan?id=${encodeURIComponent(reservationCode)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(staffUrl)}`;
};

// 예약코드 기반 환율 우대 쿠폰 코드 생성 (결정론적)
const buildFxCouponCode = (reservationCode: string) => {
  const suffix = reservationCode.replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase();
  return `BEE-FX-${suffix}`;
};

// 결제수단 한글 레이블
const paymentMethodLabel = (method?: string) => {
  if (!method) return "";
  const m = method.toLowerCase();
  if (m === "card" || m.includes("credit")) return "신용/체크카드";
  if (m === "cash") return "현금결제";
  if (m === "naver") return "네이버페이";
  if (m === "kakao") return "카카오페이";
  if (m === "apple") return "Apple Pay";
  if (m === "samsung") return "Samsung Pay";
  if (m === "paypal") return "PayPal";
  if (m === "alipay") return "Alipay";
  if (m === "wechat") return "WeChat Pay";
  if (m === "toss") return "Toss Payments";
  return method;
};

// 영수증 번호 (예약코드 기반 결정론적)
const buildReceiptNumber = (reservationCode: string, bookingId: string) => {
  const src = (reservationCode || bookingId || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const tail = src.slice(-8).padStart(8, "0");
  return `R-${tail}`;
};

// 날짜 포맷 (YYYY-MM-DD HH:mm)
const formatDateTime = (iso?: string) => {
  if (!iso) return new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false });
  try {
    return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false });
  } catch {
    return iso;
  }
};

// 영수증 블록 HTML (빌리버 테마 — 블랙 헤더, 옐로우 액센트, 오프화이트 바디)
const buildReceiptBlock = (input: VoucherEmailTemplateInput) => {
  const receiptNo   = buildReceiptNumber(input.reservationCode, input.bookingId);
  const issuedAt    = formatDateTime(input.paidAt);
  const supplyPrice = Math.round(Number(input.finalPrice || 0) / 1.1);
  const vat         = Number(input.finalPrice || 0) - supplyPrice;
  const payLabel    = paymentMethodLabel(input.paymentMethod) || "-";
  const serviceName = input.serviceType === "DELIVERY" ? "짐 배송 서비스" : "짐 보관 서비스";

  return `
    <div style="margin-top:28px;background:#fffdf5;border:2px dashed #facc15;border-radius:22px;padding:0;overflow:hidden;">
      <!-- 영수증 헤더 -->
      <div style="background:#111827;color:#ffffff;padding:18px 22px;border-bottom:4px solid #facc15;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:10px;font-weight:900;color:#facc15;letter-spacing:0.2em;text-transform:uppercase;">Receipt · 영수증</div>
          <div style="margin-top:4px;font-size:18px;font-weight:900;color:#ffffff;letter-spacing:-0.02em;">
            <span style="color:#facc15;">Bee</span>liber
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:9px;font-weight:800;color:#94a3b8;letter-spacing:0.12em;text-transform:uppercase;">No.</div>
          <div style="margin-top:2px;font-size:13px;font-weight:900;color:#facc15;letter-spacing:0.08em;">${escapeHtml(receiptNo)}</div>
        </div>
      </div>

      <!-- 본문 -->
      <div style="padding:22px;">
        <div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:18px;font-size:12px;">
          <div>
            <div style="color:#92400e;font-weight:900;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px;">발행일</div>
            <div style="color:#111827;font-weight:800;">${escapeHtml(issuedAt)}</div>
          </div>
          <div style="text-align:right;">
            <div style="color:#92400e;font-weight:900;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px;">받는 분</div>
            <div style="color:#111827;font-weight:800;">${escapeHtml(input.userName || "Guest")}</div>
          </div>
        </div>

        <!-- 품목 -->
        <table style="width:100%;border-collapse:collapse;font-size:13px;background:#ffffff;border-radius:14px;overflow:hidden;">
          <thead>
            <tr style="background:#111827;color:#facc15;">
              <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;">품목</th>
              <th style="padding:10px 14px;text-align:right;font-size:10px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;">수량</th>
              <th style="padding:10px 14px;text-align:right;font-size:10px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;">금액</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:12px 14px;border-bottom:1px solid #f1f5f9;color:#111827;font-weight:800;">
                ${escapeHtml(serviceName)}
                <div style="margin-top:2px;font-size:11px;color:#64748b;font-weight:600;">${escapeHtml(input.bagSummary || "-")}</div>
              </td>
              <td style="padding:12px 14px;border-bottom:1px solid #f1f5f9;text-align:right;color:#111827;font-weight:800;">1</td>
              <td style="padding:12px 14px;border-bottom:1px solid #f1f5f9;text-align:right;color:#111827;font-weight:800;">${formatCurrency(input.finalPrice)}</td>
            </tr>
          </tbody>
        </table>

        <!-- 합계 -->
        <div style="margin-top:16px;padding:14px 18px;background:#ffffff;border-radius:14px;">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;color:#64748b;font-weight:700;">
            <span>공급가액</span><span>${formatCurrency(supplyPrice)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;color:#64748b;font-weight:700;border-bottom:1px dashed #e5e7eb;">
            <span>부가세 (10%)</span><span>${formatCurrency(vat)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 0 2px;font-size:15px;color:#111827;font-weight:900;">
            <span>합계 (Total)</span>
            <span style="color:#111827;font-size:20px;">${formatCurrency(input.finalPrice)}</span>
          </div>
        </div>

        <!-- 결제 정보 -->
        <div style="margin-top:14px;display:flex;justify-content:space-between;padding:12px 16px;background:#facc15;border-radius:12px;">
          <div>
            <div style="font-size:10px;font-weight:900;color:#92400e;letter-spacing:0.12em;text-transform:uppercase;">결제수단</div>
            <div style="margin-top:2px;font-size:13px;font-weight:900;color:#111827;">${escapeHtml(payLabel)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;font-weight:900;color:#92400e;letter-spacing:0.12em;text-transform:uppercase;">예약코드</div>
            <div style="margin-top:2px;font-size:13px;font-weight:900;color:#111827;letter-spacing:0.06em;">${escapeHtml(input.reservationCode || input.bookingId)}</div>
          </div>
        </div>

        <!-- 발행자 정보 -->
        <div style="margin-top:18px;padding-top:16px;border-top:1px dashed #fde68a;font-size:10px;color:#94a3b8;line-height:1.8;font-weight:700;">
          <div><strong style="color:#475569;">빌리버 (Beeliber)</strong> · No Bags, Just Freedom</div>
          <div>bee-liber.com · ceo@bee-liber.com · +82 010-2922-7731</div>
          <div style="margin-top:4px;color:#cbd5e1;">본 영수증은 전자 발행되었으며 세금계산서 발행이 필요한 경우 고객센터로 문의해 주세요.</div>
        </div>
      </div>
    </div>
  `;
};

export const buildVoucherEmailHtml = (input: VoucherEmailTemplateInput) => {
  const reservationCode = escapeHtml(input.reservationCode);
  const bookingId = escapeHtml(input.bookingId);
  const serviceType = escapeHtml(input.serviceType === "DELIVERY" ? "배송" : "보관");
  const pickupLabel = escapeHtml(input.pickupLabel || "주소 직접 입력");
  const dropoffLabel = escapeHtml(input.dropoffLabel || input.pickupLabel || "주소 직접 입력");
  const bagSummary = escapeHtml(input.bagSummary || "-");
  const nametagNumber = escapeHtml(input.nametagNumber || "");
  const qrCodeUrl = buildQrCodeUrl(input.reservationCode || input.bookingId);

  return `
    <div style="font-family:'Pretendard','Apple SD Gothic Neo',Arial,sans-serif;line-height:1.6;color:#111827;background:#f8fafc;padding:32px 16px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.12);">
        <div style="background:#111827;color:#ffffff;padding:32px 24px;text-align:center;border-bottom:6px solid #facc15;">
          <div style="font-size:28px;font-weight:900;letter-spacing:-0.04em;"><span style="color:#facc15;">Bee</span>liber</div>
          <p style="margin:8px 0 0;color:#cbd5e1;font-size:14px;font-weight:700;">예약이 성공적으로 확정되었습니다.</p>
        </div>
        <div style="padding:28px 24px 32px;">
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:20px;padding:20px;text-align:center;margin-bottom:24px;">
            <div style="font-size:11px;font-weight:900;color:#92400e;letter-spacing:0.12em;text-transform:uppercase;">Reservation Code</div>
            <div style="font-size:30px;font-weight:900;color:#111827;letter-spacing:0.08em;margin-top:8px;">${reservationCode}</div>
            ${nametagNumber ? `
              <div style="margin-top:14px;padding-top:14px;border-top:1px dashed #f59e0b;">
                <div style="font-size:11px;font-weight:800;color:#92400e;">Nametag Number</div>
                <div style="margin-top:8px;display:inline-block;background:#111827;color:#facc15;border-radius:999px;padding:8px 18px;font-size:20px;font-weight:900;">#${nametagNumber}</div>
              </div>
            ` : ""}
          </div>
          <div style="text-align:center;margin-bottom:24px;">
            <img src="${qrCodeUrl}" alt="Reservation QR" style="width:180px;height:180px;border-radius:20px;border:1px solid #e5e7eb;padding:10px;background:#ffffff;" />
            <p style="margin:10px 0 0;color:#64748b;font-size:12px;font-weight:700;">직원 확인 시 QR 또는 예약코드를 보여주세요.</p>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">예약번호</td><td style="padding:10px 0;color:#111827;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:800;">${reservationCode}</td></tr>
            <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">고객명</td><td style="padding:10px 0;color:#111827;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:800;">${escapeHtml(input.userName || "Guest")}</td></tr>
            <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">서비스</td><td style="padding:10px 0;color:#111827;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:800;">${serviceType}</td></tr>
            <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">픽업</td><td style="padding:10px 0;color:#111827;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:800;">${pickupLabel}</td></tr>
            <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">픽업 일정</td><td style="padding:10px 0;color:#111827;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:800;">${escapeHtml(`${input.pickupDate} ${input.pickupTime}`.trim())}</td></tr>
            <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">도착/수령</td><td style="padding:10px 0;color:#111827;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:800;">${dropoffLabel}</td></tr>
            ${(input.dropoffDate || input.deliveryTime) ? `<tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">도착 일정</td><td style="padding:10px 0;color:#111827;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:800;">${escapeHtml(`${input.dropoffDate}${input.deliveryTime ? ' ' + input.deliveryTime : ''}`.trim())}</td></tr>` : ''}
            <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">수하물</td><td style="padding:10px 0;color:#111827;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:800;">${bagSummary}</td></tr>
            <tr><td style="padding:16px 0 0;color:#111827;font-weight:900;">결제 금액</td><td style="padding:16px 0 0;color:#111827;text-align:right;font-size:24px;font-weight:900;">${formatCurrency(input.finalPrice)}</td></tr>
          </table>
          ${(input.pickupImageUrl || input.pickupGuide || input.pickupAddress) ? `
          <div style="margin-top:24px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
            <div style="padding:14px 18px;background:#111827;display:flex;align-items:center;justify-content:space-between;">
              <div style="font-size:11px;font-weight:900;color:#facc15;letter-spacing:0.14em;text-transform:uppercase;">📍 픽업 지점 안내</div>
              ${input.pickupMapUrl ? `<a href="${escapeHtml(input.pickupMapUrl)}" style="font-size:11px;font-weight:900;color:#facc15;text-decoration:none;background:rgba(250,204,21,0.15);padding:5px 12px;border-radius:8px;border:1px solid rgba(250,204,21,0.3);">🗺 길찾기</a>` : ""}
            </div>
            ${input.pickupImageUrl ? `<img src="${escapeHtml(input.pickupImageUrl)}" alt="픽업 지점 사진" style="display:block;width:100%;max-height:240px;object-fit:cover;" />` : ""}
            <div style="padding:16px 18px;">
              ${input.pickupLabel ? `<div style="margin-bottom:10px;font-size:14px;font-weight:900;color:#111827;">🏢 ${escapeHtml(input.pickupLabel)}</div>` : ""}
              ${input.pickupAddress ? `<div style="margin-bottom:10px;display:flex;align-items:flex-start;gap:6px;"><span style="font-size:13px;color:#64748b;flex-shrink:0;">📌</span><span style="font-size:13px;color:#374151;font-weight:700;line-height:1.5;">${escapeHtml(input.pickupAddress)}</span></div>` : ""}
              ${input.pickupGuide ? `<div style="padding:12px 14px;background:#fef3c7;border-radius:12px;border-left:4px solid #f59e0b;"><p style="margin:0;color:#92400e;font-size:13px;font-weight:800;white-space:pre-line;line-height:1.7;">🚩 ${escapeHtml(input.pickupGuide)}</p></div>` : ""}
            </div>
          </div>
          ` : ""}
          ${input.adminNote ? `
          <div style="margin-top:20px;padding:16px 20px;background:#fffbeb;border:1px solid #fde68a;border-radius:18px;">
            <div style="font-size:10px;font-weight:900;color:#92400e;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">📋 운영 메모</div>
            <p style="margin:0;color:#78350f;font-size:13px;font-weight:700;white-space:pre-line;">${escapeHtml(input.adminNote)}</p>
          </div>
          ` : ""}
          <div style="margin-top:24px;padding:18px 20px;background:#f8fafc;border-radius:18px;color:#475569;font-size:13px;font-weight:700;">
            예약 상세 및 진행 상태는
            <a href="https://bee-liber.com/tracking?id=${encodeURIComponent(input.reservationCode || input.bookingId)}" style="color:#111827;font-weight:900;text-decoration:none;"> tracking 페이지</a>
            에서 다시 확인하실 수 있습니다.
          </div>

          <!-- 파트너 지점 환율 우대 쿠폰 -->
          <div style="margin-top:20px;background:linear-gradient(135deg,#111827 0%,#1e293b 100%);border-radius:20px;padding:22px 20px;position:relative;overflow:hidden;">
            <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;background:#facc15;border-radius:50%;opacity:0.08;"></div>
            <div style="position:absolute;bottom:-30px;left:-10px;width:100px;height:100px;background:#facc15;border-radius:50%;opacity:0.05;"></div>
            <div style="font-size:10px;font-weight:900;color:#facc15;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;">🎁 파트너 지점 환율 우대 혜택</div>
            <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:14px;line-height:1.6;">
              빌리버 이용 고객 전용 환율 우대 쿠폰입니다.<br>
              <span style="color:#94a3b8;font-size:12px;">제휴 환전소에서 아래 코드를 제시해 주세요.</span>
            </div>
            <div style="background:#facc15;border-radius:14px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div style="font-size:10px;font-weight:900;color:#92400e;letter-spacing:0.1em;margin-bottom:4px;">COUPON CODE</div>
                <div style="font-size:22px;font-weight:900;color:#111827;letter-spacing:0.12em;">${buildFxCouponCode(input.reservationCode || input.bookingId)}</div>
              </div>
              <div style="font-size:28px;">💱</div>
            </div>
            <div style="margin-top:10px;font-size:10px;color:#64748b;font-weight:700;">* 1회 사용 가능 · 예약코드와 함께 제시</div>
          </div>

          ${buildReceiptBlock(input)}

          <div style="margin-top:28px;text-align:center;color:#94a3b8;font-size:11px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;">
            No Bags, Just Freedom
          </div>
          <div style="margin-top:10px;text-align:center;color:#cbd5e1;font-size:11px;">Booking ID: ${bookingId}</div>
        </div>
      </div>
    </div>
  `;
};

export const buildArrivalEmailHtml = (input: ArrivalEmailTemplateInput) => {
  const reservationCode = escapeHtml(input.reservationCode);
  const bookingId = escapeHtml(input.bookingId);
  const destinationLabel = escapeHtml(input.destinationLabel || "목적지");
  const pickupGuide = escapeHtml(input.pickupGuide || "");
  const pickupImageUrl = escapeHtml(input.pickupImageUrl || "");
  const mapUrl = escapeHtml(input.mapUrl || "https://bee-liber.com/locations");

  return `
    <div style="font-family:'Pretendard','Apple SD Gothic Neo',Arial,sans-serif;line-height:1.6;color:#111827;background:#f8fafc;padding:32px 16px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.12);">
        <div style="background:#111827;color:#ffffff;padding:32px 24px;text-align:center;border-bottom:6px solid #facc15;">
          <div style="font-size:28px;font-weight:900;letter-spacing:-0.04em;"><span style="color:#facc15;">Bee</span>liber</div>
          <p style="margin:8px 0 0;color:#cbd5e1;font-size:14px;font-weight:700;">짐이 목적지에 도착했습니다.</p>
        </div>
        <div style="padding:28px 24px 32px;text-align:center;">
          <div style="width:88px;height:88px;border-radius:28px;background:#facc15;color:#111827;display:inline-flex;align-items:center;justify-content:center;font-size:40px;font-weight:900;">🚚</div>
          <h2 style="margin:20px 0 8px;font-size:28px;font-weight:900;color:#111827;">수령 준비가 완료되었습니다</h2>
          <p style="margin:0 auto 24px;max-width:420px;color:#64748b;font-size:14px;font-weight:700;">예약하신 수하물이 목적지에 안전하게 도착했습니다. 아래 위치와 안내를 확인해 주세요.</p>
          <div style="text-align:left;background:#f8fafc;border:1px solid #e5e7eb;border-radius:20px;padding:20px;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #e5e7eb;">예약번호</td><td style="padding:10px 0;color:#111827;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:800;">${reservationCode}</td></tr>
              <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #e5e7eb;">도착 위치</td><td style="padding:10px 0;color:#111827;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:800;">${destinationLabel}</td></tr>
              <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #e5e7eb;">도착 시각</td><td style="padding:10px 0;color:#111827;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:800;">${escapeHtml(`${input.arrivalDate} ${input.arrivalTime}`.trim())}</td></tr>
              <tr><td style="padding:10px 0 0;color:#64748b;">Booking ID</td><td style="padding:10px 0 0;color:#111827;text-align:right;font-weight:800;">${bookingId}</td></tr>
            </table>
          </div>
          <a href="${mapUrl}" style="display:inline-block;margin-top:24px;padding:15px 24px;border-radius:16px;background:#facc15;color:#111827;font-size:14px;font-weight:900;text-decoration:none;">도착 위치 열기</a>
          ${pickupGuide || pickupImageUrl ? `
            <div style="margin-top:28px;text-align:left;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;padding:20px;">
              <div style="font-size:12px;font-weight:900;color:#111827;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:12px;">Pickup Guide</div>
              ${pickupGuide ? `<p style="margin:0;color:#475569;font-size:14px;font-weight:700;white-space:pre-line;">${pickupGuide}</p>` : ""}
              ${pickupImageUrl ? `<img src="${pickupImageUrl}" alt="Pickup Guide" style="display:block;width:100%;margin-top:16px;border-radius:16px;border:1px solid #e5e7eb;" />` : ""}
            </div>
          ` : ""}
          <div style="margin-top:28px;text-align:center;color:#94a3b8;font-size:11px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;">
            No Bags, Just Freedom
          </div>
        </div>
      </div>
    </div>
  `;
};
