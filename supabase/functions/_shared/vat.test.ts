// vat.ts 단위 테스트 (Deno test runner)
// 실행: deno test supabase/functions/_shared/vat.test.ts
//
// 한국 부가가치세법 기준:
//   공급가액 = floor(VAT포함가 / 1.1)
//   부가세액 = VAT포함가 - 공급가액

import {
  assertEquals,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";

import {
  addVat,
  calcMonthlyVat,
  getSupplyPrice,
  getVatAmount,
} from "./vat.ts";

// ── getSupplyPrice ─────────────────────────────────────────────────────

Deno.test("getSupplyPrice: 11,000원 → 10,000원", () => {
  assertEquals(getSupplyPrice(11_000), 10_000);
});

Deno.test("getSupplyPrice: 0원 → 0원", () => {
  assertEquals(getSupplyPrice(0), 0);
});

Deno.test("getSupplyPrice: 소수점 버림 — 11,001원 → 10,000원", () => {
  // floor(11001 / 1.1) = floor(10000.909...) = 10000
  assertEquals(getSupplyPrice(11_001), 10_000);
});

Deno.test("getSupplyPrice: 1,100원 → 1,000원", () => {
  assertEquals(getSupplyPrice(1_100), 1_000);
});

Deno.test("getSupplyPrice: 50,000원 → 45,454원 (버림)", () => {
  // floor(50000 / 1.1) = floor(45454.545...) = 45454
  assertEquals(getSupplyPrice(50_000), 45_454);
});

// ── getVatAmount ────────────────────────────────────────────────────────

Deno.test("getVatAmount: 11,000원 → 1,000원 VAT", () => {
  assertEquals(getVatAmount(11_000), 1_000);
});

Deno.test("getVatAmount: 1,100원 → 100원 VAT", () => {
  assertEquals(getVatAmount(1_100), 100);
});

Deno.test("getVatAmount: 50,000원 → 4,546원 VAT", () => {
  // VAT = 50000 - 45454 = 4546
  assertEquals(getVatAmount(50_000), 4_546);
});

Deno.test("getVatAmount: 0원 → 0원 VAT", () => {
  assertEquals(getVatAmount(0), 0);
});

// ── addVat ──────────────────────────────────────────────────────────────

Deno.test("addVat: 10,000원 공급가 → 11,000원", () => {
  assertEquals(addVat(10_000), 11_000);
});

Deno.test("addVat: 반올림 — 100원 공급가 → 110원", () => {
  assertEquals(addVat(100), 110);
});

// ── calcMonthlyVat ───────────────────────────────────────────────────────

Deno.test("calcMonthlyVat: 기본 케이스", () => {
  const result = calcMonthlyVat({
    totalRevenue: 1_100_000,
    cancelledTotal: 0,
    refundedTotal: 0,
  });
  assertEquals(result.taxableRevenue, 1_100_000);
  assertEquals(result.supplyPrice, 1_000_000);
  assertEquals(result.vatAmount, 100_000);
});

Deno.test("calcMonthlyVat: 취소/환불 차감", () => {
  const result = calcMonthlyVat({
    totalRevenue: 1_100_000,
    cancelledTotal: 110_000,
    refundedTotal: 55_000,
  });
  // taxable = 1,100,000 - 110,000 - 55,000 = 935,000
  assertEquals(result.taxableRevenue, 935_000);
  assertEquals(result.supplyPrice, getSupplyPrice(935_000));
  assertEquals(result.vatAmount, getVatAmount(935_000));
});

Deno.test("calcMonthlyVat: 전액 취소 → taxableRevenue 0", () => {
  const result = calcMonthlyVat({
    totalRevenue: 110_000,
    cancelledTotal: 110_000,
    refundedTotal: 0,
  });
  assertEquals(result.taxableRevenue, 0);
  assertEquals(result.supplyPrice, 0);
  assertEquals(result.vatAmount, 0);
});

Deno.test("calcMonthlyVat: 환불 초과 → taxableRevenue 0으로 보정", () => {
  // 실제 운영에서는 발생하지 않지만, 정산/세금 값은 음수가 되지 않도록 보정해야 함
  const result = calcMonthlyVat({
    totalRevenue: 55_000,
    cancelledTotal: 110_000,
    refundedTotal: 0,
  });
  assertEquals(result.taxableRevenue, 0);
  assertEquals(result.supplyPrice, 0);
  assertEquals(result.vatAmount, 0);
});
