// src/views/pages/attestation/AttestationInscription.tsx
import { CBadge } from '@coreui/react'
import AttestationView from './components/AttestationView'
import type { EligibleStudent } from '@/types/attestation.types'

const AttestationInscription = () => (
  <AttestationView
    attestationType="inscription"
    title="Attestations d'Inscription"
    subtitle="Étudiants avec une inscription approuvée pour l'année en cours"
    showCohortFilter={false}   // pas de cohorte pour l'inscription
    emptyMessage="Aucun étudiant éligible à l'attestation d'inscription"
    bulkFilename="attestations-inscription.pdf"
    unitFilename="attestation-inscription.pdf"
    extraColumns={[
      {
        key: 'academic_year',
        header: 'Année académique',
        render: (s: EligibleStudent) => (
          <span className="text-muted" style={{ fontSize: '0.82rem' }}>
            {s.academic_year || '—'}
          </span>
        ),
      },
    ]}
  />
)

export default AttestationInscription
