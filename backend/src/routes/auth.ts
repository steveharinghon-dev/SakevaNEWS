import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, UserRole } from '../models/User';
import { APP_CONSTANTS } from '../config/constants';
import rateLimit from 'express-rate-limit';
import validator from 'validator';

const router = Router();

// Rate limiter для auth роутов - защита от брутфорса
const authLimiter = rateLimit({
  windowMs: APP_CONSTANTS.RATE_LIMIT.AUTH_WINDOW_MS,
  max: APP_CONSTANTS.RATE_LIMIT.AUTH_MAX_ATTEMPTS,
  message: 'Слишком много попыток входа, попробуйте позже',
  standardHeaders: true,
  legacyHeaders: false,
});

// Проверка JWT секрета при загрузке модуля
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < APP_CONSTANTS.AUTH.JWT_MIN_SECRET_LENGTH) {
  console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: JWT_SECRET не задан или слишком короткий!');
  console.error(`   JWT_SECRET должен быть минимум ${APP_CONSTANTS.AUTH.JWT_MIN_SECRET_LENGTH} символов`);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }
}

// Регистрация
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { nick, password } = req.body;

    // Валидация типов
    if (!nick || !password || typeof nick !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Неверный формат данных' });
    }

    const sanitizedNick = validator.trim(nick);

    // Валидация ника
    if (sanitizedNick.length < APP_CONSTANTS.AUTH.MIN_NICK_LENGTH || 
        sanitizedNick.length > APP_CONSTANTS.AUTH.MAX_NICK_LENGTH) {
      return res.status(400).json({ 
        message: `Ник должен быть от ${APP_CONSTANTS.AUTH.MIN_NICK_LENGTH} до ${APP_CONSTANTS.AUTH.MAX_NICK_LENGTH} символов` 
      });
    }

    // Проверка на спецсимволы в нике
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedNick)) {
      return res.status(400).json({ 
        message: 'Ник может содержать только буквы, цифры, _ и -' 
      });
    }

    // Усиленная валидация пароля
    if (password.length < APP_CONSTANTS.AUTH.MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ 
        message: `Пароль должен быть минимум ${APP_CONSTANTS.AUTH.MIN_PASSWORD_LENGTH} символов` 
      });
    }

    // Проверка сложности пароля
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return res.status(400).json({ 
        message: 'Пароль должен содержать заглавные и строчные буквы, и цифры' 
      });
    }

    const existingUser = await User.findOne({ where: { nick: sanitizedNick } });
    if (existingUser) {
      return res.status(400).json({ message: 'Этот ник уже занят' });
    }

    // Увеличенные раунды для безопасности
    const hashedPassword = await bcrypt.hash(password, APP_CONSTANTS.AUTH.BCRYPT_ROUNDS);

    const user = await User.create({
      nick: sanitizedNick,
      password: hashedPassword,
      role: UserRole.USER
    });

    const token = jwt.sign(
      { id: user.id, nick: user.nick, role: user.role },
      JWT_SECRET!,
      { expiresIn: APP_CONSTANTS.AUTH.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Регистрация успешна',
      token,
      user: {
        id: user.id,
        nick: user.nick,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Ошибка регистрации' });
  }
});

// Логин
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { nick, password } = req.body;

    // Валидация типов
    if (!nick || !password || typeof nick !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Неверный формат данных' });
    }

    const sanitizedNick = validator.trim(nick);

    const user = await User.findOne({ where: { nick: sanitizedNick } });
    
    // ЗАЩИТА ОТ TIMING ATTACK: всегда делаем bcrypt.compare, даже если юзер не найден
    // Используем фейковый хеш с правильным количеством раундов
    const fakeHash = '$2a$12$' + 'X'.repeat(53); // Валидный bcrypt хеш
    const isPasswordValid = user 
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, fakeHash);

    // ОДИНАКОВОЕ сообщение для обоих случаев - защита от enumeration
    if (!user || !isPasswordValid) {
      return res.status(401).json({ message: 'Неверный ник или пароль' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Ваш аккаунт заблокирован' });
    }

    const token = jwt.sign(
      { id: user.id, nick: user.nick, role: user.role },
      JWT_SECRET!,
      { expiresIn: APP_CONSTANTS.AUTH.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: {
        id: user.id,
        nick: user.nick,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Ошибка входа' });
  }
});

// Получить текущего пользователя
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Требуется аутентификация' });
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json({
      user: {
        id: user.id,
        nick: user.nick,
        role: user.role,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    res.status(403).json({ message: 'Неверный токен' });
  }
});

export default router;
