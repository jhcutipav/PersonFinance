/* ============================================
   UTILIDADES DE FORMATO
   Funciones para mostrar números, monedas, etc.
   ============================================ */

const Formato = {
  
  /**
   * Tipo de cambio configurable.
   * Más adelante esto vendrá de la BD o config del usuario.
   * Por ahora lo dejamos fijo: 1 USD = 3.75 PEN
   */
  TIPO_CAMBIO: {
    USD_PEN: 3.75,  // 1 dólar = 3.75 soles
  },
  
  /**
   * Símbolos de moneda
   */
  SIMBOLOS: {
    PEN: 'S/',
    USD: 'US$',
    EUR: '€',
  },
  
  /**
   * Formatea un monto en su moneda.
   * Ejemplo: formatearMoneda(1234.5, 'PEN') => "S/ 1,234.50"
   */
  formatearMoneda(monto, moneda = 'PEN') {
    const simbolo = this.SIMBOLOS[moneda] || moneda;
    const numero = Number(monto).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${simbolo} ${numero}`;
  },
  
  /**
   * Convierte un monto entre monedas usando el tipo de cambio.
   * Ejemplo: convertir(100, 'USD', 'PEN') => 375
   */
  convertir(monto, monedaOrigen, monedaDestino) {
    if (monedaOrigen === monedaDestino) return monto;
    
    // Convertimos primero a soles como base
    let enSoles = monto;
    if (monedaOrigen === 'USD') {
      enSoles = monto * this.TIPO_CAMBIO.USD_PEN;
    }
    
    // Y de soles convertimos al destino
    if (monedaDestino === 'PEN') return enSoles;
    if (monedaDestino === 'USD') return enSoles / this.TIPO_CAMBIO.USD_PEN;
    
    return enSoles;
  },
  
  /**
   * Formatea con conversión opcional.
   * Si vistaActual es 'ALL', muestra en la moneda original.
   * Si es 'PEN' o 'USD', convierte a esa moneda.
   */
  formatearConVista(monto, monedaOriginal, vistaActual = 'PEN') {
    if (vistaActual === 'ALL') {
      return this.formatearMoneda(monto, monedaOriginal);
    }
    const convertido = this.convertir(monto, monedaOriginal, vistaActual);
    return this.formatearMoneda(convertido, vistaActual);
  },
  
  /**
   * Formatea un porcentaje
   * Ejemplo: formatearPorcentaje(0.65) => "65%"
   */
  formatearPorcentaje(decimal) {
    return `${Math.round(decimal * 100)}%`;
  },
  
  /**
   * Suma montos posiblemente en distintas monedas, todo a una moneda destino
   */
  sumarEnMoneda(items, monedaDestino = 'PEN') {
    return items.reduce((total, item) => {
      const enDestino = this.convertir(item.monto, item.moneda, monedaDestino);
      return total + enDestino;
    }, 0);
  },
};
