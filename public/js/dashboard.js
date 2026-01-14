// dashboard.js - Lógica mejorada del dashboard con gráficos claros e interactivos
const API_URL = "../api/dashboard.php";
const API_REPORTE = "../api/reporte.php";

let datosCompletos = [];
let cuartosFiltrados = [];
let timeSeriesChart = null;
let comparisonMode = false;
let sensoresComparacion = [];
// Colores específicos por tipo de sensor/métrica
const coloresPorTipo = {
    temperatura: 'rgba(255, 87, 51, 1)',        // Rojo-naranja (calor)
    humedad: 'rgba(33, 150, 243, 1)',           // Azul (agua)
    voltaje: 'rgba(255, 193, 7, 1)',            // Amarillo dorado (electricidad)
    amperaje: 'rgba(156, 39, 176, 1)',          // Púrpura (corriente)
    presion_s: 'rgba(76, 175, 80, 1)',          // Verde (presión succión)
    presion_e: 'rgba(0, 150, 136, 1)',          // Verde azulado (presión entrada)
};

// Colores de respaldo para múltiples sensores del mismo tipo
const coloresGrafico = [
    'rgba(255, 99, 132, 1)',     // Rojo
    'rgba(54, 162, 235, 1)',     // Azul
    'rgba(75, 192, 192, 1)',     // Verde
    'rgba(255, 206, 86, 1)',     // Amarillo
    'rgba(153, 102, 255, 1)',    // Púrpura
    'rgba(255, 159, 64, 1)',     // Naranja
    'rgba(201, 203, 207, 1)',    // Gris
];

// Función para obtener color según tipo y métrica
function obtenerColorPorTipo(metrica, indiceSensor = 0) {
    // Primero intentar obtener color específico por métrica
    if (coloresPorTipo[metrica]) {
        return coloresPorTipo[metrica];
    }
    // Si no hay color específico, usar colores de respaldo
    return coloresGrafico[indiceSensor % coloresGrafico.length];
}

// Rangos por defecto (pueden ser personalizados)
let rangosTemperatura = { min: -30, max: -5 };
let rangosHumedad = { min: 30, max: 80 };

document.addEventListener("DOMContentLoaded", () => {
    cargarDatos();
    inicializarBusqueda();
    inicializarBotones();
});

function inicializarBotones() {
    const btnComparison2 = document.getElementById('btnComparisonMode2');
    if (btnComparison2) {
        btnComparison2.addEventListener('click', () => {
            comparisonMode = !comparisonMode;
            btnComparison2.classList.toggle('active');
            
            // Sincronizar con el otro botón
            const btnComparison = document.getElementById('btnComparisonMode');
            if (btnComparison) {
                btnComparison.classList.toggle('active');
            }
            
            // Mostrar/ocultar panel de comparación
            const comparisonList = document.getElementById('comparisonList');
            if (comparisonList) {
                comparisonList.classList.toggle('active');
            }
            
            if (!comparisonMode) {
                sensoresComparacion = [];
                document.querySelectorAll('.sensor-checkbox').forEach(cb => cb.checked = false);
            }
            
            // Re-renderizar tarjetas para mostrar/ocultar checkboxes
            renderizarCuartos();
            actualizarBadgeComparison();
        });
    }

    const btnConfigRangos = document.getElementById('btnConfigRangos');
    if (btnConfigRangos) {
        btnConfigRangos.addEventListener('click', mostrarDialogoConfiguracion);
    }
}

function inicializarBusqueda() {
    const searchInput = document.getElementById('searchCuartos');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const termino = e.target.value.toLowerCase();
            cuartosFiltrados = datosCompletos.filter(cuarto =>
                (cuarto.nombre || '').toLowerCase().includes(termino) ||
                (cuarto.codigo || '').toLowerCase().includes(termino)
            );
            renderizarCuartos();
            actualizarTablaSumario();
        });
    }
}

async function cargarDatos() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const response = await res.json();
        if (!response.ok) throw new Error(response.error || "Error en API");
        
        datosCompletos = response.data || [];
        cuartosFiltrados = [...datosCompletos];
        
        console.log('Datos del dashboard:', datosCompletos);
        
        actualizarKPIs();
        actualizarTablaSumario();
        generarFiltros();
        inicializarUIChart();
        renderizarCuartos();
        
    } catch (error) {
        console.error("Error cargando datos:", error);
        mostrarError("Error al cargar información de cuartos fríos");
    }
}

// ====== KPI Y TABLA RESUMEN ======
function actualizarKPIs() {
    if (!datosCompletos || datosCompletos.length === 0) return;

    let tempSum = 0, humSum = 0, tempCount = 0, humCount = 0;
    let cuartosNormales = 0, cuartosAlerta = 0;

    datosCompletos.forEach(cuarto => {
        const sensores = Object.values(cuarto.sensores || {});
        
        // Buscar temperatura: el API ya separó temperatura_humedad en entradas individuales
        const sensorTemp = sensores.find(s => {
            const tipo = (s.tipo || '').toLowerCase();
            return tipo === 'temperatura';
        });
        
        // Buscar humedad: el API ya separó temperatura_humedad en entradas individuales
        const sensorHum = sensores.find(s => {
            const tipo = (s.tipo || '').toLowerCase();
            return tipo === 'humedad';
        });

        const tempVal = sensorTemp?.ultima?.valor;
        const humVal = sensorHum?.ultima?.valor;

        if (tempVal !== null && tempVal !== undefined) {
            tempSum += parseFloat(tempVal);
            tempCount++;
        }
        if (humVal !== null && humVal !== undefined) {
            humSum += parseFloat(humVal);
            humCount++;
        }

        const estado = determinarEstadoCuarto(cuarto);
        if (estado === 'normal') cuartosNormales++;
        else if (estado === 'alerta' || estado === 'critico') cuartosAlerta++;
    });

    const tempPromedio = tempCount > 0 ? (tempSum / tempCount).toFixed(1) : '—';
    const humPromedio = humCount > 0 ? (humSum / humCount).toFixed(1) : '—';

    document.getElementById('kpiTempPromedio').textContent = tempPromedio !== '—' ? `${tempPromedio}°C` : '—';
    document.getElementById('kpiHumPromedio').textContent = humPromedio !== '—' ? `${humPromedio}%` : '—';
    document.getElementById('kpiCuartosNormales').textContent = cuartosNormales;
    document.getElementById('kpiCuartosAlerta').textContent = cuartosAlerta;
}

function determinarEstadoCuarto(cuarto) {
    const sensores = Object.values(cuarto.sensores || {});
    
    // Buscar temperatura: el API ya separó temperatura_humedad en entradas individuales
    const sensorTemp = sensores.find(s => {
        const tipo = (s.tipo || '').toLowerCase();
        return tipo === 'temperatura';
    });
    
    // Buscar humedad: el API ya separó temperatura_humedad en entradas individuales
    const sensorHum = sensores.find(s => {
        const tipo = (s.tipo || '').toLowerCase();
        return tipo === 'humedad';
    });

    const tempVal = sensorTemp?.ultima?.valor;
    const humVal = sensorHum?.ultima?.valor;

    if (tempVal !== null && tempVal !== undefined) {
        const temp = parseFloat(tempVal);
        if (temp < rangosTemperatura.min - 2 || temp > rangosTemperatura.max + 2) return 'critico';
        if (temp < rangosTemperatura.min || temp > rangosTemperatura.max) return 'alerta';
    }

    if (humVal !== null && humVal !== undefined) {
        const hum = parseFloat(humVal);
        if (hum < rangosHumedad.min - 5 || hum > rangosHumedad.max + 5) return 'critico';
        if (hum < rangosHumedad.min || hum > rangosHumedad.max) return 'alerta';
    }

    return 'normal';
}

function actualizarTablaSumario() {
    const tbody = document.getElementById('tablaSumarioReportes');
    if (!tbody) return;

    if (cuartosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No hay cuartos</td></tr>';
        return;
    }

    tbody.innerHTML = cuartosFiltrados.map(cuarto => {
        const sensores = Object.values(cuarto.sensores || {});
        
        // Buscar temperatura: el API ya separó temperatura_humedad en entradas individuales
        const sensorTemp = sensores.find(s => {
            const tipo = (s.tipo || '').toLowerCase();
            return tipo === 'temperatura';
        });
        
        // Buscar humedad: el API ya separó temperatura_humedad en entradas individuales
        const sensorHum = sensores.find(s => {
            const tipo = (s.tipo || '').toLowerCase();
            return tipo === 'humedad';
        });

        const tempVal = sensorTemp?.ultima?.valor ?? null;
        const humVal = sensorHum?.ultima?.valor ?? null;
        const estado = determinarEstadoCuarto(cuarto);

        const estadoHtml = {
            'normal': '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Normal</span>',
            'alerta': '<span class="badge bg-warning text-dark"><i class="bi bi-exclamation-triangle me-1"></i>Alerta</span>',
            'critico': '<span class="badge bg-danger"><i class="bi bi-exclamation-octagon me-1"></i>Crítico</span>'
        }[estado] || '<span class="badge bg-secondary">—</span>';

        return `
            <tr class="cuarto-row" data-codigo="${cuarto.codigo}">
                <td><strong>${cuarto.nombre}</strong><br><small class="text-muted">${cuarto.codigo}</small></td>
                <td>${tempVal !== null ? `<strong>${parseFloat(tempVal).toFixed(1)}°C</strong>` : '—'}</td>
                <td>${humVal !== null ? `<strong>${parseFloat(humVal).toFixed(1)}%</strong>` : '—'}</td>
                <td>${estadoHtml}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="scrollToCuarto('${cuarto.codigo}')">
                        <i class="bi bi-eye me-1"></i>Ver
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function scrollToCuarto(codigo) {
    const elemento = document.querySelector(`[data-cuarto-codigo="${codigo}"]`);
    if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function mostrarDialogoConfiguracion() {
    const html = `
        <div class="modal-header">
            <h5 class="modal-title">Configurar Rangos</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            <div class="mb-3">
                <label class="form-label">Temperatura Mínima (°C)</label>
                <input type="number" id="configTempMin" class="form-control" value="${rangosTemperatura.min}" step="0.5">
            </div>
            <div class="mb-3">
                <label class="form-label">Temperatura Máxima (°C)</label>
                <input type="number" id="configTempMax" class="form-control" value="${rangosTemperatura.max}" step="0.5">
            </div>
            <div class="mb-3">
                <label class="form-label">Humedad Mínima (%)</label>
                <input type="number" id="configHumMin" class="form-control" value="${rangosHumedad.min}" step="1" min="0" max="100">
            </div>
            <div class="mb-3">
                <label class="form-label">Humedad Máxima (%)</label>
                <input type="number" id="configHumMax" class="form-control" value="${rangosHumedad.max}" step="1" min="0" max="100">
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="guardarConfiguracion()">Guardar</button>
        </div>
    `;

    let modal = document.getElementById('configModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'configModal';
        modal.className = 'modal fade';
        modal.innerHTML = `<div class="modal-dialog"><div class="modal-content"></div></div>`;
        document.body.appendChild(modal);
    }

    modal.querySelector('.modal-content').innerHTML = html;
    new bootstrap.Modal(modal).show();
}

function guardarConfiguracion() {
    rangosTemperatura.min = parseFloat(document.getElementById('configTempMin').value);
    rangosTemperatura.max = parseFloat(document.getElementById('configTempMax').value);
    rangosHumedad.min = parseFloat(document.getElementById('configHumMin').value);
    rangosHumedad.max = parseFloat(document.getElementById('configHumMax').value);

    bootstrap.Modal.getInstance(document.getElementById('configModal')).hide();
    actualizarKPIs();
    actualizarTablaSumario();
    renderizarCuartos();
}

// ====== MODO COMPARACIÓN ======
function inicializarComparisonMode() {
    const btnComparison = document.getElementById('btnComparisonMode');
    const comparisonList = document.getElementById('comparisonList');
    const btnClearComparison = document.getElementById('btnClearComparison');
    
    btnComparison?.addEventListener('click', () => {
        comparisonMode = !comparisonMode;
        btnComparison.classList.toggle('active');
        comparisonList.classList.toggle('active');
        
        // Sincronizar con el otro botón
        const btnComparison2 = document.getElementById('btnComparisonMode2');
        if (btnComparison2) {
            btnComparison2.classList.toggle('active');
        }
        
        if (!comparisonMode) {
            sensoresComparacion = [];
            document.querySelectorAll('.sensor-checkbox').forEach(cb => cb.checked = false);
            actualizarGrafico();
        }
        
        // Re-renderizar tarjetas para mostrar/ocultar checkboxes
        renderizarCuartos();
        actualizarBadgeComparison();
    });
    
    btnClearComparison?.addEventListener('click', () => {
        sensoresComparacion = [];
        document.querySelectorAll('.sensor-checkbox').forEach(cb => cb.checked = false);
        document.getElementById('comparisonItems').innerHTML = '';
        actualizarGrafico();
        actualizarBadgeComparison();
    });
}

function actualizarBadgeComparison() {
    const badge = document.querySelector('.comparison-badge');
    if (badge) {
        badge.textContent = sensoresComparacion.length;
        badge.style.display = sensoresComparacion.length > 0 ? 'flex' : 'none';
    }
}

function agregarSensorComparacion(codigoSensor, nombreSensor) {
    if (!sensoresComparacion.find(s => s.codigo === codigoSensor)) {
        sensoresComparacion.push({ codigo: codigoSensor, nombre: nombreSensor });
        renderizarListaComparacion();
        actualizarBadgeComparison();
    }
}

function removerSensorComparacion(codigoSensor) {
    sensoresComparacion = sensoresComparacion.filter(s => s.codigo !== codigoSensor);
    const checkbox = document.querySelector(`input[value="${codigoSensor}"]`);
    if (checkbox) checkbox.checked = false;
    renderizarListaComparacion();
    actualizarBadgeComparison();
}

function renderizarListaComparacion() {
    const container = document.getElementById('comparisonItems');
    container.innerHTML = sensoresComparacion.map(s => `
        <div class="comparison-item">
            <span>${s.nombre}</span>
            <button class="btn btn-sm btn-outline-danger" onclick="removerSensorComparacion('${s.codigo}')">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `).join('');
}

// ====== Actualizar texto de métricas seleccionadas ======
function actualizarTextoMetricas() {
    const checkboxes = document.querySelectorAll('#listMetricas input[type="checkbox"]:checked');
    const span = document.getElementById('metricasSeleccionadas');
    if (!span) return;
    
    if (checkboxes.length === 0) {
        span.textContent = 'Seleccionar métricas';
    } else if (checkboxes.length === 1) {
        const label = checkboxes[0].parentElement.textContent.trim();
        span.textContent = label;
    } else {
        span.textContent = `${checkboxes.length} métricas seleccionadas`;
    }
}

// ====== Gráfico Tiempo vs Datos ======
function buildCuartoOptions() {
    const selCuarto = document.getElementById('selCuartoFiltro');
    if (!selCuarto) return;

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
    // Ya no se usa este filtro, se removió del HTML
}

function repoblarSensoresDesdeFiltros(autorefresh = false) {
    const selSensor = document.getElementById('selSensor');
    const selCuarto = document.getElementById('selCuartoFiltro');
    if (!selSensor) return;

    const cuartoSel = selCuarto?.value || '';

    // Obtener sensores reales únicos (sin duplicados por campos)
    const sensoresUnicos = new Map();
    
    datosCompletos.forEach(cuarto => {
        if (cuartoSel && cuarto.codigo !== cuartoSel) return;
        const sensores = Object.values(cuarto.sensores || {});
        sensores.forEach(s => {
            if (!s || !s.codigo) return;
            // Usar solo el código del sensor (sin el sufijo _campo)
            const codigoReal = s.codigo.split('_')[0];
            
            if (!sensoresUnicos.has(codigoReal)) {
                sensoresUnicos.set(codigoReal, {
                    codigo: codigoReal,
                    nombre: s.nombre.replace(/\s*\([^)]*\)\s*$/, ''), // Quitar el (Temperatura) o (Humedad) del nombre
                    tipo: s.tipo,
                    cuarto: cuarto.codigo,
                    cuartoNombre: cuarto.nombre
                });
            }
        });
    });

    selSensor.innerHTML = '';
    sensoresUnicos.forEach((sensor) => {
        const opt = document.createElement('option');
        opt.value = sensor.codigo;
        opt.textContent = `${sensor.nombre} - ${sensor.cuartoNombre}`;
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
    // Rango por defecto: día actual
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

    buildCuartoOptions();
    repoblarSensoresDesdeFiltros();
    inicializarComparisonMode();

    // Listeners
    document.getElementById('selCuartoFiltro')?.addEventListener('change', () => {
        repoblarSensoresDesdeFiltros(true);
    });
    
    // Listener para checkboxes de métricas
    document.querySelectorAll('#listMetricas input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            actualizarTextoMetricas();
            actualizarGrafico();
        });
    });
    
    // Actualizar texto de métricas seleccionadas
    actualizarTextoMetricas();

    document.getElementById('btnActualizarGrafico')?.addEventListener('click', actualizarGrafico);
    document.getElementById('btnExportData')?.addEventListener('click', exportarDatos);

    // Rangos rápidos
    document.getElementById('btnRange1h')?.addEventListener('click', () => setRangeHours(1));
    document.getElementById('btnRange2h')?.addEventListener('click', () => setRangeHours(2));
    document.getElementById('btnRange6h')?.addEventListener('click', () => setRangeHours(6));
    document.getElementById('btnRange24h')?.addEventListener('click', () => setRangeHours(24));
    document.getElementById('btnRange7d')?.addEventListener('click', () => setRangeDays(7));
    document.getElementById('btnRange30d')?.addEventListener('click', () => setRangeDays(30));

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
    const inpDesde = document.getElementById('inpDesde');
    const inpHasta = document.getElementById('inpHasta');
    const msg = document.getElementById('chartMensaje');
    
    // Obtener métricas seleccionadas desde los checkboxes
    const checkboxes = document.querySelectorAll('#listMetricas input[type="checkbox"]:checked');
    const metricasSeleccionadas = Array.from(checkboxes).map(cb => cb.value);
    
    if (metricasSeleccionadas.length === 0) {
        msg.textContent = 'Seleccione al menos una métrica.';
        return;
    }
    
    const desde = inpDesde?.value ? new Date(inpDesde.value) : null;
    const hasta = inpHasta?.value ? new Date(inpHasta.value) : null;

    const fmt = (d) => {
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    };

    // Si estamos en modo comparación
    if (comparisonMode && sensoresComparacion.length > 0) {
        msg.textContent = 'Cargando datos de sensores…';
        await cargarYRenderizarComparacion(sensoresComparacion, metricasSeleccionadas, desde, hasta, fmt);
    } else {
        // Modo simple - un sensor
        const selSensor = document.getElementById('selSensor');
        if (!selSensor?.value) {
            msg.textContent = 'Seleccione un sensor para visualizar.';
            return;
        }

        const params = new URLSearchParams();
        params.set('codigo_sensor', selSensor.value);
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

            const registros = data
                .filter(r => r && r.fecha_captura)
                .sort((a,b) => new Date(a.fecha_captura) - new Date(b.fecha_captura));

            const labels = registros.map(r => new Date(r.fecha_captura));
            
            // Crear un dataset por cada métrica seleccionada
            const datasetsInfo = metricasSeleccionadas.map(metrica => {
                const values = registros.map(r => {
                    const v = r[metrica];
                    if (v === null || v === undefined) return null;
                    const num = parseFloat(v);
                    return Number.isFinite(num) ? num : null;
                });
                
                return {
                    labels,
                    values,
                    label: labelPorTipo(metrica),
                    metrica
                };
            });

            renderChart(datasetsInfo, metricasSeleccionadas[0]);
            calcularEstadisticas(datasetsInfo[0].values, metricasSeleccionadas[0]);
            msg.textContent = registros.length ? '' : 'Sin datos en el rango seleccionado.';
        } catch (e) {
            console.error(e);
            msg.textContent = 'Error al cargar datos.';
        }
    }
}

async function cargarYRenderizarComparacion(sensores, metricasSeleccionadas, desde, hasta, fmt) {
    const msg = document.getElementById('chartMensaje');
    
    try {
        const promesas = sensores.flatMap(sensor => {
            return metricasSeleccionadas.map(async (metrica) => {
                const params = new URLSearchParams();
                params.set('codigo_sensor', sensor.codigo);
                if (desde) params.set('desde', fmt(desde));
                if (hasta) params.set('hasta', fmt(hasta));

                const res = await fetch(`${API_REPORTE}?${params.toString()}`);
                const data = await res.json();

                if (Array.isArray(data)) {
                    const registros = data
                        .filter(r => r && r.fecha_captura)
                        .sort((a,b) => new Date(a.fecha_captura) - new Date(b.fecha_captura));

                    return {
                        labels: registros.map(r => new Date(r.fecha_captura)),
                        values: registros.map(r => {
                            const v = r[metrica];
                            if (v === null || v === undefined) return null;
                            const num = parseFloat(v);
                            return Number.isFinite(num) ? num : null;
                        }),
                        label: `${sensor.nombre} - ${labelPorTipo(metrica)}`,
                        metrica,
                        codigo: sensor.codigo
                    };
                }
                return null;
            });
        });

        const datasetsInfo = (await Promise.all(promesas)).filter(d => d !== null);
        renderChart(datasetsInfo, metricasSeleccionadas[0]);
        
        // Calcular stats del primero
        if (datasetsInfo.length > 0) {
            calcularEstadisticas(datasetsInfo[0].values, datasetsInfo[0].metrica);
        }
        
        msg.textContent = datasetsInfo.length > 0 ? '' : 'Sin datos en el rango seleccionado.';
    } catch (e) {
        console.error(e);
        msg.textContent = 'Error al cargar datos.';
    }
}

function renderChart(datasetsInfo, metrica) {
    const ctx = document.getElementById('chartTimeSeries');
    if (!ctx) return;
    
    if (timeSeriesChart) {
        timeSeriesChart.destroy();
        timeSeriesChart = null;
    }

    const unidad = unidadPorTipo(metrica);
    
    // Convertir labels a strings para evitar problemas con fechas
    const labels = datasetsInfo[0]?.labels || [];
    const labelStrings = labels.map(d => {
        if (d instanceof Date) {
            return d.toLocaleString('es-ES', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        return d;
    });
    
    // Crear datasets con colores distintos
    const datasets = datasetsInfo.map((info, idx) => {
        // Usar color específico según la métrica
        const colorBase = obtenerColorPorTipo(info.metrica || metrica, idx);
        const bgColor = colorBase.replace('1)', '0.15)');
        
        return {
            label: info.label,
            data: info.values,
            segment: { borderColor: colorBase },
            backgroundColor: bgColor,
            borderColor: colorBase,
            borderWidth: 2.5,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: colorBase,
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            spanGaps: true,
            tension: 0.3
        };
    });

    timeSeriesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labelStrings,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { 
                        autoSkip: true,
                        maxTicksLimit: 10,
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: { 
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: true
                    },
                    ticks: { 
                        callback: v => `${v}${unidad ? ' ' + unidad : ''}`,
                        font: { size: 11 }
                    }
                }
            },
            plugins: {
                legend: { 
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 12, weight: 'bold' },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    displayColors: true,
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderWidth: 1,
                    callbacks: {
                        title: (ctx) => {
                            if (ctx[0]) {
                                return ctx[0].label;
                            }
                            return '';
                        },
                        label: (ctx) => {
                            const v = ctx.parsed.y;
                            if (v === null || v === undefined) return '';
                            return `${ctx.dataset.label}: ${v.toFixed(2)}${unidad ? ' ' + unidad : ''}`;
                        }
                    }
                }
            }
        }
    });

    // Actualizar leyenda
    actualizarLeyenda(datasetsInfo, coloresGrafico);
}

function actualizarLeyenda(datasetsInfo, colores) {
    const legendDiv = document.getElementById('chartLegend');
    if (!legendDiv) return;

    legendDiv.innerHTML = datasetsInfo.map((info, idx) => {
        const color = colores[idx % colores.length];
        return `
            <div class="chart-legend-item">
                <div class="chart-legend-color" style="background: ${color};"></div>
                <span>${info.label}</span>
            </div>
        `;
    }).join('');
}

function calcularEstadisticas(values, metrica = 'temperatura') {
    const validValues = values.filter(v => v !== null && v !== undefined && Number.isFinite(v));
    if (validValues.length === 0) {
        document.getElementById('statsContainer').innerHTML = '<div class="text-muted">No hay datos para mostrar estadísticas</div>';
        return;
    }

    const minVal = Math.min(...validValues);
    const maxVal = Math.max(...validValues);
    const promVal = validValues.reduce((a, b) => a + b, 0) / validValues.length;
    
    const unidad = unidadPorTipo(metrica);
    const tipoClase = `stat-box ${metrica}`;

    document.getElementById('statsContainer').innerHTML = `
        <div class="${tipoClase}">
            <div class="stat-label">Valor Máximo</div>
            <div class="stat-value">${maxVal.toFixed(2)}</div>
            <div class="stat-subtext">${unidad}</div>
        </div>
        <div class="${tipoClase}">
            <div class="stat-label">Valor Mínimo</div>
            <div class="stat-value">${minVal.toFixed(2)}</div>
            <div class="stat-subtext">${unidad}</div>
        </div>
        <div class="${tipoClase}">
            <div class="stat-label">Promedio</div>
            <div class="stat-value">${promVal.toFixed(2)}</div>
            <div class="stat-subtext">${unidad}</div>
        </div>
        <div class="${tipoClase}">
            <div class="stat-label">Total Datos</div>
            <div class="stat-value">${validValues.length}</div>
            <div class="stat-subtext">registros</div>
        </div>
    `;
}

function exportarDatos() {
    if (!timeSeriesChart || !timeSeriesChart.data.labels) {
        alert('No hay datos para exportar');
        return;
    }

    const labels = timeSeriesChart.data.labels;
    const datasets = timeSeriesChart.data.datasets;
    
    let csv = 'Fecha/Hora';
    datasets.forEach(ds => {
        csv += `,${ds.label}`;
    });
    csv += '\n';

    labels.forEach((label, idx) => {
        csv += new Date(label).toLocaleString('es-ES');
        datasets.forEach(ds => {
            csv += `,${ds.data[idx] || ''}`;
        });
        csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datos_${new Date().getTime()}.csv`;
    a.click();
}

// ====== Tarjetas de cuartos ======
function generarFiltros() {
    const contenedor = document.getElementById("filtrosCuartos");
    if (!contenedor) return;
    
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
    
    if (!contenedor) return;
    
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
        tarjeta.setAttribute('data-cuarto-codigo', cuarto.codigo);
        contenedor.appendChild(tarjeta);
    });
}

function crearTarjetaCuarto(cuarto) {
    const col = document.createElement("div");
    col.className = "col-lg-6 col-xl-4";
    
    const sensores = Object.values(cuarto.sensores);
    
    // Buscar temperatura: el API ya separó temperatura_humedad en entradas individuales
    const sensorTemp = sensores.find(s => {
        const tipo = (s.tipo || '').toLowerCase();
        return tipo === 'temperatura';
    });
    
    // Buscar humedad: el API ya separó temperatura_humedad en entradas individuales
    const sensorHum = sensores.find(s => {
        const tipo = (s.tipo || '').toLowerCase();
        return tipo === 'humedad';
    });

    const tempVal  = sensorTemp?.ultima?.valor ?? null;
    const tempProm = sensorTemp?.promedio?.prom_dia ?? null;
    const humVal   = sensorHum?.ultima?.valor ?? null;
    const humProm  = sensorHum?.promedio?.prom_dia ?? null;

    // Checkboxes para modo comparación en indicadores principales
    const checkboxTemp = (comparisonMode && sensorTemp) ? `
        <input type="checkbox" class="sensor-checkbox me-2" value="${sensorTemp.codigo}" 
               onchange="actualizarSensorComparacion(this, '${sensorTemp.codigo}', '${sensorTemp.nombre}')">
    ` : '';
    
    const checkboxHum = (comparisonMode && sensorHum) ? `
        <input type="checkbox" class="sensor-checkbox me-2" value="${sensorHum.codigo}" 
               onchange="actualizarSensorComparacion(this, '${sensorHum.codigo}', '${sensorHum.nombre}')">
    ` : '';

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
            <div class="indicator-block">
                <div class="indicator-item">
                    <div class="indicator-label">
                        ${checkboxTemp}
                        Temperatura
                    </div>
                    <div class="indicator-value">
                        ${tempVal !== null && tempVal !== undefined ? `${parseFloat(tempVal).toFixed(1)}°C` : 'Sin datos'}
                    </div>
                    <div class="indicator-promedio">Prom: ${tempProm !== null && tempProm !== undefined ? `${parseFloat(tempProm).toFixed(1)}°C` : '—'}</div>
                </div>
                <div class="indicator-item">
                    <div class="indicator-label">
                        ${checkboxHum}
                        Humedad
                    </div>
                    <div class="indicator-value">
                        ${humVal !== null && humVal !== undefined ? `${parseFloat(humVal).toFixed(1)}%` : 'Sin datos'}
                    </div>
                    <div class="indicator-promedio">Prom: ${humProm !== null && humProm !== undefined ? `${parseFloat(humProm).toFixed(1)}%` : '—'}</div>
                </div>
            </div>
            ${sensoresLista.length > 0 ? `
            <button class="toggle-sensors collapsed" onclick="toggleSensores(this, '${cuarto.codigo}')">
                <i class="bi bi-chevron-right"></i>
                <span>Ver otros sensores (${sensoresLista.length})</span>
            </button>
            
            <div class="sensores-list" id="sensores_${cuarto.codigo}">
                ${generarSensoresList(sensoresLista)}
            </div>
            ` : ''}
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

        const valorTexto = valor !== null ? `${parseFloat(valor).toFixed(tipo === 'amperaje' ? 2 : 1)} ${unidadPorTipo(tipo)}` : '—';
        const promTexto = prom !== null && prom !== undefined ? `${parseFloat(prom).toFixed(tipo === 'amperaje' ? 2 : 1)} ${unidadPorTipo(tipo)}` : 'Sin datos';

        const datosHtml = `
            <div class="sensor-dato">
                <div class="sensor-dato-label">${labelPorTipo(tipo)}</div>
                <div class="sensor-dato-valor">${valorTexto}</div>
                <div class="sensor-dato-unidad">Promedio: ${promTexto}</div>
            </div>
        `;

        const checkboxHtml = comparisonMode ? `
            <input type="checkbox" class="sensor-checkbox" value="${sensor.codigo}" 
                   onchange="actualizarSensorComparacion(this, '${sensor.codigo}', '${sensor.nombre}')">
        ` : '';

        html += `
            <div class="sensor-item">
                <div class="sensor-nombre">
                    ${checkboxHtml}
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

function actualizarSensorComparacion(checkbox, codigo, nombre) {
    if (checkbox.checked) {
        agregarSensorComparacion(codigo, nombre);
    } else {
        removerSensorComparacion(codigo);
    }
    actualizarGrafico();
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
    
    if (mensajeCarga) {
        mensajeCarga.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${mensaje}
            </div>
        `;
        mensajeCarga.style.display = "block";
    }
}
