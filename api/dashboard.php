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
        
        // Obtener sensores del cuarto
        $sqlSensores = "SELECT * FROM sensor WHERE codigo_cuarto = ? ORDER BY nombre";
        $stSensores = $pdo->prepare($sqlSensores);
        $stSensores->execute([$codCuarto]);
        $sensores = $stSensores->fetchAll(PDO::FETCH_ASSOC);
        
        $datosUltimas = [];
        $datosPromedios = [];
        
        foreach ($sensores as $sensor) {
            $codSensor = $sensor['codigo'];
            $tipoSensor = strtolower(trim($sensor['tipo'] ?? ''));

            // Mapear tipo de sensor al campo de valor en reporte
            $campoPorTipo = [
                'temperatura' => 'temperatura',
                'humedad'     => 'humedad',
                'voltaje'     => 'voltaje',
                'amperaje'    => 'amperaje',
                'presion_s'   => 'presion_s',
                'presion_e'   => 'presion_e',
                'aire'        => 'aire',
                'otro'        => 'otro',
                'puerta'      => 'puerta',
            ];

            if (!isset($campoPorTipo[$tipoSensor])) {
                // Si el tipo no es reconocido, saltar este sensor
                continue;
            }

            $campo = $campoPorTipo[$tipoSensor];

            // Última lectura del tipo específico
            $sqlUltima = "SELECT $campo AS valor, fecha_captura
                          FROM reporte 
                          WHERE codigo_sensor = ? AND tipo_reporte = ?
                          ORDER BY fecha_captura DESC 
                          LIMIT 1";
            $stUltima = $pdo->prepare($sqlUltima);
            $stUltima->execute([$codSensor, $tipoSensor]);
            $ultimaRow = $stUltima->fetch(PDO::FETCH_ASSOC) ?: ['valor' => null, 'fecha_captura' => null];

            // Promedio de los últimos 100 registros disponibles
            $sqlPromedioDia = "SELECT 
                                AVG(CAST($campo AS DECIMAL(10,2))) AS prom_dia
                            FROM (
                                SELECT $campo
                                FROM reporte 
                                WHERE codigo_sensor = ?
                                  AND $campo IS NOT NULL
                                ORDER BY fecha_captura DESC
                                LIMIT 100
                            ) AS ultimos";
            $stPromedioDia = $pdo->prepare($sqlPromedioDia);
            $stPromedioDia->execute([$codSensor]);
            $promDiaRow = $stPromedioDia->fetch(PDO::FETCH_ASSOC) ?: ['prom_dia' => null];

            $datosUltimas[$codSensor] = [
                'nombre'  => $sensor['nombre'],
                'codigo'  => $codSensor,
                'tipo'    => $tipoSensor,
                'campo'   => $campo,
                'ultima'  => $ultimaRow,
                'promedio'=> [
                    'prom_dia'   => $promDiaRow['prom_dia']
                ]
            ];
        }
        
        $resultado[] = [
            'codigo' => $codCuarto,
            'nombre' => $cuarto['nombre'],
            'descripcion' => $cuarto['descripcion'] ?? null,
            'codigo_finca' => $cuarto['codigo_finca'],
            'sensores' => $datosUltimas
        ];
    }
    
    respond(['ok' => true, 'data' => $resultado]);
    
} catch (Throwable $e) {
    error_log("Error en dashboard.php: " . $e->getMessage());
    respond(['ok' => false, 'error' => $e->getMessage()], 500);
}
