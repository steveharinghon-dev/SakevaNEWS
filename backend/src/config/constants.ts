/**
 * Константы приложения
 * Все магические числа и строки вынесены сюда для удобства поддержки
 */

export const APP_CONSTANTS = {
  CHAT: {
    MAX_MESSAGE_LENGTH: 1000,
    MAX_HISTORY_LIMIT: 50,
    DEFAULT_HISTORY_LIMIT: 20,
    CACHE_TTL_MS: 60_000, // 1 минута
    RATE_LIMIT_MESSAGES: 5, // сообщений
    RATE_LIMIT_WINDOW_MS: 60_000, // за минуту
  },
  
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 минут
    MAX_REQUESTS: 100,
    AUTH_WINDOW_MS: 15 * 60 * 1000,
    AUTH_MAX_ATTEMPTS: 5,
  },
  
  NEWS: {
    MIN_TITLE_LENGTH: 5,
    MAX_TITLE_LENGTH: 200,
    MIN_CONTENT_LENGTH: 10,
    MAX_CONTENT_LENGTH: 5000,
    MAX_IMAGE_URL_LENGTH: 500,
  },
  
  AUTH: {
    MIN_NICK_LENGTH: 3,
    MAX_NICK_LENGTH: 20,
    MIN_PASSWORD_LENGTH: 8, // Увеличено с 6 до 8
    JWT_EXPIRES_IN: '7d',
    BCRYPT_ROUNDS: 12, // Увеличено с 10 до 12 для безопасности
    JWT_MIN_SECRET_LENGTH: 32, // Минимальная длина секрета
  },
  
  DB: {
    POOL_MAX: 20,
    POOL_MIN: 5,
    POOL_ACQUIRE_MS: 10_000,
    POOL_IDLE_MS: 30_000,
  },
  
  SOCKET_IO: {
    MAX_CONNECTIONS_PER_IP: 10,
    CONNECTION_CLEANUP_INTERVAL_MS: 60_000,
  },
} as const;
