/* ============================================
   FORMULARIO DE META + PLANTILLAS
   ============================================ */

const MetaForm = {
  
  estado: {
    id: null,
    nombre: '',
    descripcion: '',
    montoObjetivo: '',
    montoActual: '0',
    moneda: 'PEN',
    fechaLimite: '',
    cuentaAhorroId: null,
    icono: '🎯',
    color: 'cyan',
    prioridad: 'media',
  },
  
  onGuardado: null,
  
  abrir(id = null, onGuardado = null) {
    this.onGuardado = onGuardado;
    
    if (id) {
      const m = API.obtenerMetaPorId(id);
      if (!m) return;
      this.estado = { ...m };
    } else {
      const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito');
      // Fecha límite por defecto: 1 año desde hoy
      const enUnAno = new Date();
      enUnAno.setFullYear(enUnAno.getFullYear() + 1);
      
      this.estado = {
        id: null,
        nombre: '',
        descripcion: '',
        montoObjetivo: '',
        montoActual: '0',
        moneda: 'PEN',
        fechaLimite: enUnAno.toISOString().split('T')[0],
        cuentaAhorroId: cuentas[0] ? cuentas[0].id : null,
        icono: '🎯',
        color: 'cyan',
        prioridad: 'media',
      };
    }
    
    Modal.abrir({
      titulo: id ? 'Editar meta' : 'Nueva meta de ahorro',
      contenido: this.renderForm(),
    });
    
    this.configurarEventos();
  },
  
  renderForm() {
    const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito');
    const iconos = ['🎯', '🛡️', '✈️', '🏠', '🚗', '💻', '💍', '🎓', '👶', '🏥', '🎁', '💰'];
    
    return `
      <form id="metaForm" onsubmit="return false;">
        
        <!-- Icono -->
        <div class="form-group">
          <label class="form-label">Icono</label>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${iconos.map(ic => `
              <button type="button" class="type-option icono-pick-meta" 
                      style="padding:8px 12px;flex:none;font-size:1.25rem;"
                      data-icono="${ic}">
                ${ic}
              </button>
            `).join('')}
          </div>
        </div>
        
        <!-- Nombre -->
        <div class="form-group">
          <label class="form-label">Nombre de la meta</label>
          <input type="text" class="form-input" id="metaNombre" 
                 placeholder="Ej: Vacaciones, Casa propia, Fondo de emergencia" 
                 value="${this.estado.nombre}" maxlength="50" autofocus>
        </div>
        
        <!-- Descripción -->
        <div class="form-group">
          <label class="form-label">Descripción (opcional)</label>
          <input type="text" class="form-input" id="metaDescripcion" 
                 placeholder="Detalle o motivación" 
                 value="${this.estado.descripcion}" maxlength="100">
        </div>
        
        <!-- Monto objetivo y moneda -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Monto objetivo</label>
            <div class="trans-modal-amount" style="margin:0;">
              <input type="number" id="metaMonto" class="trans-modal-amount-input"
                     placeholder="0.00" step="0.01" min="0"
                     value="${this.estado.montoObjetivo}" inputmode="decimal">
              <div class="trans-modal-amount-currency" id="metaCurrencyLabel">
                ${Formato.SIMBOLOS[this.estado.moneda] || 'S/'}
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Moneda</label>
            <select class="form-select" id="metaMoneda">
              <option value="PEN" ${this.estado.moneda === 'PEN' ? 'selected' : ''}>Soles (S/)</option>
              <option value="USD" ${this.estado.moneda === 'USD' ? 'selected' : ''}>Dólares (US$)</option>
            </select>
          </div>
        </div>
        
        <!-- Monto actual (solo al editar) -->
        ${this.estado.id ? `
          <div class="form-group">
            <label class="form-label">Monto actual ahorrado</label>
            <div class="trans-modal-amount" style="margin:0;">
              <input type="number" id="metaMontoActual" class="trans-modal-amount-input"
                     placeholder="0.00" step="0.01" min="0"
                     value="${this.estado.montoActual}" inputmode="decimal">
              <div class="trans-modal-amount-currency">${Formato.SIMBOLOS[this.estado.moneda] || 'S/'}</div>
            </div>
            <div class="form-helper">⚠ Solo edita esto si necesitas hacer una corrección</div>
          </div>
        ` : `
          <div class="form-group">
            <label class="form-label">Monto inicial (opcional)</label>
            <div class="trans-modal-amount" style="margin:0;">
              <input type="number" id="metaMontoActual" class="trans-modal-amount-input"
                     placeholder="0.00" step="0.01" min="0"
                     value="${this.estado.montoActual}" inputmode="decimal">
              <div class="trans-modal-amount-currency">${Formato.SIMBOLOS[this.estado.moneda] || 'S/'}</div>
            </div>
            <div class="form-helper">Si ya tienes algo ahorrado para esta meta</div>
          </div>
        `}
        
        <!-- Fecha límite y prioridad -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fecha límite</label>
            <input type="date" class="form-input" id="metaFecha" value="${this.estado.fechaLimite}">
          </div>
          <div class="form-group">
            <label class="form-label">Prioridad</label>
            <select class="form-select" id="metaPrioridad">
              <option value="alta" ${this.estado.prioridad === 'alta' ? 'selected' : ''}>🔥 Alta</option>
              <option value="media" ${this.estado.prioridad === 'media' ? 'selected' : ''}>⚡ Media</option>
              <option value="baja" ${this.estado.prioridad === 'baja' ? 'selected' : ''}>📌 Baja</option>
            </select>
          </div>
        </div>
        
        <!-- Cuenta de ahorro -->
        <div class="form-group">
          <label class="form-label">Cuenta donde ahorras</label>
          <select class="form-select" id="metaCuenta">
            ${cuentas.map(c => `
              <option value="${c.id}" ${this.estado.cuentaAhorroId === c.id ? 'selected' : ''}>
                ${c.nombre} (${c.moneda})
              </option>
            `).join('')}
          </select>
          <div class="form-helper">Solo es informativo, no afecta tu saldo</div>
        </div>
        
        <!-- Acciones -->
        <div class="modal-actions">
          ${this.estado.id ? `
            <button type="button" class="btn-danger" id="btnEliminarMeta">Eliminar</button>
          ` : ''}
          <button type="button" class="btn-secondary" onclick="Modal.cerrar()">Cancelar</button>
          <button type="button" class="btn-primary" id="btnGuardarMeta">
            ${this.estado.id ? 'Guardar cambios' : 'Crear meta'}
          </button>
        </div>
      </form>
    `;
  },
  
  configurarEventos() {
    document.getElementById('metaNombre').addEventListener('input', (e) => {
      this.estado.nombre = e.target.value;
    });
    
    document.getElementById('metaDescripcion').addEventListener('input', (e) => {
      this.estado.descripcion = e.target.value;
    });
    
    document.getElementById('metaMonto').addEventListener('input', (e) => {
      this.estado.montoObjetivo = e.target.value;
    });
    
    document.getElementById('metaMontoActual').addEventListener('input', (e) => {
      this.estado.montoActual = e.target.value;
    });
    
    document.getElementById('metaMoneda').addEventListener('change', (e) => {
      this.estado.moneda = e.target.value;
      const lbl = document.getElementById('metaCurrencyLabel');
      if (lbl) lbl.textContent = Formato.SIMBOLOS[this.estado.moneda] || this.estado.moneda;
    });
    
    document.getElementById('metaFecha').addEventListener('change', (e) => {
      this.estado.fechaLimite = e.target.value;
    });
    
    document.getElementById('metaPrioridad').addEventListener('change', (e) => {
      this.estado.prioridad = e.target.value;
    });
    
    document.getElementById('metaCuenta').addEventListener('change', (e) => {
      this.estado.cuentaAhorroId = parseInt(e.target.value);
    });
    
    // Iconos
    document.querySelectorAll('.icono-pick-meta').forEach(btn => {
      if (btn.dataset.icono === this.estado.icono) btn.classList.add('active');
      btn.addEventListener('click', () => {
        this.estado.icono = btn.dataset.icono;
        document.querySelectorAll('.icono-pick-meta').forEach(b => {
          b.classList.toggle('active', b.dataset.icono === this.estado.icono);
        });
      });
    });
    
    // Botones
    document.getElementById('btnGuardarMeta').addEventListener('click', () => this.guardar());
    
    const btnEliminar = document.getElementById('btnEliminarMeta');
    if (btnEliminar) {
      btnEliminar.addEventListener('click', () => this.confirmarEliminar());
    }
  },
  
  guardar() {
    if (!this.estado.nombre || !this.estado.nombre.trim()) {
      Modal.toast('Ingresa un nombre', 'error');
      document.getElementById('metaNombre').focus();
      return;
    }
    
    const objetivo = parseFloat(this.estado.montoObjetivo);
    if (!objetivo || objetivo <= 0) {
      Modal.toast('Ingresa un monto objetivo válido', 'error');
      document.getElementById('metaMonto').focus();
      return;
    }
    
    if (!this.estado.fechaLimite) {
      Modal.toast('Selecciona una fecha límite', 'error');
      return;
    }
    
    if (!this.estado.cuentaAhorroId) {
      Modal.toast('Selecciona una cuenta', 'error');
      return;
    }
    
    try {
      if (this.estado.id) {
        API.actualizarMeta(this.estado.id, this.estado);
        Modal.toast('✓ Actualizada');
      } else {
        API.crearMeta(this.estado);
        Modal.toast('✓ Meta creada');
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
        titulo: 'Eliminar meta',
        mensaje: `¿Eliminar "${this.estado.nombre}"? Esta acción no se puede deshacer.`,
        textoConfirmar: 'Eliminar',
        tipoBoton: 'danger',
        onConfirmar: () => {
          API.eliminarMeta(this.estado.id);
          Modal.toast('Eliminada');
          if (this.onGuardado) this.onGuardado();
        },
      });
    }, 250);
  },
  
  /* ============ PLANTILLAS ============ */
  abrirPlantillas(onGuardado) {
    this.onGuardado = onGuardado;
    
    Modal.abrir({
      titulo: 'Plantillas de metas',
      contenido: `
        <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:var(--space-md);">
          Usa una plantilla para empezar más rápido. Después puedes personalizar todo.
        </p>
        
        <div class="metas-plantillas-grid">
          <button type="button" class="meta-plantilla-card" data-plantilla="emergencia">
            <div class="meta-plantilla-icon">🛡️</div>
            <div class="meta-plantilla-name">Fondo de emergencia</div>
            <div class="meta-plantilla-desc">3-6 meses de gastos como respaldo. Lo más importante.</div>
          </button>
          
          <button type="button" class="meta-plantilla-card" data-plantilla="vacaciones">
            <div class="meta-plantilla-icon">✈️</div>
            <div class="meta-plantilla-name">Vacaciones</div>
            <div class="meta-plantilla-desc">Para tus próximas vacaciones soñadas.</div>
          </button>
          
          <button type="button" class="meta-plantilla-card" data-plantilla="compra">
            <div class="meta-plantilla-icon">🛍️</div>
            <div class="meta-plantilla-name">Compra grande</div>
            <div class="meta-plantilla-desc">Laptop, electrodoméstico, mueble, etc.</div>
          </button>
          
          <button type="button" class="meta-plantilla-card" data-plantilla="casa">
            <div class="meta-plantilla-icon">🏠</div>
            <div class="meta-plantilla-name">Casa propia</div>
            <div class="meta-plantilla-desc">Cuota inicial para crédito hipotecario.</div>
          </button>
          
          <button type="button" class="meta-plantilla-card" data-plantilla="auto">
            <div class="meta-plantilla-icon">🚗</div>
            <div class="meta-plantilla-name">Auto</div>
            <div class="meta-plantilla-desc">Vehículo nuevo o seminuevo.</div>
          </button>
          
          <button type="button" class="meta-plantilla-card" data-plantilla="estudios">
            <div class="meta-plantilla-icon">🎓</div>
            <div class="meta-plantilla-name">Estudios</div>
            <div class="meta-plantilla-desc">Maestría, certificación o curso.</div>
          </button>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" onclick="Modal.cerrar()">Cancelar</button>
        </div>
      `,
    });
    
    document.querySelectorAll('.meta-plantilla-card[data-plantilla]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.aplicarPlantilla(btn.dataset.plantilla);
      });
    });
  },
  
  aplicarPlantilla(tipo) {
    const enUnAno = new Date();
    enUnAno.setFullYear(enUnAno.getFullYear() + 1);
    
    const enSeisMeses = new Date();
    enSeisMeses.setMonth(enSeisMeses.getMonth() + 6);
    
    const plantillas = {
      emergencia: {
        nombre: 'Fondo de emergencia',
        descripcion: '6 meses de gastos como respaldo financiero',
        icono: '🛡️',
        color: 'cyan',
        prioridad: 'alta',
        montoObjetivo: '15000',
        fechaLimite: enUnAno.toISOString().split('T')[0],
      },
      vacaciones: {
        nombre: 'Vacaciones',
        descripcion: 'Mis próximas vacaciones',
        icono: '✈️',
        color: 'purple',
        prioridad: 'media',
        montoObjetivo: '5000',
        fechaLimite: enSeisMeses.toISOString().split('T')[0],
      },
      compra: {
        nombre: 'Compra grande',
        descripcion: '',
        icono: '🛍️',
        color: 'amber',
        prioridad: 'media',
        montoObjetivo: '3000',
        fechaLimite: enSeisMeses.toISOString().split('T')[0],
      },
      casa: {
        nombre: 'Casa propia',
        descripcion: 'Cuota inicial',
        icono: '🏠',
        color: 'green',
        prioridad: 'alta',
        montoObjetivo: '50000',
        fechaLimite: '2027-12-31',
      },
      auto: {
        nombre: 'Auto',
        descripcion: '',
        icono: '🚗',
        color: 'red',
        prioridad: 'media',
        montoObjetivo: '25000',
        fechaLimite: '2026-12-31',
      },
      estudios: {
        nombre: 'Estudios',
        descripcion: 'Educación continua',
        icono: '🎓',
        color: 'blue',
        prioridad: 'alta',
        montoObjetivo: '8000',
        fechaLimite: enUnAno.toISOString().split('T')[0],
      },
    };
    
    const plantilla = plantillas[tipo];
    if (!plantilla) return;
    
    Modal.cerrar();
    setTimeout(() => {
      // Pre-llenar el form con la plantilla
      const cuentas = API.obtenerCuentas().filter(c => c.tipo !== 'credito');
      this.estado = {
        id: null,
        ...plantilla,
        moneda: 'PEN',
        montoActual: '0',
        cuentaAhorroId: cuentas[0] ? cuentas[0].id : null,
      };
      
      Modal.abrir({
        titulo: 'Crear meta desde plantilla',
        contenido: this.renderForm(),
      });
      
      this.configurarEventos();
    }, 250);
  },
};
