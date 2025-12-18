<?php
// api/login.php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/authcontroller.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

try {
    // Conexión PDO usando tu clase Database
    $pdo = Database::connect();

    // Crear el controlador de autenticación
    $auth = new AuthController($pdo);

    // Usar la acción 'login' de tu controlador
    $auth->handleAction('login');  // esto ya hace echo json + exit

} catch (Throwable $e) {
    error_log("API login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error interno del servidor'], JSON_UNESCAPED_UNICODE);
    exit;
}
