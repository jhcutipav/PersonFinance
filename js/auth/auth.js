/* ============================================================================
   AUTH — Sistema de autenticación (v15)
   ============================================================================
   Este módulo maneja login/registro/logout.
   
   ⚠️ IMPORTANTE: por ahora funciona 100% en localStorage. En finanzapp_16 lo
   conectaremos a Supabase Auth. La estructura está preparada para esa migración.
   
   Conceptos:
   - usuario actual: el que está logueado ahora (Auth.usuarioActual)
   - sesión: objeto guardado en localStorage con info del usuario logueado
   - modo invitado: usuario de prueba sin registro real, datos demo
   
   Cómo usar desde otros archivos:
     Auth.estaLogueado()         → true/false
     Auth.usuarioActual()        → datos del usuario o null
     Auth.login(email, pass)     → intenta loguear, retorna Promise<{ok, msg}>
     Auth.registrar(datos)       → crea cuenta nueva, retorna Promise<{ok, msg}>
     Auth.logout()               → cierra sesión
     Auth.entrarComoInvitado()   → entra con cuenta demo
   ============================================================================ */

const Auth = {
  
  /* ============================================================
     ESTADO INTERNO
     ============================================================ */
  
  // Clave en localStorage donde guardamos la sesión
  STORAGE_KEY: 'finanzapp_session',
  
  // Clave donde guardamos la "base de datos" local de usuarios (mock)
  USERS_KEY: 'finanzapp_users_local',
  
  /* ============================================================
     CONSULTAS DE ESTADO
     ============================================================ */
  
  /**
   * estaLogueado — Indica si hay alguien con sesión activa
   * @returns {boolean}
   */
  estaLogueado() {
    return this.usuarioActual() !== null;
  },
  
  /**
   * usuarioActual — Retorna datos del usuario actual o null
   * @returns {object|null} { id, nombre, email, esInvitado, monedaPrincipal, fechaRegistro }
   */
  usuarioActual() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  
  /**
   * esInvitado — Si el usuario actual es un invitado (modo demo)
   * @returns {boolean}
   */
  esInvitado() {
    const u = this.usuarioActual();
    return u !== null && u.esInvitado === true;
  },
  
  /* ============================================================
     ACCIONES DE AUTH
     ============================================================ */
  
  /**
   * login — Intenta iniciar sesión con email y contraseña
   * 
   * En esta versión (v15) usa localStorage como "base de datos" local.
   * En v16 esto cambiará a llamada a Supabase Auth.
   * 
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ok: boolean, msg: string, usuario?: object}>}
   */
  async login(email, password) {
    // Simulación de latencia para que se sienta real
    await this.delay(500);
    
    // Caso especial: demo público
    if (email === 'demo@finanzapp.com' && password === 'demo123') {
      const usuarioDemo = {
        id: 'demo-user',
        nombre: 'Usuario Demo',
        email: 'demo@finanzapp.com',
        esInvitado: false,
        monedaPrincipal: 'PEN',
        fechaRegistro: new Date().toISOString(),
      };
      this.guardarSesion(usuarioDemo);
      return { ok: true, msg: 'Bienvenido', usuario: usuarioDemo };
    }
    
    // Buscar en usuarios registrados localmente
    const usuarios = this.obtenerUsuariosLocales();
    const usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!usuario) {
      return { ok: false, msg: 'No existe una cuenta con ese email' };
    }
    
    if (usuario.password !== this.hashSimple(password)) {
      return { ok: false, msg: 'Contraseña incorrecta' };
    }
    
    // Login OK
    const sesion = { ...usuario };
    delete sesion.password; // No guardar password en la sesión
    this.guardarSesion(sesion);
    return { ok: true, msg: 'Bienvenido de vuelta', usuario: sesion };
  },
  
  /**
   * registrar — Crea una nueva cuenta de usuario
   * 
   * En v15 guarda en localStorage. En v16 llamará a Supabase Auth signUp.
   * 
   * @param {object} datos - { nombre, email, password, monedaPrincipal? }
   * @returns {Promise<{ok: boolean, msg: string, usuario?: object}>}
   */
  async registrar(datos) {
    await this.delay(700);
    
    const { nombre, email, password, monedaPrincipal = 'PEN' } = datos;
    
    // Validaciones básicas
    if (!nombre || nombre.trim().length < 2) {
      return { ok: false, msg: 'El nombre debe tener al menos 2 caracteres' };
    }
    if (!this.emailValido(email)) {
      return { ok: false, msg: 'Email inválido' };
    }
    if (!password || password.length < 6) {
      return { ok: false, msg: 'La contraseña debe tener al menos 6 caracteres' };
    }
    
    // Verificar que el email no esté ya registrado
    const usuarios = this.obtenerUsuariosLocales();
    if (usuarios.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, msg: 'Ya existe una cuenta con ese email' };
    }
    
    // Crear usuario
    const nuevo = {
      id: `local-${Date.now()}`,
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password: this.hashSimple(password), // Hash básico (en Supabase será real)
      esInvitado: false,
      monedaPrincipal,
      fechaRegistro: new Date().toISOString(),
    };
    
    usuarios.push(nuevo);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(usuarios));
    
    // Auto-login al crear cuenta
    const sesion = { ...nuevo };
    delete sesion.password;
    this.guardarSesion(sesion);
    
    return { ok: true, msg: 'Cuenta creada exitosamente', usuario: sesion };
  },
  
  /**
   * entrarComoInvitado — Crea sesión temporal con datos demo
   * 
   * El usuario "invitado" usa los datos de mockData que ya conoces.
   * No se guarda en la lista de usuarios registrados.
   */
  entrarComoInvitado() {
    const invitado = {
      id: 'invitado-' + Date.now(),
      nombre: 'Invitado',
      email: null,
      esInvitado: true,
      monedaPrincipal: 'PEN',
      fechaRegistro: new Date().toISOString(),
    };
    this.guardarSesion(invitado);
    return invitado;
  },
  
  /**
   * logout — Cierra la sesión actual
   * 
   * Si era invitado, también limpia sus datos locales (para empezar fresco).
   */
  logout() {
    const eraInvitado = this.esInvitado();
    localStorage.removeItem(this.STORAGE_KEY);
    
    // Si era invitado, limpiar datos demo para empezar fresco la próxima vez
    if (eraInvitado) {
      // Mantenemos solo lo de usuarios registrados y tema
      const claves = Object.keys(localStorage).filter(k => 
        k.startsWith('finanzapp_') && 
        k !== 'finanzapp_users_local' &&
        k !== 'finanzapp_tema'
      );
      claves.forEach(k => localStorage.removeItem(k));
    }
  },
  
  /* ============================================================
     UTILIDADES INTERNAS
     ============================================================ */
  
  /**
   * guardarSesion — Persiste sesión activa en localStorage
   */
  guardarSesion(usuario) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usuario));
  },
  
  /**
   * obtenerUsuariosLocales — Carga lista de usuarios registrados localmente
   * @returns {array}
   */
  obtenerUsuariosLocales() {
    try {
      const raw = localStorage.getItem(this.USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  
  /**
   * emailValido — Validación básica de formato de email
   * @returns {boolean}
   */
  emailValido(email) {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  
  /**
   * hashSimple — Hash básico para passwords (NO seguro, solo dev)
   * Cuando migremos a Supabase, esto lo manejará Supabase Auth con bcrypt.
   */
  hashSimple(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36);
  },
  
  /**
   * delay — Pequeña espera para simular llamada de red
   */
  delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  },
};
