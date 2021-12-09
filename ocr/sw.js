// TODO: increase `version` number to force cache update when publishing a new release

const sw_config = {
    version: 'v192',
    app: 'OBS Dominator',
    cacheRemote: false, //Set to true if you want resources from other domains to be cached
    devMode: true, //Set to true to ensure resources are always first loaded from the network (easier for testing)
    matchOptions: { ignoreSearch: true}, //See https://developer.mozilla.org/en-US/docs/Web/API/Cache/match
    preCachingItems: [
    ], //The above resources are loaded into cache when you choose to install the app.
    neverCacheItems: [
        './sw.js'
    ], //The above resources should never be cached
    notFoundHTML: '<h1>404: not found error</h1>',
    offlineHTML: '<h1>OBS offline</h1>', 
    offlineImage: '<svg role="img" aria-labelledby="offline-title"' + ' viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">' + '<title id="offline-title">Offline</title>' + '<g fill="none" fill-rule="evenodd"><path fill="#aaa" d="M0 0h400v300H0z"/>' + '<text fill="#222" font-family="monospace" font-size="32" font-weight="bold">' + '<tspan x="136" y="156">offline</tspan></text></g></svg>'
};

//set devMode to true automatically when running local host
sw_config.devMode = (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1' || sw_config.devMode);

const cacheName = `${sw_config.app}::${sw_config.version}`;

function addToCache(cacheKey, request, response) {
    if (response.ok) {
        const copy = response.clone();
        caches.open(cacheKey).then(cache => {
            let url = request.url;
            if (sw_config.matchOptions.ignoreSearch === true){
                url = url.split('?')[0];
            }
            cache.put(url, copy);
        });
    }
    return response;
}

function fetchFromCache(event) {
    return caches.match(event.request, sw_config.matchOptions).then(response => {
        if (!response) {
            throw Error(`${event.request.url} not found in cache`);
        } else if (response.status === 404) {
            return new Response(sw_config.notFoundHTML, { headers: {'Content-Type': 'text/html'}}); 
        }
        return response;
    });
}

function offlineResponse(url) {
    let comp = url.pathname.split('/');
    let fileName = comp[comp.length-1].split('?')[0];
    if (/(.jpg|.jpeg|.webp|.png|.svg|.gif)$/.test(fileName)) {
        return new Response(sw_config.offlineImage, {headers: { 'Content-Type': 'image/svg+xml' }});
    } else if (/(.htm|.html)$/.test(fileName) || fileName == '') {
        return new Response(sw_config.offlineHTML, { headers: {'Content-Type': 'text/html'}}); 
    } else {
        return null;
    }
}

self.addEventListener('install', event => {
    event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(sw_config.preCachingItems)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    function clearCacheIfDifferent(event, opts) {
        return caches.keys().then(cacheKeys => {
            const oldCacheKeys = cacheKeys.filter(key => key.indexOf(opts.app) !== -1 && key.indexOf(opts.version) !== 0);
            const deletePromises = oldCacheKeys.map(oldKey => caches.delete(oldKey));
            return Promise.all(deletePromises);
        });
    }
    event.waitUntil(
        clearCacheIfDifferent(event, sw_config)
            .then(() => self.clients.claim())
    );
});
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET'
        || (sw_config.cacheRemote !== true && url.origin !== self.location.origin)
        || (sw_config.neverCacheItems.length > 0 && sw_config.neverCacheItems.indexOf(url.pathname) !== -1)) {
        // default browser behavior
        return;
    }
    let resourceType = sw_config.devMode ? 'networkFirst' : 'cacheFirst';

    switch (resourceType) {
        case 'networkFirst':
            // Network First and cache, Cache second
            event.respondWith(
                fetch(request)
                    .then(response => addToCache(cacheName, request, response))
                    .catch(() => fetchFromCache(event))
                    .catch(() => offlineResponse(url))
            );            
            break;
        case 'cacheFirst':
            // Cache First and network second and cache
            event.respondWith(
                fetchFromCache(event)
                    .catch(() => fetch(request))
                    .then(response => addToCache(cacheName, request, response))
                    .catch(() => offlineResponse(url))
            ); 
            break;
            case 'networkOnly':
                // Network only and don't cache
                event.respondWith(
                    fetch(request).catch(() => offlineResponse(url))
                );  
            break;
    }
});

self.addEventListener('message', function (event) {
    if (event.data.action === 'skipWaiting') {
      self.skipWaiting();
    }
    if (event.data.action === 'getversion') {
        let message = {action: event.data.action, payload: sw_config.version};
        self.clients.matchAll().then(clients => {
            clients.forEach(client => client.postMessage(message));
        });
    }    
});

self.addEventListener('push', function(e) {
    var options = {
      body: 'This notification was generated from a push!',
      icon: 'images/example.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2'
      },
      actions: [
        {action: 'explore', title: 'Explore this new world',
          icon: 'images/checkmark.png'},
        {action: 'close', title: 'Close',
          icon: 'images/xmark.png'},
      ]
    };
    e.waitUntil(
      self.registration.showNotification('Hello world!', options)
    );
  });
