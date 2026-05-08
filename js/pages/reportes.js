/* ============================================
   PÁGINA: REPORTES
   ============================================ */

const Reportes = {
  
  monedaVista: 'PEN',
  periodo: 'mes', // mes | trimestre | anio | todo
  
  render(container, monedaVista = 'PEN') {
    this.monedaVista = monedaVista;
    Graficos.destruirTodos();
    
    container.innerHTML = `
      <div class="reportes-page">
        ${this.renderHeader()}
        ${this.renderKPIs()}
        ${this.renderSalud()}
        ${this.renderTendenciaYDistribucion()}
        ${this.renderTopYHabitos()}
        ${this.renderPatrimonio()}
        ${this.renderHeatmap()}
      </div>
    `;
    
    this.configurarEventos();
    
    // Renderizar gráficos
    setTimeout(() => {
      this.renderChartTendencia();
      this.renderChartDistribucion();
      this.renderChartPatrimonio();
      this.renderChartSaludScore();
    }, 50);
  },
  
  /* ============ HEADER ============ */
  renderHeader() {
    const rango = this.obtenerRangoFechas();
    
    return `
      <div class="reportes-header">
        <div class="periodo-selector">
          <button class="periodo-pill ${this.periodo === 'mes' ? 'active' : ''}" data-periodo="mes">
            Este mes
          </button>
          <button class="periodo-pill ${this.periodo === 'trimestre' ? 'active' : ''}" data-periodo="trimestre">
            Trimestre
          </button>
          <button class="periodo-pill ${this.periodo === 'anio' ? 'active' : ''}" data-periodo="anio">
            Este año
          </button>
          <button class="periodo-pill ${this.periodo === 'todo' ? 'active' : ''}" data-periodo="todo">
            Todo
          </button>
        </div>
        
        <div class="periodo-rango-info">
          📅 <strong>${Fechas.formatoCorto(rango.inicio)}</strong> - <strong>${Fechas.formatoCorto(rango.fin)}</strong>
        </div>
        
        <button class="btn-secondary" id="btnExportarReporte">
          <span>📄</span>
          <span>Exportar PDF</span>
        </button>
      </div>
    `;
  },
  
  /**
   * Calcula el rango de fechas según el período seleccionado
   */
  obtenerRangoFechas() {
    const hoy = new Date();
    let inicio, fin;
    
    switch (this.periodo) {
      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        break;
      case 'trimestre':
        inicio = new Date(hoy);
        inicio.setMonth(inicio.getMonth() - 2);
        inicio.setDate(1);
        fin = new Date(hoy);
        break;
      case 'anio':
        inicio = new Date(hoy.getFullYear(), 0, 1);
        fin = new Date(hoy.getFullYear(), 11, 31);
        break;
      case 'todo':
        inicio = new Date(2020, 0, 1);
        fin = new Date(hoy.getFullYear() + 1, 11, 31);
        break;
    }
    
    return { 
      inicio: inicio.toISOString().split('T')[0], 
      fin: fin.toISOString().split('T')[0] 
    };
  },
  
  /**
   * Calcula el rango anterior para comparativa
   */
  obtenerRangoAnterior() {
    const hoy = new Date();
    let inicio, fin;
    
    switch (this.periodo) {
      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        break;
      case 'trimestre':
        inicio = new Date(hoy);
        inicio.setMonth(inicio.getMonth() - 5);
        inicio.setDate(1);
        fin = new Date(hoy);
        fin.setMonth(fin.getMonth() - 3);
        break;
      case 'anio':
        inicio = new Date(hoy.getFullYear() - 1, 0, 1);
        fin = new Date(hoy.getFullYear() - 1, 11, 31);
        break;
      default:
        return null;
    }
    
    return {
      inicio: inicio.toISOString().split('T')[0],
      fin: fin.toISOString().split('T')[0],
    };
  },
  
  /* ============ KPIs ============ */
  renderKPIs() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const rango = this.obtenerRangoFechas();
    const rangoAnterior = this.obtenerRangoAnterior();
    
    const kpis = API.calcularKPIs(rango.inicio, rango.fin, moneda);
    const kpisAnterior = rangoAnterior 
      ? API.calcularKPIs(rangoAnterior.inicio, rangoAnterior.fin, moneda)
      : null;
    
    const calcularCambio = (actual, anterior) => {
      if (!anterior || anterior === 0) return null;
      return ((actual - anterior) / Math.abs(anterior)) * 100;
    };
    
    const renderComparison = (cambio, mejorEsMayor = true) => {
      if (cambio === null) return '<span class="kpi-card-comparison neutral">Sin datos previos</span>';
      const positivo = mejorEsMayor ? cambio >= 0 : cambio <= 0;
      const flecha = cambio >= 0 ? '↑' : '↓';
      const clase = positivo ? 'positive' : 'negative';
      return `<span class="kpi-card-comparison ${clase}">${flecha} ${Math.abs(cambio).toFixed(1)}% vs anterior</span>`;
    };
    
    return `
      <div class="kpis-grid">
        <div class="kpi-card">
          <div class="kpi-card-header">
            <div class="kpi-card-icon icon-box green">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <div class="kpi-card-label">Ingresos</div>
          </div>
          <div class="kpi-card-value">${Formato.formatearMoneda(kpis.totalIngresos, moneda)}</div>
          ${renderComparison(calcularCambio(kpis.totalIngresos, kpisAnterior?.totalIngresos), true)}
        </div>
        
        <div class="kpi-card">
          <div class="kpi-card-header">
            <div class="kpi-card-icon icon-box red">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
              </svg>
            </div>
            <div class="kpi-card-label">Egresos</div>
          </div>
          <div class="kpi-card-value">${Formato.formatearMoneda(kpis.totalEgresos, moneda)}</div>
          ${renderComparison(calcularCambio(kpis.totalEgresos, kpisAnterior?.totalEgresos), false)}
        </div>
        
        <div class="kpi-card highlight">
          <div class="kpi-card-header">
            <div class="kpi-card-icon icon-box cyan">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
            </div>
            <div class="kpi-card-label">Ahorro neto</div>
          </div>
          <div class="kpi-card-value">${Formato.formatearMoneda(kpis.ahorro, moneda)}</div>
          <div class="kpi-card-comparison ${kpis.tasaAhorro >= 0 ? 'positive' : 'negative'}">
            ${(kpis.tasaAhorro * 100).toFixed(1)}% de los ingresos
          </div>
        </div>
        
        <div class="kpi-card">
          <div class="kpi-card-header">
            <div class="kpi-card-icon icon-box purple">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2"/>
              </svg>
            </div>
            <div class="kpi-card-label">Promedio diario</div>
          </div>
          <div class="kpi-card-value">${Formato.formatearMoneda(kpis.promedioEgresoDiario, moneda)}</div>
          <div class="kpi-card-period">${kpis.numTransacciones} transacciones</div>
        </div>
      </div>
    `;
  },
  
  /* ============ SALUD FINANCIERA ============ */
  renderSalud() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const salud = API.calcularSaludFinanciera(moneda);
    
    return `
      <div class="reporte-card salud-card">
        <div class="reporte-card-header">
          <div class="reporte-card-title-block">
            <div class="reporte-card-title">💚 Salud financiera</div>
            <div class="reporte-card-subtitle">Score basado en tu situación actual</div>
          </div>
        </div>
        
        <div class="salud-score-container">
          <div class="salud-score-circle">
            <canvas id="chartSaludScore"></canvas>
            <div class="salud-score-text">
              <div class="salud-score-value">${salud.score}</div>
              <div class="salud-score-label">de 100</div>
            </div>
          </div>
          
          <div class="salud-info">
            <div class="salud-info-title ${salud.nivel}">
              ${salud.nivel === 'excelente' ? '🌟 Excelente' : 
                salud.nivel === 'bueno' ? '✅ Bueno' : 
                salud.nivel === 'regular' ? '⚡ Regular' : '⚠ Necesita atención'}
            </div>
            <p class="salud-info-desc">${salud.descripcion}</p>
            
            ${salud.recomendaciones.length > 0 ? `
              <ul class="salud-recomendaciones">
                ${salud.recomendaciones.map(r => `<li>${r}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },
  
  renderChartSaludScore() {
    const canvas = document.getElementById('chartSaludScore');
    if (!canvas) return;
    
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const salud = API.calcularSaludFinanciera(moneda);
    
    const colorMap = {
      excelente: '#10B981',
      bueno: '#14F0CD',
      regular: '#F59E0B',
      malo: '#EF4444',
    };
    
    Graficos.destruir('chartSaludScore');
    Graficos.instancias['chartSaludScore'] = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [salud.score, 100 - salud.score],
          backgroundColor: [colorMap[salud.nivel], 'rgba(255, 255, 255, 0.05)'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '78%',
        rotation: -90,
        circumference: 360,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
    });
  },
  
  /* ============ TENDENCIA + DISTRIBUCIÓN ============ */
  renderTendenciaYDistribucion() {
    return `
      <div class="reportes-grid">
        <div class="reporte-card">
          <div class="reporte-card-header">
            <div class="reporte-card-title-block">
              <div class="reporte-card-title">Tendencia ingresos vs egresos</div>
              <div class="reporte-card-subtitle">Últimos 6 meses</div>
            </div>
          </div>
          <div class="reporte-card-canvas">
            <canvas id="chartTendenciaReporte"></canvas>
          </div>
        </div>
        
        <div class="reporte-card">
          <div class="reporte-card-header">
            <div class="reporte-card-title-block">
              <div class="reporte-card-title">Distribución de egresos</div>
              <div class="reporte-card-subtitle">${this.getNombrePeriodo()}</div>
            </div>
          </div>
          ${this.renderDistribucion()}
        </div>
      </div>
    `;
  },
  
  getNombrePeriodo() {
    const map = {
      mes: 'Este mes',
      trimestre: 'Último trimestre',
      anio: 'Este año',
      todo: 'Todo el histórico',
    };
    return map[this.periodo];
  },
  
  renderChartTendencia() {
    const canvas = document.getElementById('chartTendenciaReporte');
    if (!canvas) return;
    
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const ahora = new Date();
    
    const labels = [];
    const ingresosData = [];
    const egresosData = [];
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1).toISOString().split('T')[0];
      const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).toISOString().split('T')[0];
      
      labels.push(`${Fechas.MESES_CORTOS[fecha.getMonth()]} ${String(fecha.getFullYear()).slice(2)}`);
      
      const kpis = API.calcularKPIs(inicio, fin, moneda);
      ingresosData.push(kpis.totalIngresos);
      egresosData.push(kpis.totalEgresos);
    }
    
    const colorTema = Theme.coloresGrafico();
    const ctx = canvas.getContext('2d');
    
    const gradIngreso = ctx.createLinearGradient(0, 0, 0, 250);
    gradIngreso.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    gradIngreso.addColorStop(1, 'rgba(16, 185, 129, 0)');
    
    const gradEgreso = ctx.createLinearGradient(0, 0, 0, 250);
    gradEgreso.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
    gradEgreso.addColorStop(1, 'rgba(239, 68, 68, 0)');
    
    Graficos.destruir('chartTendenciaReporte');
    Graficos.instancias['chartTendenciaReporte'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: ingresosData,
            borderColor: '#10B981',
            backgroundColor: gradIngreso,
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#10B981',
          },
          {
            label: 'Egresos',
            data: egresosData,
            borderColor: '#EF4444',
            backgroundColor: gradEgreso,
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#EF4444',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: colorTema.textSecondary,
              font: { size: 11 },
              boxWidth: 10,
              boxHeight: 10,
              padding: 12,
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 41, 0.95)',
            titleColor: '#fff',
            bodyColor: 'rgba(255, 255, 255, 0.85)',
            padding: 10,
            cornerRadius: 8,
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (item) => `${item.dataset.label}: ${Formato.formatearMoneda(item.parsed.y, moneda)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: colorTema.grid },
            ticks: { color: colorTema.textSecondary, font: { size: 11 } },
          },
          y: {
            grid: { color: colorTema.grid },
            ticks: {
              color: colorTema.textSecondary,
              font: { size: 11 },
              callback: (val) => Formato.formatearMoneda(val, moneda).replace('.00', ''),
            },
          },
        },
      },
    });
  },
  
  /* ============ DISTRIBUCIÓN ============ */
  renderDistribucion() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const rango = this.obtenerRangoFechas();
    const dist = API.obtenerDistribucionPorCategoria(rango.inicio, rango.fin, moneda);
    
    if (dist.length === 0) {
      return `
        <div class="reportes-empty">
          <div class="reportes-empty-icon">📊</div>
          <p>Sin egresos en este período</p>
        </div>
      `;
    }
    
    const total = dist.reduce((s, d) => s + d.total, 0);
    const colores = ['#14F0CD', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#EC4899', '#3B82F6'];
    
    return `
      <div class="dist-container">
        <div class="dist-canvas-wrapper">
          <canvas id="chartDistReporte"></canvas>
          <div class="dist-canvas-center">
            <div class="dist-center-label">Total</div>
            <div class="dist-center-value">${Formato.formatearMoneda(total, moneda).replace('.00', '')}</div>
          </div>
        </div>
        
        <div class="dist-list">
          ${dist.slice(0, 8).map((d, i) => {
            const pct = (d.total / total) * 100;
            return `
              <div class="dist-item">
                <span class="dist-color" style="background: ${colores[i % colores.length]};"></span>
                <span class="dist-name">${d.icono} ${d.nombre}</span>
                <span class="dist-amount">${Formato.formatearMoneda(d.total, moneda).replace('.00', '')}</span>
                <span class="dist-pct">${pct.toFixed(0)}%</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },
  
  renderChartDistribucion() {
    const canvas = document.getElementById('chartDistReporte');
    if (!canvas) return;
    
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const rango = this.obtenerRangoFechas();
    const dist = API.obtenerDistribucionPorCategoria(rango.inicio, rango.fin, moneda);
    
    if (dist.length === 0) return;
    
    const colores = ['#14F0CD', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#EC4899', '#3B82F6'];
    const datos = dist.slice(0, 8);
    
    Graficos.destruir('chartDistReporte');
    Graficos.instancias['chartDistReporte'] = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: datos.map(d => d.nombre),
        datasets: [{
          data: datos.map(d => d.total),
          backgroundColor: colores.slice(0, datos.length),
          borderWidth: 0,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 41, 0.95)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (item) => `${item.label}: ${Formato.formatearMoneda(item.parsed, moneda)}`,
            },
          },
        },
      },
    });
  },
  
  /* ============ TOP + HÁBITOS ============ */
  renderTopYHabitos() {
    return `
      <div class="reportes-grid">
        <div class="reporte-card">
          <div class="reporte-card-header">
            <div class="reporte-card-title-block">
              <div class="reporte-card-title">🏆 Top 10 gastos</div>
              <div class="reporte-card-subtitle">Las transacciones más grandes del período</div>
            </div>
          </div>
          ${this.renderTopGastos()}
        </div>
        
        <div class="reporte-card">
          <div class="reporte-card-header">
            <div class="reporte-card-title-block">
              <div class="reporte-card-title">🧠 Tus hábitos</div>
              <div class="reporte-card-subtitle">Análisis del período</div>
            </div>
          </div>
          ${this.renderHabitos()}
        </div>
      </div>
    `;
  },
  
  renderTopGastos() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const rango = this.obtenerRangoFechas();
    const top = API.obtenerTopGastos(rango.inicio, rango.fin, 10, moneda);
    
    if (top.length === 0) {
      return `
        <div class="reportes-empty">
          <div class="reportes-empty-icon">📋</div>
          <p>Sin gastos en este período</p>
        </div>
      `;
    }
    
    return `
      <div class="top-list">
        ${top.map((t, i) => {
          const cat = API.obtenerCategoriaPorId(t.categoriaId);
          return `
            <div class="top-item">
              <div class="top-rank">#${i + 1}</div>
              <div class="top-item-icon icon-box ${cat?.color || 'blue'}">
                <span>${cat?.icono || '💰'}</span>
              </div>
              <div class="top-item-info">
                <div class="top-item-name">${t.descripcion || cat?.nombre || 'Sin descripción'}</div>
                <div class="top-item-meta">${Fechas.formatoCorto(t.fecha)} · ${cat?.nombre || ''}</div>
              </div>
              <div class="top-item-amount">${Formato.formatearMoneda(t.monto, t.moneda)}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },
  
  renderHabitos() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const rango = this.obtenerRangoFechas();
    const habitos = API.analizarHabitos(rango.inicio, rango.fin, moneda);
    
    if (!habitos.diaMasActivo) {
      return `
        <div class="reportes-empty">
          <div class="reportes-empty-icon">🤔</div>
          <p>Sin datos suficientes para analizar</p>
        </div>
      `;
    }
    
    return `
      <div class="habitos-grid">
        <div class="habito-stat">
          <div class="habito-stat-icon">📅</div>
          <div class="habito-stat-label">Día con más gastos</div>
          <div class="habito-stat-value">${habitos.diaMasActivo.nombre}</div>
          <div class="habito-stat-meta">${Formato.formatearMoneda(habitos.diaMasActivo.monto, moneda)}</div>
        </div>
        
        <div class="habito-stat">
          <div class="habito-stat-icon">${habitos.categoriaMasUsada?.icono || '🎯'}</div>
          <div class="habito-stat-label">Categoría dominante</div>
          <div class="habito-stat-value">${habitos.categoriaMasUsada?.nombre || '-'}</div>
          <div class="habito-stat-meta">${habitos.categoriaMasUsada?.numTrans || 0} transacciones</div>
        </div>
        
        <div class="habito-stat">
          <div class="habito-stat-icon">💸</div>
          <div class="habito-stat-label">Mayor gasto único</div>
          <div class="habito-stat-value">${Formato.formatearMoneda(habitos.montoMaximo, moneda)}</div>
          <div class="habito-stat-meta">Transacción más alta</div>
        </div>
        
        <div class="habito-stat">
          <div class="habito-stat-icon">🔥</div>
          <div class="habito-stat-label">Días con gastos</div>
          <div class="habito-stat-value">${habitos.diasConGastos}</div>
          <div class="habito-stat-meta">de actividad</div>
        </div>
      </div>
    `;
  },
  
  /* ============ PATRIMONIO ============ */
  renderPatrimonio() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const patrimonio = API.calcularPatrimonio(moneda);
    
    return `
      <div class="reporte-card">
        <div class="reporte-card-header">
          <div class="reporte-card-title-block">
            <div class="reporte-card-title">💎 Patrimonio neto</div>
            <div class="reporte-card-subtitle">Activos menos pasivos al día de hoy</div>
          </div>
        </div>
        
        <div class="patrimonio-summary">
          <div>
            <div class="patrimonio-item-label">Activos</div>
            <div class="patrimonio-item-value activos">+${Formato.formatearMoneda(patrimonio.activos, moneda)}</div>
            <div style="font-size:0.6875rem;color:var(--text-tertiary);margin-top:2px;">Cuentas + ahorros</div>
          </div>
          <div>
            <div class="patrimonio-item-label">Pasivos</div>
            <div class="patrimonio-item-value pasivos">-${Formato.formatearMoneda(patrimonio.pasivos, moneda)}</div>
            <div style="font-size:0.6875rem;color:var(--text-tertiary);margin-top:2px;">Deudas + tarjetas</div>
          </div>
          <div>
            <div class="patrimonio-item-label">Patrimonio neto</div>
            <div class="patrimonio-item-value neto">${Formato.formatearMoneda(patrimonio.neto, moneda)}</div>
            <div style="font-size:0.6875rem;color:var(--text-tertiary);margin-top:2px;">Tu valor real</div>
          </div>
        </div>
        
        <div style="height:200px;">
          <canvas id="chartPatrimonio"></canvas>
        </div>
      </div>
    `;
  },
  
  renderChartPatrimonio() {
    const canvas = document.getElementById('chartPatrimonio');
    if (!canvas) return;
    
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const patrimonio = API.calcularPatrimonio(moneda);
    
    const colorTema = Theme.coloresGrafico();
    
    Graficos.destruir('chartPatrimonio');
    Graficos.instancias['chartPatrimonio'] = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Activos', 'Pasivos', 'Patrimonio neto'],
        datasets: [{
          data: [patrimonio.activos, patrimonio.pasivos, patrimonio.neto],
          backgroundColor: ['#10B981', '#EF4444', '#14F0CD'],
          borderRadius: 8,
          barPercentage: 0.5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 41, 0.95)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (item) => Formato.formatearMoneda(item.parsed.x, moneda),
            },
          },
        },
        scales: {
          x: {
            grid: { color: colorTema.grid },
            ticks: {
              color: colorTema.textSecondary,
              font: { size: 11 },
              callback: (val) => Formato.formatearMoneda(val, moneda).replace('.00', ''),
            },
          },
          y: {
            grid: { display: false },
            ticks: { color: colorTema.textSecondary, font: { size: 12, weight: '500' } },
          },
        },
      },
    });
  },
  
  /* ============ HEATMAP ============ */
  renderHeatmap() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const datos = API.generarHeatmapDatos(moneda);
    
    // Construir grid de 7 días x 53 semanas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const haceUnAno = new Date(hoy);
    haceUnAno.setDate(haceUnAno.getDate() - 364);
    
    // Encontrar el primer domingo
    while (haceUnAno.getDay() !== 0) {
      haceUnAno.setDate(haceUnAno.getDate() - 1);
    }
    
    const diasAbreviados = ['', 'Lun', '', 'Mié', '', 'Vie', ''];
    
    let cells = '';
    for (let dia = 0; dia < 7; dia++) {
      cells += `<div class="heatmap-day-label">${diasAbreviados[dia]}</div>`;
      
      for (let semana = 0; semana < 53; semana++) {
        const fechaCell = new Date(haceUnAno);
        fechaCell.setDate(fechaCell.getDate() + (semana * 7) + dia);
        
        if (fechaCell > hoy) {
          cells += `<div class="heatmap-cell empty"></div>`;
          continue;
        }
        
        const fechaStr = fechaCell.toISOString().split('T')[0];
        const monto = datos.porDia[fechaStr] || 0;
        
        let level = 0;
        if (monto > 0 && datos.max > 0) {
          const ratio = monto / datos.max;
          if (ratio >= 1) level = 4;
          else if (ratio >= 0.6) level = 3;
          else if (ratio >= 0.3) level = 2;
          else level = 1;
        }
        
        const tooltip = monto > 0 
          ? `${Fechas.formatoCorto(fechaStr)}: ${Formato.formatearMoneda(monto, moneda)}`
          : `${Fechas.formatoCorto(fechaStr)}: sin gastos`;
        
        cells += `<div class="heatmap-cell level-${level}" title="${tooltip}"></div>`;
      }
    }
    
    return `
      <div class="reporte-card">
        <div class="reporte-card-header">
          <div class="reporte-card-title-block">
            <div class="reporte-card-title">🔥 Mapa de actividad</div>
            <div class="reporte-card-subtitle">Tus gastos día a día (último año)</div>
          </div>
        </div>
        
        <div class="heatmap-container">
          <div class="heatmap-grid">${cells}</div>
          
          <div class="heatmap-legend">
            <span>Menos</span>
            <div class="heatmap-cell level-0" style="cursor:default;"></div>
            <div class="heatmap-cell level-1" style="cursor:default;"></div>
            <div class="heatmap-cell level-2" style="cursor:default;"></div>
            <div class="heatmap-cell level-3" style="cursor:default;"></div>
            <div class="heatmap-cell level-4" style="cursor:default;"></div>
            <span>Más</span>
          </div>
        </div>
      </div>
    `;
  },
  
  /* ============ EVENTOS ============ */
  configurarEventos() {
    document.querySelectorAll('.periodo-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.periodo = btn.dataset.periodo;
        this.refrescar();
      });
    });
    
    const btnExportar = document.getElementById('btnExportarReporte');
    if (btnExportar) {
      btnExportar.addEventListener('click', () => this.exportarPDF());
    }
  },
  
  refrescar() {
    const container = document.getElementById('pageContent');
    if (container) this.render(container, this.monedaVista);
  },
  
  /* ============ EXPORTAR PDF ============ */
  exportarPDF() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const rango = this.obtenerRangoFechas();
    const usuario = API.obtenerUsuario();
    
    const kpis = API.calcularKPIs(rango.inicio, rango.fin, moneda);
    const dist = API.obtenerDistribucionPorCategoria(rango.inicio, rango.fin, moneda);
    const top = API.obtenerTopGastos(rango.inicio, rango.fin, 10, moneda);
    const patrimonio = API.calcularPatrimonio(moneda);
    const salud = API.calcularSaludFinanciera(moneda);
    const habitos = API.analizarHabitos(rango.inicio, rango.fin, moneda);
    
    const ventana = window.open('', '_blank');
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte Financiero - ${usuario.nombre}</title>
        <style>
          @media print { @page { margin: 1.5cm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          body { font-family: -apple-system, sans-serif; padding: 30px; color: #1A2332; max-width: 1000px; margin: 0 auto; }
          h1 { color: #0F1729; border-bottom: 3px solid #14F0CD; padding-bottom: 10px; }
          h2 { color: #1E3A5F; margin-top: 30px; padding-bottom: 6px; border-bottom: 1px solid #E8EDF5; }
          .header-info { margin: 20px 0; padding: 15px; background: #F4F6FB; border-radius: 8px; font-size: 0.9em; }
          .kpis-grid-pdf { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0; }
          .kpi-pdf { padding: 12px; background: #F4F6FB; border-radius: 8px; }
          .kpi-pdf-label { font-size: 0.7em; color: #888; text-transform: uppercase; }
          .kpi-pdf-value { font-size: 1.2em; font-weight: bold; margin-top: 4px; }
          .salud-pdf { background: linear-gradient(135deg, rgba(20, 240, 205, 0.1), rgba(6, 182, 212, 0.05)); padding: 15px; border-radius: 8px; margin: 15px 0; }
          .score-circle-pdf { display: inline-block; width: 80px; height: 80px; border-radius: 50%; background: #14F0CD; color: white; text-align: center; line-height: 80px; font-size: 1.5em; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.9em; }
          th { background: #1E3A5F; color: white; padding: 10px; text-align: left; }
          th:last-child { text-align: right; }
          td { padding: 8px 10px; border-bottom: 1px solid #E8EDF5; }
          td:last-child { text-align: right; font-weight: 600; }
          tr:nth-child(even) { background: #F4F6FB; }
          .text-success { color: #10B981; }
          .text-danger { color: #EF4444; }
          .text-info { color: #06B6D4; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E8EDF5; font-size: 0.8em; color: #888; text-align: center; }
          @media print { .no-print { display: none; } }
          .actions { margin: 20px 0; }
          button { background: #14F0CD; color: #0A0E1A; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px; font-size: 14px; font-weight: 500; }
          button.secondary { background: #888; color: white; }
        </style>
      </head>
      <body>
        <div class="actions no-print">
          <button onclick="window.print()">🖨 Imprimir / Guardar como PDF</button>
          <button class="secondary" onclick="window.close()">Cerrar</button>
        </div>
        
        <h1>📊 Reporte Financiero</h1>
        <div class="header-info">
          <strong>Usuario:</strong> ${usuario.nombre}<br>
          <strong>Período:</strong> ${Fechas.formatoCompleto(rango.inicio)} al ${Fechas.formatoCompleto(rango.fin)}<br>
          <strong>Generado:</strong> ${Fechas.formatoCompleto(new Date())}
        </div>
        
        <h2>Resumen del período</h2>
        <div class="kpis-grid-pdf">
          <div class="kpi-pdf">
            <div class="kpi-pdf-label">Ingresos</div>
            <div class="kpi-pdf-value text-success">${Formato.formatearMoneda(kpis.totalIngresos, moneda)}</div>
          </div>
          <div class="kpi-pdf">
            <div class="kpi-pdf-label">Egresos</div>
            <div class="kpi-pdf-value text-danger">${Formato.formatearMoneda(kpis.totalEgresos, moneda)}</div>
          </div>
          <div class="kpi-pdf">
            <div class="kpi-pdf-label">Ahorro</div>
            <div class="kpi-pdf-value text-info">${Formato.formatearMoneda(kpis.ahorro, moneda)}</div>
          </div>
          <div class="kpi-pdf">
            <div class="kpi-pdf-label">Tasa ahorro</div>
            <div class="kpi-pdf-value">${(kpis.tasaAhorro * 100).toFixed(1)}%</div>
          </div>
        </div>
        
        <h2>💚 Salud financiera</h2>
        <div class="salud-pdf">
          <div style="display:flex;align-items:center;gap:20px;">
            <div class="score-circle-pdf">${salud.score}</div>
            <div>
              <h3 style="margin:0;">${salud.nivel.charAt(0).toUpperCase() + salud.nivel.slice(1)}</h3>
              <p style="margin:5px 0;color:#666;">${salud.descripcion}</p>
            </div>
          </div>
          ${salud.recomendaciones.length > 0 ? `
            <div style="margin-top:15px;">
              <strong>Recomendaciones:</strong>
              <ul>${salud.recomendaciones.map(r => `<li>${r}</li>`).join('')}</ul>
            </div>
          ` : ''}
        </div>
        
        <h2>💎 Patrimonio neto</h2>
        <table>
          <tr>
            <td><strong>Activos (cuentas + ahorros)</strong></td>
            <td class="text-success">+${Formato.formatearMoneda(patrimonio.activos, moneda)}</td>
          </tr>
          <tr>
            <td><strong>Pasivos (deudas + tarjetas)</strong></td>
            <td class="text-danger">-${Formato.formatearMoneda(patrimonio.pasivos, moneda)}</td>
          </tr>
          <tr style="background:#14F0CD;color:#0A0E1A;font-weight:bold;">
            <td>Patrimonio neto</td>
            <td>${Formato.formatearMoneda(patrimonio.neto, moneda)}</td>
          </tr>
        </table>
        
        <h2>📊 Distribución de egresos por categoría</h2>
        <table>
          <thead>
            <tr><th>Categoría</th><th>Transacciones</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${dist.slice(0, 10).map(d => `
              <tr>
                <td>${d.icono} ${d.nombre}</td>
                <td>${d.numTrans}</td>
                <td>${Formato.formatearMoneda(d.total, moneda)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h2>🏆 Top 10 gastos</h2>
        <table>
          <thead>
            <tr><th>#</th><th>Descripción</th><th>Categoría</th><th>Fecha</th><th>Monto</th></tr>
          </thead>
          <tbody>
            ${top.map((t, i) => {
              const cat = API.obtenerCategoriaPorId(t.categoriaId);
              return `
                <tr>
                  <td>${i + 1}</td>
                  <td>${t.descripcion || cat?.nombre || 'Sin descripción'}</td>
                  <td>${cat?.icono || ''} ${cat?.nombre || '-'}</td>
                  <td>${Fechas.formatoCorto(t.fecha)}</td>
                  <td>${Formato.formatearMoneda(t.monto, t.moneda)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        ${habitos.diaMasActivo ? `
          <h2>🧠 Análisis de hábitos</h2>
          <table>
            <tr><td><strong>Día con más gastos</strong></td><td>${habitos.diaMasActivo.nombre} (${Formato.formatearMoneda(habitos.diaMasActivo.monto, moneda)})</td></tr>
            <tr><td><strong>Categoría dominante</strong></td><td>${habitos.categoriaMasUsada?.nombre || '-'} (${habitos.categoriaMasUsada?.numTrans || 0} transacciones)</td></tr>
            <tr><td><strong>Mayor gasto único</strong></td><td>${Formato.formatearMoneda(habitos.montoMaximo, moneda)}</td></tr>
            <tr><td><strong>Días con actividad</strong></td><td>${habitos.diasConGastos} días</td></tr>
          </table>
        ` : ''}
        
        <div class="footer">
          Generado por FinanzApp · Este reporte es referencial<br>
          <em>Las cifras se basan en los datos registrados en la aplicación</em>
        </div>
      </body>
      </html>
    `);
    ventana.document.close();
  },
};
