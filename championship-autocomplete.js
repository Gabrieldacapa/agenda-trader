(() => {
  const CHAMPIONSHIPS=[
    'Brasileirão Série A','Brasileirão Série B','Brasileirão Série C','Brasileirão Série D','Copa do Brasil','Supercopa Rei','Campeonato Paulista','Campeonato Carioca','Campeonato Mineiro','Campeonato Gaúcho','Campeonato Paranaense','Campeonato Baiano','Campeonato Pernambucano','Campeonato Cearense','Copa do Nordeste','Copa Verde',
    'Copa Libertadores','Copa Sul-Americana','Recopa Sul-Americana',
    'Premier League','Championship','FA Cup','EFL Cup','La Liga','Copa del Rey','Serie A Italiana','Coppa Italia','Bundesliga','DFB-Pokal','Ligue 1','Coupe de France','Primeira Liga','Taça de Portugal','Eredivisie','KNVB Cup','Belgian Pro League','Scottish Premiership','Süper Lig','Superliga Argentina','Copa Argentina','Primera División Uruguai','Primera División Chile','Liga MX','MLS','Saudi Pro League','J1 League','K League 1',
    'UEFA Champions League','UEFA Europa League','UEFA Conference League','UEFA Super Cup','UEFA Nations League','Eurocopa','Copa América','Copa do Mundo','Mundial de Clubes FIFA','Eliminatórias da Copa - CONMEBOL','Eliminatórias da Copa - UEFA'
  ];
  function norm(s){return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
  function score(name,q){const n=norm(name),words=n.split(/\s+/);if(n.startsWith(q))return 0;if(words.some(w=>w.startsWith(q)))return 1;if(n.includes(q))return 2;const initials=words.filter(w=>!['do','da','de','dos','das','e'].includes(w)).map(w=>w[0]).join('');if(initials.startsWith(q.replace(/\s/g,'')))return -1;return 9}
  function boot(){
    const input=document.getElementById('campeonato');if(!input||input.dataset.champReady)return;input.dataset.champReady='1';input.setAttribute('autocomplete','off');
    const wrap=document.createElement('div');wrap.className='champ-autocomplete-wrap';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
    const list=document.createElement('div');list.className='champ-autocomplete-list';wrap.appendChild(list);
    function close(){list.innerHTML='';list.style.display='none'}
    function render(){const q=norm(input.value);if(!q){close();return}const matches=CHAMPIONSHIPS.map(n=>({n,s:score(n,q)})).filter(x=>x.s<9).sort((a,b)=>a.s-b.s||a.n.localeCompare(b.n)).slice(0,8);if(!matches.length){close();return}list.innerHTML=matches.map(x=>`<button type="button" data-name="${x.n.replace(/"/g,'&quot;')}">${x.n}</button>`).join('');list.style.display='block'}
    input.addEventListener('input',render);input.addEventListener('focus',render);input.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    list.addEventListener('mousedown',e=>{const b=e.target.closest('button[data-name]');if(!b)return;e.preventDefault();input.value=b.dataset.name;input.dispatchEvent(new Event('change',{bubbles:true}));close()});
    document.addEventListener('mousedown',e=>{if(!wrap.contains(e.target))close()});
  }
  const style=document.createElement('style');style.textContent=`.champ-autocomplete-wrap{position:relative}.champ-autocomplete-list{display:none;position:absolute;z-index:1000;top:calc(100% + 5px);left:0;right:0;background:#fff;border:1px solid #dce2ea;border-radius:10px;box-shadow:0 12px 30px rgba(15,23,42,.12);padding:5px;max-height:270px;overflow:auto}.champ-autocomplete-list button{display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;color:#172033;font-weight:600;cursor:pointer}.champ-autocomplete-list button:hover{background:#eef4ff;color:#1d4ed8}body:not(.tema-claro) .champ-autocomplete-list{background:#111827;border-color:#334155}body:not(.tema-claro) .champ-autocomplete-list button{color:#e5e7eb}body:not(.tema-claro) .champ-autocomplete-list button:hover{background:#1e293b;color:#93c5fd}`;document.head.appendChild(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
