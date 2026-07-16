export type ApiResult<T> = {
  code: number;
  msg: string;
  data: T;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getApiBaseUrl() {
  if (!API_BASE_URL && process.env.NODE_ENV === 'production') {
    throw new Error('生产环境缺少 NEXT_PUBLIC_API_BASE_URL');
  }
  return API_BASE_URL || 'http://localhost:5000';
}

export async function requestApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: 'no-store',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  let result: ApiResult<T>;
  try {
    result = (await response.json()) as ApiResult<T>;
  } catch {
    throw new Error('服务响应格式错误');
  }

  if (!response.ok || result.code !== 0) {
    throw new Error(result.msg || '请求失败');
  }

  return result.data;
}
