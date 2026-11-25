/* Cálculos das ferramentas gratuitas — versão do PROTÓTIPO (sem servidor).
 * Espelha exatamente as regras da plataforma (Python): mesmas fórmulas, mesmos textos, mesmo arredondamento
 * (centavo, meio para cima). Usa frações exatas com BigInt: nenhum número quebrado de ponto flutuante.
 * Tabelas de 2026 e do MEI: PENDENTES DE REVISÃO pelo contador responsável.
 */
(function (raiz) {
  'use strict';

  // ------------------------------------------------------------ frações exatas
  const abs = (x) => (x < 0n ? -x : x);
  const mdc = (a, b) => { a = abs(a); b = abs(b); while (b) [a, b] = [b, a % b]; return a || 1n; };
  class Q {
    constructor(n, d = 1n) { if (d < 0n) { n = -n; d = -d; } const g = mdc(n, d); this.n = n / g; this.d = d / g; }
    static de(v) {
      if (v instanceof Q) return v;
      if (typeof v === 'bigint') return new Q(v);
      if (typeof v === 'number') { if (!Number.isInteger(v)) throw new TypeError('Use texto para valores com casas decimais'); return new Q(BigInt(v)); }
      const s = String(v).trim(), m = s.match(/^(-?)(\d+)(?:\.(\d+))?$/);
      if (!m) throw new Error('Valor inválido');
      const casas = (m[3] || '');
      return new Q(BigInt((m[1] || '') + m[2] + casas), 10n ** BigInt(casas.length));
    }
    mais(o) { o = Q.de(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
    menos(o) { o = Q.de(o); return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
    vezes(o) { o = Q.de(o); return new Q(this.n * o.n, this.d * o.d); }
    div(o) { o = Q.de(o); return new Q(this.n * o.d, this.d * o.n); }
    cmp(o) { o = Q.de(o); const a = this.n * o.d, b = o.n * this.d; return a < b ? -1 : a > b ? 1 : 0; }
    // arredonda para `casas` casas, meio para cima (afastando do zero, como ROUND_HALF_UP do Python)
    arred(casas = 2) {
      const e = 10n ** BigInt(casas), num = abs(this.n) * e * 2n + this.d, den = this.d * 2n;
      const q = num / den;
      return new Q(this.n < 0n ? -q : q, e);
    }
    txt(casas = 2) {
      const r = this.arred(casas), e = 10n ** BigInt(casas), v = r.n * (e / r.d), neg = v < 0n, a = abs(v);
      const int = (a / e).toString(), dec = (a % e).toString().padStart(casas, '0');
      return (neg ? '-' : '') + int + (casas ? '.' + dec : '');
    }
  }
  const q = (v) => Q.de(v);
  const din = (v) => q(v).arred(2);
  const max = (a, b) => (q(a).cmp(b) >= 0 ? q(a) : q(b));
  const min = (a, b) => (q(a).cmp(b) <= 0 ? q(a) : q(b));
  const ZERO = q(0);

  // ------------------------------------------------------------ parâmetros (cópia da tabela parametros_legais)
  const PENDENTE = 'pendente_revisao';
  const P = {
    'trab.salario_minimo': { situacao: PENDENTE, fonte: 'Decreto do salário mínimo de 2026 (conferir número no Planalto)', valor: { valor: '1621.00' } },
    'trab.inss_empregado': { situacao: PENDENTE, fonte: 'Portaria Interministerial MPS/MF nº 13, de 09/01/2026',
      valor: { faixas: [{ ate: '1621.00', aliquota: '0.075' }, { ate: '2902.84', aliquota: '0.09' }, { ate: '4354.27', aliquota: '0.12' }, { ate: '8475.55', aliquota: '0.14' }], teto: '8475.55' } },
    'trab.irrf_tabela': { situacao: PENDENTE, fonte: 'Lei 9.250/1995, art. 4º, com a tabela da Lei 15.191/2025 (conferir)',
      valor: { faixas: [{ ate: '2428.80', aliquota: '0', deducao: '0' }, { ate: '2826.65', aliquota: '0.075', deducao: '182.16' }, { ate: '3751.05', aliquota: '0.15', deducao: '394.16' },
        { ate: '4664.68', aliquota: '0.225', deducao: '675.49' }, { ate: null, aliquota: '0.275', deducao: '908.73' }], deducao_dependente: '189.59', desconto_simplificado: '607.20' } },
    'trab.irrf_reducao': { situacao: PENDENTE, fonte: 'Lei 15.270/2025 (art. 3º-A da Lei 9.250/1995). Conferir se a redução vale para o 13º (fontes divergem)',
      valor: { limite_isencao: '5000.00', reducao_maxima: '312.89', limite_superior: '7350.00', constante: '978.62', fator: '0.133145', aplica_13: true } },
    'trab.fgts': { situacao: PENDENTE, fonte: 'Lei 8.036/1990, arts. 15 e 18; CLT art. 484-A', valor: { aliquota: '0.08', multa_sem_justa_causa: '0.40', multa_acordo: '0.20' } },
    'trab.encargos_patronais': { situacao: PENDENTE, fonte: 'Lei 8.212/1991, art. 22; LC 123/2006, art. 18-C (MEI); terceiros conforme o FPAS da atividade',
      valor: { inss_patronal: '0.20', terceiros_padrao: '0.058', cpp_mei: '0.03' } },
    'mei.limite_anual': { situacao: PENDENTE, fonte: 'LC 123/2006, art. 18-A, §§ 1º, 2º e 7º (conferir alterações posteriores)', valor: { valor: '81000.00' } },
    'mei.limite_mensal_proporcional': { situacao: PENDENTE, fonte: 'LC 123/2006, art. 18-A, §§ 1º, 2º e 7º (conferir alterações posteriores)', valor: { valor: '6750.00' } },
    'mei.tolerancia_excesso': { situacao: PENDENTE, fonte: 'LC 123/2006, art. 18-A, §§ 1º, 2º e 7º (conferir alterações posteriores)', valor: { percentual: '0.20' } },
    'mei.faixas_alerta': { situacao: PENDENTE, fonte: 'Configuração interna FIDELIS (não normativa)', valor: { faixas: [50, 70, 80, 90, 100] } }
  };
  const MAPA = { salario_minimo: 'trab.salario_minimo', inss: 'trab.inss_empregado', irrf: 'trab.irrf_tabela', redutor: 'trab.irrf_reducao', fgts: 'trab.fgts', encargos: 'trab.encargos_patronais' };
  const pTrab = () => Object.fromEntries(Object.entries(MAPA).map(([k, c]) => [k, P[c].valor]));

  // ------------------------------------------------------------ datas (dias de calendário, sem fuso)
  const dia = 86400000;
  const D = (iso) => { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) throw new Error('Data inválida'); const t = Date.UTC(+m[1], +m[2] - 1, +m[3]); if (new Date(t).getUTCDate() !== +m[3]) throw new Error('Data inválida'); return t; };
  const ano = (t) => new Date(t).getUTCFullYear(), mes = (t) => new Date(t).getUTCMonth() + 1, dd = (t) => new Date(t).getUTCDate();
  const iso = (t) => new Date(t).toISOString().slice(0, 10);
  const diasNoMes = (a, m) => new Date(Date.UTC(a, m, 0)).getUTCDate();
  const somarMeses = (t, n) => { const z = mes(t) - 1 + n, a = ano(t) + Math.floor(z / 12), m = (z % 12 + 12) % 12 + 1; return Date.UTC(a, m - 1, Math.min(dd(t), diasNoMes(a, m))); };
  const anosCompletos = (i, f) => { let n = ano(f) - ano(i); if (mes(f) < mes(i) || (mes(f) === mes(i) && dd(f) < dd(i))) n--; return Math.max(n, 0); };
  const hoje = () => { const h = new Date(); return Date.UTC(h.getFullYear(), h.getMonth(), h.getDate()); };

  // ------------------------------------------------------------ INSS e IRRF
  function inssEmpregado(base, t) {
    base = min(base, t.teto);
    let total = ZERO, ant = ZERO;
    for (const f of t.faixas) {
      if (base.cmp(ant) <= 0) break;
      total = total.mais(min(base, f.ate).menos(ant).vezes(f.aliquota));
      ant = q(f.ate);
    }
    return din(total);
  }
  function irrfTabela(base, t) {
    for (const f of t.faixas) if (f.ate === null || base.cmp(f.ate) <= 0) return max(din(base.vezes(f.aliquota).menos(f.deducao)), ZERO);
    throw new Error('Tabela de IRRF sem faixa final');
  }
  function reducaoIrrf(r, imposto, red) {
    r = q(r);
    let v;
    if (r.cmp(red.limite_isencao) <= 0) v = q(red.reducao_maxima);
    else if (r.cmp(red.limite_superior) <= 0) v = q(red.constante).menos(q(red.fator).vezes(r));
    else v = ZERO;
    return min(din(max(v, ZERO)), imposto);
  }
  function irrfMensal(rend, inss, dependentes, t, red, outras = '0') {
    const r = q(rend), legais = q(inss).mais(q(t.deducao_dependente).vezes(dependentes)).mais(outras), simpl = q(t.desconto_simplificado);
    const [metodo, ded] = simpl.cmp(legais) > 0 ? ['desconto_simplificado', simpl] : ['deducoes_legais', legais];
    const base = din(max(r.menos(ded), ZERO)), bruto = irrfTabela(base, t), redu = red ? reducaoIrrf(r, bruto, red) : ZERO;
    return { imposto: din(bruto.menos(redu)), base, metodo, imposto_tabela: bruto, reducao: redu };
  }

  // ------------------------------------------------------------ resultado no mesmo formato da API
  const L = (descricao, valor, tipo, obs = '') => ({ descricao, valor: din(valor), tipo, obs });
  function resultado(linhas, extras = {}) {
    const soma = (tp) => linhas.filter((l) => l.tipo === tp).reduce((a, l) => a.mais(l.valor), ZERO);
    const prov = din(soma('provento')), desc = din(soma('desconto'));
    return { linhas, prov, desc, liquido: din(prov.menos(desc)), extras };
  }
  const aliqEfetiva = (v, base) => (base.cmp(0) > 0 ? `alíquota efetiva ${v.div(base).vezes(100).txt(2)}%`.replace(/\./g, ',') : '');
  function obsIrrf(ir) {
    let s = `base ${ir.base.txt()} (${ir.metodo === 'desconto_simplificado' ? 'desconto simplificado' : 'deduções legais'})`;
    if (ir.reducao.cmp(0) > 0) s += `; imposto pela tabela ${ir.imposto_tabela.txt()} menos redução de ${ir.reducao.txt()}`;
    return s.replace(/\./g, ',');
  }

  // ------------------------------------------------------------ ferramentas
  function salarioLiquido(sal, p, { dependentes = 0, outros_proventos = '0', outros_descontos = '0' } = {}) {
    const bruto = din(q(sal).mais(outros_proventos)), inss = inssEmpregado(bruto, p.inss), ir = irrfMensal(bruto, inss, dependentes, p.irrf, p.redutor);
    const linhas = [L('Salário bruto', sal, 'provento')];
    if (q(outros_proventos).cmp(0) > 0) linhas.push(L('Outros proventos tributáveis', outros_proventos, 'provento'));
    linhas.push(L('INSS', inss, 'desconto', aliqEfetiva(inss, bruto)), L('IRRF', ir.imposto, 'desconto', obsIrrf(ir)));
    if (q(outros_descontos).cmp(0) > 0) linhas.push(L('Outros descontos', outros_descontos, 'desconto'));
    return resultado(linhas, { irrf: ir, base_inss: bruto });
  }

  function diasFeriasPorFaltas(f) {
    if (f < 0) throw new Error('Faltas não podem ser negativas.');
    for (const [lim, d] of [[5, 30], [14, 24], [23, 18], [32, 12]]) if (f <= lim) return d;
    return 0;
  }

  function ferias(sal, p, { faltas = 0, medias = '0', abono = false, dependentes = 0 } = {}) {
    const dias = diasFeriasPorFaltas(faltas);
    if (dias === 0) return resultado([L('Sem direito a férias (mais de 32 faltas injustificadas)', 0, 'info')], { dias: 0, dias_abono: 0 });
    const remun = q(sal).mais(medias), diasAbono = abono ? Math.floor(dias / 3) : 0, gozo = dias - diasAbono;
    const vf = din(remun.div(30).vezes(gozo)), terco = din(vf.div(3));
    const linhas = [L(`Férias (${gozo} dias)`, vf, 'provento'), L('1/3 constitucional', terco, 'provento')];
    if (diasAbono) {
      const va = din(remun.div(30).vezes(diasAbono));
      linhas.push(L(`Abono pecuniário (${diasAbono} dias vendidos)`, va, 'provento', 'isento de INSS e IRRF'), L('1/3 sobre o abono', va.div(3), 'provento', 'isento de INSS e IRRF'));
    }
    const base = vf.mais(terco), inss = inssEmpregado(base, p.inss), ir = irrfMensal(base, inss, dependentes, p.irrf, p.redutor);
    linhas.push(L('INSS sobre férias + 1/3', inss, 'desconto'), L('IRRF sobre férias + 1/3', ir.imposto, 'desconto', obsIrrf(ir)));
    return resultado(linhas, { dias, dias_abono: diasAbono, irrf: ir });
  }

  const REGIMES = { mei: 'MEI com empregado', simples: 'Simples Nacional (Anexos I, II, III ou V)', simples_anexo_iv: 'Simples Nacional (Anexo IV)', lucro_presumido_real: 'Lucro Presumido ou Lucro Real' };
  const pct = (a) => a.vezes(100).txt(6).replace(/\.?0+$/, '').replace('.', ',');

  function custoContratacao(sal, p, { regime, rat = '0.02', terceiros = null, beneficios = '0' }) {
    if (!REGIMES[regime]) throw new Error('Regime tributário inválido.');
    const e = p.encargos, s = q(sal), prov13 = din(s.div(12)), provfer = din(s.div(12).vezes(4).div(3)), remun = s.mais(prov13).mais(provfer);
    const fgts = din(remun.vezes(p.fgts.aliquota));
    const patronal = regime === 'mei' ? [['CPP do MEI (empregado)', q(e.cpp_mei)]]
      : regime === 'simples' ? []
        : regime === 'simples_anexo_iv' ? [['INSS patronal', q(e.inss_patronal)], ['RAT/SAT', q(rat)]]
          : [['INSS patronal', q(e.inss_patronal)], ['RAT/SAT', q(rat)], ['Terceiros (Sistema S, salário-educação)', q(terceiros === null ? e.terceiros_padrao : terceiros)]];
    const linhas = [L('Salário', s, 'provento'), L('Provisão de 13º (1/12)', prov13, 'provento'), L('Provisão de férias + 1/3 (1/12)', provfer, 'provento'),
      L('FGTS (8% sobre salário e provisões)', fgts, 'provento')];
    for (const [nome, a] of patronal) linhas.push(L(`${nome} (${pct(a)}%)`, remun.vezes(a), 'provento'));
    if (q(beneficios).cmp(0) > 0) linhas.push(L('Benefícios (vale-transporte, alimentação etc.)', beneficios, 'provento'));
    const r = resultado(linhas), total = r.prov, avisos = [];
    if (regime === 'mei' && s.cmp(p.salario_minimo.valor) > 0) avisos.push('O MEI só pode ter um empregado, recebendo o salário mínimo ou o piso da categoria. Confira se este valor é o piso.');
    return { linhas, prov: total, desc: ZERO, liquido: total, extras: { anual: din(total.vezes(12)), sobre_salario: s.cmp(0) ? din(total.div(s).menos(1).vezes(100)) : ZERO, avisos, regime: REGIMES[regime] } };
  }

  const TIPOS = { sem_justa_causa: 'Dispensa sem justa causa', pedido_demissao: 'Pedido de demissão', acordo: 'Acordo entre as partes (art. 484-A)', justa_causa: 'Dispensa por justa causa' };
  const diasAvisoPrevio = (adm, desl) => Math.min(30 + 3 * anosCompletos(adm, desl), 90);
  function avos13(adm, fim) {
    let n = 0;
    for (let m = 1; m <= mes(fim); m++) {
      const ini = Date.UTC(ano(fim), m - 1, 1), ult = Date.UTC(ano(fim), m - 1, diasNoMes(ano(fim), m));
      const a = Math.max(ini, adm), b = Math.min(ult, fim);
      if (b >= a && (b - a) / dia + 1 >= 15) n++;
    }
    return n;
  }
  function avosFerias(adm, fim) {
    const ini = somarMeses(adm, 12 * anosCompletos(adm, fim));
    let m = 0;
    while (somarMeses(ini, m + 1) <= fim + dia) m++;
    const resto = (fim - somarMeses(ini, m)) / dia + 1;
    if (m < 12 && resto > 14) m++;
    return [Math.min(m, 12), ini];
  }

  function rescisao(sal, p, { admissao, desligamento, tipo, aviso, ferias_vencidas = 0, saldo_fgts = '0', dependentes = 0 }) {
    if (!TIPOS[tipo]) throw new Error('Tipo de rescisão inválido.');
    if (desligamento < admissao) throw new Error('A data de desligamento é anterior à admissão.');
    const validos = { sem_justa_causa: ['indenizado', 'trabalhado'], acordo: ['indenizado', 'trabalhado'], pedido_demissao: ['trabalhado', 'nao_cumprido', 'dispensado'], justa_causa: ['dispensado'] };
    if (!validos[tipo].includes(aviso)) throw new Error('Esse tipo de aviso prévio não se aplica a esse tipo de desligamento.');
    if (!(ferias_vencidas >= 0 && ferias_vencidas <= 2)) throw new Error('Férias vencidas: informe 0, 1 ou 2 períodos.');
    const s = q(sal), d1 = s.div(30), linhas = [];
    const diasSaldo = Math.min(dd(desligamento), 30), saldo = din(d1.vezes(diasSaldo));
    linhas.push(L(`Saldo de salário (${diasSaldo} dias)`, saldo, 'provento'));
    let diasAviso = 0, vAviso = ZERO, proj = desligamento;
    if (aviso === 'indenizado') {
      diasAviso = diasAvisoPrevio(admissao, desligamento);
      if (tipo === 'acordo') { vAviso = din(d1.vezes(diasAviso).div(2)); linhas.push(L(`Aviso prévio indenizado (metade de ${diasAviso} dias)`, vAviso, 'provento', 'isento de INSS e IRRF')); }
      else { vAviso = din(d1.vezes(diasAviso)); linhas.push(L(`Aviso prévio indenizado (${diasAviso} dias)`, vAviso, 'provento', 'isento de INSS e IRRF')); }
      proj = desligamento + diasAviso * dia;
    }
    let v13 = ZERO;
    if (tipo !== 'justa_causa') {
      const fimAno = ano(proj) === ano(desligamento) ? proj : Date.UTC(ano(desligamento), 11, 31), a13 = avos13(admissao, fimAno);
      v13 = din(s.div(12).vezes(a13));
      linhas.push(L(`13º salário proporcional (${a13}/12)`, v13, 'provento'));
      if (ano(proj) !== ano(desligamento)) {
        const seg = avos13(Date.UTC(ano(proj), 0, 1), proj);
        if (seg) { const vs = din(s.div(12).vezes(seg)); linhas.push(L(`13º salário do ano seguinte, pela projeção do aviso (${seg}/12)`, vs, 'provento')); v13 = v13.mais(vs); }
      }
    }
    for (let i = 0; i < ferias_vencidas; i++) {
      const suf = i ? ' (2º período)' : '';
      linhas.push(L(`Férias vencidas${suf}`, s, 'provento', 'indenizadas: isentas de INSS e IRRF'), L(`1/3 sobre férias vencidas${suf}`, s.div(3), 'provento', 'isento de INSS e IRRF'));
    }
    if (tipo !== 'justa_causa') {
      const [avf] = avosFerias(admissao, proj);
      if (avf) { const vf = din(s.div(12).vezes(avf)); linhas.push(L(`Férias proporcionais (${avf}/12)`, vf, 'provento', 'indenizadas: isentas de INSS e IRRF'), L('1/3 sobre férias proporcionais', vf.div(3), 'provento', 'isento de INSS e IRRF')); }
    }
    const inssS = inssEmpregado(saldo, p.inss), irS = irrfMensal(saldo, inssS, dependentes, p.irrf, p.redutor);
    linhas.push(L('INSS sobre saldo de salário', inssS, 'desconto'), L('IRRF sobre saldo de salário', irS.imposto, 'desconto'));
    if (v13.cmp(0) > 0) {
      const i13 = inssEmpregado(v13, p.inss), ir13 = irrfMensal(v13, i13, dependentes, p.irrf, p.redutor.aplica_13 === false ? null : p.redutor);
      linhas.push(L('INSS sobre 13º', i13, 'desconto'), L('IRRF sobre 13º (tributação exclusiva)', ir13.imposto, 'desconto'));
    }
    if (aviso === 'nao_cumprido') linhas.push(L('Aviso prévio não cumprido pelo empregado (30 dias)', s, 'desconto', 'CLT art. 487, § 2º'));
    const r = resultado(linhas), fg = p.fgts;
    const fgtsResc = din(saldo.mais(vAviso).mais(v13).vezes(fg.aliquota));
    const multaPct = tipo === 'sem_justa_causa' ? q(fg.multa_sem_justa_causa) : tipo === 'acordo' ? q(fg.multa_acordo) : ZERO;
    return { linhas, prov: r.prov, desc: r.desc, liquido: max(r.liquido, ZERO), extras: {
      fgts_mes_rescisao: fgtsResc, multa_fgts: din(q(saldo_fgts).mais(fgtsResc).vezes(multaPct)), multa_percentual: din(multaPct.vezes(100)),
      saque_fgts: { sem_justa_causa: '100% do saldo', acordo: 'até 80% do saldo' }[tipo] || 'não há saque por este motivo',
      seguro_desemprego: tipo === 'sem_justa_causa' ? 'pode ter direito, se cumprir os requisitos' : 'não tem direito por este motivo',
      data_projetada: iso(proj), dias_aviso: diasAviso, tipo: TIPOS[tipo] } };
  }

  // ------------------------------------------------------------ limite do MEI
  function limiteMei({ ano: a, data_abertura, faturado_no_ano, mes_referencia }) {
    const h = hoje(), ab = data_abertura ? D(data_abertura) : null;
    if (!(a >= 2018 && a <= 2100)) throw new Error('Ano inválido.');
    if (!(mes_referencia >= 1 && mes_referencia <= 12)) throw new Error('Mês inválido.');
    if (ab && ano(ab) > a) throw new Error('A data de abertura é posterior ao ano escolhido.');
    if (ab && ab > h) throw new Error('A data de abertura não pode ser no futuro.');
    if (ab && ano(ab) === a && mes_referencia < mes(ab)) throw new Error('O mês de referência é anterior à abertura da empresa.');
    const fat = q(faturado_no_ano);
    if (fat.cmp(0) < 0 || fat.cmp('100000000') > 0) throw new Error('Valor fora da faixa');
    const anual = q(P['mei.limite_anual'].valor.valor), mensal = q(P['mei.limite_mensal_proporcional'].valor.valor);
    const tol = q(P['mei.tolerancia_excesso'].valor.percentual), faixas = P['mei.faixas_alerta'].valor.faixas;
    const prop = !!(ab && ano(ab) === a), meses = prop ? 12 - mes(ab) + 1 : 12, lim = din(prop ? mensal.vezes(meses) : anual);
    const situ = (f) => {
      const perc = f.div(lim).vezes(100).arred(2), exc = max(f.menos(lim), ZERO);
      const classe = exc.cmp(0) === 0 ? 'dentro_do_limite' : f.cmp(lim.vezes(q(1).mais(tol))) <= 0 ? 'excedeu_dentro_tolerancia' : 'excedeu_acima_tolerancia';
      const at = faixas.filter((x) => perc.cmp(x) >= 0);
      return { faturado: din(f), percentual: perc, restante: din(max(lim.menos(f), ZERO)), excesso: din(exc), faixa_alerta: at.length ? at[at.length - 1] : null, classificacao: classe };
    };
    const sit = situ(fat), inicio = prop ? mes(ab) : 1, mc = mes_referencia - inicio + 1, media = fat.div(mc), projAno = din(fat.mais(media.vezes(12 - mes_referencia)));
    const sp = situ(projAno);
    const msgs = {
      dentro_do_limite: 'Pelo valor informado, o faturamento está dentro do limite do MEI.',
      excedeu_dentro_tolerancia: 'O valor informado passa do limite, mas fica dentro da tolerância de 20%. Em regra, isso leva ao desenquadramento a partir do ano seguinte. Vale uma análise para planejar a mudança.',
      excedeu_acima_tolerancia: 'O valor informado passa do limite em mais de 20%. Isso pode levar ao desenquadramento retroativo. Recomendamos uma análise profissional o quanto antes.'
    };
    const brl = (v) => 'R$ ' + Number(q(v).txt()).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    return {
      data_referencia: iso(h),
      limite: { valor: lim.txt(), meses, proporcional: prop },
      situacao: { ...Object.fromEntries(Object.entries(sit).map(([k, v]) => [k, v instanceof Q ? v.txt() : v])), mensagem: msgs[sit.classificacao] },
      projecao: { media_mensal: din(media).txt(), projetado_ano: projAno.txt(), meses_considerados: mc, percentual_projetado: sp.percentual.txt(),
        orientacao: sit.classificacao === 'dentro_do_limite' && sp.classificacao !== 'dentro_do_limite' ? 'Seu faturamento projetado indica a possibilidade de ultrapassar o limite do MEI. Uma análise preventiva poderá ajudar a organizar a transição para outro enquadramento empresarial.' : null },
      premissas: [
        `Limite anual de ${brl(anual)}` + (prop ? `; no ano de abertura, proporcional: ${brl(mensal)} por mês, contando o mês de início inteiro.` : '.'),
        'Considera apenas o faturamento (receita bruta) que você informou. Aportes, empréstimos e transferências não entram.',
        'A projeção usa a média dos meses já informados e supõe que ela continue até dezembro (projeção linear).',
        'Regra para o MEI geral. Há regras próprias para outros tipos de MEI (ex.: transportador autônomo de cargas).'
      ],
      fontes: [...new Set(['mei.limite_anual', 'mei.limite_mensal_proporcional', 'mei.tolerancia_excesso', 'mei.faixas_alerta'].map((c) => P[c].fonte))].sort(),
      parametros_pendentes: ['mei.limite_anual', 'mei.limite_mensal_proporcional', 'mei.tolerancia_excesso', 'mei.faixas_alerta'].filter((c) => P[c].situacao !== 'revisado'),
      limitacoes: 'Simulação informativa. Não substitui a análise profissional nem é certidão de regularidade.'
    };
  }

  // ------------------------------------------------------------ entrada no formato da API (mesmas validações)
  function dinheiro(v, obrig = false) {
    if (v === undefined || v === null || String(v).trim() === '') { if (obrig) throw new Error('Informe o salário.'); return '0.00'; }
    let t = String(v).trim().replace('R$', '').replace(/\s/g, '');
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    let x; try { x = q(t); } catch (e) { throw new Error('Valor inválido'); }
    if (x.cmp(0) < 0 || x.cmp('1000000') > 0) throw new Error('Valor fora da faixa');
    return x.txt();
  }
  const inteiro = (v, lo, hi, nome) => { const n = Number(v || 0); if (!Number.isInteger(n) || n < lo || n > hi) throw new Error(`${nome} inválido.`); return n; };
  const LIMITACOES = 'Simulação informativa. Não substitui a análise profissional nem o cálculo oficial da folha. Convenções coletivas podem prever valores diferentes.';
  const BR = (v) => 'R$ ' + Number(q(v).txt()).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  function saida(r, naData, premissas) {
    const conv = (v) => (v instanceof Q ? v.txt() : v && typeof v === 'object' && v.imposto instanceof Q ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x instanceof Q ? x.txt() : x])) : v);
    const fontes = [...new Set(Object.values(MAPA).map((c) => P[c].fonte))].sort();
    return {
      data_referencia: iso(naData), linhas: r.linhas.map((l) => ({ ...l, valor: l.valor.txt() })),
      total_proventos: r.prov.txt(), total_descontos: r.desc.txt(), liquido: r.liquido.txt(),
      extras: Object.fromEntries(Object.entries(r.extras).map(([k, v]) => [k, conv(v)])),
      premissas, fontes, parametros_pendentes: Object.values(MAPA).filter((c) => P[c].situacao !== 'revisado'), limitacoes: LIMITACOES
    };
  }

  const FERRAMENTAS = {
    'salario-liquido'(d) {
      const p = pTrab();
      const r = salarioLiquido(dinheiro(d.salario, true), p, { dependentes: inteiro(d.dependentes, 0, 20, 'Número de dependentes'), outros_proventos: dinheiro(d.outros_proventos), outros_descontos: dinheiro(d.outros_descontos) });
      return saida(r, hoje(), [
        `INSS pela tabela progressiva vigente, com base limitada ao teto de ${BR(p.inss.teto)}.`,
        `IRRF pela opção mais vantajosa: deduções legais (INSS + ${BR(p.irrf.deducao_dependente)} por dependente) ou desconto simplificado de ${BR(p.irrf.desconto_simplificado)}.`,
        `Redução do IRRF para rendimentos até ${BR(p.redutor.limite_superior)} (zera o imposto até ${BR(p.redutor.limite_isencao)}).`,
        'Não considera pensão alimentícia, previdência privada, faltas, adiantamentos nem descontos de convênios.']);
    },
    'calculadora-ferias'(d) {
      const r = ferias(dinheiro(d.salario, true), pTrab(), { faltas: inteiro(d.faltas, 0, 366, 'Número de faltas'), medias: dinheiro(d.medias), abono: !!d.abono, dependentes: inteiro(d.dependentes, 0, 20, 'Número de dependentes') });
      return saida(r, hoje(), [
        'Dias de férias conforme as faltas injustificadas no período aquisitivo (CLT art. 130).',
        'Abono pecuniário: venda de 1/3 dos dias, com o terço; isento de INSS e IRRF.',
        'INSS e IRRF calculados sobre férias + 1/3, separados do salário do mês. Na folha real o INSS considera o total do mês.',
        'Não considera férias em dobro (pagas fora do prazo), adiantamento do 13º nem férias coletivas.']);
    },
    'custo-contratacao'(d) {
      const sal = dinheiro(d.salario, true);
      if (q(sal).cmp(0) <= 0) throw new Error('Informe o salário.');
      if (!['0.01', '0.02', '0.03'].includes(d.rat || '0.02')) throw new Error('RAT inválido.');
      const r = custoContratacao(sal, pTrab(), { regime: d.regime, rat: d.rat || '0.02', beneficios: dinheiro(d.beneficios) });
      return saida(r, hoje(), [
        'Custo mensal médio: inclui 1/12 do 13º e 1/12 das férias + 1/3 por mês, e o FGTS sobre eles.',
        'Simples Nacional (Anexos I, II, III e V): a contribuição patronal já está no DAS. Anexo IV: INSS patronal + RAT fora do DAS.',
        'Lucro Presumido ou Real: terceiros de 5,8% como padrão; o percentual real depende do FPAS da atividade.',
        'MEI com empregado: 3% de contribuição previdenciária patronal + 8% de FGTS (LC 123/2006, art. 18-C).',
        'Não inclui multa do FGTS em rescisão, exames médicos, uniformes nem encargos de convenção coletiva.']);
    },
    'calculadora-rescisao'(d) {
      const adm = D(d.admissao), desl = D(d.desligamento), h = hoje();
      if (desl > Date.UTC(ano(h) + 1, 11, 31)) throw new Error('Data de desligamento muito distante.');
      if (ano(adm) < 1950) throw new Error('Data de admissão inválida.');
      if (desl < Date.UTC(2026, 0, 1)) throw new Error(`Ainda não temos as tabelas oficiais para ${iso(desl).split('-').reverse().join('/')}. As ferramentas valem a partir de 2026.`);
      const r = rescisao(dinheiro(d.salario, true), pTrab(), { admissao: adm, desligamento: desl, tipo: d.tipo, aviso: d.aviso,
        ferias_vencidas: inteiro(d.ferias_vencidas, 0, 2, 'Férias vencidas'), saldo_fgts: dinheiro(d.saldo_fgts), dependentes: inteiro(d.dependentes, 0, 20, 'Número de dependentes') });
      return saida(r, desl, [
        'Aviso prévio de 30 dias + 3 por ano completo, até 90 (Lei 12.506/2011). No acordo, metade do aviso indenizado.',
        'O aviso indenizado projeta o fim do contrato para contar os avos de 13º e férias.',
        'Avos: mês com 15 dias ou mais de trabalho. Férias e aviso indenizados não têm INSS nem IRRF.',
        'Multa do FGTS (40%, ou 20% no acordo) sobre o saldo informado + o depósito do mês da rescisão.',
        'Não considera adiantamento do 13º, médias de horas extras e comissões, férias em dobro, estabilidades nem descontos de convênios.']);
    },
    'limite-mei'(d) {
      const v = String(d.faturado_no_ano || '').trim();
      if (!v) throw new Error('Informe o faturamento do ano até agora.');
      let t = v.replace('R$', '').replace(/\s/g, ''); if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
      let x; try { x = q(t); } catch (e) { throw new Error('Valor inválido'); }
      return limiteMei({ ano: Number(d.ano), data_abertura: d.data_abertura || null, faturado_no_ano: x.txt(), mes_referencia: Number(d.mes_referencia) });
    }
  };

  const api = { calcular: (slug, dados) => { const f = FERRAMENTAS[slug]; if (!f) throw new Error('Ferramenta desconhecida.'); return f(dados || {}); },
    _interno: { Q, inssEmpregado, irrfMensal, salarioLiquido, ferias, custoContratacao, rescisao, limiteMei, pTrab, D } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else raiz.FidelisCalc = api;
})(typeof window !== 'undefined' ? window : globalThis);
