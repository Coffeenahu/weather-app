# mobile-memo

## Project Level
Level: Starter

## Tech Stack
- HTML5 + CSS3 + Vanilla JavaScript
- PWA (manifest.json + Service Worker)
- LocalStorage (오프라인 저장)

## File Structure
```
mobile-memo/
├── index.html          ← 목록 뷰 + 편집 뷰 (JS로 전환)
├── manifest.json       ← PWA 설치 정보
├── sw.js               ← Service Worker (Cache-First)
├── css/style.css       ← 모바일 퍼스트 스타일
├── js/app.js           ← 상태·CRUD·렌더링·라우팅
├── icons/icon.svg      ← 홈 화면 아이콘
└── docs/               ← PDCA 문서
```

## How to Run
- **로컬**: `index.html`을 브라우저에서 열기 (Service Worker는 localhost에서만 동작)
- **모바일 테스트**: Live Server(VS Code) 또는 Vercel/GitHub Pages 배포 후 스마트폰 브라우저 접속
- **홈 화면 설치**: HTTPS 환경에서 브라우저 → "홈 화면에 추가"

## PWA 주의사항
- Service Worker는 `localhost` 또는 `HTTPS` 환경에서만 등록됩니다.
- 로컬 파일(`file://`)로 열면 SW 등록은 실패하지만 기본 기능(CRUD, 저장)은 동작합니다.
- 프로덕션용 PNG 아이콘(192x192, 512x512)으로 `icons/icon.svg`를 교체하면 Android PWA 설치가 더 안정적입니다.

## Data Model
```js
{ id: number, title: string, body: string, createdAt: string, updatedAt: string }
// LocalStorage 키: 'mobile-memo-notes'
```
