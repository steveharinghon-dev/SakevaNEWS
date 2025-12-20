import { Router } from 'express';
import { News, NewsStatus } from '../models/News';
import { User } from '../models/User';
import NewsLog, { ActionType } from '../models/NewsLog';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';
import { UserRole } from '../models/User';
import { Op } from 'sequelize';

const router = Router();

// Получить все одобренные новости (публичный доступ)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const whereClause: any = { 
      status: NewsStatus.APPROVED,
      isHidden: false  // Не показываем скрытые новости
    };
    
    if (search) {
      whereClause.title = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await News.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'nick']
      }],
      order: [['approvedAt', 'DESC']],
      offset: (pageNum - 1) * limitNum,
      limit: limitNum
    });

    res.json({
      news: rows,
      total: count,
      pages: Math.ceil(count / limitNum),
      currentPage: pageNum
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ message: 'Ошибка получения новостей' });
  }
});

// Получить новости на модерацию (только admin/owner)
router.get('/pending', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.OWNER), async (req, res) => {
  try {
    const news = await News.findAll({
      where: { status: NewsStatus.PENDING },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'nick']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ news });
  } catch (error) {
    console.error('Get pending news error:', error);
    res.status(500).json({ message: 'Ошибка получения новостей' });
  }
});

// Создать новость (только для залогиненных)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, content, imageUrl } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Укажите заголовок и содержание' });
    }

    if (title.length < 5 || title.length > 200) {
      return res.status(400).json({ message: 'Заголовок должен быть от 5 до 200 символов' });
    }

    if (content.length < 10 || content.length > 5000) {
      return res.status(400).json({ message: 'Содержание должно быть от 10 до 5000 символов' });
    }

    const news = await News.create({
      title,
      content,
      authorId: parseInt(req.user!.id),
      imageUrl: imageUrl || null,
      status: NewsStatus.PENDING
    });

    // Логируем создание новости
    await NewsLog.create({
      action: ActionType.CREATED,
      newsId: news.id,
      userId: parseInt(req.user!.id)
    });

    res.status(201).json({
      message: 'Новость отправлена на модерацию',
      news
    });
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({ message: 'Ошибка создания новости' });
  }
});

// Одобрить новость (только admin/owner)
router.patch('/:id/approve', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.OWNER), async (req: AuthRequest, res) => {
  try {
    const news = await News.findByPk(req.params.id);

    if (!news) {
      return res.status(404).json({ message: 'Новость не найдена' });
    }

    news.status = NewsStatus.APPROVED;
    news.approvedAt = new Date();
    news.approvedById = parseInt(req.user!.id);
    await news.save();

    // Логируем одобрение
    await NewsLog.create({
      action: ActionType.APPROVED,
      newsId: news.id,
      userId: parseInt(req.user!.id)
    });

    res.json({ message: 'Новость одобрена', news });
  } catch (error) {
    console.error('Approve news error:', error);
    res.status(500).json({ message: 'Ошибка одобрения новости' });
  }
});

// Отклонить новость (только admin/owner)
router.patch('/:id/reject', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.OWNER), async (req: AuthRequest, res) => {
  try {
    const news = await News.findByPk(req.params.id);

    if (!news) {
      return res.status(404).json({ message: 'Новость не найдена' });
    }

    news.status = NewsStatus.REJECTED;
    await news.save();

    // Логируем отклонение
    await NewsLog.create({
      action: ActionType.REJECTED,
      newsId: news.id,
      userId: parseInt(req.user!.id)
    });

    res.json({ message: 'Новость отклонена', news });
  } catch (error) {
    console.error('Reject news error:', error);
    res.status(500).json({ message: 'Ошибка отклонения новости' });
  }
});

// Удалить новость (только admin/owner)
router.delete('/:id', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.OWNER), async (req: AuthRequest, res) => {
  try {
    const news = await News.findByPk(req.params.id);

    if (!news) {
      return res.status(404).json({ message: 'Новость не найдена' });
    }

    // Сначала удаляем все логи, связанные с этой новостью
    await NewsLog.destroy({
      where: { newsId: news.id }
    });

    // Теперь можем безопасно удалить новость
    await news.destroy();

    res.json({ message: 'Новость удалена' });
  } catch (error: any) {
    console.error('Delete news error:', error);
    res.status(500).json({ 
      message: 'Ошибка удаления новости',
      error: error.message 
    });
  }
});

// Получить все новости для управления (только owner)
router.get('/manage/all', authenticateToken, authorizeRoles(UserRole.OWNER), async (req, res) => {
  try {
    const { search = '' } = req.query;
    const whereClause: any = {};
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }

    const news = await News.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'nick']
        },
        {
          model: User,
          as: 'approvedBy',
          attributes: ['id', 'nick']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ news });
  } catch (error) {
    console.error('Get all news error:', error);
    res.status(500).json({ message: 'Ошибка получения новостей' });
  }
});

// Скрыть/показать новость (только owner)
router.patch('/:id/toggle-visibility', authenticateToken, authorizeRoles(UserRole.OWNER), async (req: AuthRequest, res) => {
  try {
    const news = await News.findByPk(req.params.id);

    if (!news) {
      return res.status(404).json({ message: 'Новость не найдена' });
    }

    news.isHidden = !news.isHidden;
    await news.save();

    // Логируем действие
    await NewsLog.create({
      action: news.isHidden ? ActionType.HIDDEN : ActionType.SHOWN,
      newsId: news.id,
      userId: parseInt(req.user!.id)
    });

    res.json({ 
      message: news.isHidden ? 'Новость скрыта' : 'Новость показана', 
      news 
    });
  } catch (error: any) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({ 
      message: 'Ошибка изменения видимости',
      error: error.message 
    });
  }
});

// Получить логи действий (только owner)
router.get('/logs', authenticateToken, authorizeRoles(UserRole.OWNER), async (req, res) => {
  try {
    const logs = await NewsLog.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nick']
        },
        {
          model: News,
          as: 'news',
          attributes: ['id', 'title'],
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'nick']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    res.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ message: 'Ошибка получения логов' });
  }
});

export default router;
