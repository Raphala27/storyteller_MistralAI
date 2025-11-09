import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // Configure axios to include token in all requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      loadUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const loadUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/me`)
      setUser(response.data)
    } catch (error) {
      console.error('Error loading user:', error)
      // Token might be invalid, clear it
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        username,
        password
      })
      const { access_token } = response.data
      
      localStorage.setItem('token', access_token)
      setToken(access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      // Load user info
      await loadUser()
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed. Please try again.' 
      }
    }
  }

  const signup = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/signup`, {
        username,
        email,
        password
      })
      const { access_token } = response.data
      
      localStorage.setItem('token', access_token)
      setToken(access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      // Load user info
      await loadUser()
      
      return { success: true }
    } catch (error) {
      console.error('Signup error:', error)
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Signup failed. Please try again.' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
