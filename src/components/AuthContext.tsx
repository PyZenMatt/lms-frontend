/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

declare global {
  interface EthereumProvider {
    request?: (args: { method: string; params?: unknown }) => Promise<unknown>
  }

  interface Window {
    ethereum?: EthereumProvider | undefined
  }
}
interface User {
  id: string
  name: string
  email: string
  role: 'student' | 'teacher'
  walletAddress?: string
  tokens: number
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  signup: (
    name: string,
    email: string,
    password: string,
    role: 'student' | 'teacher',
  ) => Promise<boolean>
  connectWallet: () => Promise<boolean>
  updateTokens: (amount: number) => void
  isAuthenticated: boolean
  isTeacher: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users for demo
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Maya Chen',
    email: 'maya@example.com',
    role: 'student',
    tokens: 247,
    avatar:
      'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face',
  },
  {
    id: '2',
    name: 'Prof. Sarah Mitchell',
    email: 'sarah@example.com',
    role: 'teacher',
    tokens: 1250,
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
  },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('artlearn_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async (email: string, _password: string): Promise<boolean> => {
    void _password
    // Mock authentication - in real app, this would call your API
    const foundUser = mockUsers.find((u) => u.email === email)
    if (foundUser) {
      setUser(foundUser)
      localStorage.setItem('artlearn_user', JSON.stringify(foundUser))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('artlearn_user')
  }

  const signup = async (
    name: string,
    email: string,
    _password: string,
    role: 'student' | 'teacher',
  ): Promise<boolean> => {
    void _password
    // Mock signup - in real app, this would call your API
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role,
      tokens: role === 'teacher' ? 500 : 50, // Teachers start with more tokens
    }

    setUser(newUser)
    localStorage.setItem('artlearn_user', JSON.stringify(newUser))
    return true
  }

  const connectWallet = async (): Promise<boolean> => {
    if (
      typeof window.ethereum !== 'undefined' &&
      typeof window.ethereum.request === 'function'
    ) {
      try {
        const res = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })
        const accounts = Array.isArray(res) ? (res as string[]) : undefined
        if (accounts && accounts.length > 0 && user) {
          const updatedUser = { ...user, walletAddress: accounts[0] }
          setUser(updatedUser)
          localStorage.setItem('artlearn_user', JSON.stringify(updatedUser))
          return true
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error)
      }
    }
    return false
  }

  const updateTokens = (amount: number) => {
    if (user) {
      const updatedUser = { ...user, tokens: user.tokens + amount }
      setUser(updatedUser)
      localStorage.setItem('artlearn_user', JSON.stringify(updatedUser))
    }
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    signup,
    connectWallet,
    updateTokens,
    isAuthenticated: !!user,
    isTeacher: user?.role === 'teacher',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
