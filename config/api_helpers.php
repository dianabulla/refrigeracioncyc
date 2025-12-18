<?php
/**
 * API Helper Functions
 * Funciones comunes reutilizables para todas las APIs
 */

/**
 * Responder con JSON
 */
function respond($data, int $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Obtener datos del cuerpo de la petición (JSON o form-data)
 */
function getRequestData() {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data) || empty($data)) {
        $data = $_POST;
    }
    return $data;
}

/**
 * Validar que campos requeridos existan
 */
function validateRequired(array $data, array $requiredFields) {
    $missing = [];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            $missing[] = $field;
        }
    }
    
    if (!empty($missing)) {
        respond([
            'ok' => false, 
            'error' => 'Campos requeridos faltantes: ' . implode(', ', $missing)
        ], 422);
    }
    
    return true;
}

/**
 * Manejar errores de forma consistente
 */
function handleError(Throwable $e, string $context = 'API') {
    error_log("$context error: " . $e->getMessage());
    respond(['ok' => false, 'error' => 'Error interno del servidor'], 500);
}

/**
 * Validar método HTTP
 */
function validateMethod(string $expected, string $actual) {
    if ($expected !== $actual) {
        respond(['ok' => false, 'error' => 'Método no permitido'], 405);
    }
}
