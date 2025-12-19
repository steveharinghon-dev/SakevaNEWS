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

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // лимит 100 запросов с одного IP
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

// Socket.IO chat handler
io.on('connection', (socket) => {
  console.log(`💬 User connected: ${socket.id}`);

  // Получить последние 50 сообщений
  socket.on('chat:getHistory', async () => {
    try {
      const messages = await ChatMessage.findAll({
        order: [['createdAt', 'DESC']],
        limit: 50,
      });
      socket.emit('chat:history', messages.reverse());
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  });

  // Новое сообщение
  socket.on('chat:sendMessage', async (data: { message: string; token?: string }) => {
    try {
      let userId: number | null = null;
      let username = 'Аноним';
      let isAnonymous = true;
      let userRole: string | undefined = undefined;

      // Проверка JWT токена для зарегистрированных пользователей
      if (data.token) {
        try {
          const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'your-secret-key') as any;
          userId = decoded.id;
          username = decoded.nick;
          isAnonymous = false;
          userRole = decoded.role;
        } catch (err) {
          // Токен невалиден - пользователь анонимный
        }
      }

      // Сохранение сообщения в БД
      const chatMessage = await ChatMessage.create({
        userId,
        username,
        message: data.message,
        isAnonymous,
        userRole,
      });

      // Отправка всем подключенным клиентам
      io.emit('chat:newMessage', chatMessage);
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`💬 User disconnected: ${socket.id}`);
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, '0.0.0.0');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API: http://0.0.0.0:${PORT}/api`);
    console.log(`💬 Chat: Socket.IO enabled on all interfaces`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
