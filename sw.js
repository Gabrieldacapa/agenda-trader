const CACHE_NAME = "agenda-trader-v44";
const APP_SHELL = ["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./modern-ui.css","./club-badges.js","./game-result-status.js","./app-stability.js","./profile-ui.js"];
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
 if(event.request.mode==="navigate"){
  event.respondWith(fetch(event.request,{cache:"no-store"}).then(async response=>{
   if(!response.ok)return response;
   let html=await response.text();
   html=html.replace(/<link\s+rel="stylesheet"\s+href="\.\/modern-ui\.css(?:\?[^\"]*)?">/i,"");
   html=html.replace("</head>",'<link rel="stylesheet" href="./modern-ui.css?v=44"><script defer src="./club-badges.js?v=44"></script><script defer src="./game-result-status.js?v=44"></script><script defer src="./app-stability.js?v=44"></script><script defer src="./profile-ui.js?v=44"></script></head>');
   const headers=new Headers(response.headers);headers.set("Cache-Control","no-store, no-cache, must-revalidate");
   return new Response(html,{status:response.status,statusText:response.statusText,headers});
  }).catch(()=>caches.match("./index.html")));
  return;
 }
 if(url.pathname.endsWith("/modern-ui.css")||url.pathname.endsWith("/club-badges.js")||url.pathname.endsWith("/game-result-status.js")||url.pathname.endsWith("/app-stability.js")||url.pathname.endsWith("/profile-ui.js")){
  event.respondWith(fetch(event.request,{cache:"no-store"}).catch(()=>caches.match(event.request)));return;
 }
 event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});
