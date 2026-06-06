import { createApiClient } from './createApiClient'

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8001'

export default createApiClient(API_URL)
