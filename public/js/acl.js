const API_SESSION = "../api/session.php";
const API_PERMISOS = "../api/rol.php?action=permisos";

/**
 * Mapeo entre módulos del frontend y permisos en la base de datos
 */
const MODULO_PERMISO_MAP = {
  'empresa': 'ver_empresas',
  'fincas': 'ver_fincas',
  'cuartos': 'ver_cuartos',
  'sensores': 'ver_sensores',
  'componentes': 'ver_componentes',
  'refrigerantes': 'ver_refrigerantes',
  'dashboard': 'ver_dashboard',
  'reportes': 'ver_reportes',
  'mantenimiento': 'ver_mantenimientos',
  'roles': 'ver_roles',
  'usuarios': 'ver_usuarios'
};

/**
 * Verifica si el usuario tiene permiso para ver un módulo
 */
function puedeVerModulo(permisos, moduloId, esSuper) {
  // Superusuario siempre ve todo
  if (esSuper) return true;

  // Si no está mapeado a un permiso específico, permitir ver por defecto
  const permisoRequerido = MODULO_PERMISO_MAP[moduloId];
  if (!permisoRequerido) return true;

  // Si no hay permisos cargados, permitir ver por defecto
  // (esto evita que se oculten módulos si falla la carga de permisos)
  if (!permisos || typeof permisos !== 'object' || Object.keys(permisos).length === 0) {
    console.warn('No hay permisos cargados, permitiendo acceso por defecto a:', moduloId);
    return true;
  }

  // Verificar si tiene el permiso explícitamente
  return permisos[permisoRequerido] === true;
}

/**
 * Obtiene los permisos del usuario desde el servidor
 */
async function obtenerPermisos(codigoRol) {
  try {
    const res = await fetch(`${API_PERMISOS}&codigo_rol=${codigoRol}`, {
      credentials: 'include'
    });
    const data = await res.json();
    
    if (res.ok && data.ok && data.permisos) {
      return data.permisos;
    }
    
    return {};
  } catch (err) {
    console.error("Error obteniendo permisos:", err);
    return {};
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(API_SESSION, { credentials: "include" });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      console.warn("No autenticado en acl.js");
      return;
    }

    const user = data.user || {};
    const esSuper = user.rol === "superusuario" || user.tipo === "superusuario";
    const codigoRolBiz = user.codigo_rol || null;

    console.log("ACL - Usuario:", user.nombre);
    console.log("ACL - Es superusuario:", esSuper);
    console.log("ACL - Código rol:", codigoRolBiz);

    // Obtener permisos del rol desde el servidor
    let permisos = {};
    if (!esSuper && codigoRolBiz) {
      permisos = await obtenerPermisos(codigoRolBiz);
      console.log("ACL - Permisos cargados:", permisos);
    } else if (esSuper) {
      console.log("ACL - Superusuario detectado, todos los módulos habilitados");
    }

    // 1) Ocultar elementos con data-roles (si quisieras usar esto)
    document.querySelectorAll("[data-roles]").forEach(el => {
      if (esSuper) {
        // Superusuario ve todo, asegurar que esté visible
        el.classList.remove("d-none");
        return;
      }

      const rolesStr = el.getAttribute("data-roles") || "";
      if (!rolesStr) return;
      const roles = rolesStr.split(",").map(r => r.trim()).filter(Boolean);

      // Si el rol de negocio del usuario NO está en la lista → ocultar
      if (!roles.includes(codigoRolBiz)) {
        el.classList.add("d-none");
      } else {
        el.classList.remove("d-none");
      }
    });

    // 2) Ocultar/mostrar módulos según permisos
    let modulosVisibles = 0;
    let modulosOcultos = 0;
    
    document.querySelectorAll("[data-modulo-id]").forEach(el => {
      const modId = el.getAttribute("data-modulo-id");
      if (!modId) return;

      const visible = puedeVerModulo(permisos, modId, esSuper);
      
      if (!visible) {
        el.classList.add("d-none");
        modulosOcultos++;
        console.log(`ACL - Módulo oculto: ${modId}`);
      } else {
        el.classList.remove("d-none");
        modulosVisibles++;
        console.log(`ACL - Módulo visible: ${modId}`);
      }
    });

    console.log(`ACL - Total módulos visibles: ${modulosVisibles}, ocultos: ${modulosOcultos}`);

  } catch (err) {
    console.error("Error en acl.js:", err);
    // En caso de error, mostrar todos los módulos por seguridad del usuario
    console.warn("ACL - Error detectado, mostrando todos los módulos");
    document.querySelectorAll("[data-modulo-id]").forEach(el => {
      el.classList.remove("d-none");
    });
  }
});
