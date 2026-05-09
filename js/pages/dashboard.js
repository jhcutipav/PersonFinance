/* ============================================
   PÁGINA: DASHBOARD (Estilo referencia Cryptoline)
   ============================================ */

const Dashboard = {
  
  tarjetaActiva: 0,
  monedaVista: 'PEN',
  tabActiva: 'activity', // activity | spending | income
  historyTab: 'history', // history | upcoming
  filtroActividad: 'todas', // 'todas' | 'cuenta_X' | 'tarjeta_X'
  
  render(container, monedaVista = 'PEN') {
    this.monedaVista = monedaVista;
    Graficos.destruirTodos();
    
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
    const egresos = API.calcularEgresosMes(moneda);
    const ahorro = API.calcularAhorroMes(moneda);
    
    return `
      <div class="stats-card-zone">
        <div class="stats-left">
          <div class="stat-card">
            <div class="stat-card-icon cyan">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-label">Saldo total</div>
              <div class="stat-card-value">${Formato.formatearMoneda(saldo, moneda)}</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-icon purple">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-label">Ahorro del mes</div>
              <div class="stat-card-value">${Formato.formatearMoneda(ahorro, moneda)}</div>
            </div>
          </div>
        </div>
        
        <div class="stats-card-center">
          ${this.renderCarruselTarjetas()}
        </div>
        
        <div class="stats-right">
          <div class="stat-card">
            <div class="stat-card-icon green">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/></svg>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-label">Egresos</div>
              <div class="stat-card-value">${Formato.formatearMoneda(egresos, moneda)}</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-icon blue">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-label">Ingresos</div>
              <div class="stat-card-value">${Formato.formatearMoneda(ingresos, moneda)}</div>
            </div>
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
        <div class="activity-graph-canvas">
          <canvas id="chartActivity"></canvas>
        </div>
      </div>
    `;
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
   * Renderiza el gráfico de actividad con el filtro aplicado
   */
  renderChartActividad() {
    const canvas = document.getElementById('chartActivity');
    if (!canvas) return;
    
    Graficos.destruir('chartActivity');
    
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const ahora = new Date();
    const diasEnMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
    
    // Obtener transacciones filtradas del mes actual
    const fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
    const fechaFin = ahora.toISOString().split('T')[0];
    let trans = this.obtenerTransaccionesFiltradas(fechaInicio, fechaFin);
    
    // Filtrar por tipo según tab
    if (this.tabActiva === 'income') {
      trans = trans.filter(t => t.tipo === 'ingreso');
    } else {
      trans = trans.filter(t => t.tipo === 'egreso');
    }
    
    // Agrupar por día
    const datosPorDia = new Array(diasEnMes).fill(0);
    trans.forEach(t => {
      const dia = new Date(t.fecha).getDate();
      datosPorDia[dia - 1] += Formato.convertir(t.monto, t.moneda, moneda);
    });
    
    const labels = Array.from({ length: diasEnMes }, (_, i) => i + 1);
    const colorTema = Theme.coloresGrafico();
    
    const ctx = canvas.getContext('2d');
    const colorPrincipal = this.tabActiva === 'income' ? '#10B981' : '#14F0CD';
    const colorRgb = this.tabActiva === 'income' ? '16, 185, 129' : '20, 240, 205';
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, `rgba(${colorRgb}, 0.3)`);
    gradient.addColorStop(1, `rgba(${colorRgb}, 0)`);
    
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
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
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
          x: {
            grid: { color: colorTema.grid },
            ticks: { color: colorTema.textSecondary, font: { size: 10 } },
          },
          y: {
            grid: { color: colorTema.grid },
            ticks: {
              color: colorTema.textSecondary,
              font: { size: 10 },
              callback: (val) => Formato.formatearMoneda(val, moneda).replace('.00', ''),
            },
          },
        },
      },
    });
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
    const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito').slice(0, 4);
    
    if (cuentas.length === 0) {
      return `
        <div class="aside-card">
          <div class="aside-card-header">
            <div class="aside-card-titles">
              <div class="aside-card-title">Mis cuentas</div>
            </div>
          </div>
          <div style="text-align:center;color:var(--text-tertiary);font-size:0.8125rem;padding:var(--space-md);">
            Sin cuentas registradas
          </div>
        </div>
      `;
    }
    
    const colores = ['#8B5CF6', '#10B981', '#F59E0B', '#06B6D4'];
    
    const cards = cuentas.slice(0, 2).map((c, i) => {
      const inicial = c.nombre.charAt(0).toUpperCase();
      const tipoLabel = c.tipo === 'efectivo' ? 'EF' : c.tipo === 'billetera' ? 'BL' : 'BANK';
      const cambio = (Math.random() * 4 - 1).toFixed(2); // simulado
      
      return `
        <div class="favorite-card">
          <div class="favorite-header">
            <div class="favorite-icon" style="background: ${colores[i % colores.length]};">${inicial}</div>
            <div>
              <div class="favorite-name">${c.nombre.length > 10 ? c.nombre.substring(0, 10) + '...' : c.nombre}</div>
              <div class="favorite-symbol">${tipoLabel}</div>
            </div>
          </div>
          <div class="favorite-sparkline">
            <canvas id="sparkFav${c.id}"></canvas>
          </div>
          <div class="favorite-stats">
            <span class="favorite-amount">${Formato.formatearMoneda(c.saldo, c.moneda)}</span>
            <span class="favorite-change ${cambio >= 0 ? 'positive' : 'negative'}">
              ${cambio >= 0 ? '+' : ''}${cambio}%
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
          </div>
          <a class="aside-card-subtitle" style="color:var(--accent-primary);cursor:pointer;">Ver todas</a>
        </div>
        <div class="favorites-grid">
          ${cards}
        </div>
      </div>
    `;
  },
  
  renderSparklinesFavorites() {
    const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito').slice(0, 2);
    cuentas.forEach((c, i) => {
      const canvas = document.getElementById(`sparkFav${c.id}`);
      if (!canvas) return;
      
      // Generar puntos aleatorios para el sparkline (simulado)
      const points = Array.from({ length: 12 }, () => Math.random() * 100 + 50);
      const trend = Math.random() > 0.3 ? '#14F0CD' : '#EF4444';
      
      Graficos.destruir(`sparkFav${c.id}`);
      const ctx = canvas.getContext('2d');
      
      Graficos.instancias[`sparkFav${c.id}`] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: points.map((_, i) => i),
          datasets: [{
            data: points,
            borderColor: trend,
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
        // Re-renderizar solo el card del gráfico para evitar parpadeo
        const container = document.getElementById('pageContent');
        if (container) this.render(container, this.monedaVista);
      });
    }
  },
};
