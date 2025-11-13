import React from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CWidgetStatsF,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBuilding,
  cilRoom,
  cilClock,
  cilCalendar,
  cilCheckCircle,
  cilXCircle,
} from '@coreui/icons'

const Dashboard: React.FC = () => {
  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Tableau de bord - Emploi du Temps</strong>
            </CCardHeader>
            <CCardBody>
              <p className="text-medium-emphasis">
                Bienvenue sur le module de gestion des emplois du temps
              </p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow>
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-3"
            color="primary"
            icon={<CIcon icon={cilBuilding} height={24} />}
            title="Bâtiments"
            value="0"
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-3"
            color="info"
            icon={<CIcon icon={cilRoom} height={24} />}
            title="Salles"
            value="0"
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-3"
            color="warning"
            icon={<CIcon icon={cilClock} height={24} />}
            title="Créneaux horaires"
            value="0"
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-3"
            color="success"
            icon={<CIcon icon={cilCalendar} height={24} />}
            title="Cours planifiés"
            value="0"
          />
        </CCol>
      </CRow>

      <CRow>
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-3"
            color="success"
            icon={<CIcon icon={cilCheckCircle} height={24} />}
            title="Cours actifs"
            value="0"
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-3"
            color="danger"
            icon={<CIcon icon={cilXCircle} height={24} />}
            title="Cours annulés"
            value="0"
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-3"
            color="info"
            icon={<CIcon icon={cilRoom} height={24} />}
            title="Taux d'occupation salles"
            value="0%"
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-3"
            color="warning"
            icon={<CIcon icon={cilClock} height={24} />}
            title="Conflits détectés"
            value="0"
          />
        </CCol>
      </CRow>

      <CRow>
        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Activités récentes</strong>
            </CCardHeader>
            <CCardBody>
              <p className="text-medium-emphasis">
                Les dernières modifications apparaîtront ici
              </p>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Cours à venir</strong>
            </CCardHeader>
            <CCardBody>
              <p className="text-medium-emphasis">
                Les prochains cours planifiés apparaîtront ici
              </p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard
