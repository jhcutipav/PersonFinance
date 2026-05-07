/* ============================================
   PÁGINA: PRESUPUESTOS
   ============================================ */

const Presupuestos = {
  
  monedaVista: 'PEN',
  mesActual: new Date().getMonth() + 1,
  anioActual: new Date().getFullYear(),
  
  render(container, monedaVista = 'PEN') {
    this.monedaVista = monedaVista;
    
    container.innerHTML = `
      <div class="presupuestos-page">
        ${this.renderHeader()}
        ${this.renderSummary()}
        ${this.renderToolbar()}
        ${this.renderLista()}
      </div>
    `;
    
    this.configurarEventos();
  },
  
  /* ============ HEADER (selector de mes) ============ */
  renderHeader() {
    return `
      <div class="presupuestos-header">
        <div class="month-selector">
          <button class="month-nav-btn" id="prevMonth" aria-label="Mes anterior">‹</button>
          <div class="month-current">${Fechas.MESES[this.mesActual - 1]} ${this.anioActual}</div>
          <button class="month-nav-btn" id="nextMonth" aria-label="Mes siguiente">›</button>
        </div>
        
        <button class="btn-primary" id="btnNuevoPresup">
          <span class="btn-icon">+</span>
          <span>Nuevo presupuesto</span>
        </button>
      </div>
    `;
  },
  
  /* ============ RESUMEN GENERAL ============ */
  renderSummary() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const presupuestos = API.obtenerPresupuestos(this.mesActual, this.anioActual);
    
    if (presupuestos.length === 0) return '';
    
    // Sumar todos los presupuestos y todos los gastos
    let totalPresupuestado = 0;
    let totalGastado = 0;
    
    presupuestos.forEach(p => {
      totalPresupuestado += Formato.convertir(p.monto, p.moneda, moneda);
      const gastado = API.calcularGastadoEnCategoria(p.categoriaId, this.mesActual, this.anioActual, moneda);
      totalGastado += gastado;
    });
    
    const disponible = totalPresupuestado - totalGastado;
    const porcentaje = totalPresupuestado > 0 ? (totalGastado / totalPresupuestado) * 100 : 0;
    
    let claseColor = 'green';
    if (porcentaje >= 100) claseColor = 'red';
    else if (porcentaje >= 80) claseColor = 'amber';
    
    // Cuánto puede gastar al día (días que quedan del mes)
    const hoy = new Date();
    let diasRestantes = 0;
    if (this.mesActual === hoy.getMonth() + 1 && this.anioActual === hoy.getFullYear()) {
      const ultimoDia = new Date(this.anioActual, this.mesActual, 0).getDate();
      diasRestantes = Math.max(1, ultimoDia - hoy.getDate());
    }
    const porDia = diasRestantes > 0 ? disponible / diasRestantes : 0;
    
    return `
      <div class="presup-summary">
        <div class="presup-summary-header">
          <div>
            <div class="presup-summary-title">Total presupuestado</div>
            <div class="presup-summary-amount">${Formato.formatearMoneda(totalPresupuestado, moneda)}</div>
          </div>
          
          <div class="presup-summary-detail">
            <div>
              <div class="presup-summary-stat-label">Gastado</div>
              <div class="presup-summary-stat-value spent">${Formato.formatearMoneda(totalGastado, moneda)}</div>
            </div>
            <div>
              <div class="presup-summary-stat-label">${disponible >= 0 ? 'Disponible' : 'Excedido'}</div>
              <div class="presup-summary-stat-value ${disponible >= 0 ? 'available' : 'over'}">
                ${Formato.formatearMoneda(Math.abs(disponible), moneda)}
              </div>
            </div>
            ${diasRestantes > 0 ? `
              <div>
                <div class="presup-summary-stat-label">Por día (${diasRestantes} restantes)</div>
                <div class="presup-summary-stat-value ${disponible >= 0 ? 'available' : 'over'}">
                  ${Formato.formatearMoneda(Math.max(0, porDia), moneda)}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="presup-summary-bar">
          <div class="presup-summary-bar-track">
            <div class="presup-summary-bar-fill ${claseColor}" style="width: ${Math.min(porcentaje, 100)}%"></div>
          </div>
          <div class="presup-summary-bar-meta">
            <span><strong>${Math.round(porcentaje)}%</strong> usado</span>
            <span>${presupuestos.length} ${presupuestos.length === 1 ? 'categoría' : 'categorías'} con presupuesto</span>
          </div>
        </div>
      </div>
    `;
  },
  
  /* ============ TOOLBAR ============ */
  renderToolbar() {
    const presupuestos = API.obtenerPresupuestos(this.mesActual, this.anioActual);
    if (presupuestos.length === 0) return '';
    
    return `
      <div class="presup-toolbar">
        <div class="presup-toolbar-info">
          Mostrando presupuestos de <strong>${Fechas.MESES[this.mesActual - 1]} ${this.anioActual}</strong>
        </div>
      </div>
    `;
  },
  
  /* ============ LISTA ============ */
  renderLista() {
    const presupuestos = API.obtenerPresupuestos(this.mesActual, this.anioActual);
    
    if (presupuestos.length === 0) {
      return this.renderEmpty();
    }
    
    // Ordenar por % de uso descendente
    const conGastos = presupuestos.map(p => {
      const gastado = API.calcularGastadoEnCategoria(p.categoriaId, this.mesActual, this.anioActual, p.moneda);
      const porcentaje = p.monto > 0 ? (gastado / p.monto) * 100 : 0;
      return { ...p, gastado, porcentaje };
    });
    
    conGastos.sort((a, b) => b.porcentaje - a.porcentaje);
    
    return `
      <div class="presupuestos-grid">
        ${conGastos.map(p => this.renderCard(p)).join('')}
      </div>
    `;
  },
  
  renderEmpty() {
    return `
      <div class="presup-empty">
        <div class="presup-empty-icon">🎯</div>
        <h3>Sin presupuestos para ${Fechas.MESES[this.mesActual - 1]}</h3>
        <p>Crea tu primer presupuesto manualmente o usa una plantilla rápida</p>
        <div class="presup-empty-actions">
          <button class="btn-primary" id="btnNuevoEmpty">+ Crear manual</button>
          <button class="btn-secondary" id="btnPlantillaEmpty">📋 Usar plantilla</button>
        </div>
      </div>
    `;
  },
  
  renderCard(p) {
    const cat = API.obtenerCategoriaPorId(p.categoriaId);
    if (!cat) return '';
    
    const restante = p.monto - p.gastado;
    const exedido = p.gastado > p.monto;
    
    let claseColor = 'green';
    let claseCard = '';
    if (p.porcentaje >= 100) {
      claseColor = 'red';
      claseCard = 'over';
    } else if (p.porcentaje >= 80) {
      claseColor = 'amber';
      claseCard = 'warning';
    }
    
    // Calcular ritmo: si vamos a pasarnos
    const hoy = new Date();
    const esActual = this.mesActual === hoy.getMonth() + 1 && this.anioActual === hoy.getFullYear();
    
    let pace = '';
    if (esActual) {
      const ultimoDia = new Date(this.anioActual, this.mesActual, 0).getDate();
      const diaActual = hoy.getDate();
      const proporcion = diaActual / ultimoDia;
      const proyeccion = p.gastado / proporcion;
      
      if (proyeccion > p.monto * 1.1) {
        pace = `<span class="presup-card-pace bad">⚠ Proyección: ${Formato.formatearMoneda(proyeccion, p.moneda)}</span>`;
      } else if (proyeccion > p.monto * 0.95) {
        pace = `<span class="presup-card-pace warning">~ Al límite</span>`;
      } else {
        pace = `<span class="presup-card-pace good">✓ En ritmo</span>`;
      }
    }
    
    return `
      <div class="presup-card ${claseCard}" onclick="Presupuestos.abrirEditor(${p.id})">
        <div class="presup-card-header">
          <div class="presup-card-icon icon-box ${cat.color}">
            <span>${cat.icono}</span>
          </div>
          <div class="presup-card-info">
            <div class="presup-card-name">${cat.nombre}</div>
            <div class="presup-card-meta">
              ${API.obtenerSubcategorias(p.categoriaId).length > 0 ? 'Incluye subcategorías' : 'Categoría'}
            </div>
          </div>
          <div class="presup-card-percent ${claseColor}">${Math.round(p.porcentaje)}%</div>
        </div>
        
        <div class="presup-card-amounts">
          <span class="presup-card-spent">${Formato.formatearMoneda(p.gastado, p.moneda)}</span>
          <span class="presup-card-budget">de ${Formato.formatearMoneda(p.monto, p.moneda)}</span>
        </div>
        
        <div class="presup-card-progress">
          <div class="progress-fill ${claseColor}" style="width: ${Math.min(p.porcentaje, 100)}%"></div>
        </div>
        
        <div class="presup-card-footer">
          <div class="presup-card-remaining">
            ${exedido ? 
              `Excedido por <strong style="color:var(--color-danger);">${Formato.formatearMoneda(Math.abs(restante), p.moneda)}</strong>` :
              `<strong>${Formato.formatearMoneda(restante, p.moneda)}</strong> disponibles`
            }
          </div>
          ${pace}
        </div>
      </div>
    `;
  },
  
  /* ============ EVENTOS ============ */
  configurarEventos() {
    document.getElementById('prevMonth')?.addEventListener('click', () => {
      this.mesActual--;
      if (this.mesActual < 1) {
        this.mesActual = 12;
        this.anioActual--;
      }
      this.refrescar();
    });
    
    document.getElementById('nextMonth')?.addEventListener('click', () => {
      this.mesActual++;
      if (this.mesActual > 12) {
        this.mesActual = 1;
        this.anioActual++;
      }
      this.refrescar();
    });
    
    const btnNuevo = document.getElementById('btnNuevoPresup');
    if (btnNuevo) btnNuevo.addEventListener('click', () => this.abrirEditor(null));
    
    const btnNuevoEmpty = document.getElementById('btnNuevoEmpty');
    if (btnNuevoEmpty) btnNuevoEmpty.addEventListener('click', () => this.abrirEditor(null));
    
    const btnPlantilla = document.getElementById('btnPlantillaEmpty');
    if (btnPlantilla) btnPlantilla.addEventListener('click', () => this.abrirPlantillas());
  },
  
  refrescar() {
    const container = document.getElementById('pageContent');
    if (container) this.render(container, this.monedaVista);
  },
  
  /* ============ ACCIONES ============ */
  abrirEditor(id = null) {
    PresupuestoForm.abrir(id, this.mesActual, this.anioActual, () => this.refrescar());
  },
  
  abrirPlantillas() {
    PresupuestoForm.abrirPlantillas(this.mesActual, this.anioActual, () => this.refrescar());
  },
};
