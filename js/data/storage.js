/* ============================================
   STORAGE
   Abstracción sobre localStorage.
   Cuando migremos a Supabase, este archivo
   se reemplaza por llamadas a la BD real.
   ============================================ */

const Storage = {
  
  PREFIJO: 'finanzapp_',
  
  /**
   * Guarda un valor (lo serializa automáticamente)
   */
  guardar(clave, valor) {
    try {
      localStorage.setItem(this.PREFIJO + clave, JSON.stringify(valor));
      return true;
    } catch (e) {
      console.error('Error al guardar:', e);
      return false;
    }
  },
  
  /**
   * Carga un valor (lo deserializa). Devuelve null si no existe.
   */
  cargar(clave) {
    try {
      const raw = localStorage.getItem(this.PREFIJO + clave);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Error al cargar:', e);
      return null;
    }
  },
  
  /**
   * Elimina una clave
   */
  eliminar(clave) {
    localStorage.removeItem(this.PREFIJO + clave);
  },
  
  /**
   * Borra TODA la data de la app (para botón "resetear")
   */
  limpiarTodo() {
    const claves = Object.keys(localStorage).filter(k => k.startsWith(this.PREFIJO));
    claves.forEach(k => localStorage.removeItem(k));
  },
  
  /**
   * Inicializa la app con datos seed si no hay nada guardado.
   * Se llama al cargar la página.
   */
  inicializar() {
    if (!this.cargar('inicializado')) {
      this.guardar('usuario', MockData.usuario);
      this.guardar('cuentas', MockData.cuentas);
      this.guardar('tarjetas', MockData.tarjetas);
      this.guardar('ciclosTarjeta', MockData.ciclosTarjeta);
      this.guardar('categorias', MockData.categorias);
      this.guardar('transacciones', MockData.transacciones);
      this.guardar('presupuestos', MockData.presupuestos);
      this.guardar('inicializado', true);
      console.log('✓ App inicializada con datos seed');
    }
  },
  
  /**
   * Genera un ID único para nuevos registros.
   * Toma el ID más alto del array y suma 1.
   */
  nuevoId(coleccion) {
    const items = this.cargar(coleccion) || [];
    if (items.length === 0) return 1;
    return Math.max(...items.map(i => i.id)) + 1;
  },
};
