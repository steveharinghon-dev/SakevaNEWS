import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiPlusCircle, FiSettings, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-8 h-8"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  fill="#FF6B9D"
                  stroke="#FF6B9D"
                  strokeWidth="2"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="#FF6B9D"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="#FF6B9D"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-sakeva-pink to-pink-400 bg-clip-text text-transparent">
              SakevaNews
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-1 text-gray-700 hover:text-sakeva-pink transition"
              >
                <FiHome />
                <span>Главная</span>
              </motion.button>
            </Link>

            {isAuthenticated && (
              <>
                <Link to="/create-news">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-1 text-gray-700 hover:text-sakeva-pink transition"
                  >
                    <FiPlusCircle />
                    <span>Создать</span>
                  </motion.button>
                </Link>

                {(user?.role === 'admin' || user?.role === 'owner') && (
                  <Link to="/admin">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-1 text-gray-700 hover:text-sakeva-pink transition"
                    >
                      <FiSettings />
                      <span>Админ</span>
                    </motion.button>
                  </Link>
                )}

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <FiUser className="text-sakeva-pink" />
                    <span className="font-semibold">{user?.nick}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition"
                  >
                    <FiLogOut />
                    <span>Выйти</span>
                  </motion.button>
                </div>
              </>
            )}

            {!isAuthenticated && (
              <div className="flex space-x-2">
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-sakeva-pink border border-sakeva-pink rounded-lg hover:bg-sakeva-pink hover:text-white transition"
                  >
                    Вход
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-sakeva-pink text-white rounded-lg hover:bg-pink-600 transition"
                  >
                    Регистрация
                  </motion.button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
