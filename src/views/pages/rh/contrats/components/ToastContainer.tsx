// src/views/pages/rh/contrats/components/ToastContainer.tsx
// Extrait tel quel de Contrats.tsx
import React from 'react'
import Icon from '../Contrats.icons'
import type { Toast, ToastType } from '../Contrats.types'

const TOAST_ICONS: Record<ToastType, { bg: string; color: string; icon: React.ReactNode }> = {
  success: { bg: '#f0fdf4', color: '#16a34a', icon: <Icon.Check /> },
  error:   { bg: '#fef2f2', color: '#dc2626', icon: <Icon.X /> },
  warning: { bg: '#fffbeb', color: '#d97706', icon: <Icon.AlertTriangle /> },
  info:    { bg: '#eff6ff', color: '#2563eb', icon: <Icon.Info /> },
};

const ToastContainer: React.FC<{ toasts: Toast[]; remove: (id: number) => void }> = ({ toasts, remove }) => (
  <div className="ctr-toasts">
    {toasts.map(t => {
      const cfg = TOAST_ICONS[t.type];
      return (
        <div key={t.id} className="ctr-toast">
          <div className="ctr-toast-icon" style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon}</div>
          <div className="ctr-toast-content">
            <div className="ctr-toast-title">{t.title}</div>
            {t.message && <div className="ctr-toast-msg">{t.message}</div>}
          </div>
          <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0', lineHeight: 1 }}>
            <Icon.X />
          </button>
        </div>
      );
    })}
  </div>
);


export default ToastContainer
