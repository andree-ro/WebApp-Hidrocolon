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

// DEBUG: Insertar datos de prueba
router.post('/debug/insert-sample-data', async (req, res) => {
  console.log('🔍 Insertando datos de prueba');
  
  try {
    if (!Medicamento) {
      throw new Error('Modelo Medicamento no disponible');
    }

    // Datos de medicamentos de prueba
    const medicamentosPrueba = [
      {
        nombre: 'Paracetamol 500mg',
        presentacion_id: 1, // Unidad
        laboratorio_id: 1, // Farmex
        existencias: 100,
        fecha_vencimiento: '2025-12-31',
        precio_tarjeta: 5.00,
        precio_efectivo: 4.50,
        costo_compra: 3.00,
        porcentaje_comision: 10.0,
        indicaciones: 'Analgésico y antipirético',
        contraindicaciones: 'Hipersensibilidad al paracetamol',
        dosis: '1 tableta cada 8 horas'
      },
      {
        nombre: 'Ibuprofeno 400mg',
        presentacion_id: 1, // Unidad
        laboratorio_id: 2, // Bonin
        existencias: 50,
        fecha_vencimiento: '2025-10-15',
        precio_tarjeta: 8.00,
        precio_efectivo: 7.50,
        costo_compra: 5.00,
        porcentaje_comision: 12.0,
        indicaciones: 'Antiinflamatorio no esteroideo',
        contraindicaciones: 'Úlcera péptica activa',
        dosis: '1 tableta cada 12 horas'
      },
      {
        nombre: 'Amoxicilina 500mg',
        presentacion_id: 4, // Frasco Pastillas
        laboratorio_id: 3, // Dipronat
        existencias: 25,
        fecha_vencimiento: '2025-08-30',
        precio_tarjeta: 15.00,
        precio_efectivo: 14.00,
        costo_compra: 10.00,
        porcentaje_comision: 15.0,
        indicaciones: 'Antibiótico betalactámico',
        contraindicaciones: 'Alergia a penicilinas',
        dosis: '1 cápsula cada 8 horas por 7 días'
      },
      {
        nombre: 'Vitamina C 1000mg',
        presentacion_id: 1, // Unidad
        laboratorio_id: 4, // Reckeweg
        existencias: 200,
        fecha_vencimiento: '2026-03-15',
        precio_tarjeta: 3.00,
        precio_efectivo: 2.75,
        costo_compra: 1.50,
        porcentaje_comision: 8.0,
        indicaciones: 'Suplemento vitamínico',
        contraindicaciones: 'Cálculos renales de oxalato',
        dosis: '1 tableta diaria'
      },
      {
        nombre: 'Jarabe para la Tos',
        presentacion_id: 7, // Frasco Jarabe
        laboratorio_id: 5, // Praxis
        existencias: 8, // Stock bajo
        fecha_vencimiento: '2025-09-20',
        precio_tarjeta: 12.00,
        precio_efectivo: 11.00,
        costo_compra: 7.00,
        porcentaje_comision: 10.0,
        indicaciones: 'Antitusivo y expectorante',
        contraindicaciones: 'Menores de 2 años',
        dosis: '5ml cada 6 horas'
      }
    ];

    const resultados = [];
    
    for (const medicamento of medicamentosPrueba) {
      try {
        const nuevoId = await Medicamento.create(medicamento);
        resultados.push({
          nombre: medicamento.nombre,
          id: nuevoId,
          status: 'creado'
        });
        console.log(`✅ Creado: ${medicamento.nombre} (ID: ${nuevoId})`);
      } catch (error) {
        resultados.push({
          nombre: medicamento.nombre,
          error: error.message,
          status: 'error'
        });
        console.log(`❌ Error creando ${medicamento.nombre}: ${error.message}`);
      }
    }
    
    res.json({
      success: true,
      message: 'Datos de prueba insertados',
      data: {
        total_intentos: medicamentosPrueba.length,
        exitosos: resultados.filter(r => r.status === 'creado').length,
        errores: resultados.filter(r => r.status === 'error').length,
        resultados: resultados
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error insertando datos de prueba:', error);
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