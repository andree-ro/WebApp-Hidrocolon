// frontend/src/store/carritoStore.js
// Store de Pinia para gestión del carrito de ventas - Sistema Hidrocolon

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCarritoStore = defineStore('carrito', () => {
  // ============================================================================
  // 📦 ESTADO DEL CARRITO
  // ============================================================================
  
  const items = ref([])
  const pacienteSeleccionado = ref(null)
  const descuentoGlobal = ref(0)
  const observaciones = ref('')
  const metodoPago = ref('efectivo') // 'efectivo', 'tarjeta', 'transferencia', 'mixto'
  
  // Para pago mixto
  const montoEfectivo = ref(0)
  const montoTarjeta = ref(0)
  const montoTransferencia = ref(0)
  
  // ============================================================================
  // 🧮 COMPUTED - CÁLCULOS AUTOMÁTICOS
  // ============================================================================
  
  // Subtotal (suma de todos los items)
  const subtotal = computed(() => {
    return items.value.reduce((sum, item) => {
      return sum + (item.precio_unitario * item.cantidad)
    }, 0)
  })
  
  // Total después de descuento
  const total = computed(() => {
    const subtotalValue = subtotal.value
    const descuento = (subtotalValue * descuentoGlobal.value) / 100
    return subtotalValue - descuento
  })
  
  // Cantidad total de items
  const cantidadTotal = computed(() => {
    return items.value.reduce((sum, item) => sum + item.cantidad, 0)
  })
  
  // Verificar si el carrito está vacío
  const carritoVacio = computed(() => {
    return items.value.length === 0
  })
  
  // ============================================================================
  // 🛒 ACCIONES DEL CARRITO
  // ============================================================================
  
  /**
   * Agregar producto al carrito
   */
  function agregarProducto(producto) {
    console.log('🛒 Agregando producto al carrito:', producto)
    
    // Validar datos mínimos
    if (!producto.tipo_producto || !producto.producto_id) {
      console.error('❌ Producto inválido:', producto)
      return { success: false, message: 'Producto inválido' }
    }
    
    // Verificar si ya existe en el carrito
    const itemExistente = items.value.find(
      item => item.tipo_producto === producto.tipo_producto && 
              item.producto_id === producto.producto_id &&
              item.precio_tipo === producto.precio_tipo
    )
    
    if (itemExistente) {
      // Incrementar cantidad si ya existe
      itemExistente.cantidad += producto.cantidad || 1
      itemExistente.subtotal = itemExistente.precio_unitario * itemExistente.cantidad
      console.log('➕ Cantidad incrementada:', itemExistente)
      return { success: true, message: 'Cantidad actualizada' }
    }
    
    // Agregar nuevo item
    const nuevoItem = {
      id: Date.now(), // ID temporal para el frontend
      tipo_producto: producto.tipo_producto, // 'medicamento', 'servicio', 'extra'
      producto_id: producto.producto_id,
      producto_nombre: producto.producto_nombre || producto.nombre,
      cantidad: producto.cantidad || 1,
      precio_unitario: producto.precio_unitario,
      precio_tipo: producto.precio_tipo || 'efectivo', // 'efectivo' o 'tarjeta'
      subtotal: producto.precio_unitario * (producto.cantidad || 1),
      comision_porcentaje: producto.comision_porcentaje || 0,
      // Datos adicionales según tipo
      presentacion: producto.presentacion || null,
      laboratorio: producto.laboratorio || null,
      extras: producto.extras || [],
      existencias: producto.existencias || null
    }
    
    items.value.push(nuevoItem)
    console.log('✅ Producto agregado al carrito:', nuevoItem)
    return { success: true, message: 'Producto agregado' }
  }
  
  /**
   * Actualizar cantidad de un item
   */
  function actualizarCantidad(itemId, nuevaCantidad) {
    const item = items.value.find(i => i.id === itemId)
    if (!item) return
    
    if (nuevaCantidad <= 0) {
      eliminarItem(itemId)
      return
    }
    
    // Validar stock para medicamentos
    if (item.tipo_producto === 'medicamento' && item.existencias !== null) {
      if (nuevaCantidad > item.existencias) {
        console.warn('⚠️ Cantidad solicitada excede el stock disponible')
        return { success: false, message: 'Stock insuficiente' }
      }
    }
    
    item.cantidad = nuevaCantidad
    item.subtotal = item.precio_unitario * item.cantidad
    console.log('🔄 Cantidad actualizada:', item)
    return { success: true }
  }
  
  /**
   * Cambiar tipo de precio de un item (efectivo/tarjeta)
   */
  function cambiarTipoPrecio(itemId, nuevoPrecio, nuevoTipo) {
    const item = items.value.find(i => i.id === itemId)
    if (!item) return
    
    item.precio_tipo = nuevoTipo
    item.precio_unitario = nuevoPrecio
    item.subtotal = item.precio_unitario * item.cantidad
    console.log('💱 Tipo de precio cambiado:', item)
  }
  
  /**
   * Eliminar item del carrito
   */
  function eliminarItem(itemId) {
    const index = items.value.findIndex(i => i.id === itemId)
    if (index !== -1) {
      const item = items.value[index]
      items.value.splice(index, 1)
      console.log('🗑️ Item eliminado:', item.producto_nombre)
    }
  }
  
  /**
   * Vaciar todo el carrito
   */
  function vaciarCarrito() {
    items.value = []
    pacienteSeleccionado.value = null
    descuentoGlobal.value = 0
    observaciones.value = ''
    metodoPago.value = 'efectivo'
    montoEfectivo.value = 0
    montoTarjeta.value = 0
    montoTransferencia.value = 0
    console.log('🧹 Carrito vaciado')
  }
  
  /**
   * Establecer paciente seleccionado
   */
  function setPaciente(paciente) {
    pacienteSeleccionado.value = paciente
    console.log('👤 Paciente seleccionado:', paciente)
  }
  
  /**
   * Establecer descuento global
   */
  function setDescuento(porcentaje) {
    if (porcentaje < 0 || porcentaje > 100) {
      console.warn('⚠️ Descuento debe estar entre 0 y 100')
      return
    }
    descuentoGlobal.value = porcentaje
    console.log('💸 Descuento aplicado:', porcentaje + '%')
  }
  
  /**
   * Establecer método de pago
   */
  function setMetodoPago(metodo) {
    metodoPago.value = metodo
    console.log('💳 Método de pago:', metodo)
  }
  
  /**
   * Obtener datos de la venta para enviar al backend
   */
  function obtenerDatosVenta(turnoId, usuarioId) {
    if (items.value.length === 0) {
      return { success: false, message: 'El carrito está vacío' }
    }
    
    // Preparar detalle de productos
    const detalle = items.value.map(item => ({
      tipo_producto: item.tipo_producto,
      producto_id: item.producto_id,
      producto_nombre: item.producto_nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      precio_tipo: item.precio_tipo,
      subtotal: item.subtotal,
      comision_porcentaje: item.comision_porcentaje
    }))
    
    // Calcular montos según método de pago
    const totalFinal = total.value
    let efectivoRecibido = 0
    let tarjetaMonto = 0
    let transferenciaMonto = 0
    
    if (metodoPago.value === 'efectivo') {
      efectivoRecibido = montoEfectivo.value || totalFinal
    } else if (metodoPago.value === 'tarjeta') {
      tarjetaMonto = totalFinal
    } else if (metodoPago.value === 'transferencia') {
      transferenciaMonto = totalFinal
    } else if (metodoPago.value === 'mixto') {
      efectivoRecibido = montoEfectivo.value
      tarjetaMonto = montoTarjeta.value
      transferenciaMonto = montoTransferencia.value
    }
    
    // Datos completos de la venta
    const datosVenta = {
      turno_id: turnoId,
      paciente_id: pacienteSeleccionado.value?.id || null,
      usuario_vendedor_id: usuarioId,
      metodo_pago: metodoPago.value,
      subtotal: subtotal.value,
      descuento: (subtotal.value * descuentoGlobal.value) / 100,
      total: totalFinal,
      efectivo_recibido: efectivoRecibido,
      tarjeta_monto: tarjetaMonto,
      transferencia_monto: transferenciaMonto,
      cliente_nombre: pacienteSeleccionado.value?.nombre + ' ' + pacienteSeleccionado.value?.apellido || 'Cliente General',
      cliente_telefono: pacienteSeleccionado.value?.telefono || null,
      cliente_nit: 'CF',
      cliente_direccion: pacienteSeleccionado.value?.direccion || null,
      observaciones: observaciones.value || null,
      detalle: detalle
    }
    
    console.log('📋 Datos de venta preparados:', datosVenta)
    return { success: true, data: datosVenta }
  }
  
  /**
   * Validar carrito antes de procesar venta
   */
  function validarCarrito() {
    const errores = []
    
    if (items.value.length === 0) {
      errores.push('El carrito está vacío')
    }
    
    // Validar montos en pago mixto
    if (metodoPago.value === 'mixto') {
      const sumaPagos = montoEfectivo.value + montoTarjeta.value + montoTransferencia.value
      const diferencia = Math.abs(sumaPagos - total.value)
      
      if (diferencia > 0.01) { // Tolerancia de 1 centavo por redondeo
        errores.push(`La suma de los pagos (Q${sumaPagos.toFixed(2)}) no coincide con el total (Q${total.value.toFixed(2)})`)
      }
    }
    
    // Validar efectivo recibido
    if (metodoPago.value === 'efectivo' && montoEfectivo.value < total.value) {
      errores.push('El efectivo recibido es menor al total')
    }
    
    return {
      valido: errores.length === 0,
      errores: errores
    }
  }
  
  // ============================================================================
  // 📤 EXPORTAR ESTADO Y ACCIONES
  // ============================================================================
  
  return {
    // Estado
    items,
    pacienteSeleccionado,
    descuentoGlobal,
    observaciones,
    metodoPago,
    montoEfectivo,
    montoTarjeta,
    montoTransferencia,
    
    // Computed
    subtotal,
    total,
    cantidadTotal,
    carritoVacio,
    
    // Acciones
    agregarProducto,
    actualizarCantidad,
    cambiarTipoPrecio,
    eliminarItem,
    vaciarCarrito,
    setPaciente,
    setDescuento,
    setMetodoPago,
    obtenerDatosVenta,
    validarCarrito
  }
})