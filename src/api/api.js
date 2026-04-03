import axios from 'axios'

// TODO: reemplazar con la URL del AWS API Gateway en producción
const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8001'

const api = axios.create({
  baseURL: API_URL,
})

// Interceptor: agrega el JWT en cada request automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor: si el token expiró redirige al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
