// dashboard.js - Lógica del dashboard de cuartos fríos
const API_URL = "../api/dashboard.php";

let datosCompletos = [];
let cuartosFiltrados = [];

document.addEventListener("DOMContentLoaded", () => {
    cargarDatos();
});

async function cargarDatos() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const response = await res.json();
        if (!response.ok) throw new Error(response.error || "Error en API");
        
        datosCompletos = response.data || [];
        cuartosFiltrados = [...datosCompletos];
        
        // DEBUG: Ver estructura de datos
        console.log('Datos del dashboard:', datosCompletos);
        if (datosCompletos.length > 0) {
            console.log('Primer cuarto:', datosCompletos[0]);
            console.log('Sensores del primer cuarto:', datosCompletos[0].sensores);
        }
        
        generarFiltros();
        renderizarCuartos();
        
    } catch (error) {
        console.error("Error cargando datos:", error);
        mostrarError("Error al cargar información de cuartos fríos");
    }
}

function generarFiltros() {
    const contenedor = document.getElementById("filtrosCuartos");
    contenedor.innerHTML = "";
    
    datosCompletos.forEach(cuarto => {
        const div = document.createElement("div");
        div.className = "filtro-checkbox";
        
        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = `filtro_${cuarto.codigo}`;
        input.value = cuarto.codigo;
        input.checked = true;
        input.addEventListener("change", aplicarFiltros);
        
        const label = document.createElement("label");
        label.htmlFor = `filtro_${cuarto.codigo}`;
        label.textContent = cuarto.nombre;
        
        div.appendChild(input);
        div.appendChild(label);
        contenedor.appendChild(div);
    });
}

function aplicarFiltros() {
    const checkboxes = document.querySelectorAll("#filtrosCuartos input:checked");
    const seleccionados = Array.from(checkboxes).map(cb => cb.value);
    
    cuartosFiltrados = datosCompletos.filter(c => seleccionados.includes(c.codigo));
    renderizarCuartos();
}

function renderizarCuartos() {
    const contenedor = document.getElementById("contenedorCuartos");
    const mensajeCarga = document.getElementById("mensajeCarga");
    
    mensajeCarga.style.display = "none";
    contenedor.innerHTML = "";
    
    if (cuartosFiltrados.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <h5>No hay cuartos para mostrar</h5>
                    <p>Selecciona al menos un cuarto en los filtros</p>
                </div>
            </div>
        `;
        return;
    }
    
    cuartosFiltrados.forEach(cuarto => {
        const tarjeta = crearTarjetaCuarto(cuarto);
        contenedor.appendChild(tarjeta);
    });
}

function crearTarjetaCuarto(cuarto) {
    const col = document.createElement("div");
    col.className = "col-lg-6 col-xl-4";
    
    // Obtener sensores del cuarto y ubicar los de temperatura y humedad
    const sensores = Object.values(cuarto.sensores);
    const sensorTemp = sensores.find(s => (s.tipo || '').toLowerCase() === 'temperatura');
    const sensorHum  = sensores.find(s => (s.tipo || '').toLowerCase() === 'humedad');

    const tempVal  = sensorTemp?.ultima?.valor ?? null;
    const tempProm = sensorTemp?.promedio?.prom_dia ?? null;
    const humVal   = sensorHum?.ultima?.valor ?? null;
    const humProm  = sensorHum?.promedio?.prom_dia ?? null;

    // Sensores para la lista (excluye temperatura y humedad)
    const sensoresLista = sensores.filter(s => {
        const t = (s.tipo || '').toLowerCase();
        return t !== 'temperatura' && t !== 'humedad';
    });
    
    const card = document.createElement("div");
    card.className = "card cuarto-card";
    card.innerHTML = `
        <div class="cuarto-header">
            <h5><i class="bi bi-snow2 me-2"></i>${cuarto.nombre}</h5>
            <small class="text-white-50">${cuarto.codigo_finca}</small>
        </div>
        
        <div class="cuarto-body">
            <!-- Indicadores principales: siempre Temperatura y Humedad -->
            <div class="indicator-block">
                <div class="indicator-item">
                    <div class="indicator-label">Temperatura</div>
                    <div class="indicator-value">
                        ${tempVal !== null ? `${parseFloat(tempVal).toFixed(1)} °C` : '—'}
                    </div>
                    <small class="text-muted">Promedio: ${tempProm !== null && tempProm !== undefined ? `${parseFloat(tempProm).toFixed(1)} °C` : 'Sin datos'}</small>
                </div>
                <div class="indicator-item">
                    <div class="indicator-label">Humedad</div>
                    <div class="indicator-value">
                        ${humVal !== null ? `${parseFloat(humVal).toFixed(1)} %` : '—'}
                    </div>
                    <small class="text-muted">Promedio: ${humProm !== null && humProm !== undefined ? `${parseFloat(humProm).toFixed(1)} %` : 'Sin datos'}</small>
                </div>
            </div>

            ${tempVal !== null ? `
            <!-- Termómetro visual (solo si hay temperatura) -->
            <div class="thermometer-container">
                <div class="thermometer-bar" style="height: ${Math.min(parseFloat(tempVal) * 5, 100)}%">
                    <span class="thermometer-temp">${parseFloat(tempVal).toFixed(1)}°C</span>
                </div>
            </div>
            ` : ''}
            
            <!-- Toggle sensores -->
            <button class="toggle-sensors collapsed" onclick="toggleSensores(this, '${cuarto.codigo}')">
                <i class="bi bi-chevron-right"></i>
                <span>Ver otros sensores (${sensoresLista.length})</span>
            </button>
            
            <!-- Lista de sensores desplegable -->
            <div class="sensores-list" id="sensores_${cuarto.codigo}">
                ${generarSensoresList(sensoresLista)}
            </div>
        </div>
    `;
    
    col.appendChild(card);
    return col;
}

function generarSensoresList(sensores) {
    if (sensores.length === 0) {
        return '<p class="text-muted">No hay sensores registrados</p>';
    }

    let html = '';

    sensores.forEach(sensor => {
        const tipo = sensor.tipo || '';
        const ultima = sensor.ultima || {};
        const promedio = sensor.promedio || {};

        const valor = ultima.valor;
        const prom = promedio.prom_dia;
        const fechaCaptura = ultima.fecha_captura || '';

        const icono = tipo === 'temperatura' ? 'bi-thermometer-half'
                      : tipo === 'voltaje' ? 'bi-lightning'
                      : tipo === 'amperaje' ? 'bi-speedometer2'
                      : 'bi-activity';

        const valorTexto = valor !== null ? `${parseFloat(valor).toFixed( tipo === 'amperaje' ? 2 : 1 )} ${unidadPorTipo(tipo)}` : '—';
        const promTexto = prom !== null && prom !== undefined ? `${parseFloat(prom).toFixed( tipo === 'amperaje' ? 2 : 1 )} ${unidadPorTipo(tipo)}` : 'Sin datos';

        const datosHtml = `
            <div class="sensor-dato">
                <div class="sensor-dato-label">${labelPorTipo(tipo)}</div>
                <div class="sensor-dato-valor">${valorTexto}</div>
                <div class="sensor-dato-unidad">Promedio: ${promTexto}</div>
            </div>
        `;

        html += `
            <div class="sensor-item">
                <div class="sensor-nombre">
                    <i class="bi ${icono}"></i>
                    ${sensor.nombre}
                </div>
                <div class="sensor-datos">
                    ${datosHtml}
                </div>
                <div class="sensor-fecha">Última: ${formatearFecha(fechaCaptura)}</div>
            </div>
        `;
    });

    return html;
}

function toggleSensores(button, codigoCuarto) {
    const lista = document.getElementById(`sensores_${codigoCuarto}`);
    lista.classList.toggle("show");
    button.classList.toggle("collapsed");
}

function formatearFecha(fecha) {
    if (!fecha) return "Sin datos";
    const d = new Date(fecha);
    const hoy = new Date().toDateString() === d.toDateString();
    
    if (hoy) {
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    
    return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function labelPorTipo(tipo) {
    switch ((tipo || '').toLowerCase()) {
        case 'temperatura': return 'Temperatura';
        case 'humedad': return 'Humedad';
        case 'voltaje': return 'Voltaje';
        case 'amperaje': return 'Amperaje';
        case 'presion_s': return 'Presión Succión';
        case 'presion_e': return 'Presión Entrada';
        case 'aire': return 'Aire';
        case 'puerta': return 'Puerta';
        case 'otro': return 'Otro';
        default: return 'Dato';
    }
}

function unidadPorTipo(tipo) {
    switch ((tipo || '').toLowerCase()) {
        case 'temperatura': return '°C';
        case 'humedad': return '%';
        case 'voltaje': return 'V';
        case 'amperaje': return 'A';
        case 'presion_s':
        case 'presion_e': return 'PSI';
        case 'aire': return '';
        case 'puerta': return '';
        case 'otro': return '';
        default: return '';
    }
}

function mostrarError(mensaje) {
    const contenedor = document.getElementById("contenedorCuartos");
    const mensajeCarga = document.getElementById("mensajeCarga");
    
    mensajeCarga.innerHTML = `
        <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            ${mensaje}
        </div>
    `;
    mensajeCarga.style.display = "block";
}
