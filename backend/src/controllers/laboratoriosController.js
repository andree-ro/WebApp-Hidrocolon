// backend/src/controllers/laboratoriosController.js
const GananciaLaboratorio = require('../models/GananciaLaboratorio');

// ============================================================================
// CREAR NUEVA GANANCIA DE LABORATORIO
// ============================================================================
const crearGanancia = async (req, res) => {
    try {
        const {
            concepto,
            monto,
            fecha_ganancia,
            laboratorio_origen,
            tipo_ganancia,
            incluir_en_cierre,
            turno_id,
            observaciones
        } = req.body;

        const usuario_registro_id = req.user.id; // Del middleware de autenticación

        console.log('🧪 Creando nueva ganancia de laboratorio...');

        // Validaciones
        if (!concepto || concepto.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El concepto es requerido'
            });
        }

        if (!monto || monto <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a 0'
            });
        }

        if (monto > 999999.99) {
            return res.status(400).json({
                success: false,
                message: 'El monto no puede exceder Q999,999.99'
            });
        }

        if (!fecha_ganancia) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de ganancia es requerida'
            });
        }

        // Validar que la fecha no sea futura
        const hoy = new Date().toISOString().split('T')[0];
        if (fecha_ganancia > hoy) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de ganancia no puede ser futura'
            });
        }

        // Validar tipo de ganancia
        const tiposValidos = ['bono', 'incentivo', 'devolucion', 'otro'];
        if (tipo_ganancia && !tiposValidos.includes(tipo_ganancia)) {
            return res.status(400).json({
                success: false,
                message: `Tipo de ganancia inválido. Debe ser: ${tiposValidos.join(', ')}`
            });
        }

        // Crear la ganancia
        const ganancia = await GananciaLaboratorio.crear({
            concepto,
            monto,
            fecha_ganancia,
            laboratorio_origen,
            tipo_ganancia: tipo_ganancia || 'otro',
            incluir_en_cierre: incluir_en_cierre !== false,
            turno_id,
            usuario_registro_id,
            observaciones
        });

        res.status(201).json({
            success: true,
            message: 'Ganancia de laboratorio registrada exitosamente',
            data: ganancia
        });

    } catch (error) {
        console.error('❌ Error creando ganancia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear ganancia de laboratorio',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER GANANCIA POR ID
// ============================================================================
const obtenerGananciaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🔍 Obteniendo ganancia ID: ${id}`);

        const ganancia = await GananciaLaboratorio.obtenerPorId(id);

        if (!ganancia) {
            return res.status(404).json({
                success: false,
                message: 'Ganancia no encontrada'
            });
        }

        res.json({
            success: true,
            data: ganancia
        });

    } catch (error) {
        console.error('❌ Error obteniendo ganancia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ganancia',
            error: error.message
        });
    }
};

// ============================================================================
// LISTAR GANANCIAS CON FILTROS
// ============================================================================
const listarGanancias = async (req, res) => {
    try {
        const {
            fecha_inicio,
            fecha_fin,
            tipo_ganancia,
            laboratorio_origen,
            incluir_en_cierre,
            turno_id
        } = req.query;

        console.log('📋 Listando ganancias de laboratorios...');

        const filtros = {};
        if (fecha_inicio && fecha_fin) {
            filtros.fecha_inicio = fecha_inicio;
            filtros.fecha_fin = fecha_fin;
        }
        if (tipo_ganancia) filtros.tipo_ganancia = tipo_ganancia;
        if (laboratorio_origen) filtros.laboratorio_origen = laboratorio_origen;
        if (incluir_en_cierre !== undefined) {
            filtros.incluir_en_cierre = incluir_en_cierre === 'true' || incluir_en_cierre === true;
        }
        if (turno_id) filtros.turno_id = turno_id;

        const ganancias = await GananciaLaboratorio.listar(filtros);

        res.json({
            success: true,
            data: ganancias
        });

    } catch (error) {
        console.error('❌ Error listando ganancias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al listar ganancias',
            error: error.message
        });
    }
};

// ============================================================================
// ACTUALIZAR GANANCIA
// ============================================================================
const actualizarGanancia = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            concepto,
            monto,
            fecha_ganancia,
            laboratorio_origen,
            tipo_ganancia,
            incluir_en_cierre,
            observaciones
        } = req.body;

        console.log(`✏️ Actualizando ganancia ID: ${id}`);

        // Validar que existe
        const gananciaActual = await GananciaLaboratorio.obtenerPorId(id);
        if (!gananciaActual) {
            return res.status(404).json({
                success: false,
                message: 'Ganancia no encontrada'
            });
        }

        // Validaciones si se actualizan campos críticos
        if (monto !== undefined && monto <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a 0'
            });
        }

        if (monto !== undefined && monto > 999999.99) {
            return res.status(400).json({
                success: false,
                message: 'El monto no puede exceder Q999,999.99'
            });
        }

        if (fecha_ganancia) {
            const hoy = new Date().toISOString().split('T')[0];
            if (fecha_ganancia > hoy) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha de ganancia no puede ser futura'
                });
            }
        }

        // Validar tipo de ganancia
        if (tipo_ganancia) {
            const tiposValidos = ['bono', 'incentivo', 'devolucion', 'otro'];
            if (!tiposValidos.includes(tipo_ganancia)) {
                return res.status(400).json({
                    success: false,
                    message: `Tipo de ganancia inválido. Debe ser: ${tiposValidos.join(', ')}`
                });
            }
        }

        // Actualizar
        const gananciaActualizada = await GananciaLaboratorio.actualizar(id, {
            concepto,
            monto,
            fecha_ganancia,
            laboratorio_origen,
            tipo_ganancia,
            incluir_en_cierre,
            observaciones
        });

        res.json({
            success: true,
            message: 'Ganancia actualizada exitosamente',
            data: gananciaActualizada
        });

    } catch (error) {
        console.error('❌ Error actualizando ganancia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar ganancia',
            error: error.message
        });
    }
};

// ============================================================================
// ELIMINAR GANANCIA
// ============================================================================
const eliminarGanancia = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🗑️ Eliminando ganancia ID: ${id}`);

        // Validar que existe
        const ganancia = await GananciaLaboratorio.obtenerPorId(id);
        if (!ganancia) {
            return res.status(404).json({
                success: false,
                message: 'Ganancia no encontrada'
            });
        }

        // Eliminar
        await GananciaLaboratorio.eliminar(id);

        res.json({
            success: true,
            message: 'Ganancia eliminada correctamente'
        });

    } catch (error) {
        console.error('❌ Error eliminando ganancia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar ganancia',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER TOTALES POR PERÍODO
// ============================================================================
const obtenerTotalesPorPeriodo = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, incluir_solo_en_cierre } = req.query;

        console.log('📊 Calculando totales por período...');

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Debe especificar fecha_inicio y fecha_fin'
            });
        }

        const totales = await GananciaLaboratorio.obtenerTotalesPorPeriodo(
            fecha_inicio,
            fecha_fin,
            incluir_solo_en_cierre === 'true'
        );

        res.json({
            success: true,
            data: totales
        });

    } catch (error) {
        console.error('❌ Error calculando totales:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calcular totales por período',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER GANANCIAS POR TURNO
// ============================================================================
const obtenerGananciasPorTurno = async (req, res) => {
    try {
        const { turno_id } = req.params;

        console.log(`🔍 Obteniendo ganancias del turno ID: ${turno_id}`);

        const resultado = await GananciaLaboratorio.obtenerPorTurno(turno_id);

        res.json({
            success: true,
            data: resultado
        });

    } catch (error) {
        console.error('❌ Error obteniendo ganancias por turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ganancias por turno',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER ESTADÍSTICAS GENERALES
// ============================================================================
const obtenerEstadisticas = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        console.log('📊 Obteniendo estadísticas de ganancias...');

        const filtros = {};
        if (fecha_inicio && fecha_fin) {
            filtros.fecha_inicio = fecha_inicio;
            filtros.fecha_fin = fecha_fin;
        }

        const estadisticas = await GananciaLaboratorio.obtenerEstadisticas(filtros);

        res.json({
            success: true,
            data: estadisticas
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

// ============================================================================
// CAMBIAR ESTADO DE INCLUIR EN CIERRE
// ============================================================================
const cambiarEstadoIncluirEnCierre = async (req, res) => {
    try {
        const { id } = req.params;
        const { incluir } = req.body;

        console.log(`🔄 Cambiando estado incluir_en_cierre para ganancia ID: ${id}`);

        if (incluir === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Debe especificar el campo "incluir" (true/false)'
            });
        }

        // Validar que existe
        const ganancia = await GananciaLaboratorio.obtenerPorId(id);
        if (!ganancia) {
            return res.status(404).json({
                success: false,
                message: 'Ganancia no encontrada'
            });
        }

        // Cambiar estado
        const gananciaActualizada = await GananciaLaboratorio.cambiarEstadoIncluirEnCierre(
            id,
            incluir
        );

        res.json({
            success: true,
            message: `Ganancia ${incluir ? 'incluida' : 'excluida'} del cierre exitosamente`,
            data: gananciaActualizada
        });

    } catch (error) {
        console.error('❌ Error cambiando estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER RESUMEN PARA DASHBOARD
// ============================================================================
const obtenerResumenDashboard = async (req, res) => {
    try {
        const { mes, anio } = req.query;

        console.log('📊 Generando resumen para dashboard...');

        // Calcular rango de fechas
        let fecha_inicio, fecha_fin;
        
        if (mes && anio) {
            // Mes específico
            fecha_inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
            const ultimoDia = new Date(anio, mes, 0).getDate();
            fecha_fin = `${anio}-${String(mes).padStart(2, '0')}-${ultimoDia}`;
        } else {
            // Mes actual
            const hoy = new Date();
            const mesActual = hoy.getMonth() + 1;
            const anioActual = hoy.getFullYear();
            fecha_inicio = `${anioActual}-${String(mesActual).padStart(2, '0')}-01`;
            fecha_fin = hoy.toISOString().split('T')[0];
        }

        // Obtener ganancias del período
        const ganancias = await GananciaLaboratorio.listar({
            fecha_inicio,
            fecha_fin
        });

        // Calcular totales
        const montoTotal = ganancias.reduce((sum, g) => sum + parseFloat(g.monto), 0);
        const montoIncluido = ganancias
            .filter(g => g.incluir_en_cierre)
            .reduce((sum, g) => sum + parseFloat(g.monto), 0);
        const montoExcluido = montoTotal - montoIncluido;

        // Agrupar por tipo
        const porTipo = {};
        ganancias.forEach(g => {
            if (!porTipo[g.tipo_ganancia]) {
                porTipo[g.tipo_ganancia] = {
                    tipo: g.tipo_ganancia,
                    cantidad: 0,
                    monto: 0
                };
            }
            porTipo[g.tipo_ganancia].cantidad++;
            porTipo[g.tipo_ganancia].monto += parseFloat(g.monto);
        });

        // Top 5 laboratorios
        const porLaboratorio = {};
        ganancias.forEach(g => {
            if (g.laboratorio_origen) {
                if (!porLaboratorio[g.laboratorio_origen]) {
                    porLaboratorio[g.laboratorio_origen] = {
                        laboratorio: g.laboratorio_origen,
                        cantidad: 0,
                        monto: 0
                    };
                }
                porLaboratorio[g.laboratorio_origen].cantidad++;
                porLaboratorio[g.laboratorio_origen].monto += parseFloat(g.monto);
            }
        });

        const topLaboratorios = Object.values(porLaboratorio)
            .sort((a, b) => b.monto - a.monto)
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                periodo: {
                    fecha_inicio,
                    fecha_fin
                },
                resumen: {
                    cantidad_ganancias: ganancias.length,
                    monto_total: parseFloat(montoTotal.toFixed(2)),
                    monto_incluido_cierre: parseFloat(montoIncluido.toFixed(2)),
                    monto_excluido_cierre: parseFloat(montoExcluido.toFixed(2)),
                    cantidad_incluidas: ganancias.filter(g => g.incluir_en_cierre).length,
                    cantidad_excluidas: ganancias.filter(g => !g.incluir_en_cierre).length
                },
                por_tipo: Object.values(porTipo),
                top_laboratorios: topLaboratorios,
                ultimas_ganancias: ganancias.slice(0, 5)
            }
        });

    } catch (error) {
        console.error('❌ Error generando resumen dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar resumen',
            error: error.message
        });
    }
};

module.exports = {
    crearGanancia,
    obtenerGananciaPorId,
    listarGanancias,
    actualizarGanancia,
    eliminarGanancia,
    obtenerTotalesPorPeriodo,
    obtenerGananciasPorTurno,
    obtenerEstadisticas,
    cambiarEstadoIncluirEnCierre,
    obtenerResumenDashboard
};