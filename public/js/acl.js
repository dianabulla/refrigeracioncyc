const API_SESSION = "../api/session.php";

/**
 * Reglas de visibilidad por rol de NEGOCIO (codigo_rol)
 *
 * OJO: aquí supongo códigos:
 *  - ADMIN   → ve todo
 *  - OPER    → ve operación (fincas, cuartos, sensores, reportes, mantenimiento)
 *  - CLIENTE → solo reportes
 *
 * Ajusta estos códigos a lo que tengas en tu tabla rol.
 */
function puedeVerModulo(codigoRol, moduloId, esSuper) {
  if (esSuper) return true; // superusuario ve todo

  // si no hay codigoRol, por defecto restringimos bastante
  if (!codigoRol) return false;

  switch (codigoRol) {
    case "ADMIN":
      return true; // todo

    case "OPER":
      return ["fincas", "cuartos", "sensores", "reportes", "mantenimiento"].includes(moduloId);

    case "CLIENTE":
      return ["reportes"].includes(moduloId);

    default:
      // Rol desconocido: por seguridad, no mostramos nada especial
      return false;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(API_SESSION, { credentials: "include" });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      // No hay sesión → opcionalmente redirigir al login
      // window.location.href = "login.html";
      console.warn("No autenticado en acl.js");
      return;
    }

    const user = data.user || {};
    const esSuper      = user.rol === "superusuario";
    const codigoRolBiz = user.codigo_rol || null;

    // 1) Ocultar elementos con data-roles (si quisieras usar esto)
    document.querySelectorAll("[data-roles]").forEach(el => {
      if (esSuper) return; // superusuario ve todo

      const rolesStr = el.getAttribute("data-roles") || "";
      if (!rolesStr) return;
      const roles = rolesStr.split(",").map(r => r.trim()).filter(Boolean);

      // Si el rol de negocio del usuario NO está en la lista → ocultar
      if (!roles.includes(codigoRolBiz)) {
        el.classList.add("d-none");
      }
    });

    // 2) Ocultar por "modulo" usando data-modulo-id
    document.querySelectorAll("[data-modulo-id]").forEach(el => {
      const modId = el.getAttribute("data-modulo-id");
      if (!modId) return;

      const visible = puedeVerModulo(codigoRolBiz, modId, esSuper);
      if (!visible) {
        el.classList.add("d-none");
      }
    });

  } catch (err) {
    console.error("Error en acl.js:", err);
  }
});
