/* Central de TESTES (para pessoas sem conhecimento técnico).
 *
 * ▶️ Teste automático: o sistema usa as telas sozinho, mostrando cada passo (destaque amarelo),
 *    confere se deu certo e gera um relatório. Roda numa "caixa de areia": antes de começar guarda
 *    todos os dados deste aparelho e no fim devolve tudo como estava (não cria sugestões nem fotos).
 * 🔴 Teste manual acompanhado: "Iniciar teste" → a pessoa usa o sistema normalmente; registramos
 *    telas, botões, ações concluídas e erros. "Anotar problema" a qualquer momento. No fim, relatório.
 * Relatórios: salvos na base da equipe (compartilhada quando configurada) e enviáveis pelo WhatsKit.
 */
window.KitTestes = (function () {
  const { store, esc, toast, modal, $, $$ } = Kit;
  const dh = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const dur = (s) => s >= 60 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : `${Math.round(s)} s`;

  // =====================================================================
  // CENTRAL
  // =====================================================================
  async function abrir() {
    const e = await KitEquipe.identificar();
    const ativo = store.get('teste-ativo', null);
    const casos = todosCasos();
    modal(`
      <h3>🧪 Central de testes</h3>
      <p class="a-muted" style="margin-top:0">Olá, <b>${esc(e.nome)}</b>! Escolha como quer testar. Não precisa saber nada de programação.</p>

      <div class="t-card">
        <div class="t-ic">▶️</div>
        <div style="flex:1"><b>Teste automático</b>
          <p>O sistema testa sozinho ${casos.length} funções e <b>mostra cada passo na tela</b>. Leva cerca de ${Math.max(1, Math.round(casos.length * 2.5 / 60))} min. <b>Não altera seus dados.</b></p>
          <button class="btn btn-primary btn-block" id="t-auto">Iniciar teste automático</button></div>
      </div>

      <div class="t-card">
        <div class="t-ic">🔴</div>
        <div style="flex:1"><b>Teste manual acompanhado</b>
          <p>Toque em <b>Iniciar teste</b> e use o site normalmente. Vamos anotando sozinhos as telas, os botões e qualquer erro. Se algo estiver estranho, toque em <b>📝 Anotar problema</b>. No fim, <b>Finalizar</b> gera o relatório.</p>
          ${ativo ? `<p style="color:#B42323"><b>Há um teste em andamento</b> desde ${dh(ativo.inicio)}.</p>
            <div class="a-row" style="gap:8px"><button class="btn btn-ghost" style="flex:1" data-close>Continuar testando</button><button class="btn btn-primary" style="flex:1" id="t-fim">Finalizar agora</button></div>`
            : `<button class="btn btn-primary btn-block" id="t-manual">🔴 Iniciar teste</button>`}</div>
      </div>

      <div class="t-card">
        <div class="t-ic">📄</div>
        <div style="flex:1"><b>Relatórios de teste</b>
          <p>Todos os testes já feitos ${KitEquipe.compartilhado ? 'pela equipe' : 'neste aparelho'}, com quem testou, quando, o que funcionou e os erros.</p>
          <div id="t-lista" class="t-lista"><small class="a-muted">Carregando…</small></div></div>
      </div>
      <p class="a-muted" style="font-size:12px">${esc(Kit.aparelho())}</p>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:10px;border-color:transparent">Fechar</button>
    `, async (m, fechar) => {
      const a = $('#t-auto', m); if (a) a.onclick = () => { fechar(); rodarAutomatico(); };
      const mn = $('#t-manual', m); if (mn) mn.onclick = () => { fechar(); iniciarManual(); };
      const fi = $('#t-fim', m); if (fi) fi.onclick = () => { fechar(); finalizarManual(); };
      try {
        const l = await KitEquipe.chamar('kit_teste_listar');
        $('#t-lista', m).innerHTML = l.length ? l.slice(0, 15).map((r) => `<button class="t-rel" data-rel="${r.id}">
          <span>${r.tipo === 'automatico' ? '▶️' : '🔴'} <b>${esc(r.responsavel)}</b> · ${dh(r.criado_em)}</span>
          <span>${r.resumo.falhas ? `<b style="color:#B42323">❌ ${r.resumo.falhas}</b>` : '<b style="color:#1d7a4c">✅ sem falhas</b>'} · ${r.resumo.ok || 0} ok</span></button>`).join('') : '<small class="a-muted">Nenhum relatório ainda.</small>';
        $$('[data-rel]', m).forEach((b) => b.onclick = async () => { const rel = await KitEquipe.chamar('kit_teste_obter', { p_id: +b.dataset.rel }); if (rel) { fechar(); mostrarRelatorio(rel, { salvo: true }); } });
      } catch (e) { $('#t-lista', m).innerHTML = `<small style="color:#B42323">${esc(e.message)}</small>`; }
    });
  }

  // =====================================================================
  // TESTE AUTOMÁTICO
  // =====================================================================
  let rodando = false, parar = false, painel = null;

  function painelAuto(casos) {
    painel = document.createElement('div'); painel.id = 'teste-auto'; painel.className = 'kit teste-auto';
    painel.innerHTML = `<div class="ta-top"><b>▶️ Teste automático</b><span id="ta-cont">0/${casos.length}</span><button id="ta-parar">Parar</button></div>
      <div class="progress" style="background:#e3e8ec;height:6px"><div id="ta-barra" style="width:0;background:var(--blue)"></div></div>
      <div class="ta-agora" id="ta-agora">Preparando…</div>
      <ol class="ta-lista" id="ta-lista">${casos.map((c, i) => `<li id="ta-${i}"><span class="ta-st">⏳</span><span><small>${esc(c.modulo)}</small>${esc(c.nome)}</span></li>`).join('')}</ol>`;
    document.body.appendChild(painel);
    $('#ta-parar').onclick = () => { parar = true; $('#ta-parar').textContent = 'Parando…'; };
  }

  // ajudantes usados pelos casos de teste
  function ajudantes(caso) {
    const passo = (txt) => { caso.passos.push(txt); const a = $('#ta-agora'); if (a) a.innerHTML = `<b>${esc(caso.nome)}</b><br>${esc(txt)}`; };
    const focar = async (el) => {
      $$('.teste-foco').forEach((x) => x.classList.remove('teste-foco'));
      if (!el) return;
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      el.classList.add('teste-foco'); await esperar(380);
    };
    const achar = async (sel, ms = 4000, raiz = document) => {
      const fim = Date.now() + ms;
      while (Date.now() < fim) { const el = typeof sel === 'function' ? sel() : raiz.querySelector(sel); if (el) return el; await esperar(80); }
      throw new Error(`Não encontrei na tela: ${typeof sel === 'function' ? 'elemento esperado' : sel}`);
    };
    return {
      passo,
      esperar,
      async ir(endereco, nome) {
        passo(`Abrindo ${nome || endereco}`);
        const alvo = new URL(endereco, location.href);
        if (alvo.pathname !== location.pathname) throw Object.assign(new Error(`Este caso precisa da página ${alvo.pathname}: abra-a e rode o teste de lá`), { aviso: true });
        if (alvo.hash !== location.hash) location.hash = alvo.hash; else window.dispatchEvent(new HashChangeEvent('hashchange'));
        if (!alvo.hash || !alvo.hash.startsWith('#/')) window.scrollTo(0, 0);
        await esperar(450);
      },
      achar,
      async ver(sel, desc) { passo(desc ? `Conferindo: ${desc}` : `Procurando ${sel}`); const el = await achar(sel); await focar(el); return el; },
      async clicar(sel, desc) { const el = typeof sel === 'string' || typeof sel === 'function' ? await achar(sel) : sel; passo(`Tocando em “${desc || (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40)}”`); await focar(el); el.click(); await esperar(350); return el; },
      async digitar(sel, txt, desc) { const el = await achar(sel); passo(`Digitando ${desc || ''} “${txt}”`); await focar(el); el.value = txt; el.dispatchEvent(new Event('input', { bubbles: true })); await esperar(250); return el; },
      ok(cond, msg) { if (!cond) throw new Error(msg); passo('✓ ' + msg.replace(/^Esperava /, '')); },
      async esperarQue(fn, msg, ms = 5000) { const fim = Date.now() + ms; while (Date.now() < fim) { if (await fn()) { passo('✓ ' + msg); return; } await esperar(120); } throw new Error('Não aconteceu: ' + msg); },
      texto: (sel) => (($(sel) || {}).innerText || '')
    };
  }

  // ---------------------------------------------------------------------
  // CASOS DE TESTE
  // Os casos do SITE ficam em kit-casos.js (um por cliente):  window.KIT_CASOS = [ { modulo, nome, async fn(h) { ... } } ]
  // Ajudantes (h): ir(endereco, nome) · ver(seletor, desc) · clicar(seletor, desc) · digitar(seletor, texto) ·
  //                ok(condição, 'Esperava …') · esperarQue(() => cond, 'msg') · achar(seletor) · texto(seletor) · passo(txt) · esperar(ms)
  // Os casos abaixo valem para QUALQUER site e rodam depois dos do cliente.
  // ---------------------------------------------------------------------
  const CASOS_GERAIS = [
    { modulo: 'Site', nome: 'Página abre com conteúdo e título', async fn(h) {
      await h.ir(inicio(), 'a página inicial');
      h.ok(document.title.trim().length > 0, 'Esperava um título na aba do navegador');
      h.ok(conteudo().length > 80, 'Esperava conteúdo na página'); } },
    { modulo: 'Site', nome: 'Imagens carregam (nenhuma quebrada)', async fn(h) {
      await h.ir(inicio(), 'a página inicial'); h.passo('Conferindo as imagens');
      const imgs = $$('img').filter((i) => !Kit.ehDoKit(i) && i.loading !== 'lazy');
      await h.esperarQue(() => imgs.every((i) => i.complete), 'as imagens terminaram de carregar', 8000);
      const quebradas = imgs.filter((i) => i.naturalWidth === 0).map((i) => i.getAttribute('src'));
      h.ok(!quebradas.length, `Esperava todas as imagens ok (quebradas: ${quebradas.join(', ')})`); } },
    { modulo: 'Site', nome: 'Links internos levam a páginas que existem', async fn(h) {
      const links = [...new Set($$('a[href]').filter((a) => !Kit.ehDoKit(a) && a.origin === location.origin && !a.hash && a.pathname !== location.pathname && !/\.(pdf|jpg|png|zip)$/i.test(a.pathname)).map((a) => a.href))].slice(0, 25);
      h.passo(`Conferindo ${links.length} link(s) internos`);
      const ruins = []; for (const u of links) { try { const r = await fetch(u, { cache: 'no-store' }); if (!r.ok) ruins.push(u + ' (' + r.status + ')'); } catch (e) { ruins.push(u); } }
      h.ok(!ruins.length, `Esperava todos os links funcionando (com problema: ${ruins.join(', ')})`); } },
    { modulo: 'Site', nome: 'Âncoras do menu levam às seções', async fn(h) {
      const ancoras = $$('a[href^="#"]').filter((a) => !Kit.ehDoKit(a) && a.getAttribute('href').length > 1 && !a.getAttribute('href').startsWith('#/'));
      h.passo(`Conferindo ${ancoras.length} âncora(s)`);
      const faltando = ancoras.map((a) => a.getAttribute('href')).filter((hh) => { try { return !document.querySelector(hh); } catch (e) { return true; } });
      h.ok(!faltando.length, `Esperava todas as seções existentes (faltando: ${[...new Set(faltando)].join(', ')})`); } },
    { modulo: 'Contato', nome: 'Links de WhatsApp, telefone e e-mail estão certos', async fn(h) {
      const zaps = $$('a[href*="wa.me"], a[href*="whatsapp"]').filter((a) => !Kit.ehDoKit(a));
      const tels = $$('a[href^="tel:"]'); const mails = $$('a[href^="mailto:"]');
      h.passo(`${zaps.length} WhatsApp · ${tels.length} telefone · ${mails.length} e-mail`);
      zaps.forEach((a) => h.ok(/wa\.me\/\d{10,13}|phone=\d{10,13}/.test(a.href), `Esperava número completo no WhatsApp (${a.href.slice(0, 60)})`));
      tels.forEach((a) => h.ok(/^tel:\+?\d{8,13}$/.test(a.getAttribute('href').replace(/[\s()-]/g, '')), `Esperava telefone válido (${a.getAttribute('href')})`));
      if (!zaps.length && !tels.length && !mails.length) throw Object.assign(new Error('Nenhum contato (WhatsApp, telefone ou e-mail) encontrado nesta página'), { aviso: true }); } },
    { modulo: 'Celular', nome: 'Página cabe na tela do celular (sem rolar para o lado)', async fn(h) {
      await h.ir(inicio(), 'a página inicial'); h.passo('Medindo a largura da página');
      const sobra = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      h.ok(sobra <= 2, `Esperava a página sem rolagem lateral (sobra ${sobra}px)`);
      h.ok(!!$('meta[name="viewport"]'), 'Esperava a configuração de tela de celular (meta viewport)'); } },
    { modulo: 'Busca no Google', nome: 'Título, descrição e ícone da página', async fn(h) {
      const d = $('meta[name="description"]');
      h.ok(d && d.content.trim().length >= 50, 'Esperava uma descrição da página (meta description) com 50+ letras');
      h.ok(!!$('link[rel~="icon"]'), 'Esperava o ícone da aba (favicon)');
      if ($('meta[name="robots"][content*="noindex"]')) h.passo('ℹ Protótipo escondido do Google (noindex) — tirar na versão final'); } },
    { modulo: 'Sugestões', nome: 'Central de sugestões abre e troca de aba', async fn(h) {
      await KitSugestoes.abrir('lista'); await h.ver('#central-sug .central-abas', 'abas da central');
      for (const a of ['nova', 'aprovar', 'aprovadas', 'lista']) await h.clicar(`#central-sug [data-aba="${a}"]`, a);
      KitSugestoes.fechar(); } },
    { modulo: 'Sugestões', nome: 'Salvar e enviar uma sugestão', async fn(h) {
      if (KitEquipe.compartilhado) { h.passo('Pulado na lista compartilhada (não grava sugestão de teste no banco real)'); return; }
      const nome = KitEquipe.eu().nome;
      const s = await KitEquipe.chamar('kit_sug_criar', { p_solicitante: nome, p_descricao: '[teste automático] sugestão de exemplo', p_area: 'Geral' });
      await KitSugestoes.abrir('lista'); await h.ver('#c-enviar:not([disabled])', 'botão Enviar liberado');
      await h.clicar('#c-enviar', 'Enviar minhas sugestões');
      await h.clicar('#env-ok', 'confirmar o envio');
      await h.esperarQue(async () => { const l = await KitEquipe.chamar('kit_sug_listar'); const x = l.find((y) => y.id === s.id); return x && x.situacao === 'Enviada' && x.enviada_por === nome; }, 'a sugestão ficou “Enviada” com nome e hora');
      KitSugestoes.fechar(); } },
    { modulo: 'Aplicativo', nome: 'App instalável e atualização automática', async fn(h) {
      const lk = $('link[rel="manifest"]');
      if (!lk) throw Object.assign(new Error('Site sem app instalável (manifest) — normal se o cliente não pediu app'), { aviso: true });
      h.passo('Lendo o manifesto do app'); const man = await (await fetch(lk.href, { cache: 'no-store' })).json();
      h.ok(man.icons && man.icons.length >= 2 && man.start_url, 'Esperava manifesto com ícones e página inicial');
      for (const i of man.icons) { const r = await fetch(new URL(i.src, lk.href), { cache: 'no-store' }); h.ok(r.ok, `Ícone ${i.src} carregou`); }
      if (!('serviceWorker' in navigator)) throw Object.assign(new Error('Este navegador não suporta app instalável'), { aviso: true });
      const r = await navigator.serviceWorker.getRegistration(); h.ok(!!r, 'Esperava o serviço de atualização automática registrado'); } }
  ];
  const inicio = () => (Kit.C.inicio || (location.pathname.replace(/[^/]*$/, '') + (location.hash.startsWith('#/') ? '#/' : '')));
  const conteudo = () => [...document.body.children].filter((e) => !Kit.ehDoKit(e) && !/SCRIPT|STYLE/.test(e.tagName)).map((e) => e.innerText).join(' ').trim();
  const todosCasos = () => [...(window.KIT_CASOS || []), ...CASOS_GERAIS];

  async function rodarAutomatico() {
    if (rodando) return;
    const quem = (await KitEquipe.identificar()).nome;
    rodando = true; parar = false;
    const casos = todosCasos().map((c) => ({ ...c, passos: [], status: 'pendente' }));
    // ---- caixa de areia: guarda tudo e bloqueia efeitos externos ----
    const copia = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(Kit.C.prefixo + ':')) copia[k] = localStorage.getItem(k); }
    const ganchos = Kit.C.sandbox || {}; try { ganchos.antes && ganchos.antes(); } catch (e) { }
    const orig = { open: window.open, confirm: window.confirm, prompt: window.prompt, alert: window.alert, hash: location.hash };
    window.open = () => null; window.confirm = () => true; window.__kitSemDialogos = true; window.prompt = () => null; window.alert = () => {};
    let erroAtual = null; const pegaErro = (e) => { erroAtual = (e && (e.message || (e.reason && e.reason.message))) || 'Erro'; };
    window.addEventListener('error', pegaErro); window.addEventListener('unhandledrejection', pegaErro);
    document.body.classList.add('testando');
    painelAuto(casos);
    const inicio = new Date();
    for (let i = 0; i < casos.length; i++) {
      if (parar) { casos.slice(i).forEach((c) => { c.status = 'nao-rodou'; }); break; }
      const c = casos[i]; const li = $('#ta-' + i); li.classList.add('agora'); li.querySelector('.ta-st').textContent = '▶️';
      li.scrollIntoView({ block: 'nearest' });
      $('#ta-cont').textContent = `${i + 1}/${casos.length}`; $('#ta-barra').style.width = `${(i / casos.length) * 100}%`;
      const t0 = performance.now(); erroAtual = null;
      try {
        await Promise.race([c.fn(ajudantes(c)), esperar(c.tempo || 20000).then(() => { throw new Error('Demorou demais (travou?)'); })]);
        if (erroAtual) throw new Error('Erro durante o teste: ' + erroAtual);
        c.status = 'ok';
      } catch (e) {
        c.status = e.aviso ? 'aviso' : 'falha'; c.erro = e.message; c.tela = Kit.telaAtual(); c.tecnico = (e.stack || '').split('\n').slice(0, 3).join(' | ');
      }
      c.ms = Math.round(performance.now() - t0);
      li.classList.remove('agora'); li.classList.add(c.status); li.querySelector('.ta-st').textContent = { ok: '✅', falha: '❌', aviso: '⚠️' }[c.status];
      if (c.erro) li.insertAdjacentHTML('beforeend', `<small class="ta-erro">${esc(c.erro)}</small>`);
      $$('.teste-foco').forEach((x) => x.classList.remove('teste-foco'));
    }
    $('#ta-barra').style.width = '100%';
    // ---- devolve tudo como estava ----
    window.removeEventListener('error', pegaErro); window.removeEventListener('unhandledrejection', pegaErro);
    const reg = Kit.C.prefixo + ':registro';
    Object.keys(localStorage).filter((k) => k.startsWith(Kit.C.prefixo + ':') && !(k in copia) && k !== reg).forEach((k) => localStorage.removeItem(k));
    Object.entries(copia).forEach(([k, v]) => { if (k !== reg) localStorage.setItem(k, v); });
    try { ganchos.depois && ganchos.depois(); } catch (e) { }
    Object.assign(window, { open: orig.open, confirm: orig.confirm, prompt: orig.prompt, alert: orig.alert }); window.__kitSemDialogos = false;
    document.body.classList.remove('testando');
    $$('.kit-modal-bg').forEach((m) => m.remove()); KitSugestoes.fechar(); KitSugestoes.carregar(true); // contador volta ao real
    if (location.hash !== orig.hash) location.hash = orig.hash; window.scrollTo(0, 0);
    painel.remove(); rodando = false;

    const fim = new Date();
    const rel = {
      tipo: 'automatico', responsavel: quem, inicio: inicio.toISOString(), fim: fim.toISOString(), duracao: (fim - inicio) / 1000,
      aparelho: Kit.aparelho(), versao: Kit.VERSAO, base: KitEquipe.compartilhado ? 'compartilhada' : 'local',
      casos: casos.map(({ fn, passos, ...c }) => ({ ...c, passos: passos.slice(-6) })),
      resumo: { total: casos.length, ok: casos.filter((c) => c.status === 'ok').length, falhas: casos.filter((c) => c.status === 'falha').length, avisos: casos.filter((c) => c.status === 'aviso').length, nao_rodou: casos.filter((c) => c.status === 'nao-rodou').length }
    };
    Kit.registrar(rel.resumo.falhas ? 'erro' : 'acao', `Teste automático: ${rel.resumo.ok}/${rel.resumo.total} ok, ${rel.resumo.falhas} falha(s)`);
    await salvarRelatorio(rel);
    mostrarRelatorio(rel, { salvo: true });
  }

  // =====================================================================
  // TESTE MANUAL ACOMPANHADO
  // =====================================================================
  const ativo = () => store.get('teste-ativo', null);
  function anotar(ev) {
    const t = ativo(); if (!t) return;
    t.eventos.push({ em: new Date().toISOString(), tela: Kit.telaAtual(), hash: location.hash || '#/', ...ev });
    if (t.eventos.length > 600) t.eventos = t.eventos.slice(-600);
    store.set('teste-ativo', t); barra();
  }

  async function iniciarManual() {
    const quem = (await KitEquipe.identificar()).nome;
    store.set('teste-ativo', { id: Date.now(), responsavel: quem, inicio: new Date().toISOString(), aparelho: Kit.aparelho(), eventos: [{ em: new Date().toISOString(), tipo: 'tela', tela: Kit.telaAtual(), hash: location.hash || '#/', msg: 'Início do teste' }] });
    ligarMonitor(); barra();
    modal(`<h3>🔴 Teste iniciado</h3>
      <p>Agora é só <b>usar o site normalmente</b>: navegue pelas páginas, toque nos botões, preencha os formulários, teste no celular…</p>
      <p>A barra vermelha embaixo mostra que estamos anotando. Viu algo estranho? Toque em <b>📝 Anotar problema</b>.</p>
      <p>Quando terminar, toque em <b>⏹ Finalizar</b> para ver e enviar o relatório.</p>
      <button class="btn btn-primary btn-block" data-close>Começar</button>`);
  }

  let relogio = null;
  function barra() {
    const t = ativo(); let b = $('#teste-barra');
    if (!t) { b && b.remove(); document.body.classList.remove('com-teste'); clearInterval(relogio); relogio = null; return; }
    if (!b) {
      b = document.createElement('div'); b.id = 'teste-barra'; b.className = 'kit teste-barra'; document.body.appendChild(b);
      document.body.classList.add('com-teste');
      relogio = setInterval(barra, 1000);
    }
    const s = (Date.now() - new Date(t.inicio)) / 1000;
    const n = (tp) => t.eventos.filter((e) => e.tipo === tp).length;
    b.innerHTML = `<span class="tb-rec">●</span><span class="tb-info"><b>Teste em andamento</b> · ${dur(s)}<small>${new Set(t.eventos.filter((e) => e.tipo === 'tela').map((e) => e.tela)).size} telas · ${n('sucesso')} ações ok · <span style="${n('erro') ? 'color:#ffb3b3;font-weight:800' : ''}">${n('erro')} erro(s)</span> · ${n('problema')} anotação(ões)</small></span>
      <button id="tb-anotar" aria-label="Anotar problema">📝<span class="tb-l"> Anotar problema</span></button><button id="tb-fim" aria-label="Finalizar teste">⏹<span class="tb-l"> Finalizar</span></button>`;
    $('#tb-anotar', b).onclick = anotarProblema; $('#tb-fim', b).onclick = finalizarManual;
  }

  function anotarProblema(alvo) {
    alvo = alvo && alvo.onde ? alvo : null;
    modal(`<h3>📝 Anotar problema</h3>
      <p class="a-muted" style="margin-top:0">Conte o que aconteceu, do seu jeito. Ex.: “cliquei em Agendar e nada aconteceu”.</p>
      ${alvo ? `<div class="rastro"><small>📍 Onde</small><b>${esc(alvo.onde)}</b></div>` : `<button class="btn btn-block marcar-btn" id="pr-marcar">🎯 Marcar na tela onde foi (opcional)</button>`}
      <p class="a-muted" style="font-size:13px;margin:8px 0">Tela atual: <b>${esc(Kit.telaAtual())}</b></p>
      <textarea id="pr-txt" rows="3" placeholder="O que aconteceu?">${esc(store.get('pr-rasc', ''))}</textarea>
      <button class="btn btn-primary btn-block" id="pr-ok">Salvar anotação</button>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:8px">Cancelar</button>`, (m, f) => {
      const tx = $('#pr-txt', m); tx.oninput = () => store.set('pr-rasc', tx.value); setTimeout(() => tx.focus(), 50);
      const mk = $('#pr-marcar', m); if (mk) mk.onclick = () => { f(); Kit.modoMarcar((a) => anotarProblema(a)); };
      $('#pr-ok', m).onclick = () => { const v = tx.value.trim(); if (!v) return tx.focus(); anotar({ tipo: 'problema', msg: v, onde: alvo }); store.set('pr-rasc', ''); f(); toast('📝 Problema anotado no teste'); };
    });
  }

  // nomes amigáveis das funcionalidades a partir das telas e ações
  // Kit.C.funcionalidades = [[/regex da ação ou tela/, 'Nome amigável'], ...]
  function funcionalidade(e) {
    const m = (e.msg || '') + ' ' + (e.tela || '');
    if (/Sugest|Apoiou|Admin:/i.test(e.msg || '')) return 'Sugestões';
    for (const [re, nome] of (Kit.C.funcionalidades || [])) if (re.test(m)) return nome;
    return (e.tela || 'Site').split(' › ').slice(0, 2).join(' › ');
  }

  async function finalizarManual() {
    const t = ativo(); if (!t) return;
    const fim = new Date();
    const ev = t.eventos;
    const telas = [...new Set(ev.filter((e) => e.tipo === 'tela').map((e) => e.tela))];
    const contFunc = {}; ev.filter((e) => ['tela', 'sucesso', 'clique'].includes(e.tipo)).forEach((e) => { const f = funcionalidade(e); contFunc[f] = (contFunc[f] || 0) + 1; });
    const erros = ev.filter((e) => e.tipo === 'erro').map((e) => ({ em: e.em, tela: e.tela, descricao: e.msg, tecnico: [e.arquivo && `${e.arquivo}:${e.linha}:${e.coluna}`, e.pilha].filter(Boolean).join(' | ') }));
    const problemas = ev.filter((e) => e.tipo === 'problema').map((e) => ({ em: e.em, tela: e.tela, descricao: e.msg, onde: e.onde ? e.onde.onde : '', ref: e.onde ? `${e.onde.hash} | ${e.onde.seletor}` : e.hash }));
    const sucessos = ev.filter((e) => e.tipo === 'sucesso').map((e) => ({ em: e.em, tela: e.tela, descricao: e.msg }));
    const rel = {
      tipo: 'manual', responsavel: t.responsavel, inicio: t.inicio, fim: fim.toISOString(), duracao: (fim - new Date(t.inicio)) / 1000,
      aparelho: Kit.aparelho(), versao: Kit.VERSAO, base: KitEquipe.compartilhado ? 'compartilhada' : 'local',
      telas, funcionalidades: Object.entries(contFunc).map(([nome, vezes]) => ({ nome, vezes })).sort((a, b) => b.vezes - a.vezes),
      sucessos, erros, problemas, cliques: ev.filter((e) => e.tipo === 'clique').length,
      linha_do_tempo: ev.slice(-80).map((e) => ({ em: e.em, tipo: e.tipo, tela: e.tela, msg: e.msg })),
      resumo: { total: sucessos.length + erros.length + problemas.length, ok: sucessos.length, falhas: erros.length + problemas.length, erros: erros.length, problemas: problemas.length, telas: telas.length }
    };
    store.set('teste-ativo', null); barra(); desligarMonitor();
    await salvarRelatorio(rel);
    mostrarRelatorio(rel, { salvo: true });
  }

  // monitor: cliques, telas e console.error (só enquanto há teste manual ativo)
  let consoleOrig = null;
  const aoClicar = (e) => {
    if (!ativo() || Kit.ehDoKit(e.target)) return;
    const el = e.target.closest('button, a, [role=button], input[type=checkbox], input[type=radio], select, summary'); if (!el) return;
    const rot = (el.getAttribute('aria-label') || el.innerText || el.title || el.value || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 50);
    anotar({ tipo: 'clique', msg: rot });
  };
  function ligarMonitor() {
    document.addEventListener('click', aoClicar, true);
    if (!consoleOrig) { consoleOrig = console.error; console.error = function (...a) { try { Kit.registrar('erro', 'console: ' + a.map((x) => (x && x.message) || String(x)).join(' ').slice(0, 300)); } catch (e) { } return consoleOrig.apply(console, a); }; }
  }
  function desligarMonitor() { document.removeEventListener('click', aoClicar, true); if (consoleOrig) { console.error = consoleOrig; consoleOrig = null; } }

  // chamado pelo Kit.registrar e a cada troca de tela
  function evento(item) { if (!ativo()) return; anotar({ tipo: item.tipo === 'erro' ? 'erro' : 'sucesso', msg: item.msg, arquivo: item.arquivo, linha: item.linha, coluna: item.coluna, pilha: item.pilha }); }
  let ultimaTela = '';
  function aoMudarTela() { if (!ativo()) return; const t = Kit.telaAtual(); if (t !== ultimaTela) { ultimaTela = t; anotar({ tipo: 'tela', msg: 'Abriu ' + t }); } }

  // retoma o teste se a página recarregar
  function retomar() { if (ativo()) { ligarMonitor(); barra(); } }

  // =====================================================================
  // RELATÓRIOS
  // =====================================================================
  async function salvarRelatorio(rel) {
    const resumo = { ...rel.resumo, duracao: rel.duracao };
    try { rel.id = await KitEquipe.chamar('kit_teste_salvar', { p_responsavel: rel.responsavel, p_tipo: rel.tipo, p_resumo: resumo, p_relatorio: rel }); }
    catch (e) { toast('⚠️ Não consegui salvar o relatório: ' + e.message, 5000); store.set('relatorio-pendente', rel); }
  }

  function textoRelatorio(r) {
    const cab = `*Relatório de teste ${r.tipo === 'automatico' ? 'AUTOMÁTICO' : 'MANUAL'} — ${Kit.C.nome}*\n👤 ${r.responsavel}\n🕒 ${dh(r.inicio)} → ${dh(r.fim)} (${dur(r.duracao)})\n🛠 ${r.aparelho}\n`;
    if (r.tipo === 'automatico') {
      return cab + `\n*Resultado:* ✅ ${r.resumo.ok} ok · ❌ ${r.resumo.falhas} falha(s) · ⚠️ ${r.resumo.avisos} aviso(s) de ${r.resumo.total}\n\n` +
        r.casos.map((c) => `${{ ok: '✅', falha: '❌', aviso: '⚠️', 'nao-rodou': '⏸' }[c.status] || '•'} [${c.modulo}] ${c.nome}${c.erro ? `\n   ↳ ${c.erro}${c.tela ? ` (tela: ${c.tela})` : ''}` : ''}`).join('\n');
    }
    return cab + `\n*Funcionalidades usadas:* ${r.funcionalidades.map((f) => f.nome).join(', ') || '—'}\n*Telas:* ${r.telas.length} · *Cliques:* ${r.cliques}\n` +
      `\n*✅ Concluído com sucesso (${r.sucessos.length})*\n${r.sucessos.slice(-15).map((s) => `• ${s.descricao}`).join('\n') || '—'}\n` +
      `\n*❌ Erros do sistema (${r.erros.length})*\n${r.erros.map((e) => `• ${dh(e.em).slice(11)} · ${e.tela}\n   ${e.descricao}${e.tecnico ? `\n   🔧 ${e.tecnico.slice(0, 200)}` : ''}`).join('\n') || '—'}\n` +
      `\n*📝 Problemas anotados (${r.problemas.length})*\n${r.problemas.map((p) => `• ${p.tela}${p.onde ? ` › ${p.onde}` : ''}\n   ${p.descricao}`).join('\n') || '—'}`;
  }

  function mostrarRelatorio(r, { salvo } = {}) {
    const st = { ok: '✅', falha: '❌', aviso: '⚠️', 'nao-rodou': '⏸' };
    modal(`
      <h3>📄 Relatório — teste ${r.tipo === 'automatico' ? 'automático' : 'manual'}</h3>
      <div class="r-cab"><div><small>Responsável</small><b>${esc(r.responsavel)}</b></div><div><small>Data e horário</small><b>${dh(r.inicio)}</b></div><div><small>Duração</small><b>${dur(r.duracao)}</b></div></div>
      <div class="r-res">
        <span class="r-n ok">✅ ${r.resumo.ok}<small>${r.tipo === 'automatico' ? 'funcionando' : 'ações ok'}</small></span>
        <span class="r-n falha">❌ ${r.tipo === 'automatico' ? r.resumo.falhas : r.erros.length}<small>${r.tipo === 'automatico' ? 'com falha' : 'erros'}</small></span>
        ${r.tipo === 'automatico' ? `<span class="r-n aviso">⚠️ ${r.resumo.avisos}<small>avisos</small></span>` : `<span class="r-n aviso">📝 ${r.problemas.length}<small>anotados</small></span>`}
      </div>
      ${r.tipo === 'automatico' ? `<ul class="r-lista">${r.casos.map((c) => `<li class="${c.status}"><span>${st[c.status] || '•'}</span><div><small>${esc(c.modulo)}${c.ms ? ` · ${(c.ms / 1000).toFixed(1)} s` : ''}</small>${esc(c.nome)}${c.erro ? `<div class="r-erro">${esc(c.erro)}${c.tela ? `<br><small>Tela: ${esc(c.tela)}</small>` : ''}${c.passos && c.passos.length ? `<br><small>Últimos passos: ${esc(c.passos.join(' → '))}</small>` : ''}</div>` : ''}</div></li>`).join('')}</ul>`
      : `<div class="a-section-title">Funcionalidades utilizadas</div><p style="margin:0">${r.funcionalidades.map((f) => `<span class="chip blue" style="margin:2px">${esc(f.nome)}</span>`).join('') || '—'}</p>
        <div class="a-section-title">Processos concluídos com sucesso (${r.sucessos.length})</div>
        <ul class="r-lista">${r.sucessos.slice(-20).map((s) => `<li class="ok"><span>✅</span><div><small>${dh(s.em).slice(11)} · ${esc(s.tela)}</small>${esc(s.descricao)}</div></li>`).join('') || '<li>—</li>'}</ul>
        <div class="a-section-title">Erros identificados (${r.erros.length})</div>
        <ul class="r-lista">${r.erros.map((e) => `<li class="falha"><span>❌</span><div><small>${dh(e.em).slice(11)} · ${esc(e.tela)}</small>${esc(e.descricao)}${e.tecnico ? `<div class="r-erro"><small>🔧 ${esc(e.tecnico.slice(0, 300))}</small></div>` : ''}</div></li>`).join('') || '<li>Nenhum erro 🎉</li>'}</ul>
        <div class="a-section-title">Problemas anotados (${r.problemas.length})</div>
        <ul class="r-lista">${r.problemas.map((p) => `<li class="aviso"><span>📝</span><div><small>${dh(p.em).slice(11)} · ${esc(p.tela)}${p.onde ? ' › ' + esc(p.onde) : ''}</small>${esc(p.descricao)}</div></li>`).join('') || '<li>—</li>'}</ul>`}
      <p class="a-muted" style="font-size:12px">🛠 ${esc(r.aparelho)} · base ${esc(r.base || '')} ${salvo && r.id ? `· relatório nº ${r.id} salvo ✓` : ''}</p>
      <button class="btn btn-ok btn-block" id="r-zap">📤 Enviar relatório pelo WhatsApp</button>
      <div class="a-row" style="gap:8px;margin-top:8px">
        <button class="btn btn-ghost btn-sm" style="flex:1" id="r-copiar">Copiar texto</button>
        ${(r.tipo === 'manual' && (r.erros.length || r.problemas.length)) || (r.tipo === 'automatico' && r.resumo.falhas) ? `<button class="btn btn-ghost btn-sm" style="flex:1" id="r-sug">💡 Virar sugestões</button>` : ''}
      </div>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:8px;border-color:transparent">Fechar</button>
    `, (m, fechar) => {
      $('#r-zap', m).onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(textoRelatorio(r)), '_blank', 'noopener');
      $('#r-copiar', m).onclick = () => { try { navigator.clipboard.writeText(textoRelatorio(r)); toast('Relatório copiado ✓'); } catch (e) { toast('Não deu para copiar'); } };
      const sg = $('#r-sug', m);
      if (sg) sg.onclick = async () => {
        const itens = r.tipo === 'automatico' ? r.casos.filter((c) => c.status === 'falha').map((c) => ({ area: c.modulo, d: `[Teste automático] Falhou: ${c.nome} — ${c.erro}`, tela: c.tela || '' }))
          : [...r.erros.map((e) => ({ area: 'Geral', d: `[Erro no teste] ${e.descricao}`, tela: e.tela, obs: e.tecnico })), ...r.problemas.map((p) => ({ area: 'Geral', d: p.descricao, tela: p.tela, obs: p.onde ? 'Onde: ' + p.onde : '' }))];
        if (!(await Kit.confirmar(`Criar ${itens.length} sugestão(ões) na lista da equipe a partir deste relatório?`, 'Criar'))) return;
        let n = 0; for (const i of itens) { try { await KitEquipe.chamar('kit_sug_criar', { p_solicitante: r.responsavel, p_descricao: i.d.slice(0, 2900), p_area: i.area, p_tela: i.tela, p_onde: null, p_observacoes: (i.obs || '').slice(0, 2900), p_afeta: null }); n++; } catch (e) { } }
        toast(`💡 ${n} sugestão(ões) criadas`); fechar(); KitSugestoes.abrir('lista');
      };
    });
  }

  return { abrir, evento, aoMudarTela, retomar, rodarAutomatico, iniciarManual, finalizarManual, mostrarRelatorio, casos: todosCasos };
})();
