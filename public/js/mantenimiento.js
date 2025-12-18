const API_URL = "../api/mantenimiento.php";
const API_CUARTOS = "../api/cuarto_frio.php";
const API_COMPONENTES = "../api/componente.php";

document.addEventListener("DOMContentLoaded", () => {
    cargarMantenimientos();
    cargarCuartos();
    cargarComponentes();
});

// ---------------------------------------------------
// Cargar tabla
// ---------------------------------------------------
async function cargarMantenimientos() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        const tbody = document.getElementById("tablaMantenimiento");
        tbody.innerHTML = "";

        data.forEach(item => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${item.codigo}</td>
                <td>${item.nombre}</td>
                <td>${item.tipo ?? "-"}</td>
                <td>${item.codigo_componente ?? "-"}</td>
                <td>${item.codigo_cuarto ?? "-"}</td>
                <td>${item.fecha_inicio ?? "-"}</td>
                <td>${item.fecha_fin ?? "-"}</td>

                <td class="text-center">
                    <button class="btn btn-sm btn-warning" onclick="editar('${item.codigo}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminar('${item.codigo}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Error al cargar mantenimientos:", err);
    }
}

// ---------------------------------------------------
// Cargar cuartos fríos
// ---------------------------------------------------
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

// ---------------------------------------------------
// Cargar componentes
// ---------------------------------------------------
async function cargarComponentes() {
    try {
        const res = await fetch(API_COMPONENTES);
        const componentes = await res.json();
        
        const select = document.getElementById("codigo_componente");
        select.innerHTML = '<option value="">Seleccionar componente (opcional)...</option>';
        
        componentes.forEach(comp => {
            const option = document.createElement("option");
            option.value = comp.codigo;
            option.textContent = `${comp.nombre} (${comp.codigo})`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Error al cargar componentes:", err);
    }
}

// ---------------------------------------------------
// Abrir modal nuevo
// ---------------------------------------------------
function abrirModalCrear() {
    document.getElementById("formMantenimiento").reset();
    document.getElementById("codigo").disabled = false;
    document.getElementById("btnGuardar").onclick = crear;
    document.getElementById("tituloModal").textContent = "Registrar Mantenimiento";

    new bootstrap.Modal(document.getElementById("modalMantenimiento")).show();
}

// ---------------------------------------------------
// Crear
// ---------------------------------------------------
async function crear() {
    const data = obtenerDatosForm();
    
    // Validar que cuarto esté seleccionado
    if (!data.codigo_cuarto) {
        return alert("⚠️ Debe seleccionar un Cuarto Frío");
    }
    
    // Validar que código no esté vacío
    if (!data.codigo) {
        return alert("⚠️ El código es obligatorio");
    }
    
    // Validar que nombre no esté vacío
    if (!data.nombre) {
        return alert("⚠️ El nombre es obligatorio");
    }

    const res = await fetch(API_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });

    const json = await res.json();
    if (!json.ok) return alert(json.error);

    bootstrap.Modal.getInstance(document.getElementById("modalMantenimiento")).hide();
    cargarMantenimientos();
}

// ---------------------------------------------------
// Editar → abrir modal con datos
// ---------------------------------------------------
async function editar(codigo) {
    const res = await fetch(`${API_URL}?codigo=${codigo}`);
    const item = await res.json();

    document.getElementById("codigo").value = item.codigo;
    document.getElementById("codigo").disabled = true;

    document.getElementById("nombre").value = item.nombre;
    document.getElementById("descripcion").value = item.descripcion ?? "";
    document.getElementById("tipo").value = item.tipo ?? "";
    document.getElementById("diagnostico").value = item.diagnostico ?? "";
    document.getElementById("acciones").value = item.acciones ?? "";
    document.getElementById("codigo_cuarto").value = item.codigo_cuarto ?? "";
    document.getElementById("codigo_componente").value = item.codigo_componente ?? "";
    document.getElementById("fecha_inicio").value = item.fecha_inicio ?? "";
    document.getElementById("fecha_fin").value = item.fecha_fin ?? "";

    document.getElementById("btnGuardar").onclick = () => actualizar(codigo);
    document.getElementById("tituloModal").textContent = "Editar Mantenimiento";

    new bootstrap.Modal(document.getElementById("modalMantenimiento")).show();
}

// ---------------------------------------------------
// Actualizar
// ---------------------------------------------------
async function actualizar(codigo) {
    const data = obtenerDatosForm();
    
    // Validar que cuarto esté seleccionado
    if (!data.codigo_cuarto) {
        return alert("⚠️ Debe seleccionar un Cuarto Frío");
    }

    const res = await fetch(`${API_URL}?codigo=${codigo}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });

    const json = await res.json();
    if (!json.ok) return alert(json.error);

    bootstrap.Modal.getInstance(document.getElementById("modalMantenimiento")).hide();
    cargarMantenimientos();
}

// ---------------------------------------------------
// Eliminar
// ---------------------------------------------------
async function eliminar(codigo) {
    if (!confirm("¿Eliminar este mantenimiento?")) return;

    const res = await fetch(`${API_URL}?codigo=${codigo}`, { method: "DELETE" });
    const json = await res.json();

    if (!json.ok) return alert(json.error);

    cargarMantenimientos();
}

// ---------------------------------------------------
// Tomar datos del formulario
// ---------------------------------------------------
function obtenerDatosForm() {
    return {
        codigo: document.getElementById("codigo").value.trim(),
        nombre: document.getElementById("nombre").value.trim(),
        descripcion: document.getElementById("descripcion").value.trim(),
        tipo: document.getElementById("tipo").value.trim(),
        diagnostico: document.getElementById("diagnostico").value.trim(),
        acciones: document.getElementById("acciones").value.trim(),
        codigo_cuarto: document.getElementById("codigo_cuarto").value.trim(),
        codigo_componente: document.getElementById("codigo_componente").value.trim(),
        fecha_inicio: document.getElementById("fecha_inicio").value,
        fecha_fin: document.getElementById("fecha_fin").value
    };
}
