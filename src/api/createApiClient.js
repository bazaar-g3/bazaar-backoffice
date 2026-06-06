import axios from 'axios'

/**
 * Crea una instancia de axios con los interceptores de autenticación compartidos.
 *
 * - Request: adjunta el token JWT del localStorage al header `Authorization`.
 * - Response: ante un 401 de una ruta no-auth, elimina el token y redirige a `/login`.
 *
 * @param {string} baseURL - URL base del microservicio.
 * @returns {import('axios').AxiosInstance}
 */
export function createApiClient(baseURL) {
  const instance = axios.create({ baseURL })

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const isAuthEndpoint = error.config?.url?.includes('/auth/')
      if (error.response?.status === 401 && !isAuthEndpoint) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )

  return instance
}
