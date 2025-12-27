<?php
// config/auth.php
// -------------------------------------------------------------
// Middleware de autenticación y control de acceso por rol
// Compatible con usuarios comunes y con el superusuario global.
// -------------------------------------------------------------

// NOTE: Iniciamos sesión si no existe
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Verifica que exista una sesión activa.
 * Si se especifica un rol, valida que el usuario cumpla el rol requerido.
 * 
 * @param string|null $requiredRole  (opcional) Rol necesario para acceder
 * 
 * Ejemplo de uso en una API:
 *   requireAuth();                  // solo requiere sesión activa
 *   requireAuth('administrador');   // requiere rol específico
 *   requireAuth('superusuario');    // solo superusuario
 */
function requireAuth($requiredRole = null) {
    // Si no hay sesión iniciada
    if (empty($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Acceso denegado. No hay sesión activa.']);
        exit;
    }

    // Obtenemos los datos del usuario logueado
    $rolActual   = $_SESSION['user']['rol'] ?? null;     // para usuarios comunes
    $tipoUsuario = $_SESSION['user']['tipo'] ?? null;    // 'superusuario' o 'usuario'

    // SECURITY: doble control para el superusuario
    if ($tipoUsuario === 'superusuario') {
        return; // el superusuario siempre tiene acceso total
    }

    // Si se exige un rol específico
    if ($requiredRole !== null) {
        if ($rolActual !== $requiredRole) {
            http_response_code(403);
            echo json_encode(['ok' => false, 'error' => 'Acceso restringido. Rol insuficiente.']);
            exit;
        }
    }

    // Si llega aquí, el usuario está autenticado y cumple con el rol (si aplica)
}

/**
 * Devuelve el usuario autenticado actual (si hay sesión activa)
 * 
 * @return array|null
 */
function getAuthenticatedUser(): ?array {
    return $_SESSION['user'] ?? null;
}

/**
 * Cierra la sesión del usuario actual y elimina todos los datos
 */
function logoutUser(): void {
    // SECURITY: limpiar variables de sesión antes de destruirla
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
}

/**
 * Obtiene el código de empresa del usuario autenticado
 * Los superusuarios pueden ver todas las empresas (devuelve null)
 * 
 * @return string|null Código de empresa o null si es superusuario
 */
function getUserEmpresa(): ?string {
    $user = getAuthenticatedUser();
    if (!$user) return null;
    
    // Superusuarios no tienen restricción de empresa
    if (($user['tipo'] ?? null) === 'superusuario') {
        return null;
    }
    
    return $user['codigo_empresa'] ?? null;
}

/**
 * Obtiene el código de finca del usuario autenticado
 * Los superusuarios pueden ver todas las fincas (devuelve null)
 * 
 * @return string|null Código de finca o null si es superusuario
 */
function getUserFinca(): ?string {
    $user = getAuthenticatedUser();
    if (!$user) return null;
    
    // Superusuarios no tienen restricción de finca
    if (($user['tipo'] ?? null) === 'superusuario') {
        return null;
    }
    
    return $user['codigo_finca'] ?? null;
}

/**
 * Verifica si el usuario actual es superusuario
 * 
 * @return bool
 */
function isSuperusuario(): bool {
    $user = getAuthenticatedUser();
    return ($user['tipo'] ?? null) === 'superusuario';
}

/**
 * Verifica si el usuario puede acceder a un recurso de una finca específica
 * 
 * @param string $codigoFinca Código de la finca a verificar
 * @return bool True si tiene acceso, false si no
 */
function puedeAccederAFinca(string $codigoFinca): bool {
    // Superusuarios pueden acceder a todo
    if (isSuperusuario()) {
        return true;
    }
    
    $fincaUsuario = getUserFinca();
    
    // Si el usuario tiene finca asignada, solo puede acceder a esa finca
    if ($fincaUsuario !== null) {
        return $codigoFinca === $fincaUsuario;
    }
    
    // Si no tiene finca asignada, no puede acceder
    return false;
}

/**
 * Verifica si el usuario puede acceder a un recurso de una empresa específica
 * 
 * @param string $codigoEmpresa Código de la empresa a verificar
 * @return bool True si tiene acceso, false si no
 */
function puedeAccederAEmpresa(string $codigoEmpresa): bool {
    // Superusuarios pueden acceder a todo
    if (isSuperusuario()) {
        return true;
    }
    
    $empresaUsuario = getUserEmpresa();
    
    // Si el usuario tiene empresa asignada, solo puede acceder a esa empresa
    if ($empresaUsuario !== null) {
        return $codigoEmpresa === $empresaUsuario;
    }
    
    // Si no tiene empresa asignada, no puede acceder
    return false;
}

/**
 * Obtiene los permisos del rol del usuario actual
 * 
 * @return array Permisos del usuario
 */
function getUserPermisos(): array {
    $user = getAuthenticatedUser();
    if (!$user) return [];
    
    // Superusuarios tienen todos los permisos
    if (($user['tipo'] ?? null) === 'superusuario') {
        return [
            'ver_usuarios' => true,
            'crear_usuarios' => true,
            'editar_usuarios' => true,
            'eliminar_usuarios' => true,
            'ver_fincas' => true,
            'crear_fincas' => true,
            'editar_fincas' => true,
            'eliminar_fincas' => true,
            'ver_cuartos' => true,
            'crear_cuartos' => true,
            'editar_cuartos' => true,
            'eliminar_cuartos' => true,
            'ver_sensores' => true,
            'crear_sensores' => true,
            'editar_sensores' => true,
            'eliminar_sensores' => true,
            'ver_componentes' => true,
            'crear_componentes' => true,
            'editar_componentes' => true,
            'eliminar_componentes' => true,
            'ver_reportes' => true,
            'exportar_reportes' => true,
            'ver_mantenimientos' => true,
            'crear_mantenimientos' => true,
            'editar_mantenimientos' => true,
            'eliminar_mantenimientos' => true
        ];
    }
    
    // Obtener permisos del rol del usuario
    $codigoRol = $user['codigo_rol'] ?? null;
    if (!$codigoRol) return [];
    
    try {
        require_once __DIR__ . '/db.php';
        $pdo = Database::connect();
        $stmt = $pdo->prepare("SELECT permisos FROM rol WHERE codigo = ?");
        $stmt->execute([$codigoRol]);
        $rol = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($rol && !empty($rol['permisos'])) {
            $permisos = json_decode($rol['permisos'], true);
            return is_array($permisos) ? $permisos : [];
        }
    } catch (Throwable $e) {
        error_log("Error obteniendo permisos: " . $e->getMessage());
    }
    
    return [];
}

/**
 * Verifica si el usuario tiene un permiso específico
 * 
 * @param string $permiso Nombre del permiso a verificar (ej: 'crear_usuarios')
 * @return bool True si tiene el permiso, false si no
 */
function tienePermiso(string $permiso): bool {
    $permisos = getUserPermisos();
    return $permisos[$permiso] ?? false;
}

/**
 * Requiere que el usuario tenga un permiso específico
 * Si no lo tiene, devuelve error 403
 * 
 * @param string $permiso Nombre del permiso requerido
 */
function requirePermiso(string $permiso): void {
    if (!tienePermiso($permiso)) {
        http_response_code(403);
        echo json_encode([
            'ok' => false, 
            'error' => 'No tiene permisos para realizar esta acción',
            'permiso_requerido' => $permiso
        ]);
        exit;
    }
}
/**
 * Verifica que el usuario tenga acceso a una empresa específica
 * Los superusuarios siempre tienen acceso
 * 
 * @param string $codigoEmpresa Código de empresa a verificar
 * @return bool True si tiene acceso, false si no
 */
function tieneAccesoEmpresa(string $codigoEmpresa): bool {
    $user = getAuthenticatedUser();
    if (!$user) return false;
    
    // Superusuarios siempre tienen acceso
    if (($user['tipo'] ?? null) === 'superusuario') {
        return true;
    }
    
    // Usuarios normales solo ven su empresa
    return ($user['codigo_empresa'] ?? null) === $codigoEmpresa;
}

/**
 * Verifica que el usuario tenga acceso a una finca específica
 * Los superusuarios siempre tienen acceso
 * 
 * @param string $codigoFinca Código de finca a verificar
 * @return bool True si tiene acceso, false si no
 */
function tieneAccesoFinca(string $codigoFinca): bool {
    $user = getAuthenticatedUser();
    if (!$user) return false;
    
    // Superusuarios siempre tienen acceso
    if (($user['tipo'] ?? null) === 'superusuario') {
        return true;
    }
    
    // Si el usuario tiene asignada una finca específica, solo ve esa
    $fincaUsuario = $user['codigo_finca'] ?? null;
    if ($fincaUsuario) {
        return $fincaUsuario === $codigoFinca;
    }
    
    // Si no tiene finca asignada, tiene acceso a todas sus fincas (de su empresa)
    return true;
}

/**
 * Requiere acceso a una empresa específica
 * Si no tiene acceso, devuelve error 403
 * 
 * @param string $codigoEmpresa Código de empresa requerida
 */
function requireAccesoEmpresa(string $codigoEmpresa): void {
    if (!tieneAccesoEmpresa($codigoEmpresa)) {
        http_response_code(403);
        echo json_encode([
            'ok' => false,
            'error' => 'Acceso denegado a esta empresa',
            'empresa_solicitada' => $codigoEmpresa
        ]);
        exit;
    }
}

/**
 * Requiere acceso a una finca específica
 * Si no tiene acceso, devuelve error 403
 * 
 * @param string $codigoFinca Código de finca requerida
 */
function requireAccesoFinca(string $codigoFinca): void {
    if (!tieneAccesoFinca($codigoFinca)) {
        http_response_code(403);
        echo json_encode([
            'ok' => false,
            'error' => 'Acceso denegado a esta finca',
            'finca_solicitada' => $codigoFinca
        ]);
        exit;
    }
}