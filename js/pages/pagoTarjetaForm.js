/* ============================================
   FORMULARIO DE PAGO DE TARJETA
   ============================================ */

const PagoTarjetaForm = {
  
  estado: {
    tarjetaId: null,
    cuentaOrigenId: null,
    monto: '',
    fecha: '',
    descripcion: '',
    tipoPago: 'total', // total | minimo | personalizado
  },
  
  onGuardado: null,
  
  abrir(tarjetaId, onGuardado = null) {
    this.onGuardado = onGuardado;
    
    const tarjeta = API.obtenerTarjetaPorId(tarjetaId);
    if (!tarjeta) return;
    
    // Calcular monto facturado (lo que debe pagar)
    const transacciones = API.obtenerTransaccionesTarjeta(tarjetaId);
    const montoFacturado = TarjetaUtils.calcularMontoFacturado(tarjeta, transacciones);
    const ciclo = API.obtenerCicloPendiente(tarjetaId);
    
    // Determinar valores por defecto
    const totalPagar = ciclo ? ciclo.montoFacturado : montoFacturado;
    const minimoPagar = ciclo ? ciclo.pagoMinimo : Math.max(totalPagar * 0.05, 50);
    
    // Cuentas que NO sean de crédito y de la misma moneda primero
    const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito');
    const cuentaPreferida = cuentas.find(c => c.moneda === tarjeta.moneda) || cuentas[0];
    
    this.estado = {
      tarjetaId,
      tarjeta,
      cuentaOrigenId: cuentaPreferida ? cuentaPreferida.id : null,
      monto: totalPagar.toFixed(2),
      fecha: new Date().toISOString().split('T')[0],
      descripcion: `Pago tarjeta ${tarjeta.nombre}`,
      tipoPago: 'total',
      totalPagar,
      minimoPagar,
    };
    
    Modal.abrir({
      titulo: '💵 Pagar tarjeta',
      contenido: this.renderForm(),
    });
    
    this.configurarEventos();
  },
  
  renderForm() {
    const t = this.estado.tarjeta;
    
    return `
      <form id="pagoForm" onsubmit="return false;">
        
        <!-- Info de la tarjeta -->
        <div style="text-align:center;margin-bottom:var(--space-md);">
          <div style="font-size:0.75rem;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;">Pagando</div>
          <div style="font-size:1rem;font-weight:600;margin-top:4px;">${t.nombre}</div>
          <div style="font-size:0.75rem;color:var(--text-tertiary);">•••• ${t.ultimosDigitos}</div>
        </div>
        
        <!-- Sugerencias rápidas -->
        <div class="form-group">
          <label class="form-label">¿Cuánto quieres pagar?</label>
          <div class="pago-suggestions">
            <button type="button" class="pago-sugg-btn ${this.estado.tipoPago === 'total' ? 'selected' : ''}" data-tipo="total">
              <div class="pago-sugg-label">Pago total</div>
              <div class="pago-sugg-amount">${Formato.formatearMoneda(this.estado.totalPagar, t.moneda)}</div>
            </button>
            <button type="button" class="pago-sugg-btn ${this.estado.tipoPago === 'minimo' ? 'selected' : ''}" data-tipo="minimo">
              <div class="pago-sugg-label">Pago mínimo</div>
              <div class="pago-sugg-amount">${Formato.formatearMoneda(this.estado.minimoPagar, t.moneda)}</div>
            </button>
            <button type="button" class="pago-sugg-btn ${this.estado.tipoPago === 'personalizado' ? 'selected' : ''}" data-tipo="personalizado">
              <div class="pago-sugg-label">Otro monto</div>
              <div class="pago-sugg-amount">Personalizado</div>
            </button>
          </div>
        </div>
        
        <!-- Monto -->
        <div class="trans-modal-amount" style="margin-bottom:var(--space-md);">
          <input type="number" 
                 id="pagoMonto" 
                 class="trans-modal-amount-input"
                 placeholder="0.00"
                 step="0.01"
                 min="0"
                 value="${this.estado.monto}"
                 inputmode="decimal">
          <div class="trans-modal-amount-currency">${Formato.SIMBOLOS[t.moneda]}</div>
        </div>
        
        <!-- Cuenta de origen -->
        <div class="form-group">
          <label class="form-label">Pagar desde</label>
          <select class="form-select" id="pagoCuenta">
            ${this.renderOpcionesCuentas()}
          </select>
          <div id="pagoConversionInfo"></div>
        </div>
        
        <!-- Fecha y descripción -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" class="form-input" id="pagoFecha" value="${this.estado.fecha}">
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <input type="text" class="form-input" id="pagoDesc" value="${this.estado.descripcion}" maxlength="50">
          </div>
        </div>
        
        <!-- Advertencia si es pago mínimo -->
        ${this.estado.tipoPago === 'minimo' ? `
          <div class="payment-alert" style="margin-top:0;">
            <div class="info">
              <div class="title">⚠ Pago mínimo</div>
              <div class="desc" style="color:var(--text-secondary);">El saldo restante generará intereses de hasta ${(t.tasaTEA * 100).toFixed(1)}% TEA</div>
            </div>
          </div>
        ` : ''}
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="Modal.cerrar()">Cancelar</button>
          <button type="button" class="btn-primary" id="btnConfirmarPago">Confirmar pago</button>
        </div>
      </form>
    `;
  },
  
  renderOpcionesCuentas() {
    const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito');
    return cuentas.map(c => `
      <option value="${c.id}" ${this.estado.cuentaOrigenId === c.id ? 'selected' : ''}>
        ${c.nombre} - ${Formato.formatearMoneda(c.saldo, c.moneda)}
      </option>
    `).join('');
  },
  
  configurarEventos() {
    // Sugerencias
    document.querySelectorAll('.pago-sugg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tipo = btn.dataset.tipo;
        this.estado.tipoPago = tipo;
        
        if (tipo === 'total') {
          this.estado.monto = this.estado.totalPagar.toFixed(2);
          document.getElementById('pagoMonto').value = this.estado.monto;
        } else if (tipo === 'minimo') {
          this.estado.monto = this.estado.minimoPagar.toFixed(2);
          document.getElementById('pagoMonto').value = this.estado.monto;
        } else {
          // Personalizado: limpiar y enfocar
          document.getElementById('pagoMonto').value = '';
          document.getElementById('pagoMonto').focus();
        }
        
        this.refrescarSugerencias();
      });
    });
    
    // Monto
    document.getElementById('pagoMonto').addEventListener('input', (e) => {
      this.estado.monto = e.target.value;
      this.estado.tipoPago = 'personalizado';
      this.refrescarSugerencias();
      this.actualizarConversion();
    });
    
    // Cuenta
    document.getElementById('pagoCuenta').addEventListener('change', (e) => {
      this.estado.cuentaOrigenId = parseInt(e.target.value);
      this.actualizarConversion();
    });
    
    // Fecha y descripción
    document.getElementById('pagoFecha').addEventListener('change', (e) => {
      this.estado.fecha = e.target.value;
    });
    document.getElementById('pagoDesc').addEventListener('input', (e) => {
      this.estado.descripcion = e.target.value;
    });
    
    // Confirmar
    document.getElementById('btnConfirmarPago').addEventListener('click', () => this.confirmar());
    
    // Mostrar info de conversión inicial si aplica
    this.actualizarConversion();
  },
  
  refrescarSugerencias() {
    document.querySelectorAll('.pago-sugg-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.tipo === this.estado.tipoPago);
    });
  },
  
  /**
   * Si la cuenta origen tiene moneda distinta, mostrar conversión
   */
  actualizarConversion() {
    const info = document.getElementById('pagoConversionInfo');
    if (!info) return;
    
    const cuenta = API.obtenerCuentaPorId(this.estado.cuentaOrigenId);
    const tarjeta = this.estado.tarjeta;
    
    if (!cuenta || !tarjeta || cuenta.moneda === tarjeta.moneda) {
      info.innerHTML = '';
      return;
    }
    
    const monto = parseFloat(this.estado.monto) || 0;
    const convertido = Formato.convertir(monto, cuenta.moneda, tarjeta.moneda);
    
    info.innerHTML = `
      <div class="pago-conversion">
        💱 Pagas <strong>${Formato.formatearMoneda(monto, cuenta.moneda)}</strong> de tu cuenta,
        equivalente a <strong>${Formato.formatearMoneda(convertido, tarjeta.moneda)}</strong> en la tarjeta
        (TC: 1 USD = ${Formato.TIPO_CAMBIO.USD_PEN} PEN)
      </div>
    `;
  },
  
  confirmar() {
    const monto = parseFloat(this.estado.monto);
    if (!monto || monto <= 0) {
      Modal.toast('Ingresa un monto válido', 'error');
      document.getElementById('pagoMonto').focus();
      return;
    }
    
    if (!this.estado.cuentaOrigenId) {
      Modal.toast('Selecciona una cuenta de origen', 'error');
      return;
    }
    
    // Verificar saldo suficiente
    const cuenta = API.obtenerCuentaPorId(this.estado.cuentaOrigenId);
    if (cuenta.saldo < monto) {
      Modal.confirmar({
        titulo: 'Saldo insuficiente',
        mensaje: `La cuenta "${cuenta.nombre}" solo tiene ${Formato.formatearMoneda(cuenta.saldo, cuenta.moneda)}. ¿Registrar igual el pago?`,
        textoConfirmar: 'Registrar igual',
        onConfirmar: () => this.ejecutarPago(),
      });
      return;
    }
    
    this.ejecutarPago();
  },
  
  ejecutarPago() {
    try {
      API.registrarPagoTarjeta(this.estado.tarjetaId, {
        cuentaOrigenId: this.estado.cuentaOrigenId,
        monto: this.estado.monto,
        fecha: this.estado.fecha,
        descripcion: this.estado.descripcion,
      });
      
      Modal.toast('Pago registrado ✓');
      Modal.cerrar();
      if (this.onGuardado) this.onGuardado();
    } catch (e) {
      Modal.toast('Error: ' + e.message, 'error');
    }
  },
};
