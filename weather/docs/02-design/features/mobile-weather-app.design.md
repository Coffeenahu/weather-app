# Design: mobile-weather-app

> Plan 참조: `docs/01-plan/features/mobile-weather-app.plan.md`

## 1. Architecture Overview

```
mobile-weather-app/
├── index.html          # 앱 진입점 (단일 페이지)
├── manifest.json       # PWA 매니페스트
├── sw.js               # Service Worker
├── css/
│   └── style.css       # 전체 스타일
├── js/
│   ├── app.js          # 앱 초기화 및 이벤트 핸들러
│   ├── api.js          # OpenWeatherMap API 호출
│   ├── weather.js      # 날씨 데이터 처리 로직
│   ├── ui.js           # DOM 렌더링
│   └── cache.js        # localStorage 캐싱
└── icons/              # PWA 아이콘 (192px, 512px)
```

## 2. Screen Design (Wireframe)

### 메인 화면 (단일 스크롤 페이지)

```
┌─────────────────────────┐
│  [검색창] 🔍 도시명 입력  │  ← Header
├─────────────────────────┤
│                         │
│    📍 서울특별시          │  ← 현재 도시명
│                         │
│        ☁️              │  ← 날씨 아이콘 (large)
│       23°C              │  ← 현재 온도 (big)
│     흐리고 비            │  ← 날씨 설명
│                         │
│  체감 21°C               │
│                         │
├──────┬──────┬──────┬────┤
│ 💧습도│ 💨풍속│🌫미세│ 🌡 │  ← 날씨 상세 카드
│ 72%  │4.5m/s│좋음  │최저│
└──────┴──────┴──────┴────┘
│                         │
│  [°C / °F 토글]          │
│                         │
├─────────────────────────┤
│  5일 예보                │  ← 섹션 헤더
├─────────────────────────┤
│ 오늘  ☁️  28° / 19°     │
│ 내일  🌧  25° / 17°     │
│ 목    ☀️  30° / 20°     │
│ 금    ⛅  27° / 18°     │
│ 토    🌧  22° / 15°     │
└─────────────────────────┘
```

## 3. API Design

### 3-1. 사용 API

| API | Endpoint | 용도 |
|-----|----------|------|
| Current Weather | `GET /weather` | 현재 날씨 |
| 5-day Forecast | `GET /forecast` | 5일 예보 (3시간 단위) |
| Air Pollution | `GET /air_pollution` | 미세먼지 (AQI) |

**Base URL**: `https://api.openweathermap.org/data/2.5`

### 3-2. Current Weather (`/weather`)

**Request**
```
GET /weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric&lang=kr
GET /weather?q={city_name}&appid={API_KEY}&units=metric&lang=kr
```

**Response (사용 필드)**
```json
{
  "name": "Seoul",
  "sys": { "country": "KR" },
  "weather": [{ "icon": "04d", "description": "흐림" }],
  "main": {
    "temp": 23.4,
    "feels_like": 21.2,
    "temp_min": 18.0,
    "temp_max": 26.0,
    "humidity": 72
  },
  "wind": { "speed": 4.5 },
  "coord": { "lat": 37.57, "lon": 126.98 }
}
```

### 3-3. 5-Day Forecast (`/forecast`)

**Request**
```
GET /forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric&lang=kr
```

**Response 처리**: 3시간 단위 40개 → 일별 그룹핑 (정오 12:00 데이터 기준)

```json
{
  "list": [
    {
      "dt_txt": "2026-03-06 12:00:00",
      "weather": [{ "icon": "10d", "description": "비" }],
      "main": { "temp": 20.1, "temp_min": 17.0, "temp_max": 23.0 }
    }
  ]
}
```

### 3-4. Air Pollution (`/air_pollution`)

**Request**
```
GET /air_pollution?lat={lat}&lon={lon}&appid={API_KEY}
```

**AQI 등급 매핑**
| AQI | 등급 | 색상 |
|-----|------|------|
| 1 | 좋음 | #4CAF50 |
| 2 | 보통 | #8BC34A |
| 3 | 나쁨 | #FF9800 |
| 4 | 매우나쁨 | #F44336 |
| 5 | 위험 | #9C27B0 |

## 4. Module Design

### 4-1. `api.js`

```javascript
// 담당: OpenWeatherMap API 호출
const API_KEY = '...';  // config에서 주입
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

async function fetchCurrentWeather(lat, lon)
async function fetchCurrentWeatherByCity(cityName)
async function fetchForecast(lat, lon)
async function fetchAirPollution(lat, lon)
```

### 4-2. `weather.js`

```javascript
// 담당: 데이터 가공 및 비즈니스 로직
function groupForecastByDay(forecastList)   // 3시간 → 일별
function getAqiLabel(aqiValue)              // AQI 숫자 → 등급
function convertTemp(celsius, unit)          // 섭씨 ↔ 화씨
function formatDate(dtTxt)                   // 날짜 포맷
```

### 4-3. `ui.js`

```javascript
// 담당: DOM 렌더링
function renderCurrentWeather(data, aqi)
function renderForecast(dailyData)
function renderError(message)
function renderLoading(isLoading)
function toggleTempUnit()
```

### 4-4. `cache.js`

```javascript
// 담당: localStorage 캐싱 (10분)
const CACHE_TTL = 10 * 60 * 1000;

function saveCache(key, data)
function loadCache(key)          // 만료 시 null 반환
function clearCache()
```

### 4-5. `app.js`

```javascript
// 담당: 초기화 및 이벤트 바인딩
async function init()              // 앱 시작 (위치 감지 → API 호출)
async function loadWeather(lat, lon)
async function searchCity(query)
function bindEvents()              // 검색, 단위 전환 이벤트
```

## 5. State Management

앱 전역 상태 (단일 객체):
```javascript
const state = {
  currentCity: null,       // 현재 도시명
  coords: { lat, lon },    // 좌표
  weatherData: null,       // 현재 날씨 데이터
  forecastData: null,      // 예보 데이터
  aqiData: null,           // 미세먼지 데이터
  unit: 'C',               // 온도 단위 ('C' | 'F')
  isLoading: false,
};
```

## 6. PWA Design

### manifest.json
```json
{
  "name": "날씨앱",
  "short_name": "날씨",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#16213e",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker 전략
- **Cache First**: CSS, JS, 아이콘 등 정적 자산
- **Network First**: API 응답 (오프라인 시 캐시 fallback)
- 캐시명: `weather-app-v1`

## 7. UI/UX Design

### 색상 팔레트 (다크 테마)
| Token | Value | 용도 |
|-------|-------|------|
| `--bg-primary` | `#1a1a2e` | 배경 |
| `--bg-card` | `#16213e` | 카드 배경 |
| `--bg-card-hover` | `#0f3460` | 카드 강조 |
| `--text-primary` | `#eaeaea` | 기본 텍스트 |
| `--text-secondary` | `#a0a0b0` | 보조 텍스트 |
| `--accent` | `#4fc3f7` | 강조색 (하늘색) |

### 타이포그래피
- 온도 (Big): `4rem`, `font-weight: 300`
- 도시명: `1.5rem`, `font-weight: 600`
- 예보 항목: `1rem`

### 반응형 기준
- 모바일: `max-width: 480px` (기본)
- 태블릿 이상: `max-width: 600px`, 중앙 정렬

## 8. Error Handling

| 상황 | 처리 방법 |
|------|---------|
| Geolocation 거부 | 서울(37.57, 126.98) 기본값으로 fallback |
| 도시 검색 실패 | "도시를 찾을 수 없습니다" 메시지 표시 |
| API 호출 실패 | 캐시 데이터 사용, 없으면 에러 메시지 |
| 오프라인 상태 | Service Worker 캐시 데이터 표시 |

## 9. Implementation Order

1. **기반 구조** — `index.html` 뼈대, `css/style.css` 다크 테마
2. **API 모듈** — `api.js` (4개 함수)
3. **데이터 처리** — `weather.js` (가공 로직)
4. **캐싱** — `cache.js` (localStorage)
5. **UI 렌더링** — `ui.js` (DOM 업데이트)
6. **앱 통합** — `app.js` (초기화 + 이벤트)
7. **PWA** — `manifest.json` + `sw.js`

## 10. Next Steps

```
/pdca do mobile-weather-app
```
