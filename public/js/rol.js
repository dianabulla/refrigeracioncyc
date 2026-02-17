const API_URL = "../api/rol.php";

document.addEventListener("DOMContentLoaded", () => {
    // Cargar con filtro activo por defecto
    cargarRoles("activo");
    
    // Event listeners para filtros
    const radioActivos = document.getElementById("radioActivosRol");
    const radioInactivos = document.getElementById("radioInactivosRol");
    const radioTodos = document.getElementById("radioTodosRol");

    if (radioActivos) {
        radioActivos.addEventListener("change", () => {
            if (radioActivos.checked) cargarRoles("activo");
        });
    }

    if (radioInactivos) {
        radioInactivos.addEventListener("change", () => {
            if (radioInactivos.checked) cargarRoles("inactivo");
        });
    }

    if (radioTodos) {
        radioTodos.addEventListener("change", () => {
            if (radioTodos.checked) cargarRoles("todas");
        });
    }
    
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
// LISTAR CON FILTRO
// -----------------------------------------
async function cargarRoles(filtroEstado = "activo") {
    const res = await fetch(API_URL);
    const data = await res.json();

    // Aplicar filtro
    let dataFiltrada = data;
    if (filtroEstado === "activo") {
        dataFiltrada = data.filter(r => Number(r.activo) === 1);
    } else if (filtroEstado === "inactivo") {
        dataFiltrada = data.filter(r => Number(r.activo) === 0);
    }
    // Si es "todas" no se filtra

    const tbody = document.getElementById("tablaRoles");
    tbody.innerHTML = "";

    dataFiltrada.forEach(r => {
        const tr = document.createElement("tr");
        
        // Columna Código
        const tdCodigo = document.createElement("td");
        tdCodigo.textContent = r.codigo;
        tr.appendChild(tdCodigo);
        
        // Columna Nombre
        const tdNombre = document.createElement("td");
        tdNombre.textContent = r.nombre;
        tr.appendChild(tdNombre);
        
        // Columna Descripción (oculta en móvil)
        const tdDesc = document.createElement("td");
        tdDesc.className = "d-none d-md-table-cell";
        tdDesc.textContent = r.descripcion ?? "-";
        tr.appendChild(tdDesc);
        
        // Columna Estado
        const tdEstado = document.createElement("td");
        tdEstado.textContent = Number(r.activo) === 1 ? "Activo" : "Inactivo";
        tr.appendChild(tdEstado);
        
        // Columna Opciones
        const tdOpciones = document.createElement("td");
        tdOpciones.className = "text-center";
        
        // Botón Ver
        const btnVer = document.createElement("button");
        btnVer.className = "btn btn-info btn-sm me-1";
        btnVer.innerHTML = '<i class="bi bi-eye"></i>';
        btnVer.onclick = function() { verDetallesRol(r.codigo); };
        tdOpciones.appendChild(btnVer);
        
        // Botón Editar
        const btnEditar = document.createElement("button");
        btnEditar.className = "btn btn-warning btn-sm me-1";
        btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
        btnEditar.onclick = function() { editarRol(r.codigo); };
        tdOpciones.appendChild(btnEditar);
        
        // Botón Eliminar
        const btnEliminar = document.createElement("button");
        btnEliminar.className = "btn btn-danger btn-sm";
        btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
        btnEliminar.onclick = function() { eliminarRol(r.codigo); };
        tdOpciones.appendChild(btnEliminar);
        
        tr.appendChild(tdOpciones);
        tbody.appendChild(tr);
    });
}

// -----------------------------------------
// VER DETALLES DEL ROL
// -----------------------------------------
async function verDetallesRol(codigo) {
    const res = await fetch(`${API_URL}?codigo=${codigo}`);
    const r = await res.json();

    document.getElementById("verCodigoRol").value = r.codigo;
    document.getElementById("verNombreRol").value = r.nombre;
    document.getElementById("verDescripcionRol").value = r.descripcion ?? "";
    document.getElementById("verEstadoRol").value = Number(r.activo) === 1 ? "Activo" : "Inactivo";

    // Mostrar permisos
    let permisosTexto = "Ninguno";
    if (r.permisos) {
        let permisos = {};
        if (typeof r.permisos === 'string') {
            try {
                permisos = JSON.parse(r.permisos);
            } catch (e) {
                console.error('Error parseando permisos:', e);
            }
        } else if (typeof r.permisos === 'object') {
            permisos = r.permisos;
        }
        
        const permisosActivos = Object.keys(permisos).filter(p => permisos[p] === true);
        if (permisosActivos.length > 0) {
            permisosTexto = permisosActivos.join(', ');
        }
    }
    
    document.getElementById("verPermisosRol").value = permisosTexto;

    const modalEl = document.getElementById("modalVerRol");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
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
    cargarRoles("activo");
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
        let permisos = {};
        
        // Si permisos es string JSON, parsearlo
        if (typeof r.permisos === 'string') {
            try {
                permisos = JSON.parse(r.permisos);
            } catch (e) {
                console.error('Error parseando permisos:', e);
                permisos = {};
            }
        } else if (typeof r.permisos === 'object') {
            permisos = r.permisos;
        }

        // Marcar checkboxes según el objeto de permisos
        Object.keys(permisos).forEach(permiso => {
            if (permisos[permiso] === true) {
                const checkbox = document.getElementById(permiso);
                if (checkbox) checkbox.checked = true;
            }
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
    cargarRoles("activo");
}

// -----------------------------------------
// ELIMINAR
// -----------------------------------------
async function eliminarRol(codigo) {
    if (!confirm("¿Eliminar este rol?")) return;

    const res = await fetch(`${API_URL}?codigo=${codigo}`, { method: "DELETE" });
    const j = await res.json();

    if (!j.ok) return alert(j.error);

    cargarRoles("activo");
}

// -----------------------------------------
// TOMAR CAMPOS
// -----------------------------------------
function tomarDatos() {
    // Convertir permisos de array a objeto JSON con booleanos
    const permisosObj = {};
    
    // Todos los permisos posibles
    const todosLosPermisos = [
        'ver_usuarios', 'crear_usuarios', 'editar_usuarios', 'eliminar_usuarios',
        'ver_fincas', 'crear_fincas', 'editar_fincas', 'eliminar_fincas',
        'ver_cuartos', 'crear_cuartos', 'editar_cuartos', 'eliminar_cuartos',
        'ver_sensores', 'crear_sensores', 'editar_sensores', 'eliminar_sensores',
        'ver_componentes', 'crear_componentes', 'editar_componentes', 'eliminar_componentes',
        'ver_refrigerantes', 'crear_refrigerantes', 'editar_refrigerantes', 'eliminar_refrigerantes',
        'ver_mantenimientos', 'crear_mantenimientos', 'editar_mantenimientos', 'eliminar_mantenimientos',
        'ver_reportes', 'exportar_reportes'
    ];
    
    // Marcar cada permiso como true/false según esté marcado
    todosLosPermisos.forEach(permiso => {
        const checkbox = document.getElementById(permiso);
        permisosObj[permiso] = checkbox ? checkbox.checked : false;
    });

    const data = {
        codigo: document.getElementById("codigo").value.trim(),
        nombre: document.getElementById("nombre").value.trim(),
        descripcion: document.getElementById("descripcion").value.trim(),
        activo: document.getElementById("activo").checked ? 1 : 0,
        permisos: permisosObj
    };
    
    // Agregar codigo_empresa si existe el campo
    const codigoEmpresaField = document.getElementById("codigo_empresa");
    if (codigoEmpresaField) {
        data.codigo_empresa = codigoEmpresaField.value.trim();
    }
    
    return data;
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
