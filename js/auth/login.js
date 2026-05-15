/* ============================================================================
   PÁGINA: LOGIN (v15)
   ============================================================================
   Página de inicio de sesión y registro.
   
   Tiene 2 tabs:
     - Iniciar sesión: Email + Contraseña
     - Crear cuenta: Nombre + Email + Contraseña + Confirmar
   
   Y un botón grande "Probar como invitado" para entrar sin registro.
   
   Cómo se muestra/oculta:
   - App.js verifica al inicio si hay sesión activa.
   - Si NO hay sesión → muestra Login (oculta sidebar/header).
   - Si SÍ hay sesión → muestra app normal.
   ============================================================================ */

const Login = {
  
  // Tab activa: 'login' o 'registro'
  tabActiva: 'login',
  
  /* ============================================================
     RENDER PRINCIPAL
     ============================================================ */
  
  /**
   * mostrar — Oculta el layout normal y muestra la pantalla de login.
   * Se llama desde App.js al iniciar si no hay sesión.
   */
  mostrar() {
    // Ocultar el layout normal de la app
    const appContainer = document.querySelector('.app-container');
    if (appContainer) appContainer.style.display = 'none';
    
    // Crear o mostrar el contenedor de login
    let loginRoot = document.getElementById('loginRoot');
    if (!loginRoot) {
      loginRoot = document.createElement('div');
      loginRoot.id = 'loginRoot';
      document.body.appendChild(loginRoot);
    }
    
    loginRoot.style.display = 'flex';
    loginRoot.innerHTML = this.renderHTML();
    this.configurarEventos();
  },
  
  /**
   * ocultar — Oculta el login y muestra el layout normal.
   * Se llama después de un login exitoso.
   */
  ocultar() {
    const loginRoot = document.getElementById('loginRoot');
    if (loginRoot) loginRoot.style.display = 'none';
    
    const appContainer = document.querySelector('.app-container');
    if (appContainer) appContainer.style.display = '';
  },
  
  /**
   * renderHTML — Genera todo el HTML de la pantalla de login.
   * 
   * Estructura:
   *   - Fondo con gradiente animado
   *   - Card glassmorphism centrado con:
   *     · Logo + título
   *     · Tabs (Iniciar sesión / Crear cuenta)
   *     · Formulario correspondiente
   *     · Botón "Probar como invitado"
   */
  renderHTML() {
    return `
      <div class="login-bg-blob blob-1"></div>
      <div class="login-bg-blob blob-2"></div>
      <div class="login-bg-blob blob-3"></div>
      
      <div class="login-card">
        <!-- Logo + título -->
        <div class="login-header">
          <div class="login-logo">💎</div>
          <h1 class="login-title">FinanzApp</h1>
          <p class="login-subtitle">Tus finanzas personales, organizadas</p>
        </div>
        
        <!-- Tabs -->
        <div class="login-tabs">
          <button class="login-tab ${this.tabActiva === 'login' ? 'active' : ''}" data-login-tab="login">
            Iniciar sesión
          </button>
          <button class="login-tab ${this.tabActiva === 'registro' ? 'active' : ''}" data-login-tab="registro">
            Crear cuenta
          </button>
        </div>
        
        <!-- Formulario (cambia según tab) -->
        <div id="loginFormWrap" class="login-form-wrap">
          ${this.tabActiva === 'login' ? this.renderFormLogin() : this.renderFormRegistro()}
        </div>
        
        <!-- Separador -->
        <div class="login-separator">
          <span>o</span>
        </div>
        
        <!-- Botón invitado -->
        <button class="login-invitado-btn" id="btnEntrarInvitado">
          <span class="login-invitado-icon">🎭</span>
          <div class="login-invitado-text">
            <strong>Probar como invitado</strong>
            <small>Explora la app con datos de ejemplo</small>
          </div>
          <span class="login-invitado-arrow">→</span>
        </button>
        
        <!-- Footer -->
        <div class="login-footer">
          <small>v15 · Made with 💚 by you</small>
        </div>
      </div>
    `;
  },
  
  /**
   * renderFormLogin — Formulario de iniciar sesión
   */
  renderFormLogin() {
    return `
      <form id="formLogin" onsubmit="return false;">
        <div class="login-field">
          <label class="login-label" for="loginEmail">Email</label>
          <div class="login-input-wrap">
            <span class="login-input-icon">📧</span>
            <input type="email" id="loginEmail" class="login-input" 
                   placeholder="tu@email.com" autocomplete="email" required>
          </div>
        </div>
        
        <div class="login-field">
          <label class="login-label" for="loginPassword">Contraseña</label>
          <div class="login-input-wrap">
            <span class="login-input-icon">🔒</span>
            <input type="password" id="loginPassword" class="login-input" 
                   placeholder="Tu contraseña" autocomplete="current-password" required>
            <button type="button" class="login-eye" data-toggle-pass="loginPassword" title="Mostrar/Ocultar">👁</button>
          </div>
        </div>
        
        <!-- Mensaje de error (oculto por defecto) -->
        <div id="loginMensaje" class="login-mensaje" style="display:none;"></div>
        
        <button type="submit" class="login-btn-primary" id="btnLogin">
          <span class="login-btn-text">Iniciar sesión</span>
          <span class="login-btn-spinner" style="display:none;">⟳</span>
        </button>
        
        <div class="login-hint">
          <strong>💡 Tip:</strong> Para probar rápido: <code>demo@finanzapp.com</code> / <code>demo123</code>
        </div>
      </form>
    `;
  },
  
  /**
   * renderFormRegistro — Formulario de crear cuenta
   */
  renderFormRegistro() {
    return `
      <form id="formRegistro" onsubmit="return false;">
        <div class="login-field">
          <label class="login-label" for="regNombre">Nombre completo</label>
          <div class="login-input-wrap">
            <span class="login-input-icon">👤</span>
            <input type="text" id="regNombre" class="login-input" 
                   placeholder="Cómo te llamas" autocomplete="name" required maxlength="50">
          </div>
        </div>
        
        <div class="login-field">
          <label class="login-label" for="regEmail">Email</label>
          <div class="login-input-wrap">
            <span class="login-input-icon">📧</span>
            <input type="email" id="regEmail" class="login-input" 
                   placeholder="tu@email.com" autocomplete="email" required>
          </div>
        </div>
        
        <div class="login-field">
          <label class="login-label" for="regPassword">Contraseña</label>
          <div class="login-input-wrap">
            <span class="login-input-icon">🔒</span>
            <input type="password" id="regPassword" class="login-input" 
                   placeholder="Mínimo 6 caracteres" autocomplete="new-password" required minlength="6">
            <button type="button" class="login-eye" data-toggle-pass="regPassword" title="Mostrar/Ocultar">👁</button>
          </div>
          <div class="login-strength" id="loginStrength">
            <div class="login-strength-bar"></div>
          </div>
        </div>
        
        <div class="login-field">
          <label class="login-label" for="regPassword2">Confirmar contraseña</label>
          <div class="login-input-wrap">
            <span class="login-input-icon">🔒</span>
            <input type="password" id="regPassword2" class="login-input" 
                   placeholder="Repite la contraseña" autocomplete="new-password" required minlength="6">
          </div>
        </div>
        
        <div id="registroMensaje" class="login-mensaje" style="display:none;"></div>
        
        <button type="submit" class="login-btn-primary" id="btnRegistro">
          <span class="login-btn-text">Crear cuenta</span>
          <span class="login-btn-spinner" style="display:none;">⟳</span>
        </button>
        
        <p class="login-terms">
          Al registrarte aceptas almacenar tus datos localmente.
          <br>Pronto: backup en la nube con Supabase.
        </p>
      </form>
    `;
  },
  
  /* ============================================================
     CONFIGURAR EVENTOS
     ============================================================ */
  
  /**
   * configurarEventos — Engancha todos los listeners de la página.
   * Se llama después de cada render.
   */
  configurarEventos() {
    // Tabs login/registro
    document.querySelectorAll('[data-login-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.tabActiva = btn.dataset.loginTab;
        // Re-renderizar solo el contenedor del form (no toda la card, para mantener animación)
        const wrap = document.getElementById('loginFormWrap');
        if (wrap) {
          wrap.innerHTML = this.tabActiva === 'login' ? this.renderFormLogin() : this.renderFormRegistro();
        }
        // Actualizar clase active de los tabs
        document.querySelectorAll('[data-login-tab]').forEach(b => 
          b.classList.toggle('active', b === btn)
        );
        // Re-configurar eventos del nuevo form
        this.configurarEventosForm();
      });
    });
    
    // Eventos específicos del form
    this.configurarEventosForm();
    
    // Botón invitado
    const btnInvitado = document.getElementById('btnEntrarInvitado');
    if (btnInvitado) {
      btnInvitado.addEventListener('click', () => this.entrarComoInvitado());
    }
  },
  
  /**
   * configurarEventosForm — Eventos específicos del formulario activo.
   * Se llama al cambiar de tab o al inicio.
   */
  configurarEventosForm() {
    // Toggle mostrar/ocultar contraseña
    document.querySelectorAll('[data-toggle-pass]').forEach(btn => {
      btn.addEventListener('click', () => {
        const inputId = btn.dataset.togglePass;
        const input = document.getElementById(inputId);
        if (!input) return;
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = '🙈';
        } else {
          input.type = 'password';
          btn.textContent = '👁';
        }
      });
    });
    
    // Submit del form de login
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        this.intentarLogin();
      });
    }
    
    // Submit del form de registro
    const formRegistro = document.getElementById('formRegistro');
    if (formRegistro) {
      formRegistro.addEventListener('submit', (e) => {
        e.preventDefault();
        this.intentarRegistro();
      });
    }
    
    // Indicador de fuerza de contraseña (solo en registro)
    const inputPass = document.getElementById('regPassword');
    if (inputPass) {
      inputPass.addEventListener('input', (e) => {
        this.actualizarFuerzaPass(e.target.value);
      });
    }
    
    // Auto-focus en primer campo
    setTimeout(() => {
      const firstInput = document.querySelector('#loginFormWrap input');
      if (firstInput) firstInput.focus();
    }, 100);
  },
  
  /* ============================================================
     ACCIONES (login/registro/invitado)
     ============================================================ */
  
  /**
   * intentarLogin — Llama a Auth.login con los datos del form
   */
  async intentarLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      this.mostrarMensaje('loginMensaje', 'Completa email y contraseña', 'error');
      return;
    }
    
    this.toggleLoading('btnLogin', true);
    
    const resultado = await Auth.login(email, password);
    
    this.toggleLoading('btnLogin', false);
    
    if (resultado.ok) {
      this.mostrarMensaje('loginMensaje', '✓ ' + resultado.msg, 'success');
      setTimeout(() => this.entrarApp(resultado.usuario), 500);
    } else {
      this.mostrarMensaje('loginMensaje', resultado.msg, 'error');
    }
  },
  
  /**
   * intentarRegistro — Llama a Auth.registrar con los datos del form
   */
  async intentarRegistro() {
    const nombre = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;
    
    // Validaciones del lado del cliente
    if (!nombre || !email || !password || !password2) {
      this.mostrarMensaje('registroMensaje', 'Completa todos los campos', 'error');
      return;
    }
    if (password !== password2) {
      this.mostrarMensaje('registroMensaje', 'Las contraseñas no coinciden', 'error');
      return;
    }
    
    this.toggleLoading('btnRegistro', true);
    
    const resultado = await Auth.registrar({ nombre, email, password });
    
    this.toggleLoading('btnRegistro', false);
    
    if (resultado.ok) {
      this.mostrarMensaje('registroMensaje', '✓ ' + resultado.msg, 'success');
      setTimeout(() => this.entrarApp(resultado.usuario), 500);
    } else {
      this.mostrarMensaje('registroMensaje', resultado.msg, 'error');
    }
  },
  
  /**
   * entrarComoInvitado — Crea sesión de invitado y entra a la app
   */
  entrarComoInvitado() {
    const invitado = Auth.entrarComoInvitado();
    this.entrarApp(invitado);
  },
  
  /**
   * entrarApp — Oculta login y entra a la aplicación principal.
   * 
   * v16 — Después del login/registro, inicializa Storage y verifica
   * si necesita onboarding antes de ir al dashboard.
   */
  entrarApp(usuario) {
    this.ocultar();
    
    // Inicializar storage según tipo de usuario (cuenta real vs invitado)
    Storage.inicializar();
    
    // Sincronizar nombre con API si difiere
    if (usuario.nombre) {
      const usuarioApi = API.obtenerUsuario();
      if (usuarioApi.nombre !== usuario.nombre) {
        API.actualizarUsuario({ nombre: usuario.nombre });
      }
    }
    
    // v16 — Si tiene onboarding pendiente → mostrar wizard
    if (Storage.cargar('pendienteOnboarding')) {
      if (typeof Onboarding !== 'undefined') {
        Onboarding.mostrar();
        return;
      }
    }
    
    // Si no hay onboarding pendiente, entrar al app
    if (typeof App !== 'undefined' && App.iniciarConSesion) {
      App.iniciarConSesion();
    }
  },
  
  /* ============================================================
     UTILIDADES UI
     ============================================================ */
  
  /**
   * mostrarMensaje — Muestra mensaje de éxito o error en el form
   */
  mostrarMensaje(elementoId, mensaje, tipo = 'error') {
    const el = document.getElementById(elementoId);
    if (!el) return;
    el.textContent = mensaje;
    el.className = `login-mensaje login-mensaje-${tipo}`;
    el.style.display = 'block';
    
    // Auto-ocultar éxito después de 3s
    if (tipo === 'success') {
      setTimeout(() => { el.style.display = 'none'; }, 3000);
    }
  },
  
  /**
   * toggleLoading — Activa/desactiva el spinner del botón
   */
  toggleLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const text = btn.querySelector('.login-btn-text');
    const spinner = btn.querySelector('.login-btn-spinner');
    if (loading) {
      btn.disabled = true;
      if (text) text.style.opacity = '0';
      if (spinner) spinner.style.display = 'inline-block';
    } else {
      btn.disabled = false;
      if (text) text.style.opacity = '1';
      if (spinner) spinner.style.display = 'none';
    }
  },
  
  /**
   * actualizarFuerzaPass — Muestra indicador visual de fuerza de password
   * 3 niveles: débil (rojo) / media (amarillo) / fuerte (verde)
   */
  actualizarFuerzaPass(password) {
    const wrap = document.getElementById('loginStrength');
    if (!wrap) return;
    const bar = wrap.querySelector('.login-strength-bar');
    if (!bar) return;
    
    let fuerza = 0;
    if (password.length >= 6) fuerza += 1;
    if (password.length >= 10) fuerza += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) fuerza += 1;
    if (/[0-9]/.test(password)) fuerza += 1;
    if (/[^A-Za-z0-9]/.test(password)) fuerza += 1;
    
    const nivel = fuerza <= 2 ? 'weak' : (fuerza <= 3 ? 'medium' : 'strong');
    const colores = { weak: '#EF4444', medium: '#F59E0B', strong: '#10B981' };
    const anchos = { weak: '33%', medium: '66%', strong: '100%' };
    
    bar.style.width = anchos[nivel];
    bar.style.background = colores[nivel];
    wrap.dataset.fuerza = nivel;
  },
};
