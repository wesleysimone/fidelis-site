/* FIDELIS — comportamento do site (sem dependências) */
(function () {
  'use strict';

  // Dados do escritório (FICTÍCIOS no protótipo — ver documentacao/ANALISE.md, decisões 6 a 9)
  const FIDELIS = {
    whatsapp: '5500000000000',
    endereco: 'Av. Exemplo, 1234 - Sala 101, Centro, Sua Cidade - UF'
  };
  window.FIDELIS = FIDELIS;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const registrar = (msg) => { if (window.Kit && Kit.registrar) Kit.registrar('acao', msg); };
  const linkWhats = (msg) => `https://wa.me/${FIDELIS.whatsapp}?text=${encodeURIComponent(msg)}`;

  // WhatsApp: monta o link já no HTML (abre no toque, sem esperar nada)
  $$('.js-whats').forEach((a) => {
    a.href = linkWhats(a.dataset.msg || 'Olá! Vim pelo site da FIDELIS.');
    a.target = '_blank';
    a.rel = 'noopener';
    a.addEventListener('click', () => registrar('Clicou no WhatsApp (' + (a.id || a.textContent.trim().slice(0, 30)) + ')'));
  });

  // Endereço: Como chegar (Google Maps), Waze e mapa embutido
  const dest = encodeURIComponent(FIDELIS.endereco);
  $('#btn-rota').href = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  $('#btn-waze').href = `https://waze.com/ul?q=${dest}&navigate=yes`;
  $('#mapa').src = `https://www.google.com/maps?q=${dest}&output=embed`;
  $('#btn-rota').addEventListener('click', () => registrar('Abriu Como chegar'));
  $('#btn-waze').addEventListener('click', () => registrar('Abriu o Waze'));

  // Menu do celular
  const menuBtn = $('#menu-btn'), menu = $('#menu');
  const fecharMenu = () => { menu.classList.remove('aberto'); menuBtn.setAttribute('aria-expanded', 'false'); };
  menuBtn.addEventListener('click', () => {
    const abrir = !menu.classList.contains('aberto');
    menu.classList.toggle('aberto', abrir);
    menuBtn.setAttribute('aria-expanded', String(abrir));
  });
  $$('a', menu).forEach((a) => a.addEventListener('click', fecharMenu));

  // Formulário de orçamento → mensagem pronta no WhatsApp
  const form = $('#form-orc'), erro = $('#form-erro');
  const so = (v) => v.replace(/\D/g, '');
  $('#f-tel').addEventListener('input', (e) => {
    const d = so(e.target.value).slice(0, 11);
    e.target.value = d.length > 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
      : d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
      : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = $('#f-nome').value.trim(), tel = so($('#f-tel').value);
    const tipo = $('#f-tipo').value, servico = $('#f-servico').value, msg = $('#f-msg').value.trim();
    $$('.invalido', form).forEach((el) => el.classList.remove('invalido'));
    erro.classList.remove('ok');
    const faltas = [];
    if (nome.length < 2) faltas.push(['#f-nome', 'seu nome']);
    if (tel.length < 10) faltas.push(['#f-tel', 'um WhatsApp com DDD']);
    if (!servico) faltas.push(['#f-servico', 'o serviço de interesse']);
    if (faltas.length) {
      faltas.forEach(([s]) => $(s).classList.add('invalido'));
      erro.textContent = 'Falta informar ' + faltas.map((f) => f[1]).join(', ') + '.';
      $(faltas[0][0]).focus();
      return;
    }
    const texto = [
      'Olá, FIDELIS! Gostaria de um orçamento.',
      `*Nome:* ${nome}`,
      `*WhatsApp:* ${$('#f-tel').value}`,
      tipo && `*Situação:* ${tipo}`,
      `*Serviço:* ${servico}`,
      msg && `*Mensagem:* ${msg}`
    ].filter(Boolean).join('\n');
    window.open(linkWhats(texto), '_blank', 'noopener');
    erro.textContent = 'Pronto! Abrimos o WhatsApp com sua mensagem. É só tocar em enviar.';
    erro.classList.add('ok');
    registrar('Pedido de orçamento enviado pelo WhatsApp');
    form.reset();
  });

  // Dúvidas: registra qual pergunta foi aberta
  $$('.faq details').forEach((d) => d.addEventListener('toggle', () => { if (d.open) registrar('Abriu dúvida: ' + $('summary', d).textContent); }));

  $('#ano').textContent = new Date().getFullYear();
})();
