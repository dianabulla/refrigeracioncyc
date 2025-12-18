<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/superusuario.php';
require_once __DIR__ . '/../config/auth.php';

// Helper de respuesta JSON consistente
function respond($data, int $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Obtener PDO desde la clase Database
$pdo = Database::connect();

// Instanciar modelo
$superusuario = new SuperUsuario($pdo);

// -------------------------------------------------------------
// Bootstrap de superusuario
// - Si la tabla está vacía, permitimos crear el PRIMERO sin sesión.
// - Si ya existe al menos uno, exigimos que quien use esta API sea superusuario.
// -------------------------------------------------------------
try {
    $haySuper = $superusuario->contar() > 0;
} catch (Throwable $e) {
    error_log("superusuario contar() error: " . $e->getMessage());
    respond(['ok' => false, 'error' => $e->getMessage()], 500);
}

if ($haySuper) {
    // A partir del segundo en adelante, solo superusuario entra
    requireAuth('superusuario');
}

// Métodos permitidos (agrego PATCH para cambio de contraseña)
$method = $_SERVER['REQUEST_METHOD'];
$allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
if (!in_array($method, $allowedMethods, true)) {
    respond(["ok" => false, "error" => "Método no permitido"], 405);
}

try {
    switch ($method) {
        case 'GET':
            // GET ?id=  -> obtener por id
            // GET ?codigo=  -> obtener por código
            // GET listado con filtros: ?q=&activo=&limit=&offset=&order=&dir=
            $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
            $codigo = isset($_GET['codigo']) ? trim($_GET['codigo']) : null;

            if ($id) {
                $r = $superusuario->obtenerPorId($id);
                $r ? respond(['ok' => true, 'data' => $r])
                   : respond(["ok" => false, "error" => "Superusuario no encontrado"], 404);
            }

            if ($codigo !== null && $codigo !== '') {
                $r = $superusuario->obtenerPorCodigo($codigo);
                $r ? respond(['ok' => true, 'data' => $r])
                   : respond(["ok" => false, "error" => "Superusuario no encontrado"], 404);
            }

            $f = [
                'q'      => $_GET['q']      ?? null,
                'activo' => $_GET['activo'] ?? '',
                'limit'  => $_GET['limit']  ?? 50,
                'offset' => $_GET['offset'] ?? 0,
                'order'  => $_GET['order']  ?? 'fecha_creacion',
                'dir'    => $_GET['dir']    ?? 'DESC',
            ];
            $data = $superusuario->listar($f);
            respond(['ok' => true, 'data' => $data]);
            break;

        case 'POST':
            // BODY JSON: {codigo, nombre, email, telefono?, password, activo?}
            $data = json_decode(file_get_contents("php://input"), true);
            if (!is_array($data)) {
                respond(["ok" => false, "error" => "Datos JSON inválidos"], 400);
            }

            $r = $superusuario->crear($data);
            respond($r, $r['ok'] ? 201 : 400);
            break;

        case 'PUT':
            // PUT ?id=  BODY: campos {codigo?, nombre?, email?, telefono?, activo?}
            $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
            if (!$id) {
                respond(["ok" => false, "error" => "Falta o es inválido el ID"], 400);
            }

            $data = json_decode(file_get_contents("php://input"), true);
            if (!is_array($data)) {
                respond(["ok" => false, "error" => "Datos JSON inválidos"], 400);
            }

            $r = $superusuario->actualizar($id, $data);
            respond($r, $r['ok'] ? 200 : 400);
            break;

        case 'PATCH':
            // PATCH ?id=  BODY:
            //  - Para cambiar contraseña: { "password": "NuevaClave123" }
            //  - Para activar/desactivar: { "activo": 0|1 }
            $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
            if (!$id) {
                respond(["ok" => false, "error" => "Falta o es inválido el ID"], 400);
            }

            $data = json_decode(file_get_contents("php://input"), true) ?? [];
            if (!is_array($data)) {
                respond(["ok" => false, "error" => "Datos JSON inválidos"], 400);
            }

            if (isset($data['password'])) {
                $r = $superusuario->cambiarPassword($id, (string)$data['password']);
                respond($r, $r['ok'] ? 200 : 400);
            }

            if (isset($data['activo'])) {
                $r = $superusuario->actualizar($id, ['activo' => (int)$data['activo']]);
                respond($r, $r['ok'] ? 200 : 400);
            }

            respond(["ok" => false, "error" => "Nada para actualizar"], 400);
            break;

        case 'DELETE':
            // Soft delete: activo=0
            $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
            if (!$id) {
                respond(["ok" => false, "error" => "Falta o es inválido el ID"], 400);
            }

            $r = $superusuario->eliminar($id);
            respond($r, $r['ok'] ? 200 : 400);
            break;
    }

} catch (Throwable $e) {
    // Mientras estamos arreglando cosas, mostramos el mensaje real:
    error_log("Error en superusuario.php: " . $e->getMessage());
    respond(["ok" => false, "error" => $e->getMessage()], 500);
}
