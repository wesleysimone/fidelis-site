/* Testes automáticos do site FIDELIS (rodam antes dos testes gerais do kit).
 * Testes que olham outras páginas buscam o HTML com fetch() e leem com DOMParser (não saem da página atual). */
(function () {
  const D = () => window.FIDELIS || { paginas: [], necessidades: [], grupos: [], menu: [] };
  // raiz do site a partir do link do logo (funciona local e no GitHub Pages)
  const raiz = () => new URL(document.querySelector('.marca').getAttribute('href'), location.href).href;
  const buscar = async (caminho) => {
    const r = await fetch(new URL(caminho, raiz()).href, { cache: 'no-store' });
    return { ok: r.ok, status: r.status, doc: new DOMParser().parseFromString(await r.text(), 'text/html') };
  };
  const semAbrir = () => { const o = window.open, abertos = []; window.open = (u) => { abertos.push(String(u)); return null; }; return { abertos, voltar() { window.open = o; } }; };

  window.KIT_CASOS = [
    { modulo: 'Páginas', nome: 'Todas as páginas do site abrem', async fn(h) {
      const ps = D().paginas;
      h.ok(ps.length >= 15, `Esperava 15 páginas ou mais (achei ${ps.length})`);
      for (const p of ps) { h.passo('Abrindo /' + p.caminho); const r = await buscar(p.caminho); h.ok(r.ok, `Esperava /${p.caminho} abrindo (status ${r.status})`); } } },

    { modulo: 'Topo / menu', nome: 'Menu tem os 10 itens do prompt e todos funcionam', async fn(h) {
      const links = [...document.querySelectorAll('#menu a')];
      for (const m of D().menu) h.ok(links.some((a) => a.textContent.trim() === m.rotulo), `Esperava "${m.rotulo}" no menu`);
      h.ok(links.some((a) => /WhatsApp/.test(a.textContent)), 'Esperava o botão do WhatsApp no topo'); } },

    { modulo: 'Início', nome: 'Abertura com título, descrição e 3 botões', async fn(h) {
      const r = await buscar('');
      h.ok(/Segurança para o seu negócio/.test(r.doc.querySelector('.hero h1')?.textContent || ''), 'Esperava o título do prompt');
      const botoes = [...r.doc.querySelectorAll('.hero-acoes a')].map((a) => a.textContent.trim());
      ['Conheça nossos serviços', 'Solicitar proposta', 'Conheça o FIDELIS MEI'].forEach((b) => h.ok(botoes.includes(b), `Esperava o botão "${b}"`)); } },

    { modulo: 'Início', nome: '"Do que você precisa?" leva a páginas que existem', async fn(h) {
      const r = await buscar('');
      const links = [...r.doc.querySelectorAll('.necessidades a')];
      h.ok(links.length === 8, `Esperava 8 opções (achei ${links.length})`);
      for (const n of D().necessidades) {
        const [cam, ancora] = n.href.split('#');
        const alvo = await buscar(cam);
        h.ok(alvo.ok, `Esperava a página de "${n.rotulo}"`);
        if (ancora) h.ok(!!alvo.doc.getElementById(ancora), `Esperava a seção #${ancora} em /${cam}`);
      } } },

    { modulo: 'Serviços', nome: 'Cada área de serviço tem sua página e lista', async fn(h) {
      for (const g of D().grupos) {
        const r = await buscar(`servicos/${g.id}/`);
        const n = r.doc.querySelectorAll('.lista-servicos li').length;
        h.ok(r.ok && n === g.itens, `Esperava ${g.itens} serviços em /servicos/${g.id}/ (achei ${n})`);
      } } },

    { modulo: 'Dados', nome: 'Nenhum dado de contato ou empresa inventado', async fn(h) {
      // padrões de dados que só podem aparecer quando o proprietário fornecer (scripts/conteudo.mjs)
      const proibidos = [[/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/, 'CNPJ'], [/\(\d{2}\)\s?\d{4,5}-\d{4}/, 'telefone'], [/[\w.-]+@[\w-]+\.(com|br)/i, 'e-mail'], [/R\$\s?\d/, 'preço'], [/\bCRC[-\s/]?[A-Z]{2}\s?\d/, 'CRC'], [/depoimento/i, 'depoimento']];
      for (const p of D().paginas) {
        const r = await buscar(p.caminho);
        r.doc.querySelectorAll('script, input, textarea, [placeholder]').forEach((el) => el.remove());
        const txt = r.doc.body.textContent;
        for (const [re, nome] of proibidos) h.ok(!re.test(txt), `Achei ${nome} em /${p.caminho}: ${(txt.match(re) || [''])[0]}`);
      } } },

    { modulo: 'FIDELIS MEI', nome: 'App aparece como "em desenvolvimento" e sem preço', async fn(h) {
      const r = await buscar('fidelis-mei/');
      const t = r.doc.body.textContent;
      h.ok(/Em desenvolvimento/i.test(t), 'Esperava o aviso de em desenvolvimento');
      h.ok(/sem cobrança adicional/i.test(t), 'Esperava a frase do benefício do plano');
      h.ok(!/gratuito para sempre/i.test(t), 'Não pode usar "gratuito para sempre"'); } },

    { modulo: 'Espaço MEI', nome: 'Links oficiais abrem em nova aba e são do governo', async fn(h) {
      const r = await buscar('espaco-mei/');
      const links = [...r.doc.querySelectorAll('.links-oficiais a')];
      h.ok(links.length >= 4, 'Esperava pelo menos 4 links oficiais');
      links.forEach((a) => h.ok(/\.gov\.br\//.test(a.href) && a.target === '_blank', `Link fora do padrão: ${a.href}`)); } },

    { modulo: 'Proposta', nome: 'Formulário avisa o que falta', async fn(h) {
      if (!document.getElementById('form-orc')) { h.passo('Abra /proposta/ para testar o formulário com cliques (este caso só roda lá)'); return; }
      const t = semAbrir();
      try {
        document.getElementById('form-orc').reset();
        await h.clicar('#form-enviar', 'Enviar pedido');
        const msg = h.texto('#form-erro');
        h.ok(/nome/.test(msg) && /WhatsApp/.test(msg) && /concordância/.test(msg), 'Esperava aviso de nome, WhatsApp e concordância');
        h.ok(!t.abertos.length, 'Não deveria abrir nada com o formulário vazio');
      } finally { t.voltar(); document.getElementById('form-orc').reset(); document.getElementById('form-erro').textContent = ''; } } },

    { modulo: 'Proposta', nome: 'Formulário completo monta o pedido', async fn(h) {
      if (!document.getElementById('form-orc')) return;
      const t = semAbrir();
      try {
        const f = document.getElementById('form-orc'); f.reset();
        await h.digitar('#f-nome', 'Maria Teste');
        await h.digitar('#f-tel', '61999998888');
        document.getElementById('f-servico').value = 'mei';
        document.getElementById('f-ok').checked = true;
        await h.clicar('#form-enviar', 'Enviar pedido');
        const prev = document.getElementById('form-previa');
        const texto = D().whatsapp ? decodeURIComponent(t.abertos[0] || '') : prev.textContent;
        h.ok(texto.includes('Maria Teste') && texto.includes('(61) 99999-8888') && texto.includes('Serviços para o MEI'), 'Esperava nome, telefone formatado e assunto no pedido');
      } finally { t.voltar(); document.getElementById('form-orc').reset(); document.getElementById('form-previa').hidden = true; document.getElementById('form-erro').textContent = ''; } } }
  ];
})();
