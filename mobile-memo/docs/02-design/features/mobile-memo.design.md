# mobile-memo 설계 문서

> **요약**: PWA 메모장 앱의 화면 구조·데이터 모델·모듈 설계 및 구현 가이드
>
> **프로젝트**: mobile-memo
> **버전**: 1.0.0
> **작성자**: 사용자
> **날짜**: 2026-03-04
> **상태**: Draft
> **기획 문서**: [mobile-memo.plan.md](../01-plan/features/mobile-memo.plan.md)

---

## 1. 설계 목표 및 원칙

### 1.1 설계 목표

- 빌드 도구 없이 `index.html`을 열기만 하면 실행되는 앱
- 모바일 퍼스트 — 360px 이상에서 터치 친화적 UI
- PWA(manifest + SW)로 홈 화면 설치 및 오프라인 동작 지원
- 단방향 데이터 흐름: `state 변경 → render() 호출 → DOM 갱신`

### 1.2 설계 원칙

- **단순성**: 함수 1개 = 역할 1개 (CRUD / 렌더링 / 라우팅 분리)
- **명확한 상태**: 전역 변수 최소화, 상태는 `state` 객체 하나로 관리
- **오류 격리**: LocalStorage 오류는 try/catch로 처리, UI는 정상 동작

---

## 2. 아키텍처

### 2.1 전체 구조

```
브라우저
  │
  ├── index.html          ← 뼈대 (두 화면 모두 포함, JS로 show/hide)
  ├── css/style.css       ← 모바일 퍼스트 스타일
  ├── js/app.js           ← 상태 + 렌더링 + 이벤트 + 라우팅
  │
  ├── manifest.json       ← PWA: 앱 이름·아이콘·테마 색
  ├── sw.js               ← PWA: 정적 파일 캐시 (Cache-First)
  └── icons/              ← 홈 화면 아이콘 (192, 512px)
```

### 2.2 화면 흐름 (라우팅)

```
앱 시작
  └─▶ [목록 뷰] (기본)
        ├─▶ [＋] 클릭 → [편집 뷰] (새 메모)
        └─▶ 메모 카드 클릭 → [편집 뷰] (기존 메모 수정)

[편집 뷰]
  ├─▶ [저장] → 목록 뷰
  ├─▶ [삭제] → 확인 다이얼로그 → 목록 뷰
  └─▶ [← 뒤로] → 목록 뷰 (저장 안 함)
```

### 2.3 상태 객체 (`state`)

```javascript
const state = {
  notes: [],          // 전체 메모 배열 (LocalStorage와 동기화)
  currentView: 'list', // 'list' | 'edit'
  editingId: null,    // 편집 중인 메모 ID (null = 새 메모)
  searchQuery: '',    // 검색어
};
```

### 2.4 데이터 흐름

```
사용자 액션
  → 이벤트 핸들러 (on*)
  → state 변경
  → saveNotes() → LocalStorage
  → render() → DOM 갱신
```

---

## 3. 데이터 모델

### 3.1 메모(Note) 객체

```javascript
// Note 구조
{
  id:        number,  // Date.now() — 고유 식별자
  title:     string,  // 메모 제목 (빈 문자열 허용)
  body:      string,  // 메모 본문
  createdAt: string,  // ISO 8601 문자열 (new Date().toISOString())
  updatedAt: string,  // 마지막 수정 시각
}
```

### 3.2 LocalStorage 저장 형식

```
키: 'mobile-memo-notes'
값: JSON.stringify(Note[])   // Note 배열
```

예시:
```json
[
  {
    "id": 1709512345678,
    "title": "오늘 할 일",
    "body": "장보기\n운동\n독서",
    "createdAt": "2026-03-04T09:00:00.000Z",
    "updatedAt": "2026-03-04T10:30:00.000Z"
  }
]
```

### 3.3 정렬 기준

목록 표시 시 `updatedAt` 내림차순 (최신 수정 순)

---

## 4. UI/UX 상세 설계

### 4.1 목록 뷰 (List View)

```
┌─────────────────────────────┐  ← max-width: 480px, 가운데 정렬
│  📝 메모장          [다크모드?]  │  ← 헤더 (h1 + 선택 버튼)
├─────────────────────────────┤
│  🔍 검색...                  │  ← input[type=search], sticky
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 오늘 할 일               │ │  ← 메모 카드 (note-card)
│ │ 3/4 · 장보기\n운동\n...  │ │  ← 날짜 + 본문 미리보기 2줄
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ (제목 없음)              │ │  ← 제목 없을 때 기본 표시
│ │ 3/3 · 내용...            │ │
│ └─────────────────────────┘ │
│                              │
│                        [＋]  │  ← FAB (Floating Action Button)
└─────────────────────────────┘
```

**검색**: `searchQuery`로 `title + body`를 `toLowerCase()` 포함 여부로 필터링

**빈 목록**: "메모가 없어요. ＋를 눌러 첫 메모를 작성하세요." 안내 표시

### 4.2 편집 뷰 (Edit View)

```
┌─────────────────────────────┐
│ [←]           [저장]  [🗑]  │  ← 헤더 (뒤로 / 저장 / 삭제)
├─────────────────────────────┤
│ 제목                         │  ← input[type=text], 큰 폰트
├─────────────────────────────┤
│                              │
│ 본문을 입력하세요...          │  ← textarea, 화면 채움
│                              │
│                              │
└─────────────────────────────┘
```

- 새 메모: 삭제 버튼 숨김
- 기존 메모: 제목·본문 자동 로드
- [저장]: 제목+본문 모두 빈 경우 저장 안 함 (alert 표시)

### 4.3 컴포넌트(DOM 요소) 목록

| 요소 ID | 역할 |
|---------|------|
| `#list-view` | 목록 뷰 컨테이너 |
| `#edit-view` | 편집 뷰 컨테이너 |
| `#search-input` | 검색창 |
| `#notes-container` | 메모 카드 렌더링 영역 |
| `#fab` | 새 메모 플로팅 버튼 |
| `#edit-title` | 편집 뷰 제목 input |
| `#edit-body` | 편집 뷰 본문 textarea |
| `#btn-back` | 뒤로 버튼 |
| `#btn-save` | 저장 버튼 |
| `#btn-delete` | 삭제 버튼 |

---

## 5. 모듈 설계 (js/app.js)

### 5.1 함수 목록

```
┌──────────────────────────────────────────────────┐
│  초기화                                           │
│  init()            앱 시작, SW 등록, 이벤트 연결  │
├──────────────────────────────────────────────────┤
│  라우팅                                           │
│  showView(view)    'list' | 'edit' 전환           │
│  openNew()         새 메모 편집 뷰 오픈           │
│  openEdit(id)      기존 메모 편집 뷰 오픈         │
├──────────────────────────────────────────────────┤
│  CRUD                                             │
│  saveNote()        현재 편집 내용 저장 (추가/수정)│
│  deleteNote(id)    메모 삭제                      │
├──────────────────────────────────────────────────┤
│  렌더링                                           │
│  renderList()      목록 뷰 다시 그리기            │
│  createCard(note)  메모 카드 DOM 생성             │
├──────────────────────────────────────────────────┤
│  LocalStorage                                     │
│  loadNotes()       저장된 메모 불러오기           │
│  saveNotes()       state.notes → LocalStorage 저장│
├──────────────────────────────────────────────────┤
│  유틸                                             │
│  formatDate(iso)   ISO → "3/4" 형태 변환          │
│  getPreview(text)  본문 첫 2줄 미리보기 텍스트    │
└──────────────────────────────────────────────────┘
```

### 5.2 이벤트 연결

| 요소 | 이벤트 | 핸들러 |
|------|--------|--------|
| `#search-input` | `input` | `state.searchQuery` 갱신 → `renderList()` |
| `#fab` | `click` | `openNew()` |
| `#notes-container` | `click` (이벤트 위임) | `openEdit(id)` |
| `#btn-back` | `click` | `showView('list')` |
| `#btn-save` | `click` | `saveNote()` |
| `#btn-delete` | `click` | 확인 후 `deleteNote(editingId)` |

---

## 6. PWA 설계

### 6.1 manifest.json 구조

```json
{
  "name": "메모장",
  "short_name": "메모",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 6.2 Service Worker 캐싱 전략

- **전략**: Cache-First (설치 시 정적 파일 캐시, 이후 캐시 우선 응답)
- **캐시 대상**: `index.html`, `css/style.css`, `js/app.js`, `manifest.json`, `icons/`
- **캐시 이름**: `mobile-memo-v1`

```javascript
// sw.js 동작 흐름
install  → 정적 파일 캐시
activate → 이전 버전 캐시 삭제
fetch    → 캐시에 있으면 반환, 없으면 네트워크 요청
```

---

## 7. 에러 처리

| 상황 | 처리 방법 |
|------|-----------|
| LocalStorage 읽기 실패 | try/catch → 빈 배열로 초기화 |
| 제목·본문 모두 빈 상태로 저장 | alert("내용을 입력하세요") 후 저장 안 함 |
| 삭제 실수 방지 | `confirm("정말 삭제할까요?")` 확인 다이얼로그 |
| SW 미지원 브라우저 | `'serviceWorker' in navigator` 체크 후 선택적 등록 |

---

## 8. 보안 고려사항

- [ ] XSS 방지: innerHTML 대신 `textContent` 사용 (사용자 입력 직접 삽입 금지)
- [ ] LocalStorage에 민감 정보 저장 금지 (이 앱은 메모만 저장)

---

## 9. 테스트 계획

| 시나리오 | 방법 |
|----------|------|
| 메모 CRUD 정상 동작 | 브라우저 직접 실행 |
| 검색 필터링 | 다양한 키워드 입력 |
| 새로고침 후 데이터 유지 | F5 후 목록 확인 |
| 오프라인 동작 | DevTools Network → Offline 설정 후 확인 |
| 홈 화면 설치 | 모바일 브라우저 "홈 화면 추가" |
| 모바일 레이아웃 | DevTools → 360px 시뮬레이션 |

---

## 10. 구현 순서

```
1단계: HTML 뼈대 (두 뷰 컨테이너)
  └── index.html 작성

2단계: CSS 스타일
  └── css/style.css (모바일 퍼스트, 두 뷰 스타일)

3단계: JS 핵심 로직
  └── js/app.js
      ├── 상태 초기화 + LocalStorage 연동
      ├── 목록 뷰 렌더링
      ├── 편집 뷰 CRUD
      └── 검색 필터링

4단계: PWA 설정
  ├── manifest.json
  ├── sw.js (Service Worker)
  └── icons/ (SVG → PNG 변환 또는 간단한 색상 블록)

5단계: 테스트
  └── localhost에서 SW 등록 확인 → 오프라인 테스트
```

---

## 버전 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 0.1 | 2026-03-04 | 초안 작성 | 사용자 |
