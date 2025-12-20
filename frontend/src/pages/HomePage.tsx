import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';
import api from '../lib/api';
import { News, NewsResponse } from '../types';
import NewsCard from '../components/NewsCard';
import NewsModal from '../components/NewsModal';

const HomePage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNewsClick = (news: News) => {
    setSelectedNews(news);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedNews(null), 300);
  };

  const { data, isLoading } = useQuery<NewsResponse>({
    queryKey: ['news', page, search],
    queryFn: async () => {
      const response = await api.get('/news', {
        params: { page, limit: 9, search },
      });
      return response.data;
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-sakeva-pink/10 to-white"
    >
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-sakeva-pink to-pink-400 bg-clip-text text-transparent">
            Новости сервера Sakeva
          </h1>
          <p className="text-gray-600 text-lg">
            Самые свежие новости от игроков сообщества
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Поиск по заголовку..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-sakeva-pink/30 focus:border-sakeva-pink focus:outline-none transition"
            />
          </div>
        </motion.div>

        {/* News Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-sakeva-pink border-t-transparent rounded-full"
            />
          </div>
        ) : data?.news.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-xl">Новостей пока нет</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {data?.news.map((news) => (
                <NewsCard 
                  key={news.id} 
                  news={news} 
                  onClick={() => handleNewsClick(news)}
                />
              ))}
            </div>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="flex justify-center space-x-2">
                {Array.from({ length: data.pages }, (_, i) => i + 1).map((pageNum) => (
                  <motion.button
                    key={pageNum}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      page === pageNum
                        ? 'bg-sakeva-pink text-white'
                        : 'bg-white text-gray-700 hover:bg-sakeva-pink/10'
                    }`}
                  >
                    {pageNum}
                  </motion.button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Модальное окно */}
        <NewsModal 
          news={selectedNews} 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
        />
      </div>
    </motion.div>
  );
};

export default HomePage;
