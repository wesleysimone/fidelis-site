/* Telas das ferramentas gratuitas no PROTÓTIPO: o cálculo roda no próprio navegador (calculos.js),
 * com as mesmas regras e textos da plataforma. Na versão final o cálculo é feito no servidor. */
(function () {
  'use strict';
  const form = document.getElementById('form-ferr');
  if (!form || !window.FidelisCalc) return;
  const slug = form.dataset.ferramenta;
  const $ = (id) => document.getElementById(id);
  const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const dataBR = (iso) => iso.split('-').reverse().join('/');
  const aviso = '<p class="aviso-dev"><b>Protótipo:</b> tabelas ainda pendentes de revisão pelo contador. Os valores servem para teste.</p>';

  // rescisão: só mostra os tipos de aviso que fazem sentido para o desligamento escolhido
  const tipo = $('t-tipo'), avisoSel = $('t-aviso');
  function filtrarAviso() {
    let primeiro = null;
    for (const o of avisoSel.options) {
      const ok = o.dataset.tipos.split(' ').includes(tipo.value);
      o.hidden = o.disabled = !ok;
      if (ok && !primeiro) primeiro = o;
    }
    if (avisoSel.selectedOptions[0].disabled) avisoSel.value = primeiro.value;
  }
  if (tipo && avisoSel) { tipo.addEventListener('change', filtrarAviso); filtrarAviso(); }

  function dados() {
    const d = {};
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'checkbox') d[el.name] = el.checked;
      else if (el.type === 'number' || ['ferias_vencidas', 'mes_referencia', 'ano'].includes(el.name)) d[el.name] = Number(el.value || 0);
      else if (el.value.trim() !== '') d[el.name] = el.value.trim();
    }
    return d;
  }

  function telaLimite(d) {
    const s = d.situacao, p = d.projecao, pct = Math.min(Number(s.percentual), 130);
    const cor = s.classificacao === 'dentro_do_limite' ? (Number(s.percentual) >= 80 ? '#a17c40' : '#1f6f43') : '#b03a2e';
    return `<h2>Resultado</h2>
      <p class="res-num" style="color:${cor}">${s.percentual.replace('.', ',')}% do limite</p>
      <div class="barra" role="img" aria-label="${s.percentual}% do limite usado"><span style="width:${(pct / 130) * 100}%;background:${cor}"></span><i style="left:${(100 / 130) * 100}%"></i></div>
      <dl class="res-lista">
        <dt>Limite aplicável</dt><dd>${brl(d.limite.valor)}${d.limite.proporcional ? ` (proporcional: ${d.limite.meses} meses)` : ''}</dd>
        <dt>Faturado</dt><dd>${brl(s.faturado)}</dd>
        <dt>${Number(s.excesso) > 0 ? 'Excesso' : 'Ainda disponível'}</dt><dd>${brl(Number(s.excesso) > 0 ? s.excesso : s.restante)}</dd>
        <dt>Projeção até dezembro</dt><dd>${brl(p.projetado_ano)} (${p.percentual_projetado.replace('.', ',')}% do limite)</dd>
      </dl>
      <p><b>${esc(s.mensagem)}</b></p>${p.orientacao ? `<p>${esc(p.orientacao)}</p>` : ''}`;
  }

  function telaMxm(x) {
    const dif = x.diferenca_anual == null ? null : Number(x.diferenca_anual), pct = (v) => (v == null ? '—' : String(v).replace('.', ',') + '%');
    return x.avisos.map((a) => `<p class="aviso-dev">${esc(a)}</p>`).join('') +
      `<h2>Resultado</h2>
       <table class="tabela-res"><thead><tr><th>Custo por ano</th><th>MEI</th><th>ME (Simples)</th></tr></thead><tbody>
         <tr><td>Imposto (DAS)</td><td>${brl(x.mei.anual)}<br><small>${brl(x.mei.das_mensal)} por mês</small></td><td>${x.me.simples_anual == null ? '—' : brl(x.me.simples_anual)}<br><small>alíquota efetiva ${pct(x.me.aliquota_efetiva)}</small></td></tr>
         <tr><td>INSS do titular (pró-labore)</td><td>incluído no DAS</td><td>${brl(x.me.inss_pro_labore_anual)}</td></tr>
         <tr><td>Outros custos informados</td><td>—</td><td>${brl(x.me.outros_custos_anual)}</td></tr>
       </tbody><tfoot><tr><th>Total</th><th>${brl(x.mei.anual)}</th><th>${x.me.anual == null ? '—' : brl(x.me.anual)}</th></tr></tfoot></table>
       ${dif == null ? '' : `<p class="res-num">${dif > 0 ? 'A ME custaria ' + brl(dif) + ' a mais por ano' : 'A ME custaria ' + brl(-dif) + ' a menos por ano'}</p>`}`;
  }

  function telaTabela(d) {
    const custo = slug === 'custo-contratacao', x = d.extras;
    const linhas = d.linhas.filter((l) => l.tipo !== 'info');
    let extra = '';
    if (custo) {
      extra = `<dl class="res-lista"><dt>Custo por ano</dt><dd>${brl(x.anual)}</dd><dt>Acima do salário</dt><dd>${x.sobre_salario.replace('.', ',')}%</dd><dt>Regime</dt><dd>${esc(x.regime)}</dd></dl>` +
        (x.avisos || []).map((a) => `<p class="aviso-dev">${esc(a)}</p>`).join('');
    } else if (slug === 'calculadora-rescisao') {
      extra = `<h3>FGTS e seguro-desemprego</h3><dl class="res-lista">
        <dt>Depósito de FGTS do mês da rescisão</dt><dd>${brl(x.fgts_mes_rescisao)}</dd>
        <dt>Multa do FGTS (${x.multa_percentual.replace('.00', '')}%)</dt><dd>${brl(x.multa_fgts)}</dd>
        <dt>Saque do FGTS</dt><dd>${esc(x.saque_fgts)}</dd><dt>Seguro-desemprego</dt><dd>${esc(x.seguro_desemprego)}</dd>
        ${x.dias_aviso ? `<dt>Fim do contrato com a projeção do aviso</dt><dd>${dataBR(x.data_projetada)}</dd>` : ''}</dl>
        <p class="nota">O FGTS e a multa são depositados na conta do FGTS; não entram no valor líquido acima.</p>`;
    } else if (slug === 'calculadora-ferias' && x.dias === 0) {
      extra = '<p class="aviso-dev">Com mais de 32 faltas sem justificativa no período aquisitivo, não há direito a férias (CLT art. 130).</p>';
    }
    return `<h2>Resultado</h2>
      <p class="res-num" id="res-valor">${custo ? 'Custo mensal: ' : 'Valor líquido: '}${brl(d.liquido)}</p>
      <table class="tabela-res"><thead><tr><th>Item</th><th>${custo ? 'Valor' : 'Proventos'}</th>${custo ? '' : '<th>Descontos</th>'}</tr></thead><tbody>
      ${linhas.map((l) => `<tr><td>${esc(l.descricao)}${l.obs ? `<br><small>${esc(l.obs)}</small>` : ''}</td>
         <td>${l.tipo === 'provento' ? brl(l.valor) : ''}</td>${custo ? '' : `<td>${l.tipo === 'desconto' ? brl(l.valor) : ''}</td>`}</tr>`).join('')}
      </tbody><tfoot><tr><th>Total</th><th>${brl(d.total_proventos)}</th>${custo ? '' : `<th>${brl(d.total_descontos)}</th>`}</tr></tfoot></table>${extra}`;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const erro = $('t-erro'), out = $('t-resultado');
    erro.textContent = ''; out.hidden = true;
    try {
      const d = window.FidelisCalc.calcular(slug, dados());
      out.innerHTML = aviso + (slug === 'limite-mei' ? telaLimite(d) : slug === 'mei-x-me' ? telaMxm(d) : telaTabela(d)) +
        `<h3>Premissas</h3><ul>${d.premissas.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
         <p class="nota">Data de referência: ${dataBR(d.data_referencia)} · Fontes: ${d.fontes.map(esc).join('; ')}<br>${esc(d.limitacoes)}</p>
         <p><a class="btn btn-ouro" href="${form.dataset.proposta}">Quero uma análise da FIDELIS</a></p>`;
      out.hidden = false;
      out.dataset.liquido = d.liquido || (d.situacao && d.situacao.percentual) || '';
      if (window.Kit && window.Kit.registrar) window.Kit.registrar('acao', `Calculou: ${document.title.split(' | ')[0]}`);
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) { erro.textContent = err.message; }
  });
})();
