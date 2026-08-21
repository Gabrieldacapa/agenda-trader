(() => {
  const CONFIG_KEY='agendaTraderConfig';

  function getConfig(){
    try{return JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}')||{}}catch(_){return{}}
  }
  function saveConfig(cfg){
    localStorage.setItem(CONFIG_KEY,JSON.stringify(cfg));
    try{if(typeof agendarSyncNuvem==='function')agendarSyncNuvem()}catch(_){}
  }

  function renameHome(){
    const first=document.querySelector('nav button');
    if(first&&first.textContent.trim()!=='Início') first.textContent='Início';
  }

  function initials(){
    const cfg=getConfig();
    const name=(cfg.nomeUsuario||'').trim();
    const email=(document.getElementById('contaEmail')?.textContent||'').trim();
    const src=name||email||'U';
    return src.split(/\s+|@/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()||'').join('').slice(0,2)||'U';
  }

  function photoMarkup(size=44){
    const cfg=getConfig();
    const photo=cfg.profilePhoto||'';
    if(photo){
      return `<img src="${photo}" alt="Foto de perfil" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;display:block;border:2px solid var(--ui-line,#e5e7eb);background:#fff">`;
    }
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;display:grid;place-items:center;background:var(--ui-accent-soft,#eaf2ff);color:var(--ui-accent,#2563eb);font-weight:900;font-size:${Math.max(12,Math.round(size*.32))}px">${initials()}</div>`;
  }

  function renderSidebarPhoto(){
    const bar=document.querySelector('.conta-barra');
    if(!bar)return;
    let box=bar.querySelector('.profile-photo-sidebar');
    if(!box){
      box=document.createElement('div');
      box.className='profile-photo-sidebar';
      box.style.cssText='display:flex;align-items:center;gap:10px;order:-1';
      bar.prepend(box);
    }
    box.innerHTML=photoMarkup(42);
  }

  function ensureSettingsCard(){
    const section=document.getElementById('configuracoes');
    if(!section||document.getElementById('profilePhotoCard'))return;

    const card=document.createElement('div');
    card.className='card';
    card.id='profilePhotoCard';
    card.innerHTML=`
      <h3>Perfil da conta</h3>
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <div id="profilePhotoPreview"></div>
        <div style="flex:1;min-width:220px">
          <div class="info" style="margin-bottom:10px">Escolha uma foto do seu celular ou computador. Ela ficará salva junto com as configurações da sua conta.</div>
          <div class="acoes" style="margin-top:0">
            <label class="btn-blue" style="display:inline-flex;align-items:center;cursor:pointer;margin:0">
              Escolher foto
              <input id="profilePhotoInput" type="file" accept="image/jpeg,image/png,image/webp" style="display:none">
            </label>
            <button id="profilePhotoRemove" class="btn-gray" type="button">Remover foto</button>
          </div>
          <div id="profilePhotoStatus" class="nota" style="margin-top:9px"></div>
        </div>
      </div>`;

    const appearance=[...section.querySelectorAll('.card')].find(c=>/Aparência/i.test(c.querySelector('h3')?.textContent||''));
    if(appearance) appearance.insertAdjacentElement('afterend',card);
    else section.appendChild(card);

    document.getElementById('profilePhotoInput')?.addEventListener('change',handlePhoto);
    document.getElementById('profilePhotoRemove')?.addEventListener('click',removePhoto);
    renderSettingsPhoto();
  }

  function renderSettingsPhoto(){
    const preview=document.getElementById('profilePhotoPreview');
    if(preview)preview.innerHTML=photoMarkup(82);
  }

  function compressImage(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error('Não foi possível ler a imagem.'));
      reader.onload=()=>{
        const img=new Image();
        img.onerror=()=>reject(new Error('Imagem inválida.'));
        img.onload=()=>{
          const size=256;
          const canvas=document.createElement('canvas');
          canvas.width=size;canvas.height=size;
          const ctx=canvas.getContext('2d');
          const scale=Math.max(size/img.width,size/img.height);
          const w=img.width*scale,h=img.height*scale;
          const x=(size-w)/2,y=(size-h)/2;
          ctx.drawImage(img,x,y,w,h);
          resolve(canvas.toDataURL('image/jpeg',0.82));
        };
        img.src=reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handlePhoto(event){
    const file=event.target.files?.[0];
    if(!file)return;
    const status=document.getElementById('profilePhotoStatus');
    if(status)status.textContent='Processando foto...';
    try{
      if(!/^image\/(jpeg|png|webp)$/i.test(file.type))throw new Error('Use uma imagem JPG, PNG ou WEBP.');
      if(file.size>12*1024*1024)throw new Error('A imagem é muito grande. Escolha uma foto de até 12 MB.');
      const data=await compressImage(file);
      const cfg=getConfig();
      cfg.profilePhoto=data;
      saveConfig(cfg);
      renderSidebarPhoto();
      renderSettingsPhoto();
      if(status)status.textContent='✅ Foto salva e sincronizada.';
    }catch(e){
      if(status)status.textContent='❌ '+(e.message||'Não foi possível salvar a foto.');
    }
    event.target.value='';
  }

  function removePhoto(){
    const cfg=getConfig();
    delete cfg.profilePhoto;
    saveConfig(cfg);
    renderSidebarPhoto();
    renderSettingsPhoto();
    const status=document.getElementById('profilePhotoStatus');
    if(status)status.textContent='Foto removida.';
  }

  function preservePhotoAcrossConfigSave(){
    if(typeof window.salvarConfiguracoes!=='function'||window.salvarConfiguracoes.__profileWrapped)return;
    const original=window.salvarConfiguracoes;
    const wrapped=function(){
      const before=getConfig();
      const photo=before.profilePhoto||'';
      const out=original.apply(this,arguments);
      if(photo){
        const after=getConfig();
        if(!after.profilePhoto){after.profilePhoto=photo;saveConfig(after);}
      }
      renderSidebarPhoto();
      renderSettingsPhoto();
      return out;
    };
    wrapped.__profileWrapped=true;
    window.salvarConfiguracoes=wrapped;
  }

  function refresh(){
    renameHome();
    preservePhotoAcrossConfigSave();
    ensureSettingsCard();
    renderSidebarPhoto();
    renderSettingsPhoto();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh);else refresh();

  const observer=new MutationObserver(()=>{
    if(document.getElementById('appPrincipal')?.style.display!=='none')refresh();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  window.addEventListener('storage',e=>{if(e.key===CONFIG_KEY)refresh()});
})();
