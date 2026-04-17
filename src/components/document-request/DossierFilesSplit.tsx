// src/components/document-request/DossierFilesSplit.tsx
// Affiche les pièces initiales et complémentaires de façon distincte.
// La section "complémentaires" n'apparaît que lorsqu'il y en a.

import { useState } from 'react'
import { CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilFile, cilPlus } from '@coreui/icons'

// ─── Libellés ─────────────────────────────────────────────────────────────────

const FILE_LABELS: Record<string, string> = {
  demande_manuscrite:       'Demande manuscrite',
  acte_naissance:           'Acte de naissance',
  attestation_succes_file:  "Attestation de succès",
  quittance:                'Quittance',
  recu_paiement:            'Reçu de paiement',
  bulletin:                 'Bulletin de notes',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseFiles(raw: Record<string, string> | null | string): Record<string, string> {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return {} }
  }
  return raw
}

const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8001').replace('/api', '')

// ─── FileChip ─────────────────────────────────────────────────────────────────

const FileChip = ({ label, path }: { label: string; path: string }) => (
  <CButton
    color="light"
    size="sm"
    href={`${apiBase}/storage/${path}`}
    target="_blank"
    rel="noopener noreferrer"
    className="d-flex align-items-center gap-1"
    style={{ fontSize: '0.78rem' }}
  >
    <CIcon icon={cilFile} size="sm" />
    {label}
    <CIcon icon={cilCloudDownload} size="sm" className="ms-1 text-muted" />
  </CButton>
)

// ─── FileGrid — liste de fichiers ─────────────────────────────────────────────

const FileGrid = ({ files }: { files: Record<string, string> }) => {
  const entries = Object.entries(files)
  if (entries.length === 0) {
    return <p className="text-muted small mb-0">Aucun fichier joint.</p>
  }
  return (
    <div className="d-flex flex-wrap gap-2">
      {entries.map(([key, path]) => (
        <FileChip key={key} label={FILE_LABELS[key] ?? key} path={path} />
      ))}
    </div>
  )
}

// ─── Pill — tab selector ──────────────────────────────────────────────────────

const Pill = ({
  label, count, active, onClick, accent,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  accent: string
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 14px',
      borderRadius: 20,
      border: 'none',
      cursor: 'pointer',
      fontWeight: active ? 700 : 500,
      fontSize: '0.78rem',
      color: active ? '#fff' : '#6b7280',
      background: active ? accent : '#f1f5f9',
      transition: 'all 0.15s',
      boxShadow: active ? `0 2px 8px ${accent}55` : 'none',
    }}
  >
    {label}
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 18,
        height: 18,
        borderRadius: '50%',
        fontSize: '0.68rem',
        fontWeight: 700,
        background: active ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
        color: active ? '#fff' : '#374151',
      }}
    >
      {count}
    </span>
  </button>
)

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  files: Record<string, string> | null | string
  complementFiles: Record<string, string> | null | string
}

// ─── DossierFilesSplit ────────────────────────────────────────────────────────

const DossierFilesSplit = ({ files, complementFiles }: Props) => {
  const initial    = parseFiles(files)
  const complement = parseFiles(complementFiles)

  const hasComplement = Object.keys(complement).length > 0

  const [tab, setTab] = useState<'initial' | 'complement'>('initial')

  // Pas de pièces complémentaires → affichage simple sans onglets
  if (!hasComplement) {
    return (
      <div>
        <p
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: '#94a3b8',
            marginBottom: 8,
          }}
        >
          Pièces jointes
        </p>
        <FileGrid files={initial} />
      </div>
    )
  }

  // Avec pièces complémentaires → affichage tabbé
  return (
    <div>
      {/* En-tête */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <p
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: '#94a3b8',
            margin: 0,
          }}
        >
          Pièces jointes
        </p>

        {/* Pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          <Pill
            label="Initiales"
            count={Object.keys(initial).length}
            active={tab === 'initial'}
            onClick={() => setTab('initial')}
            accent="#2563eb"
          />
          <Pill
            label="Complémentaires"
            count={Object.keys(complement).length}
            active={tab === 'complement'}
            onClick={() => setTab('complement')}
            accent="#7c3aed"
          />
        </div>
      </div>

      {/* Panneau actif */}
      <div
        style={{
          border: `1.5px solid ${tab === 'complement' ? '#ede9fe' : '#e2e8f0'}`,
          borderRadius: 10,
          padding: '12px 14px',
          background: tab === 'complement' ? '#faf5ff' : '#f8fafc',
          transition: 'all 0.2s',
        }}
      >
        {/* Badge contextuel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          {tab === 'complement' ? (
            <>
              <CIcon icon={cilPlus} style={{ width: 13, color: '#7c3aed' }} />
              <span
                style={{
                  fontSize: '0.70rem',
                  fontWeight: 600,
                  color: '#7c3aed',
                  background: '#ede9fe',
                  padding: '2px 8px',
                  borderRadius: 5,
                }}
              >
                Pièces déposées en complément :
              </span>
            </>
          ) : (
            <>
              <CIcon icon={cilFile} style={{ width: 13, color: '#2563eb' }} />
              <span
                style={{
                  fontSize: '0.70rem',
                  fontWeight: 600,
                  color: '#2563eb',
                  background: '#eff6ff',
                  padding: '2px 8px',
                  borderRadius: 5,
                }}
              >
                Pièces déposées à la soumission :
              </span>
            </>
          )}
        </div>

        <FileGrid files={tab === 'initial' ? initial : complement} />
      </div>
    </div>
  )
}

export default DossierFilesSplit
