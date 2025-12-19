const path = require('path');

// Загружаем .env из backend папки
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

console.log('🚀 Starting SakevaNews (Fast Production Mode)...');
console.log('📌 Using pre-built files');
console.log('🌐 Starting server on port', process.env.PORT || 20533);

// Устанавливаем production режим
process.env.NODE_ENV = 'production';

// Запуск сервера
const serverPath = path.join(__dirname, 'backend', 'dist', 'server.js');
require(serverPath);
