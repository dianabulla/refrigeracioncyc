const API_URL_FINCAS = "../api/finca.php";
const API_URL_EMPRESAS = "../api/empresa.php";

/** Crea una fila de la tabla HTML para una finca */
function crearFilaFinca(item) {
  const tr = document.createElement("tr");
  tr.dataset.id = item.id;
  tr.dataset.codigo = item.codigo || "";

  tr.innerHTML = `
    <td>${item.id ?? "-"}</td>
    <td>${item.codigo || "-"}</td>
    <td>${item.nombre || "-"}</td>
    <td>${item.telefono || "-"}</td>
    <td>${item.direccion || "-"}</td>
    <td>${item.codigo_empresa || "-"}</td>
    <td>${item.activo === 1 ? "Activo" : "Inactivo"}</td>
    <td>
      <button class="btn btn-sm btn-outline-primary me-1"
              onclick="editarFinca('${item.codigo}')">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-sm btn-outline-danger"
              onclick="eliminarFinca('${item.codigo}')">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `;
  return tr;
}

/** 🟢 Cargar fincas */
async function cargarFincas() {
  try {
    const res = await fetch(API_URL_FINCAS);
    const data = await res.json();
    if (!Array.isArray(data)) {
      return;
    }
    const tbody = document.getElementById("tablaFincas");
    tbody.innerHTML = "";
    data.forEach((item) => tbody.appendChild(crearFilaFinca(item)));
  } catch (e) {
    // Error silencioso
  }
}

/** 🟢 Cargar empresas en el select */
async function cargarEmpresasSelect() {
  const select = document.getElementById("codigo_empresa");
  if (!select) return;

  try {
    const res = await fetch(API_URL_EMPRESAS);
    const data = await res.json();
    if (!Array.isArray(data)) return;

    select.innerHTML = '<option value="">Seleccione una empresa...</option>';
    data.forEach((emp) => {
      const opt = document.createElement("option");
      opt.value = emp.codigo;
      opt.textContent = `${emp.codigo} - ${emp.nombre}`;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error("Error al cargar empresas:", e);
  }
}

/** Limpiar formulario */
function limpiarFormularioFinca() {
  document.getElementById("formFinca").reset();
  document.getElementById("activo").checked = true;
  const btn = document.getElementById("btnGuardarFinca");
  btn.dataset.modo = "crear";
  btn.dataset.codigoOriginal = "";
  btn.textContent = "Guardar";
  document.getElementById("modalFincaLabel").innerHTML =
    '<i class="bi bi-plus-circle me-2"></i>Nueva Finca';
  document.getElementById("codigo").disabled = false;
}

/** Llenar formulario para editar */
function llenarFormularioFinca(data) {
  document.getElementById("codigo").value = data.codigo || "";
  document.getElementById("nombre").value = data.nombre || "";
  document.getElementById("telefono").value = data.telefono || "";
  document.getElementById("direccion").value = data.direccion || "";
  document.getElementById("codigo_empresa").value = data.codigo_empresa || "";
  document.getElementById("activo").checked = data.activo === 1;

  const btn = document.getElementById("btnGuardarFinca");
  btn.dataset.modo = "editar";
  btn.dataset.codigoOriginal = data.codigo || "";
  btn.textContent = "Actualizar";
  document.getElementById("modalFincaLabel").innerHTML =
    '<i class="bi bi-pencil me-2"></i>Editar Finca';

  document.getElementById("codigo").disabled = true;
}

/** Crear finca (POST) */
async function crearFinca(payload) {
  const res = await fetch(API_URL_FINCAS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await res.json();
  if (!res.ok || result.error) {
    throw new Error(result.error || "Error al crear finca");
  }
}

/** Actualizar finca (PUT por código) */
async function actualizarFinca(codigoOriginal, payload) {
  payload.codigo = codigoOriginal; // necesario para el WHERE en PHP
  const params = new URLSearchParams(payload);

  const res = await fetch(API_URL_FINCAS, {
    method: "PUT",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const result = await res.json();
  if (!res.ok || result.error) {
    throw new Error(result.error || "Error al actualizar finca");
  }
}

/** Eliminar finca (DELETE por código) */
async function eliminarFinca(codigo) {
  if (!confirm("¿Seguro que deseas eliminar esta finca?")) return;
  try {
    const res = await fetch(
      `${API_URL_FINCAS}?codigo=${encodeURIComponent(codigo)}`,
      { method: "DELETE" }
    );
    const result = await res.json();
    if (!res.ok || result.error) {
      alert(result.error || "Error al eliminar finca");
      return;
    }
    alert("Finca eliminada correctamente");
    await cargarFincas();
  } catch (e) {
    console.error("Error al eliminar finca:", e);
    alert("Error al eliminar finca");
  }
}

/** Editar finca: trae datos y abre modal */
async function editarFinca(codigo) {
  try {
    const res = await fetch(
      `${API_URL_FINCAS}?codigo=${encodeURIComponent(codigo)}`
    );
    const data = await res.json();
    if (!res.ok || data.error) {
      alert(data.error || "No se pudo obtener la finca");
      return;
    }

    await cargarEmpresasSelect();
    llenarFormularioFinca(data);

    const modalEl = document.getElementById("modalFinca");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  } catch (e) {
    console.error("Error al cargar finca:", e);
    alert("Error al cargar datos de la finca");
  }
}

/** Inicialización */
document.addEventListener("DOMContentLoaded", () => {
  cargarFincas();
  cargarEmpresasSelect();

  const form = document.getElementById("formFinca");
  const btnGuardar = document.getElementById("btnGuardarFinca");
  const btnNueva = document.getElementById("btnNuevaFinca");

  if (btnNueva) {
    btnNueva.addEventListener("click", () => {
      limpiarFormularioFinca();
      cargarEmpresasSelect();
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      codigo: document.getElementById("codigo").value.trim(),
      nombre: document.getElementById("nombre").value.trim(),
      telefono: document.getElementById("telefono").value.trim(),
      direccion: document.getElementById("direccion").value.trim(),
      codigo_empresa: document.getElementById("codigo_empresa").value.trim(),
      activo: document.getElementById("activo").checked ? 1 : 0,
    };

    if (!payload.codigo || !payload.nombre || !payload.codigo_empresa) {
      alert("Código, nombre y empresa son obligatorios");
      return;
    }

    try {
      const modo = btnGuardar.dataset.modo || "crear";

      if (modo === "crear") {
        await crearFinca(payload);
        alert("Finca creada correctamente");
      } else {
        const codigoOriginal = btnGuardar.dataset.codigoOriginal;
        await actualizarFinca(codigoOriginal, payload);
        alert("Finca actualizada correctamente");
      }

      const modalEl = document.getElementById("modalFinca");
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();

      limpiarFormularioFinca();
      await cargarFincas();
    } catch (e) {
      console.error(e);
      alert(e.message || "Error al guardar finca");
    }
  });
});
