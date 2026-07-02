import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CSpinner,
  CWidgetStatsF,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilNotes,
  cilPlus,
  cilClipboard,
  cilCheckCircle,
  cilClock,
  cilBook,
} from '@coreui/icons'
import CahierService from '@/services/cahier.service'
import { useAuth } from '@/contexts'
import type { TextbookStatistics } from '@/types/cahier-texte.types'

const Dashboard = () => {
  const { role, userId, nom, prenoms } = useAuth()
  const navigate = useNavigate()
  const isProfesseur = (role as any) === 'professeur'

  const [stats, setStats] = useState<TextbookStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [userId])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const params = isProfesseur && userId ? { professor_id: userId } : {}
      const data = await CahierService.getStatistics(params)
      setStats(data)
    } catch (error) {
      console.error('Erreur chargement statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <CRow className="mb-4">
        <CCol>
          <h4 className="fw-bold">
            {isProfesseur ? `Mon Cahier de Texte` : 'Tableau de bord — Cahier de Texte'}
          </h4>
          {isProfesseur && (nom || prenoms) && (
            <p className="text-muted mb-0">{prenoms} {nom}</p>
          )}
        </CCol>
        {isProfesseur && (
          <CCol xs="auto">
            <CButton color="primary" size="sm" onClick={() => navigate('/cahier-texte/new')}>
              <CIcon icon={cilPlus} className="me-1" />
              Nouvelle entrée
            </CButton>
          </CCol>
        )}
      </CRow>

      {loading ? (
        <div className="text-center p-5">
          <CSpinner color="primary" />
        </div>
      ) : (
        <>
          {/* Stats principales */}
          <CRow className="mb-4 g-3">
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-0"
                color="primary"
                icon={<CIcon icon={cilClipboard} height={24} />}
                title="Total des entrées"
                value={(stats?.total_entries || 0).toString()}
              />
            </CCol>
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-0"
                color="warning"
                icon={<CIcon icon={cilClock} height={24} />}
                title="Brouillons"
                value={(stats?.draft_entries || 0).toString()}
              />
            </CCol>
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-0"
                color="info"
                icon={<CIcon icon={cilNotes} height={24} />}
                title="Publiées"
                value={(stats?.published_entries || 0).toString()}
              />
            </CCol>
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-0"
                color="success"
                icon={<CIcon icon={cilCheckCircle} height={24} />}
                title="Validées"
                value={(stats?.validated_entries || 0).toString()}
              />
            </CCol>
          </CRow>

          {/* Stats secondaires */}
          <CRow className="mb-4 g-3">
            <CCol sm={6}>
              <CCard className="border-0 shadow-sm">
                <CCardBody className="text-center">
                  <CIcon icon={cilBook} size="xl" className="text-primary mb-2" />
                  <h3 className="fw-bold">{stats?.total_hours_taught || 0}h</h3>
                  <p className="text-muted mb-0">Heures enseignées</p>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol sm={6}>
              <CCard className="border-0 shadow-sm">
                <CCardBody className="text-center">
                  <CIcon icon={cilClipboard} size="xl" className="text-warning mb-2" />
                  <h3 className="fw-bold">{stats?.entries_with_homework || 0}</h3>
                  <p className="text-muted mb-0">Séances avec devoirs</p>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* Actions rapides pour professeur */}
          {isProfesseur && (
            <CCard className="border-0 shadow-sm">
              <CCardHeader>
                <strong>Actions rapides</strong>
              </CCardHeader>
              <CCardBody>
                <div className="d-flex flex-wrap gap-2">
                  <CButton color="primary" onClick={() => navigate('/cahier-texte/new')}>
                    <CIcon icon={cilPlus} className="me-1" />
                    Enregistrer une séance
                  </CButton>
                  <CButton color="secondary" variant="outline" onClick={() => navigate('/cahier-texte/mes-entrees')}>
                    <CIcon icon={cilNotes} className="me-1" />
                    Voir mes entrées
                  </CButton>
                </div>
              </CCardBody>
            </CCard>
          )}

          {/* Accès consultation pour admin */}
          {!isProfesseur && (
            <CCard className="border-0 shadow-sm">
              <CCardHeader>
                <strong>Consultation</strong>
              </CCardHeader>
              <CCardBody>
                <div className="d-flex flex-wrap gap-2">
                  <CButton color="primary" variant="outline" onClick={() => navigate('/cahier-texte/list')}>
                    <CIcon icon={cilNotes} className="me-1" />
                    Toutes les entrées
                  </CButton>
                  <CButton color="secondary" variant="outline" onClick={() => navigate('/cahier-texte/by-class')}>
                    Consulter par classe
                  </CButton>
                </div>
              </CCardBody>
            </CCard>
          )}
        </>
      )}
    </>
  )
}

export default Dashboard
