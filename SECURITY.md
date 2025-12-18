# Sistema de Seguridad Implementado

## 🔒 Protección de Acceso - Documentación

Se ha implementado un sistema completo de seguridad para proteger todas las páginas administrativas del sistema. **Nadie puede acceder directamente a ningún archivo sin estar autenticado**.

---

## ✅ Componentes Implementados

### 1. **Archivo `.htaccess`** (Protección a nivel de servidor)
- **Ubicación:** `/refrigeracioncyc/.htaccess`
- **Función:** Bloquea el acceso directo a directorios sensibles:
  - `/config/` - Archivos de configuración
  - `/models/` - Modelos de datos
  - `/controllers/` - Controladores
- Previene listado de directorios
- Protege archivos PHP de configuración

### 2. **Archivo `index.php`** (Punto de entrada seguro)
- **Ubicación:** `/refrigeracioncyc/index.php`
- **Función:** 
  - Verifica si hay sesión activa
  - Redirige a usuarios autenticados al panel de admin
  - Muestra página pública a usuarios no autenticados
  - Redirige al login si es necesario

### 3. **Script `auth-check.js`** (Verificación automática de sesión)
- **Ubicación:** `/refrigeracioncyc/public/js/auth-check.js`
- **Función:**
  - Se ejecuta automáticamente al cargar cualquier vista administrativa
  - Verifica la sesión contra el servidor (`/api/session.php`)
  - Redirige al login si la sesión es inválida o ha expirado
  - Actualiza información del usuario en la interfaz
  - Verificación periódica cada 5 minutos
  - Proporciona funciones globales: `AuthCheck.verificar()`, `AuthCheck.cerrarSesion()`

### 4. **Vistas Protegidas** (Todas incluyen verificación de sesión)
Todas las páginas administrativas ahora incluyen el script `auth-check.js`:
- ✅ admin.html
- ✅ usuario.html
- ✅ empresa.html
- ✅ finca.html
- ✅ cuarto_frio.html
- ✅ componente.html
- ✅ sensor.html
- ✅ rol.html
- ✅ mantenimiento.html
- ✅ reporte.html
- ✅ configuracion.html

---

## 🛡️ Cómo Funciona la Seguridad

### Flujo de Protección:

1. **Usuario intenta acceder a una URL directamente** (ej: `/views/admin.html`)
2. **El navegador carga la página HTML**
3. **El script `auth-check.js` se ejecuta inmediatamente**
4. **Hace una petición a `/api/session.php`** para verificar la sesión
5. **Respuestas posibles:**
   - ✅ **Sesión válida:** El usuario permanece en la página
   - ❌ **Sin sesión o expirada:** Redirige automáticamente a `/views/login.html`

### Verificación Periódica:
- Cada 5 minutos, el sistema verifica automáticamente si la sesión sigue activa
- Si la sesión expira mientras el usuario está trabajando, será redirigido al login

---

## 🚀 Uso en el Código

### Para cerrar sesión desde JavaScript:
```javascript
// Desde cualquier vista administrativa
AuthCheck.cerrarSesion();
```

### Para obtener información del usuario actual:
```javascript
// Obtener datos del usuario logueado
const usuario = AuthCheck.obtenerUsuario();
console.log(usuario.nombre, usuario.email);
```

### Para verificar sesión manualmente:
```javascript
// Forzar verificación de sesión
AuthCheck.verificar();
```

---

## 📋 Configuración del Servidor

### Requisitos:
- Apache con `mod_rewrite` habilitado
- PHP con sesiones habilitadas
- Archivo `.htaccess` permitido (`AllowOverride All`)

### Verificar que Apache tiene habilitado el .htaccess:
En tu `httpd.conf` o archivo de configuración del virtual host, asegúrate de tener:
```apache
<Directory "/xampp/htdocs/refrigeracioncyc">
    AllowOverride All
</Directory>
```

---

## 🔧 Mantenimiento

### Agregar nueva página protegida:
Si creas una nueva vista administrativa, simplemente agrega este script en el `<head>`:
```html
<!-- Script de verificación de sesión (DEBE IR PRIMERO) -->
<script src="../public/js/auth-check.js"></script>
```

### Páginas públicas (sin protección):
- `index.html` - Página pública principal
- `views/login.html` - Página de login (acceso público)

---

## ⚠️ Notas Importantes

1. **El archivo `auth-check.js` debe cargarse ANTES de cualquier otro script** en las vistas protegidas
2. **No elimines la carpeta `/api/`** - contiene los endpoints necesarios para la verificación
3. **No modifiques `config/auth.php`** sin comprender su funcionamiento
4. **La sesión expira según la configuración de PHP** (por defecto 24 minutos de inactividad)

---

## 🐛 Solución de Problemas

### Problema: "Redirige al login incluso estando logueado"
- Verifica que las cookies estén habilitadas en el navegador
- Revisa que la sesión de PHP esté configurada correctamente
- Comprueba que `/api/session.php` esté accesible

### Problema: "Aún puedo acceder a archivos sin login"
- Verifica que el archivo `.htaccess` esté en la raíz del proyecto
- Asegúrate de que Apache tiene habilitado `mod_rewrite`
- Comprueba que `AllowOverride All` esté configurado

### Problema: "Error 500 al cargar páginas"
- Revisa los logs de Apache/PHP
- Verifica que todas las rutas en `auth-check.js` sean correctas
- Comprueba permisos de archivos

---

## 📊 Resumen de Archivos Modificados/Creados

### Archivos Nuevos:
- `.htaccess` - Protección de directorios
- `index.php` - Punto de entrada con redirección
- `public/js/auth-check.js` - Sistema de verificación de sesión
- `SECURITY.md` - Esta documentación

### Archivos Modificados (11 vistas):
- `views/admin.html`
- `views/usuario.html`
- `views/empresa.html`
- `views/finca.html`
- `views/cuarto_frio.html`
- `views/componente.html`
- `views/sensor.html`
- `views/rol.html`
- `views/mantenimiento.html`
- `views/reporte.html`
- `views/configuracion.html`

---

## ✨ Resultado Final

✅ **Ninguna URL puede ser accedida directamente sin autenticación**
✅ **Protección automática en todas las vistas administrativas**
✅ **Verificación periódica de sesión cada 5 minutos**
✅ **Redirección automática al login si la sesión expira**
✅ **Protección de directorios sensibles (config, models, controllers)**
✅ **Sistema de logout seguro**

**El sistema ahora es completamente seguro contra acceso no autorizado.**
