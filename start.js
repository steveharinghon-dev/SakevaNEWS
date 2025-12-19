const { execSync } = require('child_process');
const path = require('path');

// Загружаем .env из backend папки
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

console.log('🚀 Starting SakevaNews...');

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

// Запуск сервера
console.log('🌐 Starting server...');
process.env.NODE_ENV = 'production';

const serverPath = path.join(__dirname, 'backend', 'dist', 'server.js');
require(serverPath);
