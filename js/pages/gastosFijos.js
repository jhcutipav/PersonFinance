/* ============================================
   PÁGINA: GASTOS FIJOS Y SUSCRIPCIONES
   ============================================ */

const GastosFijos = {
  
  filtroActivo: 'todos', // todos | suscripciones | fijos | variables | inactivos
  monedaVista: 'PEN',
  
  render(container, monedaVista = 'PEN') {
    this.monedaVista = monedaVista;
    Graficos.destruirTodos();
    
    container.innerHTML = `
      <div class="gastos-page">
        ${this.renderStats()}
        ${this.renderGraficoVariacion()}
        ${this.renderToolbar()}
        ${this.renderLista()}
      </div>
    `;
    
    this.configurarEventos();
    setTimeout(() => {
      this.renderGraficoVariacionChart();
      this.renderSparklines();
    }, 50);
  },
  
  /* ============ GRÁFICO DE VARIACIÓN ============ */
  vistaGrafico: 'todos', // todos | variables | total
  
  renderGraficoVariacion() {
    return `
      <div class="grafico-variacion-card">
        <div class="grafico-variacion-header">
          <div>
            <div class="grafico-variacion-title">Variación de gastos fijos</div>
            <div class="grafico-variacion-subtitle">Últimos 6 meses · Detecta cambios en consumos variables</div>
          </div>
          <div class="grafico-variacion-tabs">
            <button class="vista-pill ${this.vistaGrafico === 'todos' ? 'active' : ''}" data-vista="todos">Todos</button>
            <button class="vista-pill ${this.vistaGrafico === 'variables' ? 'active' : ''}" data-vista="variables">Solo variables</button>
            <button class="vista-pill ${this.vistaGrafico === 'total' ? 'active' : ''}" data-vista="total">Total mensual</button>
          </div>
        </div>
        <div class="grafico-variacion-canvas">
          <canvas id="chartVariacion"></canvas>
        </div>
      </div>
    `;
  },
  
  /**
   * Genera los datos del gráfico según la vista seleccionada
   */
  renderGraficoVariacionChart() {
    const canvas = document.getElementById('chartVariacion');
    if (!canvas) return;
    
    Graficos.destruir('chartVariacion');
    
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    
    // Generar últimos 6 meses
    const ahora = new Date();
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      meses.push({
        mes: fecha.getMonth(),
        anio: fecha.getFullYear(),
        label: `${Fechas.MESES_CORTOS[fecha.getMonth()]} ${String(fecha.getFullYear()).slice(2)}`,
      });
    }
    
    const gastos = (Storage.cargar('gastosFijos') || []).filter(g => g.activo);
    
    // Colores predefinidos para las líneas
    const colores = ['#14F0CD', '#F59E0B', '#8B5CF6', '#EF4444', '#10B981', '#3B82F6', '#EC4899', '#06B6D4'];
    
    let datasets = [];
    
    if (this.vistaGrafico === 'total') {
      // Una sola línea con el total mensual de todos los gastos
      const totales = meses.map(m => {
        return gastos.reduce((sum, g) => {
          const movimientoEnEseMes = (g.historico || []).find(h => {
            const f = new Date(h.fecha);
            return f.getMonth() === m.mes && f.getFullYear() === m.anio;
          });
          const monto = movimientoEnEseMes ? movimientoEnEseMes.monto : g.monto;
          return sum + Formato.convertir(monto, g.moneda, moneda);
        }, 0);
      });
      
      datasets = [{
        label: 'Total mensual',
        data: totales,
        borderColor: '#14F0CD',
        backgroundColor: 'rgba(20, 240, 205, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#14F0CD',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }];
    } else {
      // Una línea por cada gasto
      let gastosFiltrados = gastos;
      if (this.vistaGrafico === 'variables') {
        gastosFiltrados = gastos.filter(g => g.tipo === 'variable');
      }
      
      datasets = gastosFiltrados.map((g, i) => {
        const data = meses.map(m => {
          const movimiento = (g.historico || []).find(h => {
            const f = new Date(h.fecha);
            return f.getMonth() === m.mes && f.getFullYear() === m.anio;
          });
          const monto = movimiento ? movimiento.monto : null;
          return monto ? Formato.convertir(monto, g.moneda, moneda) : null;
        });
        
        const color = colores[i % colores.length];
        
        return {
          label: `${g.icono} ${g.nombre}`,
          data,
          borderColor: color,
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: color,
          spanGaps: true,
          // Punteado si es fijo (no esperamos variación)
          borderDash: g.tipo === 'fijo' ? [5, 5] : [],
        };
      });
    }
    
    const colorTema = Theme.coloresGrafico();
    const ctx = canvas.getContext('2d');
    
    Graficos.instancias['chartVariacion'] = new Chart(ctx, {
      type: 'line',
      data: { labels: meses.map(m => m.label), datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.vistaGrafico !== 'total',
            position: 'bottom',
            align: 'start',
            labels: {
              color: colorTema.textSecondary,
              font: { family: "'Inter', sans-serif", size: 11 },
              boxWidth: 14,
              boxHeight: 8,
              padding: 12,
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 41, 0.95)',
            titleColor: '#fff',
            bodyColor: 'rgba(255, 255, 255, 0.85)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (item) => {
                if (item.parsed.y === null) return null;
                return `${item.dataset.label}: ${Formato.formatearMoneda(item.parsed.y, moneda)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: colorTema.grid, drawBorder: false },
            ticks: { color: colorTema.textSecondary, font: { family: "'Inter', sans-serif", size: 11 } },
          },
          y: {
            grid: { color: colorTema.grid, drawBorder: false },
            ticks: {
              color: colorTema.textSecondary,
              font: { family: "'Inter', sans-serif", size: 11 },
              callback: (val) => Formato.formatearMoneda(val, moneda).replace('.00', ''),
            },
          },
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
      },
    });
  },
  
  /* ============ STATS ============ */
  renderStats() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const todos = API.obtenerGastosFijos({ activos: true });
    const suscripciones = todos.filter(g => g.esSuscripcion);
    const proximos = API.obtenerProximosVencimientos(7);
    
    const totalMensual = Formato.sumarEnMoneda(todos, moneda);
    const totalSuscripciones = Formato.sumarEnMoneda(suscripciones, moneda);
    const totalProximo = Formato.sumarEnMoneda(proximos, moneda);
    
    // Total anual proyectado
    const totalAnual = totalMensual * 12;
    
    return `
      <div class="gastos-stats-row">
        <div class="gasto-stat-card">
          <div class="gasto-stat-icon cyan">📅</div>
          <div class="gasto-stat-content">
            <div class="gasto-stat-label">Total mensual</div>
            <div class="gasto-stat-value">${Formato.formatearMoneda(totalMensual, moneda)}</div>
            <div class="gasto-stat-meta">${todos.length} compromisos activos</div>
          </div>
        </div>
        
        <div class="gasto-stat-card">
          <div class="gasto-stat-icon purple">📺</div>
          <div class="gasto-stat-content">
            <div class="gasto-stat-label">Suscripciones</div>
            <div class="gasto-stat-value">${Formato.formatearMoneda(totalSuscripciones, moneda)}</div>
            <div class="gasto-stat-meta">${suscripciones.length} servicios</div>
          </div>
        </div>
        
        <div class="gasto-stat-card">
          <div class="gasto-stat-icon amber">⚠</div>
          <div class="gasto-stat-content">
            <div class="gasto-stat-label">Próximos 7 días</div>
            <div class="gasto-stat-value">${Formato.formatearMoneda(totalProximo, moneda)}</div>
            <div class="gasto-stat-meta">${proximos.length} ${proximos.length === 1 ? 'pago' : 'pagos'} por venir</div>
          </div>
        </div>
        
        <div class="gasto-stat-card">
          <div class="gasto-stat-icon green">📈</div>
          <div class="gasto-stat-content">
            <div class="gasto-stat-label">Proyección anual</div>
            <div class="gasto-stat-value">${Formato.formatearMoneda(totalAnual, moneda)}</div>
            <div class="gasto-stat-meta">A este ritmo</div>
          </div>
        </div>
      </div>
    `;
  },
  
  /* ============ TOOLBAR ============ */
  renderToolbar() {
    const filtros = [
      { id: 'todos', label: 'Todos' },
      { id: 'suscripciones', label: '📺 Suscripciones' },
      { id: 'fijos', label: '🔒 Fijos' },
      { id: 'variables', label: '📊 Variables' },
      { id: 'inactivos', label: '⏸ Inactivos' },
    ];
    
    return `
      <div class="gastos-toolbar">
        <div class="gastos-filters">
          ${filtros.map(f => `
            <button class="gasto-filter-pill ${this.filtroActivo === f.id ? 'active' : ''}" 
                    data-filtro="${f.id}">${f.label}</button>
          `).join('')}
        </div>
        <button class="btn-primary" id="btnNuevoGasto">
          <span class="btn-icon">+</span>
          <span>Nuevo gasto fijo</span>
        </button>
      </div>
    `;
  },
  
  /* ============ LISTA ============ */
  renderLista() {
    let gastos = Storage.cargar('gastosFijos') || [];
    
    // Aplicar filtro
    if (this.filtroActivo === 'suscripciones') {
      gastos = gastos.filter(g => g.activo && g.esSuscripcion);
    } else if (this.filtroActivo === 'fijos') {
      gastos = gastos.filter(g => g.activo && g.tipo === 'fijo');
    } else if (this.filtroActivo === 'variables') {
      gastos = gastos.filter(g => g.activo && g.tipo === 'variable');
    } else if (this.filtroActivo === 'inactivos') {
      gastos = gastos.filter(g => !g.activo);
    } else {
      gastos = gastos.filter(g => g.activo);
    }
    
    if (gastos.length === 0) {
      return `
        <div class="gastos-empty">
          <div class="gastos-empty-icon">📭</div>
          <h3>${this.filtroActivo === 'todos' ? 'Sin gastos fijos registrados' : 'Sin resultados'}</h3>
          <p>${this.filtroActivo === 'todos' ? 'Registra tus compromisos mensuales para llevar mejor control' : 'Prueba con otro filtro'}</p>
          ${this.filtroActivo === 'todos' ? '<button class="btn-primary" id="btnNuevoGastoEmpty">+ Crear el primero</button>' : ''}
        </div>
      `;
    }
    
    return `
      <div class="gastos-grid">
        ${gastos.map(g => this.renderGastoCard(g)).join('')}
      </div>
    `;
  },
  
  renderGastoCard(gasto) {
    const cuenta = API.obtenerCuentaPorId(gasto.cuentaId);
    const proximaFecha = Fechas.proximoDiaDelMes(gasto.diaCobro);
    const dias = Fechas.diasHasta(proximaFecha);
    const urgente = dias <= 3;
    
    // Promedio si es variable
    const promedio = API.calcularPromedio(gasto);
    const muestraEsVariable = gasto.tipo === 'variable' && gasto.historico && gasto.historico.length > 1;
    
    // Tags
    let tags = '';
    if (gasto.esSuscripcion) {
      tags += `<span class="gasto-card-tag suscripcion">Suscripción</span>`;
    }
    if (gasto.tipo === 'fijo') {
      tags += `<span class="gasto-card-tag fijo">Fijo</span>`;
    } else {
      tags += `<span class="gasto-card-tag variable">Variable</span>`;
    }
    
    // Sparkline solo para variables con historial
    const sparkline = muestraEsVariable ? `
      <div class="gasto-sparkline">
        <span class="gasto-sparkline-label">Histórico (últimos meses)</span>
        <canvas id="sparkGasto${gasto.id}" style="position:absolute;inset:8px 12px;"></canvas>
      </div>
    ` : '';
    
    return `
      <div class="gasto-card ${gasto.activo ? '' : 'inactivo'}" onclick="GastosFijos.abrirEditor(${gasto.id})">
        <div class="gasto-card-header">
          <div class="gasto-card-icon icon-box ${gasto.color || 'blue'}">
            <span>${gasto.icono || '💰'}</span>
          </div>
          
          <div class="gasto-card-info">
            <div class="gasto-card-title">${gasto.nombre} ${tags}</div>
            <div class="gasto-card-subtitle">
              ${cuenta ? cuenta.nombre : 'Sin cuenta'}
            </div>
          </div>
          
          <div class="gasto-card-amount">
            <div class="gasto-card-amount-value">${Formato.formatearMoneda(gasto.monto, gasto.moneda)}</div>
            <div class="gasto-card-amount-label">
              ${muestraEsVariable ? `Promedio: ${Formato.formatearMoneda(promedio, gasto.moneda)}` : '/ mes'}
            </div>
          </div>
        </div>
        
        ${sparkline}
        
        <div class="gasto-card-footer">
          <div class="gasto-next-payment">
            <div class="gasto-next-payment-label">Próximo cobro</div>
            <div class="gasto-next-payment-date ${urgente ? 'gasto-next-payment-urgent' : ''}">
              ${dias === 0 ? '🔴 Hoy' : dias === 1 ? '⚠ Mañana' : `En ${dias} días`}
            </div>
          </div>
          
          <div class="gasto-card-actions" onclick="event.stopPropagation()">
            <button class="gasto-action-btn pay" 
                    onclick="GastosFijos.confirmarPago(${gasto.id})" 
                    title="Marcar como pagado">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </button>
            <button class="gasto-action-btn" 
                    onclick="GastosFijos.abrirEditor(${gasto.id})" 
                    title="Editar">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  },
  
  /* ============ SPARKLINES ============ */
  renderSparklines() {
    const gastos = Storage.cargar('gastosFijos') || [];
    const variables = gastos.filter(g => g.tipo === 'variable' && g.historico && g.historico.length > 1);
    
    variables.forEach(g => {
      const canvas = document.getElementById(`sparkGasto${g.id}`);
      if (!canvas) return;
      
      const data = g.historico.map(h => h.monto);
      const ultimoMayor = data.length > 1 && data[data.length - 1] > data[data.length - 2];
      const color = ultimoMayor ? '#EF4444' : '#14F0CD';
      
      Graficos.destruir(`sparkGasto${g.id}`);
      const ctx = canvas.getContext('2d');
      
      Graficos.instancias[`sparkGasto${g.id}`] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map((_, i) => i),
          datasets: [{
            data,
            borderColor: color,
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 2,
            pointBackgroundColor: color,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { display: false }, 
            tooltip: {
              backgroundColor: 'rgba(15, 23, 41, 0.95)',
              callbacks: {
                title: () => '',
                label: (item) => `${Formato.formatearMoneda(item.parsed.y, g.moneda)}`,
              },
            },
          },
          scales: { x: { display: false }, y: { display: false } }
        }
      });
    });
  },
  
  /* ============ EVENTOS ============ */
  configurarEventos() {
    document.querySelectorAll('.gasto-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filtroActivo = btn.dataset.filtro;
        this.refrescar();
      });
    });
    
    // Cambio de vista del gráfico (sin re-render completo)
    document.querySelectorAll('.vista-pill[data-vista]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.vistaGrafico = btn.dataset.vista;
        document.querySelectorAll('.vista-pill').forEach(b => {
          b.classList.toggle('active', b.dataset.vista === this.vistaGrafico);
        });
        this.renderGraficoVariacionChart();
      });
    });
    
    const btnNuevo = document.getElementById('btnNuevoGasto');
    if (btnNuevo) {
      btnNuevo.addEventListener('click', () => this.abrirEditor(null));
    }
    
    const btnNuevoEmpty = document.getElementById('btnNuevoGastoEmpty');
    if (btnNuevoEmpty) {
      btnNuevoEmpty.addEventListener('click', () => this.abrirEditor(null));
    }
  },
  
  refrescar() {
    const container = document.getElementById('pageContent');
    if (container) this.render(container, this.monedaVista);
  },
  
  /* ============ ACCIONES ============ */
  abrirEditor(id = null) {
    GastoFijoForm.abrir(id, () => this.refrescar());
  },
  
  confirmarPago(id) {
    const gasto = API.obtenerGastoFijoPorId(id);
    if (!gasto) return;
    
    // Si es variable, abrir un mini-modal para que ponga el monto exacto
    if (gasto.tipo === 'variable') {
      this.abrirModalPagoVariable(gasto);
      return;
    }
    
    // Si es fijo, confirmar directamente
    Modal.confirmar({
      titulo: `Pagar ${gasto.nombre}`,
      mensaje: `Se registrará un egreso de ${Formato.formatearMoneda(gasto.monto, gasto.moneda)} desde "${API.obtenerCuentaPorId(gasto.cuentaId)?.nombre || ''}". ¿Confirmar?`,
      textoConfirmar: 'Pagar',
      onConfirmar: () => {
        try {
          API.marcarGastoComoPagado(id);
          Modal.toast(`✓ ${gasto.nombre} pagado`);
          this.refrescar();
        } catch (e) {
          Modal.toast('Error: ' + e.message, 'error');
        }
      },
    });
  },
  
  abrirModalPagoVariable(gasto) {
    const promedio = API.calcularPromedio(gasto);
    const cuenta = API.obtenerCuentaPorId(gasto.cuentaId);
    
    Modal.abrir({
      titulo: `Pagar ${gasto.nombre}`,
      ancho: 'small',
      contenido: `
        <div class="form-group">
          <label class="form-label">Monto a pagar</label>
          <div class="trans-modal-amount" style="margin:0;">
            <input type="number" id="pagoVarMonto" class="trans-modal-amount-input" 
                   placeholder="0.00" step="0.01" min="0" 
                   value="${promedio.toFixed(2)}" inputmode="decimal" autofocus>
            <div class="trans-modal-amount-currency">${Formato.SIMBOLOS[gasto.moneda]}</div>
          </div>
        </div>
        
        <div class="cuotas-info" style="margin-bottom:var(--space-md);">
          📊 Promedio últimos meses: <strong>${Formato.formatearMoneda(promedio, gasto.moneda)}</strong><br>
          💳 Se cobrará desde: <strong>${cuenta ? cuenta.nombre : ''}</strong>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="Modal.cerrar()">Cancelar</button>
          <button type="button" class="btn-primary" id="confirmPagoVar">Pagar</button>
        </div>
      `,
    });
    
    document.getElementById('confirmPagoVar').addEventListener('click', () => {
      const monto = parseFloat(document.getElementById('pagoVarMonto').value);
      if (!monto || monto <= 0) {
        Modal.toast('Ingresa un monto válido', 'error');
        return;
      }
      
      try {
        API.marcarGastoComoPagado(gasto.id, { monto });
        Modal.toast(`✓ ${gasto.nombre} pagado`);
        Modal.cerrar();
        this.refrescar();
      } catch (e) {
        Modal.toast('Error: ' + e.message, 'error');
      }
    });
  },
};
