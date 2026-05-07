/* ============================================
   DATOS SIMULADOS (SEED)
   Estos datos cargan SOLO la primera vez.
   Después de eso, se usa lo que el usuario
   guarda en localStorage.
   ============================================ */

const MockData = {
  
  usuario: {
    id: 1,
    nombre: 'Daniel',
    email: 'daniel@ejemplo.com',
    monedaPrincipal: 'PEN',
  },
  
  cuentas: [
    { id: 1, nombre: 'Efectivo', tipo: 'efectivo', moneda: 'PEN', saldo: 850.00, activo: true },
    { id: 2, nombre: 'BCP Cuenta Sueldo', tipo: 'debito', moneda: 'PEN', saldo: 5200.50, activo: true },
    { id: 3, nombre: 'Yape', tipo: 'billetera', moneda: 'PEN', saldo: 320.00, activo: true },
    { id: 4, nombre: 'BBVA Ahorros USD', tipo: 'debito', moneda: 'USD', saldo: 1500.00, activo: true },
    { id: 5, nombre: 'BCP Visa Signature', tipo: 'credito', moneda: 'PEN', saldo: 0, activo: true },
    { id: 6, nombre: 'Interbank Mastercard USD', tipo: 'credito', moneda: 'USD', saldo: 0, activo: true },
  ],
  
  tarjetas: [
    {
      id: 1, cuentaId: 5, nombre: 'BCP Visa Signature', banco: 'BCP',
      titular: 'Daniel Ramírez', ultimosDigitos: '4521', fechaExpiracion: '08/28',
      marca: 'VISA', moneda: 'PEN', lineaCredito: 10000, saldoUsado: 4500,
      diaCorte: 28, diaPago: 13, tasaTEA: 0.85, colorTema: 'purple',
    },
    {
      id: 2, cuentaId: 6, nombre: 'Interbank Mastercard USD', banco: 'INTERBANK',
      titular: 'Daniel Ramírez', ultimosDigitos: '8932', fechaExpiracion: '03/27',
      marca: 'MASTERCARD', moneda: 'USD', lineaCredito: 3000, saldoUsado: 850,
      diaCorte: 15, diaPago: 5, tasaTEA: 0.45, colorTema: 'cyan',
    },
  ],
  
  ciclosTarjeta: [
    { id: 1, tarjetaId: 1, fechaCorte: '2025-04-28', fechaPago: '2025-05-13', montoFacturado: 1820, pagoMinimo: 180, estado: 'pendiente' },
    { id: 2, tarjetaId: 2, fechaCorte: '2025-04-15', fechaPago: '2025-05-05', montoFacturado: 320, pagoMinimo: 32, estado: 'pendiente' },
  ],
  
  /* CATEGORÍAS CON JERARQUÍA
     categoriaPadreId = null  -> es categoría principal
     categoriaPadreId = X     -> es subcategoría de X
  */
  categorias: [
    // ===== EGRESOS PRINCIPALES =====
    { id: 1, nombre: 'Alimentación', tipo: 'egreso', icono: '🍔', color: 'red', categoriaPadreId: null },
      { id: 11, nombre: 'Supermercado', tipo: 'egreso', icono: '🛒', color: 'red', categoriaPadreId: 1 },
      { id: 12, nombre: 'Restaurantes', tipo: 'egreso', icono: '🍽️', color: 'red', categoriaPadreId: 1 },
      { id: 13, nombre: 'Delivery', tipo: 'egreso', icono: '🛵', color: 'red', categoriaPadreId: 1 },
      { id: 14, nombre: 'Café', tipo: 'egreso', icono: '☕', color: 'red', categoriaPadreId: 1 },
    
    { id: 2, nombre: 'Transporte', tipo: 'egreso', icono: '🚗', color: 'amber', categoriaPadreId: null },
      { id: 21, nombre: 'Gasolina', tipo: 'egreso', icono: '⛽', color: 'amber', categoriaPadreId: 2 },
      { id: 22, nombre: 'Taxi/Uber', tipo: 'egreso', icono: '🚕', color: 'amber', categoriaPadreId: 2 },
      { id: 23, nombre: 'Transporte público', tipo: 'egreso', icono: '🚌', color: 'amber', categoriaPadreId: 2 },
    
    { id: 3, nombre: 'Entretenimiento', tipo: 'egreso', icono: '🎬', color: 'pink', categoriaPadreId: null },
      { id: 31, nombre: 'Cine/Teatro', tipo: 'egreso', icono: '🎭', color: 'pink', categoriaPadreId: 3 },
      { id: 32, nombre: 'Salidas', tipo: 'egreso', icono: '🍻', color: 'pink', categoriaPadreId: 3 },
      { id: 33, nombre: 'Videojuegos', tipo: 'egreso', icono: '🎮', color: 'pink', categoriaPadreId: 3 },
    
    { id: 4, nombre: 'Servicios', tipo: 'egreso', icono: '⚡', color: 'cyan', categoriaPadreId: null },
      { id: 41, nombre: 'Luz', tipo: 'egreso', icono: '💡', color: 'cyan', categoriaPadreId: 4 },
      { id: 42, nombre: 'Agua', tipo: 'egreso', icono: '💧', color: 'cyan', categoriaPadreId: 4 },
      { id: 43, nombre: 'Internet', tipo: 'egreso', icono: '📶', color: 'cyan', categoriaPadreId: 4 },
      { id: 44, nombre: 'Teléfono', tipo: 'egreso', icono: '📱', color: 'cyan', categoriaPadreId: 4 },
    
    { id: 5, nombre: 'Suscripciones', tipo: 'egreso', icono: '📺', color: 'purple', categoriaPadreId: null },
      { id: 51, nombre: 'Streaming', tipo: 'egreso', icono: '🎬', color: 'purple', categoriaPadreId: 5 },
      { id: 52, nombre: 'Música', tipo: 'egreso', icono: '🎵', color: 'purple', categoriaPadreId: 5 },
      { id: 53, nombre: 'Software', tipo: 'egreso', icono: '💻', color: 'purple', categoriaPadreId: 5 },
    
    { id: 6, nombre: 'Salud', tipo: 'egreso', icono: '⚕️', color: 'green', categoriaPadreId: null },
      { id: 61, nombre: 'Medicinas', tipo: 'egreso', icono: '💊', color: 'green', categoriaPadreId: 6 },
      { id: 62, nombre: 'Consultas', tipo: 'egreso', icono: '🩺', color: 'green', categoriaPadreId: 6 },
    
    { id: 7, nombre: 'Vivienda', tipo: 'egreso', icono: '🏠', color: 'amber', categoriaPadreId: null },
      { id: 71, nombre: 'Alquiler', tipo: 'egreso', icono: '🔑', color: 'amber', categoriaPadreId: 7 },
      { id: 72, nombre: 'Mantenimiento', tipo: 'egreso', icono: '🔧', color: 'amber', categoriaPadreId: 7 },
    
    { id: 8, nombre: 'Otros gastos', tipo: 'egreso', icono: '📦', color: 'red', categoriaPadreId: null },
    
    // ===== INGRESOS PRINCIPALES =====
    { id: 100, nombre: 'Sueldo', tipo: 'ingreso', icono: '💼', color: 'green', categoriaPadreId: null },
    { id: 101, nombre: 'Freelance', tipo: 'ingreso', icono: '💻', color: 'cyan', categoriaPadreId: null },
    { id: 102, nombre: 'Inversiones', tipo: 'ingreso', icono: '📈', color: 'green', categoriaPadreId: null },
    { id: 103, nombre: 'Otros ingresos', tipo: 'ingreso', icono: '💰', color: 'amber', categoriaPadreId: null },
  ],
  
  transacciones: [
    { id: 1, cuentaId: 2, categoriaId: 11, tipo: 'egreso', monto: 145.30, moneda: 'PEN', descripcion: 'Plaza Vea', fecha: '2025-05-05', esCredito: false },
    { id: 2, cuentaId: 2, categoriaId: 100, tipo: 'ingreso', monto: 4800, moneda: 'PEN', descripcion: 'Sueldo Mayo', fecha: '2025-05-04', esCredito: false },
    { id: 3, cuentaId: 5, categoriaId: 51, tipo: 'egreso', monto: 44.90, moneda: 'PEN', descripcion: 'Netflix', fecha: '2025-05-02', esCredito: true, tarjetaId: 1 },
    { id: 4, cuentaId: 1, categoriaId: 22, tipo: 'egreso', monto: 18.50, moneda: 'PEN', descripcion: 'Uber', fecha: '2025-05-01', esCredito: false },
    { id: 5, cuentaId: 6, categoriaId: 52, tipo: 'egreso', monto: 9.99, moneda: 'USD', descripcion: 'Spotify Premium', fecha: '2025-04-30', esCredito: true, tarjetaId: 2 },
    { id: 6, cuentaId: 2, categoriaId: 41, tipo: 'egreso', monto: 89.00, moneda: 'PEN', descripcion: 'Recibo de luz', fecha: '2025-04-28', esCredito: false },
  ],
  
  presupuestos: [
    { id: 1, categoriaId: 1, monto: 1000, moneda: 'PEN', gastado: 650, mes: 5, anio: 2025 },
    { id: 2, categoriaId: 2, monto: 500, moneda: 'PEN', gastado: 425, mes: 5, anio: 2025 },
    { id: 3, categoriaId: 3, monto: 300, moneda: 'PEN', gastado: 330, mes: 5, anio: 2025 },
  ],
  
  /* GASTOS FIJOS Y SUSCRIPCIONES
     tipo: 'fijo' (mismo monto siempre) | 'variable' (cambia mes a mes)
     frecuencia: 'mensual' | 'anual' | 'semestral' | 'trimestral'
     diaCobro: día del mes en que se cobra
     activo: true/false
  */
  gastosFijos: [
    {
      id: 1,
      nombre: 'Netflix',
      tipo: 'fijo',
      esSuscripcion: true,
      categoriaId: 51,
      cuentaId: 5, // Tarjeta BCP
      monto: 44.90,
      moneda: 'PEN',
      frecuencia: 'mensual',
      diaCobro: 2,
      icono: '🎬',
      color: 'red',
      activo: true,
      historico: [
        { fecha: '2025-05-02', monto: 44.90, pagado: true },
        { fecha: '2025-04-02', monto: 44.90, pagado: true },
        { fecha: '2025-03-02', monto: 44.90, pagado: true },
      ],
    },
    {
      id: 2,
      nombre: 'Spotify Premium',
      tipo: 'fijo',
      esSuscripcion: true,
      categoriaId: 52,
      cuentaId: 6,
      monto: 9.99,
      moneda: 'USD',
      frecuencia: 'mensual',
      diaCobro: 30,
      icono: '🎵',
      color: 'green',
      activo: true,
      historico: [
        { fecha: '2025-04-30', monto: 9.99, pagado: true },
        { fecha: '2025-03-30', monto: 9.99, pagado: true },
      ],
    },
    {
      id: 3,
      nombre: 'Internet',
      tipo: 'fijo',
      esSuscripcion: false,
      categoriaId: 43,
      cuentaId: 2,
      monto: 120.00,
      moneda: 'PEN',
      frecuencia: 'mensual',
      diaCobro: 5,
      icono: '📶',
      color: 'cyan',
      activo: true,
      historico: [
        { fecha: '2025-04-05', monto: 120.00, pagado: true },
        { fecha: '2025-03-05', monto: 120.00, pagado: true },
      ],
    },
    {
      id: 4,
      nombre: 'Recibo de luz',
      tipo: 'variable',
      esSuscripcion: false,
      categoriaId: 41,
      cuentaId: 2,
      monto: 89.00, // monto estimado
      moneda: 'PEN',
      frecuencia: 'mensual',
      diaCobro: 28,
      icono: '💡',
      color: 'amber',
      activo: true,
      historico: [
        { fecha: '2025-04-28', monto: 89.00, pagado: true },
        { fecha: '2025-03-28', monto: 76.50, pagado: true },
        { fecha: '2025-02-28', monto: 92.30, pagado: true },
      ],
    },
    {
      id: 5,
      nombre: 'Recibo de agua',
      tipo: 'variable',
      esSuscripcion: false,
      categoriaId: 42,
      cuentaId: 2,
      monto: 35.00,
      moneda: 'PEN',
      frecuencia: 'mensual',
      diaCobro: 15,
      icono: '💧',
      color: 'cyan',
      activo: true,
      historico: [
        { fecha: '2025-04-15', monto: 35.00, pagado: true },
        { fecha: '2025-03-15', monto: 38.20, pagado: true },
      ],
    },
    {
      id: 6,
      nombre: 'YouTube Premium',
      tipo: 'fijo',
      esSuscripcion: true,
      categoriaId: 51,
      cuentaId: 5,
      monto: 18.99,
      moneda: 'PEN',
      frecuencia: 'mensual',
      diaCobro: 18,
      icono: '📺',
      color: 'red',
      activo: true,
      historico: [
        { fecha: '2025-04-18', monto: 18.99, pagado: true },
      ],
    },
  ],
};
