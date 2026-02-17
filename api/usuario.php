<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/session_security.php';
require_once __DIR__ . '/../models/usuario.php';

if (session_status() === PHP_SESSION_NONE) session_start();

/**
 * Solo alguien logueado puede gestionar usuarios.
 * Si quieres solo superusuario, cambia a: requireAuth('superusuario');
 */
requireAuth(); 

$pdo    = Database::connect();
$model  = new Usuario($pdo);

$empresaUsuario = getUserEmpresa();
$fincaUsuario = getUserFinca();
if (!isSuperusuario() && !$empresaUsuario) {
  respond(['ok' => false, 'error' => 'Usuario sin empresa asignada'], 403);
}

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

    // Filtrar por finca/empresa del usuario si no es superusuario
    if (!isSuperusuario()) {
      if ($fincaUsuario) {
        // Usuario de finca: solo usuarios de su finca
        $codFin = $fincaUsuario;
      } elseif ($empresaUsuario && !$codFin) {
        // Usuario de empresa: todos los usuarios de su empresa (todas las fincas)
        // Se filtrará mas adelante si es necesario
      }
    }

    if ($id) {
      $u = $model->obtenerPorId($id);
      // Verificar acceso
      if ($u && !isSuperusuario()) {
        $usuFinca = $u['codigo_finca'] ?? null;
        $usuEmpresa = $u['codigo_empresa'] ?? null;
        
        // Usuario de finca: solo su finca
        if ($fincaUsuario && $usuFinca !== $fincaUsuario) {
          respond(['ok'=>false,'error'=>'Acceso denegado'],403);
        }
        // Usuario de empresa: solo su empresa
        if (!$fincaUsuario && $empresaUsuario && $usuEmpresa !== $empresaUsuario) {
          respond(['ok'=>false,'error'=>'Acceso denegado'],403);
        }
      }
      $u ? respond($u) : respond(['ok'=>false,'error'=>'No encontrado'],404);
    }
    if ($codigo) {
      $u = $model->obtenerPorCodigo($codigo);
      // Verificar acceso
      if ($u && !isSuperusuario()) {
        $usuFinca = $u['codigo_finca'] ?? null;
        $usuEmpresa = $u['codigo_empresa'] ?? null;
        
        // Usuario de finca: solo su finca
        if ($fincaUsuario && $usuFinca !== $fincaUsuario) {
          respond(['ok'=>false,'error'=>'Acceso denegado'],403);
        }
        // Usuario de empresa: solo su empresa
        if (!$fincaUsuario && $empresaUsuario && $usuEmpresa !== $empresaUsuario) {
          respond(['ok'=>false,'error'=>'Acceso denegado'],403);
        }
      }
      $u ? respond($u) : respond(['ok'=>false,'error'=>'No encontrado'],404);
    }
    
    // Para listar usuarios, si es usuario de empresa, obtener de todas las fincas
    if (!isSuperusuario() && !$fincaUsuario && $empresaUsuario && !$codFin) {
      $sqlUsers = "SELECT u.* FROM usuario u WHERE u.codigo_empresa = ? ORDER BY u.nombre";
      $stUsers = $pdo->prepare($sqlUsers);
      $stUsers->execute([$empresaUsuario]);
      respond($stUsers->fetchAll(PDO::FETCH_ASSOC));
    }

    $list = $model->listar($codFin, $codRol);
    respond($list);
  }

  /* ============== POST (crear) ============== */
  if ($method === 'POST') {
    // Verificar permiso para crear usuarios
    requirePermiso('crear_usuarios');

    $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    // AISLAMIENTO: Validar que la finca/empresa pertenece al usuario
    if (!isSuperusuario()) {
        // Si especificó finca, validar que sea de su empresa
        if (!empty($data['codigo_finca'])) {
            $sqlCheck = "SELECT f.codigo_empresa 
                         FROM finca f
                         WHERE f.codigo = ?";
            $stCheck = $pdo->prepare($sqlCheck);
            $stCheck->execute([$data['codigo_finca']]);
            $finca = $stCheck->fetch(PDO::FETCH_ASSOC);
            
            if (!$finca) {
                respond(['ok'=>false,'error'=>'Finca no encontrada'],404);
            }
            
            // Validar que la finca es de su misma empresa o de su finca específica
            if ($fincaUsuario && $data['codigo_finca'] !== $fincaUsuario) {
                respond(['ok'=>false,'error'=>'No puede crear usuarios en otra finca'],403);
            }
            
            if (!$fincaUsuario && $empresaUsuario && $finca['codigo_empresa'] !== $empresaUsuario) {
                respond(['ok'=>false,'error'=>'No puede crear usuarios en otra empresa'],403);
            }
        }
        
        // Si especificó empresa, validar que sea la suya
        if (!empty($data['codigo_empresa'])) {
            if ($empresaUsuario && $data['codigo_empresa'] !== $empresaUsuario) {
                respond(['ok'=>false,'error'=>'No puede crear usuarios en otra empresa'],403);
            }
        }
        
        // Si no especificó nada, asignar automáticamente
        if (empty($data['codigo_finca']) && empty($data['codigo_empresa'])) {
            if ($fincaUsuario) {
                $data['codigo_finca'] = $fincaUsuario;
            } elseif ($empresaUsuario) {
                $data['codigo_empresa'] = $empresaUsuario;
            }
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

    // Normalizar campos vacíos
    if (array_key_exists('codigo_finca', $data) && $data['codigo_finca'] === '') {
      $data['codigo_finca'] = null;
    }
    if (array_key_exists('codigo_empresa', $data) && $data['codigo_empresa'] === '') {
      $data['codigo_empresa'] = null;
    }
    if (array_key_exists('codigo_finca', $data) && is_string($data['codigo_finca'])) {
      $valor = strtolower(trim($data['codigo_finca']));
      if ($valor === '' || $valor === '0' || $valor === 'null' || $valor === 'undefined') {
        $data['codigo_finca'] = null;
      }
    }
    if (array_key_exists('codigo_empresa', $data) && is_string($data['codigo_empresa'])) {
      $valor = strtolower(trim($data['codigo_empresa']));
      if ($valor === '' || $valor === '0' || $valor === 'null' || $valor === 'undefined') {
        $data['codigo_empresa'] = null;
      }
    }

    $id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
    $codigo = $_GET['codigo'] ?? null;

    if (!$id && $codigo) {
      $u = $model->obtenerPorCodigo($codigo);
      $id = $u['id'] ?? null;
    }

    if (!$id) {
      respond(['ok'=>false,'error'=>'Se requiere id o codigo'],422);
    }

    // Validar finca y asignar empresa relacionada si aplica
    if (!empty($data['codigo_finca'])) {
      $sqlCheck = "SELECT f.codigo_empresa FROM finca f WHERE f.codigo = ?";
      $stCheck = $pdo->prepare($sqlCheck);
      $stCheck->execute([$data['codigo_finca']]);
      $finca = $stCheck->fetch(PDO::FETCH_ASSOC);

      if (!$finca) {
        respond(['ok'=>false,'error'=>'Finca no encontrada'],404);
      }

      $data['codigo_empresa'] = $finca['codigo_empresa'];
    }

    if (!isSuperusuario()) {
      $u = $model->obtenerPorId($id);
      if (!$u) {
        respond(['ok'=>false,'error'=>'Acceso denegado'],403);
      }

      $usuFinca = $u['codigo_finca'] ?? null;
      $usuEmpresa = $u['codigo_empresa'] ?? null;

      if ($fincaUsuario && $usuFinca !== $fincaUsuario) {
        respond(['ok'=>false,'error'=>'Acceso denegado'],403);
      }
      if (!$fincaUsuario && $empresaUsuario && $usuEmpresa !== $empresaUsuario) {
        respond(['ok'=>false,'error'=>'Acceso denegado'],403);
      }

      // Validar finca/empresa al actualizar
      if (!empty($data['codigo_finca'])) {
        if ($fincaUsuario && $data['codigo_finca'] !== $fincaUsuario) {
          respond(['ok'=>false,'error'=>'No puede asignar otra finca'],403);
        }

        if (!$fincaUsuario && $empresaUsuario && ($data['codigo_empresa'] ?? null) !== $empresaUsuario) {
          respond(['ok'=>false,'error'=>'No puede asignar finca de otra empresa'],403);
        }
      }

      if (!empty($data['codigo_empresa']) && $empresaUsuario && $data['codigo_empresa'] !== $empresaUsuario) {
        respond(['ok'=>false,'error'=>'No puede asignar otra empresa'],403);
      }

      // Si se limpia finca, mantener empresa del usuario
      if (array_key_exists('codigo_finca', $data) && $data['codigo_finca'] === null && empty($data['codigo_empresa'])) {
        $data['codigo_empresa'] = $empresaUsuario;
      }
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

    if (!isSuperusuario()) {
      $u = $model->obtenerPorId($id);
      if (!$u) {
        respond(['ok'=>false,'error'=>'Acceso denegado'],403);
      }

      $usuFinca = $u['codigo_finca'] ?? null;
      $usuEmpresa = $u['codigo_empresa'] ?? null;

      if ($fincaUsuario && $usuFinca !== $fincaUsuario) {
        respond(['ok'=>false,'error'=>'Acceso denegado'],403);
      }
      if (!$fincaUsuario && $empresaUsuario && $usuEmpresa !== $empresaUsuario) {
        respond(['ok'=>false,'error'=>'Acceso denegado'],403);
      }
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
