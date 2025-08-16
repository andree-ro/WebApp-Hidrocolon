// src/routes/farmacia.js
// VERSIÓN FUNCIONAL CON AUTH BÁSICO

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
// ENDPOINT BÁSICO DE TEST (SIN MIDDLEWARES)
// =====================================

router.get('/debug/basic', (req, res) => {
  console.log('🔍 Debug basic endpoint hit');
  res.json({
    success: true,
    message: 'Endpoint básico funcionando',
    timestamp: new Date().toISOString()
  });
});

// =====================================
// ENDPOINT CON AUTH MÍNIMO
// =====================================

router.get('/debug/auth', (req, res, next) => {
  console.log('🔍 Debug auth endpoint hit');
  
  // Verificar header simple
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

// =====================================
// ENDPOINT CON BD MÍNIMA
// =====================================

router.get('/debug/db', async (req, res) => {
  console.log('🔍 Debug DB endpoint hit');
  
  try {
    // Test conexión BD básica sin modelo
    const mysql = require('mysql2/promise');
    
    const dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      timeout: 5000 // 5 segundos timeout
    };
    
    console.log('🔍 Intentando conexión BD...');
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('🔍 Ejecutando query simple...');
    const [rows] = await connection.execute('SELECT 1 as test');
    
    await connection.end();
    console.log('🔍 Conexión BD cerrada exitosamente');
    
    res.json({
      success: true,
      message: 'Conexión BD funcionando',
      testResult: rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en debug DB:', error);
    res.status(500).json({
      success: false,
      message: 'Error conexión BD',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// =====================================
// ENDPOINTS REALES CON MODELO
// =====================================

// Importar el modelo (CUIDADOSAMENTE)
let Medicamento;
try {
  Medicamento = require('../models/Medicamento');
  console.log('✅ Modelo Medicamento cargado exitosamente');
} catch (error) {
  console.error('❌ Error cargando modelo Medicamento:', error.message);
}

// Presentaciones CON AUTH
router.get('/presentaciones', simpleAuth, async (req, res) => {
  console.log('🔍 Presentaciones endpoint hit');
  
  try {
    if (!Medicamento) {
      throw new Error('Modelo Medicamento no disponible');
    }
    
    console.log('🔍 Llamando Medicamento.getPresentaciones()...');
    const presentaciones = await Medicamento.getPresentaciones();
    
    console.log('🔍 Presentaciones obtenidas:', presentaciones.length);
    
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
      error: error.message,
      timestamp: new Date().toISOString()
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
      error: error.message,
      timestamp: new Date().toISOString()
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
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// =====================================
// MANEJO DE ERRORES SIMPLE
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

console.log('✅ Farmacia routes debug configuradas');
module.exports = router;