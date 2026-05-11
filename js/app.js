/* ============================================
   APP.JS - Punto de entrada
   ============================================ */

const APP_VERSION = '0.10.0';
const APP_NAME = 'FinanzApp';
const APP_BUILD = '2026-05-11';

const App = {
  
  estado: {
    paginaActual: 'dashboard',
    monedaVista: 'PEN',
  },
  
  init() {
    console.log(`%c💎 ${APP_NAME} v${APP_VERSION}`, 'background:linear-gradient(135deg,#14F0CD,#06B6D4);color:#0A0E1A;padding:6px 12px;border-radius:6px;font-weight:700;');
    console.log(`Build: ${APP_BUILD}`);
    
    // 1. Tema (lo primero para que no haya parpadeo)
    Theme.init();
    
    // 2. Storage
    Storage.inicializar();
    
    // 3. UI
    this.cargarFechaHeader();
    this.cargarUsuarioPerfil();
    this.configurarNavegacion();
    this.configurarSidebarMovil();
    this.configurarSidebarToggle();
    this.configurarSelectorMoneda();
    this.configurarBotonNueva();
    this.configurarBotonReset();
    this.configurarToggleTema();
    
    // 4. Página inicial
    const hash = window.location.hash.replace('#', '');
    if (hash) this.estado.paginaActual = hash;
    this.cargarPaginaActual();
    this.actualizarNavActiva();
    
    // 5. Re-renderizar al cambiar tema (para los gráficos)
    document.addEventListener('themeChanged', () => {
      this.cargarPaginaActual();
    });
  },
  
  /**
   * Toggle del sidebar (expandido/colapsado) con persistencia
   */
  configurarSidebarToggle() {
    const btn = document.getElementById('sidebarToggle');
    const container = document.querySelector('.app-container');
    if (!btn || !container) return;
    
    // Cargar estado guardado (default: cerrado)
    const expandido = localStorage.getItem('finanzapp_sidebar_expanded') === 'true';
    if (expandido) {
      container.classList.add('sidebar-expanded');
    }
    
    btn.addEventListener('click', (e) => {
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
  
  cargarUsuarioPerfil() {
    const usuario = API.obtenerUsuario();
    
    const nombreEl = document.getElementById('profileName');
    if (nombreEl) nombreEl.textContent = usuario.nombre;
    
    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) avatarEl.textContent = usuario.nombre.charAt(0).toUpperCase();
    
    // Sidebar user card
    const sidebarName = document.getElementById('sidebarUserName');
    if (sidebarName) sidebarName.textContent = usuario.nombre;
    
    const sidebarAvatar = document.getElementById('sidebarUserAvatar');
    if (sidebarAvatar) sidebarAvatar.textContent = usuario.nombre.charAt(0).toUpperCase();
    
    // Versión
    const versionEl = document.getElementById('sidebarVersionLabel');
    if (versionEl) versionEl.textContent = `v${APP_VERSION}`;
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
  
  configurarBotonNueva() {
    const btn = document.getElementById('btnNuevaTransaccion');
    if (btn) {
      btn.addEventListener('click', () => {
        TransaccionForm.abrir(null, () => this.cargarPaginaActual());
      });
    }
  },
  
  configurarToggleTema() {
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', () => {
        Theme.toggle();
      });
    }
  },
  
  // Triple-click en el logo para resetear (modo dev)
  configurarBotonReset() {
    const logo = document.querySelector('.logo');
    if (!logo) return;
    
    let clicks = 0;
    let timer;
    
    logo.addEventListener('click', () => {
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
