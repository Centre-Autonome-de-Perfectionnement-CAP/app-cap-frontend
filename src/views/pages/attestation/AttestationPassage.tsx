// src/views/pages/attestation/AttestationPassage.tsx
import { CBadge } from '@coreui/react'
import AttestationView from './components/AttestationView'
import type { EligibleStudent } from '@/types/attestation.types'

const AttestationPassage = () => (
  <AttestationView
    attestationType="passage"
    title="Attestations de Passage"
    subtitle="Étudiants ayant validé leur année (non dernière année du cycle)"
    showCohortFilter
    emptyMessage="Aucun étudiant éligible à l'attestation de passage"
    bulkFilename="attestations-passage.pdf"
    unitFilename="attestation-passage.pdf"
    extraColumns={[
      {
        key: 'next_level',
        header: 'Passe en',
        render: (s: EligibleStudent) => (
          <span className="text-muted" style={{ fontSize: '0.82rem' }}>
            {(s as any).next_level || '—'}
          </span>
        ),
      },
    ]}
  />
)

export default AttestationPassage
