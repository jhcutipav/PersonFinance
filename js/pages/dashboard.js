/* ============================================
   PÁGINA: DASHBOARD (REDISEÑO)
   Layout 3 columnas con gráficos
   ============================================ */

const Dashboard = {
  
  tarjetaActiva: 0,
  monedaVista: 'PEN',
  
  render(container, monedaVista = 'PEN') {
    this.monedaVista = monedaVista;
    
    // Destruir gráficos previos
    Graficos.destruirTodos();
    
    container.innerHTML = `
      <div class="dashboard-layout">
        <div class="dashboard-main">
          ${this.renderHeroBanner()}
          ${this.renderSummary()}
          ${this.renderCarruselTarjetas()}
          ${this.renderGraficos()}
        </div>
        <aside class="dashboard-aside">
          ${this.renderAsideStats()}
          ${this.renderAsideMovimientos()}
          ${this.renderAsidePagoTarjeta()}
        </aside>
      </div>
    `;
    
    // Renderizar gráficos después de que el DOM esté listo
    setTimeout(() => {
      Graficos.gastosDiarios('chartGastosDiarios');
      Graficos.ingresosVsEgresos('chartIngresosEgresos');
      Graficos.distribucionCategorias('chartCategorias', 'chartCategoriasLeyenda');
      Graficos.tendenciaAhorro('chartTendencia');
    }, 50);
    
    // Configurar carrusel
    this.configurarSlider();
  },
  
  /* ============ BANNER HERO ============ */
  renderHeroBanner() {
    const usuario = API.obtenerUsuario();
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const ingresos = API.calcularIngresosMes(moneda);
    const ahorro = API.calcularAhorroMes(moneda);
    const tasaAhorro = ingresos > 0 ? (ahorro / ingresos) * 100 : 0;
    
    let mensajeMotivacional = '';
    if (tasaAhorro >= 30) {
      mensajeMotivacional = `🎯 ¡Excelente! Llevas ${Math.round(tasaAhorro)}% de ahorro este mes`;
    } else if (tasaAhorro >= 10) {
      mensajeMotivacional = `📊 Vas bien, llevas ${Math.round(tasaAhorro)}% de ahorro este mes`;
    } else if (tasaAhorro > 0) {
      mensajeMotivacional = `💪 Sigue así, ${Math.round(tasaAhorro)}% de ahorro este mes`;
    } else {
      mensajeMotivacional = `📈 Aquí tienes tu resumen financiero de ${Fechas.mesActual()}`;
    }
    
    return `
      <div class="hero-banner">
        <div class="hero-banner-content">
          <div class="hero-banner-title">¡Bienvenido, ${usuario.nombre}! ✨</div>
          <div class="hero-banner-subtitle">${mensajeMotivacional}</div>
        </div>
        <div class="hero-banner-illustration">
          💰📊
        </div>
      </div>
    `;
  },
  
  /* ============ SUMMARY (4 cards de stats) ============ */
  renderSummary() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    
    const saldo = API.calcularSaldoTotal(moneda);
    const ingresos = API.calcularIngresosMes(moneda);
    const egresos = API.calcularEgresosMes(moneda);
    const ahorro = API.calcularAhorroMes(moneda);
    const tasaAhorro = ingresos > 0 ? (ahorro / ingresos) : 0;
    
    return `
      <div class="summary-grid">
        <div class="glass-card summary-card">
          <div class="label">
            <div class="icon-box blue">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </div>
            Saldo total
          </div>
          <div class="amount">${Formato.formatearMoneda(saldo, moneda)}</div>
          <div class="change positive">↑ Todas las cuentas</div>
        </div>
        
        <div class="glass-card summary-card">
          <div class="label">
            <div class="icon-box green">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            </div>
            Ingresos
          </div>
          <div class="amount">${Formato.formatearMoneda(ingresos, moneda)}</div>
          <div class="change positive">${Fechas.mesActual()}</div>
        </div>
        
        <div class="glass-card summary-card">
          <div class="label">
            <div class="icon-box red">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/></svg>
            </div>
            Egresos
          </div>
          <div class="amount">${Formato.formatearMoneda(egresos, moneda)}</div>
          <div class="change negative">${Fechas.mesActual()}</div>
        </div>
        
        <div class="glass-card summary-card">
          <div class="label">
            <div class="icon-box amber">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
            </div>
            Ahorro
          </div>
          <div class="amount">${Formato.formatearMoneda(ahorro, moneda)}</div>
          <div class="change ${ahorro >= 0 ? 'positive' : 'negative'}">
            ${Formato.formatearPorcentaje(tasaAhorro)} de ingresos
          </div>
        </div>
      </div>
    `;
  },
  
  /* ============ CARRUSEL DE TARJETAS ============ */
  renderCarruselTarjetas() {
    const tarjetas = API.obtenerTarjetas();
    const usuario = API.obtenerUsuario();
    
    if (tarjetas.length === 0) {
      return `
        <div class="glass-card">
          <h3 class="glass-card-title">Tarjetas de crédito</h3>
          <div style="text-align:center;padding:var(--space-xl);color:var(--text-tertiary);">
            <div style="font-size:3rem;margin-bottom:var(--space-md);opacity:0.5;">💳</div>
            <p>No tienes tarjetas registradas</p>
          </div>
        </div>
      `;
    }
    
    if (this.tarjetaActiva >= tarjetas.length) this.tarjetaActiva = 0;
    
    const slides = tarjetas.map((tarjeta, index) => {
      const claseSlide = this.calcularClaseSlide(index, tarjetas.length);
      return `
        <div class="card-slide ${claseSlide}" data-index="${index}">
          ${TarjetaVisualComp.render(tarjeta, usuario)}
        </div>
      `;
    }).join('');
    
    const indicadores = tarjetas.map((_, index) => `
      <button class="indicator-dot ${index === this.tarjetaActiva ? 'active' : ''}" 
              data-slide="${index}" aria-label="Tarjeta ${index + 1}"></button>
    `).join('');
    
    const flechas = tarjetas.length > 1 ? `
      <button class="card-nav-btn prev" id="cardPrev" aria-label="Anterior">‹</button>
      <button class="card-nav-btn next" id="cardNext" aria-label="Siguiente">›</button>
    ` : '';
    
    return `
      <div class="glass-card">
        <div class="glass-card-header">
          <h3 class="glass-card-title">Mis tarjetas de crédito</h3>
          <span class="glass-card-meta" id="cardCounter">${this.tarjetaActiva + 1} de ${tarjetas.length}</span>
        </div>
        
        <div class="cards-slider">
          ${flechas}
          <div class="cards-track" id="cardsTrack">${slides}</div>
        </div>
        
        ${tarjetas.length > 1 ? `<div class="cards-indicators">${indicadores}</div>` : ''}
      </div>
    `;
  },
  
  calcularClaseSlide(index, total) {
    if (index === this.tarjetaActiva) return 'is-active';
    const diff = index - this.tarjetaActiva;
    if (diff === -1) return 'is-prev';
    if (diff === 1) return 'is-next';
    if (diff < -1) return 'is-far-prev';
    return 'is-far-next';
  },
  
  configurarSlider() {
    const track = document.getElementById('cardsTrack');
    if (!track) return;
    
    const tarjetas = API.obtenerTarjetas();
    if (tarjetas.length === 0) return;
    
    const btnPrev = document.getElementById('cardPrev');
    const btnNext = document.getElementById('cardNext');
    const indicators = document.querySelectorAll('.indicator-dot');
    const counter = document.getElementById('cardCounter');
    
    const irASlide = (index) => {
      if (index < 0 || index >= tarjetas.length) return;
      this.tarjetaActiva = index;
      this.actualizarClasesSlides(tarjetas.length);
      
      indicators.forEach((dot, i) => dot.classList.toggle('active', i === index));
      if (counter) counter.textContent = `${index + 1} de ${tarjetas.length}`;
      if (btnPrev) btnPrev.disabled = (index === 0);
      if (btnNext) btnNext.disabled = (index === tarjetas.length - 1);
    };
    
    if (btnPrev) btnPrev.addEventListener('click', () => irASlide(this.tarjetaActiva - 1));
    if (btnNext) btnNext.addEventListener('click', () => irASlide(this.tarjetaActiva + 1));
    
    indicators.forEach(dot => {
      dot.addEventListener('click', () => irASlide(parseInt(dot.dataset.slide, 10)));
    });
    
    track.querySelectorAll('.card-slide').forEach(slide => {
      slide.addEventListener('click', () => {
        if (slide.classList.contains('is-active')) return;
        irASlide(parseInt(slide.dataset.index, 10));
      });
    });
    
    // Swipe táctil
    let startX = 0;
    track.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].screenX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      const diff = startX - e.changedTouches[0].screenX;
      if (Math.abs(diff) < 50) return;
      if (diff > 0 && this.tarjetaActiva < tarjetas.length - 1) irASlide(this.tarjetaActiva + 1);
      else if (diff < 0 && this.tarjetaActiva > 0) irASlide(this.tarjetaActiva - 1);
    }, { passive: true });
    
    if (btnPrev) btnPrev.disabled = (this.tarjetaActiva === 0);
    if (btnNext) btnNext.disabled = (this.tarjetaActiva === tarjetas.length - 1);
  },
  
  actualizarClasesSlides(total) {
    document.querySelectorAll('.card-slide').forEach(slide => {
      const idx = parseInt(slide.dataset.index, 10);
      slide.classList.remove('is-active', 'is-prev', 'is-next', 'is-far-prev', 'is-far-next');
      slide.classList.add(this.calcularClaseSlide(idx, total));
    });
  },
  
  /* ============ GRÁFICOS (4) ============ */
  renderGraficos() {
    return `
      <div class="charts-grid">
        
        <!-- Gráfico 1: Gastos diarios del mes -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-block">
              <div class="chart-title">Gastos diarios</div>
              <div class="chart-subtitle">${Fechas.mesActual()}</div>
            </div>
            <button class="chart-period-pill">Mensual</button>
          </div>
          <div class="chart-canvas-wrapper">
            <canvas id="chartGastosDiarios"></canvas>
          </div>
        </div>
        
        <!-- Gráfico 2: Ingresos vs Egresos -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-block">
              <div class="chart-title">Ingresos vs Egresos</div>
              <div class="chart-subtitle">Últimos 6 meses</div>
            </div>
            <button class="chart-period-pill">6 meses</button>
          </div>
          <div class="chart-canvas-wrapper">
            <canvas id="chartIngresosEgresos"></canvas>
          </div>
        </div>
        
        <!-- Gráfico 3: Distribución por categoría (donut) -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-block">
              <div class="chart-title">Distribución de egresos</div>
              <div class="chart-subtitle">Por categoría · ${Fechas.mesActual()}</div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:140px 1fr;gap:var(--space-md);align-items:center;">
            <div style="position:relative;width:140px;height:140px;">
              <canvas id="chartCategorias"></canvas>
            </div>
            <div class="chart-legend" id="chartCategoriasLeyenda"></div>
          </div>
        </div>
        
        <!-- Gráfico 4: Tendencia de ahorro -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-block">
              <div class="chart-title">Tendencia de ahorro</div>
              <div class="chart-subtitle">Acumulado · 6 meses</div>
            </div>
            <button class="chart-period-pill">Anual</button>
          </div>
          <div class="chart-canvas-wrapper">
            <canvas id="chartTendencia"></canvas>
          </div>
        </div>
        
      </div>
    `;
  },
  
  /* ============ ASIDE DERECHO ============ */
  renderAsideStats() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const ahora = new Date();
    
    const numTransMes = API.obtenerTransacciones({
      mes: ahora.getMonth() + 1,
      anio: ahora.getFullYear(),
    }).length;
    
    const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const numTransMesAnt = API.obtenerTransacciones({
      mes: mesAnterior.getMonth() + 1,
      anio: mesAnterior.getFullYear(),
    }).length;
    
    return `
      <div class="aside-card">
        <div class="aside-card-header">
          <div class="aside-card-title">Actividad</div>
          <span class="aside-card-link">Ver historial →</span>
        </div>
        
        <div class="aside-stats-row">
          <div class="aside-stat">
            <div class="aside-stat-icon" style="background: rgba(59, 130, 246, 0.15); color: #60A5FA;">📊</div>
            <div class="aside-stat-value">${numTransMesAnt}</div>
            <div class="aside-stat-label">Mes anterior</div>
          </div>
          <div class="aside-stat">
            <div class="aside-stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #34D399;">✓</div>
            <div class="aside-stat-value">${numTransMes}</div>
            <div class="aside-stat-label">Este mes</div>
          </div>
        </div>
      </div>
    `;
  },
  
  renderAsideMovimientos() {
    const movimientos = API.obtenerTransacciones({ limite: 5 });
    
    if (movimientos.length === 0) {
      return `
        <div class="aside-card">
          <div class="aside-card-header">
            <div class="aside-card-title">Movimientos recientes</div>
          </div>
          <div style="text-align:center;padding:var(--space-md);color:var(--text-tertiary);font-size:0.8125rem;">
            Sin movimientos
          </div>
        </div>
      `;
    }
    
    const items = movimientos.map(t => {
      const cat = API.obtenerCategoriaPorId(t.categoriaId);
      const esIngreso = t.tipo === 'ingreso';
      const signo = esIngreso ? '+' : '-';
      const cls = esIngreso ? 'positive' : 'negative';
      
      return `
        <div class="aside-movement">
          <div class="icon-box ${cat ? cat.color : 'blue'}">
            <span style="font-size:16px;">${cat ? cat.icono : '💰'}</span>
          </div>
          <div class="aside-movement-info">
            <div class="aside-movement-name">${t.descripcion || (cat ? cat.nombre : 'Movimiento')}</div>
            <div class="aside-movement-meta">${Fechas.formatoCorto(t.fecha)}</div>
          </div>
          <div class="aside-movement-amount ${cls}">
            ${signo}${Formato.formatearMoneda(t.monto, t.moneda)}
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <div class="aside-card">
        <div class="aside-card-header">
          <div class="aside-card-title">Movimientos recientes</div>
          <a href="#transacciones" class="aside-card-link">Ver todos →</a>
        </div>
        ${items}
      </div>
    `;
  },
  
  renderAsidePagoTarjeta() {
    const tarjetas = API.obtenerTarjetas();
    if (tarjetas.length === 0) return '';
    
    // Buscar la tarjeta con próximo pago más cercano
    let proximoPago = null;
    let tarjetaPago = null;
    
    tarjetas.forEach(t => {
      const ciclo = API.obtenerCicloPendiente(t.id);
      if (!ciclo) return;
      
      if (!proximoPago || new Date(ciclo.fechaPago) < new Date(proximoPago.fechaPago)) {
        proximoPago = ciclo;
        tarjetaPago = t;
      }
    });
    
    if (!proximoPago) return '';
    
    const dias = Fechas.diasHasta(proximoPago.fechaPago);
    const urgente = dias <= 5;
    
    return `
      <div class="aside-card" style="${urgente ? 'border-color: rgba(245, 158, 11, 0.3);' : ''}">
        <div class="aside-card-header">
          <div class="aside-card-title">${urgente ? '⚠ Próximo pago' : 'Próximo pago'}</div>
        </div>
        
        <div style="margin-bottom:var(--space-md);">
          <div style="font-size:0.75rem;color:var(--text-tertiary);margin-bottom:4px;">${tarjetaPago.nombre}</div>
          <div style="font-size:1.5rem;font-weight:700;color:${urgente ? 'var(--color-warning)' : 'var(--text-primary)'};">
            ${Formato.formatearMoneda(proximoPago.montoFacturado, tarjetaPago.moneda)}
          </div>
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px;">
            En ${dias} ${dias === 1 ? 'día' : 'días'} · ${Fechas.formatoCompleto(proximoPago.fechaPago)}
          </div>
        </div>
        
        <button class="btn-primary" style="width:100%;justify-content:center;" 
                onclick="App.navegarA('tarjetas')">
          Ver tarjeta
        </button>
      </div>
    `;
  },
};
