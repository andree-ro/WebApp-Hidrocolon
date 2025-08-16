// src/routes/farmacia.js
// VERSIÓN DEBUG SIMPLIFICADA - REEMPLAZAR ARCHIVO COMPLETO

const express = require('express');
const router = express.Router();

console.log('🔍 Farmacia routes cargadas');

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
// ENDPOINT PRESENTACIONES SIMPLIFICADO
// =====================================

router.get('/presentaciones', async (req, res) => {
  console.log('🔍 Presentaciones endpoint hit');
  
  try {
    const mysql = require('mysql2/promise');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      timeout: 10000
    });
    
    console.log('🔍 Ejecutando query presentaciones...');
    const [rows] = await connection.execute('SELECT * FROM presentaciones WHERE activo = 1 ORDER BY nombre');
    
    await connection.end();
    console.log('🔍 Query presentaciones exitosa');
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
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