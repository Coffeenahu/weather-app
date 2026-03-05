# Plan: mobile-weather-app

## 1. Overview

| Item | Content |
|------|---------|
| Feature Name | mobile-weather-app |
| Start Date | 2026-03-05 |
| Priority | High |
| Level | Starter (Static Web / PWA) |

## 2. Goal

현재 위치 기반 날씨 정보를 제공하는 모바일 친화적인 날씨 앱 제작.
직관적인 UI로 오늘의 날씨와 주간 예보를 빠르게 확인할 수 있는 앱을 목표로 한다.

## 3. Background & Motivation

- 기존 날씨 앱은 광고가 많고 UI가 복잡함
- 가볍고 빠른 PWA 형태로 모바일에서 홈 화면 추가 가능
- 날씨 API 연동을 통해 실시간 데이터 제공

## 4. Scope

### In Scope
- 현재 위치 기반 날씨 조회 (Geolocation API)
- 도시 이름 검색 기능
- 오늘 날씨 (온도, 날씨 상태, 습도, 풍속)
- 5일 예보 (주간 예보)
- 모바일 최적화 UI (반응형)
- PWA 지원 (오프라인 캐싱, 홈 화면 추가)

### Out of Scope
- 날씨 알림 푸시
- 회원가입/로그인
- 여러 도시 즐겨찾기 (v2에서 추가 예정)

## 5. User Stories

| # | User Story | Priority |
|---|-----------|----------|
| US-01 | 앱을 열면 현재 위치의 날씨를 바로 볼 수 있다 | High |
| US-02 | 도시 이름을 검색해서 다른 지역 날씨를 볼 수 있다 | High |
| US-03 | 오늘의 온도, 습도, 풍속, 날씨, 미세먼지 상태를 확인할 수 있다 | High |
| US-04 | 5일간의 날씨 예보를 확인할 수 있다 | Medium |
| US-05 | 모바일에서 홈 화면에 추가해 앱처럼 쓸 수 있다 | Medium |
| US-06 | 오프라인에서도 마지막 조회 데이터를 볼 수 있다 | Low |

## 6. Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Weather API | OpenWeatherMap API (무료 플랜) |
| PWA | Service Worker, Web App Manifest |
| 배포 | GitHub Pages or Vercel |

## 7. Functional Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| FR-01 | Geolocation API로 현재 위치 자동 감지 | High |
| FR-02 | OpenWeatherMap API 연동으로 실시간 날씨 데이터 조회 | High |
| FR-03 | 도시명 검색 입력 및 결과 표시 | High |
| FR-04 | 현재 날씨 카드 (온도, 체감온도, 날씨 아이콘, 설명, 습도, 풍속, 미세먼지) | High |
| FR-05 | 7일 예보 리스트 (날짜, 아이콘, 최고/최저 온도) | Medium |
| FR-06 | 섭씨/화씨 단위 전환 | Low |
| FR-07 | Service Worker 등록 및 오프라인 캐싱 | Medium |
| FR-08 | Web App Manifest 설정 (PWA) | Medium |

## 8. Non-Functional Requirements

- 초기 로딩: 3초 이내
- 날씨 데이터 갱신: 10분 캐싱
- 모바일 뷰포트 최적화 (375px ~ 428px 기준)
- Lighthouse PWA 점수 80점 이상 목표

## 9. Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| OpenWeatherMap API 키 노출 | Medium | 환경변수 처리, 요청 제한 설정 |
| Geolocation 권한 거부 | Medium | 기본 도시(서울) fallback 처리 |
| API 무료 플랜 호출 한도 | Low | 로컬 캐싱으로 중복 호출 방지 |

## 10. Success Criteria

- [ ] 현재 위치 날씨가 3초 이내 로드됨
- [ ] 도시 검색 정상 동작
- [ ] 7일 예보 표시
- [ ] 모바일에서 홈 화면 추가 가능 (PWA)
- [ ] Lighthouse Performance 80점 이상

## 11. Next Steps

1. `/pdca design mobile-weather-app` — 상세 설계 (화면 설계, 컴포넌트 구조, API 스펙)
2. OpenWeatherMap API 키 발급
3. 목업 화면 제작
