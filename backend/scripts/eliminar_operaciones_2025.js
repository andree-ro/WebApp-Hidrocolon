// eliminar_operaciones_2025.js
// Script para eliminar todas las operaciones del año 2025 del libro de bancos
const mysql = require('mysql2/promise');
require('dotenv').config();

async function eliminarOperaciones2025() {
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
        
        await connection.beginTransaction();
        
        console.log('✅ Conexión establecida\n');
        
        // ========================================================================
        // 1. MOSTRAR RESUMEN DE OPERACIONES DEL 2025 ANTES DE ELIMINAR
        // ========================================================================
        console.log('📊 Analizando operaciones del 2025...\n');
        
        const [resumen2025] = await connection.execute(`
            SELECT 
                clasificacion,
                COUNT(*) as cantidad,
                SUM(ingreso) as total_ingresos,
                SUM(egreso) as total_egresos
            FROM libro_bancos
            WHERE YEAR(fecha) = 2025
            GROUP BY clasificacion
            ORDER BY clasificacion
        `);
        
        if (resumen2025.length === 0) {
            console.log('ℹ️  No hay operaciones del 2025 en el libro de bancos.');
            console.log('✅ No hay nada que eliminar.\n');
            await connection.end();
            return;
        }
        
        console.log('📋 Operaciones del 2025 a eliminar:\n');
        
        let totalOperaciones2025 = 0;
        let totalIngresos2025 = 0;
        let totalEgresos2025 = 0;
        
        resumen2025.forEach(item => {
            const tipo = item.total_ingresos > 0 ? 'INGRESO' : 'EGRESO';
            const monto = item.total_ingresos > 0 ? item.total_ingresos : item.total_egresos;
            console.log(`   ${item.clasificacion.padEnd(30)} | ${tipo.padEnd(8)} | ${item.cantidad} ops | Q${parseFloat(monto).toFixed(2)}`);
            totalOperaciones2025 += item.cantidad;
            totalIngresos2025 += parseFloat(item.total_ingresos || 0);
            totalEgresos2025 += parseFloat(item.total_egresos || 0);
        });
        
        console.log('\n📈 Totales del 2025:');
        console.log(`   Total operaciones: ${totalOperaciones2025}`);
        console.log(`   Total ingresos: Q${totalIngresos2025.toFixed(2)}`);
        console.log(`   Total egresos: Q${totalEgresos2025.toFixed(2)}`);
        
        // ========================================================================
        // 2. ELIMINAR OPERACIONES DEL 2025
        // ========================================================================
        console.log('\n🗑️  Eliminando operaciones del 2025...');
        
        const [resultado] = await connection.execute(`
            DELETE FROM libro_bancos 
            WHERE YEAR(fecha) = 2025
        `);
        
        console.log(`   ✅ ${resultado.affectedRows} operaciones eliminadas`);
        
        // ========================================================================
        // 3. RECALCULAR SALDOS DE LAS OPERACIONES RESTANTES
        // ========================================================================
        console.log('\n🔄 Recalculando saldos de operaciones restantes...');
        
        // Obtener saldo inicial
        const [saldoInicial] = await connection.execute(`
            SELECT saldo_inicial FROM saldo_inicial_bancos WHERE activo = 1 LIMIT 1
        `);
        
        let saldoActual = parseFloat(saldoInicial[0].saldo_inicial);
        console.log(`   📊 Saldo inicial: Q${saldoActual.toFixed(2)}`);
        
        // Obtener todas las operaciones restantes ordenadas por fecha e id
        const [operaciones] = await connection.execute(`
            SELECT id, ingreso, egreso, fecha
            FROM libro_bancos
            ORDER BY fecha ASC, id ASC
        `);
        
        console.log(`   📋 Operaciones restantes: ${operaciones.length}`);
        
        // Recalcular saldo de cada operación
        for (const operacion of operaciones) {
            saldoActual = saldoActual + parseFloat(operacion.ingreso) - parseFloat(operacion.egreso);
            
            await connection.execute(`
                UPDATE libro_bancos 
                SET saldo_bancos = ?
                WHERE id = ?
            `, [saldoActual, operacion.id]);
        }
        
        console.log(`   ✅ Saldos recalculados correctamente`);
        console.log(`   📊 Saldo final: Q${saldoActual.toFixed(2)}`);
        
        // ========================================================================
        // 4. MOSTRAR RESUMEN FINAL
        // ========================================================================
        console.log('\n📊 Resumen de operaciones restantes (solo 2026):');
        
        const [resumen2026] = await connection.execute(`
            SELECT 
                clasificacion,
                COUNT(*) as cantidad,
                SUM(ingreso) as total_ingresos,
                SUM(egreso) as total_egresos
            FROM libro_bancos
            GROUP BY clasificacion
            ORDER BY clasificacion
        `);
        
        console.log('');
        resumen2026.forEach(item => {
            const tipo = item.total_ingresos > 0 ? 'INGRESO' : 'EGRESO';
            const monto = item.total_ingresos > 0 ? item.total_ingresos : item.total_egresos;
            console.log(`   ${item.clasificacion.padEnd(30)} | ${tipo.padEnd(8)} | ${item.cantidad} ops | Q${parseFloat(monto).toFixed(2)}`);
        });
        
        const [totales] = await connection.execute(`
            SELECT 
                COUNT(*) as total_operaciones,
                SUM(ingreso) as total_ingresos,
                SUM(egreso) as total_egresos
            FROM libro_bancos
        `);
        
        console.log('\n📈 Totales generales (solo 2026):');
        console.log(`   Total operaciones: ${totales[0].total_operaciones}`);
        console.log(`   Total ingresos: Q${parseFloat(totales[0].total_ingresos).toFixed(2)}`);
        console.log(`   Total egresos: Q${parseFloat(totales[0].total_egresos).toFixed(2)}`);
        console.log(`   Saldo actual: Q${saldoActual.toFixed(2)}`);
        
        // Mostrar fechas restantes
        console.log('\n📅 Rango de fechas restantes:');
        const [rangoFechas] = await connection.execute(`
            SELECT 
                MIN(fecha) as fecha_primera,
                MAX(fecha) as fecha_ultima
            FROM libro_bancos
        `);
        
        if (rangoFechas[0].fecha_primera) {
            const fechaPrimera = new Date(rangoFechas[0].fecha_primera + 'T00:00:00');
            const fechaUltima = new Date(rangoFechas[0].fecha_ultima + 'T00:00:00');
            
            console.log(`   Primera operación: ${fechaPrimera.toLocaleDateString('es-GT')}`);
            console.log(`   Última operación: ${fechaUltima.toLocaleDateString('es-GT')}`);
        }
        
        await connection.commit();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 ¡Operaciones del 2025 eliminadas exitosamente!');
        console.log('='.repeat(60));
        console.log(`\n✅ ${totalOperaciones2025} operaciones eliminadas`);
        console.log('✅ Saldos recalculados correctamente');
        console.log('✅ Solo quedan operaciones del 2026\n');
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('\n❌ Error eliminando operaciones:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

eliminarOperaciones2025()
    .then(() => {
        console.log('\n✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });