import React from 'react'
import './ErrorPopup.css'

const ErrorPopup = ({ message, onClose, type = 'error' }) => {
  if (!message) return null

  return (
    <div className="error-popup-overlay" onClick={onClose}>
      <div className={`error-popup ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="error-popup-header">
          <span className="error-popup-icon">
            {type === 'error' ? '⚠️' : type === 'warning' ? '⚡' : 'ℹ️'}
          </span>
          <span className="error-popup-title">
            {type === 'error' ? 'ERROR' : type === 'warning' ? 'WARNING' : 'INFO'}
          </span>
        </div>
        <div className="error-popup-message">{message}</div>
        <button className="error-popup-close" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  )
}

export default ErrorPopup
