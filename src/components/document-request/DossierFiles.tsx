// src/components/document-request/DossierFiles.tsx

import { CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilFile } from '@coreui/icons'

const FILE_LABELS: Record<string, string> = {
  demande_manuscrite:       'Demande manuscrite',
  acte_naissance:           'Acte de naissance',
  attestation_succes_file:  "Attestation de succès",
  quittance:                'Quittance',
  recu_paiement:            'Reçu de paiement',
  bulletin:                 'Bulletin de notes',
}

interface Props {
  files: Record<string, string> | null | string
}

const DossierFiles = ({ files }: Props) => {
  const parsed: Record<string, string> = typeof files === 'string'
    ? (() => { try { return JSON.parse(files) } catch { return {} } })()
    : files ?? {}

  const entries = Object.entries(parsed)

  if (entries.length === 0) {
    return <p className="text-muted small">Aucun fichier joint.</p>
  }

  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8001').replace('/api', '')

  return (
    <div className="d-flex flex-wrap gap-2">
      {entries.map(([key, path]) => (
        <CButton
          key={key}
          color="light"
          size="sm"
          href={`${apiBase}/storage/${path}`}
          target="_blank"
          rel="noopener noreferrer"
          className="d-flex align-items-center gap-1"
          style={{ fontSize: '0.78rem' }}
        >
          <CIcon icon={cilFile} size="sm" />
          {FILE_LABELS[key] ?? key}
          <CIcon icon={cilCloudDownload} size="sm" className="ms-1 text-muted" />
        </CButton>
      ))}
    </div>
  )
}

export default DossierFiles
