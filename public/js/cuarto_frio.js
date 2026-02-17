const API_URL_CUARTOS = "../api/cuarto_frio.php";
const API_URL_FINCAS = "../api/finca.php";

/** Crear fila HTML para un cuarto frío */
function crearFilaCuarto(item) {
  const tr = document.createElement("tr");
  tr.dataset.id = item.id;
  tr.dataset.codigo = item.codigo || "";

  // Columna ID (oculta en móvil)
  const tdId = document.createElement("td");
  tdId.className = "d-none d-md-table-cell";
  tdId.textContent = item.id ?? "-";
  tr.appendChild(tdId);

  // Columna Código
  const tdCodigo = document.createElement("td");
  tdCodigo.textContent = item.codigo || "-";
  tr.appendChild(tdCodigo);

  // Columna Nombre
  const tdNombre = document.createElement("td");
  tdNombre.textContent = item.nombre || "-";
  tr.appendChild(tdNombre);

  // Columna Finca (oculta en móvil)
  const tdFinca = document.createElement("td");
  tdFinca.className = "d-none d-md-table-cell";
  tdFinca.textContent = item.codigo_finca || "-";
  tr.appendChild(tdFinca);

  // Columna Estado
  const tdEstado = document.createElement("td");
  tdEstado.textContent = Number(item.activo) === 1 ? "Activo" : "Inactivo";
  tr.appendChild(tdEstado);

  // Columna Acciones
  const tdAcciones = document.createElement("td");
  tdAcciones.style.width = "120px";

  // Botón Ver
  const btnVer = document.createElement("button");
  btnVer.className = "btn btn-sm btn-outline-info me-1";
  btnVer.innerHTML = '<i class="bi bi-eye"></i>';
  btnVer.onclick = function() { verDetallesCuarto(item.codigo); };
  tdAcciones.appendChild(btnVer);

  // Botón Editar
  const btnEditar = document.createElement("button");
  btnEditar.className = "btn btn-sm btn-outline-primary me-1";
  btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
  btnEditar.onclick = function() { editarCuarto(item.codigo); };
  tdAcciones.appendChild(btnEditar);

  // Botón Eliminar
  const btnEliminar = document.createElement("button");
  btnEliminar.className = "btn btn-sm btn-outline-danger";
  btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
  btnEliminar.onclick = function() { eliminarCuarto(item.codigo); };
  tdAcciones.appendChild(btnEliminar);

  tr.appendChild(tdAcciones);

  return tr;
}

/** 🟢 Cargar cuartos fríos con filtro */
async function cargarCuartos(filtroEstado = "activo") {
  try {
    const res = await fetch(API_URL_CUARTOS);
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Error al obtener cuartos fríos:", data);
      return;
    }

    // Aplicar filtro
    let dataFiltrada = data;
    if (filtroEstado === "activo") {
      dataFiltrada = data.filter(item => Number(item.activo) === 1);
    } else if (filtroEstado === "inactivo") {
      dataFiltrada = data.filter(item => Number(item.activo) === 0);
    }
    // Si es "todas" no se filtra

    const tbody = document.getElementById("tablaCuartos");
    tbody.innerHTML = "";
    dataFiltrada.forEach((item) => tbody.appendChild(crearFilaCuarto(item)));
  } catch (e) {
    console.error("Error al cargar cuartos fríos:", e);
  }
}

/** 🟢 Cargar fincas en el select */
async function cargarFincasSelect() {
  const select = document.getElementById("codigo_finca");
  if (!select) return;

  try {
    const res = await fetch(API_URL_FINCAS);
    const data = await res.json();
    if (!Array.isArray(data)) return;

    select.innerHTML = '<option value="">Seleccione una finca...</option>';
    data.forEach((f) => {
      const opt = document.createElement("option");
      opt.value = f.codigo;
      opt.textContent = `${f.codigo} - ${f.nombre}`;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error("Error al cargar fincas:", e);
  }
}

/** Limpiar formulario */
function limpiarFormularioCuarto() {
  document.getElementById("formCuarto").reset();
  document.getElementById("activo").checked = true;

  const btn = document.getElementById("btnGuardarCuarto");
  btn.dataset.modo = "crear";
  btn.dataset.codigoOriginal = "";
  btn.textContent = "Guardar";

  document.getElementById("modalCuartoLabel").innerHTML =
    '<i class="bi bi-plus-circle me-2"></i>Nuevo Cuarto Frío';

  document.getElementById("codigo").disabled = false;
}

/** Llenar formulario para editar */
function llenarFormularioCuarto(data) {
  document.getElementById("codigo").value = data.codigo || "";
  document.getElementById("nombre").value = data.nombre || "";
  document.getElementById("codigo_finca").value = data.codigo_finca || "";
  document.getElementById("activo").checked = data.activo === 1;

  const btn = document.getElementById("btnGuardarCuarto");
  btn.dataset.modo = "editar";
  btn.dataset.codigoOriginal = data.codigo || "";
  btn.textContent = "Actualizar";

  document.getElementById("modalCuartoLabel").innerHTML =
    '<i class="bi bi-pencil me-2"></i>Editar Cuarto Frío';

  document.getElementById("codigo").disabled = true;
}

/** Crear cuarto (POST) */
async function crearCuarto(payload) {
  const res = await fetch(API_URL_CUARTOS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  if (!res.ok || result.error) {
    throw new Error(result.error || "Error al crear cuarto frío");
  }
}

/** Actualizar cuarto (PUT por código) */
async function actualizarCuarto(codigoOriginal, payload) {
  payload.codigo = codigoOriginal; // para el WHERE en PHP
  const params = new URLSearchParams(payload);

  const res = await fetch(API_URL_CUARTOS, {
    method: "PUT",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const result = await res.json();
  if (!res.ok || result.error) {
    throw new Error(result.error || "Error al actualizar cuarto frío");
  }
}

/** Eliminar cuarto (DELETE por código) */
async function eliminarCuarto(codigo) {
  if (!confirm("¿Seguro que deseas eliminar este cuarto frío?")) return;

  try {
    const res = await fetch(
      `${API_URL_CUARTOS}?codigo=${encodeURIComponent(codigo)}`,
      { method: "DELETE" }
    );
    const result = await res.json();
    if (!res.ok || result.error) {
      alert(result.error || "Error al eliminar cuarto frío");
      return;
    }
    alert("Cuarto frío eliminado correctamente");
    await cargarCuartos();
  } catch (e) {
    console.error("Error al eliminar cuarto frío:", e);
    alert("Error al eliminar cuarto frío");
  }
}

/** Ver detalles del cuarto en modal de solo lectura */
async function verDetallesCuarto(codigo) {
  try {
    const res = await fetch(
      `${API_URL_CUARTOS}?codigo=${encodeURIComponent(codigo)}`
    );
    const data = await res.json();

    if (!res.ok || data.error) {
      alert(data.error || "No se pudo obtener el cuarto frío");
      return;
    }

    // Llenar modal de visualización
    document.getElementById("verCodigoCuarto").value = data.codigo || "";
    document.getElementById("verNombreCuarto").value = data.nombre || "";
    document.getElementById("verFincaCuarto").value = data.codigo_finca || "";
    document.getElementById("verEstadoCuarto").value = Number(data.activo) === 1 ? "Activo" : "Inactivo";

    const modalEl = document.getElementById("modalVerCuarto");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  } catch (e) {
    console.error("Error al cargar cuarto frío:", e);
    alert("Error al cargar datos del cuarto frío");
  }
}

/** Editar cuarto: traer datos y abrir modal */
async function editarCuarto(codigo) {
  try {
    const res = await fetch(
      `${API_URL_CUARTOS}?codigo=${encodeURIComponent(codigo)}`
    );
    const data = await res.json();

    if (!res.ok || data.error) {
      alert(data.error || "No se pudo obtener el cuarto frío");
      return;
    }

    await cargarFincasSelect();
    llenarFormularioCuarto(data);

    const modalEl = document.getElementById("modalCuarto");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  } catch (e) {
    console.error("Error al cargar cuarto frío:", e);
    alert("Error al cargar datos del cuarto frío");
  }
}

/** Inicialización */
document.addEventListener("DOMContentLoaded", () => {
  // Cargar con filtro activo por defecto
  cargarCuartos("activo");
  cargarFincasSelect();

  // Event listeners para filtros
  const radioActivos = document.getElementById("radioActivosCuarto");
  const radioInactivos = document.getElementById("radioInactivosCuarto");
  const radioTodos = document.getElementById("radioTodosCuarto");

  if (radioActivos) {
    radioActivos.addEventListener("change", () => {
      if (radioActivos.checked) cargarCuartos("activo");
    });
  }

  if (radioInactivos) {
    radioInactivos.addEventListener("change", () => {
      if (radioInactivos.checked) cargarCuartos("inactivo");
    });
  }

  if (radioTodos) {
    radioTodos.addEventListener("change", () => {
      if (radioTodos.checked) cargarCuartos("todas");
    });
  }

  const form = document.getElementById("formCuarto");
  const btnGuardar = document.getElementById("btnGuardarCuarto");
  const btnNuevo = document.getElementById("btnNuevoCuarto");

  if (btnNuevo) {
    btnNuevo.addEventListener("click", () => {
      limpiarFormularioCuarto();
      cargarFincasSelect();
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      codigo: document.getElementById("codigo").value.trim(),
      nombre: document.getElementById("nombre").value.trim(),
      codigo_finca: document.getElementById("codigo_finca").value.trim(),
      activo: document.getElementById("activo").checked ? 1 : 0,
    };

    if (!payload.codigo || !payload.nombre || !payload.codigo_finca) {
      alert("Código, nombre y finca son obligatorios");
      return;
    }

    try {
      const modo = btnGuardar.dataset.modo || "crear";

      if (modo === "crear") {
        await crearCuarto(payload);
        alert("Cuarto frío creado correctamente");
      } else {
        const codigoOriginal = btnGuardar.dataset.codigoOriginal;
        await actualizarCuarto(codigoOriginal, payload);
        alert("Cuarto frío actualizado correctamente");
      }

      const modalEl = document.getElementById("modalCuarto");
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();

      limpiarFormularioCuarto();
      await cargarCuartos();
    } catch (e) {
      console.error(e);
      alert(e.message || "Error al guardar cuarto frío");
    }
  });
});
