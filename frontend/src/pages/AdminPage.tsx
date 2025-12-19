import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiTrash2, FiUsers, FiFileText, FiBarChart2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { News, User, Stats } from '../types';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'news' | 'users' | 'stats' | 'manage' | 'logs'>('news');
  const [manageSearch, setManageSearch] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Получить новости на модерацию
  const { data: pendingNews } = useQuery<{ news: News[] }>({
    queryKey: ['pendingNews'],
    queryFn: async () => {
      const response = await api.get('/news/pending');
      return response.data;
    },
  });

  // Получить всех пользователей (только для owner)
  const { data: usersData } = useQuery<{ users: User[] }>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    enabled: user?.role === 'owner',
  });

  // Получить статистику
  const { data: statsData } = useQuery<{ stats: Stats }>({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await api.get('/users/stats');
      return response.data;
    },
  });

  // Получить статистику посещений по часам
  const { data: hourlyViewsData } = useQuery<{ hourlyData: Array<{ hour: string; views: number }> }>({
    queryKey: ['hourlyViews'],
    queryFn: async () => {
      const response = await api.get('/users/stats/hourly');
      return response.data;
    },
    enabled: activeTab === 'stats',
  });

  // Получить статистику новостей по часам
  const { data: hourlyNewsData } = useQuery<{ hourlyData: Array<{ hour: string; posts: number }> }>({
    queryKey: ['hourlyNews'],
    queryFn: async () => {
      const response = await api.get('/users/stats/news-hourly');
      return response.data;
    },
    enabled: activeTab === 'stats',
  });

  // Модерация новостей
  const approveNewsMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/news/${id}/approve`),
    onSuccess: () => {
      toast.success('Новость одобрена');
      queryClient.invalidateQueries({ queryKey: ['pendingNews'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const rejectNewsMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/news/${id}/reject`),
    onSuccess: () => {
      toast.success('Новость отклонена');
      queryClient.invalidateQueries({ queryKey: ['pendingNews'] });
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/news/${id}`),
    onSuccess: () => {
      toast.success('Новость удалена');
      queryClient.invalidateQueries({ queryKey: ['pendingNews'] });
    },
  });

  // Управление пользователями
  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/users/${id}/role`, { role }),
    onSuccess: () => {
      toast.success('Роль изменена');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка изменения роли');
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: ({ id, isBlocked }: { id: string; isBlocked: boolean }) =>
      api.patch(`/users/${id}/block`, { isBlocked }),
    onSuccess: () => {
      toast.success('Статус пользователя изменен');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка блокировки');
    },
  });

  // Получить все новости для управления (только owner)
  const { data: manageNewsData } = useQuery<{ news: News[] }>({
    queryKey: ['manageNews', manageSearch],
    queryFn: async () => {
      const response = await api.get('/news/manage/all', {
        params: { search: manageSearch }
      });
      return response.data;
    },
    enabled: user?.role === 'owner' && activeTab === 'manage',
  });

  // Получить логи действий (только owner)
  const { data: logsData } = useQuery<{ logs: any[] }>({
    queryKey: ['newsLogs'],
    queryFn: async () => {
      const response = await api.get('/news/logs');
      return response.data;
    },
    enabled: user?.role === 'owner' && activeTab === 'logs',
  });

  // Скрыть/показать новость
  const toggleVisibilityMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/news/${id}/toggle-visibility`),
    onSuccess: () => {
      toast.success('Видимость изменена');
      queryClient.invalidateQueries({ queryKey: ['manageNews'] });
    },
  });

  // Удалить новость из управления
  const deleteNewsMutation2 = useMutation({
    mutationFn: (id: string) => api.delete(`/news/${id}`),
    onSuccess: () => {
      toast.success('Новость удалена');
      queryClient.invalidateQueries({ queryKey: ['manageNews'] });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-sakeva-pink/10 to-white py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl font-bold mb-8 bg-gradient-to-r from-sakeva-pink to-pink-400 bg-clip-text text-transparent"
        >
          Панель администратора
        </motion.h1>

        {/* Табы */}
        <div className="flex flex-wrap space-x-2 mb-6 gap-y-2">
          <TabButton
            active={activeTab === 'news'}
            onClick={() => setActiveTab('news')}
            icon={<FiFileText />}
            label="Модерация"
          />
          {user?.role === 'owner' && (
            <>
              <TabButton
                active={activeTab === 'manage'}
                onClick={() => setActiveTab('manage')}
                icon={<FiFileText />}
                label="Управление"
              />
              <TabButton
                active={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
                icon={<FiUsers />}
                label="Пользователи"
              />
              <TabButton
                active={activeTab === 'logs'}
                onClick={() => setActiveTab('logs')}
                icon={<FiFileText />}
                label="Логи"
              />
            </>
          )}
          <TabButton
            active={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
            icon={<FiBarChart2 />}
            label="Статистика"
          />
        </div>

        {/* Контент табов */}
        {activeTab === 'news' && (
          <div className="space-y-4">
            {pendingNews?.news.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                Нет новостей на модерации
              </div>
            ) : (
              pendingNews?.news.map((news) => (
                <motion.div
                  key={news.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{news.title}</h3>
                      <p className="text-sm text-gray-500">
                        Автор: {news.author.nick} • {new Date(news.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{news.content}</p>
                  
                  {news.imageUrl && (
                    <img src={news.imageUrl} alt={news.title} className="w-full max-h-64 object-cover rounded-lg mb-4" />
                  )}

                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => approveNewsMutation.mutate(String(news.id))}
                      className="flex items-center space-x-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      <FiCheck />
                      <span>Одобрить</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => rejectNewsMutation.mutate(String(news.id))}
                      className="flex items-center space-x-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                    >
                      <FiX />
                      <span>Отклонить</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => deleteNewsMutation.mutate(String(news.id))}
                      className="flex items-center space-x-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      <FiTrash2 />
                      <span>Удалить</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'users' && user?.role === 'owner' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-sakeva-pink text-white">
                <tr>
                  <th className="px-6 py-3 text-left">Ник</th>
                  <th className="px-6 py-3 text-left">Роль</th>
                  <th className="px-6 py-3 text-left">Статус</th>
                  <th className="px-6 py-3 text-left">Действия</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{u.nick}</td>
                    <td className="px-6 py-4">
                      {u.nick !== 'sakeva_owner' && u.nick !== 'Mexa' && user?.role === 'owner' ? (
                        <select
                          value={u.role}
                          onChange={(e) => changeRoleMutation.mutate({ id: String(u.id), role: e.target.value })}
                          className="px-3 py-1 border rounded"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`font-bold ${u.role === 'owner' ? 'text-sakeva-pink' : 'text-gray-700'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.isBlocked ? (
                        <span className="text-red-600 font-semibold">Заблокирован</span>
                      ) : (
                        <span className="text-green-600 font-semibold">Активен</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.nick !== 'sakeva_owner' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            blockUserMutation.mutate({ id: String(u.id), isBlocked: !u.isBlocked })
                          }
                          className={`px-4 py-1 rounded ${
                            u.isBlocked
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-red-500 hover:bg-red-600'
                          } text-white transition`}
                        >
                          {u.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                        </motion.button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Управление новостями (только owner) */}
        {activeTab === 'manage' && user?.role === 'owner' && (
          <div className="space-y-4">
            {/* Поиск */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <input
                type="text"
                placeholder="Поиск по названию или описанию..."
                value={manageSearch}
                onChange={(e) => setManageSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-sakeva-pink focus:outline-none"
              />
            </div>

            {/* Карточки новостей */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {manageNewsData?.news.map((newsItem) => (
                <motion.div
                  key={newsItem.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                    newsItem.isHidden ? 'opacity-60 border-2 border-gray-400' : ''
                  }`}
                >
                  {newsItem.imageUrl && (
                    <img
                      src={newsItem.imageUrl}
                      alt={newsItem.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 truncate">{newsItem.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{newsItem.content}</p>
                    
                    <div className="text-xs text-gray-500 mb-3 space-y-1">
                      <div>Автор: <span className="font-semibold">{newsItem.author.nick}</span></div>
                      {newsItem.approvedBy && (
                        <div>Одобрил: <span className="font-semibold">{newsItem.approvedBy.nick}</span></div>
                      )}
                      <div>Статус: <span className={`font-semibold ${
                        newsItem.status === 'approved' ? 'text-green-600' :
                        newsItem.status === 'pending' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>{newsItem.status}</span></div>
                      {newsItem.isHidden && (
                        <div className="text-red-600 font-semibold">СКРЫТО</div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleVisibilityMutation.mutate(String(newsItem.id))}
                        className={`flex-1 px-3 py-2 rounded text-white text-sm ${
                          newsItem.isHidden ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'
                        }`}
                      >
                        {newsItem.isHidden ? 'Показать' : 'Скрыть'}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (confirm('Удалить новость?')) {
                            deleteNewsMutation2.mutate(String(newsItem.id));
                          }
                        }}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                      >
                        <FiTrash2 />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {manageNewsData?.news.length === 0 && (
              <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                Новостей не найдено
              </div>
            )}
          </div>
        )}

        {/* Логи действий (только owner) */}
        {activeTab === 'logs' && user?.role === 'owner' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sakeva-pink text-white">
                  <tr>
                    <th className="px-6 py-3 text-left">Дата</th>
                    <th className="px-6 py-3 text-left">Действие</th>
                    <th className="px-6 py-3 text-left">Пользователь</th>
                    <th className="px-6 py-3 text-left">Новость</th>
                    <th className="px-6 py-3 text-left">Автор новости</th>
                  </tr>
                </thead>
                <tbody>
                  {logsData?.logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        {new Date(log.createdAt).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          log.action === 'created' ? 'bg-blue-100 text-blue-800' :
                          log.action === 'approved' ? 'bg-green-100 text-green-800' :
                          log.action === 'rejected' ? 'bg-red-100 text-red-800' :
                          log.action === 'deleted' ? 'bg-gray-100 text-gray-800' :
                          log.action === 'hidden' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {log.action === 'created' ? 'Создано' :
                           log.action === 'approved' ? 'Одобрено' :
                           log.action === 'rejected' ? 'Отклонено' :
                           log.action === 'deleted' ? 'Удалено' :
                           log.action === 'hidden' ? 'Скрыто' : 'Показано'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">{log.user.nick}</td>
                      <td className="px-6 py-4">{log.news?.title || 'Удалена'}</td>
                      <td className="px-6 py-4">{log.news?.author?.nick || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {logsData?.logs.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Логов пока нет
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Карточки статистики */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Всего пользователей"
                value={statsData?.stats.totalUsers || 0}
                color="bg-blue-500"
              />
              <StatCard
                title="Одобренных новостей"
                value={statsData?.stats.totalNews || 0}
                color="bg-green-500"
              />
              <StatCard
                title="На модерации"
                value={statsData?.stats.pendingNews || 0}
                color="bg-yellow-500"
              />
            </div>

            {/* График посещений */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <FiBarChart2 className="text-sakeva-pink" />
                <span>Посещения за последние 24 часа</span>
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyViewsData?.hourlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #ff6b9d',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#ff6b9d" 
                    strokeWidth={3}
                    dot={{ fill: '#ff6b9d', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Просмотры"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* График новостей */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <FiFileText className="text-sakeva-pink" />
                <span>Созданные новости за последние 24 часа</span>
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyNewsData?.hourlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #ff6b9d',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="posts" 
                    fill="#ff6b9d"
                    radius={[8, 8, 0, 0]}
                    name="Новости"
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

// Компоненты
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition ${
      active
        ? 'bg-sakeva-pink text-white shadow-lg'
        : 'bg-white text-gray-700 hover:bg-gray-100'
    }`}
  >
    {icon}
    <span>{label}</span>
  </motion.button>
);

const StatCard: React.FC<{ title: string; value: number; color: string }> = ({
  title,
  value,
  color,
}) => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className={`${color} text-white rounded-lg shadow-lg p-6`}
  >
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-4xl font-bold">{value}</p>
  </motion.div>
);

export default AdminPage;
