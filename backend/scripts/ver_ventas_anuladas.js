// ver_ventas_anuladas.js
// Script para VER las ventas anuladas sin eliminar nada
const mysql = require('mysql2/promise');
require('dotenv').config();

async function ver() {
    let connection = null;
    
    try {
        console.log('🔧 Conectando a la base de datos...\n');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });
        
        console.log('✅ Conexión establecida\n');
        
        // ========================================================================
        // 1. BUSCAR VENTAS ANULADAS
        // ========================================================================
        console.log('🔍 Buscando ventas anuladas...\n');
        
        const [ventasAnuladas] = await connection.execute(`
            SELECT 
                id, 
                numero_factura, 
                cliente_nombre,
                total, 
                fecha_creacion,
                observaciones
            FROM ventas
            WHERE observaciones LIKE '%ANULADA:%'
            ORDER BY fecha_creacion DESC
        `);
        
        if (ventasAnuladas.length === 0) {
            console.log('✅ No hay ventas anuladas en el sistema\n');
            await connection.end();
            return;
        }
        
        console.log(`📊 TOTAL DE VENTAS ANULADAS: ${ventasAnuladas.length}\n`);
        console.log('='.repeat(120));
        console.log('ID'.padEnd(6) + '| FACTURA'.padEnd(18) + '| FECHA'.padEnd(22) + '| CLIENTE'.padEnd(35) + '| TOTAL'.padEnd(12) + '| MOTIVO');
        console.log('='.repeat(120));
        
        ventasAnuladas.forEach(v => {
            // Extraer motivo de anulación
            const motivoMatch = v.observaciones.match(/ANULADA:\s*([^|]+)/);
            const motivo = motivoMatch ? motivoMatch[1].trim().substring(0, 30) : 'N/A';
            
            const fecha = v.fecha_creacion.toISOString().split('T')[0];
            
            console.log(
                String(v.id).padEnd(6) + 
                '| ' + v.numero_factura.padEnd(18) + 
                '| ' + fecha.padEnd(22) + 
                '| ' + v.cliente_nombre.substring(0, 33).padEnd(35) + 
                '| Q' + parseFloat(v.total).toFixed(2).padEnd(10) + 
                '| ' + motivo
            );
        });
        
        console.log('='.repeat(120));
        
        // ========================================================================
        // 2. BUSCAR CUÁLES ESTÁN EN LIBRO DE BANCOS
        // ========================================================================
        console.log('\n🔍 Verificando cuáles están en el libro de bancos...\n');
        
        let enLibroBancos = 0;
        let noEnLibroBancos = 0;
        
        console.log('FACTURA'.padEnd(18) + '| TOTAL'.padEnd(12) + '| ¿EN LIBRO BANCOS?');
        console.log('-'.repeat(50));
        
        for (const venta of ventasAnuladas) {
            const [registroLibro] = await connection.execute(`
                SELECT id, fecha, ingreso
                FROM libro_bancos
                WHERE clasificacion = 'Ventas'
                AND descripcion LIKE ?
            `, [`%${venta.numero_factura}%`]);
            
            const esta = registroLibro.length > 0 ? '❌ SÍ (debe eliminarse)' : '✅ NO (ya limpio)';
            
            if (registroLibro.length > 0) {
                enLibroBancos++;
            } else {
                noEnLibroBancos++;
            }
            
            console.log(
                venta.numero_factura.padEnd(18) + 
                '| Q' + parseFloat(venta.total).toFixed(2).padEnd(10) + 
                '| ' + esta
            );
        }
        
        console.log('');
        console.log('='.repeat(60));
        console.log('📊 RESUMEN:');
        console.log('='.repeat(60));
        console.log(`\n✅ Ventas anuladas NO en libro bancos: ${noEnLibroBancos}`);
        console.log(`❌ Ventas anuladas SÍ en libro bancos: ${enLibroBancos} (DEBEN ELIMINARSE)`);
        
        if (enLibroBancos > 0) {
            console.log('\n⚠️  Ejecuta el script "eliminar_ventas_anuladas_libro.js" para limpiarlas');
        } else {
            console.log('\n✅ El libro de bancos está limpio, no hay ventas anuladas');
        }
        
        console.log('');
        
        await connection.end();
        
    } catch (error) {
        console.error('\n❌ Error:', error);
        if (connection) await connection.end();
    }
}

ver();