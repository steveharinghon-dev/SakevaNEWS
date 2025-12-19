import { Sequelize } from 'sequelize';
import path from 'path';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

let sequelize: Sequelize;

// Автоматический выбор между MySQL и SQLite
const dbType = process.env.DB_TYPE?.trim().toLowerCase();

console.log('🔍 DB_TYPE from .env:', dbType);
console.log('🔍 DB_HOST from .env:', process.env.DB_HOST);

if (dbType === 'mysql' && process.env.DB_HOST) {
  // Используем MySQL если настроен
  sequelize = new Sequelize(
    process.env.DB_NAME || 'sakevanews',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
  console.log('📊 Using MySQL database');
} else {
  // Используем SQLite как локальную БД (файл)
  const dbPath = path.join(__dirname, '../../data/sakevanews.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
  });
  console.log('📁 Using local SQLite database:', dbPath);
}

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Импорт моделей для регистрации
    await import('../models/User');
    await import('../models/News');
    await import('../models/PageView');
    await import('../models/NewsLog');
    await import('../models/ChatMessage');
    
    // Синхронизация моделей с БД (создание таблиц если их нет)
    await sequelize.sync();
    console.log('✅ Database models synchronized');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

export default sequelize;
export { sequelize };
