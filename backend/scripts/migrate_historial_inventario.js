// migrate_historial_inventario.js
// Migración para crear tabla de historial de inventario
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
        console.log('📦 Creando tabla historial_inventario...');
        
        // Crear tabla historial_inventario
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS historial_inventario (
                id INT PRIMARY KEY AUTO_INCREMENT,
                tipo_producto ENUM('medicamento', 'extra') NOT NULL COMMENT 'Tipo de producto que se movió',
                producto_id INT NOT NULL COMMENT 'ID del medicamento o extra',
                producto_nombre VARCHAR(200) NOT NULL COMMENT 'Nombre del producto al momento del movimiento',
                tipo_movimiento ENUM('entrada', 'salida', 'ajuste', 'vencimiento', 'devolucion') NOT NULL COMMENT 'Tipo de movimiento realizado',
                cantidad_anterior INT NOT NULL COMMENT 'Stock antes del movimiento',
                cantidad_movimiento INT NOT NULL COMMENT 'Cantidad que se movió (positivo o negativo)',
                cantidad_nueva INT NOT NULL COMMENT 'Stock después del movimiento',
                motivo VARCHAR(200) NULL COMMENT 'Motivo del movimiento',
                detalle TEXT NULL COMMENT 'Detalles adicionales del movimiento',
                venta_id INT NULL COMMENT 'ID de venta si el movimiento fue por una venta',
                proveedor VARCHAR(200) NULL COMMENT 'Nombre del proveedor si es una compra',
                numero_documento VARCHAR(100) NULL COMMENT 'Número de factura, nota de crédito, etc.',
                costo_unitario DECIMAL(10,2) NULL COMMENT 'Costo unitario si es una compra',
                usuario_id INT NOT NULL COMMENT 'Usuario que realizó el movimiento',
                fecha_movimiento DATETIME NOT NULL COMMENT 'Fecha y hora del movimiento',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
                FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL,
                INDEX idx_tipo_producto (tipo_producto, producto_id),
                INDEX idx_tipo_movimiento (tipo_movimiento),
                INDEX idx_fecha_movimiento (fecha_movimiento),
                INDEX idx_usuario (usuario_id),
                INDEX idx_venta (venta_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='Tabla para el historial completo de movimientos de inventario'
        `);
        
        console.log('✅ Tabla historial_inventario creada exitosamente');
        
        // Verificar que la tabla se creó
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'historial_inventario'
        `);
        
        if (tables.length > 0) {
            console.log('✅ Verificación exitosa: Tabla existe en la base de datos');
        }
        
    } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('⚠️  La tabla historial_inventario ya existe');
        } else {
            console.error('❌ Error en migración:', error);
            throw error;
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

migrate()
    .then(() => {
        console.log('\n✅ Migración completada exitosamente');
        console.log('📊 Tabla historial_inventario lista para usar');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });