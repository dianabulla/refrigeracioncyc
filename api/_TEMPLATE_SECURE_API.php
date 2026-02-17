<?php
/**
 * TEMPLATE DE API CON AISLAMIENTO
 * 
 * Este archivo es una PLANTILLA para mostrar cómo actualizar
 * TODOS los endpoints en api/ para implementar filtros de empresa y finca.
 * 
 * Copiar este patrón a todos los archivos en api/
 * (reporte.php, sensor.php, cuarto_frio.php, etc.)
 */

session_start();
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/api_helpers.php";
require_once __DIR__ . "/../config/auth.php";
require_once __DIR__ . "/../config/session_security.php";

// ============================================================
// VALIDACIONES INICIALES
// ============================================================

// 1. Validar método HTTP
$method = strtoupper($_SERVER['REQUEST_METHOD']);
validateMethod('GET', $method);  // o POST, PUT, DELETE, etc.

// 2. Validar autenticación
requireAuth();

// 3. Validar contexto de sesión
requireSessionContext();

// ============================================================
// OBTENER CONTEXTO Y DATOS
// ============================================================

$ctx = getSessionContext();
$data = getRequestData();

// ============================================================
// EJEMPLO 1: LEER UN REGISTRO (GET /api/reporte?id=1)
// ============================================================

if ($method === 'GET') {
    $recordId = (int)($_GET['id'] ?? 0);
    
    if ($recordId <= 0) {
        respond(['ok' => false, 'error' => 'ID requerido'], 400);
    }

    try {
        // Validar que el registro pertenece al usuario
        if (!canAccessRecord($pdo, 'reporte', $recordId)) {
            respond(['ok' => false, 'error' => 'Acceso denegado a este registro'], 403);
        }

        // Construir query con filtros automáticos
        $query = "SELECT * FROM reporte WHERE id = :id AND codigo_empresa = :empresa AND codigo_finca = :finca";
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':id' => $recordId,
            ':empresa' => $ctx['codigo_empresa'],
            ':finca' => $ctx['codigo_finca']
        ]);

        $record = $stmt->fetch();
        
        if (!$record) {
            respond(['ok' => false, 'error' => 'Registro no encontrado'], 404);
        }

        respond(['ok' => true, 'data' => $record]);

    } catch (Throwable $e) {
        handleError($e, 'GET /api/reporte');
    }
}

// ============================================================
// EJEMPLO 2: LISTAR REGISTROS CON PAGINACIÓN
// (GET /api/reporte?page=1&limit=20&filtro=valor)
// ============================================================

if ($method === 'GET' && isset($_GET['action']) && $_GET['action'] === 'list') {
    try {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, (int)($_GET['limit'] ?? 20));  // Máximo 100
        $offset = ($page - 1) * $limit;

        // Construir query base con condiciones opcionales
        $conditions = ['r.activo = 1'];
        $params = [];

        // Agregar filtros opcionales (SIEMPRE sanitizados)
        if (!empty($_GET['tipo'])) {
            $conditions[] = 'r.tipo_reporte = :tipo';
            $params[':tipo'] = $_GET['tipo'];
        }

        if (!empty($_GET['fecha_desde'])) {
            $conditions[] = 'DATE(r.fecha_creacion) >= :fecha_desde';
            $params[':fecha_desde'] = $_GET['fecha_desde'];
        }

        $whereClause = implode(' AND ', $conditions);
        $baseQuery = "SELECT r.* FROM reporte r WHERE {$whereClause}";

        // Aplicar filtros de seguridad
        $secure = buildSecureQuery($baseQuery, 'r', true, true);
        $query = $secure['query'] . " ORDER BY r.fecha_creacion DESC LIMIT :limit OFFSET :offset";
        $params = array_merge($params, $secure['params'], [
            ':limit' => $limit,
            ':offset' => $offset
        ]);

        // Ejecutar query de datos
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $records = $stmt->fetchAll();

        // Contar total
        $countQuery = "SELECT COUNT(*) as total FROM reporte r WHERE {$whereClause}";
        $countSecure = buildSecureQuery($countQuery, 'r', true, true);
        $countParams = array_merge($params, $secure['params']);
        unset($countParams[':limit']);
        unset($countParams[':offset']);
        
        $stmt = $pdo->prepare($countSecure['query']);
        $stmt->execute($countParams);
        $total = $stmt->fetch()['total'] ?? 0;

        respond([
            'ok' => true,
            'data' => $records,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'pages' => ceil($total / $limit)
            ]
        ]);

    } catch (Throwable $e) {
        handleError($e, 'LIST /api/reporte');
    }
}

// ============================================================
// EJEMPLO 3: CREAR REGISTRO (POST /api/reporte)
// ============================================================

if ($method === 'POST' && (!isset($_GET['action']) || $_GET['action'] === 'create')) {
    try {
        // Validar campos requeridos
        validateRequired($data, ['codigo', 'nombre', 'codigo_sensor']);

        // Sanitizar entrada
        $codigo = trim($data['codigo']);
        $nombre = trim($data['nombre']);
        $codigoSensor = trim($data['codigo_sensor']);

        // Validar que el sensor pertenece a la empresa/finca del usuario
        $stmt = $pdo->prepare("
            SELECT id FROM sensor 
            WHERE codigo = :codigo 
            AND codigo_empresa = :empresa 
            AND codigo_finca = :finca 
            LIMIT 1
        ");
        $stmt->execute([
            ':codigo' => $codigoSensor,
            ':empresa' => $ctx['codigo_empresa'],
            ':finca' => $ctx['codigo_finca']
        ]);

        if (!$stmt->fetch()) {
            respond(['ok' => false, 'error' => 'Sensor no válido o no pertenece a tu empresa/finca'], 400);
        }

        // Insertar registro
        $stmt = $pdo->prepare("
            INSERT INTO reporte (
                codigo, nombre, codigo_sensor, 
                codigo_empresa, codigo_finca,
                fecha_creacion, activo
            ) VALUES (
                :codigo, :nombre, :codigo_sensor,
                :empresa, :finca,
                NOW(), 1
            )
        ");

        $stmt->execute([
            ':codigo' => $codigo,
            ':nombre' => $nombre,
            ':codigo_sensor' => $codigoSensor,
            ':empresa' => $ctx['codigo_empresa'],
            ':finca' => $ctx['codigo_finca']
        ]);

        $newId = $pdo->lastInsertId();

        // Registrar en auditoría
        auditarAcceso($pdo, 'CREATE', 'reporte', (int)$newId, null, $data);

        respond([
            'ok' => true,
            'message' => 'Registro creado exitosamente',
            'id' => $newId
        ], 201);

    } catch (Throwable $e) {
        handleError($e, 'CREATE /api/reporte');
    }
}

// ============================================================
// EJEMPLO 4: ACTUALIZAR REGISTRO (PUT /api/reporte?id=1)
// ============================================================

if ($method === 'PUT') {
    try {
        $recordId = (int)($_GET['id'] ?? 0);
        
        if ($recordId <= 0) {
            respond(['ok' => false, 'error' => 'ID requerido'], 400);
        }

        // CRÍTICO: Validar que el registro pertenece al usuario
        if (!canAccessRecord($pdo, 'reporte', $recordId)) {
            respond(['ok' => false, 'error' => 'Acceso denegado a este registro'], 403);
        }

        // Obtener valores anteriores para auditoría
        $stmt = $pdo->prepare("
            SELECT * FROM reporte 
            WHERE id = :id 
            AND codigo_empresa = :empresa 
            AND codigo_finca = :finca
            LIMIT 1
        ");
        $stmt->execute([
            ':id' => $recordId,
            ':empresa' => $ctx['codigo_empresa'],
            ':finca' => $ctx['codigo_finca']
        ]);
        $anterior = $stmt->fetch();

        if (!$anterior) {
            respond(['ok' => false, 'error' => 'Registro no encontrado'], 404);
        }

        // Construir UPDATE dinámico (solo campos permitidos)
        $updateFields = [];
        $updateParams = [':id' => $recordId];
        $camposPermitidos = ['nombre', 'tipo_reporte', 'temperatura', 'humedad'];

        foreach ($camposPermitidos as $campo) {
            if (isset($data[$campo])) {
                $updateFields[] = "{$campo} = :{$campo}";
                $updateParams[":{$campo}"] = $data[$campo];
            }
        }

        if (empty($updateFields)) {
            respond(['ok' => false, 'error' => 'No hay campos para actualizar'], 400);
        }

        // Agregar timestamp de actualización
        $updateFields[] = 'updated_at = NOW()';

        $updateQuery = "UPDATE reporte SET " . implode(', ', $updateFields) . " WHERE id = :id";
        
        $stmt = $pdo->prepare($updateQuery);
        $stmt->execute($updateParams);

        // Registrar en auditoría
        auditarAcceso($pdo, 'UPDATE', 'reporte', $recordId, $anterior, $data);

        respond([
            'ok' => true,
            'message' => 'Registro actualizado exitosamente'
        ]);

    } catch (Throwable $e) {
        handleError($e, 'UPDATE /api/reporte');
    }
}

// ============================================================
// EJEMPLO 5: ELIMINAR REGISTRO (DELETE /api/reporte?id=1)
// ============================================================

if ($method === 'DELETE') {
    try {
        $recordId = (int)($_GET['id'] ?? 0);
        
        if ($recordId <= 0) {
            respond(['ok' => false, 'error' => 'ID requerido'], 400);
        }

        // CRÍTICO: Validar que el registro pertenece al usuario
        if (!canAccessRecord($pdo, 'reporte', $recordId)) {
            respond(['ok' => false, 'error' => 'Acceso denegado a este registro'], 403);
        }

        // Obtener registro antes de eliminar (para auditoría)
        $stmt = $pdo->prepare("
            SELECT * FROM reporte 
            WHERE id = :id 
            AND codigo_empresa = :empresa 
            AND codigo_finca = :finca
            LIMIT 1
        ");
        $stmt->execute([
            ':id' => $recordId,
            ':empresa' => $ctx['codigo_empresa'],
            ':finca' => $ctx['codigo_finca']
        ]);
        $registro = $stmt->fetch();

        if (!$registro) {
            respond(['ok' => false, 'error' => 'Registro no encontrado'], 404);
        }

        // Eliminar (mejor: soft delete con activo = 0)
        $stmt = $pdo->prepare("
            UPDATE reporte 
            SET activo = 0, updated_at = NOW() 
            WHERE id = :id 
            AND codigo_empresa = :empresa 
            AND codigo_finca = :finca
        ");
        $stmt->execute([
            ':id' => $recordId,
            ':empresa' => $ctx['codigo_empresa'],
            ':finca' => $ctx['codigo_finca']
        ]);

        // Registrar en auditoría
        auditarAcceso($pdo, 'DELETE', 'reporte', $recordId, $registro, null);

        respond([
            'ok' => true,
            'message' => 'Registro eliminado exitosamente'
        ]);

    } catch (Throwable $e) {
        handleError($e, 'DELETE /api/reporte');
    }
}

// Si llegamos aquí, método no implementado
respond(['ok' => false, 'error' => 'Método no implementado'], 405);
