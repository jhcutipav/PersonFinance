/* ============================================
   UTILIDADES DE CÁLCULOS DE PRÉSTAMOS
   Sistema francés (cuota fija) y alemán (capital constante)
   ============================================ */

const Prestamos = {
  
  /**
   * Convierte TEA (Tasa Efectiva Anual) a TEM (Tasa Efectiva Mensual)
   * Fórmula: TEM = (1 + TEA)^(1/12) - 1
   */
  teaATem(tea) {
    return Math.pow(1 + tea, 1 / 12) - 1;
  },
  
  /**
   * Convierte TNA (Tasa Nominal Anual) a TEA
   * Fórmula: TEA = (1 + TNA/12)^12 - 1
   */
  tnaATea(tna) {
    return Math.pow(1 + tna / 12, 12) - 1;
  },
  
  /**
   * SISTEMA FRANCÉS - Cuota fija
   * La cuota mensual es siempre la misma. Al inicio se paga más interés que capital.
   * Fórmula de cuota: C = P × [i(1+i)^n] / [(1+i)^n - 1]
   * Donde: P = capital, i = tasa mensual, n = número de cuotas
   */
  cronogramaFrances(capital, tea, plazoMeses) {
    const tem = this.teaATem(tea);
    
    // Calcular cuota fija
    let cuotaFija;
    if (tem === 0) {
      cuotaFija = capital / plazoMeses;
    } else {
      const factor = Math.pow(1 + tem, plazoMeses);
      cuotaFija = capital * (tem * factor) / (factor - 1);
    }
    
    const cronograma = [];
    let saldoPendiente = capital;
    
    for (let n = 1; n <= plazoMeses; n++) {
      const interes = saldoPendiente * tem;
      const amortizacion = cuotaFija - interes;
      const saldoFinal = saldoPendiente - amortizacion;
      
      cronograma.push({
        numero: n,
        saldoInicial: saldoPendiente,
        cuota: cuotaFija,
        interes: interes,
        amortizacion: amortizacion,
        saldoFinal: Math.max(0, saldoFinal),
      });
      
      saldoPendiente = saldoFinal;
    }
    
    return cronograma;
  },
  
  /**
   * SISTEMA ALEMÁN - Amortización constante
   * La amortización es fija. La cuota disminuye con el tiempo (porque el interés baja).
   */
  cronogramaAleman(capital, tea, plazoMeses) {
    const tem = this.teaATem(tea);
    const amortizacionFija = capital / plazoMeses;
    
    const cronograma = [];
    let saldoPendiente = capital;
    
    for (let n = 1; n <= plazoMeses; n++) {
      const interes = saldoPendiente * tem;
      const cuota = amortizacionFija + interes;
      const saldoFinal = saldoPendiente - amortizacionFija;
      
      cronograma.push({
        numero: n,
        saldoInicial: saldoPendiente,
        cuota: cuota,
        interes: interes,
        amortizacion: amortizacionFija,
        saldoFinal: Math.max(0, saldoFinal),
      });
      
      saldoPendiente = saldoFinal;
    }
    
    return cronograma;
  },
  
  /**
   * Genera cronograma según el sistema elegido
   */
  generarCronograma(capital, tea, plazoMeses, sistema = 'frances', fechaInicio = null) {
    let cronograma;
    if (sistema === 'aleman') {
      cronograma = this.cronogramaAleman(capital, tea, plazoMeses);
    } else {
      cronograma = this.cronogramaFrances(capital, tea, plazoMeses);
    }
    
    // Agregar fechas si se proporciona la fecha de inicio
    if (fechaInicio) {
      const inicio = new Date(fechaInicio);
      cronograma.forEach((c, idx) => {
        const fechaCuota = new Date(inicio);
        fechaCuota.setMonth(fechaCuota.getMonth() + idx + 1);
        c.fecha = fechaCuota.toISOString().split('T')[0];
      });
    }
    
    return cronograma;
  },
  
  /**
   * Resumen del préstamo (totales)
   */
  calcularResumen(cronograma) {
    const totalInteres = cronograma.reduce((s, c) => s + c.interes, 0);
    const totalAmortizacion = cronograma.reduce((s, c) => s + c.amortizacion, 0);
    const totalPagar = cronograma.reduce((s, c) => s + c.cuota, 0);
    
    return {
      totalInteres,
      totalAmortizacion,
      totalPagar,
      cuotaPromedio: totalPagar / cronograma.length,
      cuotaMaxima: Math.max(...cronograma.map(c => c.cuota)),
      cuotaMinima: Math.min(...cronograma.map(c => c.cuota)),
    };
  },
  
  /**
   * Calcula la TCEA aproximada (Tasa de Costo Efectivo Anual)
   * incluyendo seguros y portes mensuales
   */
  calcularTCEA(capital, cuotaConGastos, plazoMeses) {
    // Aproximación iterativa: encuentra la tasa que iguala los flujos
    let tasaMin = 0;
    let tasaMax = 5; // 500% anual como tope
    let tasa = 0.5;
    
    for (let i = 0; i < 100; i++) {
      const temPrueba = Math.pow(1 + tasa, 1/12) - 1;
      const factor = Math.pow(1 + temPrueba, plazoMeses);
      const cuotaPrueba = capital * (temPrueba * factor) / (factor - 1);
      
      if (Math.abs(cuotaPrueba - cuotaConGastos) < 0.01) break;
      
      if (cuotaPrueba < cuotaConGastos) {
        tasaMin = tasa;
      } else {
        tasaMax = tasa;
      }
      tasa = (tasaMin + tasaMax) / 2;
    }
    
    return tasa;
  },
};
