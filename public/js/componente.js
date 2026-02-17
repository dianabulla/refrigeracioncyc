const API_COMPONENTES = "../api/componente.php";
const API_CUARTOS = "../api/cuarto_frio.php";

document.addEventListener("DOMContentLoaded", () => {
    // Cargar con filtro activo por defecto
    cargarComponentes("activo");
    cargarCuartos();

    // Event listeners para filtros
    const radioActivos = document.getElementById("radioActivosComponente");
    const radioInactivos = document.getElementById("radioInactivosComponente");
    const radioTodos = document.getElementById("radioTodosComponente");

    if (radioActivos) {
        radioActivos.addEventListener("change", () => {
            if (radioActivos.checked) cargarComponentes("activo");
        });
    }

    if (radioInactivos) {
        radioInactivos.addEventListener("change", () => {
            if (radioInactivos.checked) cargarComponentes("inactivo");
        });
    }

    if (radioTodos) {
        radioTodos.addEventListener("change", () => {
            if (radioTodos.checked) cargarComponentes("todas");
        });
    }
});

// =========================================
// CARGAR COMPONENTES CON FILTRO
// =========================================
async function cargarComponentes(filtroEstado = "activo") {
    try {
        const res = await fetch(API_COMPONENTES);
        const componentes = await res.json();
        
        const tbody = document.getElementById("tablaComponentes");
        const msgVacio = document.getElementById("mensajeVacio");
        
        tbody.innerHTML = "";
        
        if (!componentes || componentes.length === 0) {
            msgVacio.style.display = "block";
            return;
        }
        
        // Aplicar filtro
        let dataFiltrada = componentes;
        if (filtroEstado === "activo") {
            dataFiltrada = componentes.filter(item => Number(item.activo) === 1);
        } else if (filtroEstado === "inactivo") {
            dataFiltrada = componentes.filter(item => Number(item.activo) === 0);
        }
        // Si es "todas" no se filtra
        
        if (dataFiltrada.length === 0) {
            msgVacio.style.display = "block";
            return;
        }
        
        msgVacio.style.display = "none";
        
        dataFiltrada.forEach(comp => {
            const tr = document.createElement("tr");
            
            // Columna Código
            const tdCodigo = document.createElement("td");
            const strongCodigo = document.createElement("strong");
            strongCodigo.textContent = comp.codigo;
            tdCodigo.appendChild(strongCodigo);
            tr.appendChild(tdCodigo);
            
            // Columna Nombre
            const tdNombre = document.createElement("td");
            tdNombre.textContent = comp.nombre;
            tr.appendChild(tdNombre);
            
            // Columna Tipo
            const tdTipo = document.createElement("td");
            tdTipo.className = "d-none d-md-table-cell";
            tdTipo.textContent = comp.tipo ?? "-";
            tr.appendChild(tdTipo);
            
            // Columna Cuarto
            const tdCuarto = document.createElement("td");
            tdCuarto.className = "d-none d-md-table-cell";
            tdCuarto.textContent = comp.codigo_cuarto ?? "-";
            tr.appendChild(tdCuarto);
            
            // Columna Descripción
            const tdDesc = document.createElement("td");
            tdDesc.className = "d-none d-lg-table-cell";
            tdDesc.textContent = comp.descripcion ? comp.descripcion.substring(0, 50) + "..." : "-";
            tr.appendChild(tdDesc);
            
            // Columna Opciones
            const tdOpciones = document.createElement("td");
            tdOpciones.className = "text-center";
            
            // Botón Ver
            const btnVer = document.createElement("button");
            btnVer.className = "btn btn-sm btn-info me-1";
            btnVer.title = "Ver";
            btnVer.innerHTML = '<i class="bi bi-eye"></i>';
            btnVer.onclick = function() { verDetallesComponente(comp.id); };
            tdOpciones.appendChild(btnVer);
            
            // Botón Editar
            const btnEditar = document.createElement("button");
            btnEditar.className = "btn btn-sm btn-warning me-1";
            btnEditar.title = "Editar";
            btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
            btnEditar.onclick = function() { editar(comp.id); };
            tdOpciones.appendChild(btnEditar);
            
            // Botón Eliminar
            const btnEliminar = document.createElement("button");
            btnEliminar.className = "btn btn-sm btn-danger";
            btnEliminar.title = "Eliminar";
            btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
            btnEliminar.onclick = function() { eliminar(comp.id); };
            tdOpciones.appendChild(btnEliminar);
            
            tr.appendChild(tdOpciones);
            tbody.appendChild(tr);
        });
        
    } catch (err) {
        console.error("Error al cargar componentes:", err);
        alert("Error al cargar componentes");
    }
}

// =========================================
// CARGAR CUARTOS FRÍOS EN SELECT
// =========================================
async function cargarCuartos() {
    try {
        const res = await fetch(API_CUARTOS);
        const cuartos = await res.json();
        
        const select = document.getElementById("codigo_cuarto");
        select.innerHTML = '<option value="">Seleccionar cuarto...</option>';
        
        if (!cuartos || cuartos.length === 0) {
            const option = document.createElement("option");
            option.disabled = true;
            option.textContent = "⚠️ No hay cuartos fríos creados";
            select.appendChild(option);
            select.disabled = true;
            return;
        }
        
        select.disabled = false;
        cuartos.forEach(cuarto => {
            const option = document.createElement("option");
            option.value = cuarto.codigo;
            option.textContent = `${cuarto.nombre} (${cuarto.codigo})`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Error al cargar cuartos:", err);
    }
}

// =========================================
// ABRIR MODAL CREAR
// =========================================
function abrirModalCrear() {
    document.getElementById("formComponente").reset();
    document.getElementById("codigo").disabled = false;
    document.getElementById("btnGuardar").onclick = crear;
    document.getElementById("tituloModal").textContent = "Registrar Componente";
    
    new bootstrap.Modal(document.getElementById("modalComponente")).show();
}

// =========================================
// CREAR
// =========================================
async function crear() {
    const data = obtenerDatosForm();
    
    // Validar campos requeridos
    if (!data.codigo) {
        return alert("⚠️ El código es obligatorio");
    }
    if (!data.nombre) {
        return alert("⚠️ El nombre es obligatorio");
    }
    if (!data.codigo_cuarto) {
        return alert("⚠️ Debe seleccionar un Cuarto Frío");
    }
    
    try {
        const res = await fetch(API_COMPONENTES, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        });
        
        const json = await res.json();
        
        if (!json.ok) {
            return alert("❌ Error: " + (json.error || "No se pudo crear"));
        }
        
        bootstrap.Modal.getInstance(document.getElementById("modalComponente")).hide();
        cargarComponentes("activo");
        alert("✅ Componente creado exitosamente");
    } catch (err) {
        console.error("Error:", err);
        alert("Error al crear componente");
    }
}

// =========================================
// VER DETALLES DEL COMPONENTE
// =========================================
async function verDetallesComponente(id) {
    try {
        const res = await fetch(`${API_COMPONENTES}?id=${id}`);
        const comp = await res.json();
        
        if (!comp || comp.error) {
            return alert("❌ Componente no encontrado");
        }
        
        // Llenar modal de visualización
        document.getElementById("verCodigoComponente").value = comp.codigo || "";
        document.getElementById("verNombreComponente").value = comp.nombre || "";
        document.getElementById("verTipoComponente").value = comp.tipo || "";
        document.getElementById("verCuartoComponente").value = comp.codigo_cuarto || "";
        document.getElementById("verDescripcionComponente").value = comp.descripcion || "";
        document.getElementById("verEstadoComponente").value = Number(comp.activo) === 1 ? "Activo" : "Inactivo";
        
        const modalEl = document.getElementById("modalVerComponente");
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    } catch (err) {
        console.error("Error:", err);
        alert("Error al cargar componente");
    }
}

// =========================================
// EDITAR
// =========================================
async function editar(id) {
    try {
        const res = await fetch(`${API_COMPONENTES}?id=${id}`);
        const comp = await res.json();
        
        if (!comp || comp.error) {
            return alert("❌ Componente no encontrado");
        }
        
        // Llenar formulario
        document.getElementById("codigo").value = comp.codigo;
        document.getElementById("codigo").disabled = true;
        document.getElementById("nombre").value = comp.nombre;
        document.getElementById("tipo").value = comp.tipo ?? "";
        document.getElementById("codigo_cuarto").value = comp.codigo_cuarto ?? "";
        document.getElementById("descripcion").value = comp.descripcion ?? "";
        
        document.getElementById("btnGuardar").onclick = () => actualizar(comp.id);
        document.getElementById("tituloModal").textContent = "Editar Componente";
        
        new bootstrap.Modal(document.getElementById("modalComponente")).show();
    } catch (err) {
        console.error("Error:", err);
        alert("Error al cargar componente");
    }
}

// =========================================
// ACTUALIZAR
// =========================================
async function actualizar(id) {
    const data = obtenerDatosForm();
    
    if (!data.nombre) {
        return alert("⚠️ El nombre es obligatorio");
    }
    if (!data.codigo_cuarto) {
        return alert("⚠️ Debe seleccionar un Cuarto Frío");
    }
    
    try {
        const res = await fetch(`${API_COMPONENTES}?id=${id}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        });
        
        const json = await res.json();
        
        if (!json.ok) {
            return alert("❌ Error: " + (json.error || "No se pudo actualizar"));
        }
        
        bootstrap.Modal.getInstance(document.getElementById("modalComponente")).hide();
        cargarComponentes("activo");
        alert("✅ Componente actualizado exitosamente");
    } catch (err) {
        console.error("Error:", err);
        alert("Error al actualizar componente");
    }
}

// =========================================
// ELIMINAR
// =========================================
async function eliminar(id) {
    if (!confirm("¿Está seguro de que desea eliminar este componente?")) {
        return;
    }
    
    try {
        const res = await fetch(`${API_COMPONENTES}?id=${id}`, {
            method: "DELETE"
        });
        
        const json = await res.json();
        
        if (!json.ok) {
            return alert("❌ Error: " + (json.error || "No se pudo eliminar"));
        }
        
        cargarComponentes("activo");
        alert("✅ Componente eliminado exitosamente");
    } catch (err) {
        console.error("Error:", err);
        alert("Error al eliminar componente");
    }
}

// =========================================
// OBTENER DATOS DEL FORMULARIO
// =========================================
function obtenerDatosForm() {
    return {
        codigo: document.getElementById("codigo").value.trim(),
        nombre: document.getElementById("nombre").value.trim(),
        tipo: document.getElementById("tipo").value.trim() || null,
        codigo_cuarto: document.getElementById("codigo_cuarto").value.trim() || null,
        descripcion: document.getElementById("descripcion").value.trim() || null
    };
}
