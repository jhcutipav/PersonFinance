/* ============================================
   APP.JS - Punto de entrada
   ============================================
   v16 — Wizard de Onboarding para cuentas nuevas
   - Detecta cuentas nuevas vs invitado:
     · Invitado: arranca con datos demo completos (MockData)
     · Cuenta real: arranca VACÍA + muestra wizard de onboarding
   - Wizard de 4 pasos:
     1. Bienvenida + explicación
     2. Cuentas (efectivo, banco, billetera) con campos completos:
        nombre, tipo, moneda, saldo, banco, bancarizado, cuenta vinculada, color
     3. Tarjetas (opcional, saltable): crédito o débito con sus campos
     4. Resumen final con stats
   - Botón "Saltar todo" con advertencia
   - Categorías por defecto cargadas SIEMPRE
   - Solo se muestra UNA VEZ (marca pendienteOnboarding=false al terminar)
   
   v15 — Etapa 9.1: Página de Login
   ============================================ */

const APP_VERSION = '16';
const APP_NAME = 'FinanzApp';
const APP_BUILD = '2026-05-15';

const App = {
  
  estado: {
    paginaActual: 'dashboard',
    monedaVista: 'PEN',
  },
  
  /**
   * init — Punto de entrada de la app.
   * 
   * v15 — Ahora verifica sesión PRIMERO:
   *   - Si NO hay sesión → muestra Login (oculta app)
   *   - Si SÍ hay sesión → arranca normal
   */
  init() {
    console.log(`%c💎 ${APP_NAME} v${APP_VERSION}`, 'background:linear-gradient(135deg,#14F0CD,#06B6D4);color:#0A0E1A;padding:6px 12px;border-radius:6px;font-weight:700;');
    console.log(`Build: ${APP_BUILD}`);
    
    // 1. Tema primero (evita parpadeo)
    Theme.init();
    
    // v16 — 2. Auth ANTES de Storage (porque Storage.inicializar() ahora
    // depende de saber si es invitado o cuenta real)
    if (typeof Auth !== 'undefined' && !Auth.estaLogueado()) {
      // No hay sesión → mostrar Login
      Login.mostrar();
      return;
    }
    
    // 3. Storage (sabe el tipo de usuario gracias a Auth)
    Storage.inicializar();
    
    // 4. ¿Tiene onboarding pendiente? → Mostrar wizard
    if (Storage.cargar('pendienteOnboarding')) {
      this.mostrarOnboarding();
      return;
    }
    
    // 5. Todo OK → entrar al app normal
    this.iniciarConSesion();
  },
  
  /**
   * v16 — mostrarOnboarding — Muestra el wizard de configuración inicial
   */
  mostrarOnboarding() {
    if (typeof Onboarding !== 'undefined') {
      Onboarding.mostrar();
    } else {
      // Si el módulo no está cargado, saltarse y entrar normal
      console.warn('Onboarding no disponible, saltando...');
      Storage.guardar('pendienteOnboarding', false);
      this.iniciarConSesion();
    }
  },
  
  /**
   * iniciarConSesion — Inicializa la app cuando ya hay sesión activa.
   * Se llama desde init() si hay sesión, o desde Login después de loguearse.
   */
  iniciarConSesion() {
    // UI
    this.cargarFechaHeader();
    this.cargarUsuarioPerfil();
    this.configurarNavegacion();
    this.configurarSidebarMovil();
    this.configurarSidebarToggle();
    this.configurarSelectorMoneda();
    this.configurarBotonNueva();
    this.configurarBotonReset();
    this.configurarToggleTema();
    
    // v15 — Configurar el botón de logout
    this.configurarLogout();
    
    // Página inicial
    const hash = window.location.hash.replace('#', '');
    if (hash) this.estado.paginaActual = hash;
    this.cargarPaginaActual();
    this.actualizarNavActiva();
    
    // v0.11.0 — Refrescar badge de notificaciones
    if (typeof Notificaciones !== 'undefined') {
      Notificaciones.refrescarBadge();
    }
    
    // 5. Re-renderizar al cambiar tema (para los gráficos)
    document.addEventListener('themeChanged', () => {
      this.cargarPaginaActual();
    });
  },
  
  /**
   * v13 — Toggle del sidebar: ahora se hace click en el LOGO (no en flecha)
   */
  configurarSidebarToggle() {
    const logoToggle = document.getElementById('sidebarLogoToggle');
    const container = document.querySelector('.app-container');
    if (!logoToggle || !container) return;
    
    // Cargar estado guardado (default: cerrado)
    const expandido = localStorage.getItem('finanzapp_sidebar_expanded') === 'true';
    if (expandido) {
      container.classList.add('sidebar-expanded');
    }
    
    logoToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      container.classList.toggle('sidebar-expanded');
      const ahoraExpandido = container.classList.contains('sidebar-expanded');
      localStorage.setItem('finanzapp_sidebar_expanded', ahoraExpandido);
    });
  },
  
  cargarFechaHeader() {
    const el = document.getElementById('headerDate');
    if (!el) return;
    const hoy = new Date();
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    el.textContent = `${dias[hoy.getDay()]} ${hoy.getDate()} ${Fechas.MESES_CORTOS[hoy.getMonth()]}`;
  },
  
  /**
   * cargarUsuarioPerfil — Pinta nombre + avatar en header y sidebar.
   * 
   * v15: Si hay sesión activa, usa el usuario de Auth. Si no, usa API (legacy).
   */
  cargarUsuarioPerfil() {
    // v15 — Si hay sesión, usar datos del usuario logueado; si no, usar API
    let nombre = 'Usuario';
    let esInvitado = false;
    
    if (typeof Auth !== 'undefined' && Auth.estaLogueado()) {
      const sesion = Auth.usuarioActual();
      nombre = sesion.nombre || 'Usuario';
      esInvitado = sesion.esInvitado === true;
    } else {
      const usuario = API.obtenerUsuario();
      nombre = usuario.nombre || 'Usuario';
    }
    
    const inicial = nombre.charAt(0).toUpperCase();
    
    // Header
    const nombreEl = document.getElementById('profileName');
    if (nombreEl) nombreEl.textContent = nombre;
    
    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) avatarEl.textContent = inicial;
    
    // Sidebar user card
    const sidebarName = document.getElementById('sidebarUserName');
    if (sidebarName) sidebarName.textContent = nombre;
    
    const sidebarAvatar = document.getElementById('sidebarUserAvatar');
    if (sidebarAvatar) sidebarAvatar.textContent = inicial;
    
    // v15 — Mostrar badge "Invitado" si aplica
    const planEl = document.querySelector('.header-profile-plan');
    if (planEl) planEl.textContent = esInvitado ? 'Invitado' : 'Premium';
    
    // Versión
    const versionEl = document.getElementById('sidebarVersionLabel');
    if (versionEl) versionEl.textContent = `v${APP_VERSION}`;
  },
  
  /**
   * configurarLogout — Engancha el botón de cerrar sesión.
   * 
   * Por ahora el logout se activa con click en el avatar del header (popup menú).
   * En el futuro se puede agregar un botón explícito.
   */
  configurarLogout() {
    // Crear elemento popup de menú si no existe
    let menu = document.getElementById('userMenuPopup');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'userMenuPopup';
      menu.className = 'user-menu-popup';
      menu.style.display = 'none';
      menu.innerHTML = `
        <div class="user-menu-header">
          <div class="user-menu-avatar" id="userMenuAvatar">U</div>
          <div>
            <div class="user-menu-name" id="userMenuName">Usuario</div>
            <div class="user-menu-email" id="userMenuEmail">—</div>
          </div>
        </div>
        <div class="user-menu-divider"></div>
        <button class="user-menu-item" onclick="App.navegarA('configuracion'); App.cerrarUserMenu();">
          ⚙️ Configuración
        </button>
        <button class="user-menu-item" onclick="App.navegarA('ayuda'); App.cerrarUserMenu();">
          ❓ Ayuda
        </button>
        <div class="user-menu-divider"></div>
        <button class="user-menu-item user-menu-logout" onclick="App.cerrarSesion()">
          🚪 Cerrar sesión
        </button>
      `;
      document.body.appendChild(menu);
    }
    
    // Click en el área del perfil del header abre el menú
    const profileWrap = document.querySelector('.header-profile');
    if (profileWrap) {
      profileWrap.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleUserMenu();
      });
    }
    
    // Cerrar menú al clickear fuera
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('userMenuPopup');
      if (menu && menu.style.display !== 'none' && !menu.contains(e.target)) {
        this.cerrarUserMenu();
      }
    });
  },
  
  /**
   * toggleUserMenu — Abre o cierra el menú de usuario
   */
  toggleUserMenu() {
    const menu = document.getElementById('userMenuPopup');
    if (!menu) return;
    
    if (menu.style.display === 'none') {
      // Actualizar datos antes de mostrar
      const sesion = (typeof Auth !== 'undefined') ? Auth.usuarioActual() : null;
      const nombre = sesion?.nombre || API.obtenerUsuario().nombre || 'Usuario';
      const email = sesion?.email || (sesion?.esInvitado ? 'Modo invitado' : '');
      
      const nameEl = document.getElementById('userMenuName');
      const emailEl = document.getElementById('userMenuEmail');
      const avatarEl = document.getElementById('userMenuAvatar');
      if (nameEl) nameEl.textContent = nombre;
      if (emailEl) emailEl.textContent = email || '—';
      if (avatarEl) avatarEl.textContent = nombre.charAt(0).toUpperCase();
      
      // Posicionar cerca del perfil
      const profile = document.querySelector('.header-profile');
      if (profile) {
        const rect = profile.getBoundingClientRect();
        menu.style.top = (rect.bottom + 8) + 'px';
        menu.style.right = (window.innerWidth - rect.right) + 'px';
      }
      menu.style.display = 'block';
    } else {
      menu.style.display = 'none';
    }
  },
  
  cerrarUserMenu() {
    const menu = document.getElementById('userMenuPopup');
    if (menu) menu.style.display = 'none';
  },
  
  /**
   * cerrarSesion — Cierra sesión y vuelve al login
   */
  cerrarSesion() {
    if (typeof Modal !== 'undefined' && Modal.confirmar) {
      Modal.confirmar({
        titulo: 'Cerrar sesión',
        mensaje: '¿Seguro que quieres salir?',
        textoConfirmar: 'Cerrar sesión',
        tipoBoton: 'danger',
        onConfirmar: () => this._hacerLogout(),
      });
    } else {
      if (confirm('¿Cerrar sesión?')) this._hacerLogout();
    }
  },
  
  _hacerLogout() {
    this.cerrarUserMenu();
    if (typeof Auth !== 'undefined') Auth.logout();
    // Recargar la página para volver al estado inicial limpio
    window.location.reload();
  },
  
  configurarNavegacion() {
    const items = document.querySelectorAll('.nav-item');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const pagina = item.dataset.page;
        if (pagina) {
          this.navegarA(pagina);
          this.cerrarSidebarMovil();
        }
      });
    });
    
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== this.estado.paginaActual) {
        this.estado.paginaActual = hash;
        this.cargarPaginaActual();
        this.actualizarNavActiva();
      }
    });
  },
  
  navegarA(pagina) {
    this.estado.paginaActual = pagina;
    window.location.hash = pagina;
    this.cargarPaginaActual();
    this.actualizarNavActiva();
  },
  
  actualizarNavActiva() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === this.estado.paginaActual);
    });
  },
  
  cargarPaginaActual() {
    const container = document.getElementById('pageContent');
    
    switch (this.estado.paginaActual) {
      case 'dashboard':
        Dashboard.render(container, this.estado.monedaVista);
        break;
      case 'transacciones':
        Transacciones.render(container, this.estado.monedaVista);
        break;
      case 'tarjetas':
        Tarjetas.render(container, this.estado.monedaVista);
        break;
      case 'gastos-fijos':
        GastosFijos.render(container, this.estado.monedaVista);
        break;
      case 'presupuestos':
        Presupuestos.render(container, this.estado.monedaVista);
        break;
      case 'deudas':
        Deudas.render(container, this.estado.monedaVista);
        break;
      case 'metas':
        Metas.render(container, this.estado.monedaVista);
        break;
      case 'reportes':
        Reportes.render(container, this.estado.monedaVista);
        break;
      case 'transferencias':
        Transferencias.render(container, this.estado.monedaVista);
        break;
      // v0.11.0 — Nuevas páginas
      case 'configuracion':
        Configuracion.render(container, this.estado.monedaVista);
        break;
      case 'ayuda':
        Ayuda.render(container, this.estado.monedaVista);
        break;
      case 'notificaciones':
        Notificaciones.render(container, this.estado.monedaVista);
        break;
      default:
        container.innerHTML = `
          <div class="glass-card" style="text-align: center; padding: 3rem;">
            <h2 style="margin-bottom: 1rem;">Próximamente 🚧</h2>
            <p class="text-secondary">Este módulo lo construiremos en la siguiente etapa.</p>
          </div>
        `;
    }
  },
  
  configurarSidebarMovil() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const btnAbrir = document.getElementById('menuToggle');
    const btnCerrar = document.getElementById('sidebarClose');
    
    if (btnAbrir) {
      btnAbrir.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
      });
    }
    
    const cerrar = () => this.cerrarSidebarMovil();
    if (btnCerrar) btnCerrar.addEventListener('click', cerrar);
    if (overlay) overlay.addEventListener('click', cerrar);
  },
  
  cerrarSidebarMovil() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
  },
  
  configurarSelectorMoneda() {
    const select = document.getElementById('currencyView');
    if (!select) return;
    
    select.value = this.estado.monedaVista;
    select.addEventListener('change', (e) => {
      this.estado.monedaVista = e.target.value;
      this.cargarPaginaActual();
    });
  },
  
  /**
   * v0.11.0 — Botón "Nueva" abre directamente el form con tabs
   */
  configurarBotonNueva() {
    const btn = document.getElementById('btnNuevaTransaccion');
    if (btn) {
      btn.addEventListener('click', () => {
        TransaccionForm.abrir(null, () => this.cargarPaginaActual());
      });
    }
  },
  
  /**
   * v0.10.3 — Menú con opciones rápidas al hacer click en "+ Nueva"
   */
  abrirMenuNueva() {
    Modal.abrir({
      titulo: '¿Qué deseas crear?',
      ancho: 'small',
      contenido: `
        <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:var(--space-md);">
          Elige el tipo de operación que quieres registrar:
        </p>
        
        <div class="nueva-opciones-grid">
          
          <button class="nueva-opcion-card" id="opcionIngreso">
            <div class="nueva-opcion-icon" style="background:linear-gradient(135deg,#10B981,#059669);color:white;">
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/></svg>
            </div>
            <div class="nueva-opcion-info">
              <div class="nueva-opcion-title">Ingreso</div>
              <div class="nueva-opcion-desc">Sueldo, ventas, etc.</div>
            </div>
          </button>
          
          <button class="nueva-opcion-card" id="opcionEgreso">
            <div class="nueva-opcion-icon" style="background:linear-gradient(135deg,#EF4444,#DC2626);color:white;">
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6"/></svg>
            </div>
            <div class="nueva-opcion-info">
              <div class="nueva-opcion-title">Egreso</div>
              <div class="nueva-opcion-desc">Gasto, compra, pago</div>
            </div>
          </button>
          
          <button class="nueva-opcion-card" id="opcionTransferencia">
            <div class="nueva-opcion-icon" style="background:linear-gradient(135deg,#14F0CD,#06B6D4);color:#0A0E1A;">
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            </div>
            <div class="nueva-opcion-info">
              <div class="nueva-opcion-title">Transferencia</div>
              <div class="nueva-opcion-desc">Entre tus cuentas</div>
            </div>
          </button>
          
          <button class="nueva-opcion-card" id="opcionPagoTarjeta">
            <div class="nueva-opcion-icon" style="background:linear-gradient(135deg,#8B5CF6,#7C3AED);color:white;">
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </div>
            <div class="nueva-opcion-info">
              <div class="nueva-opcion-title">Pagar tarjeta</div>
              <div class="nueva-opcion-desc">Adelantar / cancelar</div>
            </div>
          </button>
          
        </div>
      `,
    });
    
    // Listeners
    document.getElementById('opcionIngreso').addEventListener('click', () => {
      Modal.cerrar();
      setTimeout(() => {
        TransaccionForm.abrir(null, () => this.cargarPaginaActual());
        // Pre-seleccionar tipo ingreso después de abrir
        setTimeout(() => {
          const btnIng = document.querySelector('[data-tipo="ingreso"]');
          if (btnIng) btnIng.click();
        }, 100);
      }, 250);
    });
    
    document.getElementById('opcionEgreso').addEventListener('click', () => {
      Modal.cerrar();
      setTimeout(() => {
        TransaccionForm.abrir(null, () => this.cargarPaginaActual());
      }, 250);
    });
    
    document.getElementById('opcionTransferencia').addEventListener('click', () => {
      Modal.cerrar();
      setTimeout(() => {
        if (typeof Transferencias !== 'undefined' && Transferencias.abrirFormulario) {
          // El form de transferencia abre modal por sí solo
          Transferencias.abrirFormulario();
        } else {
          this.navegarA('transferencias');
        }
      }, 250);
    });
    
    document.getElementById('opcionPagoTarjeta').addEventListener('click', () => {
      Modal.cerrar();
      setTimeout(() => {
        const tarjetas = API.obtenerTarjetas();
        if (tarjetas.length === 0) {
          Modal.toast('No tienes tarjetas registradas', 'error');
          return;
        }
        // Si hay solo 1 tarjeta, abrir directamente
        if (tarjetas.length === 1) {
          PagoTarjetaForm.abrir(tarjetas[0].id, () => this.cargarPaginaActual());
        } else {
          this.elegirTarjetaParaPagar();
        }
      }, 250);
    });
  },
  
  /**
   * v0.10.3 — Selector de tarjeta cuando hay más de una
   */
  elegirTarjetaParaPagar() {
    const tarjetas = API.obtenerTarjetas();
    
    Modal.abrir({
      titulo: '¿Qué tarjeta vas a pagar?',
      ancho: 'small',
      contenido: `
        <div class="nueva-opciones-grid">
          ${tarjetas.map(t => {
            const colorHex = ColorPicker.obtenerHex(t.colorTema || 'purple');
            const pendiente = t.saldoUsado;
            return `
              <button class="nueva-opcion-card" data-tarjeta-id="${t.id}">
                <div class="nueva-opcion-icon" style="background:${colorHex};color:white;">
                  💳
                </div>
                <div class="nueva-opcion-info">
                  <div class="nueva-opcion-title">${t.nombre}</div>
                  <div class="nueva-opcion-desc">Pendiente: ${Formato.formatearMoneda(pendiente, t.moneda)}</div>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      `,
    });
    
    document.querySelectorAll('[data-tarjeta-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.tarjetaId);
        Modal.cerrar();
        setTimeout(() => {
          PagoTarjetaForm.abrir(id, () => this.cargarPaginaActual());
        }, 250);
      });
    });
  },
  
  configurarToggleTema() {
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', () => {
        Theme.toggle();
      });
    }
  },
  
  /**
   * v13 — Triple-click en el AVATAR del header para resetear
   * (antes era en el logo, ahora el logo abre/cierra sidebar)
   */
  configurarBotonReset() {
    const avatar = document.getElementById('profileAvatar');
    if (!avatar) return;
    
    // Pista visual
    avatar.title = 'Triple-click para resetear datos';
    avatar.style.cursor = 'pointer';
    
    let clicks = 0;
    let timer;
    
    avatar.addEventListener('click', () => {
      clicks++;
      clearTimeout(timer);
      timer = setTimeout(() => clicks = 0, 600);
      
      if (clicks >= 3) {
        clicks = 0;
        Modal.confirmar({
          titulo: 'Resetear datos',
          mensaje: 'Esto eliminará todas tus transacciones, categorías personalizadas y cambios. Volverá a los datos de ejemplo. ¿Continuar?',
          textoConfirmar: 'Resetear todo',
          tipoBoton: 'danger',
          onConfirmar: () => {
            API.resetear();
            Modal.toast('Datos reseteados ✓');
            this.cargarPaginaActual();
            this.cargarUsuarioPerfil();
          },
        });
      }
    });
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
