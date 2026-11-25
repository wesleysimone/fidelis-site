/* Gera as páginas estáticas do site FIDELIS a partir de scripts/conteudo.mjs.
 * Uso: node scripts/gerar-site.mjs   (sem dependências)
 * Cada página vira site/<caminho>/index.html → URLs amigáveis (/servicos/mei/).
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from './conteudo.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const VERSAO = (readFileSync(join(RAIZ, 'kit', 'kit-config.js'), 'utf8').match(/versao:\s*'([^']+)'/) || [])[1] || '0.0.0';
const E = C.empresa;
const CARIMBO = `${VERSAO}.${Date.now().toString(36)}`; // muda a cada geração → navegador nunca usa CSS/JS velho

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pend = (rotulo) => `<span class="a-definir" title="Informação a ser fornecida pelo proprietário">${esc(rotulo)} a definir</span>`;
const ou = (valor, rotulo) => (valor ? esc(valor) : pend(rotulo));
const zap = (msg) => (E.whatsapp ? `https://wa.me/${E.whatsapp}?text=${encodeURIComponent(msg)}` : '');

const ICONES = {
  mei: '<path d="M3 9l1.5-5h15L21 9M3 9h18M3 9c0 1.7 1.3 3 3 3s3-1.3 3-3m0 0c0 1.7 1.3 3 3 3s3-1.3 3-3m0 0c0 1.7 1.3 3 3 3s3-1.3 3-3M5 12v8h14v-8M10 20v-5h4v5"/>',
  empresa: '<path d="M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 9h2M14 9h2M8 13h2M14 13h2"/>',
  ir: '<path d="M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h6"/>',
  pessoas: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c2.9.3 5 2.6 5 5.8"/>',
  grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  calc: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h2M12 11h0M16 11h0M8 15h2M12 15h0M16 15h0M8 19h2M12 19h4"/>',
  celular: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'
};
const icone = (n) => `<div class="ic" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONES[n] || ICONES.grafico}</svg></div>`;
const selo = (s) => ({ consulta: '<span class="selo">Sob consulta</span>', futuro: '<span class="selo selo-futuro">Em breve</span>', 'em-breve': '<span class="selo selo-futuro">Em breve</span>', dev: '<span class="selo selo-futuro">Em desenvolvimento</span>', teste: '<span class="selo selo-futuro">Em validação</span>' }[s] || '');

/* ---------- moldura comum ---------- */
function moldura(pg, corpo) {
  const prof = pg.caminho ? pg.caminho.split('/').filter(Boolean).length : 0;
  const p = prof ? '../'.repeat(prof) : './';
  const L = (href) => p + href;
  const atual = (href) => (href === pg.caminho || (href && pg.caminho.startsWith(href) && href !== '')) ? ' aria-current="page"' : '';
  const nav = C.menu.map((m) => m.botao
    ? `<a class="btn btn-peq ${m.botao === 'ouro' ? 'btn-ouro' : 'btn-linha'}" href="${L(m.href)}"${atual(m.href)}>${esc(m.rotulo)}</a>`
    : `<a href="${L(m.href)}"${atual(m.href)}>${esc(m.rotulo)}</a>`).join('\n        ');
  const whatsTopo = E.whatsapp
    ? `<a class="btn btn-peq btn-whats js-whats" aria-label="WhatsApp" href="${zap('Olá! Vim pelo site da FIDELIS.')}"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C9 3 3.3 8.6 3.3 15.5c0 2.4.7 4.7 2 6.7L3 29l7-2.2c1.9 1 4 1.6 6 1.6 7 0 12.7-5.6 12.7-12.5S23 3 16 3z"/></svg><span>WhatsApp</span></a>`
    : `<a class="btn btn-peq btn-whats" aria-label="WhatsApp" href="${L('contato/')}" title="Número do WhatsApp a definir"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C9 3 3.3 8.6 3.3 15.5c0 2.4.7 4.7 2 6.7L3 29l7-2.2c1.9 1 4 1.6 6 1.6 7 0 12.7-5.6 12.7-12.5S23 3 16 3z"/></svg><span>WhatsApp</span></a>`;
  const titulo = pg.caminho ? `${pg.titulo} | ${E.nomeCompleto}` : `${E.nomeCompleto} | ${E.cidade}`;
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(titulo)}</title>
  <meta name="description" content="${esc(pg.descricao)}">
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${C.urlBase}${pg.caminho}">
  <meta name="theme-color" content="#081d30">
  <link rel="manifest" href="${L('manifest.webmanifest')}">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="FIDELIS">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="icon" type="image/png" sizes="32x32" href="${L('assets/favicon-32.png')}">
  <link rel="apple-touch-icon" href="${L('assets/apple-touch-icon.png')}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:title" content="${esc(titulo)}">
  <meta property="og:description" content="${esc(pg.descricao)}">
  <meta property="og:image" content="${C.urlBase}assets/og-fidelis.jpg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${L('estilo.css')}?v=${CARIMBO}">
  <link rel="stylesheet" href="${L('kit/kit.css')}?v=${CARIMBO}">
</head>
<body data-pagina="${esc(pg.area)}">
  <a class="pular" href="#conteudo">Pular para o conteúdo</a>
  <header class="topo">
    <div class="topo-in">
      <a class="marca" href="${L('')}" aria-label="FIDELIS — página inicial">
        <img src="${L('assets/simbolo-dourado-160.png')}" alt="" width="34" height="37">
        <span><b>FIDELIS</b><small>Contabilidade &amp; Consultoria</small></span>
      </a>
      <button class="menu-btn" id="menu-btn" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
      <nav class="menu" id="menu" aria-label="Menu principal">
        ${nav}
        ${whatsTopo}
      </nav>
    </div>
  </header>

  <main id="conteudo">
${corpo(L)}
  </main>

  <footer class="rodape">
    <div class="rodape-in">
      <div class="rod-col">
        <div class="marca"><img src="${L('assets/simbolo-dourado-160.png')}" alt="" width="34" height="37"><span><b>FIDELIS</b><small>Contabilidade &amp; Consultoria</small></span></div>
        <p class="rod-slogan">${esc(E.slogan)}.</p>
        <p>${esc(E.cidade)}</p>
      </div>
      <div class="rod-col">
        <h2>Contato</h2>
        <p>WhatsApp: ${E.whatsapp ? `<a class="js-whats" href="${zap('Olá! Vim pelo site da FIDELIS.')}">${esc(E.telefone || E.whatsapp)}</a>` : pend('número')}</p>
        <p>E-mail: ${E.email ? `<a href="mailto:${esc(E.email)}">${esc(E.email)}</a>` : pend('e-mail')}</p>
        <p>Instagram: ${E.instagram ? `<a href="https://instagram.com/${esc(E.instagram)}" target="_blank" rel="noopener">@${esc(E.instagram)}</a>` : pend('perfil')}</p>
      </div>
      <div class="rod-col">
        <h2>Institucional</h2>
        <p><a href="${L('sobre/')}">Sobre a FIDELIS</a></p>
        <p><a href="${L('privacidade/')}">Política de privacidade</a></p>
        <p><a href="${L('termos/')}">Termos de uso</a></p>
        <p><a href="#" data-instalar class="link-instalar">📲 Instalar o app no celular</a></p>
      </div>
      <div class="rod-legal">
        <p>${E.razaoSocial ? esc(E.razaoSocial) : pend('Razão social')} · CNPJ ${ou(E.cnpj, '')}</p>
        <p>Responsável técnico: ${ou(E.responsavel, 'nome')} · ${E.crc ? esc(E.crc) : pend('CRC')}</p>
        <p class="aviso-prot">Protótipo para aprovação · conteúdo em revisão · v${VERSAO}</p>
      </div>
    </div>
  </footer>
${E.whatsapp ? `  <a class="whats-flutuante js-whats" href="${zap('Olá! Vim pelo site da FIDELIS.')}" aria-label="Falar pelo WhatsApp"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C9 3 3.3 8.6 3.3 15.5c0 2.4.7 4.7 2 6.7L3 29l7-2.2c1.9 1 4 1.6 6 1.6 7 0 12.7-5.6 12.7-12.5S23 3 16 3z"/></svg></a>\n` : ''}
  <script src="${L('dados.js')}?v=${CARIMBO}"></script>
  <script src="${L('app.js')}?v=${CARIMBO}"></script>
  <script src="${L('kit/pwa.js')}?v=${CARIMBO}"></script>
${(pg.scripts || []).map((x) => `  <script src="${L(x)}?v=${CARIMBO}"></script>\n`).join('')}
  <!-- KIT PROTÓTIPO (remover na versão final) -->
  <script src="${L('kit/kit-config.js')}?v=${CARIMBO}"></script>
  <script src="${L('kit/kit-core.js')}?v=${CARIMBO}"></script>
  <script src="${L('kit/kit-equipe.js')}?v=${CARIMBO}"></script>
  <script src="${L('kit/kit-sugestoes.js')}?v=${CARIMBO}"></script>
  <script src="${L('kit/kit-testes.js')}?v=${CARIMBO}"></script>
  <script src="${L('kit/kit-casos.js')}?v=${CARIMBO}"></script>
</body>
</html>
`;
}

/* ---------- blocos reutilizáveis ---------- */
const cab = (sobre, titulo, texto, extra = '') => `
    <div class="cab ${extra}">
      <p class="sobre-titulo">${esc(sobre)}</p>
      <h2>${esc(titulo)}</h2>${texto ? `\n      <p class="cab-txt">${texto}</p>` : ''}
    </div>`;

const topoPagina = (sobre, titulo, texto) => `
    <section class="pg-topo">
      <div class="pg-topo-in">
        <p class="sobre-titulo">${esc(sobre)}</p>
        <h1>${esc(titulo)}</h1>
        ${texto ? `<p>${texto}</p>` : ''}
      </div>
    </section>`;

const cardsGrupos = (L) => `
      <div class="cards cards-4">
${C.gruposServicos.map((g) => `        <a class="card card-link" href="${L(`servicos/${g.id}/`)}">
          ${icone(g.icone)}
          <h3>${esc(g.titulo)}</h3>
          <p>${esc(g.resumo)}</p>
          <span class="mais">Ver serviços →</span>
        </a>`).join('\n')}
      </div>`;

const blocoApp = (L) => `
    <section class="secao secao-marinho" id="fidelis-mei">
      <div class="app-in">
        <div>
          <p class="sobre-titulo">FIDELIS MEI ${selo('dev')}</p>
          <h2>Seu MEI organizado, no computador e no celular</h2>
          <p class="cab-txt">Aplicativo de gestão empresarial <b>incluso no seu plano de acompanhamento contábil FIDELIS, sem cobrança adicional</b>. Também poderá ser contratado separadamente.</p>
          <div class="hero-acoes"><a class="btn btn-ouro" href="${L('fidelis-mei/')}">Conheça o FIDELIS MEI</a></div>
        </div>
        <ul class="lista-recursos">
${C.appRecursos.map(([t, d]) => `          <li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('\n')}
        </ul>
      </div>
    </section>`;

const blocoFerramentas = (L, titulo = true) => `
      ${titulo ? cab('Ferramentas gratuitas', 'Calculadoras e simuladores para o seu dia a dia', 'Sem cadastro. Cada cálculo vai mostrar a data de referência, as premissas e os limites da simulação.') : ''}
      <div class="cards cards-ferr">
${C.ferramentas.map((f) => f.situacao === 'teste'
  ? `        <a class="card card-ferr card-link" id="${f.slug}" href="${L('ferramentas/' + f.slug + '/')}">
          ${icone('calc')}
          <h3>${esc(f.nome)} ${selo(f.situacao)}</h3>
          <p>${esc(f.desc)}</p>
          <span class="mais">Testar agora →</span>
        </a>`
  : `        <article class="card card-ferr" id="${f.slug}">
          ${icone('calc')}
          <h3>${esc(f.nome)} ${selo(f.situacao)}</h3>
          <p>${esc(f.desc)}</p>
        </article>`).join('\n')}
      </div>`;

const blocoDuvidas = () => `
      <div class="faq">
${C.duvidas.map(([q, r]) => `        <details><summary>${esc(q)}</summary><p>${esc(r)}</p></details>`).join('\n')}
      </div>`;

const chamada = (L, titulo = 'Vamos conversar sobre o seu negócio?', texto = 'Conte o que você precisa e receba uma proposta por escrito, com escopo e honorários claros.') => `
    <section class="secao chamada">
      <div class="chamada-in">
        <h2>${esc(titulo)}</h2>
        <p>${esc(texto)}</p>
        <a class="btn btn-ouro" href="${L('proposta/')}">Solicitar proposta</a>
      </div>
    </section>`;

/* ---------- páginas ---------- */
const paginas = [];
const pagina = (caminho, area, titulo, descricao, corpo) => paginas.push({ caminho, area, titulo, descricao, corpo });

// INÍCIO
pagina('', 'Início', 'Início', 'Contabilidade e consultoria em Brasília para MEI, empresas e pessoas físicas: abertura e regularização, Imposto de Renda, consultoria trabalhista e o aplicativo FIDELIS MEI.', (L) => `
    <section class="hero">
      <div class="hero-in">
        <div class="hero-txt">
          <p class="sobre-titulo">${esc(E.nomeCompleto)}</p>
          <h1>Segurança para o seu negócio. <em>Confiança para o seu futuro.</em></h1>
          <p class="hero-sub">Soluções contábeis, tributárias e trabalhistas para quem deseja empreender com tranquilidade, organização e segurança.</p>
          <div class="hero-acoes">
            <a class="btn btn-ouro" href="${L('servicos/')}" id="hero-servicos">Conheça nossos serviços</a>
            <a class="btn btn-linha" href="${L('proposta/')}">Solicitar proposta</a>
            <a class="btn btn-linha" href="${L('fidelis-mei/')}">Conheça o FIDELIS MEI</a>
          </div>
        </div>
        <div class="hero-simbolo"><img src="${L('assets/simbolo-dourado.png')}" alt="Símbolo da FIDELIS: letra F dourada com cruz, coluna e arco ascendente" width="550" height="600"></div>
      </div>
    </section>

    <section class="secao" id="necessidades">
      ${cab('Como podemos ajudar', 'Do que você precisa?')}
      <div class="necessidades">
${C.necessidades.map((n) => `        <a href="${L(n.href)}">${esc(n.rotulo)}<span aria-hidden="true">→</span></a>`).join('\n')}
      </div>
    </section>

    <section class="secao secao-creme" id="servicos">
      ${cab('Nossos serviços', 'Contabilidade, impostos e pessoas', 'Atendimento para o microempreendedor, para empresas em crescimento e para a sua declaração de Imposto de Renda.')}
${cardsGrupos(L)}
    </section>
${blocoApp(L)}

    <section class="secao" id="ferramentas">
${blocoFerramentas(L)}
      <p class="centro"><a class="btn btn-linha-escura" href="${L('ferramentas/')}">Ver todas as ferramentas</a></p>
    </section>

    <section class="secao secao-creme" id="institucional">
      <div class="prop-in">
        <div class="prop-txt">
          <p class="sobre-titulo">Quem somos</p>
          <h2>Fidelis: fiel, leal e digno de confiança</h2>
          <p>O nome vem do latim e traduz o que orienta o nosso trabalho: fidelidade, responsabilidade, honestidade, ética e compromisso com as pessoas, valores que nascem da fé cristã e se refletem na forma de cuidar de cada cliente.</p>
          <p><a class="link-seta" href="${L('sobre/')}">Conheça a FIDELIS →</a></p>
        </div>
        <ul class="simbolos">
          <li><b>Cruz</b><span>A fé como base dos nossos valores.</span></li>
          <li><b>Coluna</b><span>Estrutura, solidez e sustentação.</span></li>
          <li><b>Arco ascendente</b><span>Crescimento e desenvolvimento.</span></li>
        </ul>
      </div>
    </section>

    <section class="secao" id="duvidas">
      ${cab('Perguntas frequentes', 'Dúvidas comuns')}
${blocoDuvidas()}
    </section>
${chamada(L)}`);

// SOBRE
pagina('sobre/', 'Sobre', 'Sobre a FIDELIS', 'Conheça a FIDELIS – Contabilidade & Consultoria: significado do nome, propósito, valores cristãos e compromisso com os clientes.', (L) => `
${topoPagina('Sobre a FIDELIS', 'Fiel, leal e digno de confiança', 'Fidelis é uma expressão de origem latina. Escolhemos esse nome porque ele resume o compromisso que queremos ter com cada cliente.')}
    <section class="secao">
      <div class="prop-in">
        <div class="prop-txt">
          <h2>Propósito</h2>
          <p>Ser um escritório de contabilidade tecnologicamente organizado, que usa ferramentas próprias para atender melhor, orientar com clareza e ajudar empreendedores a crescer com segurança.</p>
          <h2>Nossa história</h2>
          <p>${pend('Texto da história da empresa')}</p>
          <h2>Responsável técnico</h2>
          <p>${ou(E.responsavel, 'Nome do contador')} · ${E.crc ? esc(E.crc) : pend('Registro no CRC')}</p>
        </div>
        <ul class="simbolos">
          <li><b>Cruz</b><span>A fé como base de todos os valores.</span></li>
          <li><b>Coluna</b><span>Estrutura, solidez e segurança financeira.</span></li>
          <li><b>Arco ascendente</b><span>Evolução, progresso e crescimento sustentável.</span></li>
        </ul>
      </div>
    </section>
    <section class="secao secao-creme">
      ${cab('Valores', 'O que orienta o nosso trabalho')}
      <ul class="valores">
${['Fidelidade', 'Responsabilidade', 'Honestidade', 'Justiça', 'Prudência', 'Ética', 'Trabalho', 'Compromisso com as pessoas'].map((v) => `        <li>${v}</li>`).join('\n')}
      </ul>
    </section>
    <section class="secao">
      ${cab('Compromisso', 'Tecnologia a serviço da contabilidade', 'Usamos tecnologia para organizar, orientar e prevenir problemas, nunca para substituir a análise profissional. Cálculos e orientações são revisados por contador e informam sempre a data de referência e as suas limitações.')}
    </section>
${chamada(L)}`);

// SERVIÇOS (visão geral)
pagina('servicos/', 'Serviços', 'Nossos serviços', 'Serviços contábeis da FIDELIS em Brasília: MEI, abertura e regularização de empresas, Imposto de Renda e consultoria trabalhista com auditoria de folha.', (L) => `
${topoPagina('Nossos serviços', 'Como a FIDELIS pode ajudar', 'Escolha a área para ver os serviços em detalhes.')}
    <section class="secao">
${cardsGrupos(L)}
    </section>
${chamada(L)}`);

// SERVIÇOS (uma página por grupo)
for (const g of C.gruposServicos) {
  pagina(`servicos/${g.id}/`, 'Serviços', g.titulo, `${g.titulo} — ${g.resumo} FIDELIS Contabilidade & Consultoria, ${E.cidade}.`, (L) => `
${topoPagina('Nossos serviços', g.titulo, esc(g.resumo))}
    <section class="secao">
      <ul class="lista-servicos" data-grupo="${g.id}">
${g.itens.filter(([, s]) => s !== 'inativo').map(([n, s, ancora]) => `        <li${ancora ? ` id="${ancora}"` : ''}><span>${esc(n)}</span>${selo(s)}</li>`).join('\n')}
      </ul>
      <p class="nota">Os serviços são contratados com escopo e honorários definidos em proposta por escrito.</p>
    </section>
${chamada(L, 'Quer uma proposta para este serviço?', 'Conte a sua situação. Respondemos com o escopo, os prazos e os honorários.')}`);
}

// ESPAÇO MEI
pagina('espaco-mei/', 'Espaço MEI', 'Espaço MEI', 'Espaço MEI da FIDELIS: orientação para abrir o MEI, obrigações de quem já é MEI e links para os serviços oficiais do governo.', (L) => `
${topoPagina('Espaço MEI', 'Tudo para o microempreendedor em um só lugar', 'Orientação para quem quer se formalizar e apoio para quem já é MEI e quer manter tudo em dia.')}
    <section class="secao" id="abrir">
      ${cab('Quero abrir um MEI', 'Antes de se formalizar', '', 'cab-esq')}
      <ul class="checklist">
        <li>Confirme se a sua atividade é permitida para o MEI.</li>
        <li>Verifique se você se enquadra nas condições (faturamento anual, sócios, empregados).</li>
        <li>Separe documentos pessoais e o endereço onde a atividade será exercida.</li>
        <li>Entenda as obrigações que vêm depois da abertura: guia mensal, declaração anual e notas fiscais.</li>
      </ul>
      <p><a class="btn btn-ouro" href="${L('proposta/?interesse=mei')}">Quero ajuda para abrir meu MEI</a></p>
    </section>
    <section class="secao secao-creme" id="ja-sou-mei">
      ${cab('Já sou MEI', 'Obrigações para manter em dia', '', 'cab-esq')}
      <div class="cards cards-3">
        <article class="card"><h3>Guia mensal (DAS)</h3><p>Pagamento mensal que reúne os tributos do MEI. Atrasos geram multa e juros.</p></article>
        <article class="card"><h3>Declaração anual (DASN-SIMEI)</h3><p>Informa o faturamento do ano anterior. É obrigatória mesmo sem faturamento.</p></article>
        <article class="card"><h3>Relatório mensal de receitas</h3><p>Registro do que foi faturado no mês, que deve ser guardado junto com as notas.</p></article>
      </div>
      <p class="nota">Prazos e valores mudam conforme a legislação. Confira sempre nos canais oficiais ou fale com a FIDELIS.</p>
    </section>
    <section class="secao" id="links-oficiais">
      ${cab('Serviços oficiais', 'Links do governo', 'Você será direcionado ao site oficial. A FIDELIS não pede a sua senha gov.br.', 'cab-esq')}
      <ul class="links-oficiais">
${C.linksOficiais.map(([t, u, d]) => `        <li><a href="${u}" target="_blank" rel="noopener">${icone('link')}<span><b>${esc(t)}</b><small>${esc(d)}</small></span></a></li>`).join('\n')}
      </ul>
    </section>
${chamada(L, 'Precisa regularizar ou acompanhar o seu MEI?', 'Cuidamos das obrigações, acompanhamos o faturamento e orientamos antes de chegar ao limite.')}`);

// FIDELIS MEI
pagina('fidelis-mei/', 'FIDELIS MEI', 'FIDELIS MEI', 'FIDELIS MEI: aplicativo de gestão para o microempreendedor, com receitas, despesas, controle do limite do MEI, obrigações e relatórios. Em desenvolvimento.', (L) => `
${topoPagina('Aplicativo FIDELIS MEI', 'Gestão simples para o seu MEI', 'Organize as finanças, acompanhe o limite de faturamento e não perca prazos. Funciona no navegador e pode ser instalado no celular.')}
    <section class="secao">
      <p class="aviso-dev">${selo('dev')} O aplicativo ainda não está disponível. Esta página mostra o que está previsto para a primeira versão.</p>
      <ul class="lista-recursos lista-recursos-claro">
${C.appRecursos.map(([t, d]) => `        <li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('\n')}
      </ul>
    </section>
    <section class="secao secao-creme" id="planos">
      ${cab('Formas de acesso', 'Duas maneiras de usar o FIDELIS MEI')}
      <div class="cards cards-2">
        <article class="card plano plano-destaque">
          <h3>FIDELIS MEI Contábil</h3>
          <p><b>Aplicativo incluso no seu plano de acompanhamento contábil FIDELIS, sem cobrança adicional.</b></p>
          <ul><li>Acompanhamento contábil conforme o escopo contratado</li><li>Orientações personalizadas</li><li>Acompanhamento de obrigações e do faturamento</li><li>Orientação preventiva de desenquadramento</li><li>Central de documentos e solicitações</li></ul>
          <p class="preco">Valores em definição</p>
        </article>
        <article class="card plano">
          <h3>FIDELIS MEI Digital</h3>
          <p>Somente o aplicativo, para quem já tem contador ou quer se organizar sozinho.</p>
          <ul><li>Receitas, despesas e faturamento</li><li>Clientes e fornecedores</li><li>Orçamentos e recibos</li><li>Calendário de obrigações e relatórios</li><li>Não inclui serviços contábeis</li></ul>
          <p class="preco">Valores em definição</p>
        </article>
      </div>
    </section>
${chamada(L, 'Quer ser avisado do lançamento?', 'Deixe o seu contato e avisamos quando o FIDELIS MEI estiver disponível.')}`);

// FERRAMENTAS
pagina('ferramentas/', 'Ferramentas', 'Ferramentas gratuitas', 'Ferramentas gratuitas da FIDELIS: simulador de limite do MEI, salário líquido, férias, rescisão e custo de contratação. Em validação.', (L) => `
${topoPagina('Ferramentas gratuitas', 'Calculadoras e simuladores', 'Ferramentas sem cadastro, com regras oficiais, data de referência e explicação das premissas. Estão em validação: as tabelas ainda passam pela revisão do contador.')}
    <section class="secao">
${blocoFerramentas(L, false)}
    </section>
    <section class="secao secao-creme">
      ${cab('Próximas ferramentas', 'Também estão no planejamento')}
      <ul class="valores">
${C.ferramentasFuturas.map((f) => `        <li>${esc(f)}</li>`).join('\n')}
      </ul>
      <p class="nota centro">Simulações não substituem a análise profissional. Para decisões importantes, fale com a FIDELIS.</p>
    </section>`);

// FERRAMENTAS: uma página por ferramenta (o cálculo roda no navegador, igual ao da plataforma)
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const HOJE = new Date();
const hojeISO = `${HOJE.getFullYear()}-${String(HOJE.getMonth() + 1).padStart(2, '0')}-${String(HOJE.getDate()).padStart(2, '0')}`;
const FORMS = {
  'limite-mei': `
        <label>Ano<input id="l-ano" name="ano" type="number" min="2018" max="2100" value="${HOJE.getFullYear()}"></label>
        <label>Data de abertura do MEI (opcional)<input id="l-abertura" name="data_abertura" type="date"></label>
        <label>Faturamento no ano até agora (R$)<input id="l-valor" name="faturado_no_ano" inputmode="decimal" placeholder="Ex.: 45.000,00"></label>
        <label>Até qual mês?
          <select id="l-mes" name="mes_referencia">
${MESES.map((m, i) => `            <option value="${i + 1}"${i === HOJE.getMonth() ? ' selected' : ''}>${m}</option>`).join('\n')}
          </select>
        </label>`,
  'mei-x-me': `
        <label>Faturamento previsto para 12 meses (R$)<input id="t-fat" name="faturamento_anual" inputmode="decimal" placeholder="Ex.: 120.000,00" required></label>
        <label>Atividade principal
          <select id="t-atividade" name="atividade"><option value="servicos">Serviços</option><option value="comercio">Comércio</option><option value="industria">Indústria</option></select>
        </label>
        <label>Pró-labore mensal na ME (R$, opcional)<input name="pro_labore" inputmode="decimal" placeholder="Se vazio, um salário mínimo"></label>
        <label>Outros custos mensais da ME (R$, opcional)<input name="outros_custos_mensais" inputmode="decimal" placeholder="Ex.: contabilidade"></label>`,
  'salario-liquido': `
        <label>Salário bruto mensal (R$)<input id="t-salario" name="salario" inputmode="decimal" placeholder="Ex.: 3.500,00" required></label>
        <label>Dependentes para o IR<input name="dependentes" type="number" min="0" max="20" value="0"></label>
        <label>Outros valores tributáveis no mês (R$, opcional)<input name="outros_proventos" inputmode="decimal" placeholder="Ex.: horas extras"></label>
        <label>Outros descontos (R$, opcional)<input name="outros_descontos" inputmode="decimal" placeholder="Ex.: vale-transporte"></label>`,
  'calculadora-ferias': `
        <label>Salário mensal (R$)<input id="t-salario" name="salario" inputmode="decimal" placeholder="Ex.: 3.000,00" required></label>
        <label>Média de variáveis (R$, opcional)<input name="medias" inputmode="decimal" placeholder="Horas extras, comissões"></label>
        <label>Faltas sem justificativa no período aquisitivo<input id="t-faltas" name="faltas" type="number" min="0" max="366" value="0"></label>
        <label>Dependentes para o IR<input name="dependentes" type="number" min="0" max="20" value="0"></label>
        <label class="consent larga"><input id="t-abono" name="abono" type="checkbox"> Vender 1/3 das férias (abono pecuniário)</label>`,
  'custo-contratacao': `
        <label>Salário do empregado (R$)<input id="t-salario" name="salario" inputmode="decimal" placeholder="Ex.: 2.000,00" required></label>
        <label>Regime tributário da empresa
          <select id="t-regime" name="regime">
            <option value="mei">MEI</option>
            <option value="simples" selected>Simples Nacional (Anexos I, II, III ou V)</option>
            <option value="simples_anexo_iv">Simples Nacional (Anexo IV)</option>
            <option value="lucro_presumido_real">Lucro Presumido ou Lucro Real</option>
          </select>
        </label>
        <label>RAT/SAT (grau de risco da atividade)
          <select name="rat"><option value="0.01">1% (leve)</option><option value="0.02" selected>2% (médio)</option><option value="0.03">3% (grave)</option></select>
        </label>
        <label>Benefícios por mês (R$, opcional)<input name="beneficios" inputmode="decimal" placeholder="Vale-transporte, alimentação"></label>`,
  'calculadora-rescisao': `
        <label>Último salário (R$)<input id="t-salario" name="salario" inputmode="decimal" placeholder="Ex.: 3.000,00" required></label>
        <label>Tipo de desligamento
          <select name="tipo" id="t-tipo">
            <option value="sem_justa_causa">Dispensa sem justa causa</option>
            <option value="pedido_demissao">Pedido de demissão</option>
            <option value="acordo">Acordo entre as partes</option>
            <option value="justa_causa">Dispensa por justa causa</option>
          </select>
        </label>
        <label>Data de admissão<input id="t-admissao" name="admissao" type="date" required></label>
        <label>Último dia de trabalho<input id="t-desligamento" name="desligamento" type="date" value="${hojeISO}" required></label>
        <label>Aviso prévio
          <select name="aviso" id="t-aviso">
            <option value="indenizado" data-tipos="sem_justa_causa acordo">Indenizado (sem trabalhar)</option>
            <option value="trabalhado" data-tipos="sem_justa_causa acordo pedido_demissao">Trabalhado</option>
            <option value="nao_cumprido" data-tipos="pedido_demissao">Não cumprido pelo empregado</option>
            <option value="dispensado" data-tipos="pedido_demissao justa_causa">Dispensado / não se aplica</option>
          </select>
        </label>
        <label>Férias vencidas não tiradas
          <select name="ferias_vencidas"><option value="0">Nenhuma</option><option value="1">1 período</option><option value="2">2 períodos</option></select>
        </label>
        <label>Saldo do FGTS para a multa (R$, opcional)<input id="t-fgts" name="saldo_fgts" inputmode="decimal" placeholder="Veja no app FGTS"></label>
        <label>Dependentes para o IR<input name="dependentes" type="number" min="0" max="20" value="0"></label>`
};
const TEXTOS_FERR = {
  'limite-mei': ['Veja quanto do limite anual você já usou e a projeção até dezembro. Sem cadastro.', 'mei', 'Precisa de uma análise detalhada?', 'A FIDELIS acompanha o seu faturamento e orienta antes de chegar ao limite.'],
  'mei-x-me': ['Compare quanto custa por ano continuar MEI e quanto custaria uma microempresa no Simples Nacional. Sem cadastro.', 'mei', 'Está perto de deixar de ser MEI?', 'A FIDELIS analisa o seu caso e planeja a mudança para ME no momento certo, sem multas nem surpresas.'],
  'salario-liquido': ['Descontos de INSS e IRRF com a tabela vigente, já com a redução do Imposto de Renda de 2026. Sem cadastro.', 'trabalhista'],
  'calculadora-ferias': ['Férias com o terço constitucional, abono pecuniário e descontos. Sem cadastro.', 'trabalhista'],
  'custo-contratacao': ['Quanto um funcionário custa por mês além do salário, conforme o regime da empresa (MEI, Simples, Presumido ou Real).', 'trabalhista'],
  'calculadora-rescisao': ['Estimativa das verbas rescisórias conforme o tipo de desligamento, com aviso prévio proporcional e multa do FGTS.', 'trabalhista']
};
for (const f of C.ferramentas.filter((x) => x.situacao === 'teste')) {
  const [sub, interesse, chT, chX] = TEXTOS_FERR[f.slug];
  pagina(`ferramentas/${f.slug}/`, 'Ferramentas', f.nome, `${f.nome}: ${f.desc} Ferramenta gratuita da FIDELIS (em validação).`, (L) => `
${topoPagina('Ferramenta gratuita', f.nome, esc(sub))}
    <section class="secao">
      <form class="form" id="form-ferr" data-ferramenta="${f.slug}" data-proposta="${L('proposta/?interesse=' + interesse)}" novalidate>${FORMS[f.slug]}
        <p class="form-erro larga" id="t-erro" role="alert"></p>
        <button class="btn btn-ouro larga" type="submit" id="t-calcular">Calcular</button>
      </form>
      <div id="t-resultado" class="resultado-ferr" hidden aria-live="polite"></div>
    </section>
${chamada(L, chT || 'Tem funcionários ou vai contratar?', chX || 'A FIDELIS cuida do departamento pessoal da sua empresa, com folha, férias e rescisões calculadas e conferidas.')}`);
  paginas[paginas.length - 1].scripts = ['calculos.js', 'ferramentas.js'];
}

// CONTEÚDOS
pagina('conteudos/', 'Conteúdos', 'Conteúdos e orientações', 'Conteúdos e orientações da FIDELIS sobre MEI, abertura de empresas, obrigações fiscais, Imposto de Renda e departamento pessoal. Em preparação.', (L) => `
${topoPagina('Conteúdos e orientações', 'Orientações claras, revisadas por contador', 'Estamos preparando artigos e guias práticos. Cada conteúdo vai trazer a data da última revisão e a fonte normativa.')}
    <section class="secao">
      ${cab('Em preparação', 'Assuntos que vamos abordar')}
      <ul class="valores">
${C.categoriasConteudo.map((c) => `        <li>${esc(c)}</li>`).join('\n')}
      </ul>
    </section>
${chamada(L)}`);

// PROPOSTA
pagina('proposta/', 'Proposta', 'Solicitar proposta', 'Solicite uma proposta à FIDELIS – Contabilidade & Consultoria. Conte a sua necessidade e receba escopo e honorários por escrito.', (L) => `
${topoPagina('Solicitar proposta', 'Conte um pouco sobre você', 'Leva cerca de 1 minuto. Usamos estes dados somente para responder ao seu pedido.')}
    <section class="secao">
      <form class="form" id="form-orc" novalidate>
        <label>Seu nome<input id="f-nome" name="nome" autocomplete="name" placeholder="Como podemos te chamar?"></label>
        <label>WhatsApp<input id="f-tel" name="tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="(61) 90000-0000"></label>
        <label>Você é
          <select id="f-tipo" name="tipo">
            <option value="">Selecione</option>
            <option value="sem-empresa">Ainda não tenho empresa</option>
            <option value="mei">MEI</option>
            <option value="empresa">Microempresa ou empresa de pequeno porte</option>
            <option value="pf">Pessoa física</option>
          </select>
        </label>
        <label>Assunto
          <select id="f-servico" name="servico">
            <option value="">Selecione</option>
${C.gruposServicos.map((g) => `            <option value="${g.id}">${esc(g.titulo)}</option>`).join('\n')}
            <option value="fidelis-mei">Aplicativo FIDELIS MEI</option>
            <option value="outro">Outro / ainda não sei</option>
          </select>
        </label>
        <label class="larga">Mensagem (opcional)<textarea id="f-msg" name="msg" rows="3" placeholder="Ex.: sou MEI e meu faturamento está perto do limite"></textarea></label>
        <label class="larga consent"><input type="checkbox" id="f-ok"> <span>Concordo que a FIDELIS use estes dados para responder ao meu pedido, conforme a <a href="${L('privacidade/')}">Política de privacidade</a>.</span></label>
        <p class="form-erro larga" id="form-erro" role="alert"></p>
        <button class="btn btn-ouro larga" id="form-enviar" type="submit">Enviar pedido</button>
        <div class="previa larga" id="form-previa" hidden></div>
      </form>
    </section>`);

// ÁREA DO CLIENTE
pagina('area-do-cliente/', 'Área do cliente', 'Área do cliente', 'Portal do Cliente FIDELIS: documentos, obrigações, solicitações e acompanhamento de serviços. Em desenvolvimento.', (L) => `
${topoPagina('Área do cliente', 'Portal do Cliente FIDELIS', 'Documentos, obrigações, solicitações e acompanhamento dos serviços contratados em um só lugar.')}
    <section class="secao">
      <p class="aviso-dev">${selo('dev')} O Portal do Cliente ainda não está disponível. O acesso será liberado aos clientes com login seguro.</p>
      <ul class="lista-recursos lista-recursos-claro">
        <li><b>Documentos</b><span>Envio e download organizados por competência.</span></li>
        <li><b>Obrigações</b><span>O que vence, o que foi pago e o que está pendente.</span></li>
        <li><b>Solicitações</b><span>Peça serviços e acompanhe cada etapa.</span></li>
        <li><b>Orientações</b><span>Instruções da FIDELIS para a sua empresa.</span></li>
      </ul>
      <p><a class="btn btn-linha-escura" href="${L('contato/')}">Falar com a FIDELIS</a></p>
    </section>`);

// CONTATO
pagina('contato/', 'Contato', 'Contato', `Fale com a FIDELIS – Contabilidade & Consultoria em ${E.cidade}. WhatsApp, e-mail e solicitação de proposta.`, (L) => `
${topoPagina('Contato', 'Fale com a FIDELIS', '')}
    <section class="secao">
      <div class="contato-in">
        <div class="contato-info">
          <div class="bloco"><h2>WhatsApp</h2><p>${E.whatsapp ? `<a class="btn btn-marinho js-whats" href="${zap('Olá! Vim pelo site da FIDELIS.')}">Conversar pelo WhatsApp</a>` : pend('Número')}</p></div>
          <div class="bloco"><h2>E-mail</h2><p>${E.email ? `<a href="mailto:${esc(E.email)}">${esc(E.email)}</a>` : pend('E-mail')}</p></div>
          <div class="bloco"><h2>Atendimento</h2><p>${E.horario ? esc(E.horario) : pend('Horário')}</p></div>
          <div class="bloco"><h2>Localização</h2><p>${esc(E.cidade)}${E.endereco ? `<br>${esc(E.endereco)}` : ''}</p>
            ${E.endereco ? `<div class="acoes-mapa"><a class="btn btn-marinho btn-peq" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(E.endereco)}">Como chegar</a> <a class="btn btn-linha-escura btn-peq" target="_blank" rel="noopener" href="https://waze.com/ul?q=${encodeURIComponent(E.endereco)}&navigate=yes">Abrir no Waze</a></div>` : `<p class="nota">${pend('Endereço físico (ou atendimento só online)')}</p>`}
          </div>
        </div>
        <div class="card contato-cta">
          <h2>Prefere explicar com calma?</h2>
          <p>Preencha o pedido de proposta. Respondemos com o escopo e os honorários por escrito.</p>
          <a class="btn btn-ouro" href="${L('proposta/')}">Solicitar proposta</a>
        </div>
      </div>
    </section>`);

// PRIVACIDADE e TERMOS (minutas)
const minuta = (caminho, area, titulo, desc, topicos) => pagina(caminho, area, titulo, desc, (L) => `
${topoPagina('Documento legal', titulo, '')}
    <section class="secao">
      <p class="aviso-dev"><span class="selo selo-futuro">Minuta</span> Este documento está em elaboração e será publicado após a revisão do responsável técnico.</p>
      <h2>O que este documento vai tratar</h2>
      <ul class="checklist">
${topicos.map((t) => `        <li>${esc(t)}</li>`).join('\n')}
      </ul>
    </section>`);
minuta('privacidade/', 'Privacidade', 'Política de privacidade', 'Política de privacidade da FIDELIS – Contabilidade & Consultoria, conforme a Lei Geral de Proteção de Dados (LGPD). Em elaboração.', [
  'Quem é o controlador dos dados e como falar com o encarregado.', 'Quais dados coletamos e para qual finalidade.', 'Bases legais de cada tratamento (sem consentimento genérico).',
  'Com quem os dados podem ser compartilhados.', 'Por quanto tempo os dados são guardados.', 'Direitos do titular e como exercê-los.', 'Segurança e sigilo profissional contábil.', 'Uso de cookies.']);
minuta('termos/', 'Termos', 'Termos de uso', 'Termos de uso do site, das ferramentas gratuitas e do aplicativo FIDELIS MEI. Em elaboração.', [
  'Uso do site e das ferramentas gratuitas.', 'Natureza das simulações (não substituem análise profissional).', 'Regras de uso do aplicativo FIDELIS MEI e dos planos.',
  'Responsabilidades das partes.', 'Cancelamento, exportação e retenção de dados.', 'Propriedade intelectual e marca FIDELIS.']);

/* ---------- gravar ---------- */
for (const pg of paginas) {
  const destino = join(RAIZ, pg.caminho, 'index.html');
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, moldura(pg, pg.corpo));
}
writeFileSync(join(RAIZ, 'dados.js'), `/* Gerado por scripts/gerar-site.mjs — não editar à mão */\nwindow.FIDELIS = ${JSON.stringify({ whatsapp: E.whatsapp, paginas: paginas.map((p) => ({ caminho: p.caminho, titulo: p.titulo, area: p.area })), necessidades: C.necessidades, grupos: C.gruposServicos.map((g) => ({ id: g.id, titulo: g.titulo, itens: g.itens.filter(([, s]) => s !== 'inativo').length })), menu: C.menu }, null, 2)};\n`);
writeFileSync(join(RAIZ, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paginas.map((p) => `  <url><loc>${C.urlBase}${p.caminho}</loc></url>`).join('\n')}\n</urlset>\n`);
// Protótipo: bloqueia indexação. Na versão final trocar por "Allow: /" + Sitemap, e manter Disallow nas áreas privadas.
writeFileSync(join(RAIZ, 'robots.txt'), `# Protótipo — não indexar\nUser-agent: *\nDisallow: /\n`);
// App instalável (PWA): manifesto + service worker "rede primeiro".
// O VERSION muda a cada geração → quem tem o app instalado recebe a versão nova sozinho.
writeFileSync(join(RAIZ, 'manifest.webmanifest'), JSON.stringify({
  name: E.nomeCompleto, short_name: 'FIDELIS', description: 'Contabilidade e consultoria: MEI, empresas, Imposto de Renda e área trabalhista.',
  lang: 'pt-BR', start_url: './?origem=app', scope: './', display: 'standalone',
  background_color: '#081d30', theme_color: '#081d30',
  icons: [
    { src: 'assets/icone-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'assets/icone-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'assets/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}, null, 2));
writeFileSync(join(RAIZ, 'sw.js'), `/* Gerado por scripts/gerar-site.mjs — não editar à mão.
 * Rede primeiro, sem cache HTTP: com internet sempre mostra a versão mais nova (inclusive no app instalado);
 * sem internet usa a última cópia. Só guarda arquivos públicos do site (nenhum dado de cliente). */
const VERSION = '${CARIMBO}';
const CACHE = 'fidelis-' + VERSION;
const CORE = ['./', './estilo.css', './app.js', './dados.js', './manifest.webmanifest', './assets/simbolo-dourado.png', './assets/simbolo-dourado-160.png', './assets/icone-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('fidelis-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const escopo = new URL('./', self.location).href;
  if (url.href.startsWith(escopo)) {
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then((k) => k.put(req, c)); } return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === 'navigate' ? caches.match('./') : undefined)))
    );
  } else if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((k) => k.put(req, c)); return res; })));
  }
});
`);
console.log(`${paginas.length} páginas geradas (v${VERSAO}): ${paginas.map((p) => '/' + p.caminho).join('  ')}`);
