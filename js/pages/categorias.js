/* ============================================
   CATEGORÍAS
   Modal para crear nuevas categorías y subs
   ============================================ */

const Categorias = {
  
  // Íconos sugeridos para nuevas categorías
  ICONOS_SUGERIDOS: [
    '📌', '🍔', '🍕', '☕', '🛒', '🍺', '🚗', '⛽', '🚕', '✈️', '🏠', '🔑',
    '⚡', '💧', '📶', '📱', '💡', '🎬', '🎮', '🎵', '📚', '💻', '👕', '👟',
    '⚕️', '💊', '🏥', '💼', '💰', '📈', '🎁', '🎉', '🐶', '🐱', '🌱', '✂️',
    '🔧', '📦', '⭐', '❤️', '🎨', '🏋️', '🍎', '🥗', '🍷', '🎓', '🚲', '🛵'
  ],
  
  COLORES_DISPONIBLES: [
    { id: 'red', label: 'Rojo' },
    { id: 'amber', label: 'Ámbar' },
    { id: 'green', label: 'Verde' },
    { id: 'cyan', label: 'Cian' },
    { id: 'purple', label: 'Violeta' },
    { id: 'pink', label: 'Rosa' },
  ],
  
  /**
   * Modal para crear categoría principal nueva
   */
  abrirModalNueva(tipo = 'egreso') {
    Modal.cerrar();
    setTimeout(() => {
      this.renderizarModal({
        titulo: 'Nueva categoría',
        tipo,
        categoriaPadreId: null,
      });
    }, 250);
  },
  
  /**
   * Modal para crear subcategoría
   */
  abrirModalNuevaSub(padreId) {
    const padre = API.obtenerCategoriaPorId(padreId);
    if (!padre) return;
    
    Modal.cerrar();
    setTimeout(() => {
      this.renderizarModal({
        titulo: `Nueva subcategoría de ${padre.nombre}`,
        tipo: padre.tipo,
        categoriaPadreId: padreId,
        colorHeredado: padre.color,
      });
    }, 250);
  },
  
  renderizarModal({ titulo, tipo, categoriaPadreId, colorHeredado }) {
    const colorInicial = colorHeredado || 'purple';
    const iconoInicial = this.ICONOS_SUGERIDOS[0];
    
    Modal.abrir({
      titulo,
      ancho: 'small',
      contenido: `
        <form id="catForm" onsubmit="return false;">
          
          <div class="form-group">
            <label class="form-label">Nombre</label>
            <input type="text" class="form-input" id="catNombre" placeholder="Ej: Café especial" maxlength="40" autofocus>
          </div>
          
          <div class="form-group">
            <label class="form-label">Ícono</label>
            <div class="category-grid" style="max-height: 180px;">
              ${this.ICONOS_SUGERIDOS.map((ico, i) => `
                <button type="button" class="category-option icon-pick ${i === 0 ? 'selected' : ''}" data-icon="${ico}">
                  <span class="icon">${ico}</span>
                </button>
              `).join('')}
            </div>
          </div>
          
          ${!categoriaPadreId ? `
            <div class="form-group">
              <label class="form-label">Color</label>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                ${this.COLORES_DISPONIBLES.map(c => `
                  <button type="button" class="color-pick ${c.id === colorInicial ? 'selected' : ''}" 
                          data-color="${c.id}"
                          style="
                            width:40px;height:40px;border-radius:50%;border:2px solid transparent;
                            background:rgba(var(--rgb-${c.id},124,58,237),0.3);
                            cursor:pointer;display:flex;align-items:center;justify-content:center;
                            font-family:inherit;
                          ">
                    <span class="icon-box ${c.id}" style="width:28px;height:28px;"></span>
                  </button>
                `).join('')}
              </div>
              <div class="form-helper">El color se usa en gráficos y resúmenes</div>
            </div>
          ` : ''}
          
          <input type="hidden" id="catTipo" value="${tipo}">
          <input type="hidden" id="catPadreId" value="${categoriaPadreId || ''}">
          <input type="hidden" id="catIcono" value="${iconoInicial}">
          <input type="hidden" id="catColor" value="${colorInicial}">
          
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="Modal.cerrar()">Cancelar</button>
            <button type="button" class="btn-primary" id="btnGuardarCat">Crear</button>
          </div>
        </form>
      `,
    });
    
    // Conectar eventos
    document.querySelectorAll('.icon-pick').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.icon-pick').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        document.getElementById('catIcono').value = btn.dataset.icon;
      });
    });
    
    document.querySelectorAll('.color-pick').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.color-pick').forEach(b => {
          b.classList.remove('selected');
          b.style.borderColor = 'transparent';
        });
        btn.classList.add('selected');
        btn.style.borderColor = 'white';
        document.getElementById('catColor').value = btn.dataset.color;
      });
    });
    
    // Marcar visualmente el color inicial
    const colorInitBtn = document.querySelector(`.color-pick[data-color="${colorInicial}"]`);
    if (colorInitBtn) colorInitBtn.style.borderColor = 'white';
    
    document.getElementById('btnGuardarCat').addEventListener('click', () => this.guardar());
  },
  
  guardar() {
    const nombre = document.getElementById('catNombre').value.trim();
    const tipo = document.getElementById('catTipo').value;
    const icono = document.getElementById('catIcono').value;
    const color = document.getElementById('catColor').value;
    const padreIdRaw = document.getElementById('catPadreId').value;
    const padreId = padreIdRaw ? parseInt(padreIdRaw) : null;
    
    if (!nombre) {
      Modal.toast('Ingresa un nombre', 'error');
      document.getElementById('catNombre').focus();
      return;
    }
    
    // Si es subcategoría, hereda el color del padre
    let colorFinal = color;
    if (padreId) {
      const padre = API.obtenerCategoriaPorId(padreId);
      if (padre) colorFinal = padre.color;
    }
    
    const nueva = API.crearCategoria({
      nombre,
      tipo,
      icono,
      color: colorFinal,
      categoriaPadreId: padreId,
    });
    
    Modal.toast('Categoría creada ✓');
    Modal.cerrar();
    
    // Reabrir el form de transacción con la nueva categoría seleccionada
    setTimeout(() => {
      if (padreId) {
        // Era subcategoría, reabrir form y seleccionarla
        TransaccionForm.estado.categoriaPadreId = padreId;
        TransaccionForm.estado.categoriaId = nueva.id;
      } else {
        // Era categoría principal
        TransaccionForm.estado.categoriaPadreId = nueva.id;
        TransaccionForm.estado.categoriaId = nueva.id;
        TransaccionForm.estado.tipo = tipo;
      }
      
      Modal.abrir({
        titulo: TransaccionForm.estado.id ? 'Editar transacción' : 'Nueva transacción',
        contenido: TransaccionForm.renderForm(),
      });
      TransaccionForm.configurarEventos();
    }, 250);
  },
};
