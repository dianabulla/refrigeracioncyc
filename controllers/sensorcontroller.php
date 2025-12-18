<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/Sensor.php';

$pdoConn = isset($pdo) ? $pdo : (class_exists('Database') ? Database::connect() : null);
$model = new Sensor($pdoConn);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

function out($d,$s=200){ http_response_code($s); echo json_encode($d); exit; }
function requireLogin(){ if (empty($_SESSION['superusuario_id'])) out(['error'=>'No autorizado'], 401); }

switch ($action) {
  case 'list': // filtros: codigo_cuarto, tipo, activo
    requireLogin();
    $f=[
      'codigo_cuarto'=>$_GET['codigo_cuarto'] ?? null,
      'tipo'=>$_GET['tipo'] ?? null,
      'activo'=>isset($_GET['activo'])?(int)$_GET['activo']:null
    ];
    out($model->obtenerTodos(array_filter($f, fn($v)=>$v!==null)));
  case 'get':
    requireLogin();
    $id=(int)($_GET['id']??0); if(!$id) out(['error'=>'id requerido'],422);
    $r=$model->obtenerPorId($id); $r?out($r):out(['error'=>'No encontrado'],404);
  case 'getByCodigo':
    requireLogin();
    $c=$_GET['codigo']??''; if(!$c) out(['error'=>'codigo requerido'],422);
    $r=$model->obtenerPorCodigo($c); $r?out($r):out(['error'=>'No encontrado'],404);
  case 'create':
    requireLogin();
    if($method!=='POST') out(['error'=>'Método no permitido'],405);
    $d=json_decode(file_get_contents('php://input'),true)??$_POST;
    $ok=$model->crear($d); $ok?out(['ok'=>true]):out(['error'=>'No se pudo crear'],400);
  case 'update':
    requireLogin();
    if($method!=='PUT') out(['error'=>'Método no permitido'],405);
    parse_str(file_get_contents('php://input'), $b);
    $id=(int)($b['id']??0); if(!$id) out(['error'=>'id requerido'],422);
    $ok=$model->actualizar($id,$b); $ok?out(['ok'=>true]):out(['error'=>'No se pudo actualizar'],400);
  case 'delete':
    requireLogin();
    if($method!=='DELETE') out(['error'=>'Método no permitido'],405);
    $id=(int)($_GET['id']??0); if(!$id) out(['error'=>'id requerido'],422);
    $ok=$model->eliminar($id); $ok?out(['ok'=>true]):out(['error'=>'No se pudo eliminar'],400);
  default: out(['error'=>'Acción no válida'],400);
}
