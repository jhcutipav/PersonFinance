/* ============================================
   UTILIDADES DE TARJETA DE CRÉDITO
   Cálculo de ciclos, fechas de corte/pago
   ============================================ */

const TarjetaUtils = {
  
  /**
   * Calcula las fechas del ciclo actual de una tarjeta.
   * Retorna { inicioActual, finActual, fechaPago, inicioFacturado, finFacturado, fechaPagoFacturado }
   * 
   * Ejemplo: día corte 28, día pago 13, hoy 5 mayo:
   * - Ciclo facturado: 28 marzo - 28 abril, se paga 13 mayo
   * - Ciclo actual: 28 abril - 28 mayo, se paga 13 junio
   */
  calcularCiclos(diaCorte, diaPago, fechaReferencia = new Date()) {
    const hoy = new Date(fechaReferencia);
    hoy.setHours(0, 0, 0, 0);
    
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();
    const dia = hoy.getDate();
    
    // Determinar fin del ciclo actual (próximo corte después de hoy)
    let finActual;
    if (dia < diaCorte) {
      // Corte aún no llegó este mes
      finActual = new Date(anio, mes, diaCorte);
    } else {
      // Corte ya pasó, el próximo es el mes siguiente
      finActual = new Date(anio, mes + 1, diaCorte);
    }
    
    // Inicio del ciclo actual = corte anterior + 1 día
    const inicioActual = new Date(finActual);
    inicioActual.setMonth(inicioActual.getMonth() - 1);
    inicioActual.setDate(inicioActual.getDate() + 1);
    
    // Fecha de pago del ciclo actual = día de pago del mes después del fin
    const fechaPagoActual = this.calcularFechaPago(finActual, diaPago);
    
    // CICLO FACTURADO: el anterior, ya cerrado
    const finFacturado = new Date(inicioActual);
    finFacturado.setDate(finFacturado.getDate() - 1);
    
    const inicioFacturado = new Date(finFacturado);
    inicioFacturado.setMonth(inicioFacturado.getMonth() - 1);
    inicioFacturado.setDate(inicioFacturado.getDate() + 1);
    
    const fechaPagoFacturado = this.calcularFechaPago(finFacturado, diaPago);
    
    return {
      // Ciclo actual (en curso, aún no facturado)
      inicioActual,
      finActual,
      fechaPagoActual,
      // Ciclo facturado (debe pagarse pronto)
      inicioFacturado,
      finFacturado,
      fechaPagoFacturado,
    };
  },
  
  /**
   * Dado el día de corte y día de pago, calcula la fecha de pago.
   * Si el día de pago es menor al de corte, el pago es del mes siguiente.
   * Ej: corte 28, pago 13 -> pago del mes siguiente al corte.
   */
  calcularFechaPago(fechaCorte, diaPago) {
    const fechaPago = new Date(fechaCorte);
    if (diaPago < fechaCorte.getDate()) {
      fechaPago.setMonth(fechaPago.getMonth() + 1);
    }
    fechaPago.setDate(diaPago);
    return fechaPago;
  },
  
  /**
   * Determina a qué ciclo pertenece una fecha de transacción.
   * Retorna 'actual' | 'facturado' | 'historico'
   */
  cicloDe(fechaTransaccion, ciclos) {
    const f = new Date(fechaTransaccion);
    f.setHours(0, 0, 0, 0);
    
    if (f >= ciclos.inicioActual && f <= ciclos.finActual) return 'actual';
    if (f >= ciclos.inicioFacturado && f <= ciclos.finFacturado) return 'facturado';
    return 'historico';
  },
  
  /**
   * Genera los movimientos de cuotas para una compra.
   * Por ejemplo: compra de S/600 a 6 cuotas el 5 de mayo, 
   * genera 6 transacciones virtuales una por cada mes.
   */
  generarCuotas(monto, totalCuotas, fechaCompra) {
    const cuotaMensual = monto / totalCuotas;
    const cuotas = [];
    
    for (let i = 0; i < totalCuotas; i++) {
      const fechaCuota = new Date(fechaCompra);
      fechaCuota.setMonth(fechaCuota.getMonth() + i);
      
      cuotas.push({
        numero: i + 1,
        total: totalCuotas,
        monto: cuotaMensual,
        fecha: fechaCuota.toISOString().split('T')[0],
      });
    }
    
    return cuotas;
  },
  
  /**
   * Calcula el monto facturado de una tarjeta sumando 
   * todas las transacciones del ciclo facturado.
   */
  calcularMontoFacturado(tarjeta, transacciones) {
    const ciclos = this.calcularCiclos(tarjeta.diaCorte, tarjeta.diaPago);
    
    return transacciones
      .filter(t => t.tarjetaId === tarjeta.id && t.tipo === 'egreso')
      .filter(t => {
        const fecha = new Date(t.fecha);
        return fecha >= ciclos.inicioFacturado && fecha <= ciclos.finFacturado;
      })
      .reduce((sum, t) => sum + t.monto, 0);
  },
  
  /**
   * Calcula el monto en curso (ciclo actual no facturado aún)
   */
  calcularMontoCicloActual(tarjeta, transacciones) {
    const ciclos = this.calcularCiclos(tarjeta.diaCorte, tarjeta.diaPago);
    
    return transacciones
      .filter(t => t.tarjetaId === tarjeta.id && t.tipo === 'egreso')
      .filter(t => {
        const fecha = new Date(t.fecha);
        return fecha >= ciclos.inicioActual && fecha <= ciclos.finActual;
      })
      .reduce((sum, t) => sum + t.monto, 0);
  },
};
