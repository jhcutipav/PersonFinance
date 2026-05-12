/* ============================================
   PÁGINA: NOTIFICACIONES (v0.11.0)
   ============================================
   Genera alertas automáticas basadas en datos:
   - Cuotas de deuda próximas a vencer
   - Gastos fijos pendientes del mes
   - Presupuestos excedidos
   - Metas atrasadas
   - Alto uso de crédito (>70% línea)
   ============================================ */

const Notificaciones = {
  
  monedaVista: 'PEN',
  filtroTipo: 'todas', // todas | urgentes | leidas | no_leidas
  
  render(container, monedaVista = 'PEN') {
    this.monedaVista = monedaVista;
    const notifs = this.generarNotificaciones();
    const noLeidas = notifs.filter(n => !n.leida).length;
    
    // Filtrar según tipo activo
    let notifsMostrar = notifs;
    if (this.filtroTipo === 'urgentes') notifsMostrar = notifs.filter(n => n.urgencia === 'alta');
    else if (this.filtroTipo === 'no_leidas') notifsMostrar = notifs.filter(n => !n.leida);
    else if (this.filtroTipo === 'leidas') notifsMostrar = notifs.filter(n => n.leida);
    
    container.innerHTML = `
      <div class="notifs-page">
        <div class="notifs-header">
          <div>
            <h2 class="notifs-title">🔔 Notificaciones</h2>
            <p class="notifs-subtitle">
              ${noLeidas > 0 ? `Tienes ${noLeidas} notificación${noLeidas > 1 ? 'es' : ''} sin leer` : 'Estás al día con todo'}
            </p>
          </div>
          ${noLeidas > 0 ? `
            <button class="btn-secondary" id="btnMarcarTodasLeidas">✓ Marcar todas como leídas</button>
          ` : ''}
        </div>
        
        <!-- Filtros -->
        <div class="notifs-tabs">
          <button class="notifs-tab ${this.filtroTipo === 'todas' ? 'active' : ''}" data-filtro="todas">
            Todas <span class="notifs-tab-count">${notifs.length}</span>
          </button>
          <button class="notifs-tab ${this.filtroTipo === 'urgentes' ? 'active' : ''}" data-filtro="urgentes">
            🚨 Urgentes <span class="notifs-tab-count">${notifs.filter(n => n.urgencia === 'alta').length}</span>
          </button>
          <button class="notifs-tab ${this.filtroTipo === 'no_leidas' ? 'active' : ''}" data-filtro="no_leidas">
            Sin leer <span class="notifs-tab-count">${noLeidas}</span>
          </button>
          <button class="notifs-tab ${this.filtroTipo === 'leidas' ? 'active' : ''}" data-filtro="leidas">
            Leídas <span class="notifs-tab-count">${notifs.filter(n => n.leida).length}</span>
          </button>
        </div>
        
        <!-- Lista de notificaciones -->
        <div class="notifs-list">
          ${notifsMostrar.length === 0 ? this.renderEmpty() : notifsMostrar.map(n => this.renderItem(n)).join('')}
        </div>
      </div>
    `;
    
    this.configurarEventos();
    this.actualizarBadgeSidebar(noLeidas);
  },
  
  /**
   * v0.11.0 — Genera todas las notificaciones dinámicamente
   */
  generarNotificaciones() {
    const leidasIds = Storage.cargar('notifsLeidas') || [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const notifs = [];
    
    // 1. Cuotas de deuda próximas a vencer
    const deudas = API.obtenerDeudas().filter(d => d.activo && d.cuotasPagadas < d.plazoMeses);
    deudas.forEach(d => {
      const proximoPago = new Date(hoy.getFullYear(), hoy.getMonth(), d.diaPago);
      if (proximoPago < hoy) proximoPago.setMonth(proximoPago.getMonth() + 1);
      const diasParaPago = Math.ceil((proximoPago - hoy) / (1000 * 60 * 60 * 24));
      
      if (diasParaPago <= 7) {
        const id = `deuda_${d.id}_${proximoPago.toISOString().split('T')[0]}`;
        notifs.push({
          id,
          tipo: 'deuda_proxima',
          urgencia: diasParaPago <= 2 ? 'alta' : (diasParaPago <= 5 ? 'media' : 'baja'),
          icono: '💰',
          color: '#F59E0B',
          titulo: `Cuota de ${d.nombre}`,
          mensaje: diasParaPago === 0 
            ? `Vence HOY. Cuota ${d.cuotasPagadas + 1}/${d.plazoMeses}`
            : `Vence en ${diasParaPago} día${diasParaPago === 1 ? '' : 's'} (${proximoPago.toLocaleDateString('es-PE')})`,
          fecha: hoy.toISOString(),
          ruta: 'deudas',
          accion: () => App.navegarA('deudas'),
          leida: leidasIds.includes(id),
        });
      }
    });
    
    // 2. Gastos fijos pendientes del mes actual
    const gastosFijos = API.obtenerGastosFijos().filter(g => g.activo);
    gastosFijos.forEach(g => {
      // Verificar si ya se pagó este mes
      const mesActual = hoy.getMonth();
      const anioActual = hoy.getFullYear();
      const yaPagado = (g.historico || []).some(h => {
        const f = new Date(h.fecha);
        return f.getMonth() === mesActual && f.getFullYear() === anioActual && h.pagado;
      });
      
      if (!yaPagado && g.diaCobro) {
        const fechaCobro = new Date(anioActual, mesActual, g.diaCobro);
        const diasParaCobro = Math.ceil((fechaCobro - hoy) / (1000 * 60 * 60 * 24));
        
        if (diasParaCobro >= -3 && diasParaCobro <= 7) {
          const id = `gasto_${g.id}_${anioActual}_${mesActual}`;
          notifs.push({
            id,
            tipo: 'gasto_fijo',
            urgencia: diasParaCobro <= 0 ? 'alta' : (diasParaCobro <= 3 ? 'media' : 'baja'),
            icono: g.icono || '📅',
            color: '#06B6D4',
            titulo: `${g.nombre} pendiente`,
            mensaje: diasParaCobro < 0
              ? `Vencido hace ${Math.abs(diasParaCobro)} día${Math.abs(diasParaCobro) === 1 ? '' : 's'}`
              : (diasParaCobro === 0 
                  ? `Vence HOY · ${Formato.formatearMoneda(g.monto, g.moneda)}`
                  : `Vence en ${diasParaCobro} día${diasParaCobro === 1 ? '' : 's'} · ${Formato.formatearMoneda(g.monto, g.moneda)}`),
            fecha: hoy.toISOString(),
            ruta: 'gastos-fijos',
            accion: () => App.navegarA('gastos-fijos'),
            leida: leidasIds.includes(id),
          });
        }
      }
    });
    
    // 3. Presupuestos excedidos
    const presupuestos = API.obtenerPresupuestos ? API.obtenerPresupuestos() : [];
    presupuestos.forEach(p => {
      const fechaP = new Date(p.anio || hoy.getFullYear(), (p.mes || hoy.getMonth() + 1) - 1, 1);
      if (fechaP.getMonth() === hoy.getMonth() && fechaP.getFullYear() === hoy.getFullYear()) {
        const gastado = API.calcularGastadoEnCategoria 
          ? API.calcularGastadoEnCategoria(p.categoriaId, p.mes, p.anio, p.moneda) 
          : 0;
        const pct = p.monto > 0 ? (gastado / p.monto) * 100 : 0;
        
        if (pct >= 90) {
          const cat = API.obtenerCategoriaPorId(p.categoriaId);
          const id = `presup_${p.id}_${hoy.getMonth()}`;
          notifs.push({
            id,
            tipo: 'presupuesto_excedido',
            urgencia: pct >= 100 ? 'alta' : 'media',
            icono: cat?.icono || '💸',
            color: pct >= 100 ? '#EF4444' : '#F59E0B',
            titulo: pct >= 100 ? `Presupuesto EXCEDIDO en ${cat?.nombre || 'categoría'}` : `Presupuesto casi al límite`,
            mensaje: `Gastado ${Formato.formatearMoneda(gastado, p.moneda)} de ${Formato.formatearMoneda(p.monto, p.moneda)} (${pct.toFixed(0)}%)`,
            fecha: hoy.toISOString(),
            ruta: 'presupuestos',
            accion: () => App.navegarA('presupuestos'),
            leida: leidasIds.includes(id),
          });
        }
      }
    });
    
    // 4. Metas atrasadas
    const metas = API.obtenerMetas ? API.obtenerMetas() : [];
    metas.forEach(m => {
      if (!m.activa || m.montoActual >= m.montoObjetivo) return;
      const fechaLim = new Date(m.fechaLimite);
      const diasRestantes = Math.ceil((fechaLim - hoy) / (1000 * 60 * 60 * 24));
      const totalDias = Math.ceil((fechaLim - new Date(m.fechaCreacion || m.fechaInicio || hoy)) / (1000 * 60 * 60 * 24));
      const pctTiempoUsado = totalDias > 0 ? 1 - (diasRestantes / totalDias) : 1;
      const pctProgreso = m.montoObjetivo > 0 ? (m.montoActual / m.montoObjetivo) : 0;
      
      // Está atrasada si va menos progreso del que debería según tiempo
      const atrasada = pctTiempoUsado > pctProgreso + 0.15 && diasRestantes < 60;
      
      if (atrasada || diasRestantes < 7) {
        const id = `meta_${m.id}`;
        notifs.push({
          id,
          tipo: 'meta_atrasada',
          urgencia: diasRestantes < 7 ? 'alta' : 'media',
          icono: m.icono || '🎯',
          color: '#8B5CF6',
          titulo: diasRestantes < 0 ? `Meta vencida: ${m.nombre}` : `Meta atrasada: ${m.nombre}`,
          mensaje: diasRestantes < 0 
            ? `Vencida hace ${Math.abs(diasRestantes)} días. Progreso ${(pctProgreso * 100).toFixed(0)}%`
            : `${diasRestantes} días restantes. Llevas ${(pctProgreso * 100).toFixed(0)}% del objetivo`,
          fecha: hoy.toISOString(),
          ruta: 'metas',
          accion: () => App.navegarA('metas'),
          leida: leidasIds.includes(id),
        });
      }
    });
    
    // 5. Alto uso de crédito (>70%)
    const tarjetas = API.obtenerTarjetas().filter(t => !t.tipoTarjeta || t.tipoTarjeta === 'credito');
    tarjetas.forEach(t => {
      if (!t.lineaCredito) return;
      const pctUso = (t.saldoUsado / t.lineaCredito) * 100;
      if (pctUso >= 70) {
        const id = `tarjeta_uso_${t.id}`;
        notifs.push({
          id,
          tipo: 'credito_alto',
          urgencia: pctUso >= 90 ? 'alta' : 'media',
          icono: '💳',
          color: pctUso >= 90 ? '#EF4444' : '#F59E0B',
          titulo: `Alto uso de ${t.nombre}`,
          mensaje: `Has usado ${pctUso.toFixed(0)}% de tu línea. Disponible: ${Formato.formatearMoneda(t.lineaCredito - t.saldoUsado, t.moneda)}`,
          fecha: hoy.toISOString(),
          ruta: 'tarjetas',
          accion: () => App.navegarA('tarjetas'),
          leida: leidasIds.includes(id),
        });
      }
    });
    
    // Ordenar: urgencia alta primero, luego no leídas
    notifs.sort((a, b) => {
      if (a.urgencia !== b.urgencia) {
        const orden = { alta: 0, media: 1, baja: 2 };
        return orden[a.urgencia] - orden[b.urgencia];
      }
      if (a.leida !== b.leida) return a.leida ? 1 : -1;
      return 0;
    });
    
    return notifs;
  },
  
  renderItem(n) {
    const urgenciaLabel = { alta: '🚨 Urgente', media: '⚠ Atención', baja: 'ℹ Recordatorio' };
    
    return `
      <div class="notif-item ${n.leida ? 'leida' : ''} urgencia-${n.urgencia}" 
           onclick="Notificaciones.abrirNotif('${n.id}', '${n.ruta}')"
           data-notif-id="${n.id}">
        <div class="notif-icon" style="background:${n.color}22;color:${n.color};border:1px solid ${n.color}44;">
          ${n.icono}
        </div>
        <div class="notif-content">
          <div class="notif-titulo-row">
            <span class="notif-titulo">${n.titulo}</span>
            <span class="notif-urgencia-badge" style="background:${n.color}22;color:${n.color};">${urgenciaLabel[n.urgencia]}</span>
          </div>
          <div class="notif-mensaje">${n.mensaje}</div>
          <div class="notif-meta">
            <span class="notif-ruta">📍 ${n.ruta.replace('-', ' ')}</span>
            ${!n.leida ? '<span class="notif-pendiente">● No leída</span>' : ''}
          </div>
        </div>
        <button class="notif-dismiss" onclick="event.stopPropagation(); Notificaciones.marcarLeida('${n.id}')" title="Marcar como leída">
          ${n.leida ? '✓' : '○'}
        </button>
      </div>
    `;
  },
  
  renderEmpty() {
    const msgs = {
      todas: 'Sin notificaciones pendientes',
      urgentes: 'Sin alertas urgentes',
      no_leidas: 'Estás al día, no tienes nada sin leer',
      leidas: 'Aún no has leído ninguna notificación',
    };
    return `
      <div class="notifs-empty">
        <div class="notifs-empty-icon">🎉</div>
        <div class="notifs-empty-title">${msgs[this.filtroTipo]}</div>
        <div class="notifs-empty-desc">Te avisaremos cuando algo importante necesite tu atención</div>
      </div>
    `;
  },
  
  configurarEventos() {
    // Tabs filtro
    document.querySelectorAll('[data-filtro]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filtroTipo = btn.dataset.filtro;
        this.render(document.getElementById('pageContent'), this.monedaVista);
      });
    });
    
    // Marcar todas como leídas
    const btnTodas = document.getElementById('btnMarcarTodasLeidas');
    if (btnTodas) {
      btnTodas.addEventListener('click', () => {
        const notifs = this.generarNotificaciones();
        const ids = notifs.map(n => n.id);
        Storage.guardar('notifsLeidas', ids);
        Modal.toast('✓ Todas marcadas como leídas');
        this.render(document.getElementById('pageContent'), this.monedaVista);
      });
    }
  },
  
  abrirNotif(notifId, ruta) {
    this.marcarLeida(notifId, false);
    if (ruta) App.navegarA(ruta);
  },
  
  marcarLeida(notifId, refrescar = true) {
    const leidas = Storage.cargar('notifsLeidas') || [];
    if (!leidas.includes(notifId)) {
      leidas.push(notifId);
      Storage.guardar('notifsLeidas', leidas);
    }
    if (refrescar) this.render(document.getElementById('pageContent'), this.monedaVista);
  },
  
  /**
   * Actualiza el badge de notificaciones en el sidebar
   */
  actualizarBadgeSidebar(noLeidas) {
    const badge = document.getElementById('navBadgeNotifs');
    if (badge) {
      badge.textContent = noLeidas;
      badge.style.display = noLeidas > 0 ? '' : 'none';
    }
  },
  
  /**
   * Permite que otras páginas actualicen el badge del sidebar
   */
  refrescarBadge() {
    const notifs = this.generarNotificaciones();
    const noLeidas = notifs.filter(n => !n.leida).length;
    this.actualizarBadgeSidebar(noLeidas);
  },
};
