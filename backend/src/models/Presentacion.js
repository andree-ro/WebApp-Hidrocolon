// models/Presentacion.js
// Modelo para gestión de presentaciones de medicamentos

const { pool } = require('../config/database');

class Presentacion {
    
    // Obtener todas las presentaciones activas
    static async findAll() {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM presentaciones WHERE activo = 1 ORDER BY nombre'
            );
            console.log(`📋 ${rows.length} presentaciones encontradas`);
            return rows;
        } catch (error) {
            console.error('❌ Error obteniendo presentaciones:', error.message);
            throw error;
        }
    }

    // Crear nueva presentación
    // Crear nueva presentación
static async create(datos) {
    try {
        // Verificar si existe una con el mismo nombre (activa o inactiva)
        const [existing] = await pool.execute(
            'SELECT id, activo FROM presentaciones WHERE nombre = ?',
            [datos.nombre]
        );

        // Si existe y está inactiva, reactivarla
        if (existing.length > 0 && existing[0].activo === 0) {
            const updateQuery = `
                UPDATE presentaciones 
                SET activo = 1, descripcion = ?
                WHERE id = ?
            `;
            await pool.execute(updateQuery, [datos.descripcion || null, existing[0].id]);
            
            console.log('✅ Presentación reactivada:', {
                id: existing[0].id,
                nombre: datos.nombre
            });
            
            return existing[0].id;
        }

        // Si existe y está activa, error
        if (existing.length > 0 && existing[0].activo === 1) {
            throw new Error('Ya existe una presentación con ese nombre');
        }

        // Si no existe, crear nueva
        const query = `
            INSERT INTO presentaciones (
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

        console.log('✅ Presentación creada exitosamente:', {
            id: result.insertId,
            nombre: datos.nombre
        });

        return result.insertId;
    } catch (error) {
        console.error('❌ Error creando presentación:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('Ya existe una presentación con ese nombre');
        }
        throw error;
    }
}

    // Eliminar presentación (soft delete)
    static async delete(id) {
        try {
            // Verificar si hay medicamentos usando esta presentación
            const [medicamentos] = await pool.execute(
                'SELECT COUNT(*) as total FROM medicamentos WHERE presentacion_id = ? AND activo = 1',
                [id]
            );

            if (medicamentos[0].total > 0) {
                throw new Error(`No se puede eliminar. Hay ${medicamentos[0].total} medicamento(s) usando esta presentación`);
            }

            const query = `
                UPDATE presentaciones SET
                    activo = 0
                WHERE id = ? AND activo = 1
            `;

            const [result] = await pool.execute(query, [id]);

            if (result.affectedRows === 0) {
                throw new Error('Presentación no encontrada');
            }

            console.log('✅ Presentación eliminada exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error eliminando presentación:', error);
            throw error;
        }
    }
}

module.exports = Presentacion;