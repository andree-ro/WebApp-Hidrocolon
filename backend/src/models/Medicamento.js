// src/models/Medicamento.js
// VERSIÓN SIMPLIFICADA - Usa conexión individual como User.js

const mysql = require('mysql2/promise');

class Medicamento {
  constructor() {
    // Usar la misma configuración que User.js
    this.dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      charset: 'utf8mb4',
      timezone: 'Z', // Igual que User.js
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true
    };
  }

  // Crear conexión igual que User.js
  async getConnection() {
    try {
      const connection = await mysql.createConnection(this.dbConfig);
      return connection;
    } catch (error) {
      console.error('❌ Error conectando a la base de datos:', error.message);
      throw new Error('Error de conexión a la base de datos');
    }
  }

  // Obtener todos los medicamentos con información completa
  static async findAll(options = {}) {
    const instance = new Medicamento();
    const connection = await instance.getConnection();
    
    try {
      const {
        search = '',
        presentacion_id = null,
        laboratorio_id = null,
        stock_bajo = false,
        proximo_vencer = false,
        limit = 50,
        offset = 0,
        activo = true
      } = options;

      let whereConditions = ['m.activo = ?'];
      let queryParams = [activo ? 1 : 0];

      // Búsqueda por nombre
      if (search) {
        whereConditions.push('(m.nombre LIKE ? OR p.nombre LIKE ? OR l.nombre LIKE ?)');
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      // Filtro por presentación
      if (presentacion_id) {
        whereConditions.push('m.presentacion_id = ?');
        queryParams.push(presentacion_id);
      }

      // Filtro por laboratorio
      if (laboratorio_id) {
        whereConditions.push('m.laboratorio_id = ?');
        queryParams.push(laboratorio_id);
      }

      // Filtro stock bajo
      if (stock_bajo) {
        whereConditions.push('m.existencias < 11');
      }

      // Filtro próximo a vencer (30 días)
      if (proximo_vencer) {
        whereConditions.push('m.fecha_vencimiento <= DATE_ADD(NOW(), INTERVAL 30 DAY)');
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          m.*,
          p.nombre as presentacion_nombre,
          l.nombre as laboratorio_nombre,
          CASE 
            WHEN m.existencias < 11 THEN 'bajo'
            WHEN m.existencias < 50 THEN 'medio'
            ELSE 'normal'
          END as estado_stock,
          CASE 
            WHEN m.fecha_vencimiento <= NOW() THEN 'vencido'
            WHEN m.fecha_vencimiento <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'proximo_vencer'
            ELSE 'vigente'
          END as estado_vencimiento,
          DATEDIFF(m.fecha_vencimiento, NOW()) as dias_vencimiento
        FROM medicamentos m
        LEFT JOIN presentaciones p ON m.presentacion_id = p.id
        LEFT JOIN laboratorios l ON m.laboratorio_id = l.id
        ${whereClause}
        ORDER BY m.nombre ASC
        LIMIT ? OFFSET ?
      `;

      queryParams.push(limit, offset);

      const [rows] = await connection.execute(query, queryParams);
      return rows;
    } catch (error) {
      console.error('❌ Error en findAll:', error.message);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Obtener estadísticas del módulo farmacia
  static async getStats() {
    const instance = new Medicamento();
    const connection = await instance.getConnection();
    
    try {
      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_medicamentos,
          SUM(CASE WHEN existencias < 11 THEN 1 ELSE 0 END) as stock_bajo,
          SUM(CASE WHEN fecha_vencimiento <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as proximo_vencer,
          SUM(CASE WHEN fecha_vencimiento <= NOW() THEN 1 ELSE 0 END) as vencidos,
          SUM(existencias) as total_existencias,
          AVG(precio_tarjeta) as precio_promedio
        FROM medicamentos 
        WHERE activo = 1
      `);

      return stats[0];
    } catch (error) {
      console.error('❌ Error en getStats:', error.message);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Obtener presentaciones activas
  static async getPresentaciones() {
    const instance = new Medicamento();
    const connection = await instance.getConnection();
    
    try {
      const [rows] = await connection.execute('SELECT * FROM presentaciones WHERE activo = 1 ORDER BY nombre');
      return rows;
    } catch (error) {
      console.error('❌ Error en getPresentaciones:', error.message);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Obtener laboratorios activos
  static async getLaboratorios() {
    const instance = new Medicamento();
    const connection = await instance.getConnection();
    
    try {
      const [rows] = await connection.execute('SELECT * FROM laboratorios WHERE activo = 1 ORDER BY nombre');
      return rows;
    } catch (error) {
      console.error('❌ Error en getLaboratorios:', error.message);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Obtener extras activos
  static async getExtras() {
    const instance = new Medicamento();
    const connection = await instance.getConnection();
    
    try {
      const [rows] = await connection.execute('SELECT * FROM extras WHERE activo = 1 ORDER BY nombre');
      return rows;
    } catch (error) {
      console.error('❌ Error en getExtras:', error.message);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Método simplificado para testing - solo stats y listas
  static async findById(id) {
    const instance = new Medicamento();
    const connection = await instance.getConnection();
    
    try {
      const [rows] = await connection.execute(`
        SELECT 
          m.*,
          p.nombre as presentacion_nombre,
          l.nombre as laboratorio_nombre
        FROM medicamentos m
        LEFT JOIN presentaciones p ON m.presentacion_id = p.id
        LEFT JOIN laboratorios l ON m.laboratorio_id = l.id
        WHERE m.id = ? AND m.activo = 1
      `, [id]);

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('❌ Error en findById:', error.message);
      throw error;
    } finally {
      await connection.end();
    }
  }
}

module.exports = Medicamento;