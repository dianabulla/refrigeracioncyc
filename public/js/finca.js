const API_URL_FINCAS = "../api/finca.php";
const API_URL_EMPRESAS = "../api/empresa.php";

// Crea una fila de la tabla HTML para una finca
function crearFilaFinca(item) {
  const tr = document.createElement("tr");
  tr.dataset.id = item.id;
  tr.dataset.codigo = item.codigo || "";

  if (item.activo !== 1) {
    tr.classList.add("table-secondary", "text-muted");
  }

  const tdId = document.createElement("td");
  tdId.className = "d-none d-md-table-cell";
  tdId.textContent = item.id || "-";
  
  const tdCodigo = document.createElement("td");
  tdCodigo.textContent = item.codigo || "-";
  
  const tdNombre = document.createElement("td");
  tdNombre.textContent = item.nombre || "-";
  
  const tdTelefono = document.createElement("td");
  tdTelefono.className = "d-none d-lg-table-cell";
  tdTelefono.textContent = item.telefono || "-";
  
  const tdDireccion = document.createElement("td");
  tdDireccion.className = "d-none d-md-table-cell";
  tdDireccion.textContent = item.direccion || "-";
  
  const tdEmpresa = document.createElement("td");
  tdEmpresa.className = "d-none d-md-table-cell";
  tdEmpresa.textContent = item.codigo_empresa || "-";
  
  const tdEstado = document.createElement("td");
  if (item.activo === 1) {
    tdEstado.innerHTML = '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Activo</span>';
  } else {
    tdEstado.innerHTML = '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Inactivo</span>';
  }
  
  const tdAcciones = document.createElement("td");
  
  const btnVer = document.createElement("button");
  btnVer.className = "btn btn-sm btn-outline-info me-1";
  btnVer.title = "Ver detalles";
  btnVer.innerHTML = '<i class="bi bi-eye"></i>';
  btnVer.onclick = function() { verDetallesFinca(item.codigo); };
  
  const btnEditar = document.createElement("button");
  btnEditar.className = "btn btn-sm btn-outline-primary me-1";
  btnEditar.title = "Editar";
  btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
  btnEditar.onclick = function() { editarFinca(item.codigo); };
  
  const btnEliminar = document.createElement("button");
  btnEliminar.className = "btn btn-sm btn-outline-danger";
  btnEliminar.title = "Eliminar";
  btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
  btnEliminar.onclick = function() { eliminarFinca(item.codigo); };
  
  tdAcciones.appendChild(btnVer);
  tdAcciones.appendChild(btnEditar);
  tdAcciones.appendChild(btnEliminar);
  
  tr.appendChild(tdId);
  tr.appendChild(tdCodigo);
  tr.appendChild(tdNombre);
  tr.appendChild(tdTelefono);
  tr.appendChild(tdDireccion);
  tr.appendChild(tdEmpresa);
  tr.appendChild(tdEstado);
  tr.appendChild(tdAcciones);
  
  return tr;
}

// Cargar fincas con filtro opcional
async function cargarFincas(filtroEstado) {
  if (!filtroEstado) filtroEstado = "activo";
  
  try {
    const res = await fetch(API_URL_FINCAS);
    const data = await res.json();

    if (!Array.isArray(data)) {
      return;
    }

    let fincasFiltradas = data;
    if (filtroEstado === "activo") {
      fincasFiltradas = data.filter(function(e) { 
        return Number(e.activo) === 1 || e.activo === "1" || e.activo === true;
      });
    } else if (filtroEstado === "inactivo") {
      fincasFiltradas = data.filter(function(e) { 
        return Number(e.activo) === 0 || e.activo === "0" || e.activo === false || e.activo === null;
      });
    }

    const tbody = document.getElementById("tablaFincas");
    tbody.innerHTML = "";
    
    if (fincasFiltradas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted"><i class="bi bi-inbox"></i> No se encontraron fincas</td></tr>';
      return;
    }
    
    fincasFiltradas.forEach(function(item) { 
      tbody.appendChild(crearFilaFinca(item)); 
    });
  } catch (e) {
    console.error("Error al cargar fincas:", e);
  }
}

// Cargar empresas en el select
async function cargarEmpresasSelect() {
  const select = document.getElementById("codigo_empresa");
  if (!select) return;

  try {
    const res = await fetch(API_URL_EMPRESAS);
    const data = await res.json();
    if (!Array.isArray(data)) return;

    select.innerHTML = '<option value="">Seleccione una empresa...</option>';
    data.forEach(function(emp) {
      const opt = document.createElement("option");
      opt.value = emp.codigo;
      opt.textContent = emp.codigo + " - " + emp.nombre;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error("Error al cargar empresas:", e);
  }
}

// Limpiar formulario
function limpiarFormularioFinca() {
  document.getElementById("formFinca").reset();
  document.getElementById("activo").checked = true;
  const btn = document.getElementById("btnGuardarFinca");
  btn.dataset.modo = "crear";
  btn.dataset.codigoOriginal = "";
  btn.textContent = "Guardar";
  document.getElementById("modalFincaLabel").innerHTML = '<i class="bi bi-plus-circle me-2"></i>Nueva Finca';
  document.getElementById("codigo").disabled = false;
}

// Llenar formulario para editar
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
  document.getElementById("modalFincaLabel").innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Finca';
  document.getElementById("codigo").disabled = true;
}

// Crear finca (POST)
async function crearFinca(payload) {
  const res = await fetch(API_URL_FINCAS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await res.json();
  if (!res.ok || result.error) {
    throw new Error(result.error || "Error al crear finca");
  }
}

// Actualizar finca (PUT por código)
async function actualizarFinca(codigoOriginal, payload) {
  payload.codigo = codigoOriginal;
  const params = new URLSearchParams(payload);

  const res = await fetch(API_URL_FINCAS, {
    method: "PUT",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
  const result = await res.json();
  if (!res.ok || result.error) {
    throw new Error(result.error || "Error al actualizar finca");
  }
}

// Eliminar finca (DELETE por código)
async function eliminarFinca(codigo) {
  if (!confirm("¿Seguro que deseas eliminar esta finca?")) return;
  try {
    const res = await fetch(API_URL_FINCAS + "?codigo=" + encodeURIComponent(codigo), {
      method: "DELETE"
    });
    const result = await res.json();
    if (!res.ok || result.error) {
      alert(result.error || "Error al eliminar finca");
      return;
    }
    alert("Finca eliminada correctamente");
    
    const filtroActual = document.querySelector('input[name="estadoFinca"]:checked');
    const filtro = filtroActual ? filtroActual.value : "activo";
    await cargarFincas(filtro);
  } catch (e) {
    console.error("Error al eliminar finca:", e);
    alert("Error al eliminar finca");
  }
}

// Editar finca: trae datos y abre modal
async function editarFinca(codigo) {
  try {
    const res = await fetch(API_URL_FINCAS + "?codigo=" + encodeURIComponent(codigo));
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

// Ver detalles de finca: abrir modal de solo lectura
async function verDetallesFinca(codigo) {
  try {
    const res = await fetch(API_URL_FINCAS + "?codigo=" + encodeURIComponent(codigo));
    const data = await res.json();

    if (!res.ok || data.error) {
      alert(data.error || "No se pudo obtener la finca");
      return;
    }

    document.getElementById("verCodigoFinca").textContent = data.codigo || "-";
    document.getElementById("verNombreFinca").textContent = data.nombre || "-";
    document.getElementById("verTelefonoFinca").textContent = data.telefono || "-";
    document.getElementById("verDireccionFinca").textContent = data.direccion || "-";
    document.getElementById("verEmpresaFinca").textContent = data.codigo_empresa || "-";
    
    const estadoElem = document.getElementById("verEstadoFinca");
    if (data.activo === 1) {
      estadoElem.innerHTML = '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Activo</span>';
    } else {
      estadoElem.innerHTML = '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Inactivo</span>';
    }

    const modalEl = document.getElementById("modalVerFinca");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  } catch (e) {
    console.error("Error al cargar finca:", e);
    alert("Error al cargar datos de la finca");
  }
}

// Inicialización
document.addEventListener("DOMContentLoaded", function() {
  cargarFincas("activo");
  cargarEmpresasSelect();

  const form = document.getElementById("formFinca");
  const btnGuardar = document.getElementById("btnGuardarFinca");
  const btnNueva = document.getElementById("btnNuevaFinca");

  // Listeners para los filtros de estado
  const radiosEstado = document.querySelectorAll('input[name="estadoFinca"]');
  radiosEstado.forEach(function(radio) {
    radio.addEventListener("change", function(e) {
      const filtro = e.target.value;
      cargarFincas(filtro);
    });
  });

  if (btnNueva) {
    btnNueva.addEventListener("click", function() {
      limpiarFormularioFinca();
      cargarEmpresasSelect();
    });
  }

  form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const payload = {
      codigo: document.getElementById("codigo").value.trim(),
      nombre: document.getElementById("nombre").value.trim(),
      telefono: document.getElementById("telefono").value.trim(),
      direccion: document.getElementById("direccion").value.trim(),
      codigo_empresa: document.getElementById("codigo_empresa").value.trim(),
      activo: document.getElementById("activo").checked ? 1 : 0
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
      
      const filtroActual = document.querySelector('input[name="estadoFinca"]:checked');
      const filtro = filtroActual ? filtroActual.value : "activo";
      await cargarFincas(filtro);
    } catch (e) {
      console.error(e);
      alert(e.message || "Error al guardar finca");
    }
  });
});
