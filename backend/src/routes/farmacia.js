// src/routes/farmacia.js
// VERSIÓN CORREGIDA CON IMPORT CORRECTO

const express = require('express');
const router = express.Router();

// IMPORT CORRECTO DEL MIDDLEWARE
const authMiddleware = require('../middleware/authMiddleware');
// Usar el método authenticate() del middleware existente
const simpleAuth = authMiddleware.authenticate();

console.log('💊 Farmacia routes cargadas');

// Obtener modelo
let Medicamento;
try {
  Medicamento = require('../models/Medicamento');
  console.log('✅ Modelo Medicamento cargado exitosamente');
} catch (error) {
  console.error('❌ Error cargando modelo Medicamento:', error);
}

// =====================================
// ENDPOINTS DE DATOS AUXILIARES
// =====================================

// GET /api/farmacia/presentaciones - Obtener presentaciones
router.get('/presentaciones', simpleAuth, async (req, res) => {
  console.log('📋 GET presentaciones endpoint hit');
  
  try {
    if (!Medicamento) {
      throw new Error('Modelo Medicamento no disponible');
    }
    
    const presentaciones = await Medicamento.getPresentaciones();
    
    res.json({
      success: true,
      data: presentaciones,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo presentaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo presentaciones',
      error: error.message
    });
  }
});

// GET /api/farmacia/laboratorios - Obtener laboratorios
router.get('/laboratorios', simpleAuth, async (req, res) => {
  console.log('🏭 GET laboratorios endpoint hit');
  
  try {
    if (!Medicamento) {
      throw new Error('Modelo Medicamento no disponible');
    }
    
    const laboratorios = await Medicamento.getLaboratorios();
    
    res.json({
      success: true,
      data: laboratorios,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo laboratorios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo laboratorios',
      error: error.message
    });
  }
});

// GET /api/farmacia/stats - Obtener estadísticas
router.get('/stats', simpleAuth, async (req, res) => {
  console.log('📊 GET stats endpoint hit');
  
  try {
    if (!Medicamento) {
      throw new Error('Modelo Medicamento no disponible');
    }
    
    const stats = await Medicamento.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message
    });
  }
});

// =====================================
// ENDPOINTS PRINCIPALES DE MEDICAMENTOS
// =====================================

// GET /api/farmacia - Obtener medicamentos con filtros
router.get('/', simpleAuth, async (req, res) => {
  console.log('🔍 GET medicamentos endpoint hit');
  console.log('🔍 Query params:', req.query);
  
  try {
    if (!Medicamento) {
      throw new Error('Modelo Medicamento no disponible');
    }

    const {
      search = '',
      presentacion_id,
      laboratorio_id,
      stock_bajo,
      proximo_vencer,
      page = 1,
      limit = 20
    } = req.query;

    // Validaciones básicas
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100); // Máximo 100
    const offset = (pageNum - 1) * limitNum;

    const options = {
      search: search.trim(),
      presentacion_id: presentacion_id ? parseInt(presentacion_id) : null,
      laboratorio_id: laboratorio_id ? parseInt(laboratorio_id) : null,
      stock_bajo: stock_bajo === 'true',
      proximo_vencer: proximo_vencer === 'true',
      limit: limitNum,
      offset: offset
    };

    console.log('🔍 Opciones procesadas:', options);

    const medicamentos = await Medicamento.findAll(options);

    // Obtener total para paginación (query sin limit)
    const totalOptions = { ...options, limit: null, offset: null };
    const totalMedicamentos = await Medicamento.findAll(totalOptions);
    const total = totalMedicamentos.length;

    const response = {
      success: true,
      data: {
        medicamentos,
        pagination: {
          current_page: pageNum,
          per_page: limitNum,
          total: total,
          total_pages: Math.ceil(total / limitNum)
        }
      },
      timestamp: new Date().toISOString()
    };

    console.log(`✅ ${medicamentos.length} medicamentos encontrados de ${total} totales`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error obteniendo medicamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo medicamentos',
      error: error.message
    });
  }
});

// GET /api/farmacia/:id - Obtener medicamento específico
router.get('/:id', simpleAuth, async (req, res) => {
  console.log('👁️ GET medicamento específico endpoint hit');
  console.log('👁️ ID:', req.params.id);
  
  try {
    if (!Medicamento) {
      throw new Error('Modelo Medicamento no disponible');
    }

    const { id } = req.params;
    const medicamentoId = parseInt(id);

    if (isNaN(medicamentoId) || medicamentoId < 1) {
      return res.status(400).json({
        success: false,
        message: 'ID de medicamento inválido'
      });
    }

    const medicamento = await Medicamento.findById(medicamentoId);

    if (!medicamento) {
      return res.status(404).json({
        success: false,
        message: 'Medicamento no encontrado'
      });
    }

    res.json({
      success: true,
      data: medicamento,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obteniendo medicamento:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo medicamento',
      error: error.message
    });
  }
});

// POST /api/farmacia - Crear nuevo medicamento
router.post('/', simpleAuth, async (req, res) => {
  console.log('➕ POST crear medicamento endpoint hit');
  console.log('➕ Body:', req.body);
  
  try {
    if (!Medicamento) {
      throw new Error('Modelo Medicamento no disponible');
    }

    const medicamentoData = req.body;

    // Validaciones básicas
    if (!medicamentoData.nombre || !medicamentoData.nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del medicamento es obligatorio'
      });
    }

    if (!medicamentoData.presentacion_id || isNaN(parseInt(medicamentoData.presentacion_id))) {
      return res.status(400).json({
        success: false,
        message: 'Debe seleccionar una presentación válida'
      });
    }

    if (!medicamentoData.laboratorio_id || isNaN(parseInt(medicamentoData.laboratorio_id))) {
      return res.status(400).json({
        success: false,
        message: 'Debe seleccionar un laboratorio válido'
      });
    }

    if (!medicamentoData.fecha_vencimiento) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de vencimiento es obligatoria'
      });
    }

    console.log('➕ Creando medicamento:', medicamentoData.nombre);

    const nuevoMedicamento = await Medicamento.create(medicamentoData);

    console.log('✅ Medicamento creado exitosamente:', nuevoMedicamento.id);

    res.status(201).json({
      success: true,
      message: 'Medicamento creado exitosamente',
      data: nuevoMedicamento,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error creando medicamento:', error);
    
    // Manejar errores específicos
    if (error.message.includes('Duplicate entry')) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un medicamento con el mismo nombre y presentación'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creando medicamento',
      error: error.message
    });
  }
});

// PUT /api/farmacia/:id - Actualizar medicamento
router.put('/:id', simpleAuth, async (req, res) => {
  console.log('✏️ PUT actualizar medicamento endpoint hit');
  console.log('✏️ ID:', req.params.id);
  console.log('✏️ Body:', req.body);
  
  try {
    if (!Medicamento) {
      throw new Error('Modelo Medicamento no disponible');
    }

    const { id } = req.params;
    const medicamentoId = parseInt(id);

    if (isNaN(medicamentoId) || medicamentoId < 1) {
      return res.status(400).json({
        success: false,
        message: 'ID de medicamento inválido'
      });
    }

    // Verificar que el medicamento existe
    const medicamentoExistente = await Medicamento.findById(medicamentoId);
    if (!medicamentoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Medicamento no encontrado'
      });
    }

    const medicamentoData = req.body;

    // Validaciones básicas (menos estrictas para update)
    if (medicamentoData.presentacion_id && isNaN(parseInt(medicamentoData.presentacion_id))) {
      return res.status(400).json({
        success: false,
        message: 'presentacion_id debe ser un número válido'
      });
    }

    if (medicamentoData.laboratorio_id && isNaN(parseInt(medicamentoData.laboratorio_id))) {
      return res.status(400).json({
        success: false,
        message: 'laboratorio_id debe ser un número válido'
      });
    }

    console.log('✏️ Actualizando medicamento ID:', medicamentoId);

    const medicamentoActualizado = await Medicamento.update(medicamentoId, medicamentoData);

    if (!medicamentoActualizado) {
      return res.status(500).json({
        success: false,
        message: 'Error actualizando medicamento'
      });
    }

    console.log('✅ Medicamento actualizado exitosamente');

    res.json({
      success: true,
      message: 'Medicamento actualizado exitosamente',
      data: medicamentoActualizado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error actualizando medicamento:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando medicamento',
      error: error.message
    });
  }
});

// DELETE /api/farmacia/:id - Eliminar medicamento
router.delete('/:id', simpleAuth, async (req, res) => {
  console.log('🗑️ DELETE medicamento endpoint hit');
  console.log('🗑️ ID:', req.params.id);
  
  try {
    if (!Medicamento) {
      throw new Error('Modelo Medicamento no disponible');
    }

    const { id } = req.params;
    const medicamentoId = parseInt(id);

    if (isNaN(medicamentoId) || medicamentoId < 1) {
      return res.status(400).json({
        success: false,
        message: 'ID de medicamento inválido'
      });
    }

    // Verificar que el medicamento existe
    const medicamentoExistente = await Medicamento.findById(medicamentoId);
    if (!medicamentoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Medicamento no encontrado'
      });
    }

    console.log('🗑️ Eliminando medicamento:', medicamentoExistente.nombre);

    await Medicamento.delete(medicamentoId);

    console.log('✅ Medicamento eliminado exitosamente');

    res.json({
      success: true,
      message: 'Medicamento eliminado exitosamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error eliminando medicamento:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando medicamento',
      error: error.message
    });
  }
});

// =====================================
// ENDPOINTS ESPECIALIZADOS
// =====================================

// PUT /api/farmacia/:id/stock - Actualizar stock específico
router.put('/:id/stock', simpleAuth, async (req, res) => {
  console.log('📦 PUT actualizar stock endpoint hit');
  console.log('📦 ID:', req.params.id);
  console.log('📦 Body:', req.body);
  
  try {
    if (!Medicamento) {
      throw new Error('Modelo Medicamento no disponible');
    }

    const { id } = req.params;
    const { cantidad, motivo = 'Ajuste manual' } = req.body;
    const medicamentoId = parseInt(id);

    if (isNaN(medicamentoId) || medicamentoId < 1) {
      return res.status(400).json({
        success: false,
        message: 'ID de medicamento inválido'
      });
    }

    if (cantidad === undefined || isNaN(parseInt(cantidad)) || parseInt(cantidad) < 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser un número válido mayor o igual a 0'
      });
    }

    console.log('📦 Actualizando stock ID:', medicamentoId, 'Nueva cantidad:', cantidad);

    const medicamentoActualizado = await Medicamento.updateStock(
      medicamentoId, 
      parseInt(cantidad), 
      motivo, 
      req.user?.id || 1
    );

    console.log('✅ Stock actualizado exitosamente');

    res.json({
      success: true,
      message: 'Stock actualizado exitosamente',
      data: medicamentoActualizado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error actualizando stock:', error);
    
    if (error.message === 'Medicamento no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error actualizando stock',
      error: error.message
    });
  }
});

// GET /api/farmacia/export/excel - Exportar medicamentos
router.get('/export/excel', simpleAuth, async (req, res) => {
  console.log('📤 GET export excel endpoint hit');
  
  try {
    if (!Medicamento) {
      throw new Error('Modelo Medicamento no disponible');
    }
    
    // Obtener todos los medicamentos sin paginación
    const medicamentos = await Medicamento.findAll({ limit: null });
    
    console.log(`📤 Exportando ${medicamentos.length} medicamentos`);
    
    res.json({
      success: true,
      message: `${medicamentos.length} medicamentos exportados`,
      data: medicamentos,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error exportando medicamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error exportando medicamentos',
      error: error.message
    });
  }
});

// =====================================
// ENDPOINTS DE DEBUGGING (DESARROLLO)
// =====================================

// DEBUG: Test básico
router.get('/debug/basic', async (req, res) => {
  console.log('🧪 Debug basic endpoint hit');
  res.json({
    success: true,
    message: 'Farmacia routes funcionando',
    timestamp: new Date().toISOString(),
    modeloDisponible: !!Medicamento
  });
});

// DEBUG: Test auth
router.get('/debug/auth', simpleAuth, async (req, res) => {
  console.log('🧪 Debug auth endpoint hit');
  const authHeader = req.headers.authorization;
  res.json({
    success: true,
    message: 'Auth funcionando',
    hasAuthHeader: !!authHeader,
    user: req.user || 'No user data',
    timestamp: new Date().toISOString()
  });
});

// =====================================
// MANEJO DE ERRORES
// =====================================

router.use((error, req, res, next) => {
  console.error('❌ Error en farmacia routes:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno farmacia',
    error: error.message,
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Farmacia routes completas configuradas');
module.exports = router;