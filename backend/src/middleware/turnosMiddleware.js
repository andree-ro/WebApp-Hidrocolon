// backend/src/middleware/turnosMiddleware.js
// Middleware para validar que exista un turno abierto antes de realizar ventas

const { pool } = require('../config/database');

// ============================================================================
// VALIDAR TURNO ABIERTO
// ============================================================================
const validarTurnoAbierto = async (req, res, next) => {
    try {
        const usuario_id = req.user.id; // Viene del middleware de autenticación
        
        console.log(`🔍 Validando turno abierto para usuario ${usuario_id}`);
        
        // Buscar turno abierto del usuario para el día actual
        const [turnos] = await pool.execute(
            `SELECT 
                id, 
                usuario_id,
                efectivo_inicial, 
                fecha_apertura,
                estado
             FROM turnos 
             WHERE usuario_id = ? 
             AND estado = 'abierto' 
             AND DATE(fecha_apertura) = CURDATE()
             LIMIT 1`,
            [usuario_id]
        );
        
        if (turnos.length === 0) {
            console.log('❌ No hay turno abierto para este usuario');
            return res.status(403).json({
                success: false,
                message: 'Debe abrir un turno antes de realizar ventas',
                codigo: 'TURNO_NO_ABIERTO',
                accion_requerida: 'Abrir turno con efectivo inicial'
            });
        }
        
        const turno = turnos[0];
        console.log(`✅ Turno encontrado: ID ${turno.id}, Apertura: ${turno.fecha_apertura}`);
        
        // Adjuntar información del turno al request para usarla en el controller
        req.turno = turno;
        
        next();
        
    } catch (error) {
        console.error('❌ Error validando turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error validando turno activo',
            error: error.message
        });
    }
};

// ============================================================================
// VALIDAR QUE NO EXISTA TURNO ABIERTO (para abrir uno nuevo)
// ============================================================================
const validarNoTurnoAbierto = async (req, res, next) => {
    try {
        const usuario_id = req.user.id;
        
        console.log(`🔍 Validando que NO exista turno abierto para usuario ${usuario_id}`);
        
        // Buscar si hay algún turno abierto
        const [turnos] = await pool.execute(
            `SELECT id, fecha_apertura 
             FROM turnos 
             WHERE usuario_id = ? 
             AND estado = 'abierto'
             LIMIT 1`,
            [usuario_id]
        );
        
        if (turnos.length > 0) {
            console.log(`❌ Ya existe un turno abierto: ID ${turnos[0].id}`);
            return res.status(400).json({
                success: false,
                message: 'Ya existe un turno abierto. Debe cerrarlo antes de abrir uno nuevo',
                codigo: 'TURNO_YA_ABIERTO',
                turno_id: turnos[0].id,
                fecha_apertura: turnos[0].fecha_apertura
            });
        }
        
        console.log('✅ No hay turno abierto, puede proceder');
        next();
        
    } catch (error) {
        console.error('❌ Error validando turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error validando turno',
            error: error.message
        });
    }
};

// ============================================================================
// VALIDAR QUE EL TURNO ESTÉ ABIERTO (para cerrarlo)
// ============================================================================
const validarTurnoParaCierre = async (req, res, next) => {
    try {
        const turno_id = req.params.id;
        const usuario_id = req.user.id;
        
        console.log(`🔍 Validando turno ${turno_id} para cierre por usuario ${usuario_id}`);
        
        const [turnos] = await pool.execute(
            `SELECT * FROM turnos 
             WHERE id = ? 
             AND usuario_id = ?
             LIMIT 1`,
            [turno_id, usuario_id]
        );
        
        if (turnos.length === 0) {
            console.log('❌ Turno no encontrado o no pertenece al usuario');
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado o no tiene permisos para cerrarlo',
                codigo: 'TURNO_NO_ENCONTRADO'
            });
        }
        
        const turno = turnos[0];
        
        if (turno.estado === 'cerrado') {
            console.log('❌ El turno ya está cerrado');
            return res.status(400).json({
                success: false,
                message: 'Este turno ya está cerrado',
                codigo: 'TURNO_YA_CERRADO',
                fecha_cierre: turno.fecha_cierre
            });
        }
        
        console.log(`✅ Turno válido para cierre`);
        req.turno = turno;
        next();
        
    } catch (error) {
        console.error('❌ Error validando turno para cierre:', error);
        res.status(500).json({
            success: false,
            message: 'Error validando turno',
            error: error.message
        });
    }
};

module.exports = {
    validarTurnoAbierto,
    validarNoTurnoAbierto,
    validarTurnoParaCierre
};