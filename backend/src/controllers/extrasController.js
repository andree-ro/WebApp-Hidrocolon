// src/controllers/extrasController.js
// Controlador para gestión de extras del Sistema Hidrocolon

const Extra = require('../models/Extra');

class ExtrasController {
  
  // GET /api/extras - Obtener todos los extras con filtros
  static async getExtras(req, res) {
    try {
      const {
        search = '',
        stock_bajo,
        page = 1,
        limit = 50
      } = req.query;

      console.log('🧰 GET extras endpoint hit');
      console.log('🧰 Query params:', req.query);

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const options = {
        search: search.trim(),
        stock_bajo: stock_bajo === 'true',
        limit: parseInt(limit),
        offset
      };

      console.log('🔍 Opciones procesadas:', options);

      const extras = await Extra.findAll(options);

      // Obtener total para paginación
      const totalOptions = { ...options, limit: null, offset: null };
      const totalExtras = await Extra.findAll(totalOptions);
      const total = totalExtras.length;

      const response = {
        success: true,
        data: {
          extras,
          pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total: total,
            total_pages: Math.ceil(total / parseInt(limit))
          }
        },
        timestamp: new Date().toISOString()
      };

      console.log(`✅ ${extras.length} extras encontrados de ${total} totales`);
      res.json(response);

    } catch (error) {
      console.error('❌ Error obteniendo extras:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo extras',
        error: error.message
      });
    }
  }

  // GET /api/extras/:id - Obtener extra específico
  static async getExtra(req, res) {
    try {
      const { id } = req.params;
      const extraId = parseInt(id);

      console.log('👁️ GET extra específico endpoint hit');
      console.log('👁️ ID:', extraId);

      if (isNaN(extraId) || extraId < 1) {
        return res.status(400).json({
          success: false,
          message: 'ID de extra inválido'
        });
      }

      const extra = await Extra.findById(extraId);

      if (!extra) {
        return res.status(404).json({
          success: false,
          message: 'Extra no encontrado'
        });
      }

      res.json({
        success: true,
        data: extra,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error obteniendo extra:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo extra',
        error: error.message
      });
    }
  }

  // POST /api/extras - Crear nuevo extra
  static async crearExtra(req, res) {
    try {
      const {
        nombre,
        descripcion,
        existencias,
        stock_minimo,
        precio_unitario
      } = req.body;

      console.log('➕ POST crear extra endpoint hit');
      console.log('➕ Datos recibidos:', req.body);

      // Validación básica
      if (!nombre || nombre.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del extra es obligatorio'
        });
      }

      if (existencias !== undefined && (isNaN(existencias) || existencias < 0)) {
        return res.status(400).json({
          success: false,
          message: 'Las existencias deben ser un número válido mayor o igual a 0'
        });
      }

      if (precio_unitario !== undefined && (isNaN(precio_unitario) || precio_unitario < 0)) {
        return res.status(400).json({
          success: false,
          message: 'El precio unitario debe ser un número válido mayor o igual a 0'
        });
      }

      const datosExtra = {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        existencias: parseInt(existencias) || 0,
        stock_minimo: parseInt(stock_minimo) || 20,
        precio_unitario: parseFloat(precio_unitario) || 0,
        activo: true
      };

      const extraId = await Extra.create(datosExtra);

      const extraCreado = await Extra.findById(extraId);

      res.status(201).json({
        success: true,
        message: 'Extra creado exitosamente',
        data: extraCreado,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error creando extra:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando extra',
        error: error.message
      });
    }
  }

  // PUT /api/extras/:id - Actualizar extra
  static async actualizarExtra(req, res) {
    try {
      const { id } = req.params;
      const extraId = parseInt(id);

      console.log('✏️ PUT actualizar extra endpoint hit');
      console.log('✏️ ID:', extraId);
      console.log('✏️ Datos:', req.body);

      if (isNaN(extraId) || extraId < 1) {
        return res.status(400).json({
          success: false,
          message: 'ID de extra inválido'
        });
      }

      const {
        nombre,
        descripcion,
        existencias,
        stock_minimo,
        precio_unitario,
        activo
      } = req.body;

      // Validación básica
      if (!nombre || nombre.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del extra es obligatorio'
        });
      }

      const datosActualizacion = {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        existencias: parseInt(existencias),
        stock_minimo: parseInt(stock_minimo) || 20,
        precio_unitario: parseFloat(precio_unitario),
        activo: activo !== undefined ? activo : true
      };

      await Extra.update(extraId, datosActualizacion);

      const extraActualizado = await Extra.findById(extraId);

      res.json({
        success: true,
        message: 'Extra actualizado exitosamente',
        data: extraActualizado,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error actualizando extra:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando extra',
        error: error.message
      });
    }
  }

  // PUT /api/extras/:id/stock - Actualizar solo el stock
  static async actualizarStock(req, res) {
    try {
      const { id } = req.params;
      const { existencias, motivo } = req.body;
      const extraId = parseInt(id);

      console.log('📦 PUT actualizar stock extra endpoint hit');
      console.log('📦 ID:', extraId, 'Nuevas existencias:', existencias);

      if (isNaN(extraId) || extraId < 1) {
        return res.status(400).json({
          success: false,
          message: 'ID de extra inválido'
        });
      }

      if (existencias === undefined || isNaN(existencias) || existencias < 0) {
        return res.status(400).json({
          success: false,
          message: 'Las existencias deben ser un número válido mayor o igual a 0'
        });
      }

      await Extra.updateStock(extraId, parseInt(existencias), motivo || 'Ajuste manual');

      const extraActualizado = await Extra.findById(extraId);

      res.json({
        success: true,
        message: 'Stock de extra actualizado exitosamente',
        data: extraActualizado,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error actualizando stock de extra:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando stock de extra',
        error: error.message
      });
    }
  }

  // DELETE /api/extras/:id - Eliminar extra
  static async eliminarExtra(req, res) {
    try {
      const { id } = req.params;
      const extraId = parseInt(id);

      console.log('🗑️ DELETE extra endpoint hit');
      console.log('🗑️ ID:', extraId);

      if (isNaN(extraId) || extraId < 1) {
        return res.status(400).json({
          success: false,
          message: 'ID de extra inválido'
        });
      }

      await Extra.delete(extraId);

      res.json({
        success: true,
        message: 'Extra eliminado exitosamente',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error eliminando extra:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando extra',
        error: error.message
      });
    }
  }

  // GET /api/extras/stats - Obtener estadísticas
  static async getStats(req, res) {
    try {
      console.log('📊 GET stats extras endpoint hit');

      const stats = await Extra.getStats();

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de extras:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas de extras',
        error: error.message
      });
    }
  }

  // =====================================
  // ENDPOINTS PARA RELACIÓN CON MEDICAMENTOS
  // =====================================

  // GET /api/medicamentos/:id/extras - Obtener extras de un medicamento
  static async getExtrasDeMedicamento(req, res) {
    try {
      const { id } = req.params;
      const medicamentoId = parseInt(id);

      console.log('🔗 GET extras de medicamento endpoint hit');
      console.log('🔗 Medicamento ID:', medicamentoId);

      if (isNaN(medicamentoId) || medicamentoId < 1) {
        return res.status(400).json({
          success: false,
          message: 'ID de medicamento inválido'
        });
      }

      const extras = await Extra.getExtrasByMedicamento(medicamentoId);

      res.json({
        success: true,
        data: extras,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error obteniendo extras de medicamento:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo extras del medicamento',
        error: error.message
      });
    }
  }

  // POST /api/medicamentos/:id/extras - Vincular extra con medicamento
  static async vincularExtraConMedicamento(req, res) {
    try {
      const { id } = req.params;
      const { extra_id, cantidad_requerida } = req.body;
      const medicamentoId = parseInt(id);

      console.log('🔗 POST vincular extra con medicamento endpoint hit');
      console.log('🔗 Medicamento:', medicamentoId, 'Extra:', extra_id);

      if (isNaN(medicamentoId) || medicamentoId < 1) {
        return res.status(400).json({
          success: false,
          message: 'ID de medicamento inválido'
        });
      }

      if (!extra_id || isNaN(extra_id) || extra_id < 1) {
        return res.status(400).json({
          success: false,
          message: 'ID de extra inválido'
        });
      }

      await Extra.vincularConMedicamento(
        medicamentoId, 
        parseInt(extra_id), 
        parseInt(cantidad_requerida) || 1
      );

      res.json({
        success: true,
        message: 'Extra vinculado con medicamento exitosamente',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error vinculando extra:', error);
      res.status(500).json({
        success: false,
        message: 'Error vinculando extra con medicamento',
        error: error.message
      });
    }
  }

  // DELETE /api/medicamentos/:id/extras/:extraId - Desvincular extra
  static async desvincularExtraDeMedicamento(req, res) {
    try {
      const { id, extraId } = req.params;
      const medicamentoId = parseInt(id);
      const extraIdInt = parseInt(extraId);

      console.log('🔗 DELETE desvincular extra endpoint hit');
      console.log('🔗 Medicamento:', medicamentoId, 'Extra:', extraIdInt);

      if (isNaN(medicamentoId) || medicamentoId < 1 || isNaN(extraIdInt) || extraIdInt < 1) {
        return res.status(400).json({
          success: false,
          message: 'IDs inválidos'
        });
      }

      const resultado = await Extra.desvincularDeMedicamento(medicamentoId, extraIdInt);

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: 'Vinculación no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Extra desvinculado del medicamento exitosamente',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error desvinculando extra:', error);
      res.status(500).json({
        success: false,
        message: 'Error desvinculando extra del medicamento',
        error: error.message
      });
    }
  }
}

module.exports = ExtrasController;