const API_URL = "../api/empresa.php";

/** Renderizar una fila */
function crearFilaEmpresa(item) {
  const tr = document.createElement("tr");
  tr.dataset.id = item.id;
  tr.dataset.codigo = item.codigo || "";

  tr.innerHTML = `
    <td>${item.id ?? "-"}</td>
    <td>${item.codigo || "-"}</td>
    <td>${item.nombre || "-"}</td>
    <td>${item.nit || "-"}</td>
    <td>${item.telefono || "-"}</td>
    <td>${item.direccion || "-"}</td>
    <td>${item.activo === 1 ? "Activo" : "Inactivo"}</td>
    <td>
      <button class="btn btn-sm btn-outline-primary me-1" 
              onclick="editarEmpresa('${item.codigo}')">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-sm btn-outline-danger" 
              onclick="eliminarEmpresa('${item.codigo}')">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `;
  return tr;
}

/** 🟢 Cargar todas las empresas */
async function cargarEmpresas() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Respuesta inesperada al obtener empresas:", data);
      return;
    }

    const tbody = document.getElementById("tablaEmpresas");
    tbody.innerHTML = "";
    data.forEach((item) => tbody.appendChild(crearFilaEmpresa(item)));
  } catch (e) {
    console.error("Error al cargar empresas:", e);
  }
}

/** Limpiar formulario y estado */
function limpiarFormularioEmpresa() {
  document.getElementById("formEmpresa").reset();
  document.getElementById("activo").checked = true;
  const btn = document.getElementById("btnGuardar");
  btn.dataset.modo = "crear";
  btn.dataset.codigoOriginal = "";
  btn.textContent = "Guardar";
  document.getElementById("tituloModalEmpresa").innerHTML =
    '<i class="bi bi-plus-circle me-2"></i>Registrar Empresa';
  document.getElementById("codigo").disabled = false;
}

/** Llenar formulario para editar */
function llenarFormularioEmpresa(data) {
  document.getElementById("codigo").value = data.codigo || "";
  document.getElementById("nombre").value = data.nombre || "";
  document.getElementById("nit").value = data.nit || "";
  document.getElementById("direccion").value = data.direccion || "";
  document.getElementById("telefono").value = data.telefono || "";
  document.getElementById("activo").checked = data.activo === 1;

  const btn = document.getElementById("btnGuardar");
  btn.dataset.modo = "editar";
  btn.dataset.codigoOriginal = data.codigo || "";
  btn.textContent = "Actualizar";
  document.getElementById("tituloModalEmpresa").innerHTML =
    '<i class="bi bi-pencil me-2"></i>Editar Empresa';

  // No quiero que cambien el código cuando editen
  document.getElementById("codigo").disabled = true;
}

/** 🟡 Crear empresa (POST) */
async function crearEmpresa(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await res.json();
  if (!res.ok || result.error) {
    throw new Error(result.error || "Error al crear empresa");
  }
}

/** 🟠 Actualizar empresa (PUT por codigo) */
async function actualizarEmpresa(codigoOriginal, payload) {
  // el PHP espera application/x-www-form-urlencoded
  payload.codigo = codigoOriginal; // codigo para el WHERE
  const params = new URLSearchParams(payload);

  const res = await fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const result = await res.json();
  if (!res.ok || result.error) {
    throw new Error(result.error || "Error al actualizar empresa");
  }
}

/** 🔵 Eliminar empresa (DELETE por codigo) */
async function eliminarEmpresa(codigo) {
  if (!confirm("¿Seguro que deseas eliminar esta empresa?")) return;
  try {
    const res = await fetch(`${API_URL}?codigo=${encodeURIComponent(codigo)}`, {
      method: "DELETE",
    });
    const result = await res.json();
    if (!res.ok || result.error) {
      alert(result.error || "Error al eliminar empresa");
      return;
    }
    alert("Empresa eliminada correctamente");
    await cargarEmpresas();
  } catch (e) {
    console.error("Error al eliminar empresa:", e);
    alert("Error al eliminar empresa");
  }
}

/** 🟣 Editar empresa: abrir modal y cargar datos */
async function editarEmpresa(codigo) {
  try {
    const res = await fetch(
      `${API_URL}?codigo=${encodeURIComponent(codigo)}`
    );
    const data = await res.json();

    if (!res.ok || data.error) {
      alert(data.error || "No se pudo obtener la empresa");
      return;
    }

    llenarFormularioEmpresa(data);

    const modalEl = document.getElementById("modalEmpresa");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  } catch (e) {
    console.error("Error al cargar empresa:", e);
    alert("Error al cargar datos de la empresa");
  }
}

/** 🧾 Manejar submit del formulario (crear / editar) */
document.addEventListener("DOMContentLoaded", () => {
  cargarEmpresas();

  const form = document.getElementById("formEmpresa");
  const btnGuardar = document.getElementById("btnGuardar");
  const btnNueva = document.getElementById("btnNuevaEmpresa");

  // Cuando abro el modal desde "Nueva Empresa", limpio el form
  if (btnNueva) {
    btnNueva.addEventListener("click", () => {
      limpiarFormularioEmpresa();
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      codigo: document.getElementById("codigo").value.trim(),
      nombre: document.getElementById("nombre").value.trim(),
      nit: document.getElementById("nit").value.trim(),
      direccion: document.getElementById("direccion").value.trim(),
      telefono: document.getElementById("telefono").value.trim(),
      activo: document.getElementById("activo").checked ? 1 : 0,
    };

    if (!payload.codigo || !payload.nombre) {
      alert("Código y nombre son obligatorios");
      return;
    }

    try {
      const modo = btnGuardar.dataset.modo || "crear";

      if (modo === "crear") {
        await crearEmpresa(payload);
        alert("Empresa creada correctamente");
      } else {
        const codigoOriginal = btnGuardar.dataset.codigoOriginal;
        await actualizarEmpresa(codigoOriginal, payload);
        alert("Empresa actualizada correctamente");
      }

      const modalEl = document.getElementById("modalEmpresa");
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();

      limpiarFormularioEmpresa();
      await cargarEmpresas();
    } catch (e) {
      console.error(e);
      alert(e.message || "Error al guardar empresa");
    }
  });
});
