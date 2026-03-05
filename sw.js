/**
 * sw.js - Service Worker (오프라인 캐싱 & PWA 지원)
 * 
 * 담당: 네트워크 요청 캐싱, 오프라인 모드 지원, 푸시 알림 준비
 */

const CACHE_NAME = 'weather-app-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/api.js',
    '/js/cache.js',
    '/js/ui.js',
    '/js/weather.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

/**
 * Service Worker 설치 (초기 캐시 생성)
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] 설치 중...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] 캐시 생성:', CACHE_NAME);
                // 중요한 리소스만 캐시 (모든 리소스는 제외)
                return cache.addAll(urlsToCache.filter(url => 
                    !url.includes('/icons/') || url.endsWith('.png')
                )).catch(err => {
                    console.warn('[Service Worker] 일부 리소스 캐싱 실패:', err);
                });
            })
    );

    // 기다리지 않고 즉시 활성화
    self.skipWaiting();
});

/**
 * Service Worker 활성화 (오래된 캐시 정리)
 */
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] 활성화 중...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] 오래된 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    self.clients.claim(); // 즉시 클라이언트 제어
});

/**
 * 네트워크 요청 가로채기 (Fetch 이벤트)
 * 전략: Cache First (API 제외) / Network First (API, 아이콘)
 */
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API 요청 캐시 안 함 (최신 데이터 우선)
    if (url.hostname === 'api.openweathermap.org') {
        event.respondWith(
            fetch(event.request)
                .then((response) => response)
                .catch(() => {
                    // 오프라인 시 마지막 캐시된 데이터 반환
                    return caches.match(event.request)
                        .then(cached => cached || createErrorResponse());
                })
        );
        return;
    }

    // 로컬 리소스: Cache First 전략
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response; // 캐시에서 반환
                }

                // 캐시 없음 → 네트워크 요청
                return fetch(event.request)
                    .then((response) => {
                        // 성공 시 캐시에 저장
                        if (response.ok && event.request.method === 'GET') {
                            const clonedResponse = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, clonedResponse);
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        // 네트워크 실패 → 캐시된 대체 페이지 또는 에러
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        return createErrorResponse();
                    });
            })
    );
});

/**
 * 오프라인 에러 응답 생성 (필요시)
 */
function createErrorResponse() {
    return new Response(
        JSON.stringify({ error: '오프라인 상태입니다. 네트워크 연결을 확인하세요.' }),
        {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
            statusText: 'Service Unavailable'
        }
    );
}

/**
 * 백그라운드 동기 (백그라운드에서 데이터 동기화 - 미래 기능)
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'weather-sync') {
        event.waitUntil(
            fetch('/api/weather')
                .then(response => response.json())
                .catch(err => console.log('[Service Worker] 백그라운드 동기 실패:', err))
        );
    }
});

/**
 * 푸시 알림 수신 (미래 기능)
 */
self.addEventListener('push', (event) => {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'weather-notification'
    };

    event.waitUntil(
        self.registration.showNotification('🌤️ ' + data.title, options)
    );
});

/**
 * 푸시 알림 클릭
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // 이미 열려있는 창이 있으면 포커스
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            // 없으면 새 창 열기
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

console.log('[Service Worker] 로드됨 (v1)');
