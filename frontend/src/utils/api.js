import axios from 'axios'

// Create axios instance with base URL from env or fallback
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 120000 // 120 second timeout per spec
})

// Deal API methods
export const dealApi = {
  // Generate new deal from config
  generate: (config) => api.post('/api/generate', config),

  // Get all deals
  listDeals: () => api.get('/api/deals'),

  // Get single deal by ID
  getDeal: (id) => api.get(`/api/deals/${id}`),

  // Delete deal by ID
  deleteDeal: (id) => api.delete(`/api/deals/${id}`)
}

export default api
