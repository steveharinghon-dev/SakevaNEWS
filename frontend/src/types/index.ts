export interface User {
  id: string;
  nick: string;
  role: 'user' | 'admin' | 'owner';
  isBlocked?: boolean;
}

export interface News {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    nick: string;
  };
  approvedBy?: {
    id: string;
    nick: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  imageUrl?: string;
  isHidden?: boolean;
  createdAt: string;
  approvedAt?: string;
}

export interface NewsLog {
  id: string;
  action: 'created' | 'approved' | 'rejected' | 'deleted' | 'hidden' | 'shown';
  user: {
    id: string;
    nick: string;
  };
  news: {
    id: string;
    title: string;
    author: {
      id: string;
      nick: string;
    };
  };
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface NewsResponse {
  news: News[];
  total: number;
  pages: number;
  currentPage: number;
}

export interface Stats {
  totalUsers: number;
  totalNews: number;
  pendingNews: number;
}

export interface Comment {
  id: number;
  newsId: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
  user?: {
    id: number;
    nick: string;
    role: 'user' | 'admin' | 'owner';
  };
}
