/* Configuração do KIT PROTÓTIPO — FIDELIS Contabilidade & Consultoria */
window.KIT_CONFIG = {
  nome: 'FIDELIS Contabilidade & Consultoria',
  prefixo: 'fid',
  versao: '0.3.0',
  cor: '#081D30',
  responsavel: 'Wesley',
  adminLocal: 'wesley',
  whatsapp: '',

  modos: [],

  areas: ['Início', 'Sobre', 'Serviços', 'Espaço MEI', 'FIDELIS MEI', 'Ferramentas', 'Conteúdos', 'Proposta', 'Área do cliente', 'Contato', 'Privacidade', 'Termos', 'Topo / menu', 'Rodapé', 'Visual / cores', 'Textos', 'Geral'],
  areaDaTela: () => document.body.dataset.pagina || 'Geral',
  tela: () => document.title.split(' | ')[0],

  funcionalidades: [
    [/proposta/i, 'Pedido de proposta'],
    [/whats/i, 'Contato pelo WhatsApp'],
    [/dúvida/i, 'Dúvidas frequentes'],
    [/calcul|ferramenta|simulador/i, 'Ferramentas gratuitas']
  ],

  apiUrl: ''
};
