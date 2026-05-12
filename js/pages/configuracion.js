/* ============================================
   PÁGINA: CONFIGURACIÓN (v0.11.0)
   ============================================
   Permite editar:
   - Datos personales (nombre, avatar)
   - Moneda principal (PEN / USD)
   - Tasa de cambio USD/PEN
   - Tema (claro / oscuro)
   - Idioma (español / inglés)
   ============================================ */

const Configuracion = {
  
  monedaVista: 'PEN',
  
  render(container, monedaVista = 'PEN') {
    this.monedaVista = monedaVista;
    
    const usuario = API.obtenerUsuario();
    const tasaActual = Storage.cargar('tasaUSD') || 3.75;
    const idiomaActual = Storage.cargar('idioma') || 'es';
    const temaActual = Storage.cargar('tema') || 'dark';
    
    container.innerHTML = `
      <div class="config-page">
        <div class="config-header">
          <h2 class="config-title">⚙️ Configuración</h2>
          <p class="config-subtitle">Personaliza tu experiencia con FinanzApp</p>
        </div>
        
        <div class="config-sections">
          
          <!-- 1. Datos personales -->
          <div class="config-section">
            <div class="config-section-header">
              <div class="config-section-icon" style="background:linear-gradient(135deg,#14F0CD,#06B6D4);">
                <svg width="20" height="20" fill="none" stroke="#0A0E1A" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
              <div>
                <div class="config-section-title">Datos personales</div>
                <div class="config-section-desc">Tu información básica</div>
              </div>
            </div>
            <div class="config-section-body">
              <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-input" id="cfgNombre" value="${usuario.nombre || ''}" maxlength="40">
              </div>
              <div class="form-group">
                <label class="form-label">Inicial del avatar</label>
                <div style="display:flex;align-items:center;gap:12px;">
                  <div class="config-avatar-preview" id="cfgAvatarPreview">${(usuario.nombre || 'U').charAt(0).toUpperCase()}</div>
                  <span style="font-size:0.8125rem;color:var(--text-tertiary);">Se genera automáticamente con la primera letra de tu nombre</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 2. Moneda -->
          <div class="config-section">
            <div class="config-section-header">
              <div class="config-section-icon" style="background:linear-gradient(135deg,#10B981,#059669);color:white;">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <div class="config-section-title">Moneda</div>
                <div class="config-section-desc">Moneda principal y tasa de cambio</div>
              </div>
            </div>
            <div class="config-section-body">
              <div class="form-group">
                <label class="form-label">Moneda principal</label>
                <div class="config-toggle-group">
                  <button class="config-toggle ${usuario.monedaPrincipal === 'PEN' ? 'active' : ''}" data-moneda="PEN">
                    🇵🇪 Soles (S/)
                  </button>
                  <button class="config-toggle ${usuario.monedaPrincipal === 'USD' ? 'active' : ''}" data-moneda="USD">
                    🇺🇸 Dólares (US$)
                  </button>
                </div>
                <div class="form-helper">Tus reportes y totales se mostrarán en esta moneda</div>
              </div>
              <div class="form-group">
                <label class="form-label">Tasa de cambio USD → PEN</label>
                <div class="trans-modal-amount" style="margin:0;">
                  <input type="number" class="trans-modal-amount-input" id="cfgTasa" 
                         value="${tasaActual}" step="0.01" min="0" inputmode="decimal">
                  <div class="trans-modal-amount-currency">S/ por US$ 1</div>
                </div>
                <div class="form-helper">Tasa usada para convertir entre monedas. Actualízala manualmente cuando cambie.</div>
              </div>
            </div>
          </div>
          
          <!-- 3. Tema -->
          <div class="config-section">
            <div class="config-section-header">
              <div class="config-section-icon" style="background:linear-gradient(135deg,#8B5CF6,#7C3AED);color:white;">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
              </div>
              <div>
                <div class="config-section-title">Apariencia</div>
                <div class="config-section-desc">Tema visual de la app</div>
              </div>
            </div>
            <div class="config-section-body">
              <div class="form-group">
                <label class="form-label">Tema</label>
                <div class="config-toggle-group">
                  <button class="config-toggle ${temaActual === 'dark' ? 'active' : ''}" data-tema="dark">
                    🌙 Oscuro
                  </button>
                  <button class="config-toggle ${temaActual === 'light' ? 'active' : ''}" data-tema="light">
                    ☀️ Claro
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 4. Idioma -->
          <div class="config-section">
            <div class="config-section-header">
              <div class="config-section-icon" style="background:linear-gradient(135deg,#F59E0B,#EA580C);color:white;">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>
              </div>
              <div>
                <div class="config-section-title">Idioma</div>
                <div class="config-section-desc">Idioma de la interfaz</div>
              </div>
            </div>
            <div class="config-section-body">
              <div class="form-group">
                <label class="form-label">Idioma</label>
                <div class="config-toggle-group">
                  <button class="config-toggle ${idiomaActual === 'es' ? 'active' : ''}" data-idioma="es">
                    🇪🇸 Español
                  </button>
                  <button class="config-toggle ${idiomaActual === 'en' ? 'active' : ''}" data-idioma="en" disabled title="Próximamente">
                    🇬🇧 English (próximamente)
                  </button>
                </div>
                <div class="form-helper">El soporte completo a inglés llega con la migración a Supabase (v0.12.0)</div>
              </div>
            </div>
          </div>
          
          <!-- Acciones globales -->
          <div class="config-actions">
            <button class="btn-secondary" id="cfgCancelar">Descartar cambios</button>
            <button class="btn-primary" id="cfgGuardar">💾 Guardar cambios</button>
          </div>
          
        </div>
      </div>
    `;
    
    this.configurarEventos();
  },
  
  configurarEventos() {
    let cambios = {};
    
    // Moneda principal
    document.querySelectorAll('[data-moneda]').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = btn.dataset.moneda;
        document.querySelectorAll('[data-moneda]').forEach(b => b.classList.toggle('active', b === btn));
        cambios.monedaPrincipal = m;
      });
    });
    
    // Tema
    document.querySelectorAll('[data-tema]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.tema;
        document.querySelectorAll('[data-tema]').forEach(b => b.classList.toggle('active', b === btn));
        cambios.tema = t;
        // Aplicar tema inmediatamente
        if (typeof Theme !== 'undefined') {
          if (t === 'light' && Theme.actual() !== 'light') Theme.toggle();
          if (t === 'dark' && Theme.actual() !== 'dark') Theme.toggle();
        }
      });
    });
    
    // Idioma
    document.querySelectorAll('[data-idioma]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const i = btn.dataset.idioma;
        document.querySelectorAll('[data-idioma]').forEach(b => b.classList.toggle('active', b === btn));
        cambios.idioma = i;
      });
    });
    
    // Avatar preview en vivo
    const inputNombre = document.getElementById('cfgNombre');
    if (inputNombre) {
      inputNombre.addEventListener('input', (e) => {
        const preview = document.getElementById('cfgAvatarPreview');
        if (preview) preview.textContent = (e.target.value || 'U').charAt(0).toUpperCase();
        cambios.nombre = e.target.value;
      });
    }
    
    // Tasa USD
    const tasaInput = document.getElementById('cfgTasa');
    if (tasaInput) {
      tasaInput.addEventListener('input', (e) => {
        cambios.tasaUSD = parseFloat(e.target.value) || 3.75;
      });
    }
    
    // Botones de acción
    document.getElementById('cfgCancelar').addEventListener('click', () => {
      App.cargarPaginaActual();
    });
    
    document.getElementById('cfgGuardar').addEventListener('click', () => {
      this.guardarCambios(cambios);
    });
  },
  
  /**
   * v0.11.0 — Guardar todos los cambios de configuración
   */
  guardarCambios(cambios) {
    try {
      let huboCambios = false;
      
      // Actualizar usuario
      const usuario = API.obtenerUsuario();
      const updates = {};
      if (cambios.nombre !== undefined && cambios.nombre !== usuario.nombre) {
        updates.nombre = cambios.nombre.trim() || usuario.nombre;
        huboCambios = true;
      }
      if (cambios.monedaPrincipal && cambios.monedaPrincipal !== usuario.monedaPrincipal) {
        updates.monedaPrincipal = cambios.monedaPrincipal;
        huboCambios = true;
      }
      if (Object.keys(updates).length > 0) {
        API.actualizarUsuario(updates);
      }
      
      // Tasa USD
      if (cambios.tasaUSD !== undefined) {
        Storage.guardar('tasaUSD', cambios.tasaUSD);
        // Actualizar Formato.TASA_USD si existe
        if (typeof Formato !== 'undefined' && Formato.TASA_USD !== undefined) {
          Formato.TASA_USD = cambios.tasaUSD;
        }
        huboCambios = true;
      }
      
      // Idioma
      if (cambios.idioma) {
        Storage.guardar('idioma', cambios.idioma);
        huboCambios = true;
      }
      
      // Tema (ya se aplicó en vivo, solo guardar)
      if (cambios.tema) {
        Storage.guardar('tema', cambios.tema);
        huboCambios = true;
      }
      
      if (huboCambios) {
        Modal.toast('✓ Configuración guardada');
        // Refrescar header (nombre/avatar)
        App.cargarUsuarioPerfil();
      } else {
        Modal.toast('Sin cambios para guardar');
      }
    } catch (e) {
      Modal.toast('Error: ' + e.message, 'error');
    }
  },
};
