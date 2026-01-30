// backend/src/models/LibroBancos.js
// Modelo para gestión del Libro de Bancos del Sistema Hidrocolon

const { pool } = require('../config/database');

class LibroBancos {
    // ============================================================================
    // OBTENER SALDO INICIAL
    // ============================================================================
    static async obtenerSaldoInicial() {
        try {
            const [resultado] = await pool.execute(
                `SELECT saldo_inicial, fecha_registro, usuario_registro_id
                 FROM saldo_inicial_bancos
                 WHERE activo = 1
                 ORDER BY fecha_registro DESC
                 LIMIT 1`
            );

            if (resultado.length === 0) {
                return null;
            }

            return {
                saldo_inicial: parseFloat(resultado[0].saldo_inicial),
                fecha_registro: resultado[0].fecha_registro,
                usuario_registro_id: resultado[0].usuario_registro_id
            };
        } catch (error) {
            console.error('❌ Error obteniendo saldo inicial:', error);
            throw error;
        }
    }

    // ============================================================================
    // REGISTRAR SALDO INICIAL
    // ============================================================================
    static async registrarSaldoInicial(saldoInicial, usuarioId, observaciones = null) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Desactivar cualquier saldo inicial anterior
            await connection.execute(
                'UPDATE saldo_inicial_bancos SET activo = 0'
            );

            // Insertar nuevo saldo inicial
            const [result] = await connection.execute(
                `INSERT INTO saldo_inicial_bancos 
                 (saldo_inicial, usuario_registro_id, observaciones)
                 VALUES (?, ?, ?)`,
                [saldoInicial, usuarioId, observaciones]
            );

            await connection.commit();

            console.log(`✅ Saldo inicial registrado: Q${saldoInicial}`);

            return {
                success: true,
                id: result.insertId,
                saldo_inicial: parseFloat(saldoInicial),
                message: 'Saldo inicial registrado exitosamente'
            };

        } catch (error) {
            if (connection) await connection.rollback();
            console.error('❌ Error registrando saldo inicial:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    // ============================================================================
    // CALCULAR SALDO ACTUAL (basado en todas las operaciones)
    // ============================================================================
    static async calcularSaldoActual(fechaHasta = null) {
        try {
            // Obtener saldo inicial
            const saldoInicialData = await this.obtenerSaldoInicial();
            if (!saldoInicialData) {
                throw new Error('No se ha registrado un saldo inicial en bancos');
            }

            let saldoActual = saldoInicialData.saldo_inicial;

            // Construir query para sumar/restar operaciones
            let query = `
                SELECT 
                    SUM(ingreso) as total_ingresos,
                    SUM(egreso) as total_egresos
                FROM libro_bancos
                WHERE 1=1
            `;
            const params = [];

            if (fechaHasta) {
                query += ' AND fecha <= ?';
                params.push(fechaHasta);
            }

            const [operaciones] = await pool.execute(query, params);

            const totalIngresos = parseFloat(operaciones[0].total_ingresos || 0);
            const totalEgresos = parseFloat(operaciones[0].total_egresos || 0);

            saldoActual = saldoActual + totalIngresos - totalEgresos;

            return {
                saldo_inicial: saldoInicialData.saldo_inicial,
                total_ingresos: totalIngresos,
                total_egresos: totalEgresos,
                saldo_actual: parseFloat(saldoActual.toFixed(2))
            };

        } catch (error) {
            console.error('❌ Error calculando saldo actual:', error);
            throw error;
        }
    }

    // ============================================================================
    // CREAR OPERACIÓN EN LIBRO DE BANCOS
    // ============================================================================
    static async crearOperacion(datos) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Validar que exista saldo inicial
            const saldoInicialData = await this.obtenerSaldoInicial();
            if (!saldoInicialData) {
                throw new Error('Debe registrar un saldo inicial antes de crear operaciones');
            }

            // Calcular saldo después de esta operación
            // Obtener el saldo de la última operación antes de esta fecha
            const [ultimaOperacion] = await connection.execute(
                `SELECT saldo_bancos FROM libro_bancos
                 WHERE fecha <= ? 
                 ORDER BY fecha DESC, id DESC 
                 LIMIT 1`,
                [datos.fecha]
            );

            let saldoAnterior;
            if (ultimaOperacion.length > 0) {
                saldoAnterior = parseFloat(ultimaOperacion[0].saldo_bancos);
            } else {
                saldoAnterior = saldoInicialData.saldo_inicial;
            }

            // Calcular nuevo saldo
            const ingreso = parseFloat(datos.ingreso || 0);
            const egreso = parseFloat(datos.egreso || 0);
            const nuevoSaldo = saldoAnterior + ingreso - egreso;

            // Insertar operación
            const [result] = await connection.execute(
                `INSERT INTO libro_bancos (
                    fecha, beneficiario, descripcion, clasificacion,
                    tipo_operacion, numero_cheque, numero_deposito,
                    ingreso, egreso, saldo_bancos, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    datos.fecha,
                    datos.beneficiario,
                    datos.descripcion,
                    datos.clasificacion || null,
                    datos.tipo_operacion,
                    datos.numero_cheque || null,
                    datos.numero_deposito || null,
                    ingreso,
                    egreso,
                    nuevoSaldo,
                    datos.usuario_registro_id
                ]
            );

            // Recalcular saldos de operaciones posteriores
            await this.recalcularSaldosPosteriores(connection, datos.fecha, result.insertId);

            await connection.commit();

            console.log(`✅ Operación creada: ${datos.tipo_operacion} Q${ingreso || egreso}`);

            // Obtener operación creada
            const operacionCreada = await this.obtenerPorId(result.insertId);

            return {
                success: true,
                data: operacionCreada,
                message: 'Operación registrada exitosamente'
            };

        } catch (error) {
            if (connection) await connection.rollback();
            console.error('❌ Error creando operación:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    // ============================================================================
    // RECALCULAR SALDOS POSTERIORES A UNA FECHA
    // ============================================================================
    static async recalcularSaldosPosteriores(connection, fechaDesde, operacionIdExcluir = null) {
        try {
            // Obtener saldo anterior a esta fecha
            const [operacionAnterior] = await connection.execute(
                `SELECT saldo_bancos FROM libro_bancos
                 WHERE fecha < ? 
                 ${operacionIdExcluir ? 'OR (fecha = ? AND id < ?)' : ''}
                 ORDER BY fecha DESC, id DESC 
                 LIMIT 1`,
                operacionIdExcluir ? [fechaDesde, fechaDesde, operacionIdExcluir] : [fechaDesde]
            );

            let saldoActual;
            if (operacionAnterior.length > 0) {
                saldoActual = parseFloat(operacionAnterior[0].saldo_bancos);
            } else {
                const saldoInicial = await this.obtenerSaldoInicial();
                saldoActual = saldoInicial.saldo_inicial;
            }

            // Obtener todas las operaciones desde esta fecha en adelante
            const [operacionesPosteriores] = await connection.execute(
                `SELECT id, ingreso, egreso 
                 FROM libro_bancos 
                 WHERE fecha >= ? 
                 ${operacionIdExcluir ? 'AND id != ?' : ''}
                 ORDER BY fecha ASC, id ASC`,
                operacionIdExcluir ? [fechaDesde, operacionIdExcluir] : [fechaDesde]
            );

            // Recalcular y actualizar cada saldo
            for (const operacion of operacionesPosteriores) {
                saldoActual = saldoActual + parseFloat(operacion.ingreso) - parseFloat(operacion.egreso);
                await connection.execute(
                    'UPDATE libro_bancos SET saldo_bancos = ? WHERE id = ?',
                    [saldoActual, operacion.id]
                );
            }

            console.log(`✅ Saldos recalculados desde ${fechaDesde}`);

        } catch (error) {
            console.error('❌ Error recalculando saldos:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER OPERACIÓN POR ID
    // ============================================================================
    static async obtenerPorId(id) {
        try {
            const [operaciones] = await pool.execute(
                `SELECT lb.*, u.nombres, u.apellidos
                 FROM libro_bancos lb
                 LEFT JOIN usuarios u ON lb.usuario_registro_id = u.id
                 WHERE lb.id = ?`,
                [id]
            );

            if (operaciones.length === 0) {
                return null;
            }

            return operaciones[0];
        } catch (error) {
            console.error('❌ Error obteniendo operación:', error);
            throw error;
        }
    }

    // ============================================================================
    // LISTAR OPERACIONES CON FILTROS
    // ============================================================================
    static async listar(filtros = {}) {
        try {
            let query = `
                SELECT lb.*, u.nombres, u.apellidos
                FROM libro_bancos lb
                LEFT JOIN usuarios u ON lb.usuario_registro_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (filtros.fecha_inicio && filtros.fecha_fin) {
                query += ' AND lb.fecha BETWEEN ? AND ?';
                params.push(filtros.fecha_inicio, filtros.fecha_fin);
            }

            if (filtros.tipo_operacion) {
                query += ' AND lb.tipo_operacion = ?';
                params.push(filtros.tipo_operacion);
            }

            if (filtros.beneficiario) {
                query += ' AND lb.beneficiario LIKE ?';
                params.push(`%${filtros.beneficiario}%`);
            }

            query += ' ORDER BY lb.fecha DESC, lb.id DESC';

            if (filtros.limit) {
                query += ' LIMIT ?';
                params.push(parseInt(filtros.limit));
            }

            const [operaciones] = await pool.execute(query, params);

            return operaciones;

        } catch (error) {
            console.error('❌ Error listando operaciones:', error);
            throw error;
        }
    }

    // ============================================================================
    // ACTUALIZAR OPERACIÓN
    // ============================================================================
    static async actualizar(id, datos) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Verificar que la operación existe
            const operacionExistente = await this.obtenerPorId(id);
            if (!operacionExistente) {
                throw new Error('Operación no encontrada');
            }

            // Actualizar operación
            const updates = [];
            const params = [];

            if (datos.fecha !== undefined) {
                updates.push('fecha = ?');
                params.push(datos.fecha);
            }
            if (datos.beneficiario !== undefined) {
                updates.push('beneficiario = ?');
                params.push(datos.beneficiario);
            }
            if (datos.descripcion !== undefined) {
                updates.push('descripcion = ?');
                params.push(datos.descripcion);
            }
            if (datos.clasificacion !== undefined) {
                updates.push('clasificacion = ?');
                params.push(datos.clasificacion);
            }
            if (datos.tipo_operacion !== undefined) {
                updates.push('tipo_operacion = ?');
                params.push(datos.tipo_operacion);
            }
            if (datos.numero_cheque !== undefined) {
                updates.push('numero_cheque = ?');
                params.push(datos.numero_cheque);
            }
            if (datos.numero_deposito !== undefined) {
                updates.push('numero_deposito = ?');
                params.push(datos.numero_deposito);
            }
            if (datos.ingreso !== undefined) {
                updates.push('ingreso = ?');
                params.push(parseFloat(datos.ingreso));
            }
            if (datos.egreso !== undefined) {
                updates.push('egreso = ?');
                params.push(parseFloat(datos.egreso));
            }

            if (updates.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            params.push(id);

            await connection.execute(
                `UPDATE libro_bancos SET ${updates.join(', ')} WHERE id = ?`,
                params
            );

            // Recalcular saldos desde esta operación en adelante
            const fechaRecalculo = datos.fecha || operacionExistente.fecha;
            await this.recalcularSaldosPosteriores(connection, fechaRecalculo);

            await connection.commit();

            console.log(`✅ Operación ${id} actualizada`);

            const operacionActualizada = await this.obtenerPorId(id);

            return {
                success: true,
                data: operacionActualizada,
                message: 'Operación actualizada exitosamente'
            };

        } catch (error) {
            if (connection) await connection.rollback();
            console.error('❌ Error actualizando operación:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    // ============================================================================
    // ELIMINAR OPERACIÓN
    // ============================================================================
    static async eliminar(id) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Obtener operación antes de eliminar
            const operacion = await this.obtenerPorId(id);
            if (!operacion) {
                throw new Error('Operación no encontrada');
            }

            // Eliminar operación
            await connection.execute('DELETE FROM libro_bancos WHERE id = ?', [id]);

            // Recalcular saldos posteriores
            await this.recalcularSaldosPosteriores(connection, operacion.fecha);

            await connection.commit();

            console.log(`✅ Operación ${id} eliminada`);

            return {
                success: true,
                message: 'Operación eliminada exitosamente'
            };

        } catch (error) {
            if (connection) await connection.rollback();
            console.error('❌ Error eliminando operación:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    // ============================================================================
    // OBTENER RESUMEN POR PERÍODO
    // ============================================================================
    static async obtenerResumen(fechaInicio, fechaFin) {
        try {
            const [resumen] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_operaciones,
                    SUM(CASE WHEN tipo_operacion = 'ingreso' THEN 1 ELSE 0 END) as total_ingresos_count,
                    SUM(CASE WHEN tipo_operacion = 'egreso' THEN 1 ELSE 0 END) as total_egresos_count,
                    SUM(ingreso) as total_ingresos,
                    SUM(egreso) as total_egresos
                 FROM libro_bancos
                 WHERE fecha BETWEEN ? AND ?`,
                [fechaInicio, fechaFin]
            );

            return {
                total_operaciones: resumen[0].total_operaciones,
                total_ingresos_count: resumen[0].total_ingresos_count,
                total_egresos_count: resumen[0].total_egresos_count,
                total_ingresos: parseFloat(resumen[0].total_ingresos || 0),
                total_egresos: parseFloat(resumen[0].total_egresos || 0),
                diferencia: parseFloat((resumen[0].total_ingresos || 0) - (resumen[0].total_egresos || 0))
            };

        } catch (error) {
            console.error('❌ Error obteniendo resumen:', error);
            throw error;
        }
    }

    // ============================================================================
    // LISTAR OPERACIONES AGRUPADAS POR FECHA (para vista consolidada diaria)
    // ============================================================================
    static async listarAgrupadasPorFecha(filtros = {}) {
        try {
            // Query para obtener operaciones agrupadas por fecha
            let query = `
                SELECT 
                    lb.fecha,
                    SUM(lb.ingreso) as total_ingresos_dia,
                    SUM(lb.egreso) as total_egresos_dia,
                    SUM(lb.ingreso) - SUM(lb.egreso) as movimiento_neto_dia,
                    COUNT(*) as cantidad_operaciones,
                    (SELECT lb2.saldo_bancos 
                    FROM libro_bancos lb2 
                    WHERE lb2.fecha = lb.fecha 
                    ORDER BY lb2.id DESC 
                    LIMIT 1) as saldo_final_dia
                FROM libro_bancos lb
                WHERE 1=1
            `;
            const params = [];

            // Aplicar filtros
            if (filtros.fecha_inicio && filtros.fecha_fin) {
                query += ' AND lb.fecha BETWEEN ? AND ?';
                params.push(filtros.fecha_inicio, filtros.fecha_fin);
            }

            if (filtros.tipo_operacion) {
                query += ' AND lb.tipo_operacion = ?';
                params.push(filtros.tipo_operacion);
            }

            // Agrupar por fecha
            query += ' GROUP BY lb.fecha';
            query += ' ORDER BY lb.fecha DESC';

            if (filtros.limit) {
                query += ' LIMIT ?';
                params.push(parseInt(filtros.limit));
            }

            const [operacionesAgrupadas] = await pool.execute(query, params);

            return operacionesAgrupadas.map(op => {
                // Convertir fecha a string YYYY-MM-DD
                const fecha = op.fecha instanceof Date 
                    ? op.fecha.toISOString().split('T')[0]
                    : op.fecha;
                
                return {
                    fecha: fecha,
                    total_ingresos_dia: parseFloat(op.total_ingresos_dia || 0),
                    total_egresos_dia: parseFloat(op.total_egresos_dia || 0),
                    movimiento_neto_dia: parseFloat(op.movimiento_neto_dia || 0),
                    cantidad_operaciones: parseInt(op.cantidad_operaciones),
                    saldo_final_dia: parseFloat(op.saldo_final_dia || 0)
                };
            });

        } catch (error) {
            console.error('❌ Error listando operaciones agrupadas:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER DETALLE DE OPERACIONES DE UN DÍA ESPECÍFICO
    // ============================================================================
    static async obtenerDetalleDelDia(fecha) {
        try {
            const query = `
                SELECT lb.*, u.nombres, u.apellidos
                FROM libro_bancos lb
                LEFT JOIN usuarios u ON lb.usuario_registro_id = u.id
                WHERE lb.fecha = ?
                ORDER BY lb.id ASC
            `;

            const [operaciones] = await pool.execute(query, [fecha]);

            return operaciones;

        } catch (error) {
            console.error('❌ Error obteniendo detalle del día:', error);
            throw error;
        }
    }
}

module.exports = LibroBancos;