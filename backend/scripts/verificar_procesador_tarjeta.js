// verificar_procesador_tarjeta.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function verificar() {
    let connection = null;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Conexión establecida\n');

        const [ventas] = await connection.execute(`
            SELECT 
                id,
                numero_factura,
                metodo_pago,
                total,
                procesador_tarjeta,
                cuotas_tarjeta,
                comision_bancaria_monto,
                comision_bancaria_porcentaje,
                observaciones,
                fecha_creacion
            FROM ventas
            ORDER BY id DESC
            LIMIT 5
        `);

        console.log('📋 Últimas 5 ventas:\n');
        ventas.forEach(v => {
            console.log(`ID: ${v.id} | Factura: ${v.numero_factura}`)
            console.log(`  Método: ${v.metodo_pago} | Total: Q${v.total}`)
            console.log(`  Procesador: ${v.procesador_tarjeta || 'N/A'} | Cuotas: ${v.cuotas_tarjeta || 'N/A'}`)
            console.log(`  Comisión %: ${v.comision_bancaria_porcentaje || 0}% | Comisión Q: ${v.comision_bancaria_monto || 0}`)
            console.log(`  Observaciones: ${v.observaciones || 'ninguna'}`)
            console.log(`  Fecha: ${v.fecha_creacion}`)
            console.log('---')
        })

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

verificar();