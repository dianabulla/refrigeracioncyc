<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/session_security.php';
require_once __DIR__ . '/../controllers/refrigerantecontroller.php';

if (session_status() === PHP_SESSION_NONE) session_start();

requireAuth();

$pdo = Database::connect();
$controller = new RefrigeranteController($pdo);

function respond($data, int $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$empresaUsuario = getUserEmpresa();

try {

    if ($method === 'GET') {
        requirePermiso('ver_refrigerantes');

        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        $codigo = $_GET['codigo'] ?? null;

        if ($id) {
            $row = $controller->obtenerPorId($id, $empresaUsuario);
            $row ? respond($row) : respond(['ok' => false, 'error' => 'Refrigerante no encontrado'], 404);
        }

        if ($codigo) {
            $row = $controller->obtenerPorCodigo($codigo, $empresaUsuario);
            $row ? respond($row) : respond(['ok' => false, 'error' => 'Refrigerante no encontrado'], 404);
        }

        respond($controller->listar($empresaUsuario));
    }

    if ($method === 'POST') {
        requirePermiso('crear_refrigerantes');

        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        if (!isSuperusuario()) {
            $data['codigo_empresa'] = $empresaUsuario;
        }

        $r = $controller->crear($data, $empresaUsuario);
        respond($r, $r['ok'] ? 201 : 400);
    }

    if ($method === 'PUT') {
        requirePermiso('editar_refrigerantes');

        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        $codigo = $_GET['codigo'] ?? null;

        $raw = file_get_contents('php://input');
        $put = json_decode($raw, true);
        if (!is_array($put)) {
            parse_str($raw, $put);
        }

        if (!$id && !$codigo) {
            respond(['ok' => false, 'error' => 'Se requiere id o codigo'], 422);
        }

        $where = $id ? ['id' => $id] : ['codigo' => $codigo];
        $r = $controller->actualizar($where, $put, $empresaUsuario);
        respond($r, $r['ok'] ? 200 : 400);
    }

    if ($method === 'DELETE') {
        requirePermiso('eliminar_refrigerantes');

        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        $codigo = $_GET['codigo'] ?? null;
        if (!$id && !$codigo) {
            respond(['ok' => false, 'error' => 'Se requiere id o codigo'], 422);
        }

        $where = $id ? ['id' => $id] : ['codigo' => $codigo];
        $r = $controller->eliminar($where, $empresaUsuario);
        respond($r, $r['ok'] ? 200 : 400);
    }

    respond(['ok' => false, 'error' => 'Método no permitido'], 405);

} catch (Throwable $e) {
    error_log("Error en refrigerante.php: " . $e->getMessage());
    respond(['ok' => false, 'error' => 'Error interno del servidor'], 500);
}
