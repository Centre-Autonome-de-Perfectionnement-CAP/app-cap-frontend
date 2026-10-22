// src/views/pages/rh/contrats/components/SuccessModal.tsx
// Extrait tel quel de Contrats.tsx
//
// CORRECTIF (16/08/2026) : le bouton "Transférer une copie via WhatsApp"
// (whatsapp://, repli wa.me) a été retiré - il obligeait l'admin à envoyer
// lui-même, depuis son propre numéro personnel, sans aucune trace. L'envoi
// WhatsApp (texte + PDF) est maintenant automatique côté serveur, dans
// ContratController::sendTransferEmail(), via notre module WhatsApp.
import React from 'react'
import Icon from '../Contrats.icons'

const SuccessModal: React.FC<{
  title: string; message: string; detail?: string;
  iconBg?: string; iconColor?: string; icon?: React.ReactNode;
  onClose: () => void;
}> = ({ title, message, detail, iconBg = '#f0fdf4', iconColor = '#16a34a', icon, onClose }) => {

  return (
    <div className="ctr-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ctr-modal" style={{ width: 'min(90vw, 440px)' }}>
        <div className="ctr-modal-body">
          <div className="ctr-confirm-body">
            <div className="ctr-confirm-icon" style={{ background: iconBg, color: iconColor }}>
              {icon ?? <Icon.Check />}
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#0f172a', marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: 14, color: '#374151', marginBottom: detail ? 6 : 0 }}>{message}</div>
            {detail && <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.5 }}>{detail}</div>}
          </div>
        </div>
        <div className="ctr-modal-footer" style={{ justifyContent: 'center', borderTop: '1px solid #f3f4f6', gap: 10, flexWrap: 'wrap' }}>
          <button className="ctr-btn ctr-btn-success" onClick={onClose} style={{ minWidth: 100, justifyContent: 'center' }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal
