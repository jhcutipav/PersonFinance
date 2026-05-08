/* ============================================
   PÁGINA: TRANSFERENCIAS ENTRE CUENTAS
   ============================================ */

const Transferencias = {
  
  monedaVista: 'PEN',
  cuentaFiltro: null,
  
  render(container, monedaVista = 'PEN') {
    this.monedaVista = monedaVista;
    
    container.innerHTML = `
      <div class="transferencias-page">
        ${this.renderStats()}
        ${this.renderFilterRow()}
        ${this.renderLista()}
      </div>
    `;
    
    this.configurarEventos();
  },
  
  /* ============ STATS ============ */
  renderStats() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const todas = API.obtenerTransferencias();
    
    // Total movido este mes
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
    const transfMes = todas.filter(t => t.fecha >= inicioMes);
    
    let totalMes = 0;
    transfMes.forEach(t => {
      totalMes += Formato.convertir(t.monto, t.monedaOrigen, moneda);
    });
    
    return `
      <div class="transf-stats-row">
        <div class="meta-stat-card">
          <div class="meta-stat-icon cyan">↔️</div>
          <div class="meta-stat-info">
            <div class="meta-stat-label">Total transferencias</div>
            <div class="meta-stat-value">${todas.length}</div>
            <div class="meta-stat-meta">Histórico completo</div>
          </div>
        </div>
        
        <div class="meta-stat-card">
          <div class="meta-stat-icon purple">📅</div>
          <div class="meta-stat-info">
            <div class="meta-stat-label">Este mes</div>
            <div class="meta-stat-value">${transfMes.length}</div>
            <div class="meta-stat-meta">${Fechas.mesActual()} ${ahora.getFullYear()}</div>
          </div>
        </div>
        
        <div class="meta-stat-card">
          <div class="meta-stat-icon green">💰</div>
          <div class="meta-stat-info">
            <div class="meta-stat-label">Monto movido (mes)</div>
            <div class="meta-stat-value">${Formato.formatearMoneda(totalMes, moneda)}</div>
            <div class="meta-stat-meta">Suma de transferencias</div>
          </div>
        </div>
      </div>
    `;
  },
  
  /* ============ FILTRO Y BOTÓN NUEVA ============ */
  renderFilterRow() {
    const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito');
    
    return `
      <div class="transf-filter-row">
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <span class="transf-filter-info">Filtrar por cuenta:</span>
          <select class="transf-filter-select" id="transfFilterCuenta">
            <option value="">Todas las cuentas</option>
            ${cuentas.map(c => `
              <option value="${c.id}" ${this.cuentaFiltro === c.id ? 'selected' : ''}>
                ${c.nombre}
              </option>
            `).join('')}
          </select>
        </div>
        
        <button class="btn-primary" id="btnNuevaTransferencia">
          <span class="btn-icon">+</span>
          <span>Nueva transferencia</span>
        </button>
      </div>
    `;
  },
  
  /* ============ LISTA ============ */
  renderLista() {
    const filtros = {};
    if (this.cuentaFiltro) filtros.cuentaId = this.cuentaFiltro;
    
    const transferencias = API.obtenerTransferencias(filtros);
    
    if (transferencias.length === 0) {
      return this.renderEmpty();
    }
    
    return `
      <div class="transf-list">
        ${transferencias.map(t => this.renderTransferenciaItem(t)).join('')}
      </div>
    `;
  },
  
  renderEmpty() {
    return `
      <div class="transf-empty">
        <div class="transf-empty-icon">↔️</div>
        <h3>${this.cuentaFiltro ? 'Sin transferencias para esta cuenta' : 'Aún no hay transferencias'}</h3>
        <p>Mueve dinero entre tus cuentas propias y lleva un control claro</p>
        <button class="btn-primary" id="btnNuevaTransferenciaEmpty">+ Crear primera transferencia</button>
      </div>
    `;
  },
  
  renderTransferenciaItem(transf) {
    const cuentaOrigen = API.obtenerCuentaPorId(transf.cuentaOrigenId);
    const cuentaDestino = API.obtenerCuentaPorId(transf.cuentaDestinoId);
    
    if (!cuentaOrigen || !cuentaDestino) return '';
    
    const distintaMoneda = transf.monedaOrigen !== transf.monedaDestino;
    
    return `
      <div class="transf-item">
        <div class="transf-item-icon">↔️</div>
        
        <div class="transf-item-flow">
          <div class="transf-item-cuentas">
            <span class="transf-cuenta-tag">📤 ${cuentaOrigen.nombre}</span>
            <span class="transf-arrow">→</span>
            <span class="transf-cuenta-tag">📥 ${cuentaDestino.nombre}</span>
          </div>
          <div class="transf-item-meta">
            ${Fechas.formatoCorto(transf.fecha)}
            ${transf.descripcion ? ` · ${transf.descripcion}` : ''}
          </div>
        </div>
        
        <div class="transf-item-amount">
          <div class="transf-item-amount-main">${Formato.formatearMoneda(transf.monto, transf.monedaOrigen)}</div>
          ${distintaMoneda ? `
            <div class="transf-item-amount-converted">
              → ${Formato.formatearMoneda(transf.montoDestino, transf.monedaDestino)}
            </div>
          ` : ''}
        </div>
        
        <div class="transf-item-actions">
          <button class="transf-action-btn" 
                  onclick="Transferencias.confirmarEliminar('${transf.transferenciaId}', '${cuentaOrigen.nombre}', '${cuentaDestino.nombre}')" 
                  title="Eliminar">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  },
  
  /* ============ EVENTOS ============ */
  configurarEventos() {
    const btnNueva = document.getElementById('btnNuevaTransferencia');
    if (btnNueva) btnNueva.addEventListener('click', () => this.abrirFormulario());
    
    const btnNuevaEmpty = document.getElementById('btnNuevaTransferenciaEmpty');
    if (btnNuevaEmpty) btnNuevaEmpty.addEventListener('click', () => this.abrirFormulario());
    
    const filtro = document.getElementById('transfFilterCuenta');
    if (filtro) {
      filtro.addEventListener('change', (e) => {
        this.cuentaFiltro = e.target.value ? parseInt(e.target.value) : null;
        this.refrescar();
      });
    }
  },
  
  refrescar() {
    const container = document.getElementById('pageContent');
    if (container) this.render(container, this.monedaVista);
  },
  
  /* ============ FORMULARIO ============ */
  abrirFormulario() {
    const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito');
    
    if (cuentas.length < 2) {
      Modal.toast('Necesitas al menos 2 cuentas para transferir', 'error');
      return;
    }
    
    const estado = {
      cuentaOrigenId: cuentas[0].id,
      cuentaDestinoId: cuentas[1].id,
      monto: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
    };
    
    Modal.abrir({
      titulo: 'Nueva transferencia',
      contenido: this.renderForm(estado, cuentas),
    });
    
    this.configurarEventosFormulario(estado, cuentas);
  },
  
  renderForm(estado, cuentas) {
    const cuentaOrigen = cuentas.find(c => c.id === estado.cuentaOrigenId);
    const cuentaDestino = cuentas.find(c => c.id === estado.cuentaDestinoId);
    
    return `
      <form id="transfForm" onsubmit="return false;">
        
        <!-- Flujo visual: origen → destino -->
        <div class="transf-modal-flow" id="transfFlowDisplay">
          <div class="transf-modal-cuenta-card">
            <div class="transf-modal-cuenta-label">📤 Desde</div>
            <div class="transf-modal-cuenta-name" id="transfFlowOrigen">${cuentaOrigen.nombre}</div>
            <div class="transf-modal-cuenta-saldo" id="transfFlowOrigenSaldo">
              Saldo: ${Formato.formatearMoneda(cuentaOrigen.saldo, cuentaOrigen.moneda)}
            </div>
          </div>
          
          <div class="transf-modal-arrow-big">→</div>
          
          <div class="transf-modal-cuenta-card">
            <div class="transf-modal-cuenta-label">📥 Hacia</div>
            <div class="transf-modal-cuenta-name" id="transfFlowDestino">${cuentaDestino.nombre}</div>
            <div class="transf-modal-cuenta-saldo" id="transfFlowDestinoSaldo">
              Saldo: ${Formato.formatearMoneda(cuentaDestino.saldo, cuentaDestino.moneda)}
            </div>
          </div>
        </div>
        
        <!-- Selector de cuentas -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Cuenta origen</label>
            <select class="form-select" id="transfCuentaOrigen">
              ${cuentas.map(c => `
                <option value="${c.id}" ${c.id === estado.cuentaOrigenId ? 'selected' : ''}>
                  ${c.nombre} (${Formato.formatearMoneda(c.saldo, c.moneda)})
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Cuenta destino</label>
            <select class="form-select" id="transfCuentaDestino">
              ${cuentas.map(c => `
                <option value="${c.id}" ${c.id === estado.cuentaDestinoId ? 'selected' : ''}>
                  ${c.nombre} (${c.moneda})
                </option>
              `).join('')}
            </select>
          </div>
        </div>
        
        <!-- Monto -->
        <div class="form-group">
          <label class="form-label">Monto a transferir</label>
          <div class="trans-modal-amount" style="margin:0;">
            <input type="number" id="transfMonto" class="trans-modal-amount-input" 
                   placeholder="0.00" step="0.01" min="0" 
                   inputmode="decimal" autofocus>
            <div class="trans-modal-amount-currency" id="transfCurrencyLabel">
              ${Formato.SIMBOLOS[cuentaOrigen.moneda] || cuentaOrigen.moneda}
            </div>
          </div>
        </div>
        
        <!-- Botones rápidos -->
        <div class="transf-quick-row">
          <button type="button" class="transf-quick-btn" data-quick="50">+50</button>
          <button type="button" class="transf-quick-btn" data-quick="100">+100</button>
          <button type="button" class="transf-quick-btn" data-quick="500">+500</button>
          <button type="button" class="transf-quick-btn" data-quick="todo">Todo</button>
        </div>
        
        <!-- Info de conversión (se muestra solo si las monedas son diferentes) -->
        <div id="transfConversionInfo"></div>
        
        <!-- Descripción y fecha -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Descripción (opcional)</label>
            <input type="text" class="form-input" id="transfDescripcion" 
                   placeholder="Motivo de la transferencia" maxlength="60">
          </div>
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" class="form-input" id="transfFecha" value="${estado.fecha}">
          </div>
        </div>
        
        <!-- Acciones -->
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="Modal.cerrar()">Cancelar</button>
          <button type="button" class="btn-primary" id="btnGuardarTransferencia">Transferir</button>
        </div>
      </form>
    `;
  },
  
  configurarEventosFormulario(estado, cuentas) {
    const actualizarFlow = () => {
      const cuentaOrigen = cuentas.find(c => c.id === estado.cuentaOrigenId);
      const cuentaDestino = cuentas.find(c => c.id === estado.cuentaDestinoId);
      
      if (!cuentaOrigen || !cuentaDestino) return;
      
      // Actualizar display de cuentas
      document.getElementById('transfFlowOrigen').textContent = cuentaOrigen.nombre;
      document.getElementById('transfFlowDestino').textContent = cuentaDestino.nombre;
      document.getElementById('transfFlowOrigenSaldo').textContent = `Saldo: ${Formato.formatearMoneda(cuentaOrigen.saldo, cuentaOrigen.moneda)}`;
      document.getElementById('transfFlowDestinoSaldo').textContent = `Saldo: ${Formato.formatearMoneda(cuentaDestino.saldo, cuentaDestino.moneda)}`;
      document.getElementById('transfCurrencyLabel').textContent = Formato.SIMBOLOS[cuentaOrigen.moneda] || cuentaOrigen.moneda;
      
      // Validar saldo origen
      const monto = parseFloat(estado.monto) || 0;
      const saldoOrigenEl = document.getElementById('transfFlowOrigenSaldo');
      saldoOrigenEl.classList.remove('bajo', 'insuficiente');
      if (monto > 0) {
        if (monto > cuentaOrigen.saldo) {
          saldoOrigenEl.classList.add('insuficiente');
        } else if (monto > cuentaOrigen.saldo * 0.8) {
          saldoOrigenEl.classList.add('bajo');
        }
      }
      
      // Mostrar info de conversión si las monedas son distintas
      const infoEl = document.getElementById('transfConversionInfo');
      if (cuentaOrigen.moneda !== cuentaDestino.moneda && monto > 0) {
        const convertido = Formato.convertir(monto, cuentaOrigen.moneda, cuentaDestino.moneda);
        const tasa = convertido / monto;
        infoEl.innerHTML = `
          <div class="transf-modal-conversion-info">
            <span style="font-size:1.25rem;">💱</span>
            <span>
              Conversión automática: <strong>${Formato.formatearMoneda(monto, cuentaOrigen.moneda)}</strong> 
              equivale a <strong>${Formato.formatearMoneda(convertido, cuentaDestino.moneda)}</strong>
              (tasa: 1 ${cuentaOrigen.moneda} = ${tasa.toFixed(4)} ${cuentaDestino.moneda})
            </span>
          </div>
        `;
      } else {
        infoEl.innerHTML = '';
      }
    };
    
    document.getElementById('transfCuentaOrigen').addEventListener('change', (e) => {
      estado.cuentaOrigenId = parseInt(e.target.value);
      actualizarFlow();
    });
    
    document.getElementById('transfCuentaDestino').addEventListener('change', (e) => {
      estado.cuentaDestinoId = parseInt(e.target.value);
      actualizarFlow();
    });
    
    const inputMonto = document.getElementById('transfMonto');
    inputMonto.addEventListener('input', (e) => {
      estado.monto = e.target.value;
      actualizarFlow();
    });
    
    document.getElementById('transfDescripcion').addEventListener('input', (e) => {
      estado.descripcion = e.target.value;
    });
    
    document.getElementById('transfFecha').addEventListener('change', (e) => {
      estado.fecha = e.target.value;
    });
    
    // Botones rápidos
    document.querySelectorAll('.transf-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cuentaOrigen = cuentas.find(c => c.id === estado.cuentaOrigenId);
        if (!cuentaOrigen) return;
        
        if (btn.dataset.quick === 'todo') {
          inputMonto.value = cuentaOrigen.saldo.toFixed(2);
          estado.monto = cuentaOrigen.saldo.toString();
        } else {
          const actual = parseFloat(inputMonto.value) || 0;
          const incremento = parseFloat(btn.dataset.quick);
          inputMonto.value = (actual + incremento).toFixed(2);
          estado.monto = inputMonto.value;
        }
        actualizarFlow();
      });
    });
    
    // Guardar
    document.getElementById('btnGuardarTransferencia').addEventListener('click', () => {
      this.guardarTransferencia(estado);
    });
  },
  
  guardarTransferencia(estado) {
    const monto = parseFloat(estado.monto);
    
    if (!monto || monto <= 0) {
      Modal.toast('Ingresa un monto válido', 'error');
      document.getElementById('transfMonto').focus();
      return;
    }
    
    if (estado.cuentaOrigenId === estado.cuentaDestinoId) {
      Modal.toast('Las cuentas deben ser diferentes', 'error');
      return;
    }
    
    try {
      const resultado = API.crearTransferencia({
        cuentaOrigenId: estado.cuentaOrigenId,
        cuentaDestinoId: estado.cuentaDestinoId,
        monto: monto,
        descripcion: estado.descripcion,
        fecha: estado.fecha,
      });
      
      Modal.toast('✓ Transferencia realizada');
      Modal.cerrar();
      this.refrescar();
    } catch (e) {
      Modal.toast('Error: ' + e.message, 'error');
    }
  },
  
  /* ============ ELIMINAR ============ */
  confirmarEliminar(transferenciaId, nombreOrigen, nombreDestino) {
    Modal.confirmar({
      titulo: 'Eliminar transferencia',
      mensaje: `¿Eliminar la transferencia de "${nombreOrigen}" a "${nombreDestino}"? Los saldos de ambas cuentas se restaurarán.`,
      textoConfirmar: 'Eliminar',
      tipoBoton: 'danger',
      onConfirmar: () => {
        API.eliminarTransferencia(transferenciaId);
        Modal.toast('Transferencia eliminada');
        this.refrescar();
      },
    });
  },
};
