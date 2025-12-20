import { Router, Request, Response } from 'express';
import Comment from '../models/Comment';
import { User } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import validator from 'validator';
import { APP_CONSTANTS } from '../config/constants';

const router = Router();

// Получить комментарии к новости (публично)
router.get('/:newsId', asyncHandler(async (req: Request, res: Response) => {
  const { newsId } = req.params;

  if (!newsId || isNaN(Number(newsId))) {
    return res.status(400).json({ message: 'Неверный ID новости' });
  }

  const comments = await Comment.findAll({
    where: { newsId: Number(newsId) },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'nick', 'role']
    }],
    order: [['createdAt', 'ASC']],
    attributes: ['id', 'newsId', 'userId', 'username', 'content', 'createdAt']
  });

  res.json({ comments });
}));

// Добавить комментарий (требует авторизацию)
router.post('/:newsId', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { newsId } = req.params;
  const { content } = req.body;

  // Валидация
  if (!newsId || isNaN(Number(newsId))) {
    return res.status(400).json({ message: 'Неверный ID новости' });
  }

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ message: 'Укажите текст комментария' });
  }

  // Санитизация и валидация
  const sanitizedContent = validator.trim(content);

  if (sanitizedContent.length === 0) {
    return res.status(400).json({ message: 'Комментарий не может быть пустым' });
  }

  if (sanitizedContent.length > 1000) {
    return res.status(400).json({ message: 'Комментарий слишком длинный (максимум 1000 символов)' });
  }

  // Проверка существования новости
  const { News } = await import('../models/News');
  const news = await News.findByPk(Number(newsId));
  if (!news) {
    return res.status(404).json({ message: 'Новость не найдена' });
  }

  // Создание комментария
  const comment = await Comment.create({
    newsId: Number(newsId),
    userId: Number(req.user!.id),
    username: req.user!.nick,
    content: sanitizedContent,
  });

  // Возвращаем комментарий с данными пользователя
  const commentWithUser = await Comment.findByPk(comment.id, {
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'nick', 'role']
    }]
  });

  res.status(201).json({
    message: 'Комментарий добавлен',
    comment: commentWithUser
  });
}));

// Удалить комментарий (только автор или админ/владелец)
router.delete('/:commentId', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { commentId } = req.params;

  if (!commentId || isNaN(Number(commentId))) {
    return res.status(400).json({ message: 'Неверный ID комментария' });
  }

  const comment = await Comment.findByPk(Number(commentId));
  if (!comment) {
    return res.status(404).json({ message: 'Комментарий не найден' });
  }

  // Проверка прав: автор комментария или админ/владелец
  const isAuthor = comment.userId === Number(req.user!.id);
  const isAdmin = req.user!.role === 'admin' || req.user!.role === 'owner';

  if (!isAuthor && !isAdmin) {
    return res.status(403).json({ message: 'Недостаточно прав для удаления комментария' });
  }

  await comment.destroy();

  res.json({ message: 'Комментарий удалён' });
}));

export default router;
