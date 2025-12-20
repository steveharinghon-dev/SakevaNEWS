import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiLock } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const [nick, setNick] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }

    setIsLoading(true);
    try {
      await register(nick, password);
      navigate('/');
    } catch (error) {
      // Ошибка обработана в AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sakeva-pink to-white flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.h2
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-3xl font-bold bg-gradient-to-r from-sakeva-pink to-pink-400 bg-clip-text text-transparent"
          >
            Регистрация
          </motion.h2>
          <p className="text-gray-600 mt-2">Создайте новый аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Ник</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sakeva-pink focus:outline-none transition"
                placeholder="Введите ник (3-20 символов)"
                minLength={3}
                maxLength={20}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Пароль</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sakeva-pink focus:outline-none transition"
                placeholder="Минимум 8 символов (заглавные, строчные, цифры)"
                minLength={6}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Подтвердите пароль</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sakeva-pink focus:outline-none transition"
                placeholder="Повторите пароль"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-sakeva-pink to-pink-400 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-50"
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-sakeva-pink font-semibold hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
