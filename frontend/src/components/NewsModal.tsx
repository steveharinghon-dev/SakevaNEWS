import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { News } from '../types';
import { FiX, FiUser, FiCalendar } from 'react-icons/fi';

interface NewsModalProps {
  news: News | null;
  isOpen: boolean;
  onClose: () => void;
}

const NewsModal: React.FC<NewsModalProps> = ({ news, isOpen, onClose }) => {
  if (!news) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Затемнение фона */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Модальное окно */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Кнопка закрытия */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm p-4 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Новость</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <FiX className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Изображение */}
              {news.imageUrl && (
                <div className="w-full h-96 overflow-hidden">
                  <img
                    src={news.imageUrl}
                    alt={news.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Контент */}
              <div className="p-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{news.title}</h1>

                {/* Метаданные */}
                <div className="flex items-center space-x-6 mb-6 text-gray-600">
                  <div className="flex items-center space-x-2">
                    <FiUser className="text-sakeva-pink" />
                    <span className="font-semibold">{news.author.nick}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiCalendar className="text-sakeva-pink" />
                    <span>{formatDate(news.approvedAt || news.createdAt)}</span>
                  </div>
                </div>

                {/* Текст новости */}
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {news.content}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewsModal;
