import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// Attach role header + auth token on every request
client.interceptors.request.use((config) => {
  // Role — read directly from persisted zustand store in localStorage
  try {
    const auth = JSON.parse(localStorage.getItem('auth') ?? '{}')
    const role: string = auth?.state?.role ?? 'consultation'
    config.headers['X-User-Role'] = role
    config.headers['X-User-Name'] = auth?.state?.user ?? 'guest'
  } catch {
    config.headers['X-User-Role'] = 'consultation'
  }

  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  return config
})

export default client
