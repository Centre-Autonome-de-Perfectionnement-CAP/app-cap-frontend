// src/views/pages/demandes/components/ui/StatusNote.tsx
//
// Note d'état sobre, en tête de la fiche d'un dossier : une phrase qui dit
// où en est le dossier et quoi faire. Remplace les bannières « navette » et
// « correction » trop chargées (couleurs vives, symboles, badges).

import CIcon from '@coreui/icons-react'
import { cilInfo, cilClock, cilCheckCircle } from '@coreui/icons'

export type StatusNoteTone = 'info' | 'waiting' | 'done'

const TONES: Record<StatusNoteTone, { bg: string; border: string; icon: any; iconColor: string; title: string; text: string }> = {
  info:    { bg: '#f8fafc', border: '#e2e8f0', icon: cilInfo,        iconColor: '#2563eb', title: '#0f172a', text: '#475569' },
  waiting: { bg: '#fffbeb', border: '#fde68a', icon: cilClock,       iconColor: '#b45309', title: '#78350f', text: '#92400e' },
  done:    { bg: '#f0fdf4', border: '#bbf7d0', icon: cilCheckCircle, iconColor: '#15803d', title: '#14532d', text: '#166534' },
}

interface Props {
  tone?: StatusNoteTone
  title: string
  children?: React.ReactNode
}

const StatusNote = ({ tone = 'info', title, children }: Props) => {
  const t = TONES[tone]
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      background: t.bg, border: `1px solid ${t.border}`,
      borderRadius: 10, padding: '12px 16px', marginBottom: 18,
    }}>
      <CIcon icon={t.icon} style={{ width: 18, height: 18, color: t.iconColor, flexShrink: 0, marginTop: 2 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: t.title }}>{title}</div>
        {children && (
          <div style={{ fontSize: '0.875rem', color: t.text, lineHeight: 1.55, marginTop: 2 }}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatusNote

// ─── Rappel du point signalé (dans les fenêtres d'action uniquement) ─────────

export const ReportedIssue = ({ from, reason }: { from?: string | null; reason?: string | null }) => {
  if (!reason) return null
  return (
    <div style={{
      background: '#f8fafc', border: '1px solid #e2e8f0',
      borderRadius: 10, padding: '12px 14px', marginBottom: 16,
    }}>
      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
        {from ? `Point signalé par ${from}` : 'Point signalé'}
      </div>
      <div style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.55, whiteSpace: 'pre-line' }}>
        {reason}
      </div>
    </div>
  )
}

// ─── Note commune aux acteurs : dossier reçu en navette ──────────────────────

export const ActorCorrectionNote = () => (
  <StatusNote title="Dossier envoyé par la Secrétaire pour vérification">
    Vérifiez le dossier, puis cliquez sur <strong>Renvoyer à la Secrétaire</strong> en
    indiquant en quelques mots ce que vous avez fait.
  </StatusNote>
)

// ─── Bandeau de liste : dossiers reçus en navette ────────────────────────────

export const CorrectionListNote = ({ count }: { count: number }) => {
  if (count <= 0) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
      padding: '10px 20px', fontSize: '0.88rem', color: '#334155',
    }}>
      <CIcon icon={cilInfo} style={{ width: 16, color: '#2563eb', flexShrink: 0 }} />
      <span>
        <strong>{count} dossier{count > 1 ? 's' : ''}</strong> renvoyé{count > 1 ? 's' : ''} par la Secrétaire pour vérification.
      </span>
    </div>
  )
}
