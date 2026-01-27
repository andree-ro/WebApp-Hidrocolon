// backend/src/controllers/transferenciasController.js
// Controlador para gestión de transferencias bancarias del Sistema Hidrocolon

const { pool } = require('../config/database');
const LibroBancos = require('../models/LibroBancos');

// ============================================================================
// CREAR NUEVA TRANSFERENCIA
// ============================================================================
const crearTransferencia = async (req, res) => {
    try {
        const { turno_id, numero_boleta, paciente_nombre, monto } = req.body;

        // Validaciones
        if (!turno_id || !numero_boleta || !paciente_nombre || !monto) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: turno_id, numero_boleta, paciente_nombre, monto'
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
                message: 'El turno está cerrado. No se pueden agregar transferencias.'
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

        // Verificar que el número de boleta no esté duplicado en el mismo turno
        const [boletasDuplicadas] = await pool.execute(
            'SELECT id FROM transferencias WHERE turno_id = ? AND numero_boleta = ?',
            [turno_id, numero_boleta.trim()]
        );

        if (boletasDuplicadas.length > 0) {
            return res.status(400).json({
                success: false,
                message: `La boleta ${numero_boleta} ya está registrada en este turno`
            });
        }

        // Insertar transferencia
        const [result] = await pool.execute(
            `INSERT INTO transferencias (turno_id, numero_boleta, paciente_nombre, monto)
             VALUES (?, ?, ?, ?)`,
            [turno_id, numero_boleta.trim(), paciente_nombre.trim(), montoNumerico]
        );

        // Obtener transferencia creada
        const [transferencias] = await pool.execute(
            'SELECT * FROM transferencias WHERE id = ?',
            [result.insertId]
        );

        console.log(`✅ Transferencia ${result.insertId} creada: ${numero_boleta} - Q${montoNumerico}`);

        // Registrar en libro de bancos
        try {
            // Obtener fecha de la transferencia creada
            const fechaTransferencia = transferencias[0].fecha_creacion
                ? new Date(transferencias[0].fecha_creacion).toLocaleDateString('en-CA')
                : new Date().toLocaleDateString('en-CA');
            
            await LibroBancos.crearOperacion({
                fecha: fechaTransferencia,
                beneficiario: paciente_nombre.trim(),
                descripcion: `Transferencia ${numero_boleta.trim()} - ${paciente_nombre.trim()}`,
                clasificacion: 'Transferencias bancarias',
                tipo_operacion: 'ingreso',
                ingreso: montoNumerico,
                egreso: 0,
                usuario_registro_id: req.user?.id || 1
            });
            console.log('✅ Transferencia registrada en libro de bancos');
        } catch (libroError) {
            console.error('⚠️ Error registrando en libro de bancos:', libroError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Transferencia registrada exitosamente',
            data: transferencias[0]
        });

    } catch (error) {
        console.error('❌ Error creando transferencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar la transferencia',
            error: error.message
        });
    }
};

// ============================================================================
// LISTAR TRANSFERENCIAS DE UN TURNO
// ============================================================================
const listarTransferenciasPorTurno = async (req, res) => {
    try {
        const { turno_id } = req.params;

        const [transferencias] = await pool.execute(
            `SELECT t.*, tu.estado as turno_estado
             FROM transferencias t
             INNER JOIN turnos tu ON t.turno_id = tu.id
             WHERE t.turno_id = ?
             ORDER BY t.fecha_creacion DESC`,
            [turno_id]
        );

        // Calcular total
        const total = transferencias.reduce((sum, transferencia) => sum + parseFloat(transferencia.monto), 0);

        res.json({
            success: true,
            data: {
                transferencias,
                total,
                cantidad: transferencias.length
            }
        });

    } catch (error) {
        console.error('❌ Error listando transferencias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener transferencias',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER TRANSFERENCIA POR ID
// ============================================================================
const obtenerTransferencia = async (req, res) => {
    try {
        const { id } = req.params;

        const [transferencias] = await pool.execute(
            `SELECT t.*, tu.estado as turno_estado, tu.usuario_id
             FROM transferencias t
             INNER JOIN turnos tu ON t.turno_id = tu.id
             WHERE t.id = ?`,
            [id]
        );

        if (transferencias.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transferencia no encontrada'
            });
        }

        res.json({
            success: true,
            data: transferencias[0]
        });

    } catch (error) {
        console.error('❌ Error obteniendo transferencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la transferencia',
            error: error.message
        });
    }
};

// ============================================================================
// ACTUALIZAR TRANSFERENCIA
// ============================================================================
const actualizarTransferencia = async (req, res) => {
    try {
        const { id } = req.params;
        const { numero_boleta, paciente_nombre, monto } = req.body;

        // Verificar que la transferencia existe
        const [transferencias] = await pool.execute(
            `SELECT t.*, tu.estado as turno_estado
             FROM transferencias t
             INNER JOIN turnos tu ON t.turno_id = tu.id
             WHERE t.id = ?`,
            [id]
        );

        if (transferencias.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transferencia no encontrada'
            });
        }

        // Validar que el turno sigue abierto
        if (transferencias[0].turno_estado !== 'abierto') {
            return res.status(400).json({
                success: false,
                message: 'No se puede modificar una transferencia de un turno cerrado'
            });
        }

        // Construir UPDATE dinámico
        const updates = [];
        const params = [];

        if (numero_boleta !== undefined) {
            // Verificar que el nuevo número no esté duplicado
            const [duplicados] = await pool.execute(
                'SELECT id FROM transferencias WHERE turno_id = ? AND numero_boleta = ? AND id != ?',
                [transferencias[0].turno_id, numero_boleta.trim(), id]
            );

            if (duplicados.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `La boleta ${numero_boleta} ya está registrada en este turno`
                });
            }

            updates.push('numero_boleta = ?');
            params.push(numero_boleta.trim());
        }

        if (paciente_nombre !== undefined) {
            updates.push('paciente_nombre = ?');
            params.push(paciente_nombre.trim());
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

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay campos para actualizar'
            });
        }

        params.push(id);

        await pool.execute(
            `UPDATE transferencias SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // Obtener transferencia actualizada
        const [transferenciasActualizadas] = await pool.execute(
            'SELECT * FROM transferencias WHERE id = ?',
            [id]
        );

        console.log(`✅ Transferencia ${id} actualizada`);

        res.json({
            success: true,
            message: 'Transferencia actualizada exitosamente',
            data: transferenciasActualizadas[0]
        });

    } catch (error) {
        console.error('❌ Error actualizando transferencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la transferencia',
            error: error.message
        });
    }
};

// ============================================================================
// ELIMINAR TRANSFERENCIA
// ============================================================================
const eliminarTransferencia = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la transferencia existe
        const [transferencias] = await pool.execute(
            `SELECT t.*, tu.estado as turno_estado
             FROM transferencias t
             INNER JOIN turnos tu ON t.turno_id = tu.id
             WHERE t.id = ?`,
            [id]
        );

        if (transferencias.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transferencia no encontrada'
            });
        }

        // Validar que el turno sigue abierto
        if (transferencias[0].turno_estado !== 'abierto') {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar una transferencia de un turno cerrado'
            });
        }

        // Eliminar transferencia
        await pool.execute('DELETE FROM transferencias WHERE id = ?', [id]);

        console.log(`✅ Transferencia ${id} eliminada`);

        res.json({
            success: true,
            message: 'Transferencia eliminada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error eliminando transferencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la transferencia',
            error: error.message
        });
    }
};

// ============================================================================
// BUSCAR TRANSFERENCIA POR NÚMERO DE BOLETA
// ============================================================================
const buscarPorBoleta = async (req, res) => {
    try {
        const { numero_boleta } = req.params;

        const [transferencias] = await pool.execute(
            `SELECT t.*, tu.estado as turno_estado, tu.fecha_apertura, tu.fecha_cierre
             FROM transferencias t
             INNER JOIN turnos tu ON t.turno_id = tu.id
             WHERE t.numero_boleta = ?
             ORDER BY t.fecha_creacion DESC`,
            [numero_boleta]
        );

        if (transferencias.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No se encontró ninguna transferencia con la boleta ${numero_boleta}`
            });
        }

        res.json({
            success: true,
            data: transferencias
        });

    } catch (error) {
        console.error('❌ Error buscando transferencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar la transferencia',
            error: error.message
        });
    }
};

// ============================================================================
// VERIFICAR CUADRE DE TRANSFERENCIAS
// ============================================================================
const verificarCuadre = async (req, res) => {
    try {
        const { turno_id } = req.params;

        // Total de transferencias registradas
        const [transferenciasResult] = await pool.execute(
            'SELECT COALESCE(SUM(monto), 0) as total FROM transferencias WHERE turno_id = ?',
            [turno_id]
        );

        // Total de ventas con transferencia
        const [ventasResult] = await pool.execute(
            `SELECT 
                COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END), 0) as transferencia,
                COALESCE(SUM(CASE WHEN metodo_pago = 'mixto' THEN transferencia_monto ELSE 0 END), 0) as mixto_transferencia
             FROM ventas 
             WHERE turno_id = ?`,
            [turno_id]
        );

        const totalTransferencias = parseFloat(transferenciasResult[0].total);
        const totalVentasTransferencia = parseFloat(ventasResult[0].transferencia) + parseFloat(ventasResult[0].mixto_transferencia);
        const diferencia = totalTransferencias - totalVentasTransferencia;

        res.json({
            success: true,
            data: {
                total_transferencias: totalTransferencias,
                total_ventas_transferencia: totalVentasTransferencia,
                diferencia: diferencia,
                cuadra: Math.abs(diferencia) < 0.50,
                mensaje: Math.abs(diferencia) < 0.50 
                    ? 'Las transferencias cuadran correctamente' 
                    : `Hay una diferencia de Q${Math.abs(diferencia).toFixed(2)}`
            }
        });

    } catch (error) {
        console.error('❌ Error verificando cuadre:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar cuadre de transferencias',
            error: error.message
        });
    }
};

module.exports = {
    crearTransferencia,
    listarTransferenciasPorTurno,
    obtenerTransferencia,
    actualizarTransferencia,
    eliminarTransferencia,
    buscarPorBoleta,
    verificarCuadre
};