/// <reference lib="WebWorker" />
//@ts-check

const sw = /** @type {ServiceWorkerGlobalScope & typeof globalThis} */(globalThis);

const cacheName = 'pages.1';

sw.addEventListener('activate', ev => {
    ev.waitUntil(sw.clients.claim());
});

sw.addEventListener('fetch', async ev => {
    const url = new URL(ev.request.url);
    if (url.pathname.startsWith('/_data/pages/')) {
        ev.respondWith(getPage(ev));
    } else if (url.pathname.startsWith('/api/pages')) {
        ev.waitUntil(cachePage(ev));
    }
});

/**
 * @param {FetchEvent} ev
 * @returns {Promise<Response>}
 */
async function getPage(ev) {
    const cachedResponse = await caches.open(cacheName).then(c => c.match(ev.request));
    const fetchedResponse = await fetch(ev.request.url);
    if (!cachedResponse) return fetchedResponse;
    if (!fetchedResponse.ok) return cachedResponse;

    const cacheDate = cachedResponse.headers.get('last-modified') || '';
    const modifiedDate = fetchedResponse.headers.get('last-modified') || '';
    if (Date.parse(cacheDate) > Date.parse(modifiedDate)) {
        return cachedResponse;
    } else {
        return fetchedResponse.clone();
    }
}

/**
 * @param {FetchEvent} ev
 */
async function cachePage(ev) {
    const {
        name,
        markdown
    } = await ev.request.clone().json();
    if (name) {
        const cache = await caches.open(cacheName);
        await cache.put(`/_data/pages${name}.md`, new Response(markdown, {
            status: 200,
            headers: {
                'content-type': 'text/markdown',
                'last-modified': new Date().toUTCString(),
            }
        }));
    }
}
