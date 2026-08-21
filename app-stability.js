(() => {
  const OWNER_KEY = 'agendaTraderLocalOwnerV1';
  const DATA_KEYS = ['agendaTraderEstrategias','agendaTraderJogos','agendaTraderConfig'];

  function safeJson(raw, fallback){
    try { return JSON.parse(raw); } catch (_) { return fallback; }
  }

  function clearUserLocalData(){
    DATA_KEYS.forEach(key => localStorage.removeItem(key));
    try { if (typeof estrategias !== 'undefined') estrategias = []; } catch (_) {}
    try { if (typeof jogos !== 'undefined') jogos = []; } catch (_) {}
  }

  // Makes cloud sync resilient if one local JSON value is ever corrupted.
  if (typeof window.estadoLocalCompleto === 'function') {
    window.estadoLocalCompleto = function(){
      return {
        strategies: safeJson(localStorage.getItem('agendaTraderEstrategias') || '[]', []),
        games: safeJson(localStorage.getItem('agendaTraderJogos') || '[]', []),
        config: safeJson(localStorage.getItem('agendaTraderConfig') || '{}', {})
      };
    };
  }

  // Prevents local data from one signed-in account being uploaded into a different account
  // when both accounts are used in the same browser/device.
  if (typeof window.carregarNuvem === 'function') {
    const originalCarregarNuvem = window.carregarNuvem;
    window.carregarNuvem = async function(){
      let currentId = '';
      try { currentId = usuarioAtual?.id || ''; } catch (_) {}

      if (currentId) {
        const previousOwner = localStorage.getItem(OWNER_KEY) || '';
        if (previousOwner && previousOwner !== currentId) {
          clearUserLocalData();
        }
      }

      const result = await originalCarregarNuvem.apply(this, arguments);

      try {
        currentId = usuarioAtual?.id || currentId;
        if (currentId) localStorage.setItem(OWNER_KEY, currentId);
      } catch (_) {}

      return result;
    };
  }

  // Mark the owner as soon as an authenticated session becomes visible.
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      try {
        const currentId = usuarioAtual?.id || '';
        if (currentId && !localStorage.getItem(OWNER_KEY)) {
          localStorage.setItem(OWNER_KEY, currentId);
        }
      } catch (_) {}
    }, 1200);
  });
})();
