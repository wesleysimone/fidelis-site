/* Testes automáticos do site FIDELIS (rodam antes dos testes gerais do kit). */
(function () {
  // Troca o window.open durante o teste para não abrir o WhatsApp de verdade
  function semAbrir() {
    const original = window.open, abertos = [];
    window.open = (url) => { abertos.push(String(url)); return null; };
    return { abertos, voltar() { window.open = original; } };
  }
  const limparForm = () => { const f = document.getElementById('form-orc'); f.reset(); document.getElementById('form-erro').textContent = ''; f.querySelectorAll('.invalido').forEach((e) => e.classList.remove('invalido')); };

  window.KIT_CASOS = [
    { modulo: 'Abertura', nome: 'Slogan e botão principal aparecem', async fn(h) {
      await h.ir('#inicio', 'Abertura');
      h.ok(/Confiança que gera futuro/i.test(h.texto('.hero h1')), 'Esperava o slogan "Confiança que gera futuro"');
      const a = await h.ver('#hero-whats', 'botão Agendar diagnóstico');
      h.ok(a.href.includes('wa.me/55') && /diagn/i.test(decodeURIComponent(a.href)), 'Esperava o WhatsApp com a mensagem do diagnóstico'); } },

    { modulo: 'Serviços', nome: 'Seis serviços aparecem', async fn(h) {
      await h.ir('#servicos', 'Serviços');
      const n = document.querySelectorAll('#lista-servicos .card').length;
      h.ok(n === 6, `Esperava 6 serviços (achei ${n})`); } },

    { modulo: 'Orçamento', nome: 'Formulário avisa o que falta', async fn(h) {
      const t = semAbrir();
      try {
        await h.ir('#orcamento', 'Orçamento'); limparForm();
        await h.clicar('#form-enviar', 'Enviar pelo WhatsApp');
        h.ok(/nome/i.test(h.texto('#form-erro')) && /WhatsApp/i.test(h.texto('#form-erro')), 'Esperava aviso pedindo nome e WhatsApp');
        h.ok(t.abertos.length === 0, 'Não deveria abrir o WhatsApp com o formulário vazio');
      } finally { t.voltar(); limparForm(); } } },

    { modulo: 'Orçamento', nome: 'Formulário completo monta a mensagem do WhatsApp', async fn(h) {
      const t = semAbrir();
      try {
        await h.ir('#orcamento', 'Orçamento'); limparForm();
        await h.digitar('#f-nome', 'Maria Teste');
        await h.digitar('#f-tel', '61999998888');
        document.getElementById('f-servico').value = 'Planejamento Tributário';
        await h.clicar('#form-enviar', 'Enviar pelo WhatsApp');
        await h.esperarQue(() => t.abertos.length === 1, 'abriu o WhatsApp');
        const txt = decodeURIComponent(t.abertos[0]);
        h.ok(txt.includes('wa.me/55') && txt.includes('Maria Teste') && txt.includes('Planejamento Tributário'), 'Esperava nome e serviço na mensagem');
        h.ok(txt.includes('(61) 99999-8888'), 'Esperava o telefone formatado');
      } finally { t.voltar(); limparForm(); } } },

    { modulo: 'Contato', nome: 'Como chegar e Waze apontam para o endereço', async fn(h) {
      await h.ir('#contato', 'Contato');
      const r = await h.ver('#btn-rota', 'Como chegar'), w = await h.ver('#btn-waze', 'Waze');
      h.ok(r.href.includes('google.com/maps/dir/?api=1&destination='), 'Esperava o link do Google Maps com rota');
      h.ok(w.href.includes('waze.com/ul'), 'Esperava o link do Waze');
      h.ok(document.getElementById('mapa').src.includes('output=embed'), 'Esperava o mapa embutido'); } },

    { modulo: 'Contato', nome: 'Todos os botões de WhatsApp têm número e mensagem', async fn(h) {
      const zaps = [...document.querySelectorAll('.js-whats')];
      h.ok(zaps.length >= 4, 'Esperava pelo menos 4 botões de WhatsApp');
      zaps.forEach((a) => h.ok(/wa\.me\/55\d{10,11}\?text=/.test(a.href), `Esperava número e texto em ${a.textContent.trim() || a.id}`)); } },

    { modulo: 'Dúvidas', nome: 'Pergunta abre e fecha', async fn(h) {
      await h.ir('#duvidas', 'Dúvidas');
      const d = document.querySelector('.faq details');
      d.open = false;
      await h.clicar('.faq details summary', 'primeira pergunta');
      h.ok(d.open, 'Esperava a resposta aberta');
      d.open = false; } },

    { modulo: 'Topo / menu', nome: 'Menu leva às seções', async fn(h) {
      for (const id of ['servicos', 'proposito', 'como-funciona', 'duvidas', 'contato'])
        h.ok(!!document.querySelector(`#menu a[href="#${id}"]`) && !!document.getElementById(id), `Esperava o link e a seção #${id}`); } }
  ];
})();
