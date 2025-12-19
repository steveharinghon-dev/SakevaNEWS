import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiUser } from 'react-icons/fi';
import { FaCrown, FaShieldAlt, FaUser as FaUserIcon } from 'react-icons/fa';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

interface ChatMessage {
  id: number;
  userId: number | null;
  username: string;
  message: string;
  isAnonymous: boolean;
  userRole?: string;
  createdAt: string;
}

const Chat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Подключение к Socket.IO
  useEffect(() => {
    // В продакшене Socket.IO будет на том же домене, в dev - на localhost:5000
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
      (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    setSocket(socketInstance);

    // Получить историю сообщений
    socketInstance.emit('chat:getHistory');

    // Слушать историю
    socketInstance.on('chat:history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    // Слушать новые сообщения
    socketInstance.on('chat:newMessage', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const token = user ? localStorage.getItem('token') : undefined;

    socket.emit('chat:sendMessage', {
      message: newMessage,
      token,
    });

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleIcon = (role?: string) => {
    if (!role) return null;
    
    switch (role) {
      case 'owner':
        return <FaCrown className="text-yellow-400" size={14} title="Владелец" />;
      case 'admin':
        return <FaShieldAlt className="text-blue-400" size={14} title="Администратор" />;
      case 'user':
        return <FaUserIcon className="text-gray-400" size={14} title="Пользователь" />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Кнопка чата (фиксированная) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-sakeva-pink to-pink-400 text-white p-4 rounded-full shadow-2xl hover:shadow-xl transition"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Открыть чат"
      >
        <FiMessageCircle size={24} />
      </motion.button>

      {/* Модальное окно чата */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Оверлей */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Окно чата */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 100, y: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 100, y: 100 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Заголовок */}
              <div className="bg-gradient-to-r from-sakeva-pink to-pink-400 text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FiMessageCircle size={20} />
                  <h3 className="font-bold text-lg">Чат SakevaNews</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 p-2 rounded-full transition"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Индикатор пользователя */}
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center space-x-2 text-sm text-gray-600">
                <FiUser size={16} />
                <span>
                  Вы: <span className="font-semibold">{user ? user.nick : 'Аноним'}</span>
                </span>
              </div>

              {/* Сообщения */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-10">
                    <p>Сообщений пока нет</p>
                    <p className="text-sm mt-1">Будьте первым!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        String(msg.userId) === user?.id && !msg.isAnonymous ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          String(msg.userId) === user?.id && !msg.isAnonymous
                            ? 'bg-sakeva-pink text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          {!msg.isAnonymous && getRoleIcon(msg.userRole)}
                          <span
                            className={`text-xs font-semibold ${
                              String(msg.userId) === user?.id && !msg.isAnonymous
                                ? 'text-pink-100'
                                : 'text-sakeva-pink'
                            }`}
                          >
                            {msg.username}
                          </span>
                          <span
                            className={`text-xs ${
                              String(msg.userId) === user?.id && !msg.isAnonymous
                                ? 'text-pink-100'
                                : 'text-gray-400'
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Поле ввода */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex items-end space-x-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Напишите сообщение..."
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-sakeva-pink focus:outline-none transition resize-none"
                    rows={2}
                    maxLength={1000}
                  />
                  <motion.button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-sakeva-pink text-white p-3 rounded-lg hover:bg-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSend size={20} />
                  </motion.button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {newMessage.length}/1000 | Enter - отправить, Shift+Enter - новая строка
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chat;
