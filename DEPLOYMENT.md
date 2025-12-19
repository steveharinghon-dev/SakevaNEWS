# SakevaNews - Deployment Guide

Полнофункциональный новостной сайт с чатом для сервера Sakeva.

## 🚀 Быстрый старт (Development)

### 1. Backend
```bash
cd backend
npm install
# Создайте .env файл (см. ../.env.example)
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Сайт будет доступен на `http://localhost:5174`, API на `http://localhost:5000`

---

## 📦 Деплой на один хостинг (Production)

### Подготовка

1. **Установите Node.js** на сервере (версия 18+)
2. **Установите PM2** (process manager):
```bash
npm install -g pm2
```

### Сборка проекта

1. **Клонируйте репозиторий** на сервер:
```bash
git clone <your-repo-url>
cd News
```

2. **Создайте файл .env** в папке `backend/`:
```bash
cd backend
nano .env
```

Заполните:
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=your-super-secret-key-change-me
DB_TYPE=mysql
DB_HOST=db.qniks.me
DB_PORT=3306
DB_NAME=s754_test
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

3. **Установите зависимости backend**:
```bash
npm install
```

4. **Соберите frontend и backend**:
```bash
npm run build:full
```

Эта команда:
- Соберет TypeScript backend в `dist/`
- Соберет React frontend в `../frontend/dist/`

### Запуск

**Запустите сервер через PM2**:
```bash
cd backend
pm2 start dist/server.js --name sakevanews -i 1
pm2 save
pm2 startup
```

Сервер будет раздавать:
- **Frontend** на `http://your-server:5000/`
- **API** на `http://your-server:5000/api/`
- **Socket.IO** на `http://your-server:5000/socket.io/`

### Nginx (опционально, для домена и SSL)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**SSL сертификат (Let's Encrypt)**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🛠️ Полезные команды PM2

```bash
pm2 list                    # Список процессов
pm2 logs sakevanews        # Логи
pm2 restart sakevanews     # Перезапуск
pm2 stop sakevanews        # Остановка
pm2 delete sakevanews      # Удаление
```

---

## 📊 Структура проекта

```
News/
├── backend/
│   ├── src/
│   │   ├── server.ts         # Express + Socket.IO
│   │   ├── models/           # Sequelize модели (User, News, Chat, etc.)
│   │   ├── routes/           # API роуты
│   │   └── config/           # Конфигурация БД
│   ├── dist/                 # Compiled TypeScript (после build)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React компоненты
│   │   ├── pages/            # Страницы
│   │   ├── contexts/         # Auth контекст
│   │   └── lib/              # API client
│   ├── dist/                 # Production build (после npm run build)
│   └── package.json
│
└── .env.example              # Пример переменных окружения
```

---

## 🎯 Особенности

- **3-уровневая система ролей**: user, admin, owner
- **Real-time чат** через Socket.IO (авторизованные + анонимы)
- **Модерация новостей** (создание/одобрение/отклонение)
- **Аналитика** с графиками (Recharts)
- **Логирование действий** (NewsLog)
- **JWT авторизация**
- **MySQL база данных** (с fallback на SQLite для локальной разработки)

---

## 👤 Владелец по умолчанию

Логин: `Mexa`  
Пароль: `GL2200Gl!@`

---

## 🔧 Troubleshooting

**Проблема**: Cannot find module './frontend/dist'  
**Решение**: Запустите `npm run build:full` в папке `backend/`

**Проблема**: Socket.IO не подключается  
**Решение**: Проверьте CORS настройки и убедитесь, что WebSocket не блокируется

**Проблема**: Database connection error  
**Решение**: Проверьте .env файл и доступ к базе данных с вашего сервера

---

## 📝 License

MIT
