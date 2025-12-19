const { execSync } = require('child_process');
const path = require('path');

// Загружаем .env из backend папки
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

console.log('🚀 Starting SakevaNews...');
console.log('📌 Version check: Chat with role icons (FaCrown, FaShield, FaUser)');

// Проверка наличия готовых dist папок
console.log('📦 Checking pre-built files...');
const fs = require('fs');
const backendDist = path.join(__dirname, 'backend', 'dist', 'server.js');
const frontendDist = path.join(__dirname, 'frontend', 'dist', 'index.html');

if (!fs.existsSync(backendDist)) {
  console.error('❌ Backend not built! Run locally: cd backend && npm run build');
  process.exit(1);
}

if (!fs.existsSync(frontendDist)) {
  console.error('❌ Frontend not built! Run locally: cd frontend && npm run build');
  process.exit(1);
}

console.log('✅ Pre-built files found');

// Проверяем наличие node_modules
console.log('📦 Checking dependencies...');
const nodeModulesPath = path.join(__dirname, 'backend', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ node_modules not found! Deploy with node_modules included OR run: cd backend && npm install');
  process.exit(1);
}
console.log('✅ Dependencies found');

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
