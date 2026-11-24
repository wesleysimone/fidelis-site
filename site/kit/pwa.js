/* Registro do app instalável + atualização automática + botão "Instalar".
 * Uso: <script src="kit/pwa.js"></script>  e um botão com data-instalar (opcional).
 * Toda publicação nova (VERSION do sw.js maior) recarrega a página sozinha e avisa "App atualizado".
 */
(function () {
  const SCRIPT = (document.currentScript && document.currentScript.src) || location.href;
  let promptInstalar = null;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); promptInstalar = e; });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    let recarregando = false;
    const jaTinha = !!navigator.serviceWorker.controller; // 1ª visita não recarrega
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (recarregando || !jaTinha) return; recarregando = true;
      try { sessionStorage.setItem('app-atualizado', '1'); } catch (e) { }
      location.reload();
    });
    // sw.js fica na raiz do site (um nível acima de kit/). Resolver pelo endereço deste script
    // funciona em qualquer página, inclusive subpastas (/servicos/mei/).
    const swUrl = new URL('../sw.js', SCRIPT).href;
    navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' }).then((reg) => {
      const checar = () => reg.update().catch(() => {});
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checar(); });
      setInterval(checar, 60 * 1000);
    });
    try { if (sessionStorage.getItem('app-atualizado')) { sessionStorage.removeItem('app-atualizado'); setTimeout(() => window.Kit ? Kit.toast('✨ Atualizado para a versão mais nova') : null, 600); } } catch (e) { }
  }

  function instalar() {
    if (promptInstalar) { promptInstalar.prompt(); promptInstalar = null; return; }
    if (standalone()) return alertar('O app já está instalado e aberto 👍');
    const ua = navigator.userAgent;
    const txt = /iphone|ipad|ipod/i.test(ua) ? 'No iPhone (Safari): toque em Compartilhar (quadrado com seta ↑) → “Adicionar à Tela de Início” → Adicionar.'
      : /android/i.test(ua) ? 'No Android (Chrome): toque no menu ⋮ → “Instalar app” ou “Adicionar à tela inicial”.'
      : 'No computador (Chrome ou Edge): clique no ícone Instalar (monitor com seta ↓) na barra de endereço, ou menu ⋮ → “Transmitir, salvar e compartilhar” → “Instalar página como app”.';
    alertar(txt + '\n\nToda atualização chega sozinha — não precisa reinstalar.');
  }
  function alertar(t) { if (window.Kit) Kit.modal(`<h3>📲 Instalar o app</h3><p style="white-space:pre-line">${Kit.esc(t)}</p><button class="btn btn-primary btn-block" data-close>Entendi</button>`); else alert(t); }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-instalar]'); if (b) { e.preventDefault(); instalar(); } });
  window.PWA = { instalar, standalone };
})();
