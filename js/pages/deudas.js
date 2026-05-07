/* ============================================
   PÁGINA: DEUDAS Y SIMULADOR
   ============================================ */

const Deudas = {
  
  monedaVista: 'PEN',
  tabActiva: 'simulador', // simulador | misdeudas
  
  // Estado del simulador
  simulador: {
    capital: 10000,
    tasaTEA: 18, // %
    plazoMeses: 12,
    sistema: 'frances',
    fechaInicio: new Date().toISOString().split('T')[0],
  },
  
  cronogramaActual: null,
  
  render(container, monedaVista = 'PEN') {
    this.monedaVista = monedaVista;
    Graficos.destruirTodos();
    
    container.innerHTML = `
      <div class="deudas-page">
        ${this.renderTabs()}
        <div id="deudasContent">
          ${this.tabActiva === 'simulador' ? this.renderSimulador() : this.renderMisDeudas()}
        </div>
      </div>
    `;
    
    this.configurarEventosTabs();
    
    if (this.tabActiva === 'simulador') {
      this.calcularYRenderizarSimulador();
      this.configurarEventosSimulador();
    } else {
      this.configurarEventosDeudas();
    }
  },
  
  /* ============ TABS ============ */
  renderTabs() {
    return `
      <div class="deudas-main-tabs">
        <button class="deudas-main-tab ${this.tabActiva === 'simulador' ? 'active' : ''}" data-tab="simulador">
          🧮 Simulador
        </button>
        <button class="deudas-main-tab ${this.tabActiva === 'misdeudas' ? 'active' : ''}" data-tab="misdeudas">
          💵 Mis deudas
        </button>
      </div>
    `;
  },
  
  configurarEventosTabs() {
    document.querySelectorAll('.deudas-main-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.tabActiva = btn.dataset.tab;
        this.refrescar();
      });
    });
  },
  
  refrescar() {
    const container = document.getElementById('pageContent');
    if (container) this.render(container, this.monedaVista);
  },
  
  /* ============================================
     SIMULADOR
     ============================================ */
  renderSimulador() {
    return `
      <div class="simulador-layout">
        ${this.renderSimuladorForm()}
        
        <div class="simulador-results">
          <div id="simResumen"></div>
          <div id="simCronograma"></div>
        </div>
      </div>
    `;
  },
  
  renderSimuladorForm() {
    const s = this.simulador;
    return `
      <div class="simulador-form">
        <div class="simulador-form-title">
          <span>🧮</span>
          <span>Datos del préstamo</span>
        </div>
        
        <div class="form-group">
          <label class="form-label">Monto del préstamo (S/)</label>
          <input type="number" class="form-input" id="simCapital" 
                 value="${s.capital}" min="0" step="100" inputmode="decimal">
        </div>
        
        <div class="form-group">
          <label class="form-label">Tasa Efectiva Anual (TEA) %</label>
          <input type="number" class="form-input" id="simTEA" 
                 value="${s.tasaTEA}" min="0" max="200" step="0.1" inputmode="decimal">
          <div class="form-helper">Valor típico en Perú: 15-30% para préstamos personales</div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Plazo (meses)</label>
          <input type="number" class="form-input" id="simPlazo" 
                 value="${s.plazoMeses}" min="1" max="360">
        </div>
        
        <div class="form-group">
          <label class="form-label">Sistema de amortización</label>
          <div class="type-selector" style="grid-template-columns: 1fr 1fr;">
            <button type="button" class="type-option ${s.sistema === 'frances' ? 'active' : ''}" data-sistema="frances">
              Francés
            </button>
            <button type="button" class="type-option ${s.sistema === 'aleman' ? 'active' : ''}" data-sistema="aleman">
              Alemán
            </button>
          </div>
          <div class="form-helper" id="sistemaHelper">
            ${s.sistema === 'frances' 
              ? '🔒 Cuota fija. Más usado en bancos.' 
              : '📉 Cuota decreciente. Pagas menos intereses al final.'}
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Fecha de inicio</label>
          <input type="date" class="form-input" id="simFecha" value="${s.fechaInicio}">
        </div>
        
        <button class="btn-primary" id="btnSimular" style="width:100%;justify-content:center;">
          Calcular cronograma
        </button>
      </div>
    `;
  },
  
  configurarEventosSimulador() {
    // Inputs
    document.getElementById('simCapital').addEventListener('input', (e) => {
      this.simulador.capital = parseFloat(e.target.value) || 0;
      this.calcularYRenderizarSimulador();
    });
    
    document.getElementById('simTEA').addEventListener('input', (e) => {
      this.simulador.tasaTEA = parseFloat(e.target.value) || 0;
      this.calcularYRenderizarSimulador();
    });
    
    document.getElementById('simPlazo').addEventListener('input', (e) => {
      this.simulador.plazoMeses = parseInt(e.target.value) || 1;
      this.calcularYRenderizarSimulador();
    });
    
    document.getElementById('simFecha').addEventListener('change', (e) => {
      this.simulador.fechaInicio = e.target.value;
      this.calcularYRenderizarSimulador();
    });
    
    // Sistema
    document.querySelectorAll('.type-option[data-sistema]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.simulador.sistema = btn.dataset.sistema;
        document.querySelectorAll('.type-option[data-sistema]').forEach(b => {
          b.classList.toggle('active', b.dataset.sistema === this.simulador.sistema);
        });
        const helper = document.getElementById('sistemaHelper');
        if (helper) {
          helper.textContent = this.simulador.sistema === 'frances'
            ? '🔒 Cuota fija. Más usado en bancos.'
            : '📉 Cuota decreciente. Pagas menos intereses al final.';
        }
        this.calcularYRenderizarSimulador();
      });
    });
    
    document.getElementById('btnSimular').addEventListener('click', () => {
      this.calcularYRenderizarSimulador();
    });
  },
  
  calcularYRenderizarSimulador() {
    const s = this.simulador;
    if (s.capital <= 0 || s.plazoMeses <= 0) {
      document.getElementById('simResumen').innerHTML = `
        <div class="glass-card" style="text-align:center;padding:var(--space-xl);">
          <div style="font-size:2.5rem;opacity:0.4;margin-bottom:8px;">🧮</div>
          <p class="text-secondary">Ingresa los datos para ver el cronograma</p>
        </div>
      `;
      document.getElementById('simCronograma').innerHTML = '';
      return;
    }
    
    const tea = s.tasaTEA / 100;
    const cronograma = Prestamos.generarCronograma(
      s.capital, tea, s.plazoMeses, s.sistema, s.fechaInicio
    );
    const resumen = Prestamos.calcularResumen(cronograma);
    
    this.cronogramaActual = cronograma;
    
    // Resumen
    document.getElementById('simResumen').innerHTML = this.renderResumen(cronograma, resumen);
    
    // Cronograma
    document.getElementById('simCronograma').innerHTML = this.renderCronograma(cronograma);
    
    // Renderizar gráfico
    setTimeout(() => this.renderChartComposicion(cronograma), 50);
    
    // Eventos del cronograma
    document.getElementById('btnExportarPDF')?.addEventListener('click', () => this.exportarCronograma());
  },
  
  renderResumen(cronograma, resumen) {
    const cuotaPrincipal = cronograma[0].cuota;
    const moneda = 'PEN';
    
    return `
      <div class="sim-resumen-grid">
        <div class="sim-resumen-card highlight">
          <div class="sim-resumen-label">Cuota mensual</div>
          <div class="sim-resumen-value success">
            ${this.simulador.sistema === 'frances' 
              ? Formato.formatearMoneda(cuotaPrincipal, moneda)
              : `${Formato.formatearMoneda(resumen.cuotaMaxima, moneda)} → ${Formato.formatearMoneda(resumen.cuotaMinima, moneda)}`
            }
          </div>
          <div class="sim-resumen-meta">
            ${this.simulador.sistema === 'frances' ? 'Fija todos los meses' : 'De más a menos'}
          </div>
        </div>
        
        <div class="sim-resumen-card">
          <div class="sim-resumen-label">Total a pagar</div>
          <div class="sim-resumen-value">${Formato.formatearMoneda(resumen.totalPagar, moneda)}</div>
          <div class="sim-resumen-meta">${this.simulador.plazoMeses} cuotas</div>
        </div>
        
        <div class="sim-resumen-card">
          <div class="sim-resumen-label">Intereses</div>
          <div class="sim-resumen-value danger">${Formato.formatearMoneda(resumen.totalInteres, moneda)}</div>
          <div class="sim-resumen-meta">
            ${((resumen.totalInteres / this.simulador.capital) * 100).toFixed(1)}% sobre el capital
          </div>
        </div>
        
        <div class="sim-resumen-card">
          <div class="sim-resumen-label">Capital</div>
          <div class="sim-resumen-value">${Formato.formatearMoneda(this.simulador.capital, moneda)}</div>
          <div class="sim-resumen-meta">Monto solicitado</div>
        </div>
      </div>
    `;
  },
  
  renderCronograma(cronograma) {
    const moneda = 'PEN';
    
    return `
      <div class="cronograma-card">
        <div class="cronograma-header">
          <div class="cronograma-title">Cronograma de pagos</div>
          <div class="cronograma-actions">
            <button class="btn-secondary" id="btnExportarPDF" style="padding:8px 14px;font-size:0.75rem;">
              📄 Exportar
            </button>
          </div>
        </div>
        
        <div class="cronograma-chart">
          <canvas id="chartComposicion"></canvas>
        </div>
        
        <div class="cronograma-table-wrapper">
          <table class="cronograma-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Fecha</th>
                <th>Saldo inicial</th>
                <th>Capital</th>
                <th>Interés</th>
                <th>Cuota</th>
                <th>Saldo final</th>
              </tr>
            </thead>
            <tbody>
              ${cronograma.map(c => `
                <tr>
                  <td>${c.numero}</td>
                  <td>${c.fecha ? Fechas.formatoCorto(c.fecha) : '-'}</td>
                  <td>${Formato.formatearMoneda(c.saldoInicial, moneda)}</td>
                  <td>${Formato.formatearMoneda(c.amortizacion, moneda)}</td>
                  <td style="color:var(--color-danger);">${Formato.formatearMoneda(c.interes, moneda)}</td>
                  <td><strong>${Formato.formatearMoneda(c.cuota, moneda)}</strong></td>
                  <td>${Formato.formatearMoneda(c.saldoFinal, moneda)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
  
  renderChartComposicion(cronograma) {
    const canvas = document.getElementById('chartComposicion');
    if (!canvas) return;
    
    Graficos.destruir('chartComposicion');
    
    const labels = cronograma.map(c => `Cuota ${c.numero}`);
    const dataCapital = cronograma.map(c => c.amortizacion);
    const dataInteres = cronograma.map(c => c.interes);
    
    const colorTema = Theme.coloresGrafico();
    const ctx = canvas.getContext('2d');
    
    Graficos.instancias['chartComposicion'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Capital',
            data: dataCapital,
            backgroundColor: '#14F0CD',
            borderRadius: 4,
            stack: 'stack1',
          },
          {
            label: 'Interés',
            data: dataInteres,
            backgroundColor: '#EF4444',
            borderRadius: 4,
            stack: 'stack1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: colorTema.textSecondary,
              font: { family: "'Inter', sans-serif", size: 11 },
              boxWidth: 12,
              boxHeight: 12,
              padding: 12,
              usePointStyle: true,
              pointStyle: 'rectRounded',
            },
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 41, 0.95)',
            titleColor: '#fff',
            bodyColor: 'rgba(255, 255, 255, 0.85)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (item) => `${item.dataset.label}: ${Formato.formatearMoneda(item.parsed.y, 'PEN')}`,
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { 
              color: colorTema.textSecondary, 
              font: { size: 10 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 12,
            },
          },
          y: {
            stacked: true,
            grid: { color: colorTema.grid },
            ticks: {
              color: colorTema.textSecondary,
              font: { size: 10 },
              callback: (val) => Formato.formatearMoneda(val, 'PEN').replace('.00', ''),
            },
          },
        },
      },
    });
  },
  
  /**
   * Exporta el cronograma como una "página imprimible"
   * (genera un nuevo documento HTML con estilos básicos para imprimir o guardar como PDF)
   */
  exportarCronograma() {
    if (!this.cronogramaActual) return;
    
    const s = this.simulador;
    const cronograma = this.cronogramaActual;
    const resumen = Prestamos.calcularResumen(cronograma);
    const moneda = 'PEN';
    
    const ventana = window.open('', '_blank');
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Cronograma de pagos</title>
        <style>
          @media print { @page { margin: 1.5cm; } body { -webkit-print-color-adjust: exact; } }
          body { font-family: -apple-system, sans-serif; padding: 30px; color: #1A2332; max-width: 900px; margin: 0 auto; }
          h1 { color: #0F1729; border-bottom: 3px solid #06B6D4; padding-bottom: 10px; }
          .header-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; padding: 15px; background: #F4F6FB; border-radius: 8px; }
          .info-block strong { color: #06B6D4; font-size: 0.85em; text-transform: uppercase; }
          .info-block div { font-size: 1.2em; font-weight: 600; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.9em; }
          th { background: #1E3A5F; color: white; padding: 10px; text-align: right; }
          th:first-child, th:nth-child(2) { text-align: left; }
          td { padding: 8px 10px; text-align: right; border-bottom: 1px solid #E8EDF5; }
          td:first-child, td:nth-child(2) { text-align: left; }
          tr:nth-child(even) { background: #F4F6FB; }
          .interes { color: #EF4444; }
          .total-row { font-weight: bold; background: #06B6D4 !important; color: white; }
          .total-row td { border: none; }
          .footer { margin-top: 30px; font-size: 0.85em; color: #888; text-align: center; }
          @media print { .no-print { display: none; } button { display: none; } }
          .actions { margin: 20px 0; }
          button { background: #06B6D4; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="actions no-print">
          <button onclick="window.print()">🖨 Imprimir / Guardar como PDF</button>
          <button onclick="window.close()" style="background:#888;">Cerrar</button>
        </div>
        
        <h1>Cronograma de Pagos</h1>
        <p style="color:#666;">Simulación generada el ${Fechas.formatoCompleto(new Date())}</p>
        
        <div class="header-info">
          <div class="info-block">
            <strong>Capital</strong>
            <div>${Formato.formatearMoneda(s.capital, moneda)}</div>
          </div>
          <div class="info-block">
            <strong>TEA</strong>
            <div>${s.tasaTEA}%</div>
          </div>
          <div class="info-block">
            <strong>Plazo</strong>
            <div>${s.plazoMeses} meses</div>
          </div>
          <div class="info-block">
            <strong>Sistema</strong>
            <div>${s.sistema === 'frances' ? 'Francés (cuota fija)' : 'Alemán (capital fijo)'}</div>
          </div>
          <div class="info-block">
            <strong>Total a pagar</strong>
            <div>${Formato.formatearMoneda(resumen.totalPagar, moneda)}</div>
          </div>
          <div class="info-block">
            <strong>Total intereses</strong>
            <div class="interes">${Formato.formatearMoneda(resumen.totalInteres, moneda)}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>N°</th><th>Fecha</th><th>Saldo inicial</th>
              <th>Capital</th><th>Interés</th><th>Cuota</th><th>Saldo final</th>
            </tr>
          </thead>
          <tbody>
            ${cronograma.map(c => `
              <tr>
                <td>${c.numero}</td>
                <td>${c.fecha ? Fechas.formatoCorto(c.fecha) : '-'}</td>
                <td>${Formato.formatearMoneda(c.saldoInicial, moneda)}</td>
                <td>${Formato.formatearMoneda(c.amortizacion, moneda)}</td>
                <td class="interes">${Formato.formatearMoneda(c.interes, moneda)}</td>
                <td><strong>${Formato.formatearMoneda(c.cuota, moneda)}</strong></td>
                <td>${Formato.formatearMoneda(c.saldoFinal, moneda)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3">TOTALES</td>
              <td>${Formato.formatearMoneda(resumen.totalAmortizacion, moneda)}</td>
              <td>${Formato.formatearMoneda(resumen.totalInteres, moneda)}</td>
              <td>${Formato.formatearMoneda(resumen.totalPagar, moneda)}</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">Generado por FinanzApp · Esta simulación es referencial.</div>
      </body>
      </html>
    `);
    ventana.document.close();
  },
  
  /* ============================================
     MIS DEUDAS
     ============================================ */
  renderMisDeudas() {
    const deudas = API.obtenerDeudas({ activos: true });
    const moneda = this.monedaVista === 'ALL' ? 'PEN' : this.monedaVista;
    
    return `
      ${this.renderStatsDeudas(deudas, moneda)}
      
      <div class="presupuestos-header" style="margin-top:var(--space-md);">
        <div></div>
        <button class="btn-primary" id="btnNuevaDeuda">
          <span class="btn-icon">+</span>
          <span>Registrar deuda</span>
        </button>
      </div>
      
      ${deudas.length === 0 ? this.renderEmptyDeudas() : this.renderListaDeudas(deudas)}
    `;
  },
  
  renderStatsDeudas(deudas, moneda) {
    if (deudas.length === 0) return '';
    
    let totalDeuda = 0;
    let totalCuotaMensual = 0;
    let totalIntereses = 0;
    
    deudas.forEach(d => {
      const saldo = API.calcularSaldoDeuda(d);
      totalDeuda += Formato.convertir(saldo, d.moneda, moneda);
      
      const cronograma = Prestamos.generarCronograma(d.capital, d.tasaTEA, d.plazoMeses, d.sistema);
      if (cronograma[d.cuotasPagadas]) {
        totalCuotaMensual += Formato.convertir(cronograma[d.cuotasPagadas].cuota, d.moneda, moneda);
      }
      
      const restante = cronograma.slice(d.cuotasPagadas);
      const interesesRestantes = restante.reduce((s, c) => s + c.interes, 0);
      totalIntereses += Formato.convertir(interesesRestantes, d.moneda, moneda);
    });
    
    return `
      <div class="deudas-stats-row">
        <div class="sim-resumen-card">
          <div class="sim-resumen-label">Saldo total pendiente</div>
          <div class="sim-resumen-value danger">${Formato.formatearMoneda(totalDeuda, moneda)}</div>
          <div class="sim-resumen-meta">${deudas.length} ${deudas.length === 1 ? 'deuda' : 'deudas'} activas</div>
        </div>
        <div class="sim-resumen-card">
          <div class="sim-resumen-label">Cuota mensual total</div>
          <div class="sim-resumen-value">${Formato.formatearMoneda(totalCuotaMensual, moneda)}</div>
          <div class="sim-resumen-meta">Próximo mes</div>
        </div>
        <div class="sim-resumen-card">
          <div class="sim-resumen-label">Intereses por pagar</div>
          <div class="sim-resumen-value danger">${Formato.formatearMoneda(totalIntereses, moneda)}</div>
          <div class="sim-resumen-meta">Total restante</div>
        </div>
      </div>
    `;
  },
  
  renderEmptyDeudas() {
    return `
      <div class="deudas-empty">
        <div class="deudas-empty-icon">💵</div>
        <h3>Sin deudas registradas</h3>
        <p>Si tienes préstamos vigentes, regístralos para llevar control de las cuotas y saldos pendientes.</p>
        <button class="btn-primary" id="btnNuevaDeudaEmpty">+ Registrar deuda</button>
      </div>
    `;
  },
  
  renderListaDeudas(deudas) {
    return `
      <div class="deudas-grid">
        ${deudas.map(d => this.renderDeudaCard(d)).join('')}
      </div>
    `;
  },
  
  renderDeudaCard(deuda) {
    const cronograma = Prestamos.generarCronograma(deuda.capital, deuda.tasaTEA, deuda.plazoMeses, deuda.sistema);
    const cuotaProxima = cronograma[deuda.cuotasPagadas];
    const saldoPendiente = API.calcularSaldoDeuda(deuda);
    const porcentaje = (deuda.cuotasPagadas / deuda.plazoMeses) * 100;
    const completa = deuda.cuotasPagadas >= deuda.plazoMeses;
    
    return `
      <div class="deuda-card ${completa ? 'completa' : ''}">
        <div class="deuda-card-header">
          <div class="deuda-card-icon icon-box ${deuda.color}">
            <span>${deuda.icono}</span>
          </div>
          <div class="deuda-card-info">
            <div class="deuda-card-name">${deuda.nombre}</div>
            <div class="deuda-card-acreedor">${deuda.acreedor || 'Sin acreedor'}</div>
          </div>
        </div>
        
        <div class="deuda-card-progress-section">
          <div class="deuda-card-progress-label">
            <span><strong>${deuda.cuotasPagadas}</strong> de ${deuda.plazoMeses} cuotas</span>
            <span><strong>${Math.round(porcentaje)}%</strong> pagado</span>
          </div>
          <div class="deuda-card-progress">
            <div class="deuda-card-progress-fill" style="width: ${porcentaje}%"></div>
          </div>
        </div>
        
        <div class="deuda-card-stats">
          <div>
            <div class="deuda-card-stat-label">Saldo pendiente</div>
            <div class="deuda-card-stat-value">${Formato.formatearMoneda(saldoPendiente, deuda.moneda)}</div>
          </div>
          <div>
            <div class="deuda-card-stat-label">Cuota</div>
            <div class="deuda-card-stat-value">
              ${cuotaProxima ? Formato.formatearMoneda(cuotaProxima.cuota, deuda.moneda) : '-'}
            </div>
          </div>
        </div>
        
        <div class="deuda-card-footer">
          <div class="deuda-next-cuota">
            ${completa ? `
              <span class="text-success">✓ Pagada totalmente</span>
            ` : `
              <span class="deuda-next-cuota-label">Próxima cuota:</span>
              <span class="deuda-next-cuota-amount"> ${cuotaProxima ? Formato.formatearMoneda(cuotaProxima.cuota, deuda.moneda) : '-'}</span>
            `}
          </div>
          
          <div class="deuda-card-actions">
            <button class="deuda-action-btn detail" onclick="Deudas.verDetalle(${deuda.id})">Detalle</button>
            ${!completa ? `
              <button class="deuda-action-btn pay" onclick="Deudas.pagarCuota(${deuda.id})">Pagar cuota</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },
  
  configurarEventosDeudas() {
    const btnNueva = document.getElementById('btnNuevaDeuda');
    if (btnNueva) btnNueva.addEventListener('click', () => DeudaForm.abrir(null, () => this.refrescar()));
    
    const btnNuevaEmpty = document.getElementById('btnNuevaDeudaEmpty');
    if (btnNuevaEmpty) btnNuevaEmpty.addEventListener('click', () => DeudaForm.abrir(null, () => this.refrescar()));
  },
  
  /* ============ ACCIONES ============ */
  pagarCuota(deudaId) {
    const deuda = API.obtenerDeudaPorId(deudaId);
    if (!deuda) return;
    
    const cronograma = Prestamos.generarCronograma(deuda.capital, deuda.tasaTEA, deuda.plazoMeses, deuda.sistema);
    const cuota = cronograma[deuda.cuotasPagadas];
    if (!cuota) return;
    
    const cuenta = API.obtenerCuentaPorId(deuda.cuentaPagoId);
    
    Modal.confirmar({
      titulo: `Pagar cuota ${deuda.cuotasPagadas + 1}/${deuda.plazoMeses}`,
      mensaje: `Se registrará un egreso de ${Formato.formatearMoneda(cuota.cuota, deuda.moneda)} desde "${cuenta?.nombre || ''}". ¿Confirmar?`,
      textoConfirmar: 'Pagar',
      onConfirmar: () => {
        try {
          API.pagarCuotaDeuda(deudaId);
          Modal.toast(`✓ Cuota ${deuda.cuotasPagadas + 1} pagada`);
          this.refrescar();
        } catch (e) {
          Modal.toast('Error: ' + e.message, 'error');
        }
      },
    });
  },
  
  verDetalle(deudaId) {
    const deuda = API.obtenerDeudaPorId(deudaId);
    if (!deuda) return;
    
    const cronograma = Prestamos.generarCronograma(deuda.capital, deuda.tasaTEA, deuda.plazoMeses, deuda.sistema, deuda.fechaInicio);
    const resumen = Prestamos.calcularResumen(cronograma);
    const saldoPendiente = API.calcularSaldoDeuda(deuda);
    
    Modal.abrir({
      titulo: deuda.nombre,
      ancho: 'large',
      contenido: `
        <div class="deuda-detail-summary">
          <div class="deuda-detail-stat">
            <div class="deuda-detail-stat-label">Capital original</div>
            <div class="deuda-detail-stat-value">${Formato.formatearMoneda(deuda.capital, deuda.moneda)}</div>
          </div>
          <div class="deuda-detail-stat">
            <div class="deuda-detail-stat-label">Saldo pendiente</div>
            <div class="deuda-detail-stat-value text-danger">${Formato.formatearMoneda(saldoPendiente, deuda.moneda)}</div>
          </div>
          <div class="deuda-detail-stat">
            <div class="deuda-detail-stat-label">TEA</div>
            <div class="deuda-detail-stat-value">${(deuda.tasaTEA * 100).toFixed(2)}%</div>
          </div>
          <div class="deuda-detail-stat">
            <div class="deuda-detail-stat-label">Sistema</div>
            <div class="deuda-detail-stat-value">${deuda.sistema === 'frances' ? 'Francés' : 'Alemán'}</div>
          </div>
        </div>
        
        <div class="cronograma-table-wrapper" style="margin:0;padding:0;max-height:400px;overflow-y:auto;">
          <table class="cronograma-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Fecha</th>
                <th>Capital</th>
                <th>Interés</th>
                <th>Cuota</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              ${cronograma.map((c, i) => `
                <tr class="${i < deuda.cuotasPagadas ? 'pagada' : ''}">
                  <td>${c.numero}</td>
                  <td>${c.fecha ? Fechas.formatoCorto(c.fecha) : '-'}</td>
                  <td>${Formato.formatearMoneda(c.amortizacion, deuda.moneda)}</td>
                  <td style="color:var(--color-danger);">${Formato.formatearMoneda(c.interes, deuda.moneda)}</td>
                  <td><strong>${Formato.formatearMoneda(c.cuota, deuda.moneda)}</strong></td>
                  <td>${Formato.formatearMoneda(c.saldoFinal, deuda.moneda)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="modal-actions">
          <button class="btn-danger" onclick="Deudas.eliminarDeuda(${deuda.id})">Eliminar</button>
          <button class="btn-secondary" onclick="DeudaForm.abrir(${deuda.id}, () => { Modal.cerrar(); Deudas.refrescar(); })">Editar</button>
          <button class="btn-primary" onclick="Modal.cerrar()">Cerrar</button>
        </div>
      `,
    });
  },
  
  eliminarDeuda(deudaId) {
    Modal.cerrar();
    setTimeout(() => {
      Modal.confirmar({
        titulo: 'Eliminar deuda',
        mensaje: '¿Eliminar esta deuda? Las transacciones de pago ya registradas se mantienen.',
        textoConfirmar: 'Eliminar',
        tipoBoton: 'danger',
        onConfirmar: () => {
          API.eliminarDeuda(deudaId);
          Modal.toast('Eliminada');
          this.refrescar();
        },
      });
    }, 250);
  },
};
