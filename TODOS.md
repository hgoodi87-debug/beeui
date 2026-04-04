# TODOS

작업 완료 후 다음 단계를 위한 기술 부채 및 개선사항 목록.

---

## storageService.ts 도메인별 분리

**What:** `client/services/storageService.ts` (~2500줄 예상, dead code 제거 후)를 도메인별 파일로 분리.

**Why:** 현재 단일 파일에 예약·위치·관리자·정산·채팅 로직이 모두 있어 유지보수 시 파일 전체를 탐색해야 함. 분리하면 PR 충돌 감소, 온보딩 속도 향상.

**Pros:** 파일별 책임 명확, 테스트 분리 용이, 코드 네비게이션 단순화.

**Cons:** 대규모 리팩토링 — import 경로 변경, barrel file 필요. 기능 변경 없이 이동만 하는 PR이라 리뷰 부담 큼.

**Context:** Supabase Realtime 전환 PR에서 dead code 제거 완료 후 진행 권장. 도메인: `bookingService.ts`, `locationService.ts`, `adminService.ts`, `chatService.ts`, `settingsService.ts`.

**Depends on:** Supabase Realtime PR 완료 후

---

## storageService.ts REST 호출 → @supabase/supabase-js 통일

**What:** 현재 수동 `fetch()` + `supabaseGet()` 패턴 30개 호출을 `@supabase/supabase-js` 쿼리 빌더로 교체.

**Why:** 이번 Realtime PR에서 `@supabase/supabase-js`를 Realtime에만 도입. REST fetch는 기존 패턴 유지 — 두 방식이 공존하는 상태.

**Pros:** 타입 안전한 쿼리 빌더 (`supabase.from('bookings').select('*')`), 필터·페이징 코드 간결화, SDK의 자동 토큰 갱신 활용 가능.

**Cons:** 30개 호출 교체 — 기능 동등성 검증 필요. `snakeToCamel` 변환 로직 제거 가능 (SDK가 처리) vs 데이터 형태 변경 위험.

**Context:** `supabaseGet()` 유틸은 이미 잘 동작하므로 급하지 않음. storageService 분리 이후 도메인별로 점진적 교체 권장.

**Depends on:** storageService.ts 도메인별 분리 완료 후
