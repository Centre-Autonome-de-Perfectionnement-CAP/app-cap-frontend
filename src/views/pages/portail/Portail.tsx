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
import { Link } from 'react-router-dom';
import { getAssetUrl } from '@/utils/assets'; 

const applications = [
  {
    title: 'CAP Attestations',
    description: '',
    image: getAssetUrl('images/attestation.png'),
    url: '/attestations',
  },
  {
    title: 'CAP Bibliothèque',
    description: '',
    image: getAssetUrl('images/bibliotheque.png'),
    url: '/bibliotheque',
  },
  {
    title: 'CAP Cahier de Texte',
    description: '',
    image: getAssetUrl('images/cahier-texte.png'),
    url: '/cahier-texte',
  },
  {
    title: 'CAP Cours',
    description: '',
    image: getAssetUrl('images/cours.png'),
    url: '/cours',
  },
  {
    title: 'CAP Emploi du Temps',
    description: '',
    image: getAssetUrl('images/emploi-temps.png'),
    url: '/emploi-du-temps',
  },
  {
    title: 'CAP Finance',
    description: '',
    image: getAssetUrl('images/finance.png'),
    url: '/finance',
  },
  {
    title: 'CAP Inscription',
    description: '',
    image: getAssetUrl('images/inscription.png'),
    url: '/inscription',
  },
  {
    title: 'CAP Notes',
    description: '',
    image: getAssetUrl('images/notes.png'),
    url: '/notes',
  },
  {
    title: 'CAP Ressources Humaines',
    description: '',
    image: getAssetUrl('images/rh.png'),
    url: '/rh',
  },
  {
    title: 'CAP Soutenances',
    description: '',
    image: getAssetUrl('images/soutenances.png'),
    url: '/soutenances',
  },
  {
    title: 'CAP Présence',
    description: '',
    image: getAssetUrl('images/presence.png'),
    url: '/presence',
  },
  {
    title: 'CAP Demandes',
    description: '',
    image: getAssetUrl('images/attestations.jpeg'),
    url: '/demandes',
  },
];

const Portail = () => {
  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <h2 className="text-left my-5">Modules du Progiciel</h2> <hr/>
        <CRow>
          {applications.map((app, index) => (
            <CCol md={3} sm={6} className="mb-4" key={index}>
              <Link to={app.url} style={{ textDecoration: 'none' }}>
                <CCard className="h-200 shadow-sm hover-shadow" style={{ position: 'relative' }}>
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
  );
};

export default Portail;