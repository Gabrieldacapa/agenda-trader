// Agenda Trader — exibe Valor de Referência e Valor Observado no resumo do jogo.
(function(){
'use strict';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function value(root,type){
 const words=type==='ref'?['valor de referencia','referencia']:['valor observado','observado'];
 for(const el of root.querySelectorAll('input,select,textarea,[data-field],[data-key],[data-name]')){
  const h=norm([el.name,el.id,el.className,el.placeholder,el.dataset?.field,el.dataset?.key,el.dataset?.name].filter(Boolean).join(' '));
  if(words.some(w=>h.includes(w))&&String(el.value||'').trim()) return String(el.value).trim();
 }
 for(const el of root.querySelectorAll('label,strong,b,span,div,p')){
  const raw=(el.textContent||'').trim(), t=norm(raw);
  if(!words.some(w=>t.includes(w))) continue;
  const p=raw.indexOf(':'); if(p>=0&&raw.slice(p+1).trim()) return raw.slice(p+1).trim();
  const n=el.querySelector('input,select,textarea')||el.nextElementSibling;
  if(n&&'value' in n&&String(n.value).trim()) return String(n.value).trim();
 }
 return '';
}
function esc(v){const d=document.createElement('div');d.textContent=v;return d.innerHTML}
function apply(card){
 const resumo=card.querySelector('.jogo-resumo'); if(!resumo)return;
 let box=resumo.querySelector('.ref-observed-summary');
 if(!box){box=document.createElement('div');box.className='ref-observed-summary';const c=resumo.querySelector('.jogo-confronto');(c||resumo).appendChild(box)}
 const r=value(card,'ref'),o=value(card,'obs');
 if(!r&&!o){box.style.display='none';return} box.style.display='flex';
 box.innerHTML=(r?'<span class="ref-observed-chip"><small>Referência</small><strong>'+esc(r)+'</strong></span>':'')+(o?'<span class="ref-observed-chip observed"><small>Observado</small><strong>'+esc(o)+'</strong></span>':'');
}
function refresh(){document.querySelectorAll('.card').forEach(apply)}
const s=document.createElement('style');s.textContent='.ref-observed-summary{display:flex;gap:7px;flex-wrap:wrap;margin-top:7px;align-items:center}.ref-observed-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:8px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;font-size:12px}.ref-observed-chip.observed{background:#f0fdf4;border-color:#bbf7d0;color:#166534}.ref-observed-chip small{font-size:11px;font-weight:700;opacity:.8}.ref-observed-chip strong{font-size:12px;color:inherit!important}body:not(.tema-claro) .ref-observed-chip{background:#172554;border-color:#1d4ed8;color:#bfdbfe}body:not(.tema-claro) .ref-observed-chip.observed{background:#052e16;border-color:#15803d;color:#bbf7d0}@media(max-width:760px){.ref-observed-summary{gap:5px}.ref-observed-chip{padding:4px 7px}}';document.head.appendChild(s);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh);else refresh();
let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(refresh,80)}).observe(document.documentElement,{childList:true,subtree:true});
})();
