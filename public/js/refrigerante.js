const API_REFRIGERANTES = "../api/refrigerante.php";

document.addEventListener("DOMContentLoaded", () => {
    // Cargar con filtro activo por defecto
    cargarRefrigerantes("activo");

    // Event listeners para filtros
    const radioActivos = document.getElementById("radioActivosRefrigerante");
    const radioInactivos = document.getElementById("radioInactivosRefrigerante");
    const radioTodos = document.getElementById("radioTodosRefrigerante");

    if (radioActivos) {
        radioActivos.addEventListener("change", () => {
            if (radioActivos.checked) cargarRefrigerantes("activo");
        });
    }

    if (radioInactivos) {
        radioInactivos.addEventListener("change", () => {
            if (radioInactivos.checked) cargarRefrigerantes("inactivo");
        });
    }

    if (radioTodos) {
        radioTodos.addEventListener("change", () => {
            if (radioTodos.checked) cargarRefrigerantes("todas");
        });
    }
});

async function cargarRefrigerantes(filtroEstado = "activo") {
    try {
        const res = await fetch(API_REFRIGERANTES);
        const refrigerantes = await res.json();

        const tbody = document.getElementById("tablaRefrigerantes");
        const msgVacio = document.getElementById("mensajeVacio");

        tbody.innerHTML = "";

        if (!Array.isArray(refrigerantes) || refrigerantes.length === 0) {
            msgVacio.style.display = "block";
            return;
        }

        // Aplicar filtro
        let dataFiltrada = refrigerantes;
        if (filtroEstado === "activo") {
            dataFiltrada = refrigerantes.filter(item => Number(item.activo) === 1);
        } else if (filtroEstado === "inactivo") {
            dataFiltrada = refrigerantes.filter(item => Number(item.activo) === 0);
        }
        // Si es "todas" no se filtra

        if (dataFiltrada.length === 0) {
            msgVacio.style.display = "block";
            return;
        }

        msgVacio.style.display = "none";

        dataFiltrada.forEach((item) => {
            const tr = document.createElement("tr");
            
            // Columna Código
            const tdCodigo = document.createElement("td");
            const strongCodigo = document.createElement("strong");
            strongCodigo.textContent = item.codigo || "-";
            tdCodigo.appendChild(strongCodigo);
            tr.appendChild(tdCodigo);
            
            // Columna Refrigerante/Temperatura
            const tdRefTemp = document.createElement("td");
            tdRefTemp.textContent = item.refrigerante_temperatura || "-";
            tr.appendChild(tdRefTemp);
            
            // Columna Referencia
            const tdRef = document.createElement("td");
            tdRef.textContent = item.referencia || "-";
            tr.appendChild(tdRef);
            
            // Columna Opciones
            const tdOpciones = document.createElement("td");
            tdOpciones.className = "text-center";
            
            // Botón Ver
            const btnVer = document.createElement("button");
            btnVer.className = "btn btn-sm btn-info me-1";
            btnVer.title = "Ver";
            btnVer.innerHTML = '<i class="bi bi-eye"></i>';
            btnVer.onclick = function() { verDetallesRefrigerante(item.id); };
            tdOpciones.appendChild(btnVer);
            
            // Botón Editar
            const btnEditar = document.createElement("button");
            btnEditar.className = "btn btn-sm btn-warning me-1";
            btnEditar.title = "Editar";
            btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
            btnEditar.onclick = function() { editar(item.id); };
            tdOpciones.appendChild(btnEditar);
            
            // Botón Eliminar
            const btnEliminar = document.createElement("button");
            btnEliminar.className = "btn btn-sm btn-danger";
            btnEliminar.title = "Eliminar";
            btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
            btnEliminar.onclick = function() { eliminar(item.id); };
            tdOpciones.appendChild(btnEliminar);
            
            tr.appendChild(tdOpciones);
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error al cargar refrigerantes:", err);
        alert("Error al cargar refrigerantes");
    }
}

function abrirModalCrear() {
    document.getElementById("formRefrigerante").reset();
    document.getElementById("codigo").disabled = false;
    document.getElementById("btnGuardar").onclick = crear;
    document.getElementById("tituloModal").textContent = "Registrar Refrigerante";

    new bootstrap.Modal(document.getElementById("modalRefrigerante")).show();
}

async function verDetallesRefrigerante(id) {
    try {
        const res = await fetch(`${API_REFRIGERANTES}?id=${id}`);
        const item = await res.json();

        if (!item || item.error) {
            return alert("Refrigerante no encontrado");
        }

        document.getElementById("verCodigoRefrigerante").value = item.codigo || "";
        document.getElementById("verRefrigeranteTemperatura").value = item.refrigerante_temperatura || "";
        document.getElementById("verReferenciaRefrigerante").value = item.referencia || "";
        document.getElementById("verEstadoRefrigerante").value = Number(item.activo) === 1 ? "Activo" : "Inactivo";

        const modalEl = document.getElementById("modalVerRefrigerante");
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    } catch (err) {
        console.error("Error:", err);
        alert("Error al cargar refrigerante");
    }
}

async function crear() {
    const data = obtenerDatosForm();

    if (!data.codigo) {
        return alert("El codigo es obligatorio");
    }
    if (!data.refrigerante_temperatura) {
        return alert("El refrigerante / temperatura es obligatorio");
    }

    try {
        const res = await fetch(API_REFRIGERANTES, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        });

        const json = await res.json();
        if (!json.ok) {
            return alert("Error: " + (json.error || "No se pudo crear"));
        }

        bootstrap.Modal.getInstance(document.getElementById("modalRefrigerante")).hide();
        cargarRefrigerantes("activo");
        alert("Refrigerante creado exitosamente");
    } catch (err) {
        console.error("Error:", err);
        alert("Error al crear refrigerante");
    }
}

async function editar(id) {
    try {
        const res = await fetch(`${API_REFRIGERANTES}?id=${id}`);
        const item = await res.json();

        if (!item || item.error) {
            return alert("Refrigerante no encontrado");
        }

        document.getElementById("codigo").value = item.codigo || "";
        document.getElementById("codigo").disabled = true;
        document.getElementById("refrigerante_temperatura").value = item.refrigerante_temperatura || "";
        document.getElementById("referencia").value = item.referencia || "";

        document.getElementById("btnGuardar").onclick = () => actualizar(id);
        document.getElementById("tituloModal").textContent = "Editar Refrigerante";

        new bootstrap.Modal(document.getElementById("modalRefrigerante")).show();
    } catch (err) {
        console.error("Error:", err);
        alert("Error al cargar refrigerante");
    }
}

async function actualizar(id) {
    const data = obtenerDatosForm();

    if (!data.refrigerante_temperatura) {
        return alert("El refrigerante / temperatura es obligatorio");
    }

    try {
        const res = await fetch(`${API_REFRIGERANTES}?id=${id}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        });

        const json = await res.json();
        if (!json.ok) {
            return alert("Error: " + (json.error || "No se pudo actualizar"));
        }

        bootstrap.Modal.getInstance(document.getElementById("modalRefrigerante")).hide();
        cargarRefrigerantes("activo");
        alert("Refrigerante actualizado exitosamente");
    } catch (err) {
        console.error("Error:", err);
        alert("Error al actualizar refrigerante");
    }
}

async function eliminar(id) {
    if (!confirm("Esta seguro de que desea eliminar este refrigerante?")) {
        return;
    }

    try {
        const res = await fetch(`${API_REFRIGERANTES}?id=${id}`, {
            method: "DELETE"
        });

        const json = await res.json();
        if (!json.ok) {
            return alert("Error: " + (json.error || "No se pudo eliminar"));
        }

        cargarRefrigerantes("activo");
        alert("Refrigerante eliminado exitosamente");
    } catch (err) {
        console.error("Error:", err);
        alert("Error al eliminar refrigerante");
    }
}

function obtenerDatosForm() {
    return {
        codigo: document.getElementById("codigo").value.trim(),
        refrigerante_temperatura: document.getElementById("refrigerante_temperatura").value.trim(),
        referencia: document.getElementById("referencia").value.trim() || null
    };
}
