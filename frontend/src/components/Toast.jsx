const ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
}

const TITLES = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
}

const Toast = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">{ICONS[t.type]}</span>
          <div className="toast-body">
            <div className="toast-title">{TITLES[t.type]}</div>
            <div className="toast-message">{t.message}</div>
          </div>
          <button className="toast-close" onClick={() => removeToast(t.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}

export default Toast
