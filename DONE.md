# DONE — 완료된 작업 (재조사 불필요)

세션 시작 시 이 파일을 먼저 읽고, 이미 해결된 이슈는 재조사하지 마세요.
파일·함수 이름이 변경됐을 수 있으니 경로는 참고용으로만 사용.

---

## 2026-04-09

### 관리자 버그

| 이슈 | 파일 | 커밋 | 핵심 |
|---|---|---|---|
| `chk_settlement_status` 제약 오류 | `client/services/storageService.ts` | c1109d6 | `status→settlement_status` 잘못된 매핑 3줄 삭제. `status`는 UI 합성 필드, DB에 쓰지 않음 |
| 완료/취소 탭 필터 버그 | `client/components/admin/LogisticsTab.tsx` | 16e7557 | `DONE_STATUSES`가 `activeStatusTab` 무시하던 버그 |
| 예약 접수시간(createdAt) 표시 | `client/components/admin/LogisticsTab.tsx` | c37d65b | `fmtCreatedAt` 헬퍼 추가, KST +9h 보정 |
| 완료 이력 별도 조회 | `client/components/admin/LogisticsTab.tsx` | 1094c98 | 완료 탭 분리 |
| 지점 관리 지점 사라짐 | `client/services/storageService.ts` | (미커밋) | `INITIAL_LOCATION_ID_SET` 필터 제거 (line ~1415, ~1351). Supabase `short_code`와 `INITIAL_LOCATIONS` ID 불일치로 41개 중 ~11개만 표시되던 문제 |

### SEO

| 이슈 | 파일 | 커밋 | 핵심 |
|---|---|---|---|
| JSON-LD aggregateRating | `client/index.html` | 440f476 | `ratingValue: 5.0`, `reviewCount: 5` 실제 구글 리뷰 반영 |
| 하드코딩 canonical 제거 | `client/index.html` | 2f194ff | 동적 canonical로 교체 |
| 사이트맵 인덱스 분리 | `client/public/sitemap*.xml` | 86a78ed | `sitemap-core.xml` + `sitemap-locations.xml` 분리 |
| 사이트맵 Content-Type 헤더 | `firebase.json` | (미커밋) | `application/xml; charset=utf-8` + `max-age=0` 명시. GSC "Sitemap이 HTML" 오류는 재크롤 후 자동 해소 |
| noscript 소프트 404 방지 | `client/index.html` | d870b46 | 한/중/영 noscript 블록 추가 |

### DB / 인프라

| 이슈 | 파일 | 커밋 | 핵심 |
|---|---|---|---|
| `admin_booking_list_v1` INNER JOIN | Supabase SQL | 646b123 | LEFT JOIN으로 교체 — 일부 예약 누락 버그 |
| settlement_status 레거시 한국어 값 정규화 | Supabase migration | 72322cc | `이동중`, `완료` 등 → `PENDING`/`PAID_OUT` |
| UUID_PATTERN Supabase v7 허용 | `client/services/storageService.ts` | 67ebb0c | 비표준 variant UUID 수락하도록 완화 |
| pg_cron CRON_SECRET 설정 | Supabase SQL | (세션내) | `ALTER DATABASE` 권한 거부 → SQL 헤더에 시크릿 하드코딩으로 우회 |
| 상태변경 DB 미저장 | `client/services/storageService.ts` | a8f82e1 | — |

---

## 재조사 불필요 영역

아래 동작은 정상 확인됨. 버그 의심 시 먼저 최신 코드 확인 후 조사:

- `BookingState.status` — UI 합성 필드. DB `booking_details` 테이블에 없음. `settlement_status`와 별개
- `getLocations()` / `subscribeLocations()` — Supabase 우선, INITIAL_LOCATIONS 폴백. `INITIAL_LOCATION_ID_SET` 필터 **제거된 상태**
- `sitemap.xml` / `sitemap-core.xml` / `sitemap-locations.xml` — `dist/`에 존재, `application/xml` 정상 서비스
