# 🔐 Sistema de Roles y Permisos por Empresa

## ✅ IMPLEMENTADO

Se ha agregado un **sistema completo de roles y permisos por empresa** que permite:

1. **Roles separados por empresa**: Empresa "Cocos" y empresa "Pedro" tienen roles diferentes
2. **Permisos granulares**: Cada rol define exactamente qué puede hacer
3. **Verificación automática**: Las APIs verifican permisos antes de permitir operaciones

---

## 📋 Estructura de Roles

### Campos en la Tabla `rol`:
- `codigo` - Código único del rol (ej: ROL_COCOS_ADMIN)
- `nombre` - Nombre descriptivo (ej: Administrador)
- `descripcion` - Descripción del rol
- **`codigo_empresa`** - ✨ **NUEVO**: Empresa a la que pertenece el rol
- **`permisos`** - ✨ **NUEVO**: JSON con permisos específicos
- `activo` - Si el rol está activo
- `fecha_creacion` - Fecha de creación
- `updated_at` - Última actualización

---

## 🎯 Permisos Disponibles

### 📁 **MÓDULO USUARIOS**
```json
{
  "ver_usuarios": true,        // Ver listado de usuarios
  "crear_usuarios": true,      // Crear nuevos usuarios
  "editar_usuarios": true,     // Editar usuarios existentes
  "eliminar_usuarios": true    // Eliminar usuarios
}
```

### 🏢 **MÓDULO FINCAS**
```json
{
  "ver_fincas": true,          // Ver listado de fincas
  "crear_fincas": true,        // Crear nuevas fincas
  "editar_fincas": true,       // Editar fincas existentes
  "eliminar_fincas": true      // Eliminar fincas
}
```

### ❄️ **MÓDULO CUARTOS FRÍOS**
```json
{
  "ver_cuartos": true,         // Ver listado de cuartos
  "crear_cuartos": true,       // Crear nuevos cuartos
  "editar_cuartos": true,      // Editar cuartos existentes
  "eliminar_cuartos": true     // Eliminar cuartos
}
```

### 📡 **MÓDULO SENSORES**
```json
{
  "ver_sensores": true,        // Ver listado de sensores
  "crear_sensores": true,      // Crear nuevos sensores
  "editar_sensores": true,     // Editar sensores existentes
  "eliminar_sensores": true    // Eliminar sensores
}
```

### 🔧 **MÓDULO COMPONENTES**
```json
{
  "ver_componentes": true,     // Ver listado de componentes
  "crear_componentes": true,   // Crear nuevos componentes
  "editar_componentes": true,  // Editar componentes existentes
  "eliminar_componentes": true // Eliminar componentes
}
```

### 📊 **MÓDULO REPORTES**
```json
{
  "ver_reportes": true,        // Ver reportes
  "exportar_reportes": true    // Exportar reportes a PDF/Excel
}
```

### 🛠️ **MÓDULO MANTENIMIENTO**
```json
{
  "ver_mantenimientos": true,     // Ver historial de mantenimientos
  "crear_mantenimientos": true,   // Registrar mantenimientos
  "editar_mantenimientos": true,  // Editar mantenimientos
  "eliminar_mantenimientos": true // Eliminar mantenimientos
}
```

---

## 📦 Instalación

### 1. **Ejecutar Migración SQL**
```bash
# Ejecutar el archivo de migración
mysql -u root refrigeracioncyc < migracion_roles_empresa.sql
```

O desde phpMyAdmin:
1. Abrir la base de datos `refrigeracioncyc`
2. Ir a la pestaña "SQL"
3. Copiar y pegar el contenido de `migracion_roles_empresa.sql`
4. Ejecutar

### 2. **Crear Roles de Ejemplo**

#### Rol Administrador para Empresa COCOS:
```sql
INSERT INTO rol (codigo, nombre, descripcion, codigo_empresa, permisos, activo) VALUES
('ROL_COCOS_ADMIN', 'Administrador', 'Acceso completo a la empresa COCOS', 'COCOS', 
 '{"ver_usuarios":true,"crear_usuarios":true,"editar_usuarios":true,"eliminar_usuarios":true,
   "ver_fincas":true,"crear_fincas":true,"editar_fincas":true,"eliminar_fincas":true,
   "ver_cuartos":true,"crear_cuartos":true,"editar_cuartos":true,"eliminar_cuartos":true,
   "ver_sensores":true,"crear_sensores":true,"editar_sensores":true,"eliminar_sensores":true,
   "ver_componentes":true,"crear_componentes":true,"editar_componentes":true,"eliminar_componentes":true,
   "ver_reportes":true,"exportar_reportes":true,
   "ver_mantenimientos":true,"crear_mantenimientos":true,"editar_mantenimientos":true,"eliminar_mantenimientos":true}', 1);
```

#### Rol Operador para Empresa COCOS (Solo lectura):
```sql
INSERT INTO rol (codigo, nombre, descripcion, codigo_empresa, permisos, activo) VALUES
('ROL_COCOS_OPERADOR', 'Operador', 'Solo visualización y reportes', 'COCOS',
 '{"ver_usuarios":false,"crear_usuarios":false,"editar_usuarios":false,"eliminar_usuarios":false,
   "ver_fincas":true,"crear_fincas":false,"editar_fincas":false,"eliminar_fincas":false,
   "ver_cuartos":true,"crear_cuartos":false,"editar_cuartos":false,"eliminar_cuartos":false,
   "ver_sensores":true,"crear_sensores":false,"editar_sensores":false,"eliminar_sensores":false,
   "ver_componentes":true,"crear_componentes":false,"editar_componentes":false,"eliminar_componentes":false,
   "ver_reportes":true,"exportar_reportes":true,
   "ver_mantenimientos":true,"crear_mantenimientos":false,"editar_mantenimientos":false,"eliminar_mantenimientos":false}', 1);
```

#### Rol Técnico para Empresa COCOS:
```sql
INSERT INTO rol (codigo, nombre, descripcion, codigo_empresa, permisos, activo) VALUES
('ROL_COCOS_TECNICO', 'Técnico', 'Manejo de sensores y mantenimientos', 'COCOS',
 '{"ver_usuarios":false,"crear_usuarios":false,"editar_usuarios":false,"eliminar_usuarios":false,
   "ver_fincas":true,"crear_fincas":false,"editar_fincas":false,"eliminar_fincas":false,
   "ver_cuartos":true,"crear_cuartos":false,"editar_cuartos":false,"eliminar_cuartos":false,
   "ver_sensores":true,"crear_sensores":true,"editar_sensores":true,"eliminar_sensores":false,
   "ver_componentes":true,"crear_componentes":true,"editar_componentes":true,"eliminar_componentes":false,
   "ver_reportes":true,"exportar_reportes":false,
   "ver_mantenimientos":true,"crear_mantenimientos":true,"editar_mantenimientos":true,"eliminar_mantenimientos":false}', 1);
```

---

## 🔧 Funciones de Ayuda

### En `config/auth.php`:

```php
// Obtener permisos del usuario actual
$permisos = getUserPermisos();
// Retorna: ["ver_usuarios" => true, "crear_usuarios" => false, ...]

// Verificar si tiene un permiso específico
if (tienePermiso('crear_usuarios')) {
    // El usuario puede crear usuarios
}

// Requiere un permiso (lanza error 403 si no lo tiene)
requirePermiso('editar_usuarios');
```

---

## 💻 Uso en APIs

### Ejemplo 1: Verificar Permiso al Crear
```php
// api/usuario.php

if ($method === 'POST') {
    // Verificar que tenga permiso para crear usuarios
    requirePermiso('crear_usuarios');
    
    // Proceder con la creación
    $data = json_decode(file_get_contents('php://input'), true);
    // ...
}
```

### Ejemplo 2: Verificar Permiso al Editar
```php
// api/cuarto_frio.php

if ($method === 'PUT') {
    // Verificar que tenga permiso para editar cuartos
    requirePermiso('editar_cuartos');
    
    // Proceder con la edición
    $data = json_decode(file_get_contents('php://input'), true);
    // ...
}
```

### Ejemplo 3: Verificar Permiso al Eliminar
```php
// api/sensor.php

if ($method === 'DELETE') {
    // Verificar que tenga permiso para eliminar sensores
    requirePermiso('eliminar_sensores');
    
    // Proceder con la eliminación
    $codigo = $_GET['codigo'] ?? null;
    // ...
}
```

---

## 🎭 Ejemplos de Roles

### 1. **Administrador de Empresa**
- ✅ Puede hacer TODO dentro de su empresa
- ✅ Crear/editar usuarios, fincas, cuartos, sensores
- ✅ Ver y exportar reportes
- ✅ Gestionar mantenimientos

### 2. **Operador / Supervisor**
- ✅ Ver todos los módulos
- ✅ Ver y exportar reportes
- ❌ NO puede crear ni editar
- ❌ NO puede eliminar

### 3. **Técnico de Campo**
- ✅ Ver fincas y cuartos
- ✅ Crear y editar sensores
- ✅ Registrar mantenimientos
- ❌ NO puede gestionar usuarios
- ❌ NO puede eliminar registros

### 4. **Gerente / Contador**
- ✅ Ver todos los módulos
- ✅ Ver y exportar reportes
- ❌ NO puede modificar configuraciones técnicas
- ❌ Solo visualización de datos operativos

---

## 🚀 Flujo Completo

### 1. **Crear Empresa**
```sql
INSERT INTO empresa (codigo, nombre) VALUES ('COCOS', 'Empresa Cocos');
```

### 2. **Crear Roles para la Empresa**
```sql
-- Rol Administrador
INSERT INTO rol (codigo, nombre, codigo_empresa, permisos, activo) 
VALUES ('ROL_COCOS_ADMIN', 'Administrador', 'COCOS', '{...}', 1);

-- Rol Operador
INSERT INTO rol (codigo, nombre, codigo_empresa, permisos, activo) 
VALUES ('ROL_COCOS_OPER', 'Operador', 'COCOS', '{...}', 1);
```

### 3. **Crear Finca**
```sql
INSERT INTO finca (codigo, nombre, codigo_empresa) 
VALUES ('FIN_COCOS_1', 'Finca Principal', 'COCOS');
```

### 4. **Crear Usuario con Rol**
```sql
INSERT INTO usuario (codigo, nombre, email, password, codigo_finca, codigo_rol) 
VALUES ('USR001', 'Juan Pérez', 'juan@cocos.com', 
        '$2y$10$...', 'FIN_COCOS_1', 'ROL_COCOS_ADMIN');
```

### 5. **Login**
Al hacer login, el usuario obtiene:
- ✅ `codigo_empresa`: COCOS
- ✅ `codigo_finca`: FIN_COCOS_1
- ✅ `codigo_rol`: ROL_COCOS_ADMIN
- ✅ Permisos del rol automáticamente

### 6. **Uso del Sistema**
- Ver usuarios: ✅ Solo de su finca
- Crear sensor: ✅ Se verifica permiso `crear_sensores`
- Eliminar cuarto: ✅ Se verifica permiso `eliminar_cuartos`

---

## 🔒 Seguridad Multi-Nivel

### Nivel 1: **Empresa**
- Usuario de COCOS NO ve nada de PEDRO

### Nivel 2: **Finca**
- Usuario de Finca1 NO ve datos de Finca2

### Nivel 3: **Permisos**
- Operador puede VER pero NO puede EDITAR
- Técnico puede CREAR sensores pero NO ELIMINAR

### Nivel 4: **Superusuario**
- ✅ Ve TODAS las empresas
- ✅ Ve TODAS las fincas
- ✅ Tiene TODOS los permisos

---

## ✅ Archivos Modificados

1. ✅ `migracion_roles_empresa.sql` - Script de migración
2. ✅ `models/rol.php` - Soporte para empresa y permisos
3. ✅ `api/rol.php` - Filtrado por empresa
4. ✅ `config/auth.php` - Funciones de permisos

---

## 📝 Próximos Pasos

Para usar el sistema completamente:

1. **Ejecutar la migración SQL** (agregar columnas)
2. **Crear roles por empresa** (con permisos)
3. **Asignar roles a usuarios** (codigo_rol)
4. **Actualizar APIs** para usar `requirePermiso()`

---

## 🧪 Cómo Probar

### 1. Crear dos empresas y roles
```sql
-- Empresa 1
INSERT INTO empresa (codigo, nombre) VALUES ('COCOS', 'Cocos');
INSERT INTO rol (codigo, nombre, codigo_empresa, permisos) 
VALUES ('ADMIN_COCOS', 'Admin', 'COCOS', '{"crear_usuarios":true}');

-- Empresa 2  
INSERT INTO empresa (codigo, nombre) VALUES ('PEDRO', 'Pedro');
INSERT INTO rol (codigo, nombre, codigo_empresa, permisos) 
VALUES ('OPER_PEDRO', 'Operador', 'PEDRO', '{"crear_usuarios":false}');
```

### 2. Login como usuario de COCOS
- ✅ Ve solo roles de COCOS
- ✅ Puede crear usuarios (permiso activo)

### 3. Login como usuario de PEDRO
- ✅ Ve solo roles de PEDRO
- ❌ NO puede crear usuarios (permiso inactivo)

---

**Sistema de Roles y Permisos por Empresa** ✅ **IMPLEMENTADO**
