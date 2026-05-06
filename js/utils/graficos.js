/* ============================================
   GRÁFICOS DEL DASHBOARD
   Usa Chart.js (cargado por CDN en index.html)
   ============================================ */

const Graficos = {
  
  // Guardamos las instancias para destruirlas al re-renderizar
  instancias: {},
  
  /**
   * Destruye un gráfico previo si existe
   */
  destruir(id) {
    if (this.instancias[id]) {
      this.instancias[id].destroy();
      delete this.instancias[id];
    }
  },
  
  /**
   * Destruye todos los gráficos
   */
  destruirTodos() {
    Object.keys(this.instancias).forEach(id => this.destruir(id));
  },
  
  /**
   * Configuración base que comparten todos los gráficos
   */
  configBase() {
    const colores = Theme.coloresGrafico();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 41, 0.95)',
          titleColor: '#fff',
          bodyColor: 'rgba(255, 255, 255, 0.85)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          titleFont: { family: "'Inter', sans-serif", size: 12, weight: '600' },
          bodyFont: { family: "'Inter', sans-serif", size: 12 },
        },
      },
      scales: {
        x: {
          grid: { color: colores.grid, drawBorder: false },
          ticks: { color: colores.textSecondary, font: { family: "'Inter', sans-serif", size: 11 } },
        },
        y: {
          grid: { color: colores.grid, drawBorder: false },
          ticks: { color: colores.textSecondary, font: { family: "'Inter', sans-serif", size: 11 } },
        },
      },
    };
  },
  
  /**
   * GRÁFICO 1: Línea - Gastos diarios del mes actual
   */
  gastosDiarios(canvasId) {
    this.destruir(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Calcular gastos por día del mes actual
    const ahora = new Date();
    const diasEnMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
    const transacciones = API.obtenerTransacciones({
      tipo: 'egreso',
      mes: ahora.getMonth() + 1,
      anio: ahora.getFullYear(),
    });
    
    // Acumulado por día
    const datosPorDia = new Array(diasEnMes).fill(0);
    transacciones.forEach(t => {
      const dia = new Date(t.fecha).getDate();
      datosPorDia[dia - 1] += Formato.convertir(t.monto, t.moneda, 'PEN');
    });
    
    const labels = Array.from({ length: diasEnMes }, (_, i) => i + 1);
    
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    
    this.instancias[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: datosPorDia,
          borderColor: '#3B82F6',
          backgroundColor: gradient,
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }],
      },
      options: {
        ...this.configBase(),
        plugins: {
          ...this.configBase().plugins,
          tooltip: {
            ...this.configBase().plugins.tooltip,
            callbacks: {
              title: (items) => `Día ${items[0].label}`,
              label: (item) => `Gastado: ${Formato.formatearMoneda(item.parsed.y, 'PEN')}`,
            },
          },
        },
      },
    });
  },
  
  /**
   * GRÁFICO 2: Barras dobles - Ingresos vs Egresos por mes (últimos 6 meses)
   */
  ingresosVsEgresos(canvasId) {
    this.destruir(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ahora = new Date();
    const labels = [];
    const ingresosData = [];
    const egresosData = [];
    
    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      labels.push(Fechas.MESES_CORTOS[fecha.getMonth()]);
      
      const ing = Formato.sumarEnMoneda(
        API.obtenerTransacciones({ tipo: 'ingreso', mes: fecha.getMonth() + 1, anio: fecha.getFullYear() }),
        'PEN'
      );
      const eg = Formato.sumarEnMoneda(
        API.obtenerTransacciones({ tipo: 'egreso', mes: fecha.getMonth() + 1, anio: fecha.getFullYear() }),
        'PEN'
      );
      
      ingresosData.push(ing);
      egresosData.push(eg);
    }
    
    const ctx = canvas.getContext('2d');
    
    this.instancias[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: ingresosData,
            backgroundColor: '#10B981',
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.6,
          },
          {
            label: 'Egresos',
            data: egresosData,
            backgroundColor: '#3B82F6',
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        ...this.configBase(),
        plugins: {
          ...this.configBase().plugins,
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: Theme.coloresGrafico().textSecondary,
              font: { family: "'Inter', sans-serif", size: 11 },
              boxWidth: 10,
              boxHeight: 10,
              padding: 12,
            },
          },
          tooltip: {
            ...this.configBase().plugins.tooltip,
            callbacks: {
              label: (item) => `${item.dataset.label}: ${Formato.formatearMoneda(item.parsed.y, 'PEN')}`,
            },
          },
        },
      },
    });
  },
  
  /**
   * GRÁFICO 3: Donut - Distribución de egresos por categoría
   */
  distribucionCategorias(canvasId, leyendaId) {
    this.destruir(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ahora = new Date();
    const trans = API.obtenerTransacciones({
      tipo: 'egreso',
      mes: ahora.getMonth() + 1,
      anio: ahora.getFullYear(),
    });
    
    // Agrupar por categoría padre
    const totales = {};
    trans.forEach(t => {
      const cat = API.obtenerCategoriaPorId(t.categoriaId);
      if (!cat) return;
      const padre = cat.categoriaPadreId ? API.obtenerCategoriaPorId(cat.categoriaPadreId) : cat;
      if (!padre) return;
      
      if (!totales[padre.id]) {
        totales[padre.id] = { nombre: padre.nombre, icono: padre.icono, total: 0 };
      }
      totales[padre.id].total += Formato.convertir(t.monto, t.moneda, 'PEN');
    });
    
    const items = Object.values(totales).sort((a, b) => b.total - a.total).slice(0, 5);
    const total = items.reduce((s, i) => s + i.total, 0);
    
    const colores = ['#3B82F6', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444'];
    
    const labels = items.map(i => i.nombre);
    const data = items.map(i => i.total);
    
    const ctx = canvas.getContext('2d');
    
    this.instancias[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colores.slice(0, items.length),
          borderColor: 'transparent',
          borderWidth: 0,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 41, 0.95)',
            titleColor: '#fff',
            bodyColor: 'rgba(255, 255, 255, 0.85)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (item) => {
                const pct = total > 0 ? Math.round((item.parsed / total) * 100) : 0;
                return `${item.label}: ${Formato.formatearMoneda(item.parsed, 'PEN')} (${pct}%)`;
              },
            },
          },
        },
      },
    });
    
    // Renderizar leyenda personalizada
    const leyenda = document.getElementById(leyendaId);
    if (leyenda) {
      leyenda.innerHTML = items.map((it, i) => {
        const pct = total > 0 ? Math.round((it.total / total) * 100) : 0;
        return `
          <div class="chart-legend-item">
            <div class="chart-legend-name">
              <span class="chart-legend-color" style="background: ${colores[i]}"></span>
              <span>${it.icono} ${it.nombre}</span>
            </div>
            <span class="chart-legend-value">${pct}%</span>
          </div>
        `;
      }).join('');
    }
  },
  
  /**
   * GRÁFICO 4: Área - Tendencia de ahorro (últimos 6 meses, acumulado)
   */
  tendenciaAhorro(canvasId) {
    this.destruir(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ahora = new Date();
    const labels = [];
    const ahorroAcumulado = [];
    let acumulado = 0;
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      labels.push(Fechas.MESES_CORTOS[fecha.getMonth()]);
      
      const ing = Formato.sumarEnMoneda(
        API.obtenerTransacciones({ tipo: 'ingreso', mes: fecha.getMonth() + 1, anio: fecha.getFullYear() }),
        'PEN'
      );
      const eg = Formato.sumarEnMoneda(
        API.obtenerTransacciones({ tipo: 'egreso', mes: fecha.getMonth() + 1, anio: fecha.getFullYear() }),
        'PEN'
      );
      
      acumulado += (ing - eg);
      ahorroAcumulado.push(acumulado);
    }
    
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
    
    this.instancias[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: ahorroAcumulado,
          borderColor: '#06B6D4',
          backgroundColor: gradient,
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#06B6D4',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }],
      },
      options: {
        ...this.configBase(),
        plugins: {
          ...this.configBase().plugins,
          tooltip: {
            ...this.configBase().plugins.tooltip,
            callbacks: {
              label: (item) => `Ahorro acumulado: ${Formato.formatearMoneda(item.parsed.y, 'PEN')}`,
            },
          },
        },
      },
    });
  },
};
