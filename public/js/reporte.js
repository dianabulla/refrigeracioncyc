const API_URL_REPORTE = "../api/reporte.php";
const API_URL_SENSOR = "../api/sensor.php";
const API_URL_CUARTO = "../api/cuarto_frio.php";

// Variables globales para los gráficos
let chartTemperatura = null;
let chartHumedad = null;
let chartElectrico = null;
let chartPresion = null;

let datosReportes = [];
let cuartoSeleccionado = null;

// Toggle entre vista de gráficos y tabla
let vistaActual = 'graficos'; // 'graficos' o 'tabla'

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
  const tr = document.createElement("tr");
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
  
  tr.innerHTML = `
    <td>${item.id ?? '-'}</td>
    <td>${item.codigo ?? '-'}</td>
    <td>${item.nombre ?? '-'}</td>
    <td>${item.tipo_reporte ?? '-'}</td>
    <td>${item.report_id ?? '-'}</td>
    <td>${item.codigo_sensor ?? '-'}</td>
    <td>${item.codigo_cuarto ?? '-'}</td>
    <td>${item.fecha_captura ?? '-'}</td>
    <td>${item.fecha ?? '-'}</td>
    <td class="text-center">${temp}</td>
    <td class="text-center">${hum}</td>
    <td class="text-center">${volt}</td>
    <td class="text-center">${amp}</td>
    <td class="text-center">${pS}</td>
    <td class="text-center">${pE}</td>
    <td class="text-center">${aire}</td>
    <td class="text-center">${otro}</td>
    <td class="text-center">${puerta}</td>
    <td class="text-center"><span class="badge ${item.activo === 1 ? 'bg-success' : 'bg-secondary'}">${item.activo === 1 ? 'Activo' : 'Inactivo'}</span></td>
    <td>${item.fecha_creacion ?? '-'}</td>
    <td>${item.updated_at ?? '-'}</td>
  `;
  return tr;
}

async function cargarSensoresFiltro() {
  const select = document.getElementById("filtro_sensor");
  if (!select) return;

  try {
    const res = await fetch(API_URL_SENSOR);
    const data = await res.json();
    if (!Array.isArray(data)) return;

    select.innerHTML = '<option value="">Todos</option>';
    data.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.codigo;
      opt.textContent = `${s.codigo} - ${s.nombre}`;
      select.appendChild(opt);
    });
  } catch (e) {
    // Error silencioso
  }
}

async function cargarReportes() {
  const sensor = document.getElementById("filtro_sensor")?.value || "";
  const desde = document.getElementById("filtro_desde")?.value || "";
  const hasta = document.getElementById("filtro_hasta")?.value || "";

  const params = new URLSearchParams();
  if (sensor) params.append("codigo_sensor", sensor);
  if (desde) params.append("desde", desde);
  if (hasta) params.append("hasta", hasta);

  const url = params.toString()
    ? `${API_URL_REPORTE}?${params.toString()}`
    : API_URL_REPORTE;

  const tbody = document.getElementById("tablaReportes");
  
  try {
    // Mostrar mensaje de carga
    tbody.innerHTML = '<tr><td colspan="21" class="text-center py-4"><i class="bi bi-hourglass-split"></i> Cargando reportes...</td></tr>';
    
    const res = await fetch(url);
    const data = await res.json();

    tbody.innerHTML = "";
    
    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="21" class="text-center py-4 text-muted"><i class="bi bi-inbox"></i> No se encontraron reportes</td></tr>';
      return;
    }

    data.forEach((item) => tbody.appendChild(crearFilaReporte(item)));
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="21" class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle"></i> Error al cargar reportes</td></tr>';
    console.error('Error cargando reportes:', e);
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
    cargarSensoresFiltro();
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

  // Configurar fechas por defecto (hoy) para filtrar de entrada y acelerar carga
  const hoy = new Date();
  const hoyStr = hoy.toISOString().slice(0, 10); // YYYY-MM-DD

  const inputDesde = document.getElementById("graficosDesde");
  const inputHasta = document.getElementById("graficosHasta");
  const filtroDesde = document.getElementById("filtro_desde");
  const filtroHasta = document.getElementById("filtro_hasta");
  
  if (inputDesde && !inputDesde.value) inputDesde.valueAsDate = hoy;
  if (inputHasta && !inputHasta.value) inputHasta.valueAsDate = hoy;
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
      document.getElementById("filtro_sensor").value = "";
      document.getElementById("filtro_desde").value = "";
      document.getElementById("filtro_hasta").value = "";
      cargarReportes();
    });
  }

  // Cargar reportes automáticamente al iniciar
  cargarSensoresFiltro();
  cargarReportes();
});
