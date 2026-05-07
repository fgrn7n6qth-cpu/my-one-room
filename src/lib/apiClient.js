export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function apiRequest(path, options = {}) {
  const {
    allowedStatusCodes = [],
    headers,
    ...restOptions
  } = options

  const response = await fetch(`${API_BASE}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
  })

  if (allowedStatusCodes.includes(response.status)) {
    return { ok: false, status: response.status, data: null }
  }

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message ?? '요청을 처리하는 중 문제가 발생했습니다.')
  }

  return data
}

export function createAuthorizedRequest(token) {
  return (path, options = {}) => apiRequest(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  })
}
