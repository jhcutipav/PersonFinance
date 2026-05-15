/* ============================================================================
   ONBOARDING — Wizard de configuración inicial (v16)
   ============================================================================
   Pantalla que aparece UNA SOLA VEZ cuando un usuario nuevo crea su cuenta
   (no se muestra para invitados, ellos ya tienen datos demo).
   
   Tiene 4 pasos:
     1. Bienvenida
     2. Cuentas (efectivo, banco, billetera) - obligatorio recomendado pero saltable
     3. Tarjetas (opcional, saltable)
     4. Resumen + "Ir al Dashboard"
   
   Al terminar (o saltar), marca pendienteOnboarding=false y entra al app.
   ============================================================================ */

const Onboarding = {
  
  /* ============================================================
     ESTADO
     ============================================================ */
  
  // Paso actual: 1, 2, 3 o 4
  pasoActual: 1,
  
  // Cuentas que va agregando el usuario en el wizard
  cuentasAgregadas: [],
  
  // Tarjetas que va agregando el usuario
  tarjetasAgregadas: [],
  
  /* ============================================================
     MOSTRAR / OCULTAR
     ============================================================ */
  
  /**
   * mostrar — Despliega el wizard ocultando todo lo demás
   */
  mostrar() {
    // Resetear estado
    this.pasoActual = 1;
    this.cuentasAgregadas = [];
    this.tarjetasAgregadas = [];
    
    // Ocultar layout principal y login
    const appContainer = document.querySelector('.app-container');
    if (appContainer) appContainer.style.display = 'none';
    const loginRoot = document.getElementById('loginRoot');
    if (loginRoot) loginRoot.style.display = 'none';
    
    // Crear/mostrar contenedor de onboarding
    let root = document.getElementById('onboardingRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'onboardingRoot';
      document.body.appendChild(root);
    }
    root.style.display = 'flex';
    this.render();
  },
  
  /**
   * ocultar — Cierra el wizard y entra al dashboard
   */
  ocultar() {
    const root = document.getElementById('onboardingRoot');
    if (root) root.style.display = 'none';
    
    // Marcar como completado
    Storage.guardar('pendienteOnboarding', false);
    
    // Mostrar app y entrar normal
    const appContainer = document.querySelector('.app-container');
    if (appContainer) appContainer.style.display = '';
    
    if (typeof App !== 'undefined' && App.iniciarConSesion) {
      App.iniciarConSesion();
    }
  },
  
  /* ============================================================
     RENDER PRINCIPAL
     ============================================================ */
  
  /**
   * render — Renderiza el paso actual del wizard
   */
  render() {
    const root = document.getElementById('onboardingRoot');
    if (!root) return;
    
    root.innerHTML = `
      <div class="onb-bg-blob blob-1"></div>
      <div class="onb-bg-blob blob-2"></div>
      
      <div class="onb-card">
        <!-- Progress bar -->
        <div class="onb-progress">
          <div class="onb-progress-steps">
            ${[1, 2, 3, 4].map(n => `
              <div class="onb-step-indicator ${n < this.pasoActual ? 'done' : n === this.pasoActual ? 'active' : ''}">
                ${n < this.pasoActual ? '✓' : n}
              </div>
            `).join('')}
          </div>
          <div class="onb-progress-bar">
            <div class="onb-progress-fill" style="width:${(this.pasoActual / 4) * 100}%;"></div>
          </div>
        </div>
        
        <!-- Contenido del paso -->
        <div class="onb-content">
          ${this.renderPaso()}
        </div>
        
        <!-- Footer con navegación -->
        <div class="onb-footer">
          ${this.renderFooter()}
        </div>
      </div>
    `;
    
    this.configurarEventos();
  },
  
  /**
   * renderPaso — Renderiza el contenido del paso actual
   */
  renderPaso() {
    switch (this.pasoActual) {
      case 1: return this.renderPasoBienvenida();
      case 2: return this.renderPasoCuentas();
      case 3: return this.renderPasoTarjetas();
      case 4: return this.renderPasoResumen();
      default: return '';
    }
  },
  
  /**
   * renderFooter — Botones de navegación según el paso
   */
  renderFooter() {
    const sesion = (typeof Auth !== 'undefined') ? Auth.usuarioActual() : null;
    const nombreUsuario = sesion?.nombre || 'Usuario';
    
    if (this.pasoActual === 1) {
      return `
        <button class="onb-btn-skip" id="onbSaltarTodo">Saltar configuración</button>
        <button class="onb-btn-primary" id="onbContinuar">Empezar →</button>
      `;
    }
    if (this.pasoActual === 4) {
      return `
        <button class="onb-btn-primary" id="onbFinalizar">Ir al Dashboard 🚀</button>
      `;
    }
    // Pasos 2 y 3
    return `
      <button class="onb-btn-secondary" id="onbAtras">← Atrás</button>
      <button class="onb-btn-skip" id="onbSaltarPaso">${this.pasoActual === 2 ? 'Saltar' : 'Saltar tarjetas'}</button>
      <button class="onb-btn-primary" id="onbContinuar">Continuar →</button>
    `;
  },
  
  /* ============================================================
     PASO 1: BIENVENIDA
     ============================================================ */
  
  renderPasoBienvenida() {
    const sesion = (typeof Auth !== 'undefined') ? Auth.usuarioActual() : null;
    const nombre = sesion?.nombre?.split(' ')[0] || 'amigo';
    
    return `
      <div class="onb-welcome">
        <div class="onb-welcome-emoji">👋</div>
        <h1 class="onb-title">¡Hola, ${nombre}!</h1>
        <p class="onb-subtitle">Bienvenido a FinanzApp</p>
        
        <div class="onb-welcome-desc">
          <p>Vamos a configurar tu app en unos pocos pasos. Te ayudaremos a:</p>
        </div>
        
        <ul class="onb-features-list">
          <li>
            <span class="onb-feature-icon">🏦</span>
            <div>
              <strong>Registrar tus cuentas</strong>
              <p>Efectivo, bancos y billeteras digitales (Yape, Plin)</p>
            </div>
          </li>
          <li>
            <span class="onb-feature-icon">💳</span>
            <div>
              <strong>Agregar tus tarjetas</strong>
              <p>Crédito y débito con sus límites y fechas</p>
            </div>
          </li>
          <li>
            <span class="onb-feature-icon">📊</span>
            <div>
              <strong>Controlar tu dinero</strong>
              <p>Ingresos, gastos, deudas y metas de ahorro</p>
            </div>
          </li>
        </ul>
        
        <p class="onb-welcome-note">
          💡 Puedes saltarte la configuración y agregar todo después desde la app.
        </p>
      </div>
    `;
  },
  
  /* ============================================================
     PASO 2: CUENTAS
     ============================================================ */
  
  renderPasoCuentas() {
    return `
      <div class="onb-step-header">
        <h2 class="onb-step-title">🏦 Tus cuentas</h2>
        <p class="onb-step-desc">
          Agrega las cuentas con las que manejas tu dinero. 
          Puedes agregar más después desde la app.
        </p>
      </div>
      
      <!-- Botones para agregar tipos de cuenta -->
      <div class="onb-tipos-grid">
        <button class="onb-tipo-card" data-tipo="efectivo">
          <span class="onb-tipo-icon">💵</span>
          <span class="onb-tipo-label">Efectivo</span>
          <small>Dinero en mano</small>
        </button>
        <button class="onb-tipo-card" data-tipo="debito">
          <span class="onb-tipo-icon">🏦</span>
          <span class="onb-tipo-label">Cuenta bancaria</span>
          <small>BCP, Interbank, BBVA...</small>
        </button>
        <button class="onb-tipo-card" data-tipo="billetera">
          <span class="onb-tipo-icon">📱</span>
          <span class="onb-tipo-label">Billetera digital</span>
          <small>Yape, Plin, Prex...</small>
        </button>
      </div>
      
      <!-- Lista de cuentas agregadas -->
      ${this.cuentasAgregadas.length > 0 ? `
        <div class="onb-lista">
          <div class="onb-lista-header">
            <span>Tus cuentas (${this.cuentasAgregadas.length})</span>
          </div>
          ${this.cuentasAgregadas.map((c, i) => `
            <div class="onb-lista-item">
              <span class="onb-lista-icon">${c.icono}</span>
              <div class="onb-lista-info">
                <strong>${c.nombre}</strong>
                <small>${this.tipoLabel(c.tipo)} · ${c.moneda} · ${c.bancarizado ? '🏦 Bancarizada' : '💵 No bancarizada'}</small>
              </div>
              <div class="onb-lista-monto">
                ${Formato.formatearMoneda(c.saldo, c.moneda)}
              </div>
              <button class="onb-lista-remove" data-remove="${i}" title="Eliminar">✕</button>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="onb-empty">
          <p>Aún no has agregado cuentas.</p>
          <p>Click en uno de los tipos de arriba para empezar.</p>
        </div>
      `}
      
      <!-- Form modal embebido (se muestra al seleccionar un tipo) -->
      <div id="onbCuentaForm" class="onb-form" style="display:none;"></div>
    `;
  },
  
  /* ============================================================
     PASO 3: TARJETAS
     ============================================================ */
  
  renderPasoTarjetas() {
    const tieneCuentasDebito = this.cuentasAgregadas.some(c => c.tipo === 'debito');
    
    return `
      <div class="onb-step-header">
        <h2 class="onb-step-title">💳 Tus tarjetas</h2>
        <p class="onb-step-desc">
          ¿Usas tarjetas de crédito o débito? Agrégalas para controlar tus gastos.
          <br><em>Este paso es opcional, puedes saltarlo.</em>
        </p>
      </div>
      
      <!-- Botones para agregar tipo de tarjeta -->
      <div class="onb-tipos-grid">
        <button class="onb-tipo-card" data-tipo-tarjeta="credito">
          <span class="onb-tipo-icon">💳</span>
          <span class="onb-tipo-label">Tarjeta de crédito</span>
          <small>Con línea y fecha de pago</small>
        </button>
        <button class="onb-tipo-card ${!tieneCuentasDebito ? 'disabled' : ''}" 
                data-tipo-tarjeta="debito"
                ${!tieneCuentasDebito ? 'disabled' : ''}>
          <span class="onb-tipo-icon">💰</span>
          <span class="onb-tipo-label">Tarjeta de débito</span>
          <small>${tieneCuentasDebito ? 'Vinculada a una cuenta' : 'Necesitas una cuenta bancaria'}</small>
        </button>
      </div>
      
      <!-- Lista de tarjetas agregadas -->
      ${this.tarjetasAgregadas.length > 0 ? `
        <div class="onb-lista">
          <div class="onb-lista-header">
            <span>Tus tarjetas (${this.tarjetasAgregadas.length})</span>
          </div>
          ${this.tarjetasAgregadas.map((t, i) => `
            <div class="onb-lista-item">
              <span class="onb-lista-icon">💳</span>
              <div class="onb-lista-info">
                <strong>${t.nombre}</strong>
                <small>${t.tipoTarjeta === 'credito' ? 'Crédito' : 'Débito'} · ${t.banco} · ${t.moneda}</small>
              </div>
              <div class="onb-lista-monto">
                ${t.tipoTarjeta === 'credito' ? Formato.formatearMoneda(t.lineaCredito, t.moneda) : '—'}
              </div>
              <button class="onb-lista-remove" data-remove-tarjeta="${i}" title="Eliminar">✕</button>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="onb-empty">
          <p>No has agregado tarjetas.</p>
          <p>Está bien, puedes saltarte este paso.</p>
        </div>
      `}
      
      <!-- Form modal embebido -->
      <div id="onbTarjetaForm" class="onb-form" style="display:none;"></div>
    `;
  },
  
  /* ============================================================
     PASO 4: RESUMEN FINAL
     ============================================================ */
  
  renderPasoResumen() {
    const totalCuentas = this.cuentasAgregadas.length;
    const totalTarjetas = this.tarjetasAgregadas.length;
    const categoriasCargadas = (Storage.cargar('categorias') || []).length;
    
    return `
      <div class="onb-resumen">
        <div class="onb-resumen-emoji">🎉</div>
        <h2 class="onb-title">¡Todo listo!</h2>
        <p class="onb-subtitle">Tu app está configurada y lista para usar</p>
        
        <div class="onb-resumen-stats">
          <div class="onb-resumen-stat">
            <span class="onb-resumen-num">${totalCuentas}</span>
            <span class="onb-resumen-label">${totalCuentas === 1 ? 'Cuenta agregada' : 'Cuentas agregadas'}</span>
          </div>
          <div class="onb-resumen-stat">
            <span class="onb-resumen-num">${totalTarjetas}</span>
            <span class="onb-resumen-label">${totalTarjetas === 1 ? 'Tarjeta agregada' : 'Tarjetas agregadas'}</span>
          </div>
          <div class="onb-resumen-stat">
            <span class="onb-resumen-num">${categoriasCargadas}</span>
            <span class="onb-resumen-label">Categorías listas</span>
          </div>
        </div>
        
        ${totalCuentas === 0 ? `
          <div class="onb-warning">
            ⚠️ <strong>Sin cuentas no podrás registrar movimientos.</strong>
            Puedes agregar una desde el dashboard cuando quieras.
          </div>
        ` : `
          <div class="onb-tips">
            <strong>💡 Siguientes pasos:</strong>
            <ul>
              <li>Registra tu primera transacción con el botón "+ Nueva" del header</li>
              <li>Crea presupuestos para controlar tus gastos por categoría</li>
              <li>Configura tus gastos fijos (Netflix, internet, etc.)</li>
            </ul>
          </div>
        `}
      </div>
    `;
  },
  
  /* ============================================================
     CONFIGURAR EVENTOS
     ============================================================ */
  
  configurarEventos() {
    // Botón continuar (avanza al siguiente paso)
    const btnContinuar = document.getElementById('onbContinuar');
    if (btnContinuar) {
      btnContinuar.addEventListener('click', () => this.siguiente());
    }
    
    // Botón atrás
    const btnAtras = document.getElementById('onbAtras');
    if (btnAtras) {
      btnAtras.addEventListener('click', () => this.atras());
    }
    
    // Botón saltar paso
    const btnSaltar = document.getElementById('onbSaltarPaso');
    if (btnSaltar) {
      btnSaltar.addEventListener('click', () => this.siguiente(true));
    }
    
    // Botón saltar todo (solo en paso 1)
    const btnSaltarTodo = document.getElementById('onbSaltarTodo');
    if (btnSaltarTodo) {
      btnSaltarTodo.addEventListener('click', () => this.saltarTodo());
    }
    
    // Botón finalizar (paso 4)
    const btnFinalizar = document.getElementById('onbFinalizar');
    if (btnFinalizar) {
      btnFinalizar.addEventListener('click', () => this.finalizar());
    }
    
    // Botones de tipos de cuenta (paso 2)
    document.querySelectorAll('[data-tipo]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.abrirFormCuenta(btn.dataset.tipo);
      });
    });
    
    // Botones de tipos de tarjeta (paso 3)
    document.querySelectorAll('[data-tipo-tarjeta]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        this.abrirFormTarjeta(btn.dataset.tipoTarjeta);
      });
    });
    
    // Eliminar cuenta
    document.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.remove);
        this.cuentasAgregadas.splice(idx, 1);
        this.render();
      });
    });
    
    // Eliminar tarjeta
    document.querySelectorAll('[data-remove-tarjeta]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.removeTarjeta);
        this.tarjetasAgregadas.splice(idx, 1);
        this.render();
      });
    });
  },
  
  /* ============================================================
     NAVEGACIÓN ENTRE PASOS
     ============================================================ */
  
  siguiente(saltando = false) {
    if (this.pasoActual < 4) {
      this.pasoActual++;
      this.render();
    }
  },
  
  atras() {
    if (this.pasoActual > 1) {
      this.pasoActual--;
      this.render();
    }
  },
  
  /**
   * saltarTodo — Salta toda la configuración con confirmación
   */
  saltarTodo() {
    if (typeof Modal !== 'undefined' && Modal.confirmar) {
      Modal.confirmar({
        titulo: '¿Saltar la configuración?',
        mensaje: 'La app necesitará cuentas para funcionar. Podrás agregarlas después desde el dashboard. ¿Continuar igual?',
        textoConfirmar: 'Sí, saltar',
        tipoBoton: 'warning',
        onConfirmar: () => this.finalizar(),
      });
    } else {
      if (confirm('¿Saltar configuración? Podrás agregar cuentas después.')) {
        this.finalizar();
      }
    }
  },
  
  /**
   * finalizar — Guarda todo lo configurado y entra al dashboard
   */
  finalizar() {
    // Guardar cuentas creadas (asignando IDs)
    if (this.cuentasAgregadas.length > 0) {
      const cuentas = this.cuentasAgregadas.map((c, i) => ({
        ...c,
        id: i + 1,
        activo: true,
      }));
      
      // Resolver cuentaVinculadaIdx → cuentaVinculadaId (real)
      cuentas.forEach(c => {
        if (c.cuentaVinculadaIdx !== undefined) {
          c.cuentaVinculadaId = cuentas[c.cuentaVinculadaIdx]?.id;
          delete c.cuentaVinculadaIdx;
        }
      });
      
      // La primera cuenta es la principal por defecto
      if (cuentas.length > 0) cuentas[0].esPrincipal = true;
      Storage.guardar('cuentas', cuentas);
      
      // Guardar tarjetas creadas (con referencia a IDs reales)
      if (this.tarjetasAgregadas.length > 0) {
        const tarjetas = this.tarjetasAgregadas.map((t, i) => ({
          ...t,
          id: i + 1,
          activo: true,
        }));
        
        // Resolver cuentaVinculadaIdx → cuentaVinculadaId
        tarjetas.forEach(t => {
          if (t.cuentaVinculadaIdx !== undefined) {
            t.cuentaVinculadaId = cuentas[t.cuentaVinculadaIdx]?.id;
            delete t.cuentaVinculadaIdx;
          }
        });
        
        Storage.guardar('tarjetas', tarjetas);
      }
    } else if (this.tarjetasAgregadas.length > 0) {
      // Tarjetas sin cuentas (no debería pasar para débito, pero crédito sí)
      const tarjetas = this.tarjetasAgregadas
        .filter(t => t.tipoTarjeta === 'credito')
        .map((t, i) => ({
          ...t,
          id: i + 1,
          activo: true,
        }));
      Storage.guardar('tarjetas', tarjetas);
    }
    
    // Cerrar wizard y entrar al app
    this.ocultar();
  },
  
  /* ============================================================
     FORMULARIO INLINE DE CUENTA
     ============================================================ */
  
  /**
   * abrirFormCuenta — Muestra form inline para agregar una cuenta
   */
  abrirFormCuenta(tipo) {
    const formWrap = document.getElementById('onbCuentaForm');
    if (!formWrap) return;
    
    const tipoLabel = this.tipoLabel(tipo);
    const iconoDefault = tipo === 'efectivo' ? '💵' : (tipo === 'debito' ? '🏦' : '📱');
    
    // Si es billetera y hay cuentas bancarias, mostrar selector de vinculación
    const cuentasBancarias = this.cuentasAgregadas.filter(c => c.tipo === 'debito');
    
    formWrap.style.display = 'block';
    formWrap.innerHTML = `
      <div class="onb-form-card">
        <div class="onb-form-header">
          <span>${iconoDefault} Nueva ${tipoLabel}</span>
          <button class="onb-form-close" id="onbFormCloseCuenta">✕</button>
        </div>
        
        <div class="onb-form-field">
          <label>Nombre de la cuenta *</label>
          <input type="text" id="cuentaNombre" placeholder="Ej: ${tipo === 'debito' ? 'Interbank S/' : (tipo === 'billetera' ? 'Yape BCP' : 'Efectivo')}" maxlength="40">
        </div>
        
        <div class="onb-form-row">
          <div class="onb-form-field">
            <label>Moneda *</label>
            <select id="cuentaMoneda">
              <option value="PEN">PEN (S/.)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div class="onb-form-field">
            <label>Saldo inicial</label>
            <input type="number" id="cuentaSaldo" placeholder="0.00" step="0.01" value="0">
          </div>
        </div>
        
        ${tipo !== 'efectivo' ? `
          <div class="onb-form-field">
            <label>Banco (opcional)</label>
            <input type="text" id="cuentaBanco" placeholder="Ej: BCP, Interbank, BBVA..." maxlength="30">
          </div>
        ` : ''}
        
        ${tipo === 'billetera' && cuentasBancarias.length > 0 ? `
          <div class="onb-form-field">
            <label>¿Está vinculada a una cuenta bancaria?</label>
            <select id="cuentaVinculada">
              <option value="">No vinculada</option>
              ${cuentasBancarias.map((c, i) => `
                <option value="${i}">${c.icono} ${c.nombre}</option>
              `).join('')}
            </select>
          </div>
        ` : ''}
        
        <div class="onb-form-field">
          <label class="onb-checkbox-wrap">
            <input type="checkbox" id="cuentaBancarizado" ${tipo !== 'efectivo' ? 'checked' : ''}>
            <span>🏦 Cuenta bancarizada (visible para SBS/SUNAT)</span>
          </label>
          <small class="onb-form-hint">
            Marca esta opción si los movimientos pasan por una entidad bancaria regulada.
            <br>Efectivo y Prex normalmente NO son bancarizados.
          </small>
        </div>
        
        <div class="onb-form-field">
          <label>Color identificador</label>
          <div class="onb-color-grid">
            ${['green', 'blue', 'skyblue', 'purple', 'amber', 'red'].map((c, i) => `
              <button type="button" class="onb-color ${i === 0 ? 'selected' : ''} color-${c}" data-color="${c}"></button>
            `).join('')}
          </div>
        </div>
        
        <div class="onb-form-actions">
          <button class="onb-btn-secondary" id="onbFormCancelarCuenta">Cancelar</button>
          <button class="onb-btn-primary" id="onbFormGuardarCuenta">Agregar cuenta</button>
        </div>
      </div>
    `;
    
    // Eventos del form
    this.configurarEventosFormCuenta(tipo, iconoDefault);
  },
  
  configurarEventosFormCuenta(tipo, iconoDefault) {
    // Cerrar form
    const cerrar = () => {
      const formWrap = document.getElementById('onbCuentaForm');
      if (formWrap) formWrap.style.display = 'none';
    };
    
    document.getElementById('onbFormCloseCuenta')?.addEventListener('click', cerrar);
    document.getElementById('onbFormCancelarCuenta')?.addEventListener('click', cerrar);
    
    // Color picker
    let colorSeleccionado = 'green';
    document.querySelectorAll('.onb-color').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.onb-color').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        colorSeleccionado = btn.dataset.color;
      });
    });
    
    // Guardar
    document.getElementById('onbFormGuardarCuenta')?.addEventListener('click', () => {
      const nombre = document.getElementById('cuentaNombre').value.trim();
      const moneda = document.getElementById('cuentaMoneda').value;
      const saldo = parseFloat(document.getElementById('cuentaSaldo').value) || 0;
      const bancoEl = document.getElementById('cuentaBanco');
      const banco = bancoEl ? bancoEl.value.trim() : '';
      const vinculadaEl = document.getElementById('cuentaVinculada');
      const vinculadaIdx = vinculadaEl ? vinculadaEl.value : '';
      const bancarizado = document.getElementById('cuentaBancarizado').checked;
      
      if (!nombre) {
        if (typeof Modal !== 'undefined') Modal.toast('El nombre es obligatorio', 'error');
        else alert('El nombre es obligatorio');
        return;
      }
      
      const nueva = {
        nombre,
        tipo,
        moneda,
        saldo,
        color: colorSeleccionado,
        icono: iconoDefault,
        bancarizado,
      };
      
      if (banco) nueva.banco = banco;
      if (vinculadaIdx !== '' && vinculadaIdx !== undefined) {
        nueva.cuentaVinculadaIdx = parseInt(vinculadaIdx); // Se resolverá al guardar
      }
      
      this.cuentasAgregadas.push(nueva);
      cerrar();
      this.render();
    });
  },
  
  /* ============================================================
     FORMULARIO INLINE DE TARJETA
     ============================================================ */
  
  abrirFormTarjeta(tipoTarjeta) {
    const formWrap = document.getElementById('onbTarjetaForm');
    if (!formWrap) return;
    
    const cuentasDebito = this.cuentasAgregadas.filter(c => c.tipo === 'debito');
    
    formWrap.style.display = 'block';
    formWrap.innerHTML = `
      <div class="onb-form-card">
        <div class="onb-form-header">
          <span>💳 Nueva tarjeta de ${tipoTarjeta === 'credito' ? 'crédito' : 'débito'}</span>
          <button class="onb-form-close" id="onbFormCloseTarjeta">✕</button>
        </div>
        
        <div class="onb-form-field">
          <label>Nombre de la tarjeta *</label>
          <input type="text" id="tarjetaNombre" placeholder="Ej: Interbank TC, BCP Débito..." maxlength="40">
        </div>
        
        <div class="onb-form-row">
          <div class="onb-form-field">
            <label>Banco *</label>
            <input type="text" id="tarjetaBanco" placeholder="Ej: Interbank, BCP, BBVA" maxlength="20">
          </div>
          <div class="onb-form-field">
            <label>Marca</label>
            <select id="tarjetaMarca">
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="amex">American Express</option>
              <option value="otra">Otra</option>
            </select>
          </div>
        </div>
        
        <div class="onb-form-row">
          <div class="onb-form-field">
            <label>Últimos 4 dígitos</label>
            <input type="text" id="tarjetaDigitos" placeholder="0000" maxlength="4" pattern="[0-9]{4}">
          </div>
          <div class="onb-form-field">
            <label>Moneda *</label>
            <select id="tarjetaMoneda">
              <option value="PEN">PEN (S/.)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>
        
        ${tipoTarjeta === 'credito' ? `
          <div class="onb-form-row">
            <div class="onb-form-field">
              <label>Línea de crédito *</label>
              <input type="number" id="tarjetaLinea" placeholder="5000.00" step="0.01">
            </div>
            <div class="onb-form-field">
              <label>Saldo usado</label>
              <input type="number" id="tarjetaUsado" placeholder="0.00" step="0.01" value="0">
            </div>
          </div>
          
          <div class="onb-form-row">
            <div class="onb-form-field">
              <label>Día de corte (1-31)</label>
              <input type="number" id="tarjetaCorte" placeholder="15" min="1" max="31">
            </div>
            <div class="onb-form-field">
              <label>Día de pago (1-31)</label>
              <input type="number" id="tarjetaPago" placeholder="2" min="1" max="31">
            </div>
          </div>
        ` : `
          <div class="onb-form-field">
            <label>Cuenta vinculada *</label>
            <select id="tarjetaCuentaVinculada">
              <option value="">Selecciona una cuenta</option>
              ${cuentasDebito.map((c, i) => `
                <option value="${i}">${c.icono} ${c.nombre}</option>
              `).join('')}
            </select>
            <small class="onb-form-hint">El saldo de la tarjeta de débito viene de su cuenta vinculada.</small>
          </div>
        `}
        
        <div class="onb-form-field">
          <label>Color identificador</label>
          <div class="onb-color-grid">
            ${['green', 'blue', 'purple', 'amber', 'red', 'skyblue'].map((c, i) => `
              <button type="button" class="onb-color ${i === 0 ? 'selected' : ''} color-${c}" data-color-tarjeta="${c}"></button>
            `).join('')}
          </div>
        </div>
        
        <div class="onb-form-actions">
          <button class="onb-btn-secondary" id="onbFormCancelarTarjeta">Cancelar</button>
          <button class="onb-btn-primary" id="onbFormGuardarTarjeta">Agregar tarjeta</button>
        </div>
      </div>
    `;
    
    this.configurarEventosFormTarjeta(tipoTarjeta);
  },
  
  configurarEventosFormTarjeta(tipoTarjeta) {
    const cerrar = () => {
      const formWrap = document.getElementById('onbTarjetaForm');
      if (formWrap) formWrap.style.display = 'none';
    };
    
    document.getElementById('onbFormCloseTarjeta')?.addEventListener('click', cerrar);
    document.getElementById('onbFormCancelarTarjeta')?.addEventListener('click', cerrar);
    
    // Color picker
    let colorSeleccionado = 'green';
    document.querySelectorAll('[data-color-tarjeta]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-color-tarjeta]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        colorSeleccionado = btn.dataset.colorTarjeta;
      });
    });
    
    // Guardar
    document.getElementById('onbFormGuardarTarjeta')?.addEventListener('click', () => {
      const nombre = document.getElementById('tarjetaNombre').value.trim();
      const banco = document.getElementById('tarjetaBanco').value.trim();
      const marca = document.getElementById('tarjetaMarca').value;
      const digitos = document.getElementById('tarjetaDigitos').value.trim();
      const moneda = document.getElementById('tarjetaMoneda').value;
      
      if (!nombre || !banco) {
        if (typeof Modal !== 'undefined') Modal.toast('Nombre y banco son obligatorios', 'error');
        else alert('Nombre y banco son obligatorios');
        return;
      }
      
      const nueva = {
        nombre,
        banco,
        marca,
        ultimosDigitos: digitos || '0000',
        moneda,
        tipoTarjeta,
        color: colorSeleccionado,
        bancarizado: true, // tarjetas siempre bancarizadas
      };
      
      if (tipoTarjeta === 'credito') {
        const linea = parseFloat(document.getElementById('tarjetaLinea').value) || 0;
        const usado = parseFloat(document.getElementById('tarjetaUsado').value) || 0;
        const corte = parseInt(document.getElementById('tarjetaCorte').value) || 15;
        const pago = parseInt(document.getElementById('tarjetaPago').value) || 2;
        
        if (linea <= 0) {
          if (typeof Modal !== 'undefined') Modal.toast('La línea de crédito es obligatoria', 'error');
          else alert('La línea de crédito es obligatoria');
          return;
        }
        
        nueva.lineaCredito = linea;
        nueva.saldoUsado = usado;
        nueva.diaCorte = corte;
        nueva.diaPago = pago;
        nueva.titular = (typeof Auth !== 'undefined' && Auth.usuarioActual()?.nombre) || 'Titular';
        nueva.fechaExpiracion = '12/30';
      } else {
        // Débito: requiere cuenta vinculada
        const cuentaIdx = document.getElementById('tarjetaCuentaVinculada').value;
        if (cuentaIdx === '') {
          if (typeof Modal !== 'undefined') Modal.toast('Selecciona una cuenta vinculada', 'error');
          else alert('Selecciona una cuenta vinculada');
          return;
        }
        nueva.cuentaVinculadaIdx = parseInt(cuentaIdx);
      }
      
      this.tarjetasAgregadas.push(nueva);
      cerrar();
      this.render();
    });
  },
  
  /* ============================================================
     UTILIDADES
     ============================================================ */
  
  tipoLabel(tipo) {
    const labels = {
      efectivo: 'Cuenta de efectivo',
      debito: 'Cuenta bancaria',
      billetera: 'Billetera digital',
    };
    return labels[tipo] || tipo;
  },
};
