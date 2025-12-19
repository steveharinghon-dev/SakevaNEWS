import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, UserRole } from '../models/User';

const router = Router();

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { nick, password } = req.body;

    if (!nick || !password) {
      return res.status(400).json({ message: 'Укажите ник и пароль' });
    }

    if (nick.length < 3 || nick.length > 20) {
      return res.status(400).json({ message: 'Ник должен быть от 3 до 20 символов' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен быть минимум 6 символов' });
    }

    const existingUser = await User.findOne({ where: { nick } });
    if (existingUser) {
      return res.status(400).json({ message: 'Этот ник уже занят' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      nick,
      password: hashedPassword,
      role: UserRole.USER
    });

    const secret = String(process.env.JWT_SECRET || 'default_secret');
    const token = jwt.sign(
      { id: user.id, nick: user.nick, role: user.role },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
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
router.post('/login', async (req, res) => {
  try {
    const { nick, password } = req.body;

    if (!nick || !password) {
      return res.status(400).json({ message: 'Укажите ник и пароль' });
    }

    const user = await User.findOne({ where: { nick } });
    if (!user) {
      return res.status(401).json({ message: 'Неверный ник или пароль' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Ваш аккаунт заблокирован' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверный ник или пароль' });
    }

    const secret = String(process.env.JWT_SECRET || 'default_secret');
    const token = jwt.sign(
      { id: user.id, nick: user.nick, role: user.role },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
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

    const secret = String(process.env.JWT_SECRET || 'default_secret');
    const decoded = jwt.verify(token, secret) as any;
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
