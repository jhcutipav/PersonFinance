/* ============================================
   API
   Capa de acceso a datos.
   Ahora usa Storage como backend.
   ============================================ */

const API = {
  
  /* ========== USUARIO ========== */
  obtenerUsuario() {
    return Storage.cargar('usuario') || MockData.usuario;
  },
  
  /* ========== CUENTAS ========== */
  obtenerCuentas() {
    const cuentas = Storage.cargar('cuentas') || [];
    return cuentas.filter(c => c.activo);
  },
  
  obtenerTodasCuentas() {
    return Storage.cargar('cuentas') || [];
  },
  
  obtenerCuentaPorId(id) {
    const cuentas = Storage.cargar('cuentas') || [];
    return cuentas.find(c => c.id === id);
  },
  
  /**
   * Actualiza el saldo de una cuenta sumando/restando un monto
   */
  ajustarSaldoCuenta(cuentaId, deltaMonto) {
    const cuentas = Storage.cargar('cuentas') || [];
    const idx = cuentas.findIndex(c => c.id === cuentaId);
    if (idx === -1) return false;
    cuentas[idx].saldo = (cuentas[idx].saldo || 0) + deltaMonto;
    Storage.guardar('cuentas', cuentas);
    return true;
  },
  
  /* ========== TARJETAS ========== */
  obtenerTarjetas() {
    return Storage.cargar('tarjetas') || [];
  },
  
  obtenerTarjetaPorId(id) {
    const tarjetas = this.obtenerTarjetas();
    return tarjetas.find(t => t.id === id);
  },
  
  /**
   * Ajusta el saldoUsado de una tarjeta (positivo = consume, negativo = paga)
   */
  ajustarSaldoTarjeta(tarjetaId, deltaMonto) {
    const tarjetas = Storage.cargar('tarjetas') || [];
    const idx = tarjetas.findIndex(t => t.id === tarjetaId);
    if (idx === -1) return false;
    tarjetas[idx].saldoUsado = (tarjetas[idx].saldoUsado || 0) + deltaMonto;
    Storage.guardar('tarjetas', tarjetas);
    return true;
  },
  
  obtenerCicloPendiente(tarjetaId) {
    const ciclos = Storage.cargar('ciclosTarjeta') || [];
    return ciclos.find(c => c.tarjetaId === tarjetaId && c.estado === 'pendiente');
  },
  
  /* ========== CATEGORÍAS ========== */
  obtenerCategorias(filtros = {}) {
    let categorias = Storage.cargar('categorias') || [];
    
    if (filtros.tipo) {
      categorias = categorias.filter(c => c.tipo === filtros.tipo);
    }
    
    if (filtros.soloPrincipales) {
      categorias = categorias.filter(c => c.categoriaPadreId === null);
    }
    
    if (filtros.padreId !== undefined) {
      categorias = categorias.filter(c => c.categoriaPadreId === filtros.padreId);
    }
    
    return categorias;
  },
  
  obtenerCategoriaPorId(id) {
    const categorias = Storage.cargar('categorias') || [];
    return categorias.find(c => c.id === id);
  },
  
  /**
   * Devuelve la categoría padre de una subcategoría.
   * Si la categoría es principal, devuelve null.
   */
  obtenerCategoriaPadre(categoriaId) {
    const cat = this.obtenerCategoriaPorId(categoriaId);
    if (!cat || !cat.categoriaPadreId) return null;
    return this.obtenerCategoriaPorId(cat.categoriaPadreId);
  },
  
  /**
   * Devuelve subcategorías de una categoría padre
   */
  obtenerSubcategorias(padreId) {
    const categorias = Storage.cargar('categorias') || [];
    return categorias.filter(c => c.categoriaPadreId === padreId);
  },
  
  /**
   * Crea categoría o subcategoría
   */
  crearCategoria(datos) {
    const categorias = Storage.cargar('categorias') || [];
    const nueva = {
      id: Storage.nuevoId('categorias'),
      nombre: datos.nombre,
      tipo: datos.tipo,
      icono: datos.icono || '📌',
      color: datos.color || 'purple',
      categoriaPadreId: datos.categoriaPadreId || null,
    };
    categorias.push(nueva);
    Storage.guardar('categorias', categorias);
    return nueva;
  },
  
  /**
   * Edita categoría
   */
  actualizarCategoria(id, datos) {
    const categorias = Storage.cargar('categorias') || [];
    const idx = categorias.findIndex(c => c.id === id);
    if (idx === -1) return null;
    categorias[idx] = { ...categorias[idx], ...datos };
    Storage.guardar('categorias', categorias);
    return categorias[idx];
  },
  
  /**
   * Elimina categoría. Si tiene subcategorías, las elimina también.
   * Si tiene transacciones, las reasigna a "Otros".
   */
  eliminarCategoria(id) {
    const categorias = Storage.cargar('categorias') || [];
    const cat = categorias.find(c => c.id === id);
    if (!cat) return false;
    
    // No permitir eliminar "Otros gastos" ni "Otros ingresos"
    if (id === 8 || id === 103) return false;
    
    // Buscar IDs a eliminar (la categoría + sus subcategorías)
    const idsAEliminar = [id];
    categorias.forEach(c => {
      if (c.categoriaPadreId === id) idsAEliminar.push(c.id);
    });
    
    // Reasignar transacciones afectadas a "Otros"
    const otrosId = cat.tipo === 'egreso' ? 8 : 103;
    const transacciones = Storage.cargar('transacciones') || [];
    transacciones.forEach(t => {
      if (idsAEliminar.includes(t.categoriaId)) {
        t.categoriaId = otrosId;
      }
    });
    Storage.guardar('transacciones', transacciones);
    
    // Eliminar las categorías
    const filtradas = categorias.filter(c => !idsAEliminar.includes(c.id));
    Storage.guardar('categorias', filtradas);
    
    return true;
  },
  
  /* ========== TRANSACCIONES ========== */
  obtenerTransacciones(filtros = {}) {
    let trans = Storage.cargar('transacciones') || [];
    
    if (filtros.tipo) {
      trans = trans.filter(t => t.tipo === filtros.tipo);
    }
    
    if (filtros.cuentaId) {
      trans = trans.filter(t => t.cuentaId === filtros.cuentaId);
    }
    
    if (filtros.categoriaId) {
      // Incluye también transacciones de subcategorías
      const subs = this.obtenerSubcategorias(filtros.categoriaId).map(s => s.id);
      const idsValidos = [filtros.categoriaId, ...subs];
      trans = trans.filter(t => idsValidos.includes(t.categoriaId));
    }
    
    if (filtros.mes !== undefined && filtros.anio !== undefined) {
      trans = trans.filter(t => {
        const fecha = new Date(t.fecha);
        return fecha.getMonth() + 1 === filtros.mes &&
               fecha.getFullYear() === filtros.anio;
      });
    }
    
    if (filtros.fechaDesde) {
      trans = trans.filter(t => new Date(t.fecha) >= new Date(filtros.fechaDesde));
    }
    if (filtros.fechaHasta) {
      trans = trans.filter(t => new Date(t.fecha) <= new Date(filtros.fechaHasta));
    }
    
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      trans = trans.filter(t => 
        t.descripcion.toLowerCase().includes(q)
      );
    }
    
    // Ordenar por fecha (más recientes primero)
    trans.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    if (filtros.limite) {
      trans = trans.slice(0, filtros.limite);
    }
    
    return trans;
  },
  
  obtenerTransaccionPorId(id) {
    const trans = Storage.cargar('transacciones') || [];
    return trans.find(t => t.id === id);
  },
  
  /**
   * Crea una nueva transacción y ajusta saldos automáticamente
   */
  crearTransaccion(datos) {
    const cuenta = this.obtenerCuentaPorId(datos.cuentaId);
    if (!cuenta) throw new Error('Cuenta no encontrada');
    
    const transacciones = Storage.cargar('transacciones') || [];
    const nueva = {
      id: Storage.nuevoId('transacciones'),
      cuentaId: datos.cuentaId,
      categoriaId: datos.categoriaId,
      tipo: datos.tipo,
      monto: parseFloat(datos.monto),
      moneda: cuenta.moneda,
      descripcion: datos.descripcion || '',
      fecha: datos.fecha || new Date().toISOString().split('T')[0],
      esCredito: cuenta.tipo === 'credito',
    };
    
    // Si es transferencia, guardar cuenta destino
    if (datos.tipo === 'transferencia') {
      nueva.cuentaDestinoId = datos.cuentaDestinoId;
    }
    
    // Si es tarjeta de crédito, asociar la tarjeta
    if (cuenta.tipo === 'credito') {
      const tarjeta = this.obtenerTarjetas().find(t => t.cuentaId === cuenta.id);
      if (tarjeta) {
        nueva.tarjetaId = tarjeta.id;
        // Si tiene cuotas
        if (datos.cuotasTotal && datos.cuotasTotal > 1) {
          nueva.cuotasTotal = datos.cuotasTotal;
          nueva.cuotaActual = 1;
        }
      }
    }
    
    transacciones.push(nueva);
    Storage.guardar('transacciones', transacciones);
    
    // Ajustar saldos
    this.aplicarMovimientoEnSaldos(nueva, +1);
    
    return nueva;
  },
  
  /**
   * Actualiza una transacción. Revierte saldos antiguos y aplica los nuevos.
   */
  actualizarTransaccion(id, datos) {
    const transacciones = Storage.cargar('transacciones') || [];
    const idx = transacciones.findIndex(t => t.id === id);
    if (idx === -1) return null;
    
    const original = transacciones[idx];
    
    // Revertir saldos del original
    this.aplicarMovimientoEnSaldos(original, -1);
    
    // Crear el actualizado
    const cuenta = this.obtenerCuentaPorId(datos.cuentaId);
    const actualizado = {
      ...original,
      cuentaId: datos.cuentaId,
      categoriaId: datos.categoriaId,
      tipo: datos.tipo,
      monto: parseFloat(datos.monto),
      moneda: cuenta.moneda,
      descripcion: datos.descripcion || '',
      fecha: datos.fecha,
      esCredito: cuenta.tipo === 'credito',
    };
    
    if (cuenta.tipo === 'credito') {
      const tarjeta = this.obtenerTarjetas().find(t => t.cuentaId === cuenta.id);
      if (tarjeta) actualizado.tarjetaId = tarjeta.id;
    } else {
      delete actualizado.tarjetaId;
    }
    
    transacciones[idx] = actualizado;
    Storage.guardar('transacciones', transacciones);
    
    // Aplicar nuevos saldos
    this.aplicarMovimientoEnSaldos(actualizado, +1);
    
    return actualizado;
  },
  
  /**
   * Elimina una transacción y revierte saldos
   */
  eliminarTransaccion(id) {
    const transacciones = Storage.cargar('transacciones') || [];
    const trans = transacciones.find(t => t.id === id);
    if (!trans) return false;
    
    // Revertir efecto en saldos
    this.aplicarMovimientoEnSaldos(trans, -1);
    
    // Eliminar
    const filtradas = transacciones.filter(t => t.id !== id);
    Storage.guardar('transacciones', filtradas);
    
    return true;
  },
  
  /**
   * Aplica el efecto de una transacción sobre los saldos.
   * direccion = +1 (crear) o -1 (revertir)
   */
  aplicarMovimientoEnSaldos(trans, direccion) {
    const cuenta = this.obtenerCuentaPorId(trans.cuentaId);
    if (!cuenta) return;
    
    if (cuenta.tipo === 'credito') {
      // En tarjeta de crédito, los gastos AUMENTAN el saldoUsado
      if (trans.tipo === 'egreso' && trans.tarjetaId) {
        this.ajustarSaldoTarjeta(trans.tarjetaId, trans.monto * direccion);
      }
      // Pagos a la tarjeta (transferencias) reducen el saldoUsado
      // (esto lo manejamos cuando se haga el módulo de tarjetas)
    } else {
      // Cuentas normales: ingreso suma, egreso resta
      const delta = trans.tipo === 'ingreso' ? trans.monto : -trans.monto;
      this.ajustarSaldoCuenta(trans.cuentaId, delta * direccion);
    }
  },
  
  /* ========== PRESUPUESTOS ========== */
  obtenerPresupuestos(mes, anio) {
    const presupuestos = Storage.cargar('presupuestos') || [];
    return presupuestos.filter(p => p.mes === mes && p.anio === anio);
  },
  
  obtenerPresupuestoPorId(id) {
    const presupuestos = Storage.cargar('presupuestos') || [];
    return presupuestos.find(p => p.id === id);
  },
  
  /**
   * Calcula cuánto se ha gastado en una categoría (incluyendo subcategorías) en un mes
   */
  calcularGastadoEnCategoria(categoriaId, mes, anio, monedaDestino = 'PEN') {
    const subs = this.obtenerSubcategorias(categoriaId).map(s => s.id);
    const idsValidos = [categoriaId, ...subs];
    
    const trans = (Storage.cargar('transacciones') || []).filter(t => {
      if (t.tipo !== 'egreso') return false;
      if (!idsValidos.includes(t.categoriaId)) return false;
      const fecha = new Date(t.fecha);
      return fecha.getMonth() + 1 === mes && fecha.getFullYear() === anio;
    });
    
    return Formato.sumarEnMoneda(trans, monedaDestino);
  },
  
  crearPresupuesto(datos) {
    const presupuestos = Storage.cargar('presupuestos') || [];
    
    // Verificar si ya existe uno para esa categoría/mes/año
    const existente = presupuestos.find(p => 
      p.categoriaId === parseInt(datos.categoriaId) && 
      p.mes === parseInt(datos.mes) && 
      p.anio === parseInt(datos.anio)
    );
    
    if (existente) {
      // Actualizar el existente
      return this.actualizarPresupuesto(existente.id, datos);
    }
    
    const nuevo = {
      id: Storage.nuevoId('presupuestos'),
      categoriaId: parseInt(datos.categoriaId),
      monto: parseFloat(datos.monto),
      moneda: datos.moneda || 'PEN',
      mes: parseInt(datos.mes),
      anio: parseInt(datos.anio),
      gastado: 0, // se calcula dinámicamente
    };
    presupuestos.push(nuevo);
    Storage.guardar('presupuestos', presupuestos);
    return nuevo;
  },
  
  actualizarPresupuesto(id, datos) {
    const presupuestos = Storage.cargar('presupuestos') || [];
    const idx = presupuestos.findIndex(p => p.id === id);
    if (idx === -1) return null;
    
    presupuestos[idx] = {
      ...presupuestos[idx],
      ...datos,
      monto: parseFloat(datos.monto || presupuestos[idx].monto),
      categoriaId: parseInt(datos.categoriaId || presupuestos[idx].categoriaId),
    };
    Storage.guardar('presupuestos', presupuestos);
    return presupuestos[idx];
  },
  
  eliminarPresupuesto(id) {
    const presupuestos = Storage.cargar('presupuestos') || [];
    const filtrados = presupuestos.filter(p => p.id !== id);
    Storage.guardar('presupuestos', filtrados);
    return true;
  },
  
  /**
   * Aplica una plantilla creando varios presupuestos a la vez para el mes/año dados
   */
  aplicarPlantillaPresupuestos(plantilla, ingresoEstimado, mes, anio, moneda = 'PEN') {
    const distribucion = {
      'cincuenta_treinta_veinte': [
        { categoriaId: 1, porcentaje: 0.20 }, // Alimentación
        { categoriaId: 7, porcentaje: 0.25 }, // Vivienda
        { categoriaId: 4, porcentaje: 0.05 }, // Servicios
        { categoriaId: 2, porcentaje: 0.10 }, // Transporte
        { categoriaId: 3, porcentaje: 0.15 }, // Entretenimiento
        { categoriaId: 5, porcentaje: 0.05 }, // Suscripciones
        { categoriaId: 6, porcentaje: 0.10 }, // Salud
        { categoriaId: 8, porcentaje: 0.10 }, // Otros
      ],
      'basico': [
        { categoriaId: 1, porcentaje: 0.30 },
        { categoriaId: 7, porcentaje: 0.30 },
        { categoriaId: 2, porcentaje: 0.15 },
        { categoriaId: 4, porcentaje: 0.10 },
        { categoriaId: 8, porcentaje: 0.15 },
      ],
    };
    
    const items = distribucion[plantilla] || [];
    let creados = 0;
    
    items.forEach(item => {
      this.crearPresupuesto({
        categoriaId: item.categoriaId,
        monto: ingresoEstimado * item.porcentaje,
        moneda,
        mes,
        anio,
      });
      creados++;
    });
    
    return creados;
  },
  
  /* ========== CÁLCULOS AGREGADOS ========== */
  calcularSaldoTotal(monedaDestino = 'PEN') {
    const cuentas = this.obtenerCuentas().filter(c => c.tipo !== 'credito');
    const items = cuentas.map(c => ({ monto: c.saldo, moneda: c.moneda }));
    return Formato.sumarEnMoneda(items, monedaDestino);
  },
  
  calcularIngresosMes(monedaDestino = 'PEN') {
    const ahora = new Date();
    const trans = this.obtenerTransacciones({
      tipo: 'ingreso',
      mes: ahora.getMonth() + 1,
      anio: ahora.getFullYear(),
    });
    return Formato.sumarEnMoneda(trans, monedaDestino);
  },
  
  calcularEgresosMes(monedaDestino = 'PEN') {
    const ahora = new Date();
    const trans = this.obtenerTransacciones({
      tipo: 'egreso',
      mes: ahora.getMonth() + 1,
      anio: ahora.getFullYear(),
    });
    return Formato.sumarEnMoneda(trans, monedaDestino);
  },
  
  calcularAhorroMes(monedaDestino = 'PEN') {
    return this.calcularIngresosMes(monedaDestino) - this.calcularEgresosMes(monedaDestino);
  },
  
  /* ========== TARJETAS - OPERACIONES ========== */
  
  /**
   * Crea una nueva tarjeta. También crea la "cuenta" asociada.
   */
  crearTarjeta(datos) {
    // 1. Crear la cuenta asociada
    const cuentas = Storage.cargar('cuentas') || [];
    const nuevaCuentaId = Storage.nuevoId('cuentas');
    const nuevaCuenta = {
      id: nuevaCuentaId,
      nombre: datos.nombre,
      tipo: 'credito',
      moneda: datos.moneda,
      saldo: 0,
      activo: true,
    };
    cuentas.push(nuevaCuenta);
    Storage.guardar('cuentas', cuentas);
    
    // 2. Crear la tarjeta
    const tarjetas = Storage.cargar('tarjetas') || [];
    const nueva = {
      id: Storage.nuevoId('tarjetas'),
      cuentaId: nuevaCuentaId,
      nombre: datos.nombre,
      banco: datos.banco || datos.nombre.split(' ')[0].toUpperCase(),
      titular: datos.titular || API.obtenerUsuario().nombre,
      ultimosDigitos: datos.ultimosDigitos || '0000',
      fechaExpiracion: datos.fechaExpiracion || '12/28',
      marca: datos.marca || 'VISA',
      moneda: datos.moneda,
      lineaCredito: parseFloat(datos.lineaCredito),
      saldoUsado: 0,
      diaCorte: parseInt(datos.diaCorte),
      diaPago: parseInt(datos.diaPago),
      tasaTEA: parseFloat(datos.tasaTEA) || 0.85,
      colorTema: datos.colorTema || 'purple',
    };
    tarjetas.push(nueva);
    Storage.guardar('tarjetas', tarjetas);
    
    return nueva;
  },
  
  /**
   * Actualiza una tarjeta existente
   */
  actualizarTarjeta(id, datos) {
    const tarjetas = Storage.cargar('tarjetas') || [];
    const idx = tarjetas.findIndex(t => t.id === id);
    if (idx === -1) return null;
    
    tarjetas[idx] = { 
      ...tarjetas[idx], 
      ...datos,
      lineaCredito: parseFloat(datos.lineaCredito || tarjetas[idx].lineaCredito),
      diaCorte: parseInt(datos.diaCorte || tarjetas[idx].diaCorte),
      diaPago: parseInt(datos.diaPago || tarjetas[idx].diaPago),
    };
    Storage.guardar('tarjetas', tarjetas);
    
    // Actualizar también el nombre en la cuenta asociada
    if (datos.nombre) {
      const cuentas = Storage.cargar('cuentas') || [];
      const cIdx = cuentas.findIndex(c => c.id === tarjetas[idx].cuentaId);
      if (cIdx !== -1) {
        cuentas[cIdx].nombre = datos.nombre;
        Storage.guardar('cuentas', cuentas);
      }
    }
    
    return tarjetas[idx];
  },
  
  /**
   * Elimina una tarjeta y su cuenta asociada.
   * Las transacciones se quedan (por integridad histórica).
   */
  eliminarTarjeta(id) {
    const tarjetas = Storage.cargar('tarjetas') || [];
    const tarjeta = tarjetas.find(t => t.id === id);
    if (!tarjeta) return false;
    
    // Eliminar la cuenta asociada
    const cuentas = Storage.cargar('cuentas') || [];
    const cuentasFiltradas = cuentas.filter(c => c.id !== tarjeta.cuentaId);
    Storage.guardar('cuentas', cuentasFiltradas);
    
    // Eliminar la tarjeta
    const tarjetasFiltradas = tarjetas.filter(t => t.id !== id);
    Storage.guardar('tarjetas', tarjetasFiltradas);
    
    return true;
  },
  
  /**
   * Obtiene todas las transacciones de una tarjeta específica
   */
  obtenerTransaccionesTarjeta(tarjetaId) {
    const trans = Storage.cargar('transacciones') || [];
    return trans
      .filter(t => t.tarjetaId === tarjetaId)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  },
  
  /**
   * Registra un pago a la tarjeta.
   * 1. Crea una transacción tipo 'egreso' en la cuenta de origen.
   * 2. Reduce el saldoUsado de la tarjeta.
   * 3. Si el pago cubre el ciclo facturado, lo marca como pagado.
   */
  registrarPagoTarjeta(tarjetaId, datos) {
    const tarjeta = this.obtenerTarjetaPorId(tarjetaId);
    if (!tarjeta) throw new Error('Tarjeta no encontrada');
    
    const cuentaOrigen = this.obtenerCuentaPorId(datos.cuentaOrigenId);
    if (!cuentaOrigen) throw new Error('Cuenta de origen no encontrada');
    
    const monto = parseFloat(datos.monto);
    if (monto <= 0) throw new Error('Monto inválido');
    
    // Si las monedas no coinciden, convertir
    let montoEnMonedaTarjeta = monto;
    if (cuentaOrigen.moneda !== tarjeta.moneda) {
      montoEnMonedaTarjeta = Formato.convertir(monto, cuentaOrigen.moneda, tarjeta.moneda);
    }
    
    // 1. Crear transacción de egreso en la cuenta de origen
    const transacciones = Storage.cargar('transacciones') || [];
    const nuevaTrans = {
      id: Storage.nuevoId('transacciones'),
      cuentaId: cuentaOrigen.id,
      categoriaId: 8, // "Otros gastos" como fallback (los pagos son una categoría especial)
      tipo: 'egreso',
      monto: monto,
      moneda: cuentaOrigen.moneda,
      descripcion: datos.descripcion || `Pago tarjeta ${tarjeta.nombre}`,
      fecha: datos.fecha || new Date().toISOString().split('T')[0],
      esCredito: false,
      esPagoTarjeta: true,
      tarjetaPagadaId: tarjetaId,
    };
    transacciones.push(nuevaTrans);
    Storage.guardar('transacciones', transacciones);
    
    // 2. Descontar de la cuenta de origen
    this.ajustarSaldoCuenta(cuentaOrigen.id, -monto);
    
    // 3. Reducir saldoUsado de la tarjeta
    this.ajustarSaldoTarjeta(tarjetaId, -montoEnMonedaTarjeta);
    
    // 4. Marcar ciclo como pagado si cubre el monto
    const ciclos = Storage.cargar('ciclosTarjeta') || [];
    const ciclo = ciclos.find(c => c.tarjetaId === tarjetaId && c.estado === 'pendiente');
    if (ciclo && montoEnMonedaTarjeta >= ciclo.montoFacturado) {
      ciclo.estado = 'pagado';
      Storage.guardar('ciclosTarjeta', ciclos);
    }
    
    return nuevaTrans;
  },
  
  /* ========== GASTOS FIJOS ========== */
  obtenerGastosFijos(filtros = {}) {
    let gastos = Storage.cargar('gastosFijos') || [];
    
    if (filtros.activos === true) {
      gastos = gastos.filter(g => g.activo);
    }
    
    if (filtros.esSuscripcion !== undefined) {
      gastos = gastos.filter(g => g.esSuscripcion === filtros.esSuscripcion);
    }
    
    if (filtros.tipo) {
      gastos = gastos.filter(g => g.tipo === filtros.tipo);
    }
    
    return gastos;
  },
  
  obtenerGastoFijoPorId(id) {
    const gastos = Storage.cargar('gastosFijos') || [];
    return gastos.find(g => g.id === id);
  },
  
  crearGastoFijo(datos) {
    const gastos = Storage.cargar('gastosFijos') || [];
    const cat = this.obtenerCategoriaPorId(datos.categoriaId);
    
    const nuevo = {
      id: Storage.nuevoId('gastosFijos'),
      nombre: datos.nombre,
      tipo: datos.tipo || 'fijo',
      esSuscripcion: datos.esSuscripcion || false,
      categoriaId: parseInt(datos.categoriaId),
      cuentaId: parseInt(datos.cuentaId),
      monto: parseFloat(datos.monto),
      moneda: datos.moneda || 'PEN',
      frecuencia: datos.frecuencia || 'mensual',
      diaCobro: parseInt(datos.diaCobro),
      icono: datos.icono || (cat ? cat.icono : '💰'),
      color: datos.color || (cat ? cat.color : 'blue'),
      activo: true,
      historico: [],
    };
    gastos.push(nuevo);
    Storage.guardar('gastosFijos', gastos);
    return nuevo;
  },
  
  actualizarGastoFijo(id, datos) {
    const gastos = Storage.cargar('gastosFijos') || [];
    const idx = gastos.findIndex(g => g.id === id);
    if (idx === -1) return null;
    
    gastos[idx] = {
      ...gastos[idx],
      ...datos,
      monto: parseFloat(datos.monto || gastos[idx].monto),
      diaCobro: parseInt(datos.diaCobro || gastos[idx].diaCobro),
      categoriaId: parseInt(datos.categoriaId || gastos[idx].categoriaId),
      cuentaId: parseInt(datos.cuentaId || gastos[idx].cuentaId),
    };
    Storage.guardar('gastosFijos', gastos);
    return gastos[idx];
  },
  
  eliminarGastoFijo(id) {
    const gastos = Storage.cargar('gastosFijos') || [];
    const filtrados = gastos.filter(g => g.id !== id);
    Storage.guardar('gastosFijos', filtrados);
    return true;
  },
  
  /**
   * Marca un gasto fijo como pagado: crea la transacción y agrega al histórico
   */
  marcarGastoComoPagado(id, datos = {}) {
    const gasto = this.obtenerGastoFijoPorId(id);
    if (!gasto) throw new Error('Gasto no encontrado');
    
    const monto = parseFloat(datos.monto || gasto.monto);
    const fecha = datos.fecha || new Date().toISOString().split('T')[0];
    
    // 1. Crear transacción
    const nuevaTrans = this.crearTransaccion({
      cuentaId: gasto.cuentaId,
      categoriaId: gasto.categoriaId,
      tipo: 'egreso',
      monto: monto,
      descripcion: gasto.nombre,
      fecha: fecha,
    });
    
    // 2. Agregar al histórico
    const gastos = Storage.cargar('gastosFijos') || [];
    const idx = gastos.findIndex(g => g.id === id);
    if (idx !== -1) {
      if (!gastos[idx].historico) gastos[idx].historico = [];
      gastos[idx].historico.push({
        fecha,
        monto,
        pagado: true,
        transaccionId: nuevaTrans.id,
      });
      // Limitar histórico a últimos 12
      if (gastos[idx].historico.length > 12) {
        gastos[idx].historico = gastos[idx].historico.slice(-12);
      }
      Storage.guardar('gastosFijos', gastos);
    }
    
    return nuevaTrans;
  },
  
  /**
   * Calcula el promedio del histórico de un gasto variable
   */
  calcularPromedio(gasto) {
    if (!gasto.historico || gasto.historico.length === 0) return gasto.monto;
    const suma = gasto.historico.reduce((s, h) => s + h.monto, 0);
    return suma / gasto.historico.length;
  },
  
  /**
   * Total mensual de gastos fijos en una moneda dada
   */
  calcularTotalGastosFijos(monedaDestino = 'PEN') {
    const gastos = this.obtenerGastosFijos({ activos: true });
    return Formato.sumarEnMoneda(gastos, monedaDestino);
  },
  
  /**
   * Próximos vencimientos en los próximos N días
   */
  obtenerProximosVencimientos(diasLimite = 30) {
    const gastos = this.obtenerGastosFijos({ activos: true });
    const hoy = new Date();
    const items = [];
    
    gastos.forEach(g => {
      if (g.frecuencia !== 'mensual') return; // simplificación: solo mensuales por ahora
      
      const proximaFecha = Fechas.proximoDiaDelMes(g.diaCobro);
      const diasFaltan = Fechas.diasHasta(proximaFecha);
      
      if (diasFaltan >= 0 && diasFaltan <= diasLimite) {
        items.push({
          ...g,
          proximaFecha,
          diasFaltan,
        });
      }
    });
    
    items.sort((a, b) => a.diasFaltan - b.diasFaltan);
    return items;
  },
  
  /* ========== DEUDAS / PRÉSTAMOS ========== */
  obtenerDeudas(filtros = {}) {
    let deudas = Storage.cargar('deudas') || [];
    
    if (filtros.activos === true) {
      deudas = deudas.filter(d => d.activo);
    }
    
    return deudas;
  },
  
  obtenerDeudaPorId(id) {
    const deudas = Storage.cargar('deudas') || [];
    return deudas.find(d => d.id === id);
  },
  
  crearDeuda(datos) {
    const deudas = Storage.cargar('deudas') || [];
    const nueva = {
      id: Storage.nuevoId('deudas'),
      nombre: datos.nombre,
      acreedor: datos.acreedor || '',
      capital: parseFloat(datos.capital),
      moneda: datos.moneda || 'PEN',
      tasaTEA: parseFloat(datos.tasaTEA),
      plazoMeses: parseInt(datos.plazoMeses),
      cuotasPagadas: parseInt(datos.cuotasPagadas) || 0,
      sistema: datos.sistema || 'frances',
      diaPago: parseInt(datos.diaPago) || 1,
      fechaInicio: datos.fechaInicio || new Date().toISOString().split('T')[0],
      cuentaPagoId: parseInt(datos.cuentaPagoId),
      categoriaId: parseInt(datos.categoriaId) || 8,
      icono: datos.icono || '💵',
      color: datos.color || 'amber',
      activo: true,
    };
    deudas.push(nueva);
    Storage.guardar('deudas', deudas);
    return nueva;
  },
  
  actualizarDeuda(id, datos) {
    const deudas = Storage.cargar('deudas') || [];
    const idx = deudas.findIndex(d => d.id === id);
    if (idx === -1) return null;
    
    deudas[idx] = {
      ...deudas[idx],
      ...datos,
      capital: parseFloat(datos.capital || deudas[idx].capital),
      tasaTEA: parseFloat(datos.tasaTEA || deudas[idx].tasaTEA),
      plazoMeses: parseInt(datos.plazoMeses || deudas[idx].plazoMeses),
      cuotasPagadas: parseInt(datos.cuotasPagadas !== undefined ? datos.cuotasPagadas : deudas[idx].cuotasPagadas),
    };
    Storage.guardar('deudas', deudas);
    return deudas[idx];
  },
  
  eliminarDeuda(id) {
    const deudas = Storage.cargar('deudas') || [];
    const filtradas = deudas.filter(d => d.id !== id);
    Storage.guardar('deudas', filtradas);
    return true;
  },
  
  /**
   * Registra el pago de una cuota: descuenta cuenta + incrementa cuotasPagadas
   */
  pagarCuotaDeuda(deudaId, datos = {}) {
    const deuda = this.obtenerDeudaPorId(deudaId);
    if (!deuda) throw new Error('Deuda no encontrada');
    
    const cronograma = Prestamos.generarCronograma(
      deuda.capital, deuda.tasaTEA, deuda.plazoMeses, deuda.sistema
    );
    
    const cuotaIndex = deuda.cuotasPagadas;
    if (cuotaIndex >= cronograma.length) {
      throw new Error('Esta deuda ya está totalmente pagada');
    }
    
    const cuota = cronograma[cuotaIndex];
    const monto = parseFloat(datos.monto || cuota.cuota);
    const fecha = datos.fecha || new Date().toISOString().split('T')[0];
    
    // Crear transacción
    this.crearTransaccion({
      cuentaId: deuda.cuentaPagoId,
      categoriaId: deuda.categoriaId || 8,
      tipo: 'egreso',
      monto: monto,
      descripcion: `Cuota ${cuotaIndex + 1}/${deuda.plazoMeses} - ${deuda.nombre}`,
      fecha: fecha,
    });
    
    // Incrementar cuotasPagadas
    return this.actualizarDeuda(deudaId, { cuotasPagadas: deuda.cuotasPagadas + 1 });
  },
  
  /**
   * Calcula el saldo pendiente actual de una deuda según cuotas pagadas
   */
  calcularSaldoDeuda(deuda) {
    const cronograma = Prestamos.generarCronograma(
      deuda.capital, deuda.tasaTEA, deuda.plazoMeses, deuda.sistema
    );
    
    if (deuda.cuotasPagadas >= cronograma.length) return 0;
    
    return cronograma[deuda.cuotasPagadas].saldoInicial;
  },
  
  /* ========== METAS DE AHORRO ========== */
  obtenerMetas(filtros = {}) {
    let metas = Storage.cargar('metas') || [];
    
    if (filtros.activas === true) {
      metas = metas.filter(m => m.activa);
    }
    
    if (filtros.completadas === true) {
      metas = metas.filter(m => m.montoActual >= m.montoObjetivo);
    } else if (filtros.completadas === false) {
      metas = metas.filter(m => m.montoActual < m.montoObjetivo);
    }
    
    return metas;
  },
  
  obtenerMetaPorId(id) {
    const metas = Storage.cargar('metas') || [];
    return metas.find(m => m.id === id);
  },
  
  crearMeta(datos) {
    const metas = Storage.cargar('metas') || [];
    const nueva = {
      id: Storage.nuevoId('metas'),
      nombre: datos.nombre,
      descripcion: datos.descripcion || '',
      montoObjetivo: parseFloat(datos.montoObjetivo),
      montoActual: parseFloat(datos.montoActual) || 0,
      moneda: datos.moneda || 'PEN',
      fechaLimite: datos.fechaLimite,
      fechaCreacion: new Date().toISOString().split('T')[0],
      cuentaAhorroId: parseInt(datos.cuentaAhorroId),
      icono: datos.icono || '🎯',
      color: datos.color || 'cyan',
      prioridad: datos.prioridad || 'media',
      activa: true,
      historial: [],
    };
    metas.push(nueva);
    Storage.guardar('metas', metas);
    return nueva;
  },
  
  actualizarMeta(id, datos) {
    const metas = Storage.cargar('metas') || [];
    const idx = metas.findIndex(m => m.id === id);
    if (idx === -1) return null;
    
    metas[idx] = {
      ...metas[idx],
      ...datos,
      montoObjetivo: parseFloat(datos.montoObjetivo || metas[idx].montoObjetivo),
      montoActual: parseFloat(datos.montoActual !== undefined ? datos.montoActual : metas[idx].montoActual),
    };
    Storage.guardar('metas', metas);
    return metas[idx];
  },
  
  eliminarMeta(id) {
    const metas = Storage.cargar('metas') || [];
    const filtradas = metas.filter(m => m.id !== id);
    Storage.guardar('metas', filtradas);
    return true;
  },
  
  /**
   * Aporta a una meta: aumenta el monto actual y registra en el historial.
   * Opcionalmente registra una transacción (transferencia desde otra cuenta).
   */
  aportarAMeta(metaId, monto, opciones = {}) {
    const meta = this.obtenerMetaPorId(metaId);
    if (!meta) throw new Error('Meta no encontrada');
    
    const fecha = opciones.fecha || new Date().toISOString().split('T')[0];
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) throw new Error('Monto inválido');
    
    // Actualizar la meta
    const metas = Storage.cargar('metas') || [];
    const idx = metas.findIndex(m => m.id === metaId);
    if (idx === -1) throw new Error('Meta no encontrada');
    
    metas[idx].montoActual += montoNum;
    if (!metas[idx].historial) metas[idx].historial = [];
    metas[idx].historial.push({
      fecha,
      monto: montoNum,
      tipo: 'aporte',
    });
    Storage.guardar('metas', metas);
    
    return metas[idx];
  },
  
  /**
   * Retira dinero de una meta (cuando se cumple o por necesidad)
   */
  retirarDeMeta(metaId, monto, opciones = {}) {
    const meta = this.obtenerMetaPorId(metaId);
    if (!meta) throw new Error('Meta no encontrada');
    
    const fecha = opciones.fecha || new Date().toISOString().split('T')[0];
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) throw new Error('Monto inválido');
    if (montoNum > meta.montoActual) throw new Error('No tienes suficiente ahorrado');
    
    const metas = Storage.cargar('metas') || [];
    const idx = metas.findIndex(m => m.id === metaId);
    
    metas[idx].montoActual -= montoNum;
    if (!metas[idx].historial) metas[idx].historial = [];
    metas[idx].historial.push({
      fecha,
      monto: montoNum,
      tipo: 'retiro',
    });
    Storage.guardar('metas', metas);
    
    return metas[idx];
  },
  
  /**
   * Calcula el aporte mensual recomendado para llegar a la meta a tiempo
   */
  calcularAporteMensualRecomendado(meta) {
    const hoy = new Date();
    const limite = new Date(meta.fechaLimite);
    const restante = meta.montoObjetivo - meta.montoActual;
    
    if (restante <= 0) return 0;
    if (limite <= hoy) return restante; // ya venció
    
    // Diferencia en meses (aproximado)
    const meses = Math.max(1, 
      (limite.getFullYear() - hoy.getFullYear()) * 12 + 
      (limite.getMonth() - hoy.getMonth())
    );
    
    return restante / meses;
  },
  
  /**
   * Calcula el estado de una meta: en_curso, atrasada, completada, vencida
   */
  obtenerEstadoMeta(meta) {
    if (meta.montoActual >= meta.montoObjetivo) return 'completada';
    
    const hoy = new Date();
    const limite = new Date(meta.fechaLimite);
    
    if (limite < hoy) return 'vencida';
    
    // Calcular si vamos atrasados según el ritmo
    const inicio = new Date(meta.fechaCreacion);
    const totalDias = Math.max(1, (limite - inicio) / (1000 * 60 * 60 * 24));
    const diasTranscurridos = (hoy - inicio) / (1000 * 60 * 60 * 24);
    const proporcionTiempo = diasTranscurridos / totalDias;
    const proporcionAhorro = meta.montoActual / meta.montoObjetivo;
    
    if (proporcionAhorro < proporcionTiempo - 0.1) return 'atrasada';
    return 'en_curso';
  },
  
  /* ========== UTILIDADES ========== */
  resetear() {
    Storage.limpiarTodo();
    Storage.inicializar();
  },
};
