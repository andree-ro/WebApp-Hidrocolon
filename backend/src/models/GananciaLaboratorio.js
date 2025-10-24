// backend/src/models/GananciaLaboratorio.js
const { pool } = require('../config/database');

class GananciaLaboratorio {
    // ============================================================================
    // CREAR NUEVA GANANCIA DE LABORATORIO
    // ============================================================================
    static async crear(datos) {
        try {
            console.log('🧪 Creando nueva ganancia de laboratorio...');

            // Validaciones
            if (!datos.concepto || datos.concepto.trim() === '') {
                throw new Error('El concepto es requerido');
            }
            if (!datos.monto || datos.monto <= 0) {
                throw new Error('El monto debe ser mayor a 0');
            }
            if (!datos.fecha_ganancia) {
                throw new Error('La fecha de ganancia es requerida');
            }
            if (!datos.usuario_registro_id) {
                throw new Error('El ID del usuario es requerido');
            }

            const [result] = await pool.execute(
                `INSERT INTO ganancias_laboratorios (
                    concepto,
                    monto,
                    fecha_ganancia,
                    laboratorio_origen,
                    tipo_ganancia,
                    incluir_en_cierre,
                    turno_id,
                    usuario_registro_id,
                    observaciones
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    datos.concepto.trim(),
                    datos.monto,
                    datos.fecha_ganancia,
                    datos.laboratorio_origen || null,
                    datos.tipo_ganancia || 'otro',
                    datos.incluir_en_cierre !== false, // Por defecto TRUE
                    datos.turno_id || null,
                    datos.usuario_registro_id,
                    datos.observaciones || null
                ]
            );

            const gananciaId = result.insertId;

            // Si está asociada a un turno, actualizar el total de ganancias del turno
            if (datos.turno_id && datos.incluir_en_cierre !== false) {
                await pool.execute(
                    `UPDATE turnos 
                     SET total_ganancias_laboratorios = total_ganancias_laboratorios + ?
                     WHERE id = ?`,
                    [datos.monto, datos.turno_id]
                );
            }

            console.log(`✅ Ganancia de laboratorio creada con ID: ${gananciaId}`);

            // Retornar la ganancia creada
            return await this.obtenerPorId(gananciaId);

        } catch (error) {
            console.error('❌ Error creando ganancia de laboratorio:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER GANANCIA POR ID
    // ============================================================================
    static async obtenerPorId(id) {
        try {
            console.log(`🔍 Obteniendo ganancia de laboratorio ID: ${id}`);

            const [ganancias] = await pool.execute(
                `SELECT 
                    gl.*,
                    u.nombres as usuario_nombres,
                    u.apellidos as usuario_apellidos
                FROM ganancias_laboratorios gl
                INNER JOIN usuarios u ON gl.usuario_registro_id = u.id
                WHERE gl.id = ?`,
                [id]
            );

            if (ganancias.length === 0) {
                return null;
            }

            console.log(`✅ Ganancia obtenida: ${ganancias[0].concepto}`);

            return ganancias[0];

        } catch (error) {
            console.error(`❌ Error obteniendo ganancia ID ${id}:`, error);
            throw error;
        }
    }

    // ============================================================================
    // LISTAR GANANCIAS CON FILTROS
    // ============================================================================
    static async listar(filtros = {}) {
        try {
            console.log('📋 Listando ganancias de laboratorios...');

            let whereConditions = ['1=1'];
            let queryParams = [];

            // Filtros
            if (filtros.fecha_inicio && filtros.fecha_fin) {
                whereConditions.push('DATE(gl.fecha_ganancia) BETWEEN ? AND ?');
                queryParams.push(filtros.fecha_inicio, filtros.fecha_fin);
            }

            if (filtros.tipo_ganancia) {
                whereConditions.push('gl.tipo_ganancia = ?');
                queryParams.push(filtros.tipo_ganancia);
            }

            if (filtros.laboratorio_origen) {
                whereConditions.push('gl.laboratorio_origen LIKE ?');
                queryParams.push(`%${filtros.laboratorio_origen}%`);
            }

            if (filtros.incluir_en_cierre !== undefined) {
                whereConditions.push('gl.incluir_en_cierre = ?');
                queryParams.push(filtros.incluir_en_cierre);
            }

            if (filtros.turno_id) {
                whereConditions.push('gl.turno_id = ?');
                queryParams.push(filtros.turno_id);
            }

            const whereClause = whereConditions.join(' AND ');

            const [ganancias] = await pool.execute(
                `SELECT 
                    gl.*,
                    u.nombres as usuario_nombres,
                    u.apellidos as usuario_apellidos
                FROM ganancias_laboratorios gl
                INNER JOIN usuarios u ON gl.usuario_registro_id = u.id
                WHERE ${whereClause}
                ORDER BY gl.fecha_ganancia DESC, gl.id DESC`,
                queryParams
            );

            console.log(`✅ ${ganancias.length} ganancias encontradas`);

            return ganancias;

        } catch (error) {
            console.error('❌ Error listando ganancias:', error);
            throw error;
        }
    }

    // ============================================================================
    // ACTUALIZAR GANANCIA
    // ============================================================================
    static async actualizar(id, datos) {
        let connection;
        
        try {
            console.log(`✏️ Actualizando ganancia de laboratorio ID: ${id}`);

            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Obtener ganancia actual
            const gananciaActual = await this.obtenerPorId(id);
            
            if (!gananciaActual) {
                throw new Error('Ganancia no encontrada');
            }

            // Preparar datos de actualización
            const concepto = datos.concepto || gananciaActual.concepto;
            const monto = datos.monto !== undefined ? datos.monto : gananciaActual.monto;
            const fecha_ganancia = datos.fecha_ganancia || gananciaActual.fecha_ganancia;
            const laboratorio_origen = datos.laboratorio_origen !== undefined ? datos.laboratorio_origen : gananciaActual.laboratorio_origen;
            const tipo_ganancia = datos.tipo_ganancia || gananciaActual.tipo_ganancia;
            const incluir_en_cierre = datos.incluir_en_cierre !== undefined ? datos.incluir_en_cierre : gananciaActual.incluir_en_cierre;
            const observaciones = datos.observaciones !== undefined ? datos.observaciones : gananciaActual.observaciones;

            // Si cambió el monto o el flag de incluir_en_cierre y está asociado a un turno
            if (gananciaActual.turno_id) {
                const montoAnterior = gananciaActual.incluir_en_cierre ? parseFloat(gananciaActual.monto) : 0;
                const montoNuevo = incluir_en_cierre ? parseFloat(monto) : 0;
                const diferencia = montoNuevo - montoAnterior;

                if (diferencia !== 0) {
                    await connection.execute(
                        `UPDATE turnos 
                         SET total_ganancias_laboratorios = total_ganancias_laboratorios + ?
                         WHERE id = ?`,
                        [diferencia, gananciaActual.turno_id]
                    );
                }
            }

            // Actualizar ganancia
            await connection.execute(
                `UPDATE ganancias_laboratorios 
                 SET concepto = ?,
                     monto = ?,
                     fecha_ganancia = ?,
                     laboratorio_origen = ?,
                     tipo_ganancia = ?,
                     incluir_en_cierre = ?,
                     observaciones = ?,
                     fecha_actualizacion = NOW()
                 WHERE id = ?`,
                [
                    concepto,
                    monto,
                    fecha_ganancia,
                    laboratorio_origen,
                    tipo_ganancia,
                    incluir_en_cierre,
                    observaciones,
                    id
                ]
            );

            await connection.commit();

            console.log('✅ Ganancia actualizada exitosamente');

            // Retornar ganancia actualizada
            return await this.obtenerPorId(id);

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('❌ Error actualizando ganancia:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    // ============================================================================
    // ELIMINAR GANANCIA
    // ============================================================================
    static async eliminar(id) {
        let connection;
        
        try {
            console.log(`🗑️ Eliminando ganancia de laboratorio ID: ${id}`);

            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Obtener ganancia actual
            const ganancia = await this.obtenerPorId(id);
            
            if (!ganancia) {
                throw new Error('Ganancia no encontrada');
            }

            // Si está asociada a un turno y estaba incluida en cierre, revertir el monto
            if (ganancia.turno_id && ganancia.incluir_en_cierre) {
                await connection.execute(
                    `UPDATE turnos 
                     SET total_ganancias_laboratorios = total_ganancias_laboratorios - ?
                     WHERE id = ?`,
                    [ganancia.monto, ganancia.turno_id]
                );
            }

            // Eliminar ganancia
            await connection.execute(
                'DELETE FROM ganancias_laboratorios WHERE id = ?',
                [id]
            );

            await connection.commit();

            console.log('✅ Ganancia eliminada exitosamente');

            return {
                success: true,
                message: 'Ganancia eliminada correctamente'
            };

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('❌ Error eliminando ganancia:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    // ============================================================================
    // OBTENER TOTALES POR PERÍODO
    // ============================================================================
    static async obtenerTotalesPorPeriodo(fechaInicio, fechaFin, incluirSoloEnCierre = false) {
        try {
            console.log(`📊 Calculando totales de ganancias del ${fechaInicio} al ${fechaFin}`);

            let whereConditions = ['DATE(fecha_ganancia) BETWEEN ? AND ?'];
            let queryParams = [fechaInicio, fechaFin];

            if (incluirSoloEnCierre) {
                whereConditions.push('incluir_en_cierre = TRUE');
            }

            const whereClause = whereConditions.join(' AND ');

            const [totales] = await pool.execute(
                `SELECT 
                    COUNT(*) as cantidad_ganancias,
                    SUM(monto) as monto_total,
                    SUM(CASE WHEN incluir_en_cierre = TRUE THEN monto ELSE 0 END) as monto_incluido_cierre,
                    SUM(CASE WHEN incluir_en_cierre = FALSE THEN monto ELSE 0 END) as monto_excluido_cierre,
                    AVG(monto) as promedio_ganancia,
                    tipo_ganancia,
                    COUNT(*) as cantidad_por_tipo,
                    SUM(monto) as monto_por_tipo
                FROM ganancias_laboratorios
                WHERE ${whereClause}
                GROUP BY tipo_ganancia
                WITH ROLLUP`,
                queryParams
            );

            // Totales generales (última fila con GROUP BY ROLLUP)
            const totalesGenerales = totales[totales.length - 1];

            // Totales por tipo
            const totalesPorTipo = totales.slice(0, -1).map(t => ({
                tipo_ganancia: t.tipo_ganancia,
                cantidad: t.cantidad_por_tipo,
                monto: parseFloat(t.monto_por_tipo || 0)
            }));

            console.log(`✅ Totales calculados: Q${totalesGenerales.monto_total || 0}`);

            return {
                periodo: {
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin
                },
                totales: {
                    cantidad_ganancias: totalesGenerales.cantidad_ganancias || 0,
                    monto_total: parseFloat(totalesGenerales.monto_total || 0),
                    monto_incluido_cierre: parseFloat(totalesGenerales.monto_incluido_cierre || 0),
                    monto_excluido_cierre: parseFloat(totalesGenerales.monto_excluido_cierre || 0),
                    promedio_ganancia: parseFloat(totalesGenerales.promedio_ganancia || 0)
                },
                por_tipo: totalesPorTipo
            };

        } catch (error) {
            console.error('❌ Error calculando totales por período:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER GANANCIAS POR TURNO
    // ============================================================================
    static async obtenerPorTurno(turnoId) {
        try {
            console.log(`🔍 Obteniendo ganancias de laboratorios para turno ID: ${turnoId}`);

            const [ganancias] = await pool.execute(
                `SELECT 
                    gl.*,
                    u.nombres as usuario_nombres,
                    u.apellidos as usuario_apellidos
                FROM ganancias_laboratorios gl
                INNER JOIN usuarios u ON gl.usuario_registro_id = u.id
                WHERE gl.turno_id = ?
                ORDER BY gl.fecha_ganancia DESC, gl.id DESC`,
                [turnoId]
            );

            const montoTotal = ganancias.reduce((sum, g) => {
                return sum + (g.incluir_en_cierre ? parseFloat(g.monto) : 0);
            }, 0);

            console.log(`✅ ${ganancias.length} ganancias encontradas para el turno (Total: Q${montoTotal.toFixed(2)})`);

            return {
                ganancias,
                resumen: {
                    cantidad_total: ganancias.length,
                    cantidad_incluidas: ganancias.filter(g => g.incluir_en_cierre).length,
                    monto_total: parseFloat(montoTotal.toFixed(2))
                }
            };

        } catch (error) {
            console.error('❌ Error obteniendo ganancias por turno:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER ESTADÍSTICAS GENERALES
    // ============================================================================
    static async obtenerEstadisticas(filtros = {}) {
        try {
            console.log('📊 Obteniendo estadísticas de ganancias de laboratorios...');

            let whereConditions = ['1=1'];
            let queryParams = [];

            if (filtros.fecha_inicio && filtros.fecha_fin) {
                whereConditions.push('DATE(fecha_ganancia) BETWEEN ? AND ?');
                queryParams.push(filtros.fecha_inicio, filtros.fecha_fin);
            }

            const whereClause = whereConditions.join(' AND ');

            const [stats] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_ganancias,
                    SUM(monto) as monto_total,
                    SUM(CASE WHEN incluir_en_cierre = TRUE THEN monto ELSE 0 END) as monto_incluido,
                    SUM(CASE WHEN incluir_en_cierre = FALSE THEN monto ELSE 0 END) as monto_excluido,
                    AVG(monto) as promedio_ganancia,
                    MAX(monto) as ganancia_maxima,
                    MIN(monto) as ganancia_minima,
                    COUNT(DISTINCT laboratorio_origen) as laboratorios_diferentes,
                    COUNT(DISTINCT DATE(fecha_ganancia)) as dias_con_ganancias
                FROM ganancias_laboratorios
                WHERE ${whereClause}`,
                queryParams
            );

            // Obtener distribución por tipo
            const [porTipo] = await pool.execute(
                `SELECT 
                    tipo_ganancia,
                    COUNT(*) as cantidad,
                    SUM(monto) as monto_total
                FROM ganancias_laboratorios
                WHERE ${whereClause}
                GROUP BY tipo_ganancia
                ORDER BY monto_total DESC`,
                queryParams
            );

            // Obtener top laboratorios
            const [topLaboratorios] = await pool.execute(
                `SELECT 
                    laboratorio_origen,
                    COUNT(*) as cantidad_ganancias,
                    SUM(monto) as monto_total
                FROM ganancias_laboratorios
                WHERE ${whereClause}
                AND laboratorio_origen IS NOT NULL
                GROUP BY laboratorio_origen
                ORDER BY monto_total DESC
                LIMIT 10`,
                queryParams
            );

            console.log('✅ Estadísticas calculadas');

            return {
                resumen: {
                    total_ganancias: stats[0].total_ganancias,
                    monto_total: parseFloat(stats[0].monto_total || 0),
                    monto_incluido_cierre: parseFloat(stats[0].monto_incluido || 0),
                    monto_excluido_cierre: parseFloat(stats[0].monto_excluido || 0),
                    promedio_ganancia: parseFloat(stats[0].promedio_ganancia || 0),
                    ganancia_maxima: parseFloat(stats[0].ganancia_maxima || 0),
                    ganancia_minima: parseFloat(stats[0].ganancia_minima || 0),
                    laboratorios_diferentes: stats[0].laboratorios_diferentes,
                    dias_con_ganancias: stats[0].dias_con_ganancias
                },
                por_tipo: porTipo.map(t => ({
                    tipo: t.tipo_ganancia,
                    cantidad: t.cantidad,
                    monto: parseFloat(t.monto_total)
                })),
                top_laboratorios: topLaboratorios.map(l => ({
                    laboratorio: l.laboratorio_origen,
                    cantidad: l.cantidad_ganancias,
                    monto: parseFloat(l.monto_total)
                }))
            };

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            throw error;
        }
    }

    // ============================================================================
    // CAMBIAR ESTADO DE INCLUIR EN CIERRE
    // ============================================================================
    static async cambiarEstadoIncluirEnCierre(id, incluir) {
        let connection;
        
        try {
            console.log(`🔄 Cambiando estado incluir_en_cierre para ganancia ID: ${id}`);

            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Obtener ganancia actual
            const ganancia = await this.obtenerPorId(id);
            
            if (!ganancia) {
                throw new Error('Ganancia no encontrada');
            }

            // Si está asociada a un turno, actualizar el total
            if (ganancia.turno_id) {
                const estabaIncluida = ganancia.incluir_en_cierre;
                const seIncluira = incluir;

                let diferencia = 0;
                if (estabaIncluida && !seIncluira) {
                    // Se va a excluir
                    diferencia = -parseFloat(ganancia.monto);
                } else if (!estabaIncluida && seIncluira) {
                    // Se va a incluir
                    diferencia = parseFloat(ganancia.monto);
                }

                if (diferencia !== 0) {
                    await connection.execute(
                        `UPDATE turnos 
                         SET total_ganancias_laboratorios = total_ganancias_laboratorios + ?
                         WHERE id = ?`,
                        [diferencia, ganancia.turno_id]
                    );
                }
            }

            // Actualizar el flag
            await connection.execute(
                `UPDATE ganancias_laboratorios 
                 SET incluir_en_cierre = ?,
                     fecha_actualizacion = NOW()
                 WHERE id = ?`,
                [incluir, id]
            );

            await connection.commit();

            console.log('✅ Estado actualizado exitosamente');

            return await this.obtenerPorId(id);

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('❌ Error cambiando estado:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
}

module.exports = GananciaLaboratorio;