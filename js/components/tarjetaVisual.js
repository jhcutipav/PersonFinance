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
    const tema = tarjeta.colorTema === 'cyan' ? 'theme-cyan' : 'theme-purple';
    
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
      <div class="credit-card-realistic ${tema}">
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
};
