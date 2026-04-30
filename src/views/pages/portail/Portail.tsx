// src/views/pages/portail/Portail.tsx
//
// Tâche 11.2 — Badge numérique sur la carte "CAP Demandes" uniquement.
//              Les autres modules n'ont pas (encore) de badge.
// Tâche 11.3 — Polling via useDemandesBadge (60 s).
// Tâche 11.4 — Badge absent si count === 0.

import {
  CCard,
  CCardBody,
  CCardImage,
  CCardTitle,
  CCardText,
  CRow,
  CCol,
  CContainer,
  CButton,
} from '@coreui/react'
import { Link } from 'react-router-dom'
import { getAssetUrl } from '@/utils/assets'
import { useDemandesBadge } from '@/hooks/demandes/useDemandesBadge'
import { DemandesBadge }   from '@/components/demandes/DemandesBadge'

// ─────────────────────────────────────────────────────────────────────────────
// Liste des modules — ordre alphabétique maintenu, "CAP Demandes" marqué
// ─────────────────────────────────────────────────────────────────────────────

const applications = [
  {
    title: 'CAP Attestations',
    description: '',
    image: getAssetUrl('images/attestation.png'),
    url: '/attestations',
    hasBadge: false,
  },
  {
    title: 'CAP Bibliothèque',
    description: '',
    image: getAssetUrl('images/bibliotheque.png'),
    url: '/bibliotheque',
    hasBadge: false,
  },
  {
    title: 'CAP Cahier de Texte',
    description: '',
    image: getAssetUrl('images/cahier-texte.png'),
    url: '/cahier-texte',
    hasBadge: false,
  },
  {
    title: 'CAP Cours',
    description: '',
    image: getAssetUrl('images/cours.png'),
    url: '/cours',
    hasBadge: false,
  },
  {
    title: 'CAP Emploi du Temps',
    description: '',
    image: getAssetUrl('images/emploi-temps.png'),
    url: '/emploi-du-temps',
    hasBadge: false,
  },
  {
    title: 'CAP Finance',
    description: '',
    image: getAssetUrl('images/finance.png'),
    url: '/finance',
    hasBadge: false,
  },
  {
    title: 'CAP Inscription',
    description: '',
    image: getAssetUrl('images/inscription.png'),
    url: '/inscription',
    hasBadge: false,
  },
  {
    title: 'CAP Notes',
    description: '',
    image: getAssetUrl('images/notes.png'),
    url: '/notes',
    hasBadge: false,
  },
  {
    title: 'CAP Ressources Humaines',
    description: '',
    image: getAssetUrl('images/rh.png'),
    url: '/rh',
    hasBadge: false,
  },
  {
    title: 'CAP Soutenances',
    description: '',
    image: getAssetUrl('images/soutenances.png'),
    url: '/soutenances',
    hasBadge: false,
  },
  {
    title: 'CAP Présence',
    description: '',
    image: getAssetUrl('images/presence.png'),
    url: '/presence',
    hasBadge: false,
  },
  {
    title: 'CAP Demandes',
    description: '',
    image: getAssetUrl('images/attestations.jpeg'),
    url: '/demandes',
    hasBadge: true,  // ← seul module avec badge pour l'instant
  },
]

// ─────────────────────────────────────────────────────────────────────────────

const Portail = () => {
  // Tâche 11.1 / 11.3 : badge en temps réel (polling 60 s)
  const { count } = useDemandesBadge()

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <h2 className="text-left my-5">Modules du Progiciel</h2> <hr />
        <CRow>
          {applications.map((app, index) => (
            <CCol md={3} sm={6} className="mb-4" key={index}>
              <Link to={app.url} style={{ textDecoration: 'none' }}>
                {/*
                  position: relative indispensable pour que le badge absolu
                  se positionne dans le coin de la carte (pas de la page)
                */}
                <CCard
                  className="h-200 shadow-sm hover-shadow"
                  style={{ position: 'relative' }}
                >
                  {/* Tâche 11.2 — Badge uniquement sur CAP Demandes */}
                  {app.hasBadge && <DemandesBadge count={count} />}

                  <CCardImage orientation="top" src={app.image} height={300} className="p-3" />
                  <CCardBody style={{ paddingBottom: '4rem' }}>
                    <CCardTitle>{app.title}</CCardTitle>
                    <CCardText>{app.description}</CCardText>
                  </CCardBody>
                  <CButton
                    color="primary"
                    variant="outline"
                    size="sm"
                    style={{
                      position: 'absolute',
                      bottom: '1rem',
                      right: '1rem',
                    }}
                  >
                    Se connecter
                  </CButton>
                </CCard>
              </Link>
            </CCol>
          ))}
        </CRow>
      </CContainer>
    </div>
  )
}

export default Portail
