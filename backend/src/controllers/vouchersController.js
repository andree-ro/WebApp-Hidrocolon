// backend/src/controllers/vouchersController.js
// Controlador para gestión de vouchers de tarjeta del Sistema Hidrocolon

const { pool } = require('../config/database');

// ============================================================================
// CREAR NUEVO VOUCHER
// ============================================================================
const crearVoucher = async (req, res) => {
    try {
        const { turno_id, numero_voucher, paciente_nombre, monto } = req.body;

        // Validaciones
        if (!turno_id || !numero_voucher || !paciente_nombre || !monto) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: turno_id, numero_voucher, paciente_nombre, monto'
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
                message: 'El turno está cerrado. No se pueden agregar vouchers.'
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

        // Verificar que el número de voucher no esté duplicado en el mismo turno
        const [vouchersDuplicados] = await pool.execute(
            'SELECT id FROM vouchers_tarjeta WHERE turno_id = ? AND numero_voucher = ?',
            [turno_id, numero_voucher.trim()]
        );

        if (vouchersDuplicados.length > 0) {
            return res.status(400).json({
                success: false,
                message: `El voucher ${numero_voucher} ya está registrado en este turno`
            });
        }

        // Insertar voucher
        const [result] = await pool.execute(
            `INSERT INTO vouchers_tarjeta (turno_id, numero_voucher, paciente_nombre, monto)
             VALUES (?, ?, ?, ?)`,
            [turno_id, numero_voucher.trim(), paciente_nombre.trim(), montoNumerico]
        );

        // Obtener voucher creado
        const [vouchers] = await pool.execute(
            'SELECT * FROM vouchers_tarjeta WHERE id = ?',
            [result.insertId]
        );

        console.log(`✅ Voucher ${result.insertId} creado: ${numero_voucher} - Q${montoNumerico}`);


        res.status(201).json({
            success: true,
            message: 'Voucher registrado exitosamente',
            data: vouchers[0]
        });

    } catch (error) {
        console.error('❌ Error creando voucher:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar el voucher',
            error: error.message
        });
    }
};

// ============================================================================
// LISTAR VOUCHERS DE UN TURNO
// ============================================================================
const listarVouchersPorTurno = async (req, res) => {
    try {
        const { turno_id } = req.params;

        const [vouchers] = await pool.execute(
            `SELECT v.*, t.estado as turno_estado
             FROM vouchers_tarjeta v
             INNER JOIN turnos t ON v.turno_id = t.id
             WHERE v.turno_id = ?
             ORDER BY v.fecha_creacion DESC`,
            [turno_id]
        );

        // Calcular total
        const total = vouchers.reduce((sum, voucher) => sum + parseFloat(voucher.monto), 0);

        res.json({
            success: true,
            data: {
                vouchers,
                total,
                cantidad: vouchers.length
            }
        });

    } catch (error) {
        console.error('❌ Error listando vouchers:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener vouchers',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER VOUCHER POR ID
// ============================================================================
const obtenerVoucher = async (req, res) => {
    try {
        const { id } = req.params;

        const [vouchers] = await pool.execute(
            `SELECT v.*, t.estado as turno_estado, t.usuario_id
             FROM vouchers_tarjeta v
             INNER JOIN turnos t ON v.turno_id = t.id
             WHERE v.id = ?`,
            [id]
        );

        if (vouchers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Voucher no encontrado'
            });
        }

        res.json({
            success: true,
            data: vouchers[0]
        });

    } catch (error) {
        console.error('❌ Error obteniendo voucher:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el voucher',
            error: error.message
        });
    }
};

// ============================================================================
// ACTUALIZAR VOUCHER
// ============================================================================
const actualizarVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        const { numero_voucher, paciente_nombre, monto } = req.body;

        // Verificar que el voucher existe
        const [vouchers] = await pool.execute(
            `SELECT v.*, t.estado as turno_estado
             FROM vouchers_tarjeta v
             INNER JOIN turnos t ON v.turno_id = t.id
             WHERE v.id = ?`,
            [id]
        );

        if (vouchers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Voucher no encontrado'
            });
        }

        // Validar que el turno sigue abierto
        if (vouchers[0].turno_estado !== 'abierto') {
            return res.status(400).json({
                success: false,
                message: 'No se puede modificar un voucher de un turno cerrado'
            });
        }

        // Construir UPDATE dinámico
        const updates = [];
        const params = [];

        if (numero_voucher !== undefined) {
            // Verificar que el nuevo número no esté duplicado
            const [duplicados] = await pool.execute(
                'SELECT id FROM vouchers_tarjeta WHERE turno_id = ? AND numero_voucher = ? AND id != ?',
                [vouchers[0].turno_id, numero_voucher.trim(), id]
            );

            if (duplicados.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `El voucher ${numero_voucher} ya está registrado en este turno`
                });
            }

            updates.push('numero_voucher = ?');
            params.push(numero_voucher.trim());
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
            `UPDATE vouchers_tarjeta SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // Obtener voucher actualizado
        const [vouchersActualizados] = await pool.execute(
            'SELECT * FROM vouchers_tarjeta WHERE id = ?',
            [id]
        );

        console.log(`✅ Voucher ${id} actualizado`);

        res.json({
            success: true,
            message: 'Voucher actualizado exitosamente',
            data: vouchersActualizados[0]
        });

    } catch (error) {
        console.error('❌ Error actualizando voucher:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el voucher',
            error: error.message
        });
    }
};

// ============================================================================
// ELIMINAR VOUCHER
// ============================================================================
const eliminarVoucher = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el voucher existe
        const [vouchers] = await pool.execute(
            `SELECT v.*, t.estado as turno_estado
             FROM vouchers_tarjeta v
             INNER JOIN turnos t ON v.turno_id = t.id
             WHERE v.id = ?`,
            [id]
        );

        if (vouchers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Voucher no encontrado'
            });
        }

        // Validar que el turno sigue abierto
        if (vouchers[0].turno_estado !== 'abierto') {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar un voucher de un turno cerrado'
            });
        }

        // Eliminar voucher
        await pool.execute('DELETE FROM vouchers_tarjeta WHERE id = ?', [id]);

        console.log(`✅ Voucher ${id} eliminado`);

        res.json({
            success: true,
            message: 'Voucher eliminado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error eliminando voucher:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el voucher',
            error: error.message
        });
    }
};

// ============================================================================
// BUSCAR VOUCHER POR NÚMERO
// ============================================================================
const buscarPorNumero = async (req, res) => {
    try {
        const { numero_voucher } = req.params;

        const [vouchers] = await pool.execute(
            `SELECT v.*, t.estado as turno_estado, t.fecha_apertura, t.fecha_cierre
             FROM vouchers_tarjeta v
             INNER JOIN turnos t ON v.turno_id = t.id
             WHERE v.numero_voucher = ?
             ORDER BY v.fecha_creacion DESC`,
            [numero_voucher]
        );

        if (vouchers.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No se encontró ningún voucher con el número ${numero_voucher}`
            });
        }

        res.json({
            success: true,
            data: vouchers
        });

    } catch (error) {
        console.error('❌ Error buscando voucher:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar el voucher',
            error: error.message
        });
    }
};

// ============================================================================
// VERIFICAR CUADRE DE VOUCHERS
// ============================================================================
const verificarCuadre = async (req, res) => {
    try {
        const { turno_id } = req.params;

        // Total de vouchers registrados
        const [vouchersResult] = await pool.execute(
            'SELECT COALESCE(SUM(monto), 0) as total FROM vouchers_tarjeta WHERE turno_id = ?',
            [turno_id]
        );

        // Total de ventas con tarjeta
        const [ventasResult] = await pool.execute(
            `SELECT 
                COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END), 0) as tarjeta,
                COALESCE(SUM(CASE WHEN metodo_pago = 'mixto' THEN tarjeta_monto ELSE 0 END), 0) as mixto_tarjeta
             FROM ventas 
             WHERE turno_id = ?`,
            [turno_id]
        );

        const totalVouchers = parseFloat(vouchersResult[0].total);
        const totalVentasTarjeta = parseFloat(ventasResult[0].tarjeta) + parseFloat(ventasResult[0].mixto_tarjeta);
        const diferencia = totalVouchers - totalVentasTarjeta;

        res.json({
            success: true,
            data: {
                total_vouchers: totalVouchers,
                total_ventas_tarjeta: totalVentasTarjeta,
                diferencia: diferencia,
                cuadra: Math.abs(diferencia) < 0.50,
                mensaje: Math.abs(diferencia) < 0.50 
                    ? 'Los vouchers cuadran correctamente' 
                    : `Hay una diferencia de Q${Math.abs(diferencia).toFixed(2)}`
            }
        });

    } catch (error) {
        console.error('❌ Error verificando cuadre:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar cuadre de vouchers',
            error: error.message
        });
    }
};

module.exports = {
    crearVoucher,
    listarVouchersPorTurno,
    obtenerVoucher,
    actualizarVoucher,
    eliminarVoucher,
    buscarPorNumero,
    verificarCuadre
};