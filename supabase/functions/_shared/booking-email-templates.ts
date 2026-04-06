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
  const trackingUrl = `https://bee-liber.com/tracking?id=${encodeURIComponent(reservationCode)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(trackingUrl)}`;
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
            <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">도착 일정</td><td style="padding:10px 0;color:#111827;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:800;">${escapeHtml(`${input.dropoffDate} ${input.deliveryTime}`.trim())}</td></tr>
            <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">수하물</td><td style="padding:10px 0;color:#111827;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:800;">${bagSummary}</td></tr>
            <tr><td style="padding:16px 0 0;color:#111827;font-weight:900;">결제 금액</td><td style="padding:16px 0 0;color:#111827;text-align:right;font-size:24px;font-weight:900;">${formatCurrency(input.finalPrice)}</td></tr>
          </table>
          <div style="margin-top:24px;padding:18px 20px;background:#f8fafc;border-radius:18px;color:#475569;font-size:13px;font-weight:700;">
            예약 상세 및 진행 상태는
            <a href="https://bee-liber.com/tracking?id=${encodeURIComponent(input.reservationCode || input.bookingId)}" style="color:#111827;font-weight:900;text-decoration:none;"> tracking 페이지</a>
            에서 다시 확인하실 수 있습니다.
          </div>
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
