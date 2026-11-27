/* CONTEÚDO CENTRAL DO SITE FIDELIS (protótipo)
 * Tudo o que aparece no site sai daqui: dados da empresa, menu, serviços, ferramentas e dúvidas.
 * Regra do prompt mestre: NÃO inventar dados. Campo vazio ('') aparece no site como "a definir".
 * Depois de editar: node scripts/gerar-site.mjs
 */

export const empresa = {
  nome: 'FIDELIS',
  nomeCompleto: 'FIDELIS – Contabilidade & Consultoria',
  slogan: 'Confiança que gera futuro',
  cidade: 'Brasília – DF',
  // ↓ a definir pelo proprietário (deixe '' enquanto não houver o dado real)
  whatsapp: '',          // só números com DDI, ex.: '5561900000000'
  telefone: '',
  email: '',
  instagram: '',         // usuário sem @
  endereco: '',          // vazio = sem endereço físico divulgado
  cnpj: '',
  razaoSocial: 'FIDELIS – Contabilidade & Consultoria', // autorizado pelo Wesley em 27/11/2026 (sem CNPJ ainda)
  responsavel: '',       // nome do contador responsável
  crc: '',               // ex.: 'CRC-DF 000000/O-0'
  horario: ''
};

// URL pública (usada no sitemap e no Open Graph)
export const urlBase = 'https://wesleysimone.github.io/fidelis-site/';

// Menu principal (ordem do prompt mestre, item 6.1). "botao" = aparece como botão.
export const menu = [
  { rotulo: 'Início', href: '' },
  { rotulo: 'Sobre', href: 'sobre/' },
  { rotulo: 'Serviços', href: 'servicos/' },
  { rotulo: 'Espaço MEI', href: 'espaco-mei/' },
  { rotulo: 'FIDELIS MEI', href: 'fidelis-mei/' },
  { rotulo: 'Ferramentas', href: 'ferramentas/' },
  { rotulo: 'Conteúdos', href: 'conteudos/' },
  { rotulo: 'Contato', href: 'contato/' },
  { rotulo: 'Área do cliente', href: 'area-do-cliente/', botao: 'linha' },
  { rotulo: 'Solicitar proposta', href: 'proposta/', botao: 'ouro' }
];

// Área "Do que você precisa?" (prompt 6.2)
export const necessidades = [
  { rotulo: 'Quero abrir um MEI', href: 'espaco-mei/#abrir' },
  { rotulo: 'Já sou MEI', href: 'espaco-mei/#ja-sou-mei' },
  { rotulo: 'Quero regularizar minha empresa', href: 'servicos/empresas/#regularizacao' },
  { rotulo: 'Quero abrir uma empresa', href: 'servicos/empresas/' },
  { rotulo: 'Preciso declarar meu Imposto de Renda', href: 'servicos/imposto-de-renda/' },
  { rotulo: 'Preciso de consultoria trabalhista', href: 'servicos/trabalhista/' },
  { rotulo: 'Preciso organizar as finanças do meu negócio', href: 'fidelis-mei/' },
  { rotulo: 'Quero conhecer as ferramentas gratuitas', href: 'ferramentas/' }
];

/* Serviços (prompt 6.3). situacao: 'ativo' | 'consulta' (sob consulta) | 'futuro' | 'inativo' (não aparece)
 * Todos começam 'ativo' porque foram listados pelo proprietário para divulgação — confirmar um a um. */
export const gruposServicos = [
  {
    id: 'mei', titulo: 'Serviços para o MEI', icone: 'mei',
    resumo: 'Da formalização ao acompanhamento mensal, com atenção ao limite de faturamento.',
    itens: [
      ['Orientação para formalização', 'ativo'], ['Abertura de MEI', 'ativo'], ['Alteração cadastral', 'ativo'],
      ['Baixa de MEI', 'ativo'], ['Regularização de débitos', 'ativo'], ['Parcelamento', 'ativo'],
      ['Declaração anual DASN-SIMEI', 'ativo'], ['Orientação sobre emissão de notas fiscais', 'ativo'],
      ['Controle de faturamento', 'ativo'], ['Consultoria sobre desenquadramento', 'ativo'],
      ['Migração de MEI para ME', 'ativo'], ['Acompanhamento mensal', 'ativo']
    ]
  },
  {
    id: 'empresas', titulo: 'Serviços empresariais', icone: 'empresa',
    resumo: 'Abertura, alterações, regularização e orientação sobre o melhor enquadramento tributário.',
    itens: [
      ['Abertura de empresas', 'ativo'], ['Alterações contratuais', 'ativo'], ['Encerramento de empresas', 'ativo'],
      ['Regularização empresarial', 'ativo', 'regularizacao'], ['Consultoria contábil', 'ativo'], ['Consultoria tributária', 'ativo'],
      ['Orientação sobre regimes tributários', 'ativo'], ['Simples Nacional', 'ativo']
    ]
  },
  {
    id: 'imposto-de-renda', titulo: 'Imposto de Renda', icone: 'ir',
    resumo: 'Declaração de pessoa física com cuidado, incluindo a análise dos rendimentos do titular de MEI.',
    itens: [
      ['Declaração de Imposto de Renda Pessoa Física', 'ativo'], ['Orientação tributária', 'ativo'],
      ['Retificação de declarações', 'ativo'], ['Regularização de pendências', 'ativo'],
      ['Análise dos rendimentos do titular de MEI', 'ativo']
    ]
  },
  {
    id: 'trabalhista', titulo: 'Departamento pessoal e área trabalhista', icone: 'pessoas',
    resumo: 'Consultoria e auditoria de folha para reduzir riscos e custos com a sua equipe.',
    itens: [
      ['Consultoria trabalhista', 'ativo'], ['Auditoria de folha de pagamento', 'ativo'], ['Conferência de rescisões', 'ativo'],
      ['Revisão de encargos', 'ativo'], ['Diagnóstico de riscos trabalhistas', 'ativo'],
      ['Orientações sobre admissões, férias e desligamentos', 'ativo'], ['Simulação de custos de contratação', 'ativo']
    ]
  }
];

/* Ferramentas (prompt 7). Situação 'teste': funcionam no protótipo para conferência, com tabelas pendentes de revisão do contador. */
export const ferramentas = [
  { nome: 'Simulador de limite e faturamento do MEI', slug: 'limite-mei', situacao: 'teste', desc: 'Veja quanto do limite anual você já usou e a projeção até dezembro.' },
  { nome: 'Calculadora de salário líquido', slug: 'salario-liquido', situacao: 'teste', desc: 'Descontos de INSS e IRRF com a tabela vigente e a data de referência.' },
  { nome: 'Calculadora de férias', slug: 'calculadora-ferias', situacao: 'teste', desc: 'Valor das férias com o terço constitucional e os descontos.' },
  { nome: 'Calculadora de rescisão trabalhista', slug: 'calculadora-rescisao', situacao: 'teste', desc: 'Estimativa das verbas rescisórias conforme o tipo de desligamento.' },
  { nome: 'Custo de contratação de empregado', slug: 'custo-contratacao', situacao: 'teste', desc: 'Quanto um funcionário custa por mês, além do salário.' },
  { nome: 'Simulação MEI x ME', slug: 'mei-x-me', situacao: 'teste', desc: 'Compare o custo de continuar MEI com o de virar ME no Simples Nacional.' }
];
export const ferramentasFuturas = ['13º salário', 'Horas extras', 'Adicional noturno', 'IRRF', 'INSS', 'Pró-labore', 'CLT x PJ', 'Simples Nacional', 'Fator R', 'Desenquadramento do MEI', 'IR do titular de MEI', 'Margem de lucro', 'Preço de venda', 'Ponto de equilíbrio'];

/* FIDELIS MEI (prompt 5, 9, 10). Situação geral: em desenvolvimento. Preços NÃO aparecem (são estudo). */
export const appRecursos = [
  ['Receitas e despesas', 'Lançamentos simples, separando o que é faturamento do que não é.'],
  ['Faturamento e limite do MEI', 'Quanto do limite anual já foi usado, com alertas configuráveis.'],
  ['Projeção até o fim do ano', 'Estimativa com base no histórico, para agir antes do problema.'],
  ['Obrigações e DAS', 'Calendário com vencimentos e registro do pagamento.'],
  ['Relatório mensal de receitas', 'Consolidação do mês pronta para conferir e guardar em PDF.'],
  ['No computador e no celular', 'Instala como aplicativo, sem loja e sem baixar atualização.']
];

/* Calendário de categorias de conteúdo (prompt 22.1) */
export const categoriasConteudo = ['MEI', 'Abertura de empresas', 'Obrigações fiscais', 'Imposto de Renda', 'Simples Nacional', 'Departamento pessoal', 'Notas fiscais', 'Desenquadramento', 'Orientações financeiras'];

/* Links oficiais (prompt 14). Conferir periodicamente: os portais do governo mudam de endereço. */
export const linksOficiais = [
  ['Portal do Empreendedor (gov.br)', 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor', 'Abertura, alteração, baixa e serviços do MEI'],
  ['PGMEI – emitir o DAS', 'https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao', 'Guia mensal do MEI'],
  ['DASN-SIMEI – declaração anual', 'https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/dasnsimei.app/Identificacao', 'Declaração anual de faturamento'],
  ['Emissor Nacional de NFS-e', 'https://www.nfse.gov.br/EmissorNacional', 'Nota fiscal de serviço'],
  ['Consulta de CNPJ (Receita Federal)', 'https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp', 'Situação cadastral da empresa']
];

/* Perguntas frequentes (prompt 6.2) — sem promessas nem números que dependam de validação */
export const duvidas = [
  ['O que é o MEI?', 'O Microempreendedor Individual é a forma simplificada de formalizar quem trabalha por conta própria. Ele tem limite anual de faturamento e uma lista de atividades permitidas, definidos em lei, e paga os tributos em uma guia mensal (DAS).'],
  ['Meu faturamento está crescendo. Posso continuar MEI?', 'Depende do quanto você fatura no ano e de outras condições do enquadramento. Quando o faturamento se aproxima do limite, vale fazer uma análise preventiva para planejar a mudança para microempresa (ME) no momento certo, sem multas nem surpresas.'],
  ['O aplicativo FIDELIS MEI já está disponível?', 'Ainda não. Ele está em desenvolvimento. Será um benefício incluso nos planos de acompanhamento contábil elegíveis, e também poderá ser contratado separadamente.'],
  ['Como funciona a troca de contador?', 'Você nos autoriza, combinamos a data de início e cuidamos da transição dos documentos com o contador anterior, sem interromper as suas obrigações.'],
  ['Quanto custam os serviços?', 'Depende do serviço e da situação da sua empresa. Depois de entender a sua necessidade, enviamos uma proposta com o escopo e os honorários por escrito.']
];
