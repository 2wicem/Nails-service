const configured = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '')

export const API_BASE = configured

export const apiUrl = (path) => {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${suffix}`
}

const readCsrfToken = () => {
  if (typeof document === 'undefined') {
    return ''
  }

  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export const ensureCsrfCookie = async () => {
  await fetch(apiUrl('/products/auth/csrf/'), {
    method: 'GET',
    credentials: 'include',
  })
}

export const apiFetch = (path, options = {}) => {
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers || {})

  if (
    options.body &&
    typeof options.body === 'string' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }

  if (!['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
    const csrfToken = readCsrfToken()
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken)
    }
  }

  return fetch(apiUrl(path), {
    ...options,
    method,
    headers,
    credentials: 'include',
  })
}
