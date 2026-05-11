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
    const usuario = API.obtenerUsuario();
    const idxActiva = tarjetas.findIndex(t => t.id === this.tarjetaSeleccionadaId);
    const indice = idxActiva >= 0 ? idxActiva : 0;
    
    // Slides
    const slides = tarjetas.map((tarjeta, i) => {
      const claseSlide = this.calcularClaseSlide(i, indice, tarjetas.length);
      return `
        <div class="card-slide ${claseSlide}" data-tarj-index="${i}" data-tarjeta-id="${tarjeta.id}">
          ${TarjetaVisualComp.render(tarjeta, usuario)}
        </div>
      `;
    }).join('');
    
    // Indicadores
    const indicadores = tarjetas.map((_, i) => `
      <button class="indicator-dot ${i === indice ? 'active' : ''}" data-tarj-slide="${i}"></button>
    `).join('');
    
    // Flechas (solo si hay más de 1)
    const flechas = tarjetas.length > 1 ? `
      <button class="card-nav-btn prev" id="tarjPrev" aria-label="Anterior">‹</button>
      <button class="card-nav-btn next" id="tarjNext" aria-label="Siguiente">›</button>
    ` : '';
    
    return `
      <div class="cards-slider">
        ${flechas}
        <div class="cards-track" id="tarjTrack">${slides}</div>
      </div>
      ${tarjetas.length > 1 ? `<div class="cards-indicators" style="margin-bottom: var(--space-md);">${indicadores}</div>` : ''}
      
      <div style="text-align:center;margin-bottom:var(--space-md);">
        <button class="btn-secondary" id="btnAgregarTarjeta">+ Agregar tarjeta</button>
      </div>
    `;
  },
  
  /**
   * Calcula la clase CSS según la posición relativa al activo
   */
  calcularClaseSlide(index, activoIndex, total) {
    if (index === activoIndex) return 'is-active';
    const diff = index - activoIndex;
    if (diff === -1) return 'is-prev';
    if (diff === 1) return 'is-next';
    if (diff < -1) return 'is-far-prev';
    return 'is-far-next';
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
      <!-- Acciones (la tarjeta visual está en el slider de arriba) -->
      <div style="display:flex;gap:var(--space-sm);justify-content:center;flex-wrap:wrap;margin-bottom:var(--space-md);">
        <button class="btn-primary" id="btnPagarTarjeta">💵 Pagar tarjeta</button>
        <button class="btn-secondary" id="btnEditarTarjeta">⚙️ Configurar</button>
        <button class="btn-secondary" id="btnNuevoConsumo">+ Nuevo consumo</button>
      </div>
      
      ${tarjeta.descripcion ? `
        <div class="glass-card" style="padding:12px 16px;margin-bottom:var(--space-md);background:linear-gradient(135deg, rgba(20, 240, 205, 0.05), transparent);border-color:rgba(20, 240, 205, 0.2);">
          <div style="font-size:0.6875rem;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">📝 Notas</div>
          <div style="font-size:0.875rem;color:var(--text-secondary);line-height:1.5;">${tarjeta.descripcion}</div>
        </div>
      ` : ''}
      
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
    const tarjetas = API.obtenerTarjetas();
    
    // Click en una tarjeta del slider → cambiar de tarjeta seleccionada
    document.querySelectorAll('.card-slide[data-tarjeta-id]').forEach(slide => {
      slide.addEventListener('click', () => {
        if (slide.classList.contains('is-active')) return; // ya está seleccionada
        const tarjId = parseInt(slide.dataset.tarjetaId);
        this.tarjetaSeleccionadaId = tarjId;
        this.cicloVisualizando = 'actual';
        this.refrescar();
      });
    });
    
    // Flechas del slider
    const idxActiva = tarjetas.findIndex(t => t.id === this.tarjetaSeleccionadaId);
    const btnPrev = document.getElementById('tarjPrev');
    const btnNext = document.getElementById('tarjNext');
    
    if (btnPrev) {
      btnPrev.disabled = (idxActiva <= 0);
      btnPrev.addEventListener('click', () => {
        if (idxActiva > 0) {
          this.tarjetaSeleccionadaId = tarjetas[idxActiva - 1].id;
          this.cicloVisualizando = 'actual';
          this.refrescar();
        }
      });
    }
    
    if (btnNext) {
      btnNext.disabled = (idxActiva >= tarjetas.length - 1);
      btnNext.addEventListener('click', () => {
        if (idxActiva < tarjetas.length - 1) {
          this.tarjetaSeleccionadaId = tarjetas[idxActiva + 1].id;
          this.cicloVisualizando = 'actual';
          this.refrescar();
        }
      });
    }
    
    // Indicadores
    document.querySelectorAll('.indicator-dot[data-tarj-slide]').forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.dataset.tarjSlide);
        if (tarjetas[idx]) {
          this.tarjetaSeleccionadaId = tarjetas[idx].id;
          this.cicloVisualizando = 'actual';
          this.refrescar();
        }
      });
    });
    
    // Swipe táctil
    const track = document.getElementById('tarjTrack');
    if (track && tarjetas.length > 1) {
      let startX = 0;
      track.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].screenX; }, { passive: true });
      track.addEventListener('touchend', (e) => {
        const diff = startX - e.changedTouches[0].screenX;
        if (Math.abs(diff) < 50) return;
        const ix = tarjetas.findIndex(t => t.id === this.tarjetaSeleccionadaId);
        if (diff > 0 && ix < tarjetas.length - 1) {
          this.tarjetaSeleccionadaId = tarjetas[ix + 1].id;
          this.refrescar();
        } else if (diff < 0 && ix > 0) {
          this.tarjetaSeleccionadaId = tarjetas[ix - 1].id;
          this.refrescar();
        }
      }, { passive: true });
    }
    
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
