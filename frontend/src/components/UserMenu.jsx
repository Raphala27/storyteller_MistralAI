import { useAuth } from '../contexts/AuthContext'
import './UserMenu.css'

const UserMenu = ({ onOpenAuth }) => {
  const { user, logout, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="user-menu">
        <button onClick={onOpenAuth} className="login-button">
          🔐 Login / Sign Up
        </button>
      </div>
    )
  }

  return (
    <div className="user-menu">
      <div className="user-info">
        <div className="user-avatar">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="user-details">
          <span className="user-name">{user.username}</span>
          <span className="user-email">{user.email}</span>
        </div>
      </div>
      <button onClick={logout} className="logout-button">
        🚪 Logout
      </button>
    </div>
  )
}

export default UserMenu
