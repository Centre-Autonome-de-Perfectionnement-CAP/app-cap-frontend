// src/views/pages/attestation/PreparatoryClass.tsx
import AttestationView from './components/AttestationView'

const PreparatoryClass = () => (
  <AttestationView
    attestationType="preparatory"
    title="Certificats de Classes Préparatoires"
    subtitle="Étudiants ayant validé l'année de classe préparatoire"
    showCohortFilter
    emptyMessage="Aucun étudiant éligible au certificat de classes préparatoires"
    bulkFilename="certificats-preparatoires.pdf"
    unitFilename="certificat-preparatoire.pdf"
  />
)

export default PreparatoryClass
