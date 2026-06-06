import { createApiClient } from './createApiClient'

const ORDERS_URL = import.meta.env.VITE_ORDERS_API_URL || 'http://localhost:8003'

export default createApiClient(ORDERS_URL)
