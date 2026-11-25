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
  // carrega o cálculo das ferramentas mesmo fora das páginas delas
  const calc = () => window.FidelisCalc ? Promise.resolve(window.FidelisCalc) : new Promise((ok, falha) => {
    const s = document.createElement('script'); s.src = new URL('calculos.js', raiz()).href;
    s.onload = () => ok(window.FidelisCalc); s.onerror = () => falha(new Error('Não consegui carregar calculos.js')); document.head.appendChild(s);
  });
  const FERR = ['limite-mei', 'salario-liquido', 'calculadora-ferias', 'calculadora-rescisao', 'custo-contratacao', 'mei-x-me'];
  // exemplo de preenchimento por ferramenta (para o teste com cliques na própria página)
  const EXEMPLO = {
    'limite-mei': { '#l-valor': '45.000,00' },
    'salario-liquido': { '#t-salario': '8.000,00' },
    'calculadora-ferias': { '#t-salario': '3.000,00' },
    'custo-contratacao': { '#t-salario': '2.000,00' },
    'mei-x-me': { '#t-fat': '120.000,00' },
    'calculadora-rescisao': { '#t-salario': '3.000,00', '#t-admissao': '2024-03-10', '#t-desligamento': '2026-11-20', '#t-fgts': '5000' }
  };

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

    { modulo: 'Ferramentas', nome: 'As 6 ferramentas abrem com formulário e aparecem na lista', async fn(h) {
      const lista = await buscar('ferramentas/');
      for (const f of FERR) {
        h.passo('Abrindo /ferramentas/' + f + '/');
        const r = await buscar(`ferramentas/${f}/`);
        h.ok(r.ok && r.doc.querySelector(`#form-ferr[data-ferramenta="${f}"]`), `Esperava o formulário em /ferramentas/${f}/`);
        h.ok(!!lista.doc.querySelector(`a#${f}[href*="ferramentas/${f}/"]`), `Esperava o link de "${f}" na lista de ferramentas`);
      } } },

    { modulo: 'Ferramentas', nome: 'Cálculos batem com os casos conferidos à mão', async fn(h) {
      const C = await calc();
      const v = (slug, d) => C.calcular(slug, d);
      const sal = v('salario-liquido', { salario: '8.000,00' });
      h.ok(sal.liquido === '6040.64', `Salário líquido de R$ 8.000: esperava 6040.64 (deu ${sal.liquido})`);
      h.ok(v('salario-liquido', { salario: '5000' }).linhas.find((l) => l.descricao === 'IRRF').valor === '0.00', 'Até R$ 5.000 o IRRF deve ser zero (redução de 2026)');
      h.ok(v('salario-liquido', { salario: '1621' }).linhas.find((l) => l.descricao === 'INSS').valor === '121.58', 'INSS no salário mínimo: esperava 121.58');
      const fer = v('calculadora-ferias', { salario: '3000' });
      h.ok(fer.liquido === '3631.40', `Férias de R$ 3.000: esperava 3631.40 (deu ${fer.liquido})`);
      h.ok(v('calculadora-ferias', { salario: '3000', abono: true }).extras.dias_abono === 10, 'Abono pecuniário: esperava 10 dias vendidos');
      h.ok(v('calculadora-ferias', { salario: '3000', faltas: 10 }).linhas[0].descricao === 'Férias (24 dias)', 'Com 10 faltas: esperava 24 dias de férias');
      const cus = v('custo-contratacao', { salario: '2000', regime: 'lucro_presumido_real', rat: '0.02' });
      h.ok(cus.liquido === '3244.12', `Custo no Lucro Presumido: esperava 3244.12 (deu ${cus.liquido})`);
      h.ok(v('custo-contratacao', { salario: '3000', regime: 'mei' }).extras.avisos.length === 1, 'MEI com salário acima do mínimo: esperava o aviso do piso');
      const res = v('calculadora-rescisao', { salario: '3000', admissao: '2024-03-10', desligamento: '2026-11-20', tipo: 'sem_justa_causa', aviso: 'indenizado', saldo_fgts: '5000' });
      h.ok(res.liquido === '11529.04' && res.extras.multa_fgts === '2275.20', `Rescisão sem justa causa: esperava 11529.04 e multa 2275.20 (deu ${res.liquido} e ${res.extras.multa_fgts})`);
      const ped = v('calculadora-rescisao', { salario: '3000', admissao: '2024-03-10', desligamento: '2026-11-20', tipo: 'pedido_demissao', aviso: 'nao_cumprido' });
      h.ok(ped.liquido === '4037.79', `Pedido de demissão sem cumprir aviso: esperava 4037.79 (deu ${ped.liquido})`);
      let erro = '';
      try { v('calculadora-rescisao', { salario: '3000', admissao: '2024-03-10', desligamento: '2026-11-20', tipo: 'justa_causa', aviso: 'indenizado' }); } catch (e) { erro = e.message; }
      h.ok(/não se aplica/.test(erro), 'Justa causa com aviso indenizado deve ser recusada');
      const lim = v('limite-mei', { ano: 2026, faturado_no_ano: '45.000,00', mes_referencia: 6 });
      h.ok(lim.situacao.percentual === '55.56' && lim.projecao.projetado_ano === '90000.00', `Limite do MEI: esperava 55,56% e projeção 90.000 (deu ${lim.situacao.percentual}% e ${lim.projecao.projetado_ano})`);
      const mx = v('mei-x-me', { faturamento_anual: '120.000,00', atividade: 'comercio' });
      h.ok(mx.mei.anual === '984.60' && mx.me.simples_anual === '4800.00' && mx.diferenca_anual === '5955.12', `MEI x ME (comércio, 120 mil): esperava 984.60 / 4800.00 / 5955.12 (deu ${mx.mei.anual} / ${mx.me.simples_anual} / ${mx.diferenca_anual})`);
      h.ok(v('mei-x-me', { faturamento_anual: '300000', atividade: 'servicos' }).me.aliquota_efetiva === '8.08', 'Serviços com 300 mil: alíquota efetiva de 8,08% (2ª faixa do Anexo III)');
      h.ok(sal.parametros_pendentes.length > 0, 'As tabelas devem aparecer como pendentes de revisão no protótipo'); } },

    { modulo: 'Ferramentas', nome: 'Formulário calcula e mostra o resultado na tela', async fn(h) {
      const form = document.getElementById('form-ferr');
      if (!form) { h.passo('Abra uma das ferramentas (ex.: /ferramentas/salario-liquido/) para testar com cliques (este caso só roda lá)'); return; }
      const slug = form.dataset.ferramenta, out = document.getElementById('t-resultado');
      form.reset(); out.hidden = true;
      if (slug === 'calculadora-rescisao') { document.getElementById('t-desligamento').value = ''; }
      await h.clicar('#t-calcular', 'Calcular');
      h.ok(h.texto('#t-erro').length > 0 && out.hidden, 'Com o formulário vazio deveria aparecer um aviso e nenhum resultado');
      form.reset();
      for (const [sel, val] of Object.entries(EXEMPLO[slug])) {
        const el = document.querySelector(sel);
        if (el.type === 'date') { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); } else await h.digitar(sel, val);
      }
      await h.clicar('#t-calcular', 'Calcular');
      h.ok(!out.hidden && !h.texto('#t-erro'), `Esperava o resultado na tela (erro: ${h.texto('#t-erro') || 'nenhum'})`);
      const esperado = { 'limite-mei': '55.56', 'salario-liquido': '6040.64', 'calculadora-ferias': '3631.40', 'custo-contratacao': '2580.00', 'calculadora-rescisao': '11529.04', 'mei-x-me': '8307.12' }[slug];
      h.ok(out.dataset.liquido === esperado, `Esperava ${esperado} no resultado (deu ${out.dataset.liquido})`);
      h.ok(/Premissas/.test(out.textContent) && /Data de referência/.test(out.textContent), 'O resultado deve mostrar premissas e data de referência'); } },

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
