<?php
// controllers/EmpresaController.php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) session_start();

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/Empresa.php';

$pdoConn = isset($pdo) ? $pdo : (class_exists('Database') ? Database::connect() : null);
$model   = new Empresa($pdoConn);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

function out($d,$s=200){ http_response_code($s); echo json_encode($d); exit; }
function requireLogin(){
  // ahora validamos la sesión que dejó AuthController
  if (empty($_SESSION['user']) || empty($_SESSION['user']['id'])) {
    out(['error' => 'No autenticado'], 401);
  }
}

switch ($action) {
  case 'list': // Filtros: codigo_superusuario, activo
    requireLogin();
    $filtros = [
      'codigo_superusuario' => $_GET['codigo_superusuario'] ?? null,
      'activo' => isset($_GET['activo']) ? (int)$_GET['activo'] : null
    ];
    out($model->obtenerTodos(array_filter($filtros, fn($v)=>$v!==null)));
  case 'get':
    requireLogin();
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) out(['error'=>'id requerido'], 422);
    $row = $model->obtenerPorId($id);
    $row ? out($row) : out(['error'=>'No encontrado'], 404);
  case 'getByCodigo':
    requireLogin();
    $codigo = $_GET['codigo'] ?? '';
    if (!$codigo) out(['error'=>'codigo requerido'], 422);
    $row = $model->obtenerPorCodigo($codigo);
    $row ? out($row) : out(['error'=>'No encontrado'], 404);
  case 'create':
    requireLogin();
    if ($method !== 'POST') out(['error'=>'Método no permitido'], 405);
    $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $ok = $model->crear($data);
    $ok ? out(['ok'=>true]) : out(['error'=>'No se pudo crear'], 400);
  case 'update':
    requireLogin();
    if ($method !== 'PUT') out(['error'=>'Método no permitido'], 405);
    parse_str(file_get_contents('php://input'), $body);
    $id = (int)($body['id'] ?? 0);
    if (!$id) out(['error'=>'id requerido'], 422);
    $ok = $model->actualizar($id, $body);
    $ok ? out(['ok'=>true]) : out(['error'=>'No se pudo actualizar'], 400);
  case 'delete':
    requireLogin();
    if ($method !== 'DELETE') out(['error'=>'Método no permitido'], 405);
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) out(['error'=>'id requerido'], 422);
    $ok = $model->eliminar($id);
    $ok ? out(['ok'=>true]) : out(['error'=>'No se pudo eliminar'], 400);
  default:
    out(['error'=>'Acción no válida'], 400);
}
