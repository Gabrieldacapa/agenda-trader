(() => {
  let deferredPrompt=null;
  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;refreshButtons()});
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;refreshButtons()});

  async function installApp(){
    if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;refreshButtons();return}
    const msg=isIOS()?'No iPhone/iPad: toque em Compartilhar e depois em “Adicionar à Tela de Início”.':'No navegador: abra o menu e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.';
    alert(msg);
  }
  async function updateApp(){
    const status=document.getElementById('appUpdateStatus');
    if(status)status.textContent='Verificando atualização...';
    try{
      if('serviceWorker' in navigator){const reg=await navigator.serviceWorker.getRegistration();if(reg)await reg.update()}
      if(status)status.textContent='✅ Verificação concluída. Recarregando a versão mais recente...';
      setTimeout(()=>location.reload(),700);
    }catch(_){if(status)status.textContent='Não foi possível verificar agora. Tente novamente.'}
  }
  function button(label,id,secondary=false){return `<button type="button" id="${id}" class="${secondary?'btn-gray':'btn-blue'} app-action-btn">${label}</button>`}
  function ensureSettings(){
    const section=document.getElementById('configuracoes');if(!section||document.getElementById('appInstallCard'))return;
    const card=document.createElement('div');card.className='card';card.id='appInstallCard';card.innerHTML=`
      <h3>Aplicativo</h3>
      <p class="info">Instale a Agenda Trader no celular ou computador para abrir como um aplicativo.</p>
      <div class="app-actions">${button('⬇ Baixar / instalar app','appInstallBtn')}${button('↻ Atualizar app','appUpdateBtn',true)}</div>
      <div id="appUpdateStatus" class="nota app-status"></div>
      <div class="app-instructions">
        <strong>Como instalar</strong>
        <div><b>Android / PC:</b> toque em <b>Baixar / instalar app</b>. Se o navegador não mostrar a instalação automática, use o menu do navegador → <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>.</div>
        <div><b>iPhone / iPad:</b> abra no Safari → <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b>.</div>
        <div><b>Atualizar:</b> toque em <b>Atualizar app</b> para buscar a versão mais recente e recarregar.</div>
      </div>`;
    section.prepend(card);
    card.querySelector('#appInstallBtn')?.addEventListener('click',installApp);card.querySelector('#appUpdateBtn')?.addEventListener('click',updateApp);
  }
  function ensureHome(){
    const agenda=document.getElementById('agenda');if(!agenda||document.getElementById('homeInstallBtn'))return;
    const h2=agenda.querySelector(':scope > h2');if(!h2)return;
    const btn=document.createElement('button');btn.type='button';btn.id='homeInstallBtn';btn.className='home-install-btn';btn.innerHTML='⬇ <span>Baixar app</span>';btn.addEventListener('click',installApp);h2.insertAdjacentElement('afterend',btn);
  }
  function refreshButtons(){const b=document.getElementById('appInstallBtn');if(b)b.textContent=isStandalone()?'✓ App instalado':'⬇ Baixar / instalar app'}
  const style=document.createElement('style');style.textContent=`
    .app-actions{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 8px}.app-action-btn{min-height:40px;padding:9px 15px;border-radius:10px;font-weight:750;cursor:pointer}.app-status{min-height:18px;margin-top:7px}.app-instructions{margin-top:14px;padding:14px 16px;border:1px solid var(--line,#e1e7ef);border-radius:12px;background:var(--field,#f8fafc);display:grid;gap:8px;font-size:13px;line-height:1.45}.app-instructions strong{font-size:15px}.home-install-btn{float:right;margin-top:-42px;display:inline-flex;align-items:center;gap:7px;padding:9px 13px;border:1px solid var(--line,#e1e7ef);border-radius:10px;background:var(--surface,#fff);color:var(--accent,#0b67f0);font-weight:750;cursor:pointer;box-shadow:0 3px 10px rgba(15,23,42,.04)}.home-install-btn:hover{background:var(--soft,#eaf2ff)}@media(max-width:650px){.home-install-btn{float:none;margin:8px 0 0}.home-install-btn span{display:inline}}
  `;document.head.appendChild(style);
  function boot(){ensureSettings();ensureHome();refreshButtons()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));else setTimeout(boot,0);
  window.addEventListener('focus',boot);
})();