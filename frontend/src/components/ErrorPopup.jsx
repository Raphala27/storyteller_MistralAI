import React from 'react'
import './ErrorPopup.css'

const ErrorPopup = ({ message, onClose, onConfirm, type = 'error' }) => {
  if (!message) return null

  const isConfirmation = !!onConfirm

  return (
    <div className="error-popup-overlay" onClick={!isConfirmation ? onClose : undefined}>
      <div className={`error-popup ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="error-popup-header">
          <span className="error-popup-icon">
            {type === 'error' ? '⚠️' : type === 'warning' ? '⚡' : type === 'confirm' ? '❓' : 'ℹ️'}
          </span>
          <span className="error-popup-title">
            {type === 'error' ? 'ERROR' : type === 'warning' ? 'WARNING' : type === 'confirm' ? 'CONFIRM' : 'INFO'}
          </span>
        </div>
        <div className="error-popup-message">{message}</div>
        {isConfirmation ? (
          <div className="error-popup-buttons">
            <button className="error-popup-cancel" onClick={onClose}>
              CANCEL
            </button>
            <button className="error-popup-confirm" onClick={onConfirm}>
              YES, DELETE
            </button>
          </div>
        ) : (
          <button className="error-popup-close" onClick={onClose}>
            OK
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorPopup
