const API_URL = "../api/rol.php";

document.addEventListener("DOMContentLoaded", () => {
    cargarRoles();
    
    // Limpiar formulario al abrir modal para crear nuevo rol
    document.getElementById("modalRol").addEventListener("show.bs.modal", (e) => {
        // Solo limpiar si no viene de editar (botón trigger tiene data-bs-target)
        if (e.relatedTarget && e.relatedTarget.hasAttribute('data-bs-toggle')) {
            limpiarFormulario();
        }
    });
});

// -----------------------------------------
// LIMPIAR FORMULARIO
// -----------------------------------------
function limpiarFormulario() {
    document.getElementById("codigo").value = "";
    document.getElementById("codigo").disabled = false;
    document.getElementById("nombre").value = "";
    document.getElementById("descripcion").value = "";
    document.getElementById("activo").checked = true;
    
    // Desmarcar todos los permisos
    document.querySelectorAll('.permiso-check').forEach(cb => cb.checked = false);
    document.getElementById('permiso_todos').checked = false;
    
    // Restaurar botón a crear
    document.getElementById("btnGuardar").onclick = crearRol;
}

// -----------------------------------------
// LISTAR
// -----------------------------------------
async function cargarRoles() {
    const res = await fetch(API_URL);
    const data = await res.json();

    const tbody = document.getElementById("tablaRoles");
    tbody.innerHTML = "";

    data.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${r.codigo}</td>
            <td>${r.nombre}</td>
            <td>${r.descripcion ?? "-"}</td>
            <td>${r.activo === 1 ? "Activo" : "Inactivo"}</td>

            <td class="text-center">
                <button class="btn btn-warning btn-sm" onclick="editarRol('${r.codigo}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="eliminarRol('${r.codigo}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// -----------------------------------------
// CREAR
// -----------------------------------------
async function crearRol() {
    const data = tomarDatos();

    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const j = await res.json();
    if (!j.ok) return alert(j.error);

    bootstrap.Modal.getInstance(document.getElementById("modalRol")).hide();
    cargarRoles();
}

// -----------------------------------------
// EDITAR → abrir modal
// -----------------------------------------
async function editarRol(codigo) {
    const res = await fetch(`${API_URL}?codigo=${codigo}`);
    const r = await res.json();

    document.getElementById("codigo").value = r.codigo;
    document.getElementById("codigo").disabled = true;
    document.getElementById("nombre").value = r.nombre;
    document.getElementById("descripcion").value = r.descripcion ?? "";
    document.getElementById("activo").checked = r.activo === 1;

    // Limpiar todos los checkboxes primero
    document.querySelectorAll('.permiso-check').forEach(cb => cb.checked = false);
    document.getElementById('permiso_todos').checked = false;

    // Marcar los permisos que tiene el rol
    if (r.permisos) {
        let permisos = [];
        // Si permisos es string JSON, parsearlo
        if (typeof r.permisos === 'string') {
            try {
                permisos = JSON.parse(r.permisos);
            } catch (e) {
                permisos = [];
            }
        } else if (Array.isArray(r.permisos)) {
            permisos = r.permisos;
        }

        permisos.forEach(permiso => {
            const checkbox = document.getElementById(permiso);
            if (checkbox) checkbox.checked = true;
        });
    }

    document.getElementById("btnGuardar").onclick = () => actualizarRol(codigo);

    new bootstrap.Modal(document.getElementById("modalRol")).show();
}

// -----------------------------------------
// ACTUALIZAR
// -----------------------------------------
async function actualizarRol(codigo) {
    const data = tomarDatos();

    const res = await fetch(`${API_URL}?codigo=${codigo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const j = await res.json();
    if (!j.ok) return alert(j.error);

    bootstrap.Modal.getInstance(document.getElementById("modalRol")).hide();
    cargarRoles();
}

// -----------------------------------------
// ELIMINAR
// -----------------------------------------
async function eliminarRol(codigo) {
    if (!confirm("¿Eliminar este rol?")) return;

    const res = await fetch(`${API_URL}?codigo=${codigo}`, { method: "DELETE" });
    const j = await res.json();

    if (!j.ok) return alert(j.error);

    cargarRoles();
}

// -----------------------------------------
// TOMAR CAMPOS
// -----------------------------------------
function tomarDatos() {
    // Obtener todos los checkboxes de permisos marcados
    const permisos = [];
    document.querySelectorAll('.permiso-check:checked').forEach(cb => {
        permisos.push(cb.value);
    });

    return {
        codigo: document.getElementById("codigo").value.trim(),
        nombre: document.getElementById("nombre").value.trim(),
        descripcion: document.getElementById("descripcion").value.trim(),
        activo: document.getElementById("activo").checked ? 1 : 0,
        permisos: permisos
    };
}

// -----------------------------------------
// TOGGLE TODOS LOS PERMISOS
// -----------------------------------------
function toggleTodosPermisos(checkbox) {
    const checkboxes = document.querySelectorAll('.permiso-check');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
}
