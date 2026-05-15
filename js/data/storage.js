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
   * Se llama al cargar la página DESPUÉS de la sesión.
   * 
   * v16 — Lógica condicional:
   *   - Cuenta real nueva → arranca VACÍA (solo categorías por defecto)
   *     → marca pendienteOnboarding=true para mostrar el wizard
   *   - Invitado → carga datos demo completos (MockData) para explorar
   *   - Si ya hay datos → no toca nada (sesión recurrente)
   * 
   * Esto se llama dentro de App.iniciarConSesion(), después de verificar Auth.
   */
  inicializar() {
    // ¿Ya está inicializado en esta sesión? Solo migrar
    if (this.cargar('inicializado')) {
      // Migraciones de versiones anteriores
      if (!this.cargar('gastosFijos')) this.guardar('gastosFijos', MockData.gastosFijos);
      if (!this.cargar('deudas')) this.guardar('deudas', MockData.deudas);
      if (!this.cargar('metas')) this.guardar('metas', MockData.metas);
      return;
    }
    
    // No hay datos → es un usuario nuevo
    // Determinar si es invitado o cuenta real
    const esInvitado = (typeof Auth !== 'undefined') && Auth.esInvitado();
    
    if (esInvitado) {
      // INVITADO: cargar datos demo completos para explorar
      this.cargarDatosDemo();
      console.log('✓ App inicializada (modo invitado con datos demo)');
    } else {
      // CUENTA REAL: empieza vacía, solo categorías por defecto
      this.cargarVacio();
      console.log('✓ App inicializada (cuenta nueva vacía → onboarding)');
    }
  },
  
  /**
   * v16 — Carga TODOS los datos de ejemplo (para modo invitado)
   */
  cargarDatosDemo() {
    this.guardar('usuario', MockData.usuario);
    this.guardar('cuentas', MockData.cuentas);
    this.guardar('tarjetas', MockData.tarjetas);
    this.guardar('ciclosTarjeta', MockData.ciclosTarjeta);
    this.guardar('categorias', MockData.categorias);
    this.guardar('transacciones', MockData.transacciones);
    this.guardar('presupuestos', MockData.presupuestos);
    this.guardar('gastosFijos', MockData.gastosFijos);
    this.guardar('deudas', MockData.deudas);
    this.guardar('metas', MockData.metas);
    this.guardar('inicializado', true);
    // NO marcamos pendienteOnboarding (invitado ya tiene todo listo)
  },
  
  /**
   * v16 — Carga datos VACÍOS para cuenta real nueva
   * Solo se cargan las categorías (necesarias para el funcionamiento básico)
   */
  cargarVacio() {
    // Usuario: tomar nombre del Auth si está disponible
    let nombreUsuario = 'Usuario';
    if (typeof Auth !== 'undefined' && Auth.usuarioActual()) {
      nombreUsuario = Auth.usuarioActual().nombre || 'Usuario';
    }
    
    this.guardar('usuario', {
      ...MockData.usuario,
      nombre: nombreUsuario,
    });
    
    // Cuentas, tarjetas, transacciones, etc. → VACÍO
    this.guardar('cuentas', []);
    this.guardar('tarjetas', []);
    this.guardar('ciclosTarjeta', []);
    this.guardar('transacciones', []);
    this.guardar('presupuestos', []);
    this.guardar('gastosFijos', []);
    this.guardar('deudas', []);
    this.guardar('metas', []);
    
    // SOLO las categorías sí se cargan por defecto (son comunes para todos)
    this.guardar('categorias', MockData.categorias);
    
    this.guardar('inicializado', true);
    // Marca que necesita pasar por el wizard de onboarding
    this.guardar('pendienteOnboarding', true);
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
