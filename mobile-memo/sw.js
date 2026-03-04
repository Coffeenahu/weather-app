// Service Worker — Cache-First 전략
const CACHE_NAME = 'mobile-memo-v1';
const URLS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './manifest.json',
    './icons/icon.svg',
];

// 설치: 정적 파일 캐시
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                return cache.addAll(URLS_TO_CACHE);
            })
            .then(function () {
                return self.skipWaiting();
            })
    );
});

// 활성화: 이전 버전 캐시 삭제
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (keys) {
                return Promise.all(
                    keys
                        .filter(function (key) { return key !== CACHE_NAME; })
                        .map(function (key) { return caches.delete(key); })
                );
            })
            .then(function () {
                return self.clients.claim();
            })
    );
});

// 요청: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function (cached) {
                return cached || fetch(event.request);
            })
    );
});
