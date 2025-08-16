// src/routes/farmacia.js
// VERSIÓN COMPLETA FUNCIONAL

const express = require('express');
const router = express.Router();

console.log('🔍 Farmacia routes cargadas');

// =====================================
// MIDDLEWARE DE AUTH SIMPLE
// =====================================

const simpleAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token de autorización requerido',
      code: 'AUTH_REQUIRED'
    });
  }
  
  // Por ahora solo verificamos que tenga formato correcto
  // TODO: Verificar JWT real cuando funcione
  next();
};

// =====================================
// IMPORTAR MODELO
// =====================================

let Medicamento;
try {
  Medicamento = require('../models/Medicamento');
  console.log('✅ Modelo Medicamento cargado exitosamente');
} catch (error) {
  console.error('❌ Error cargando modelo Medicamento:', error.message);
}

// =====================================
// ENDPOINTS BÁSICOS (YA FUNCIONANDO)
// =====================================

// Presentaciones CON AUTH
router.get('/presentaciones', simpleAuth, async (req, res) => {
  console.log('🔍 Presentaciones endpoint hit');
  
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
    console.error('❌ Error en presentaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo presentaciones',
      error: error.message
    });
  }
});

// Laboratorios CON AUTH
router.get('/laboratorios', simpleAuth, async (req, res) => {
  console.log('🔍 Laboratorios endpoint hit');
  
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
    console.error('❌ Error en laboratorios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo laboratorios',
      error: error.message
    });
  }
});

// Stats CON AUTH
router.get('/stats', simpleAuth, async (req, res) => {
  console.log('🔍 Stats endpoint hit');
  
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
      offset
    };

    console.log('🔍 Opciones de búsqueda:', options);

    const medicamentos = await Medicamento.findAll(options);
    
    // Obtener total para paginación (simplificado)
    const totalOptions = { ...options, limit: 1000, offset: 0 };
    const totalMedicamentos = await Medicamento.findAll(totalOptions);
    const total = totalMedicamentos.length;

    console.log(`🔍 Encontrados ${medicamentos.length} medicamentos de ${total} total`);

    res.json({
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
    });

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
  console.log('🔍 GET medicamento por ID endpoint hit');
  
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

    console.log('🔍 Buscando medicamento ID:', medicamentoId);

    const medicamento = await Medicamento.findById(medicamentoId);

    if (!medicamento) {
      return res.status(404).json({
        success: false,
        message: 'Medicamento no encontrado'
      });
    }

    console.log('🔍 Medicamento encontrado:', medicamento.nombre);

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
  console.log('🔍 POST crear medicamento endpoint hit');
  console.log('🔍 Body recibido:', req.body);
  
  try {
    if (!Medicamento) {
      throw new Error('Modelo Medicamento no disponible');
    }

    const medicamentoData = req.body;

    // Validación básica requerida
    const camposRequeridos = ['nombre', 'presentacion_id', 'laboratorio_id', 'existencias', 'fecha_vencimiento', 'precio_tarjeta', 'precio_efectivo', 'costo_compra', 'porcentaje_comision'];
    
    for (const campo of camposRequeridos) {
      if (medicamentoData[campo] === undefined || medicamentoData[campo] === null || medicamentoData[campo] === '') {
        return res.status(400).json({
          success: false,
          message: `Campo requerido faltante: ${campo}`
        });
      }
    }

    // Validaciones de tipos
    if (isNaN(parseInt(medicamentoData.presentacion_id))) {
      return res.status(400).json({
        success: false,
        message: 'presentacion_id debe ser un número válido'
      });
    }

    if (isNaN(parseInt(medicamentoData.laboratorio_id))) {
      return res.status(400).json({
        success: false,
        message: 'laboratorio_id debe ser un número válido'
      });
    }

    if (isNaN(parseInt(medicamentoData.existencias))) {
      return res.status(400).json({
        success: false,
        message: 'existencias debe ser un número válido'
      });
    }

    if (isNaN(parseFloat(medicamentoData.precio_tarjeta))) {
      return res.status(400).json({
        success: false,
        message: 'precio_tarjeta debe ser un número válido'
      });
    }

    console.log('🔍 Validaciones básicas pasadas, creando medicamento...');

    const nuevoId = await Medicamento.create(medicamentoData);

    console.log('🔍 Medicamento creado con ID:', nuevoId);

    // Obtener el medicamento creado para devolver datos completos
    const medicamentoCreado = await Medicamento.findById(nuevoId);

    res.status(201).json({
      success: true,
      message: 'Medicamento creado exitosamente',
      data: medicamentoCreado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error creando medicamento:', error);
    
    if (error.message.includes('Ya existe')) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un medicamento con ese nombre y presentación'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creando medicamento',
      error: error.message
    });
  }
});

// =====================================
// ENDPOINTS DE DEBUG (MANTENER)
// =====================================

router.get('/debug/basic', (req, res) => {
  console.log('🔍 Debug basic endpoint hit');
  res.json({
    success: true,
    message: 'Endpoint básico funcionando',
    timestamp: new Date().toISOString()
  });
});

router.get('/debug/auth', (req, res, next) => {
  console.log('🔍 Debug auth endpoint hit');
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header requerido'
    });
  }
  
  res.json({
    success: true,
    message: 'Auth básico funcionando',
    hasAuth: !!authHeader,
    timestamp: new Date().toISOString()
  });
});

// DEBUG: Verificar estructura de tabla medicamentos
router.get('/debug/table-structure', async (req, res) => {
  console.log('🔍 Verificando estructura de tabla medicamentos');
  
  try {
    const mysql = require('mysql2/promise');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });
    
    // Obtener estructura de tabla medicamentos
    const [columns] = await connection.execute('DESCRIBE medicamentos');
    
    // Contar registros
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM medicamentos');
    
    // Obtener un registro de ejemplo si existe
    const [sample] = await connection.execute('SELECT * FROM medicamentos LIMIT 1');
    
    await connection.end();
    
    res.json({
      success: true,
      data: {
        columns: columns,
        total_records: count[0].total,
        sample_record: sample[0] || null
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error verificando estructura:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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