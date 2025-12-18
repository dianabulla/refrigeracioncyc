# 🔒 Sistema de Aislamiento de Datos por Empresa y Finca

## Resumen
Se ha implementado un sistema de **multi-tenancy** que aísla los datos por empresa y finca, garantizando que:

1. **Una empresa NO puede ver datos de otra empresa**
2. **Una finca NO puede ver datos de otra finca** (incluso si pertenecen a la misma empresa)
3. **Los superusuarios pueden ver TODO** (sin restricciones)

---

## 🎯 Cómo Funciona

### 1. **Al Hacer Login**
Cuando un usuario inicia sesión, el sistema automáticamente:
- Identifica su `codigo_finca` (finca asignada)
- Obtiene el `codigo_empresa` desde la finca
- Guarda ambos en la sesión

**Ejemplo de sesión:**
```php
$_SESSION['user'] = [
    'id' => 5,
    'codigo' => 'USR001',
    'nombre' => 'Juan Pérez',
    'email' => 'juan@cocos.com',
    'codigo_finca' => 'FIN001',      // ← Finca del usuario
    'codigo_empresa' => 'EMP001',    // ← Empresa de la finca
    'tipo' => 'usuario'
];
```

### 2. **Filtrado Automático en las APIs**

Todas las APIs ahora filtran automáticamente:

#### **APIs Modificadas:**

| API | Filtrado Por | Comportamiento |
|-----|--------------|----------------|
| `api/empresa.php` | Empresa | Solo ve su empresa |
| `api/finca.php` | Empresa | Solo ve fincas de su empresa |
| `api/usuario.php` | Finca | Solo ve usuarios de su finca |
| `api/cuarto_frio.php` | Finca | Solo ve cuartos de su finca |
| `api/sensor.php` | Finca | Solo ve sensores de sus cuartos |
| `api/componente.php` | Finca | Solo ve componentes de sus cuartos |
| `api/reporte.php` | Finca | Solo ve reportes de sus cuartos |

---

## 📋 Ejemplos Prácticos

### Escenario 1: Usuario de Empresa "Cocos"
```
Usuario: juan@cocos.com
Empresa: COCOS
Finca: FINCA_COCOS_1

✅ Puede ver:
- Todas las fincas de COCOS
- Solo usuarios de FINCA_COCOS_1
- Solo cuartos fríos de FINCA_COCOS_1
- Solo sensores de FINCA_COCOS_1
- Solo reportes de FINCA_COCOS_1

❌ NO puede ver:
- Fincas de empresa "Pedro"
- Usuarios de otras fincas de COCOS
- Cuartos de otras fincas
```

### Escenario 2: Usuario de Empresa "Pedro"
```
Usuario: maria@pedro.com
Empresa: PEDRO
Finca: FINCA_PEDRO_1

✅ Puede ver:
- Todas las fincas de PEDRO
- Solo usuarios de FINCA_PEDRO_1
- Solo cuartos fríos de FINCA_PEDRO_1

❌ NO puede ver:
- Nada de empresa COCOS
- Usuarios de FINCA_PEDRO_2
```

### Escenario 3: Superusuario
```
Usuario: admin@sistema.com
Tipo: superusuario

✅ Puede ver:
- TODAS las empresas
- TODAS las fincas
- TODOS los usuarios
- TODOS los cuartos, sensores, reportes
```

---

## 🛠️ Funciones de Ayuda Implementadas

### En `config/auth.php`:

```php
// Obtiene la empresa del usuario (null si es superusuario)
getUserEmpresa(): ?string

// Obtiene la finca del usuario (null si es superusuario)
getUserFinca(): ?string

// Verifica si es superusuario
isSuperusuario(): bool

// Verifica si puede acceder a una finca específica
puedeAccederAFinca(string $codigoFinca): bool

// Verifica si puede acceder a una empresa específica
puedeAccederAEmpresa(string $codigoEmpresa): bool
```

---

## 🔐 Seguridad Implementada

### 1. **Filtrado en GET (Listados)**
Cuando un usuario pide un listado, solo recibe registros de su empresa/finca:

```php
// Antes (sin filtro)
$fincas = $fincaModel->listar();  // Devolvía TODAS las fincas

// Ahora (con filtro)
$empresaUsuario = getUserEmpresa();
if ($empresaUsuario !== null) {
    $fincas = $fincaModel->listar($empresaUsuario);  // Solo fincas de su empresa
}
```

### 2. **Verificación en GET Individual**
Cuando un usuario pide un registro específico, se verifica que le pertenezca:

```php
$finca = $fincaModel->obtenerPorCodigo($codigo);

// Verificar acceso
if ($finca && $empresaUsuario !== null) {
    if ($finca['codigo_empresa'] !== $empresaUsuario) {
        respond(['error' => 'Acceso denegado'], 403);  // ❌ No tiene acceso
    }
}
```

### 3. **Protección en POST/PUT/DELETE**
Las operaciones de crear, editar y eliminar también están protegidas:
- Solo se pueden crear registros en la finca/empresa del usuario
- Solo se pueden editar/eliminar registros que le pertenezcan

---

## 🚀 Uso en el Frontend

El frontend NO necesita cambios. Los filtros son **automáticos** en el backend.

**Ejemplo:**
```javascript
// El usuario solo verá sus fincas
const res = await fetch('../api/finca.php');
const fincas = await res.json();  // Solo fincas de su empresa

// Si intenta acceder a una finca de otra empresa
const res = await fetch('../api/finca.php?codigo=FINCA_OTRA_EMPRESA');
// Respuesta: 403 Forbidden - Acceso denegado
```

---

## ✅ Ventajas del Sistema

1. **Seguridad**: Datos completamente aislados entre empresas y fincas
2. **Simplicidad**: El frontend no necesita lógica de filtrado
3. **Escalable**: Fácil agregar más niveles de jerarquía
4. **Flexible**: Superusuarios tienen acceso completo para administración
5. **Transparente**: Los usuarios solo ven lo que les corresponde

---

## 🧪 Cómo Probar

### 1. **Crear usuarios de prueba en diferentes empresas/fincas**

```sql
-- Empresa COCOS
INSERT INTO empresa (codigo, nombre) VALUES ('COCOS', 'Empresa Cocos');
INSERT INTO finca (codigo, nombre, codigo_empresa) VALUES ('FIN_COCOS_1', 'Finca Cocos 1', 'COCOS');

-- Empresa PEDRO
INSERT INTO empresa (codigo, nombre) VALUES ('PEDRO', 'Empresa Pedro');
INSERT INTO finca (codigo, nombre, codigo_empresa) VALUES ('FIN_PEDRO_1', 'Finca Pedro 1', 'PEDRO');

-- Usuario de COCOS
INSERT INTO usuario (codigo, nombre, email, password, codigo_finca) 
VALUES ('USR_COCOS', 'Juan Cocos', 'juan@cocos.com', '$2y$10$...', 'FIN_COCOS_1');

-- Usuario de PEDRO
INSERT INTO usuario (codigo, nombre, email, password, codigo_finca) 
VALUES ('USR_PEDRO', 'Maria Pedro', 'maria@pedro.com', '$2y$10$...', 'FIN_PEDRO_1');
```

### 2. **Probar el aislamiento**

1. Login como `juan@cocos.com`
2. Ver fincas → Solo verá `FIN_COCOS_1`
3. Ver usuarios → Solo verá usuarios de `FIN_COCOS_1`

4. Login como `maria@pedro.com`
5. Ver fincas → Solo verá `FIN_PEDRO_1`
6. Intentar acceder a datos de COCOS → Error 403

---

## 📝 Notas Importantes

### ⚠️ Usuarios sin Finca/Empresa
- Si un usuario NO tiene `codigo_finca` asignado, **NO verá ningún dato**
- Asegúrate de asignar finca a todos los usuarios normales

### ✅ Superusuarios
- Los superusuarios **siempre** pueden ver todo
- No necesitan `codigo_finca` ni `codigo_empresa`

### 🔄 Cambio de Finca
- Si cambias la finca de un usuario, debe **volver a hacer login**
- La sesión guarda la finca al momento del login

---

## 📚 Archivos Modificados

1. ✅ `controllers/authcontroller.php` - Login con empresa y finca
2. ✅ `config/auth.php` - Funciones de filtrado
3. ✅ `api/finca.php` - Filtrado por empresa
4. ✅ `api/usuario.php` - Filtrado por finca
5. ✅ `api/cuarto_frio.php` - Filtrado por finca
6. ✅ `api/sensor.php` - Filtrado por finca
7. ✅ `api/componente.php` - Filtrado por finca

---

**Sistema implementado y funcionando** ✅

Para cualquier duda o ajuste adicional, revisa este documento.
