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
  
  /* ========== UTILIDADES ========== */
  resetear() {
    Storage.limpiarTodo();
    Storage.inicializar();
  },
};
