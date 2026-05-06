/* ============================================
   PÁGINA: TARJETAS DE CRÉDITO
   ============================================ */

const Tarjetas = {
  
  // Estado
  tarjetaSeleccionadaId: null,
  cicloVisualizando: 'actual', // actual | facturado | historico
  monedaVista: 'PEN',
  
  render(container, monedaVista = 'PEN') {
    this.monedaVista = monedaVista;
    
    const tarjetas = API.obtenerTarjetas();
    
    if (tarjetas.length === 0) {
      container.innerHTML = this.renderEmptyState();
      this.configurarEventosEmpty();
      return;
    }
    
    // Si no hay tarjeta seleccionada, tomar la primera
    if (!this.tarjetaSeleccionadaId || !tarjetas.find(t => t.id === this.tarjetaSeleccionadaId)) {
      this.tarjetaSeleccionadaId = tarjetas[0].id;
    }
    
    container.innerHTML = `
      <div class="tarjetas-page">
        ${this.renderSelector(tarjetas)}
        ${this.renderTarjetaDetalle()}
      </div>
    `;
    
    this.configurarEventos();
  },
  
  renderEmptyState() {
    return `
      <div class="glass-card">
        <div class="trans-empty">
          <div class="icon">💳</div>
          <h3>No tienes tarjetas registradas</h3>
          <p>Agrega tu primera tarjeta para empezar a llevar control de tus gastos con crédito</p>
          <button class="btn-primary" id="btnAgregarPrimera">+ Agregar tarjeta</button>
        </div>
      </div>
    `;
  },
  
  configurarEventosEmpty() {
    const btn = document.getElementById('btnAgregarPrimera');
    if (btn) btn.addEventListener('click', () => TarjetaForm.abrir(null, () => this.refrescar()));
  },
  
  /**
   * Selector horizontal con todas las tarjetas + botón agregar
   */
  renderSelector(tarjetas) {
    const items = tarjetas.map(t => {
      const activa = t.id === this.tarjetaSeleccionadaId;
      const numTrans = API.obtenerTransaccionesTarjeta(t.id).length;
      return `
        <button class="tarjeta-selector-item ${activa ? 'active' : ''}" data-tarjeta-id="${t.id}">
          <span>💳</span>
          <span>${t.nombre}</span>
          <span class="badge-mini">${numTrans}</span>
        </button>
      `;
    }).join('');
    
    return `
      <div class="tarjeta-selector">
        ${items}
        <button class="tarjeta-selector-item" id="btnAgregarTarjeta" style="border-style:dashed;">
          <span>+</span>
          <span>Agregar tarjeta</span>
        </button>
      </div>
    `;
  },
  
  /**
   * Detalle de la tarjeta seleccionada
   */
  renderTarjetaDetalle() {
    const tarjeta = API.obtenerTarjetaPorId(this.tarjetaSeleccionadaId);
    if (!tarjeta) return '';
    
    const usuario = API.obtenerUsuario();
    const transacciones = API.obtenerTransaccionesTarjeta(tarjeta.id);
    const ciclos = TarjetaUtils.calcularCiclos(tarjeta.diaCorte, tarjeta.diaPago);
    
    // Calcular montos
    const montoFacturado = TarjetaUtils.calcularMontoFacturado(tarjeta, transacciones);
    const montoActual = TarjetaUtils.calcularMontoCicloActual(tarjeta, transacciones);
    const disponible = tarjeta.lineaCredito - tarjeta.saldoUsado;
    const porcentajeUsado = (tarjeta.saldoUsado / tarjeta.lineaCredito) * 100;
    
    return `
      <!-- Tarjeta visual hero -->
      <div class="glass-card tarjeta-hero">
        ${TarjetaVisualComp.render(tarjeta, usuario)}
        
        <div class="tarjeta-hero-actions">
          <button class="btn-primary" id="btnPagarTarjeta">💵 Pagar tarjeta</button>
          <button class="btn-secondary" id="btnEditarTarjeta">⚙️ Configurar</button>
          <button class="btn-secondary" id="btnNuevoConsumo">+ Nuevo consumo</button>
        </div>
      </div>
      
      <!-- Stats -->
      <div class="tarjeta-stats-grid">
        <div class="glass-card tarjeta-stat">
          <div class="tarjeta-stat-label">Línea total</div>
          <div class="tarjeta-stat-value">${Formato.formatearMoneda(tarjeta.lineaCredito, tarjeta.moneda)}</div>
          <div class="tarjeta-stat-secondary">${Math.round(porcentajeUsado)}% usado</div>
        </div>
        <div class="glass-card tarjeta-stat">
          <div class="tarjeta-stat-label">Disponible</div>
          <div class="tarjeta-stat-value success">${Formato.formatearMoneda(disponible, tarjeta.moneda)}</div>
          <div class="tarjeta-stat-secondary">Para gastar</div>
        </div>
        <div class="glass-card tarjeta-stat">
          <div class="tarjeta-stat-label">Total usado</div>
          <div class="tarjeta-stat-value danger">${Formato.formatearMoneda(tarjeta.saldoUsado, tarjeta.moneda)}</div>
          <div class="tarjeta-stat-secondary">Pendiente de pago</div>
        </div>
      </div>
      
      <!-- Tabs de ciclos -->
      <div class="glass-card">
        ${this.renderTabs(montoFacturado, montoActual, transacciones, ciclos)}
        ${this.renderInfoCiclo(tarjeta, ciclos, montoFacturado, montoActual)}
        ${this.renderListaMovimientos(tarjeta, transacciones, ciclos)}
      </div>
    `;
  },
  
  renderTabs(montoFacturado, montoActual, transacciones, ciclos) {
    // Contar transacciones del histórico
    const cuentaHistorica = transacciones.filter(t => {
      if (t.tipo !== 'egreso') return false;
      const fecha = new Date(t.fecha);
      return fecha < ciclos.inicioFacturado;
    }).length;
    
    // Contar transacciones del ciclo actual y facturado
    const cuentaActual = transacciones.filter(t => {
      if (t.tipo !== 'egreso') return false;
      const fecha = new Date(t.fecha);
      return fecha >= ciclos.inicioActual && fecha <= ciclos.finActual;
    }).length;
    
    const cuentaFacturada = transacciones.filter(t => {
      if (t.tipo !== 'egreso') return false;
      const fecha = new Date(t.fecha);
      return fecha >= ciclos.inicioFacturado && fecha <= ciclos.finFacturado;
    }).length;
    
    return `
      <div class="tabs-container">
        <button class="tab-button ${this.cicloVisualizando === 'actual' ? 'active' : ''}" data-tab="actual">
          <span>🟢 Ciclo actual</span>
          <span class="tab-button-meta">${cuentaActual} ${cuentaActual === 1 ? 'movimiento' : 'movimientos'}</span>
        </button>
        <button class="tab-button ${this.cicloVisualizando === 'facturado' ? 'active' : ''}" data-tab="facturado">
          <span>🟡 Por pagar</span>
          <span class="tab-button-meta">${cuentaFacturada} ${cuentaFacturada === 1 ? 'movimiento' : 'movimientos'}</span>
        </button>
        <button class="tab-button ${this.cicloVisualizando === 'historico' ? 'active' : ''}" data-tab="historico">
          <span>📜 Histórico</span>
          <span class="tab-button-meta">${cuentaHistorica} ${cuentaHistorica === 1 ? 'movimiento' : 'movimientos'}</span>
        </button>
      </div>
    `;
  },
  
  renderInfoCiclo(tarjeta, ciclos, montoFacturado, montoActual) {
    if (this.cicloVisualizando === 'actual') {
      const dias = Fechas.diasHasta(ciclos.finActual);
      return `
        <div class="ciclo-info">
          <div class="ciclo-info-text">
            <div class="ciclo-info-title">Ciclo en curso</div>
            <div class="ciclo-info-desc">
              Del ${Fechas.formatoCorto(ciclos.inicioActual)} al ${Fechas.formatoCorto(ciclos.finActual)}.
              Cierre en ${dias} ${dias === 1 ? 'día' : 'días'}. Se paga el ${Fechas.formatoCompleto(ciclos.fechaPagoActual)}.
            </div>
          </div>
          <div class="ciclo-info-amount">
            <div class="ciclo-info-amount-label">Llevas gastado</div>
            <div class="ciclo-info-amount-value">${Formato.formatearMoneda(montoActual, tarjeta.moneda)}</div>
          </div>
        </div>
      `;
    }
    
    if (this.cicloVisualizando === 'facturado') {
      const dias = Fechas.diasHasta(ciclos.fechaPagoFacturado);
      const claseUrgencia = dias <= 5 ? 'warning' : '';
      return `
        <div class="ciclo-info" style="${dias <= 5 ? 'border-color: rgba(251, 191, 36, 0.4); background: rgba(251, 191, 36, 0.08);' : ''}">
          <div class="ciclo-info-text">
            <div class="ciclo-info-title">${dias > 0 ? `⚠ Por pagar en ${dias} ${dias === 1 ? 'día' : 'días'}` : '🚨 Pago vencido'}</div>
            <div class="ciclo-info-desc">
              Consumos del ${Fechas.formatoCorto(ciclos.inicioFacturado)} al ${Fechas.formatoCorto(ciclos.finFacturado)}.
              Fecha de pago: ${Fechas.formatoCompleto(ciclos.fechaPagoFacturado)}.
            </div>
          </div>
          <div class="ciclo-info-amount">
            <div class="ciclo-info-amount-label">Total a pagar</div>
            <div class="ciclo-info-amount-value ${claseUrgencia}">${Formato.formatearMoneda(montoFacturado, tarjeta.moneda)}</div>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="ciclo-info">
        <div class="ciclo-info-text">
          <div class="ciclo-info-title">Movimientos históricos</div>
          <div class="ciclo-info-desc">Consumos de ciclos anteriores ya cerrados.</div>
        </div>
      </div>
    `;
  },
  
  renderListaMovimientos(tarjeta, transacciones, ciclos) {
    // Filtrar según el ciclo seleccionado
    const movimientos = transacciones.filter(t => {
      if (t.tipo !== 'egreso') return false;
      const fecha = new Date(t.fecha);
      
      if (this.cicloVisualizando === 'actual') {
        return fecha >= ciclos.inicioActual && fecha <= ciclos.finActual;
      }
      if (this.cicloVisualizando === 'facturado') {
        return fecha >= ciclos.inicioFacturado && fecha <= ciclos.finFacturado;
      }
      // historico
      return fecha < ciclos.inicioFacturado;
    });
    
    if (movimientos.length === 0) {
      return `
        <div class="trans-empty" style="padding: var(--space-xl) var(--space-md);">
          <div class="icon">🪙</div>
          <h3>Sin movimientos en este ciclo</h3>
          <p>${this.cicloVisualizando === 'actual' ? 'Aún no has hecho consumos en el ciclo en curso' : 'Este ciclo no tiene movimientos'}</p>
        </div>
      `;
    }
    
    return `
      <div class="trans-list" style="margin-top: var(--space-md);">
        ${movimientos.map(t => this.renderMovimiento(t)).join('')}
      </div>
    `;
  },
  
  renderMovimiento(trans) {
    const categoria = API.obtenerCategoriaPorId(trans.categoriaId);
    const padre = API.obtenerCategoriaPadre(trans.categoriaId);
    
    const categoriaTexto = padre 
      ? `<span class="parent">${padre.nombre} ›</span> ${categoria.nombre}`
      : categoria.nombre;
    
    // Si tiene cuotas, mostrar badge
    const cuotasBadge = trans.cuotasTotal && trans.cuotasTotal > 1
      ? `<span class="trans-cuotas-badge">${trans.cuotaActual || 1}/${trans.cuotasTotal} cuotas</span>`
      : '';
    
    return `
      <div class="trans-item" onclick="Transacciones.abrirModal(${trans.id})">
        <div class="icon-box ${categoria.color || 'purple'}">
          <span>${categoria.icono}</span>
        </div>
        <div class="trans-item-info">
          <div class="trans-item-desc">
            ${trans.descripcion || categoria.nombre}
            ${cuotasBadge}
          </div>
          <div class="trans-item-meta">
            <span class="trans-category-path">${categoriaTexto}</span>
            <span class="separator">·</span>
            <span>${Fechas.formatoCorto(trans.fecha)}</span>
          </div>
        </div>
        <div class="trans-item-amount expense">
          -${Formato.formatearMoneda(trans.monto, trans.moneda)}
        </div>
      </div>
    `;
  },
  
  /* ============ EVENTOS ============ */
  configurarEventos() {
    // Selector de tarjeta
    document.querySelectorAll('.tarjeta-selector-item[data-tarjeta-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.tarjetaSeleccionadaId = parseInt(btn.dataset.tarjetaId);
        this.cicloVisualizando = 'actual'; // reset
        this.refrescar();
      });
    });
    
    // Botón agregar tarjeta
    const btnAdd = document.getElementById('btnAgregarTarjeta');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        TarjetaForm.abrir(null, () => this.refrescar());
      });
    }
    
    // Tabs de ciclo
    document.querySelectorAll('.tab-button[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.cicloVisualizando = btn.dataset.tab;
        this.refrescar();
      });
    });
    
    // Acciones de la tarjeta
    const btnPagar = document.getElementById('btnPagarTarjeta');
    if (btnPagar) {
      btnPagar.addEventListener('click', () => {
        PagoTarjetaForm.abrir(this.tarjetaSeleccionadaId, () => this.refrescar());
      });
    }
    
    const btnEditar = document.getElementById('btnEditarTarjeta');
    if (btnEditar) {
      btnEditar.addEventListener('click', () => {
        TarjetaForm.abrir(this.tarjetaSeleccionadaId, () => this.refrescar());
      });
    }
    
    const btnConsumo = document.getElementById('btnNuevoConsumo');
    if (btnConsumo) {
      btnConsumo.addEventListener('click', () => {
        // Abrir form de transacción con la tarjeta preseleccionada
        const tarjeta = API.obtenerTarjetaPorId(this.tarjetaSeleccionadaId);
        TransaccionForm.abrir(null, () => this.refrescar());
        // Esperar a que se abra el modal y preseleccionar la cuenta
        setTimeout(() => {
          const select = document.getElementById('transCuenta');
          if (select && tarjeta) {
            select.value = tarjeta.cuentaId;
            select.dispatchEvent(new Event('change'));
            TransaccionForm.estado.tipo = 'egreso';
            TransaccionForm.refrescarForm();
          }
        }, 100);
      });
    }
  },
  
  refrescar() {
    const container = document.getElementById('pageContent');
    if (container) this.render(container, this.monedaVista);
  },
};
