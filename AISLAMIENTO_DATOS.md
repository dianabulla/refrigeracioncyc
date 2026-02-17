# Aislamiento de Datos por Empresa y Finca

## Objetivos
- ✅ Ninguna empresa puede ver datos de otra empresa
- ✅ Ninguna finca puede ver datos de otra finca
- ✅ Todo el control de acceso en backend (nunca frontend)
- ✅ Todos los usuarios deben pertenecer a una empresa y finca

---

## Cambios en Base de Datos

### Migraciones SQL a Ejecutar
1. `migrations/add_empresa_finca_isolation.sql` - Agregar columnas y constraints
2. `migrations/populate_empresa_finca_data.sql` - Poblar datos existentes

### Cambios por Tabla

#### Tablas Modificadas:
- **usuario**: Agregar `codigo_empresa` (obligatorio)
- **cuarto_frio**: Agregar `codigo_empresa` (obligatorio)
- **sensor**: Agregar `codigo_empresa` y `codigo_finca` (obligatorios)
- **reporte**: Agregar `codigo_empresa` y `codigo_finca` (obligatorios)
- **componente**: Agregar `codigo_empresa` y `codigo_finca` (obligatorios)
- **mantenimiento**: Agregar `codigo_empresa` y `codigo_finca` (obligatorios)

#### Nueva Tabla:
- **auditoria_acceso**: Registra todos los cambios sensibles

---

## Cambios en Backend

### 1. Session Management
**Archivo**: `controllers/logincontroller.php`

El login ahora guarda en sesión:
```php
$_SESSION['user'] = [
    'id'              => ...,
    'codigo'          => ...,
    'nombre'          => ...,
    'email'           => ...,
    'tipo'            => 'usuario' | 'superusuario',
    'rol'             => ...,
    'codigo_empresa'  => '...',  // NUEVO - null para superusuarios
    'codigo_finca'    => '...',  // NUEVO - null para superusuarios
];
```

### 2. Helpers de Seguridad
**Archivo**: `config/session_security.php`

Funciones disponibles:

```php
// Obtener contexto completo
$ctx = getSessionContext();  
// Retorna: ['usuario_id' => ..., 'codigo_empresa' => ..., 'codigo_finca' => ..., 'tipo' => ...]

// Obtener solo empresa/finca
$empresa = getSessionEmpresa();  // null para superusuarios
$finca = getSessionFinca();      // null para superusuarios

// Validar acceso
canAccessEmpresa($empresa);           // true/false
canAccessFinca($finca);               // true/false
canAccessEmpresaFinca($empresa, $finca);  // true/false

// Agregar filtros automáticos
$result = buildSecureQuery(
    "SELECT r.* FROM reporte r WHERE r.activo = 1",
    'r',              // alias de tabla
    true,             // filtrar por empresa
    true              // filtrar por finca
);
$query = $result['query'];
$params = $result['params'];

// Validar registro pertenece a usuario
canAccessRecord($pdo, 'reporte', $recordId);  // true/false

// Registrar cambios en auditoría
auditarAcceso($pdo, 'UPDATE', 'reporte', $registroId, $anterior, $nuevo);

// Helpers de validación (lanzan error si falla)
requireSessionContext();              // Verifica que hay sesión completa
requireAccessEmpresa($empresa);       // Verifica acceso a empresa
requireAccessFinca($finca);           // Verifica acceso a finca
requireAccessEmpresaFinca($e, $f);   // Ambas validaciones
```

---

## Patrón de Implementación en APIs

### ❌ MAL - Sin aislamiento
```php
// ❌ NUNCA hacer esto
$stmt = $pdo->prepare("SELECT * FROM reporte WHERE id = ?");
$stmt->execute([$_GET['id']]);
```

### ✅ BIEN - Con aislamiento
```php
<?php
// api/reporte.php

session_start();
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/session_security.php";

// 1. Validar sesión
requireAuth();
requireSessionContext();

// 2. Validar acceso al registro
$recordId = (int)($_GET['id'] ?? 0);
if (!canAccessRecord($pdo, 'reporte', $recordId)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Acceso denegado']);
    exit;
}

// 3. Consulta con filtros automáticos
$ctx = getSessionContext();
$query = "SELECT * FROM reporte WHERE id = :id AND codigo_empresa = :empresa AND codigo_finca = :finca";
$stmt = $pdo->prepare($query);
$stmt->execute([
    ':id' => $recordId,
    ':empresa' => $ctx['codigo_empresa'],
    ':finca' => $ctx['codigo_finca']
]);
$reporte = $stmt->fetch();

if (!$reporte) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Reporte no encontrado']);
    exit;
}

echo json_encode(['ok' => true, 'data' => $reporte]);
```

### Ejemplo Avanzado - Listar con Paginación
```php
<?php
session_start();
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/session_security.php";

requireAuth();
requireSessionContext();

// Parámetros
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = min(100, (int)($_GET['limit'] ?? 20));  // Max 100 registros
$offset = ($page - 1) * $limit;

$ctx = getSessionContext();

// Construcción segura de query
$baseQuery = "SELECT r.* FROM reporte r WHERE r.activo = 1";
$secure = buildSecureQuery($baseQuery, 'r', true, true);

$query = $secure['query'] . " ORDER BY r.fecha_creacion DESC LIMIT :limit OFFSET :offset";
$params = array_merge($secure['params'], [
    ':limit' => $limit,
    ':offset' => $offset
]);

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$reportes = $stmt->fetchAll();

// Contar totales
$countQuery = "SELECT COUNT(*) as total FROM reporte r WHERE r.activo = 1";
$countSecure = buildSecureQuery($countQuery, 'r', true, true);
$stmt = $pdo->prepare($countSecure['query']);
$stmt->execute($countSecure['params']);
$total = $stmt->fetch()['total'] ?? 0;

echo json_encode([
    'ok' => true,
    'data' => $reportes,
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'pages' => ceil($total / $limit)
    ]
]);
```

---

## Checklist de Implementación

### Phase 1: Database
- [ ] Ejecutar `add_empresa_finca_isolation.sql`
- [ ] Ejecutar `populate_empresa_finca_data.sql`
- [ ] Verificar que no haya registros NULL en codigo_empresa/codigo_finca

### Phase 2: Backend Security
- [ ] ✅ Crear `config/session_security.php`
- [ ] ✅ Actualizar `controllers/logincontroller.php`
- [ ] [ ] Actualizar TODOS los endpoints API en `api/`
- [ ] [ ] Actualizar TODOS los controllers en `controllers/`
- [ ] [ ] Agregar `require_once __DIR__ . "/../config/session_security.php"` en cada API

### Phase 3: API Endpoints to Update
Cada uno de estos debe implementar filtros:
- [ ] `api/reporte.php`
- [ ] `api/sensor.php`
- [ ] `api/cuarto_frio.php`
- [ ] `api/componente.php`
- [ ] `api/mantenimiento.php`
- [ ] `api/empresa.php` (solo superusuario)
- [ ] `api/finca.php`
- [ ] `api/usuario.php`
- [ ] `api/rol.php` (solo superusuario)

### Phase 4: Testing
- [ ] [ ] Crear usuario de prueba en Empresa A, Finca 1
- [ ] [ ] Crear usuario de prueba en Empresa A, Finca 2
- [ ] [ ] Crear usuario de prueba en Empresa B, Finca 3
- [ ] [ ] Verificar que Usuario1 NO puede ver datos de Usuario2 (diferentes fincas)
- [ ] [ ] Verificar que Usuario2 NO puede ver datos de Usuario3 (diferentes empresas)
- [ ] [ ] Verificar que Superusuario PUEDE ver todos los datos
- [ ] [ ] Pruebas de manipulación de URLs (ej: cambiar IDs en URLs)

### Phase 5: Frontend Security
- [ ] ✅ El frontend NO debe hacer filtros (backend es fuente de verdad)
- [ ] ✅ El frontend NO debe mostrar datos sin validación backend
- [ ] Agregar validación de sesión en vistas principales
- [ ] Mostrar contexto (empresa/finca) en header/navbar

---

## Ejemplo de Validación en Vista

```html
<!-- views/admin.html -->
<?php
session_start();
require_once __DIR__ . "/../config/session_security.php";

requireAuth();
requireSessionContext();

$ctx = getSessionContext();
?>

<div class="navbar">
    <span>Usuario: <?php echo htmlspecialchars($ctx['usuario_email']); ?></span>
    <span>Empresa: <?php echo htmlspecialchars($ctx['codigo_empresa']); ?></span>
    <span>Finca: <?php echo htmlspecialchars($ctx['codigo_finca']); ?></span>
</div>
```

---

## Seguridad Adicional

### 1. Validación de Entrada
```php
// Siempre sanitizar y validar
$empresa = preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['empresa'] ?? '');
$finca = preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['finca'] ?? '');

requireAccessEmpresa($empresa);
requireAccessFinca($finca);
```

### 2. Rate Limiting
Implementar rate limiting en endpoints críticos para prevenir fuerza bruta:
```php
// Pseudocódigo - implementar según necesidad
if (checkRateLimit($ctx['usuario_id'], 'api_call')) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Demasiadas solicitudes']);
    exit;
}
```

### 3. Auditoría
Todos los cambios se registran en `auditoria_acceso`:
```php
// Registrar después de actualizar
auditarAcceso($pdo, 'UPDATE', 'reporte', $reporteId, $valorAnterior, $valorNuevo);
```

---

## Errores Comunes a Evitar

❌ **NO hacer**:
```php
// ❌ Confiar en frontend para filtros
// ❌ Usar $_GET o $_POST para empresa/finca sin validar
// ❌ Olvidar filtros en WHERE clauses
// ❌ Compartir conexiones PDO sin validar contexto
// ❌ Permitir que usuarios cambien su propia empresa/finca
```

✅ **HACER**:
```php
// ✅ Siempre validar en backend
// ✅ Usar $ctx = getSessionContext() para empresa/finca
// ✅ Usar buildSecureQuery() para todas las queries
// ✅ Validar canAccessRecord() antes de actualizar/eliminar
// ✅ Registrar cambios en auditoría_acceso
// ✅ Testear con múltiples usuarios de diferentes empresas/fincas
```

---

## Referencia Rápida

| Función | Propósito |
|---------|-----------|
| `getSessionContext()` | Obtener datos completos de sesión |
| `getSessionEmpresa()` | Obtener empresa de sesión |
| `getSessionFinca()` | Obtener finca de sesión |
| `canAccessEmpresa()` | Validar permiso a empresa |
| `canAccessFinca()` | Validar permiso a finca |
| `canAccessRecord()` | Validar acceso a registro específico |
| `buildSecureQuery()` | Agregar filtros automáticos a query |
| `auditarAcceso()` | Registrar cambios |
| `requireSessionContext()` | Validar sesión (lanza error si falla) |
| `requireAccessEmpresa()` | Validar acceso a empresa (lanza error si falla) |
| `requireAccessFinca()` | Validar acceso a finca (lanza error si falla) |

