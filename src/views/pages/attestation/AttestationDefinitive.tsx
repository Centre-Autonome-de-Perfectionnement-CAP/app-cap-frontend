// src/views/pages/attestation/AttestationDefinitive.tsx
import { CBadge } from '@coreui/react'
import AttestationView from './components/AttestationView'
import type { EligibleStudent } from '@/types/attestation.types'

const AttestationDefinitive = () => (
  <AttestationView
    attestationType="definitive"
    title="Attestations de Fin de Cycle"
    subtitle="Étudiants ayant validé la dernière année de leur cycle de formation"
    showCohortFilter
    emptyMessage="Aucun étudiant éligible à l'attestation de fin de cycle"
    bulkFilename="attestations-definitives.pdf"
    unitFilename="attestation-definitive.pdf"
    extraColumns={[
      {
        key: 'cycle',
        header: 'Cycle',
        render: (s: EligibleStudent) => (
          <CBadge color="primary" shape="rounded-pill" style={{ fontSize: '0.72rem' }}>
            {(s as any).cycle || '—'}
          </CBadge>
        ),
      },
    ]}
  />
)

export default AttestationDefinitive
