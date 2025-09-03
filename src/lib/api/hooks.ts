import { useMutation, useQuery } from '@tanstack/react-query'
import { login, logout } from '../auth/api'
import { api } from './endpoints'

export function useLogin() {
  return useMutation({ mutationFn: login })
}

export function useLogout() {
  return useMutation({ mutationFn: logout })
}

export function useMe(enabled = true) {
  return useQuery({ queryKey: ['me'], queryFn: api.me, enabled })
}

export function useCourses(params?: Parameters<typeof api.courses>[0]) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => api.courses(params),
  })
}
