(() => {
  const API_BASE = 'https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=';
  const CACHE_KEY = 'agendaTraderClubBadgesV2';
  const memory = new Map();
  let persistent = {};

  const aliases = {
    fla:'Flamengo', fluminense:'Fluminense', flu:'Fluminense', pal:'Palmeiras', por:'Palmeiras', cor:'Corinthians', sccp:'Corinthians',
    sao:'São Paulo', spfc:'São Paulo', san:'Santos', santos:'Santos', cru:'Cruzeiro', cam:'Atlético Mineiro', galo:'Atlético Mineiro',
    cap:'Athletico Paranaense', athletico:'Athletico Paranaense', athletic:'Athletic Club MG', crb:'CRB', vas:'Vasco da Gama',
    bot:'Botafogo', gre:'Grêmio', gremio:'Grêmio', int:'Internacional', inter:'Internacional', bah:'Bahia', for:'Fortaleza',
    cea:'Ceará', ceara:'Ceará', spo:'Sport Recife', sport:'Sport Recife', vit:'Vitória', vitoria:'Vitória', cui:'Cuiabá',
    bra:'Red Bull Bragantino', bragantino:'Red Bull Bragantino', juventude:'Juventude', juf:'Juventude', goi:'Goiás', goias:'Goiás',
    ath:'Athletic Club MG', ame:'América Mineiro', america:'América Mineiro', ava:'Avaí', cha:'Chapecoense', ponte:'Ponte Preta',
    gua:'Guarani', nov:'Novorizontino', remo:'Remo', paysandu:'Paysandu', pai:'Paysandu'
  };

  try { persistent = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch (_) { persistent = {}; }

  const normalize = (v='') => String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const escapeHtml = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const initials = (name='') => String(name).trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase().slice(0,3) || '?';

  function saveCache(){ try{ localStorage.setItem(CACHE_KEY,JSON.stringify(persistent)); }catch(_){} }
  function canonicalName(name){ const key=normalize(name); return aliases[key] || String(name||'').trim(); }

  function teamScore(team, typedName){
    const wanted=normalize(typedName);
    const names=[team.strTeam,team.strTeamShort,team.strAlternate].filter(Boolean).map(normalize);
    let score=0;
    if(names.includes(wanted)) score=100;
    else if(names.some(n=>n.startsWith(wanted)||wanted.startsWith(n))) score=72;
    else if(names.some(n=>n.includes(wanted)||wanted.includes(n))) score=52;
    if(normalize(team.strCountry)==='brazil') score+=32;
    if(normalize(team.strSport)!=='soccer') score-=100;
    return score;
  }

  function bestTeam(teams,typedName){
    if(!Array.isArray(teams)||!teams.length) return null;
    return [...teams].sort((a,b)=>teamScore(b,typedName)-teamScore(a,typedName))[0]||null;
  }

  async function lookup(name){
    const typed=String(name||'').trim();
    if(typed.length<2) return null;
    const query=canonicalName(typed);
    const key=normalize(query);
    if(memory.has(key)) return memory.get(key);
    if(Object.prototype.hasOwnProperty.call(persistent,key)){ memory.set(key,persistent[key]); return persistent[key]; }
    try{
      const res=await fetch(API_BASE+encodeURIComponent(query),{cache:'force-cache'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      const data=await res.json();
      const team=bestTeam(data&&data.teams,query);
      const info=team&&team.strBadge?{name:team.strTeam||query,badge:team.strBadge,id:team.idTeam||'',country:team.strCountry||''}:null;
      memory.set(key,info); persistent[key]=info; saveCache(); return info;
    }catch(_){ return null; }
  }

  function ensureDatalist(input,side){
    const id='clubSuggestions_'+side;
    let dl=document.getElementById(id);
    if(!dl){ dl=document.createElement('datalist'); dl.id=id; document.body.appendChild(dl); }
    input.setAttribute('list',id);
    return dl;
  }

  function updateSuggestions(dl,value){
    if(!dl) return;
    const q=normalize(value);
    const names=[...new Set(Object.entries(aliases).filter(([abbr,name])=>abbr.startsWith(q)||normalize(name).startsWith(q)).map(([,name])=>name))].slice(0,8);
    dl.innerHTML=names.map(n=>`<option value="${escapeHtml(n)}"></option>`).join('');
  }

  function ensurePreview(input,side){
    const id='clubBadgePreview_'+side;
    let el=document.getElementById(id);
    if(!el){
      el=document.createElement('div'); el.id=id;
      el.style.cssText='display:none;align-items:center;gap:8px;margin-top:7px;font-size:12px;color:#718096;min-height:30px';
      input.insertAdjacentElement('afterend',el);
    }
    return el;
  }

  function renderPreview(el,info,typed){
    if(!el) return;
    if(!typed||typed.trim().length<2){el.style.display='none';el.innerHTML='';return;}
    el.style.display='flex';
    if(info&&info.badge){
      el.innerHTML=`<img src="${escapeHtml(info.badge)}" alt="" style="width:30px;height:30px;object-fit:contain;border-radius:7px;background:#fff;padding:2px;border:1px solid #e5e7eb" onerror="this.style.display='none'"><span>${escapeHtml(info.name||typed)}</span>`;
    }else{
      el.innerHTML=`<span style="width:30px;height:30px;display:grid;place-items:center;border-radius:7px;background:#eef2f7;color:#64748b;font-weight:800">${escapeHtml(initials(typed))}</span><span>Escudo não encontrado</span>`;
    }
  }

  function wireInput(id,side){
    const input=document.getElementById(id);
    if(!input||input.dataset.badgeWired==='1') return;
    input.dataset.badgeWired='1';
    const preview=ensurePreview(input,side);
    const dl=ensureDatalist(input,side);
    let timer=0,seq=0;

    const run=()=>{
      clearTimeout(timer);
      const value=input.value;
      updateSuggestions(dl,value);
      const my=++seq;
      if(value.trim().length<2){renderPreview(preview,null,'');return;}
      timer=setTimeout(async()=>{
        const info=await lookup(value);
        if(my!==seq||input.value!==value) return;
        renderPreview(preview,info,value);
      },350);
    };

    input.addEventListener('input',run);
    input.addEventListener('change',run);
    input.addEventListener('blur',()=>{
      const full=aliases[normalize(input.value)];
      if(full){ input.value=full; input.dispatchEvent(new Event('input',{bubbles:true})); }
      else run();
    });
    if(input.value.trim()) run();
  }

  function splitMatch(text){
    const raw=String(text||'').replace(/\s+/g,' ').trim();
    for(const sep of [' × ',' x ',' X ',' vs ',' VS ',' - ']){
      const i=raw.indexOf(sep);
      if(i>0) return [raw.slice(0,i).trim(),raw.slice(i+sep.length).trim()];
    }
    return null;
  }

  function findMatchTextNode(el){
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(node.parentElement&&node.parentElement.closest('.club-match-badges')) continue;
      if(splitMatch(node.nodeValue)) return node;
    }
    return null;
  }

  function buildBadgeNode(info,name){
    const wrap=document.createElement('span');
    wrap.style.cssText='display:inline-flex;align-items:center;gap:8px;min-width:0';
    if(info&&info.badge){
      const img=document.createElement('img'); img.src=info.badge; img.alt=''; img.loading='lazy';
      img.style.cssText='width:38px;height:38px;object-fit:contain;flex:0 0 38px'; img.onerror=()=>img.style.display='none'; wrap.appendChild(img);
    }else{
      const fb=document.createElement('span'); fb.textContent=initials(name); fb.style.cssText='width:38px;height:38px;border-radius:50%;display:grid;place-items:center;flex:0 0 38px;background:#eef2f7;color:#64748b;font-size:11px;font-weight:850'; wrap.appendChild(fb);
    }
    const label=document.createElement('span'); label.textContent=name; wrap.appendChild(label); return wrap;
  }

  async function enhanceMatch(el){
    if(!el||el.dataset.badgesBusy==='1') return;
    const textNode=findMatchTextNode(el);
    if(!textNode) return;
    const match=splitMatch(textNode.nodeValue);
    if(!match) return;
    const [home,away]=match;
    const sig=normalize(home)+'|'+normalize(away);
    if(el.dataset.badgesSig===sig) return;
    el.dataset.badgesBusy='1';
    const [h,a]=await Promise.all([lookup(home),lookup(away)]);
    el.dataset.badgesBusy='0'; el.dataset.badgesSig=sig;

    const row=document.createElement('span'); row.className='club-match-badges'; row.style.cssText='display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;margin-right:10px';
    row.appendChild(buildBadgeNode(h,home));
    const x=document.createElement('span'); x.textContent='×'; x.style.cssText='color:#94a3b8;font-weight:700'; row.appendChild(x);
    row.appendChild(buildBadgeNode(a,away));
    textNode.parentNode.replaceChild(row,textNode);
  }

  function enhanceLists(){ document.querySelectorAll('#listaAgenda .jogo-confronto,#listaHistorico .jogo-confronto').forEach(enhanceMatch); }

  function boot(){
    wireInput('mandante','mandante'); wireInput('visitante','visitante'); enhanceLists();
    const observer=new MutationObserver(()=>{ wireInput('mandante','mandante'); wireInput('visitante','visitante'); enhanceLists(); });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
