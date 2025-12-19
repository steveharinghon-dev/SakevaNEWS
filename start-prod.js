const path = require('path');
const fs = require('fs');

// Загружаем .env из backend папки
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

console.log('🚀 Starting SakevaNews (Production)...');
console.log('⚠️  Make sure you have built the project first with: npm run build:full');
console.log('');

// Проверка наличия dist папок
const backendDist = path.join(__dirname, 'backend', 'dist', 'server.js');
const frontendDist = path.join(__dirname, 'frontend', 'dist', 'index.html');

if (!fs.existsSync(backendDist)) {
  console.error('❌ Backend не собран! Запустите: cd backend && npm run build');
  process.exit(1);
}

if (!fs.existsSync(frontendDist)) {
  console.error('❌ Frontend не собран! Запустите: cd frontend && npm run build');
  process.exit(1);
}

// Запуск сервера
console.log('✅ Build files found');
console.log('🌐 Starting server...');
process.env.NODE_ENV = 'production';

require(backendDist);
