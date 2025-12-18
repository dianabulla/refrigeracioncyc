const API_COMPONENTES = "../api/componente.php";
const API_CUARTOS = "../api/cuarto_frio.php";

document.addEventListener("DOMContentLoaded", () => {
    cargarComponentes();
    cargarCuartos();
});

// =========================================
// CARGAR COMPONENTES
// =========================================
async function cargarComponentes() {
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
        
        msgVacio.style.display = "none";
        
        componentes.forEach(comp => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${comp.codigo}</strong></td>
                <td>${comp.nombre}</td>
                <td>${comp.tipo ?? "-"}</td>
                <td>${comp.codigo_cuarto ?? "-"}</td>
                <td>${comp.descripcion ? comp.descripcion.substring(0, 50) + "..." : "-"}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-warning" onclick="editar(${comp.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminar(${comp.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
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
        cargarComponentes();
        alert("✅ Componente creado exitosamente");
    } catch (err) {
        console.error("Error:", err);
        alert("Error al crear componente");
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
        cargarComponentes();
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
        
        cargarComponentes();
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
