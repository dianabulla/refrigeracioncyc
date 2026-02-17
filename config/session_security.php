<?php
/**
 * config/session_security.php
 * 
 * Helpers para validar y garantizar aislamiento de datos
 * por empresa y finca en base a la sesión del usuario.
 * 
 * IMPORTANTE: Este archivo debe ser requerido en TODOS los
 * controllers y endpoints de API que accedan a datos sensibles.
 */

/**
 * Obtiene los datos de empresa y finca de la sesión actual
 * 
 * @return array|null Retorna ['codigo_empresa' => '...', 'codigo_finca' => '...'] 
 *                    o null si no hay sesión válida
 */
function getSessionContext(): ?array {
    if (empty($_SESSION['user'])) {
        return null;
    }

    $context = [
        'usuario_id' => $_SESSION['user']['id'] ?? null,
        'usuario_codigo' => $_SESSION['user']['codigo'] ?? null,
        'usuario_email' => $_SESSION['user']['email'] ?? null,
        'rol' => $_SESSION['user']['rol'] ?? null,
        'tipo' => $_SESSION['user']['tipo'] ?? 'usuario', // 'usuario' o 'superusuario'
        'codigo_empresa' => $_SESSION['user']['codigo_empresa'] ?? null,
        'codigo_finca' => $_SESSION['user']['codigo_finca'] ?? null,
    ];

    return $context;
}

/**
 * Obtiene solo el código de empresa de la sesión
 * Los superusuarios retornan null (pueden ver todas)
 * 
 * @return string|null
 */
function getSessionEmpresa(): ?string {
    $ctx = getSessionContext();
    
    if (!$ctx) {
        return null;
    }

    // IMPORTANTE: Los superusuarios pueden ver todas las empresas
    if ($ctx['tipo'] === 'superusuario') {
        return null; // null significa "todas las empresas"
    }

    return $ctx['codigo_empresa'];
}

/**
 * Obtiene solo el código de finca de la sesión
 * Los superusuarios retornan null (pueden ver todas)
 * 
 * @return string|null
 */
function getSessionFinca(): ?string {
    $ctx = getSessionContext();
    
    if (!$ctx) {
        return null;
    }

    // IMPORTANTE: Los superusuarios pueden ver todas las fincas
    if ($ctx['tipo'] === 'superusuario') {
        return null; // null significa "todas las fincas"
    }

    return $ctx['codigo_finca'];
}

/**
 * Valida que el usuario tenga permisos para acceder a una empresa específica
 * 
 * @param string $empresa Código de empresa a validar
 * @return bool
 */
function canAccessEmpresa(string $empresa): bool {
    $ctx = getSessionContext();
    
    if (!$ctx) {
        return false;
    }

    // Superusuarios: acceso total
    if ($ctx['tipo'] === 'superusuario') {
        return true;
    }

    // Usuario regular: solo su empresa asignada
    return $ctx['codigo_empresa'] === $empresa;
}

/**
 * Valida que el usuario tenga permisos para acceder a una finca específica
 * 
 * @param string $finca Código de finca a validar
 * @return bool
 */
function canAccessFinca(string $finca): bool {
    $ctx = getSessionContext();
    
    if (!$ctx) {
        return false;
    }

    // Superusuarios: acceso total
    if ($ctx['tipo'] === 'superusuario') {
        return true;
    }

    // Usuario regular: solo su finca asignada
    return $ctx['codigo_finca'] === $finca;
}

/**
 * Valida que el usuario tenga permisos para acceder a una empresa Y finca específicas
 * 
 * @param string $empresa
 * @param string $finca
 * @return bool
 */
function canAccessEmpresaFinca(string $empresa, string $finca): bool {
    return canAccessEmpresa($empresa) && canAccessFinca($finca);
}

/**
 * Agrega automáticamente los filtros de empresa y finca a una consulta SQL
 * Evita falta de memoria o consultas incompletas
 * 
 * IMPORTANTE: Usar esta función en TODOS los SELECTs
 * 
 * @param string $baseQuery Consulta SQL base (debe tener tabla principal aliaseada)
 * @param string $tableAlias Alias de la tabla principal (ej: 't', 'r', 's')
 * @param bool $filterEmpresa Si true, agrega filtro de empresa (default: true)
 * @param bool $filterFinca Si true, agrega filtro de finca (default: true)
 * 
 * @return array ['query' => string, 'params' => array]
 * 
 * Ejemplo de uso:
 *   $result = buildSecureQuery(
 *       "SELECT r.* FROM reporte r WHERE r.activo = 1",
 *       'r',
 *       true,
 *       true
 *   );
 *   $query = $result['query'];
 *   $params = $result['params'];
 *   $stmt = $pdo->prepare($query);
 *   $stmt->execute($params);
 */
function buildSecureQuery(
    string $baseQuery,
    string $tableAlias,
    bool $filterEmpresa = true,
    bool $filterFinca = true
): array {
    $ctx = getSessionContext();
    
    if (!$ctx) {
        return [
            'query' => $baseQuery,
            'params' => []
        ];
    }

    $params = [];
    $conditions = [];

    // Agregar filtro de empresa (salvo para superusuarios)
    if ($filterEmpresa && $ctx['tipo'] !== 'superusuario') {
        $conditions[] = "{$tableAlias}.codigo_empresa = :_session_empresa";
        $params[':_session_empresa'] = $ctx['codigo_empresa'];
    }

    // Agregar filtro de finca (salvo para superusuarios)
    if ($filterFinca && $ctx['tipo'] !== 'superusuario') {
        $conditions[] = "{$tableAlias}.codigo_finca = :_session_finca";
        $params[':_session_finca'] = $ctx['codigo_finca'];
    }

    // Si no hay condiciones, devolver query original
    if (empty($conditions)) {
        return [
            'query' => $baseQuery,
            'params' => []
        ];
    }

    // Agregar condiciones a la query
    $additionalCondition = ' AND ' . implode(' AND ', $conditions);
    
    // Detectar si ya existe WHERE en la query
    if (stripos($baseQuery, 'WHERE') === false) {
        $query = $baseQuery . ' WHERE ' . substr($additionalCondition, 5); // Quitar el ' AND '
    } else {
        $query = $baseQuery . $additionalCondition;
    }

    return [
        'query' => $query,
        'params' => $params
    ];
}

/**
 * Valida que un registro pertenezca al usuario autenticado
 * Útil antes de actualizar o eliminar
 * 
 * @param PDO $pdo Conexión a BD
 * @param string $tabla Nombre de la tabla
 * @param int $recordId ID del registro
 * 
 * @return bool true si el usuario puede acceder al registro
 */
function canAccessRecord(PDO $pdo, string $tabla, int $recordId): bool {
    $ctx = getSessionContext();
    
    if (!$ctx) {
        return false;
    }

    // Superusuarios: acceso total
    if ($ctx['tipo'] === 'superusuario') {
        return true;
    }

    // Construir consulta de validación
    $query = "SELECT id FROM `{$tabla}` WHERE id = :id AND codigo_empresa = :empresa AND codigo_finca = :finca LIMIT 1";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':id' => $recordId,
        ':empresa' => $ctx['codigo_empresa'],
        ':finca' => $ctx['codigo_finca']
    ]);

    return (bool)$stmt->fetch();
}

/**
 * Registra acceso/cambios en tabla de auditoría
 * 
 * @param PDO $pdo Conexión a BD
 * @param string $accion Tipo de acción (READ, CREATE, UPDATE, DELETE)
 * @param string $tabla Tabla afectada
 * @param int|null $registroId ID del registro (opcional)
 * @param array|null $valoresAnteriores Valores previos a cambio (opcional)
 * @param array|null $valoresNuevos Valores nuevos (opcional)
 */
function auditarAcceso(
    PDO $pdo,
    string $accion,
    string $tabla,
    ?int $registroId = null,
    ?array $valoresAnteriores = null,
    ?array $valoresNuevos = null
): void {
    $ctx = getSessionContext();
    
    if (!$ctx) {
        return; // No auditar si no hay sesión
    }

    try {
        // Solo auditar cambios importantes, no lecturas normales
        if (!in_array($accion, ['CREATE', 'UPDATE', 'DELETE'], true)) {
            return;
        }

        $query = "INSERT INTO auditoria_acceso 
                  (codigo_usuario, codigo_empresa, codigo_finca, accion, tabla_afectada, 
                   registro_id, valores_anteriores, valores_nuevos, ip_origen, fecha_hora)
                  VALUES 
                  (:usuario, :empresa, :finca, :accion, :tabla, 
                   :registro_id, :anteriores, :nuevos, :ip, NOW())";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':usuario' => $ctx['usuario_codigo'],
            ':empresa' => $ctx['codigo_empresa'],
            ':finca' => $ctx['codigo_finca'],
            ':accion' => $accion,
            ':tabla' => $tabla,
            ':registro_id' => $registroId,
            ':anteriores' => $valoresAnteriores ? json_encode($valoresAnteriores, JSON_UNESCAPED_UNICODE) : null,
            ':nuevos' => $valoresNuevos ? json_encode($valoresNuevos, JSON_UNESCAPED_UNICODE) : null,
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'
        ]);
    } catch (Throwable $e) {
        error_log("Error al auditar acceso: " . $e->getMessage());
        // No fallar la operación por error de auditoría
    }
}

/**
 * Valida que la sesión tenga empresa y finca válidas
 * Llama a esta función al inicio de cada controller/API
 * 
 * @return void Lanza excepción si falta contexto
 */
function requireSessionContext(): void {
    $ctx = getSessionContext();
    
    if (!$ctx || empty($ctx['codigo_empresa']) || empty($ctx['codigo_finca'])) {
        http_response_code(401);
        echo json_encode([
            'ok' => false,
            'error' => 'Sesión incompleta. Debe contener empresa y finca.'
        ]);
        exit;
    }
}

/**
 * Valida que el usuario tenga permisos para una empresa específica
 * Si no tiene, retorna error 403
 * 
 * @param string $empresa Código de empresa a validar
 * @return void
 */
function requireAccessEmpresa(string $empresa): void {
    if (!canAccessEmpresa($empresa)) {
        http_response_code(403);
        echo json_encode([
            'ok' => false,
            'error' => 'Acceso denegado a esta empresa.'
        ]);
        exit;
    }
}

/**
 * Valida que el usuario tenga permisos para una finca específica
 * Si no tiene, retorna error 403
 * 
 * @param string $finca Código de finca a validar
 * @return void
 */
function requireAccessFinca(string $finca): void {
    if (!canAccessFinca($finca)) {
        http_response_code(403);
        echo json_encode([
            'ok' => false,
            'error' => 'Acceso denegado a esta finca.'
        ]);
        exit;
    }
}

/**
 * Validación combinada: empresa y finca
 * 
 * @param string $empresa
 * @param string $finca
 * @return void
 */
function requireAccessEmpresaFinca(string $empresa, string $finca): void {
    requireAccessEmpresa($empresa);
    requireAccessFinca($finca);
}
