import { Request, Response, NextFunction } from 'express';

/**
 * Кастомная ошибка приложения
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Глобальный обработчик ошибок
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Кастомная ошибка приложения
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  // Sequelize ошибки валидации
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Ошибка валидации данных',
      errors: (err as any).errors?.map((e: any) => e.message)
    });
  }

  // Sequelize ошибки уникальности
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      status: 'error',
      message: 'Запись уже существует'
    });
  }

  // JWT ошибки
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Неверный токен'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Токен истёк'
    });
  }

  // Неизвестные ошибки
  console.error('💥 Unhandled error:', err);
  
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Внутренняя ошибка сервера' 
      : err.message
  });
};

/**
 * Обёртка для async роутов
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
