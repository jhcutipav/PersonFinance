/* ============================================
   FORMULARIO DE DEUDA
   ============================================ */

const DeudaForm = {
  
  estado: {
    id: null,
    nombre: '',
    acreedor: '',
    capital: '',
    moneda: 'PEN',
    tasaTEA: '',
    plazoMeses: 12,
    cuotasPagadas: 0,
    sistema: 'frances',
    diaPago: 15,
    fechaInicio: '',
    cuentaPagoId: null,
    categoriaId: 8,
    icono: '💵',
    color: 'amber',
  },
  
  onGuardado: null,
  
  abrir(id = null, onGuardado = null) {
    this.onGuardado = onGuardado;
    
    if (id) {
      const d = API.obtenerDeudaPorId(id);
      if (!d) return;
      this.estado = { 
        ...d, 
        tasaTEA: (d.tasaTEA * 100).toString(), // Mostrar como porcentaje
      };
    } else {
      const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito');
      this.estado = {
        id: null,
        nombre: '',
        acreedor: '',
        capital: '',
        moneda: 'PEN',
        tasaTEA: '18',
        plazoMeses: 12,
        cuotasPagadas: 0,
        sistema: 'frances',
        diaPago: new Date().getDate(),
        fechaInicio: new Date().toISOString().split('T')[0],
        cuentaPagoId: cuentas[0] ? cuentas[0].id : null,
        categoriaId: 8,
        icono: '💵',
        color: 'amber',
      };
    }
    
    Modal.abrir({
      titulo: id ? 'Editar deuda' : 'Registrar deuda',
      contenido: this.renderForm(),
    });
    
    this.configurarEventos();
  },
  
  renderForm() {
    const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito');
    const iconos = ['💵', '🚗', '🏠', '🎓', '💳', '🏥', '✈️', '💼'];
    const colores = ['amber', 'red', 'blue', 'purple', 'cyan', 'green'];
    
    return `
      <form id="deudaForm" onsubmit="return false;">
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nombre del préstamo</label>
            <input type="text" class="form-input" id="deudaNombre" 
                   placeholder="Ej: Préstamo vehicular" 
                   value="${this.estado.nombre}" maxlength="40" autofocus>
          </div>
          <div class="form-group">
            <label class="form-label">Acreedor</label>
            <input type="text" class="form-input" id="deudaAcreedor" 
                   placeholder="Ej: BCP, BBVA, Particular" 
                   value="${this.estado.acreedor}" maxlength="30">
          </div>
        </div>
        
        <!-- Icono y color -->
        <div class="form-group">
          <label class="form-label">Icono</label>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${iconos.map(ic => `
              <button type="button" class="type-option icono-pick" 
                      style="padding:8px 12px;flex:none;font-size:1.25rem;"
                      data-icono="${ic}">
                ${ic}
              </button>
            `).join('')}
          </div>
        </div>
        
        <!-- Capital y moneda -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Capital total</label>
            <div class="trans-modal-amount" style="margin:0;">
              <input type="number" id="deudaCapital" class="trans-modal-amount-input"
                     placeholder="0.00" step="100" min="0"
                     value="${this.estado.capital}" inputmode="decimal">
              <div class="trans-modal-amount-currency" id="deudaCurrencyLabel">
                ${Formato.SIMBOLOS[this.estado.moneda] || 'S/'}
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Moneda</label>
            <select class="form-select" id="deudaMoneda">
              <option value="PEN" ${this.estado.moneda === 'PEN' ? 'selected' : ''}>Soles (S/)</option>
              <option value="USD" ${this.estado.moneda === 'USD' ? 'selected' : ''}>Dólares (US$)</option>
            </select>
          </div>
        </div>
        
        <!-- TEA y plazo -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tasa Efectiva Anual (TEA) %</label>
            <input type="number" class="form-input" id="deudaTEA" 
                   value="${this.estado.tasaTEA}" min="0" max="200" step="0.01" inputmode="decimal">
            <div class="form-helper">Si no la sabes, revisa tu contrato</div>
          </div>
          <div class="form-group">
            <label class="form-label">Plazo (meses)</label>
            <input type="number" class="form-input" id="deudaPlazo" 
                   value="${this.estado.plazoMeses}" min="1" max="360">
          </div>
        </div>
        
        <!-- Sistema -->
        <div class="form-group">
          <label class="form-label">Sistema de amortización</label>
          <div class="type-selector" style="grid-template-columns: 1fr 1fr;">
            <button type="button" class="type-option ${this.estado.sistema === 'frances' ? 'active' : ''}" data-sistema="frances">
              Francés (cuota fija)
            </button>
            <button type="button" class="type-option ${this.estado.sistema === 'aleman' ? 'active' : ''}" data-sistema="aleman">
              Alemán (capital fijo)
            </button>
          </div>
        </div>
        
        <!-- Fecha inicio y día de pago -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fecha de inicio</label>
            <input type="date" class="form-input" id="deudaFecha" value="${this.estado.fechaInicio}">
          </div>
          <div class="form-group">
            <label class="form-label">Día de pago (1-31)</label>
            <input type="number" class="form-input" id="deudaDia" 
                   value="${this.estado.diaPago}" min="1" max="31">
          </div>
        </div>
        
        <!-- Cuotas pagadas y cuenta -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Cuotas ya pagadas</label>
            <input type="number" class="form-input" id="deudaCuotasPagadas" 
                   value="${this.estado.cuotasPagadas}" min="0">
            <div class="form-helper">Si ya pagaste algunas antes de registrar</div>
          </div>
          <div class="form-group">
            <label class="form-label">Cuenta de pago</label>
            <select class="form-select" id="deudaCuenta">
              ${cuentas.map(c => `
                <option value="${c.id}" ${this.estado.cuentaPagoId === c.id ? 'selected' : ''}>
                  ${c.nombre}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
        
        <!-- Acciones -->
        <div class="modal-actions">
          ${this.estado.id ? `
            <button type="button" class="btn-danger" id="btnEliminarDeuda">Eliminar</button>
          ` : ''}
          <button type="button" class="btn-secondary" onclick="Modal.cerrar()">Cancelar</button>
          <button type="button" class="btn-primary" id="btnGuardarDeuda">
            ${this.estado.id ? 'Guardar cambios' : 'Registrar'}
          </button>
        </div>
      </form>
    `;
  },
  
  configurarEventos() {
    document.getElementById('deudaNombre').addEventListener('input', (e) => {
      this.estado.nombre = e.target.value;
    });
    
    document.getElementById('deudaAcreedor').addEventListener('input', (e) => {
      this.estado.acreedor = e.target.value;
    });
    
    document.getElementById('deudaCapital').addEventListener('input', (e) => {
      this.estado.capital = e.target.value;
    });
    
    document.getElementById('deudaMoneda').addEventListener('change', (e) => {
      this.estado.moneda = e.target.value;
      const lbl = document.getElementById('deudaCurrencyLabel');
      if (lbl) lbl.textContent = Formato.SIMBOLOS[this.estado.moneda] || this.estado.moneda;
    });
    
    document.getElementById('deudaTEA').addEventListener('input', (e) => {
      this.estado.tasaTEA = e.target.value;
    });
    
    document.getElementById('deudaPlazo').addEventListener('input', (e) => {
      this.estado.plazoMeses = parseInt(e.target.value) || 1;
    });
    
    document.getElementById('deudaFecha').addEventListener('change', (e) => {
      this.estado.fechaInicio = e.target.value;
    });
    
    document.getElementById('deudaDia').addEventListener('input', (e) => {
      this.estado.diaPago = parseInt(e.target.value) || 1;
    });
    
    document.getElementById('deudaCuotasPagadas').addEventListener('input', (e) => {
      this.estado.cuotasPagadas = parseInt(e.target.value) || 0;
    });
    
    document.getElementById('deudaCuenta').addEventListener('change', (e) => {
      this.estado.cuentaPagoId = parseInt(e.target.value);
    });
    
    // Sistema
    document.querySelectorAll('.type-option[data-sistema]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.estado.sistema = btn.dataset.sistema;
        document.querySelectorAll('.type-option[data-sistema]').forEach(b => {
          b.classList.toggle('active', b.dataset.sistema === this.estado.sistema);
        });
      });
    });
    
    // Iconos
    document.querySelectorAll('.icono-pick').forEach(btn => {
      // Marcar el seleccionado
      if (btn.dataset.icono === this.estado.icono) btn.classList.add('active');
      btn.addEventListener('click', () => {
        this.estado.icono = btn.dataset.icono;
        document.querySelectorAll('.icono-pick').forEach(b => {
          b.classList.toggle('active', b.dataset.icono === this.estado.icono);
        });
      });
    });
    
    // Botones
    document.getElementById('btnGuardarDeuda').addEventListener('click', () => this.guardar());
    
    const btnEliminar = document.getElementById('btnEliminarDeuda');
    if (btnEliminar) {
      btnEliminar.addEventListener('click', () => this.confirmarEliminar());
    }
  },
  
  guardar() {
    if (!this.estado.nombre || !this.estado.nombre.trim()) {
      Modal.toast('Ingresa un nombre', 'error');
      document.getElementById('deudaNombre').focus();
      return;
    }
    
    const capital = parseFloat(this.estado.capital);
    if (!capital || capital <= 0) {
      Modal.toast('Ingresa un capital válido', 'error');
      document.getElementById('deudaCapital').focus();
      return;
    }
    
    const tea = parseFloat(this.estado.tasaTEA);
    if (isNaN(tea) || tea < 0) {
      Modal.toast('Ingresa una TEA válida', 'error');
      return;
    }
    
    if (!this.estado.cuentaPagoId) {
      Modal.toast('Selecciona una cuenta de pago', 'error');
      return;
    }
    
    if (this.estado.cuotasPagadas > this.estado.plazoMeses) {
      Modal.toast('Las cuotas pagadas no pueden superar el plazo', 'error');
      return;
    }
    
    try {
      // Convertir TEA de % a decimal antes de guardar
      const datos = { ...this.estado, tasaTEA: tea / 100 };
      
      if (this.estado.id) {
        API.actualizarDeuda(this.estado.id, datos);
        Modal.toast('✓ Actualizada');
      } else {
        API.crearDeuda(datos);
        Modal.toast('✓ Registrada');
      }
      
      Modal.cerrar();
      if (this.onGuardado) this.onGuardado();
    } catch (e) {
      Modal.toast('Error: ' + e.message, 'error');
    }
  },
  
  confirmarEliminar() {
    Modal.cerrar();
    setTimeout(() => {
      Modal.confirmar({
        titulo: 'Eliminar deuda',
        mensaje: `¿Eliminar "${this.estado.nombre}"? Las transacciones de pago ya registradas se mantienen.`,
        textoConfirmar: 'Eliminar',
        tipoBoton: 'danger',
        onConfirmar: () => {
          API.eliminarDeuda(this.estado.id);
          Modal.toast('Eliminada');
          if (this.onGuardado) this.onGuardado();
        },
      });
    }, 250);
  },
};
