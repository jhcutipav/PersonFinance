/* ============================================
   COLOR PICKER - Componente reutilizable
   ============================================ */

const ColorPicker = {
  
  // Paleta extendida de 20 colores estándar para cuentas y tarjetas
  PALETA: [
    // Fila 1: Colores base
    { id: 'blue',     nombre: 'Azul',           hex: '#3B82F6' },
    { id: 'green',    nombre: 'Verde',          hex: '#10B981' },
    { id: 'purple',   nombre: 'Morado',         hex: '#8B5CF6' },
    { id: 'amber',    nombre: 'Naranja',        hex: '#F59E0B' },
    { id: 'red',      nombre: 'Rojo',           hex: '#EF4444' },
    
    // Fila 2: Tonos secundarios
    { id: 'pink',     nombre: 'Rosa',           hex: '#EC4899' },
    { id: 'cyan',     nombre: 'Cyan',           hex: '#06B6D4' },
    { id: 'yellow',   nombre: 'Amarillo',       hex: '#FBBF24' },
    { id: 'teal',     nombre: 'Verde azulado',  hex: '#14B8A6' },
    { id: 'indigo',   nombre: 'Índigo',         hex: '#6366F1' },
    
    // Fila 3: Tonos vibrantes
    { id: 'rose',     nombre: 'Rosa intenso',   hex: '#F43F5E' },
    { id: 'fuchsia',  nombre: 'Fucsia',         hex: '#D946EF' },
    { id: 'violet',   nombre: 'Violeta',        hex: '#7C3AED' },
    { id: 'sky',      nombre: 'Celeste',        hex: '#0EA5E9' },
    { id: 'emerald',  nombre: 'Esmeralda',      hex: '#059669' },
    
    // Fila 4: Tonos profundos
    { id: 'lime',     nombre: 'Lima',           hex: '#84CC16' },
    { id: 'orange',   nombre: 'Naranja oscuro', hex: '#EA580C' },
    { id: 'slate',    nombre: 'Pizarra',        hex: '#64748B' },
    { id: 'zinc',     nombre: 'Zinc',           hex: '#71717A' },
    { id: 'stone',    nombre: 'Piedra',         hex: '#78716C' },
  ],
  
  /**
   * Devuelve el hex de un color por ID. 
   * Si el ID empieza con '#' es un color custom (hex directo).
   */
  obtenerHex(colorId) {
    if (!colorId) return '#3B82F6';
    
    // Color custom: empieza con #
    if (typeof colorId === 'string' && colorId.startsWith('#')) {
      return colorId;
    }
    
    const c = this.PALETA.find(c => c.id === colorId);
    return c ? c.hex : '#3B82F6';
  },
  
  /**
   * Renderiza el selector de color como HTML
   */
  render(colorSeleccionado, idAtributo = 'color') {
    const esCustom = typeof colorSeleccionado === 'string' && colorSeleccionado.startsWith('#');
    const valorCustom = esCustom ? colorSeleccionado : '#14F0CD';
    
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
        
        <!-- Color custom (input color HTML5) -->
        <label class="color-swatch color-swatch-custom ${esCustom ? 'selected' : ''}"
               style="background: linear-gradient(135deg, #FF0080, #FFD700, #00C9FF, #92FE9D);"
               title="Color personalizado"
               aria-label="Color personalizado">
          <input type="color" 
                 class="color-custom-input"
                 value="${valorCustom}"
                 data-custom="true"
                 style="opacity:0; position:absolute; inset:0; cursor:pointer; width:100%; height:100%; border:none;">
          <span class="color-custom-icon">🎨</span>
        </label>
      </div>
    `;
  },
  
  /**
   * Configura los listeners del color picker.
   * onChange: callback que recibe el colorId (o hex custom) seleccionado
   */
  configurar(onChange) {
    document.querySelectorAll('[data-color-picker]').forEach(picker => {
      // Swatches normales
      picker.querySelectorAll('.color-swatch[data-color]').forEach(btn => {
        btn.addEventListener('click', () => {
          const colorId = btn.dataset.color;
          // Actualizar visual
          picker.querySelectorAll('.color-swatch').forEach(b => {
            b.classList.toggle('selected', b.dataset.color === colorId);
          });
          if (onChange) onChange(colorId);
        });
      });
      
      // Input de color custom
      const customInput = picker.querySelector('.color-custom-input');
      if (customInput) {
        customInput.addEventListener('change', (e) => {
          const hex = e.target.value;
          const customLabel = picker.querySelector('.color-swatch-custom');
          
          // Marcar custom como seleccionado
          picker.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('selected'));
          customLabel.classList.add('selected');
          customLabel.style.background = hex;
          
          if (onChange) onChange(hex);
        });
      }
    });
  },
};
