# 🔐 Implementación de Aislamiento de Datos - GUÍA RÁPIDA

## ¿Qué Se Ha Hecho?

Se ha implementado un sistema completo de **aislamiento de datos por empresa y finca** para garantizar seguridad total en el acceso a información.

### ✅ Completado

1. **Migraciones SQL** - Bases de datos preparadas
2. **Helpers de Seguridad** - Funciones reutilizables
3. **Login Mejorado** - Guarda empresa y finca en sesión
4. **Documentación Completa** - Guías y templates
5. **Tabla de Auditoría** - Registro de todos los cambios

---

## 🚀 Pasos a Seguir

### PASO 1: Ejecutar Migraciones SQL ⚠️ **IMPORTANTE**

```sql
-- En tu cliente MySQL/phpMyAdmin, ejecuta EN ORDEN:

1. migrations/add_empresa_finca_isolation.sql (Agrega columnas NULL)
   ↓
2. migrations/populate_empresa_finca_data.sql (Llena datos)
   ↓
3. Verifica con queries que NO hay NULL (ver PASO 8)
   ↓
4. migrations/add_empresa_finca_constraints.sql (Convierte a NOT NULL + FKs)
```

**Verificación rápida:**
```sql
-- Después del PASO 2:
SELECT COUNT(*) FROM usuario WHERE codigo_empresa IS NULL;  
-- Debe retornar: 0 registros

-- Si retorna > 0, NO ejecutar PASO 3
```

### PASO 2: Actualizar Archivo de API (Ejemplo: reporte.php)

**Opción A: Usar como Template**

Abre `api/_TEMPLATE_SECURE_API.php` y sigue la estructura.

**Opción B: Actualizar Existente**

Si ya existe `api/reporte.php`, agregar al inicio:

```php
<?php
session_start();
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/session_security.php";

requireAuth();
requireSessionContext();
$ctx = getSessionContext();
```

Y en TODOS los SELECTs:

```php
// ANTES: ❌
$stmt = $pdo->prepare("SELECT * FROM reporte WHERE id = ?");

// DESPUÉS: ✅
$stmt = $pdo->prepare("
    SELECT * FROM reporte 
    WHERE id = ? 
    AND codigo_empresa = ? 
    AND codigo_finca = ?
");
$stmt->execute([$id, $ctx['codigo_empresa'], $ctx['codigo_finca']]);
```

### PASO 3: Testear

```bash
# Crear 3 usuarios de prueba
- Usuario A: Empresa A, Finca 1
- Usuario B: Empresa A, Finca 2  
- Usuario C: Empresa B, Finca 3

# Test 1: Usuario A intenta ver datos de Usuario B
# Esperado: ERROR ❌ (acceso denegado)

# Test 2: Usuario A accede a sus propios datos
# Esperado: ÉXITO ✅

# Test 3: Superusuario accede a todo
# Esperado: ÉXITO ✅
```

---

## 📁 Archivos Creados/Modificados

### 📄 NUEVOS:

| Archivo | Propósito |
|---------|-----------|
| `config/session_security.php` | Funciones de validación y seguridad |
| `migrations/add_empresa_finca_isolation.sql` | Agrega columnas a BD |
| `migrations/populate_empresa_finca_data.sql` | Puebla datos nuevos |
| `migrations/audit_and_validation_queries.sql` | Scripts de auditoría |
| `api/_TEMPLATE_SECURE_API.php` | Template para endpoints seguros |
| `AISLAMIENTO_DATOS.md` | Documentación completa |
| `PLAN_IMPLEMENTACION.md` | Plan detallado |
| `README_SECURITY.md` | Este archivo |

### 🔄 ACTUALIZADOS:

| Archivo | Cambios |
|---------|---------|
| `controllers/logincontroller.php` | Ahora guarda empresa/finca en sesión |

---

## 🎯 Checklist de Implementación

```
ANTES DE PRODUCCIÓN:

BD:
  ☐ Ejecutar add_empresa_finca_isolation.sql
  ☐ Ejecutar populate_empresa_finca_data.sql
  ☐ Verificar: 0 registros NULL en codigo_empresa/finca

Login:
  ☐ Probar login con usuario regular
  ☐ Verificar que $_SESSION contiene empresa y finca
  ☐ Probar logout

API - Lectura (GET):
  ☐ api/reporte.php → incluir filtros
  ☐ api/sensor.php → incluir filtros
  ☐ api/cuarto_frio.php → incluir filtros
  ☐ api/componente.php → incluir filtros
  ☐ api/mantenimiento.php → incluir filtros
  ☐ api/usuario.php → incluir filtros

API - Escritura (POST/PUT/DELETE):
  ☐ Validar canAccessRecord()
  ☐ Guardar empresa/finca en INSERT
  ☐ Registrar en auditoria_acceso

Seguridad:
  ☐ Prueba: Usuario A no puede ver datos de Usuario B
  ☐ Prueba: Superusuario puede ver todo
  ☐ Prueba: Cambiar URL ?id=123 no abre datos de otros

Auditoría:
  ☐ Ejecutar queries de validación
  ☐ Revisar tabla auditoria_acceso
  ☐ Configurar retention de logs
```

---

## 💡 Funciones Principales

```php
// Obtener datos
$ctx = getSessionContext();           // Contexto completo
$empresa = getSessionEmpresa();       // Solo empresa
$finca = getSessionFinca();           // Solo finca

// Validar acceso
canAccessEmpresa($empresa);           // true/false
canAccessFinca($finca);               // true/false
canAccessRecord($pdo, 'tabla', $id);  // true/false

// Construir queries seguras
$result = buildSecureQuery($sql, 'alias', true, true);
$query = $result['query'];
$params = $result['params'];

// Registrar cambios
auditarAcceso($pdo, 'UPDATE', 'tabla', $id, $anterior, $nuevo);

// Validar (lanza error si falla)
requireSessionContext();              // Verifica sesión
requireAccessEmpresa($empresa);       // Verifica empresa
requireAccessFinca($finca);           // Verifica finca
```

---

## ⚠️ Errores Comunes

### ❌ NO HACER:

```php
// Confiar en frontend para filtros
if ($_GET['empresa'] == 'A') { ... }  // ❌ El usuario puede cambiar

// Olvidar filtros en WHERE
SELECT * FROM reporte WHERE id = ?    // ❌ Ve datos de otros

// Usar SQL injection vulnerable
WHERE id = " . $_GET['id']            // ❌ Inseguro

// Permitir que usuario cambie su empresa
UPDATE usuario SET codigo_empresa = ?  // ❌ El usuario podría cambiar a otra
```

### ✅ HACER:

```php
// Obtener empresa de sesión
$empresa = getSessionEmpresa();       // ✅ Del servidor, no del usuario

// Agregar filtros en WHERE
WHERE id = ? AND codigo_empresa = ?   // ✅ Filtro de seguridad

// Usar prepared statements
$stmt->execute([':id' => $id])        // ✅ Previene SQL injection

// Validar antes de actualizar
if (!canAccessRecord(...)) { ... }    // ✅ Previene manipulación
```

---

## 🔍 Validar Implementación

### Test 1: Lectura Cruzada
```php
// Loguear como Usuario A (Empresa 1, Finca 1)
// Acceder a: api/reporte.php?id=999 (que pertenece a Usuario B)
// Esperado: 403 Acceso denegado ✅
```

### Test 2: Listar Datos
```php
// Loguear como Usuario A
// Acceder a: api/reporte.php?action=list
// Esperado: Solo reportes de Empresa 1, Finca 1 ✅
```

### Test 3: Crear Registro
```php
// POST a: api/reporte.php
// Body: {nombre: "test", codigo_sensor: "..."}
// Esperado: Se guarda con codigo_empresa y codigo_finca del usuario ✅
```

---

## 📊 Estructura Implementada

```
refrigeracioncyc/
├── config/
│   ├── session_security.php          ← NUEVO: Funciones de seguridad
│   ├── auth.php                      (existente)
│   ├── db.php                        (existente)
│   └── api_helpers.php               (existente)
├── controllers/
│   ├── logincontroller.php           ← ACTUALIZADO
│   └── ... (otros)
├── api/
│   ├── _TEMPLATE_SECURE_API.php      ← NUEVO: Template
│   ├── reporte.php                   ← A ACTUALIZAR
│   ├── sensor.php                    ← A ACTUALIZAR
│   ├── ... (otros)
├── migrations/
│   ├── add_empresa_finca_isolation.sql
│   ├── populate_empresa_finca_data.sql
│   └── audit_and_validation_queries.sql
├── AISLAMIENTO_DATOS.md              ← NUEVO: Documentación
├── PLAN_IMPLEMENTACION.md            ← NUEVO: Plan detallado
└── README_SECURITY.md                ← Este archivo
```

---

## 🆘 Soporte Rápido

**Pregunta:** ¿Dónde guardo empresa/finca en sesión?
**Respuesta:** En `logincontroller.php` ya está. Al login, se guarda:
```php
$_SESSION['user']['codigo_empresa'] = ...
$_SESSION['user']['codigo_finca'] = ...
```

**Pregunta:** ¿Cómo agrego filtros a una query?
**Respuesta:** Usa `buildSecureQuery()`:
```php
$result = buildSecureQuery("SELECT * FROM reporte WHERE activo=1", 'r', true, true);
$stmt = $pdo->prepare($result['query']);
$stmt->execute($result['params']);
```

**Pregunta:** ¿Qué pasa si un usuario intenta acceder a datos de otro?
**Respuesta:** La función `canAccessRecord()` retorna false, se lanza error 403 Forbidden.

**Pregunta:** ¿Los superusuarios ven todo?
**Respuesta:** Sí, porque `getSessionEmpresa()` y `getSessionFinca()` retornan null para ellos (null = sin filtrar).

---

## 📚 Documentación Completa

- **`AISLAMIENTO_DATOS.md`** - Guía técnica completa
- **`PLAN_IMPLEMENTACION.md`** - Plan paso a paso
- **`api/_TEMPLATE_SECURE_API.php`** - Ejemplo de endpoint seguro
- **`migrations/audit_and_validation_queries.sql`** - Scripts de validación

---

## ✨ Siguiente Paso

1. Ejecuta las migraciones SQL
2. Prueba login y verifica que $_SESSION tiene empresa/finca
3. Actualiza cada endpoint siguiendo el template
4. Ejecuta tests de seguridad
5. ¡Listo!

---

**¿Preguntas?** Revisar archivos de documentación o ejecutar tests de validación en `migrations/audit_and_validation_queries.sql`
