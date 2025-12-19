import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    nick: string;
    role: UserRole;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Требуется аутентификация' });
      return;
    }

    const secret = String(process.env.JWT_SECRET || 'default_secret');
    const decoded = jwt.verify(token, secret) as any;
    
    const user = await User.findByPk(decoded.id);
    if (!user) {
      res.status(401).json({ message: 'Пользователь не найден' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ message: 'Аккаунт заблокирован' });
      return;
    }

    req.user = {
      id: user.id.toString(),
      nick: user.nick,
      role: user.role
    };

    next();
  } catch (error) {
    res.status(403).json({ message: 'Неверный токен' });
  }
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Недостаточно прав доступа' });
      return;
    }
    next();
  };
};
