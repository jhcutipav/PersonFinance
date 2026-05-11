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
    // Si es un color custom (hex), generar un gradiente dinámico
    if (typeof colorId === 'string' && colorId.startsWith('#')) {
      // Función para oscurecer un hex
      const darken = (hex, amount = 0.5) => {
        const num = parseInt(hex.slice(1), 16);
        const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * amount));
        const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * amount));
        const b = Math.max(0, Math.floor((num & 0xff) * amount));
        return `rgb(${r}, ${g}, ${b})`;
      };
      const oscuro = darken(colorHex, 0.3);
      return `radial-gradient(ellipse at top right, ${colorHex}66, transparent 50%), radial-gradient(ellipse at bottom left, ${colorHex}44, transparent 50%), linear-gradient(135deg, ${oscuro} 0%, ${colorHex} 50%, ${oscuro} 100%)`;
    }
    
    // Mapeo de colores conocidos a gradientes pre-diseñados
    const gradientes = {
      blue:    `radial-gradient(ellipse at top right, rgba(244, 114, 182, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(6, 182, 212, 0.3), transparent 50%), linear-gradient(135deg, #1e3a8a 0%, #3B82F6 50%, #1e3a8a 100%)`,
      green:   `radial-gradient(ellipse at top right, rgba(20, 240, 205, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(16, 185, 129, 0.3), transparent 50%), linear-gradient(135deg, #064e3b 0%, #10B981 50%, #064e3b 100%)`,
      purple:  `radial-gradient(ellipse at top right, rgba(244, 114, 182, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(6, 182, 212, 0.3), transparent 50%), linear-gradient(135deg, #1a1a3e 0%, #2d1b4e 50%, #1a1a3e 100%)`,
      amber:   `radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(239, 68, 68, 0.3), transparent 50%), linear-gradient(135deg, #78350f 0%, #F59E0B 50%, #78350f 100%)`,
      red:     `radial-gradient(ellipse at top right, rgba(244, 114, 182, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(245, 158, 11, 0.3), transparent 50%), linear-gradient(135deg, #7f1d1d 0%, #EF4444 50%, #7f1d1d 100%)`,
      pink:    `radial-gradient(ellipse at top right, rgba(139, 92, 246, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(244, 114, 182, 0.3), transparent 50%), linear-gradient(135deg, #831843 0%, #EC4899 50%, #831843 100%)`,
      cyan:    `radial-gradient(ellipse at top right, rgba(6, 182, 212, 0.5), transparent 50%), radial-gradient(ellipse at bottom left, rgba(124, 58, 237, 0.3), transparent 50%), linear-gradient(135deg, #0a1628 0%, #1a3a52 50%, #0a1628 100%)`,
      yellow:  `radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.5), transparent 50%), radial-gradient(ellipse at bottom left, rgba(245, 158, 11, 0.3), transparent 50%), linear-gradient(135deg, #713f12 0%, #FBBF24 50%, #713f12 100%)`,
      teal:    `radial-gradient(ellipse at top right, rgba(20, 240, 205, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(20, 184, 166, 0.3), transparent 50%), linear-gradient(135deg, #134e4a 0%, #14B8A6 50%, #134e4a 100%)`,
      indigo:  `radial-gradient(ellipse at top right, rgba(139, 92, 246, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(99, 102, 241, 0.3), transparent 50%), linear-gradient(135deg, #1e1b4b 0%, #6366F1 50%, #1e1b4b 100%)`,
      rose:    `radial-gradient(ellipse at top right, rgba(251, 113, 133, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(244, 63, 94, 0.3), transparent 50%), linear-gradient(135deg, #881337 0%, #F43F5E 50%, #881337 100%)`,
      fuchsia: `radial-gradient(ellipse at top right, rgba(232, 121, 249, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(217, 70, 239, 0.3), transparent 50%), linear-gradient(135deg, #701a75 0%, #D946EF 50%, #701a75 100%)`,
      violet:  `radial-gradient(ellipse at top right, rgba(167, 139, 250, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(124, 58, 237, 0.3), transparent 50%), linear-gradient(135deg, #2e1065 0%, #7C3AED 50%, #2e1065 100%)`,
      sky:     `radial-gradient(ellipse at top right, rgba(125, 211, 252, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(14, 165, 233, 0.3), transparent 50%), linear-gradient(135deg, #0c4a6e 0%, #0EA5E9 50%, #0c4a6e 100%)`,
      emerald: `radial-gradient(ellipse at top right, rgba(110, 231, 183, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(5, 150, 105, 0.3), transparent 50%), linear-gradient(135deg, #064e3b 0%, #059669 50%, #064e3b 100%)`,
      lime:    `radial-gradient(ellipse at top right, rgba(190, 242, 100, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(132, 204, 22, 0.3), transparent 50%), linear-gradient(135deg, #365314 0%, #84CC16 50%, #365314 100%)`,
      orange:  `radial-gradient(ellipse at top right, rgba(253, 186, 116, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(234, 88, 12, 0.3), transparent 50%), linear-gradient(135deg, #7c2d12 0%, #EA580C 50%, #7c2d12 100%)`,
      slate:   `radial-gradient(ellipse at top right, rgba(148, 163, 184, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(100, 116, 139, 0.3), transparent 50%), linear-gradient(135deg, #1e293b 0%, #64748B 50%, #1e293b 100%)`,
      zinc:    `radial-gradient(ellipse at top right, rgba(161, 161, 170, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(113, 113, 122, 0.3), transparent 50%), linear-gradient(135deg, #27272a 0%, #71717A 50%, #27272a 100%)`,
      stone:   `radial-gradient(ellipse at top right, rgba(168, 162, 158, 0.4), transparent 50%), radial-gradient(ellipse at bottom left, rgba(120, 113, 108, 0.3), transparent 50%), linear-gradient(135deg, #292524 0%, #78716C 50%, #292524 100%)`,
    };
    
    return gradientes[colorId] || gradientes.purple;
  },
};
