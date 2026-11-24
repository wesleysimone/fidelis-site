/* FIDELIS — comportamento do site (sem dependências). Dados em dados.js (gerado a partir de scripts/conteudo.mjs). */
(function () {
  'use strict';
  const D = window.FIDELIS || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const registrar = (msg) => { if (window.Kit && Kit.registrar) Kit.registrar('acao', msg); };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // WhatsApp (só existe quando houver número oficial). Abre no toque.
  $$('.js-whats').forEach((a) => {
    a.target = '_blank'; a.rel = 'noopener';
    a.addEventListener('click', () => registrar('Clicou no WhatsApp'));
  });

  // Menu do celular/tablet
  const menuBtn = $('#menu-btn'), menu = $('#menu');
  if (menuBtn && menu) {
    const fechar = () => { menu.classList.remove('aberto'); menuBtn.setAttribute('aria-expanded', 'false'); };
    menuBtn.addEventListener('click', () => {
      const abrir = !menu.classList.contains('aberto');
      menu.classList.toggle('aberto', abrir);
      menuBtn.setAttribute('aria-expanded', String(abrir));
    });
    $$('a', menu).forEach((a) => a.addEventListener('click', fechar));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
  }

  // Dúvidas
  $$('.faq details').forEach((d) => d.addEventListener('toggle', () => { if (d.open) registrar('Abriu dúvida: ' + $('summary', d).textContent); }));

  // Formulário de proposta
  const form = $('#form-orc');
  if (form) {
    const erro = $('#form-erro'), previa = $('#form-previa');
    const so = (v) => v.replace(/\D/g, '');
    const interesse = new URLSearchParams(location.search).get('interesse');
    if (interesse) {
      if ($(`#f-servico option[value="${CSS.escape(interesse)}"]`)) $('#f-servico').value = interesse;
      if (interesse === 'mei') { $('#f-tipo').value = 'sem-empresa'; $('#f-servico').value = 'mei'; }
    }
    $('#f-tel').addEventListener('input', (e) => {
      const d = so(e.target.value).slice(0, 11);
      e.target.value = d.length > 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
        : d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
        : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = $('#f-nome').value.trim(), tel = so($('#f-tel').value);
      const tipo = $('#f-tipo'), servico = $('#f-servico'), msg = $('#f-msg').value.trim();
      $$('.invalido', form).forEach((el) => el.classList.remove('invalido'));
      erro.classList.remove('ok'); previa.hidden = true;
      const faltas = [];
      if (nome.length < 2) faltas.push(['#f-nome', 'seu nome']);
      if (tel.length < 10) faltas.push(['#f-tel', 'um WhatsApp com DDD']);
      if (!servico.value) faltas.push(['#f-servico', 'o assunto']);
      if (!$('#f-ok').checked) faltas.push(['#f-ok', 'a sua concordância com o uso dos dados']);
      if (faltas.length) {
        faltas.forEach(([s]) => $(s).classList.add('invalido'));
        erro.textContent = 'Falta informar ' + faltas.map((f) => f[1]).join(', ') + '.';
        $(faltas[0][0]).focus();
        return;
      }
      const texto = [
        'Olá, FIDELIS! Gostaria de uma proposta.',
        `*Nome:* ${nome}`,
        `*WhatsApp:* ${$('#f-tel').value}`,
        tipo.value && `*Perfil:* ${tipo.selectedOptions[0].text}`,
        `*Assunto:* ${servico.selectedOptions[0].text}`,
        msg && `*Mensagem:* ${msg}`
      ].filter(Boolean).join('\n');
      if (D.whatsapp) {
        window.open(`https://wa.me/${D.whatsapp}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
        erro.textContent = 'Pronto! Abrimos o WhatsApp com o seu pedido. É só tocar em enviar.';
      } else {
        // Protótipo: ainda não há número oficial. Mostra como a mensagem chegaria.
        previa.innerHTML = '<b>Protótipo:</b> o número oficial do WhatsApp ainda não foi definido. O pedido chegaria assim:<pre>' + esc(texto) + '</pre>';
        previa.hidden = false;
        erro.textContent = 'Pedido montado (prévia abaixo).';
      }
      erro.classList.add('ok');
      registrar('Pedido de proposta enviado (' + servico.selectedOptions[0].text + ')');
    });
  }
})();
