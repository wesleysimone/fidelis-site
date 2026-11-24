/* KIT PROTÓTIPO — núcleo (barra amarela, janelas, marcação na tela, registro de ações)
 *
 * Funciona em QUALQUER site (página única, várias páginas ou SPA com #/rotas).
 * Ordem dos scripts no fim do <body>:
 *   kit-config.js → kit-core.js → kit-equipe.js → kit-sugestoes.js → kit-testes.js → (opcional) kit-casos.js
 * O site do cliente não precisa saber que o kit existe. Para tirar na versão final: apague os <script>/<link> do kit.
 */
(function () {
  const C = Object.assign({
    nome: 'Cliente',               // aparece nos textos e relatórios
    prefixo: 'kit',                // prefixo do localStorage (troque por cliente: 'fd', 'tw'…)
    versao: '0.1.0',
    cor: '#214A68',                // cor principal do cliente
    responsavel: 'Wesley',         // quem recebe as sugestões
    adminLocal: 'wesley',          // código de admin no modo local (demonstração)
    modos: [],                     // atalhos na barra: [{ rotulo: 'Site', href: '#/' }, { rotulo: 'App', href: '#/app' }]
    areas: ['Site', 'Geral'],      // áreas para classificar sugestões
    areaDaTela: null,              // (local) => 'Site'
    tela: null,                    // () => 'Nome amigável da tela atual'
    alvos: 'button, a, img, h1, h2, h3, h4, p, li, tr, label, input, select, textarea, .card, section > div', // o que pode ser marcado
    apiUrl: '',                    // API PHP + MySQL (servidor/api.php). Vazio = modo local
    whatsapp: '',                  // número do responsável (ex.: '5561999999999'); vazio = escolhe o contato
    barra: true                    // mostrar a barra amarela
  }, window.KIT_CONFIG || {});

  // ---------- armazenamento ----------
  const PFX = C.prefixo + ':';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(PFX + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) { } },
    del(k) { try { localStorage.removeItem(PFX + k); } catch (e) { } }
  };

  // ---------- utilidades ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ICONES = { bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>', whats: '<path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6z"/>' };
  const ic = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[n] || ''}</svg>`;
  const local = () => location.pathname.replace(/\/index\.html?$/, '/') + location.hash;   // "onde estou"
  const zap = (txt) => window.open(`https://wa.me/${C.whatsapp || ''}?text=` + encodeURIComponent(txt), '_blank', 'noopener');

  // elementos do kit ficam fora do site (não entram na marcação nem nos testes do cliente)
  const ehDoKit = (el) => !!(el && el.closest && el.closest('.kit'));
  function camada() { let c = $('#kit-camada'); if (!c) { c = document.createElement('div'); c.id = 'kit-camada'; c.className = 'kit'; document.body.appendChild(c); } return c; }

  function toast(msg, ms = 2800) {
    const t = document.createElement('div'); t.className = 'kit kit-toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), ms);
  }

  function modal(html, onMount) {
    const bg = document.createElement('div'); bg.className = 'kit kit-modal-bg';
    bg.innerHTML = `<div class="kit-modal" role="dialog" aria-modal="true">${html}</div>`;
    bg.addEventListener('click', (e) => { if (e.target === bg || e.target.closest('[data-close]')) bg.remove(); });
    camada().appendChild(bg);
    onMount && onMount(bg.firstElementChild, () => bg.remove());
    return bg;
  }

  // confirmação do próprio kit (o confirm() do navegador some em app instalado / navegadores embutidos)
  function confirmar(texto, ok = 'Confirmar') {
    if (window.__kitSemDialogos) return Promise.resolve(true); // durante o teste automático
    return new Promise((res) => {
      let respondeu = false;
      const bg = modal(`<p style="margin-top:0;font-size:16px">${esc(texto)}</p>
        <button class="btn btn-primary btn-block" id="cf-ok">${esc(ok)}</button>
        <button class="btn btn-ghost btn-block" id="cf-nao" style="margin-top:8px">Cancelar</button>`, (m, fechar) => {
        $('#cf-ok', m).onclick = () => { respondeu = true; fechar(); res(true); };
        $('#cf-nao', m).onclick = () => { respondeu = true; fechar(); res(false); };
      });
      new MutationObserver((_, o) => { if (!bg.isConnected) { o.disconnect(); if (!respondeu) res(false); } }).observe(camada(), { childList: true });
    });
  }

  // ---------- barra amarela ----------
  function barra() {
    if (!C.barra) return;
    let b = $('#kit-barra');
    if (!b) { b = document.createElement('div'); b.id = 'kit-barra'; b.className = 'kit kit-barra'; document.body.prepend(b); }
    const aqui = local();
    b.innerHTML = `<div class="kb-in">
      <span class="kb-tag">⚠ PROTÓTIPO <small>— para aprovação</small></span>
      <button class="kb-bt" id="kit-sug" title="Sugestões">${ic('bulb', 15)}<span class="kb-l"> Sugestões</span>${contSug ? ` <span class="kb-n">${contSug}</span>` : ''}</button>
      <button class="kb-bt" id="kit-testes" title="Testes">🧪<span class="kb-l"> Testes</span></button>
      ${C.modos.length ? `<nav class="kb-modos">${C.modos.map((m) => `<a href="${esc(m.href)}" class="${aqui === m.href || (m.href.length > 2 && aqui.startsWith(m.href)) ? 'on' : ''}">${esc(m.rotulo)}</a>`).join('')}</nav>` : ''}
    </div>`;
    $('#kit-sug', b).onclick = () => window.KitSugestoes && KitSugestoes.abrir();
    $('#kit-testes', b).onclick = () => window.KitTestes && KitTestes.abrir();
    document.documentElement.style.setProperty('--kit-barra-h', b.offsetHeight + 'px');
  }
  let contSug = 0;
  window.addEventListener('resize', () => { const b = $('#kit-barra'); if (b) document.documentElement.style.setProperty('--kit-barra-h', b.offsetHeight + 'px'); });

  // ---------- nome da tela atual ----------
  function telaAtual() {
    if (typeof C.tela === 'function') { try { const t = C.tela(local()); if (t) return t; } catch (e) { } }
    const t = (document.title || C.nome).split(/[|–—-]/)[0].trim();
    const h = location.hash.replace(/^#\/?/, '');
    return t + (h ? ' › ' + h.split('/').filter(Boolean).join(' › ') : '');
  }
  const limpa = (s, n = 70) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);

  // "rastro" de um elemento: tela › seção › item tocado + referência técnica (seletor a partir do <body>)
  function rastroDe(el) {
    const partes = []; let pegouCartao = false;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      let rot = a.dataset && a.dataset.rotulo;
      if (!rot && /^(SECTION|ARTICLE|ASIDE|NAV|HEADER|FOOTER|MAIN)$/.test(a.tagName)) rot = limpa(($('h1, h2, h3', a) || {}).textContent, 50) || a.id || a.getAttribute('aria-label');
      if (!rot && !pegouCartao && a.matches('.card, [class*="-card"], [class*="card-"], li')) { pegouCartao = true; const h = $('h3, h4, strong, b', a); if (h && h !== el && !h.contains(el)) rot = limpa(h.textContent, 40); }
      if (rot && !partes.includes(rot)) partes.unshift(rot);
    }
    const proprio = limpa(el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('placeholder') || (el.innerText || el.textContent || '').replace(/\n+/g, ' · ')) || el.tagName.toLowerCase();
    const caminho = [];
    for (let a = el; a && a !== document.body && caminho.length < 16; a = a.parentElement) {
      const cls = [...a.classList].filter((c) => !/^(kit-|sug-alvo|sug-marcado|teste-foco)/.test(c)).slice(0, 2).map((c) => '.' + CSS.escape(c)).join('');
      const idx = a.parentElement ? [...a.parentElement.children].indexOf(a) + 1 : 1;
      caminho.unshift((a.id && !/^\d/.test(a.id) ? '#' + CSS.escape(a.id) : a.tagName.toLowerCase() + cls) + `:nth-child(${idx})`);
    }
    return { onde: [telaAtual(), ...partes.slice(-3), `“${proprio}”`].join(' › '), filtros: [], seletor: 'body > ' + caminho.join(' > '), hash: local() };
  }
  const acharAlvo = (s) => { try { return s && s.seletor ? document.querySelector(s.seletor) : null; } catch (e) { return null; } };

  // contorno tracejado nos pontos que já têm sugestão em aberto nesta página
  let ultimas = [];
  function marcarSugeridos(lista) {
    if (lista) { ultimas = lista; contSug = lista.filter((s) => s.situacao !== 'Aprovada').length; barra(); }
    $$('.sug-marcado').forEach((e) => e.classList.remove('sug-marcado'));
    ultimas.forEach((s) => { if (s.onde && s.situacao !== 'Aprovada' && s.onde.hash === local()) { const el = acharAlvo(s.onde); if (el) el.classList.add('sug-marcado'); } });
  }

  // "toque na parte da tela": devolve o rastro do item tocado (ou null se cancelar)
  function modoMarcar(aoEscolher) {
    document.body.classList.add('kit-marcando');
    const aviso = document.createElement('div'); aviso.className = 'kit kit-marcar-aviso';
    aviso.innerHTML = `<span>🎯 <b>Toque na parte da tela</b> que você quer mudar</span><button>Cancelar</button>`;
    document.body.appendChild(aviso);
    const caixa = document.createElement('div'); caixa.className = 'kit kit-marcar-caixa'; document.body.appendChild(caixa);
    const alvoDe = (t) => !ehDoKit(t) && t !== document.body && t !== document.documentElement && (t.closest(C.alvos) || t);
    const mover = (e) => {
      const t = alvoDe(e.target); if (!t) { caixa.style.display = 'none'; return; }
      const r = t.getBoundingClientRect();
      Object.assign(caixa.style, { display: 'block', left: r.left - 4 + 'px', top: r.top - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px' });
    };
    const sair = () => {
      document.body.classList.remove('kit-marcando'); aviso.remove(); caixa.remove();
      document.removeEventListener('pointermove', mover, true); document.removeEventListener('click', clicar, true); document.removeEventListener('keydown', tecla, true);
    };
    const clicar = (e) => {
      if (aviso.contains(e.target)) { e.preventDefault(); sair(); aoEscolher(null); return; }
      const t = alvoDe(e.target); if (!t) return;
      e.preventDefault(); e.stopPropagation();
      const alvo = rastroDe(t); sair();
      $$('.sug-alvo').forEach((x) => x.classList.remove('sug-alvo')); t.classList.add('sug-alvo');
      aoEscolher(alvo);
    };
    const tecla = (e) => { if (e.key === 'Escape') { sair(); aoEscolher(null); } };
    document.addEventListener('pointermove', mover, true);
    document.addEventListener('click', clicar, true);
    document.addEventListener('keydown', tecla, true);
  }

  // abre a página/ponto de uma sugestão (mesmo se for outra página do site)
  function verPonto(onde) {
    if (!onde) return;
    if (onde.hash !== local()) { store.set('destacar', onde); location.href = onde.hash; return; }
    destacar(onde);
  }
  function destacar(onde) {
    setTimeout(() => {
      const el = acharAlvo(onde);
      if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('sug-alvo'); setTimeout(() => el.classList.remove('sug-alvo'), 4000); }
      else toast('Não achei esse ponto — a tela pode ter mudado');
    }, 400);
  }

  // ---------- registro de ações e erros (alimenta o teste manual) ----------
  // O site do cliente pode avisar ações concluídas:  Kit.registrar('acao', 'Pedido enviado')
  function registrar(tipo, msg, extra) {
    const item = { em: new Date().toISOString(), tipo, msg: String(msg).slice(0, 400), tela: local(), ...(extra || {}) };
    const l = store.get('registro', []); l.push(item); store.set('registro', l.slice(-150));
    if (window.KitTestes && KitTestes.evento) KitTestes.evento(item);
  }
  window.addEventListener('error', (e) => { if (e.message) registrar('erro', e.message, { arquivo: (e.filename || '').split('/').pop(), linha: e.lineno, coluna: e.colno, pilha: e.error && e.error.stack ? String(e.error.stack).slice(0, 600) : '' }); });
  window.addEventListener('unhandledrejection', (e) => registrar('erro', 'Falha em operação: ' + ((e.reason && e.reason.message) || e.reason), { pilha: e.reason && e.reason.stack ? String(e.reason.stack).slice(0, 600) : '' }));

  function aparelho() {
    const ua = navigator.userAgent;
    const so = /iphone|ipad/i.test(ua) ? 'iPhone/iPad' : /android/i.test(ua) ? 'Android' : /windows/i.test(ua) ? 'Windows' : /mac/i.test(ua) ? 'Mac' : 'Outro';
    const nav = /edg\//i.test(ua) ? 'Edge' : /crios|chrome/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : /firefox/i.test(ua) ? 'Firefox' : 'Navegador';
    const inst = matchMedia('(display-mode: standalone)').matches || navigator.standalone ? 'app instalado' : 'navegador';
    return `v${C.versao} · ${so} · ${nav} · tela ${innerWidth}x${innerHeight} · ${inst}`;
  }

  // ---------- troca de tela (hash, history ou página nova) ----------
  function aoMudar() {
    barra(); marcarSugeridos();
    if (window.KitTestes && KitTestes.aoMudarTela) KitTestes.aoMudarTela();
  }

  function start() {
    if (C.cor) document.documentElement.style.setProperty('--kit-cor', C.cor);
    barra();
    window.addEventListener('hashchange', () => setTimeout(aoMudar, 0));
    window.addEventListener('popstate', () => setTimeout(aoMudar, 0));
    // SPAs que trocam conteúdo sem mudar o endereço: reaplica os contornos quando o DOM muda
    let t; new MutationObserver((muts) => { if (muts.some((m) => !ehDoKit(m.target))) { clearTimeout(t); t = setTimeout(marcarSugeridos, 300); } }).observe(document.body, { childList: true, subtree: true });
    const d = store.get('destacar', null); if (d) { store.del('destacar'); destacar(d); }
    if (window.KitTestes) KitTestes.retomar();
    if (window.KitSugestoes && window.KitEquipe && (!KitEquipe.compartilhado || KitEquipe.eu().codigo)) KitSugestoes.carregar(true);
    if (window.KitTestes) KitTestes.aoMudarTela();
  }

  window.Kit = { C, store, $, $$, esc, ic, local, zap, ehDoKit, toast, modal, confirmar, barra, telaAtual, rastroDe, acharAlvo, marcarSugeridos, modoMarcar, verPonto, registrar, aparelho, start };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 0)); else setTimeout(start, 0);
})();
