/* ============================================
   FORMULARIO DE TRANSACCIÓN
   Modal para crear/editar transacciones
   ============================================ */

const TransaccionForm = {
  
  // Estado del formulario
  estado: {
    id: null,           // null = crear nueva
    tipo: 'egreso',
    monto: '',
    cuentaId: null,
    categoriaPadreId: null,
    categoriaId: null,
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    enCuotas: false,
    cuotasTotal: 3,
  },
  
  onGuardado: null,
  
  /**
   * Verifica si la cuenta seleccionada es tarjeta de crédito
   */
  esCredito() {
    if (!this.estado.cuentaId) return false;
    const cuenta = API.obtenerCuentaPorId(this.estado.cuentaId);
    return cuenta && cuenta.tipo === 'credito';
  },
  
  /**
   * Devuelve el código de moneda de la cuenta actual
   */
  obtenerMonedaSimbolo() {
    if (!this.estado.cuentaId) return 'PEN';
    const cuenta = API.obtenerCuentaPorId(this.estado.cuentaId);
    return cuenta ? cuenta.moneda : 'PEN';
  },
  
  /**
   * Renderiza la sección de cuotas (solo aparece para tarjetas)
   */
  renderCuotasSection() {
    const monto = parseFloat(this.estado.monto) || 0;
    const cuotas = parseInt(this.estado.cuotasTotal) || 3;
    const cuotaMensual = monto > 0 ? (monto / cuotas).toFixed(2) : 0;
    const moneda = this.obtenerMonedaSimbolo();
    
    return `
      <div class="cuotas-section">
        <label class="cuotas-toggle">
          <input type="checkbox" id="cuotasCheck" ${this.estado.enCuotas ? 'checked' : ''}>
          <span>Compra en cuotas</span>
        </label>
        
        <div id="cuotasConfig" style="${this.estado.enCuotas ? '' : 'display:none;'}">
          <div class="cuotas-config">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Número de cuotas</label>
              <select class="form-select" id="cuotasNum">
                ${[2, 3, 6, 9, 12, 18, 24, 36].map(n => `
                  <option value="${n}" ${this.estado.cuotasTotal === n ? 'selected' : ''}>${n} cuotas</option>
                `).join('')}
              </select>
            </div>
          </div>
          
          ${monto > 0 ? `
            <div class="cuotas-info">
              💳 Cada cuota será de aproximadamente <strong>${Formato.formatearMoneda(cuotaMensual, moneda)}</strong> mensuales durante <strong>${cuotas} meses</strong>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },
  
  /**
   * Abre el modal. Si recibe ID, carga la transacción para editar.
   */
  abrir(id = null, onGuardado = null) {
    this.onGuardado = onGuardado;
    
    // Resetear o cargar
    if (id) {
      const trans = API.obtenerTransaccionPorId(id);
      if (!trans) return;
      
      const cat = API.obtenerCategoriaPorId(trans.categoriaId);
      const padre = cat && cat.categoriaPadreId ? cat.categoriaPadreId : null;
      
      this.estado = {
        id: trans.id,
        tipo: trans.tipo,
        monto: trans.monto,
        cuentaId: trans.cuentaId,
        categoriaPadreId: padre || trans.categoriaId,
        categoriaId: trans.categoriaId,
        descripcion: trans.descripcion || '',
        fecha: trans.fecha,
      };
    } else {
      // Crear nueva: defaults inteligentes
      const cuentas = API.obtenerCuentas();
      this.estado = {
        id: null,
        tipo: 'egreso',
        monto: '',
        cuentaId: cuentas[0] ? cuentas[0].id : null,
        categoriaPadreId: null,
        categoriaId: null,
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
      };
    }
    
    Modal.abrir({
      titulo: id ? 'Editar transacción' : 'Nueva transacción',
      contenido: this.renderForm(),
    });
    
    this.configurarEventos();
  },
  
  renderForm() {
    return `
      <form id="transForm" onsubmit="return false;">
        
        <!-- Selector de tipo -->
        <div class="type-selector">
          <button type="button" class="type-option ${this.estado.tipo === 'egreso' ? 'active expense' : ''}" data-tipo="egreso">
            ↓ Egreso
          </button>
          <button type="button" class="type-option ${this.estado.tipo === 'ingreso' ? 'active income' : ''}" data-tipo="ingreso">
            ↑ Ingreso
          </button>
          <button type="button" class="type-option ${this.estado.tipo === 'transferencia' ? 'active transfer' : ''}" data-tipo="transferencia" disabled style="opacity:0.4;cursor:not-allowed;" title="Próximamente">
            ⇄ Transferir
          </button>
        </div>
        
        <!-- Monto destacado -->
        <div class="trans-modal-amount" style="margin-top: var(--space-lg);">
          <input type="number" 
                 id="transMonto" 
                 class="trans-modal-amount-input"
                 placeholder="0.00"
                 step="0.01"
                 min="0"
                 value="${this.estado.monto}"
                 inputmode="decimal">
          <div class="trans-modal-amount-currency" id="transCurrencyLabel">
            ${this.obtenerMonedaCuentaActual()}
          </div>
        </div>
        
        <!-- Cuenta -->
        <div class="form-group">
          <label class="form-label">Cuenta</label>
          <select class="form-select" id="transCuenta">
            ${this.renderOpcionesCuentas()}
          </select>
        </div>
        
        <!-- Fecha -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" class="form-input" id="transFecha" value="${this.estado.fecha}" max="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <input type="text" class="form-input" id="transDescripcion" placeholder="Ej: Almuerzo" value="${this.estado.descripcion}">
          </div>
        </div>
        
        <!-- Categoría -->
        <div class="form-group">
          <label class="form-label">
            Categoría
            <button type="button" onclick="Categorias.abrirModalNueva('${this.estado.tipo}')" style="float:right;background:none;border:none;color:var(--accent-cyan);cursor:pointer;font-size:0.75rem;font-family:inherit;">+ Nueva categoría</button>
          </label>
          <div class="category-grid" id="categoryGrid">
            ${this.renderCategorias()}
          </div>
        </div>
        
        <!-- Subcategorías (aparece cuando hay categoría padre seleccionada) -->
        <div class="form-group" id="subcategoryGroup" style="${this.estado.categoriaPadreId ? '' : 'display:none;'}">
          <label class="form-label">
            Subcategoría
            <span style="float:right;font-weight:400;color:var(--text-tertiary);font-size:0.75rem;">(opcional)</span>
          </label>
          <div class="subcategory-chips" id="subcategoryChips">
            ${this.renderSubcategorias()}
          </div>
        </div>
        
        <!-- Cuotas (solo si la cuenta es tarjeta de crédito) -->
        <div id="cuotasSection" style="${this.esCredito() ? '' : 'display:none;'}">
          ${this.renderCuotasSection()}
        </div>
        
        <!-- Acciones -->
        <div class="modal-actions">
          ${this.estado.id ? `
            <button type="button" class="btn-danger" id="btnEliminar">Eliminar</button>
          ` : ''}
          <button type="button" class="btn-secondary" onclick="Modal.cerrar()">Cancelar</button>
          <button type="button" class="btn-primary" id="btnGuardar">${this.estado.id ? 'Guardar cambios' : 'Crear transacción'}</button>
        </div>
      </form>
    `;
  },
  
  renderOpcionesCuentas() {
    const cuentas = API.obtenerCuentas();
    return cuentas.map(c => {
      const tipoLabel = c.tipo === 'credito' ? ' 💳' : '';
      return `
        <option value="${c.id}" ${this.estado.cuentaId === c.id ? 'selected' : ''}>
          ${c.nombre}${tipoLabel} (${c.moneda})
        </option>
      `;
    }).join('');
  },
  
  renderCategorias() {
    const principales = API.obtenerCategorias({ 
      tipo: this.estado.tipo, 
      soloPrincipales: true 
    });
    
    if (principales.length === 0) {
      return '<div style="grid-column:1/-1;text-align:center;color:var(--text-tertiary);padding:var(--space-md);font-size:0.8125rem;">No hay categorías. Crea una con el botón de arriba.</div>';
    }
    
    return principales.map(cat => {
      const seleccionada = this.estado.categoriaPadreId === cat.id;
      return `
        <button type="button" class="category-option ${seleccionada ? 'selected' : ''}" data-cat-id="${cat.id}">
          <span class="icon">${cat.icono}</span>
          <span class="name">${cat.nombre}</span>
        </button>
      `;
    }).join('');
  },
  
  renderSubcategorias() {
    if (!this.estado.categoriaPadreId) return '';
    
    const subs = API.obtenerSubcategorias(this.estado.categoriaPadreId);
    
    let html = '';
    
    if (subs.length === 0) {
      html += '<span class="subcategory-empty">Sin subcategorías. Puedes agregar una.</span>';
    } else {
      // Chip "general" para usar la categoría padre directamente
      const padreSeleccionado = this.estado.categoriaId === this.estado.categoriaPadreId;
      html += `
        <button type="button" class="subcategory-chip ${padreSeleccionado ? 'selected' : ''}" data-sub-id="${this.estado.categoriaPadreId}">
          General
        </button>
      `;
      
      // Chips de subcategorías
      subs.forEach(sub => {
        const seleccionada = this.estado.categoriaId === sub.id;
        html += `
          <button type="button" class="subcategory-chip ${seleccionada ? 'selected' : ''}" data-sub-id="${sub.id}">
            ${sub.icono} ${sub.nombre}
          </button>
        `;
      });
    }
    
    // Botón para agregar subcategoría nueva
    html += `
      <button type="button" class="subcategory-chip add" onclick="Categorias.abrirModalNuevaSub(${this.estado.categoriaPadreId})">
        + Agregar
      </button>
    `;
    
    return html;
  },
  
  obtenerMonedaCuentaActual() {
    if (!this.estado.cuentaId) return 'PEN';
    const cuenta = API.obtenerCuentaPorId(this.estado.cuentaId);
    return cuenta ? Formato.SIMBOLOS[cuenta.moneda] || cuenta.moneda : 'PEN';
  },
  
  configurarEventos() {
    // Tipo
    document.querySelectorAll('.type-option[data-tipo]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        this.estado.tipo = btn.dataset.tipo;
        this.estado.categoriaPadreId = null;
        this.estado.categoriaId = null;
        this.refrescarForm();
      });
    });
    
    // Monto
    const inputMonto = document.getElementById('transMonto');
    inputMonto.addEventListener('input', (e) => {
      this.estado.monto = e.target.value;
    });
    inputMonto.focus();
    
    // Cuenta
    document.getElementById('transCuenta').addEventListener('change', (e) => {
      this.estado.cuentaId = parseInt(e.target.value);
      document.getElementById('transCurrencyLabel').textContent = this.obtenerMonedaCuentaActual();
      
      // Mostrar/ocultar sección de cuotas según tipo de cuenta
      const cuotasSection = document.getElementById('cuotasSection');
      if (cuotasSection) {
        if (this.esCredito()) {
          cuotasSection.style.display = '';
        } else {
          cuotasSection.style.display = 'none';
          this.estado.enCuotas = false;
        }
      }
    });
    
    // Fecha
    document.getElementById('transFecha').addEventListener('change', (e) => {
      this.estado.fecha = e.target.value;
    });
    
    // Descripción
    document.getElementById('transDescripcion').addEventListener('input', (e) => {
      this.estado.descripcion = e.target.value;
    });
    
    // Categorías principales
    document.querySelectorAll('.category-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.catId);
        this.estado.categoriaPadreId = id;
        this.estado.categoriaId = id; // Por default, la categoría padre
        this.refrescarCategorias();
      });
    });
    
    // Subcategorías (delegación porque se re-renderizan)
    document.getElementById('subcategoryChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.subcategory-chip[data-sub-id]');
      if (!chip) return;
      this.estado.categoriaId = parseInt(chip.dataset.subId);
      this.refrescarCategorias();
    });
    
    // Botones
    document.getElementById('btnGuardar').addEventListener('click', () => this.guardar());
    
    const btnEliminar = document.getElementById('btnEliminar');
    if (btnEliminar) {
      btnEliminar.addEventListener('click', () => this.confirmarEliminar());
    }
    
    // Cuotas (si la cuenta es de crédito)
    const cuotasCheck = document.getElementById('cuotasCheck');
    if (cuotasCheck) {
      cuotasCheck.addEventListener('change', (e) => {
        this.estado.enCuotas = e.target.checked;
        const config = document.getElementById('cuotasConfig');
        if (config) config.style.display = this.estado.enCuotas ? '' : 'none';
      });
    }
    
    const cuotasNum = document.getElementById('cuotasNum');
    if (cuotasNum) {
      cuotasNum.addEventListener('change', (e) => {
        this.estado.cuotasTotal = parseInt(e.target.value);
        this.refrescarCuotas();
      });
    }
    
    // Cuando cambia el monto, refrescar info de cuotas
    inputMonto.addEventListener('input', () => this.refrescarCuotas());
  },
  
  /**
   * Refresca solo el bloque de info de cuotas (no todo el form)
   */
  refrescarCuotas() {
    const section = document.getElementById('cuotasSection');
    if (section && this.esCredito()) {
      const wasOpen = this.estado.enCuotas;
      section.innerHTML = this.renderCuotasSection();
      
      // Re-enganchar listeners
      const check = document.getElementById('cuotasCheck');
      if (check) {
        check.addEventListener('change', (e) => {
          this.estado.enCuotas = e.target.checked;
          const cfg = document.getElementById('cuotasConfig');
          if (cfg) cfg.style.display = this.estado.enCuotas ? '' : 'none';
        });
      }
      
      const sel = document.getElementById('cuotasNum');
      if (sel) {
        sel.addEventListener('change', (e) => {
          this.estado.cuotasTotal = parseInt(e.target.value);
          this.refrescarCuotas();
        });
      }
    }
  },
  
  /**
   * Re-renderiza solo las secciones de categoría (sin perder el foco del input)
   */
  refrescarCategorias() {
    document.getElementById('categoryGrid').innerHTML = this.renderCategorias();
    
    const subGroup = document.getElementById('subcategoryGroup');
    if (this.estado.categoriaPadreId) {
      subGroup.style.display = '';
      document.getElementById('subcategoryChips').innerHTML = this.renderSubcategorias();
    } else {
      subGroup.style.display = 'none';
    }
    
    // Re-conectar listeners de las nuevas categorías
    document.querySelectorAll('.category-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.catId);
        this.estado.categoriaPadreId = id;
        this.estado.categoriaId = id;
        this.refrescarCategorias();
      });
    });
  },
  
  /**
   * Re-renderiza el form completo (cuando cambia el tipo)
   */
  refrescarForm() {
    const body = document.querySelector('.modal-body');
    if (!body) return;
    body.innerHTML = this.renderForm();
    this.configurarEventos();
  },
  
  /**
   * Validar y guardar
   */
  guardar() {
    // Validaciones
    const monto = parseFloat(this.estado.monto);
    if (!monto || monto <= 0) {
      Modal.toast('Ingresa un monto válido', 'error');
      document.getElementById('transMonto').focus();
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
    
    // Crear o actualizar
    try {
      // Si tiene cuotas, agregar la info
      const datosTransaccion = { ...this.estado };
      if (this.esCredito() && this.estado.enCuotas && this.estado.cuotasTotal > 1) {
        datosTransaccion.cuotasTotal = parseInt(this.estado.cuotasTotal);
      }
      
      if (this.estado.id) {
        API.actualizarTransaccion(this.estado.id, datosTransaccion);
        Modal.toast('Transacción actualizada ✓');
      } else {
        API.crearTransaccion(datosTransaccion);
        Modal.toast('Transacción creada ✓');
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
        titulo: 'Eliminar transacción',
        mensaje: '¿Estás seguro? Esta acción no se puede deshacer y se ajustarán los saldos.',
        textoConfirmar: 'Eliminar',
        tipoBoton: 'danger',
        onConfirmar: () => {
          API.eliminarTransaccion(this.estado.id);
          Modal.toast('Transacción eliminada');
          if (this.onGuardado) this.onGuardado();
        },
      });
    }, 250);
  },
};
