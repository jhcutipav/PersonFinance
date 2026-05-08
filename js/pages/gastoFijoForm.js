/* ============================================
   FORMULARIO DE GASTO FIJO
   ============================================ */

const GastoFijoForm = {
  
  estado: {
    id: null,
    nombre: '',
    tipo: 'fijo',
    esSuscripcion: false,
    categoriaId: null,
    cuentaId: null,
    monto: '',
    moneda: 'PEN',
    frecuencia: 'mensual',
    diaCobro: 1,
    icono: '💰',
    color: 'blue',
    activo: true,
  },
  
  onGuardado: null,
  
  abrir(id = null, onGuardado = null) {
    this.onGuardado = onGuardado;
    
    if (id) {
      const g = API.obtenerGastoFijoPorId(id);
      if (!g) return;
      this.estado = { ...g };
    } else {
      const cuentas = API.obtenerCuentas();
      this.estado = {
        id: null,
        nombre: '',
        tipo: 'fijo',
        esSuscripcion: false,
        categoriaId: null,
        cuentaId: cuentas[0] ? cuentas[0].id : null,
        monto: '',
        moneda: cuentas[0] ? cuentas[0].moneda : 'PEN',
        frecuencia: 'mensual',
        diaCobro: new Date().getDate(),
        icono: '💰',
        color: 'blue',
        activo: true,
      };
    }
    
    Modal.abrir({
      titulo: id ? 'Editar gasto fijo' : 'Nuevo gasto fijo',
      contenido: this.renderForm(),
    });
    
    this.configurarEventos();
  },
  
  renderForm() {
    const cuentas = API.obtenerCuentas();
    const categorias = API.obtenerCategorias({ tipo: 'egreso', soloPrincipales: true });
    
    return `
      <form id="gastoForm" onsubmit="return false;">
        
        <!-- Tipo: fijo o suscripción -->
        <div class="type-selector" style="margin-bottom: var(--space-md);">
          <button type="button" class="type-option ${!this.estado.esSuscripcion ? 'active expense' : ''}" data-suscripcion="false">
            🔒 Gasto fijo
          </button>
          <button type="button" class="type-option ${this.estado.esSuscripcion ? 'active income' : ''}" data-suscripcion="true">
            📺 Suscripción
          </button>
        </div>
        
        <!-- Nombre -->
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input type="text" class="form-input" id="gastoNombre" 
                 placeholder="Ej: Netflix, Recibo de luz, Alquiler" 
                 value="${this.estado.nombre}" maxlength="40" autofocus>
        </div>
        
        <!-- Monto -->
        <div class="form-group">
          <label class="form-label">Monto ${this.estado.tipo === 'variable' ? '(estimado/inicial)' : ''}</label>
          <div class="trans-modal-amount" style="margin:0;">
            <input type="number" id="gastoMonto" class="trans-modal-amount-input"
                   placeholder="0.00" step="0.01" min="0"
                   value="${this.estado.monto}" inputmode="decimal">
            <div class="trans-modal-amount-currency" id="gastoCurrencyLabel">
              ${Formato.SIMBOLOS[this.estado.moneda] || 'S/'}
            </div>
          </div>
        </div>
        
        <!-- Tipo de monto: fijo o variable -->
        <div class="form-group">
          <label class="form-label">Tipo de monto</label>
          <div class="type-selector" style="grid-template-columns: 1fr 1fr;">
            <button type="button" class="type-option ${this.estado.tipo === 'fijo' ? 'active' : ''}" data-tipo="fijo">
              🔒 Fijo (siempre el mismo)
            </button>
            <button type="button" class="type-option ${this.estado.tipo === 'variable' ? 'active' : ''}" data-tipo="variable">
              📊 Variable (cambia mes a mes)
            </button>
          </div>
        </div>
        
        <!-- Cuenta y categoría -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Cuenta de cobro</label>
            <select class="form-select" id="gastoCuenta">
              ${cuentas.map(c => `
                <option value="${c.id}" ${this.estado.cuentaId === c.id ? 'selected' : ''}>
                  ${c.nombre} (${c.moneda})
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Categoría</label>
            <select class="form-select" id="gastoCategoria">
              <option value="">Seleccionar...</option>
              ${categorias.map(c => `
                <option value="${c.id}" ${this.estado.categoriaId === c.id ? 'selected' : ''}>
                  ${c.icono} ${c.nombre}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
        
        <!-- Día de cobro y frecuencia -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Día de cobro (1-31)</label>
            <input type="number" class="form-input" id="gastoDia" 
                   value="${this.estado.diaCobro}" min="1" max="31">
            <div class="form-helper">Día del mes en que se cobra</div>
          </div>
          <div class="form-group">
            <label class="form-label">Frecuencia</label>
            <select class="form-select" id="gastoFrecuencia">
              <option value="mensual" ${this.estado.frecuencia === 'mensual' ? 'selected' : ''}>Mensual</option>
              <option value="trimestral" ${this.estado.frecuencia === 'trimestral' ? 'selected' : ''}>Trimestral</option>
              <option value="semestral" ${this.estado.frecuencia === 'semestral' ? 'selected' : ''}>Semestral</option>
              <option value="anual" ${this.estado.frecuencia === 'anual' ? 'selected' : ''}>Anual</option>
            </select>
          </div>
        </div>
        
        <!-- Activo (toggle) -->
        ${this.estado.id ? `
          <div class="form-group">
            <label class="cuotas-toggle">
              <input type="checkbox" id="gastoActivo" ${this.estado.activo ? 'checked' : ''}>
              <span>Compromiso activo</span>
            </label>
            <div class="form-helper">Si lo desactivas, no aparecerá en próximos pagos</div>
          </div>
        ` : ''}
        
        <!-- Acciones -->
        <div class="modal-actions">
          ${this.estado.id ? `
            <button type="button" class="btn-danger" id="btnEliminarGasto">Eliminar</button>
          ` : ''}
          <button type="button" class="btn-secondary" onclick="Modal.cerrar()">Cancelar</button>
          <button type="button" class="btn-primary" id="btnGuardarGasto">
            ${this.estado.id ? 'Guardar cambios' : 'Crear'}
          </button>
        </div>
      </form>
    `;
  },
  
  configurarEventos() {
    // Tipo: suscripción
    document.querySelectorAll('.type-option[data-suscripcion]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.estado.esSuscripcion = btn.dataset.suscripcion === 'true';
        document.querySelectorAll('.type-option[data-suscripcion]').forEach(b => {
          b.classList.toggle('active', b.dataset.suscripcion === btn.dataset.suscripcion);
          b.classList.toggle('expense', b.dataset.suscripcion === 'false' && b.classList.contains('active'));
          b.classList.toggle('income', b.dataset.suscripcion === 'true' && b.classList.contains('active'));
        });
      });
    });
    
    // Tipo: fijo o variable
    document.querySelectorAll('.type-option[data-tipo]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.estado.tipo = btn.dataset.tipo;
        document.querySelectorAll('.type-option[data-tipo]').forEach(b => {
          b.classList.toggle('active', b.dataset.tipo === this.estado.tipo);
        });
      });
    });
    
    // Inputs
    document.getElementById('gastoNombre').addEventListener('input', (e) => {
      this.estado.nombre = e.target.value;
    });
    
    document.getElementById('gastoMonto').addEventListener('input', (e) => {
      this.estado.monto = e.target.value;
    });
    
    document.getElementById('gastoCuenta').addEventListener('change', (e) => {
      this.estado.cuentaId = parseInt(e.target.value);
      const cuenta = API.obtenerCuentaPorId(this.estado.cuentaId);
      if (cuenta) {
        this.estado.moneda = cuenta.moneda;
        document.getElementById('gastoCurrencyLabel').textContent = Formato.SIMBOLOS[cuenta.moneda] || cuenta.moneda;
      }
    });
    
    document.getElementById('gastoCategoria').addEventListener('change', (e) => {
      this.estado.categoriaId = parseInt(e.target.value);
      // Heredar icono y color de la categoría
      const cat = API.obtenerCategoriaPorId(this.estado.categoriaId);
      if (cat) {
        this.estado.icono = cat.icono;
        this.estado.color = cat.color;
      }
    });
    
    document.getElementById('gastoDia').addEventListener('input', (e) => {
      this.estado.diaCobro = parseInt(e.target.value);
    });
    
    document.getElementById('gastoFrecuencia').addEventListener('change', (e) => {
      this.estado.frecuencia = e.target.value;
    });
    
    const activoEl = document.getElementById('gastoActivo');
    if (activoEl) {
      activoEl.addEventListener('change', (e) => {
        this.estado.activo = e.target.checked;
      });
    }
    
    // Botones
    document.getElementById('btnGuardarGasto').addEventListener('click', () => this.guardar());
    
    const btnEliminar = document.getElementById('btnEliminarGasto');
    if (btnEliminar) {
      btnEliminar.addEventListener('click', () => this.confirmarEliminar());
    }
  },
  
  guardar() {
    if (!this.estado.nombre || !this.estado.nombre.trim()) {
      Modal.toast('Ingresa un nombre', 'error');
      document.getElementById('gastoNombre').focus();
      return;
    }
    
    const monto = parseFloat(this.estado.monto);
    if (!monto || monto <= 0) {
      Modal.toast('Ingresa un monto válido', 'error');
      document.getElementById('gastoMonto').focus();
      return;
    }
    
    if (!this.estado.cuentaId) {
      Modal.toast('Selecciona una cuenta', 'error');
      return;
    }
    
    if (!this.estado.categoriaId) {
      Modal.toast('Selecciona una categoría', 'error');
      return;
    }
    
    try {
      if (this.estado.id) {
        API.actualizarGastoFijo(this.estado.id, this.estado);
        Modal.toast('✓ Actualizado');
      } else {
        API.crearGastoFijo(this.estado);
        Modal.toast('✓ Creado');
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
        titulo: 'Eliminar gasto fijo',
        mensaje: `¿Eliminar "${this.estado.nombre}"? Las transacciones ya registradas no se verán afectadas.`,
        textoConfirmar: 'Eliminar',
        tipoBoton: 'danger',
        onConfirmar: () => {
          API.eliminarGastoFijo(this.estado.id);
          Modal.toast('Eliminado');
          if (this.onGuardado) this.onGuardado();
        },
      });
    }, 250);
  },
};
