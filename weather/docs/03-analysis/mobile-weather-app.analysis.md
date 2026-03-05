# Gap Analysis: mobile-weather-app (2차)

> 분석일: 2026-03-05
> 1차 분석 이후 수정 사항 반영

## Match Rate: 88%

## 1. Functional Requirements 충족 현황

| ID | 요구사항 | 상태 | 비고 |
|----|---------|------|------|
| FR-01 | Geolocation + 서울 fallback | ✅ | 정상 |
| FR-02 | OpenWeatherMap API 3종 연동 | ✅ | config.js로 API 키 분리 |
| FR-03 | 도시명 검색 (한글 포함) | ✅ | Geocoding API로 교체 |
| FR-04 | 현재 날씨 카드 (미세먼지 포함) | ✅ | 날씨 설명 보정 적용 |
| FR-05 | 5일 예보 리스트 | ✅ | 정상 |
| FR-06 | 섭씨 단위 고정 | ✅ | 토글 제거 완료 |
| FR-07 | Service Worker 오프라인 캐싱 | ⚠️ | icons/ 폴더 없어서 install 실패 가능 |
| FR-08 | Web App Manifest | ⚠️ | icons/ 폴더 없어서 PWA 설치 불가 |

## 2. 남은 Gap 목록

### [High] icons/ 폴더 없음 — PWA 설치 불가

`manifest.json`과 `sw.js`가 아이콘 파일을 참조하지만 실제 파일이 없음.

```
icons/icon-192.png     ← 없음
icons/icon-512.png     ← 없음
icons/icon-maskable.png ← 없음
```

PWA 홈 화면 추가 불가, Service Worker 설치 시 경고 발생.

**해결**: icons/ 폴더에 실제 아이콘 이미지 추가 필요.

---

### [Low] 미사용 함수 3개

| 함수 | 파일 | 이유 |
|------|------|------|
| `convertTemp()` | weather.js:89 | 섭씨/화씨 토글 제거로 미사용 |
| `convertWindSpeed()` | weather.js:137 | normalizeWeatherData에서 미사용 |
| `fetchCurrentWeatherByCity()` | api.js:41 | 검색이 좌표 기반으로 변경되어 미사용 |

---

### [Low] ui.js 주석 오류

**위치**: `ui.js:201`
```javascript
// (api.js의 getWeatherIconUrl와 동일)  ← api.js에서 이미 삭제됨
```

---

## 3. 1차 대비 수정 완료 항목

| 항목 | 상태 |
|------|------|
| API 키 플레이스홀더 | ✅ config.js 분리 |
| 검색 버튼 lat=0,lon=0 버그 | ✅ searchCity() 호출로 수정 |
| 도시 선택 후 날씨 미로드 | ✅ loadWeatherData() 직접 호출 |
| getWeatherIconUrl 중복 | ✅ api.js에서 제거 |
| manifest.json 색상 | ✅ 다크 테마 통일 |
| 날씨 설명 어색한 번역 | ✅ WEATHER_DESC_MAP 보정 |
| 도시 한글 검색 | ✅ Geocoding API 교체 |
| 섭씨/화씨 토글 | ✅ 완전 제거 |

## 4. 결론

핵심 기능은 모두 정상 구현됨. 남은 항목은 **icons/ 폴더 생성** 하나가 실질적인 이슈.
아이콘 추가 후 Match Rate 95%+ 달성 가능.
