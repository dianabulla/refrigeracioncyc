<?php
// api/diag.php  (TEMPORAL - BORRAR LUEGO)
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);

$report = [
  'php_version' => PHP_VERSION,
  'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? null,
  'script' => __FILE__,
  'session' => ['status'=>session_status()],
  'includes' => [],
  'db' => [],
];

if (session_status() === PHP_SESSION_NONE) session_start();
$report['session']['id'] = session_id();

// 1) Cargar DB
try {
  require_once __DIR__ . '/../config/db.php';
  $report['includes'][] = 'config/db.php OK';
} catch (Throwable $e) {
  $report['includes'][] = 'config/db.php FAIL: '.$e->getMessage();
  echo json_encode(['ok'=>false,'diag'=>$report]); exit;
}

// 2) Conectar
try {
  $pdo = Database::connect();
  $report['db']['connect'] = 'OK';
} catch (Throwable $e) {
  $report['db']['connect'] = 'FAIL: '.$e->getMessage();
  echo json_encode(['ok'=>false,'diag'=>$report]); exit;
}

// 3) DB name efectiva (por si .env apunta a otra)
try {
  $report['db']['current_database'] = $pdo->query('SELECT DATABASE()')->fetchColumn();
} catch (Throwable $e) {
  $report['db']['current_database'] = 'FAIL: '.$e->getMessage();
}

// 4) Existe tabla superusuario?
try {
  $pdo->query("SELECT 1 FROM superusuario LIMIT 1");
  $report['db']['table_superusuario'] = 'OK';
  $report['db']['superusuario_count'] = (int)$pdo->query("SELECT COUNT(*) FROM superusuario")->fetchColumn();
} catch (Throwable $e) {
  $report['db']['table_superusuario'] = 'FAIL: '.$e->getMessage();
}

// 5) Cargar modelo y probar método contar()
try {
  require_once __DIR__ . '/../models/superusuario.php';
  $report['includes'][] = 'models/superusuario.php OK';
  if (class_exists('SuperUsuario')) {
    $m = new SuperUsuario($pdo);
    $report['model'] = ['class'=>'SuperUsuario', 'contar'=>$m->contar()];
  } elseif (class_exists('superusuario')) {
    $m = new superusuario($pdo);
    $report['model'] = ['class'=>'superusuario', 'contar'=>$m->contar()];
  } else {
    $report['model'] = ['class'=>'NOT FOUND'];
  }
} catch (Throwable $e) {
  $report['includes'][] = 'models/superusuario.php FAIL: '.$e->getMessage();
}

echo json_encode(['ok'=>true,'diag'=>$report], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
