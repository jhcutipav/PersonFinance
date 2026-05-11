/* ============================================
   FORMULARIO DE TARJETA DE CRÉDITO
   ============================================ */

const TarjetaForm = {
  
  estado: {
    id: null,
    nombre: '',
    banco: '',
    titular: '',
    ultimosDigitos: '',
    fechaExpiracion: '',
    marca: 'VISA',
    moneda: 'PEN',
    lineaCredito: '',
    diaCorte: 28,
    diaPago: 13,
    tasaTEA: 0.85,
    colorTema: 'purple',
  },
  
  onGuardado: null,
  
  abrir(id = null, onGuardado = null) {
    this.onGuardado = onGuardado;
    
    if (id) {
      const t = API.obtenerTarjetaPorId(id);
      if (!t) return;
      this.estado = { ...t };
    } else {
      const usuario = API.obtenerUsuario();
      this.estado = {
        id: null,
        nombre: '',
        banco: '',
        titular: usuario.nombre,
        ultimosDigitos: '',
        fechaExpiracion: '',
        marca: 'VISA',
        moneda: 'PEN',
        lineaCredito: '',
        diaCorte: 28,
        diaPago: 13,
        tasaTEA: 0.85,
        colorTema: 'purple',
      };
    }
    
    Modal.abrir({
      titulo: id ? 'Editar tarjeta' : 'Nueva tarjeta',
      contenido: this.renderForm(),
    });
    
    this.configurarEventos();
  },
  
  renderForm() {
    return `
      <form id="tarjetaForm" onsubmit="return false;">
        
        <!-- Vista previa pequeña -->
        <div id="tarjetaPreview" style="max-width: 280px; margin: 0 auto var(--space-md);">
          ${this.renderPreview()}
        </div>
        
        <!-- Información básica -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nombre de la tarjeta</label>
            <input type="text" class="form-input" id="tarjNombre" placeholder="Ej: BCP Visa Gold" value="${this.estado.nombre}" maxlength="40">
          </div>
          <div class="form-group">
            <label class="form-label">Banco</label>
            <input type="text" class="form-input" id="tarjBanco" placeholder="Ej: BCP" value="${this.estado.banco}" maxlength="20">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Marca</label>
            <select class="form-select" id="tarjMarca">
              <option value="VISA" ${this.estado.marca === 'VISA' ? 'selected' : ''}>Visa</option>
              <option value="MASTERCARD" ${this.estado.marca === 'MASTERCARD' ? 'selected' : ''}>Mastercard</option>
              <option value="AMEX" ${this.estado.marca === 'AMEX' ? 'selected' : ''}>American Express</option>
              <option value="DINERS" ${this.estado.marca === 'DINERS' ? 'selected' : ''}>Diners Club</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Moneda</label>
            <select class="form-select" id="tarjMoneda">
              <option value="PEN" ${this.estado.moneda === 'PEN' ? 'selected' : ''}>Soles (S/)</option>
              <option value="USD" ${this.estado.moneda === 'USD' ? 'selected' : ''}>Dólares (US$)</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Últimos 4 dígitos</label>
            <input type="text" class="form-input" id="tarjDigitos" placeholder="0000" value="${this.estado.ultimosDigitos}" maxlength="4" pattern="[0-9]{4}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label">Vence (MM/AA)</label>
            <input type="text" class="form-input" id="tarjFechaExp" placeholder="12/28" value="${this.estado.fechaExpiracion}" maxlength="5">
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Titular</label>
          <input type="text" class="form-input" id="tarjTitular" placeholder="Nombre completo" value="${this.estado.titular}" maxlength="30">
        </div>
        
        <hr style="border: none; border-top: 1px solid var(--glass-border); margin: var(--space-md) 0;">
        
        <!-- Crédito y ciclos -->
        <h3 style="font-size: 0.875rem; margin-bottom: var(--space-sm); color: var(--text-secondary);">Línea de crédito y ciclos</h3>
        
        <div class="form-group">
          <label class="form-label">Línea de crédito (${Formato.SIMBOLOS[this.estado.moneda]})</label>
          <input type="number" class="form-input" id="tarjLinea" placeholder="10000" value="${this.estado.lineaCredito}" step="0.01" min="0">
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Día de corte (1-31)</label>
            <input type="number" class="form-input" id="tarjDiaCorte" value="${this.estado.diaCorte}" min="1" max="31">
            <div class="form-helper">Día del mes que cierra el ciclo</div>
          </div>
          <div class="form-group">
            <label class="form-label">Día de pago (1-31)</label>
            <input type="number" class="form-input" id="tarjDiaPago" value="${this.estado.diaPago}" min="1" max="31">
            <div class="form-helper">Día del mes para pagar</div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Tasa Efectiva Anual (TEA) %</label>
          <input type="number" class="form-input" id="tarjTEA" value="${(this.estado.tasaTEA * 100).toFixed(2)}" step="0.01" min="0" max="200">
          <div class="form-helper">Tasa anual cuando no pagas el total</div>
        </div>
        
        <!-- Color tema -->
        <div class="form-group">
          <label class="form-label">Color de identificación</label>
          ${ColorPicker.render(this.estado.colorTema || 'purple', 'colorTema')}
          <div class="form-helper">Color para identificarla en gráficos y dashboard</div>
        </div>
        
        <div class="modal-actions">
          ${this.estado.id ? `
            <button type="button" class="btn-danger" id="btnEliminarTarj">Eliminar</button>
          ` : ''}
          <button type="button" class="btn-secondary" onclick="Modal.cerrar()">Cancelar</button>
          <button type="button" class="btn-primary" id="btnGuardarTarj">${this.estado.id ? 'Guardar cambios' : 'Crear tarjeta'}</button>
        </div>
      </form>
    `;
  },
  
  renderPreview() {
    const usuario = API.obtenerUsuario();
    const tarjetaPreview = {
      ...this.estado,
      nombre: this.estado.nombre || 'Mi Tarjeta',
      banco: this.estado.banco || (this.estado.nombre ? this.estado.nombre.split(' ')[0].toUpperCase() : 'BANCO'),
      ultimosDigitos: this.estado.ultimosDigitos || '0000',
      fechaExpiracion: this.estado.fechaExpiracion || '12/28',
      titular: this.estado.titular || usuario.nombre,
    };
    return TarjetaVisualComp.render(tarjetaPreview, usuario);
  },
  
  configurarEventos() {
    // Inputs de texto
    const campos = [
      ['tarjNombre', 'nombre'],
      ['tarjBanco', 'banco'],
      ['tarjDigitos', 'ultimosDigitos'],
      ['tarjFechaExp', 'fechaExpiracion'],
      ['tarjTitular', 'titular'],
      ['tarjLinea', 'lineaCredito'],
      ['tarjDiaCorte', 'diaCorte'],
      ['tarjDiaPago', 'diaPago'],
    ];
    
    campos.forEach(([elemId, estadoKey]) => {
      const el = document.getElementById(elemId);
      if (el) {
        el.addEventListener('input', (e) => {
          this.estado[estadoKey] = e.target.value;
          if (['nombre', 'banco', 'ultimosDigitos', 'fechaExpiracion', 'titular'].includes(estadoKey)) {
            this.actualizarPreview();
          }
        });
      }
    });
    
    // TEA: convertir % a decimal
    const teaInput = document.getElementById('tarjTEA');
    if (teaInput) {
      teaInput.addEventListener('input', (e) => {
        this.estado.tasaTEA = parseFloat(e.target.value) / 100;
      });
    }
    
    // Selects
    document.getElementById('tarjMarca').addEventListener('change', (e) => {
      this.estado.marca = e.target.value;
      this.actualizarPreview();
    });
    
    document.getElementById('tarjMoneda').addEventListener('change', (e) => {
      this.estado.moneda = e.target.value;
      // Refrescar el label de moneda en el campo de línea
      const labelLinea = document.querySelector('label[for="tarjLinea"], .form-group:has(#tarjLinea) .form-label');
      if (labelLinea) labelLinea.textContent = `Línea de crédito (${Formato.SIMBOLOS[this.estado.moneda]})`;
    });
    
    // Color picker
    ColorPicker.configurar((colorId) => {
      this.estado.colorTema = colorId;
      this.actualizarPreview();
    });
    
    // Botones
    document.getElementById('btnGuardarTarj').addEventListener('click', () => this.guardar());
    
    const btnEliminar = document.getElementById('btnEliminarTarj');
    if (btnEliminar) {
      btnEliminar.addEventListener('click', () => this.confirmarEliminar());
    }
  },
  
  actualizarPreview() {
    const preview = document.getElementById('tarjetaPreview');
    if (preview) preview.innerHTML = this.renderPreview();
  },
  
  guardar() {
    // Validaciones
    if (!this.estado.nombre || !this.estado.nombre.trim()) {
      Modal.toast('Ingresa el nombre de la tarjeta', 'error');
      document.getElementById('tarjNombre').focus();
      return;
    }
    
    if (!this.estado.lineaCredito || parseFloat(this.estado.lineaCredito) <= 0) {
      Modal.toast('Ingresa la línea de crédito', 'error');
      document.getElementById('tarjLinea').focus();
      return;
    }
    
    const diaCorte = parseInt(this.estado.diaCorte);
    const diaPago = parseInt(this.estado.diaPago);
    if (diaCorte < 1 || diaCorte > 31 || diaPago < 1 || diaPago > 31) {
      Modal.toast('Días de corte y pago deben estar entre 1 y 31', 'error');
      return;
    }
    
    try {
      if (this.estado.id) {
        API.actualizarTarjeta(this.estado.id, this.estado);
        Modal.toast('Tarjeta actualizada ✓');
      } else {
        const nueva = API.crearTarjeta(this.estado);
        Tarjetas.tarjetaSeleccionadaId = nueva.id;
        Modal.toast('Tarjeta creada ✓');
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
        titulo: 'Eliminar tarjeta',
        mensaje: 'Se eliminará la tarjeta y su cuenta asociada. Las transacciones quedarán en el histórico. ¿Continuar?',
        textoConfirmar: 'Eliminar',
        tipoBoton: 'danger',
        onConfirmar: () => {
          API.eliminarTarjeta(this.estado.id);
          Tarjetas.tarjetaSeleccionadaId = null;
          Modal.toast('Tarjeta eliminada');
          if (this.onGuardado) this.onGuardado();
        },
      });
    }, 250);
  },
};
