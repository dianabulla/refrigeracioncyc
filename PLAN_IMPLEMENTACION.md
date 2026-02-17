# Plan de Implementación: Aislamiento de Datos

## 📋 Resumen de Cambios Realizados

### ✅ Fase 1: Migraciones de Base de Datos

Se han creado dos archivos SQL de migración:

**1. `migrations/add_empresa_finca_isolation.sql`**
- Agrega columnas `codigo_empresa` y `codigo_finca` a todas las tablas operativas
- Crea constraints de foreign key correctos
- Crea tabla `auditoria_acceso` para registrar cambios

**Tablas modificadas:**
- usuario: +codigo_empresa
- cuarto_frio: +codigo_empresa
- sensor: +codigo_empresa, +codigo_finca
- reporte: +codigo_empresa, +codigo_finca
- componente: +codigo_empresa, +codigo_finca
- mantenimiento: +codigo_empresa, +codigo_finca

**2. `migrations/populate_empresa_finca_data.sql`**
- Puebla automáticamente los nuevos campos basándose en relaciones FK existentes
- Proporciona queries de verificación para encontrar registros no poblados

### ✅ Fase 2: Backend Security

**1. `config/session_security.php` (NUEVO)**
Contiene todas las funciones de validación y seguridad:

**Funciones principales:**
- `getSessionContext()` - Obtener contexto completo
- `getSessionEmpresa()` - Obtener empresa de sesión
- `getSessionFinca()` - Obtener finca de sesión
- `canAccessEmpresa()` - Validar acceso a empresa
- `canAccessFinca()` - Validar acceso a finca
- `canAccessEmpresaFinca()` - Validar acceso a ambas
- `buildSecureQuery()` - Agregar filtros automáticos a queries
- `canAccessRecord()` - Validar acceso a registro específico
- `auditarAcceso()` - Registrar cambios en auditoría
- `requireSessionContext()` - Validar sesión (lanza error si falla)
- `requireAccessEmpresa()` - Validar empresa (lanza error)
- `requireAccessFinca()` - Validar finca (lanza error)

**2. `controllers/logincontroller.php` (ACTUALIZADO)**
Ahora el login guarda en sesión:
```php
$_SESSION['user'] = [
    'id' => ...,
    'codigo' => ...,
    'nombre' => ...,
    'email' => ...,
    'tipo' => 'usuario' | 'superusuario',
    'rol' => ...,
    'codigo_empresa' => '...',  // NUEVO
    'codigo_finca' => '...',    // NUEVO
];
```

**Validación:**
- Usuario regular: debe tener empresa y finca
- Superusuario: tiene empresa/finca = null (acceso total)

### ✅ Fase 3: Documentación

**1. `AISLAMIENTO_DATOS.md` (NUEVO)**
Documentación completa con:
- Objetivos de seguridad
- Cambios en BD
- Ejemplos de implementación
- Patrones correctos e incorrectos
- Checklist de implementación
- Errores comunes
- Referencia rápida

**2. `api/_TEMPLATE_SECURE_API.php` (NUEVO)**
Template de endpoint seguro que muestra:
- Estructura correcta para GET (leer), POST (crear), PUT (actualizar), DELETE (eliminar)
- Validaciones de entrada
- Filtros de seguridad
- Auditoría
- Manejo de errores

---

## 🚀 Próximos Pasos: Implementación en Endpoints

### Paso 1: Ejecutar Migraciones SQL

```bash
# En orden:
1. Ejecutar: migrations/add_empresa_finca_isolation.sql
2. Ejecutar: migrations/populate_empresa_finca_data.sql
3. Verificar con queries de verificación al final
```

### Paso 2: Actualizar Cada Endpoint API

**Archivos a actualizar en `api/`:**
```
[ ] api/reporte.php
[ ] api/sensor.php
[ ] api/cuarto_frio.php
[ ] api/componente.php
[ ] api/mantenimiento.php
[ ] api/empresa.php (solo superusuario)
[ ] api/finca.php
[ ] api/usuario.php
[ ] api/rol.php (solo superusuario)
[ ] api/login.php
[ ] api/logout.php
```

**Para cada archivo:**
1. Copiar estructura de `api/_TEMPLATE_SECURE_API.php`
2. Agregar al inicio:
   ```php
   session_start();
   require_once __DIR__ . "/../config/db.php";
   require_once __DIR__ . "/../config/api_helpers.php";
   require_once __DIR__ . "/../config/auth.php";
   require_once __DIR__ . "/../config/session_security.php";
   
   requireAuth();
   requireSessionContext();
   $ctx = getSessionContext();
   ```
3. Envolver todos los SELECTs con filtros:
   ```php
   $secure = buildSecureQuery($baseQuery, 'alias', true, true);
   ```
4. Validar acceso antes de actualizar/eliminar:
   ```php
   if (!canAccessRecord($pdo, 'tabla', $recordId)) {
       respond(['ok' => false, 'error' => 'Acceso denegado'], 403);
   }
   ```
5. Registrar cambios:
   ```php
   auditarAcceso($pdo, 'UPDATE', 'tabla', $id, $anterior, $nuevo);
   ```

### Paso 3: Actualizar Controllers

**Archivos a revisar en `controllers/`:**
```
[ ] authcontroller.php
[ ] componentecontroller.php
[ ] cuartoFriocontroller.php
[ ] empresacontroller.php
[ ] fincacontroller.php
[ ] mantenimientocontroller.php
[ ] reportecontroller.php
[ ] rolcontroller.php
[ ] sensorcontroller.php
[ ] usuariocontroller.php
[ ] superusuariocontroller.php
```

**Para cada controller:**
1. Agregar al inicio:
   ```php
   require_once __DIR__ . "/../config/session_security.php";
   ```
2. En métodos que retornan datos:
   ```php
   $ctx = getSessionContext();
   requireSessionContext();
   
   // Agregar filtros en WHERE clauses
   ```

### Paso 4: Pruebas

**Crear usuarios de prueba:**
```
Usuario A: Empresa 1, Finca 1
Usuario B: Empresa 1, Finca 2
Usuario C: Empresa 2, Finca 3
Superusuario: Sin restricciones
```

**Casos de prueba:**
- [ ] Usuario A intenta acceder a datos de Usuario B → debe fallar
- [ ] Usuario A intenta acceder a datos de Usuario C → debe fallar
- [ ] Usuario A accede a sus propios datos → debe funcionar
- [ ] Superusuario accede a datos de cualquier usuario → debe funcionar
- [ ] Intentar manipular URLs para ver datos de otros → debe fallar
- [ ] Listar con paginación → solo datos propios

---

## 🔐 Estructura de Seguridad

```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND (NO CONFIAR)                                    │
│ - Validación visual                                      │
│ - No filtra datos reales                               │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP Request
                     ▼
┌─────────────────────────────────────────────────────────┐
│ BACKEND (FUENTE DE VERDAD)                               │
├─────────────────────────────────────────────────────────┤
│ 1. requireAuth()         → Validar sesión               │
│ 2. requireSessionContext()→ Validar empresa/finca       │
│ 3. canAccessRecord()     → Validar registro específico  │
│ 4. buildSecureQuery()    → Agregar filtros WHERE       │
│ 5. auditarAcceso()       → Registrar cambios           │
├─────────────────────────────────────────────────────────┤
│ Base de Datos:                                           │
│ - Constraints FK garantizan integridad                 │
│ - Índices en codigo_empresa y codigo_finca             │
│ - Tabla auditoria_acceso para compliance               │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Ejemplo: Flujo de Actualización de un Endpoint

### Antes (❌ INSEGURO):
```php
<?php
// api/reporte.php

if ($_GET['action'] === 'update') {
    $id = $_GET['id'];
    $stmt = $pdo->prepare("UPDATE reporte SET nombre = ? WHERE id = ?");
    $stmt->execute([$_POST['nombre'], $id]);
}
```

### Después (✅ SEGURO):
```php
<?php
// api/reporte.php

session_start();
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/session_security.php";

requireAuth();
requireSessionContext();

if ($_GET['action'] === 'update') {
    $id = (int)$_GET['id'];
    $ctx = getSessionContext();
    
    // Validar acceso
    if (!canAccessRecord($pdo, 'reporte', $id)) {
        respond(['ok' => false, 'error' => 'Acceso denegado'], 403);
    }
    
    // Obtener anterior para auditoría
    $stmt = $pdo->prepare("
        SELECT * FROM reporte 
        WHERE id = :id 
        AND codigo_empresa = :empresa 
        AND codigo_finca = :finca
    ");
    $stmt->execute([
        ':id' => $id,
        ':empresa' => $ctx['codigo_empresa'],
        ':finca' => $ctx['codigo_finca']
    ]);
    $anterior = $stmt->fetch();
    
    // Actualizar
    $stmt = $pdo->prepare("
        UPDATE reporte 
        SET nombre = :nombre, updated_at = NOW() 
        WHERE id = :id 
        AND codigo_empresa = :empresa 
        AND codigo_finca = :finca
    ");
    $stmt->execute([
        ':nombre' => $_POST['nombre'],
        ':id' => $id,
        ':empresa' => $ctx['codigo_empresa'],
        ':finca' => $ctx['codigo_finca']
    ]);
    
    // Auditar
    auditarAcceso($pdo, 'UPDATE', 'reporte', $id, $anterior, ['nombre' => $_POST['nombre']]);
    
    respond(['ok' => true, 'message' => 'Actualizado']);
}
```

---

## 🎯 Beneficios de Esta Implementación

✅ **Seguridad**
- Imposible acceder a datos de otra empresa/finca
- Auditoría completa de cambios
- Validación en backend (no en frontend)

✅ **Escalabilidad**
- Soporta múltiples empresas y fincas
- Cada usuario ve solo sus datos
- Superusuarios pueden administrar todo

✅ **Mantenibilidad**
- Funciones reutilizables en `session_security.php`
- Template para nuevos endpoints
- Código consistente en toda la aplicación

✅ **Compliance**
- Cumple con GDPR/normativas de privacidad
- Auditoría de accesos
- Trazabilidad de cambios

---

## ⚠️ Importante

**NO OLVIDAR:**
1. Ejecutar migraciones SQL en orden
2. Verificar que todos los registros tienen empresa/finca
3. Actualizar TODOS los endpoints (incluso uno olvidado = agujero de seguridad)
4. Testear con múltiples usuarios
5. Revisar código antiguo para variables no validadas

**REVISAR:**
- Todos los `$pdo->prepare()` en `api/` y `controllers/`
- Todos los `SELECT` que no tengan filtros WHERE
- Todos los `INSERT` que no guarden empresa/finca
- Todos los `UPDATE` y `DELETE` sin validación de acceso

