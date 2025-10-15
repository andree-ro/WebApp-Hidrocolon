// backend/src/models/Doctora.js
const { pool } = require('../config/database');

class Doctora {
    // ============================================================================
    // LISTAR TODAS LAS DOCTORAS (solo activas por defecto)
    // ============================================================================
    static async findAll(options = {}) {
        try {
            const incluirInactivas = options.incluirInactivas || false;
            
            let query = `
                SELECT 
                    id,
                    nombre,
                    activo,
                    fecha_creacion,
                    fecha_actualizacion
                FROM doctoras
            `;

            if (!incluirInactivas) {
                query += ' WHERE activo = 1';
            }

            query += ' ORDER BY nombre ASC';

            const [doctoras] = await pool.execute(query);
            
            console.log(`✅ ${doctoras.length} doctoras encontradas`);
            return doctoras;

        } catch (error) {
            console.error('❌ Error en Doctora.findAll:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER DOCTORA POR ID
    // ============================================================================
    static async findById(id) {
        try {
            const [doctoras] = await pool.execute(
                'SELECT * FROM doctoras WHERE id = ?',
                [id]
            );

            if (doctoras.length === 0) {
                return null;
            }

            console.log(`✅ Doctora encontrada: ${doctoras[0].nombre}`);
            return doctoras[0];

        } catch (error) {
            console.error(`❌ Error en Doctora.findById(${id}):`, error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER DOCTORA POR NOMBRE
    // ============================================================================
    static async findByNombre(nombre) {
        try {
            const [doctoras] = await pool.execute(
                'SELECT * FROM doctoras WHERE nombre = ?',
                [nombre.trim()]
            );

            return doctoras[0] || null;

        } catch (error) {
            console.error('❌ Error en Doctora.findByNombre:', error);
            throw error;
        }
    }

    // ============================================================================
    // CREAR NUEVA DOCTORA
    // ============================================================================
    static async create(data) {
        try {
            console.log('📝 Creando nueva doctora:', data.nombre);

            // Validación
            if (!data.nombre || data.nombre.trim() === '') {
                throw new Error('El nombre de la doctora es requerido');
            }

            // Verificar que no exista
            const existe = await this.findByNombre(data.nombre);
            if (existe) {
                throw new Error(`La doctora "${data.nombre}" ya existe`);
            }

            const query = `
                INSERT INTO doctoras (nombre, activo)
                VALUES (?, ?)
            `;

            const [result] = await pool.execute(query, [
                data.nombre.trim(),
                data.activo !== undefined ? data.activo : 1
            ]);

            console.log(`✅ Doctora creada con ID: ${result.insertId}`);

            // Retornar la doctora creada
            return await this.findById(result.insertId);

        } catch (error) {
            console.error('❌ Error en Doctora.create:', error);
            throw error;
        }
    }

    // ============================================================================
    // ACTUALIZAR DOCTORA
    // ============================================================================
    static async update(id, data) {
        try {
            console.log(`📝 Actualizando doctora ID: ${id}`);

            // Verificar que existe
            const existe = await this.findById(id);
            if (!existe) {
                throw new Error('Doctora no encontrada');
            }

            // Si se está actualizando el nombre, verificar que no exista otro con ese nombre
            if (data.nombre) {
                const otraDoctora = await this.findByNombre(data.nombre);
                if (otraDoctora && otraDoctora.id !== id) {
                    throw new Error(`Ya existe otra doctora con el nombre "${data.nombre}"`);
                }
            }

            const query = `
                UPDATE doctoras 
                SET nombre = ?,
                    activo = ?,
                    fecha_actualizacion = NOW()
                WHERE id = ?
            `;

            await pool.execute(query, [
                data.nombre ? data.nombre.trim() : existe.nombre,
                data.activo !== undefined ? data.activo : existe.activo,
                id
            ]);

            console.log(`✅ Doctora actualizada: ${data.nombre || existe.nombre}`);

            // Retornar la doctora actualizada
            return await this.findById(id);

        } catch (error) {
            console.error(`❌ Error en Doctora.update(${id}):`, error);
            throw error;
        }
    }

    // ============================================================================
    // ELIMINAR DOCTORA (SOFT DELETE - solo desactiva)
    // ============================================================================
    static async delete(id) {
        try {
            console.log(`🗑️ Desactivando doctora ID: ${id}`);

            // Verificar que existe
            const existe = await this.findById(id);
            if (!existe) {
                throw new Error('Doctora no encontrada');
            }

            // Verificar si tiene ventas asociadas
            const [ventas] = await pool.execute(
                'SELECT COUNT(*) as total FROM detalle_ventas WHERE doctora_id = ?',
                [id]
            );

            if (ventas[0].total > 0) {
                console.log(`⚠️ La doctora tiene ${ventas[0].total} ventas asociadas, solo se desactivará`);
            }

            // Soft delete: solo desactivar
            await pool.execute(
                'UPDATE doctoras SET activo = 0, fecha_actualizacion = NOW() WHERE id = ?',
                [id]
            );

            console.log(`✅ Doctora desactivada: ${existe.nombre}`);

            return {
                success: true,
                message: `Doctora "${existe.nombre}" desactivada correctamente`,
                ventasAsociadas: ventas[0].total
            };

        } catch (error) {
            console.error(`❌ Error en Doctora.delete(${id}):`, error);
            throw error;
        }
    }

    // ============================================================================
    // REACTIVAR DOCTORA
    // ============================================================================
    static async reactivar(id) {
        try {
            console.log(`🔄 Reactivando doctora ID: ${id}`);

            // Verificar que existe
            const existe = await this.findById(id);
            if (!existe) {
                throw new Error('Doctora no encontrada');
            }

            await pool.execute(
                'UPDATE doctoras SET activo = 1, fecha_actualizacion = NOW() WHERE id = ?',
                [id]
            );

            console.log(`✅ Doctora reactivada: ${existe.nombre}`);

            return await this.findById(id);

        } catch (error) {
            console.error(`❌ Error en Doctora.reactivar(${id}):`, error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER ESTADÍSTICAS DE UNA DOCTORA
    // ============================================================================
    static async getEstadisticas(id, options = {}) {
        try {
            let whereConditions = ['dv.doctora_id = ?'];
            let queryParams = [id];

            // Filtro por fechas
            if (options.fecha_inicio && options.fecha_fin) {
                whereConditions.push('DATE(v.fecha_creacion) BETWEEN ? AND ?');
                queryParams.push(options.fecha_inicio, options.fecha_fin);
            }

            const whereClause = whereConditions.join(' AND ');

            const [stats] = await pool.execute(
                `SELECT 
                    COUNT(DISTINCT v.id) as total_ventas,
                    SUM(dv.cantidad) as total_productos,
                    SUM(dv.precio_total) as total_vendido,
                    SUM(dv.monto_comision) as total_comisiones
                 FROM detalle_ventas dv
                 INNER JOIN ventas v ON dv.venta_id = v.id
                 WHERE ${whereClause}`,
                queryParams
            );

            return stats[0];

        } catch (error) {
            console.error(`❌ Error en Doctora.getEstadisticas(${id}):`, error);
            throw error;
        }
    }
}

module.exports = Doctora;