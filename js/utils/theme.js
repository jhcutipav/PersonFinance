/* ============================================
   THEME SERVICE
   Gestión del tema oscuro/claro
   ============================================ */

const Theme = {
  
  STORAGE_KEY: 'finanzapp_theme',
  
  /**
   * Inicializa el tema al cargar la app
   */
  init() {
    const guardado = localStorage.getItem(this.STORAGE_KEY);
    
    if (guardado === 'dark' || guardado === 'light') {
      this.aplicar(guardado);
    } else {
      // Default: oscuro (según preferencia del usuario)
      this.aplicar('dark');
    }
  },
  
  /**
   * Aplica el tema al documento
   */
  aplicar(tema) {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem(this.STORAGE_KEY, tema);
  },
  
  /**
   * Devuelve el tema actual
   */
  actual() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  },
  
  /**
   * Alterna entre oscuro y claro
   */
  toggle() {
    const nuevo = this.actual() === 'dark' ? 'light' : 'dark';
    this.aplicar(nuevo);
    
    // Notificar cambio para que los gráficos se redibujen
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { tema: nuevo } }));
    
    return nuevo;
  },
  
  /**
   * Devuelve los colores del tema actual para usar en gráficos
   */
  coloresGrafico() {
    const tema = this.actual();
    if (tema === 'dark') {
      return {
        text: 'rgba(255, 255, 255, 0.7)',
        textSecondary: 'rgba(255, 255, 255, 0.5)',
        grid: 'rgba(255, 255, 255, 0.06)',
        background: 'transparent',
      };
    }
    return {
      text: 'rgba(26, 35, 50, 0.7)',
      textSecondary: 'rgba(26, 35, 50, 0.5)',
      grid: 'rgba(30, 58, 95, 0.08)',
      background: 'transparent',
    };
  },
};
