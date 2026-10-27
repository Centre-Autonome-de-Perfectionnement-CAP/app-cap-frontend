// src/views/pages/stages/StagesUi.tsx
// Petits éléments communs aux pages du module Stages (thème clair).
import React, { useCallback, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilInbox, cilSpreadsheet, cilChevronRight } from '@coreui/icons'
import stageService, { type AttentionCode } from '@/services/stage.service'
import { showError, friendlyError } from '@/components/common/ActionResult'
import { ATTENTION } from './stageUtils'

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

/** Fil d'Ariane : on sait toujours où l'on est et comment revenir. */
export const Breadcrumb = ({ items }: { items: { label: string; to?: string }[] }) => (
  <nav aria-label="Fil d'Ariane" className="stg-crumbs">
    {items.map((it, i) => (
      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {i > 0 && <CIcon icon={cilChevronRight} style={{ width: 11, color: '#94a3b8' }} />}
        {it.to ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
      </span>
    ))}
  </nav>
)

/** Filtres d'une liste, avec le nombre d'éléments de chacun. */
export const FilterTabs = <K extends string>({ options, value, onChange }: {
  options: { key: K; label: string; count?: number }[]
  value: K
  onChange: (k: K) => void
}) => (
  <div className="stg-tabs" role="tablist">
    {options.map(o => (
      <button key={o.key} type="button" role="tab" aria-selected={value === o.key}
        className={value === o.key ? 'on' : undefined} onClick={() => onChange(o.key)}>
        {o.label}{o.count !== undefined && <span className="n">{o.count}</span>}
      </button>
    ))}
  </div>
)

/** Codes d'attention d'un stagiaire (détail au survol). */
export const CodeBadges = ({ codes }: { codes: AttentionCode[] }) => (
  <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
    {codes.map(c => {
      const a = ATTENTION[c.code]
      return <span key={c.code} className="stg-code" style={{ color: a.color, background: a.bg }} title={`${a.label} : ${c.detail}`}>{a.short}</span>
    })}
  </span>
)

export const CodesLegend = () => (
  <div className="stg-legend">
    {Object.values(ATTENTION).map(a => (
      <span key={a.short}><span className="stg-code" style={{ color: a.color, background: a.bg }}>{a.short}</span>{a.label}</span>
    ))}
  </div>
)

/**
 * Ouvre le dossier d'un stagiaire (ou d'une demande) dans sa page ; le
 * dossier sait revenir à la liste d'origine, filtre compris.
 */
export const useOpenDossier = (fromLabel: string) => {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  return useCallback((ref: string) => navigate(`/stages/dossier/${encodeURIComponent(ref)}`, {
    state: { from: pathname + search, fromLabel },
  }), [navigate, pathname, search, fromLabel])
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
    .stg-warn { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; background: #fffbeb; border: 1px solid #fcd34d; color: #78350f; border-radius: 12px; padding: 12px 14px; font-size: .9rem; }
    .stg-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: .875rem; color: #64748b; font-weight: 600; }
    .stg-crumbs a { color: #0f766e; text-decoration: none; }
    .stg-crumbs a:hover { text-decoration: underline; }
    .stg-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
    .stg-tabs button { display: inline-flex; align-items: center; gap: 8px; border: 1px solid #dbe3ec; background: #fff; color: #334155;
      border-radius: 999px; padding: 6px 14px; font-size: .875rem; font-weight: 700; cursor: pointer; }
    .stg-tabs button:hover { border-color: #0f766e; color: #0f766e; }
    .stg-tabs button.on { background: #0f766e; border-color: #0f766e; color: #fff; }
    .stg-tabs .n { min-width: 22px; padding: 0 7px; border-radius: 999px; background: #f1f5f9; color: #0f172a; font-size: .875rem; text-align: center; }
    .stg-tabs button.on .n { background: rgba(255,255,255,.22); color: #fff; }
    .stg-code { display: inline-flex; align-items: center; justify-content: center; min-width: 30px; padding: 1px 6px; border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .875rem; font-weight: 800; letter-spacing: .03em; cursor: help; }
    .stg-legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: .875rem; color: #475569; }
    .stg-legend > span { display: inline-flex; align-items: center; gap: 6px; }
    .stg-ref { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 800; color: #0f766e; font-size: .875rem; white-space: nowrap; }
    .stg-row { position: relative; display: flex; align-items: center; gap: 14px; width: 100%; text-align: left;
      border: 1px solid #e6ebf2; background: #fff; border-radius: 12px; padding: 12px 14px 12px 18px; overflow: hidden;
      transition: box-shadow .15s ease, border-color .15s ease; cursor: pointer; }
    .stg-row:hover { border-color: #cbd5e1; box-shadow: 0 8px 20px rgba(15,23,42,.07); }
    .stg-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
    .stg-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
    .stg-line { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .stg-name { color: #0f172a; font-size: .95rem; }
    .stg-sub { color: #64748b; font-size: .875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .stg-side { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; font-size: .875rem; font-weight: 600; color: #334155; flex-shrink: 0; }
    @media (max-width: 640px) { .stg-row { flex-direction: column; align-items: stretch; gap: 6px; } .stg-side { align-items: flex-start; } }
    .stg-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
    .stg-table th { text-align: left; font-size: .875rem; font-weight: 700; color: #64748b; background: #f8fafc; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
    .stg-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; color: #334155; }
    .stg-table tbody tr:hover { background: #f8fafc; }
  `}</style>
)
