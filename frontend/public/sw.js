/**
 * AI 文字冒险 - Service Worker
 * 功能：缓存静态资源、离线页面 fallback、更新检测
 */

const CACHE_VERSION = 'ai-adventure-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = '/offline.html';

// 需要预缓存的核心资源
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// 安装阶段：预缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SW] 预缓存部分资源失败，继续安装:', err);
      })
  );
});

// 激活阶段：清理旧缓存，通知客户端更新
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('ai-adventure-') && name !== STATIC_CACHE && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// 请求拦截：缓存优先策略（静态资源），网络优先策略（API 请求）
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过跨域请求
  if (url.origin !== self.location.origin) {
    return;
  }

  // API 请求：网络优先，失败时不缓存（API 数据需实时性）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ success: false, message: '网络连接失败，请检查网络' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // 静态资源和页面：缓存优先，回退到网络
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // 后台更新缓存（stale-while-revalidate）
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // 缓存未命中，从网络获取
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // 网络失败，尝试返回离线页面
          if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});

// 监听来自页面的消息（如手动触发更新）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
