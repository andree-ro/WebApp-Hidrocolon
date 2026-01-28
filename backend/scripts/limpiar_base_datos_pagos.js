// limpiar_base_datos.js
// Script para eliminar registros duplicados de vouchers, transferencias y depósitos en libro de bancos
const mysql = require('mysql2/promise');
require('dotenv').config();

async function limpiar() {
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
        console.log('🧹 Iniciando limpieza de datos duplicados...\n');
        
        // ========================================================================
        // 1. ELIMINAR VOUCHERS del libro de bancos
        // ========================================================================
        console.log('🎫 Eliminando registros de vouchers...');
        const [vouchersEliminados] = await connection.execute(`
            DELETE FROM libro_bancos 
            WHERE clasificacion = 'Vouchers tarjeta'
        `);
        console.log(`   ✅ ${vouchersEliminados.affectedRows} registros de vouchers eliminados`);
        
        // ========================================================================
        // 2. ELIMINAR TRANSFERENCIAS del libro de bancos
        // ========================================================================
        console.log('\n💱 Eliminando registros de transferencias...');
        const [transferenciasEliminadas] = await connection.execute(`
            DELETE FROM libro_bancos 
            WHERE clasificacion = 'Transferencias bancarias'
        `);
        console.log(`   ✅ ${transferenciasEliminadas.affectedRows} registros de transferencias eliminados`);
        
        // ========================================================================
        // 3. ELIMINAR DEPÓSITOS del libro de bancos
        // ========================================================================
        console.log('\n🏦 Eliminando registros de depósitos...');
        const [depositosEliminados] = await connection.execute(`
            DELETE FROM libro_bancos 
            WHERE clasificacion = 'Depósitos bancarios'
        `);
        console.log(`   ✅ ${depositosEliminados.affectedRows} registros de depósitos eliminados`);
        
        // ========================================================================
        // 4. RECALCULAR SALDOS
        // ========================================================================
        console.log('\n🔄 Recalculando saldos...');
        
        // Obtener saldo inicial
        const [saldoInicial] = await connection.execute(`
            SELECT saldo_inicial FROM saldo_inicial_bancos WHERE activo = 1 LIMIT 1
        `);
        
        let saldoActual = parseFloat(saldoInicial[0].saldo_inicial);
        
        // Obtener todas las operaciones restantes ordenadas por fecha e id
        const [operaciones] = await connection.execute(`
            SELECT id, ingreso, egreso
            FROM libro_bancos
            ORDER BY fecha ASC, id ASC
        `);
        
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
        // 5. MOSTRAR RESUMEN FINAL
        // ========================================================================
        console.log('\n📊 Resumen de operaciones restantes:');
        
        const [resumen] = await connection.execute(`
            SELECT 
                clasificacion,
                COUNT(*) as cantidad,
                SUM(ingreso) as total_ingresos,
                SUM(egreso) as total_egresos
            FROM libro_bancos
            GROUP BY clasificacion
            ORDER BY clasificacion
        `);
        
        resumen.forEach(item => {
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
        
        console.log('\n📈 Totales generales:');
        console.log(`   Total operaciones: ${totales[0].total_operaciones}`);
        console.log(`   Total ingresos: Q${parseFloat(totales[0].total_ingresos).toFixed(2)}`);
        console.log(`   Total egresos: Q${parseFloat(totales[0].total_egresos).toFixed(2)}`);
        console.log(`   Saldo actual: Q${saldoActual.toFixed(2)}`);
        
        await connection.commit();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 ¡Limpieza completada exitosamente!');
        console.log('='.repeat(60));
        console.log('\n✅ Operaciones duplicadas eliminadas');
        console.log('✅ Saldos recalculados correctamente');
        console.log('✅ Solo quedan: Ventas, Gastos y Pagos de comisiones\n');
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('\n❌ Error en limpieza:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

limpiar()
    .then(() => {
        console.log('\n✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });