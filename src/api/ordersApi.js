import axios from 'axios'

const ORDERS_URL = import.meta.env.VITE_ORDERS_API_URL || 'http://localhost:8003'

const ordersApi = axios.create({
  baseURL: ORDERS_URL,
})

/**
 * Interceptor de solicitudes: adjunta el token JWT del almacenamiento local
 * al encabezado Authorization de cada petición saliente al microservicio de órdenes.
 *
 * @param {import('axios').InternalAxiosRequestConfig} config - Configuración de la solicitud axios.
 * @returns {import('axios').InternalAxiosRequestConfig} Configuración modificada con el encabezado Authorization si existe token.
 */
ordersApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Interceptor de respuestas: maneja errores globales de autenticación.
 * Si el microservicio de órdenes devuelve un error 401 (no autorizado), elimina el token
 * del almacenamiento local y redirige al usuario a la página de login.
 *
 * @param {import('axios').AxiosResponse} response - Respuesta exitosa de axios.
 * @param {import('axios').AxiosError} error - Error de axios con información de la respuesta fallida.
 * @returns {Promise<import('axios').AxiosResponse>} La respuesta original si es exitosa, o una promesa rechazada con el error.
 */
ordersApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default ordersApi
