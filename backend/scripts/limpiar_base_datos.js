// Script para limpiar base de datos del Sistema Hidrocolon
// Mantiene: usuarios, roles
// Elimina: TODO lo demás

require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

async function limpiarBaseDatos() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado exitosamente\n');

    // Deshabilitar foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('🔓 Foreign key checks deshabilitados\n');

    console.log('🗑️ INICIANDO LIMPIEZA DE BASE DE DATOS...\n');
    console.log('=' .repeat(60));

    // ============================================================================
    // TABLAS A LIMPIAR (en orden para evitar problemas de foreign keys)
    // ============================================================================

    const tablasALimpiar = [
      // Ventas y detalles
      { nombre: 'detalle_ventas', descripcion: 'Detalles de ventas' },
      { nombre: 'ventas', descripcion: 'Ventas' },
      
      // Comisiones
      { nombre: 'pagos_comisiones', descripcion: 'Pagos de comisiones' },
      { nombre: 'ganancias_laboratorios', descripcion: 'Ganancias de laboratorios' },
      
      // Turnos y movimientos
      { nombre: 'vouchers', descripcion: 'Vouchers' },
      { nombre: 'transferencias', descripcion: 'Transferencias' },
      { nombre: 'depositos', descripcion: 'Depósitos' },
      { nombre: 'gastos', descripcion: 'Gastos' },
      { nombre: 'turnos', descripcion: 'Turnos' },
      
      // Libro de bancos
      { nombre: 'libro_bancos', descripcion: 'Libro de bancos' },
      { nombre: 'saldo_inicial_banco', descripcion: 'Saldo inicial banco' },
      
      // Estado de resultados
      { nombre: 'conceptos_estado_resultados', descripcion: 'Conceptos de estado de resultados' },
      
      // Productos y servicios
      { nombre: 'extras_medicamentos', descripcion: 'Relación extras-medicamentos' },
      { nombre: 'extras_servicios', descripcion: 'Relación extras-servicios' },
      { nombre: 'extras', descripcion: 'Extras' },
      { nombre: 'medicamentos', descripcion: 'Medicamentos (Farmacia)' },
      { nombre: 'servicios', descripcion: 'Servicios médicos' },
      
      // Doctoras y pacientes
      { nombre: 'doctoras', descripcion: 'Doctoras' },
      { nombre: 'pacientes', descripcion: 'Pacientes' }
    ];

    let totalEliminados = 0;

    for (const tabla of tablasALimpiar) {
      try {
        // Contar registros antes de eliminar
        const [countResult] = await connection.query(`SELECT COUNT(*) as total FROM ${tabla.nombre}`);
        const count = countResult[0].total;

        if (count > 0) {
          // Eliminar todos los registros
          await connection.query(`DELETE FROM ${tabla.nombre}`);
          
          // Reset AUTO_INCREMENT
          await connection.query(`ALTER TABLE ${tabla.nombre} AUTO_INCREMENT = 1`);
          
          console.log(`✅ ${tabla.descripcion.padEnd(40)} - ${count} registros eliminados`);
          totalEliminados += count;
        } else {
          console.log(`⚪ ${tabla.descripcion.padEnd(40)} - Ya está vacía`);
        }
      } catch (error) {
        console.error(`❌ Error en tabla ${tabla.nombre}:`, error.message);
      }
    }

    console.log('=' .repeat(60));
    console.log(`\n📊 TOTAL DE REGISTROS ELIMINADOS: ${totalEliminados}\n`);

    // ============================================================================
    // VERIFICAR USUARIOS Y ROLES (NO SE TOCAN)
    // ============================================================================

    console.log('🔍 VERIFICANDO DATOS PRESERVADOS:\n');

    const [roles] = await connection.query('SELECT COUNT(*) as total FROM roles');
    console.log(`✅ Roles preservados: ${roles[0].total}`);

    const [usuarios] = await connection.query('SELECT COUNT(*) as total FROM usuarios');
    console.log(`✅ Usuarios preservados: ${usuarios[0].total}`);

    // Habilitar foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n🔒 Foreign key checks habilitados');

    console.log('\n' + '=' .repeat(60));
    console.log('✅ LIMPIEZA COMPLETADA EXITOSAMENTE');
    console.log('=' .repeat(60));
    console.log('\n📌 DATOS PRESERVADOS:');
    console.log('   - Usuarios');
    console.log('   - Roles');
    console.log('\n🗑️ DATOS ELIMINADOS:');
    console.log('   - Todas las transacciones');
    console.log('   - Todos los productos (medicamentos, extras, servicios)');
    console.log('   - Todas las doctoras y pacientes');
    console.log('   - Todo el historial financiero');
    console.log('\n✨ Base de datos lista para empezar de nuevo!\n');

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada\n');
    }
  }
}

// ============================================================================
// CONFIRMACIÓN DE SEGURIDAD
// ============================================================================

console.log('\n' + '⚠️  '.repeat(30));
console.log('⚠️  ADVERTENCIA: LIMPIEZA DE BASE DE DATOS');
console.log('⚠️  '.repeat(30));
console.log('\nEste script eliminará TODOS los datos excepto usuarios y roles.');
console.log('\n📋 TABLAS QUE SE LIMPIARÁN:');
console.log('   ✓ Ventas y detalles');
console.log('   ✓ Comisiones y pagos');
console.log('   ✓ Turnos, gastos, vouchers');
console.log('   ✓ Depósitos y transferencias');
console.log('   ✓ Libro de bancos');
console.log('   ✓ Estado de resultados');
console.log('   ✓ Medicamentos, extras y servicios');
console.log('   ✓ Doctoras y pacientes');
console.log('\n🔒 TABLAS QUE SE PRESERVARÁN:');
console.log('   ✓ Usuarios');
console.log('   ✓ Roles');
console.log('\n');

// Ejecutar
limpiarBaseDatos();