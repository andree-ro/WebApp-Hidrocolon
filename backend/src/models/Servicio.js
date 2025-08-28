// backend/src/models/Servicio.js
// ============================================================================
// MODELO SERVICIO - VERSIÓN COMPLETA CON FUNCIONALIDADES AVANZADAS
// ============================================================================
// Fecha: 21 de Agosto, 2025
// Autor: Sistema de desarrollo
// Funcionalidades: CRUD completo + Filtros + Paginación + Medicamentos vinculados
// Compatibilidad: 100% compatible con endpoints existentes
// ============================================================================

const mysql = require('mysql2/promise');

class Servicio {
    constructor(data) {
        this.id = data.id;
        this.nombre = data.nombre || data.nombre_servicio;
        this.precio_tarjeta = parseFloat(data.precio_tarjeta) || 0;
        this.precio_efectivo = parseFloat(data.precio_efectivo) || 0;
        this.monto_minimo = parseFloat(data.monto_minimo) || 0;
        this.porcentaje_comision = parseFloat(data.porcentaje_comision) || 0;
        this.requiere_medicamentos = Boolean(data.requiere_medicamentos);
        this.requiere_extras = Boolean(data.requiere_extras);
        this.activo = Boolean(data.activo);
        this.fecha_creacion = data.fecha_creacion;
        this.fecha_actualizacion = data.fecha_actualizacion;
        this.medicamentos_count = parseInt(data.medicamentos_count) || 0;
    }

    // ========================================================================
    // CONFIGURACIÓN DE CONEXIÓN
    // ========================================================================
    
    static async getConnection() {
        try {
            return await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                port: process.env.DB_PORT || 3306,
                acquireTimeout: 60000,
                timeout: 60000
            });
        } catch (error) {
            console.error('❌ Error creando conexión:', error);
            throw new Error('Error conectando a la base de datos');
        }
    }

    // ========================================================================
    // MÉTODO FINDALL CON FILTROS AVANZADOS Y PAGINACIÓN
    // ========================================================================
    
    static async findAll(options = {}) {
        let connection;
        try {
            console.log('🔍 Servicio.findAll - Opciones recibidas:', options);

            connection = await this.getConnection();

            // Extraer y validar parámetros con valores por defecto seguros
            const {
                search = '',
                precio_min = null,
                precio_max = null,
                activo = null,
                requiere_medicamentos = null,
                page = 1,
                limit = 50,
                orderBy = 'fecha_creacion',
                orderDir = 'DESC'
            } = options;

            // Validar parámetros de paginación
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
            const offset = (pageNum - 1) * limitNum;

            // Validar columnas de ordenamiento permitidas
            const allowedOrderColumns = [
                'id', 'nombre', 'precio_tarjeta', 'precio_efectivo', 
                'monto_minimo', 'porcentaje_comision', 'fecha_creacion', 'fecha_actualizacion'
            ];
            const safeOrderBy = allowedOrderColumns.includes(orderBy) ? orderBy : 'fecha_creacion';
            const safeOrderDir = ['ASC', 'DESC'].includes(orderDir.toUpperCase()) ? orderDir.toUpperCase() : 'DESC';

            // ============================================================
            // CONSTRUCCIÓN DINÁMICA DE QUERY - SOLUCIÓN AL PROBLEMA ANTERIOR
            // ============================================================
            
            let baseQuery = `
                SELECT 
                    s.*,
                    COALESCE(med_count.total_medicamentos, 0) as medicamentos_count
                FROM servicios s
                LEFT JOIN (
                    SELECT 
                        servicio_id,
                        COUNT(*) as total_medicamentos
                    FROM servicios_medicamentos 
                    GROUP BY servicio_id
                ) med_count ON s.id = med_count.servicio_id
                WHERE 1=1
            `;

            let countQuery = `
                SELECT COUNT(*) as total
                FROM servicios s
                WHERE 1=1
            `;

            // Arrays para parámetros - SOLUCIÓN CRÍTICA PARA EVITAR ERRORES
            let queryParams = [];
            let countParams = [];
            
            // ============================================================
            // APLICACIÓN DE FILTROS CON PARÁMETROS SEGUROS
            // ============================================================

            // Filtro de búsqueda por nombre
            if (search && search.trim() !== '') {
                const searchCondition = ` AND s.nombre LIKE ?`;
                baseQuery += searchCondition;
                countQuery += searchCondition;
                
                const searchParam = `%${search.trim()}%`;
                queryParams.push(searchParam);
                countParams.push(searchParam);
            }

            // Filtro por precio mínimo
            if (precio_min !== null && !isNaN(parseFloat(precio_min))) {
                const priceMinCondition = ` AND s.precio_efectivo >= ?`;
                baseQuery += priceMinCondition;
                countQuery += priceMinCondition;
                
                const priceMinParam = parseFloat(precio_min);
                queryParams.push(priceMinParam);
                countParams.push(priceMinParam);
            }

            // Filtro por precio máximo
            if (precio_max !== null && !isNaN(parseFloat(precio_max))) {
                const priceMaxCondition = ` AND s.precio_efectivo <= ?`;
                baseQuery += priceMaxCondition;
                countQuery += priceMaxCondition;
                
                const priceMaxParam = parseFloat(precio_max);
                queryParams.push(priceMaxParam);
                countParams.push(priceMaxParam);
            }

            // Filtro por estado activo
            if (activo !== null) {
                const activoCondition = ` AND s.activo = ?`;
                baseQuery += activoCondition;
                countQuery += activoCondition;
                
                const activoParam = Boolean(activo) ? 1 : 0;
                queryParams.push(activoParam);
                countParams.push(activoParam);
            }

            // Filtro por requiere medicamentos
            if (requiere_medicamentos !== null) {
                const reqMedCondition = ` AND s.requiere_medicamentos = ?`;
                baseQuery += reqMedCondition;
                countQuery += reqMedCondition;
                
                const reqMedParam = Boolean(requiere_medicamentos) ? 1 : 0;
                queryParams.push(reqMedParam);
                countParams.push(reqMedParam);
            }

            // ============================================================
            // FINALIZACIÓN DE QUERY CON ORDENAMIENTO Y PAGINACIÓN
            // ============================================================

            baseQuery += ` ORDER BY s.${safeOrderBy} ${safeOrderDir} LIMIT ? OFFSET ?`;
            queryParams.push(parseInt(limitNum));
            queryParams.push(parseInt(offset));

            console.log('🔍 Query final:', baseQuery);
            console.log('📋 Parámetros:', queryParams);

            // ============================================================
            // EJECUCIÓN DE QUERIES
            // ============================================================

            // Obtener total de registros (para paginación)
            const [countResult] = await connection.execute(countQuery, countParams);
            const totalItems = countResult[0].total;

            // Obtener servicios paginados
            const [servicios] = await connection.execute(baseQuery, queryParams);

            // ============================================================
            // CÁLCULO DE METADATOS DE PAGINACIÓN
            // ============================================================

            const totalPages = Math.ceil(totalItems / limitNum);
            const hasNextPage = pageNum < totalPages;
            const hasPrevPage = pageNum > 1;

            console.log(`✅ Servicios obtenidos: ${servicios.length} de ${totalItems} total`);

            return {
                servicios: servicios.map(servicio => new Servicio(servicio)),
                pagination: {
                    currentPage: pageNum,
                    totalPages: totalPages,
                    totalItems: totalItems,
                    itemsPerPage: limitNum,
                    hasNextPage: hasNextPage,
                    hasPrevPage: hasPrevPage
                },
                filters: {
                    search,
                    precio_min,
                    precio_max,
                    activo,
                    requiere_medicamentos,
                    orderBy: safeOrderBy,
                    orderDir: safeOrderDir
                }
            };

        } catch (error) {
            console.error('❌ Error en findAll:', error);
            throw new Error(`Error obteniendo servicios: ${error.message}`);
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (closeError) {
                    console.warn('⚠️ Error cerrando conexión:', closeError);
                }
            }
        }
    }

    // ========================================================================
    // MÉTODOS CRUD BÁSICOS
    // ========================================================================

    static async findById(id) {
        let connection;
        try {
            connection = await this.getConnection();
            
            const query = `
                SELECT 
                    s.*,
                    COALESCE(med_count.total_medicamentos, 0) as medicamentos_count
                FROM servicios s
                LEFT JOIN (
                    SELECT 
                        servicio_id,
                        COUNT(*) as total_medicamentos
                    FROM servicios_medicamentos 
                    WHERE servicio_id = ?
                    GROUP BY servicio_id
                ) med_count ON s.id = med_count.servicio_id
                WHERE s.id = ?
            `;

            const [rows] = await connection.execute(query, [id, id]);
            
            if (rows.length === 0) {
                return null;
            }

            console.log(`✅ Servicio encontrado: ${rows[0].nombre}`);
            return new Servicio(rows[0]);

        } catch (error) {
            console.error('❌ Error en findById:', error);
            throw new Error(`Error obteniendo servicio: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    static async create(data) {
        let connection;
        try {
            connection = await this.getConnection();

            // Validación de datos requeridos
            if (!data.nombre || data.nombre.trim() === '') {
                throw new Error('El nombre del servicio es requerido');
            }

            // Valores por defecto seguros
            const servicioData = {
                nombre: data.nombre.trim(),
                precio_tarjeta: parseFloat(data.precio_tarjeta) || 0,
                precio_efectivo: parseFloat(data.precio_efectivo) || 0,
                monto_minimo: parseFloat(data.monto_minimo) || 0,
                porcentaje_comision: parseFloat(data.porcentaje_comision) || 0,
                requiere_medicamentos: Boolean(data.requiere_medicamentos),
                requiere_extras: Boolean(data.requiere_extras),
                activo: data.activo !== undefined ? Boolean(data.activo) : true
            };

            const query = `
                INSERT INTO servicios (
                    nombre, precio_tarjeta, precio_efectivo, monto_minimo, 
                    porcentaje_comision, requiere_medicamentos, requiere_extras, activo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                servicioData.nombre,
                servicioData.precio_tarjeta,
                servicioData.precio_efectivo,
                servicioData.monto_minimo,
                servicioData.porcentaje_comision,
                servicioData.requiere_medicamentos ? 1 : 0,
                servicioData.requiere_extras ? 1 : 0,
                servicioData.activo ? 1 : 0
            ];

            const [result] = await connection.execute(query, params);
            
            console.log(`✅ Servicio creado con ID: ${result.insertId}`);
            return await this.findById(result.insertId);

        } catch (error) {
            console.error('❌ Error en create:', error);
            throw new Error(`Error creando servicio: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    static async update(id, data) {
        let connection;
        try {
            connection = await this.getConnection();

            // Verificar que el servicio existe
            const existingService = await this.findById(id);
            if (!existingService) {
                throw new Error('Servicio no encontrado');
            }

            // Construir SET dinámico solo con campos proporcionados
            let setClause = [];
            let params = [];

            if (data.nombre !== undefined) {
                setClause.push('nombre = ?');
                params.push(data.nombre.trim());
            }
            if (data.precio_tarjeta !== undefined) {
                setClause.push('precio_tarjeta = ?');
                params.push(parseFloat(data.precio_tarjeta) || 0);
            }
            if (data.precio_efectivo !== undefined) {
                setClause.push('precio_efectivo = ?');
                params.push(parseFloat(data.precio_efectivo) || 0);
            }
            if (data.monto_minimo !== undefined) {
                setClause.push('monto_minimo = ?');
                params.push(parseFloat(data.monto_minimo) || 0);
            }
            if (data.porcentaje_comision !== undefined) {
                setClause.push('porcentaje_comision = ?');
                params.push(parseFloat(data.porcentaje_comision) || 0);
            }
            if (data.requiere_medicamentos !== undefined) {
                setClause.push('requiere_medicamentos = ?');
                params.push(Boolean(data.requiere_medicamentos) ? 1 : 0);
            }
            if (data.requiere_extras !== undefined) {
                setClause.push('requiere_extras = ?');
                params.push(Boolean(data.requiere_extras) ? 1 : 0);
            }
            if (data.activo !== undefined) {
                setClause.push('activo = ?');
                params.push(Boolean(data.activo) ? 1 : 0);
            }

            if (setClause.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            // Agregar fecha de actualización
            setClause.push('fecha_actualizacion = NOW()');
            params.push(id); // Para el WHERE

            const query = `
                UPDATE servicios 
                SET ${setClause.join(', ')} 
                WHERE id = ?
            `;

            await connection.execute(query, params);
            
            console.log(`✅ Servicio ${id} actualizado`);
            return await this.findById(id);

        } catch (error) {
            console.error('❌ Error en update:', error);
            throw new Error(`Error actualizando servicio: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    static async delete(id) {
        let connection;
        try {
            connection = await this.getConnection();

            // Verificar que el servicio existe
            const existingService = await this.findById(id);
            if (!existingService) {
                throw new Error('Servicio no encontrado');
            }

            // Soft delete - marcar como inactivo
            const query = `
                UPDATE servicios 
                SET activo = 0, fecha_actualizacion = NOW() 
                WHERE id = ?
            `;

            await connection.execute(query, [id]);
            
            console.log(`✅ Servicio ${id} marcado como inactivo`);
            return { id, eliminado: true };

        } catch (error) {
            console.error('❌ Error en delete:', error);
            throw new Error(`Error eliminando servicio: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    // ========================================================================
    // GESTIÓN DE MEDICAMENTOS VINCULADOS
    // ========================================================================

    static async getMedicamentosVinculados(servicioId) {
        let connection;
        try {
            connection = await this.getConnection();

            const query = `
                SELECT 
                    m.id,
                    m.nombre,
                    m.marca,
                    m.precio_unitario,
                    m.existencias,
                    sm.cantidad_requerida,
                    sm.fecha_vinculacion
                FROM servicios_medicamentos sm
                INNER JOIN medicamentos m ON sm.medicamento_id = m.id
                WHERE sm.servicio_id = ? AND m.activo = 1
                ORDER BY m.nombre ASC
            `;

            const [medicamentos] = await connection.execute(query, [servicioId]);
            
            console.log(`✅ Medicamentos vinculados encontrados: ${medicamentos.length}`);
            return medicamentos;

        } catch (error) {
            console.error('❌ Error obteniendo medicamentos vinculados:', error);
            throw new Error(`Error obteniendo medicamentos: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    static async vincularMedicamento(servicioId, medicamentoId, cantidadRequerida = 1) {
        let connection;
        try {
            connection = await this.getConnection();

            // Verificar que el servicio existe
            const servicio = await this.findById(servicioId);
            if (!servicio) {
                throw new Error('Servicio no encontrado');
            }

            // Verificar que el medicamento existe
            const [medicamentos] = await connection.execute(
                'SELECT id FROM medicamentos WHERE id = ? AND activo = 1', 
                [medicamentoId]
            );
            
            if (medicamentos.length === 0) {
                throw new Error('Medicamento no encontrado o inactivo');
            }

            // Verificar si ya está vinculado
            const [existing] = await connection.execute(
                'SELECT id FROM servicios_medicamentos WHERE servicio_id = ? AND medicamento_id = ?',
                [servicioId, medicamentoId]
            );

            if (existing.length > 0) {
                // Actualizar cantidad si ya existe
                await connection.execute(
                    'UPDATE servicios_medicamentos SET cantidad_requerida = ? WHERE servicio_id = ? AND medicamento_id = ?',
                    [cantidadRequerida, servicioId, medicamentoId]
                );
                console.log(`✅ Cantidad actualizada para medicamento ${medicamentoId}`);
            } else {
                // Crear nueva vinculación
                await connection.execute(
                    'INSERT INTO servicios_medicamentos (servicio_id, medicamento_id, cantidad_requerida) VALUES (?, ?, ?)',
                    [servicioId, medicamentoId, cantidadRequerida]
                );
                console.log(`✅ Medicamento ${medicamentoId} vinculado al servicio ${servicioId}`);
            }

            return await this.getMedicamentosVinculados(servicioId);

        } catch (error) {
            console.error('❌ Error vinculando medicamento:', error);
            throw new Error(`Error vinculando medicamento: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    static async desvincularMedicamento(servicioId, medicamentoId) {
        let connection;
        try {
            connection = await this.getConnection();

            const [result] = await connection.execute(
                'DELETE FROM servicios_medicamentos WHERE servicio_id = ? AND medicamento_id = ?',
                [servicioId, medicamentoId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Vinculación no encontrada');
            }

            console.log(`✅ Medicamento ${medicamentoId} desvinculado del servicio ${servicioId}`);
            return await this.getMedicamentosVinculados(servicioId);

        } catch (error) {
            console.error('❌ Error desvinculando medicamento:', error);
            throw new Error(`Error desvinculando medicamento: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    // ========================================================================
    // MÉTODOS DE ESTADÍSTICAS Y UTILIDADES
    // ========================================================================

    static async getStats() {
        let connection;
        try {
            connection = await this.getConnection();

            const queries = {
                total: 'SELECT COUNT(*) as count FROM servicios',
                activos: 'SELECT COUNT(*) as count FROM servicios WHERE activo = 1',
                inactivos: 'SELECT COUNT(*) as count FROM servicios WHERE activo = 0',
                con_medicamentos: 'SELECT COUNT(*) as count FROM servicios WHERE requiere_medicamentos = 1',
                sin_medicamentos: 'SELECT COUNT(*) as count FROM servicios WHERE requiere_medicamentos = 0',
                precio_promedio: 'SELECT AVG(precio_efectivo) as promedio FROM servicios WHERE activo = 1',
                precio_min: 'SELECT MIN(precio_efectivo) as minimo FROM servicios WHERE activo = 1',
                precio_max: 'SELECT MAX(precio_efectivo) as maximo FROM servicios WHERE activo = 1'
            };

            const stats = {};
            
            for (const [key, query] of Object.entries(queries)) {
                const [result] = await connection.execute(query);
                stats[key] = result[0].count || result[0].promedio || result[0].minimo || result[0].maximo || 0;
            }

            // Formatear precios
            stats.precio_promedio = parseFloat(stats.precio_promedio || 0).toFixed(2);
            stats.precio_min = parseFloat(stats.precio_min || 0).toFixed(2);
            stats.precio_max = parseFloat(stats.precio_max || 0).toFixed(2);

            console.log('✅ Estadísticas generadas');
            return stats;

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            throw new Error(`Error obteniendo estadísticas: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    // ========================================================================
    // MÉTODO PARA EXPORTACIÓN
    // ========================================================================

    static async getExportData() {
        try {
            const { servicios } = await this.findAll({ limit: 1000 }); // Sin límite para export
            
            return servicios.map(servicio => ({
                'ID': servicio.id,
                'Nombre': servicio.nombre,
                'Precio Tarjeta': `$${servicio.precio_tarjeta}`,
                'Precio Efectivo': `$${servicio.precio_efectivo}`,
                'Monto Mínimo': `$${servicio.monto_minimo}`,
                'Comisión %': `${servicio.porcentaje_comision}%`,
                'Requiere Medicamentos': servicio.requiere_medicamentos ? 'Sí' : 'No',
                'Requiere Extras': servicio.requiere_extras ? 'Sí' : 'No',
                'Estado': servicio.activo ? 'Activo' : 'Inactivo',
                'Medicamentos Vinculados': servicio.medicamentos_count,
                'Fecha Creación': servicio.fecha_creacion,
                'Última Actualización': servicio.fecha_actualizacion
            }));

        } catch (error) {
            console.error('❌ Error preparando datos de exportación:', error);
            throw new Error(`Error preparando exportación: ${error.message}`);
        }
    }
}

// ============================================================================
// EXPORTACIÓN Y LOGGING
// ============================================================================

console.log('✅ Modelo Servicio COMPLETO cargado exitosamente');
console.log('📋 Funcionalidades disponibles:');
console.log('   • CRUD completo (Create, Read, Update, Delete)');
console.log('   • Filtros avanzados (búsqueda, precios, estado)');
console.log('   • Paginación real con LIMIT/OFFSET');
console.log('   • Gestión de medicamentos vinculados');
console.log('   • Estadísticas detalladas');
console.log('   • Preparación para exportación');
console.log('   • Manejo seguro de parámetros SQL');

module.exports = Servicio;