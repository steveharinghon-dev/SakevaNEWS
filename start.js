const { execSync } = require('child_process');
const path = require('path');

// Загружаем .env из backend папки
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

console.log('🚀 Starting SakevaNews...');

// Подтягиваем последние изменения из Git
try {
  console.log('📥 Pulling latest changes from Git...');
  execSync('git pull origin master', { stdio: 'inherit' });
  console.log('✅ Git pull completed');
} catch (error) {
  console.log('⚠️  Git pull failed or no changes:', error.message);
}

// Сборка проекта
console.log('📦 Building project...');
try {
  // Backend
  console.log('🔨 Building backend...');
  execSync('cd backend && npm ci --only=production && npm install --save-dev typescript && npm run build', { stdio: 'inherit' });
  
  // Frontend
  console.log('🎨 Building frontend...');
  execSync('cd frontend && npm ci && npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build complete!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Запуск миграции
try {
  console.log('🔄 Running database migration...');
  execSync('cd backend && npx ts-node scripts/add-user-role-column.ts', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  console.log('✅ Migration completed');
} catch (error) {
  console.log('⚠️  Migration already applied or error:', error.message);
}

// Запуск сервера
console.log('🌐 Starting server...');
process.env.NODE_ENV = 'production';

const serverPath = path.join(__dirname, 'backend', 'dist', 'server.js');
require(serverPath);
