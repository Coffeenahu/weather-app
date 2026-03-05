# Plan: weather-v2

## 1. Overview

| Item | Content |
|------|---------|
| Feature Name | weather-v2 |
| Start Date | 2026-03-05 |
| Priority | High |
| Base | mobile-weather-app 위에 추가 |

## 2. 포함 기능

### A. 즐겨찾기 (Favorites)
- 도시를 별표로 즐겨찾기 등록/해제
- 즐겨찾기 목록에서 도시 선택 → 날씨 바로 로드
- localStorage에 저장 (최대 5개)

### B. 시간별 예보 (Hourly Forecast)
- 오늘 기준 24시간 / 3시간 단위 예보
- 시간, 이모지, 온도 표시
- 가로 스크롤 슬라이더 형태

## 3. User Stories

| # | User Story | Priority |
|---|-----------|----------|
| US-01 | 현재 도시를 즐겨찾기에 추가/제거할 수 있다 | High |
| US-02 | 즐겨찾기 목록에서 도시를 선택해 날씨를 볼 수 있다 | High |
| US-03 | 오늘의 3시간 단위 예보를 가로 스크롤로 볼 수 있다 | High |
| US-04 | 즐겨찾기는 앱을 껐다 켜도 유지된다 | High |

## 4. Functional Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| FR-01 | 현재 날씨 카드에 별표(⭐) 버튼 표시 | High |
| FR-02 | 별표 클릭 시 즐겨찾기 추가/제거 토글 | High |
| FR-03 | 즐겨찾기 목록 UI (헤더 또는 별도 섹션) | High |
| FR-04 | 즐겨찾기 localStorage 저장/불러오기 | High |
| FR-05 | 기존 `/forecast` 데이터로 오늘 시간별 슬롯 추출 | High |
| FR-06 | 시간별 예보 가로 스크롤 카드 렌더링 | High |

## 5. 기술 결정

- 즐겨찾기: 새 파일 없이 `cache.js`의 localStorage 유틸 재사용
- 시간별 예보: 이미 받아오는 `/forecast` 데이터 활용 (추가 API 호출 없음)
- UI: 5일 예보 위에 시간별 예보 섹션 추가

## 6. Success Criteria

- [ ] 별표 버튼으로 즐겨찾기 추가/제거
- [ ] 즐겨찾기 목록 클릭 시 해당 도시 날씨 로드
- [ ] 새로고침 후에도 즐겨찾기 유지
- [ ] 오늘 시간별 예보 가로 스크롤 표시
