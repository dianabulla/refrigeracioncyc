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

        // Detalle por código
        if ($codigo) {
            $st = $pdo->prepare("SELECT * FROM reporte WHERE codigo = ?");
            $st->execute([$codigo]);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            $row ? respond($row) : respond(['error' => 'No encontrado'], 404);
        }

        // Listado con filtros
        $sql = "SELECT * FROM reporte WHERE 1=1";
        $params = [];

        if ($codigoSensor) {
            $sql .= " AND codigo_sensor = ?";
            $params[] = $codigoSensor;
        }

        if ($codigoCuarto) {
            $sql .= " AND codigo_cuarto = ?";
            $params[] = $codigoCuarto;
        }

        if ($desde) {
            $sql .= " AND fecha_captura >= ?";
            $params[] = $desde;
        }

        if ($hasta) {
            $sql .= " AND fecha_captura <= ?";
            $params[] = $hasta;
        }

        $sql .= " ORDER BY fecha_captura DESC, id DESC";

        $st = $pdo->prepare($sql);
        $st->execute($params);
        respond($st->fetchAll(PDO::FETCH_ASSOC));
    }

    // ---------- POST: crear reporte ----------
    // Normalmente lo usarán tus dispositivos/servicios, no la web
    if ($method === 'POST') {
        $d = json_decode(file_get_contents('php://input'), true);
        if (!is_array($d)) $d = $_POST;

        $sql = "INSERT INTO reporte (
                    codigo, nombre, tipo_reporte,
                    activo, fecha_creacion,
                    report_id, fecha_captura, fecha,
                    voltaje, amperaje, aire, otro, puerta,
                    presion_s, presion_e, temperatura, humedad,
                    codigo_sensor, codigo_cuarto
                )
                VALUES (
                    :codigo, :nombre, :tipo_reporte,
                    :activo, NOW(),
                    :report_id, :fecha_captura, :fecha,
                    :voltaje, :amperaje, :aire, :otro, :puerta,
                    :presion_s, :presion_e, :temperatura, :humedad,
                    :codigo_sensor, :codigo_cuarto
                )";

        $st = $pdo->prepare($sql);
        $ok = $st->execute([
            ':codigo'        => trim($d['codigo'] ?? ''),
            ':nombre'        => $d['nombre'] ?? null,
            ':tipo_reporte'  => $d['tipo_reporte'] ?? null,
            ':activo'        => isset($d['activo']) ? (int)$d['activo'] : 1,
            ':report_id'     => $d['report_id'] ?? null,
            ':fecha_captura' => $d['fecha_captura'] ?? null,
            ':fecha'         => $d['fecha'] ?? null,
            ':voltaje'       => $d['voltaje'] ?? null,
            ':amperaje'      => $d['amperaje'] ?? null,
            ':aire'          => $d['aire'] ?? null,
            ':otro'          => $d['otro'] ?? null,
            ':puerta'        => $d['puerta'] ?? null,
            ':presion_s'     => $d['presion_s'] ?? null,
            ':presion_e'     => $d['presion_e'] ?? null,
            ':temperatura'   => $d['temperatura'] ?? null,
            ':humedad'       => $d['humedad'] ?? null,
            ':codigo_sensor' => $d['codigo_sensor'] ?? null,
            ':codigo_cuarto' => $d['codigo_cuarto'] ?? null,
        ]);

        $ok ? respond(['ok' => true], 201)
            : respond(['error' => 'No se pudo crear'], 400);
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
