// scripts/eliminar_turnos_y_ventas_prueba.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function eliminar() {
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

        const ids = [2, 12, 13, 16, 18, 19, 20, 42];

        for (const id of ids) {
            // 1. Obtener ventas del turno
            const [ventas] = await connection.execute(
                'SELECT id FROM ventas WHERE turno_id = ?', [id]
            );

            for (const venta of ventas) {
                // 2. Borrar detalle_ventas
                await connection.execute('DELETE FROM detalle_ventas WHERE venta_id = ?', [venta.id]);
                console.log(`  🗑️ Detalle de venta #${venta.id} eliminado`);

                // 3. Borrar venta
                await connection.execute('DELETE FROM ventas WHERE id = ?', [venta.id]);
                console.log(`  🗑️ Venta #${venta.id} eliminada`);
            }

            // 4. Borrar turno
            await connection.execute('DELETE FROM turnos WHERE id = ?', [id]);
            console.log(`✅ Turno #${id} eliminado\n`);
        }

        console.log('✅ Todo eliminado exitosamente');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

eliminar();