# Search Console 제출 런북

## 목적

- prerender 적용 후 Google Search Console에 어떤 순서로 제출해야 하는지 헷갈리지 않게 정리한다.

## 1. 먼저 볼 것

- 배포가 끝났는지
- `https://bee-liber.com/sitemap.xml`이 열리는지
- `https://bee-liber.com/robots.txt`가 열리는지
- `/locations`, `/services`, `/storage/hongdae`, `/delivery/hongdae` raw HTML 메타가 다른지

## 2. sitemap 제출 순서

Search Console에서:

1. 속성 `https://bee-liber.com` 선택
2. 왼쪽 `Sitemaps`
3. `sitemap.xml` 제출
4. 상태가 `성공`인지 확인

## 3. URL 검사 우선순위

아래 순서대로 요청:

1. `/`
2. `/locations`
3. `/services`
4. `/qna`
5. `/storage/hongdae`
6. `/delivery/hongdae`

이 순서가 좋은 이유:

- 홈과 핵심 허브 페이지가 먼저 대표 URL로 인식된다
- 그다음 storage/delivery 랜딩 차이를 검색엔진이 빨리 학습한다

## 4. URL 검사에서 볼 포인트

- 사용자 선언 canonical이 현재 URL인지
- 색인 생성 가능 상태인지
- 라이브 테스트에서 title/description이 경로별로 다른지
- `delivery/hongdae`가 `storage/hongdae`로 canonical 처리되지 않는지

## 5. 제출 후 3일 체크

- `성과`에서 CTR 변동
- `색인 > 페이지`에서 제외 증가 여부
- `sitemap.xml` 처리 상태
- `/locations`, `/services` 노출 키워드 변화

## 6. 제출 후 2주 체크

- `/storage/*`, `/delivery/*` 랜딩 노출 시작 여부
- 동일 쿼리에서 storage/delivery가 서로 다른 제목으로 잡히는지
- 홈 메타가 서브페이지에 잘못 퍼지는 현상이 줄었는지

## 7. 이상 징후

아래 중 하나면 다시 점검:

- Search Console이 `/locations`를 홈 canonical로 읽는다
- `/delivery/*`가 `/storage/*` canonical로 읽힌다
- `robots.txt`가 sitemap을 못 찾는다
- sitemap 제출이 실패한다
