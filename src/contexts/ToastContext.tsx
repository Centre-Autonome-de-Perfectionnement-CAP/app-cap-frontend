import React, { createContext, useContext, useState, useCallback } from 'react'
import { CToaster, CToast, CToastClose } from '@coreui/react'

type ToastType = 'success' | 'danger' | 'warning' | 'info'

interface Toast {
  id: number
  title?: string
  message: string
  color: ToastType
}

interface ToastContextType {
  toast: (message: string, color?: ToastType, title?: string) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, color: ToastType = 'info', title?: string) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, color, title }])
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const success = useCallback((message: string, title = 'Succès') => toast(message, 'success', title), [toast])
  const error = useCallback((message: string, title = 'Erreur') => toast(message, 'danger', title), [toast])
  const warning = useCallback((message: string, title = 'Attention') => toast(message, 'warning', title), [toast])
  const info = useCallback((message: string, title = 'Info') => toast(message, 'info', title), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <CToaster
        placement="top-end"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none' // Don't block interactions behind the container
        }}
      >
        {toasts.map(t => {
          // Color styles based on premium and accessible design patterns
          const bgColors: Record<ToastType, string> = {
            success: '#f0fdf4',
            danger: '#fef2f2',
            warning: '#fffbeb',
            info: '#eff6ff'
          }
          const borderColors: Record<ToastType, string> = {
            success: '#16a34a',
            danger: '#dc2626',
            warning: '#d97706',
            info: '#2563eb'
          }
          const textColors: Record<ToastType, string> = {
            success: '#14532d',
            danger: '#7f1d1d',
            warning: '#78350f',
            info: '#1e3a8a'
          }

          return (
            <CToast
              key={t.id}
              visible={true}
              autohide={false}
              style={{
                background: bgColors[t.color],
                borderLeft: `5px solid ${borderColors[t.color]}`,
                color: textColors[t.color],
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                minWidth: '320px',
                padding: '12px',
                pointerEvents: 'auto', // Enable pointer events for toast clicks
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: '8px' }}>
                  {t.title && <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t.title}</div>}
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.4 }}>{t.message}</div>
                </div>
                <CToastClose
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    opacity: 0.6,
                    fontSize: '0.9rem',
                    color: textColors[t.color]
                  }}
                  onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                />
              </div>
            </CToast>
          )
        })}
      </CToaster>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
