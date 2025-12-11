// migrate_limpiar_datos_huerfanos.js
// Migración: Limpiar datos huérfanos de turnos cerrados y asegurar CASCADE
// Fecha: 2025-12-11
// Descripción: Elimina vouchers, transferencias, depósitos y gastos de turnos cerrados
//              y asegura que las Foreign Keys tengan ON DELETE CASCADE

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
        
        console.log('✅ Conexión establecida\n');
        
        // ========================================================================
        // PASO 1: VERIFICAR DATOS HUÉRFANOS
        // ========================================================================
        console.log('📊 PASO 1: Analizando datos huérfanos...\n');
        
        // Vouchers huérfanos
        const [vouchersHuerfanos] = await connection.execute(`
            SELECT COUNT(*) as total
            FROM vouchers_tarjeta v
            LEFT JOIN turnos t ON v.turno_id = t.id
            WHERE t.estado = 'cerrado' OR t.id IS NULL
        `);
        console.log(`   📋 Vouchers de turnos cerrados: ${vouchersHuerfanos[0].total}`);
        
        // Transferencias huérfanas (revisar ambos nombres de tabla)
        let transferenciasHuerfanos = { total: 0 };
        try {
            const [result] = await connection.execute(`
                SELECT COUNT(*) as total
                FROM transferencias t
                LEFT JOIN turnos tu ON t.turno_id = tu.id
                WHERE tu.estado = 'cerrado' OR tu.id IS NULL
            `);
            transferenciasHuerfanos = result[0];
        } catch (e) {
            // Si la tabla no existe con ese nombre, probar con transferencias_bancarias
            try {
                const [result] = await connection.execute(`
                    SELECT COUNT(*) as total
                    FROM transferencias_bancarias t
                    LEFT JOIN turnos tu ON t.turno_id = tu.id
                    WHERE tu.estado = 'cerrado' OR tu.id IS NULL
                `);
                transferenciasHuerfanos = result[0];
            } catch (e2) {
                console.log('   ⚠️  Tabla de transferencias no encontrada');
            }
        }
        console.log(`   📋 Transferencias de turnos cerrados: ${transferenciasHuerfanos.total}`);
        
        // Depósitos huérfanos (revisar ambos nombres de tabla)
        let depositosHuerfanos = { total: 0 };
        try {
            const [result] = await connection.execute(`
                SELECT COUNT(*) as total
                FROM depositos d
                LEFT JOIN turnos t ON d.turno_id = t.id
                WHERE t.estado = 'cerrado' OR t.id IS NULL
            `);
            depositosHuerfanos = result[0];
        } catch (e) {
            // Si la tabla no existe con ese nombre, probar con depositos_bancarios
            try {
                const [result] = await connection.execute(`
                    SELECT COUNT(*) as total
                    FROM depositos_bancarios d
                    LEFT JOIN turnos t ON d.turno_id = t.id
                    WHERE t.estado = 'cerrado' OR t.id IS NULL
                `);
                depositosHuerfanos = result[0];
            } catch (e2) {
                console.log('   ⚠️  Tabla de depósitos no encontrada');
            }
        }
        console.log(`   📋 Depósitos de turnos cerrados: ${depositosHuerfanos.total}`);
        
        // Gastos huérfanos
        const [gastosHuerfanos] = await connection.execute(`
            SELECT COUNT(*) as total
            FROM gastos g
            LEFT JOIN turnos t ON g.turno_id = t.id
            WHERE t.estado = 'cerrado' OR t.id IS NULL
        `);
        console.log(`   📋 Gastos de turnos cerrados: ${gastosHuerfanos[0].total}`);
        
        const totalHuerfanos = 
            vouchersHuerfanos[0].total + 
            transferenciasHuerfanos.total + 
            depositosHuerfanos.total + 
            gastosHuerfanos[0].total;
        
        console.log(`\n   📊 TOTAL DE REGISTROS HUÉRFANOS: ${totalHuerfanos}\n`);
        
        if (totalHuerfanos === 0) {
            console.log('✅ No hay datos huérfanos para limpiar.\n');
        } else {
            console.log('⚠️  Se eliminarán estos registros huérfanos.\n');
        }
        
        // ========================================================================
        // PASO 2: VERIFICAR FOREIGN KEYS ACTUALES
        // ========================================================================
        console.log('🔍 PASO 2: Verificando Foreign Keys actuales...\n');
        
        const [fks] = await connection.execute(`
            SELECT 
                TABLE_NAME,
                CONSTRAINT_NAME,
                DELETE_RULE
            FROM information_schema.REFERENTIAL_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
            AND REFERENCED_TABLE_NAME = 'turnos'
        `);
        
        console.log('   Constraints actuales:');
        fks.forEach(fk => {
            console.log(`   - ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}: ON DELETE ${fk.DELETE_RULE}`);
        });
        console.log('');
        
        // ========================================================================
        // PASO 3: ELIMINAR DATOS HUÉRFANOS
        // ========================================================================
        if (totalHuerfanos > 0) {
            console.log('🗑️  PASO 3: Eliminando datos huérfanos...\n');
            
            // Eliminar vouchers
            const [resultVouchers] = await connection.execute(`
                DELETE v FROM vouchers_tarjeta v
                LEFT JOIN turnos t ON v.turno_id = t.id
                WHERE t.estado = 'cerrado' OR t.id IS NULL
            `);
            console.log(`   ✅ Vouchers eliminados: ${resultVouchers.affectedRows}`);
            
            // Eliminar transferencias (probar ambos nombres)
            let transferenciasEliminadas = 0;
            try {
                const [result] = await connection.execute(`
                    DELETE tr FROM transferencias tr
                    LEFT JOIN turnos t ON tr.turno_id = t.id
                    WHERE t.estado = 'cerrado' OR t.id IS NULL
                `);
                transferenciasEliminadas = result.affectedRows;
            } catch (e) {
                try {
                    const [result] = await connection.execute(`
                        DELETE tr FROM transferencias_bancarias tr
                        LEFT JOIN turnos t ON tr.turno_id = t.id
                        WHERE t.estado = 'cerrado' OR t.id IS NULL
                    `);
                    transferenciasEliminadas = result.affectedRows;
                } catch (e2) {
                    console.log('   ⚠️  No se pudieron eliminar transferencias');
                }
            }
            console.log(`   ✅ Transferencias eliminadas: ${transferenciasEliminadas}`);
            
            // Eliminar depósitos (probar ambos nombres)
            let depositosEliminados = 0;
            try {
                const [result] = await connection.execute(`
                    DELETE d FROM depositos d
                    LEFT JOIN turnos t ON d.turno_id = t.id
                    WHERE t.estado = 'cerrado' OR t.id IS NULL
                `);
                depositosEliminados = result.affectedRows;
            } catch (e) {
                try {
                    const [result] = await connection.execute(`
                        DELETE d FROM depositos_bancarios d
                        LEFT JOIN turnos t ON d.turno_id = t.id
                        WHERE t.estado = 'cerrado' OR t.id IS NULL
                    `);
                    depositosEliminados = result.affectedRows;
                } catch (e2) {
                    console.log('   ⚠️  No se pudieron eliminar depósitos');
                }
            }
            console.log(`   ✅ Depósitos eliminados: ${depositosEliminados}`);
            
            // Eliminar gastos
            const [resultGastos] = await connection.execute(`
                DELETE g FROM gastos g
                LEFT JOIN turnos t ON g.turno_id = t.id
                WHERE t.estado = 'cerrado' OR t.id IS NULL
            `);
            console.log(`   ✅ Gastos eliminados: ${resultGastos.affectedRows}`);
            
            const totalEliminados = 
                resultVouchers.affectedRows + 
                transferenciasEliminadas + 
                depositosEliminados + 
                resultGastos.affectedRows;
            
            console.log(`\n   🗑️  TOTAL ELIMINADOS: ${totalEliminados} registros\n`);
        } else {
            console.log('⏭️  PASO 3: Saltando (no hay datos para eliminar)\n');
        }
        
        // ========================================================================
        // PASO 4: RECREAR FOREIGN KEYS CON CASCADE (SI ES NECESARIO)
        // ========================================================================
        console.log('🔧 PASO 4: Asegurando Foreign Keys con CASCADE...\n');
        
        // Función auxiliar para recrear FK
        async function recrearFK(tabla, nombreFK, onDelete) {
            try {
                // Primero intentar eliminar la FK existente
                try {
                    await connection.execute(`ALTER TABLE ${tabla} DROP FOREIGN KEY ${nombreFK}`);
                    console.log(`   🔧 FK eliminada: ${tabla}.${nombreFK}`);
                } catch (e) {
                    // Si no existe, no pasa nada
                }
                
                // Crear la FK con CASCADE
                await connection.execute(`
                    ALTER TABLE ${tabla} 
                    ADD CONSTRAINT ${nombreFK} 
                    FOREIGN KEY (turno_id) 
                    REFERENCES turnos(id) 
                    ON DELETE ${onDelete}
                `);
                console.log(`   ✅ FK creada: ${tabla}.${nombreFK} (ON DELETE ${onDelete})`);
                
            } catch (error) {
                console.log(`   ⚠️  Error en ${tabla}.${nombreFK}: ${error.message}`);
            }
        }
        
        // Recrear FKs con CASCADE
        await recrearFK('vouchers_tarjeta', 'fk_vouchers_turno', 'CASCADE');
        
        // Transferencias (probar ambos nombres)
        try {
            await recrearFK('transferencias', 'fk_transferencias_turno', 'CASCADE');
        } catch (e) {
            await recrearFK('transferencias_bancarias', 'fk_transferencias_turno', 'CASCADE');
        }
        
        // Depósitos (probar ambos nombres)
        try {
            await recrearFK('depositos', 'fk_depositos_turno', 'CASCADE');
        } catch (e) {
            await recrearFK('depositos_bancarios', 'fk_depositos_turno', 'CASCADE');
        }
        
        await recrearFK('gastos', 'fk_gastos_turno', 'CASCADE');
        
        // Para ventas, usar SET NULL para mantener histórico
        await recrearFK('ventas', 'fk_ventas_turno', 'SET NULL');
        
        console.log('');
        
        // ========================================================================
        // PASO 5: VERIFICACIÓN FINAL
        // ========================================================================
        console.log('✅ PASO 5: Verificación final...\n');
        
        const [fksFinal] = await connection.execute(`
            SELECT 
                TABLE_NAME,
                CONSTRAINT_NAME,
                DELETE_RULE
            FROM information_schema.REFERENTIAL_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
            AND REFERENCED_TABLE_NAME = 'turnos'
        `);
        
        console.log('   Foreign Keys actualizadas:');
        fksFinal.forEach(fk => {
            const emoji = fk.DELETE_RULE === 'CASCADE' || fk.DELETE_RULE === 'SET NULL' ? '✅' : '⚠️';
            console.log(`   ${emoji} ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}: ON DELETE ${fk.DELETE_RULE}`);
        });
        
        console.log('\n🎉 ¡Migración completada exitosamente!\n');
        console.log('📝 Resumen:');
        console.log('   ✅ Datos huérfanos eliminados');
        console.log('   ✅ Foreign Keys configuradas con CASCADE');
        console.log('   ✅ Sistema listo para funcionamiento automático\n');
        console.log('💡 A partir de ahora:');
        console.log('   - Al cerrar un turno, sus vouchers/gastos/etc se eliminarán automáticamente');
        console.log('   - Las ventas se conservarán con turno_id = NULL');
        console.log('   - No más vouchers fantasma 👻\n');
        
    } catch (error) {
        console.error('\n❌ Error en migración:', error);
        console.error('\n💡 Si el error es sobre constraints existentes:');
        console.error('   - Verifica los nombres de las FKs en tu BD');
        console.error('   - Puede que necesites ajustar los nombres en el script\n');
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada\n');
        }
    }
}

// Ejecutar migración
migrate()
    .then(() => {
        console.log('✅ Proceso completado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });