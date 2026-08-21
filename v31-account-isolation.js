// Agenda Trader V31 — isolamento de dados locais por conta
(function(){
  'use strict';

  const OWNER_KEY='agendaTraderLocalOwner';
  const DATA_KEYS=['agendaTraderEstrategias','agendaTraderJogos','agendaTraderConfig'];

  function limparDadosLocaisDaConta(){
    DATA_KEYS.forEach(key=>localStorage.removeItem(key));
    localStorage.removeItem(OWNER_KEY);
    try{
      if(typeof estrategias!=='undefined')estrategias=[];
      if(typeof jogos!=='undefined')jogos=[];
    }catch(e){}
  }

  function definirDonoLocal(userId){
    if(userId)localStorage.setItem(OWNER_KEY,userId);
    else localStorage.removeItem(OWNER_KEY);
  }

  function donoLocal(){
    return localStorage.getItem(OWNER_KEY)||'';
  }

  function aplicarEstadoLocal(st,userId){
    localStorage.setItem('agendaTraderEstrategias',JSON.stringify(st?.strategies||[]));
    localStorage.setItem('agendaTraderJogos',JSON.stringify(st?.games||[]));
    localStorage.setItem('agendaTraderConfig',JSON.stringify(st?.config||{}));
    definirDonoLocal(userId);
  }

  function atualizarMemoriaERender(){
    try{
      estrategias=JSON.parse(localStorage.getItem('agendaTraderEstrategias')||'[]');
      jogos=JSON.parse(localStorage.getItem('agendaTraderJogos')||'[]');
      if(typeof carregarConfiguracoes==='function')carregarConfiguracoes();
      if(typeof atualizarFiltroEstrategiasAgenda==='function')atualizarFiltroEstrategiasAgenda();
      if(typeof renderAgenda==='function')renderAgenda();
      if(typeof renderEstrategias==='function')renderEstrategias();
      if(typeof renderHistorico==='function')renderHistorico();
    }catch(e){
      console.error('Falha ao atualizar a interface após sincronização:',e);
    }
  }

  // Substitui o carregamento antigo. Regra principal:
  // dados locais sem dono conhecido nunca são enviados automaticamente a uma conta nova.
  window.carregarNuvem=async function carregarNuvemV31(){
    if(!usuarioAtual)return;

    const cloud=document.getElementById('cloudStatus');
    if(cloud)cloud.textContent='☁️ carregando...';
    carregandoNuvem=true;

    try{
      const userId=usuarioAtual.id;
      const owner=donoLocal();

      // Se o navegador ainda contém dados identificados como sendo de outra conta,
      // remove a cópia local antes de carregar a conta atual.
      if(owner && owner!==userId){
        limparDadosLocaisDaConta();
      }

      const {data,error}=await supa.from('user_settings')
        .select('settings')
        .eq('user_id',userId)
        .maybeSingle();
      if(error)throw error;

      if(data?.settings){
        aplicarEstadoLocal(data.settings,userId);
      }else{
        // Conta sem dados online: começa vazia por segurança.
        // Só reaproveita dados locais se eles já estiverem explicitamente marcados
        // como pertencentes a esta mesma conta.
        const mesmoDono=donoLocal()===userId;
        const estado=typeof estadoLocalCompleto==='function'
          ? estadoLocalCompleto()
          : {strategies:[],games:[],config:{}};
        const temLocal=Boolean(
          estado.strategies?.length ||
          estado.games?.length ||
          Object.keys(estado.config||{}).length
        );

        if(mesmoDono && temLocal){
          const {error:saveError}=await supa.from('user_settings').upsert({
            user_id:userId,
            settings:estado
          },{onConflict:'user_id'});
          if(saveError)throw saveError;
        }else{
          const vazio={strategies:[],games:[],config:{}};
          aplicarEstadoLocal(vazio,userId);
          const {error:createError}=await supa.from('user_settings').upsert({
            user_id:userId,
            settings:vazio
          },{onConflict:'user_id'});
          if(createError)throw createError;
        }
      }

      atualizarMemoriaERender();
      if(cloud)cloud.textContent='☁️ sincronizado';
    }catch(e){
      console.error('Erro de sincronização V31:',e);
      if(cloud)cloud.textContent='⚠️ erro de sincronização';
    }finally{
      carregandoNuvem=false;
    }
  };

  // Logout seguro: tenta salvar a conta atual e depois remove a cópia local,
  // impedindo que o próximo login enxergue dados da conta anterior.
  window.sairConta=async function sairContaV31(){
    try{
      if(usuarioAtual && typeof salvarNuvemAgora==='function'){
        await salvarNuvemAgora();
      }
      await supa.auth.signOut();
    }catch(e){
      console.error('Erro ao sair:',e);
    }finally{
      limparDadosLocaisDaConta();
      localStorage.removeItem('agendaTraderRemember');
      sessionStorage.removeItem('agendaTraderSessaoAtual');
      try{usuarioAtual=null;}catch(e){}
      location.reload();
    }
  };

  // Quando a conta atual já está carregada e não havia marcador de proprietário
  // (instalações anteriores à V31), o marcador só é criado depois que a nuvem
  // comprova que existem dados dessa conta. Isso evita atribuir dados órfãos
  // automaticamente ao usuário errado.
  console.log('Agenda Trader V31: isolamento de contas carregado.');
})();
