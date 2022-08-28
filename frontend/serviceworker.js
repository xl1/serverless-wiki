/// <reference lib="WebWorker" />
//@ts-check

const sw = /** @type {ServiceWorkerGlobalScope & typeof globalThis} */(globalThis);

const cahceName = 'pages.1';

sw.addEventListener('fetch', async ev => {
    if (ev.request.destination.startsWith("_data/_pages/")) {
        const [cachedResponse, fetchedResponse] = await Promise.all([
            caches.open(cahceName).then(c => c.match(ev.request)),
            fetch(ev.request.url)
        ]);
        if (!cachedResponse) {
            ev.respondWith(fetchedResponse);
        } else if (!fetchedResponse.ok) {
            ev.respondWith(cachedResponse);
        } else {
            const cacheDate = cachedResponse.headers.get('last-modifled') || '';
            const modifledDate = fetchedResponse.headers.get('last-modified') || '';
            if (Date.parse(cacheDate) > Date.parse(modifledDate)) {
                ev.respondWith(cachedResponse);
            } else {
                ev.respondWith(fetchedResponse);
            }
        }
    } else if (ev.request.destination.startsWith("_api/pages")) {
        const {
            path,
            markdown
        } = await ev.request.clone().json();
        if (path) {
            const cache = await caches.open(cahceName);
            cache.put(`_data/pages${path}.md`, new Response(markdown, {
                status: 200,
                headers: {
                    'content-type': 'text/markdown',
                    'last-modified': new Date().toUTCString(),
                }
            }));
        }
    }
});
