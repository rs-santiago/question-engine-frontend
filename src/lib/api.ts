import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = Cookies.get('token');
  const tenantId = Cookies.get('tenantId') || '679d55f1-61f0-4bbc-97ea-3ffe4e76ed62';

  // Verifica se o corpo da requisição é um FormData (upload de arquivos)
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    'x-tenant-id': tenantId,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // SÓ adiciona Content-Type: application/json se NÃO for FormData
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Se for FormData, remove explicitamente o Content-Type para o browser gerar o boundary
  if (isFormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}