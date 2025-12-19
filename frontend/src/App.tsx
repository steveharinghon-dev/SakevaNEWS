import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import AnimatedBackground from './components/AnimatedBackground';
import Chat from './components/Chat';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateNewsPage from './pages/CreateNewsPage';
import AdminPage from './pages/AdminPage';
import api from './lib/api';

// Компонент для отслеживания посещений
const PageViewTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Отправляем статистику посещения
    api.post('/analytics/track', { path: location.pathname }).catch(() => {
      // Игнорируем ошибки трекинга
    });
  }, [location.pathname]);

  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PageViewTracker />
          <AnimatedBackground />
          <div className="min-h-screen relative z-10">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/create-news"
                element={
                  <ProtectedRoute>
                    <CreateNewsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
          <Chat />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#333',
                borderRadius: '10px',
                padding: '16px',
              },
              success: {
                iconTheme: {
                  primary: '#FF6B9D',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
