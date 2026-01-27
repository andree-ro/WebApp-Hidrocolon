// eliminar_ventas_test.js
// Script para eliminar ventas de prueba del cliente "01 test" con teléfono 12345679 de enero 2026
const mysql = require('mysql2/promise');
require('dotenv').config();

async function eliminarVentasTest() {
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
        // PASO 1: BUSCAR VENTAS QUE COINCIDAN CON LOS CRITERIOS
        // ========================================================================
        console.log('🔍 Buscando ventas de prueba con los siguientes criterios:');
        console.log('   - Cliente: "01 test"');
        console.log('   - Teléfono: "12345679"');
        console.log('   - Mes: Enero 2026\n');
        
        const [ventas] = await connection.execute(`
            SELECT 
                v.id,
                v.numero_factura,
                v.cliente_nombre,
                v.cliente_telefono,
                v.total,
                v.metodo_pago,
                DATE(v.fecha_creacion) as fecha_venta,
                v.fecha_creacion
            FROM ventas v
            WHERE v.cliente_nombre LIKE '%01 test%'
              AND v.cliente_telefono LIKE '%12345679%'
              AND YEAR(v.fecha_creacion) = 2026
              AND MONTH(v.fecha_creacion) = 1
            ORDER BY v.fecha_creacion
        `);
        
        if (ventas.length === 0) {
            console.log('⚠️  No se encontraron ventas que coincidan con los criterios');
            console.log('\n💡 Sugerencia: Verifica que el cliente y teléfono sean correctos');
            await connection.end();
            return;
        }
        
        console.log(`📊 Se encontraron ${ventas.length} venta(s):\n`);
        ventas.forEach((v, index) => {
            console.log(`   ${index + 1}. Factura: ${v.numero_factura}`);
            console.log(`      Cliente: ${v.cliente_nombre}`);
            console.log(`      Teléfono: ${v.cliente_telefono}`);
            console.log(`      Total: Q${parseFloat(v.total).toFixed(2)}`);
            console.log(`      Método pago: ${v.metodo_pago}`);
            console.log(`      Fecha: ${v.fecha_venta}`);
            console.log('');
        });
        
        // ========================================================================
        // CONFIRMACIÓN MANUAL
        // ========================================================================
        console.log('⚠️  ATENCIÓN: Este script eliminará estas ventas de la base de datos');
        console.log('⚠️  Esta acción NO se puede deshacer\n');
        console.log('Para continuar con la eliminación, cambia la variable CONFIRMAR_ELIMINACION a true');
        console.log('en la línea 80 de este archivo\n');
        
        const CONFIRMAR_ELIMINACION = true; // ⬅️ CAMBIA ESTO A true PARA EJECUTAR
        
        if (!CONFIRMAR_ELIMINACION) {
            console.log('❌ Eliminación cancelada por seguridad');
            console.log('✅ Solo se realizó la búsqueda, no se eliminó nada\n');
            await connection.end();
            return;
        }
        
        // ========================================================================
        // PASO 2: OBTENER DETALLES PARA REVERSAR INVENTARIO
        // ========================================================================
        console.log('📦 Obteniendo detalles de productos vendidos...\n');
        
        const ventasIds = ventas.map(v => v.id);
        
        // Crear placeholders para la consulta IN
        const placeholders = ventasIds.map(() => '?').join(',');
        
        const [detalles] = await connection.execute(`
            SELECT 
                dv.id,
                dv.venta_id,
                dv.tipo_producto,
                dv.producto_id,
                dv.producto_nombre,
                dv.cantidad
            FROM detalle_ventas dv
            WHERE dv.venta_id IN (${placeholders})
            ORDER BY dv.venta_id, dv.id
        `, ventasIds);
        
        console.log(`   Total de productos en las ventas: ${detalles.length}\n`);
        
        // Mostrar detalles
        if (detalles.length > 0) {
            let ventaActual = null;
            detalles.forEach(d => {
                if (ventaActual !== d.venta_id) {
                    ventaActual = d.venta_id;
                    const venta = ventas.find(v => v.id === d.venta_id);
                    console.log(`   📄 Factura: ${venta.numero_factura}`);
                }
                console.log(`      - ${d.producto_nombre} (${d.tipo_producto}) x${d.cantidad}`);
            });
            console.log('');
        } else {
            console.log('   ⚠️  No se encontraron productos en estas ventas (pueden ser ventas vacías)\n');
        }
        
        // ========================================================================
        // INICIAR TRANSACCIÓN
        // ========================================================================
        await connection.beginTransaction();
        console.log('🔄 Iniciando proceso de eliminación...\n');
        
        // ========================================================================
        // PASO 3: REVERSAR INVENTARIO DE MEDICAMENTOS
        // ========================================================================
        console.log('📦 Reversando inventario de medicamentos...');
        
        let medicamentosReversados = 0;
        
        for (const detalle of detalles) {
            if (detalle.tipo_producto === 'medicamento') {
                // Obtener existencias actuales
                const [medActual] = await connection.execute(`
                    SELECT existencias, nombre FROM medicamentos WHERE id = ?
                `, [detalle.producto_id]);
                
                if (medActual.length > 0) {
                    const existenciasAntes = medActual[0].existencias;
                    
                    // Reversar existencias
                    await connection.execute(`
                        UPDATE medicamentos
                        SET existencias = existencias + ?
                        WHERE id = ?
                    `, [detalle.cantidad, detalle.producto_id]);
                    
                    const existenciasDespues = existenciasAntes + detalle.cantidad;
                    
                    console.log(`   ✓ ${detalle.producto_nombre}`);
                    console.log(`     Stock: ${existenciasAntes} → ${existenciasDespues} (+${detalle.cantidad})`);
                    
                    medicamentosReversados++;
                } else {
                    console.log(`   ⚠️  Medicamento ID ${detalle.producto_id} no encontrado (puede haber sido eliminado)`);
                }
            }
        }
        
        if (medicamentosReversados === 0) {
            console.log('   No hay medicamentos para reversar\n');
        } else {
            console.log(`\n   Total medicamentos reversados: ${medicamentosReversados}\n`);
        }
        
        // ========================================================================
        // PASO 4: ELIMINAR REGISTROS DE HISTORIAL DE INVENTARIO
        // ========================================================================
        console.log('🗑️  Eliminando registros de historial de inventario...');
        
        const [historialResult] = await connection.execute(`
            DELETE FROM historial_inventario
            WHERE venta_id IN (${placeholders})
        `, ventasIds);
        
        console.log(`   Registros eliminados: ${historialResult.affectedRows}\n`);
        
        // ========================================================================
        // PASO 5: ELIMINAR DETALLE DE VENTAS
        // ========================================================================
        console.log('🗑️  Eliminando detalles de ventas...');
        
        const [detalleResult] = await connection.execute(`
            DELETE FROM detalle_ventas
            WHERE venta_id IN (${placeholders})
        `, ventasIds);
        
        console.log(`   Registros eliminados: ${detalleResult.affectedRows}\n`);
        
        // ========================================================================
        // PASO 6: ELIMINAR VENTAS
        // ========================================================================
        console.log('🗑️  Eliminando ventas...');
        
        const [ventasResult] = await connection.execute(`
            DELETE FROM ventas
            WHERE id IN (${placeholders})
        `, ventasIds);
        
        console.log(`   Ventas eliminadas: ${ventasResult.affectedRows}\n`);
        
        // ========================================================================
        // CONFIRMAR TRANSACCIÓN
        // ========================================================================
        await connection.commit();
        
        console.log('✅ ELIMINACIÓN COMPLETADA EXITOSAMENTE\n');
        console.log('📊 Resumen:');
        console.log(`   - Ventas eliminadas: ${ventasResult.affectedRows}`);
        console.log(`   - Detalles eliminados: ${detalleResult.affectedRows}`);
        console.log(`   - Historial inventario: ${historialResult.affectedRows}`);
        console.log(`   - Medicamentos reversados: ${medicamentosReversados}\n`);
        
    } catch (error) {
        console.error('\n❌ Error durante la eliminación:', error.message);
        
        if (connection) {
            await connection.rollback();
            console.log('🔄 Transacción revertida - no se eliminó nada\n');
        }
        
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar script
eliminarVentasTest()
    .then(() => {
        console.log('\n✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });