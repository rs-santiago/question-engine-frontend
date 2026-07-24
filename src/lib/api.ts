import Cookies from 'js-cookie';

const API_BASE_URL = 'http://localhost:3000/api/v1';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = Cookies.get('token');
  const tenantId = Cookies.get('tenantId') || '679d55f1-61f0-4bbc-97ea-3ffe4e76ed62'; // Fallback local de dev

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Se o token expirar ou for inválido, limpa a sessão
    Cookies.remove('token');
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  return response;
}