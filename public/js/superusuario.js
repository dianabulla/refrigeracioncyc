const API_URL = "../api/superusuario.php";

/** 🟢 Cargar todos los superusuarios */
async function cargarSuperusuarios() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        if (!Array.isArray(data)) {
            console.error("Error al obtener superusuarios:", data);
            return;
        }

        const tbody = document.getElementById("tablaSuperusuarios");
        tbody.innerHTML = "";

        data.forEach((item) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.codigo || "-"}</td>
                <td>${item.nombre}</td>
                <td>${item.email}</td>
                <td>${item.descripcion || "-"}</td>
                <td>${item.activo ? "Activo" : "Inactivo"}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editarSuperusuario(${item.id})">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarSuperusuario(${item.id})">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Error al cargar superusuarios:", error);
    }
}

/** 🟡 Crear nuevo superusuario */
async function crearSuperusuario(event) {
    event.preventDefault();

    const data = {
        codigo: document.getElementById("codigo").value.trim(),
        nombre: document.getElementById("nombre").value.trim(),
        descripcion: document.getElementById("descripcion").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value.trim(),
        activo: document.getElementById("activo").checked ? 1 : 0,
    };

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await res.json();
        if (res.ok) {
            alert(result.message);
            document.getElementById("formSuperusuario").reset();
            cargarSuperusuarios();
        } else {
            alert(result.error || "Error al crear superusuario");
        }
    } catch (error) {
        console.error("Error al crear:", error);
    }
}

/** 🔵 Eliminar superusuario */
async function eliminarSuperusuario(id) {
    if (!confirm("¿Seguro que deseas eliminar este superusuario?")) return;

    try {
        const res = await fetch(`${API_URL}?id=${id}`, { method: "DELETE" });
        const result = await res.json();
        if (res.ok) {
            alert(result.message);
            cargarSuperusuarios();
        } else {
            alert(result.error || "Error al eliminar");
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
    }
}

/** 🟠 Editar superusuario (llenar formulario con datos) */
async function editarSuperusuario(id) {
    try {
        const res = await fetch(`${API_URL}?id=${id}`);
        const data = await res.json();

        if (res.ok && data) {
            document.getElementById("codigo").value = data.codigo || "";
            document.getElementById("nombre").value = data.nombre || "";
            document.getElementById("descripcion").value = data.descripcion || "";
            document.getElementById("email").value = data.email || "";
            document.getElementById("activo").checked = data.activo == 1;

            document.getElementById("btnGuardar").dataset.editId = id;
            document.getElementById("btnGuardar").textContent = "Actualizar";
        }
    } catch (error) {
        console.error("Error al cargar datos para editar:", error);
    }
}

/** 🟣 Guardar cambios si está en modo editar */
document.getElementById("formSuperusuario").addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = document.getElementById("btnGuardar");
    const editId = btn.dataset.editId;

    if (editId) {
        // Actualizar registro
        const data = {
            codigo: document.getElementById("codigo").value.trim(),
            nombre: document.getElementById("nombre").value.trim(),
            descripcion: document.getElementById("descripcion").value.trim(),
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value.trim(),
            activo: document.getElementById("activo").checked ? 1 : 0,
        };

        try {
            const res = await fetch(`${API_URL}?id=${editId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await res.json();
            if (res.ok) {
                alert(result.message);
                btn.textContent = "Guardar";
                btn.removeAttribute("data-edit-id");
                document.getElementById("formSuperusuario").reset();
                cargarSuperusuarios();
            } else {
                alert(result.error || "Error al actualizar");
            }
        } catch (error) {
            console.error("Error al actualizar:", error);
        }
    } else {
        // Crear nuevo
        crearSuperusuario(e);
    }
});

/** 🚀 Inicialización */
document.addEventListener("DOMContentLoaded", cargarSuperusuarios);
