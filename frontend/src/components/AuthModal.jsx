import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './AuthModal.css'

const AuthModal = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login, signup } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!username || !password) {
      setError('Please fill in all required fields')
      return
    }

    if (!isLogin) {
      if (!email) {
        setError('Email is required')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
    }

    setLoading(true)

    try {
      let result
      if (isLogin) {
        result = await login(username, password)
      } else {
        result = await signup(username, email, password)
      }

      if (result.success) {
        onClose()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setUsername('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="auth-modal">
          <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Login to continue your storytelling journey' 
              : 'Sign up to save your stories'}
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
              </div>
            )}

            <button 
              type="submit" 
              className="auth-submit-button"
              disabled={loading}
            >
              {loading 
                ? (isLogin ? 'Logging in...' : 'Creating account...') 
                : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>

          <div className="auth-switch">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                onClick={switchMode} 
                className="switch-button"
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
