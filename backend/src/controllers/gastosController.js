// backend/src/controllers/gastosController.js
// Controlador para gestión de gastos del Sistema Hidrocolon

const { pool } = require('../config/database');
const LibroBancos = require('../models/LibroBancos');

// ============================================================================
// CREAR NUEVO GASTO
// ============================================================================
const crearGasto = async (req, res) => {
    try {
        const { turno_id, descripcion, monto, tipo_gasto } = req.body;

        // Validaciones
        if (!turno_id || !descripcion || !monto || !tipo_gasto) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: turno_id, descripcion, monto, tipo_gasto'
            });
        }

        // Validar que el turno existe y está abierto
        const [turnos] = await pool.execute(
            'SELECT id, estado FROM turnos WHERE id = ?',
            [turno_id]
        );

        if (turnos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado'
            });
        }

        if (turnos[0].estado !== 'abierto') {
            return res.status(400).json({
                success: false,
                message: 'El turno está cerrado. No se pueden agregar gastos.'
            });
        }

        // Validar tipo de gasto
        const tiposValidos = ['administrativo', 'compras', 'mantenimiento', 'personal', 'servicios', 'otros'];
        if (!tiposValidos.includes(tipo_gasto)) {
            return res.status(400).json({
                success: false,
                message: `Tipo de gasto inválido. Debe ser uno de: ${tiposValidos.join(', ')}`
            });
        }

        // Validar monto
        const montoNumerico = parseFloat(monto);
        if (isNaN(montoNumerico) || montoNumerico <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser un número positivo'
            });
        }

        // Insertar gasto
        const [result] = await pool.execute(
            `INSERT INTO gastos (turno_id, descripcion, monto, tipo_gasto)
             VALUES (?, ?, ?, ?)`,
            [turno_id, descripcion.trim(), montoNumerico, tipo_gasto]
        );

        // Obtener gasto creado
        const [gastos] = await pool.execute(
            'SELECT * FROM gastos WHERE id = ?',
            [result.insertId]
        );

        console.log(`✅ Gasto ${result.insertId} creado: ${tipo_gasto} - Q${montoNumerico}`);
        // Registrar en libro de bancos
        try {
            // Obtener fecha en zona horaria de Guatemala (UTC-6)
            const fechaUTC = new Date(gastos[0].fecha_creacion);
            const offsetGuatemala = -6 * 60; // -6 horas en minutos
            const fechaGuatemala = new Date(fechaUTC.getTime() + (offsetGuatemala * 60 * 1000));
            
            // Formatear como YYYY-MM-DD
            const year = fechaGuatemala.getFullYear();
            const month = String(fechaGuatemala.getMonth() + 1).padStart(2, '0');
            const day = String(fechaGuatemala.getDate()).padStart(2, '0');
            const fechaFormateada = `${year}-${month}-${day}`;
            
            await LibroBancos.crearOperacion({
                fecha: fechaFormateada,
                beneficiario: 'Gastos operativos',
                descripcion: `Gasto: ${descripcion} (${tipo_gasto})`,
                clasificacion: `Gastos - ${tipo_gasto}`,
                tipo_operacion: 'egreso',
                ingreso: 0,
                egreso: montoNumerico,
                usuario_registro_id: req.user?.id || 1
            });
            console.log(`✅ Gasto registrado en libro de bancos con fecha: ${fechaFormateada}`);
        } catch (libroError) {
            console.error('⚠️ Error registrando en libro de bancos:', libroError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Gasto registrado exitosamente',
            data: gastos[0]
        });

    } catch (error) {
        console.error('❌ Error creando gasto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar el gasto',
            error: error.message
        });
    }
};

// ============================================================================
// LISTAR GASTOS DE UN TURNO
// ============================================================================
const listarGastosPorTurno = async (req, res) => {
    try {
        const { turno_id } = req.params;

        const [gastos] = await pool.execute(
            `SELECT g.*, t.estado as turno_estado
             FROM gastos g
             INNER JOIN turnos t ON g.turno_id = t.id
             WHERE g.turno_id = ?
             ORDER BY g.fecha_creacion DESC`,
            [turno_id]
        );

        // Calcular total
        const total = gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0);

        res.json({
            success: true,
            data: {
                gastos,
                total,
                cantidad: gastos.length
            }
        });

    } catch (error) {
        console.error('❌ Error listando gastos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener gastos',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER GASTO POR ID
// ============================================================================
const obtenerGasto = async (req, res) => {
    try {
        const { id } = req.params;

        const [gastos] = await pool.execute(
            `SELECT g.*, t.estado as turno_estado, t.usuario_id
             FROM gastos g
             INNER JOIN turnos t ON g.turno_id = t.id
             WHERE g.id = ?`,
            [id]
        );

        if (gastos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gasto no encontrado'
            });
        }

        res.json({
            success: true,
            data: gastos[0]
        });

    } catch (error) {
        console.error('❌ Error obteniendo gasto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el gasto',
            error: error.message
        });
    }
};

// ============================================================================
// ACTUALIZAR GASTO
// ============================================================================
const actualizarGasto = async (req, res) => {
    try {
        const { id } = req.params;
        const { descripcion, monto, tipo_gasto } = req.body;

        // Verificar que el gasto existe
        const [gastos] = await pool.execute(
            `SELECT g.*, t.estado as turno_estado
             FROM gastos g
             INNER JOIN turnos t ON g.turno_id = t.id
             WHERE g.id = ?`,
            [id]
        );

        if (gastos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gasto no encontrado'
            });
        }

        // Validar que el turno sigue abierto
        if (gastos[0].turno_estado !== 'abierto') {
            return res.status(400).json({
                success: false,
                message: 'No se puede modificar un gasto de un turno cerrado'
            });
        }

        // Construir UPDATE dinámico
        const updates = [];
        const params = [];

        if (descripcion !== undefined) {
            updates.push('descripcion = ?');
            params.push(descripcion.trim());
        }

        if (monto !== undefined) {
            const montoNumerico = parseFloat(monto);
            if (isNaN(montoNumerico) || montoNumerico <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El monto debe ser un número positivo'
                });
            }
            updates.push('monto = ?');
            params.push(montoNumerico);
        }

        if (tipo_gasto !== undefined) {
            const tiposValidos = ['administrativo', 'compras', 'mantenimiento', 'personal', 'servicios', 'otros'];
            if (!tiposValidos.includes(tipo_gasto)) {
                return res.status(400).json({
                    success: false,
                    message: `Tipo de gasto inválido. Debe ser uno de: ${tiposValidos.join(', ')}`
                });
            }
            updates.push('tipo_gasto = ?');
            params.push(tipo_gasto);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay campos para actualizar'
            });
        }

        params.push(id);

        await pool.execute(
            `UPDATE gastos SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // Obtener gasto actualizado
        const [gastosActualizados] = await pool.execute(
            'SELECT * FROM gastos WHERE id = ?',
            [id]
        );

        console.log(`✅ Gasto ${id} actualizado`);

        res.json({
            success: true,
            message: 'Gasto actualizado exitosamente',
            data: gastosActualizados[0]
        });

    } catch (error) {
        console.error('❌ Error actualizando gasto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el gasto',
            error: error.message
        });
    }
};

// ============================================================================
// ELIMINAR GASTO
// ============================================================================
const eliminarGasto = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el gasto existe
        const [gastos] = await pool.execute(
            `SELECT g.*, t.estado as turno_estado
             FROM gastos g
             INNER JOIN turnos t ON g.turno_id = t.id
             WHERE g.id = ?`,
            [id]
        );

        if (gastos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gasto no encontrado'
            });
        }

        // Validar que el turno sigue abierto
        if (gastos[0].turno_estado !== 'abierto') {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar un gasto de un turno cerrado'
            });
        }

        // Eliminar gasto
        await pool.execute('DELETE FROM gastos WHERE id = ?', [id]);

        console.log(`✅ Gasto ${id} eliminado`);

        res.json({
            success: true,
            message: 'Gasto eliminado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error eliminando gasto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el gasto',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER RESUMEN DE GASTOS POR CATEGORÍA
// ============================================================================
const obtenerResumenPorCategoria = async (req, res) => {
    try {
        const { turno_id } = req.params;

        const [resumen] = await pool.execute(
            `SELECT 
                tipo_gasto,
                COUNT(*) as cantidad,
                SUM(monto) as total
             FROM gastos
             WHERE turno_id = ?
             GROUP BY tipo_gasto
             ORDER BY total DESC`,
            [turno_id]
        );

        // Total general
        const totalGeneral = resumen.reduce((sum, cat) => sum + parseFloat(cat.total), 0);

        res.json({
            success: true,
            data: {
                resumen,
                total_general: totalGeneral
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo resumen:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen de gastos',
            error: error.message
        });
    }
};

// ============================================================================
// LISTAR GASTOS POR RANGO DE FECHAS (PARA ESTADO DE RESULTADOS)
// ============================================================================
const listarGastosPorFechas = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        // Validaciones
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren fecha_inicio y fecha_fin'
            });
        }

        // Obtener gastos del período
        const [gastos] = await pool.execute(
            `SELECT 
                g.id,
                g.descripcion,
                g.monto,
                g.tipo_gasto,
                g.fecha_creacion,
                t.id as turno_id,
                t.fecha_apertura
             FROM gastos g
             INNER JOIN turnos t ON g.turno_id = t.id
             WHERE DATE(g.fecha_creacion) BETWEEN ? AND ?
             ORDER BY g.fecha_creacion DESC, g.id DESC`,
            [fecha_inicio, fecha_fin]
        );

        // Calcular total
        const total = gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0);

        // Agrupar por tipo de gasto
        const resumenPorTipo = gastos.reduce((acc, gasto) => {
            const tipo = gasto.tipo_gasto;
            if (!acc[tipo]) {
                acc[tipo] = {
                    tipo: tipo,
                    cantidad: 0,
                    total: 0,
                    gastos: []
                };
            }
            acc[tipo].cantidad++;
            acc[tipo].total += parseFloat(gasto.monto);
            acc[tipo].gastos.push(gasto);
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                gastos,
                total: parseFloat(total.toFixed(2)),
                cantidad: gastos.length,
                resumen_por_tipo: Object.values(resumenPorTipo),
                periodo: {
                    fecha_inicio,
                    fecha_fin
                }
            }
        });

    } catch (error) {
        console.error('❌ Error listando gastos por fechas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener gastos',
            error: error.message
        });
    }
};

module.exports = {
    crearGasto,
    listarGastosPorTurno,
    obtenerGasto,
    actualizarGasto,
    eliminarGasto,
    obtenerResumenPorCategoria,
    listarGastosPorFechas
};