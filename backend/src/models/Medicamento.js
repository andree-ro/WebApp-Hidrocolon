// src/models/Medicamento.js
const pool = require('../config/database');

class Medicamento {
  constructor(data) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.presentacion_id = data.presentacion_id;
    this.laboratorio_id = data.laboratorio_id;
    this.existencias = data.existencias;
    this.fecha_vencimiento = data.fecha_vencimiento;
    this.precio_tarjeta = data.precio_tarjeta;
    this.precio_efectivo = data.precio_efectivo;
    this.costo_compra = data.costo_compra;
    this.indicaciones = data.indicaciones;
    this.contraindicaciones = data.contraindicaciones;
    this.dosis = data.dosis;
    this.comision_porcentaje = data.comision_porcentaje;
    this.imagen_url = data.imagen_url;
    this.activo = data.activo;
    this.fecha_creacion = data.fecha_creacion;
    this.fecha_actualizacion = data.fecha_actualizacion;
  }

  // Crear nuevo medicamento
  static async create(medicamentoData) {
    const connection = await pool.getConnection();
    try {
      const {
        nombre, presentacion_id, laboratorio_id, existencias,
        fecha_vencimiento, precio_tarjeta, precio_efectivo, costo_compra,
        indicaciones, contraindicaciones, dosis, comision_porcentaje,
        imagen_url, extras_ids = []
      } = medicamentoData;

      await connection.beginTransaction();

      // Insertar medicamento
      const [result] = await connection.execute(`
        INSERT INTO medicamentos (
          nombre, presentacion_id, laboratorio_id, existencias,
          fecha_vencimiento, precio_tarjeta, precio_efectivo, costo_compra,
          indicaciones, contraindicaciones, dosis, comision_porcentaje,
          imagen_url, activo, fecha_creacion, fecha_actualizacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
      `, [
        nombre, presentacion_id, laboratorio_id, existencias,
        fecha_vencimiento, precio_tarjeta, precio_efectivo, costo_compra,
        indicaciones, contraindicaciones, dosis, comision_porcentaje,
        imagen_url
      ]);

      const medicamentoId = result.insertId;

      // Vincular extras si existen
      if (extras_ids && extras_ids.length > 0) {
        for (const extraId of extras_ids) {
          await connection.execute(`
            INSERT INTO medicamentos_extras (medicamento_id, extra_id, fecha_creacion)
            VALUES (?, ?, NOW())
          `, [medicamentoId, extraId]);
        }
      }

      // Registrar movimiento de inventario
      await connection.execute(`
        INSERT INTO movimientos_inventario (
          tipo_item, item_id, tipo_movimiento, cantidad, motivo,
          usuario_id, fecha_movimiento
        ) VALUES ('medicamento', ?, 'entrada', ?, 'Creación inicial', 1, NOW())
      `, [medicamentoId, existencias]);

      await connection.commit();
      return await this.findById(medicamentoId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Obtener todos los medicamentos con información completa
  static async findAll(options = {}) {
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

    const [rows] = await pool.execute(query, queryParams);
    return rows.map(row => new Medicamento(row));
  }

  // Obtener medicamento por ID con extras
  static async findById(id) {
    const [rows] = await pool.execute(`
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
        END as estado_vencimiento
      FROM medicamentos m
      LEFT JOIN presentaciones p ON m.presentacion_id = p.id
      LEFT JOIN laboratorios l ON m.laboratorio_id = l.id
      WHERE m.id = ? AND m.activo = 1
    `, [id]);

    if (rows.length === 0) return null;

    const medicamento = new Medicamento(rows[0]);

    // Obtener extras vinculados
    const [extrasRows] = await pool.execute(`
      SELECT e.*, me.fecha_creacion as fecha_vinculacion
      FROM extras e
      INNER JOIN medicamentos_extras me ON e.id = me.extra_id
      WHERE me.medicamento_id = ? AND e.activo = 1
    `, [id]);

    medicamento.extras = extrasRows;
    return medicamento;
  }

  // Actualizar medicamento
  static async update(id, medicamentoData) {
    const connection = await pool.getConnection();
    try {
      const {
        nombre, presentacion_id, laboratorio_id, existencias,
        fecha_vencimiento, precio_tarjeta, precio_efectivo, costo_compra,
        indicaciones, contraindicaciones, dosis, comision_porcentaje,
        imagen_url, extras_ids = []
      } = medicamentoData;

      await connection.beginTransaction();

      // Obtener existencias actuales para calcular diferencia
      const [currentRows] = await connection.execute('SELECT existencias FROM medicamentos WHERE id = ?', [id]);
      const existenciasAntes = currentRows[0]?.existencias || 0;
      const diferencia = existencias - existenciasAntes;

      // Actualizar medicamento
      await connection.execute(`
        UPDATE medicamentos SET
          nombre = ?, presentacion_id = ?, laboratorio_id = ?, existencias = ?,
          fecha_vencimiento = ?, precio_tarjeta = ?, precio_efectivo = ?, 
          costo_compra = ?, indicaciones = ?, contraindicaciones = ?, 
          dosis = ?, comision_porcentaje = ?, imagen_url = ?,
          fecha_actualizacion = NOW()
        WHERE id = ?
      `, [
        nombre, presentacion_id, laboratorio_id, existencias,
        fecha_vencimiento, precio_tarjeta, precio_efectivo, costo_compra,
        indicaciones, contraindicaciones, dosis, comision_porcentaje,
        imagen_url, id
      ]);

      // Registrar movimiento si cambió el inventario
      if (diferencia !== 0) {
        const tipoMovimiento = diferencia > 0 ? 'entrada' : 'salida';
        const cantidad = Math.abs(diferencia);
        await connection.execute(`
          INSERT INTO movimientos_inventario (
            tipo_item, item_id, tipo_movimiento, cantidad, motivo,
            usuario_id, fecha_movimiento
          ) VALUES ('medicamento', ?, ?, ?, 'Actualización manual', 1, NOW())
        `, [id, tipoMovimiento, cantidad]);
      }

      // Actualizar extras vinculados
      await connection.execute('DELETE FROM medicamentos_extras WHERE medicamento_id = ?', [id]);
      
      if (extras_ids && extras_ids.length > 0) {
        for (const extraId of extras_ids) {
          await connection.execute(`
            INSERT INTO medicamentos_extras (medicamento_id, extra_id, fecha_creacion)
            VALUES (?, ?, NOW())
          `, [id, extraId]);
        }
      }

      await connection.commit();
      return await this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Eliminar medicamento (soft delete)
  static async delete(id) {
    await pool.execute(`
      UPDATE medicamentos SET activo = 0, fecha_actualizacion = NOW() 
      WHERE id = ?
    `, [id]);
    return true;
  }

  // Actualizar stock (para ventas)
  static async updateStock(id, cantidad, motivo = 'Venta', usuarioId = 1) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Verificar stock actual
      const [rows] = await connection.execute('SELECT existencias FROM medicamentos WHERE id = ?', [id]);
      if (rows.length === 0) throw new Error('Medicamento no encontrado');

      const stockActual = rows[0].existencias;
      if (stockActual < cantidad) {
        throw new Error('Stock insuficiente');
      }

      // Actualizar stock
      await connection.execute(`
        UPDATE medicamentos SET 
          existencias = existencias - ?, 
          fecha_actualizacion = NOW() 
        WHERE id = ?
      `, [cantidad, id]);

      // Registrar movimiento
      await connection.execute(`
        INSERT INTO movimientos_inventario (
          tipo_item, item_id, tipo_movimiento, cantidad, motivo,
          usuario_id, fecha_movimiento
        ) VALUES ('medicamento', ?, 'salida', ?, ?, ?, NOW())
      `, [id, cantidad, motivo, usuarioId]);

      await connection.commit();
      return await this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Obtener estadísticas del módulo farmacia
  static async getStats() {
    const [stats] = await pool.execute(`
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
  }

  // Obtener presentaciones activas
  static async getPresentaciones() {
    const [rows] = await pool.execute('SELECT * FROM presentaciones WHERE activo = 1 ORDER BY nombre');
    return rows;
  }

  // Obtener laboratorios activos
  static async getLaboratorios() {
    const [rows] = await pool.execute('SELECT * FROM laboratorios WHERE activo = 1 ORDER BY nombre');
    return rows;
  }

  // Obtener extras activos
  static async getExtras() {
    const [rows] = await pool.execute('SELECT * FROM extras WHERE activo = 1 ORDER BY nombre');
    return rows;
  }
}

module.exports = Medicamento;