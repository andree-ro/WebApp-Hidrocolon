// src/controllers/farmaciaController.js
const medicamento = require('../models/Medicamento');
const { validarMedicamento, validarBusqueda, validarActualizacionStock, validarCarrito } = require('../utils/validators');

class FarmaciaController {
  // GET /api/farmacia - Obtener todos los medicamentos con filtros
  static async getMedicamentos(req, res) {
    try {
      const {
        search = '',
        presentacion_id,
        laboratorio_id,
        stock_bajo,
        proximo_vencer,
        page = 1,
        limit = 50
      } = req.query;

      // Validar parámetros de búsqueda
      const validation = validarBusqueda({ search, page, limit });
      if (!validation.esValido) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros de búsqueda inválidos',
          errors: validation.errores
        });
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const options = {
        search: search.trim(),
        presentacion_id: presentacion_id ? parseInt(presentacion_id) : null,
        laboratorio_id: laboratorio_id ? parseInt(laboratorio_id) : null,
        stock_bajo: stock_bajo === 'true',
        proximo_vencer: proximo_vencer === 'true',
        limit: parseInt(limit),
        offset
      };

      const medicamentos = await medicamento.findAll(options);

      // Obtener total para paginación (query sin limit)
      const totalOptions = { ...options, limit: 10000, offset: 0 };
      const totalMedicamentos = await medicamento.findAll(totalOptions);
      const total = totalMedicamentos.length;

      res.json({
        success: true,
        data: {
          medicamentos,
          pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total: total,
            total_pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error en getMedicamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/farmacia/:id - Obtener medicamento por ID
  static async getMedicamento(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de medicamento inválido'
        });
      }

      const med = await medicamento.findById(parseInt(id));

      if (!med) {
        return res.status(404).json({
          success: false,
          message: 'Medicamento no encontrado'
        });
      }

      res.json({
        success: true,
        data: med
      });
    } catch (error) {
      console.error('Error en getMedicamento:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/farmacia - Crear nuevo medicamento
  static async crearMedicamento(req, res) {
    try {
      const medicamentoData = req.body;

      // Validar datos del medicamento
      const validation = validarMedicamento(medicamentoData);
      if (!validation.esValido) {
        return res.status(400).json({
          success: false,
          message: 'Datos de medicamento inválidos',
          errors: validation.errores
        });
      }

      // Verificar que no exista medicamento con mismo nombre y presentación
      const medicamentosExistentes = await medicamento.findAll({
        search: medicamentoData.nombre,
        limit: 10
      });

      const existe = medicamentosExistentes.some(med => 
        med.nombre.toLowerCase() === medicamentoData.nombre.toLowerCase() &&
        med.presentacion_id === medicamentoData.presentacion_id
      );

      if (existe) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un medicamento con el mismo nombre y presentación'
        });
      }

      const nuevoMedicamento = await medicamento.create(medicamentoData);

      res.status(201).json({
        success: true,
        message: 'Medicamento creado exitosamente',
        data: nuevoMedicamento
      });
    } catch (error) {
      console.error('Error en crearMedicamento:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // PUT /api/farmacia/:id - Actualizar medicamento
  static async actualizarMedicamento(req, res) {
    try {
      const { id } = req.params;
      const medicamentoData = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de medicamento inválido'
        });
      }

      // Validar datos del medicamento
      const validation = validarMedicamento(medicamentoData, true); // true para update
      if (!validation.esValido) {
        return res.status(400).json({
          success: false,
          message: 'Datos de medicamento inválidos',
          errors: validation.errores
        });
      }

      // Verificar que el medicamento existe
      const medicamentoExistente = await medicamento.findById(parseInt(id));
      if (!medicamentoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Medicamento no encontrado'
        });
      }

      const medicamentoActualizado = await medicamento.update(parseInt(id), medicamentoData);

      res.json({
        success: true,
        message: 'Medicamento actualizado exitosamente',
        data: medicamentoActualizado
      });
    } catch (error) {
      console.error('Error en actualizarMedicamento:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // DELETE /api/farmacia/:id - Eliminar medicamento
  static async eliminarMedicamento(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de medicamento inválido'
        });
      }

      // Verificar que el medicamento existe
      const med = await medicamento.findById(parseInt(id));
      if (!med) {
        return res.status(404).json({
          success: false,
          message: 'Medicamento no encontrado'
        });
      }

      await medicamento.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Medicamento eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error en eliminarMedicamento:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // PUT /api/farmacia/:id/stock - Actualizar stock de medicamento
  static async actualizarStock(req, res) {
    try {
      const { id } = req.params;
      const { cantidad, motivo = 'Ajuste manual' } = req.body;
      const usuarioId = req.user?.id || 1;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de medicamento inválido'
        });
      }

      // Validar datos de actualización de stock
      const validation = validarActualizacionStock({ cantidad, motivo });
      if (!validation.esValido) {
        return res.status(400).json({
          success: false,
          message: 'Datos de actualización de stock inválidos',
          errors: validation.errores
        });
      }

      const medicamentoActualizado = await medicamento.updateStock(
        parseInt(id), 
        parseInt(cantidad), 
        motivo, 
        usuarioId
      );

      res.json({
        success: true,
        message: 'Stock actualizado exitosamente',
        data: medicamentoActualizado
      });
    } catch (error) {
      console.error('Error en actualizarStock:', error);
      
      if (error.message === 'Medicamento no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message === 'Stock insuficiente') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/farmacia/stats - Obtener estadísticas del módulo farmacia
  static async getEstadisticas(req, res) {
    try {
      const stats = await medicamento.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error en getEstadisticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/farmacia/presentaciones - Obtener todas las presentaciones
  static async getPresentaciones(req, res) {
    try {
      const presentaciones = await medicamento.getPresentaciones();

      res.json({
        success: true,
        data: presentaciones
      });
    } catch (error) {
      console.error('Error en getPresentaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/farmacia/laboratorios - Obtener todos los laboratorios
  static async getLaboratorios(req, res) {
    try {
      const laboratorios = await medicamento.getLaboratorios();

      res.json({
        success: true,
        data: laboratorios
      });
    } catch (error) {
      console.error('Error en getLaboratorios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/farmacia/extras - Obtener todos los extras
  static async getExtras(req, res) {
    try {
      const extras = await medicamento.getExtras();

      res.json({
        success: true,
        data: extras
      });
    } catch (error) {
      console.error('Error en getExtras:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/farmacia/export/excel - Exportar medicamentos a Excel
  static async exportarExcel(req, res) {
    try {
      // Para futuras versiones - implementar exportación a Excel
      // Por ahora retornamos todos los medicamentos en formato JSON para exportar
      const medicamentos = await medicamento.findAll({ limit: 10000 });

      const datosExport = medicamentos.map(med => ({
        ID: med.id,
        Nombre: med.nombre,
        Presentación: med.presentacion_nombre,
        Laboratorio: med.laboratorio_nombre,
        Existencias: med.existencias,
        'Fecha Vencimiento': med.fecha_vencimiento,
        'Precio': med.precio,
        'Costo Compra': med.costo_compra,
        'Comisión %': med.comision_porcentaje,
        Indicaciones: med.indicaciones,
        Contraindicaciones: med.contraindicaciones,
        Dosis: med.dosis,
        'Estado Stock': med.estado_stock,
        'Estado Vencimiento': med.estado_vencimiento
      }));

      res.json({
        success: true,
        message: 'Datos preparados para exportación',
        data: datosExport,
        count: datosExport.length
      });
    } catch (error) {
      console.error('Error en exportarExcel:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/farmacia/:id/carrito - Agregar medicamento al carrito
  static async agregarAlCarrito(req, res) {
    try {
      const { id } = req.params;
      const { cantidad, precio_tipo = 'tarjeta' } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de medicamento inválido'
        });
      }

      // Validar datos del carrito
      const validation = validarCarrito({ cantidad, precio_tipo });
      if (!validation.esValido) {
        return res.status(400).json({
          success: false,
          message: 'Datos para agregar al carrito inválidos',
          errors: validation.errores
        });
      }

      // Verificar que el medicamento existe y tiene stock
      const med = await medicamento.findById(parseInt(id));
      if (!med) {
        return res.status(404).json({
          success: false,
          message: 'Medicamento no encontrado'
        });
      }

      if (med.existencias < parseInt(cantidad)) {
        return res.status(400).json({
          success: false,
          message: 'Stock insuficiente',
          data: {
            stock_disponible: med.existencias,
            cantidad_solicitada: parseInt(cantidad)
          }
        });
      }

      // Preparar datos para el carrito
      const precio = med.precio; // Ahora siempre hay un solo precio
      const subtotal = precio * parseInt(cantidad);

      const itemCarrito = {
        medicamento_id: med.id,
        nombre: med.nombre,
        presentacion: med.presentacion_nombre,
        laboratorio: med.laboratorio_nombre,
        cantidad: parseInt(cantidad),
        precio_unitario: precio,
        precio_tipo: precio_tipo,
        subtotal: subtotal,
        comision_porcentaje: med.comision_porcentaje,
        extras: med.extras || []
      };

      res.json({
        success: true,
        message: 'Producto preparado para agregar al carrito',
        data: itemCarrito
      });
    } catch (error) {
      console.error('Error en agregarAlCarrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = FarmaciaController;