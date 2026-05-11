# FinanzApp 💰

App web de finanzas personales con diseño glassmorphism, multi-moneda y enfoque modular.

## 🚀 Cómo arrancar (en local)

### Opción 1: Live Server (recomendado)

1. Abre la carpeta `finanzapp` en VS Code.
2. Instala la extensión **Live Server** (de Ritwick Dey) si no la tienes.
3. Click derecho sobre `index.html` → **"Open with Live Server"**.
4. Se abre tu navegador en `http://127.0.0.1:5500/` con la app.
5. Cualquier cambio que guardes en el código, se recarga automáticamente. ✨

### Opción 2: Doble clic

También puedes abrir directamente `index.html` con doble clic en tu explorador de archivos. Funciona igual, solo que no tendrás recarga automática.

## 📁 Estructura del proyecto

```
finanzapp/
├── index.html              ← Página principal
├── css/
│   ├── variables.css       ← Colores, espaciados (cambia aquí el tema)
│   ├── base.css            ← Reset, body, auroras
│   ├── layout.css          ← Sidebar, header (responsive)
│   ├── components.css      ← Botones, cards, badges reutilizables
│   └── dashboard.css       ← Estilos específicos del dashboard
├── js/
│   ├── app.js              ← Punto de entrada (inicialización)
│   ├── data/
│   │   ├── mockData.js     ← Datos simulados (BD de mentira)
│   │   └── api.js          ← Capa de acceso a datos ⭐
│   ├── pages/
│   │   └── dashboard.js    ← Lógica del dashboard
│   └── utils/
│       ├── formato.js      ← Formato de monedas, conversión
│       └── fechas.js       ← Manejo de fechas
└── assets/
```

## 🔑 Concepto clave: la capa API

Las páginas (como `dashboard.js`) **nunca leen `mockData.js` directamente**. Siempre pasan por `api.js`. Esto permite que cuando migremos a Supabase, solo cambiemos el contenido de `api.js` y todo el resto siga funcionando.

```js
// ❌ MAL (acopla la página con la fuente de datos)
const cuentas = MockData.cuentas;

// ✅ BIEN (la página no sabe de dónde vienen los datos)
const cuentas = API.obtenerCuentas();
```

## 💱 Multi-moneda

- Cada cuenta tiene su moneda fija (PEN o USD).
- Cada transacción se guarda en la moneda de su cuenta.
- El selector del header convierte la vista usando el tipo de cambio configurado en `formato.js`.
- Para editar el tipo de cambio: `js/utils/formato.js` → `TIPO_CAMBIO.USD_PEN`.

## 🎨 Personalización rápida

- **Colores:** edita `css/variables.css`.
- **Datos de prueba:** edita `js/data/mockData.js` con tus propios datos.
- **Tipo de cambio:** edita `js/utils/formato.js`.

## 🛠️ Próximas etapas

- [x] Etapa 1: Dashboard con datos simulados
- [ ] Etapa 2: Módulo de transacciones (CRUD completo)
- [ ] Etapa 3: Módulo de tarjetas de crédito (ciclos, cuotas)
- [ ] Etapa 4: Gastos fijos y suscripciones
- [ ] Etapa 5: Presupuestos
- [ ] Etapa 6: Deudas y simulador
- [ ] Etapa 7: Metas de ahorro
- [ ] Etapa 8: Reportes
- [ ] Etapa 9: Migrar a Supabase
- [ ] Etapa 10: Desplegar a Vercel
