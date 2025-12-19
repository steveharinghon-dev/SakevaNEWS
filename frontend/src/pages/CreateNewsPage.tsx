import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiImage } from 'react-icons/fi';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';

const CreateNewsPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const navigate = useNavigate();

  const createNewsMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; imageUrl?: string }) => {
      const response = await api.post('/news', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Новость отправлена на модерацию!');
      navigate('/');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка создания новости');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createNewsMutation.mutate({ title, content, imageUrl: imageUrl || undefined });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sakeva-pink/10 to-white py-12 px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8"
      >
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-sakeva-pink to-pink-400 bg-clip-text text-transparent">
          Создать новость
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Заголовок</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sakeva-pink focus:outline-none transition"
              placeholder="Введите заголовок новости (5-200 символов)"
              minLength={5}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Содержание</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sakeva-pink focus:outline-none transition resize-none"
              placeholder="Напишите текст новости (10-5000 символов)"
              rows={10}
              minLength={10}
              maxLength={5000}
              required
            />
            <p className="text-sm text-gray-500 mt-1">{content.length} / 5000</p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              <FiImage className="inline mr-2" />
              URL изображения (опционально)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sakeva-pink focus:outline-none transition"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {imageUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Предпросмотр изображения:</p>
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full max-h-64 object-cover rounded-lg"
                onError={() => toast.error('Неверная ссылка на изображение')}
              />
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={createNewsMutation.isPending}
            className="w-full bg-gradient-to-r from-sakeva-pink to-pink-400 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-50"
          >
            {createNewsMutation.isPending ? 'Отправка...' : 'Отправить на модерацию'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateNewsPage;
