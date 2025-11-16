const db = require('../config/database');

const reportesController = {
    // ============================================================================
    // LIBRO DE BANCOS
    // ============================================================================
    
    // Obtener saldo inicial más reciente
    async obtenerSaldoInicialBancos(req, res) {
        try {
            const [resultado] = await db.query(
                `SELECT saldo_bancos 
                 FROM libro_bancos 
                 ORDER BY fecha DESC, id DESC 
                 LIMIT 1`
            );
            
            const saldoInicial = resultado.length > 0 ? resultado[0].saldo_bancos : 0;
            
            res.json({
                success: true,
                saldoInicial
            });
        } catch (error) {
            console.error('Error al obtener saldo inicial:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener saldo inicial',
                error: error.message
            });
        }
    },

    // Crear registro en libro de bancos
    async crearRegistroBancos(req, res) {
        try {
            const {
                fecha,
                beneficiario,
                descripcion,
                clasificacion,
                tipo_operacion,
                numero_cheque,
                numero_deposito,
                ingreso,
                egreso,
                turno_id
            } = req.body;

            const usuario_id = req.usuario.id;

            // Obtener saldo anterior
            const [saldoAnterior] = await db.query(
                `SELECT saldo_bancos 
                 FROM libro_bancos 
                 ORDER BY fecha DESC, id DESC 
                 LIMIT 1`
            );

            const saldo_anterior = saldoAnterior.length > 0 ? saldoAnterior[0].saldo_bancos : 0;
            const saldo_nuevo = parseFloat(saldo_anterior) + parseFloat(ingreso || 0) - parseFloat(egreso || 0);

            const [resultado] = await db.query(
                `INSERT INTO libro_bancos (
                    fecha, beneficiario, descripcion, clasificacion, 
                    tipo_operacion, numero_cheque, numero_deposito, 
                    ingreso, egreso, saldo_bancos, turno_id, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    fecha, beneficiario, descripcion, clasificacion,
                    tipo_operacion, numero_cheque, numero_deposito,
                    ingreso || 0, egreso || 0, saldo_nuevo, turno_id, usuario_id
                ]
            );

            res.json({
                success: true,
                message: 'Registro creado exitosamente',
                id: resultado.insertId,
                saldo_nuevo
            });
        } catch (error) {
            console.error('Error al crear registro de bancos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear registro',
                error: error.message
            });
        }
    },

    // Obtener registros del libro de bancos por rango de fechas
    async obtenerLibroBancos(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;

            const [registros] = await db.query(
                `SELECT * FROM libro_bancos 
                 WHERE fecha BETWEEN ? AND ?
                 ORDER BY fecha ASC, id ASC`,
                [fecha_inicio, fecha_fin]
            );

            res.json({
                success: true,
                registros
            });
        } catch (error) {
            console.error('Error al obtener libro de bancos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener registros',
                error: error.message
            });
        }
    },

    // Establecer saldo inicial
    async establecerSaldoInicial(req, res) {
        try {
            const { saldo_inicial, fecha } = req.body;
            const usuario_id = req.usuario.id;

            const [resultado] = await db.query(
                `INSERT INTO libro_bancos (
                    fecha, beneficiario, descripcion, clasificacion,
                    tipo_operacion, ingreso, egreso, saldo_bancos, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    fecha,
                    'Sistema',
                    'Saldo inicial del sistema',
                    'Saldo Inicial',
                    'SALDO INICIAL',
                    0,
                    0,
                    saldo_inicial,
                    usuario_id
                ]
            );

            res.json({
                success: true,
                message: 'Saldo inicial establecido',
                id: resultado.insertId
            });
        } catch (error) {
            console.error('Error al establecer saldo inicial:', error);
            res.status(500).json({
                success: false,
                message: 'Error al establecer saldo inicial',
                error: error.message
            });
        }
    },

    // ============================================================================
    // ESTADO DE RESULTADOS
    // ============================================================================
    
    // Obtener estado de resultados por periodo
    async obtenerEstadoResultados(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;

            // 1. VENTAS POR DOCTORA (sin impuesto)
            const [ventas] = await db.query(
                `SELECT 
                    COALESCE(d.nombre, 'Sin Asignar') as doctora,
                    SUM(dv.precio_total) as total_ventas
                 FROM detalle_ventas dv
                 INNER JOIN ventas v ON dv.venta_id = v.id
                 LEFT JOIN doctoras d ON dv.doctora_id = d.id
                 WHERE v.fecha_creacion BETWEEN ? AND ?
                 AND dv.tipo_producto IN ('medicamento')
                 GROUP BY dv.doctora_id
                 ORDER BY doctora`,
                [fecha_inicio, fecha_fin]
            );

            // 2. SERVICIOS POR DOCTORA (sin impuesto)
            const [servicios] = await db.query(
                `SELECT 
                    COALESCE(d.nombre, 'Sin Asignar') as doctora,
                    SUM(dv.precio_total) as total_servicios
                 FROM detalle_ventas dv
                 INNER JOIN ventas v ON dv.venta_id = v.id
                 LEFT JOIN doctoras d ON dv.doctora_id = d.id
                 WHERE v.fecha_creacion BETWEEN ? AND ?
                 AND dv.tipo_producto IN ('servicio', 'jornada_ultrasonido', 'combo_promocion')
                 GROUP BY dv.doctora_id
                 ORDER BY doctora`,
                [fecha_inicio, fecha_fin]
            );

            // 3. COMISIONES PAGADAS POR DOCTORA
            const [comisiones] = await db.query(
                `SELECT 
                    d.nombre as doctora,
                    SUM(pc.monto_total) as total_comisiones
                 FROM pagos_comisiones pc
                 INNER JOIN doctoras d ON pc.doctora_id = d.id
                 WHERE pc.fecha_pago BETWEEN ? AND ?
                 AND pc.estado = 'pagado'
                 GROUP BY pc.doctora_id
                 ORDER BY doctora`,
                [fecha_inicio, fecha_fin]
            );

            // 4. COSTOS DE OPERACIÓN
            const [costosOperacion] = await db.query(
                `SELECT concepto, SUM(monto) as total
                 FROM costos_operacion
                 WHERE fecha_costo BETWEEN ? AND ?
                 GROUP BY concepto
                 ORDER BY concepto`,
                [fecha_inicio, fecha_fin]
            );

            // 5. GASTOS DE OPERACIÓN
            const [gastosOperacion] = await db.query(
                `SELECT concepto, SUM(monto) as total
                 FROM gastos_operacion
                 WHERE fecha_gasto BETWEEN ? AND ?
                 GROUP BY concepto
                 ORDER BY concepto`,
                [fecha_inicio, fecha_fin]
            );

            // 6. IMPUESTOS TOTALES DEL PERIODO
            const [impuestos] = await db.query(
                `SELECT 
                    SUM(
                        CASE 
                            WHEN v.metodo_pago = 'efectivo' THEN v.total * 0.16
                            WHEN v.metodo_pago = 'tarjeta' THEN v.tarjeta_monto * 0.2104
                            WHEN v.metodo_pago = 'transferencia' THEN v.transferencia_monto * 0.16
                            WHEN v.metodo_pago = 'deposito' THEN v.deposito_monto * 0.16
                            WHEN v.metodo_pago = 'mixto' THEN 
                                (v.efectivo_recibido * 0.16) + 
                                (v.tarjeta_monto * 0.2104) + 
                                (v.transferencia_monto * 0.16) +
                                (v.deposito_monto * 0.16)
                            ELSE 0
                        END
                    ) as total_impuestos
                 FROM ventas v
                 WHERE v.fecha_creacion BETWEEN ? AND ?`,
                [fecha_inicio, fecha_fin]
            );

            // 7. OTROS GASTOS FINANCIEROS (sin impuestos, esos ya se calcularon)
            const [otrosGastos] = await db.query(
                `SELECT concepto, SUM(monto) as total
                 FROM otros_gastos_financieros
                 WHERE fecha_gasto BETWEEN ? AND ?
                 GROUP BY concepto
                 ORDER BY concepto`,
                [fecha_inicio, fecha_fin]
            );

            res.json({
                success: true,
                datos: {
                    ventas,
                    servicios,
                    comisiones,
                    costosOperacion,
                    gastosOperacion,
                    impuestos: impuestos[0].total_impuestos || 0,
                    otrosGastos
                }
            });
        } catch (error) {
            console.error('Error al obtener estado de resultados:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estado de resultados',
                error: error.message
            });
        }
    },

    // ============================================================================
    // COSTOS DE OPERACIÓN
    // ============================================================================
    
    async crearCostoOperacion(req, res) {
        try {
            const { concepto, monto, fecha_costo, descripcion, turno_id } = req.body;
            const usuario_id = req.usuario.id;

            const [resultado] = await db.query(
                `INSERT INTO costos_operacion (
                    concepto, monto, fecha_costo, descripcion, 
                    turno_id, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [concepto, monto, fecha_costo, descripcion, turno_id, usuario_id]
            );

            res.json({
                success: true,
                message: 'Costo de operación registrado',
                id: resultado.insertId
            });
        } catch (error) {
            console.error('Error al crear costo de operación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear costo',
                error: error.message
            });
        }
    },

    async obtenerCostosOperacion(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;

            const [costos] = await db.query(
                `SELECT * FROM costos_operacion
                 WHERE fecha_costo BETWEEN ? AND ?
                 ORDER BY fecha_costo DESC`,
                [fecha_inicio, fecha_fin]
            );

            res.json({
                success: true,
                costos
            });
        } catch (error) {
            console.error('Error al obtener costos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener costos',
                error: error.message
            });
        }
    },

    async eliminarCostoOperacion(req, res) {
        try {
            const { id } = req.params;

            await db.query('DELETE FROM costos_operacion WHERE id = ?', [id]);

            res.json({
                success: true,
                message: 'Costo eliminado'
            });
        } catch (error) {
            console.error('Error al eliminar costo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar costo',
                error: error.message
            });
        }
    },

    // ============================================================================
    // GASTOS DE OPERACIÓN
    // ============================================================================
    
    async crearGastoOperacion(req, res) {
        try {
            const { concepto, monto, fecha_gasto, descripcion, turno_id } = req.body;
            const usuario_id = req.usuario.id;

            const [resultado] = await db.query(
                `INSERT INTO gastos_operacion (
                    concepto, monto, fecha_gasto, descripcion,
                    turno_id, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [concepto, monto, fecha_gasto, descripcion, turno_id, usuario_id]
            );

            res.json({
                success: true,
                message: 'Gasto de operación registrado',
                id: resultado.insertId
            });
        } catch (error) {
            console.error('Error al crear gasto de operación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear gasto',
                error: error.message
            });
        }
    },

    async obtenerGastosOperacion(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;

            const [gastos] = await db.query(
                `SELECT * FROM gastos_operacion
                 WHERE fecha_gasto BETWEEN ? AND ?
                 ORDER BY fecha_gasto DESC`,
                [fecha_inicio, fecha_fin]
            );

            res.json({
                success: true,
                gastos
            });
        } catch (error) {
            console.error('Error al obtener gastos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener gastos',
                error: error.message
            });
        }
    },

    async eliminarGastoOperacion(req, res) {
        try {
            const { id } = req.params;

            await db.query('DELETE FROM gastos_operacion WHERE id = ?', [id]);

            res.json({
                success: true,
                message: 'Gasto eliminado'
            });
        } catch (error) {
            console.error('Error al eliminar gasto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar gasto',
                error: error.message
            });
        }
    },

    // ============================================================================
    // OTROS GASTOS FINANCIEROS
    // ============================================================================
    
    async crearOtroGastoFinanciero(req, res) {
        try {
            const { concepto, monto, fecha_gasto, descripcion, turno_id } = req.body;
            const usuario_id = req.usuario.id;

            const [resultado] = await db.query(
                `INSERT INTO otros_gastos_financieros (
                    concepto, monto, fecha_gasto, descripcion,
                    turno_id, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [concepto, monto, fecha_gasto, descripcion, turno_id, usuario_id]
            );

            res.json({
                success: true,
                message: 'Otro gasto financiero registrado',
                id: resultado.insertId
            });
        } catch (error) {
            console.error('Error al crear otro gasto financiero:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear gasto financiero',
                error: error.message
            });
        }
    },

    async obtenerOtrosGastosFinancieros(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;

            const [gastos] = await db.query(
                `SELECT * FROM otros_gastos_financieros
                 WHERE fecha_gasto BETWEEN ? AND ?
                 ORDER BY fecha_gasto DESC`,
                [fecha_inicio, fecha_fin]
            );

            res.json({
                success: true,
                gastos
            });
        } catch (error) {
            console.error('Error al obtener otros gastos financieros:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener gastos financieros',
                error: error.message
            });
        }
    },

    async eliminarOtroGastoFinanciero(req, res) {
        try {
            const { id } = req.params;

            await db.query('DELETE FROM otros_gastos_financieros WHERE id = ?', [id]);

            res.json({
                success: true,
                message: 'Gasto financiero eliminado'
            });
        } catch (error) {
            console.error('Error al eliminar gasto financiero:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar gasto financiero',
                error: error.message
            });
        }
    }
};

module.exports = reportesController;