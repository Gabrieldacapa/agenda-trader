const CACHE_NAME = "agenda-trader-v31";
const APP_SHELL = [
  "./",
  "./index.html",
  "./v31-account-isolation.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

async function respostaAppComV31(request){
  let response;
  try{
    response=await fetch(request);
    const copy=response.clone();
    caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)).catch(()=>{});
  }catch(e){
    response=await caches.match(request) || await caches.match("./index.html");
  }

  if(!response)return response;

  const contentType=response.headers.get("content-type")||"";
  if(request.mode==="navigate" && contentType.includes("text/html")){
    let html=await response.text();
    if(!html.includes("v31-account-isolation.js")){
      html=html.replace("</body>",'<script src="./v31-account-isolation.js"></script>\n</body>');
    }
    const headers=new Headers(response.headers);
    headers.delete("content-length");
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  }
  return response;
}

self.addEventListener("fetch", event => {
  if(event.request.method!=="GET")return;
  event.respondWith(respostaAppComV31(event.request));
});
