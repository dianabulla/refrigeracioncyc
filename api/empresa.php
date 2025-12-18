<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../models/empresa.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Solo superusuario gestiona empresas
requireAuth('superusuario');

$pdo = Database::connect();
$empresaModel = new Empresa($pdo);

// Helper de respuesta
function respond($data, int $status = 200)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {

    // ------------------ GET ------------------
    if ($method === 'GET') {
        $codigo = $_GET['codigo'] ?? null;

        if ($codigo) {
            $row = $empresaModel->obtenerPorCodigo($codigo);
            $row ? respond($row) : respond(['error' => 'Empresa no encontrada'], 404);
        } else {
            // Opcional: filtrar por superusuario logueado
            $codigoSu = $_SESSION['user']['codigo'] ?? null;
            $rows = $empresaModel->listar($codigoSu);
            respond($rows);
        }
    }

    // ------------------ POST ------------------
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data) || empty($data)) {
            // fallback por si viene como form-data
            $data = $_POST;
        }

        $codigoSu = $_SESSION['user']['codigo'] ?? '';
        if ($codigoSu === '') {
            respond(['error' => 'Superusuario no identificado en la sesión'], 401);
        }

        $ok = $empresaModel->crear($data, $codigoSu);
        $ok ? respond(['ok' => true]) : respond(['error' => 'No se pudo crear (verifique campos requeridos o el código ya existe)'], 400);
    }

    // ------------------ PUT ------------------
    if ($method === 'PUT') {
        // Como ya lo tenías: parse_str del cuerpo
        parse_str(file_get_contents('php://input'), $put);
        $codigo = $put['codigo'] ?? null;
        if (!$codigo) {
            respond(['error' => 'codigo requerido'], 422);
        }

        // Quitamos el campo codigo del array para no intentar cambiarlo
        unset($put['codigo']);

        $ok = $empresaModel->actualizarPorCodigo($codigo, $put);
        $ok ? respond(['ok' => true]) : respond(['error' => 'No se pudo actualizar'], 400);
    }

    // ------------------ DELETE ------------------
    if ($method === 'DELETE') {
        $codigo = $_GET['codigo'] ?? null;
        if (!$codigo) {
            respond(['error' => 'codigo requerido'], 422);
        }

        $ok = $empresaModel->eliminarPorCodigo($codigo);
        $ok ? respond(['ok' => true]) : respond(['error' => 'No se pudo eliminar'], 400);
    }

    // Si llega aquí, el método no está permitido
    respond(['error' => 'Método no permitido'], 405);

} catch (Throwable $e) {
    error_log("Error en api/empresa.php: " . $e->getMessage());
    respond(['error' => 'Error interno del servidor'], 500);
}
