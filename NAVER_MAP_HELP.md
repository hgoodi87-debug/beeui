# 🐝 비리버(Beeliber) 네이버 지도 연동 & 문제 해결 매뉴얼

사장님, 또 까먹고 저 붙잡고 고생하실까 봐 제가 아주 눈에 확 들어오게 정리해 왔어요. 💅
나중에 지도 안 뜨면 엄한 데 찾지 마시고 이 파일부터 열어보세요. 아시겠어요? 🙄✨

---

## 1. NCP(네이버 클라우드 플랫폼) 콘솔 설정법 (가장 중요!!)

네이버가 지도를 `AI·NAVER API`에서 **`Maps`**라는 별도 메뉴로 독립시켰어요. 옛날 방식 찾으시면 안 돼요!

### ✅ 메뉴 경로

1. [NCP 콘솔](https://console.ncloud.com/) 접속
2. 왼쪽 메뉴에서 **Services** > **Maps** 클릭 (AI·NAVER API 아닙니다!)
3. **Application** 메뉴 클릭

### ✅ 애플리케이션 생성/수정 시 체크리스트

- **Service 선택**:
  - [x] **Web Dynamic Map** (이거 안 하면 지도 안 그려짐)
  - [x] **Geocoding** (주소로 위치 찾으려면 필수)
- **Service URL 등록**:
  - 로컬 테스트용: `http://localhost:5173`
  - 실제 운영 서버: `https://bee-liber.com`
  - (주의: `http`, `https` 구분은 안 해도 되지만, 포트 번호가 바뀌면 꼭 수정해야 함!)
- **★ 필살기 (가장 많이 실수하는 거)**:
  - URL 리스트에 추가만 한다고 끝이 아닙니다. 화면 맨 밑에 있는 파란색 **[저장]** 또는 **[수정]** 버튼을 반드시 눌러야 서버에 반영됩니다! 쾅! 누르세요! 쾅! 🔨

---

## 2. 코드 및 아이디 연동 (개발자 전용)

### ✅ Client ID vs Key ID

최근 통합 콘솔로 바뀌면서 인증 파라미터 이름이 바뀌었습니다.

- **기존**: `ncpClientId`
- **신규(통합)**: `ncpKeyId` ← **이걸 써야 함!**

### ✅ 환경 변수 (.env)

`client/.env` 파일에 아래와 같이 등록되어 있는지 확인하세요.

```env
VITE_NAVER_MAP_CLIENT_ID=여기에_발급받은_아이디_넣기
```

### ✅ 지도 호출 URL 구조 (LocationMap.tsx)

지도를 불러올 때 주소 형식은 다음과 같아야 완벽합니다.

```javascript
const url = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder&language=ko&callback=CALLBACK_NAME`;
```

- **호스트**: `oapi.map.naver.com`이 여전히 가장 안정적입니다.
- **파라미터**: `ncpKeyId` 파라미터를 사용하세요. (`ncpClientId`가 아닙니다!)
- **서브모듈**: 주소 검색을 위해 `submodules=geocoder`를 꼭 붙이세요.

---

## 3. "지도가 안 나와요!" 해결 순서 (스봉이 스캔 💅)

1. **하얀색 배경만 덜렁 나온다?**
   - 100% **인증 실패**입니다. 브라우저 개발자 도구(F12) 콘솔(Console)을 보세요.
   - `200 Authentication Failed`가 떠 있다면? -> NCP 콘솔에서 내 도메인이 정말 들어있는지, **[저장]** 버튼을 눌렀는지 확인!

2. **아이디랑 설정 다 맞는데 안 된다?**
   - **propagation(전파) 대기**: 네이버 서버가 새 설정을 인식하는 데 **최대 15분** 정도 걸립니다. 커피 한 잔 마시고 오세요. ☕
   - **서버 재시작**: `.env` 파일을 고쳤다면 Vite 개발 서버를 껐다 켜야(Restart) 반영됩니다!

3. **지도는 나오는데 마커가 안 나온다?**
   - Firestore에 `locations` 데이터가 있는지, `StorageService`가 데이터를 잘 긁어오는지 확인하세요.

---

사장님, 이제 이 파일 있으니까 든든하시죠? ✨
전 이만 퇴근할 테니까, 지도 예쁘게 잘 관리하세요! 꿀벌처럼 부지런하게요! 🐝💅
