<?php
// api/superusuario_password.php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/superusuario.php';
require_once __DIR__ . '/../config/auth.php';

// SECURITY: requiere sesión de superusuario
requireAuth('superusuario');

// FIX: crea el PDO desde la clase Database (ya no hay $pdo global)
$pdo = Database::connect();

// FIX: nombre de clase correcto (SuperUsuario con U mayúscula)
$superusuario = new SuperUsuario($pdo);

// Helper para responder JSON
function respond($data, int $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Permitimos PUT (si prefieres PATCH, cambia esta línea y el método en Postman)
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'PUT') {
    respond(['error' => 'Método no permitido'], 405);
}

// Leer body JSON
$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    respond(['error' => 'Datos JSON inválidos'], 400);
}

$id      = isset($data['id']) ? (int)$data['id'] : 0;
$newPass = trim((string)($data['password'] ?? ''));

if ($id <= 0 || $newPass === '') {
    respond(['error' => 'Debe enviar id y password'], 400);
}

// Llama al método del modelo
$result = $superusuario->cambiarPassword($id, $newPass);

// Responder
if (!empty($result['ok'])) {
    respond(['message' => 'Contraseña actualizada correctamente'], 200);
}
respond(['error' => $result['error'] ?? 'Error al cambiar contraseña'], 400);
