import { createApiClient } from './createApiClient'

const CATALOG_URL = import.meta.env.VITE_CATALOG_API_URL || 'http://localhost:8002'

export default createApiClient(CATALOG_URL)
