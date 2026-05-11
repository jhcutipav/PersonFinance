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
    
    // Excluir transferencias internas a menos que se pida explícitamente
    if (!filtros.incluirTransferencias) {
      trans = trans.filter(t => !t.esTransferencia);
    }
    
    if (filtros.soloTransferencias) {
      trans = (Storage.cargar('transacciones') || []).filter(t => t.esTransferencia);
    }
    
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
      notas: datos.notas || '',
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
      notas: datos.notas || '',
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
  
  /**
   * Egresos del mes que SÍ salieron de cuentas reales (cash, débito).
   * NO incluye compras con tarjeta de crédito.
   */
  calcularEgresosCashMes(monedaDestino = 'PEN') {
    const ahora = new Date();
    const trans = this.obtenerTransacciones({
      tipo: 'egreso',
      mes: ahora.getMonth() + 1,
      anio: ahora.getFullYear(),
    }).filter(t => !t.tarjetaId); // Sin tarjeta de crédito
    return Formato.sumarEnMoneda(trans, monedaDestino);
  },
  
  /**
   * Egresos del mes con tarjeta de crédito (compras que pagarás en el futuro).
   */
  calcularEgresosTarjetaMes(monedaDestino = 'PEN') {
    const ahora = new Date();
    const trans = this.obtenerTransacciones({
      tipo: 'egreso',
      mes: ahora.getMonth() + 1,
      anio: ahora.getFullYear(),
    }).filter(t => t.tarjetaId); // Solo con tarjeta de crédito
    return Formato.sumarEnMoneda(trans, monedaDestino);
  },
  
  /**
   * Total de dinero movido en transferencias durante el mes actual
   */
  calcularTransferenciasMes(monedaDestino = 'PEN') {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const transferencias = this.obtenerTransferencias();
    const delMes = transferencias.filter(t => t.fecha >= inicioMes && t.fecha <= finMes);
    
    let total = 0;
    delMes.forEach(t => {
      total += Formato.convertir(t.monto, t.monedaOrigen, monedaDestino);
    });
    
    return { total, cantidad: delMes.length };
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
      descripcion: datos.descripcion || '',
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
  
  /**
   * Obtiene el cronograma de una deuda aplicando overrides personalizados
   */
  obtenerCronogramaConOverrides(deuda) {
    const cronograma = Prestamos.generarCronograma(
      deuda.capital, deuda.tasaTEA, deuda.plazoMeses, deuda.sistema, deuda.fechaInicio
    );
    
    const overrides = deuda.cuotasOverrides || {};
    
    return cronograma.map(c => {
      if (overrides[c.numero] !== undefined) {
        return { ...c, cuota: overrides[c.numero], esOverride: true };
      }
      return c;
    });
  },
  
  /**
   * Guarda un override de cuota individual (cambio manual de monto)
   */
  guardarOverrideCuota(deudaId, numeroCuota, nuevoMonto) {
    const deudas = Storage.cargar('deudas') || [];
    const idx = deudas.findIndex(d => d.id === deudaId);
    if (idx === -1) throw new Error('Deuda no encontrada');
    
    if (!deudas[idx].cuotasOverrides) {
      deudas[idx].cuotasOverrides = {};
    }
    
    if (nuevoMonto === null || nuevoMonto === undefined) {
      // Eliminar el override
      delete deudas[idx].cuotasOverrides[numeroCuota];
    } else {
      deudas[idx].cuotasOverrides[numeroCuota] = parseFloat(nuevoMonto);
    }
    
    Storage.guardar('deudas', deudas);
    return deudas[idx];
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
  
  /* ========== TRANSFERENCIAS ENTRE CUENTAS ========== */
  
  /**
   * Crea una transferencia entre dos cuentas propias.
   * Genera 2 transacciones vinculadas con flag esTransferencia=true.
   * Si las monedas son distintas, aplica el tipo de cambio.
   */
  crearTransferencia(datos) {
    const cuentaOrigen = this.obtenerCuentaPorId(parseInt(datos.cuentaOrigenId));
    const cuentaDestino = this.obtenerCuentaPorId(parseInt(datos.cuentaDestinoId));
    
    if (!cuentaOrigen) throw new Error('Cuenta origen no encontrada');
    if (!cuentaDestino) throw new Error('Cuenta destino no encontrada');
    if (cuentaOrigen.id === cuentaDestino.id) throw new Error('Las cuentas deben ser diferentes');
    
    const monto = parseFloat(datos.monto);
    if (!monto || monto <= 0) throw new Error('Monto inválido');
    
    if (cuentaOrigen.saldo < monto) {
      throw new Error('Saldo insuficiente en la cuenta origen');
    }
    
    const fecha = datos.fecha || new Date().toISOString().split('T')[0];
    const descripcion = datos.descripcion || '';
    
    // Si las monedas son distintas, calcular monto destino
    let montoDestino = monto;
    if (cuentaOrigen.moneda !== cuentaDestino.moneda) {
      montoDestino = Formato.convertir(monto, cuentaOrigen.moneda, cuentaDestino.moneda);
    }
    
    // ID único de la transferencia (para vincular las 2 transacciones)
    const transferenciaId = 'tf_' + Date.now();
    
    // Categoría especial "Transferencia" - usaremos id 999 reservado
    // Si no existe la categoría, la creamos
    const categorias = Storage.cargar('categorias') || [];
    let catTransfEgreso = categorias.find(c => c.id === 999);
    let catTransfIngreso = categorias.find(c => c.id === 998);
    
    if (!catTransfEgreso) {
      categorias.push({
        id: 999,
        nombre: 'Transferencia enviada',
        tipo: 'egreso',
        icono: '↗️',
        color: 'cyan',
        categoriaPadreId: null,
      });
    }
    if (!catTransfIngreso) {
      categorias.push({
        id: 998,
        nombre: 'Transferencia recibida',
        tipo: 'ingreso',
        icono: '↙️',
        color: 'cyan',
        categoriaPadreId: null,
      });
    }
    Storage.guardar('categorias', categorias);
    
    const transacciones = Storage.cargar('transacciones') || [];
    
    // Transacción de salida (origen)
    const transOrigen = {
      id: Storage.nuevoId('transacciones'),
      cuentaId: cuentaOrigen.id,
      categoriaId: 999,
      tipo: 'egreso',
      monto: monto,
      moneda: cuentaOrigen.moneda,
      descripcion: `Transferencia a ${cuentaDestino.nombre}${descripcion ? ' · ' + descripcion : ''}`,
      fecha: fecha,
      esTransferencia: true,
      transferenciaId: transferenciaId,
      cuentaDestinoId: cuentaDestino.id,
      esCredito: false,
    };
    transacciones.push(transOrigen);
    
    // Transacción de entrada (destino)
    const transDestino = {
      id: Storage.nuevoId('transacciones'),
      cuentaId: cuentaDestino.id,
      categoriaId: 998,
      tipo: 'ingreso',
      monto: montoDestino,
      moneda: cuentaDestino.moneda,
      descripcion: `Transferencia desde ${cuentaOrigen.nombre}${descripcion ? ' · ' + descripcion : ''}`,
      fecha: fecha,
      esTransferencia: true,
      transferenciaId: transferenciaId,
      cuentaOrigenId: cuentaOrigen.id,
      esCredito: false,
    };
    transacciones.push(transDestino);
    
    Storage.guardar('transacciones', transacciones);
    
    // Actualizar saldos de cuentas
    const cuentas = Storage.cargar('cuentas') || [];
    const idxOrigen = cuentas.findIndex(c => c.id === cuentaOrigen.id);
    const idxDestino = cuentas.findIndex(c => c.id === cuentaDestino.id);
    
    cuentas[idxOrigen].saldo -= monto;
    cuentas[idxDestino].saldo += montoDestino;
    
    Storage.guardar('cuentas', cuentas);
    
    return {
      transferenciaId,
      transOrigen,
      transDestino,
      tasaConversion: monto !== montoDestino ? (montoDestino / monto) : null,
    };
  },
  
  /**
   * Obtiene todas las transferencias agrupadas (combina origen+destino en un solo objeto)
   */
  obtenerTransferencias(filtros = {}) {
    const trans = (Storage.cargar('transacciones') || []).filter(t => t.esTransferencia);
    
    // Agrupar por transferenciaId
    const grupos = {};
    trans.forEach(t => {
      if (!t.transferenciaId) return;
      if (!grupos[t.transferenciaId]) grupos[t.transferenciaId] = {};
      if (t.tipo === 'egreso') grupos[t.transferenciaId].origen = t;
      else grupos[t.transferenciaId].destino = t;
    });
    
    // Convertir a array
    let resultado = Object.entries(grupos)
      .filter(([_, g]) => g.origen && g.destino)
      .map(([id, g]) => ({
        transferenciaId: id,
        fecha: g.origen.fecha,
        cuentaOrigenId: g.origen.cuentaId,
        cuentaDestinoId: g.destino.cuentaId,
        monto: g.origen.monto,
        montoDestino: g.destino.monto,
        monedaOrigen: g.origen.moneda,
        monedaDestino: g.destino.moneda,
        descripcion: g.origen.descripcion.split(' · ')[1] || '',
        transOrigenId: g.origen.id,
        transDestinoId: g.destino.id,
      }));
    
    // Filtros
    if (filtros.cuentaId) {
      resultado = resultado.filter(t => 
        t.cuentaOrigenId === filtros.cuentaId || t.cuentaDestinoId === filtros.cuentaId
      );
    }
    
    // Ordenar por fecha desc
    resultado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    if (filtros.limite) {
      resultado = resultado.slice(0, filtros.limite);
    }
    
    return resultado;
  },
  
  /**
   * Elimina una transferencia (las 2 transacciones) y revierte los saldos
   */
  eliminarTransferencia(transferenciaId) {
    const trans = Storage.cargar('transacciones') || [];
    const relacionadas = trans.filter(t => t.transferenciaId === transferenciaId);
    
    if (relacionadas.length === 0) return false;
    
    // Revertir saldos
    const cuentas = Storage.cargar('cuentas') || [];
    relacionadas.forEach(t => {
      const idx = cuentas.findIndex(c => c.id === t.cuentaId);
      if (idx === -1) return;
      // Si era egreso, devolver el monto; si era ingreso, restarlo
      const delta = t.tipo === 'egreso' ? t.monto : -t.monto;
      cuentas[idx].saldo += delta;
    });
    Storage.guardar('cuentas', cuentas);
    
    // Eliminar las transacciones
    const restantes = trans.filter(t => t.transferenciaId !== transferenciaId);
    Storage.guardar('transacciones', restantes);
    
    return true;
  },
  
  /* ========== REPORTES (cálculos para análisis) ========== */
  
  /**
   * Obtiene transacciones en un rango de fechas
   */
  obtenerTransaccionesEnRango(fechaInicio, fechaFin, tipo = null) {
    let trans = Storage.cargar('transacciones') || [];
    
    // Excluir transferencias internas (no afectan ingresos/egresos)
    trans = trans.filter(t => !t.esTransferencia);
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59);
    
    trans = trans.filter(t => {
      const f = new Date(t.fecha);
      return f >= inicio && f <= fin;
    });
    
    if (tipo) trans = trans.filter(t => t.tipo === tipo);
    
    return trans;
  },
  
  /**
   * Calcula KPIs principales para un rango
   */
  calcularKPIs(fechaInicio, fechaFin, monedaDestino = 'PEN') {
    const trans = this.obtenerTransaccionesEnRango(fechaInicio, fechaFin);
    const ingresos = trans.filter(t => t.tipo === 'ingreso');
    const egresos = trans.filter(t => t.tipo === 'egreso');
    
    const totalIngresos = Formato.sumarEnMoneda(ingresos, monedaDestino);
    const totalEgresos = Formato.sumarEnMoneda(egresos, monedaDestino);
    const ahorro = totalIngresos - totalEgresos;
    const tasaAhorro = totalIngresos > 0 ? (ahorro / totalIngresos) : 0;
    
    return {
      totalIngresos,
      totalEgresos,
      ahorro,
      tasaAhorro,
      numTransacciones: trans.length,
      promedioEgresoDiario: this.calcularPromedioPorDia(egresos, fechaInicio, fechaFin, monedaDestino),
    };
  },
  
  calcularPromedioPorDia(transacciones, fechaInicio, fechaFin, monedaDestino) {
    const total = Formato.sumarEnMoneda(transacciones, monedaDestino);
    const dias = Math.max(1, Math.ceil((new Date(fechaFin) - new Date(fechaInicio)) / (1000 * 60 * 60 * 24)));
    return total / dias;
  },
  
  /**
   * Distribución de egresos por categoría padre
   */
  obtenerDistribucionPorCategoria(fechaInicio, fechaFin, monedaDestino = 'PEN') {
    const trans = this.obtenerTransaccionesEnRango(fechaInicio, fechaFin, 'egreso');
    const totales = {};
    
    trans.forEach(t => {
      const cat = this.obtenerCategoriaPorId(t.categoriaId);
      if (!cat) return;
      const padre = cat.categoriaPadreId ? this.obtenerCategoriaPorId(cat.categoriaPadreId) : cat;
      if (!padre) return;
      
      if (!totales[padre.id]) {
        totales[padre.id] = { 
          id: padre.id, 
          nombre: padre.nombre, 
          icono: padre.icono, 
          color: padre.color,
          total: 0,
          numTrans: 0,
        };
      }
      totales[padre.id].total += Formato.convertir(t.monto, t.moneda, monedaDestino);
      totales[padre.id].numTrans++;
    });
    
    return Object.values(totales).sort((a, b) => b.total - a.total);
  },
  
  /**
   * Top transacciones (gastos más grandes)
   */
  obtenerTopGastos(fechaInicio, fechaFin, limite = 10, monedaDestino = 'PEN') {
    const trans = this.obtenerTransaccionesEnRango(fechaInicio, fechaFin, 'egreso');
    
    return trans
      .map(t => ({
        ...t,
        montoEnMonedaDestino: Formato.convertir(t.monto, t.moneda, monedaDestino),
      }))
      .sort((a, b) => b.montoEnMonedaDestino - a.montoEnMonedaDestino)
      .slice(0, limite);
  },
  
  /**
   * Análisis de hábitos: día de la semana con más gastos, categoría dominante, etc.
   */
  analizarHabitos(fechaInicio, fechaFin, monedaDestino = 'PEN') {
    const trans = this.obtenerTransaccionesEnRango(fechaInicio, fechaFin, 'egreso');
    
    if (trans.length === 0) {
      return {
        diaMasActivo: null,
        categoriaMasUsada: null,
        montoMaximo: 0,
        diasConGastos: 0,
      };
    }
    
    // Día de la semana con más gastos
    const porDia = [0, 0, 0, 0, 0, 0, 0]; // Dom, Lun, Mar, ..., Sáb
    const diasUnicos = new Set();
    
    trans.forEach(t => {
      const f = new Date(t.fecha);
      porDia[f.getDay()] += Formato.convertir(t.monto, t.moneda, monedaDestino);
      diasUnicos.add(t.fecha);
    });
    
    const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const indiceMaxDia = porDia.indexOf(Math.max(...porDia));
    
    // Categoría más usada
    const distribucion = this.obtenerDistribucionPorCategoria(fechaInicio, fechaFin, monedaDestino);
    const catMasUsada = distribucion[0] || null;
    
    // Monto máximo de una transacción
    const montoMax = Math.max(...trans.map(t => Formato.convertir(t.monto, t.moneda, monedaDestino)));
    
    return {
      diaMasActivo: { 
        nombre: diasNombres[indiceMaxDia], 
        monto: porDia[indiceMaxDia] 
      },
      categoriaMasUsada: catMasUsada,
      montoMaximo: montoMax,
      diasConGastos: diasUnicos.size,
    };
  },
  
  /**
   * Calcula el patrimonio neto: activos (cuentas + metas + saldos a favor) - pasivos (deudas + tarjetas)
   */
  calcularPatrimonio(monedaDestino = 'PEN') {
    let activos = 0;
    let pasivos = 0;
    
    // Activos: cuentas (no de crédito) + metas
    const cuentas = this.obtenerCuentas().filter(c => c.tipo !== 'credito');
    cuentas.forEach(c => {
      activos += Formato.convertir(c.saldo, c.moneda, monedaDestino);
    });
    
    const metas = this.obtenerMetas({ activas: true });
    metas.forEach(m => {
      activos += Formato.convertir(m.montoActual, m.moneda, monedaDestino);
    });
    
    // Pasivos: saldos pendientes de deudas + saldos usados de tarjetas
    const deudas = this.obtenerDeudas({ activos: true });
    deudas.forEach(d => {
      const saldo = this.calcularSaldoDeuda(d);
      pasivos += Formato.convertir(saldo, d.moneda, monedaDestino);
    });
    
    const tarjetas = this.obtenerTarjetas();
    tarjetas.forEach(t => {
      pasivos += Formato.convertir(t.usado || 0, t.moneda, monedaDestino);
    });
    
    return {
      activos,
      pasivos,
      neto: activos - pasivos,
    };
  },
  
  /**
   * Calcula score de salud financiera (0-100)
   * Factores:
   * - Tasa de ahorro (peso 30%)
   * - Ratio deudas/ingresos (peso 25%)
   * - Tener fondo de emergencia (peso 20%)
   * - Consistencia de presupuestos (peso 15%)
   * - Diversidad de cuentas (peso 10%)
   */
  calcularSaludFinanciera(monedaDestino = 'PEN') {
    let score = 0;
    const recomendaciones = [];
    
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    const kpis = this.calcularKPIs(inicioMes, finMes, monedaDestino);
    
    // 1. Tasa de ahorro (30 pts)
    if (kpis.totalIngresos > 0) {
      const tasa = kpis.tasaAhorro;
      if (tasa >= 0.20) {
        score += 30;
      } else if (tasa >= 0.10) {
        score += 20;
        recomendaciones.push('Intenta aumentar tu tasa de ahorro al 20% o más');
      } else if (tasa >= 0) {
        score += 10;
        recomendaciones.push('Estás ahorrando poco. Revisa tus gastos para aumentar el ahorro');
      } else {
        recomendaciones.push('⚠ Estás gastando más de lo que ingresas este mes');
      }
    } else {
      recomendaciones.push('Registra tus ingresos para tener un mejor análisis');
    }
    
    // 2. Ratio deudas/ingresos (25 pts)
    const patrimonio = this.calcularPatrimonio(monedaDestino);
    if (kpis.totalIngresos > 0) {
      const ratioDeudas = patrimonio.pasivos / (kpis.totalIngresos * 12);
      if (ratioDeudas <= 0.3) {
        score += 25;
      } else if (ratioDeudas <= 0.5) {
        score += 15;
        recomendaciones.push('Tus deudas son moderadas. Prioriza pagarlas');
      } else if (ratioDeudas <= 1) {
        score += 8;
        recomendaciones.push('⚠ Tus deudas son altas comparadas con tus ingresos anuales');
      } else {
        recomendaciones.push('🚨 Sobreendeudamiento. Considera reestructurar tus deudas');
      }
    } else if (patrimonio.pasivos === 0) {
      score += 25; // Sin deudas es bueno
    }
    
    // 3. Fondo de emergencia (20 pts)
    const metas = this.obtenerMetas({ activas: true });
    const tieneEmergencia = metas.some(m => 
      m.nombre.toLowerCase().includes('emergencia') && m.montoActual >= m.montoObjetivo * 0.5
    );
    if (tieneEmergencia) {
      score += 20;
    } else {
      const tieneInicio = metas.some(m => m.nombre.toLowerCase().includes('emergencia'));
      if (tieneInicio) {
        score += 10;
        recomendaciones.push('Sigue construyendo tu fondo de emergencia');
      } else {
        recomendaciones.push('Crea un fondo de emergencia (3-6 meses de gastos)');
      }
    }
    
    // 4. Consistencia de presupuestos (15 pts)
    const presupuestos = this.obtenerPresupuestos(hoy.getMonth() + 1, hoy.getFullYear());
    if (presupuestos.length > 0) {
      const respetados = presupuestos.filter(p => {
        const gastado = this.calcularGastadoEnCategoria(p.categoriaId, hoy.getMonth() + 1, hoy.getFullYear(), p.moneda);
        return gastado <= p.monto;
      });
      const ratio = respetados.length / presupuestos.length;
      score += Math.round(15 * ratio);
      
      if (ratio < 0.7) {
        recomendaciones.push('Estás excediendo varios presupuestos. Revisa tus categorías');
      }
    } else {
      recomendaciones.push('Crea presupuestos mensuales para controlar mejor tus gastos');
    }
    
    // 5. Diversidad de cuentas (10 pts)
    const cuentas = this.obtenerCuentas().filter(c => c.tipo !== 'credito');
    if (cuentas.length >= 3) {
      score += 10;
    } else if (cuentas.length >= 2) {
      score += 6;
    } else if (cuentas.length === 1) {
      score += 3;
      recomendaciones.push('Considera tener al menos una cuenta de ahorros');
    }
    
    score = Math.min(100, Math.round(score));
    
    let nivel, descripcion;
    if (score >= 80) {
      nivel = 'excelente';
      descripcion = '¡Excelente! Tus finanzas están muy bien manejadas.';
    } else if (score >= 60) {
      nivel = 'bueno';
      descripcion = 'Vas bien. Pequeños ajustes pueden llevarte al siguiente nivel.';
    } else if (score >= 40) {
      nivel = 'regular';
      descripcion = 'Hay oportunidades de mejora en tu salud financiera.';
    } else {
      nivel = 'malo';
      descripcion = 'Es momento de tomar acción. Empieza con los pasos más sencillos.';
    }
    
    return {
      score,
      nivel,
      descripcion,
      recomendaciones: recomendaciones.slice(0, 4), // Top 4
    };
  },
  
  /**
   * Genera datos para heatmap de gastos diarios (último año)
   */
  generarHeatmapDatos(monedaDestino = 'PEN') {
    const hoy = new Date();
    const haceUnAno = new Date(hoy);
    haceUnAno.setDate(haceUnAno.getDate() - 364);
    
    const trans = this.obtenerTransaccionesEnRango(haceUnAno, hoy, 'egreso');
    
    // Agrupar por día
    const porDia = {};
    trans.forEach(t => {
      const key = t.fecha;
      if (!porDia[key]) porDia[key] = 0;
      porDia[key] += Formato.convertir(t.monto, t.moneda, monedaDestino);
    });
    
    // Calcular escala (percentil 95 para no sesgar con outliers)
    const valores = Object.values(porDia).sort((a, b) => a - b);
    const max = valores.length > 0 ? valores[Math.floor(valores.length * 0.95)] : 100;
    
    return { porDia, max, fechaInicio: haceUnAno };
  },
  
  /* ========== UTILIDADES ========== */
  resetear() {
    Storage.limpiarTodo();
    Storage.inicializar();
  },
};
