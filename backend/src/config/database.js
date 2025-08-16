// src/config/database.js
// Configuración de conexión a MySQL para Sistema Hidrocolon
// Pool de conexiones optimizado para Railway

const mysql = require('mysql2/promise');

// ============================================================================
// CONFIGURACIÓN DE LA BASE DE DATOS
// ============================================================================

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hidrocolon',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  timezone: '+00:00',
  
  // Pool de conexiones para mejor rendimiento
  connectionLimit: process.env.NODE_ENV === 'production' ? 10 : 5,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  
  // Configuraciones adicionales para Railway
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  multipleStatements: false, // Seguridad: previene SQL injection
  dateStrings: false, // Usar objetos Date de JavaScript
  supportBigNumbers: true,
  bigNumberStrings: false,
  
  // Configuración específica para Railway MySQL
  ...(process.env.NODE_ENV === 'production' && {
    connectTimeout: 60000,
    authPlugins: {
      mysql_native_password: () => require('mysql2/lib/auth_plugins').mysql_native_password
    }
  })
};

// ============================================================================
// CREAR POOL DE CONEXIONES
// ============================================================================

let pool;

try {
  pool = mysql.createPool(dbConfig);
  console.log('✅ Pool de conexiones MySQL creado');
} catch (error) {
  console.error('❌ Error creando pool de conexiones:', error);
  process.exit(1);
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

// Función para probar la conexión
async function testConnection() {
  try {
    console.log('🔄 Probando conexión a la base de datos...');
    
    const connection = await pool.getConnection();
    
    // Test básico
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as timestamp, DATABASE() as db_name');
    
    console.log('✅ Base de datos conectada exitosamente:', {
      host: dbConfig.host,
      database: rows[0].db_name,
      timestamp: rows[0].timestamp,
      environment: process.env.NODE_ENV
    });
    
    connection.release();
    return { success: true, data: rows[0] };
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', {
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      host: dbConfig.host,
      database: dbConfig.database
    });
    return { success: false, error: error.message };
  }
}

// Función para obtener estadísticas de la base de datos
async function getDatabaseStats() {
  try {
    const connection = await pool.getConnection();
    
    // Obtener información de tablas
    const [tables] = await connection.execute(`
      SELECT 
        TABLE_NAME as table_name,
        TABLE_ROWS as row_count,
        ROUND(DATA_LENGTH / 1024 / 1024, 2) as data_size_mb,
        ROUND(INDEX_LENGTH / 1024 / 1024, 2) as index_size_mb,
        ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as total_size_mb,
        ENGINE as engine
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
    `, [dbConfig.database]);
    
    // Obtener estado del pool de conexiones
    const poolStats = {
      total_connections: pool.pool.config.connectionLimit,
      active_connections: pool.pool._allConnections.length,
      free_connections: pool.pool._freeConnections.length,
      queue_length: pool.pool._connectionQueue.length
    };
    
    // Obtener información general de la BD
    const [dbInfo] = await connection.execute(`
      SELECT 
        COUNT(*) as total_tables,
        SUM(TABLE_ROWS) as total_rows,
        ROUND(SUM(DATA_LENGTH) / 1024 / 1024, 2) as total_data_mb,
        ROUND(SUM(INDEX_LENGTH) / 1024 / 1024, 2) as total_index_mb
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [dbConfig.database]);
    
    connection.release();
    
    return {
      success: true,
      database: dbConfig.database,
      summary: dbInfo[0],
      tables: tables,
      pool: poolStats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de BD:', error);
    return { success: false, error: error.message };
  }
}

// Función para verificar estructura de tablas principales
async function verifyTableStructure() {
  try {
    const connection = await pool.getConnection();
    
    const tablasRequeridas = [
      'usuarios', 'roles', 'medicamentos', 'presentaciones', 
      'laboratorios', 'extras', 'medicamentos_extras', 
      'pacientes', 'ventas', 'detalle_ventas'
    ];
    
    const verificacion = {};
    
    for (const tabla of tablasRequeridas) {
      try {
        const [rows] = await connection.execute(`
          SELECT COUNT(*) as count FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        `, [dbConfig.database, tabla]);
        
        verificacion[tabla] = {
          exists: rows[0].count > 0,
          status: rows[0].count > 0 ? 'OK' : 'MISSING'
        };
      } catch (error) {
        verificacion[tabla] = {
          exists: false,
          status: 'ERROR',
          error: error.message
        };
      }
    }
    
    connection.release();
    
    const todasExisten = Object.values(verificacion).every(v => v.exists);
    
    return {
      success: true,
      all_tables_exist: todasExisten,
      tables: verificacion
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Función para cerrar el pool de conexiones
async function closePool() {
  try {
    await pool.end();
    console.log('🔒 Pool de conexiones cerrado correctamente');
    return { success: true };
  } catch (error) {
    console.error('Error cerrando pool:', error);
    return { success: false, error: error.message };
  }
}

// Función para ejecutar queries con manejo de errores
async function executeQuery(query, params = [], options = {}) {
  let connection;
  const startTime = Date.now();
  
  try {
    connection = await pool.getConnection();
    
    // Log de query en desarrollo
    if (process.env.NODE_ENV === 'development' && options.debug) {
      console.log('🔍 Ejecutando query:', {
        query: query.substring(0, 200),
        params: params,
        timestamp: new Date().toISOString()
      });
    }
    
    const [results] = await connection.execute(query, params);
    const duration = Date.now() - startTime;
    
    // Log de queries lentas (> 1 segundo)
    if (duration > 1000) {
      console.warn('⚠️ Query lenta detectada:', {
        duration: `${duration}ms`,
        query: query.substring(0, 100),
        params: params.length
      });
    }
    
    return {
      success: true,
      data: results,
      duration: duration,
      affectedRows: results.affectedRows || 0,
      insertId: results.insertId || null
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('❌ Error ejecutando query:', {
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      query: query.substring(0, 100),
      params: params,
      duration: `${duration}ms`
    });
    
    return {
      success: false,
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      duration: duration
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Función para ejecutar transacciones
async function executeTransaction(queries) {
  let connection;
  const startTime = Date.now();
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const results = [];
    
    for (const { query, params = [] } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }
    
    await connection.commit();
    const duration = Date.now() - startTime;
    
    console.log('✅ Transacción completada:', {
      queries: queries.length,
      duration: `${duration}ms`
    });
    
    return {
      success: true,
      results: results,
      duration: duration
    };
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
        console.log('🔄 Rollback ejecutado correctamente');
      } catch (rollbackError) {
        console.error('❌ Error en rollback:', rollbackError);
      }
    }
    
    const duration = Date.now() - startTime;
    
    console.error('❌ Error en transacción:', {
      error: error.message,
      code: error.code,
      duration: `${duration}ms`,
      queries: queries.length
    });
    
    return {
      success: false,
      error: error.message,
      code: error.code,
      duration: duration
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// ============================================================================
// MANEJO DE EVENTOS DEL POOL
// ============================================================================

pool.on('connection', (connection) => {
  console.log('🔗 Nueva conexión establecida:', {
    threadId: connection.threadId,
    timestamp: new Date().toISOString()
  });
});

pool.on('error', (error) => {
  console.error('❌ Error en el pool de conexiones:', {
    error: error.message,
    code: error.code,
    timestamp: new Date().toISOString()
  });
  
  // En caso de error crítico, intentar reconectar
  if (error.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 Conexión perdida, intentando reconectar...');
    setTimeout(() => {
      testConnection();
    }, 5000);
  }
});

// ============================================================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================================================

// Probar conexión al inicializar el módulo
(async () => {
  const result = await testConnection();
  if (result.success) {
    // Verificar estructura de tablas en producción
    if (process.env.NODE_ENV === 'production') {
      const verification = await verifyTableStructure();
      if (!verification.all_tables_exist) {
        console.warn('⚠️ Algunas tablas requeridas no existen:', verification.tables);
      } else {
        console.log('✅ Todas las tablas requeridas verificadas');
      }
    }
  } else {
    console.error('❌ No se pudo establecer conexión inicial a la base de datos');
  }
})();

// ============================================================================
// EXPORTACIONES
// ============================================================================

module.exports = {
  // Pool principal
  pool,
  
  // Funciones de utilidad
  testConnection,
  getDatabaseStats,
  verifyTableStructure,
  closePool,
  executeQuery,
  executeTransaction,
  
  // Configuración (solo para debugging)
  config: {
    host: dbConfig.host,
    database: dbConfig.database,
    port: dbConfig.port,
    connectionLimit: dbConfig.connectionLimit
  }
};