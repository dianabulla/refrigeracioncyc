// dashboard.js - Lógica del dashboard de cuartos fríos
const API_URL = "../api/dashboard.php";
const API_REPORTE = "../api/reporte.php";

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
        inicializarUIChart();
        renderizarCuartos();
        
    } catch (error) {
        console.error("Error cargando datos:", error);
        mostrarError("Error al cargar información de cuartos fríos");
    }
}

// ====== Gráfico Tiempo vs Datos ======
let timeSeriesChart = null;

function buildCuartoOptions() {
    const selCuarto = document.getElementById('selCuartoFiltro');
    if (!selCuarto) return;

    // Construir opciones de cuartos únicos
    const cuartos = datosCompletos.map(c => ({ codigo: c.codigo, nombre: c.nombre }));
    selCuarto.innerHTML = '';

    const optAll = document.createElement('option');
    optAll.value = '';
    optAll.textContent = 'Todos los cuartos';
    selCuarto.appendChild(optAll);

    cuartos.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.codigo;
        opt.textContent = c.nombre;
        selCuarto.appendChild(opt);
    });
}

function buildTipoOptions() {
    const selTipo = document.getElementById('selTipoFiltro');
    if (!selTipo) return;

    // Tipos a partir de sensores detectados
    const tiposSet = new Set();
    datosCompletos.forEach(cuarto => {
        Object.values(cuarto.sensores || {}).forEach(s => {
            const t = (s.tipo || '').toLowerCase();
            if (t) tiposSet.add(t);
        });
    });

    const tipos = Array.from(tiposSet).sort();
    selTipo.innerHTML = '';

    const optAll = document.createElement('option');
    optAll.value = '';
    optAll.textContent = 'Todos los tipos';
    selTipo.appendChild(optAll);

    tipos.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = labelPorTipo(t);
        selTipo.appendChild(opt);
    });
}

function repoblarSensoresDesdeFiltros(autorefresh = false) {
    const selSensor = document.getElementById('selSensor');
    const selCuarto = document.getElementById('selCuartoFiltro');
    const selTipo   = document.getElementById('selTipoFiltro');
    if (!selSensor) return;

    const cuartoSel = selCuarto?.value || '';
    const tipoSel   = (selTipo?.value || '').toLowerCase();

    const opciones = [];
    datosCompletos.forEach(cuarto => {
        if (cuartoSel && cuarto.codigo !== cuartoSel) return;
        const sensores = Object.values(cuarto.sensores || {});
        sensores.forEach(s => {
            if (!s || !s.codigo) return;
            const t = (s.tipo || '').toLowerCase();
            if (tipoSel && t !== tipoSel) return;
            opciones.push({
                codigo: s.codigo,
                nombre: s.nombre || s.codigo,
                tipo: t,
                cuarto: cuarto.codigo,
                cuartoNombre: cuarto.nombre
            });
        });
    });

    // Unicos por codigo
    const seen = new Set();
    selSensor.innerHTML = '';
    opciones.forEach(o => {
        if (seen.has(o.codigo)) return;
        seen.add(o.codigo);
        const opt = document.createElement('option');
        opt.value = o.codigo;
        opt.textContent = `${o.nombre} (${o.tipo || 'sensor'}) · ${o.cuartoNombre}`;
        selSensor.appendChild(opt);
    });

    if (selSensor.options.length > 0) {
        selSensor.selectedIndex = 0;
        if (autorefresh) actualizarGrafico();
    } else {
        const msg = document.getElementById('chartMensaje');
        if (msg) msg.textContent = 'No hay sensores que coincidan con los filtros.';
        if (timeSeriesChart) {
            timeSeriesChart.destroy();
            timeSeriesChart = null;
        }
    }
}

function inicializarUIChart() {
    // Rango por defecto: día actual (00:00 → ahora) para evitar consultas largas
    const ahora = new Date();
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);
    const toLocalInput = (d) => {
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const inpDesde = document.getElementById('inpDesde');
    const inpHasta = document.getElementById('inpHasta');
    if (inpDesde && inpHasta) {
        inpDesde.value = toLocalInput(inicioDia);
        inpHasta.value = toLocalInput(ahora);
    }

    // Poblar filtros y sensores
    buildCuartoOptions();
    buildTipoOptions();
    repoblarSensoresDesdeFiltros();

    // Listeners de filtros
    document.getElementById('selCuartoFiltro')?.addEventListener('change', () => {
        repoblarSensoresDesdeFiltros(true);
    });
    document.getElementById('selTipoFiltro')?.addEventListener('change', () => {
        repoblarSensoresDesdeFiltros(true);
    });

    const btn = document.getElementById('btnActualizarGrafico');
    if (btn) btn.addEventListener('click', actualizarGrafico);

    // Presets de rango
    document.getElementById('btnRange2h')?.addEventListener('click', () => setRangeHours(2));
    document.getElementById('btnRange6h')?.addEventListener('click', () => setRangeHours(6));
    document.getElementById('btnRange24h')?.addEventListener('click', () => setRangeHours(24));
    document.getElementById('btnRange7d')?.addEventListener('click', () => setRangeDays(7));
    document.getElementById('btnRange30d')?.addEventListener('click', () => setRangeDays(30));

    // Auto-load first render si hay sensor disponible
    if (document.getElementById('selSensor')?.value) {
        actualizarGrafico();
    }
}

function setRangeHours(hours) {
    const ahora = new Date();
    const desde = new Date(ahora.getTime() - hours * 60 * 60 * 1000);
    setRange(desde, ahora);
}

function setRangeDays(days) {
    const ahora = new Date();
    const desde = new Date(ahora.getTime() - days * 24 * 60 * 60 * 1000);
    setRange(desde, ahora);
}

function setRange(desde, hasta) {
    const toLocalInput = (d) => {
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const inpDesde = document.getElementById('inpDesde');
    const inpHasta = document.getElementById('inpHasta');
    if (inpDesde && inpHasta) {
        inpDesde.value = toLocalInput(desde);
        inpHasta.value = toLocalInput(hasta);
    }
    actualizarGrafico();
}

async function actualizarGrafico() {
    const selSensor = document.getElementById('selSensor');
    const selMetrica = document.getElementById('selMetrica');
    const inpDesde = document.getElementById('inpDesde');
    const inpHasta = document.getElementById('inpHasta');
    const msg = document.getElementById('chartMensaje');

    if (!selSensor?.value) {
        msg.textContent = 'Seleccione un sensor para visualizar.';
        return;
    }

    const sensor = selSensor.value;
    const metrica = selMetrica?.value || 'temperatura';
    const desde = inpDesde?.value ? new Date(inpDesde.value) : null;
    const hasta = inpHasta?.value ? new Date(inpHasta.value) : null;

    // Format as MySQL datetime
    const fmt = (d) => {
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    };

    const params = new URLSearchParams();
    params.set('codigo_sensor', sensor);
    if (desde) params.set('desde', fmt(desde));
    if (hasta) params.set('hasta', fmt(hasta));

    msg.textContent = 'Cargando datos…';

    try {
        const res = await fetch(`${API_REPORTE}?${params.toString()}`);
        const data = await res.json();
        if (!Array.isArray(data)) {
            msg.textContent = data.error || 'No se pudo obtener datos';
            return;
        }

        // Build dataset: order by fecha_captura ascending
        const registros = data
            .filter(r => r && r.fecha_captura)
            .sort((a,b) => new Date(a.fecha_captura) - new Date(b.fecha_captura));

        const labels = registros.map(r => new Date(r.fecha_captura));
        const values = registros.map(r => {
            const v = r[metrica];
            if (v === null || v === undefined) return null;
            const num = parseFloat(v);
            return Number.isFinite(num) ? num : null;
        });

        renderChart(labels, values, metrica);
        msg.textContent = registros.length ? '' : 'Sin datos en el rango seleccionado.';
    } catch (e) {
        console.error(e);
        msg.textContent = 'Error al cargar datos.';
    }
}

function renderChart(labels, values, metrica) {
    const ctx = document.getElementById('chartTimeSeries');
    if (!ctx) return;
    // Destroy previous
    if (timeSeriesChart) {
        timeSeriesChart.destroy();
        timeSeriesChart = null;
    }

    const unidad = unidadPorTipo(metrica);

    timeSeriesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${labelPorTipo(metrica)} ${unidad ? '('+unidad+')' : ''}`,
                data: values,
                segment: { borderColor: 'rgba(53, 162, 235, 1)' },
                backgroundColor: 'rgba(53, 162, 235, 0.2)',
                borderColor: 'rgba(53, 162, 235, 0.8)',
                borderWidth: 2,
                pointRadius: 2,
                pointHoverRadius: 4,
                spanGaps: true,
                tension: 0.2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            parsing: false,
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'hour', tooltipFormat: 'yyyy-MM-dd HH:mm' },
                    ticks: { autoSkip: true, maxRotation: 0 },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: false,
                    ticks: { callback: v => `${v}${unidad ? ' ' + unidad : ''}` }
                }
            },
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const v = ctx.parsed.y;
                            return `${labelPorTipo(metrica)}: ${v}${unidad ? ' ' + unidad : ''}`;
                        }
                    }
                }
            }
        }
    });
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
