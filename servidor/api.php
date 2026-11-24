<?php
/* KIT PROTÓTIPO — API das sugestões e relatórios de teste (PHP + MySQL)
 *
 * Roda em qualquer hospedagem comum com PHP 7.4+ e MySQL/MariaDB (HostGator, Hostinger, Locaweb…)
 * e no seu computador (php -S localhost:8080 -t servidor). Sem mensalidade extra.
 *
 * O site chama:  POST api.php   corpo JSON: { "fn": "kit_sug_listar", "params": { "p_codigo": "...", ... } }
 * Resposta:      { "ok": true, "dados": ... }   ou   { "ok": false, "erro": "mensagem" }
 *
 * As regras são as MESMAS do modo local (prototipo/js/equipe.js):
 *  - sem o código da equipe ninguém lê nem grava;
 *  - só o administrador muda a situação e exclui;
 *  - só quem cadastrou (ou o admin) edita; aprovada fica travada;
 *  - "Realizada" vira "Aguardando aprovação"; reprovar exige explicar.
 * As tabelas são criadas sozinhas na primeira chamada (ou rode banco-mysql.sql no Workbench).
 */

const KIT_SITUACOES = ['Pendente', 'Enviada', 'Em análise', 'Em desenvolvimento', 'Realizada',
  'Aguardando aprovação', 'Aprovada', 'Reprovada — necessita de ajuste'];

class KitErro extends Exception {}

function kit_config() {
  $arq = __DIR__ . '/config.php';
  if (!is_file($arq)) throw new KitErro('Servidor sem config.php (copie config.exemplo.php para config.php)');
  return require $arq;
}

function kit_conectar(array $cfg) {
  $dsn = $cfg['dsn'] ?? ('mysql:host=' . ($cfg['host'] ?? 'localhost') . ';port=' . ($cfg['porta'] ?? 3306)
    . ';dbname=' . $cfg['banco'] . ';charset=utf8mb4');
  $pdo = new PDO($dsn, $cfg['usuario'] ?? null, $cfg['senha'] ?? null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ]);
  kit_criar_tabelas($pdo);
  return $pdo;
}

function kit_criar_tabelas(PDO $pdo) {
  $mysql = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
  $id = $mysql ? 'BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  $fim = $mysql ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
  $pdo->exec("CREATE TABLE IF NOT EXISTS kit_sugestoes (
    id $id,
    solicitante VARCHAR(80) NOT NULL,
    criado_em DATETIME NOT NULL,
    atualizado_em DATETIME NOT NULL,
    area VARCHAR(80) NOT NULL DEFAULT 'Geral',
    tela VARCHAR(255) NOT NULL DEFAULT '',
    onde LONGTEXT NULL,
    descricao TEXT NOT NULL,
    observacoes TEXT NULL,
    situacao VARCHAR(40) NOT NULL DEFAULT 'Pendente',
    enviada_em DATETIME NULL,
    enviada_por VARCHAR(80) NULL,
    aprovada_em DATETIME NULL,
    aprovada_por VARCHAR(80) NULL,
    apoios LONGTEXT NULL,
    afeta_aprovada BIGINT NULL,
    historico LONGTEXT NULL
  )$fim");
  $pdo->exec("CREATE TABLE IF NOT EXISTS kit_testes (
    id $id,
    criado_em DATETIME NOT NULL,
    responsavel VARCHAR(80) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    resumo TEXT NULL,
    relatorio LONGTEXT NULL
  )$fim");
}

// ---------- utilitários ----------
function kit_agora() { return gmdate('Y-m-d H:i:s'); }
function kit_iso($d) { return $d ? str_replace(' ', 'T', substr($d, 0, 19)) . 'Z' : null; }
function kit_txt($v) { return trim((string)($v ?? '')); }
function kit_hist($por, $de, $para, $nota = '') {
  return ['em' => kit_iso(kit_agora()), 'por' => $por, 'de' => $de, 'para' => $para, 'nota' => (string)($nota ?? '')];
}
function kit_json($v) { return $v === null ? null : json_encode($v, JSON_UNESCAPED_UNICODE); }

function kit_nivel(array $cfg, $codigo) {
  $c = (string)($codigo ?? '');
  if ($c !== '' && hash_equals((string)$cfg['codigo_admin'], $c)) return 'admin';
  if ($c !== '' && hash_equals((string)$cfg['codigo_equipe'], $c)) return 'equipe';
  return null;
}
function kit_exigir(array $cfg, $codigo, $admin = false) {
  $n = kit_nivel($cfg, $codigo);
  if (!$n) throw new KitErro('Código de acesso inválido');
  if ($admin && $n !== 'admin') throw new KitErro('Somente o administrador pode fazer isso');
  return $n;
}

function kit_linha(array $r) {
  foreach (['criado_em', 'atualizado_em', 'enviada_em', 'aprovada_em'] as $k) $r[$k] = kit_iso($r[$k] ?? null);
  $r['id'] = (int)$r['id'];
  $r['onde'] = isset($r['onde']) && $r['onde'] !== null ? json_decode($r['onde'], true) : null;
  $r['apoios'] = $r['apoios'] ? json_decode($r['apoios'], true) : [];
  $r['historico'] = $r['historico'] ? json_decode($r['historico'], true) : [];
  $r['afeta_aprovada'] = $r['afeta_aprovada'] !== null ? (int)$r['afeta_aprovada'] : null;
  $r['observacoes'] = $r['observacoes'] ?? '';
  return $r;
}

function kit_buscar(PDO $pdo, $id, $travar = false) {
  $mysql = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
  $st = $pdo->prepare('SELECT * FROM kit_sugestoes WHERE id = ?' . ($travar && $mysql ? ' FOR UPDATE' : ''));
  $st->execute([(int)$id]);
  $r = $st->fetch();
  if (!$r) throw new KitErro("Sugestão $id não existe");
  return kit_linha($r);
}

function kit_gravar(PDO $pdo, array $s) {
  $st = $pdo->prepare('UPDATE kit_sugestoes SET descricao=?, observacoes=?, area=?, situacao=?, atualizado_em=?,
    enviada_em=?, enviada_por=?, aprovada_em=?, aprovada_por=?, apoios=?, historico=? WHERE id=?');
  $db = function ($iso) { return $iso ? str_replace(['T', 'Z'], [' ', ''], $iso) : null; };
  $st->execute([$s['descricao'], $s['observacoes'], $s['area'], $s['situacao'], kit_agora(),
    $db($s['enviada_em']), $s['enviada_por'], $db($s['aprovada_em']), $s['aprovada_por'],
    kit_json(array_values($s['apoios'])), kit_json($s['historico']), $s['id']]);
  return kit_buscar($pdo, $s['id']);
}

// ---------- as funções (mesmos nomes e parâmetros do modo local) ----------
function kit_executar(PDO $pdo, array $cfg, $fn, array $p) {
  $cod = $p['p_codigo'] ?? null;
  switch ($fn) {
    case 'kit_verificar':
      return kit_exigir($cfg, $cod);

    case 'kit_sug_listar':
      kit_exigir($cfg, $cod);
      return array_map('kit_linha', $pdo->query('SELECT * FROM kit_sugestoes ORDER BY id')->fetchAll());

    case 'kit_sug_criar': {
      kit_exigir($cfg, $cod);
      $nome = kit_txt($p['p_solicitante'] ?? '');
      $desc = kit_txt($p['p_descricao'] ?? '');
      if ($nome === '') throw new KitErro('Informe seu nome');
      if (mb_strlen($desc) < 3) throw new KitErro('Descreva a sugestão');
      $area = kit_txt($p['p_area'] ?? '') ?: 'Geral';
      $agora = kit_agora();
      $st = $pdo->prepare('INSERT INTO kit_sugestoes (solicitante, criado_em, atualizado_em, area, tela, onde, descricao,
        observacoes, situacao, apoios, afeta_aprovada, historico) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
      $st->execute([$nome, $agora, $agora, $area, (string)($p['p_tela'] ?? ''), kit_json($p['p_onde'] ?? null), $desc,
        (string)($p['p_observacoes'] ?? ''), 'Pendente', '[]', isset($p['p_afeta']) && $p['p_afeta'] !== null ? (int)$p['p_afeta'] : null,
        kit_json([kit_hist($nome, null, 'Pendente', 'Criada')])]);
      return kit_buscar($pdo, $pdo->lastInsertId());
    }

    case 'kit_sug_editar': {
      $n = kit_exigir($cfg, $cod);
      $s = kit_buscar($pdo, $p['p_id'] ?? 0, true);
      if ($s['situacao'] === 'Aprovada') throw new KitErro("Sugestão {$s['id']} já foi aprovada e está travada");
      if ($n !== 'admin' && mb_strtolower($s['solicitante']) !== mb_strtolower(kit_txt($p['p_nome'] ?? '')))
        throw new KitErro("Só {$s['solicitante']} (quem cadastrou) ou o administrador podem editar");
      if (kit_txt($p['p_descricao'] ?? '') !== '') $s['descricao'] = kit_txt($p['p_descricao']);
      if (array_key_exists('p_observacoes', $p) && $p['p_observacoes'] !== null) $s['observacoes'] = (string)$p['p_observacoes'];
      if (kit_txt($p['p_area'] ?? '') !== '') $s['area'] = kit_txt($p['p_area']);
      return kit_gravar($pdo, $s);
    }

    case 'kit_sug_apoiar': {
      kit_exigir($cfg, $cod);
      $s = kit_buscar($pdo, $p['p_id'] ?? 0, true);
      $nome = kit_txt($p['p_nome'] ?? '');
      if ($nome !== '' && !in_array($nome, $s['apoios'], true) && mb_strtolower($s['solicitante']) !== mb_strtolower($nome))
        $s['apoios'][] = $nome;
      return kit_gravar($pdo, $s);
    }

    case 'kit_sug_enviar': {
      kit_exigir($cfg, $cod);
      $nome = kit_txt($p['p_nome'] ?? '');
      $q = 0;
      foreach ($pdo->query("SELECT * FROM kit_sugestoes WHERE situacao = 'Pendente'")->fetchAll() as $r) {
        $s = kit_linha($r);
        if (mb_strtolower($s['solicitante']) !== mb_strtolower($nome)) continue;
        $s['situacao'] = 'Enviada';
        $s['enviada_em'] = kit_iso(kit_agora());
        $s['enviada_por'] = $nome;
        $s['historico'][] = kit_hist($nome, 'Pendente', 'Enviada');
        kit_gravar($pdo, $s);
        $q++;
      }
      return $q;
    }

    case 'kit_sug_status': {
      kit_exigir($cfg, $cod, true);
      $para = (string)($p['p_situacao'] ?? '');
      if (!in_array($para, KIT_SITUACOES, true)) throw new KitErro('Situação inválida: ' . $para);
      $por = kit_txt($p['p_por'] ?? '') ?: 'Administrador';
      $s = kit_buscar($pdo, $p['p_id'] ?? 0, true);
      $s['historico'][] = kit_hist($por, $s['situacao'], $para, $p['p_nota'] ?? '');
      if ($para === 'Realizada') {
        $para = 'Aguardando aprovação';
        $s['historico'][] = kit_hist($por, 'Realizada', $para, 'Liberada para conferência do solicitante');
      }
      $s['situacao'] = $para;
      if ($para === 'Aprovada') { $s['aprovada_em'] = kit_iso(kit_agora()); $s['aprovada_por'] = $por; }
      return kit_gravar($pdo, $s);
    }

    case 'kit_sug_aprovar': {
      kit_exigir($cfg, $cod);
      $s = kit_buscar($pdo, $p['p_id'] ?? 0, true);
      $aprovado = !empty($p['p_aprovado']);
      $nota = kit_txt($p['p_nota'] ?? '');
      $nome = kit_txt($p['p_nome'] ?? '');
      if ($s['situacao'] !== 'Aguardando aprovação')
        throw new KitErro("Sugestão {$s['id']} não está aguardando aprovação (está: {$s['situacao']})");
      if (!$aprovado && $nota === '') throw new KitErro('Explique o que ainda precisa ajustar');
      $para = $aprovado ? 'Aprovada' : 'Reprovada — necessita de ajuste';
      $s['historico'][] = kit_hist($nome, $s['situacao'], $para, $nota);
      $s['situacao'] = $para;
      $s['aprovada_em'] = $aprovado ? kit_iso(kit_agora()) : null;
      $s['aprovada_por'] = $aprovado ? $nome : null;
      return kit_gravar($pdo, $s);
    }

    case 'kit_sug_excluir': {
      kit_exigir($cfg, $cod, true);
      $st = $pdo->prepare('DELETE FROM kit_sugestoes WHERE id = ?');
      $st->execute([(int)($p['p_id'] ?? 0)]);
      return $st->rowCount() > 0;
    }

    case 'kit_teste_salvar': {
      kit_exigir($cfg, $cod);
      $tipo = in_array($p['p_tipo'] ?? '', ['automatico', 'manual'], true) ? $p['p_tipo'] : 'manual';
      $st = $pdo->prepare('INSERT INTO kit_testes (criado_em, responsavel, tipo, resumo, relatorio) VALUES (?,?,?,?,?)');
      $st->execute([kit_agora(), kit_txt($p['p_responsavel'] ?? '') ?: 'Sem nome', $tipo,
        kit_json($p['p_resumo'] ?? null), kit_json($p['p_relatorio'] ?? null)]);
      return (int)$pdo->lastInsertId();
    }

    case 'kit_teste_listar':
      kit_exigir($cfg, $cod);
      return array_map(function ($r) {
        return ['id' => (int)$r['id'], 'criado_em' => kit_iso($r['criado_em']), 'responsavel' => $r['responsavel'],
          'tipo' => $r['tipo'], 'resumo' => $r['resumo'] ? json_decode($r['resumo'], true) : null];
      }, $pdo->query('SELECT id, criado_em, responsavel, tipo, resumo FROM kit_testes ORDER BY id DESC LIMIT 200')->fetchAll());

    case 'kit_teste_obter': {
      kit_exigir($cfg, $cod);
      $st = $pdo->prepare('SELECT relatorio FROM kit_testes WHERE id = ?');
      $st->execute([(int)($p['p_id'] ?? 0)]);
      $r = $st->fetch();
      return $r && $r['relatorio'] ? json_decode($r['relatorio'], true) : null;
    }
  }
  throw new KitErro('Função desconhecida ' . $fn);
}

// executa dentro de uma transação (duas pessoas ao mesmo tempo não se atropelam)
function kit_transacao(PDO $pdo, array $cfg, $fn, array $p) {
  $pdo->beginTransaction();
  try { $r = kit_executar($pdo, $cfg, $fn, $p); $pdo->commit(); return $r; }
  catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
}

// ---------- entrada HTTP ----------
if (!defined('KIT_SEM_HTTP')) {
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  try {
    $cfg = kit_config();
    $origem = $_SERVER['HTTP_ORIGIN'] ?? '';
    $permitidas = $cfg['origens'] ?? ['*'];
    if (in_array('*', $permitidas, true)) header('Access-Control-Allow-Origin: *');
    elseif ($origem && in_array($origem, $permitidas, true)) { header('Access-Control-Allow-Origin: ' . $origem); header('Vary: Origin'); }
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($metodo === 'OPTIONS') { http_response_code(204); exit; }
    if ($metodo === 'GET') { echo json_encode(['ok' => true, 'dados' => 'KIT PROTÓTIPO API no ar']); exit; }
    $corpo = json_decode(file_get_contents('php://input') ?: '{}', true);
    if (!is_array($corpo) || empty($corpo['fn'])) throw new KitErro('Pedido inválido');
    $pdo = kit_conectar($cfg);
    $dados = kit_transacao($pdo, $cfg, (string)$corpo['fn'], is_array($corpo['params'] ?? null) ? $corpo['params'] : []);
    echo json_encode(['ok' => true, 'dados' => $dados], JSON_UNESCAPED_UNICODE);
  } catch (KitErro $e) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'erro' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
  } catch (Throwable $e) {
    http_response_code(500);
    error_log('KIT PROTÓTIPO API: ' . $e->getMessage());
    echo json_encode(['ok' => false, 'erro' => 'Erro no servidor. Tente de novo em instantes.'], JSON_UNESCAPED_UNICODE);
  }
}
