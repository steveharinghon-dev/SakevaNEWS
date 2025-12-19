const path = require('path');
const fs = require('fs');

// Загружаем .env из backend папки
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

console.log('🚀 Starting SakevaNews (Production)...');
console.log('🔄 Building frontend with latest changes...');
console.log('');

const { execSync } = require('child_process');

// Пересобираем frontend при каждом запуске
try {
  execSync('cd frontend && npm run build', { 
    stdio: 'inherit'
  });
  console.log('✅ Frontend build completed');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Проверка наличия dist папок
const backendDist = path.join(__dirname, 'backend', 'dist', 'server.js');
const frontendDist = path.join(__dirname, 'frontend', 'dist', 'index.html');

if (!fs.existsSync(backendDist)) {
  console.error('❌ Backend не собран! Запустите: cd backend && npm run build');
  process.exit(1);
}

if (!fs.existsSync(frontendDist)) {
  console.error('❌ Frontend не собран после билда!');
  process.exit(1);
}

// Запуск миграции и сервера
console.log('✅ Build files found');

async function startServer() {
  try {
    // Запускаем миграцию
    console.log('🔄 Running database migration...');
    execSync('cd backend && npx ts-node scripts/add-user-role-column.ts', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    console.log('✅ Migration completed');
  } catch (error) {
    console.log('⚠️  Migration already applied or error:', error.message);
  }

  console.log('🌐 Starting server...');
  process.env.NODE_ENV = 'production';
  require(backendDist);
}

startServer();
