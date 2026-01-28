// corregir_ultimas_3_ventas.js
// Script para corregir las últimas 3 ventas que se registraron con fecha incorrecta
const mysql = require('mysql2/promise');
require('dotenv').config();

async function corregirUltimas3Ventas() {
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
        console.log('🔄 Corrigiendo últimas 3 ventas...\n');
        
        // ========================================================================
        // 1. ENCONTRAR LAS ÚLTIMAS 3 VENTAS EN LIBRO DE BANCOS
        // ========================================================================
        const [ultimasVentas] = await connection.execute(`
            SELECT id, fecha, descripcion, saldo_bancos
            FROM libro_bancos
            WHERE clasificacion = 'Ventas'
            AND (descripcion LIKE '%VEN-2026-0242%' 
                 OR descripcion LIKE '%VEN-2026-0243%'
                 OR descripcion LIKE '%VEN-2026-0244%')
            ORDER BY id DESC
        `);
        
        console.log(`📊 Ventas encontradas: ${ultimasVentas.length}\n`);
        
        if (ultimasVentas.length === 0) {
            console.log('ℹ️  No se encontraron las ventas a corregir.\n');
            await connection.end();
            return;
        }
        
        // Mostrar las ventas encontradas
        console.log('📋 Ventas a corregir:');
        ultimasVentas.forEach(v => {
            console.log(`   ID: ${v.id} | Fecha actual: ${v.fecha} | ${v.descripcion.substring(0, 50)}`);
        });
        
        // ========================================================================
        // 2. CAMBIAR LA FECHA DE 27/01 A 28/01
        // ========================================================================
        console.log('\n🔄 Cambiando fecha de 2026-01-27 a 2026-01-28...\n');
        
        const fechaCorrecta = '2026-01-28';
        
        for (const venta of ultimasVentas) {
            await connection.execute(`
                UPDATE libro_bancos
                SET fecha = ?
                WHERE id = ?
            `, [fechaCorrecta, venta.id]);
            
            console.log(`   ✅ ID ${venta.id} actualizado a ${fechaCorrecta}`);
        }
        
        // ========================================================================
        // 3. VERIFICAR QUE LAS FECHAS SE ACTUALIZARON
        // ========================================================================
        console.log('\n📊 Verificando fechas actualizadas...\n');
        
        const [ventasActualizadas] = await connection.execute(`
            SELECT id, fecha, descripcion
            FROM libro_bancos
            WHERE id IN (?, ?, ?)
            ORDER BY id
        `, [ultimasVentas[0].id, ultimasVentas[1]?.id || 0, ultimasVentas[2]?.id || 0]);
        
        console.log('✅ Fechas después de la corrección:');
        ventasActualizadas.forEach(v => {
            console.log(`   ID: ${v.id} | Nueva fecha: ${v.fecha} | ${v.descripcion.substring(0, 50)}`);
        });
        
        await connection.commit();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 ¡Fechas corregidas exitosamente!');
        console.log('='.repeat(60));
        console.log(`\n✅ ${ultimasVentas.length} ventas actualizadas a 2026-01-28\n`);
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('\n❌ Error corrigiendo ventas:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

corregirUltimas3Ventas()
    .then(() => {
        console.log('\n✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });