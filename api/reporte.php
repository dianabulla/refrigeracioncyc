<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/session_security.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Cualquier usuario autenticado puede ver reportes
requireAuth();

// SEGURIDAD: Validar que el usuario tenga empresa/finca asignada
$sessionContext = getSessionContext();
if (!$sessionContext) {
    respond(['error' => 'Sesión inválida'], 401);
}

$empresaUsuario = getUserEmpresa();
$fincaUsuario = getUserFinca();
if (!isSuperusuario() && !$empresaUsuario) {
    respond(['error' => 'Usuario sin empresa asignada'], 403);
}

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
        $codigoFinca  = $_GET['codigo_finca'] ?? null;
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
            $sql = "SELECT r.*
                    FROM reporte r
                    INNER JOIN sensor s ON r.codigo_sensor = s.codigo
                    INNER JOIN cuarto_frio c ON s.codigo_cuarto = c.codigo
                    INNER JOIN finca f ON c.codigo_finca = f.codigo
                    WHERE r.codigo = ?";
            $params = [$codigo];

            if (!isSuperusuario()) {
                if ($fincaUsuario) {
                    $sql .= " AND f.codigo = ?";
                    $params[] = $fincaUsuario;
                } elseif ($empresaUsuario) {
                    $sql .= " AND f.codigo_empresa = ?";
                    $params[] = $empresaUsuario;
                }
            }

            $st = $pdo->prepare($sql);
            $st->execute($params);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            
            // Verificar acceso para usuario no super
            if ($row && !isSuperusuario()) {
                $sqlCheck = "SELECT f.codigo_empresa, c.codigo_finca
                             FROM reporte r
                             INNER JOIN sensor s ON r.codigo_sensor = s.codigo
                             INNER JOIN cuarto_frio c ON s.codigo_cuarto = c.codigo
                             INNER JOIN finca f ON c.codigo_finca = f.codigo
                             WHERE r.codigo = ?";
                $stCheck = $pdo->prepare($sqlCheck);
                $stCheck->execute([$codigo]);
                $reporteData = $stCheck->fetch(PDO::FETCH_ASSOC);
                
                if ($reporteData) {
                    // Usuario de finca: solo su finca
                    if ($fincaUsuario && $reporteData['codigo_finca'] !== $fincaUsuario) {
                        respond(['error' => 'No encontrado'], 404);
                    }
                    // Usuario de empresa: solo su empresa
                    if (!$fincaUsuario && $reporteData['codigo_empresa'] !== $empresaUsuario) {
                        respond(['error' => 'No encontrado'], 404);
                    }
                }
            }
            
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
            if ($fincaUsuario) {
                // Usuario de finca: solo su finca
                $sql .= " AND f.codigo = ?";
                $params[] = $fincaUsuario;
            } elseif ($empresaUsuario) {
                // Usuario de empresa: todas sus fincas
                $sql .= " AND f.codigo_empresa = ?";
                $params[] = $empresaUsuario;
            }
        }

        if ($codigoSensor) {
            $sql .= " AND r.codigo_sensor = ?";
            $params[] = $codigoSensor;
        }

        if ($codigoFinca) {
            $sql .= " AND c.codigo_finca = ?";
            $params[] = $codigoFinca;
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
        $columns = $pdo->query("SHOW COLUMNS FROM reporte")->fetchAll(PDO::FETCH_COLUMN);
        $hasEmpresa = in_array('codigo_empresa', $columns, true);
        $hasFinca = in_array('codigo_finca', $columns, true);

        $insertColumns = [
            'codigo', 'nombre', 'tipo_reporte',
            'activo', 'fecha_creacion',
            'report_id', 'fecha_captura', 'fecha',
            'voltaje', 'amperaje', 'aire', 'otro', 'puerta',
            'presion_s', 'presion_e', 'temperatura', 'humedad',
            'codigo_sensor', 'codigo_cuarto', 'ubicacion'
        ];

        if ($hasEmpresa) {
            $insertColumns[] = 'codigo_empresa';
        }
        if ($hasFinca) {
            $insertColumns[] = 'codigo_finca';
        }

        $placeholders = array_map(function ($column) {
            return $column === 'fecha_creacion' ? 'NOW()' : ':' . $column;
        }, $insertColumns);

        $sql = "INSERT INTO reporte (" . implode(', ', $insertColumns) . ")
                VALUES (" . implode(', ', $placeholders) . ")";

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
            $stSensor = $pdo->prepare("SELECT s.codigo_cuarto, s.tipo, s.ubicacion, c.codigo_finca, f.codigo_empresa
                                       FROM sensor s
                                       INNER JOIN cuarto_frio c ON s.codigo_cuarto = c.codigo
                                       INNER JOIN finca f ON c.codigo_finca = f.codigo
                                       WHERE s.codigo = ?");
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
            $codigoEmpresa = $sensorData['codigo_empresa'] ?? null;
            $codigoFinca = $sensorData['codigo_finca'] ?? null;

            if (!isSuperusuario() && $codigoFinca !== $fincaUsuario) {
                $errores[] = [
                    'index' => $index,
                    'codigo_sensor' => $codigoSensor,
                    'error' => 'Sensor no pertenece a tu finca'
                ];
                continue;
            }

            // Ejecutar insert
            try {
                $params = [
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
                ];

                if ($hasEmpresa) {
                    $params[':codigo_empresa'] = $codigoEmpresa;
                }
                if ($hasFinca) {
                    $params[':codigo_finca'] = $codigoFinca;
                }

                $ok = $st->execute($params);
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

        $sql = "UPDATE reporte r
            INNER JOIN sensor s ON r.codigo_sensor = s.codigo
            INNER JOIN cuarto_frio c ON s.codigo_cuarto = c.codigo
            INNER JOIN finca f ON c.codigo_finca = f.codigo
            SET
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
                WHERE r.codigo = :codigo";

        if (!isSuperusuario()) {
            $sql .= " AND f.codigo = :codigo_finca";
        }

        $st = $pdo->prepare($sql);
        $params = [
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
        ];

        if (!isSuperusuario()) {
            $params[':codigo_finca'] = $fincaUsuario;
        }

        $ok = $st->execute($params);
        if (!$ok || $st->rowCount() === 0) {
            respond(['error' => 'No se pudo actualizar o no encontrado'], 404);
        }

        respond(['ok' => true]);
    }

    // ---------- DELETE: eliminar por código ----------
    if ($method === 'DELETE') {
        $codigo = $_GET['codigo'] ?? null;
        if (!$codigo) respond(['error' => 'codigo requerido'], 422);

        $sql = "DELETE r
            FROM reporte r
            INNER JOIN sensor s ON r.codigo_sensor = s.codigo
            INNER JOIN cuarto_frio c ON s.codigo_cuarto = c.codigo
            INNER JOIN finca f ON c.codigo_finca = f.codigo
            WHERE r.codigo = ?";
        $params = [$codigo];

        if (!isSuperusuario()) {
            $sql .= " AND f.codigo = ?";
            $params[] = $fincaUsuario;
        }

        $st = $pdo->prepare($sql);
        $ok = $st->execute($params);
        if (!$ok || $st->rowCount() === 0) {
            respond(['error' => 'No se pudo eliminar o no encontrado'], 404);
        }

        respond(['ok' => true]);
    }

    respond(['error' => 'Método no permitido'], 405);

} catch (Throwable $e) {
    respond(['error' => $e->getMessage()], 500);
}
