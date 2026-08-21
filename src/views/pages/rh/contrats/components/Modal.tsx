// src/views/pages/rh/contrats/components/Modal.tsx
// Extrait tel quel de Contrats.tsx — modale générique réutilisée par tous les sous-modules.
import React from 'react'
import Icon from '../Contrats.icons'

const Modal: React.FC<{
  title: string; subtitle?: string; onClose: () => void; wide?: boolean;
  footer?: React.ReactNode; children: React.ReactNode;
}> = ({ title, subtitle, onClose, wide, footer, children }) => (
  <div className="ctr-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="ctr-modal" style={{ width: wide ? 'min(90vw, 820px)' : 'min(90vw, 560px)' }}>
      <div className="ctr-modal-header">
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#0f172a' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{subtitle}</div>}
        </div>
        <button className="ctr-modal-close" onClick={onClose}><Icon.X /></button>
      </div>
      <div className="ctr-modal-body">{children}</div>
      {footer && <div className="ctr-modal-footer">{footer}</div>}
    </div>
  </div>
);

export default Modal
