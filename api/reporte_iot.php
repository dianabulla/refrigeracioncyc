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
    $tipo_reporte = $data['tipo_reporte'] ?? null;
    
    if (!$codigo_sensor || !$tipo_reporte) {
      respond(['error' => 'codigo_sensor y tipo_reporte son requeridos'], 400);
    }
    
    // Verificar que el sensor existe
    $stmt = $pdo->prepare("SELECT codigo FROM sensor WHERE codigo = ?");
    $stmt->execute([$codigo_sensor]);
    if (!$stmt->fetch()) {
      respond(['error' => 'Sensor no encontrado'], 404);
    }
    
    // Preparar datos del reporte
    $reporteData = [
      'codigo_sensor' => $codigo_sensor,
      'tipo_reporte' => $tipo_reporte,
      'temperatura' => !empty($data['temperatura']) ? floatval($data['temperatura']) : null,
      'humedad' => !empty($data['humedad']) ? floatval($data['humedad']) : null,
      'voltaje' => !empty($data['voltaje']) ? floatval($data['voltaje']) : null,
      'amperaje' => !empty($data['amperaje']) ? floatval($data['amperaje']) : null,
      'presion_s' => !empty($data['presion_s']) ? floatval($data['presion_s']) : null,
      'presion_e' => !empty($data['presion_e']) ? floatval($data['presion_e']) : null,
      'aire' => !empty($data['aire']) ? trim($data['aire']) : null,
      'puerta' => !empty($data['puerta']) ? trim($data['puerta']) : null,
      'otro' => !empty($data['otro']) ? trim($data['otro']) : null,
      'fecha_captura' => date('Y-m-d H:i:s')
    ];
    
    // Insertar reporte
    $id = $model->create($reporteData);
    
    respond([
      'success' => true,
      'message' => 'Datos recibidos correctamente',
      'id' => $id
    ], 201);
  }

  else {
    respond(['error' => 'Método no permitido'], 405);
  }

} catch (Exception $e) {
  error_log("Error en reporte_iot.php: " . $e->getMessage());
  respond(['error' => $e->getMessage()], 500);
}
?>
