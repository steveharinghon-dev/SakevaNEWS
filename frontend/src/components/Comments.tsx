import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Comment } from '../types';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { FaCrown, FaShieldAlt, FaUser, FaTrash } from 'react-icons/fa';

interface CommentsProps {
  newsId: string;
}

const Comments = ({ newsId }: CommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Загрузка комментариев
  useEffect(() => {
    fetchComments();
  }, [newsId]);

  const fetchComments = async () => {
    try {
      const response = await api.get(`/comments/${newsId}`);
      setComments(response.data.comments);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
    }
  };

  // Добавить комментарий
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Войдите в аккаунт, чтобы оставить комментарий');
      return;
    }

    if (!newComment.trim()) {
      setError('Комментарий не может быть пустым');
      return;
    }

    if (newComment.length > 1000) {
      setError('Комментарий слишком длинный (максимум 1000 символов)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/comments/${newsId}`, {
        content: newComment.trim()
      });
      
      setComments([...comments, response.data.comment]);
      setNewComment('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при добавлении комментария');
    } finally {
      setLoading(false);
    }
  };

  // Удалить комментарий
  const handleDelete = async (commentId: number) => {
    if (!confirm('Удалить комментарий?')) return;

    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка при удалении комментария');
    }
  };

  // Иконка роли
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'owner':
        return <FaCrown className="text-yellow-500" title="Владелец" />;
      case 'admin':
        return <FaShieldAlt className="text-blue-500" title="Администратор" />;
      default:
        return <FaUser className="text-gray-400" title="Пользователь" />;
    }
  };

  // Может ли пользователь удалить комментарий
  const canDelete = (comment: Comment) => {
    if (!user) return false;
    return comment.userId === Number(user.id) || user.role === 'admin' || user.role === 'owner';
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
      <h3 className="text-2xl font-semibold mb-6">
        Комментарии {comments.length > 0 && `(${comments.length})`}
      </h3>

      {/* Форма добавления комментария */}
      <form onSubmit={handleSubmit} className="mb-8">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? "Написать комментарий..." : "Войдите в аккаунт, чтобы оставить комментарий"}
          disabled={!user || loading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
          rows={3}
          maxLength={1000}
        />
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-500">
            {newComment.length}/1000
          </span>
          
          <button
            type="submit"
            disabled={!user || loading || !newComment.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-red-600 text-sm">{error}</p>
        )}
      </form>

      {/* Список комментариев */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Комментариев пока нет. Будьте первым!
          </p>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    {getRoleIcon(comment.user?.role)}
                    <span className="font-semibold text-gray-800">
                      {comment.username}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {canDelete(comment) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-red-500 hover:text-red-700 transition"
                      title="Удалить комментарий"
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>

                <p className="text-gray-700 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Comments;
