/* ============================================
   COMPONENTE: MODAL
   Modal reutilizable. Se inyecta en el body
   y se controla por JS.
   ============================================ */

const Modal = {
  
  contenedor: null,
  onCerrar: null,
  
  /**
   * Abre el modal con el HTML dado
   */
  abrir({ titulo, contenido, onCerrar = null, ancho = 'normal' }) {
    // Si ya hay un modal abierto, removerlo INMEDIATAMENTE (sin animación)
    // Esto evita race conditions cuando se abre un modal mientras otro se está cerrando
    if (this.contenedor) {
      this.contenedor.remove();
      this.contenedor = null;
      document.removeEventListener('keydown', this.escListener);
    }
    
    this.onCerrar = onCerrar;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-container modal-${ancho}">
        <div class="modal-header">
          <h2 class="modal-title">${titulo}</h2>
          <button class="modal-close" aria-label="Cerrar">✕</button>
        </div>
        <div class="modal-body">
          ${contenido}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.contenedor = modal;
    
    // Animación de entrada
    requestAnimationFrame(() => modal.classList.add('active'));
    
    // Eventos para cerrar
    modal.querySelector('.modal-close').addEventListener('click', () => this.cerrar());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.cerrar();
    });
    
    // ESC para cerrar
    this.escListener = (e) => {
      if (e.key === 'Escape') this.cerrar();
    };
    document.addEventListener('keydown', this.escListener);
    
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
  },
  
  cerrar() {
    if (!this.contenedor) return;
    
    // Guardar referencia al contenedor actual ANTES del setTimeout
    // para evitar que un modal nuevo abierto en ese intervalo sea removido
    const contenedorACerrar = this.contenedor;
    const onCerrarCallback = this.onCerrar;
    
    contenedorACerrar.classList.remove('active');
    document.removeEventListener('keydown', this.escListener);
    
    // Limpiar referencias inmediatamente
    this.contenedor = null;
    this.onCerrar = null;
    
    setTimeout(() => {
      // Solo remover el contenedor original, no el nuevo si hay
      if (contenedorACerrar && contenedorACerrar.parentNode) {
        contenedorACerrar.remove();
      }
      
      // Restaurar scroll solo si no hay otro modal abierto
      if (!this.contenedor) {
        document.body.style.overflow = '';
      }
      
      if (onCerrarCallback) {
        onCerrarCallback();
      }
    }, 200);
  },
  
  /**
   * Confirmación tipo "¿Estás seguro?"
   */
  confirmar({ titulo, mensaje, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar', tipoBoton = 'primary', onConfirmar }) {
    const claseBoton = tipoBoton === 'danger' ? 'btn-danger' : 'btn-primary';
    
    this.abrir({
      titulo,
      ancho: 'small',
      contenido: `
        <p style="color: var(--text-secondary); margin-bottom: var(--space-lg);">${mensaje}</p>
        <div class="modal-actions">
          <button class="btn-secondary" id="modalCancelBtn">${textoCancelar}</button>
          <button class="${claseBoton}" id="modalConfirmBtn">${textoConfirmar}</button>
        </div>
      `,
    });
    
    document.getElementById('modalCancelBtn').addEventListener('click', () => this.cerrar());
    document.getElementById('modalConfirmBtn').addEventListener('click', () => {
      this.cerrar();
      if (onConfirmar) onConfirmar();
    });
  },
  
  /**
   * Toast / notificación temporal
   */
  toast(mensaje, tipo = 'success') {
    const existente = document.querySelector('.toast');
    if (existente) existente.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => toast.classList.add('active'));
    
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },
};
