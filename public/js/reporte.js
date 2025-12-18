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
  tr.innerHTML = `
    <td>${item.id ?? "-"}</td>
    <td>${item.codigo || "-"}</td>
    <td>${item.nombre || "-"}</td>
    <td>${item.tipo_reporte || "-"}</td>
    <td>${item.codigo_sensor || "-"}</td>
    <td>${item.fecha_captura || "-"}</td>
    <td>${item.voltaje ?? "-"}</td>
    <td>${item.amperaje ?? "-"}</td>
    <td>${item.temperatura ?? "-"}</td>
    <td>${item.humedad ?? "-"}</td>
    <td>${item.presion_s ?? "-"}</td>
    <td>${item.presion_e ?? "-"}</td>
    <td>${item.puerta ?? "-"}</td>
    <td>${item.aire ?? "-"}</td>
    <td>${item.otro ?? "-"}</td>
    <td>${item.activo === 1 ? "Activo" : "Inactivo"}</td>
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

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data)) {
      return;
    }

    const tbody = document.getElementById("tablaReportes");
    tbody.innerHTML = "";
    data.forEach((item) => tbody.appendChild(crearFilaReporte(item)));
  } catch (e) {
    // Error silencioso
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

  // Configurar fechas por defecto (últimos 7 días)
  const hoy = new Date();
  const hace7dias = new Date(hoy);
  hace7dias.setDate(hace7dias.getDate() - 7);
  
  const inputDesde = document.getElementById("graficosDesde");
  const inputHasta = document.getElementById("graficosHasta");
  
  if (inputDesde) inputDesde.valueAsDate = hace7dias;
  if (inputHasta) inputHasta.valueAsDate = hoy;

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
});
