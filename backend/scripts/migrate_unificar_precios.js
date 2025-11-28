// migrate_unificar_precios.js
// Migración: Unificar precio_tarjeta y precio_efectivo en una sola columna 'precio'

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    let connection = null;
    
    try {
        console.log('🔧 Conectando a la base de datos...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });
        
        console.log('✅ Conexión establecida');
        console.log('\n💰 UNIFICANDO COLUMNAS DE PRECIO...\n');

        // ========================================================================
        // TABLA: medicamentos
        // ========================================================================
        console.log('💊 Procesando tabla: medicamentos...');
        
        // Verificar columnas actuales
        const [medicamentosColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'medicamentos' 
            AND TABLE_SCHEMA = DATABASE()
            AND COLUMN_NAME IN ('precio_tarjeta', 'precio_efectivo', 'precio')
        `);
        
        const medicamentosColumnsNames = medicamentosColumns.map(col => col.COLUMN_NAME);
        console.log('📊 Columnas actuales:', medicamentosColumnsNames);

        // Verificar datos antes de migrar
        const [medicamentosData] = await connection.execute(`
            SELECT COUNT(*) as total,
                   AVG(precio_tarjeta) as promedio_tarjeta,
                   AVG(precio_efectivo) as promedio_efectivo
            FROM medicamentos
        `);
        console.log(`📈 Registros en medicamentos: ${medicamentosData[0].total}`);
        const promedioTarjeta = medicamentosData[0].promedio_tarjeta ? parseFloat(medicamentosData[0].promedio_tarjeta).toFixed(2) : '0.00';
        const promedioEfectivo = medicamentosData[0].promedio_efectivo ? parseFloat(medicamentosData[0].promedio_efectivo).toFixed(2) : '0.00';
        console.log(`💳 Promedio precio_tarjeta: Q${promedioTarjeta}`);
        console.log(`💵 Promedio precio_efectivo: Q${promedioEfectivo}`);

        if (!medicamentosColumnsNames.includes('precio')) {
            // Renombrar precio_tarjeta a precio
            console.log('🔄 Renombrando precio_tarjeta → precio...');
            await connection.execute(`
                ALTER TABLE medicamentos 
                CHANGE COLUMN precio_tarjeta precio DECIMAL(10,2) NOT NULL
            `);
            console.log('✅ Columna renombrada: precio_tarjeta → precio');
        } else {
            console.log('⚠️  La columna "precio" ya existe, omitiendo renombrado');
        }

        if (medicamentosColumnsNames.includes('precio_efectivo')) {
            // Eliminar precio_efectivo
            console.log('🗑️  Eliminando columna precio_efectivo...');
            await connection.execute(`
                ALTER TABLE medicamentos 
                DROP COLUMN precio_efectivo
            `);
            console.log('✅ Columna eliminada: precio_efectivo');
        } else {
            console.log('⚠️  La columna precio_efectivo ya fue eliminada');
        }

        // ========================================================================
        // TABLA: servicios
        // ========================================================================
        console.log('\n🏥 Procesando tabla: servicios...');
        
        // Verificar columnas actuales
        const [serviciosColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'servicios' 
            AND TABLE_SCHEMA = DATABASE()
            AND COLUMN_NAME IN ('precio_tarjeta', 'precio_efectivo', 'precio')
        `);
        
        const serviciosColumnsNames = serviciosColumns.map(col => col.COLUMN_NAME);
        console.log('📊 Columnas actuales:', serviciosColumnsNames);

        // Verificar datos antes de migrar
        const [serviciosData] = await connection.execute(`
            SELECT COUNT(*) as total,
                   AVG(precio_tarjeta) as promedio_tarjeta,
                   AVG(precio_efectivo) as promedio_efectivo
            FROM servicios
        `);
        console.log(`📈 Registros en servicios: ${serviciosData[0].total}`);
        const promedioTarjetaServ = serviciosData[0].promedio_tarjeta ? parseFloat(serviciosData[0].promedio_tarjeta).toFixed(2) : '0.00';
        const promedioEfectivoServ = serviciosData[0].promedio_efectivo ? parseFloat(serviciosData[0].promedio_efectivo).toFixed(2) : '0.00';
        console.log(`💳 Promedio precio_tarjeta: Q${promedioTarjetaServ}`);
        console.log(`💵 Promedio precio_efectivo: Q${promedioEfectivoServ}`);

        if (!serviciosColumnsNames.includes('precio')) {
            // Renombrar precio_tarjeta a precio
            console.log('🔄 Renombrando precio_tarjeta → precio...');
            await connection.execute(`
                ALTER TABLE servicios 
                CHANGE COLUMN precio_tarjeta precio DECIMAL(10,2) NOT NULL
            `);
            console.log('✅ Columna renombrada: precio_tarjeta → precio');
        } else {
            console.log('⚠️  La columna "precio" ya existe, omitiendo renombrado');
        }

        if (serviciosColumnsNames.includes('precio_efectivo')) {
            // Eliminar precio_efectivo
            console.log('🗑️  Eliminando columna precio_efectivo...');
            await connection.execute(`
                ALTER TABLE servicios 
                DROP COLUMN precio_efectivo
            `);
            console.log('✅ Columna eliminada: precio_efectivo');
        } else {
            console.log('⚠️  La columna precio_efectivo ya fue eliminada');
        }

        // ========================================================================
        // VERIFICACIÓN FINAL
        // ========================================================================
        console.log('\n📋 Verificación final...');
        
        const [medicamentosFinal] = await connection.execute(`
            SELECT COLUMN_NAME, COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'medicamentos' 
            AND TABLE_SCHEMA = DATABASE()
            AND COLUMN_NAME LIKE '%precio%'
        `);
        
        console.log('\n💊 Columnas de precio en medicamentos:');
        medicamentosFinal.forEach(col => {
            console.log(`   ✓ ${col.COLUMN_NAME} (${col.COLUMN_TYPE})`);
        });

        const [serviciosFinal] = await connection.execute(`
            SELECT COLUMN_NAME, COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'servicios' 
            AND TABLE_SCHEMA = DATABASE()
            AND COLUMN_NAME LIKE '%precio%'
        `);
        
        console.log('\n🏥 Columnas de precio en servicios:');
        serviciosFinal.forEach(col => {
            console.log(`   ✓ ${col.COLUMN_NAME} (${col.COLUMN_TYPE})`);
        });

        console.log('\n🎉 ¡Migración completada exitosamente!');
        console.log('💰 Columnas unificadas: precio_tarjeta + precio_efectivo → precio');
        
    } catch (error) {
        console.error('❌ Error en migración:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

migrate()
    .then(() => {
        console.log('\n✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });