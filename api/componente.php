<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../models/componente.php';

if (session_status() === PHP_SESSION_NONE) session_start();
requireAuth(); // cualquier usuario autenticado

$pdo        = Database::connect();
$componente = new Componente($pdo);

function respond($data, int $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {

    /* 🟢 GET */
    if ($method === 'GET') {
        // Verificar permiso para ver componentes
        requirePermiso('ver_componentes');

        $id           = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        $codigo       = $_GET['codigo']        ?? null;
        $codigoCuarto = $_GET['codigo_cuarto'] ?? null;

        if ($id) {
            $row = $componente->obtenerPorId($id);
            $row ? respond($row) : respond(['ok'=>false,'error'=>'Componente no encontrado'],404);
        }

        if ($codigo) {
            $row = $componente->obtenerPorCodigo($codigo);
            $row ? respond($row) : respond(['ok'=>false,'error'=>'Componente no encontrado'],404);
        }

        $lista = $componente->listar($codigoCuarto);
        respond($lista);
    }

    /* 🟡 POST */
    if ($method === 'POST') {
        // Verificar permiso para crear componentes
        requirePermiso('crear_componentes');

        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $r = $componente->crear($data);
        respond($r, $r['ok'] ? 201 : 400);
    }

    /* 🟠 PUT */
    if ($method === 'PUT') {
        // Verificar permiso para editar componentes
        requirePermiso('editar_componentes');

        $id           = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        $codigo       = $_GET['codigo'] ?? null;

        $raw = file_get_contents('php://input');
        $put = json_decode($raw, true);
        if (!is_array($put)) {
            parse_str($raw, $put);
        }

        if (!$id && !$codigo) {
            respond(['ok'=>false,'error'=>'Se requiere id o codigo'],422);
        }

        $where = $id ? ['id'=>$id] : ['codigo'=>$codigo];
        $r = $componente->actualizar($where, $put);
        respond($r, $r['ok'] ? 200 : 400);
    }

    /* 🔴 DELETE */
    if ($method === 'DELETE') {
        // Verificar permiso para eliminar componentes
        requirePermiso('eliminar_componentes');

        $id     = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        $codigo = $_GET['codigo'] ?? null;
        if (!$id && !$codigo) {
            respond(['ok'=>false,'error'=>'Se requiere id o codigo'],422);
        }
        $where = $id ? ['id'=>$id] : ['codigo'=>$codigo];
        $r = $componente->eliminar($where);
        respond($r, $r['ok'] ? 200 : 400);
    }

    respond(['ok'=>false,'error'=>'Método no permitido'],405);

} catch (Throwable $e) {
    error_log("Error en componente.php: ".$e->getMessage());
    respond(['ok'=>false,'error'=>'Error interno del servidor'],500);
}
