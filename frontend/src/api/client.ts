/**
 * Base API client for FastAPI backend communication.
 * Base URL defaults to http://127.0.0.1:8000 if VITE_API_BASE_URL is not set.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('stocksense_token') : null;
  const authHeaders: Record<string, string> = {};
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders,
      ...headers,
    },
    ...rest,
  });

  if (!response.ok) {
    if (response.status === 401 && token && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stocksense:unauthorized'));
    }
    const errorBody = await response.json().catch(() => ({}));
    let message = `HTTP ${response.status}: ${response.statusText}`;

    if (typeof errorBody?.detail === 'string') {
      message = errorBody.detail;
    } else if (Array.isArray(errorBody?.detail)) {
      message = errorBody.detail
        .map((e: any) => `${e.loc ? e.loc.filter((p: any) => p !== 'body').join('.') + ': ' : ''}${e.msg}`)
        .join('; ');
    } else if (errorBody?.detail && typeof errorBody.detail === 'object') {
      if (errorBody.detail.message) {
        message = errorBody.detail.message;
        if (Array.isArray(errorBody.detail.shortages)) {
          const shortageList = errorBody.detail.shortages
            .map((s: any) => `${s.product_name || s.sku || 'Product'}: requested ${s.requested_quantity}, available ${s.available_quantity}`)
            .join('; ');
          message += ` (${shortageList})`;
        }
      } else {
        message = JSON.stringify(errorBody.detail);
      }
    } else if (errorBody?.message) {
      message = errorBody.message;
    }

    throw new Error(message);
  }

  return response.json();
}
