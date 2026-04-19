# beeliber 모바일 웹

> Repo: https://github.com/hgoodi87-debug/beeui


서울 짐 보관 · 인천공항 당일 배송 서비스의 모바일 웹 앱 프로토타입.

## 실행

`index.html` 파일을 브라우저로 열면 끝. 의존성 없음 (폰트·이미지·국기는 CDN).

로컬 프리뷰 서버:
```bash
python -m http.server 8787
# http://localhost:8787 접속
```

## 구조

- 단일 HTML SPA · 스크롤 없는 `100dvh` 화면 전환
- 폰 프레임: max-width 480px (데스크톱에서도 모바일 고정)
- 화면:
  - `home` — Hero + 리뷰 마키
  - `menu` — 햄버거 오버레이 + 법적 링크
  - `about` / `how` / `price` / `faq`
  - `biz` / `privacy` / `terms`
  - `reserve-1` ~ `reserve-5` + `reserve-done` (QR 바우처)
- 언어 전환: 한국어 / English / 日本語 / 中文(简·繁) / 粵語 (국기 SVG)

## 디자인 토큰

- 메인 컬러 `--yellow: #F5B200`, 버튼 `#EBA500`
- 다크 배경 `--bg-dark: #0A0A0A`
- 폰트: Pretendard Variable + Outfit
