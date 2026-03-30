import { useState, useEffect } from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react'
import CahierService from '@/services/cahier.service'
import type { TextbookStatistics } from '@/types/cahier-texte.types'

const Dashboard = () => {
  const [stats, setStats] = useState<TextbookStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const data = await CahierService.getStatistics()
      setStats(data)
    } catch (error) {
      console.error('Erreur chargement statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Chargement...</div>
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Tableau de bord - Cahier de Texte</strong>
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol sm={6} lg={3}>
                  <CCard className="mb-4 border-primary">
                    <CCardBody className="text-center">
                      <h3 className="text-primary">{stats?.total_entries || 0}</h3>
                      <p className="text-muted mb-0">Total des entrées</p>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol sm={6} lg={3}>
                  <CCard className="mb-4 border-warning">
                    <CCardBody className="text-center">
                      <h3 className="text-warning">{stats?.draft_entries || 0}</h3>
                      <p className="text-muted mb-0">Brouillons</p>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol sm={6} lg={3}>
                  <CCard className="mb-4 border-info">
                    <CCardBody className="text-center">
                      <h3 className="text-info">{stats?.published_entries || 0}</h3>
                      <p className="text-muted mb-0">Publiées</p>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol sm={6} lg={3}>
                  <CCard className="mb-4 border-success">
                    <CCardBody className="text-center">
                      <h3 className="text-success">{stats?.validated_entries || 0}</h3>
                      <p className="text-muted mb-0">Validées</p>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
              <CRow>
                <CCol sm={6}>
                  <CCard className="mb-4">
                    <CCardBody className="text-center">
                      <h3>{stats?.total_hours_taught || 0}h</h3>
                      <p className="text-muted mb-0">Heures enseignées</p>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol sm={6}>
                  <CCard className="mb-4">
                    <CCardBody className="text-center">
                      <h3>{stats?.entries_with_homework || 0}</h3>
                      <p className="text-muted mb-0">Avec devoirs</p>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard
