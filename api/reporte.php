<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Cualquier usuario autenticado puede ver reportes
requireAuth();

$pdo = Database::connect();

function respond($data, int $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {

    // ---------- GET: listar / detalle ----------
    if ($method === 'GET') {
        // Verificar permiso para ver reportes
        requirePermiso('ver_reportes');

        $codigo       = $_GET['codigo'] ?? null;
        $codigoSensor = $_GET['codigo_sensor'] ?? null;
        $codigoCuarto = $_GET['codigo_cuarto'] ?? null;
        $desde        = $_GET['desde'] ?? null; // sobre fecha_captura
        $hasta        = $_GET['hasta'] ?? null;

        // Si no envían fechas, por defecto traer solo el día de hoy para evitar cargas pesadas
        if (!$desde && !$hasta) {
            $hoy = date('Y-m-d');
            $desde = $hoy . ' 00:00:00';
            $manana = date('Y-m-d', strtotime($hoy . ' +1 day'));
            $hasta = $manana . ' 00:00:00';
        } elseif ($hasta && strpos($hasta, ':') === false) {
            // Si solo envían fecha sin hora, ajustar hasta el inicio del día siguiente
            $hasta = date('Y-m-d', strtotime($hasta . ' +1 day')) . ' 00:00:00';
        } elseif ($hasta && strpos($hasta, '23:59:59') !== false) {
            // Si envían con 23:59:59, cambiar a inicio del día siguiente
            $fechaBase = substr($hasta, 0, 10);
            $hasta = date('Y-m-d', strtotime($fechaBase . ' +1 day')) . ' 00:00:00';
        }

        // Asegurar que desde tiene hora si no la tiene
        if ($desde && strpos($desde, ':') === false) {
            $desde = $desde . ' 00:00:00';
        }

        // Límite de seguridad para evitar respuestas enormes
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 1000;
        if ($limit <= 0) $limit = 1000;
        if ($limit > 5000) $limit = 5000;

        // Detalle por código
        if ($codigo) {
            $st = $pdo->prepare("SELECT * FROM reporte WHERE codigo = ?");
            $st->execute([$codigo]);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            $row ? respond($row) : respond(['error' => 'No encontrado'], 404);
        }

        // Listado con filtros
        $sql = "SELECT r.*, 
                COALESCE(r.ubicacion, s.ubicacion, 'exterior') as ubicacion
                FROM reporte r 
                INNER JOIN sensor s ON r.codigo_sensor = s.codigo
                INNER JOIN cuarto_frio c ON s.codigo_cuarto = c.codigo
                INNER JOIN finca f ON c.codigo_finca = f.codigo
                WHERE 1=1";
        $params = [];
        
        // AISLAMIENTO: Filtrar por empresa y finca del usuario
        if (!isSuperusuario()) {
            $fincaUsuario = getUserFinca();
            $empresaUsuario = getUserEmpresa();
            
            if ($fincaUsuario) {
                // Usuario de finca: solo ve datos de su finca
                $sql .= " AND f.codigo = ?";
                $params[] = $fincaUsuario;
            } elseif ($empresaUsuario) {
                // Usuario de empresa: ve datos de todas sus fincas
                $sql .= " AND f.codigo_empresa = ?";
                $params[] = $empresaUsuario;
            } else {
                // Sin empresa ni finca: no ve nada
                respond(['error' => 'Usuario sin asignación de empresa/finca'], 403);
            }
        }

        if ($codigoSensor) {
            $sql .= " AND r.codigo_sensor = ?";
            $params[] = $codigoSensor;
        }

        if ($codigoCuarto) {
            $sql .= " AND r.codigo_cuarto = ?";
            $params[] = $codigoCuarto;
        }

        if ($desde) {
            $sql .= " AND r.fecha_captura >= ?";
            $params[] = $desde;
        }

        if ($hasta) {
            $sql .= " AND r.fecha_captura < ?";
            $params[] = $hasta;
        }

        $sql .= " ORDER BY r.fecha_captura DESC, r.id DESC LIMIT {$limit}";

        $st = $pdo->prepare($sql);
        $st->execute($params);
        respond($st->fetchAll(PDO::FETCH_ASSOC));
    }

    // ---------- POST: crear reporte(s) ----------
    // Soporta array de reportes o un único reporte
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) $input = $_POST;

        // Detectar si es un array de reportes o un único reporte
        $reportes = (isset($input[0]) && is_array($input[0])) ? $input : [$input];

        if (empty($reportes)) {
            respond(['error' => 'No se proporcionaron reportes'], 400);
        }

        $resultados = [];
        $errores = [];
        $sql = "INSERT INTO reporte (
                    codigo, nombre, tipo_reporte,
                    activo, fecha_creacion,
                    report_id, fecha_captura, fecha,
                    voltaje, amperaje, aire, otro, puerta,
                    presion_s, presion_e, temperatura, humedad,
                    codigo_sensor, codigo_cuarto, ubicacion
                )
                VALUES (
                    :codigo, :nombre, :tipo_reporte,
                    :activo, NOW(),
                    :report_id, :fecha_captura, :fecha,
                    :voltaje, :amperaje, :aire, :otro, :puerta,
                    :presion_s, :presion_e, :temperatura, :humedad,
                    :codigo_sensor, :codigo_cuarto, :ubicacion
                )";

        $st = $pdo->prepare($sql);

        foreach ($reportes as $index => $d) {
            // Obtener información del sensor: codigo_cuarto y tipo
            $codigoSensor = $d['codigo_sensor'] ?? null;
            $codigoCuarto = null;
            $tipoReporte = null;
            
            if (!$codigoSensor) {
                $errores[] = [
                    'index' => $index,
                    'error' => 'codigo_sensor es requerido'
                ];
                continue;
            }

            // Buscar el codigo_cuarto y tipo desde el sensor
            $stSensor = $pdo->prepare("SELECT codigo_cuarto, tipo, ubicacion FROM sensor WHERE codigo = ?");
            $stSensor->execute([$codigoSensor]);
            $sensorData = $stSensor->fetch(PDO::FETCH_ASSOC);
            
            if (!$sensorData) {
                $errores[] = [
                    'index' => $index,
                    'codigo_sensor' => $codigoSensor,
                    'error' => 'Sensor no encontrado'
                ];
                continue;
            }

            $codigoCuarto = $sensorData['codigo_cuarto'];
            $tipoReporte = $sensorData['tipo'];
            $ubicacion = $sensorData['ubicacion'] ?? 'exterior';

            // Ejecutar insert
            try {
                $ok = $st->execute([
                    ':codigo'        => trim($d['codigo'] ?? ''),
                    ':nombre'        => $d['nombre'] ?? null,
                    ':tipo_reporte'  => $tipoReporte,
                    ':activo'        => isset($d['activo']) ? (int)$d['activo'] : 1,
                    ':report_id'     => $d['report_id'] ?? null,
                    ':fecha_captura' => $d['fecha_captura'] ?? null,
                    ':fecha'         => $d['fecha'] ?? null,
                    ':voltaje'       => isset($d['voltaje']) ? floatval($d['voltaje']) : null,
                    ':amperaje'      => isset($d['amperaje']) ? floatval($d['amperaje']) : null,
                    ':aire'          => isset($d['aire']) ? floatval($d['aire']) : null,
                    ':otro'          => isset($d['otro']) ? floatval($d['otro']) : null,
                    ':puerta'        => isset($d['puerta']) ? floatval($d['puerta']) : null,
                    ':presion_s'     => isset($d['presion_s']) ? floatval($d['presion_s']) : null,
                    ':presion_e'     => isset($d['presion_e']) ? floatval($d['presion_e']) : null,
                    ':temperatura'   => isset($d['temperatura']) ? floatval($d['temperatura']) : null,
                    ':humedad'       => isset($d['humedad']) ? floatval($d['humedad']) : null,
                    ':codigo_sensor' => $codigoSensor,
                    ':codigo_cuarto' => $codigoCuarto,
                    ':ubicacion'     => $ubicacion,
                ]);
            } catch (Exception $e) {
                $ok = false;
                $errorMsg = $e->getMessage();
            }
            
            // Si no hay excepción pero execute falló, obtener error de PDO
            if (!$ok && !isset($errorMsg)) {
                $errorInfo = $st->errorInfo();
                $errorMsg = isset($errorInfo[2]) ? $errorInfo[2] : 'Error desconocido en PDO';
            }

            if ($ok) {
                $resultados[] = [
                    'index' => $index,
                    'codigo_sensor' => $codigoSensor,
                    'success' => true,
                    'codigo' => $d['codigo'] ?? null
                ];
            } else {
                $errores[] = [
                    'index' => $index,
                    'codigo_sensor' => $codigoSensor,
                    'error' => 'Error al guardar el reporte',
                    'detalle' => isset($errorMsg) ? $errorMsg : 'Error desconocido',
                    'datos_enviados' => [
                        'codigo' => trim($d['codigo'] ?? ''),
                        'fecha_captura' => $d['fecha_captura'] ?? null,
                        'codigo_sensor' => $codigoSensor
                    ]
                ];
            }
        }

        // Responder con resumen
        respond([
            'success' => count($errores) === 0,
            'message' => count($resultados) . ' reporte(s) insertado(s) correctamente',
            'insertados' => count($resultados),
            'errores_cantidad' => count($errores),
            'resultados' => $resultados,
            'errores' => $errores
        ], count($errores) > 0 ? 207 : 201);
    }

    // ---------- PUT: actualizar reporte por código ----------
    if ($method === 'PUT') {
        parse_str(file_get_contents('php://input'), $p);
        $codigo = $p['codigo'] ?? null;
        if (!$codigo) respond(['error' => 'codigo requerido'], 422);

        $sql = "UPDATE reporte SET
                    nombre         = :nombre,
                    tipo_reporte   = :tipo_reporte,
                    activo         = :activo,
                    report_id      = :report_id,
                    fecha_captura  = :fecha_captura,
                    fecha          = :fecha,
                    voltaje        = :voltaje,
                    amperaje       = :amperaje,
                    aire           = :aire,
                    otro           = :otro,
                    puerta         = :puerta,
                    presion_s      = :presion_s,
                    presion_e      = :presion_e,
                    temperatura    = :temperatura,
                    humedad        = :humedad,
                    codigo_sensor  = :codigo_sensor,
                    codigo_cuarto  = :codigo_cuarto,
                    updated_at     = NOW()
                WHERE codigo = :codigo";

        $st = $pdo->prepare($sql);
        $ok = $st->execute([
            ':nombre'        => $p['nombre'] ?? null,
            ':tipo_reporte'  => $p['tipo_reporte'] ?? null,
            ':activo'        => isset($p['activo']) ? (int)$p['activo'] : 1,
            ':report_id'     => $p['report_id'] ?? null,
            ':fecha_captura' => $p['fecha_captura'] ?? null,
            ':fecha'         => $p['fecha'] ?? null,
            ':voltaje'       => $p['voltaje'] ?? null,
            ':amperaje'      => $p['amperaje'] ?? null,
            ':aire'          => $p['aire'] ?? null,
            ':otro'          => $p['otro'] ?? null,
            ':puerta'        => $p['puerta'] ?? null,
            ':presion_s'     => $p['presion_s'] ?? null,
            ':presion_e'     => $p['presion_e'] ?? null,
            ':temperatura'   => $p['temperatura'] ?? null,
            ':humedad'       => $p['humedad'] ?? null,
            ':codigo_sensor' => $p['codigo_sensor'] ?? null,
            ':codigo_cuarto' => $p['codigo_cuarto'] ?? null,
            ':codigo'        => $codigo,
        ]);

        $ok ? respond(['ok' => true])
            : respond(['error' => 'No se pudo actualizar'], 400);
    }

    // ---------- DELETE: eliminar por código ----------
    if ($method === 'DELETE') {
        $codigo = $_GET['codigo'] ?? null;
        if (!$codigo) respond(['error' => 'codigo requerido'], 422);

        $st = $pdo->prepare("DELETE FROM reporte WHERE codigo = ?");
        $ok = $st->execute([$codigo]);

        $ok ? respond(['ok' => true])
            : respond(['error' => 'No se pudo eliminar'], 400);
    }

    respond(['error' => 'Método no permitido'], 405);

} catch (Throwable $e) {
    respond(['error' => $e->getMessage()], 500);
}
