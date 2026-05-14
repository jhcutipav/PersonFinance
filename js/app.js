/* ============================================
   APP.JS - Punto de entrada
   ============================================
   v14 — Cambios:
   - Concepto "Bancarizado vs No bancarizado" agregado
   - Campo `bancarizado` (boolean) en cada cuenta
   - Cuentas separadas según visibilidad para SBS/SUNAT:
     · 🏦 Bancarizado: BCP, Interbank, BBVA, Yape, Plin (vinculados a banco)
     · 💵 No bancarizado: Efectivo, Prex
   - Billeteras (Yape, Plin) tienen tipo 'billetera' y campo cuentaVinculadaId
   - Toggle en Resumen General: [Todo / Bancarizado / No bancarizado]
   - Nueva card en aside derecho: "💰 Dinero en tu poder"
     con barra de proporción + desglose detallado
   - Métodos API: calcularSaldoBancarizado, calcularSaldoNoBancarizado,
     obtenerCuentasPorBancarizacion
   - Corregidos typos de colores en mockData (skylue→skyblue, bue→blue)
   ============================================ */

const APP_VERSION = '14';
const APP_NAME = 'FinanzApp';
const APP_BUILD = '2026-05-14';

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
