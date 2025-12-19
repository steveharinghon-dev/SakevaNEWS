import React from 'react';
import { motion } from 'framer-motion';
import { News } from '../types';
import { FiUser, FiCalendar } from 'react-icons/fi';

interface NewsCardProps {
  news: News;
  onClick?: () => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(255, 107, 157, 0.2)' }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer"
    >
      {news.imageUrl && (
        <div className="h-48 overflow-hidden">
          <img
            src={news.imageUrl}
            alt={news.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-3 truncate">{news.title}</h3>
        <p className="text-gray-600 mb-4">{truncateText(news.content, 250)}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <FiUser className="text-sakeva-pink" />
            <span className="font-semibold">{news.author.nick}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FiCalendar className="text-sakeva-pink" />
            <span>{formatDate(news.approvedAt || news.createdAt)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NewsCard;
