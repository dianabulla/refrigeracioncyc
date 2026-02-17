const API_USUARIOS = "../api/usuario.php";
const API_FINCAS   = "../api/finca.php";
const API_ROLES    = "../api/rol.php";
const API_EMPRESAS = "../api/empresa.php";

let rolesMap    = {};
let fincasMap   = {};
let empresasMap = {};
let fincasData  = []; // Para filtrar por empresa

// ================== CARGAR LISTAS AUXILIARES ==================

async function cargarEmpresasSelect() {
  try {
    const res = await fetch(API_EMPRESAS);
    const data = await res.json();
    if (!Array.isArray(data)) return;

    const sel = document.getElementById("codigo_empresa");
    sel.innerHTML = `<option value="">(Sin empresa)</option>`;

    data.forEach(e => {
      empresasMap[e.codigo] = e.nombre;
      const opt = document.createElement("option");
      opt.value = e.codigo;
      opt.textContent = e.nombre;
      sel.appendChild(opt);
    });
    
    // Evento para filtrar fincas al cambiar empresa
    sel.addEventListener("change", filtrarFincasPorEmpresa);
  } catch (e) {
    console.error("Error al cargar empresas:", e);
  }
}

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

    fincasData = data; // Guardar para filtrar
    
    data.forEach(f => {
      fincasMap[f.codigo] = f.nombre;
    });
    
    actualizarSelectFincas();
  } catch (e) {
    console.error("Error al cargar fincas:", e);
  }
}

function actualizarSelectFincas(codigoEmpresa = null) {
  const sel = document.getElementById("codigo_finca");
  sel.innerHTML = `<option value="">(Sin finca - ver todas)</option>`;
  
  const fincasFiltradas = codigoEmpresa 
    ? fincasData.filter(f => f.codigo_empresa === codigoEmpresa)
    : fincasData;
  
  fincasFiltradas.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.codigo;
    opt.textContent = f.nombre;
    sel.appendChild(opt);
  });
}

function filtrarFincasPorEmpresa() {
  const empresaSel = document.getElementById("codigo_empresa").value;
  actualizarSelectFincas(empresaSel || null);
}

// ================== LISTAR USUARIOS CON FILTRO ==================

async function cargarUsuarios(filtroEstado = "activo") {
  try {
    const res  = await fetch(API_USUARIOS);
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Error al obtener usuarios:", data);
      return;
    }

    // Aplicar filtro
    let dataFiltrada = data;
    if (filtroEstado === "activo") {
      dataFiltrada = data.filter(u => Number(u.activo) === 1);
    } else if (filtroEstado === "inactivo") {
      dataFiltrada = data.filter(u => Number(u.activo) === 0);
    }
    // Si es "todas" no se filtra

    const tbody = document.getElementById("tablaUsuarios");
    tbody.innerHTML = "";

    dataFiltrada.forEach(u => {
      const tr = document.createElement("tr");
      tr.dataset.id     = u.id;
      tr.dataset.codigo = u.codigo || "";

      const nombreRol  = rolesMap[u.codigo_rol]  || u.codigo_rol  || "-";
      const nombreEmp  = empresasMap[u.codigo_empresa] || u.codigo_empresa || "-";
      const nombreFinc = fincasMap[u.codigo_finca] || u.codigo_finca || "-";

      // Columna ID (oculta en móvil)
      const tdId = document.createElement("td");
      tdId.className = "d-none d-md-table-cell";
      tdId.textContent = u.id ?? "-";
      tr.appendChild(tdId);

      // Columna Código (oculta en pantallas pequeñas)
      const tdCodigo = document.createElement("td");
      tdCodigo.className = "d-none d-lg-table-cell";
      tdCodigo.textContent = u.codigo || "-";
      tr.appendChild(tdCodigo);

      // Columna Nombre
      const tdNombre = document.createElement("td");
      tdNombre.textContent = u.nombre || "-";
      tr.appendChild(tdNombre);

      // Columna Email (oculta en pantallas pequeñas)
      const tdEmail = document.createElement("td");
      tdEmail.className = "d-none d-lg-table-cell";
      tdEmail.textContent = u.email || "-";
      tr.appendChild(tdEmail);

      // Columna Rol
      const tdRol = document.createElement("td");
      tdRol.textContent = nombreRol;
      tr.appendChild(tdRol);

      // Columna Empresa (oculta en móvil)
      const tdEmpresa = document.createElement("td");
      tdEmpresa.className = "d-none d-md-table-cell";
      tdEmpresa.textContent = nombreEmp;
      tr.appendChild(tdEmpresa);

      // Columna Finca (oculta en pantallas pequeñas)
      const tdFinca = document.createElement("td");
      tdFinca.className = "d-none d-lg-table-cell";
      tdFinca.textContent = nombreFinc;
      tr.appendChild(tdFinca);

      // Columna Estado
      const tdEstado = document.createElement("td");
      tdEstado.textContent = Number(u.activo) === 1 ? "Activo" : "Inactivo";
      tr.appendChild(tdEstado);

      // Columna Acciones
      const tdAcciones = document.createElement("td");
      tdAcciones.className = "text-end";
      tdAcciones.style.width = "120px";

      // Botón Ver
      const btnVer = document.createElement("button");
      btnVer.className = "btn btn-sm btn-info me-1";
      btnVer.innerHTML = '<i class="bi bi-eye"></i>';
      btnVer.onclick = function() { verDetallesUsuario(u.id); };
      tdAcciones.appendChild(btnVer);

      // Botón Editar
      const btnEditar = document.createElement("button");
      btnEditar.className = "btn btn-sm btn-warning me-1";
      btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
      btnEditar.onclick = function() { editarUsuario(u.id); };
      tdAcciones.appendChild(btnEditar);

      // Botón Eliminar
      const btnEliminar = document.createElement("button");
      btnEliminar.className = "btn btn-sm btn-danger";
      btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
      btnEliminar.onclick = function() { eliminarUsuario(u.id); };
      tdAcciones.appendChild(btnEliminar);

      tr.appendChild(tdAcciones);
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error("Error al cargar usuarios:", e);
  }
}

// ================== CREAR / EDITAR ==================

async function verDetallesUsuario(id) {
  try {
    const res  = await fetch(`${API_USUARIOS}?id=${id}`);
    const data = await res.json();
    if (!res.ok) {
      console.error("Error al obtener usuario:", data);
      return;
    }

    const nombreRol  = rolesMap[data.codigo_rol]  || data.codigo_rol  || "-";
    const nombreEmp  = empresasMap[data.codigo_empresa] || data.codigo_empresa || "-";
    const nombreFinc = fincasMap[data.codigo_finca] || data.codigo_finca || "-";

    document.getElementById("verCodigoUsuario").value = data.codigo || "";
    document.getElementById("verNombreUsuario").value = data.nombre || "";
    document.getElementById("verEmailUsuario").value = data.email || "";
    document.getElementById("verRolUsuario").value = nombreRol;
    document.getElementById("verEmpresaUsuario").value = nombreEmp;
    document.getElementById("verFincaUsuario").value = nombreFinc;
    document.getElementById("verEstadoUsuario").value = Number(data.activo) === 1 ? "Activo" : "Inactivo";

    const modalEl = document.getElementById("modalVerUsuario");
    const modal   = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  } catch (e) {
    console.error("Error al ver usuario:", e);
  }
}

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
    document.getElementById("codigo_empresa").value = data.codigo_empresa || "";
    
    // Filtrar fincas según la empresa
    actualizarSelectFincas(data.codigo_empresa || null);
    
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
      cargarUsuarios("activo");
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
  Promise.all([
    cargarEmpresasSelect(),
    cargarRolesSelect(),
    cargarFincasSelect()
  ]).then(() => {
    cargarUsuarios("activo");
  });

  // Event listeners para filtros
  const radioActivos = document.getElementById("radioActivosUsuario");
  const radioInactivos = document.getElementById("radioInactivosUsuario");
  const radioTodos = document.getElementById("radioTodosUsuario");

  if (radioActivos) {
    radioActivos.addEventListener("change", () => {
      if (radioActivos.checked) cargarUsuarios("activo");
    });
  }

  if (radioInactivos) {
    radioInactivos.addEventListener("change", () => {
      if (radioInactivos.checked) cargarUsuarios("inactivo");
    });
  }

  if (radioTodos) {
    radioTodos.addEventListener("change", () => {
      if (radioTodos.checked) cargarUsuarios("todas");
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = "";

    const payload = {
      codigo:       document.getElementById("codigo").value.trim(),
      nombre:       document.getElementById("nombre").value.trim(),
      email:        document.getElementById("email").value.trim(),
      password:     document.getElementById("password").value.trim(),
      codigo_rol:   document.getElementById("codigo_rol").value,
      codigo_empresa: document.getElementById("codigo_empresa").value || null,
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

        cargarUsuarios("activo");
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
