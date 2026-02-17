const API_URL = "../api/empresa.php";

// Renderizar una fila
function crearFilaEmpresa(item) {
  const tr = document.createElement("tr");
  tr.dataset.id = item.id;
  tr.dataset.codigo = item.codigo || "";

  // Clase para empresas inactivas
  if (item.activo !== 1) {
    tr.classList.add("table-secondary", "text-muted");
  }

  // Columnas
  const tdId = document.createElement("td");
  tdId.className = "d-none d-md-table-cell";
  tdId.textContent = item.id || "-";
  
  const tdCodigo = document.createElement("td");
  tdCodigo.className = "d-none d-lg-table-cell";
  tdCodigo.textContent = item.codigo || "-";
  
  const tdNombre = document.createElement("td");
  tdNombre.textContent = item.nombre || "-";
  
  const tdNit = document.createElement("td");
  tdNit.className = "d-none d-lg-table-cell";
  tdNit.textContent = item.nit || "-";
  
  const tdTelefono = document.createElement("td");
  tdTelefono.className = "d-none d-md-table-cell";
  tdTelefono.textContent = item.telefono || "-";
  
  const tdDireccion = document.createElement("td");
  tdDireccion.className = "d-none d-lg-table-cell";
  tdDireccion.textContent = item.direccion || "-";
  
  const tdEstado = document.createElement("td");
  if (item.activo === 1) {
    tdEstado.innerHTML = '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Activo</span>';
  } else {
    tdEstado.innerHTML = '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Inactivo</span>';
  }
  
  // Columna de acciones
  const tdAcciones = document.createElement("td");
  
  const btnVer = document.createElement("button");
  btnVer.className = "btn btn-sm btn-outline-info me-1";
  btnVer.title = "Ver detalles";
  btnVer.innerHTML = '<i class="bi bi-eye"></i>';
  btnVer.onclick = function() { verDetallesEmpresa(item.codigo); };
  
  const btnEditar = document.createElement("button");
  btnEditar.className = "btn btn-sm btn-outline-primary me-1";
  btnEditar.title = "Editar";
  btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
  btnEditar.onclick = function() { editarEmpresa(item.codigo); };
  
  const btnEliminar = document.createElement("button");
  btnEliminar.className = "btn btn-sm btn-outline-danger";
  btnEliminar.title = "Eliminar";
  btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
  btnEliminar.onclick = function() { eliminarEmpresa(item.codigo); };
  
  tdAcciones.appendChild(btnVer);
  tdAcciones.appendChild(btnEditar);
  tdAcciones.appendChild(btnEliminar);
  
  // Agregar todas las columnas
  tr.appendChild(tdId);
  tr.appendChild(tdCodigo);
  tr.appendChild(tdNombre);
  tr.appendChild(tdNit);
  tr.appendChild(tdTelefono);
  tr.appendChild(tdDireccion);
  tr.appendChild(tdEstado);
  tr.appendChild(tdAcciones);
  
  return tr;
}

// Cargar todas las empresas con filtro opcional
async function cargarEmpresas(filtroEstado) {
  if (!filtroEstado) filtroEstado = "activo";
  
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Respuesta inesperada al obtener empresas:", data);
      return;
    }

    console.log("Total empresas recibidas:", data.length);
    console.log("Filtro aplicado:", filtroEstado);

    // Aplicar filtro - normalizar valores a number
    let empresasFiltradas = data;
    if (filtroEstado === "activo") {
      empresasFiltradas = data.filter(function(e) { 
        return Number(e.activo) === 1 || e.activo === "1" || e.activo === true;
      });
    } else if (filtroEstado === "inactivo") {
      empresasFiltradas = data.filter(function(e) { 
        return Number(e.activo) === 0 || e.activo === "0" || e.activo === false || e.activo === null;
      });
    }

    console.log("Empresas después del filtro:", empresasFiltradas.length);

    const tbody = document.getElementById("tablaEmpresas");
    tbody.innerHTML = "";
    
    if (empresasFiltradas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted"><i class="bi bi-inbox"></i> No se encontraron empresas</td></tr>';
      return;
    }
    
    empresasFiltradas.forEach(function(item) { 
      tbody.appendChild(crearFilaEmpresa(item)); 
    });
  } catch (e) {
    console.error("Error al cargar empresas:", e);
  }
}

// Limpiar formulario y estado
function limpiarFormularioEmpresa() {
  document.getElementById("formEmpresa").reset();
  document.getElementById("activo").checked = true;
  const btn = document.getElementById("btnGuardar");
  btn.dataset.modo = "crear";
  btn.dataset.codigoOriginal = "";
  btn.textContent = "Guardar";
  document.getElementById("tituloModalEmpresa").innerHTML = '<i class="bi bi-plus-circle me-2"></i>Registrar Empresa';
  document.getElementById("codigo").disabled = false;
}

// Llenar formulario para editar
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
  document.getElementById("tituloModalEmpresa").innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Empresa';
  document.getElementById("codigo").disabled = true;
}

// Crear empresa (POST)
async function crearEmpresa(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await res.json();
  if (!res.ok || result.error) {
    throw new Error(result.error || "Error al crear empresa");
  }
}

// Actualizar empresa (PUT por codigo)
async function actualizarEmpresa(codigoOriginal, payload) {
  payload.codigo = codigoOriginal;
  const params = new URLSearchParams(payload);

  const res = await fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
  const result = await res.json();
  if (!res.ok || result.error) {
    throw new Error(result.error || "Error al actualizar empresa");
  }
}

// Eliminar empresa (DELETE por codigo)
async function eliminarEmpresa(codigo) {
  if (!confirm("¿Seguro que deseas eliminar esta empresa?")) return;
  try {
    const res = await fetch(API_URL + "?codigo=" + encodeURIComponent(codigo), {
      method: "DELETE"
    });
    const result = await res.json();
    if (!res.ok || result.error) {
      alert(result.error || "Error al eliminar empresa");
      return;
    }
    alert("Empresa eliminada correctamente");
    
    const filtroActual = document.querySelector('input[name="estadoEmpresa"]:checked');
    const filtro = filtroActual ? filtroActual.value : "activo";
    await cargarEmpresas(filtro);
  } catch (e) {
    console.error("Error al eliminar empresa:", e);
    alert("Error al eliminar empresa");
  }
}

// Editar empresa: abrir modal y cargar datos
async function editarEmpresa(codigo) {
  try {
    const res = await fetch(API_URL + "?codigo=" + encodeURIComponent(codigo));
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

// Ver detalles de empresa: abrir modal de solo lectura
async function verDetallesEmpresa(codigo) {
  try {
    const res = await fetch(API_URL + "?codigo=" + encodeURIComponent(codigo));
    const data = await res.json();

    if (!res.ok || data.error) {
      alert(data.error || "No se pudo obtener la empresa");
      return;
    }

    document.getElementById("verCodigo").textContent = data.codigo || "-";
    document.getElementById("verNombre").textContent = data.nombre || "-";
    document.getElementById("verNit").textContent = data.nit || "-";
    document.getElementById("verDireccion").textContent = data.direccion || "-";
    document.getElementById("verTelefono").textContent = data.telefono || "-";
    
    const estadoElem = document.getElementById("verEstado");
    if (data.activo === 1) {
      estadoElem.innerHTML = '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Activo</span>';
    } else {
      estadoElem.innerHTML = '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Inactivo</span>';
    }

    const modalEl = document.getElementById("modalVerEmpresa");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  } catch (e) {
    console.error("Error al cargar empresa:", e);
    alert("Error al cargar datos de la empresa");
  }
}

// Manejar submit del formulario (crear / editar)
document.addEventListener("DOMContentLoaded", function() {
  cargarEmpresas("activo");

  const form = document.getElementById("formEmpresa");
  const btnGuardar = document.getElementById("btnGuardar");
  const btnNueva = document.getElementById("btnNuevaEmpresa");

  // Listeners para los filtros de estado
  const radiosEstado = document.querySelectorAll('input[name="estadoEmpresa"]');
  radiosEstado.forEach(function(radio) {
    radio.addEventListener("change", function(e) {
      const filtro = e.target.value;
      cargarEmpresas(filtro);
    });
  });

  // Cuando abro el modal desde "Nueva Empresa", limpio el form
  if (btnNueva) {
    btnNueva.addEventListener("click", function() {
      limpiarFormularioEmpresa();
    });
  }

  form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const payload = {
      codigo: document.getElementById("codigo").value.trim(),
      nombre: document.getElementById("nombre").value.trim(),
      nit: document.getElementById("nit").value.trim(),
      direccion: document.getElementById("direccion").value.trim(),
      telefono: document.getElementById("telefono").value.trim(),
      activo: document.getElementById("activo").checked ? 1 : 0
    };

    console.log("Guardando empresa con payload:", payload);

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
      
      const filtroActual = document.querySelector('input[name="estadoEmpresa"]:checked');
      const filtro = filtroActual ? filtroActual.value : "activo";
      await cargarEmpresas(filtro);
    } catch (e) {
      console.error(e);
      alert(e.message || "Error al guardar empresa");
    }
  });
});
