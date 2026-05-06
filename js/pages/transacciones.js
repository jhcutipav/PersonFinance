/* ============================================
   PÁGINA: TRANSACCIONES
   ============================================ */

const Transacciones = {
  
  // Estado de filtros activos
  filtros: {
    busqueda: '',
    tipo: '',
    categoriaId: '',
    cuentaId: '',
  },
  
  monedaVista: 'PEN',
  
  /**
   * Renderiza la página completa
   */
  render(container, monedaVista = 'PEN') {
    this.monedaVista = monedaVista;
    container.innerHTML = `
      ${this.renderToolbar()}
      ${this.renderResumen()}
      <div id="transListContainer">
        ${this.renderLista()}
      </div>
    `;
    this.configurarEventos();
  },
  
  /**
   * Toolbar con búsqueda y filtros
   */
  renderToolbar() {
    const cuentas = API.obtenerCuentas();
    const categoriasPrincipales = API.obtenerCategorias({ soloPrincipales: true });
    
    return `
      <div class="trans-toolbar">
        <div class="trans-search">
          <span class="trans-search-icon">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </span>
          <input type="text" id="transSearch" placeholder="Buscar por descripción..." value="${this.filtros.busqueda}">
        </div>
        
        <div class="trans-filters">
          <select class="filter-select ${this.filtros.tipo ? 'active' : ''}" id="filterTipo">
            <option value="">Todos los tipos</option>
            <option value="ingreso" ${this.filtros.tipo === 'ingreso' ? 'selected' : ''}>Ingresos</option>
            <option value="egreso" ${this.filtros.tipo === 'egreso' ? 'selected' : ''}>Egresos</option>
          </select>
          
          <select class="filter-select ${this.filtros.cuentaId ? 'active' : ''}" id="filterCuenta">
            <option value="">Todas las cuentas</option>
            ${cuentas.map(c => `
              <option value="${c.id}" ${this.filtros.cuentaId == c.id ? 'selected' : ''}>${c.nombre}</option>
            `).join('')}
          </select>
          
          <select class="filter-select ${this.filtros.categoriaId ? 'active' : ''}" id="filterCategoria">
            <option value="">Todas las categorías</option>
            ${categoriasPrincipales.map(c => `
              <option value="${c.id}" ${this.filtros.categoriaId == c.id ? 'selected' : ''}>${c.icono} ${c.nombre}</option>
            `).join('')}
          </select>
        </div>
      </div>
    `;
  },
  
  /**
   * Resumen del filtro actual (totales)
   */
  renderResumen() {
    const trans = this.obtenerTransaccionesFiltradas();
    
    const monedaCalc = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const ingresos = Formato.sumarEnMoneda(
      trans.filter(t => t.tipo === 'ingreso'),
      monedaCalc
    );
    const egresos = Formato.sumarEnMoneda(
      trans.filter(t => t.tipo === 'egreso'),
      monedaCalc
    );
    
    return `
      <div class="trans-summary">
        <div class="summary-pill">
          <span class="label">Mostrando:</span>
          <span class="value">${trans.length} ${trans.length === 1 ? 'movimiento' : 'movimientos'}</span>
        </div>
        <div class="summary-pill income">
          <span class="label">Ingresos:</span>
          <span class="value">${Formato.formatearMoneda(ingresos, monedaCalc)}</span>
        </div>
        <div class="summary-pill expense">
          <span class="label">Egresos:</span>
          <span class="value">${Formato.formatearMoneda(egresos, monedaCalc)}</span>
        </div>
      </div>
    `;
  },
  
  /**
   * Lista de transacciones agrupadas por fecha
   */
  renderLista() {
    const trans = this.obtenerTransaccionesFiltradas();
    
    if (trans.length === 0) {
      return `
        <div class="glass-card">
          <div class="trans-empty">
            <div class="icon">📭</div>
            <h3>No hay transacciones</h3>
            <p>${this.tieneFiltrosActivos() ? 'Prueba quitando algunos filtros' : 'Empieza registrando tu primer movimiento'}</p>
            ${!this.tieneFiltrosActivos() ? `
              <button class="btn-primary" onclick="Transacciones.abrirModal()">+ Nueva transacción</button>
            ` : ''}
          </div>
        </div>
      `;
    }
    
    // Agrupar por fecha
    const grupos = this.agruparPorFecha(trans);
    
    return `
      <div class="trans-list">
        ${Object.entries(grupos).map(([fecha, items]) => this.renderGrupoFecha(fecha, items)).join('')}
      </div>
    `;
  },
  
  renderGrupoFecha(fecha, items) {
    const monedaCalc = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    
    // Calcular total del grupo
    const ingresos = Formato.sumarEnMoneda(items.filter(t => t.tipo === 'ingreso'), monedaCalc);
    const egresos = Formato.sumarEnMoneda(items.filter(t => t.tipo === 'egreso'), monedaCalc);
    const neto = ingresos - egresos;
    const signo = neto >= 0 ? '+' : '';
    
    return `
      <div class="date-group">
        <div class="date-group-header">
          <div class="date-group-title">${fecha}</div>
          <div class="date-group-total">
            ${items.length} ${items.length === 1 ? 'movimiento' : 'movimientos'}
            ·
            <strong>${signo}${Formato.formatearMoneda(neto, monedaCalc)}</strong>
          </div>
        </div>
        ${items.map(t => this.renderItem(t)).join('')}
      </div>
    `;
  },
  
  renderItem(trans) {
    const categoria = API.obtenerCategoriaPorId(trans.categoriaId);
    const cuenta = API.obtenerCuentaPorId(trans.cuentaId);
    const padre = API.obtenerCategoriaPadre(trans.categoriaId);
    
    const esIngreso = trans.tipo === 'ingreso';
    const signo = esIngreso ? '+' : '-';
    const claseColor = esIngreso ? 'income' : 'expense';
    
    // Mostrar jerarquía si tiene padre: "Alimentación › Supermercado"
    const categoriaTexto = padre 
      ? `<span class="parent">${padre.nombre} ›</span> ${categoria.nombre}`
      : categoria.nombre;
    
    return `
      <div class="trans-item" onclick="Transacciones.abrirModal(${trans.id})">
        <div class="icon-box ${categoria.color || 'purple'}">
          <span>${categoria.icono}</span>
        </div>
        <div class="trans-item-info">
          <div class="trans-item-desc">${trans.descripcion || categoria.nombre}</div>
          <div class="trans-item-meta">
            <span class="trans-category-path">${categoriaTexto}</span>
            <span class="separator">·</span>
            <span>${cuenta ? cuenta.nombre : 'Sin cuenta'}</span>
          </div>
        </div>
        <div class="trans-item-amount ${claseColor}">
          ${signo}${Formato.formatearMoneda(trans.monto, trans.moneda)}
        </div>
      </div>
    `;
  },
  
  /* ============ LÓGICA ============ */
  
  obtenerTransaccionesFiltradas() {
    const filtros = {};
    if (this.filtros.busqueda) filtros.busqueda = this.filtros.busqueda;
    if (this.filtros.tipo) filtros.tipo = this.filtros.tipo;
    if (this.filtros.cuentaId) filtros.cuentaId = parseInt(this.filtros.cuentaId);
    if (this.filtros.categoriaId) filtros.categoriaId = parseInt(this.filtros.categoriaId);
    return API.obtenerTransacciones(filtros);
  },
  
  tieneFiltrosActivos() {
    return !!(this.filtros.busqueda || this.filtros.tipo || this.filtros.cuentaId || this.filtros.categoriaId);
  },
  
  agruparPorFecha(transacciones) {
    const grupos = {};
    transacciones.forEach(t => {
      const etiqueta = Fechas.formatoCorto(t.fecha);
      if (!grupos[etiqueta]) grupos[etiqueta] = [];
      grupos[etiqueta].push(t);
    });
    return grupos;
  },
  
  configurarEventos() {
    // Búsqueda con debounce
    const search = document.getElementById('transSearch');
    if (search) {
      let timeout;
      search.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.filtros.busqueda = e.target.value;
          this.refrescar();
        }, 250);
      });
    }
    
    // Filtros
    const filterTipo = document.getElementById('filterTipo');
    if (filterTipo) {
      filterTipo.addEventListener('change', (e) => {
        this.filtros.tipo = e.target.value;
        this.refrescar();
      });
    }
    
    const filterCuenta = document.getElementById('filterCuenta');
    if (filterCuenta) {
      filterCuenta.addEventListener('change', (e) => {
        this.filtros.cuentaId = e.target.value;
        this.refrescar();
      });
    }
    
    const filterCategoria = document.getElementById('filterCategoria');
    if (filterCategoria) {
      filterCategoria.addEventListener('change', (e) => {
        this.filtros.categoriaId = e.target.value;
        this.refrescar();
      });
    }
  },
  
  refrescar() {
    const container = document.getElementById('pageContent');
    if (container) {
      // Re-renderizar todo manteniendo el foco/valor de búsqueda
      const valorBusqueda = this.filtros.busqueda;
      this.render(container, this.monedaVista);
      // Restaurar foco si estaba escribiendo
      const search = document.getElementById('transSearch');
      if (search && valorBusqueda) {
        search.focus();
        search.setSelectionRange(valorBusqueda.length, valorBusqueda.length);
      }
    }
  },
  
  /* ============ MODAL ============ */
  
  /**
   * Abre el modal de crear/editar.
   * Si recibe ID, carga la transacción existente.
   */
  abrirModal(id = null) {
    TransaccionForm.abrir(id, () => this.refrescar());
  },
};
