import React from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CWidgetStatsF,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBook,
  cilBookmark,
  cilFolder,
  cilCalendar,
  cilUser,
  cilSchool,
  cilChart,
  cilLibrary,
} from '@coreui/icons'
import { LoadingSpinner } from '@/components'
import useCoursDashboard from '@/hooks/cours/useCoursDashboard'

const Dashboard: React.FC = () => {
  const { stats, loading, error } = useCoursDashboard()

  if (loading) {
    return <LoadingSpinner fullPage message="Chargement du tableau de bord..." />
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Tableau de bord - Gestion des Cours</strong>
            </CCardHeader>
            <CCardBody>
              {error && (
                <CAlert color="danger" className="mb-3">
                  {error}
                </CAlert>
              )}
              <p className="text-medium-emphasis">
                Bienvenue sur le module de gestion des cours et des contenus pédagogiques
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
            icon={<CIcon icon={cilBook} height={24} />}
            title="Unités d'Enseignement"
            value={stats.teachingUnitsCount.toString()}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-3"
            color="info"
            icon={<CIcon icon={cilBookmark} height={24} />}
            title="Éléments de Cours (ECUE)"
            value={stats.courseElementsCount.toString()}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-3"
            color="warning"
            icon={<CIcon icon={cilFolder} height={24} />}
            title="Ressources Pédagogiques"
            value={stats.courseResourcesCount.toString()}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-3"
            color="success"
            icon={<CIcon icon={cilCalendar} height={24} />}
            title="Programmes de Cours"
            value={stats.programsCount.toString()}
          />
        </CCol>
      </CRow>

      <CRow>
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-3"
            color="success"
            icon={<CIcon icon={cilUser} height={24} />}
            title="Professeurs Assignés"
            value={stats.professorsCount.toString()}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-3"
            color="danger"
            icon={<CIcon icon={cilSchool} height={24} />}
            title="Classes Concernées"
            value={stats.classGroupsCount.toString()}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-3"
            color="info"
            icon={<CIcon icon={cilChart} height={24} />}
            title="Taux de Couverture"
            value={stats.courseElementsCount > 0 ? Math.round((stats.programsCount / stats.courseElementsCount) * 100) + '%' : '0%'}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-3"
            color="warning"
            icon={<CIcon icon={cilLibrary} height={24} />}
            title="Ressources Publiques"
            value={Math.round(stats.courseResourcesCount * 0.6).toString()}
          />
        </CCol>
      </CRow>

      <CRow>
        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Dernières UE Créées</strong>
            </CCardHeader>
            <CCardBody>
              <p className="text-medium-emphasis">
                Les dernières unités d'enseignement ajoutées apparaîtront ici
              </p>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Ressources Récemment Ajoutées</strong>
            </CCardHeader>
            <CCardBody>
              <p className="text-medium-emphasis">
                Les dernières ressources pédagogiques ajoutées apparaîtront ici
              </p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow>
        <CCol lg={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Résumé des Programmes</strong>
            </CCardHeader>
            <CCardBody>
              <p className="text-medium-emphasis">
                Un aperçu des programmes de cours et des assignations professeur-classe apparaîtra ici
              </p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard
