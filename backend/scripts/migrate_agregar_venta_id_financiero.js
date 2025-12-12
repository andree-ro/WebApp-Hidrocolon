// migrate_agregar_venta_id_financiero.js
// Migración: Agregar campo venta_id a tablas financieras
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
        console.log('\n💳 AGREGANDO CAMPOS venta_id A TABLAS FINANCIERAS...\n');

        // ========================================================================
        // 1. AGREGAR venta_id A vouchers_tarjeta
        // ========================================================================
        console.log('📝 Agregando venta_id a vouchers_tarjeta...');
        
        try {
            await connection.execute(`
                ALTER TABLE vouchers_tarjeta 
                ADD COLUMN venta_id INT NULL 
                COMMENT 'ID de la venta asociada' 
                AFTER monto
            `);
            console.log('✅ Campo venta_id agregado a vouchers_tarjeta');
            
            // Agregar foreign key
            await connection.execute(`
                ALTER TABLE vouchers_tarjeta 
                ADD CONSTRAINT fk_voucher_venta 
                FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
            `);
            console.log('✅ Foreign key agregada a vouchers_tarjeta');
            
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Campo venta_id ya existe en vouchers_tarjeta');
            } else {
                throw error;
            }
        }

        // ========================================================================
        // 2. AGREGAR venta_id A transferencias
        // ========================================================================
        console.log('\n📝 Agregando venta_id a transferencias...');
        
        try {
            await connection.execute(`
                ALTER TABLE transferencias 
                ADD COLUMN venta_id INT NULL 
                COMMENT 'ID de la venta asociada' 
                AFTER monto
            `);
            console.log('✅ Campo venta_id agregado a transferencias');
            
            // Agregar foreign key
            await connection.execute(`
                ALTER TABLE transferencias 
                ADD CONSTRAINT fk_transferencia_venta 
                FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
            `);
            console.log('✅ Foreign key agregada a transferencias');
            
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Campo venta_id ya existe en transferencias');
            } else {
                throw error;
            }
        }

        // ========================================================================
        // 3. AGREGAR venta_id A depositos
        // ========================================================================
        console.log('\n📝 Agregando venta_id a depositos...');
        
        try {
            await connection.execute(`
                ALTER TABLE depositos 
                ADD COLUMN venta_id INT NULL 
                COMMENT 'ID de la venta asociada' 
                AFTER monto
            `);
            console.log('✅ Campo venta_id agregado a depositos');
            
            // Agregar foreign key
            await connection.execute(`
                ALTER TABLE depositos 
                ADD CONSTRAINT fk_deposito_venta 
                FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
            `);
            console.log('✅ Foreign key agregada a depositos');
            
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Campo venta_id ya existe en depositos');
            } else {
                throw error;
            }
        }

        console.log('\n🎉 ¡Migración completada exitosamente!');
        console.log('📊 Las tablas financieras ahora están vinculadas con las ventas');
        
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