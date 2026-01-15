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
    'exterior': 'bg-info',        // Azul claro
    'interior': 'bg-primary',     // Azul oscuro
    'tuberia': 'bg-green-fresh',  // Verde pastel
    'otro': 'bg-gray-light'       // Gris claro
  };
  
  const badgeColor = coloresUbicacion[item.ubicacion] || 'bg-info';

  tr.innerHTML = `
    <td>${item.id ?? "-"}</td>
    <td>${item.codigo || "-"}</td>
    <td>${item.nombre || "-"}</td>
    <td>${item.tipo || "-"}</td>
    <td>${item.modelo || "-"}</td>
    <td><span class="badge ${badgeColor}">${item.ubicacion || "exterior"}</span></td>
    <td>${fechaInst || "-"}</td>
    <td>${fechaVerif || "-"}</td>
    <td>${item.valor_actual || "-"}</td>
    <td>${item.codigo_cuarto || "-"}</td>
    <td>${item.activo == 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
    <td>
      <button class="btn btn-sm btn-outline-primary me-1"
              onclick="editarSensor('${item.codigo}')">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-sm btn-outline-danger"
              onclick="eliminarSensor('${item.codigo}')">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `;
  return tr;
}

/** 🟢 Cargar sensores */
async function cargarSensores() {
  try {
    const res = await fetch(API_URL_SENSORES);
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Error al obtener sensores:", data);
      return;
    }

    const tbody = document.getElementById("tablaSensores");
    tbody.innerHTML = "";
    data.forEach((item) => tbody.appendChild(crearFilaSensor(item)));
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
  cargarSensores();
  cargarCuartosSelect();

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
