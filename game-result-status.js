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

  function badgeHtml(game){
    if(!game?.registrado)return '<span class="game-status-badge game-status-none">⚪ Não registrado</span>';
    if(game.resultadoRegistro==='green')return '<span class="game-status-badge game-status-green">● Green</span>';
    if(game.resultadoRegistro==='red')return '<span class="game-status-badge game-status-red">● Red</span>';
    return '<span class="game-status-badge game-status-registered">✓ Registrado</span>';
  }

  function controlsHtml(game,id){
    const registered=!!game?.registrado;
    const result=game?.resultadoRegistro||'';
    return `<div class="game-status-controls" onclick="event.stopPropagation()">
      <label class="game-status-check"><input type="checkbox" data-game-register="${id}" ${registered?'checked':''}> <span>Jogo registrado</span></label>
      <div class="game-result-options ${registered?'':'is-disabled'}">
        <label class="game-result-green"><input type="radio" name="game-result-${id}" value="green" ${result==='green'?'checked':''} ${registered?'':'disabled'}> Green</label>
        <label class="game-result-red"><input type="radio" name="game-result-${id}" value="red" ${result==='red'?'checked':''} ${registered?'':'disabled'}> Red</label>
      </div>
    </div>`;
  }

  function decorateCard(card){
    const id=(card.id||'').replace(/^card-/,'');
    if(!id)return;
    const game=getGame(id);
    if(!game)return;
    const confronto=card.querySelector('.jogo-confronto');
    if(confronto){
      let badge=confronto.querySelector(':scope > .game-status-badge-wrap');
      if(!badge){badge=document.createElement('div');badge.className='game-status-badge-wrap';confronto.appendChild(badge);}
      badge.innerHTML=badgeHtml(game);
    }
    const details=card.querySelector('.jogo-detalhes');
    if(details){
      let controls=details.querySelector(':scope > .game-status-controls-wrap');
      if(!controls){controls=document.createElement('div');controls.className='game-status-controls-wrap';details.prepend(controls);}
      controls.innerHTML=controlsHtml(game,id);
    }
  }

  function decorateAll(){ document.querySelectorAll('[id^="card-"]').forEach(decorateCard); }

  document.addEventListener('change',e=>{
    const reg=e.target.closest('[data-game-register]');
    if(reg){
      const id=reg.dataset.gameRegister;
      const game=getGame(id);
      setStatus(id,reg.checked,reg.checked?(game?.resultadoRegistro||''):'');
      return;
    }
    if(e.target.matches('input[type="radio"][name^="game-result-"]')){
      const id=e.target.name.replace('game-result-','');
      setStatus(id,true,e.target.value);
    }
  });

  const style=document.createElement('style');
  style.textContent=`
    .game-status-badge-wrap{margin-top:7px;display:block}
    .game-status-badge{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:800;line-height:1}
    .game-status-none{background:#eef2f7;color:#64748b}
    .game-status-registered{background:#e0f2fe;color:#0369a1}
    .game-status-green{background:#dcfce7;color:#166534}
    .game-status-red{background:#fee2e2;color:#991b1b}
    .game-status-controls-wrap{margin-bottom:15px}
    .game-status-controls{display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding:12px 14px;border:1px solid var(--line,#dbe2ea);border-radius:12px;background:var(--field,#f8fafc)}
    .game-status-check,.game-result-options label{display:inline-flex;align-items:center;gap:7px;margin:0;font-size:13px;font-weight:750;cursor:pointer}
    .game-status-check input,.game-result-options input{width:auto!important;margin:0!important}
    .game-result-options{display:flex;align-items:center;gap:8px}
    .game-result-options.is-disabled{opacity:.45}
    .game-result-green,.game-result-red{padding:7px 10px;border-radius:9px}
    .game-result-green{background:#dcfce7;color:#166534!important}
    .game-result-red{background:#fee2e2;color:#991b1b!important}
    @media(max-width:600px){.game-status-controls{align-items:flex-start;flex-direction:column;gap:10px}}
  `;
  document.head.appendChild(style);

  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return; queued=true;
    requestAnimationFrame(()=>{queued=false;decorateAll();});
  });
  function boot(){decorateAll();observer.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
