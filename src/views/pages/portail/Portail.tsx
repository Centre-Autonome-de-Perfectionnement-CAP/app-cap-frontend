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
} from '@coreui/react';
import { Link } from 'react-router-dom'; // Import de Link pour la navigation interne

const applications = [
  {
    title: 'CAP Inscription',
    description:
      'Facilite le processus d\'inscription des étudiants au CAP avec une gestion en ligne complète.',
    image: '/assets/svg/inscription.svg',
    url: '/inscription',
  },
  {
    title: 'CAP Attestations',
    description:
      'Permet de délivrer rapidement les attestations de fin de formation.',
    image: '/assets/svg/attestation.svg',
    url: '/attestations',
  },
  {
    title: 'CAP Notes',
    description:
      'Gestion des notes avec un suivi simple et intuitif des performances académiques.',
    image: '/assets/svg/notes.svg',
    url: '/notes',
  },
  {
    title: 'CAP Ressources Humaines',
    description:
      'Gestion du personnel, contrats, congés et évaluations de performance.',
    image: '/assets/svg/rh.svg',
    url: '/rh',
  },
  {
    title: 'CAP Soutenances',
    description: 'Organisation et gestion des soutenances de mémoire.',
    image: '/assets/svg/soutenance.svg',
    url: '/soutenances',
  },
  {
    title: 'CAP Emploi du Temps',
    description: 'Création et gestion des horaires de cours et d\'examens.',
    image: '/assets/svg/emploi.svg',
    url: '/cours/emploi-du-temps',
  },
  {
    title: 'CAP Cahier de Texte',
    description: 'Suivi et planification des cours dispensés par les enseignants.',
    image: '/assets/svg/cahier.svg',
    url: '/cahier-texte',
  },
  {
    title: 'CAP Présence',
    description:
      'Suivi de la présence des étudiants et gestion des entrées/sorties.',
    image: '/assets/svg/presence.svg',
    url: '/presence',
  },
  {
    title: 'CAP Finance',
    description: 'Gestion des finances et des paiements des étudiants.',
    image: '/assets/svg/finances.svg',
    url: '/finance',
  },
  {
    title: 'CAP Bibliothèque',
    description: 'Gestion des ressources et prêts de la bibliothèque.',
    image: '/assets/svg/bibliotheque.svg',
    url: '/bibliotheque',
  },
];

const Portail = () => {
  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <h2 className="text-center mb-4">Les 10 Modules du Progiciel</h2>
        <CRow>
          {applications.map((app, index) => (
            <CCol md={3} sm={6} className="mb-4" key={index}>
              <Link to={app.url} style={{ textDecoration: 'none' }}>
                <CCard className="h-100 shadow-sm hover-shadow" style={{ position: 'relative' }}>
                  <CCardImage orientation="top" src={app.image} height={220} className="p-3" />
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
  );
};

export default Portail;