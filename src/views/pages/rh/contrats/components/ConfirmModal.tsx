// src/views/pages/rh/contrats/components/ConfirmModal.tsx
// Extrait tel quel de Contrats.tsx
import React from 'react'
import Icon from '../Contrats.icons'

const ConfirmModal: React.FC<{
  title: string; message: string; detail?: string;
  confirmLabel: string; confirmClass: string;
  loading: boolean; onConfirm: () => void; onCancel: () => void;
  iconBg?: string; iconColor?: string; icon?: React.ReactNode;
}> = ({ title, message, detail, confirmLabel, confirmClass, loading, onConfirm, onCancel, iconBg = '#fef2f2', iconColor = '#dc2626', icon }) => (
  <div className="ctr-modal-backdrop" onClick={e => e.target === e.currentTarget && onCancel()}>
    <div className="ctr-modal" style={{ width: 'min(90vw, 440px)' }}>
      <div className="ctr-modal-body">
        <div className="ctr-confirm-body">
          <div className="ctr-confirm-icon" style={{ background: iconBg, color: iconColor }}>
            {icon ?? <Icon.AlertTriangle />}
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>{message}</div>
          {detail && <div style={{ fontSize: 12.5, color: '#6b7280' }}>{detail}</div>}
        </div>
      </div>
      <div className="ctr-modal-footer">
        <button className="ctr-btn ctr-btn-ghost" onClick={onCancel} disabled={loading}>Annuler</button>
        <button className={`ctr-btn ${confirmClass}`} onClick={onConfirm} disabled={loading}>
          {loading ? <><Icon.Loader /> Traitement…</> : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal
