/* ============================================
   PÁGINA: METAS DE AHORRO
   ============================================ */

const Metas = {
  
  monedaVista: 'PEN',
  filtroActivo: 'todas', // todas | activas | completadas | atrasadas
  
  render(container, monedaVista = 'PEN') {
    this.monedaVista = monedaVista;
    Graficos.destruirTodos();
    
    container.innerHTML = `
      <div class="metas-page">
        ${this.renderStats()}
        ${this.renderToolbar()}
        ${this.renderLista()}
      </div>
    `;
    
    this.configurarEventos();
  },
  
  /* ============ STATS ============ */
  renderStats() {
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    const todasMetas = API.obtenerMetas({ activas: true });
    
    const completadas = todasMetas.filter(m => m.montoActual >= m.montoObjetivo);
    const enCurso = todasMetas.filter(m => m.montoActual < m.montoObjetivo);
    
    let totalObjetivo = 0;
    let totalAhorrado = 0;
    let aporteMensualTotal = 0;
    
    todasMetas.forEach(m => {
      totalObjetivo += Formato.convertir(m.montoObjetivo, m.moneda, moneda);
      totalAhorrado += Formato.convertir(m.montoActual, m.moneda, moneda);
      
      if (m.montoActual < m.montoObjetivo) {
        const aporte = API.calcularAporteMensualRecomendado(m);
        aporteMensualTotal += Formato.convertir(aporte, m.moneda, moneda);
      }
    });
    
    const porcentajeGlobal = totalObjetivo > 0 ? (totalAhorrado / totalObjetivo) * 100 : 0;
    
    return `
      <div class="metas-stats-row">
        <div class="meta-stat-card">
          <div class="meta-stat-icon cyan">🎯</div>
          <div class="meta-stat-info">
            <div class="meta-stat-label">Total ahorrado</div>
            <div class="meta-stat-value">${Formato.formatearMoneda(totalAhorrado, moneda)}</div>
            <div class="meta-stat-meta">de ${Formato.formatearMoneda(totalObjetivo, moneda)}</div>
          </div>
        </div>
        
        <div class="meta-stat-card">
          <div class="meta-stat-icon green">📊</div>
          <div class="meta-stat-info">
            <div class="meta-stat-label">Progreso global</div>
            <div class="meta-stat-value">${Math.round(porcentajeGlobal)}%</div>
            <div class="meta-stat-meta">${todasMetas.length} ${todasMetas.length === 1 ? 'meta' : 'metas'} activas</div>
          </div>
        </div>
        
        <div class="meta-stat-card">
          <div class="meta-stat-icon purple">✅</div>
          <div class="meta-stat-info">
            <div class="meta-stat-label">Completadas</div>
            <div class="meta-stat-value">${completadas.length}</div>
            <div class="meta-stat-meta">${enCurso.length} ${enCurso.length === 1 ? 'pendiente' : 'pendientes'}</div>
          </div>
        </div>
        
        <div class="meta-stat-card">
          <div class="meta-stat-icon amber">💰</div>
          <div class="meta-stat-info">
            <div class="meta-stat-label">Aporte mensual</div>
            <div class="meta-stat-value">${Formato.formatearMoneda(aporteMensualTotal, moneda)}</div>
            <div class="meta-stat-meta">Recomendado para llegar a tiempo</div>
          </div>
        </div>
      </div>
    `;
  },
  
  /* ============ TOOLBAR ============ */
  renderToolbar() {
    const filtros = [
      { id: 'todas', label: 'Todas' },
      { id: 'en_curso', label: '⏳ En curso' },
      { id: 'completadas', label: '✅ Completadas' },
      { id: 'atrasadas', label: '⚠ Atrasadas' },
    ];
    
    return `
      <div class="metas-toolbar">
        <div class="metas-filters">
          ${filtros.map(f => `
            <button class="meta-filter-pill ${this.filtroActivo === f.id ? 'active' : ''}" 
                    data-filtro="${f.id}">${f.label}</button>
          `).join('')}
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn-secondary" id="btnPlantillaMeta">📋 Plantillas</button>
          <button class="btn-primary" id="btnNuevaMeta">
            <span class="btn-icon">+</span>
            <span>Nueva meta</span>
          </button>
        </div>
      </div>
    `;
  },
  
  /* ============ LISTA ============ */
  renderLista() {
    let metas = (Storage.cargar('metas') || []).filter(m => m.activa);
    
    // Aplicar filtro
    if (this.filtroActivo === 'completadas') {
      metas = metas.filter(m => m.montoActual >= m.montoObjetivo);
    } else if (this.filtroActivo === 'en_curso') {
      metas = metas.filter(m => {
        const estado = API.obtenerEstadoMeta(m);
        return estado === 'en_curso' || estado === 'atrasada';
      });
    } else if (this.filtroActivo === 'atrasadas') {
      metas = metas.filter(m => {
        const estado = API.obtenerEstadoMeta(m);
        return estado === 'atrasada' || estado === 'vencida';
      });
    }
    
    if (metas.length === 0) {
      return this.renderEmpty();
    }
    
    // Ordenar: completadas al final, atrasadas/vencidas primero
    metas.sort((a, b) => {
      const estadoA = API.obtenerEstadoMeta(a);
      const estadoB = API.obtenerEstadoMeta(b);
      const orden = { vencida: 0, atrasada: 1, en_curso: 2, completada: 3 };
      return orden[estadoA] - orden[estadoB];
    });
    
    return `
      <div class="metas-grid">
        ${metas.map(m => this.renderMetaCard(m)).join('')}
      </div>
    `;
  },
  
  renderEmpty() {
    if (this.filtroActivo !== 'todas') {
      return `
        <div class="metas-empty">
          <div class="metas-empty-icon">🔍</div>
          <h3>Sin resultados</h3>
          <p>No hay metas que coincidan con este filtro</p>
        </div>
      `;
    }
    
    return `
      <div class="metas-empty">
        <div class="metas-empty-icon">🎯</div>
        <h3>Aún no tienes metas de ahorro</h3>
        <p>Define tus objetivos financieros y empieza a tracking tu progreso. ¡Pequeños aportes constantes hacen grandes resultados!</p>
        <div class="metas-empty-actions">
          <button class="btn-primary" id="btnNuevaMetaEmpty">+ Crear meta</button>
          <button class="btn-secondary" id="btnPlantillaEmpty">📋 Usar plantilla</button>
        </div>
      </div>
    `;
  },
  
  renderMetaCard(meta) {
    const porcentaje = (meta.montoActual / meta.montoObjetivo) * 100;
    const restante = meta.montoObjetivo - meta.montoActual;
    const estado = API.obtenerEstadoMeta(meta);
    const aporteRecomendado = API.calcularAporteMensualRecomendado(meta);
    
    // Días restantes
    const hoy = new Date();
    const limite = new Date(meta.fechaLimite);
    const diasRestantes = Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24));
    
    // Color de la barra según estado
    let claseColor = 'cyan';
    if (estado === 'completada') claseColor = 'green';
    else if (estado === 'atrasada') claseColor = 'amber';
    else if (estado === 'vencida') claseColor = 'red';
    
    // Texto del estado
    const labelEstado = {
      completada: 'Completada',
      en_curso: 'En curso',
      atrasada: 'Atrasada',
      vencida: 'Vencida',
    }[estado];
    
    // Días formateados
    let labelDias = '';
    if (estado === 'completada') {
      labelDias = '🎉 ¡Completada!';
    } else if (diasRestantes < 0) {
      labelDias = `Venció hace ${Math.abs(diasRestantes)} días`;
    } else if (diasRestantes === 0) {
      labelDias = 'Vence hoy';
    } else if (diasRestantes < 30) {
      labelDias = `${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}`;
    } else {
      const meses = Math.floor(diasRestantes / 30);
      labelDias = `~${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    }
    
    const claseDias = diasRestantes < 30 && estado !== 'completada' ? 'warning' : '';
    
    return `
      <div class="meta-card ${estado}" onclick="Metas.verDetalle(${meta.id})">
        <div class="meta-card-header">
          <div class="meta-card-icon icon-box ${meta.color}">
            <span>${meta.icono}</span>
          </div>
          
          <div class="meta-card-info">
            <div class="meta-card-title-row">
              <span class="meta-card-title">${meta.nombre}</span>
              <span class="meta-card-status ${estado}">${labelEstado}</span>
              ${meta.prioridad === 'alta' ? `<span class="meta-card-priority alta">Alta prioridad</span>` : ''}
            </div>
            ${meta.descripcion ? `<div class="meta-card-desc">${meta.descripcion}</div>` : ''}
          </div>
        </div>
        
        <div class="meta-progress-section">
          <div class="meta-progress-amounts">
            <span class="meta-progress-current">${Formato.formatearMoneda(meta.montoActual, meta.moneda)}</span>
            <span class="meta-progress-target">de <strong>${Formato.formatearMoneda(meta.montoObjetivo, meta.moneda)}</strong></span>
          </div>
          
          <div class="meta-progress-bar">
            <div class="meta-progress-fill ${claseColor}" style="width: ${Math.min(porcentaje, 100)}%"></div>
          </div>
          
          <div class="meta-progress-percent">
            <span class="meta-progress-percent-value">${Math.round(porcentaje)}% completado</span>
            ${restante > 0 ? `
              <span class="meta-progress-remaining">Faltan <strong>${Formato.formatearMoneda(restante, meta.moneda)}</strong></span>
            ` : ''}
          </div>
        </div>
        
        <div class="meta-card-stats">
          <div class="meta-stat-item">
            <div class="meta-stat-item-label">Tiempo restante</div>
            <div class="meta-stat-item-value ${claseDias}">${labelDias}</div>
          </div>
          <div class="meta-stat-item">
            <div class="meta-stat-item-label">Aporte mensual</div>
            <div class="meta-stat-item-value">
              ${aporteRecomendado > 0 ? Formato.formatearMoneda(aporteRecomendado, meta.moneda) : '✓ Listo'}
            </div>
          </div>
        </div>
        
        <div class="meta-card-footer" onclick="event.stopPropagation()">
          ${estado === 'completada' ? `
            <button class="meta-action-btn primary" onclick="Metas.celebrar(${meta.id})">
              🎉 ¡Felicidades!
            </button>
            <button class="meta-action-btn secondary" onclick="Metas.abrirRetiro(${meta.id})">
              Retirar
            </button>
          ` : `
            <button class="meta-action-btn primary" onclick="Metas.abrirAporte(${meta.id})">
              💰 Aportar
            </button>
            <button class="meta-action-btn secondary" onclick="Metas.editar(${meta.id})">
              ✏️ Editar
            </button>
          `}
        </div>
      </div>
    `;
  },
  
  /* ============ EVENTOS ============ */
  configurarEventos() {
    document.querySelectorAll('.meta-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filtroActivo = btn.dataset.filtro;
        this.refrescar();
      });
    });
    
    const btnNueva = document.getElementById('btnNuevaMeta');
    if (btnNueva) btnNueva.addEventListener('click', () => MetaForm.abrir(null, () => this.refrescar()));
    
    const btnNuevaEmpty = document.getElementById('btnNuevaMetaEmpty');
    if (btnNuevaEmpty) btnNuevaEmpty.addEventListener('click', () => MetaForm.abrir(null, () => this.refrescar()));
    
    const btnPlantilla = document.getElementById('btnPlantillaMeta');
    if (btnPlantilla) btnPlantilla.addEventListener('click', () => MetaForm.abrirPlantillas(() => this.refrescar()));
    
    const btnPlantillaEmpty = document.getElementById('btnPlantillaEmpty');
    if (btnPlantillaEmpty) btnPlantillaEmpty.addEventListener('click', () => MetaForm.abrirPlantillas(() => this.refrescar()));
  },
  
  refrescar() {
    const container = document.getElementById('pageContent');
    if (container) this.render(container, this.monedaVista);
  },
  
  /* ============ ACCIONES ============ */
  editar(id) {
    MetaForm.abrir(id, () => this.refrescar());
  },
  
  abrirAporte(id) {
    const meta = API.obtenerMetaPorId(id);
    if (!meta) return;
    
    const restante = meta.montoObjetivo - meta.montoActual;
    const aporteRec = API.calcularAporteMensualRecomendado(meta);
    
    Modal.abrir({
      titulo: `Aportar a ${meta.nombre}`,
      contenido: `
        <div class="aporte-modal-monto">
          <div class="trans-modal-amount" style="margin:0;">
            <input type="number" id="aporteMonto" class="trans-modal-amount-input" 
                   placeholder="0.00" step="0.01" min="0" 
                   value="${aporteRec.toFixed(2)}" inputmode="decimal" autofocus>
            <div class="trans-modal-amount-currency">${Formato.SIMBOLOS[meta.moneda] || meta.moneda}</div>
          </div>
        </div>
        
        <div class="aporte-quick-amounts">
          <button class="aporte-quick-btn" data-monto="50">+50</button>
          <button class="aporte-quick-btn" data-monto="100">+100</button>
          <button class="aporte-quick-btn" data-monto="200">+200</button>
          <button class="aporte-quick-btn" data-monto="500">+500</button>
        </div>
        
        <div class="aporte-progreso-preview">
          <div style="display:flex;justify-content:space-between;font-size:0.8125rem;">
            <span>Después del aporte:</span>
            <span><strong id="previewMonto">${Formato.formatearMoneda(meta.montoActual + aporteRec, meta.moneda)}</strong></span>
          </div>
          <div class="aporte-progreso-bar">
            <div class="aporte-progreso-bar-fill" id="previewBar" 
                 style="width: ${Math.min(((meta.montoActual + aporteRec) / meta.montoObjetivo) * 100, 100)}%"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-tertiary);">
            <span id="previewPct">${Math.round(((meta.montoActual + aporteRec) / meta.montoObjetivo) * 100)}% completado</span>
            <span>Falta: <strong id="previewFalta">${Formato.formatearMoneda(Math.max(0, restante - aporteRec), meta.moneda)}</strong></span>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="date" class="form-input" id="aporteFecha" 
                 value="${new Date().toISOString().split('T')[0]}">
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" onclick="Modal.cerrar()">Cancelar</button>
          <button class="btn-primary" id="confirmAporte">Aportar</button>
        </div>
      `,
    });
    
    // Botones rápidos: SUMAR al monto actual del input
    document.querySelectorAll('.aporte-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('aporteMonto');
        const actual = parseFloat(input.value) || 0;
        input.value = (actual + parseFloat(btn.dataset.monto)).toFixed(2);
        actualizarPreview();
      });
    });
    
    // Actualizar preview en tiempo real
    const actualizarPreview = () => {
      const monto = parseFloat(document.getElementById('aporteMonto').value) || 0;
      const nuevoMonto = meta.montoActual + monto;
      const nuevoPct = Math.min((nuevoMonto / meta.montoObjetivo) * 100, 100);
      const nuevaFalta = Math.max(0, meta.montoObjetivo - nuevoMonto);
      
      document.getElementById('previewMonto').textContent = Formato.formatearMoneda(nuevoMonto, meta.moneda);
      document.getElementById('previewBar').style.width = `${nuevoPct}%`;
      document.getElementById('previewPct').textContent = `${Math.round(nuevoPct)}% completado`;
      document.getElementById('previewFalta').textContent = Formato.formatearMoneda(nuevaFalta, meta.moneda);
    };
    
    document.getElementById('aporteMonto').addEventListener('input', actualizarPreview);
    
    document.getElementById('confirmAporte').addEventListener('click', () => {
      const monto = parseFloat(document.getElementById('aporteMonto').value);
      const fecha = document.getElementById('aporteFecha').value;
      
      if (!monto || monto <= 0) {
        Modal.toast('Ingresa un monto válido', 'error');
        return;
      }
      
      try {
        const metaActualizada = API.aportarAMeta(id, monto, { fecha });
        
        // Mensaje según resultado
        if (metaActualizada.montoActual >= metaActualizada.montoObjetivo) {
          Modal.toast(`🎉 ¡Meta "${meta.nombre}" completada!`);
        } else {
          Modal.toast(`✓ +${Formato.formatearMoneda(monto, meta.moneda)} aportados`);
        }
        
        Modal.cerrar();
        this.refrescar();
      } catch (e) {
        Modal.toast('Error: ' + e.message, 'error');
      }
    });
  },
  
  abrirRetiro(id) {
    const meta = API.obtenerMetaPorId(id);
    if (!meta) return;
    
    Modal.abrir({
      titulo: `Retirar de ${meta.nombre}`,
      contenido: `
        <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:var(--space-md);">
          Saldo disponible: <strong>${Formato.formatearMoneda(meta.montoActual, meta.moneda)}</strong>
        </p>
        
        <div class="aporte-modal-monto">
          <div class="trans-modal-amount" style="margin:0;">
            <input type="number" id="retiroMonto" class="trans-modal-amount-input" 
                   placeholder="0.00" step="0.01" min="0" 
                   max="${meta.montoActual}" inputmode="decimal" autofocus>
            <div class="trans-modal-amount-currency">${Formato.SIMBOLOS[meta.moneda] || meta.moneda}</div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="date" class="form-input" id="retiroFecha" 
                 value="${new Date().toISOString().split('T')[0]}">
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" onclick="Modal.cerrar()">Cancelar</button>
          <button class="btn-primary" id="confirmRetiro">Retirar</button>
        </div>
      `,
    });
    
    document.getElementById('confirmRetiro').addEventListener('click', () => {
      const monto = parseFloat(document.getElementById('retiroMonto').value);
      const fecha = document.getElementById('retiroFecha').value;
      
      if (!monto || monto <= 0) {
        Modal.toast('Ingresa un monto válido', 'error');
        return;
      }
      
      try {
        API.retirarDeMeta(id, monto, { fecha });
        Modal.toast(`✓ ${Formato.formatearMoneda(monto, meta.moneda)} retirados`);
        Modal.cerrar();
        this.refrescar();
      } catch (e) {
        Modal.toast('Error: ' + e.message, 'error');
      }
    });
  },
  
  celebrar(id) {
    const meta = API.obtenerMetaPorId(id);
    if (!meta) return;
    
    Modal.abrir({
      titulo: '🎉 ¡Felicitaciones!',
      ancho: 'small',
      contenido: `
        <div style="text-align:center;padding:var(--space-md);">
          <div style="font-size:4rem;margin-bottom:var(--space-md);">${meta.icono}</div>
          <h3 style="font-size:1.25rem;margin-bottom:8px;">${meta.nombre}</h3>
          <p style="color:var(--text-secondary);margin-bottom:var(--space-md);">
            ${meta.descripcion || 'Has completado tu meta de ahorro'}
          </p>
          <div style="background:linear-gradient(135deg, rgba(20, 240, 205, 0.15), rgba(6, 182, 212, 0.1));padding:var(--space-md);border-radius:var(--radius-md);margin-bottom:var(--space-md);">
            <div style="font-size:0.75rem;color:var(--text-tertiary);">Total ahorrado</div>
            <div style="font-size:2rem;font-weight:700;color:var(--accent-primary);">
              ${Formato.formatearMoneda(meta.montoActual, meta.moneda)}
            </div>
          </div>
          <p style="font-size:0.875rem;color:var(--text-tertiary);">
            Una meta cumplida es el mejor incentivo para la siguiente. ¡Sigue así! 💪
          </p>
        </div>
        <div class="modal-actions">
          <button class="btn-primary" style="width:100%;justify-content:center;" onclick="Modal.cerrar()">
            ¡Excelente!
          </button>
        </div>
      `,
    });
  },
  
  /* ============ DETALLE ============ */
  verDetalle(id) {
    const meta = API.obtenerMetaPorId(id);
    if (!meta) return;
    
    const cuenta = API.obtenerCuentaPorId(meta.cuentaAhorroId);
    const estado = API.obtenerEstadoMeta(meta);
    const porcentaje = (meta.montoActual / meta.montoObjetivo) * 100;
    const aporteRec = API.calcularAporteMensualRecomendado(meta);
    
    // Historial reciente
    const historial = (meta.historial || []).slice(-10).reverse();
    
    Modal.abrir({
      titulo: `${meta.icono} ${meta.nombre}`,
      ancho: 'medium',
      contenido: `
        <div class="deuda-detail-summary">
          <div class="deuda-detail-stat">
            <div class="deuda-detail-stat-label">Objetivo</div>
            <div class="deuda-detail-stat-value">${Formato.formatearMoneda(meta.montoObjetivo, meta.moneda)}</div>
          </div>
          <div class="deuda-detail-stat">
            <div class="deuda-detail-stat-label">Ahorrado</div>
            <div class="deuda-detail-stat-value text-success">${Formato.formatearMoneda(meta.montoActual, meta.moneda)}</div>
          </div>
          <div class="deuda-detail-stat">
            <div class="deuda-detail-stat-label">Progreso</div>
            <div class="deuda-detail-stat-value">${Math.round(porcentaje)}%</div>
          </div>
          <div class="deuda-detail-stat">
            <div class="deuda-detail-stat-label">Aporte mensual sugerido</div>
            <div class="deuda-detail-stat-value">${aporteRec > 0 ? Formato.formatearMoneda(aporteRec, meta.moneda) : '-'}</div>
          </div>
        </div>
        
        ${meta.descripcion ? `
          <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:var(--space-md);">
            ${meta.descripcion}
          </p>
        ` : ''}
        
        <div style="font-size:0.8125rem;color:var(--text-tertiary);margin-bottom:var(--space-md);">
          📅 Fecha límite: <strong>${Fechas.formatoCompleto(meta.fechaLimite)}</strong> · 
          🏦 Cuenta: <strong>${cuenta ? cuenta.nombre : '-'}</strong>
        </div>
        
        ${historial.length > 0 ? `
          <h4 style="font-size:0.875rem;margin-bottom:8px;">Historial de movimientos</h4>
          <div style="max-height:240px;overflow-y:auto;border:1px solid var(--card-border);border-radius:var(--radius-md);">
            ${historial.map(h => `
              <div style="display:flex;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--card-border);">
                <div>
                  <div style="font-size:0.8125rem;font-weight:500;">${h.tipo === 'aporte' ? '↑ Aporte' : '↓ Retiro'}</div>
                  <div style="font-size:0.75rem;color:var(--text-tertiary);">${Fechas.formatoCorto(h.fecha)}</div>
                </div>
                <div style="font-weight:600;color:${h.tipo === 'aporte' ? 'var(--color-success)' : 'var(--color-danger)'};">
                  ${h.tipo === 'aporte' ? '+' : '-'}${Formato.formatearMoneda(h.monto, meta.moneda)}
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="text-align:center;padding:var(--space-md);color:var(--text-tertiary);font-size:0.8125rem;">
            Aún no hay aportes registrados
          </div>
        `}
        
        <div class="modal-actions">
          <button class="btn-danger" onclick="Metas.eliminar(${meta.id})">Eliminar</button>
          <button class="btn-secondary" onclick="Modal.cerrar(); Metas.editar(${meta.id});">Editar</button>
          ${meta.montoActual < meta.montoObjetivo ? `
            <button class="btn-primary" onclick="Modal.cerrar(); Metas.abrirAporte(${meta.id});">💰 Aportar</button>
          ` : `
            <button class="btn-primary" onclick="Modal.cerrar(); Metas.abrirRetiro(${meta.id});">Retirar</button>
          `}
        </div>
      `,
    });
  },
  
  eliminar(id) {
    Modal.cerrar();
    setTimeout(() => {
      const meta = API.obtenerMetaPorId(id);
      if (!meta) return;
      
      Modal.confirmar({
        titulo: 'Eliminar meta',
        mensaje: `¿Eliminar la meta "${meta.nombre}"? Esta acción no se puede deshacer.`,
        textoConfirmar: 'Eliminar',
        tipoBoton: 'danger',
        onConfirmar: () => {
          API.eliminarMeta(id);
          Modal.toast('Meta eliminada');
          this.refrescar();
        },
      });
    }, 250);
  },
};
