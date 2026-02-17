const API_URL_REPORTE = "../api/reporte.php";
const API_URL_SENSOR = "../api/sensor.php";
const API_URL_CUARTO = "../api/cuarto_frio.php";
const API_URL_FINCA = "../api/finca.php";

// Variables globales para los gráficos
let chartTemperatura = null;
let chartHumedad = null;
let chartElectrico = null;
let chartPresion = null;

let datosReportes = [];
let cuartoSeleccionado = null;

// Toggle entre vista de gráficos y tabla
let vistaActual = 'graficos'; // 'graficos' o 'tabla'

// Almacenar reportes para exportación (cache)
let reportesCache = new Map();

/**
 * Cargar cuartos fríos en el selector
 */
async function cargarCuartosFrios() {
  const select = document.getElementById("selectCuartoFrio");
  if (!select) return;

  try {
    const res = await fetch(API_URL_CUARTO);
    const data = await res.json();
    
    let cuartos = [];
    if (Array.isArray(data)) {
      cuartos = data;
    } else if (data.ok && Array.isArray(data.data)) {
      cuartos = data.data;
    }

    select.innerHTML = '<option value="">-- Seleccione un cuarto frío --</option>';
    
    cuartos.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.codigo;
      opt.textContent = `${c.codigo} - ${c.nombre}`;
      select.appendChild(opt);
    });

    // Si hay cuartos, seleccionar el primero automáticamente
    if (cuartos.length > 0) {
      select.value = cuartos[0].codigo;
      cuartoSeleccionado = cuartos[0].codigo;
      cargarDatosYActualizarGraficos();
    }
  } catch (e) {
    select.innerHTML = '<option value="">Error al cargar cuartos</option>';
  }
}

/**
 * Cargar datos de reportes del cuarto seleccionado
 */
async function cargarDatosYActualizarGraficos() {
  if (!cuartoSeleccionado) {
    return;
  }

  const desde = document.getElementById("graficosDesde")?.value || "";
  const hasta = document.getElementById("graficosHasta")?.value || "";

  try {
    // Obtener reportes filtrando por codigo_cuarto
    const params = new URLSearchParams();
    params.append("codigo_cuarto", cuartoSeleccionado);
    if (desde) params.append("desde", desde + " 00:00:00");
    if (hasta) params.append("hasta", hasta + " 23:59:59");

    const url = `${API_URL_REPORTE}?${params.toString()}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data)) {
      datosReportes = [];
    } else {
      datosReportes = data;
    }
    
    // Actualizar estadísticas
    actualizarEstadisticas(datosReportes);
    
    // Actualizar gráficos
    actualizarGraficos(datosReportes);
    
  } catch (e) {
    datosReportes = [];
    actualizarEstadisticas([]);
    actualizarGraficos([]);
  }
}

/**
 * Actualizar estadísticas rápidas
 */
function actualizarEstadisticas(datos) {
  const total = datos.length;
  
  const temperaturas = datos.map(d => parseFloat(d.temperatura)).filter(v => !isNaN(v));
  const humedades = datos.map(d => parseFloat(d.humedad)).filter(v => !isNaN(v));
  const voltajes = datos.map(d => parseFloat(d.voltaje)).filter(v => !isNaN(v));
  
  const tempPromedio = temperaturas.length > 0
    ? (temperaturas.reduce((a, b) => a + b, 0) / temperaturas.length).toFixed(1)
    : "--";
  
  const humPromedio = humedades.length > 0
    ? (humedades.reduce((a, b) => a + b, 0) / humedades.length).toFixed(1)
    : "--";
  
  const voltPromedio = voltajes.length > 0
    ? (voltajes.reduce((a, b) => a + b, 0) / voltajes.length).toFixed(1)
    : "--";
  
  document.getElementById("statTempPromedio").textContent = tempPromedio !== "--" ? `${tempPromedio}°C` : "--";
  document.getElementById("statHumedadPromedio").textContent = humPromedio !== "--" ? `${humPromedio}%` : "--";
  document.getElementById("statVoltajePromedio").textContent = voltPromedio !== "--" ? `${voltPromedio}V` : "--";
  document.getElementById("statTotalReportes").textContent = total;
}

/**
 * Actualizar todos los gráficos
 */
function actualizarGraficos(datos) {
  const mensajeNoDatos = document.getElementById("mensajeNoDatos");
  const contenedorGraficos = document.getElementById("contenedorGraficos");
  
  if (!datos || datos.length === 0) {
    // Mostrar mensaje de no datos
    if (mensajeNoDatos) mensajeNoDatos.style.display = 'block';
    if (contenedorGraficos) contenedorGraficos.style.display = 'none';
    
    // Actualizar con datos vacíos
    actualizarGraficoTemperatura([], []);
    actualizarGraficoHumedad([], []);
    actualizarGraficoElectrico([], [], []);
    actualizarGraficoPresion([], [], []);
    return;
  }
  
  // Ocultar mensaje y mostrar gráficos
  if (mensajeNoDatos) mensajeNoDatos.style.display = 'none';
  if (contenedorGraficos) contenedorGraficos.style.display = '';

  // Ordenar datos por fecha
  const datosOrdenados = datos.sort((a, b) => 
    new Date(a.fecha_captura) - new Date(b.fecha_captura)
  );

  // Preparar datos para los gráficos
  const labels = datosOrdenados.map(d => {
    const fecha = new Date(d.fecha_captura);
    return fecha.toLocaleString('es-ES', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  });

  const temperaturas = datosOrdenados.map(d => parseFloat(d.temperatura) || null);
  const humedades = datosOrdenados.map(d => parseFloat(d.humedad) || null);
  const voltajes = datosOrdenados.map(d => parseFloat(d.voltaje) || null);
  const amperajes = datosOrdenados.map(d => parseFloat(d.amperaje) || null);
  const presionS = datosOrdenados.map(d => parseFloat(d.presion_s) || null);
  const presionE = datosOrdenados.map(d => parseFloat(d.presion_e) || null);

  // Actualizar gráfico de temperatura
  actualizarGraficoTemperatura(labels, temperaturas);
  
  // Actualizar gráfico de humedad
  actualizarGraficoHumedad(labels, humedades);
  
  // Actualizar gráfico eléctrico
  actualizarGraficoElectrico(labels, voltajes, amperajes);
  
  // Actualizar gráfico de presión
  actualizarGraficoPresion(labels, presionS, presionE);
}

/**
 * Gráfico de Temperatura
 */
function actualizarGraficoTemperatura(labels, datos) {
  const ctx = document.getElementById('chartTemperatura');
  if (!ctx) return;

  if (chartTemperatura) {
    chartTemperatura.destroy();
  }

  chartTemperatura = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Temperatura (°C)',
        data: datos,
        borderColor: 'rgb(220, 53, 69)',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return value + '°C';
            }
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
}

/**
 * Gráfico de Humedad
 */
function actualizarGraficoHumedad(labels, datos) {
  const ctx = document.getElementById('chartHumedad');
  if (!ctx) return;

  if (chartHumedad) {
    chartHumedad.destroy();
  }

  chartHumedad = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Humedad (%)',
        data: datos,
        borderColor: 'rgb(13, 202, 240)',
        backgroundColor: 'rgba(13, 202, 240, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
}

/**
 * Gráfico Eléctrico (Voltaje y Amperaje)
 */
function actualizarGraficoElectrico(labels, voltajes, amperajes) {
  const ctx = document.getElementById('chartElectrico');
  if (!ctx) return;

  if (chartElectrico) {
    chartElectrico.destroy();
  }

  chartElectrico = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Voltaje (V)',
          data: voltajes,
          borderColor: 'rgb(255, 193, 7)',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          yAxisID: 'y',
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Amperaje (A)',
          data: amperajes,
          borderColor: 'rgb(255, 87, 34)',
          backgroundColor: 'rgba(255, 87, 34, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          yAxisID: 'y1',
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Voltaje (V)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Amperaje (A)'
          },
          grid: {
            drawOnChartArea: false,
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
}

/**
 * Gráfico de Presión
 */
function actualizarGraficoPresion(labels, presionS, presionE) {
  const ctx = document.getElementById('chartPresion');
  if (!ctx) return;

  if (chartPresion) {
    chartPresion.destroy();
  }

  chartPresion = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Presión Succión',
          data: presionS,
          borderColor: 'rgb(13, 110, 253)',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Presión Entrada',
          data: presionE,
          borderColor: 'rgb(111, 66, 193)',
          backgroundColor: 'rgba(111, 66, 193, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Presión (PSI)'
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
}

/**
 * Funciones de la vista de tabla (legacy)
 */
function crearFilaReporte(item) {
  // Formato de valores para evitar desalineamiento
  const temp = item.temperatura !== null && item.temperatura !== undefined ? parseFloat(item.temperatura).toFixed(1) + '°C' : '-';
  const hum = item.humedad !== null && item.humedad !== undefined ? parseFloat(item.humedad).toFixed(1) + '%' : '-';
  const volt = item.voltaje !== null && item.voltaje !== undefined ? parseFloat(item.voltaje).toFixed(1) + 'V' : '-';
  const amp = item.amperaje !== null && item.amperaje !== undefined ? parseFloat(item.amperaje).toFixed(1) + 'A' : '-';
  const pS = item.presion_s !== null && item.presion_s !== undefined ? parseFloat(item.presion_s).toFixed(1) : '-';
  const pE = item.presion_e !== null && item.presion_e !== undefined ? parseFloat(item.presion_e).toFixed(1) : '-';
  const aire = item.aire !== null && item.aire !== undefined ? parseFloat(item.aire).toFixed(1) : '-';
  const otro = item.otro !== null && item.otro !== undefined ? parseFloat(item.otro).toFixed(1) : '-';
  const puerta = item.puerta !== null && item.puerta !== undefined ? parseFloat(item.puerta).toFixed(1) : '-';
  
  // Colores específicos para cada ubicación
  const coloresUbicacion = {
    'exterior': 'bg-info',        // Azul claro
    'interior': 'bg-primary',     // Azul oscuro
    'tuberia': 'bg-green-fresh',  // Verde pastel
    'otro': 'bg-gray-light'       // Gris claro
  };
  
  const badgeColor = coloresUbicacion[item.ubicacion] || 'bg-info';
  
  // Crear elementos de forma programática para evitar problemas de escapado
  const tr = document.createElement("tr");
  
  // Generar ID único para este reporte
  const reporteId = String(item.id || item.codigo || Math.random().toString(36).substring(7));
  
  // Almacenar en caché para exportación (sin tocar el DOM)
  reportesCache.set(reporteId, item);
  
  // Checkbox
  const tdCheckbox = document.createElement("td");
  tdCheckbox.className = "text-center";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "form-check-input checkbox-reporte";
  checkbox.dataset.reporteId = reporteId;
  tdCheckbox.appendChild(checkbox);
  tr.appendChild(tdCheckbox);
  
  // Resto de columnas usando textContent para seguridad
  const addCell = (text, className = '') => {
    const td = document.createElement("td");
    if (className) td.className = className;
    td.textContent = text || '-';
    tr.appendChild(td);
  };
  
  addCell(item.codigo);
  addCell(item.nombre);
  addCell(item.tipo_reporte);
  addCell(item.report_id);
  addCell(item.codigo_sensor);
  addCell(item.codigo_cuarto);
  
  // Ubicación con badge
  const tdUbicacion = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = `badge ${badgeColor}`;
  badge.textContent = item.ubicacion || 'exterior';
  tdUbicacion.appendChild(badge);
  tr.appendChild(tdUbicacion);
  
  addCell(item.fecha_captura);
  addCell(item.fecha);
  addCell(temp, 'text-center');
  addCell(hum, 'text-center');
  addCell(volt, 'text-center');
  addCell(amp, 'text-center');
  addCell(pS, 'text-center');
  addCell(pE, 'text-center');
  addCell(aire, 'text-center');
  addCell(otro, 'text-center');
  addCell(puerta, 'text-center');
  addCell(item.fecha_creacion);
  addCell(item.updated_at);
  
  return tr;
}

async function cargarFincasFiltro() {
  const select = document.getElementById("filtro_finca");
  if (!select) return;

  try {
    const res = await fetch(API_URL_FINCA);
    const data = await res.json();
    if (!Array.isArray(data)) return;

    select.innerHTML = '<option value="">Todas las fincas</option>';
    data.forEach((f) => {
      const opt = document.createElement("option");
      opt.value = f.codigo;
      opt.textContent = `${f.codigo} - ${f.nombre}`;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error("Error cargando fincas:", e);
  }
}

async function cargarCuartosFiltro(codigoFinca = "") {
  const select = document.getElementById("filtro_cuarto");
  if (!select) return;

  try {
    let url = API_URL_CUARTO;
    if (codigoFinca) {
      url += `?codigo_finca=${codigoFinca}`;
    }
    
    const res = await fetch(url);
    const data = await res.json();
    let cuartos = [];
    
    if (Array.isArray(data)) {
      cuartos = data;
    } else if (data.ok && Array.isArray(data.data)) {
      cuartos = data.data;
    }

    select.innerHTML = '<option value="">Todos los cuartos</option>';
    cuartos.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.codigo;
      opt.textContent = `${c.codigo} - ${c.nombre}`;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error("Error cargando cuartos:", e);
    select.innerHTML = '<option value="">Error al cargar cuartos</option>';
  }
}

async function cargarReportes() {
  const finca = document.getElementById("filtro_finca")?.value || "";
  const cuarto = document.getElementById("filtro_cuarto")?.value || "";
  const desde = document.getElementById("filtro_desde")?.value || "";
  const hasta = document.getElementById("filtro_hasta")?.value || "";

  const params = new URLSearchParams();
  if (finca) params.append("codigo_finca", finca);
  if (cuarto) params.append("codigo_cuarto", cuarto);
  if (desde) params.append("desde", desde);
  if (hasta) params.append("hasta", hasta);

  const url = params.toString()
    ? `${API_URL_REPORTE}?${params.toString()}`
    : API_URL_REPORTE;

  const tbody = document.getElementById("tablaReportes");
  
  try {
    // Mostrar mensaje de carga
    tbody.innerHTML = '<tr><td colspan="22" class="text-center py-4"><i class="bi bi-hourglass-split"></i> Cargando reportes...</td></tr>';
    
    const res = await fetch(url);
    const data = await res.json();

    tbody.innerHTML = "";
    
    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="22" class="text-center py-4 text-muted"><i class="bi bi-inbox"></i> No se encontraron reportes</td></tr>';
      // Resetear checkboxes y contador
      const checkTodos = document.getElementById("checkTodos");
      if (checkTodos) checkTodos.checked = false;
      actualizarContadorSeleccionados();
      return;
    }

    console.log('Reportes recibidos del API:', data.length, 'registros');
    
    data.forEach((item) => tbody.appendChild(crearFilaReporte(item)));
    
    // Resetear checkboxes y contador despu\u00e9s de cargar
    const checkTodos = document.getElementById("checkTodos");
    if (checkTodos) checkTodos.checked = false;
    actualizarContadorSeleccionados();
    
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="22" class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle"></i> Error al cargar reportes</td></tr>';
    console.error('Error cargando reportes:', e);
    actualizarContadorSeleccionados();
  }
}

/**
 * Toggle entre vista de gráficos y tabla
 */
function toggleVista() {
  const btnToggle = document.getElementById("btnToggleView");
  const seccionGraficos = document.getElementById("seccionGraficos");
  const seccionTabla = document.getElementById("seccionTabla");

  if (vistaActual === 'graficos') {
    // Cambiar a tabla
    vistaActual = 'tabla';
    seccionGraficos.style.display = 'none';
    seccionTabla.style.display = 'block';
    btnToggle.innerHTML = '<i class="bi bi-graph-up me-2"></i>Ver Gráficos';
    cargarFincasFiltro();
    cargarCuartosFiltro();
    cargarReportes();
  } else {
    // Cambiar a gráficos
    vistaActual = 'graficos';
    seccionGraficos.style.display = 'block';
    seccionTabla.style.display = 'none';
    btnToggle.innerHTML = '<i class="bi bi-table me-2"></i>Ver Tabla';
  }
}

/**
 * Mostrar mensaje
 */
function mostrarMensaje(mensaje, tipo = "info") {
  // Implementación simple - puede mejorarse con toasts
}

/**
 * Inicialización
 */
document.addEventListener("DOMContentLoaded", () => {
  // Cargar cuartos fríos
  cargarCuartosFrios();

  // Configurar fechas por defecto (hoy) usando la zona horaria local
  const hoy = new Date();
  // Ajustar a zona horaria de Bogotá (UTC-5) para obtener la fecha correcta
  const hoyBogota = new Date(hoy.getTime() - (hoy.getTimezoneOffset() * 60000));
  const hoyStr = hoyBogota.toISOString().slice(0, 10); // YYYY-MM-DD

  const inputDesde = document.getElementById("graficosDesde");
  const inputHasta = document.getElementById("graficosHasta");
  const filtroDesde = document.getElementById("filtro_desde");
  const filtroHasta = document.getElementById("filtro_hasta");
  
  if (inputDesde && !inputDesde.value) inputDesde.value = hoyStr;
  if (inputHasta && !inputHasta.value) inputHasta.value = hoyStr;
  if (filtroDesde && !filtroDesde.value) filtroDesde.value = hoyStr;
  if (filtroHasta && !filtroHasta.value) filtroHasta.value = hoyStr;

  // Event listeners
  const selectCuarto = document.getElementById("selectCuartoFrio");
  if (selectCuarto) {
    selectCuarto.addEventListener("change", (e) => {
      cuartoSeleccionado = e.target.value;
      if (cuartoSeleccionado) {
        cargarDatosYActualizarGraficos();
      }
    });
  }

  const btnActualizar = document.getElementById("btnActualizarGraficos");
  if (btnActualizar) {
    btnActualizar.addEventListener("click", () => {
      cargarDatosYActualizarGraficos();
    });
  }

  const btnToggle = document.getElementById("btnToggleView");
  if (btnToggle) {
    btnToggle.addEventListener("click", toggleVista);
  }

  // Filtros de tabla (legacy)
  const formFiltros = document.getElementById("formFiltros");
  if (formFiltros) {
    formFiltros.addEventListener("submit", (e) => {
      e.preventDefault();
      cargarReportes();
    });
  }

  const btnLimpiar = document.getElementById("btnLimpiarFiltros");
  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      document.getElementById("filtro_finca").value = "";
      document.getElementById("filtro_cuarto").value = "";
      document.getElementById("filtro_desde").value = "";
      document.getElementById("filtro_hasta").value = "";
      cargarCuartosFiltro(); // Recargar todos los cuartos
      cargarReportes();
    });
  }

  // Listener para el filtro de finca - recargar cuartos cuando cambie
  const filtroFinca = document.getElementById("filtro_finca");
  if (filtroFinca) {
    filtroFinca.addEventListener("change", (e) => {
      const codigoFinca = e.target.value;
      cargarCuartosFiltro(codigoFinca);
    });
  }

  // ====== FUNCIONALIDAD DE SELECCI\u00d3N Y DESCARGA ======
  
  // Checkbox "Seleccionar todos"
  const checkTodos = document.getElementById("checkTodos");
  if (checkTodos) {
    checkTodos.addEventListener("change", (e) => {
      const checkboxes = document.querySelectorAll(".checkbox-reporte");
      checkboxes.forEach(cb => cb.checked = e.target.checked);
      actualizarContadorSeleccionados();
    });
  }

  // Delegar evento para checkboxes individuales
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("checkbox-reporte")) {
      actualizarContadorSeleccionados();
      
      // Actualizar estado del checkbox "todos"
      const checkboxes = document.querySelectorAll(".checkbox-reporte");
      const todosSeleccionados = Array.from(checkboxes).every(cb => cb.checked);
      const checkTodos = document.getElementById("checkTodos");
      if (checkTodos) {
        checkTodos.checked = todosSeleccionados;
      }
    }
  });

  // Bot\u00f3n descargar seleccionados
  const btnDescargar = document.getElementById("btnDescargarSeleccionados");
  if (btnDescargar) {
    btnDescargar.addEventListener("click", descargarReportesSeleccionados);
  }
  // Cargar filtros y reportes al iniciar la página
  cargarFincasFiltro();
  cargarCuartosFiltro();
  cargarReportes();
});

/**
 * Actualizar contador de reportes seleccionados
 */
function actualizarContadorSeleccionados() {
  const contador = document.getElementById("contadorSeleccionados");
  const btnDescargar = document.getElementById("btnDescargarSeleccionados");
  
  // Verificar que los elementos existan (por si se llama antes del DOM ready)
  if (!contador || !btnDescargar) return;
  
  const checkboxes = document.querySelectorAll(".checkbox-reporte:checked");
  const cantidad = checkboxes.length;
  
  contador.textContent = `${cantidad} seleccionado${cantidad !== 1 ? 's' : ''}`;
  btnDescargar.disabled = cantidad === 0;
}

/**
 * Descargar reportes seleccionados a Excel (CSV)
 */
function descargarReportesSeleccionados() {
  const checkboxes = document.querySelectorAll(".checkbox-reporte:checked");
  
  if (checkboxes.length === 0) {
    alert("No hay reportes seleccionados");
    return;
  }
  
  // Recopilar datos de los reportes seleccionados desde el caché
  const reportesSeleccionados = [];
  checkboxes.forEach(checkbox => {
    const reporteId = checkbox.dataset.reporteId;
    if (reporteId && reportesCache.has(reporteId)) {
      const reporte = reportesCache.get(reporteId);
      reportesSeleccionados.push(reporte);
    }
  });
  
  if (reportesSeleccionados.length === 0) {
    alert("No se pudieron obtener los datos de los reportes");
    return;
  }
  
  // Generar CSV
  const csv = generarCSV(reportesSeleccionados);
  
  // Descargar archivo
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `reportes_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Mensaje de éxito
  alert('¡Se descargaron ' + reportesSeleccionados.length + ' reporte(s) exitosamente!');
}

/**
 * Generar CSV desde array de reportes
 */
function generarCSV(reportes) {
  if (!reportes || reportes.length === 0) return "";
  
  // Encabezados - usando punto y coma para mejor compatibilidad con Excel en español
  const headers = [
    "Código", "Nombre", "Tipo", "Report ID", "Sensor", "Cuarto", "Ubicación",
    "Fecha Captura", "Fecha", "Temperatura (°C)", "Humedad (%)", "Voltaje (V)", "Amperaje (A)",
    "Presión S", "Presión E", "Aire", "Otro", "Puerta",
    "Fecha Creación", "Actualizado"
  ];
  
  let csv = headers.join(";") + "\n";
  
  // Filas
  reportes.forEach(r => {
    const row = [
      escaparCSV(r.codigo),
      escaparCSV(r.nombre),
      escaparCSV(r.tipo_reporte),
      escaparCSV(r.report_id),
      escaparCSV(r.codigo_sensor),
      escaparCSV(r.codigo_cuarto),
      escaparCSV(r.ubicacion),
      escaparCSV(r.fecha_captura),
      escaparCSV(r.fecha),
      formatearNumero(r.temperatura),
      formatearNumero(r.humedad),
      formatearNumero(r.voltaje),
      formatearNumero(r.amperaje),
      formatearNumero(r.presion_s),
      formatearNumero(r.presion_e),
      formatearNumero(r.aire),
      formatearNumero(r.otro),
      formatearNumero(r.puerta),
      escaparCSV(r.fecha_creacion),
      escaparCSV(r.updated_at)
    ];
    csv += row.join(";") + "\n";
  });
  
  return csv;
}

/**
 * Formatear número para Excel
 */
function formatearNumero(valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  const num = parseFloat(valor);
  if (isNaN(num)) return "";
  // Usar punto como separador decimal para Excel
  return num.toString().replace(",", ".");
}

/**
 * Escapar valores para CSV
 */
function escaparCSV(valor) {
  if (valor === null || valor === undefined) return "";
  const str = String(valor);
  // Si contiene punto y coma, comillas o salto de línea, envolver en comillas
  if (str.includes(";") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"'; 
  }
  return str;
}
