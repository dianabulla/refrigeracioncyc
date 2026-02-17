const API_URL_SENSORES = "../api/sensor.php";
const API_URL_CUARTOS = "../api/cuarto_frio.php";

/** Crear fila HTML para un sensor */
function crearFilaSensor(item) {
  const tr = document.createElement("tr");
  tr.dataset.id = item.id;
  tr.dataset.codigo = item.codigo || "";

  const fechaInst = item.fecha_instalacion || "";
  const fechaVerif = item.fecha_verificacion || "";

  // Colores específicos para cada ubicación
  const coloresUbicacion = {
    'exterior': 'bg-info',
    'interior': 'bg-primary',
    'tuberia': 'bg-success',
    'otro': 'bg-secondary'
  };
  
  const badgeColor = coloresUbicacion[item.ubicacion] || 'bg-info';

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

  // Columna Tipo
  const tdTipo = document.createElement("td");
  tdTipo.textContent = item.tipo || "-";
  tr.appendChild(tdTipo);

  // Columna Modelo (oculta en pantallas pequeñas)
  const tdModelo = document.createElement("td");
  tdModelo.className = "d-none d-lg-table-cell";
  tdModelo.textContent = item.modelo || "-";
  tr.appendChild(tdModelo);

  // Columna Ubicación
  const tdUbicacion = document.createElement("td");
  const spanUbicacion = document.createElement("span");
  spanUbicacion.className = `badge ${badgeColor}`;
  spanUbicacion.textContent = item.ubicacion || "exterior";
  tdUbicacion.appendChild(spanUbicacion);
  tr.appendChild(tdUbicacion);

  // Columna Fecha Instalación (oculta en pantallas pequeñas)
  const tdFechaInst = document.createElement("td");
  tdFechaInst.className = "d-none d-lg-table-cell";
  tdFechaInst.textContent = fechaInst || "-";
  tr.appendChild(tdFechaInst);

  // Columna Fecha Verificación (oculta en pantallas muy pequeñas)
  const tdFechaVerif = document.createElement("td");
  tdFechaVerif.className = "d-none d-xl-table-cell";
  tdFechaVerif.textContent = fechaVerif || "-";
  tr.appendChild(tdFechaVerif);

  // Columna Valor Actual (oculta en móvil)
  const tdValor = document.createElement("td");
  tdValor.className = "d-none d-md-table-cell";
  tdValor.textContent = item.valor_actual || "-";
  tr.appendChild(tdValor);

  // Columna Cuarto (oculta en móvil)
  const tdCuarto = document.createElement("td");
  tdCuarto.className = "d-none d-md-table-cell";
  tdCuarto.textContent = item.codigo_cuarto || "-";
  tr.appendChild(tdCuarto);

  // Columna Estado
  const tdEstado = document.createElement("td");
  const spanEstado = document.createElement("span");
  spanEstado.className = Number(item.activo) === 1 ? "badge bg-success" : "badge bg-danger";
  spanEstado.textContent = Number(item.activo) === 1 ? "Act." : "Inact.";
  tdEstado.appendChild(spanEstado);
  tr.appendChild(tdEstado);

  // Columna Acciones
  const tdAcciones = document.createElement("td");
  tdAcciones.style.width = "120px";

  // Botón Ver
  const btnVer = document.createElement("button");
  btnVer.className = "btn btn-sm btn-outline-info me-1";
  btnVer.innerHTML = '<i class="bi bi-eye"></i>';
  btnVer.onclick = function() { verDetallesSensor(item.codigo); };
  tdAcciones.appendChild(btnVer);

  // Botón Editar
  const btnEditar = document.createElement("button");
  btnEditar.className = "btn btn-sm btn-outline-primary me-1";
  btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
  btnEditar.onclick = function() { editarSensor(item.codigo); };
  tdAcciones.appendChild(btnEditar);

  // Botón Eliminar
  const btnEliminar = document.createElement("button");
  btnEliminar.className = "btn btn-sm btn-outline-danger";
  btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
  btnEliminar.onclick = function() { eliminarSensor(item.codigo); };
  tdAcciones.appendChild(btnEliminar);

  tr.appendChild(tdAcciones);

  return tr;
}

/** 🟢 Cargar sensores con filtro */
async function cargarSensores(filtroEstado = "activo") {
  try {
    const res = await fetch(API_URL_SENSORES);
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Error al obtener sensores:", data);
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

    const tbody = document.getElementById("tablaSensores");
    tbody.innerHTML = "";
    dataFiltrada.forEach((item) => tbody.appendChild(crearFilaSensor(item)));
  } catch (e) {
    console.error("Error al cargar sensores:", e);
  }
}

/** 🟢 Cargar cuartos fríos en el select */
async function cargarCuartosSelect() {
  const select = document.getElementById("codigo_cuarto");
  if (!select) return;

  try {
    const res = await fetch(API_URL_CUARTOS);
    const data = await res.json();
    if (!Array.isArray(data)) return;

    select.innerHTML = '<option value="">Seleccione un cuarto frío...</option>';
    data.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.codigo;
      opt.textContent = `${c.codigo} - ${c.nombre}`;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error("Error al cargar cuartos fríos:", e);
  }
}

/** Limpiar formulario */
function limpiarFormularioSensor() {
  document.getElementById("formSensor").reset();
  document.getElementById("activo").checked = true;
  document.getElementById("ubicacion").value = "exterior";

  const btn = document.getElementById("btnGuardarSensor");
  btn.dataset.modo = "crear";
  btn.dataset.codigoOriginal = "";
  btn.textContent = "Guardar";

  document.getElementById("modalSensorLabel").innerHTML =
    '<i class="bi bi-plus-circle me-2"></i>Nuevo Sensor';

  document.getElementById("codigo").disabled = false;
}

/** Llenar formulario para editar */
function llenarFormularioSensor(data) {
  document.getElementById("codigo").value = data.codigo || "";
  document.getElementById("nombre").value = data.nombre || "";
  document.getElementById("tipo").value = data.tipo || "";
  document.getElementById("modelo").value = data.modelo || "";

  document.getElementById("fecha_instalacion").value =
    data.fecha_instalacion ? data.fecha_instalacion.substring(0, 10) : "";
  document.getElementById("fecha_verificacion").value =
    data.fecha_verificacion ? data.fecha_verificacion.substring(0, 10) : "";

  document.getElementById("valor_actual").value = data.valor_actual || "";
  document.getElementById("codigo_cuarto").value = data.codigo_cuarto || "";
  document.getElementById("ubicacion").value = data.ubicacion || "exterior";
  document.getElementById("activo").checked = data.activo == 1;

  const btn = document.getElementById("btnGuardarSensor");
  btn.dataset.modo = "editar";
  btn.dataset.codigoOriginal = data.codigo || "";
  btn.textContent = "Actualizar";

  document.getElementById("modalSensorLabel").innerHTML =
    '<i class="bi bi-pencil me-2"></i>Editar Sensor';

  document.getElementById("codigo").disabled = true;
}

/** Crear sensor (POST) */
async function crearSensor(payload) {
  const res = await fetch(API_URL_SENSORES, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await res.json();
  if (!res.ok || result.error) {
    throw new Error(result.error || "Error al crear sensor");
  }
}

/** Actualizar sensor (PUT) */
async function actualizarSensor(codigoOriginal, payload) {
  payload.codigo = codigoOriginal;
  const params = new URLSearchParams(payload);

  const res = await fetch(API_URL_SENSORES, {
    method: "PUT",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const result = await res.json();
  if (!res.ok || result.error) {
    throw new Error(result.error || "Error al actualizar sensor");
  }
}

/** Eliminar sensor (DELETE) */
async function eliminarSensor(codigo) {
  if (!confirm("¿Seguro que deseas eliminar este sensor?")) return;

  try {
    const res = await fetch(
      `${API_URL_SENSORES}?codigo=${encodeURIComponent(codigo)}`,
      { method: "DELETE" }
    );
    const result = await res.json();
    if (!res.ok || result.error) {
      alert(result.error || "Error al eliminar sensor");
      return;
    }
    alert("Sensor eliminado correctamente");
    await cargarSensores();
  } catch (e) {
    console.error("Error al eliminar sensor:", e);
    alert("Error al eliminar sensor");
  }
}

/** Ver detalles del sensor en modal de solo lectura */
async function verDetallesSensor(codigo) {
  try {
    const res = await fetch(
      `${API_URL_SENSORES}?codigo=${encodeURIComponent(codigo)}`
    );
    const data = await res.json();
    if (!res.ok || data.error) {
      alert(data.error || "No se pudo obtener el sensor");
      return;
    }

    // Llenar modal de visualización
    document.getElementById("verCodigoSensor").value = data.codigo || "";
    document.getElementById("verNombreSensor").value = data.nombre || "";
    document.getElementById("verTipoSensor").value = data.tipo || "";
    document.getElementById("verModeloSensor").value = data.modelo || "";
    document.getElementById("verUbicacionSensor").value = data.ubicacion || "";
    document.getElementById("verCuartoSensor").value = data.codigo_cuarto || "";
    document.getElementById("verFechaInstalacionSensor").value = data.fecha_instalacion ? data.fecha_instalacion.substring(0, 10) : "";
    document.getElementById("verFechaVerificacionSensor").value = data.fecha_verificacion ? data.fecha_verificacion.substring(0, 10) : "";
    document.getElementById("verValorActualSensor").value = data.valor_actual || "";
    document.getElementById("verEstadoSensor").value = Number(data.activo) === 1 ? "Activo" : "Inactivo";

    const modalEl = document.getElementById("modalVerSensor");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  } catch (e) {
    console.error("Error al cargar sensor:", e);
    alert("Error al cargar datos del sensor");
  }
}

/** Editar sensor: traer datos y abrir modal */
async function editarSensor(codigo) {
  try {
    const res = await fetch(
      `${API_URL_SENSORES}?codigo=${encodeURIComponent(codigo)}`
    );
    const data = await res.json();
    if (!res.ok || data.error) {
      alert(data.error || "No se pudo obtener el sensor");
      return;
    }

    await cargarCuartosSelect();
    llenarFormularioSensor(data);

    const modalEl = document.getElementById("modalSensor");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  } catch (e) {
    console.error("Error al cargar sensor:", e);
    alert("Error al cargar datos del sensor");
  }
}

/** Inicialización */
document.addEventListener("DOMContentLoaded", () => {
  // Cargar con filtro activo por defecto
  cargarSensores("activo");
  cargarCuartosSelect();

  // Event listeners para filtros
  const radioActivos = document.getElementById("radioActivosSensor");
  const radioInactivos = document.getElementById("radioInactivosSensor");
  const radioTodos = document.getElementById("radioTodosSensor");

  if (radioActivos) {
    radioActivos.addEventListener("change", () => {
      if (radioActivos.checked) cargarSensores("activo");
    });
  }

  if (radioInactivos) {
    radioInactivos.addEventListener("change", () => {
      if (radioInactivos.checked) cargarSensores("inactivo");
    });
  }

  if (radioTodos) {
    radioTodos.addEventListener("change", () => {
      if (radioTodos.checked) cargarSensores("todas");
    });
  }

  const form = document.getElementById("formSensor");
  const btnGuardar = document.getElementById("btnGuardarSensor");
  const btnNuevo = document.getElementById("btnNuevoSensor");

  if (btnNuevo) {
    btnNuevo.addEventListener("click", () => {
      limpiarFormularioSensor();
      cargarCuartosSelect();
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      codigo: document.getElementById("codigo").value.trim(),
      nombre: document.getElementById("nombre").value.trim(),
      tipo: document.getElementById("tipo").value.trim(),
      modelo: document.getElementById("modelo").value.trim(),
      fecha_instalacion: document
        .getElementById("fecha_instalacion")
        .value.trim() || null,
      fecha_verificacion: document
        .getElementById("fecha_verificacion")
        .value.trim() || null,
      valor_actual: document.getElementById("valor_actual").value.trim() || null,
      codigo_cuarto: document.getElementById("codigo_cuarto").value.trim(),
      ubicacion: document.getElementById("ubicacion").value.trim(),
      activo: document.getElementById("activo").checked ? 1 : 0,
    };

    if (
      !payload.codigo ||
      !payload.nombre ||
      !payload.tipo ||
      !payload.codigo_cuarto
    ) {
      alert("Código, nombre, tipo y cuarto frío son obligatorios");
      return;
    }

    try {
      const modo = btnGuardar.dataset.modo || "crear";

      if (modo === "crear") {
        await crearSensor(payload);
        alert("Sensor creado correctamente");
      } else {
        const codigoOriginal = btnGuardar.dataset.codigoOriginal;
        await actualizarSensor(codigoOriginal, payload);
        alert("Sensor actualizado correctamente");
      }

      const modalEl = document.getElementById("modalSensor");
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();

      limpiarFormularioSensor();
      await cargarSensores();
    } catch (e) {
      console.error(e);
      alert(e.message || "Error al guardar sensor");
    }
  });
});
