<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/auth.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Usa la función helper de auth.php
$user = getAuthenticatedUser();

if (!$user) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'No autenticado']);
    exit;
}

echo json_encode([
    'ok'   => true,
    'user' => $user
], JSON_UNESCAPED_UNICODE);
