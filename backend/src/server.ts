import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import newsRoutes from './routes/news';
import usersRoutes from './routes/users';
import analyticsRoutes from './routes/analytics';
import ChatMessage from './models/ChatMessage';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { APP_CONSTANTS } from './config/constants';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

// Проверка критических переменных окружения
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < APP_CONSTANTS.AUTH.JWT_MIN_SECRET_LENGTH) {
  console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: JWT_SECRET не задан или слишком короткий!');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }
}

const app: Express = express();
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Trust proxy (для работы за Pterodactyl/Cloudflare)
app.set('trust proxy', true);

// Улучшенная настройка CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []
  : ['http://localhost:5173'];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Разрешаем запросы без origin (например, мобильные приложения или Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Socket.IO setup с улучшенной безопасностью
const io = new SocketIOServer(httpServer, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: APP_CONSTANTS.RATE_LIMIT.WINDOW_MS,
  max: APP_CONSTANTS.RATE_LIMIT.MAX_REQUESTS,
  message: 'Слишком много запросов, попробуйте позже',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SakevaNews API is running' });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Handle React routing - return index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Rate limiting для Socket.IO подключений
const socketConnectionLimiter = new Map<string, number>();
const socketMessageLimiter = new Map<string, { count: number; resetTime: number }>();

// Очистка старых записей каждую минуту
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of socketMessageLimiter.entries()) {
    if (now > data.resetTime) {
      socketMessageLimiter.delete(key);
    }
  }
}, 60000);

// Socket.IO chat handler с улучшенной безопасностью
io.on('connection', (socket) => {
  const ip = socket.handshake.address;
  
  // Проверка rate limit по IP
  const currentConnections = socketConnectionLimiter.get(ip) || 0;
  if (currentConnections > APP_CONSTANTS.SOCKET_IO.MAX_CONNECTIONS_PER_IP) {
    console.warn(`⚠️  Rate limit exceeded for IP: ${ip}`);
    socket.disconnect(true);
    return;
  }
  
  socketConnectionLimiter.set(ip, currentConnections + 1);
  console.log(`💬 User connected: ${socket.id} (IP: ${ip})`);

  // Получить последние сообщения
  socket.on('chat:getHistory', async () => {
    try {
      const messages = await ChatMessage.findAll({
        order: [['createdAt', 'DESC']],
        limit: APP_CONSTANTS.CHAT.MAX_HISTORY_LIMIT,
        attributes: ['id', 'userId', 'username', 'message', 'isAnonymous', 'userRole', 'createdAt']
      });
      socket.emit('chat:history', messages.reverse());
    } catch (error) {
      console.error('Error fetching chat history:', error);
      socket.emit('chat:error', { message: 'Не удалось загрузить историю' });
    }
  });

  // Новое сообщение с полной валидацией
  socket.on('chat:sendMessage', async (data: { message: string; token?: string }) => {
    try {
      // Rate limiting по сообщениям
      const rateLimitKey = `${socket.id}`;
      const now = Date.now();
      const rateData = socketMessageLimiter.get(rateLimitKey);
      
      if (rateData && now < rateData.resetTime) {
        if (rateData.count >= APP_CONSTANTS.CHAT.RATE_LIMIT_MESSAGES) {
          socket.emit('chat:error', { message: 'Слишком много сообщений, подождите немного' });
          return;
        }
        rateData.count++;
      } else {
        socketMessageLimiter.set(rateLimitKey, {
          count: 1,
          resetTime: now + APP_CONSTANTS.CHAT.RATE_LIMIT_WINDOW_MS
        });
      }

      // Валидация сообщения
      if (!data.message || typeof data.message !== 'string') {
        socket.emit('chat:error', { message: 'Неверный формат сообщения' });
        return;
      }

      // XSS ЗАЩИТА: санитизация сообщения
      const sanitizedMessage = validator.escape(data.message.trim());

      if (sanitizedMessage.length === 0) {
        socket.emit('chat:error', { message: 'Сообщение не может быть пустым' });
        return;
      }

      if (sanitizedMessage.length > APP_CONSTANTS.CHAT.MAX_MESSAGE_LENGTH) {
        socket.emit('chat:error', { 
          message: `Сообщение слишком длинное (макс ${APP_CONSTANTS.CHAT.MAX_MESSAGE_LENGTH} символов)` 
        });
        return;
      }

      let userId: number | null = null;
      let username = 'Аноним';
      let isAnonymous = true;
      let userRole: string | undefined = undefined;

      // Проверка JWT токена для зарегистрированных пользователей
      if (data.token) {
        try {
          if (!JWT_SECRET) {
            throw new Error('JWT_SECRET not configured');
          }
          
          const decoded = jwt.verify(data.token, JWT_SECRET) as any;
          
          if (!decoded.id || !decoded.nick || !decoded.role) {
            throw new Error('Invalid token payload');
          }
          
          userId = decoded.id;
          username = validator.escape(decoded.nick);
          isAnonymous = false;
          userRole = decoded.role;
        } catch (err) {
          console.warn(`⚠️  Invalid JWT token from socket ${socket.id}:`, (err as Error).message);
          // Продолжаем как анонимный пользователь
        }
      }

      // Сохранение сообщения в БД
      const chatMessage = await ChatMessage.create({
        userId,
        username,
        message: sanitizedMessage,
        isAnonymous,
        userRole: userRole || 'user',
      });

      // Отправка всем подключенным клиентам
      io.emit('chat:newMessage', chatMessage);
    } catch (error) {
      console.error('Error saving chat message:', error);
      socket.emit('chat:error', { message: 'Не удалось отправить сообщение' });
    }
  });

  socket.on('disconnect', () => {
    const current = socketConnectionLimiter.get(ip) || 1;
    socketConnectionLimiter.set(ip, current - 1);
    if (socketConnectionLimiter.get(ip) === 0) {
      socketConnectionLimiter.delete(ip);
    }
    console.log(`💬 User disconnected: ${socket.id}`);
  });
});

// Глобальный обработчик ошибок (должен быть после всех роутов)
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API: http://0.0.0.0:${PORT}/api`);
      console.log(`💬 Chat: Socket.IO enabled on all interfaces`);
      console.log(`🔒 Security: JWT validation, rate limiting, XSS protection enabled`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
