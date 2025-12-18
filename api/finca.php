<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../models/finca.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Usuarios autenticados con permisos pueden gestionar fincas
requireAuth();

$pdo        = Database::connect();
$fincaModel = new Finca($pdo);

// Helper de respuesta
function respond($data, int $status = 200)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    // ---------- GET ----------
    if ($method === 'GET') {
        // Verificar permiso para ver fincas
        requirePermiso('ver_fincas');

        $codigo        = $_GET['codigo'] ?? null;
        $codigoEmpresa = $_GET['codigo_empresa'] ?? null;

        // Filtrar por empresa del usuario si no es superusuario
        $empresaUsuario = getUserEmpresa();
        if ($empresaUsuario !== null) {
            $codigoEmpresa = $empresaUsuario;
        }

        if ($codigo) {
            $row = $fincaModel->obtenerPorCodigo($codigo);
            // Verificar que la finca pertenece a la empresa del usuario
            if ($row && $empresaUsuario !== null && $row['codigo_empresa'] !== $empresaUsuario) {
                respond(['ok' => false, 'error' => 'Acceso denegado'], 403);
            }
            $row ? respond($row) : respond(['ok' => false, 'error' => 'Finca no encontrada'], 404);
        } else {
            $rows = $fincaModel->listar($codigoEmpresa);
            respond($rows);
        }
    }

    // ---------- POST (crear) ----------
    if ($method === 'POST') {
        // Verificar permiso para crear fincas
        requirePermiso('crear_fincas');

        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data) || empty($data)) {
            // fallback por si envías x-www-form-urlencoded
            $data = $_POST;
        }

        $ok = $fincaModel->crear($data);
        $ok ? respond(['ok' => true], 201)
            : respond(['ok' => false, 'error' => 'No se pudo crear (verifique campos requeridos o el código ya existe)'], 400);
    }

    // ---------- PUT (actualizar por código) ----------
    if ($method === 'PUT') {
        // Verificar permiso para editar fincas
        requirePermiso('editar_fincas');

        parse_str(file_get_contents('php://input'), $put);
        $codigo = $put['codigo'] ?? null;
        if (!$codigo) {
            respond(['ok' => false, 'error' => 'codigo requerido'], 422);
        }
        unset($put['codigo']); // no permitimos cambiar el código aquí

        $ok = $fincaModel->actualizarPorCodigo($codigo, $put);
        $ok ? respond(['ok' => true])
            : respond(['ok' => false, 'error' => 'No se pudo actualizar'], 400);
    }

    // ---------- DELETE (eliminar por código) ----------
    if ($method === 'DELETE') {
        // Verificar permiso para eliminar fincas
        requirePermiso('eliminar_fincas');

        $codigo = $_GET['codigo'] ?? null;
        if (!$codigo) {
            respond(['ok' => false, 'error' => 'codigo requerido'], 422);
        }

        $ok = $fincaModel->eliminarPorCodigo($codigo);
        $ok ? respond(['ok' => true])
            : respond(['ok' => false, 'error' => 'No se pudo eliminar'], 400);
    }

    // Si llega aquí, método no permitido
    respond(['ok' => false, 'error' => 'Método no permitido'], 405);

} catch (Throwable $e) {
    error_log("Error en api/finca.php: " . $e->getMessage());
    respond(['ok' => false, 'error' => 'Error interno del servidor'], 500);
}
