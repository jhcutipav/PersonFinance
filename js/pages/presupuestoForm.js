/* ============================================
   FORMULARIO DE PRESUPUESTO
   ============================================ */

const PresupuestoForm = {
  
  estado: {
    id: null,
    categoriaId: null,
    monto: '',
    moneda: 'PEN',
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
  },
  
  onGuardado: null,
  
  abrir(id = null, mes, anio, onGuardado = null) {
    this.onGuardado = onGuardado;
    
    if (id) {
      const p = API.obtenerPresupuestoPorId(id);
      if (!p) return;
      this.estado = { ...p };
    } else {
      this.estado = {
        id: null,
        categoriaId: null,
        monto: '',
        moneda: 'PEN',
        mes,
        anio,
      };
    }
    
    Modal.abrir({
      titulo: id ? 'Editar presupuesto' : 'Nuevo presupuesto',
      contenido: this.renderForm(),
    });
    
    this.configurarEventos();
  },
  
  renderForm() {
    const categorias = API.obtenerCategorias({ tipo: 'egreso', soloPrincipales: true });
    
    return `
      <form id="presupForm" onsubmit="return false;">
        
        <div class="form-group">
          <label class="form-label">Categoría</label>
          <select class="form-select" id="presupCat" ${this.estado.id ? 'disabled' : ''}>
            <option value="">Seleccionar...</option>
            ${categorias.map(c => `
              <option value="${c.id}" ${this.estado.categoriaId === c.id ? 'selected' : ''}>
                ${c.icono} ${c.nombre}
              </option>
            `).join('')}
          </select>
          ${this.estado.id ? '<div class="form-helper">No puedes cambiar la categoría de un presupuesto existente</div>' : ''}
        </div>
        
        <div class="form-group">
          <label class="form-label">Monto del presupuesto</label>
          <div class="trans-modal-amount" style="margin:0;">
            <input type="number" id="presupMonto" class="trans-modal-amount-input"
                   placeholder="0.00" step="0.01" min="0"
                   value="${this.estado.monto}" inputmode="decimal" autofocus>
            <div class="trans-modal-amount-currency">${Formato.SIMBOLOS[this.estado.moneda] || 'S/'}</div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Moneda</label>
            <select class="form-select" id="presupMoneda">
              <option value="PEN" ${this.estado.moneda === 'PEN' ? 'selected' : ''}>Soles (S/)</option>
              <option value="USD" ${this.estado.moneda === 'USD' ? 'selected' : ''}>Dólares (US$)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Período</label>
            <input type="text" class="form-input" 
                   value="${Fechas.MESES[this.estado.mes - 1]} ${this.estado.anio}" 
                   disabled style="opacity:0.7;">
          </div>
        </div>
        
        <div class="modal-actions">
          ${this.estado.id ? `
            <button type="button" class="btn-danger" id="btnEliminarPresup">Eliminar</button>
          ` : ''}
          <button type="button" class="btn-secondary" onclick="Modal.cerrar()">Cancelar</button>
          <button type="button" class="btn-primary" id="btnGuardarPresup">
            ${this.estado.id ? 'Guardar cambios' : 'Crear'}
          </button>
        </div>
      </form>
    `;
  },
  
  configurarEventos() {
    const elCat = document.getElementById('presupCat');
    if (elCat) {
      elCat.addEventListener('change', (e) => {
        this.estado.categoriaId = parseInt(e.target.value);
      });
    }
    
    document.getElementById('presupMonto').addEventListener('input', (e) => {
      this.estado.monto = e.target.value;
    });
    
    document.getElementById('presupMoneda').addEventListener('change', (e) => {
      this.estado.moneda = e.target.value;
      const lbl = document.querySelector('.trans-modal-amount-currency');
      if (lbl) lbl.textContent = Formato.SIMBOLOS[this.estado.moneda] || this.estado.moneda;
    });
    
    document.getElementById('btnGuardarPresup').addEventListener('click', () => this.guardar());
    
    const btnEliminar = document.getElementById('btnEliminarPresup');
    if (btnEliminar) {
      btnEliminar.addEventListener('click', () => this.confirmarEliminar());
    }
  },
  
  guardar() {
    if (!this.estado.categoriaId) {
      Modal.toast('Selecciona una categoría', 'error');
      return;
    }
    
    const monto = parseFloat(this.estado.monto);
    if (!monto || monto <= 0) {
      Modal.toast('Ingresa un monto válido', 'error');
      document.getElementById('presupMonto').focus();
      return;
    }
    
    try {
      if (this.estado.id) {
        API.actualizarPresupuesto(this.estado.id, this.estado);
        Modal.toast('✓ Actualizado');
      } else {
        API.crearPresupuesto(this.estado);
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
        titulo: 'Eliminar presupuesto',
        mensaje: '¿Eliminar este presupuesto? Las transacciones registradas no se verán afectadas.',
        textoConfirmar: 'Eliminar',
        tipoBoton: 'danger',
        onConfirmar: () => {
          API.eliminarPresupuesto(this.estado.id);
          Modal.toast('Eliminado');
          if (this.onGuardado) this.onGuardado();
        },
      });
    }, 250);
  },
  
  /* ============ MODAL DE PLANTILLAS ============ */
  abrirPlantillas(mes, anio, onGuardado) {
    this.onGuardado = onGuardado;
    this.mesPlantilla = mes;
    this.anioPlantilla = anio;
    this.plantillaSeleccionada = null;
    
    Modal.abrir({
      titulo: 'Aplicar plantilla',
      contenido: `
        <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:var(--space-md);">
          Las plantillas crean varios presupuestos a la vez basados en tu ingreso mensual estimado.
        </p>
        
        <div class="plantillas-grid">
          <button type="button" class="plantilla-card" data-plantilla="cincuenta_treinta_veinte">
            <div class="plantilla-icon">📊</div>
            <div class="plantilla-name">Regla 50/30/20</div>
            <div class="plantilla-desc">50% necesidades, 30% deseos, 20% ahorro. La más popular.</div>
          </button>
          
          <button type="button" class="plantilla-card" data-plantilla="basico">
            <div class="plantilla-icon">🎯</div>
            <div class="plantilla-name">Básico</div>
            <div class="plantilla-desc">Distribución simple con las categorías principales.</div>
          </button>
        </div>
        
        <div class="form-group">
          <label class="form-label">Tu ingreso mensual estimado</label>
          <div class="trans-modal-amount" style="margin:0;">
            <input type="number" id="plantillaIngreso" class="trans-modal-amount-input"
                   placeholder="3000.00" step="100" min="0"
                   value="${this.calcularIngresoEstimado()}" inputmode="decimal">
            <div class="trans-modal-amount-currency">S/</div>
          </div>
          <div class="form-helper">Sugerido: tus ingresos del mes pasado</div>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="Modal.cerrar()">Cancelar</button>
          <button type="button" class="btn-primary" id="btnAplicarPlantilla">Aplicar plantilla</button>
        </div>
      `,
    });
    
    document.querySelectorAll('.plantilla-card[data-plantilla]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.plantilla-card').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.plantillaSeleccionada = btn.dataset.plantilla;
      });
    });
    
    document.getElementById('btnAplicarPlantilla').addEventListener('click', () => {
      if (!this.plantillaSeleccionada) {
        Modal.toast('Selecciona una plantilla', 'error');
        return;
      }
      
      const ingreso = parseFloat(document.getElementById('plantillaIngreso').value);
      if (!ingreso || ingreso <= 0) {
        Modal.toast('Ingresa un monto válido', 'error');
        return;
      }
      
      const creados = API.aplicarPlantillaPresupuestos(
        this.plantillaSeleccionada, 
        ingreso, 
        this.mesPlantilla, 
        this.anioPlantilla, 
        'PEN'
      );
      
      Modal.toast(`✓ ${creados} presupuestos creados`);
      Modal.cerrar();
      if (this.onGuardado) this.onGuardado();
    });
  },
  
  /**
   * Calcula el ingreso estimado del mes pasado para sugerir
   */
  calcularIngresoEstimado() {
    const ahora = new Date();
    const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const ingresos = Formato.sumarEnMoneda(
      API.obtenerTransacciones({
        tipo: 'ingreso',
        mes: mesAnterior.getMonth() + 1,
        anio: mesAnterior.getFullYear(),
      }),
      'PEN'
    );
    return ingresos > 0 ? ingresos.toFixed(0) : '3000';
  },
};
