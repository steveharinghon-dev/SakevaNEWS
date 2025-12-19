import { Router } from 'express';
import PageView from '../models/PageView';

const router = Router();

// Записать посещение страницы
router.post('/track', async (req, res) => {
  try {
    const { path } = req.body;
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.socket.remoteAddress;

    await PageView.create({
      path,
      userAgent,
      ip
    });

    res.status(201).json({ message: 'Tracked' });
  } catch (error) {
    console.error('Track page view error:', error);
    res.status(500).json({ message: 'Error tracking' });
  }
});

export default router;
