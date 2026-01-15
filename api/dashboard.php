<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

requireAuth();

$pdo = Database::connect();

function respond($data, int $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $userEmpresa = getUserEmpresa();
    $userFinca = getUserFinca();
    
    // Obtener todos los cuartos fríos del usuario
    $sql = "SELECT cf.* FROM cuarto_frio cf
            JOIN finca f ON cf.codigo_finca = f.codigo
            WHERE 1=1";
    $params = [];
    
    if ($userEmpresa) {
        $sql .= " AND f.codigo_empresa = ?";
        $params[] = $userEmpresa;
    }
    
    if ($userFinca) {
        $sql .= " AND cf.codigo_finca = ?";
        $params[] = $userFinca;
    }
    
    $sql .= " ORDER BY cf.nombre";
    
    $st = $pdo->prepare($sql);
    $st->execute($params);
    $cuartos = $st->fetchAll(PDO::FETCH_ASSOC);
    
    $resultado = [];
    
    foreach ($cuartos as $cuarto) {
        $codCuarto = $cuarto['codigo'];
        
        // Obtener sensores del cuarto con su ubicación
        $sqlSensores = "SELECT codigo, nombre, tipo, ubicacion FROM sensor WHERE codigo_cuarto = ? ORDER BY nombre";
        $stSensores = $pdo->prepare($sqlSensores);
        $stSensores->execute([$codCuarto]);
        $sensores = $stSensores->fetchAll(PDO::FETCH_ASSOC);
        
        // Agrupar por ubicación
        $datosPorUbicacion = [
            'exterior' => ['temperatura' => [], 'humedad' => [], 'otros' => []],
            'interior' => ['temperatura' => [], 'humedad' => [], 'otros' => []],
            'tuberia' => ['temperatura' => [], 'humedad' => [], 'otros' => []],
            'otro' => ['temperatura' => [], 'humedad' => [], 'otros' => []]
        ];
        
        $ultimaFechaLectura = null;
        
        foreach ($sensores as $sensor) {
            $codSensor = $sensor['codigo'];
            $tipoSensor = strtolower(trim($sensor['tipo'] ?? ''));
            $ubicacion = $sensor['ubicacion'] ?? 'exterior';
            
            error_log("Dashboard - Procesando sensor: {$codSensor}, tipo: {$tipoSensor}, ubicacion: {$ubicacion}");
            
            // Mapear tipos de sensores a nombres de columnas en la tabla reporte
            $mapeoColumnas = [
                'temperatura' => 'temperatura',
                'humedad' => 'humedad',
                'voltaje' => 'voltaje',
                'amperaje' => 'amperaje',
                'presión' => 'presion_s',
                'presion.s' => 'presion_s',
                'presion.e' => 'presion_e',
                'pueta' => 'puerta',  // Corrección de typo
                'puerta' => 'puerta',
                'aire' => 'aire',
                'otro' => 'otro'
            ];
            
            // Determinar qué campos leer según el tipo de sensor
            $campos = [];
            $tipoLower = strtolower($tipoSensor);
            
            if ($tipoLower === 'temperatura') {
                $campos = ['temperatura'];
            } elseif ($tipoLower === 'humedad') {
                $campos = ['humedad'];
            } elseif (in_array($tipoLower, ['temperatura_humedad', 'temperaturah_humedad'])) {
                $campos = ['temperatura', 'humedad'];
                error_log("Dashboard - Sensor {$codSensor} tipo TH detectado, campos: temperatura, humedad");
            } else {
                // Otros tipos de sensores - mapear al nombre de columna correcto
                $columna = $mapeoColumnas[$tipoLower] ?? null;
                if ($columna) {
                    $campos = [$columna];
                }
            }
            
            // Si no se encontró mapeo válido, saltar este sensor
            if (empty($campos)) {
                error_log("Dashboard - ADVERTENCIA: Sensor {$codSensor} tipo '{$tipoSensor}' no tiene campos válidos");
                continue;
            }
            
            foreach ($campos as $campo) {
                // Lectura actual (última lectura)
                $sqlUltima = "SELECT $campo AS valor, fecha_captura
                              FROM reporte 
                              WHERE codigo_sensor = ? AND $campo IS NOT NULL
                              ORDER BY fecha_captura DESC 
                              LIMIT 1";
                $stUltima = $pdo->prepare($sqlUltima);
                $stUltima->execute([$codSensor]);
                $ultimaRow = $stUltima->fetch(PDO::FETCH_ASSOC);
                
                if ($ultimaRow) {
                    // Actualizar última fecha de lectura global
                    if (!$ultimaFechaLectura || $ultimaRow['fecha_captura'] > $ultimaFechaLectura) {
                        $ultimaFechaLectura = $ultimaRow['fecha_captura'];
                    }
                    
                    // Promedio histórico (todos los reportes)
                    $sqlPromedio = "SELECT AVG(CAST($campo AS DECIMAL(10,2))) AS promedio
                                    FROM reporte 
                                    WHERE codigo_sensor = ? AND $campo IS NOT NULL";
                    $stPromedio = $pdo->prepare($sqlPromedio);
                    $stPromedio->execute([$codSensor]);
                    $promRow = $stPromedio->fetch(PDO::FETCH_ASSOC);
                    
                    // Agregar a la ubicación correspondiente
                    if ($campo === 'temperatura' || $campo === 'humedad') {
                        $datosPorUbicacion[$ubicacion][$campo][] = [
                            'valor_actual' => $ultimaRow['valor'],
                            'promedio' => $promRow['promedio'] ?? null,
                            'sensor_codigo' => $codSensor,
                            'sensor_nombre' => $sensor['nombre']
                        ];
                    } else {
                        // Guardar otros sensores para el desplegable
                        $datosPorUbicacion[$ubicacion]['otros'][] = [
                            'nombre' => $sensor['nombre'],
                            'codigo' => $codSensor,
                            'tipo' => $campo,
                            'valor_actual' => $ultimaRow['valor'],
                            'promedio' => $promRow['promedio'] ?? null
                        ];
                    }
                }
            }
        }
        
        // Calcular promedios por ubicación
        $resumenUbicaciones = [];
        foreach (['exterior', 'interior', 'tuberia', 'otro'] as $ubicacion) {
            $datos = $datosPorUbicacion[$ubicacion];
            
            // Calcular promedio de lecturas actuales de temperatura
            $tempActual = null;
            if (!empty($datos['temperatura'])) {
                $valores = array_column($datos['temperatura'], 'valor_actual');
                $tempActual = array_sum($valores) / count($valores);
            }
            
            // Calcular promedio histórico de temperatura
            $tempPromedio = null;
            if (!empty($datos['temperatura'])) {
                $promedios = array_filter(array_column($datos['temperatura'], 'promedio'), function($v) { return $v !== null; });
                if (!empty($promedios)) {
                    $tempPromedio = array_sum($promedios) / count($promedios);
                }
            }
            
            // Calcular promedio de lecturas actuales de humedad
            $humActual = null;
            if (!empty($datos['humedad'])) {
                $valores = array_column($datos['humedad'], 'valor_actual');
                $humActual = array_sum($valores) / count($valores);
            }
            
            // Calcular promedio histórico de humedad
            $humPromedio = null;
            if (!empty($datos['humedad'])) {
                $promedios = array_filter(array_column($datos['humedad'], 'promedio'), function($v) { return $v !== null; });
                if (!empty($promedios)) {
                    $humPromedio = array_sum($promedios) / count($promedios);
                }
            }
            
            $resumenUbicaciones[$ubicacion] = [
                'temperatura_actual' => $tempActual,
                'temperatura_promedio' => $tempPromedio,
                'humedad_actual' => $humActual,
                'humedad_promedio' => $humPromedio,
                'otros_sensores' => $datos['otros'],
                // Exponer sensores de temperatura/humedad para fallback del gráfico
                'sensores_th' => (function($d) {
                    $map = [];
                    foreach (['temperatura','humedad'] as $k) {
                        if (!empty($d[$k])) {
                            foreach ($d[$k] as $row) {
                                $code = $row['sensor_codigo'] ?? null;
                                if ($code && !isset($map[$code])) {
                                    $map[$code] = [
                                        'codigo' => $code,
                                        'nombre' => $row['sensor_nombre'] ?? $code
                                    ];
                                }
                            }
                        }
                    }
                    return array_values($map);
                })($datos)
            ];
        }
        
        $resultado[] = [
            'codigo' => $codCuarto,
            'nombre' => $cuarto['nombre'],
            'descripcion' => $cuarto['descripcion'] ?? null,
            'codigo_finca' => $cuarto['codigo_finca'],
            'ultima_lectura' => $ultimaFechaLectura,
            'ubicaciones' => $resumenUbicaciones
        ];
    }
    
    respond(['ok' => true, 'data' => $resultado]);
    
} catch (Throwable $e) {
    error_log("Error en dashboard.php: " . $e->getMessage());
    respond(['ok' => false, 'error' => $e->getMessage()], 500);
}

