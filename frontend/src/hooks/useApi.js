import { useState, useCallback } from 'react'

// Generic async API call hook with loading/error state management
export const useApi = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (apiCall) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiCall()
      setLoading(false)
      return response.data
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error'
      setError(errorMsg)
      setLoading(false)
      throw err
    }
  }, [])

  return { execute, loading, error, setError, setLoading }
}
