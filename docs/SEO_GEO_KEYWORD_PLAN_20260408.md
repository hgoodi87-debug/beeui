# Beeliber SEO / GEO Keyword Plan

> 기준일: 2026-04-08
> 목적: Google 검색 결과와 경쟁 서비스 노출 구조를 기준으로 Beeliber의 다국어 SEO/GEO 키워드와 랜딩 페이지를 매칭한다.
> 우선 시장: zh-TW 대만, zh-HK 홍콩, ja 일본, en 영어권, ko 한국
> 로컬 참조: `docs/SEO_GEO_STRATEGY_2026.md`, `docs/GOOGLE_ADS_STRATEGY_REPORT_20260407.md`, `client/src/constants/seoLocations.ts`, `client/src/constants/seoRouteMeta.ts`, `client/public/sitemap.xml`

---

## 1. 검색 조사 요약

### 1-1. Google 검색에서 확인한 외부 신호

| 소스 | 확인한 포인트 | Beeliber에 주는 의미 |
|---|---|---|
| Google Search Central SEO Starter Guide | 사용자별 검색어 차이를 예상하고, 유용하고 최신인 콘텐츠를 만들 것을 권장 | 한 페이지에 "行李寄放/寄存/luggage storage/荷物預かり" 변형을 무리하게 밀어넣기보다 언어별 URL과 의도별 섹션을 분리 |
| Google Search Central Structured Data | JSON-LD를 유지보수하기 쉬운 구조화 데이터 형식으로 권장 | FAQPage, Service, LocalBusiness, BreadcrumbList를 각 랜딩에 붙이는 방식이 GEO 대응에 적합 |
| Klook T-PASS | 공항-서울 배송, T-Luggage/T-Locker, 269개 지하철 보관소를 함께 노출 | Beeliber는 "락커 대안", "직접 맡기는 지점", "라스트데이 공항 수령" 키워드로 맞대응 필요 |
| T-Luggage 공식 사이트 | 홍대, 명동, 서울역, 김포 등 현장 접수와 인천공항 T1/T2 수령 시간 안내 | 공항 배송 키워드는 "도심 지점 -> 인천공항 수령" 플로우를 명확하게 써야 함 |
| Bounce 명동 페이지 | 명동 주변 대량 지점, 앱 예약, 리뷰/평점 신호 강조 | 명동·홍대·강남 "near me" 지역 키워드는 이미 경쟁이 있으므로 4시간 단위, 중화권 언어, 공항 배송 결합으로 차별화 |
| LetSeoul 2026 가이드 | 홍대/명동/강남 락커 포화, 체크아웃 후 공항 배송, 큰 캐리어 니즈를 상황별로 설명 | GEO형 FAQ는 "체크아웃 후", "락커가 찼을 때", "큰 캐리어", "마지막 날" 질문을 직접 답해야 함 |

참고 URL:
- Google SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google Structured Data: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Klook T-PASS: https://www.klook.com/en-US/activity/145755-icn-gmp-seoul-luggage-delivery-storage-service-t-pass/
- T-Luggage: https://www.tluggage.co.kr/eng_new/luggage_page
- Bounce Myeongdong: https://bounce.com/luggage-storage/seoul/myeongdong-station
- LetSeoul Seoul luggage guide: https://www.letseoul.com/en/articles/seoul-luggage-storage-guide-2026

### 1-2. 내부 현황

| 항목 | 현재 상태 | 기획 판단 |
|---|---|---|
| 언어 라우팅 | `/zh-tw`, `/zh-hk`, `/en`, `/ja`, `/zh`, `/ko` | 언어별 키워드 분리가 가능함 |
| 지역 랜딩 | `App.tsx`에 `/storage/:slug` 라우트 존재 | 지역 키워드는 바로 랜딩 매핑 가능 |
| sitemap | `/storage/*`, `/delivery/*`가 다국어로 생성됨 | 단, `App.tsx` 기준 실제 라우트는 `/storage/:slug`만 확인됨. `/delivery/:slug`는 라우트 연결 후 색인 요청 |
| 지역 데이터 | `airport`, `hongdae`, `myeongdong`, `dongdaemun`, `bukchon`, `itaewon`, `gangnam`, `yeouido`, `seongsu`, `busan`, `jeju`, `regional-cities` | 1차 SEO는 서울 핵심 상권 6개와 공항에 집중 |
| 메타 데이터 | `MULTILANG_ROUTE_META` 기본 라우트 다국어화 완료 | 랜딩별 메타에 zh-TW/zh-HK 용어 차이를 더 강하게 반영 필요 |

주의:
- 브랜드 가이드 기준 금지 표현인 "저렴한/싼/할인", "공항->호텔배송", "호텔픽업", "거점 수 1위"는 SEO 문구에서도 사용하지 않는다.
- `seoLocations.ts` 일부 문구는 현재 운영 범위와 어긋날 수 있는 "호텔 배송" 계열 표현이 섞여 있어, 랜딩 발행 전 운영 사실과 맞춰 정리한다.

---

## 2. 키워드 전략의 핵심 결론

1. zh-TW는 `行李寄放` 중심, zh-HK는 `行李寄存` 중심으로 분리한다.
2. Beeliber의 승부 키워드는 단순 "서울 짐보관"보다 `지역 + 보관 + 체크아웃 후/공항 수령` 조합이다.
3. T-Luggage/T-Locker/Bounce가 강한 "락커/대량 지점" 프레임에는 직접 맞붙지 말고, "예약형 지점 보관 + 4시간 단위 + 중화권 언어 + 인천공항 라스트데이 배송"으로 잡는다.
4. GEO는 FAQ식 답변을 강화한다. AI 검색은 "어디가 좋아?", "락커가 없으면?", "체크아웃 후 어떻게 해?" 같은 질문에 짧고 정확하게 답하는 페이지를 더 잘 인용한다.
5. 4월 우선순위는 신규 페이지 확대보다 `/storage/hongdae`, `/storage/myeongdong`, `/storage/seongsu`의 문구 정확도와 색인이다. `/delivery/airport`는 sitemap에는 있으나 실제 라우트를 먼저 연결하거나 임시로 `/services`에 수렴시킨다.

---

## 3. Tier 1 키워드

### 3-1. zh-TW 대만

| 우선 | 키워드 | 의도 | 추천 URL | 페이지 역할 |
|---|---|---|---|---|
| 1 | 首爾 行李寄放 | 서울 전체 보관 | `/zh-tw/` | 홈/허브 |
| 1 | 弘大 行李寄放 | 홍대 현장 보관 | `/zh-tw/storage/hongdae` | 지역 랜딩 |
| 1 | 明洞 行李寄放 | 명동 쇼핑 후 보관 | `/zh-tw/storage/myeongdong` | 지역 랜딩 |
| 1 | 聖水 行李寄放 | 성수 카페/쇼핑 | `/zh-tw/storage/seongsu` | 지역 랜딩 |
| 1 | 仁川機場 行李配送 | 공항 수령 배송 | 계획: `/zh-tw/delivery/airport`, 임시: `/zh-tw/services` | 서비스 랜딩 |
| 2 | 退房後 行李寄放 首爾 | 체크아웃 후 일정 | `/zh-tw/tips/checkout-guide` | 가이드 |
| 2 | 韓國 行李寄放 | 한국 여행 범용 | `/zh-tw/locations` | 지점 허브 |
| 2 | 首爾 行李寄物櫃 滿了 | 락커 대안 | `/zh-tw/storage/hongdae` 또는 `/zh-tw/storage/myeongdong` | 대안형 FAQ |
| 2 | 弘大站 行李寄放 | 역 근처 | `/zh-tw/storage/hongdae` | 역세권 랜딩 |
| 3 | 嬰兒車 寄放 首爾 | 특수화물/가족 | `/zh-tw/services` | 서비스 설명 |

추천 H1 예:
- `弘大行李寄放 | 弘大入口站附近 Beeliber 據點`
- `明洞行李寄放 | 退房後輕鬆逛明洞`
- `仁川機場行李配送 | 首爾市區據點到機場取件`

### 3-2. zh-HK 홍콩

| 우선 | 키워드 | 의도 | 추천 URL | 주의 용어 |
|---|---|---|---|---|
| 1 | 首爾 行李寄存 | 서울 전체 보관 | `/zh-hk/` | `寄存` |
| 1 | 弘大 行李寄存 | 홍대 보관 | `/zh-hk/storage/hongdae` | `寄存` |
| 1 | 明洞 行李寄存 | 명동 보관 | `/zh-hk/storage/myeongdong` | `寄存` |
| 1 | 仁川機場 即日行李配送 | 당일 공항 배송 | 계획: `/zh-hk/delivery/airport`, 임시: `/zh-hk/services` | `即日` |
| 2 | 退房後 行李寄存 首爾 | 체크아웃 후 | `/zh-hk/tips/checkout-guide` | `退房後` |
| 2 | 首爾 寄存行李 推介 | 추천 탐색 | `/zh-hk/locations` | `推介` |
| 3 | 首爾 行李箱 寄存 | 캐리어 보관 | `/zh-hk/services` | `行李箱` |

추천 H1 예:
- `首爾行李寄存 | 弘大·明洞·聖水 Beeliber 據點`
- `仁川機場即日行李配送 | 首爾市區據點到機場`

### 3-3. 일본어

| 우선 | 키워드 | 의도 | 추천 URL |
|---|---|---|---|
| 1 | ソウル 荷物預かり | 서울 전체 보관 | `/ja/` |
| 1 | 弘大 荷物預かり | 홍대 | `/ja/storage/hongdae` |
| 1 | 明洞 荷物預かり | 명동 | `/ja/storage/myeongdong` |
| 1 | 仁川空港 荷物配送 | 공항 배송 | 계획: `/ja/delivery/airport`, 임시: `/ja/services` |
| 2 | 韓国旅行 チェックアウト後 荷物 | 체크아웃 후 | `/ja/tips/checkout-guide` |
| 2 | ソウル コインロッカー 空きがない | 락커 대안 | `/ja/storage/myeongdong` |

### 3-4. 영어

| 우선 | 키워드 | 의도 | 추천 URL |
|---|---|---|---|
| 1 | Seoul luggage storage | 서울 전체 | `/en/` |
| 1 | Hongdae luggage storage | 홍대 | `/en/storage/hongdae` |
| 1 | Myeongdong luggage storage | 명동 | `/en/storage/myeongdong` |
| 1 | Incheon airport luggage delivery | 공항 배송 | planned: `/en/delivery/airport`, interim: `/en/services` |
| 2 | luggage storage near Hongik University Station | 역 근처 | `/en/storage/hongdae` |
| 2 | what to do with luggage after checkout Seoul | 체크아웃 후 | `/en/tips/checkout-guide` |
| 2 | Seoul luggage locker alternative | 락커 대안 | `/en/locations` |

### 3-5. 한국어

| 우선 | 키워드 | 의도 | 추천 URL |
|---|---|---|---|
| 1 | 서울 짐보관 | 서울 전체 | `/ko/` |
| 1 | 홍대 짐보관 | 홍대 | `/ko/storage/hongdae` |
| 1 | 명동 짐보관 | 명동 | `/ko/storage/myeongdong` |
| 1 | 성수 짐보관 | 성수 | `/ko/storage/seongsu` |
| 1 | 인천공항 짐배송 | 공항 배송 | 계획: `/ko/delivery/airport`, 임시: `/ko/services` |
| 2 | 체크아웃 후 짐보관 | 상황 | `/ko/tips/checkout-guide` |
| 2 | 캐리어 보관 서울 | 물품 | `/ko/services` |

---

## 4. 랜딩 페이지 매칭

### 4-1. 먼저 색인/콘텐츠를 밀 페이지

| 순서 | URL | 대표 키워드 | 랜딩 메시지 | 필수 FAQ |
|---|---|---|---|---|
| 1 | `/zh-tw/storage/hongdae` | 弘大 行李寄放, 弘大站 行李寄放 | 홍대입구역/연남 일정 전후에 맡기는 보관 | 비용, 영업시간, 출구, 예약 여부, 공항 배송 가능 여부 |
| 2 | `/zh-tw/storage/myeongdong` | 明洞 行李寄放, 明洞站 行李寄放 | 체크아웃 후 명동 쇼핑 전후 보관 | 쇼핑 중 보관, 명동역 접근, 큰 캐리어, 보험, 예약 |
| 3 | `/zh-tw/storage/seongsu` | 聖水 行李寄放, 聖水洞 行李寄放 | 성수 카페/서울숲 일정용 보관 | 성수역 접근, 카페거리, 운영시간, 캐리어, 예약 |
| 4 | `/zh-tw/delivery/airport` | 仁川機場 行李配送, 市區到仁川機場 行李配送 | 마지막 날 도심 지점에서 맡기고 공항에서 수령 | 라우트 연결 후 색인. 연결 전에는 `/zh-tw/services`에 섹션과 FAQ를 둔다 |
| 5 | `/zh-hk/storage/hongdae` | 弘大 行李寄存 | 홍콩 사용자 용어 분리 | zh-TW와 동일하되 寄存/即日 사용 |
| 6 | `/ja/storage/hongdae` | 弘大 荷物預かり | 일본어 자연어 대응 | 料金, 営業時間, 駅出口, 予約, 仁川空港配送 |
| 7 | `/en/storage/myeongdong` | Myeongdong luggage storage | 영어 지도/near me 검색 대응 | price, hours, walking distance, large suitcases, booking |

### 4-2. 콘텐츠 가이드 페이지

| URL 제안 | 대표 키워드 | 콘텐츠 골자 |
|---|---|---|
| `/zh-tw/tips/checkout-guide` | 退房後 行李寄放 首爾 | 체크아웃 후 짐 처리 선택지: 지점 보관, 락커, 공항 배송. Beeliber는 예약형 지점 보관/공항 수령 대안으로 소개 |
| `/zh-tw/tips/seoul-locker-alternative` | 首爾 行李寄物櫃 滿了 | 락커가 찼거나 큰 캐리어가 안 들어갈 때 지점 보관을 쓰는 상황형 FAQ |
| `/zh-tw/tips/last-day-in-seoul` | 首爾 最後一天 行李 | 마지막 날 홍대/명동/성수 쇼핑 후 인천공항 수령 동선 |
| `/ja/tips/checkout-guide` | 韓国旅行 チェックアウト後 荷物 | 일본 여행객용 체크아웃 후 짐 처리 |
| `/en/tips/seoul-luggage-storage-guide` | Seoul luggage storage guide | 영어권 사용자를 위한 요금/지역/공항 배송 비교 |

---

## 5. GEO 질문 세트

각 랜딩에 아래처럼 한 문장 답변을 먼저 두고, 뒤에 상세 설명을 붙인다.

### zh-TW

| 질문 | 답변 방향 |
|---|---|
| 首爾行李寄放哪裡方便？ | Beeliber는 홍대, 명동, 성수 등 주요 동선에서 온라인 예약 후 지점 방문 보관을 제공한다고 답한다. |
| 弘大行李寄放可以寄幾小時？ | 4시간 기준 요금과 8시간 이상 1일 요금 전환을 명확히 설명한다. |
| 退房後行李可以怎麼處理？ | 지점 보관 또는 도심 지점에서 맡긴 뒤 인천공항 수령 옵션을 설명한다. |
| 行李寄物櫃滿了怎麼辦？ | 락커가 찼거나 큰 캐리어가 맞지 않을 때 예약형 지점 보관을 대안으로 제시한다. |
| 仁川機場行李配送怎麼用？ | 오전 중 지정 지점 방문, 공항 수령 시간, T1/T2 가능 여부를 단계별로 답한다. |

### zh-HK

| 질문 | 답변 방향 |
|---|---|
| 首爾行李寄存邊度方便？ | `寄存`, `推介`, `即日` 표현을 사용한다. |
| 仁川機場即日行李配送點用？ | 서울 도심 지점에서 맡기고 인천공항에서 받는 흐름으로 제한해 설명한다. |

### ja

| 질문 | 답변 방향 |
|---|---|
| ソウルで荷物預かりはどこが便利？ | 弘大, 明洞, 聖水 중심으로 가까운 지점 예약을 안내한다. |
| チェックアウト後の荷物はどうする？ | 보관 또는 인천공항 수령 배송 옵션을 짧게 비교한다. |

### en

| 질문 | 답변 방향 |
|---|---|
| Where can I store luggage in Seoul after checkout? | Match to Hongdae, Myeongdong, Seongsu storage pages and airport delivery page. |
| What if Seoul station lockers are full? | Present Beeliber as a reserved branch-storage alternative. |

---

## 6. 메타 문구 추천

### `/zh-tw/storage/hongdae`

```text
Title: 弘大行李寄放 | 弘大入口站附近 Beeliber 據點
Description: 在弘大入口站、延南洞附近寄放行李。線上預約後到 Beeliber 據點寄放，退房後也能輕鬆逛弘大、延南洞與紅色之路。
Keywords: 弘大行李寄放, 弘大站行李寄放, 弘益大學站行李寄放, 首爾行李寄放, 退房後行李寄放
```

### `/zh-tw/storage/myeongdong`

```text
Title: 明洞行李寄放 | 明洞站購物前後寄放行李
Description: 在明洞站、南大門、乙支路附近寄放行李。適合退房後購物、最後一天行程與大型行李保管。
Keywords: 明洞行李寄放, 明洞站行李寄放, 南大門行李寄放, 首爾購物行李寄放
```

### `/zh-tw/delivery/airport`

```text
Title: 仁川機場行李配送 | 首爾市區據點到機場取件
Description: 最後一天可在指定 Beeliber 據點寄放行李，之後於仁川機場 T1/T2 取件。適合退房後繼續逛首爾再前往機場。
Keywords: 仁川機場行李配送, 首爾到仁川機場行李配送, 退房後行李配送, 韓國行李配送
```

### `/en/storage/hongdae`

```text
Title: Hongdae Luggage Storage | Near Hongik University Station
Description: Reserve luggage storage near Hongdae and Yeonnam-dong. Drop off your suitcase at a Beeliber branch and enjoy Seoul after checkout.
Keywords: Hongdae luggage storage, Hongik University Station luggage storage, Seoul luggage storage after checkout
```

---

## 7. 30일 실행안

### Week 1

- Google Search Console에서 `site:bee-liber.com` 색인 상태 확인, sitemap 제출, 핵심 URL 수동 색인 요청.
- `/zh-tw/storage/hongdae`, `/zh-tw/storage/myeongdong`, `/zh-tw/storage/seongsu`의 H1, title, description, FAQ를 위 키워드 기준으로 정리.
- `/delivery/:slug`는 sitemap/prerender 데이터와 실제 React 라우트가 일치하는지 먼저 확인하고, 미연결이면 `/delivery/airport` 라우트를 만들거나 `/services`로 canonical 수렴한다.
- `seoLocations.ts`에서 운영 범위를 벗어나는 호텔 배송/공항->도심 배송성 문구 정리.

### Week 2

- zh-HK 용어 분기 적용: `寄放`을 무조건 재사용하지 말고 `寄存`, `即日` 중심으로 메타와 FAQ를 분리.
- FAQPage JSON-LD 5개 이상을 핵심 랜딩 4개에 추가.
- LocalBusiness JSON-LD를 홍대, 명동, 성수 우선 적용.

### Week 3

- `/zh-tw/tips/checkout-guide`와 `/zh-tw/tips/seoul-locker-alternative` 초안 작성.
- 내부 링크 구조 정리: 홈 -> 지역 랜딩, 지역 랜딩 -> 공항 배송, FAQ -> 예약 페이지.
- Google Business Profile 등록 가능한 지점부터 홍대/명동/성수 정보 정리.

### Week 4

- Search Console에서 노출 쿼리 기준으로 키워드 보정.
- 대만/홍콩용 외부 리뷰 채널 후보 정리: Klook, KKday, PTT, LIHKG, 여행 블로그.
- AI 검색 테스트 프롬프트 10개로 Beeliber 언급 여부를 월 1회 체크.

---

## 8. 성과 측정 키워드

| 그룹 | 대표 쿼리 |
|---|---|
| zh-TW 핵심 | 首爾 行李寄放, 弘大 行李寄放, 明洞 行李寄放, 聖水 行李寄放, 仁川機場 行李配送 |
| zh-HK 핵심 | 首爾 行李寄存, 弘大 行李寄存, 仁川機場 即日行李配送 |
| ja 핵심 | ソウル 荷物預かり, 弘大 荷物預かり, 仁川空港 荷物配送 |
| en 핵심 | Seoul luggage storage, Hongdae luggage storage, Myeongdong luggage storage, Incheon airport luggage delivery |
| 상황형 | 退房後 行李寄放, checkout after luggage Seoul, locker full Seoul luggage, large suitcase storage Seoul |
| 브랜드 | Beeliber, bee-liber, 빌리버, 比利伯, ビーリバー |

---

## 9. 바로 적용할 의사결정

1. x-default는 유지하되 콘텐츠 톤은 zh-TW를 기준으로 더 자연스럽게 다듬는다.
2. zh-HK는 별도 메타를 반드시 유지한다. 대만어권 키워드를 그대로 복제하지 않는다.
3. 서울 전체 키워드는 홈으로, 지역 키워드는 `/storage/:slug`로 단일화한다. 공항 배송 키워드는 `/delivery/airport` 라우트 연결 후 그 페이지로 단일화하고, 연결 전에는 `/services`에 모은다.
4. "락커" 키워드는 직접 경쟁이 아니라 대안형 콘텐츠로 잡는다.
5. 공항 배송은 현재 운영 가능한 방향과 시간을 정확히 쓴다. 운영이 확정되지 않은 공항->호텔/호텔픽업 표현은 제거한다.
