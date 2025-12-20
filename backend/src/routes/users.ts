import { Router } from 'express';
import { User, UserRole } from '../models/User';
import { News, NewsStatus } from '../models/News';
import PageView from '../models/PageView';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

const router = Router();

// Получить всех пользователей (только owner)
router.get('/', authenticateToken, authorizeRoles(UserRole.OWNER), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Ошибка получения пользователей' });
  }
});

// Изменить роль пользователя (только owner)
router.patch('/:id/role', authenticateToken, authorizeRoles(UserRole.OWNER), async (req: AuthRequest, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ message: 'Неверная роль' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Нельзя изменить роль owner аккаунта
    if (user.nick === 'Mexa') {
      return res.status(403).json({ message: 'Нельзя изменить роль владельца сайта' });
    }

    // Нельзя сделать admin -> owner (только user -> admin)
    if (role === UserRole.OWNER) {
      return res.status(403).json({ message: 'Нельзя назначить роль владельца' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'Роль изменена', user: { id: user.id, nick: user.nick, role: user.role } });
  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({ message: 'Ошибка изменения роли' });
  }
});

// Заблокировать/разблокировать пользователя (только owner)
router.patch('/:id/block', authenticateToken, authorizeRoles(UserRole.OWNER), async (req, res) => {
  try {
    const { isBlocked } = req.body;
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Нельзя заблокировать owner аккаунт
    if (user.nick === 'Mexa') {
      return res.status(403).json({ message: 'Нельзя заблокировать владельца сайта' });
    }

    user.isBlocked = isBlocked;
    await user.save();

    res.json({ 
      message: isBlocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован',
      user: { id: user.id, nick: user.nick, isBlocked: user.isBlocked }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Ошибка блокировки пользователя' });
  }
});

// Удалить пользователя (только owner)
router.delete('/:id', authenticateToken, authorizeRoles(UserRole.OWNER), async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Нельзя удалить owner аккаунт
    if (user.nick === 'Mexa' || user.nick === 'sakeva_owner') {
      return res.status(403).json({ message: 'Нельзя удалить владельца сайта' });
    }

    // Удаляем все связанные данные в правильном порядке
    // 1. Удаляем новости пользователя (каскадно удалятся комментарии к ним)
    await News.destroy({ where: { authorId: userId } });
    
    // 2. Удаляем новости, одобренные этим пользователем (обнуляем approvedById)
    await News.update(
      { approvedById: undefined, approvedAt: undefined },
      { where: { approvedById: userId } }
    );

    // 3. ChatMessage имеет SET NULL, поэтому просто обновим
    // (это происходит автоматически при удалении пользователя)

    // 4. Теперь можно удалить пользователя
    await user.destroy();

    res.json({ message: 'Пользователь и все его данные удалены' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Ошибка удаления пользователя' });
  }
});

// Получить статистику (только admin/owner)
router.get('/stats', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.OWNER), async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalNews = await News.count({ where: { status: NewsStatus.APPROVED } });
    const pendingNews = await News.count({ where: { status: NewsStatus.PENDING } });

    res.json({
      stats: {
        totalUsers,
        totalNews,
        pendingNews
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Ошибка получения статистики' });
  }
});

// Получить статистику активности по часам (24 часа)
router.get('/stats/hourly', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.OWNER), async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Получаем все посещения за последние 24 часа
    const views = await PageView.findAll({
      where: {
        createdAt: {
          [Op.gte]: last24Hours
        }
      },
      attributes: ['createdAt'],
      raw: true
    });

    // Группируем по часам (МСК +3)
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hour = (new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).getHours() + 3) % 24;
      return {
        hour: `${hour}:00`,
        views: 0
      };
    });

    views.forEach((view: any) => {
      const viewDate = new Date(view.createdAt);
      const hoursDiff = Math.floor((now.getTime() - viewDate.getTime()) / (60 * 60 * 1000));
      if (hoursDiff < 24) {
        const index = 23 - hoursDiff;
        if (hourlyData[index]) {
          hourlyData[index].views++;
        }
      }
    });

    res.json({ hourlyData });
  } catch (error) {
    console.error('Get hourly stats error:', error);
    res.status(500).json({ message: 'Ошибка получения статистики' });
  }
});

// Получить статистику новостей по часам (24 часа)
router.get('/stats/news-hourly', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.OWNER), async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const news = await News.findAll({
      where: {
        createdAt: {
          [Op.gte]: last24Hours
        }
      },
      attributes: ['createdAt'],
      raw: true
    });

    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hour = (new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).getHours() + 3) % 24;
      return {
        hour: `${hour}:00`,
        posts: 0
      };
    });

    news.forEach((item: any) => {
      const postDate = new Date(item.createdAt);
      const hoursDiff = Math.floor((now.getTime() - postDate.getTime()) / (60 * 60 * 1000));
      if (hoursDiff < 24) {
        const index = 23 - hoursDiff;
        if (hourlyData[index]) {
          hourlyData[index].posts++;
        }
      }
    });

    res.json({ hourlyData });
  } catch (error) {
    console.error('Get news hourly stats error:', error);
    res.status(500).json({ message: 'Ошибка получения статистики новостей' });
  }
});

export default router;
