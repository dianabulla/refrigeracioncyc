<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../models/sensor.php';

if (session_status() === PHP_SESSION_NONE) session_start();

requireAuth(); // Usuarios autenticados pueden gestionar sensores de sus cuartos

$pdo = Database::connect();
$model = new Sensor($pdo);

function respond($d, int $status=200){
    http_response_code($status);
    echo json_encode($d, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {

    // GET
    if ($method === 'GET') {
        // Verificar permiso para ver sensores
        requirePermiso('ver_sensores');

        $codigo = $_GET['codigo'] ?? null;
        $cuarto = $_GET['codigo_cuarto'] ?? null;

        if ($codigo) {
            $r = $model->obtenerPorCodigo($codigo);
            $r ? respond($r) : respond(['error'=>'No encontrado'], 404);
        }

        respond($model->listar($cuarto));
    }

    // POST
    if ($method === 'POST') {
        // Verificar permiso para crear sensores
        requirePermiso('crear_sensores');

        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) $data = $_POST;

        $ok = $model->crear($data);
        $ok ? respond(['ok'=>true]) : respond(['error'=>'No se pudo crear (verifique campos requeridos o el código ya existe)'], 400);
    }

    // PUT
    if ($method === 'PUT') {
        // Verificar permiso para editar sensores
        requirePermiso('editar_sensores');

        parse_str(file_get_contents('php://input'), $put);
        $codigo = $put['codigo'] ?? null;
        if (!$codigo) respond(['error'=>'codigo requerido'], 422);
        unset($put['codigo']);

        $ok = $model->actualizarPorCodigo($codigo, $put);
        $ok ? respond(['ok'=>true]) : respond(['error'=>'No se pudo actualizar'], 400);
    }

    // DELETE
    if ($method === 'DELETE') {
        // Verificar permiso para eliminar sensores
        requirePermiso('eliminar_sensores');

        $codigo = $_GET['codigo'] ?? null;
        if (!$codigo) respond(['error'=>'codigo requerido'], 422);

        $ok = $model->eliminarPorCodigo($codigo);
        $ok ? respond(['ok'=>true]) : respond(['error'=>'No se pudo eliminar'], 400);
    }

    respond(['error'=>'Método no permitido'], 405);

} catch (Throwable $e) {
    respond(['error'=>$e->getMessage()], 500);
}
