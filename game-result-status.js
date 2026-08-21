(() => {
  const KEY='agendaTraderJogos';

  function getGames(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(_){return[]}}
  function saveGames(games){localStorage.setItem(KEY,JSON.stringify(games))}
  function getGame(id){return getGames().find(g=>String(g.id)===String(id))}

  function setStatus(id,registered,result){
    const games=getGames();
    const game=games.find(g=>String(g.id)===String(id));
    if(!game)return;
    game.registrado=!!registered;
    game.resultadoRegistro=registered?(result||''):'';
    saveGames(games);
    decorateAll();
  }

  window.agendaToggleRegistrado=function(id){
    const game=getGame(id); if(!game)return;
    setStatus(id,!game.registrado,!game.registrado?(game.resultadoRegistro||''):'');
  };

  window.agendaSetResultado=function(id,result){
    const game=getGame(id); if(!game||!game.registrado)return;
    setStatus(id,true,game.resultadoRegistro===result?'':result);
  };

  function controlsHtml(game,id){
    const registered=!!game?.registrado;
    const result=game?.resultadoRegistro||'';
    return `<div class="game-status-inline">
      <button type="button" class="game-status-toggle ${registered?'is-on':''}" onclick="event.stopPropagation();agendaToggleRegistrado('${id}')">
        ${registered?'✓ Registrado':'○ Não registrado'}
      </button>
      <button type="button" class="game-result-btn game-result-green ${result==='green'?'is-selected':''}" onclick="event.stopPropagation();agendaSetResultado('${id}','green')" ${registered?'':'disabled'}>Green</button>
      <button type="button" class="game-result-btn game-result-red ${result==='red'?'is-selected':''}" onclick="event.stopPropagation();agendaSetResultado('${id}','red')" ${registered?'':'disabled'}>Red</button>
    </div>`;
  }

  function decorateCard(card){
    const id=(card.id||'').replace(/^card-/,'');
    if(!id)return;
    const game=getGame(id); if(!game)return;
    const summary=card.querySelector('.jogo-resumo');
    if(!summary)return;

    let wrap=card.querySelector(':scope > .game-status-inline-wrap');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.className='game-status-inline-wrap';
      summary.insertAdjacentElement('afterend',wrap);
    }
    wrap.innerHTML=controlsHtml(game,id);
  }

  function decorateAll(){document.querySelectorAll('[id^="card-"]').forEach(decorateCard)}

  const style=document.createElement('style');
  style.textContent=`
    .game-status-inline-wrap{display:block;margin:10px 0 0 142px;position:relative;z-index:5}
    .game-status-inline{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
    .game-status-inline button{pointer-events:auto!important;position:relative!important;z-index:6!important;border:1px solid #d8e0ea!important;border-radius:999px!important;padding:7px 11px!important;font-size:11px!important;font-weight:800!important;line-height:1!important;cursor:pointer!important;box-shadow:none!important}
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
    @media(max-width:900px){.game-status-inline-wrap{margin:10px 0 0 0}}
  `;
  document.head.appendChild(style);

  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return; queued=true;
    requestAnimationFrame(()=>{queued=false;decorateAll()});
  });
  function boot(){decorateAll();observer.observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
