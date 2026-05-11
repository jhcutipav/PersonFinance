/* ============================================
   COMPONENTE: VISUAL DE TARJETA DE CRÉDITO
   Reutilizable en dashboard y página de tarjetas
   ============================================ */

const TarjetaVisualComp = {
  
  /**
   * Renderiza la imagen de tarjeta física realista
   * @param {object} tarjeta - Datos de la tarjeta
   * @param {object} usuario - Usuario actual (para nombre default)
   */
  render(tarjeta, usuario) {
    // Determinar el color de la tarjeta. Soporta colores antiguos (purple, cyan) y nuevos.
    const colorId = tarjeta.colorTema || 'purple';
    const colorHex = ColorPicker.obtenerHex(colorId);
    
    // Generar gradiente personalizado según el color elegido
    const gradiente = this.generarGradiente(colorId, colorHex);
    
    let logoMarca = '';
    if (tarjeta.marca === 'VISA') {
      logoMarca = `<div class="cc-brand-logo visa">VISA</div>`;
    } else if (tarjeta.marca === 'MASTERCARD') {
      logoMarca = `
        <div class="cc-brand-logo mastercard">
          <span class="circle red"></span>
          <span class="circle yellow"></span>
        </div>
      `;
    } else {
      logoMarca = `<div class="cc-brand-logo visa">${tarjeta.marca}</div>`;
    }
    
    const fechaExp = tarjeta.fechaExpiracion || '12/28';
    const titular = (tarjeta.titular || (usuario && usuario.nombre) || 'Titular').toUpperCase();
    const banco = tarjeta.banco || tarjeta.nombre.split(' ')[0];
    
    return `
      <div class="credit-card-realistic" style="background: ${gradiente};">
        <div class="cc-top-row">
          <div class="cc-chip"></div>
          <div class="cc-bank-name">${banco}</div>
        </div>
        
        <div class="cc-number">
          <span>••••</span>
          <span>••••</span>
          <span>••••</span>
          <span>${tarjeta.ultimosDigitos}</span>
        </div>
        
        <div class="cc-bottom-row">
          <div class="cc-holder">
            <div class="cc-label">Cardholder</div>
            <div class="cc-holder-name">${titular}</div>
          </div>
          
          <div class="cc-expiry-block">
            <div class="cc-label">Exp</div>
            <div class="cc-expiry-value">${fechaExp}</div>
          </div>
          
          ${logoMarca}
        </div>
      </div>
    `;
  },
  
  /**
   * Genera un gradiente realista según el color base
   */
  generarGradiente(colorId, colorHex) {
    // Mapeo de colores a sus complementarios para hacer gradientes vistosos
    const gradientes = {
      blue:   `radial-gradient(ellipse at top right, rgba(244, 114, 182, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(6, 182, 212, 0.3), transparent 50%), linear-gradient(135deg, #1e3a8a 0%, #3B82F6 50%, #1e3a8a 100%)`,
      green:  `radial-gradient(ellipse at top right, rgba(20, 240, 205, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(16, 185, 129, 0.3), transparent 50%), linear-gradient(135deg, #064e3b 0%, #10B981 50%, #064e3b 100%)`,
      purple: `radial-gradient(ellipse at top right, rgba(244, 114, 182, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(6, 182, 212, 0.3), transparent 50%), linear-gradient(135deg, #1a1a3e 0%, #2d1b4e 50%, #1a1a3e 100%)`,
      amber:  `radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(239, 68, 68, 0.3), transparent 50%), linear-gradient(135deg, #78350f 0%, #F59E0B 50%, #78350f 100%)`,
      red:    `radial-gradient(ellipse at top right, rgba(244, 114, 182, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(245, 158, 11, 0.3), transparent 50%), linear-gradient(135deg, #7f1d1d 0%, #EF4444 50%, #7f1d1d 100%)`,
      pink:   `radial-gradient(ellipse at top right, rgba(139, 92, 246, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(244, 114, 182, 0.3), transparent 50%), linear-gradient(135deg, #831843 0%, #EC4899 50%, #831843 100%)`,
      cyan:   `radial-gradient(ellipse at top right, rgba(6, 182, 212, 0.5), transparent 50%), radial-gradient(ellipse at bottom left, rgba(124, 58, 237, 0.3), transparent 50%), linear-gradient(135deg, #0a1628 0%, #1a3a52 50%, #0a1628 100%)`,
      yellow: `radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.5), transparent 50%), radial-gradient(ellipse at bottom left, rgba(245, 158, 11, 0.3), transparent 50%), linear-gradient(135deg, #713f12 0%, #FBBF24 50%, #713f12 100%)`,
    };
    
    return gradientes[colorId] || gradientes.purple;
  },
};
