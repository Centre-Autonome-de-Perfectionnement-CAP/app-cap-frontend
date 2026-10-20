// src/views/pages/stages/StagesUi.tsx
// Petits éléments communs aux pages du module Stages (thème clair).
import React, { useState } from 'react'
import { CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilInbox, cilSpreadsheet } from '@coreui/icons'
import stageService from '@/services/stage.service'
import { showError, friendlyError } from '@/components/common/ActionResult'

export const PageHead = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) => (
  <div className="stg-head">
    <div>
      <h4 style={{ margin: 0, fontWeight: 800 }}>{title}</h4>
      {subtitle && <span style={{ color: '#64748b', fontSize: '.88rem' }}>{subtitle}</span>}
    </div>
    {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
  </div>
)

export const Empty = ({ text }: { text: string }) => (
  <div style={{ padding: '36px 12px', textAlign: 'center', color: '#64748b' }}>
    <CIcon icon={cilInbox} style={{ width: 32, color: '#cbd5e1' }} />
    <div style={{ marginTop: 8 }}>{text}</div>
  </div>
)

export const Pill = ({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) => (
  <span className="stg-pill" style={{ color, background: bg }}>{children}</span>
)

/** Bouton d'export Excel (fichier reçu en JSON, enregistré par le navigateur). */
export const ExportButton = ({ path, label = 'Exporter (Excel)', size = 'sm' }: { path: string; label?: string; size?: 'sm' | 'lg' }) => {
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try { await stageService.exportFile(path) } catch (e) { await showError('Export impossible', friendlyError(e)) } finally { setBusy(false) }
  }
  return (
    <CButton color="success" variant="outline" size={size} onClick={run} disabled={busy} title="Télécharger au format Excel">
      {busy ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilSpreadsheet} className="me-1" />}{label}
    </CButton>
  )
}

export const StagesStyles = () => (
  <style>{`
    .stg-page { display: flex; flex-direction: column; gap: 14px; }
    .stg-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
    .stg-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
    .stg-pill { display: inline-flex; align-items: center; gap: 4px; font-size: .875rem; font-weight: 800; padding: 2px 9px; border-radius: 999px; white-space: nowrap; }
    .stg-chip { display: inline-flex; align-items: center; gap: 4px; font-size: .875rem; font-weight: 600; padding: 2px 8px; border-radius: 8px; background: #f1f5f9; color: #334155; }
    .stg-err { background: #fff1f2; border: 1px solid #fecdd3; color: #9f1239; border-radius: 10px; padding: 10px 14px; margin-bottom: 10px; }
    .stg-list { display: flex; flex-direction: column; gap: 8px; }
    .stg-card { background: #fff; border: 1px solid #e6ebf2; border-radius: 12px; padding: 12px 14px; }
    .stg-row2 { display: flex; align-items: center; gap: 12px; }
    .stg-muted { color: #64748b; font-size: .875rem; font-weight: 500; }
    .stg-bar-sel { position: sticky; bottom: 12px; z-index: 5; display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
      background: #0f766e; color: #fff; border-radius: 12px; padding: 10px 14px; box-shadow: 0 10px 24px rgba(15,118,110,.25); }
    .stg-bar-sel .btn { --cui-btn-color: #0f766e; }
    @media (max-width: 640px) { .stg-row2 { flex-wrap: wrap; } }
  `}</style>
)
