<?php
// api/logout.php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/authcontroller.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

try {
    $pdo  = Database::connect();
    $auth = new AuthController($pdo);

    // Usar la acción 'logout' del controlador
    $auth->handleAction('logout');

} catch (Throwable $e) {
    error_log("API logout error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error interno del servidor'], JSON_UNESCAPED_UNICODE);
    exit;
}
