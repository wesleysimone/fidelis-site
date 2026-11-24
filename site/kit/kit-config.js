/* Configuração do KIT PROTÓTIPO — FIDELIS Contabilidade & Consultoria */
window.KIT_CONFIG = {
  nome: 'FIDELIS Contabilidade & Consultoria',
  prefixo: 'fid',
  versao: '0.1.0',
  cor: '#061A33',
  responsavel: 'Wesley',
  adminLocal: 'wesley',
  whatsapp: '',

  modos: [],

  areas: ['Abertura', 'Pilares', 'Serviços', 'Para quem', 'Propósito', 'Como funciona', 'Orçamento', 'Dúvidas', 'Contato', 'Topo / menu', 'Rodapé', 'Visual / cores', 'Textos', 'Geral'],
  areaDaTela: () => {
    const mapa = { inicio: 'Abertura', servicos: 'Serviços', 'para-quem': 'Para quem', proposito: 'Propósito', 'como-funciona': 'Como funciona', orcamento: 'Orçamento', duvidas: 'Dúvidas', contato: 'Contato' };
    // seção que está no meio da tela
    const y = window.innerHeight / 2;
    for (const s of document.querySelectorAll('main section[id]')) {
      const r = s.getBoundingClientRect();
      if (r.top <= y && r.bottom >= y) return mapa[s.id] || 'Geral';
    }
    return 'Geral';
  },
  tela: () => 'Site › ' + window.KIT_CONFIG.areaDaTela(),

  funcionalidades: [
    [/orçamento/i, 'Pedido de orçamento'],
    [/whats/i, 'Contato pelo WhatsApp'],
    [/como chegar|waze/i, 'Como chegar'],
    [/dúvida/i, 'Dúvidas frequentes']
  ],

  apiUrl: ''
};
