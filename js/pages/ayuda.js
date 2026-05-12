/* ============================================
   PÁGINA: AYUDA (v0.11.0)
   ============================================
   - FAQ con preguntas comunes
   - Tutorial paso a paso (carrusel)
   - Formulario de feedback
   ============================================ */

const Ayuda = {
  
  monedaVista: 'PEN',
  tabActiva: 'faq', // faq | tutorial | feedback
  faqAbierto: null, // id del FAQ expandido
  tutorialPaso: 0,
  
  // FAQ
  preguntas: [
    {
      id: 'q1',
      categoria: 'general',
      pregunta: '¿Cómo registro una transacción?',
      respuesta: 'Click en el botón "+ Nueva" del header. Elige Egreso o Ingreso, ingresa el monto, selecciona la cuenta, categoría y agrega notas si quieres. Luego "Crear transacción".',
    },
    {
      id: 'q2',
      categoria: 'tarjetas',
      pregunta: '¿Cómo agrego una tarjeta de débito?',
      respuesta: 'Ve a "Tarjetas" → click en "+ Nueva tarjeta" → selecciona "Débito" → elige la cuenta bancaria a vincular. Las tarjetas de débito comparten saldo con su cuenta.',
    },
    {
      id: 'q3',
      categoria: 'transferencias',
      pregunta: '¿Las transferencias afectan mis ingresos/egresos?',
      respuesta: 'No. Las transferencias entre tus propias cuentas no se cuentan como ingresos ni egresos reales. Solo mueven dinero de una cuenta a otra. Aparecen en una sección aparte del dashboard.',
    },
    {
      id: 'q4',
      categoria: 'presupuestos',
      pregunta: '¿Qué es "trasladar sobrante" en presupuestos?',
      respuesta: 'Si al final del mes tu presupuesto tiene dinero sobrante, puedes trasladar ese monto al presupuesto del mes siguiente. Es como tener "sobres" donde el dinero no gastado se acumula.',
    },
    {
      id: 'q5',
      categoria: 'deudas',
      pregunta: '¿Puedo modificar el monto de una cuota específica?',
      respuesta: 'Sí. Ve a "Deudas" → click en una deuda → "Detalle" → click en ✏️ de cualquier cuota → cambia el monto. Las demás cuotas se mantienen igual. Útil cuando pagas adelantos.',
    },
    {
      id: 'q6',
      categoria: 'general',
      pregunta: '¿Cómo cambio el tema (claro/oscuro)?',
      respuesta: 'Click en el ícono ☀️/🌙 del header. También puedes cambiarlo desde Configuración → Apariencia.',
    },
    {
      id: 'q7',
      categoria: 'tarjetas',
      pregunta: '¿Qué significa los colores de la barra de uso de tarjeta?',
      respuesta: '🟢 Verde (<30%) = uso saludable | 🟡 Amarillo (30-70%) = alerta, controla el gasto | 🔴 Rojo (>70%) = peligro, evita más compras y considera pagar.',
    },
    {
      id: 'q8',
      categoria: 'datos',
      pregunta: '¿Mis datos están seguros?',
      respuesta: 'Actualmente tus datos viven en localStorage (tu navegador). No se envían a ningún servidor. En la próxima versión (v0.12.0) migraremos a Supabase con login seguro y multi-dispositivo.',
    },
    {
      id: 'q9',
      categoria: 'datos',
      pregunta: '¿Cómo resetear todos los datos?',
      respuesta: 'Haz triple-click sobre el ícono 💎 del sidebar. Confirma el reset. Esto restaura los datos de ejemplo.',
    },
    {
      id: 'q10',
      categoria: 'general',
      pregunta: '¿Qué es la "cuenta principal"?',
      respuesta: 'Es la cuenta que marcas como tu principal con la estrella ⭐ en el dashboard. Sirve como la cuenta sugerida por defecto en formularios. Solo puedes tener una principal a la vez.',
    },
  ],
  
  // Tutorial
  pasosT: [
    {
      titulo: '¡Bienvenido a FinanzApp! 💎',
      contenido: 'FinanzApp te ayuda a controlar tus finanzas personales: ingresos, gastos, tarjetas, deudas, presupuestos y metas de ahorro. Vamos a recorrer lo básico en 5 pasos.',
      icono: '👋',
      color: '#14F0CD',
    },
    {
      titulo: 'Paso 1: Configura tus cuentas',
      contenido: 'Empieza creando tus cuentas (efectivo, banco, billeteras digitales). Ve a la sección "Cuentas" o crea desde Configuración. Marca una como principal con la estrella ⭐.',
      icono: '🏦',
      color: '#06B6D4',
    },
    {
      titulo: 'Paso 2: Agrega tus tarjetas',
      contenido: 'Si usas tarjetas de crédito, agrégalas en "Tarjetas". Define línea de crédito, día de corte y pago. La app calculará automáticamente tus ciclos y cuotas.',
      icono: '💳',
      color: '#8B5CF6',
    },
    {
      titulo: 'Paso 3: Registra movimientos',
      contenido: 'Cada gasto o ingreso lo registras con "+ Nueva". Elige tipo (egreso/ingreso/transferencia/pago), monto, cuenta y categoría. Las transacciones aparecen en el historial.',
      icono: '💸',
      color: '#10B981',
    },
    {
      titulo: 'Paso 4: Crea presupuestos',
      contenido: 'En "Presupuestos" asigna un monto máximo a cada categoría por mes. La app te avisará si te acercas al límite. Al fin de mes puedes trasladar el sobrante al siguiente.',
      icono: '🎯',
      color: '#F59E0B',
    },
    {
      titulo: 'Paso 5: Revisa tus reportes',
      contenido: 'En "Reportes" verás gráficos completos: tendencias, distribución de gastos, score de salud financiera. ¡Úsalos para entender tus hábitos y mejorar!',
      icono: '📊',
      color: '#EF4444',
    },
    {
      titulo: '¡Listo! Ya conoces lo básico 🎉',
      contenido: 'Explora cada sección sin miedo. Si te equivocas, siempre puedes resetear haciendo triple-click en el 💎 del sidebar. Y si tienes dudas, las preguntas frecuentes están en la pestaña FAQ.',
      icono: '🎉',
      color: '#14F0CD',
    },
  ],
  
  render(container, monedaVista = 'PEN') {
    this.monedaVista = monedaVista;
    
    container.innerHTML = `
      <div class="ayuda-page">
        <div class="ayuda-header">
          <h2 class="ayuda-title">❓ Centro de ayuda</h2>
          <p class="ayuda-subtitle">Encuentra respuestas, aprende a usar FinanzApp y déjanos tu feedback</p>
        </div>
        
        <!-- Tabs -->
        <div class="ayuda-tabs">
          <button class="ayuda-tab ${this.tabActiva === 'faq' ? 'active' : ''}" data-tab="faq">
            ❔ Preguntas frecuentes
          </button>
          <button class="ayuda-tab ${this.tabActiva === 'tutorial' ? 'active' : ''}" data-tab="tutorial">
            🎓 Tutorial paso a paso
          </button>
          <button class="ayuda-tab ${this.tabActiva === 'feedback' ? 'active' : ''}" data-tab="feedback">
            💬 Contacto / Feedback
          </button>
        </div>
        
        <!-- Contenido según tab -->
        <div class="ayuda-contenido">
          ${this.tabActiva === 'faq' ? this.renderFAQ() : ''}
          ${this.tabActiva === 'tutorial' ? this.renderTutorial() : ''}
          ${this.tabActiva === 'feedback' ? this.renderFeedback() : ''}
        </div>
      </div>
    `;
    
    this.configurarEventos();
  },
  
  renderFAQ() {
    const categorias = [
      { id: 'todas', nombre: 'Todas' },
      { id: 'general', nombre: 'General' },
      { id: 'tarjetas', nombre: 'Tarjetas' },
      { id: 'transferencias', nombre: 'Transferencias' },
      { id: 'presupuestos', nombre: 'Presupuestos' },
      { id: 'deudas', nombre: 'Deudas' },
      { id: 'datos', nombre: 'Datos' },
    ];
    
    this.faqCategoria = this.faqCategoria || 'todas';
    
    const filtradas = this.faqCategoria === 'todas' 
      ? this.preguntas 
      : this.preguntas.filter(p => p.categoria === this.faqCategoria);
    
    return `
      <!-- Filtros por categoría -->
      <div class="faq-filtros">
        ${categorias.map(c => `
          <button class="faq-filtro ${this.faqCategoria === c.id ? 'active' : ''}" data-categoria="${c.id}">
            ${c.nombre}
          </button>
        `).join('')}
      </div>
      
      <!-- Lista de FAQ -->
      <div class="faq-lista">
        ${filtradas.map(p => `
          <div class="faq-item ${this.faqAbierto === p.id ? 'abierto' : ''}" data-faq-id="${p.id}">
            <button class="faq-pregunta">
              <span>${p.pregunta}</span>
              <span class="faq-toggle-icon">${this.faqAbierto === p.id ? '−' : '+'}</span>
            </button>
            <div class="faq-respuesta">
              <p>${p.respuesta}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  renderTutorial() {
    const paso = this.pasosT[this.tutorialPaso];
    const total = this.pasosT.length;
    
    return `
      <div class="tutorial-wrap">
        <!-- Indicador de progreso -->
        <div class="tutorial-progress">
          <span>Paso ${this.tutorialPaso + 1} de ${total}</span>
          <div class="tutorial-progress-bar">
            <div class="tutorial-progress-fill" style="width:${((this.tutorialPaso + 1) / total) * 100}%;background:${paso.color};"></div>
          </div>
        </div>
        
        <!-- Paso actual -->
        <div class="tutorial-card">
          <div class="tutorial-icon" style="background:${paso.color}22;color:${paso.color};border:2px solid ${paso.color}44;">
            ${paso.icono}
          </div>
          <h3 class="tutorial-titulo">${paso.titulo}</h3>
          <p class="tutorial-contenido">${paso.contenido}</p>
          
          <!-- Controles -->
          <div class="tutorial-controls">
            <button class="btn-secondary" id="tutPrev" ${this.tutorialPaso === 0 ? 'disabled' : ''}>
              ← Anterior
            </button>
            <div class="tutorial-dots">
              ${this.pasosT.map((_, i) => `
                <span class="tutorial-dot ${i === this.tutorialPaso ? 'active' : ''}" data-tut-paso="${i}"></span>
              `).join('')}
            </div>
            ${this.tutorialPaso < total - 1 ? `
              <button class="btn-primary" id="tutNext">Siguiente →</button>
            ` : `
              <button class="btn-primary" id="tutFinish">¡Empezar! 🚀</button>
            `}
          </div>
        </div>
      </div>
    `;
  },
  
  renderFeedback() {
    return `
      <div class="feedback-wrap">
        <div class="feedback-intro">
          <div class="feedback-icon">💬</div>
          <h3>¿Tienes una sugerencia o encontraste un bug?</h3>
          <p>Cuéntanos cómo podemos mejorar FinanzApp. Tu opinión nos ayuda a hacerla mejor para todos.</p>
        </div>
        
        <form id="feedbackForm" onsubmit="return false;" class="feedback-form">
          <div class="form-group">
            <label class="form-label">Tipo de feedback</label>
            <div class="config-toggle-group">
              <button type="button" class="config-toggle active" data-feedback-tipo="sugerencia">💡 Sugerencia</button>
              <button type="button" class="config-toggle" data-feedback-tipo="bug">🐛 Bug</button>
              <button type="button" class="config-toggle" data-feedback-tipo="elogio">⭐ Elogio</button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Asunto</label>
            <input type="text" class="form-input" id="fbAsunto" placeholder="Ej: Mejorar el filtro de transacciones" maxlength="100" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Detalle</label>
            <textarea class="form-input" id="fbDetalle" rows="5" placeholder="Describe tu sugerencia, el bug que encontraste o lo que te gusta de la app..." maxlength="1000" required></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">Tu email (opcional)</label>
            <input type="email" class="form-input" id="fbEmail" placeholder="Para responderte si es necesario">
            <div class="form-helper">No es obligatorio. Si lo dejas vacío, no podremos contactarte.</div>
          </div>
          
          <div class="feedback-info-box">
            ℹ️ Actualmente este formulario se guarda localmente. Cuando migremos a Supabase (v0.12.0) llegará a nuestro correo automáticamente.
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-secondary" id="fbCancelar">Limpiar</button>
            <button type="button" class="btn-primary" id="fbEnviar">📤 Enviar feedback</button>
          </div>
        </form>
        
        <!-- Historial de feedbacks enviados -->
        ${this.renderHistorialFeedback()}
      </div>
    `;
  },
  
  renderHistorialFeedback() {
    const historico = Storage.cargar('feedbackHistorial') || [];
    if (historico.length === 0) return '';
    
    return `
      <div class="feedback-historial">
        <h4 class="feedback-historial-title">📜 Tus feedbacks anteriores</h4>
        <div class="feedback-historial-list">
          ${historico.slice(-5).reverse().map(f => `
            <div class="feedback-historial-item">
              <div class="feedback-historial-tipo">
                ${f.tipo === 'sugerencia' ? '💡' : f.tipo === 'bug' ? '🐛' : '⭐'} ${f.asunto}
              </div>
              <div class="feedback-historial-fecha">${new Date(f.fecha).toLocaleDateString('es-PE')}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  configurarEventos() {
    // Tabs
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.tabActiva = btn.dataset.tab;
        this.render(document.getElementById('pageContent'), this.monedaVista);
      });
    });
    
    // FAQ: toggle de preguntas
    document.querySelectorAll('.faq-item').forEach(item => {
      const btn = item.querySelector('.faq-pregunta');
      if (btn) {
        btn.addEventListener('click', () => {
          const id = item.dataset.faqId;
          this.faqAbierto = (this.faqAbierto === id) ? null : id;
          this.render(document.getElementById('pageContent'), this.monedaVista);
        });
      }
    });
    
    // FAQ: filtros por categoría
    document.querySelectorAll('[data-categoria]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.faqCategoria = btn.dataset.categoria;
        this.faqAbierto = null;
        this.render(document.getElementById('pageContent'), this.monedaVista);
      });
    });
    
    // Tutorial: controles
    const btnPrev = document.getElementById('tutPrev');
    if (btnPrev) btnPrev.addEventListener('click', () => {
      if (this.tutorialPaso > 0) {
        this.tutorialPaso--;
        this.render(document.getElementById('pageContent'), this.monedaVista);
      }
    });
    
    const btnNext = document.getElementById('tutNext');
    if (btnNext) btnNext.addEventListener('click', () => {
      if (this.tutorialPaso < this.pasosT.length - 1) {
        this.tutorialPaso++;
        this.render(document.getElementById('pageContent'), this.monedaVista);
      }
    });
    
    const btnFinish = document.getElementById('tutFinish');
    if (btnFinish) btnFinish.addEventListener('click', () => {
      Modal.toast('¡A explorar FinanzApp! 🚀');
      App.navegarA('dashboard');
    });
    
    // Tutorial: dots
    document.querySelectorAll('[data-tut-paso]').forEach(dot => {
      dot.addEventListener('click', () => {
        this.tutorialPaso = parseInt(dot.dataset.tutPaso);
        this.render(document.getElementById('pageContent'), this.monedaVista);
      });
    });
    
    // Feedback: tipo
    document.querySelectorAll('[data-feedback-tipo]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-feedback-tipo]').forEach(b => b.classList.toggle('active', b === btn));
      });
    });
    
    // Feedback: enviar
    const btnEnviar = document.getElementById('fbEnviar');
    if (btnEnviar) btnEnviar.addEventListener('click', () => this.enviarFeedback());
    
    // Feedback: cancelar
    const btnCancelar = document.getElementById('fbCancelar');
    if (btnCancelar) btnCancelar.addEventListener('click', () => {
      document.getElementById('fbAsunto').value = '';
      document.getElementById('fbDetalle').value = '';
      document.getElementById('fbEmail').value = '';
    });
  },
  
  enviarFeedback() {
    const asunto = document.getElementById('fbAsunto').value.trim();
    const detalle = document.getElementById('fbDetalle').value.trim();
    const email = document.getElementById('fbEmail').value.trim();
    const tipoEl = document.querySelector('[data-feedback-tipo].active');
    const tipo = tipoEl ? tipoEl.dataset.feedbackTipo : 'sugerencia';
    
    if (!asunto) {
      Modal.toast('Escribe un asunto', 'error');
      document.getElementById('fbAsunto').focus();
      return;
    }
    if (!detalle || detalle.length < 10) {
      Modal.toast('El detalle debe tener al menos 10 caracteres', 'error');
      document.getElementById('fbDetalle').focus();
      return;
    }
    
    const feedback = {
      id: Date.now(),
      tipo,
      asunto,
      detalle,
      email,
      fecha: new Date().toISOString(),
    };
    
    const historico = Storage.cargar('feedbackHistorial') || [];
    historico.push(feedback);
    Storage.guardar('feedbackHistorial', historico);
    
    Modal.toast('✓ Feedback enviado. ¡Gracias por tu aporte!');
    
    // Limpiar y refrescar
    document.getElementById('fbAsunto').value = '';
    document.getElementById('fbDetalle').value = '';
    document.getElementById('fbEmail').value = '';
    setTimeout(() => this.render(document.getElementById('pageContent'), this.monedaVista), 500);
  },
};
