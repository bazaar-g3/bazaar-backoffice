import axios from 'axios'

// TODO: reemplazar con la URL del AWS API Gateway en producción
const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8001'

const api = axios.create({
  baseURL: API_URL,
})

/**
 * Interceptor de solicitudes: adjunta el token JWT del almacenamiento local
 * al encabezado Authorization de cada petición saliente.
 *
 * @param {import('axios').InternalAxiosRequestConfig} config - Configuración de la solicitud axios.
 * @returns {import('axios').InternalAxiosRequestConfig} Configuración modificada con el encabezado Authorization si existe token.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Interceptor de respuestas: maneja errores globales de autenticación.
 * Si el servidor devuelve un error 401 (no autorizado), elimina el token
 * del almacenamiento local y redirige al usuario a la página de login.
 *
 * @param {import('axios').AxiosResponse} response - Respuesta exitosa de axios.
 * @param {import('axios').AxiosError} error - Error de axios con información de la respuesta fallida.
 * @returns {Promise<import('axios').AxiosResponse>} La respuesta original si es exitosa, o una promesa rechazada con el error.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo redirigir al login si el 401 viene de una ruta protegida (no del login en sí).
    // Si viene de /auth/login, el componente maneja el error localmente.
    const isAuthEndpoint = error.config?.url?.includes('/auth/')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
