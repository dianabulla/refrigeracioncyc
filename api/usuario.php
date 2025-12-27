<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../models/usuario.php';

if (session_status() === PHP_SESSION_NONE) session_start();

/**
 * Solo alguien logueado puede gestionar usuarios.
 * Si quieres solo superusuario, cambia a: requireAuth('superusuario');
 */
requireAuth(); 

$pdo    = Database::connect();
$model  = new Usuario($pdo);

function respond($data, int $status = 200){
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {

  /* ============== GET ============== */
  if ($method === 'GET') {
    // Verificar permiso para ver usuarios
    requirePermiso('ver_usuarios');

    $id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
    $codigo = $_GET['codigo']      ?? null;
    $codFin = $_GET['codigo_finca'] ?? null;
    $codRol = $_GET['codigo_rol']   ?? null;

    // Filtrar por finca del usuario si no es superusuario
    $fincaUsuario = getUserFinca();
    if ($fincaUsuario !== null) {
      $codFin = $fincaUsuario;
    }

    if ($id) {
      $u = $model->obtenerPorId($id);
      // Verificar que el usuario pertenece a la finca del usuario logueado
      if ($u && $fincaUsuario !== null && ($u['codigo_finca'] ?? null) !== $fincaUsuario) {
        respond(['ok'=>false,'error'=>'Acceso denegado'],403);
      }
      $u ? respond($u) : respond(['ok'=>false,'error'=>'No encontrado'],404);
    }
    if ($codigo) {
      $u = $model->obtenerPorCodigo($codigo);
      // Verificar que el usuario pertenece a la finca del usuario logueado
      if ($u && $fincaUsuario !== null && ($u['codigo_finca'] ?? null) !== $fincaUsuario) {
        respond(['ok'=>false,'error'=>'Acceso denegado'],403);
      }
      $u ? respond($u) : respond(['ok'=>false,'error'=>'No encontrado'],404);
    }

    $list = $model->listar($codFin, $codRol);
    respond($list);
  }

  /* ============== POST (crear) ============== */
  if ($method === 'POST') {
    // Verificar permiso para crear usuarios
    requirePermiso('crear_usuarios');

    $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    // AISLAMIENTO: Validar que la finca pertenece al usuario
    if (!isSuperusuario() && !empty($data['codigo_finca'])) {
        $sqlCheck = "SELECT f.codigo_empresa 
                     FROM finca f
                     WHERE f.codigo = ?";
        $stCheck = $pdo->prepare($sqlCheck);
        $stCheck->execute([$data['codigo_finca']]);
        $finca = $stCheck->fetch(PDO::FETCH_ASSOC);
        
        if (!$finca) {
            respond(['ok'=>false,'error'=>'Finca no encontrada'],404);
        }
        
        $fincaUsuario = getUserFinca();
        $empresaUsuario = getUserEmpresa();
        
        if ($fincaUsuario && $data['codigo_finca'] !== $fincaUsuario) {
            respond(['ok'=>false,'error'=>'No puede crear usuarios en otra finca'],403);
        }
        if (!$fincaUsuario && $empresaUsuario && $finca['codigo_empresa'] !== $empresaUsuario) {
            respond(['ok'=>false,'error'=>'No puede crear usuarios en finca de otra empresa'],403);
        }
    } elseif (!isSuperusuario()) {
        // Si no especificó finca, asignar la del usuario
        $fincaUsuario = getUserFinca();
        if ($fincaUsuario) {
            $data['codigo_finca'] = $fincaUsuario;
        }
    }

    if ($model->crear($data)) {
      respond(['ok'=>true,'message'=>'Usuario creado correctamente']);
    }
    respond(['ok'=>false,'error'=>'No se pudo crear el usuario (verifique campos requeridos o el código ya existe)'],400);
  }

  /* ============== PUT (actualizar) ============== */
  if ($method === 'PUT') {
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) parse_str($raw, $data);

    $id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
    $codigo = $_GET['codigo'] ?? null;

    if (!$id && $codigo) {
      $u = $model->obtenerPorCodigo($codigo);
      $id = $u['id'] ?? null;
    }

    if (!$id) {
      respond(['ok'=>false,'error'=>'Se requiere id o codigo'],422);
    }

    if ($model->actualizarPorId($id, $data)) {
      respond(['ok'=>true,'message'=>'Usuario actualizado']);
    }
    respond(['ok'=>false,'error'=>'No se pudo actualizar'],400);
  }

  /* ============== DELETE ============== */
  if ($method === 'DELETE') {
    // Verificar permiso para eliminar usuarios
    requirePermiso('eliminar_usuarios');

    $id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
    $codigo = $_GET['codigo'] ?? null;

    if (!$id && $codigo) {
      $u  = $model->obtenerPorCodigo($codigo);
      $id = $u['id'] ?? null;
    }

    if (!$id) {
      respond(['ok'=>false,'error'=>'Se requiere id o codigo'],422);
    }

    if ($model->eliminarPorId($id)) {
      respond(['ok'=>true,'message'=>'Usuario eliminado']);
    }
    respond(['ok'=>false,'error'=>'No se pudo eliminar'],400);
  }

  respond(['ok'=>false,'error'=>'Método no permitido'],405);

} catch (Throwable $e) {
  error_log("API usuario error: ".$e->getMessage());
  respond(['ok'=>false,'error'=>'Error interno del servidor'],500);
}
