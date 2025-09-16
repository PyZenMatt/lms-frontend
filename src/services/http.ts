import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'

// Single shared axios instance for the frontend
const http: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helper to get auth token. Adjust if your app uses a different storage.
function getAuthToken(): string | null {
  try {
    return localStorage.getItem('access_token')
  } catch {
    return null
  }
}

// Request interceptor to add Authorization header
http.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = getAuthToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Simple retry interceptor: retries on network errors and 5xx responses
http.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as AxiosRequestConfig & { __retryCount?: number }
  if (!config) return Promise.reject(error)

  config.__retryCount = config.__retryCount || 0
  const maxRetries = 2

  const shouldRetry = () => {
    if (error.code === 'ECONNABORTED') return true
    if (!error.response) return true // network error
    const status = error.response.status
    return status >= 500 && status < 600
  }

  if (config.__retryCount >= maxRetries || !shouldRetry()) {
    return Promise.reject(error)
  }

  config.__retryCount += 1
  const backoffMs = 100 * Math.pow(2, config.__retryCount - 1)
  await new Promise((res) => setTimeout(res, backoffMs))
  return http(config)
})

export default http
