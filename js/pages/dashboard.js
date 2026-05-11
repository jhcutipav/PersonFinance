/* ============================================
   PÁGINA: DASHBOARD (Estilo referencia Cryptoline)
   ============================================ */

const Dashboard = {
  
  tarjetaActiva: 0,
  monedaVista: 'PEN',
  tabActiva: 'activity', // activity | spending | income
  historyTab: 'history', // history | upcoming
  filtroActividad: 'todas', // 'todas' | 'cuenta_X' | 'tarjeta_X'
  graficoTipoActivo: 0, // índice del tipo de gráfico (línea, barras, donut, radial)
  TIPOS_GRAFICO: ['linea', 'barras', 'donut', 'radial'],
  autoplayInterval: null,
  AUTOPLAY_MS: 15000,
  
  render(container, monedaVista = 'PEN') {
    this.monedaVista = monedaVista;
    Graficos.destruirTodos();
    
    // Limpiar autoplay anterior si existía
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
    
    container.innerHTML = `
      <div class="dashboard-layout">
        <div class="dashboard-main">
          ${this.renderGreeting()}
          ${this.renderStatsConTarjeta()}
          ${this.renderSummaryTabs()}
          <div id="summaryContent">
            ${this.renderActivityContent()}
          </div>
        </div>
        
        <aside class="dashboard-aside">
          ${this.renderPortfolio()}
          ${this.renderFavorites()}
          ${this.renderUpcoming()}
        </aside>
      </div>
    `;
    
    setTimeout(() => {
      this.renderChartActividad();
      this.renderSparklinesFavorites();
    }, 50);
    
    this.configurarEventos();
    this.configurarSlider();
  },
  
  /* ============ SALUDO ============ */
  renderGreeting() {
    const usuario = API.obtenerUsuario();
    const hora = new Date().getHours();
    let saludo = 'Buenos días';
    if (hora >= 12 && hora < 19) saludo = 'Buenas tardes';
    else if (hora >= 19 || hora < 6) saludo = 'Buenas noches';
    
    const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito');
    
    return `
      <div class="greeting-bar">
        <div class="greeting-left">
          <div class="greeting-avatar">${usuario.nombre.charAt(0).toUpperCase()}</div>
          <div class="greeting-text">${saludo}, ${usuario.nombre}!</div>
        </div>
        
        <div class="wallet-selector">
          <select class="wallet-select">
            <option value="">Todas las cuentas</option>
            ${cuentas.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')}
          </select>
          <button class="wallet-action-btn" onclick="TransaccionForm.abrir(null, () => App.cargarPaginaActual())" title="Nueva transacción">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          </button>
        </div>
      </div>
    `;
  },
  
  /* ============ STATS + TARJETA ============ */
  renderStatsConTarjeta() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    
    const saldo = API.calcularSaldoTotal(moneda);
    const ingresos = API.calcularIngresosMes(moneda);
    const egresosCash = API.calcularEgresosCashMes(moneda);
    const egresosTarjeta = API.calcularEgresosTarjetaMes(moneda);
    const transferencias = API.calcularTransferenciasMes(moneda);
    
    return `
      <div class="stats-card-zone">
        <div class="stats-left">
          <div class="stat-card">
            <div class="stat-card-icon cyan">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-label">Saldo total</div>
              <div class="stat-card-value">${Formato.formatearMoneda(saldo, moneda)}</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-icon green">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/></svg>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-label">Ingresos del mes</div>
              <div class="stat-card-value text-success">${Formato.formatearMoneda(ingresos, moneda)}</div>
            </div>
          </div>
        </div>
        
        <div class="stats-card-center">
          ${this.renderCarruselTarjetas()}
        </div>
        
        <div class="stats-right">
          <div class="stat-card">
            <div class="stat-card-icon red">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-label">Egresos en efectivo</div>
              <div class="stat-card-value text-danger">${Formato.formatearMoneda(egresosCash, moneda)}</div>
              <div style="font-size:0.6875rem;color:var(--text-tertiary);margin-top:2px;">Salieron de tus cuentas</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-icon purple">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-label">Egresos con tarjeta</div>
              <div class="stat-card-value text-warning">${Formato.formatearMoneda(egresosTarjeta, moneda)}</div>
              <div style="font-size:0.6875rem;color:var(--text-tertiary);margin-top:2px;">Pagarás en próximo ciclo</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 5to stat: Transferencias (fila separada, ancho completo) -->
      <div class="stat-transferencias">
        <div class="stat-card transf-stat-card">
          <div class="stat-card-icon" style="background: linear-gradient(135deg, #14F0CD, #06B6D4); color: #0A0E1A;">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
          </div>
          <div class="stat-card-info">
            <div class="stat-card-label">Transferencias del mes</div>
            <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;">
              <div class="stat-card-value">${Formato.formatearMoneda(transferencias.total, moneda)}</div>
              <div style="font-size:0.75rem;color:var(--text-tertiary);">
                ${transferencias.cantidad} ${transferencias.cantidad === 1 ? 'movimiento' : 'movimientos'} entre tus cuentas
              </div>
            </div>
          </div>
          <button class="btn-secondary" style="font-size:0.75rem;padding:6px 12px;" onclick="App.navegarA('transferencias')">
            Ver detalle →
          </button>
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
        <div style="background:var(--card-bg);border:1px dashed var(--card-border);border-radius:var(--radius-lg);padding:var(--space-lg);text-align:center;color:var(--text-tertiary);">
          <div style="font-size:2.5rem;opacity:0.4;margin-bottom:8px;">💳</div>
          <p style="font-size:0.8125rem;">Sin tarjetas registradas</p>
          <button class="btn-primary" style="margin-top:12px;" onclick="App.navegarA('tarjetas')">Agregar tarjeta</button>
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
      <div class="cards-slider">
        ${flechas}
        <div class="cards-track" id="cardsTrack">${slides}</div>
      </div>
      ${tarjetas.length > 1 ? `<div class="cards-indicators">${indicadores}</div>` : ''}
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
    
    const irASlide = (index) => {
      if (index < 0 || index >= tarjetas.length) return;
      this.tarjetaActiva = index;
      this.actualizarClasesSlides(tarjetas.length);
      indicators.forEach((dot, i) => dot.classList.toggle('active', i === index));
      if (btnPrev) btnPrev.disabled = (index === 0);
      if (btnNext) btnNext.disabled = (index === tarjetas.length - 1);
    };
    
    if (btnPrev) btnPrev.addEventListener('click', () => { irASlide(this.tarjetaActiva - 1); this.resetTarjetasAutoplay(); });
    if (btnNext) btnNext.addEventListener('click', () => { irASlide(this.tarjetaActiva + 1); this.resetTarjetasAutoplay(); });
    
    indicators.forEach(dot => {
      dot.addEventListener('click', () => { 
        irASlide(parseInt(dot.dataset.slide, 10)); 
        this.resetTarjetasAutoplay();
      });
    });
    
    track.querySelectorAll('.card-slide').forEach(slide => {
      slide.addEventListener('click', () => {
        if (slide.classList.contains('is-active')) return;
        irASlide(parseInt(slide.dataset.index, 10));
        this.resetTarjetasAutoplay();
      });
    });
    
    let startX = 0;
    track.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].screenX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      const diff = startX - e.changedTouches[0].screenX;
      if (Math.abs(diff) < 50) return;
      if (diff > 0 && this.tarjetaActiva < tarjetas.length - 1) irASlide(this.tarjetaActiva + 1);
      else if (diff < 0 && this.tarjetaActiva > 0) irASlide(this.tarjetaActiva - 1);
      this.resetTarjetasAutoplay();
    }, { passive: true });
    
    if (btnPrev) btnPrev.disabled = (this.tarjetaActiva === 0);
    if (btnNext) btnNext.disabled = (this.tarjetaActiva === tarjetas.length - 1);
    
    // Auto-play del slider de tarjetas (15s)
    if (tarjetas.length > 1) {
      this.iniciarTarjetasAutoplay(tarjetas.length, irASlide);
      
      // Pausa al hover
      const slider = document.querySelector('.cards-slider');
      if (slider) {
        slider.addEventListener('mouseenter', () => this.pausarTarjetasAutoplay());
        slider.addEventListener('mouseleave', () => this.iniciarTarjetasAutoplay(tarjetas.length, irASlide));
      }
    }
  },
  
  iniciarTarjetasAutoplay(total, irASlide) {
    this.pausarTarjetasAutoplay();
    this._tarjetasAutoplay = setInterval(() => {
      const next = (this.tarjetaActiva + 1) % total;
      irASlide(next);
    }, this.AUTOPLAY_MS);
  },
  
  pausarTarjetasAutoplay() {
    if (this._tarjetasAutoplay) {
      clearInterval(this._tarjetasAutoplay);
      this._tarjetasAutoplay = null;
    }
  },
  
  resetTarjetasAutoplay() {
    // El próximo evento de mouseenter/leave del slider lo reiniciará si corresponde
    this.pausarTarjetasAutoplay();
  },
  
  actualizarClasesSlides(total) {
    document.querySelectorAll('.card-slide').forEach(slide => {
      const idx = parseInt(slide.dataset.index, 10);
      slide.classList.remove('is-active', 'is-prev', 'is-next', 'is-far-prev', 'is-far-next');
      slide.classList.add(this.calcularClaseSlide(idx, total));
    });
  },
  
  /* ============ TABS ============ */
  renderSummaryTabs() {
    return `
      <div class="summary-tabs">
        <button class="summary-tab ${this.tabActiva === 'activity' ? 'active' : ''}" data-tab="activity">Resumen Actividad</button>
        <button class="summary-tab ${this.tabActiva === 'spending' ? 'active' : ''}" data-tab="spending">Resumen Egresos</button>
        <button class="summary-tab ${this.tabActiva === 'income' ? 'active' : ''}" data-tab="income">Resumen Ingresos</button>
      </div>
    `;
  },
  
  /* ============ ACTIVITY CONTENT ============ */
  renderActivityContent() {
    return `
      <div class="activity-grid">
        <div class="activity-left">
          ${this.renderActivityGraph()}
          ${this.renderShortcuts()}
        </div>
        <div class="activity-right">
          ${this.renderHistory()}
        </div>
      </div>
    `;
  },
  
  renderActivityGraph() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    
    const cuentas = API.obtenerCuentas();
    const tarjetas = API.obtenerTarjetas();
    
    // Calcular total según filtro y tab
    const totalCalc = this.calcularTotalActividad();
    let titulo = 'Actividad';
    if (this.tabActiva === 'income') titulo = 'Ingresos';
    else if (this.tabActiva === 'spending') titulo = 'Egresos';
    else titulo = 'Egresos';
    
    const ahora = new Date();
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const rango = `${Fechas.formatoCorto(inicio)} - ${Fechas.formatoCorto(ahora)}`;
    
    // Nombre del filtro actual para mostrar
    let nombreFiltro = 'Todas las cuentas';
    if (this.filtroActividad.startsWith('cuenta_')) {
      const id = parseInt(this.filtroActividad.split('_')[1]);
      const c = cuentas.find(c => c.id === id);
      if (c) nombreFiltro = c.nombre;
    } else if (this.filtroActividad.startsWith('tarjeta_')) {
      const id = parseInt(this.filtroActividad.split('_')[1]);
      const t = tarjetas.find(t => t.id === id);
      if (t) nombreFiltro = t.nombre;
    }
    
    return `
      <div class="activity-graph-card">
        <div class="activity-graph-header">
          <div style="flex:1; min-width:0;">
            <div class="activity-graph-title">${titulo} del mes</div>
            <div class="activity-graph-amount">${Formato.formatearMoneda(totalCalc, moneda)}</div>
            <div style="font-size:0.6875rem; color:var(--text-tertiary); margin-top:4px;">
              ${nombreFiltro}
            </div>
          </div>
          <div class="activity-graph-period" style="text-align:right;">
            <select class="form-select" id="filtroActividad" 
                    style="padding:6px 28px 6px 10px; font-size:0.75rem; min-width:140px; max-width:160px; margin-bottom:6px;">
              <option value="todas" ${this.filtroActividad === 'todas' ? 'selected' : ''}>📊 Todas las cuentas</option>
              ${cuentas.length > 0 ? `<optgroup label="Cuentas">
                ${cuentas.map(c => `
                  <option value="cuenta_${c.id}" ${this.filtroActividad === `cuenta_${c.id}` ? 'selected' : ''}>
                    ${c.nombre}
                  </option>
                `).join('')}
              </optgroup>` : ''}
              ${tarjetas.length > 0 ? `<optgroup label="Tarjetas">
                ${tarjetas.map(t => `
                  <option value="tarjeta_${t.id}" ${this.filtroActividad === `tarjeta_${t.id}` ? 'selected' : ''}>
                    💳 ${t.nombre}
                  </option>
                `).join('')}
              </optgroup>` : ''}
            </select>
            <div style="font-size:0.6875rem; color:var(--text-tertiary);">${rango}</div>
          </div>
        </div>
        
        <!-- Slider de tipos de gráfico -->
        <div class="grafico-slider-wrap" id="graficoSliderWrap">
          <button class="grafico-slider-arrow grafico-slider-prev" aria-label="Anterior">‹</button>
          <div class="grafico-slider-title" id="graficoTipoLabel">${this.getNombreTipoGrafico()}</div>
          <button class="grafico-slider-arrow grafico-slider-next" aria-label="Siguiente">›</button>
        </div>
        
        <div class="activity-graph-canvas">
          <canvas id="chartActivity"></canvas>
        </div>
        
        <!-- Dots del slider -->
        <div class="grafico-slider-dots">
          ${this.TIPOS_GRAFICO.map((tipo, i) => `
            <button class="grafico-dot ${i === this.graficoTipoActivo ? 'active' : ''}" 
                    data-tipo-idx="${i}" 
                    aria-label="${this.getNombreTipo(tipo)}"></button>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  getNombreTipoGrafico() {
    return this.getNombreTipo(this.TIPOS_GRAFICO[this.graficoTipoActivo]);
  },
  
  getNombreTipo(tipo) {
    const map = {
      linea: '📈 Línea del tiempo',
      barras: '📊 Barras por día',
      donut: '🍩 Por categorías',
      radial: '🎯 Radar comparativo',
    };
    return map[tipo] || tipo;
  },
  
  /**
   * Calcula el total a mostrar arriba del gráfico según filtro y tab
   */
  calcularTotalActividad() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const ahora = new Date();
    const trans = this.obtenerTransaccionesFiltradas(
      new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0],
      ahora.toISOString().split('T')[0]
    );
    
    let filtradas = trans;
    if (this.tabActiva === 'income') {
      filtradas = trans.filter(t => t.tipo === 'ingreso');
    } else {
      filtradas = trans.filter(t => t.tipo === 'egreso');
    }
    
    return Formato.sumarEnMoneda(filtradas, moneda);
  },
  
  /**
   * Aplica el filtro de cuenta/tarjeta a las transacciones
   */
  obtenerTransaccionesFiltradas(fechaInicio, fechaFin) {
    let trans = API.obtenerTransaccionesEnRango(fechaInicio, fechaFin);
    
    if (this.filtroActividad.startsWith('cuenta_')) {
      const id = parseInt(this.filtroActividad.split('_')[1]);
      trans = trans.filter(t => t.cuentaId === id);
    } else if (this.filtroActividad.startsWith('tarjeta_')) {
      const id = parseInt(this.filtroActividad.split('_')[1]);
      trans = trans.filter(t => t.tarjetaId === id);
    }
    
    return trans;
  },
  
  /**
   * Obtiene el color principal del filtro activo (color de la cuenta/tarjeta)
   */
  obtenerColorFiltro() {
    if (this.filtroActividad === 'todas') {
      return this.tabActiva === 'income' ? '#10B981' : '#14F0CD';
    }
    
    if (this.filtroActividad.startsWith('cuenta_')) {
      const id = parseInt(this.filtroActividad.split('_')[1]);
      const c = API.obtenerCuentaPorId(id);
      if (c && c.color) return ColorPicker.obtenerHex(c.color);
    } else if (this.filtroActividad.startsWith('tarjeta_')) {
      const id = parseInt(this.filtroActividad.split('_')[1]);
      const t = API.obtenerTarjetas().find(t => t.id === id);
      if (t && t.colorTema) return ColorPicker.obtenerHex(t.colorTema);
    }
    
    return this.tabActiva === 'income' ? '#10B981' : '#14F0CD';
  },
  
  /**
   * Renderiza el gráfico de actividad según el tipo seleccionado en el slider
   */
  renderChartActividad() {
    const canvas = document.getElementById('chartActivity');
    if (!canvas) return;
    
    Graficos.destruir('chartActivity');
    
    const tipo = this.TIPOS_GRAFICO[this.graficoTipoActivo];
    
    switch (tipo) {
      case 'linea':  this.renderChartLinea(canvas); break;
      case 'barras': this.renderChartBarras(canvas); break;
      case 'donut':  this.renderChartDonut(canvas); break;
      case 'radial': this.renderChartRadial(canvas); break;
    }
    
    // Actualizar label del slider
    const label = document.getElementById('graficoTipoLabel');
    if (label) label.textContent = this.getNombreTipoGrafico();
    
    // Actualizar dots
    document.querySelectorAll('.grafico-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === this.graficoTipoActivo);
    });
  },
  
  /**
   * GRÁFICO 1: Línea del tiempo (egresos/ingresos diarios)
   */
  renderChartLinea(canvas) {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const ahora = new Date();
    const diasEnMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
    
    const fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
    const fechaFin = ahora.toISOString().split('T')[0];
    let trans = this.obtenerTransaccionesFiltradas(fechaInicio, fechaFin);
    
    if (this.tabActiva === 'income') trans = trans.filter(t => t.tipo === 'ingreso');
    else trans = trans.filter(t => t.tipo === 'egreso');
    
    const datosPorDia = new Array(diasEnMes).fill(0);
    trans.forEach(t => {
      const dia = new Date(t.fecha).getDate();
      datosPorDia[dia - 1] += Formato.convertir(t.monto, t.moneda, moneda);
    });
    
    const labels = Array.from({ length: diasEnMes }, (_, i) => i + 1);
    const colorTema = Theme.coloresGrafico();
    const colorPrincipal = this.obtenerColorFiltro();
    const ctx = canvas.getContext('2d');
    
    // Gradient dinámico desde el color
    const rgb = this.hexToRgb(colorPrincipal);
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, `rgba(${rgb}, 0.3)`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);
    
    Graficos.instancias['chartActivity'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: datosPorDia,
          borderColor: colorPrincipal,
          backgroundColor: gradient,
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointBackgroundColor: colorPrincipal,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 41, 0.95)',
            titleColor: '#fff',
            bodyColor: 'rgba(255, 255, 255, 0.85)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              title: (items) => `Día ${items[0].label}`,
              label: (item) => `${this.tabActiva === 'income' ? 'Ingreso' : 'Gasto'}: ${Formato.formatearMoneda(item.parsed.y, moneda)}`,
            },
          },
        },
        scales: {
          x: { grid: { color: colorTema.grid }, ticks: { color: colorTema.textSecondary, font: { size: 10 } } },
          y: { grid: { color: colorTema.grid }, ticks: { color: colorTema.textSecondary, font: { size: 10 }, callback: (val) => Formato.formatearMoneda(val, moneda).replace('.00', '') } },
        },
      },
    });
  },
  
  /**
   * GRÁFICO 2: Barras por día
   */
  renderChartBarras(canvas) {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const ahora = new Date();
    const diasEnMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
    
    const fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
    const fechaFin = ahora.toISOString().split('T')[0];
    let trans = this.obtenerTransaccionesFiltradas(fechaInicio, fechaFin);
    
    if (this.tabActiva === 'income') trans = trans.filter(t => t.tipo === 'ingreso');
    else trans = trans.filter(t => t.tipo === 'egreso');
    
    const datosPorDia = new Array(diasEnMes).fill(0);
    trans.forEach(t => {
      const dia = new Date(t.fecha).getDate();
      datosPorDia[dia - 1] += Formato.convertir(t.monto, t.moneda, moneda);
    });
    
    const labels = Array.from({ length: diasEnMes }, (_, i) => i + 1);
    const colorTema = Theme.coloresGrafico();
    const colorPrincipal = this.obtenerColorFiltro();
    
    Graficos.instancias['chartActivity'] = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: datosPorDia,
          backgroundColor: colorPrincipal,
          borderRadius: 4,
          barPercentage: 0.7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 41, 0.95)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              title: (items) => `Día ${items[0].label}`,
              label: (item) => Formato.formatearMoneda(item.parsed.y, moneda),
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: colorTema.textSecondary, font: { size: 10 } } },
          y: { grid: { color: colorTema.grid }, ticks: { color: colorTema.textSecondary, font: { size: 10 }, callback: (val) => Formato.formatearMoneda(val, moneda).replace('.00', '') } },
        },
      },
    });
  },
  
  /**
   * GRÁFICO 3: Donut por categorías
   */
  renderChartDonut(canvas) {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const ahora = new Date();
    
    const fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
    const fechaFin = ahora.toISOString().split('T')[0];
    let trans = this.obtenerTransaccionesFiltradas(fechaInicio, fechaFin);
    
    if (this.tabActiva === 'income') trans = trans.filter(t => t.tipo === 'ingreso');
    else trans = trans.filter(t => t.tipo === 'egreso');
    
    // Agrupar por categoría padre
    const porCategoria = {};
    trans.forEach(t => {
      const cat = API.obtenerCategoriaPorId(t.categoriaId);
      if (!cat) return;
      const padre = cat.categoriaPadreId ? API.obtenerCategoriaPorId(cat.categoriaPadreId) : cat;
      if (!padre) return;
      
      if (!porCategoria[padre.id]) {
        porCategoria[padre.id] = { nombre: padre.nombre, icono: padre.icono, total: 0 };
      }
      porCategoria[padre.id].total += Formato.convertir(t.monto, t.moneda, moneda);
    });
    
    const categorias = Object.values(porCategoria).sort((a, b) => b.total - a.total).slice(0, 8);
    
    if (categorias.length === 0) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = Theme.coloresGrafico().textSecondary;
      ctx.font = '14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Sin datos para este filtro', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    const colores = ['#14F0CD', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#EC4899', '#3B82F6'];
    
    Graficos.instancias['chartActivity'] = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: categorias.map(c => `${c.icono} ${c.nombre}`),
        datasets: [{
          data: categorias.map(c => c.total),
          backgroundColor: colores.slice(0, categorias.length),
          borderWidth: 0,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: Theme.coloresGrafico().textSecondary,
              font: { size: 11 },
              padding: 8,
              boxWidth: 12,
            },
          },
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
  
  /**
   * GRÁFICO 4: Radar comparativo (ingresos vs egresos por categoría)
   */
  renderChartRadial(canvas) {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const ahora = new Date();
    
    const fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
    const fechaFin = ahora.toISOString().split('T')[0];
    const trans = this.obtenerTransaccionesFiltradas(fechaInicio, fechaFin);
    
    // Categorías padre de egreso
    const cats = API.obtenerCategorias({ soloPrincipales: true })
      .filter(c => c.tipo === 'egreso').slice(0, 6);
    
    const labels = cats.map(c => c.nombre);
    const dataEgreso = cats.map(cat => {
      const subs = API.obtenerSubcategorias(cat.id).map(s => s.id);
      const ids = [cat.id, ...subs];
      const transCat = trans.filter(t => ids.includes(t.categoriaId) && t.tipo === 'egreso');
      return Formato.sumarEnMoneda(transCat, moneda);
    });
    
    const colorTema = Theme.coloresGrafico();
    const colorPrincipal = this.obtenerColorFiltro();
    const rgb = this.hexToRgb(colorPrincipal);
    
    Graficos.instancias['chartActivity'] = new Chart(canvas.getContext('2d'), {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: 'Egresos',
          data: dataEgreso,
          borderColor: colorPrincipal,
          backgroundColor: `rgba(${rgb}, 0.2)`,
          borderWidth: 2,
          pointBackgroundColor: colorPrincipal,
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 41, 0.95)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (item) => Formato.formatearMoneda(item.parsed.r, moneda),
            },
          },
        },
        scales: {
          r: {
            grid: { color: colorTema.grid },
            angleLines: { color: colorTema.grid },
            ticks: {
              color: colorTema.textSecondary,
              font: { size: 9 },
              backdropColor: 'transparent',
            },
            pointLabels: { color: colorTema.textSecondary, font: { size: 11 } },
          },
        },
      },
    });
  },
  
  /**
   * Helper: convierte hex a "r, g, b" string
   */
  hexToRgb(hex) {
    if (!hex || !hex.startsWith('#')) return '20, 240, 205';
    const num = parseInt(hex.slice(1), 16);
    const r = (num >> 16) & 0xff;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;
    return `${r}, ${g}, ${b}`;
  },
  
  renderShortcuts() {
    const items = [
      { icon: '🎯', name: 'Metas', color: 'orange', page: 'metas' },
      { icon: '📅', name: 'Plan mensual', color: 'cyan', page: 'presupuestos' },
      { icon: '⚙️', name: 'Configuración', color: 'purple', page: 'configuracion' },
      { icon: '↔️', name: 'Transferencias', color: 'green', page: 'transferencias' },
    ];
    
    return `
      <div class="shortcuts-list">
        ${items.map(it => `
          <div class="shortcut-card" onclick="App.navegarA('${it.page}')">
            <div class="shortcut-icon ${it.color}">${it.icon}</div>
            <div class="shortcut-name">${it.name}</div>
            <div class="shortcut-arrow">›</div>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  renderHistory() {
    const trans = API.obtenerTransacciones({ limite: 10 });
    
    // Agrupar por día
    const grupos = {};
    trans.forEach(t => {
      const key = t.fecha;
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(t);
    });
    
    let listaHTML = '';
    if (Object.keys(grupos).length === 0) {
      listaHTML = `
        <div style="text-align:center;padding:var(--space-xl);color:var(--text-tertiary);font-size:0.875rem;">
          Sin movimientos aún
        </div>
      `;
    } else {
      Object.entries(grupos).forEach(([fecha, items]) => {
        const fechaObj = new Date(fecha);
        const labelFecha = `${fechaObj.getDate()} ${Fechas.MESES_CORTOS[fechaObj.getMonth()]}, ${fechaObj.getFullYear()}`;
        
        listaHTML += `
          <div class="history-day-group">
            <div class="history-day-label">${labelFecha}</div>
            ${items.map(t => this.renderHistoryItem(t)).join('')}
          </div>
        `;
      });
    }
    
    return `
      <div class="history-tabs">
        <button class="history-tab ${this.historyTab === 'history' ? 'active' : ''}" data-history-tab="history">Historial</button>
        <button class="history-tab ${this.historyTab === 'upcoming' ? 'active' : ''}" data-history-tab="upcoming">Próximos</button>
        <div class="history-date-selector">
          <div class="history-date-pill">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span>${Fechas.mesActual()} ${new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
      ${listaHTML}
    `;
  },
  
  renderHistoryItem(trans) {
    const cat = API.obtenerCategoriaPorId(trans.categoriaId);
    const cuenta = API.obtenerCuentaPorId(trans.cuentaId);
    const esIngreso = trans.tipo === 'ingreso';
    const signo = esIngreso ? '+' : '-';
    const cls = esIngreso ? 'positive' : 'negative';
    const fechaObj = new Date(trans.fecha);
    const hora = `${fechaObj.getDate()} ${Fechas.MESES_CORTOS[fechaObj.getMonth()]}, ${fechaObj.getFullYear()}`;
    
    return `
      <div class="history-item" onclick="Transacciones.abrirModal(${trans.id})">
        <div class="history-item-icon icon-box ${cat ? cat.color : 'blue'}">
          <span style="font-size:16px;">${cat ? cat.icono : '💰'}</span>
        </div>
        <div class="history-item-info">
          <div class="history-item-name">${trans.descripcion || (cat ? cat.nombre : 'Movimiento')}</div>
          <div class="history-item-meta">${hora}</div>
        </div>
        <div class="history-item-tag">${cat ? cat.nombre : 'Otro'}</div>
        <div class="history-item-amount ${cls}">
          ${signo}${Formato.formatearMoneda(trans.monto, trans.moneda)}
        </div>
      </div>
    `;
  },
  
  /* ============ ASIDE: PORTFOLIO ============ */
  renderPortfolio() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const saldo = API.calcularSaldoTotal(moneda);
    
    // Calcular cambio vs mes anterior (simulado: ahorro acumulado)
    const ingresos = API.calcularIngresosMes(moneda);
    const egresos = API.calcularEgresosMes(moneda);
    const cambio = ingresos > 0 ? ((ingresos - egresos) / ingresos * 100) : 0;
    
    return `
      <div class="aside-card">
        <div class="aside-card-header">
          <div class="aside-card-titles">
            <div class="aside-card-title">Mi Patrimonio</div>
            <div class="aside-card-subtitle">Crece tus ingresos</div>
          </div>
          <div class="aside-card-actions">
            <button class="aside-icon-btn" title="Buscar">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </button>
            <button class="aside-icon-btn" title="Notificaciones">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </button>
          </div>
        </div>
        
        <div class="portfolio-amount">${Formato.formatearMoneda(saldo, moneda)}</div>
        <div class="portfolio-change ${cambio >= 0 ? 'positive' : 'negative'}">
          ${cambio >= 0 ? '↑' : '↓'} ${Math.abs(cambio).toFixed(1)}% este mes
        </div>
        
        <div class="portfolio-actions">
          <button class="portfolio-btn primary" onclick="TransaccionForm.abrir(null, () => App.cargarPaginaActual())">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
            Ingreso
          </button>
          <button class="portfolio-btn secondary" onclick="TransaccionForm.abrir(null, () => App.cargarPaginaActual())">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4"/></svg>
            Egreso
          </button>
        </div>
      </div>
    `;
  },
  
  /* ============ ASIDE: FAVORITES (cuentas) ============ */
  renderFavorites() {
    const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito');
    const tarjetas = API.obtenerTarjetas();
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    
    if (cuentas.length === 0 && tarjetas.length === 0) {
      return `
        <div class="aside-card">
          <div class="aside-card-header">
            <div class="aside-card-titles">
              <div class="aside-card-title">Mis cuentas y tarjetas</div>
            </div>
          </div>
          <div style="text-align:center;color:var(--text-tertiary);font-size:0.8125rem;padding:var(--space-md);">
            Sin cuentas registradas
          </div>
        </div>
      `;
    }
    
    // Calcular movimiento del mes por cada cuenta/tarjeta
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
    const finMes = ahora.toISOString().split('T')[0];
    
    // Renderizar cuentas
    const cardsCuentas = cuentas.map(c => {
      const color = c.color || 'blue';
      const colorHex = ColorPicker.obtenerHex(color);
      const inicial = c.nombre.charAt(0).toUpperCase();
      
      // Calcular movimientos del mes
      const trans = API.obtenerTransacciones({ cuentaId: c.id });
      const transMes = trans.filter(t => t.fecha >= inicioMes && t.fecha <= finMes && !t.esTransferencia);
      const ingresoMes = transMes.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
      const egresoMes = transMes.filter(t => t.tipo === 'egreso').reduce((s, t) => s + t.monto, 0);
      const cambio = ingresoMes - egresoMes;
      const cambioPct = c.saldo > 0 ? (cambio / c.saldo) * 100 : 0;
      
      const tipoLabel = c.tipo === 'efectivo' ? 'EFECTIVO' : c.tipo === 'billetera' ? 'BILLETERA' : 'BANCO';
      
      return `
        <div class="favorite-card" style="border-left: 3px solid ${colorHex};">
          <div class="favorite-header">
            <div class="favorite-icon" style="background: ${colorHex};">${inicial}</div>
            <div style="flex:1;min-width:0;">
              <div class="favorite-name" title="${c.nombre}">${c.nombre.length > 14 ? c.nombre.substring(0, 14) + '...' : c.nombre}</div>
              <div class="favorite-symbol">${tipoLabel} · ${c.moneda}</div>
            </div>
          </div>
          <div class="favorite-sparkline">
            <canvas id="sparkFav_cuenta_${c.id}" data-color="${colorHex}"></canvas>
          </div>
          <div class="favorite-stats">
            <span class="favorite-amount">${Formato.formatearMoneda(c.saldo, c.moneda)}</span>
            <span class="favorite-change ${cambio >= 0 ? 'positive' : 'negative'}">
              ${cambio >= 0 ? '+' : ''}${Formato.formatearMoneda(Math.abs(cambio), c.moneda)}
            </span>
          </div>
        </div>
      `;
    }).join('');
    
    // Renderizar tarjetas de crédito
    const cardsTarjetas = tarjetas.map(t => {
      const colorId = t.colorTema || 'purple';
      const colorHex = ColorPicker.obtenerHex(colorId);
      const inicial = '💳';
      
      // Calcular consumos del mes con esta tarjeta
      const trans = API.obtenerTransacciones({});
      const transTarjetaMes = trans.filter(tr => 
        tr.tarjetaId === t.id && 
        tr.fecha >= inicioMes && 
        tr.fecha <= finMes
      );
      const consumoMes = transTarjetaMes.reduce((s, tr) => s + tr.monto, 0);
      
      const pctUsado = t.lineaCredito > 0 ? (t.usado / t.lineaCredito) * 100 : 0;
      
      return `
        <div class="favorite-card" style="border-left: 3px solid ${colorHex};">
          <div class="favorite-header">
            <div class="favorite-icon" style="background: ${colorHex};font-size:14px;">💳</div>
            <div style="flex:1;min-width:0;">
              <div class="favorite-name" title="${t.nombre}">${t.nombre.length > 14 ? t.nombre.substring(0, 14) + '...' : t.nombre}</div>
              <div class="favorite-symbol">TARJETA · ${t.moneda}</div>
            </div>
          </div>
          
          <!-- Barra de uso -->
          <div style="margin: 6px 0;">
            <div style="height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${Math.min(pctUsado, 100)}%;background:${colorHex};border-radius:3px;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:0.625rem;color:var(--text-tertiary);">
              <span>${pctUsado.toFixed(0)}% usado</span>
              <span>Disp: ${Formato.formatearMoneda(t.lineaCredito - t.usado, t.moneda).replace('.00', '')}</span>
            </div>
          </div>
          
          <div class="favorite-stats">
            <span class="favorite-amount">${Formato.formatearMoneda(t.usado, t.moneda)}</span>
            <span class="favorite-change ${consumoMes > 0 ? 'negative' : 'positive'}">
              ${consumoMes > 0 ? '+' : ''}${Formato.formatearMoneda(consumoMes, t.moneda)}
            </span>
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <div class="aside-card">
        <div class="aside-card-header">
          <div class="aside-card-titles">
            <div class="aside-card-title">Mis cuentas</div>
            <div class="aside-card-subtitle">${cuentas.length} ${cuentas.length === 1 ? 'cuenta' : 'cuentas'} activas</div>
          </div>
        </div>
        <div class="favorites-grid">
          ${cardsCuentas}
        </div>
      </div>
      
      ${tarjetas.length > 0 ? `
        <div class="aside-card" style="margin-top: var(--space-md);">
          <div class="aside-card-header">
            <div class="aside-card-titles">
              <div class="aside-card-title">Mis tarjetas</div>
              <div class="aside-card-subtitle">${tarjetas.length} ${tarjetas.length === 1 ? 'tarjeta' : 'tarjetas'} de crédito</div>
            </div>
          </div>
          <div class="favorites-grid">
            ${cardsTarjetas}
          </div>
        </div>
      ` : ''}
    `;
  },
  
  renderSparklinesFavorites() {
    const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito');
    const ahora = new Date();
    
    cuentas.forEach(c => {
      const canvas = document.getElementById(`sparkFav_cuenta_${c.id}`);
      if (!canvas) return;
      
      const color = canvas.dataset.color || '#14F0CD';
      
      // Generar saldo histórico real de los últimos 14 días
      const saldoActual = c.saldo;
      const trans = API.obtenerTransacciones({ cuentaId: c.id });
      
      // Reconstruir saldos día a día (yendo hacia atrás desde saldo actual)
      const dias = 14;
      const puntos = new Array(dias).fill(saldoActual);
      
      for (let i = 0; i < dias; i++) {
        const fecha = new Date(ahora);
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        // Sumar/restar las transacciones de ese día y posteriores para tener el saldo de ese día
        const transHastaHoy = trans.filter(t => t.fecha > fechaStr);
        let saldoEnEseDia = saldoActual;
        transHastaHoy.forEach(t => {
          if (t.tipo === 'ingreso') saldoEnEseDia -= t.monto;
          else if (t.tipo === 'egreso') saldoEnEseDia += t.monto;
        });
        puntos[dias - 1 - i] = saldoEnEseDia;
      }
      
      Graficos.destruir(`sparkFav_cuenta_${c.id}`);
      const ctx = canvas.getContext('2d');
      
      Graficos.instancias[`sparkFav_cuenta_${c.id}`] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: puntos.map((_, i) => i),
          datasets: [{
            data: puntos,
            borderColor: color,
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            tension: 0.4,
            pointRadius: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } }
        }
      });
    });
  },
  
  /* ============ ASIDE: UPCOMING (próximos pagos) ============ */
  renderUpcoming() {
    const tarjetas = API.obtenerTarjetas();
    const items = [];
    
    // Próximos pagos de tarjetas
    tarjetas.forEach(t => {
      const ciclo = API.obtenerCicloPendiente(t.id);
      if (ciclo) {
        const dias = Fechas.diasHasta(ciclo.fechaPago);
        items.push({
          tipo: 'tarjeta',
          nombre: t.nombre,
          inicial: t.banco ? t.banco.charAt(0) : 'T',
          color: t.colorTema === 'cyan' ? '#06B6D4' : '#8B5CF6',
          monto: ciclo.montoFacturado,
          moneda: t.moneda,
          dias: dias,
          urgente: dias <= 5,
          icono: null,
        });
      }
    });
    
    // Próximos gastos fijos (próximos 7 días)
    const gastosProximos = API.obtenerProximosVencimientos(7);
    gastosProximos.forEach(g => {
      // Color según el icon-box color
      const colorMap = {
        red: '#EF4444', amber: '#F59E0B', cyan: '#06B6D4',
        purple: '#8B5CF6', green: '#10B981', blue: '#3B82F6', pink: '#EC4899',
      };
      
      items.push({
        tipo: 'gasto',
        nombre: g.nombre,
        inicial: null,
        icono: g.icono,
        color: colorMap[g.color] || '#3B82F6',
        monto: g.monto,
        moneda: g.moneda,
        dias: g.diasFaltan,
        urgente: g.diasFaltan <= 3,
      });
    });
    
    // Ordenar por días (más urgente primero)
    items.sort((a, b) => a.dias - b.dias);
    
    if (items.length === 0) {
      return `
        <div class="aside-card">
          <div class="aside-card-header">
            <div class="aside-card-titles">
              <div class="aside-card-title">Próximos pagos</div>
            </div>
          </div>
          <div style="text-align:center;color:var(--text-tertiary);font-size:0.8125rem;padding:var(--space-md);">
            Sin pagos próximos 🎉
          </div>
        </div>
      `;
    }
    
    return `
      <div class="aside-card">
        <div class="aside-card-header">
          <div class="aside-card-titles">
            <div class="aside-card-title">Próximos pagos</div>
            <div class="aside-card-subtitle">${items.length} ${items.length === 1 ? 'compromiso' : 'compromisos'}</div>
          </div>
        </div>
        
        <div class="upcoming-list">
          ${items.slice(0, 5).map((it, i) => `
            <div class="upcoming-item" onclick="App.navegarA('${it.tipo === 'tarjeta' ? 'tarjetas' : 'gastos-fijos'}')">
              <div class="upcoming-icon" style="background:${it.color};">
                ${it.icono ? `<span style="font-size:14px;">${it.icono}</span>` : it.inicial}
              </div>
              <div class="upcoming-info">
                <div class="upcoming-name">${it.nombre.length > 14 ? it.nombre.substring(0, 14) + '...' : it.nombre}</div>
                <div class="upcoming-meta">${it.dias === 0 ? 'Hoy' : it.dias === 1 ? 'Mañana' : `En ${it.dias} días`}</div>
              </div>
              <div>
                <div class="upcoming-amount">${Formato.formatearMoneda(it.monto, it.moneda)}</div>
                <div class="upcoming-change ${it.urgente ? 'negative' : 'positive'}">
                  ${it.urgente ? '⚠ Urgente' : 'A tiempo'}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  renderSparklinesUpcoming() {
    document.querySelectorAll('[id^="sparkUp"]').forEach((canvas, i) => {
      const points = Array.from({ length: 8 }, () => Math.random() * 100 + 50);
      const ctx = canvas.getContext('2d');
      
      Graficos.destruir(canvas.id);
      Graficos.instancias[canvas.id] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: points.map((_, i) => i),
          datasets: [{
            data: points,
            borderColor: '#14F0CD',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            tension: 0.4,
            pointRadius: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } }
        }
      });
    });
  },
  
  /* ============ EVENTOS ============ */
  configurarEventos() {
    // Tabs principales
    document.querySelectorAll('.summary-tab[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.tabActiva = btn.dataset.tab;
        const container = document.getElementById('pageContent');
        if (container) this.render(container, this.monedaVista);
      });
    });
    
    // Tabs de history
    document.querySelectorAll('.history-tab[data-history-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.historyTab = btn.dataset.historyTab;
        document.querySelectorAll('.history-tab').forEach(b => {
          b.classList.toggle('active', b.dataset.historyTab === this.historyTab);
        });
      });
    });
    
    // Filtro de actividad por cuenta/tarjeta
    const filtroEl = document.getElementById('filtroActividad');
    if (filtroEl) {
      filtroEl.addEventListener('change', (e) => {
        this.filtroActividad = e.target.value;
        // Re-renderizar el gráfico Y los stats arriba
        const container = document.getElementById('pageContent');
        if (container) this.render(container, this.monedaVista);
      });
    }
    
    // Slider de tipos de gráfico - botones de flecha
    const btnPrev = document.querySelector('.grafico-slider-prev');
    const btnNext = document.querySelector('.grafico-slider-next');
    if (btnPrev) btnPrev.addEventListener('click', () => this.cambiarTipoGrafico(-1));
    if (btnNext) btnNext.addEventListener('click', () => this.cambiarTipoGrafico(1));
    
    // Dots del slider
    document.querySelectorAll('.grafico-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.dataset.tipoIdx);
        this.graficoTipoActivo = idx;
        this.renderChartActividad();
        this.resetAutoplay();
      });
    });
    
    // Iniciar autoplay del slider
    this.iniciarAutoplay();
    
    // Slider de tarjetas - botones (si hay)
    const cardPrev = document.querySelector('.card-nav-btn.card-nav-prev');
    const cardNext = document.querySelector('.card-nav-btn.card-nav-next');
    if (cardPrev) cardPrev.addEventListener('click', () => this.cambiarTarjeta(-1));
    if (cardNext) cardNext.addEventListener('click', () => this.cambiarTarjeta(1));
    
    document.querySelectorAll('.card-dot').forEach((dot, i) => {
      dot.addEventListener('click', () => {
        this.tarjetaActiva = i;
        const container = document.getElementById('pageContent');
        if (container) this.render(container, this.monedaVista);
      });
    });
    
    // Pausa del autoplay al hover sobre el card del gráfico
    const graphCard = document.querySelector('.activity-graph-card');
    if (graphCard) {
      graphCard.addEventListener('mouseenter', () => this.pausarAutoplay());
      graphCard.addEventListener('mouseleave', () => this.iniciarAutoplay());
    }
  },
  
  /**
   * Cambia el tipo de gráfico activo (-1 anterior, +1 siguiente)
   */
  cambiarTipoGrafico(delta) {
    const total = this.TIPOS_GRAFICO.length;
    this.graficoTipoActivo = (this.graficoTipoActivo + delta + total) % total;
    this.renderChartActividad();
    this.resetAutoplay();
  },
  
  /**
   * Cambia la tarjeta activa del carrusel (-1 anterior, +1 siguiente)
   */
  cambiarTarjeta(delta) {
    const tarjetas = API.obtenerTarjetas();
    if (tarjetas.length === 0) return;
    this.tarjetaActiva = (this.tarjetaActiva + delta + tarjetas.length) % tarjetas.length;
    const container = document.getElementById('pageContent');
    if (container) this.render(container, this.monedaVista);
  },
  
  /**
   * Inicia el autoplay del slider de gráficos
   */
  iniciarAutoplay() {
    this.pausarAutoplay();
    this.autoplayInterval = setInterval(() => {
      this.cambiarTipoGrafico(1);
    }, this.AUTOPLAY_MS);
  },
  
  pausarAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  },
  
  resetAutoplay() {
    if (this.autoplayInterval) {
      this.pausarAutoplay();
      this.iniciarAutoplay();
    }
  },
};
