  /* ============================================
    PÁGINA: DASHBOARD (Estilo referencia Cryptoline)
    ============================================ */

  const Dashboard = {
    
    tarjetaActiva: 0,
    monedaVista: 'PEN',
    tabActiva: 'activity', // activity | spending | income
    historyTab: 'history', // history | upcoming
    filtroActividad: 'todas', // 'todas' | 'cuenta_X' | 'tarjeta_X'
    graficoTipoActivo: 0,
    TIPOS_GRAFICO: ['linea', 'barras', 'donut', 'radial', 'pie', 'polar', 'stacked', 'area'],
    autoplayInterval: null,
    AUTOPLAY_MS: 15000,
    
    // v13 — Estado del Resumen General
    resumenFiltro: 'todas',  // 'todas' | 'cuenta_X' | 'tarjeta_X'
    resumenMes: null,  // null = mes actual, o {mes, anio}
    
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
            
            <!-- v13 — Card grande "Resumen general" con stats + gráfico -->
            ${this.renderResumenGeneral()}
            
            <!-- Slider de tarjetas + resumen de tarjeta seleccionada -->
            ${this.renderTarjetasYResumen()}
            
            <!-- Tabla Recent Activity ancho completo -->
            <div class="activity-history-fullwidth">
              ${this.renderHistory()}
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
        this.renderChartResumenGeneral();  // v13 — nuevo gráfico
        this.renderSparklinesFavorites();
        this.renderChartResumenTarjeta();
        this.renderChartUsoTarjetas();     // v13 — donut con uso de cada tarjeta
      }, 50);
      
      this.configurarEventos();
      this.configurarEventosResumenGeneral();  // v13
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
    
    /* ============================================
       v13 — RESUMEN GENERAL (card grande con stats + gráfico)
       Reemplaza: stats-row-top + summaryTabs + activityContent
       Layout:
       ┌─────────────────────────────────────────────────┐
       │ Resumen general          [Mes anterior >]       │
       │                                                 │
       │  saldo        ingresos       egresos            │
       │  S/ 33,846    S/ 13,846      S/ 21,124          │
       │                                                 │
       │  ┌──────────────────────────────────────────┐   │
       │  │  📈 Gráfico líneas (saldo/ingr/egresos)  │   │
       │  └──────────────────────────────────────────┘   │
       └─────────────────────────────────────────────────┘
       ============================================ */
    renderResumenGeneral() {
      const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
      
      // Determinar mes/año a mostrar
      const ahora = new Date();
      const mes = this.resumenMes ? this.resumenMes.mes : ahora.getMonth();
      const anio = this.resumenMes ? this.resumenMes.anio : ahora.getFullYear();
      const esMesActual = mes === ahora.getMonth() && anio === ahora.getFullYear();
      
      // Calcular stats según filtro y mes
      const stats = this.calcularStatsResumen(mes, anio, moneda);
      
      // Obtener cuentas y tarjetas para el selector
      const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito');
      const tarjetas = API.obtenerTarjetas();
      
      // Label del filtro
      let filtroLabel = 'Todas las cuentas';
      if (this.resumenFiltro.startsWith('cuenta_')) {
        const id = parseInt(this.resumenFiltro.split('_')[1]);
        const c = cuentas.find(c => c.id === id);
        if (c) filtroLabel = c.nombre;
      } else if (this.resumenFiltro.startsWith('tarjeta_')) {
        const id = parseInt(this.resumenFiltro.split('_')[1]);
        const t = tarjetas.find(t => t.id === id);
        if (t) filtroLabel = t.nombre;
      }
      
      const mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const labelMes = `${mesesCortos[mes]}, ${anio}`;
      
      return `
        <div class="resumen-general-card">
          <!-- Header: filtro a la izquierda, navegador de mes a la derecha -->
          <div class="resumen-general-header">
            <div class="resumen-general-filtro-wrap">
              <select class="resumen-general-filtro" id="resumenFiltro">
                <option value="todas" ${this.resumenFiltro === 'todas' ? 'selected' : ''}>📊 Todas las cuentas</option>
                ${cuentas.length > 0 ? `
                  <optgroup label="💵 Cuentas">
                    ${cuentas.map(c => `
                      <option value="cuenta_${c.id}" ${this.resumenFiltro === `cuenta_${c.id}` ? 'selected' : ''}>
                        ${c.icono || '🏦'} ${c.nombre}
                      </option>
                    `).join('')}
                  </optgroup>
                ` : ''}
                ${tarjetas.length > 0 ? `
                  <optgroup label="💳 Tarjetas">
                    ${tarjetas.map(t => `
                      <option value="tarjeta_${t.id}" ${this.resumenFiltro === `tarjeta_${t.id}` ? 'selected' : ''}>
                        💳 ${t.nombre}
                      </option>
                    `).join('')}
                  </optgroup>
                ` : ''}
              </select>
            </div>
            
            <!-- Selector de mes (con flechas) -->
            <div class="resumen-general-mes-nav">
              <button class="resumen-mes-arrow" id="resumenMesPrev" title="Mes anterior">‹</button>
              <button class="resumen-mes-actual" id="resumenMesActual" title="Click para ir al mes actual">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span>${labelMes}</span>
              </button>
              <button class="resumen-mes-arrow" id="resumenMesNext" title="Mes siguiente" ${esMesActual ? 'disabled' : ''}>›</button>
            </div>
          </div>
          
          <!-- Stats grandes en línea -->
          <div class="resumen-general-stats">
            <div class="resumen-stat">
              <div class="resumen-stat-label">Saldo</div>
              <div class="resumen-stat-value resumen-stat-saldo">
                <span class="resumen-stat-currency">${Formato.SIMBOLOS[moneda]}</span>
                ${this.formatearNumeroResumen(stats.saldo)}
                <span class="resumen-stat-trend ${stats.saldo >= 0 ? 'up' : 'down'}">
                  ${stats.saldo >= 0 ? '↗' : '↘'}
                </span>
              </div>
            </div>
            
            <div class="resumen-stat">
              <div class="resumen-stat-label">Ingresos</div>
              <div class="resumen-stat-value resumen-stat-ingresos">
                <span class="resumen-stat-currency">${Formato.SIMBOLOS[moneda]}</span>
                ${this.formatearNumeroResumen(stats.ingresos)}
                <span class="resumen-stat-trend up">↗</span>
              </div>
            </div>
            
            <div class="resumen-stat">
              <div class="resumen-stat-label">Egresos</div>
              <div class="resumen-stat-value resumen-stat-egresos">
                <span class="resumen-stat-currency">${Formato.SIMBOLOS[moneda]}</span>
                ${this.formatearNumeroResumen(stats.egresos)}
                <span class="resumen-stat-trend down">↘</span>
              </div>
            </div>
          </div>
          
          <!-- Filtro activo (badge sutil) -->
          ${this.resumenFiltro !== 'todas' ? `
            <div class="resumen-filtro-badge">
              <span>🔍 Mostrando: <strong>${filtroLabel}</strong></span>
              <button onclick="Dashboard.cambiarFiltroResumen('todas')" title="Limpiar filtro">✕</button>
            </div>
          ` : ''}
          
          <!-- Gráfico de 3 líneas -->
          <div class="resumen-general-chart-wrap">
            <canvas id="chartResumenGeneral"></canvas>
          </div>
        </div>
      `;
    },
    
    /**
     * v13 — Formatea número grande con espacios para legibilidad
     * Ej: 33846 → "33, 846"
     */
    formatearNumeroResumen(num) {
      const entero = Math.floor(Math.abs(num));
      const str = entero.toLocaleString('es-PE');
      return Math.abs(num) < 1000 ? str + '.00' : str;
    },
    
    /**
     * v13 — Calcula los 3 stats principales aplicando filtro y mes
     */
    calcularStatsResumen(mes, anio, moneda) {
      const todasTrans = API.obtenerTransacciones({ incluirTransferencias: false });
      
      // Filtrar por filtro de cuenta/tarjeta
      let trans = todasTrans;
      if (this.resumenFiltro.startsWith('cuenta_')) {
        const id = parseInt(this.resumenFiltro.split('_')[1]);
        trans = trans.filter(t => t.cuentaId === id);
      } else if (this.resumenFiltro.startsWith('tarjeta_')) {
        const id = parseInt(this.resumenFiltro.split('_')[1]);
        trans = trans.filter(t => t.tarjetaId === id);
      }
      
      // Filtrar por mes/año
      const transMes = trans.filter(t => {
        const fecha = new Date(t.fecha + 'T00:00:00');
        return fecha.getMonth() === mes && fecha.getFullYear() === anio;
      });
      
      // Calcular ingresos y egresos del mes
      let ingresos = 0, egresos = 0;
      transMes.forEach(t => {
        const m = Formato.convertir(t.monto, t.moneda, moneda);
        if (t.tipo === 'ingreso') ingresos += m;
        else if (t.tipo === 'egreso') egresos += m;
      });
      
      // Saldo: depende del filtro
      let saldo;
      if (this.resumenFiltro === 'todas') {
        saldo = API.calcularSaldoTotal(moneda);
      } else if (this.resumenFiltro.startsWith('cuenta_')) {
        const id = parseInt(this.resumenFiltro.split('_')[1]);
        const cuenta = API.obtenerCuentaPorId(id);
        saldo = cuenta ? Formato.convertir(cuenta.saldo, cuenta.moneda, moneda) : 0;
      } else if (this.resumenFiltro.startsWith('tarjeta_')) {
        const id = parseInt(this.resumenFiltro.split('_')[1]);
        const tarj = API.obtenerTarjetaPorId(id);
        // Para tarjeta de crédito, "saldo" = disponible
        if (tarj) {
          const disp = (tarj.lineaCredito || 0) - (tarj.saldoUsado || 0);
          saldo = Formato.convertir(disp, tarj.moneda, moneda);
        } else {
          saldo = 0;
        }
      } else {
        saldo = 0;
      }
      
      return { saldo, ingresos, egresos };
    },
    
    /**
     * v13 — Render del gráfico de 3 líneas (Saldo, Ingresos, Egresos por día)
     */
    renderChartResumenGeneral() {
      const canvas = document.getElementById('chartResumenGeneral');
      if (!canvas) return;
      
      Graficos.destruir('chartResumenGeneral');
      
      const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
      const ahora = new Date();
      const mes = this.resumenMes ? this.resumenMes.mes : ahora.getMonth();
      const anio = this.resumenMes ? this.resumenMes.anio : ahora.getFullYear();
      const diasEnMes = new Date(anio, mes + 1, 0).getDate();
      
      // Obtener todas las transacciones filtradas
      const todasTrans = API.obtenerTransacciones({ incluirTransferencias: false });
      let trans = todasTrans;
      if (this.resumenFiltro.startsWith('cuenta_')) {
        const id = parseInt(this.resumenFiltro.split('_')[1]);
        trans = trans.filter(t => t.cuentaId === id);
      } else if (this.resumenFiltro.startsWith('tarjeta_')) {
        const id = parseInt(this.resumenFiltro.split('_')[1]);
        trans = trans.filter(t => t.tarjetaId === id);
      }
      
      // Filtrar por mes
      const transMes = trans.filter(t => {
        const f = new Date(t.fecha + 'T00:00:00');
        return f.getMonth() === mes && f.getFullYear() === anio;
      });
      
      // Acumulados diarios
      const ingresosPorDia = new Array(diasEnMes).fill(0);
      const egresosPorDia = new Array(diasEnMes).fill(0);
      
      transMes.forEach(t => {
        const f = new Date(t.fecha + 'T00:00:00');
        const dia = f.getDate() - 1; // índice 0-based
        const m = Formato.convertir(t.monto, t.moneda, moneda);
        if (t.tipo === 'ingreso') ingresosPorDia[dia] += m;
        else if (t.tipo === 'egreso') egresosPorDia[dia] += m;
      });
      
      // Acumulados (cada día suma el anterior para tener "curva")
      const ingresosAcum = [];
      const egresosAcum = [];
      const saldoAcum = [];
      
      // Saldo inicial: stat actual menos lo que pasó este mes
      const stats = this.calcularStatsResumen(mes, anio, moneda);
      const saldoInicial = stats.saldo - (stats.ingresos - stats.egresos);
      
      let accIng = 0, accEgr = 0;
      for (let i = 0; i < diasEnMes; i++) {
        accIng += ingresosPorDia[i];
        accEgr += egresosPorDia[i];
        ingresosAcum.push(accIng);
        egresosAcum.push(accEgr);
        saldoAcum.push(saldoInicial + accIng - accEgr);
      }
      
      const labels = Array.from({ length: diasEnMes }, (_, i) => i + 1);
      const colorTema = Theme.coloresGrafico();
      
      Graficos.instancias['chartResumenGeneral'] = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Saldo',
              data: saldoAcum,
              borderColor: '#14F0CD',
              backgroundColor: 'rgba(20, 240, 205, 0.1)',
              borderWidth: 2.5,
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 5,
              fill: false,
            },
            {
              label: 'Ingresos',
              data: ingresosAcum,
              borderColor: '#A3E635',
              backgroundColor: 'rgba(163, 230, 53, 0.1)',
              borderWidth: 2.5,
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 5,
              fill: false,
            },
            {
              label: 'Egresos',
              data: egresosAcum,
              borderColor: '#EF4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderWidth: 2.5,
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 5,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                color: colorTema.textSecondary,
                font: { size: 11, weight: '500' },
                padding: 12,
                boxWidth: 16,
                usePointStyle: true,
                pointStyle: 'circle',
              },
            },
            tooltip: {
              backgroundColor: colorTema.cardBg,
              titleColor: colorTema.textPrimary,
              bodyColor: colorTema.textSecondary,
              borderColor: colorTema.cardBorder,
              borderWidth: 1,
              padding: 10,
              callbacks: {
                title: (items) => `Día ${items[0].label}`,
                label: (ctx) => `${ctx.dataset.label}: ${Formato.formatearMoneda(ctx.raw, moneda)}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: colorTema.textSecondary,
                font: { size: 10 },
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 16,
              },
            },
            y: {
              grid: { color: colorTema.grid, drawBorder: false },
              ticks: {
                color: colorTema.textSecondary,
                font: { size: 10 },
                callback: (v) => `${Formato.SIMBOLOS[moneda]}${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`,
                maxTicksLimit: 8,
              },
            },
          },
        },
      });
    },
    
    /**
     * v13 — Donut con % de uso de cada tarjeta de crédito
     * Muestra cada tarjeta como una rebanada coloreada según su % de uso
     */
    renderChartUsoTarjetas() {
      const canvas = document.getElementById('chartUsoTarjetas');
      if (!canvas) return;
      
      Graficos.destruir('chartUsoTarjetas');
      
      const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
      const tarjetas = API.obtenerTarjetas().filter(t => !t.tipoTarjeta || t.tipoTarjeta === 'credito');
      
      if (tarjetas.length === 0) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = Theme.coloresGrafico().textSecondary;
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Sin tarjetas de crédito', canvas.width / 2, canvas.height / 2);
        return;
      }
      
      // Cada tarjeta es una rebanada: tamaño = su línea, color según uso
      const labels = tarjetas.map(t => t.nombre);
      const datos = tarjetas.map(t => Formato.convertir(t.lineaCredito || 0, t.moneda, moneda));
      const usados = tarjetas.map(t => Formato.convertir(t.saldoUsado || 0, t.moneda, moneda));
      
      // Color según %uso de cada tarjeta
      const colores = tarjetas.map(t => {
        const pct = t.lineaCredito > 0 ? (t.saldoUsado / t.lineaCredito) * 100 : 0;
        if (pct >= 70) return '#EF4444';
        if (pct >= 30) return '#F59E0B';
        return '#10B981';
      });
      
      // % global
      const totalLinea = datos.reduce((s, v) => s + v, 0);
      const totalUsado = usados.reduce((s, v) => s + v, 0);
      const pctGlobal = totalLinea > 0 ? ((totalUsado / totalLinea) * 100).toFixed(0) : 0;
      
      Graficos.instancias['chartUsoTarjetas'] = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: datos,
            backgroundColor: colores,
            borderWidth: 2,
            borderColor: Theme.coloresGrafico().cardBg || '#0F172A',
            hoverOffset: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const i = ctx.dataIndex;
                  const t = tarjetas[i];
                  const pct = t.lineaCredito > 0 ? (t.saldoUsado / t.lineaCredito) * 100 : 0;
                  return `${t.nombre}: ${pct.toFixed(1)}% usado (${Formato.formatearMoneda(t.saldoUsado, t.moneda)} / ${Formato.formatearMoneda(t.lineaCredito, t.moneda)})`;
                },
              },
            },
          },
        },
      });
      
      // Pintar el % en el centro del donut
      const ctx = canvas.getContext('2d');
      // Esperar a que se dibuje el donut
      setTimeout(() => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.save();
        ctx.fillStyle = Theme.coloresGrafico().textPrimary;
        ctx.font = 'bold 22px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${pctGlobal}%`, w / 2, h / 2);
        ctx.restore();
      }, 100);
    },
    
    /**
     * v13 — Configurar eventos del Resumen General
     */
    configurarEventosResumenGeneral() {
      // Filtro de cuenta/tarjeta
      const filtroEl = document.getElementById('resumenFiltro');
      if (filtroEl) {
        filtroEl.addEventListener('change', (e) => {
          this.cambiarFiltroResumen(e.target.value);
        });
      }
      
      // Navegación de mes
      const btnPrev = document.getElementById('resumenMesPrev');
      const btnNext = document.getElementById('resumenMesNext');
      const btnActual = document.getElementById('resumenMesActual');
      
      if (btnPrev) {
        btnPrev.addEventListener('click', () => {
          this.cambiarMesResumen(-1);
        });
      }
      if (btnNext) {
        btnNext.addEventListener('click', () => {
          this.cambiarMesResumen(1);
        });
      }
      if (btnActual) {
        btnActual.addEventListener('click', () => {
          this.resumenMes = null;
          this.refrescarResumenGeneral();
        });
      }
    },
    
    /**
     * v13 — Cambiar filtro de cuenta/tarjeta del resumen
     */
    cambiarFiltroResumen(nuevoFiltro) {
      this.resumenFiltro = nuevoFiltro;
      this.refrescarResumenGeneral();
    },
    
    /**
     * v13 — Cambiar mes del resumen (delta = -1 anterior, +1 siguiente)
     */
    cambiarMesResumen(delta) {
      const ahora = new Date();
      const mesActual = this.resumenMes ? this.resumenMes.mes : ahora.getMonth();
      const anioActual = this.resumenMes ? this.resumenMes.anio : ahora.getFullYear();
      
      let nuevoMes = mesActual + delta;
      let nuevoAnio = anioActual;
      
      if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio--; }
      else if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio++; }
      
      // No permitir ir más allá del mes actual
      const ahoraMes = ahora.getMonth();
      const ahoraAnio = ahora.getFullYear();
      if (nuevoAnio > ahoraAnio || (nuevoAnio === ahoraAnio && nuevoMes > ahoraMes)) {
        return;
      }
      
      // Si llegamos al mes actual, resetear a null
      if (nuevoMes === ahoraMes && nuevoAnio === ahoraAnio) {
        this.resumenMes = null;
      } else {
        this.resumenMes = { mes: nuevoMes, anio: nuevoAnio };
      }
      
      this.refrescarResumenGeneral();
    },
    
    /**
     * v13 — Refrescar solo la sección del Resumen General (no todo el dashboard)
     */
    refrescarResumenGeneral() {
      // Re-render del card
      const layout = document.querySelector('.dashboard-main');
      if (!layout) return;
      
      // Re-renderizar todo el dashboard para que la tabla de Recent Activity 
      // también respete el filtro si es necesario
      const container = document.getElementById('pageContent');
      if (container) {
        this.render(container, this.monedaVista);
      }
    },
    
    /* ============ STATS PRINCIPALES (todas arriba) ============
      v0.10.1 — Cambios:
      - Los 5 stats ahora ocupan toda la fila superior
      - El slider de tarjetas se mueve abajo en una sección aparte
      ============================================ */
    renderStatsConTarjeta() {
      const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
      
      const saldo = API.calcularSaldoTotal(moneda);
      const ingresos = API.calcularIngresosMes(moneda);
      const egresosCash = API.calcularEgresosCashMes(moneda);
      const egresosTarjeta = API.calcularEgresosTarjetaMes(moneda);
      const egresosDebito = API.calcularEgresosDebitoMes(moneda);
      const egresosEfectivo = API.calcularEgresosEfectivoMes(moneda);
      const transferencias = API.calcularTransferenciasMes(moneda);
      
      return `
        <!-- Stats principales (5 cards en una sola fila) -->
        <div class="stats-row-top">
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
          
          <div class="stat-card">
            <div class="stat-card-icon red">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-label">Egresos efectivo</div>
              <div class="stat-card-value text-danger">${Formato.formatearMoneda(egresosCash, moneda)}</div>
              <div class="stat-card-meta">Salieron de tus cuentas</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-icon purple">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-label">Egresos tarjeta</div>
              <div class="stat-card-value text-warning">${Formato.formatearMoneda(egresosTarjeta, moneda)}</div>
              <div class="stat-card-meta">Pagarás en próximo ciclo</div>
            </div>
          </div>
          
          <div class="stat-card transf-stat-card-inline" onclick="App.navegarA('transferencias')" style="cursor:pointer;">
            <div class="stat-card-icon" style="background:linear-gradient(135deg,#14F0CD,#06B6D4);color:#0A0E1A;">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-label">Transferencias</div>
              <div class="stat-card-value">${Formato.formatearMoneda(transferencias.total, moneda)}</div>
              <div class="stat-card-meta">${transferencias.cantidad} ${transferencias.cantidad === 1 ? 'movimiento' : 'movimientos'}</div>
            </div>
          </div>
        </div>

        
        <!-- v0.10.2 — Resumen de egresos por origen del pago -->
        <div class="resumen-egresos-header">
          <span class="resumen-egresos-title">Egresos del mes por origen</span>
          <span class="resumen-egresos-subtitle">Cómo se distribuye tu gasto</span>
        </div>
        
        <div class="stats-row-top">
          
          <!-- Card 1: Egresos con tarjeta de crédito -->
          <div class="stat-card">
            <div class="stat-card-icon purple">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-label">Tarjetas de crédito</div>
              <div class="stat-card-value text-warning">${Formato.formatearMoneda(egresosTarjeta, moneda)}</div>
              <div class="stat-card-meta">Pagarás en próximo ciclo</div>
            </div>
          </div>
          
          <!-- Card 2: Egresos con débito -->
          <div class="stat-card">
            <div class="stat-card-icon blue">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-label">Cuentas de débito</div>
              <div class="stat-card-value text-danger">${Formato.formatearMoneda(egresosDebito, moneda)}</div>
              <div class="stat-card-meta">Salió de tus cuentas bancarias</div>
            </div>
          </div>
          
          <!-- Card 3: Egresos en efectivo -->
          <div class="stat-card">
            <div class="stat-card-icon green">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-label">Efectivo</div>
              <div class="stat-card-value text-danger">${Formato.formatearMoneda(egresosEfectivo, moneda)}</div>
              <div class="stat-card-meta">Pago en efectivo</div>
            </div>
          </div>
          
          <!-- Card 4: Placeholder por ahora (reservado para uso futuro) -->
          <div class="stat-card stat-card-placeholder">
            <div class="stat-card-icon" style="background:linear-gradient(135deg,#475569,#64748B);color:white;">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-label" style="color:var(--text-tertiary);">Slot disponible</div>
              <div class="stat-card-value" style="color:var(--text-tertiary);font-size:1rem;">—</div>
              <div class="stat-card-meta">Por definir</div>
            </div>
          </div>
          
        </div>
        
        <!-- Sección tarjetas + resumen (debajo de stats) -->
        ${this.renderTarjetasYResumen()}
      `;
    },
    
    /* ============ TARJETAS Y RESUMEN (NUEVO en v0.10.1) ============
      Layout 2 columnas:
      - Izquierda: slider de tarjetas
      - Derecha: resumen detallado de la tarjeta/cuenta activa
    ============================================ */
    renderTarjetasYResumen() {
      const tarjetas = API.obtenerTarjetas();
      const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'debito');
      
      // Si no hay tarjetas ni cuentas, no mostrar nada
      if (tarjetas.length === 0 && cuentas.length === 0) {
        return '';
      }
      
      return `
        <div class="tarjetas-resumen-grid">
          <div class="tarjetas-slider-wrap">
            ${this.renderCarruselTarjetas()}
          </div>
          <div class="tarjeta-resumen-side" id="tarjetaResumenSide">
            ${this.renderResumenTarjetaActiva()}
          </div>
        </div>
      `;
    },
    
    /**
     * Renderiza el resumen de la tarjeta activa (la que está en el centro del slider)
     */
    renderResumenTarjetaActiva() {
      const tarjetas = API.obtenerTarjetas();
      
      if (tarjetas.length === 0) {
        // Si no hay tarjetas, mostrar resumen general de cuentas
        return this.renderResumenSinTarjetas();
      }
      
      const tarjeta = tarjetas[this.tarjetaActiva] || tarjetas[0];
      const moneda = tarjeta.moneda;
      const colorHex = ColorPicker.obtenerHex(tarjeta.colorTema || 'purple');
      const colorRgb = this.hexToRgb(colorHex);
      
      const disponible = tarjeta.lineaCredito - tarjeta.saldoUsado;
      const pctUsado = tarjeta.lineaCredito > 0 ? (tarjeta.saldoUsado / tarjeta.lineaCredito) * 100 : 0;
      
      // Consumos del mes con esta tarjeta
      const ahora = new Date();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
      const finMes = ahora.toISOString().split('T')[0];
      const trans = API.obtenerTransacciones({ incluirTransferencias: false });
      const transMes = trans.filter(t => 
        t.tarjetaId === tarjeta.id && 
        t.fecha >= inicioMes && 
        t.fecha <= finMes
      );
      const consumoMes = transMes.reduce((s, t) => s + t.monto, 0);
      
      return `
        <div class="resumen-side-card" style="border-left:3px solid ${colorHex};">
          <div class="resumen-side-header">
            <div class="resumen-side-titles">
              <div class="resumen-side-title">${tarjeta.nombre}</div>
              <div class="resumen-side-subtitle">${tarjeta.banco} · ${tarjeta.marca}</div>
            </div>
            <div class="resumen-side-badge" style="background:rgba(${colorRgb},0.15);color:${colorHex};border:1px solid rgba(${colorRgb},0.3);">
              TARJETA
            </div>
          </div>
          
          ${tarjeta.descripcion ? `
            <div class="resumen-side-desc">${tarjeta.descripcion}</div>
          ` : ''}
          
          <!-- Stats principales -->
          <div class="resumen-side-stats">
            <div class="resumen-side-stat">
              <div class="resumen-side-stat-label">Línea total</div>
              <div class="resumen-side-stat-value">${Formato.formatearMoneda(tarjeta.lineaCredito, moneda)}</div>
            </div>
            <div class="resumen-side-stat">
              <div class="resumen-side-stat-label">Disponible</div>
              <div class="resumen-side-stat-value text-success">${Formato.formatearMoneda(disponible, moneda)}</div>
            </div>
            <div class="resumen-side-stat">
              <div class="resumen-side-stat-label">Total usado</div>
              <div class="resumen-side-stat-value text-danger">${Formato.formatearMoneda(tarjeta.saldoUsado, moneda)}</div>
            </div>
          </div>
          
          <!-- Barra de uso visual -->
          <div class="resumen-side-progress">
            <div class="resumen-side-progress-label">
              <span>Uso de línea</span>
              <strong>${pctUsado.toFixed(1)}%</strong>
            </div>
            <div class="resumen-side-progress-bar">
              <div class="resumen-side-progress-fill" 
                  style="width:${Math.min(pctUsado, 100)}%;background:linear-gradient(90deg,${colorHex},${colorHex}cc);"></div>
            </div>
          </div>
          
          <!-- Consumo del mes -->
          <div class="resumen-side-extra">
            <div class="resumen-side-extra-item">
              <div class="resumen-side-stat-label">Consumo del mes</div>
              <div class="resumen-side-stat-value-md">${Formato.formatearMoneda(consumoMes, moneda)}</div>
              <div class="resumen-side-extra-meta">${transMes.length} ${transMes.length === 1 ? 'compra' : 'compras'}</div>
            </div>
            <div class="resumen-side-extra-item">
              <div class="resumen-side-stat-label">Día de pago</div>
              <div class="resumen-side-stat-value-md">${tarjeta.diaPago}</div>
              <div class="resumen-side-extra-meta">cada mes</div>
            </div>
          </div>
          
          <!-- Mini-gráfico de evolución del uso -->
          <div class="resumen-side-chart">
            <div class="resumen-side-chart-label">Evolución últimos 30 días</div>
            <canvas id="chartResumenTarjeta"></canvas>
          </div>
          
          <button class="btn-secondary" style="width:100%;justify-content:center;" onclick="App.navegarA('tarjetas')">
            Ver detalle completo →
          </button>
        </div>
      `;
    },
    
    /**
     * Resumen alternativo cuando no hay tarjetas (solo cuentas)
     */
    renderResumenSinTarjetas() {
      const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito');
      if (cuentas.length === 0) return '';
      
      // Mostrar la primera cuenta como destacada
      const cuenta = cuentas[0];
      const colorHex = ColorPicker.obtenerHex(cuenta.color || 'blue');
      
      return `
        <div class="resumen-side-card" style="border-left:3px solid ${colorHex};">
          <div class="resumen-side-header">
            <div class="resumen-side-titles">
              <div class="resumen-side-title">${cuenta.nombre}</div>
              <div class="resumen-side-subtitle">${cuenta.tipo} · ${cuenta.moneda}</div>
            </div>
          </div>
          <div class="resumen-side-stats" style="grid-template-columns:1fr;">
            <div class="resumen-side-stat">
              <div class="resumen-side-stat-label">Saldo</div>
              <div class="resumen-side-stat-value">${Formato.formatearMoneda(cuenta.saldo, cuenta.moneda)}</div>
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
        
        // v0.10.1 — actualizar resumen lateral
        const resumenSide = document.getElementById('tarjetaResumenSide');
        if (resumenSide) {
          resumenSide.innerHTML = this.renderResumenTarjetaActiva();
          setTimeout(() => this.renderChartResumenTarjeta(), 30);
        }
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
        <!-- v12 — Layout reorganizado:
             Fila superior: Activities (izq) + Gráfico+Slider (der)
             Fila inferior: Tabla Recent activity (ancho completo) -->
        <div class="activity-grid">
          <div class="activity-left">
            ${this.renderShortcuts()}
          </div>
          <div class="activity-right">
            ${this.renderActivityGraph()}
          </div>
        </div>
        
        <!-- Recent activity en ancho completo, abajo -->
        <div class="activity-history-fullwidth">
          ${this.renderHistory()}
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
          
          <!-- Título del slider (v12 — flechas movidas a los lados del canvas) -->
          <div class="grafico-slider-wrap" id="graficoSliderWrap">
            <div class="grafico-slider-title" id="graficoTipoLabel">${this.getNombreTipoGrafico()}</div>
          </div>
          
          <!-- Canvas con flechas a los lados -->
          <div class="activity-graph-canvas-wrap">
            <button class="grafico-slider-arrow-side grafico-slider-prev" aria-label="Anterior">‹</button>
            <div class="activity-graph-canvas">
              <canvas id="chartActivity"></canvas>
            </div>
            <button class="grafico-slider-arrow-side grafico-slider-next" aria-label="Siguiente">›</button>
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
        // v12 — Nuevos tipos
        pie: '🥧 Proporción (Pie)',
        polar: '🌀 Área polar',
        stacked: '📊 Barras apiladas',
        area: '📉 Área apilada',
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
        case 'linea':   this.renderChartLinea(canvas); break;
        case 'barras':  this.renderChartBarras(canvas); break;
        case 'donut':   this.renderChartDonut(canvas); break;
        case 'radial':  this.renderChartRadial(canvas); break;
        // v12 — Nuevos tipos
        case 'pie':     this.renderChartPie(canvas); break;
        case 'polar':   this.renderChartPolar(canvas); break;
        case 'stacked': this.renderChartStacked(canvas); break;
        case 'area':    this.renderChartArea(canvas); break;
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
     * v12 — GRÁFICO 5: PIE (proporción simple)
     * Similar al donut pero sin agujero en el centro
     */
    renderChartPie(canvas) {
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
        type: 'pie',
        data: {
          labels: categorias.map(c => `${c.icono} ${c.nombre}`),
          datasets: [{
            data: categorias.map(c => c.total),
            backgroundColor: colores.slice(0, categorias.length),
            borderWidth: 2,
            borderColor: Theme.coloresGrafico().cardBg || '#0F172A',
            hoverOffset: 12,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: Theme.coloresGrafico().textSecondary, font: { size: 11 }, padding: 8, boxWidth: 12 },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
                  const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                  return `${ctx.label}: ${Formato.formatearMoneda(ctx.raw, moneda)} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    },
    
    /**
     * v12 — GRÁFICO 6: POLAR AREA (rebanadas con misma anchura, distinto radio)
     * Útil para comparar magnitudes en categorías
     */
    renderChartPolar(canvas) {
      const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
      const ahora = new Date();
      
      const fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
      const fechaFin = ahora.toISOString().split('T')[0];
      let trans = this.obtenerTransaccionesFiltradas(fechaInicio, fechaFin);
      
      if (this.tabActiva === 'income') trans = trans.filter(t => t.tipo === 'ingreso');
      else trans = trans.filter(t => t.tipo === 'egreso');
      
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
      
      const categorias = Object.values(porCategoria).sort((a, b) => b.total - a.total).slice(0, 6);
      
      if (categorias.length === 0) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = Theme.coloresGrafico().textSecondary;
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Sin datos para este filtro', canvas.width / 2, canvas.height / 2);
        return;
      }
      
      const coloresFill = ['rgba(20,240,205,0.7)', 'rgba(6,182,212,0.7)', 'rgba(139,92,246,0.7)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)', 'rgba(16,185,129,0.7)'];
      const coloresBorde = ['#14F0CD', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];
      const colorTema = Theme.coloresGrafico();
      
      Graficos.instancias['chartActivity'] = new Chart(canvas.getContext('2d'), {
        type: 'polarArea',
        data: {
          labels: categorias.map(c => `${c.icono} ${c.nombre}`),
          datasets: [{
            data: categorias.map(c => c.total),
            backgroundColor: coloresFill.slice(0, categorias.length),
            borderColor: coloresBorde.slice(0, categorias.length),
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: colorTema.textSecondary, font: { size: 11 }, padding: 8, boxWidth: 12 } },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${Formato.formatearMoneda(ctx.raw, moneda)}` } },
          },
          scales: {
            r: {
              grid: { color: colorTema.grid },
              angleLines: { color: colorTema.grid },
              ticks: { color: colorTema.textSecondary, backdropColor: 'transparent', font: { size: 9 } },
            },
          },
        },
      });
    },
    
    /**
     * v12 — GRÁFICO 7: BARRAS APILADAS (stacked)
     * Compara categorías día a día, apilando cada categoría
     */
    renderChartStacked(canvas) {
      const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
      const ahora = new Date();
      const diasEnMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
      
      const fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
      const fechaFin = ahora.toISOString().split('T')[0];
      let trans = this.obtenerTransaccionesFiltradas(fechaInicio, fechaFin);
      
      if (this.tabActiva === 'income') trans = trans.filter(t => t.tipo === 'ingreso');
      else trans = trans.filter(t => t.tipo === 'egreso');
      
      // Agrupar por día y categoría padre
      const porDia = {};
      const categoriasSet = new Set();
      trans.forEach(t => {
        const dia = new Date(t.fecha).getDate();
        const cat = API.obtenerCategoriaPorId(t.categoriaId);
        if (!cat) return;
        const padre = cat.categoriaPadreId ? API.obtenerCategoriaPorId(cat.categoriaPadreId) : cat;
        if (!padre) return;
        
        if (!porDia[dia]) porDia[dia] = {};
        porDia[dia][padre.nombre] = (porDia[dia][padre.nombre] || 0) + Formato.convertir(t.monto, t.moneda, moneda);
        categoriasSet.add(padre.nombre);
      });
      
      const categoriasArr = Array.from(categoriasSet).slice(0, 6);
      const colores = ['#14F0CD', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];
      const labels = Array.from({ length: diasEnMes }, (_, i) => i + 1);
      
      if (categoriasArr.length === 0) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = Theme.coloresGrafico().textSecondary;
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Sin datos para este filtro', canvas.width / 2, canvas.height / 2);
        return;
      }
      
      const datasets = categoriasArr.map((catNombre, i) => ({
        label: catNombre,
        data: labels.map(d => porDia[d]?.[catNombre] || 0),
        backgroundColor: colores[i % colores.length],
        borderColor: colores[i % colores.length],
        borderWidth: 0,
        borderRadius: 2,
      }));
      
      const colorTema = Theme.coloresGrafico();
      
      Graficos.instancias['chartActivity'] = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { color: colorTema.textSecondary, font: { size: 10 }, padding: 8, boxWidth: 12 } },
            tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${Formato.formatearMoneda(ctx.raw, moneda)}` } },
          },
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { color: colorTema.textSecondary, font: { size: 10 } } },
            y: { stacked: true, grid: { color: colorTema.grid }, ticks: { color: colorTema.textSecondary, font: { size: 10 } } },
          },
        },
      });
    },
    
    /**
     * v12 — GRÁFICO 8: ÁREA APILADA
     * Como línea pero con áreas rellenas apiladas (categorías acumuladas día a día)
     */
    renderChartArea(canvas) {
      const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
      const ahora = new Date();
      const diasEnMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
      
      const fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
      const fechaFin = ahora.toISOString().split('T')[0];
      let trans = this.obtenerTransaccionesFiltradas(fechaInicio, fechaFin);
      
      if (this.tabActiva === 'income') trans = trans.filter(t => t.tipo === 'ingreso');
      else trans = trans.filter(t => t.tipo === 'egreso');
      
      const porDia = {};
      const categoriasSet = new Set();
      trans.forEach(t => {
        const dia = new Date(t.fecha).getDate();
        const cat = API.obtenerCategoriaPorId(t.categoriaId);
        if (!cat) return;
        const padre = cat.categoriaPadreId ? API.obtenerCategoriaPorId(cat.categoriaPadreId) : cat;
        if (!padre) return;
        
        if (!porDia[dia]) porDia[dia] = {};
        porDia[dia][padre.nombre] = (porDia[dia][padre.nombre] || 0) + Formato.convertir(t.monto, t.moneda, moneda);
        categoriasSet.add(padre.nombre);
      });
      
      const categoriasArr = Array.from(categoriasSet).slice(0, 5);
      const colores = ['#14F0CD', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444'];
      const labels = Array.from({ length: diasEnMes }, (_, i) => i + 1);
      
      if (categoriasArr.length === 0) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = Theme.coloresGrafico().textSecondary;
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Sin datos para este filtro', canvas.width / 2, canvas.height / 2);
        return;
      }
      
      // Calcular acumulado por categoría para hacer pila
      const datasets = categoriasArr.map((catNombre, i) => {
        const hex = colores[i % colores.length];
        return {
          label: catNombre,
          data: labels.map(d => porDia[d]?.[catNombre] || 0),
          backgroundColor: `rgba(${this.hexToRgb(hex)}, 0.4)`,
          borderColor: hex,
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 4,
        };
      });
      
      const colorTema = Theme.coloresGrafico();
      
      Graficos.instancias['chartActivity'] = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { color: colorTema.textSecondary, font: { size: 10 }, padding: 8, boxWidth: 12 } },
            tooltip: { mode: 'index', intersect: false, callbacks: { label: (ctx) => `${ctx.dataset.label}: ${Formato.formatearMoneda(ctx.raw, moneda)}` } },
          },
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { color: colorTema.textSecondary, font: { size: 10 } } },
            y: { stacked: true, grid: { color: colorTema.grid }, ticks: { color: colorTema.textSecondary, font: { size: 10 } } },
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
    
    /**
     * v0.10.1 — Render del mini-gráfico de evolución de uso de la tarjeta activa
     */
    renderChartResumenTarjeta() {
      const canvas = document.getElementById('chartResumenTarjeta');
      if (!canvas) return;
      
      const tarjetas = API.obtenerTarjetas();
      if (tarjetas.length === 0) return;
      
      const tarjeta = tarjetas[this.tarjetaActiva] || tarjetas[0];
      const colorHex = ColorPicker.obtenerHex(tarjeta.colorTema || 'purple');
      const rgb = this.hexToRgb(colorHex);
      
      // Reconstruir uso día a día de los últimos 30 días
      const trans = API.obtenerTransacciones({ incluirTransferencias: false })
        .filter(t => t.tarjetaId === tarjeta.id);
      
      const dias = 30;
      const datos = new Array(dias).fill(0);
      const ahora = new Date();
      
      for (let i = 0; i < dias; i++) {
        const fecha = new Date(ahora);
        fecha.setDate(fecha.getDate() - (dias - 1 - i));
        const fechaStr = fecha.toISOString().split('T')[0];
        
        // Sumar todas las transacciones desde el inicio hasta ese día
        const transHastaDia = trans.filter(t => t.fecha <= fechaStr);
        const usadoHastaDia = transHastaDia.reduce((s, t) => s + t.monto, 0);
        datos[i] = usadoHastaDia;
      }
      
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 100);
      gradient.addColorStop(0, `rgba(${rgb}, 0.4)`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);
      
      Graficos.destruir('chartResumenTarjeta');
      Graficos.instancias['chartResumenTarjeta'] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: datos.map((_, i) => i + 1),
          datasets: [{
            data: datos,
            borderColor: colorHex,
            backgroundColor: gradient,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 41, 0.95)',
              padding: 8,
              cornerRadius: 6,
              callbacks: {
                title: (items) => `Día ${items[0].label}`,
                label: (item) => `Usado: ${Formato.formatearMoneda(item.parsed.y, tarjeta.moneda)}`,
              },
            },
          },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        },
      });
    },
    
    /**
     * v12 — Panel "Activities" rediseñado
     * Atajos verticales con icono+texto+flecha
     */
    renderShortcuts() {
      const items = [
        { icon: '🎯', name: 'Metas', desc: 'Tus objetivos de ahorro', color: 'orange', page: 'metas' },
        { icon: '📅', name: 'Plan mensual', desc: 'Presupuesto del mes', color: 'cyan', page: 'presupuestos' },
        { icon: '⚙️', name: 'Configuración', desc: 'Preferencias y cuenta', color: 'purple', page: 'configuracion' },
        { icon: '↔️', name: 'Transferencias', desc: 'Mover entre cuentas', color: 'green', page: 'transferencias' },
      ];
      
      return `
        <div class="activities-panel">
          <div class="activities-panel-header">
            <span class="activities-panel-title">Activities</span>
            <span class="activities-panel-badge">${items.length}</span>
          </div>
          <div class="activities-panel-list">
            ${items.map(it => `
              <div class="activity-shortcut" onclick="App.navegarA('${it.page}')">
                <div class="activity-shortcut-icon ${it.color}">${it.icon}</div>
                <div class="activity-shortcut-info">
                  <div class="activity-shortcut-name">${it.name}</div>
                  <div class="activity-shortcut-desc">${it.desc}</div>
                </div>
                <div class="activity-shortcut-arrow">›</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },
    
    /* ============================================
       v0.10.4 — Tabla Recent Activity estilo profesional
       - 10 movimientos por defecto + botón "Ver más" → página transacciones
       - Columnas: Fecha · Descripción · Categoría · Tipo · Monto · Cuenta/Tarjeta · Estado · ⋮
       - Indicador 📝 si tiene notas
       ============================================ */
    renderHistory() {
      // Obtener transacciones (no transferencias)
      const todasTrans = API.obtenerTransacciones({ incluirTransferencias: false });
      const total = todasTrans.length;
      const limite = 10;
      const trans = todasTrans.slice(0, limite);
      
      let tablaContenido = '';
      
      if (trans.length === 0) {
        tablaContenido = `
          <div class="activity-table-empty">
            <div style="font-size:2rem;margin-bottom:8px;">📭</div>
            <div>Sin movimientos aún</div>
            <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:4px;">
              Crea tu primera transacción con el botón "+ Nueva"
            </div>
          </div>
        `;
      } else {
        tablaContenido = `
          <table class="activity-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Tipo</th>
                <th class="text-right">Monto</th>
                <th>Cuenta / Tarjeta</th>
                <th>Estado</th>
                <th style="width:32px;"></th>
              </tr>
            </thead>
            <tbody>
              ${trans.map(t => Dashboard.renderActivityRow(t)).join('')}
            </tbody>
          </table>
        `;
      }
      
      return `
        <div class="activity-header">
          <div>
            <h3 class="activity-title">Actividad reciente</h3>
            <p class="activity-subtitle">${total} ${total === 1 ? 'movimiento total' : 'movimientos totales'}</p>
          </div>
          <div class="activity-actions">
            <button class="activity-action-btn" id="activityFilter">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
              Filtros
            </button>
            <button class="activity-action-btn" id="activitySort">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/></svg>
              Ordenar
            </button>
          </div>
        </div>
        
        <div class="activity-table-wrapper">
          ${tablaContenido}
        </div>
        
        ${total > limite ? `
          <button class="activity-vermas-btn" onclick="App.navegarA('transacciones')">
            Ver todas (${total}) →
          </button>
        ` : ''}
      `;
    },
    
    /**
     * v0.10.4 — Una fila de la tabla de actividad
     */
    renderActivityRow(trans) {
      const cat = API.obtenerCategoriaPorId(trans.categoriaId);
      const cuenta = API.obtenerCuentaPorId(trans.cuentaId);
      const tarjeta = trans.tarjetaId ? API.obtenerTarjetaPorId(trans.tarjetaId) : null;
      const esIngreso = trans.tipo === 'ingreso';
      const signo = esIngreso ? '+' : '-';
      const fechaObj = new Date(trans.fecha + 'T00:00:00');
      const fechaCorta = `${String(fechaObj.getDate()).padStart(2, '0')}/${String(fechaObj.getMonth() + 1).padStart(2, '0')}/${fechaObj.getFullYear()}`;
      
      // Categoría padre + subcategoría
      let categoriaTexto = 'Sin categoría';
      let categoriaIcono = '📁';
      let categoriaColor = 'slate';
      if (cat) {
        categoriaIcono = cat.icono;
        categoriaColor = cat.color;
        if (cat.categoriaPadreId) {
          const padre = API.obtenerCategoriaPorId(cat.categoriaPadreId);
          categoriaTexto = padre ? `${padre.nombre} · ${cat.nombre}` : cat.nombre;
        } else {
          categoriaTexto = cat.nombre;
        }
      }
      
      // Cuenta/Tarjeta display
      let fuenteDisplay = '—';
      let fuenteIcono = '💰';
      let fuenteColor = '#64748B';
      if (tarjeta) {
        fuenteDisplay = tarjeta.nombre;
        fuenteIcono = '💳';
        fuenteColor = ColorPicker.obtenerHex(tarjeta.colorTema || 'purple');
      } else if (cuenta) {
        fuenteDisplay = cuenta.nombre;
        fuenteIcono = cuenta.icono || '🏦';
        fuenteColor = ColorPicker.obtenerHex(cuenta.color || 'blue');
      }
      
      // Estado (en este caso: completado siempre, salvo si fecha futura)
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const esFutura = fechaObj > hoy;
      const estadoTexto = esFutura ? 'Programado' : 'Completado';
      const estadoClase = esFutura ? 'estado-scheduled' : 'estado-completed';
      
      // Notas
      const tieneNotas = trans.notas && trans.notas.trim().length > 0;
      
      return `
        <tr class="activity-row" onclick="TransaccionForm.abrir(${trans.id}, () => App.cargarPaginaActual())">
          <td class="activity-fecha">${fechaCorta}</td>
          <td class="activity-desc">
            <div class="activity-desc-wrap">
              <span class="activity-desc-text">${trans.descripcion || (cat ? cat.nombre : 'Movimiento')}</span>
              ${tieneNotas ? `<span class="activity-notas-indicator" title="${trans.notas.substring(0, 100).replace(/"/g, '&quot;')}${trans.notas.length > 100 ? '...' : ''}">📝</span>` : ''}
            </div>
          </td>
          <td>
            <div class="activity-categoria">
              <span class="activity-categoria-icon icon-box ${categoriaColor}">${categoriaIcono}</span>
              <span class="activity-categoria-text" title="${categoriaTexto}">${categoriaTexto.length > 25 ? categoriaTexto.substring(0, 25) + '...' : categoriaTexto}</span>
            </div>
          </td>
          <td>
            <span class="activity-tipo-badge tipo-${trans.tipo}">
              ${esIngreso ? '↗ Ingreso' : '↘ Egreso'}
            </span>
          </td>
          <td class="text-right">
            <span class="activity-monto ${esIngreso ? 'positive' : 'negative'}">
              ${signo}${Formato.formatearMoneda(trans.monto, trans.moneda)}
            </span>
          </td>
          <td>
            <div class="activity-fuente">
              <span class="activity-fuente-dot" style="background:${fuenteColor};"></span>
              <span class="activity-fuente-icon">${fuenteIcono}</span>
              <span class="activity-fuente-text" title="${fuenteDisplay}">
                ${fuenteDisplay.length > 18 ? fuenteDisplay.substring(0, 18) + '...' : fuenteDisplay}
              </span>
            </div>
          </td>
          <td>
            <span class="activity-estado ${estadoClase}">${estadoTexto}</span>
          </td>
          <td>
            <button class="activity-row-menu" onclick="event.stopPropagation(); Dashboard.menuRowActividad(${trans.id}, event)" title="Más opciones">⋮</button>
          </td>
        </tr>
      `;
    },
    
    /**
     * v0.10.4 — Menú contextual de una fila (placeholder)
     */
    menuRowActividad(transId, event) {
      // Por ahora: editar/eliminar. Se puede extender luego
      Modal.confirmar({
        titulo: 'Acciones',
        mensaje: '¿Qué deseas hacer con esta transacción?',
        textoConfirmar: 'Editar',
        textoCancelar: 'Eliminar',
        tipoBoton: 'primary',
        onConfirmar: () => {
          TransaccionForm.abrir(transId, () => App.cargarPaginaActual());
        },
        onCancelar: () => {
          if (confirm('¿Eliminar esta transacción definitivamente?')) {
            API.eliminarTransaccion(transId);
            Modal.toast('Transacción eliminada');
            App.cargarPaginaActual();
          }
        }
      });
    },
    
    /* ============ ASIDE: PORTFOLIO ============ */
    /* v0.10.2 — Patrimonio rediseñado: solo línea de crédito con semáforo */
    renderPortfolio() {
      const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
      const patrimonio = API.calcularPatrimonioCredito(moneda);
      const tarjetas = API.obtenerTarjetas().filter(t => !t.tipoTarjeta || t.tipoTarjeta === 'credito');
      
      // Calcular % de cada tarjeta para leyenda lateral
      const tarjetasInfo = tarjetas.map(t => {
        const pct = t.lineaCredito > 0 ? (t.saldoUsado / t.lineaCredito) * 100 : 0;
        let color = '#10B981';
        if (pct >= 70) color = '#EF4444';
        else if (pct >= 30) color = '#F59E0B';
        return { ...t, pct, color };
      });
      
      return `
        <div class="aside-card patrimonio-card patrimonio-${patrimonio.estado}">
          <div class="aside-card-header">
            <div class="aside-card-titles">
              <div class="aside-card-title">💳 Línea de crédito total</div>
              <div class="aside-card-subtitle">Suma de todas tus tarjetas</div>
            </div>
            <div class="patrimonio-badge" style="background:${patrimonio.color}22;color:${patrimonio.color};border:1px solid ${patrimonio.color}44;">
              ${patrimonio.mensaje}
            </div>
          </div>
          
          <div class="portfolio-amount">${Formato.formatearMoneda(patrimonio.lineaTotal, moneda)}</div>
          
          <!-- Etiqueta de uso global -->
          <div class="patrimonio-uso-global">
            <span>Uso global</span>
            <strong style="color:${patrimonio.color};">${patrimonio.porcentaje.toFixed(1)}%</strong>
          </div>
          
          <!-- v13 — Donut con % de uso por cada tarjeta -->
          ${tarjetas.length > 0 ? `
            <div class="patrimonio-donut-wrap">
              <div class="patrimonio-donut">
                <canvas id="chartUsoTarjetas"></canvas>
              </div>
              <div class="patrimonio-donut-legend">
                ${tarjetasInfo.map(t => `
                  <div class="patrimonio-donut-legend-item">
                    <span class="legend-dot" style="background:${t.color};"></span>
                    <span class="legend-name" title="${t.nombre}">${t.nombre.length > 12 ? t.nombre.substring(0, 12) + '…' : t.nombre}</span>
                    <span class="legend-pct" style="color:${t.color};">${t.pct.toFixed(0)}%</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div style="text-align:center;padding:var(--space-md);color:var(--text-tertiary);font-size:0.8125rem;">
              Sin tarjetas de crédito registradas
            </div>
          `}
          
          <!-- Desglose: usado / disponible -->
          <div class="patrimonio-stats">
            <div class="patrimonio-stat">
              <div class="patrimonio-stat-label">Usado</div>
              <div class="patrimonio-stat-value" style="color:${patrimonio.color};">
                ${Formato.formatearMoneda(patrimonio.usado, moneda)}
              </div>
            </div>
            <div class="patrimonio-stat">
              <div class="patrimonio-stat-label">Disponible</div>
              <div class="patrimonio-stat-value text-success">
                ${Formato.formatearMoneda(patrimonio.disponible, moneda)}
              </div>
            </div>
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
      
      // v0.10.2 — Estado de expansión por sección
      this._cuentasExpandido = this._cuentasExpandido || false;
      this._tarjetasExpandido = this._tarjetasExpandido || false;
      
      const LIMIT = 4;
      const cuentasMostrar = this._cuentasExpandido ? cuentas : cuentas.slice(0, LIMIT);
      const tarjetasMostrar = this._tarjetasExpandido ? tarjetas : tarjetas.slice(0, LIMIT);
      const cuentasExtra = cuentas.length - LIMIT;
      const tarjetasExtra = tarjetas.length - LIMIT;
      
      // Renderizar cuentas (solo las que toca mostrar)
      const cardsCuentas = cuentasMostrar.map(c => {
        const color = c.color || 'blue';
        const colorHex = ColorPicker.obtenerHex(color);
        const inicial = c.nombre.charAt(0).toUpperCase();
        
        // Calcular movimientos del mes
        const trans = API.obtenerTransacciones({ cuentaId: c.id });
        const transMes = trans.filter(t => t.fecha >= inicioMes && t.fecha <= finMes && !t.esTransferencia);
        const ingresoMes = transMes.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
        const egresoMes = transMes.filter(t => t.tipo === 'egreso').reduce((s, t) => s + t.monto, 0);
        const cambio = ingresoMes - egresoMes;
        
        const tipoLabel = c.tipo === 'efectivo' ? 'EFECTIVO' : c.tipo === 'billetera' ? 'BILLETERA' : 'BANCO';
        const esPrincipal = c.esPrincipal === true;
        
        return `
          <div class="favorite-card ${esPrincipal ? 'favorite-card-principal' : ''}" style="border-left: 3px solid ${colorHex};">
            <div class="favorite-header">
              <div class="favorite-icon" style="background: ${colorHex};">${inicial}</div>
              <div style="flex:1;min-width:0;">
                <div class="favorite-name" title="${c.nombre}">
                  ${c.nombre.length > 14 ? c.nombre.substring(0, 14) + '...' : c.nombre}
                </div>
                <div class="favorite-symbol">${tipoLabel} · ${c.moneda}</div>
              </div>
              <button class="favorite-star ${esPrincipal ? 'is-principal' : ''}" 
                      onclick="event.stopPropagation(); Dashboard.toggleCuentaPrincipal(${c.id})"
                      title="${esPrincipal ? 'Cuenta principal' : 'Marcar como principal'}">
                ${esPrincipal ? '⭐' : '☆'}
              </button>
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
      
      // Renderizar tarjetas (solo las que toca mostrar)
      const cardsTarjetas = tarjetasMostrar.map(t => {
        const colorId = t.colorTema || 'purple';
        const colorHex = ColorPicker.obtenerHex(colorId);
        
        // Calcular consumos del mes con esta tarjeta
        const trans = API.obtenerTransacciones({});
        const transTarjetaMes = trans.filter(tr => 
          tr.tarjetaId === t.id && 
          tr.fecha >= inicioMes && 
          tr.fecha <= finMes
        );
        const consumoMes = transTarjetaMes.reduce((s, tr) => s + tr.monto, 0);
        
        const pctUsado = t.lineaCredito > 0 ? (t.saldoUsado / t.lineaCredito) * 100 : 0;
        
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
                <span>Disp: ${Formato.formatearMoneda(t.lineaCredito - t.saldoUsado, t.moneda).replace('.00', '')}</span>
              </div>
            </div>
            
            <div class="favorite-stats">
              <span class="favorite-amount">${Formato.formatearMoneda(t.saldoUsado, t.moneda)}</span>
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
          ${cuentasExtra > 0 ? `
            <button class="aside-vermas-btn" onclick="Dashboard.toggleExpandido('cuentas')">
              ${this._cuentasExpandido 
                ? '▲ Ver menos' 
                : `▼ Ver ${cuentasExtra} ${cuentasExtra === 1 ? 'cuenta' : 'cuentas'} más`}
            </button>
          ` : ''}
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
            ${tarjetasExtra > 0 ? `
              <button class="aside-vermas-btn" onclick="Dashboard.toggleExpandido('tarjetas')">
                ${this._tarjetasExpandido 
                  ? '▲ Ver menos' 
                  : `▼ Ver ${tarjetasExtra} ${tarjetasExtra === 1 ? 'tarjeta' : 'tarjetas'} más`}
              </button>
            ` : ''}
          </div>
        ` : ''}
      `;
    },
    
    /* v0.10.2 — Toggle de expansión del aside */
    toggleExpandido(seccion) {
      if (seccion === 'cuentas') this._cuentasExpandido = !this._cuentasExpandido;
      else if (seccion === 'tarjetas') this._tarjetasExpandido = !this._tarjetasExpandido;
      else if (seccion === 'upcoming') this._upcomingExpandido = !this._upcomingExpandido;
      
      // Re-renderizar solo el aside (no todo el dashboard)
      const container = document.getElementById('pageContent');
      if (container) this.render(container, this.monedaVista);
    },
    
    /* v0.10.3 — Marcar cuenta como principal (desmarca las demás) */
    toggleCuentaPrincipal(cuentaId) {
      const cuenta = API.obtenerCuentaPorId(cuentaId);
      if (!cuenta) return;
      
      if (cuenta.esPrincipal) {
        // Desmarcar
        const cuentas = Storage.cargar('cuentas') || [];
        const idx = cuentas.findIndex(c => c.id === cuentaId);
        if (idx >= 0) cuentas[idx].esPrincipal = false;
        Storage.guardar('cuentas', cuentas);
        Modal.toast('Cuenta principal removida');
      } else {
        // Marcar (desmarca las demás automáticamente)
        API.marcarCuentaPrincipal(cuentaId);
        Modal.toast(`⭐ ${cuenta.nombre} ahora es tu cuenta principal`);
      }
      
      const container = document.getElementById('pageContent');
      if (container) this.render(container, this.monedaVista);
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
      
      // v0.10.2 — Aplicar límite de 4 + botón Ver más
      this._upcomingExpandido = this._upcomingExpandido || false;
      const LIMIT_UP = 4;
      const itemsMostrar = this._upcomingExpandido ? items : items.slice(0, LIMIT_UP);
      const itemsExtra = items.length - LIMIT_UP;
      
      return `
        <div class="aside-card">
          <div class="aside-card-header">
            <div class="aside-card-titles">
              <div class="aside-card-title">Próximos pagos</div>
              <div class="aside-card-subtitle">${items.length} ${items.length === 1 ? 'compromiso' : 'compromisos'}</div>
            </div>
          </div>
          
          <div class="upcoming-list">
            ${itemsMostrar.map((it, i) => `
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
          
          ${itemsExtra > 0 ? `
            <button class="aside-vermas-btn" onclick="Dashboard.toggleExpandido('upcoming')">
              ${this._upcomingExpandido 
                ? '▲ Ver menos' 
                : `▼ Ver ${itemsExtra} ${itemsExtra === 1 ? 'pago más' : 'pagos más'}`}
            </button>
          ` : ''}
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
