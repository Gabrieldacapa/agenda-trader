(() => {
  const API_BASE = 'https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=';
  const CACHE_KEY = 'agendaTraderClubBadgesV1';
  const memory = new Map();
  let persistent = {};

  try { persistent = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch (_) { persistent = {}; }

  const normalize = (v='') => v
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

  const escapeHtml = (v='') => v.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function saveCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(persistent)); } catch (_) {}
  }

  function bestTeam(teams, typedName) {
    if (!Array.isArray(teams) || !teams.length) return null;
    const wanted = normalize(typedName);
    const soccer = teams.filter(t => normalize(t.strSport) === 'soccer');
    const pool = soccer.length ? soccer : teams;

    const score = t => {
      const names = [t.strTeam, t.strTeamShort, t.strAlternate].filter(Boolean).map(normalize);
      if (names.includes(wanted)) return 100;
      if (names.some(n => n.startsWith(wanted) || wanted.startsWith(n))) return 70;
      if (names.some(n => n.includes(wanted) || wanted.includes(n))) return 50;
      return 0;
    };
    return [...pool].sort((a,b) => score(b)-score(a))[0] || null;
  }

  async function lookup(name) {
    const clean = String(name || '').trim();
    if (clean.length < 2) return null;
    const key = normalize(clean);

    if (memory.has(key)) return memory.get(key);
    if (Object.prototype.hasOwnProperty.call(persistent,key)) {
      memory.set(key,persistent[key]);
      return persistent[key];
    }

    try {
      const res = await fetch(API_BASE + encodeURIComponent(clean), {cache:'force-cache'});
      if (!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();
      const team = bestTeam(data && data.teams, clean);
      const badge = team && team.strBadge ? {
        name: team.strTeam || clean,
        badge: team.strBadge,
        id: team.idTeam || ''
      } : null;
      memory.set(key,badge);
      persistent[key]=badge;
      saveCache();
      return badge;
    } catch (_) {
      return null;
    }
  }

  function ensurePreview(input, side) {
    if (!input || !input.parentElement) return null;
    const id = 'clubBadgePreview_'+side;
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id=id;
      el.style.cssText='display:none;align-items:center;gap:8px;margin-top:7px;font-size:12px;color:#718096;min-height:30px';
      input.insertAdjacentElement('afterend',el);
    }
    return el;
  }

  function initials(name) {
    return String(name||'').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase().slice(0,3) || '?';
  }

  function renderPreview(el, info, typed) {
    if (!el) return;
    if (!typed || typed.trim().length < 2) { el.style.display='none'; el.innerHTML=''; return; }
    el.style.display='flex';
    if (info && info.badge) {
      el.innerHTML=`<img src="${escapeHtml(info.badge)}" alt="" style="width:30px;height:30px;object-fit:contain;border-radius:7px;background:#fff;padding:2px;border:1px solid #e5e7eb" onerror="this.style.display='none'"> <span>${escapeHtml(info.name || typed)}</span>`;
    } else {
      el.innerHTML=`<span style="width:30px;height:30px;display:grid;place-items:center;border-radius:7px;background:#eef2f7;color:#64748b;font-weight:800">${escapeHtml(initials(typed))}</span><span>Escudo não encontrado</span>`;
    }
  }

  function wireInput(id, side) {
    const input=document.getElementById(id);
    if (!input || input.dataset.badgeWired==='1') return;
    input.dataset.badgeWired='1';
    const preview=ensurePreview(input,side);
    let timer=0, seq=0;

    const run=() => {
      clearTimeout(timer);
      const value=input.value;
      const my=++seq;
      if (value.trim().length < 2) { renderPreview(preview,null,''); return; }
      timer=setTimeout(async()=>{
        const info=await lookup(value);
        if (my!==seq || input.value!==value) return;
        renderPreview(preview,info,value);
      },450);
    };

    input.addEventListener('input',run);
    input.addEventListener('blur',()=>{ if(input.value.trim().length>=2) run(); });
    if (input.value.trim()) run();
  }

  function splitMatch(text) {
    const raw=String(text||'').replace(/\s+/g,' ').trim();
    for (const sep of [' × ',' x ',' X ',' vs ',' VS ',' - ']) {
      const i=raw.indexOf(sep);
      if (i>0) return [raw.slice(0,i).trim(),raw.slice(i+sep.length).trim(),sep.trim()];
    }
    return null;
  }

  async function enhanceMatch(el) {
    if (!el || el.dataset.badgesBusy==='1') return;
    const match=splitMatch(el.textContent);
    if (!match) return;
    const [home,away]=match;
    const sig=normalize(home)+'|'+normalize(away);
    if (el.dataset.badgesSig===sig) return;
    el.dataset.badgesBusy='1';
    const [h,a]=await Promise.all([lookup(home),lookup(away)]);
    el.dataset.badgesBusy='0';
    el.dataset.badgesSig=sig;

    const logo=(info,name)=> info && info.badge
      ? `<img src="${escapeHtml(info.badge)}" alt="" loading="lazy" style="width:42px;height:42px;object-fit:contain;flex:0 0 42px" onerror="this.style.display='none'">`
      : `<span style="width:42px;height:42px;border-radius:50%;display:grid;place-items:center;flex:0 0 42px;background:#eef2f7;color:#64748b;font-size:11px;font-weight:850">${escapeHtml(initials(name))}</span>`;

    el.innerHTML=`<span style="display:flex;align-items:center;gap:10px;min-width:0">${logo(h,home)}<span style="min-width:0">${escapeHtml(home)}</span></span><span style="color:#94a3b8;font-weight:700;padding:0 6px">×</span><span style="display:flex;align-items:center;gap:10px;min-width:0">${logo(a,away)}<span style="min-width:0">${escapeHtml(away)}</span></span>`;
    el.style.display='flex';
    el.style.alignItems='center';
    el.style.flexWrap='wrap';
    el.style.gap='6px';
  }

  function enhanceLists() {
    document.querySelectorAll('#listaAgenda .jogo-confronto,#listaHistorico .jogo-confronto').forEach(enhanceMatch);
  }

  function boot() {
    wireInput('mandante','mandante');
    wireInput('visitante','visitante');
    enhanceLists();

    const observer=new MutationObserver(()=>{
      wireInput('mandante','mandante');
      wireInput('visitante','visitante');
      enhanceLists();
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
