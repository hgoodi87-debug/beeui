# Branch / Location Contract
> 업데이트: 2026-03-28
> 목적: 관리자 화면에서 `branches`와 `locations`를 섞어 쓰지 않기 위한 기준

---

## 1. 한 줄 기준

- `branches` = 조직, 권한, 정산 단위
- `locations` = 고객이 실제로 선택하는 운영 장소

---

## 2. 테이블 책임

### `branches`

책임:

- 직원 권한 범위
- 정산 단위
- `reservations.branch_id`
- `daily_closings.branch_id`
- `expenditures.branch_id`
- `employee_branch_assignments.branch_id`

즉, 돈과 권한은 `branches` 기준으로 본다.

### `locations`

책임:

- 픽업 장소
- 드롭오프 장소
- 공항/호텔/파트너 지점 표시
- 고객 화면의 선택지
- `booking_details.pickup_location_id`
- `booking_details.dropoff_location_id`

즉, 운영 동선과 고객 선택은 `locations` 기준으로 본다.

---

## 3. 둘을 연결하는 허용 경로

우선순위는 아래 순서다.

1. `locations.branch_id -> branches.id`
2. `locations.branch_code <-> branches.branch_code`
3. 레거시 데이터 호환용으로만 `location.id`, `location.short_code`, `location.branch_code` 토큰 비교

직접 비교 금지:

- `booking.pickupLocation === booking.branchId`
- `closing.branchId === booking.pickupLocation`
- `expenditure.branchId === location.id` 를 고정 규칙처럼 간주하는 코드

이 비교는 레거시 데이터가 섞인 경우 우연히 맞을 수 있지만, 구조 계약으로는 틀리다.

---

## 4. 관리자 화면 적용 규칙

### 예약 / 운영 화면

- 필터 기본값은 `locations.id`
- 예약 목록은 `pickupLocation`, `dropoffLocation`로 필터
- 필요할 때만 `branchId`, `branchCode`를 보조 조건으로 사용

### 정산 / 회계 화면

- 필터의 실제 스코프는 selected location이 연결된 branch 토큰으로 확장
- 허용 토큰:
  - `location.id`
  - `location.branchId`
  - `location.branchCode`
  - `location.shortCode`

즉, UI는 location을 선택하더라도 회계 계산은 branch 스코프까지 같이 해석해야 한다.

---

## 5. 예약 view 설계 원칙

`admin_booking_list_v1`는 아래를 같이 노출해야 한다.

- 운영용 location 필드
  - `pickup_location`
  - `dropoff_location`
  - `pickup_location_name`
  - `dropoff_location_name`

- 정산/권한용 branch 필드
  - `branch_id`
  - `branch_code`
  - `branch_name`

이렇게 해야 관리자 화면이 “운영 location”과 “정산 branch”를 같은 레코드에서 분리해서 읽을 수 있다.

---

## 6. 코드 규약

- `branchId`는 branch scope 의미로만 사용
- `pickupLocation`, `dropoffLocation`은 location scope 의미로만 사용
- location 선택값으로 financial record를 걸러야 할 때는 공통 토큰 셋으로 해석
- 새 코드에서 `branch`와 `location`을 같은 select box 의미로 재사용하지 않는다
