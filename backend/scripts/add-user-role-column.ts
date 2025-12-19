import sequelize from '../src/config/database';

async function addUserRoleColumn() {
  try {
    console.log('🔄 Adding userRole column to chat_messages table...');
    
    // Добавляем колонку userRole
    await sequelize.query(`
      ALTER TABLE chat_messages 
      ADD COLUMN IF NOT EXISTS userRole VARCHAR(20) NULL
    `);
    
    console.log('✅ Column userRole added successfully!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding column:', error);
    process.exit(1);
  }
}

addUserRoleColumn();
