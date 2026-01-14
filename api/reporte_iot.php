<?php
// api/reporte_iot.php
// Endpoint para recibir datos de dispositivos IoT

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/reporte.php';

$pdo = Database::connect();
$model = new Reporte($pdo);

function respond($data, int $status = 200){
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {

  /* ============== POST - Recibir datos de sensores IoT ============== */
  if ($method === 'POST') {
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos requeridos
    $codigo_sensor = $data['codigo_sensor'] ?? null;
    
    if (!$codigo_sensor) {
      respond(['error' => 'codigo_sensor es requerido'], 400);
    }
    
    // Obtener información del sensor incluyendo su tipo
    $stmt = $pdo->prepare("
        SELECT s.codigo, s.codigo_cuarto, s.tipo, c.codigo_finca, f.codigo_empresa
        FROM sensor s
        INNER JOIN cuarto_frio c ON s.codigo_cuarto = c.codigo
        INNER JOIN finca f ON c.codigo_finca = f.codigo
        WHERE s.codigo = ?
    ");
    $stmt->execute([$codigo_sensor]);
    $sensor = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$sensor) {
      respond(['error' => 'Sensor no encontrado'], 404);
    }
    
    // El tipo_reporte viene del sensor, no de lo que envía la ESP32
    $tipo_reporte = $sensor['tipo'];
    
    // Preparar datos del reporte (todos los campos de la tabla)
    $reporteData = [
      //'codigo' => uniqid('IOT_', true),  // Generar código único para el reporte
      'codigo' => $data['codigo'] ?? null,  // Generar código único para el reporte
      'nombre' => $data['nombre'] ?? null,
      'tipo_reporte' => $tipo_reporte,
      'activo' => 1,
      'report_id' => $data['report_id'] ?? null,
      //'fecha_captura' => date('Y-m-d H:i:s'),
      //'fecha' => date('Y-m-d'),
      'fecha_captura' => $data['fecha_captura'] ?? null,
      'fecha' => $data['fecha'] ?? null,
      'voltaje' => isset($data['voltaje']) ? floatval($data['voltaje']) : null,
      'amperaje' => isset($data['amperaje']) ? floatval($data['amperaje']) : null,
      'aire' => isset($data['aire']) ? floatval($data['aire']) : null,
      'otro' => isset($data['otro']) ? floatval($data['otro']) : null,
      'puerta' => isset($data['puerta']) ? floatval($data['puerta']) : null,
      'presion_s' => isset($data['presion_s']) ? floatval($data['presion_s']) : null,
      'presion_e' => isset($data['presion_e']) ? floatval($data['presion_e']) : null,
      'temperatura' => isset($data['temperatura']) ? floatval($data['temperatura']) : null,
      'humedad' => isset($data['humedad']) ? floatval($data['humedad']) : null,
      'codigo_sensor' => $codigo_sensor,
      'codigo_cuarto' => $sensor['codigo_cuarto'] // Asignar desde la BD según el sensor
    ];
    
    // Insertar reporte
    $success = $model->crear($reporteData);
    
    if ($success) {
      respond([
        'success' => true,
        'message' => 'Datos recibidos correctamente',
        'codigo' => $reporteData['codigo']
      ], 201);
    } else {
      respond(['error' => 'Error al guardar el reporte'], 500);
    }
  }

  else {
    respond(['error' => 'Método no permitido'], 405);
  }

} catch (Exception $e) {
  error_log("Error en reporte_iot.php: " . $e->getMessage());
  respond(['error' => $e->getMessage()], 500);
}
?>
