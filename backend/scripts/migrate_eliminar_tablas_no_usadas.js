// migrate_eliminar_tablas_no_usadas.js
// Migración: Eliminar tablas jornadas_ultrasonidos y combos_promociones

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
        console.log('\n🗑️  ELIMINANDO TABLAS NO USADAS...\n');

        // ========================================================================
        // VERIFICAR SI LAS TABLAS EXISTEN Y MOSTRAR INFORMACIÓN
        // ========================================================================
        
        // Verificar jornadas_ultrasonidos
        const [jornadasRows] = await connection.execute(
            `SELECT COUNT(*) as count FROM information_schema.tables 
             WHERE table_schema = DATABASE() AND table_name = 'jornadas_ultrasonidos'`
        );
        
        if (jornadasRows[0].count > 0) {
            const [jornadasData] = await connection.execute('SELECT COUNT(*) as total FROM jornadas_ultrasonidos');
            console.log(`📊 Tabla jornadas_ultrasonidos encontrada - Registros: ${jornadasData[0].total}`);
        }

        // Verificar combos_promociones
        const [combosRows] = await connection.execute(
            `SELECT COUNT(*) as count FROM information_schema.tables 
             WHERE table_schema = DATABASE() AND table_name = 'combos_promociones'`
        );
        
        if (combosRows[0].count > 0) {
            const [combosData] = await connection.execute('SELECT COUNT(*) as total FROM combos_promociones');
            console.log(`📊 Tabla combos_promociones encontrada - Registros: ${combosData[0].total}`);
        }

        console.log('\n⚠️  Procediendo a eliminar tablas...\n');

        // ========================================================================
        // ELIMINAR TABLA: jornadas_ultrasonidos
        // ========================================================================
        console.log('🗑️  Eliminando tabla: jornadas_ultrasonidos...');
        await connection.execute('DROP TABLE IF EXISTS jornadas_ultrasonidos');
        console.log('✅ Tabla jornadas_ultrasonidos eliminada');

        // ========================================================================
        // ELIMINAR TABLA: combos_promociones
        // ========================================================================
        console.log('🗑️  Eliminando tabla: combos_promociones...');
        await connection.execute('DROP TABLE IF EXISTS combos_promociones');
        console.log('✅ Tabla combos_promociones eliminada');

        // ========================================================================
        // VERIFICAR TABLAS RESTANTES
        // ========================================================================
        console.log('\n📋 Verificando tablas restantes...');
        
        const [allTables] = await connection.execute('SHOW TABLES');
        console.log(`\n✅ Total de tablas en la base de datos: ${allTables.length}`);
        
        console.log('\n🎉 ¡Migración completada exitosamente!');
        console.log('🗑️  Tablas eliminadas: jornadas_ultrasonidos, combos_promociones');
        
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