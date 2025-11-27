// models/CasaMedica.js
// Modelo para gestión de casas médicas (laboratorios)

const { pool } = require('../config/database');

class CasaMedica {
    
    // Obtener todas las casas médicas activas
    static async findAll() {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM laboratorios WHERE activo = 1 ORDER BY nombre'
            );
            console.log(`🏭 ${rows.length} casas médicas encontradas`);
            return rows;
        } catch (error) {
            console.error('❌ Error obteniendo casas médicas:', error.message);
            throw error;
        }
    }

    // Crear nueva casa médica
    static async create(datos) {
        try {
            // Verificar si existe una con el mismo nombre (activa o inactiva)
            const [existing] = await pool.execute(
                'SELECT id, activo FROM laboratorios WHERE nombre = ?',
                [datos.nombre]
            );

            // Si existe y está inactiva, reactivarla
            if (existing.length > 0 && existing[0].activo === 0) {
                const updateQuery = `
                    UPDATE laboratorios 
                    SET activo = 1, descripcion = ?
                    WHERE id = ?
                `;
                await pool.execute(updateQuery, [datos.descripcion || null, existing[0].id]);
                
                console.log('✅ Casa médica reactivada:', {
                    id: existing[0].id,
                    nombre: datos.nombre
                });
                
                return existing[0].id;
            }

            // Si existe y está activa, error
            if (existing.length > 0 && existing[0].activo === 1) {
                throw new Error('Ya existe una casa médica con ese nombre');
            }

            // Si no existe, crear nueva
            const query = `
                INSERT INTO laboratorios (
                    nombre, 
                    descripcion, 
                    activo
                ) VALUES (?, ?, ?)
            `;

            const params = [
                datos.nombre,
                datos.descripcion || null,
                datos.activo !== undefined ? datos.activo : true
            ];

            const [result] = await pool.execute(query, params);

            console.log('✅ Casa médica creada exitosamente:', {
                id: result.insertId,
                nombre: datos.nombre
            });

            return result.insertId;
        } catch (error) {
            console.error('❌ Error creando casa médica:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe una casa médica con ese nombre');
            }
            throw error;
        }
    }

    // Eliminar casa médica (soft delete)
    static async delete(id) {
        try {
            // Verificar si hay medicamentos usando esta casa médica
            const [medicamentos] = await pool.execute(
                'SELECT COUNT(*) as total FROM medicamentos WHERE laboratorio_id = ? AND activo = 1',
                [id]
            );

            if (medicamentos[0].total > 0) {
                throw new Error(`No se puede eliminar. Hay ${medicamentos[0].total} medicamento(s) usando esta casa médica`);
            }

            const query = `
                UPDATE laboratorios SET
                    activo = 0
                WHERE id = ? AND activo = 1
            `;

            const [result] = await pool.execute(query, [id]);

            if (result.affectedRows === 0) {
                throw new Error('Casa médica no encontrada');
            }

            console.log('✅ Casa médica eliminada exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error eliminando casa médica:', error);
            throw error;
        }
    }
}

module.exports = CasaMedica;