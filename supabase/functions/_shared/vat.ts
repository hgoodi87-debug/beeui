/**
 * 빌리버 부가세(VAT) 계산 유틸리티 — W-13
 *
 * 한국 부가가치세법 기준:
 *  - 일반 과세: 공급가액의 10%
 *  - 면세: 사회적 약자 서비스, 국제 운송 등 (현재 적용 없음)
 *
 * 빌리버 적용 기준:
 *  - 짐보관·배송 서비스는 부가세 과세 대상
 *  - final_price는 VAT 포함 가격 (소비자 지불액)
 *  - 공급가액 = final_price / 1.1
 *  - 부가세액 = final_price - 공급가액
 *
 * 간이과세자 기준 매출 2,400만원 미만 시 면제 여부는 운영팀 확인 필요.
 */

/** 부가세 포함 금액에서 공급가액 계산 (원 단위 버림) */
export function getSupplyPrice(vatIncludedPrice: number): number {
  return Math.floor(vatIncludedPrice / 1.1);
}

/** 부가세 포함 금액에서 VAT액 계산 */
export function getVatAmount(vatIncludedPrice: number): number {
  return vatIncludedPrice - getSupplyPrice(vatIncludedPrice);
}

/** 공급가액에서 VAT 포함 가격 계산 (원 단위 반올림) */
export function addVat(supplyPrice: number): number {
  return Math.round(supplyPrice * 1.1);
}

/** 월별 VAT 요약 계산 */
export function calcMonthlyVat(params: {
  totalRevenue: number;
  cancelledTotal: number;
  refundedTotal: number;
}): {
  taxableRevenue: number;
  supplyPrice: number;
  vatAmount: number;
} {
  const taxableRevenue = params.totalRevenue - params.cancelledTotal - params.refundedTotal;
  const supplyPrice = getSupplyPrice(taxableRevenue);
  const vatAmount = getVatAmount(taxableRevenue);
  return { taxableRevenue, supplyPrice, vatAmount };
}
