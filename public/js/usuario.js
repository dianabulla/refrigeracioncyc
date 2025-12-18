const API_USUARIOS = "../api/usuario.php";
const API_FINCAS   = "../api/finca.php";
const API_ROLES    = "../api/rol.php";

let rolesMap  = {};
let fincasMap = {};

// ================== CARGAR LISTAS AUXILIARES ==================

async function cargarRolesSelect() {
  try {
    const res = await fetch(API_ROLES);
    const data = await res.json();
    if (!Array.isArray(data)) return;

    const sel = document.getElementById("codigo_rol");
    sel.innerHTML = `<option value="">Seleccione...</option>`;

    data.forEach(r => {
      rolesMap[r.codigo] = r.nombre;
      const opt = document.createElement("option");
      opt.value = r.codigo;
      opt.textContent = r.nombre;
      sel.appendChild(opt);
    });
  } catch (e) {
    // Error silencioso
  }
}

async function cargarFincasSelect() {
  try {
    const res = await fetch(API_FINCAS);
    const data = await res.json();
    if (!Array.isArray(data)) return;

    const sel = document.getElementById("codigo_finca");
    sel.innerHTML = `<option value="">(Sin finca)</option>`;

    data.forEach(f => {
      fincasMap[f.codigo] = f.nombre;
      const opt = document.createElement("option");
      opt.value = f.codigo;
      opt.textContent = f.nombre;
      sel.appendChild(opt);
    });
  } catch (e) {
    // Error silencioso
  }
}

// ================== LISTAR USUARIOS ==================

async function cargarUsuarios() {
  try {
    const res  = await fetch(API_USUARIOS);
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Error al obtener usuarios:", data);
      return;
    }

    const tbody = document.getElementById("tablaUsuarios");
    tbody.innerHTML = "";

    data.forEach(u => {
      const tr = document.createElement("tr");
      tr.dataset.id     = u.id;
      tr.dataset.codigo = u.codigo || "";

      const nombreRol  = rolesMap[u.codigo_rol]  || u.codigo_rol  || "-";
      const nombreFinc = fincasMap[u.codigo_finca] || u.codigo_finca || "-";

      tr.innerHTML = `
        <td>${u.id ?? "-"}</td>
        <td>${u.codigo || "-"}</td>
        <td>${u.nombre || "-"}</td>
        <td>${u.email || "-"}</td>
        <td>${nombreRol}</td>
        <td>${nombreFinc}</td>
        <td>${u.activo ? "Activo" : "Inactivo"}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-warning me-1" onclick="editarUsuario(${u.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="eliminarUsuario(${u.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error("Error al cargar usuarios:", e);
  }
}

// ================== CREAR / EDITAR ==================

async function editarUsuario(id) {
  const mensaje = document.getElementById("usuarioMensaje");
  if (mensaje) mensaje.textContent = "";

  try {
    const res  = await fetch(`${API_USUARIOS}?id=${id}`);
    const data = await res.json();
    if (!res.ok) {
      console.error("Error al obtener usuario:", data);
      return;
    }

    document.getElementById("codigo").value       = data.codigo || "";
    document.getElementById("nombre").value       = data.nombre || "";
    document.getElementById("email").value        = data.email  || "";
    document.getElementById("password").value     = "";
    document.getElementById("codigo_rol").value   = data.codigo_rol   || "";
    document.getElementById("codigo_finca").value = data.codigo_finca || "";
    document.getElementById("activo").value       = data.activo ? "1" : "0";

    const btn   = document.getElementById("btnGuardarUsuario");
    const title = document.getElementById("modalUsuarioTitulo");
    btn.dataset.editId = id;
    btn.textContent    = "Actualizar";
    if (title) title.innerHTML = `<i class="bi bi-pencil-square me-2"></i>Editar Usuario`;

    const modalEl = document.getElementById("modalUsuario");
    const modal   = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  } catch (e) {
    console.error("Error al editar usuario:", e);
  }
}

async function eliminarUsuario(id) {
  const tr = document.querySelector(`tr[data-id="${id}"]`);
  const codigo = tr?.dataset.codigo;

  if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;

  try {
    let res   = await fetch(`${API_USUARIOS}?id=${id}`, { method: "DELETE" });
    let data  = await res.json();

    if (!res.ok && codigo) {
      res  = await fetch(`${API_USUARIOS}?codigo=${encodeURIComponent(codigo)}`, { method: "DELETE" });
      data = await res.json();
    }

    if (res.ok && data.ok) {
      alert(data.message || "Usuario eliminado");
      cargarUsuarios();
    } else {
      alert(data.error || "No se pudo eliminar el usuario");
    }
  } catch (e) {
    console.error("Error al eliminar usuario:", e);
  }
}

// ================== MANEJO DEL FORM ==================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formUsuario");
  const btn  = document.getElementById("btnGuardarUsuario");
  const msg  = document.getElementById("usuarioMensaje");

  if (!form) return;

  // Cargar combos y tabla
  cargarRolesSelect().then(cargarUsuarios);
  cargarFincasSelect();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = "";

    const payload = {
      codigo:       document.getElementById("codigo").value.trim(),
      nombre:       document.getElementById("nombre").value.trim(),
      email:        document.getElementById("email").value.trim(),
      password:     document.getElementById("password").value.trim(),
      codigo_rol:   document.getElementById("codigo_rol").value,
      codigo_finca: document.getElementById("codigo_finca").value || null,
      activo:       parseInt(document.getElementById("activo").value, 10),
    };

    if (!payload.codigo || !payload.nombre || !payload.email || !payload.codigo_rol) {
      if (msg) msg.textContent = "Complete los campos obligatorios.";
      return;
    }

    btn.disabled = true;
    btn.textContent = btn.dataset.editId ? "Actualizando..." : "Guardando...";

    try {
      let res, data;

      if (btn.dataset.editId) {
        // Actualizar (id en query, password opcional)
        res = await fetch(`${API_USUARIOS}?id=${btn.dataset.editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        data = await res.json();
      } else {
        // Crear
        res = await fetch(API_USUARIOS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        data = await res.json();
      }

      if (res.ok && data.ok) {
        alert(data.message || "Operación realizada con éxito");
        form.reset();
        document.getElementById("activo").value = "1";
        btn.disabled = false;
        btn.textContent = "Guardar";
        delete btn.dataset.editId;

        const modalEl = document.getElementById("modalUsuario");
        const modal   = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.hide();

        cargarUsuarios();
      } else {
        if (msg) msg.textContent = data.error || "Error en la operación.";
        btn.disabled = false;
        btn.textContent = btn.dataset.editId ? "Actualizar" : "Guardar";
      }

    } catch (e) {
      console.error("Error al guardar usuario:", e);
      if (msg) msg.textContent = "Error de conexión con el servidor.";
      btn.disabled = false;
      btn.textContent = btn.dataset.editId ? "Actualizar" : "Guardar";
    }
  });
});
