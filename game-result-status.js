(() => {
  const KEY='agendaTraderJogos';

  function getGames(){ try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(_){return[]} }
  function saveGames(games){ localStorage.setItem(KEY,JSON.stringify(games)); }
  function getGame(id){ return getGames().find(g=>String(g.id)===String(id)); }

  function setStatus(id,registered,result){
    const games=getGames();
    const game=games.find(g=>String(g.id)===String(id));
    if(!game)return;
    game.registrado=!!registered;
    game.resultadoRegistro=registered?(result||''):'';
    saveGames(games);
    decorateAll();
  }

  function compactControlsHtml(game,id){
    const registered=!!game?.registrado;
    const result=game?.resultadoRegistro||'';
    return `<div class="game-status-inline" data-status-ui="${id}">
      <button type="button" class="game-status-toggle ${registered?'is-on':''}" data-action="registered" data-id="${id}">
        ${registered?'✓ Registrado':'○ Não registrado'}
      </button>
      <button type="button" class="game-result-btn game-result-green ${result==='green'?'is-selected':''}" data-action="green" data-id="${id}" ${registered?'':'disabled'}>Green</button>
      <button type="button" class="game-result-btn game-result-red ${result==='red'?'is-selected':''}" data-action="red" data-id="${id}" ${registered?'':'disabled'}>Red</button>
    </div>`;
  }

  function decorateCard(card){
    const id=(card.id||'').replace(/^card-/,'');
    if(!id)return;
    const game=getGame(id);
    if(!game)return;
    const confronto=card.querySelector('.jogo-confronto');
    if(!confronto)return;

    let wrap=confronto.querySelector(':scope > .game-status-inline-wrap');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.className='game-status-inline-wrap';
      confronto.appendChild(wrap);
    }
    wrap.innerHTML=compactControlsHtml(game,id);
  }

  function decorateAll(){ document.querySelectorAll('[id^="card-"]').forEach(decorateCard); }

  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-action][data-id]');
    if(!btn)return;
    e.preventDefault();
    e.stopPropagation();
    const id=btn.dataset.id;
    const action=btn.dataset.action;
    const game=getGame(id);
    if(!game)return;

    if(action==='registered'){
      setStatus(id,!game.registrado,!game.registrado?(game.resultadoRegistro||''):'');
      return;
    }
    if(action==='green' || action==='red'){
      if(!game.registrado)return;
      const novo=game.resultadoRegistro===action?'':action;
      setStatus(id,true,novo);
    }
  },true);

  const style=document.createElement('style');
  style.textContent=`
    .game-status-inline-wrap{margin-top:8px;display:block}
    .game-status-inline{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
    .game-status-inline button{border:1px solid #d8e0ea!important;border-radius:999px!important;padding:6px 10px!important;font-size:11px!important;font-weight:800!important;line-height:1!important;cursor:pointer!important;box-shadow:none!important}
    .game-status-toggle{background:#eef2f7!important;color:#64748b!important}
    .game-status-toggle.is-on{background:#e0f2fe!important;color:#0369a1!important;border-color:#bae6fd!important}
    .game-result-green{background:#f0fdf4!important;color:#166534!important;border-color:#bbf7d0!important}
    .game-result-red{background:#fff1f2!important;color:#991b1b!important;border-color:#fecdd3!important}
    .game-result-btn.is-selected.game-result-green{background:#22c55e!important;color:#fff!important;border-color:#16a34a!important}
    .game-result-btn.is-selected.game-result-red{background:#ef4444!important;color:#fff!important;border-color:#dc2626!important}
    .game-status-inline button:disabled{opacity:.38!important;cursor:not-allowed!important}
    body:not(.tema-claro) .game-status-toggle{background:#1e293b!important;color:#cbd5e1!important;border-color:#334155!important}
    body:not(.tema-claro) .game-status-toggle.is-on{background:#0c4a6e!important;color:#bae6fd!important;border-color:#0369a1!important}
    body:not(.tema-claro) .game-result-green{background:#12351f!important;color:#86efac!important;border-color:#166534!important}
    body:not(.tema-claro) .game-result-red{background:#3a1515!important;color:#fca5a5!important;border-color:#991b1b!important}
    body:not(.tema-claro) .game-result-btn.is-selected.game-result-green{background:#16a34a!important;color:#fff!important}
    body:not(.tema-claro) .game-result-btn.is-selected.game-result-red{background:#dc2626!important;color:#fff!important}
  `;
  document.head.appendChild(style);

  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;decorateAll();});
  });

  function boot(){decorateAll();observer.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
