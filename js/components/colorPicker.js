/* ============================================
   COLOR PICKER - Componente reutilizable
   ============================================ */

const ColorPicker = {
  
  // Paleta de 8 colores estándar para cuentas y tarjetas
  PALETA: [
    { id: 'blue',    nombre: 'Azul',     hex: '#3B82F6' },
    { id: 'green',   nombre: 'Verde',    hex: '#10B981' },
    { id: 'purple',  nombre: 'Morado',   hex: '#8B5CF6' },
    { id: 'amber',   nombre: 'Naranja',  hex: '#F59E0B' },
    { id: 'red',     nombre: 'Rojo',     hex: '#EF4444' },
    { id: 'pink',    nombre: 'Rosa',     hex: '#EC4899' },
    { id: 'cyan',    nombre: 'Cyan',     hex: '#06B6D4' },
    { id: 'yellow',  nombre: 'Amarillo', hex: '#FBBF24' },
  ],
  
  /**
   * Devuelve el hex de un color por ID
   */
  obtenerHex(colorId) {
    const c = this.PALETA.find(c => c.id === colorId);
    return c ? c.hex : '#3B82F6';
  },
  
  /**
   * Renderiza el selector de color como HTML
   */
  render(colorSeleccionado, idAtributo = 'color') {
    return `
      <div class="color-picker" data-color-picker data-attr="${idAtributo}">
        ${this.PALETA.map(c => `
          <button type="button" 
                  class="color-swatch ${colorSeleccionado === c.id ? 'selected' : ''}" 
                  style="background: ${c.hex};"
                  data-color="${c.id}"
                  title="${c.nombre}"
                  aria-label="${c.nombre}">
          </button>
        `).join('')}
      </div>
    `;
  },
  
  /**
   * Configura los listeners del color picker.
   * onChange: callback que recibe el colorId seleccionado
   */
  configurar(onChange) {
    document.querySelectorAll('[data-color-picker]').forEach(picker => {
      picker.querySelectorAll('.color-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
          const colorId = btn.dataset.color;
          // Actualizar visual
          picker.querySelectorAll('.color-swatch').forEach(b => {
            b.classList.toggle('selected', b.dataset.color === colorId);
          });
          // Callback
          if (onChange) onChange(colorId);
        });
      });
    });
  },
};
