// backend/src/models/Deposito.js
const { pool } = require('../config/database');

class Deposito {
    /**
     * Registrar un nuevo depósito
     */
    static async create(depositoData) {
        const { turno_id, numero_deposito, paciente_nombre, monto } = depositoData;

        const [result] = await pool.execute(
            `INSERT INTO depositos (turno_id, numero_deposito, paciente_nombre, monto)
             VALUES (?, ?, ?, ?)`,
            [turno_id, numero_deposito, paciente_nombre, monto]
        );

        return { id: result.insertId, ...depositoData };
    }

    /**
     * Obtener todos los depósitos de un turno
     */
    static async findByTurno(turno_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM depositos WHERE turno_id = ? ORDER BY fecha_creacion DESC`,
            [turno_id]
        );
        return rows;
    }

    /**
     * Obtener un depósito por ID
     */
    static async findById(id) {
        const [rows] = await pool.execute(
            `SELECT * FROM depositos WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    /**
     * Buscar depósito por número
     */
    static async findByNumero(numero_deposito) {
        const [rows] = await pool.execute(
            `SELECT * FROM depositos WHERE numero_deposito LIKE ?`,
            [`%${numero_deposito}%`]
        );
        return rows;
    }

    /**
     * Actualizar un depósito
     */
    static async update(id, depositoData) {
        const { numero_deposito, paciente_nombre, monto } = depositoData;

        const [result] = await pool.execute(
            `UPDATE depositos 
             SET numero_deposito = ?, paciente_nombre = ?, monto = ?
             WHERE id = ?`,
            [numero_deposito, paciente_nombre, monto, id]
        );

        return result.affectedRows > 0;
    }

    /**
     * Eliminar un depósito
     */
    static async delete(id) {
        const [result] = await pool.execute(
            `DELETE FROM depositos WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    /**
     * Verificar cuadre de depósitos vs ventas por depósito
     */
    static async verificarCuadre(turno_id, connection = null) {
        const db = connection || pool;

        // Total de depósitos registrados
        const [depositosResult] = await db.execute(
            `SELECT COALESCE(SUM(monto), 0) as total_depositos FROM depositos WHERE turno_id = ?`,
            [turno_id]
        );

        // Total de ventas por depósito
        const [ventasResult] = await db.execute(
            `SELECT COALESCE(SUM(deposito_monto), 0) as total_ventas_deposito FROM ventas WHERE turno_id = ?`,
            [turno_id]
        );

        const totalDepositos = parseFloat(depositosResult[0].total_depositos);
        const totalVentasDeposito = parseFloat(ventasResult[0].total_ventas_deposito);
        const diferencia = totalDepositos - totalVentasDeposito;

        return {
            total_depositos_registrados: totalDepositos,
            total_ventas_deposito: totalVentasDeposito,
            diferencia: diferencia,
            cuadra: Math.abs(diferencia) < 0.01
        };
    }
}

module.exports = Deposito;