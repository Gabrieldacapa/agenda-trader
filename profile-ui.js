(() => {
  const CONFIG_KEY='agendaTraderConfig';
  let lastSignature='';

  function getConfig(){try{return JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}')||{}}catch(_){return{}}}
  function saveConfig(cfg){localStorage.setItem(CONFIG_KEY,JSON.stringify(cfg));try{if(typeof agendarSyncNuvem==='function')agendarSyncNuvem()}catch(_){}}
  function renameHome(){const first=document.querySelector('nav button');if(first&&first.textContent.trim()!=='Início')first.textContent='Início'}
  function initials(){const cfg=getConfig();const name=(cfg.nomeUsuario||'').trim();const email=(document.getElementById('contaEmail')?.textContent||'').trim();const src=name||email||'U';return src.split(/\s+|@/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()||'').join('').slice(0,2)||'U'}
  function photoMarkup(size=52){const cfg=getConfig(),photo=cfg.profilePhoto||'';if(photo)return `<img src="${photo}" alt="Foto de perfil" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;display:block;border:2px solid #fff;box-shadow:0 0 0 1px #dbe3ee;background:#fff">`;return `<div style="width:${size}px;height:${size}px;border-radius:50%;display:grid;place-items:center;background:#eaf2ff;color:#2563eb;font-weight:900;font-size:${Math.max(13,Math.round(size*.3))}px;border:2px solid #fff;box-shadow:0 0 0 1px #dbe3ee">${initials()}</div>`}

  function renderTopProfile(force=false){
    const header=document.querySelector('header');
    if(!header)return;
    document.querySelector('.conta-barra .profile-photo-sidebar')?.remove();
    let box=header.querySelector('.profile-photo-top');
    if(!box){box=document.createElement('div');box.className='profile-photo-top';header.prepend(box)}
    const cfg=getConfig();
    const signature=(cfg.profilePhoto||'')+'|'+initials();
    if(force||signature!==lastSignature){box.innerHTML=photoMarkup(52);lastSignature=signature}
  }

  function ensureSettingsCard(){
    const section=document.getElementById('configuracoes');if(!section||document.getElementById('profilePhotoCard'))return;
    const card=document.createElement('div');card.className='card';card.id='profilePhotoCard';card.innerHTML=`<h3>Perfil da conta</h3><div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap"><div id="profilePhotoPreview"></div><div style="flex:1;min-width:220px"><div class="info" style="margin-bottom:10px">Escolha uma foto do seu celular ou computador. Ela fica salva junto com as configurações da sua conta.</div><div class="acoes" style="margin-top:0"><label class="btn-blue" style="display:inline-flex;align-items:center;cursor:pointer;margin:0">Escolher foto<input id="profilePhotoInput" type="file" accept="image/jpeg,image/png,image/webp" style="display:none"></label><button id="profilePhotoRemove" class="btn-gray" type="button">Remover foto</button></div><div id="profilePhotoStatus" class="nota" style="margin-top:9px"></div></div></div>`;
    const appearance=[...section.querySelectorAll('.card')].find(c=>/Aparência/i.test(c.querySelector('h3')?.textContent||''));if(appearance)appearance.insertAdjacentElement('afterend',card);else section.appendChild(card);
    document.getElementById('profilePhotoInput')?.addEventListener('change',handlePhoto);document.getElementById('profilePhotoRemove')?.addEventListener('click',removePhoto);renderSettingsPhoto();
  }
  function renderSettingsPhoto(){const p=document.getElementById('profilePhotoPreview');if(p){const html=photoMarkup(82);if(p.innerHTML!==html)p.innerHTML=html}}
  function compressImage(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error('Não foi possível ler a imagem.'));r.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error('Imagem inválida.'));img.onload=()=>{const s=256,c=document.createElement('canvas');c.width=s;c.height=s;const ctx=c.getContext('2d'),scale=Math.max(s/img.width,s/img.height),w=img.width*scale,h=img.height*scale;ctx.drawImage(img,(s-w)/2,(s-h)/2,w,h);resolve(c.toDataURL('image/jpeg',.82))};img.src=r.result};r.readAsDataURL(file)})}
  async function handlePhoto(e){const file=e.target.files?.[0];if(!file)return;const status=document.getElementById('profilePhotoStatus');if(status)status.textContent='Processando foto...';try{if(!/^image\/(jpeg|png|webp)$/i.test(file.type))throw new Error('Use uma imagem JPG, PNG ou WEBP.');if(file.size>12*1024*1024)throw new Error('A imagem é muito grande. Escolha uma foto de até 12 MB.');const data=await compressImage(file),cfg=getConfig();cfg.profilePhoto=data;saveConfig(cfg);renderTopProfile(true);renderSettingsPhoto();if(status)status.textContent='✅ Foto salva e sincronizada.'}catch(err){if(status)status.textContent='❌ '+(err.message||'Não foi possível salvar a foto.')}e.target.value=''}
  function removePhoto(){const cfg=getConfig();delete cfg.profilePhoto;saveConfig(cfg);renderTopProfile(true);renderSettingsPhoto();const s=document.getElementById('profilePhotoStatus');if(s)s.textContent='Foto removida.'}
  function preservePhotoAcrossConfigSave(){if(typeof window.salvarConfiguracoes!=='function'||window.salvarConfiguracoes.__profileWrapped)return;const original=window.salvarConfiguracoes;const wrapped=function(){const before=getConfig(),photo=before.profilePhoto||'',out=original.apply(this,arguments);if(photo){const after=getConfig();if(!after.profilePhoto){after.profilePhoto=photo;saveConfig(after)}}renderTopProfile(true);renderSettingsPhoto();return out};wrapped.__profileWrapped=true;window.salvarConfiguracoes=wrapped}

  const style=document.createElement('style');
  style.textContent=`
    .conta-barra::before{display:none!important;content:none!important}
    @media(min-width:901px){
      body header{height:112px!important;padding:18px 16px!important;display:grid!important;grid-template-columns:52px minmax(0,1fr)!important;grid-template-rows:auto auto!important;column-gap:14px!important;row-gap:3px!important;align-items:center!important;text-align:left!important;overflow:hidden!important}
      body header::before{display:none!important;content:none!important}
      body header .profile-photo-top{grid-column:1!important;grid-row:1/3!important;align-self:center!important;justify-self:start!important;width:52px!important;height:52px!important;overflow:hidden!important;border-radius:50%!important}
      body header .profile-photo-top img,body header .profile-photo-top>div{width:52px!important;height:52px!important;max-width:52px!important;max-height:52px!important}
      body header h1{grid-column:2!important;grid-row:1!important;align-self:end!important;margin:0!important;padding:0!important;min-width:0!important;line-height:1.05!important}
      body header h1 #tituloNome{font-size:21px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;display:block!important}
      body header small{grid-column:2!important;grid-row:2!important;align-self:start!important;margin:2px 0 0!important;max-width:165px!important;font-size:10px!important;line-height:1.25!important}
      body nav{top:112px!important}
    }
    @media(max-width:900px){
      body header{display:grid!important;grid-template-columns:48px minmax(0,1fr)!important;grid-template-rows:auto auto!important;gap:1px 10px!important;text-align:left!important;overflow:hidden!important}
      body header .profile-photo-top{grid-column:1!important;grid-row:1/3!important;align-self:center!important;width:48px!important;height:48px!important;overflow:hidden!important;border-radius:50%!important}
      body header .profile-photo-top img,body header .profile-photo-top>div{width:48px!important;height:48px!important;max-width:48px!important;max-height:48px!important}
      body header h1{grid-column:2!important;grid-row:1!important;align-self:end!important;margin:0!important;min-width:0!important}
      body header small{grid-column:2!important;grid-row:2!important;align-self:start!important;margin-top:2px!important}
    }
  `;
  document.head.appendChild(style);

  function refresh(){renameHome();preservePhotoAcrossConfigSave();ensureSettingsCard();renderTopProfile();renderSettingsPhoto()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,0));else setTimeout(refresh,0);
  window.addEventListener('storage',e=>{if(e.key===CONFIG_KEY)refresh()});window.addEventListener('focus',refresh);
})();
