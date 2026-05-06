/* ============================================
   UTILIDADES DE FECHAS
   Manejo de fechas, especialmente útil para
   ciclos de tarjeta de crédito
   ============================================ */

const Fechas = {
  
  MESES: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  
  MESES_CORTOS: [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ],
  
  /**
   * Nombre del mes actual: "Mayo"
   */
  mesActual() {
    return this.MESES[new Date().getMonth()];
  },
  
  /**
   * Formatea fecha tipo "Hoy", "Ayer", "3 May", etc.
   */
  formatoCorto(fecha) {
    const f = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    
    if (this.mismoDia(f, hoy)) return 'Hoy';
    if (this.mismoDia(f, ayer)) return 'Ayer';
    
    return `${f.getDate()} ${this.MESES_CORTOS[f.getMonth()]}`;
  },
  
  /**
   * Compara si dos fechas son el mismo día
   */
  mismoDia(f1, f2) {
    return f1.getDate() === f2.getDate() &&
           f1.getMonth() === f2.getMonth() &&
           f1.getFullYear() === f2.getFullYear();
  },
  
  /**
   * Días que faltan hasta una fecha futura.
   * Útil para "Faltan X días para tu pago"
   */
  diasHasta(fechaFutura) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const futuro = new Date(fechaFutura);
    futuro.setHours(0, 0, 0, 0);
    const diff = futuro - hoy;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },
  
  /**
   * Formatea fecha completa: "13 de Mayo de 2025"
   */
  formatoCompleto(fecha) {
    const f = new Date(fecha);
    return `${f.getDate()} de ${this.MESES[f.getMonth()]} de ${f.getFullYear()}`;
  },
  
  /**
   * Calcula próxima fecha de pago de una tarjeta
   * dado el día del mes en que se paga.
   * Ejemplo: si hoy es 5 de mayo y el día de pago es 13,
   * devuelve el 13 de mayo. Si hoy ya pasó del 13, devuelve 13 de junio.
   */
  proximoDiaDelMes(diaDelMes) {
    const hoy = new Date();
    let proximo = new Date(hoy.getFullYear(), hoy.getMonth(), diaDelMes);
    if (proximo <= hoy) {
      // Ya pasó este mes, vamos al siguiente
      proximo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, diaDelMes);
    }
    return proximo;
  },
};
