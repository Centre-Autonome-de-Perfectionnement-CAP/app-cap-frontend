import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CCard,
  CCardBody,
  CCardTitle,
  CRow,
  CCol,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge
} from "@coreui/react"
import CIcon from "@coreui/icons-react"
import {
  cilUser,
  cilPeople,
  cilChart,
  cilArrowLeft
} from "@coreui/icons"

// Données statiques temporaires
const MOCK_PRESENCES = [
  { id: 1, matricule: 'ETU001', nom: 'AGBODJI Koffi',  seance: '10/01/2025', statut: 'present' },
  { id: 2, matricule: 'ETU002', nom: 'BELLO Fatima',   seance: '10/01/2025', statut: 'absent'  },
  { id: 3, matricule: 'ETU003', nom: 'DOSSOU Marc',    seance: '10/01/2025', statut: 'present' },
  { id: 4, matricule: 'ETU004', nom: 'KPADE Sylvie',   seance: '17/01/2025', statut: 'absent'  },
  { id: 5, matricule: 'ETU005', nom: 'HOUNSOU Désiré', seance: '17/01/2025', statut: 'present' },
  { id: 6, matricule: 'ETU006', nom: 'TOSSOU Aline',   seance: '17/01/2025', statut: 'present' },
]

const TeacherDashboard = () => {
  const navigate = useNavigate()

  // État pour afficher ou masquer la liste des présences
  const [showPresences, setShowPresences] = useState(false)

  const stats = {
    students: 120,
    present: 95,
    absent: 15,
    reports: 8
  }

  const totalPresents = MOCK_PRESENCES.filter(p => p.statut === 'present').length
  const totalAbsents  = MOCK_PRESENCES.filter(p => p.statut === 'absent').length

  return (
    <div className="container mt-4">

      {/* EN-TÊTE avec bouton retour si on est en mode liste */}
      <div className="d-flex align-items-center mb-4">
        {showPresences && (
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            className="me-3"
            onClick={() => setShowPresences(false)}
          >
            <CIcon icon={cilArrowLeft} className="me-1" />
            Retour
          </CButton>
        )}
        <h2 className="mb-0">
          {showPresences ? ' Présences des étudiants' : ' Tableau de Bord Enseignant'}
        </h2>
      </div>

      {!showPresences ? (
        <>
          {/* STATISTIQUES */}
          <CRow className="mb-4">

            <CCol md={3}>
              <CCard className="text-white bg-primary shadow">
                <CCardBody className="text-center">
                  <CIcon icon={cilPeople} size="xl"/>
                  <h4 className="mt-2">{stats.students}</h4>
                  <p>Étudiants</p>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={3}>
              <CCard className="text-white bg-success shadow">
                <CCardBody className="text-center">
                  <CIcon icon={cilUser} size="xl"/>
                  <h4 className="mt-2">{stats.present}</h4>
                  <p>Présents</p>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={3}>
              <CCard className="text-white bg-danger shadow">
                <CCardBody className="text-center">
                  <CIcon icon={cilUser} size="xl"/>
                  <h4 className="mt-2">{stats.absent}</h4>
                  <p>Absents</p>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={3}>
              <CCard className="text-white bg-warning shadow">
                <CCardBody className="text-center">
                  <CIcon icon={cilChart} size="xl"/>
                  <h4 className="mt-2">{stats.reports}</h4>
                  <p>Rapports générés</p>
                </CCardBody>
              </CCard>
            </CCol>

          </CRow>

          {/* SECTION PRESENCES */}
          <CRow>
            <CCol md={6}>
              <CCard className="shadow-lg border-0 mb-4">
                <CCardBody>
                  <CCardTitle className="mb-3">
                    Présences des étudiants
                  </CCardTitle>
                  <p>
                    Consultez les présences des étudiants pour vos différents
                    cours et suivez l'assiduité des apprenants.
                  </p>
                  <CButton
                    color="primary"
                    
                    onClick={() => navigate('/presence/teacher/dashboard')}
                  >
                    Voir les présences
                  </CButton>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </>

      ) : (

        <>
          {/* STATS RÉSUMÉ */}
          <CRow className="mb-4">
            <CCol md={4}>
              <CCard className="text-white bg-success shadow-sm text-center">
                <CCardBody>
                  <h3 className="fw-bold">{totalPresents}</h3>
                  <p className="mb-0">Présents</p>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol md={4}>
              <CCard className="text-white bg-danger shadow-sm text-center">
                <CCardBody>
                  <h3 className="fw-bold">{totalAbsents}</h3>
                  <p className="mb-0">Absents</p>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol md={4}>
              <CCard className="text-white bg-info shadow-sm text-center">
                <CCardBody>
                  <h3 className="fw-bold">
                    {Math.round((totalPresents / MOCK_PRESENCES.length) * 100)}%
                  </h3>
                  <p className="mb-0">Taux de présence</p>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* TABLEAU DES PRÉSENCES */}
          <CCard className="shadow-sm">
            <CCardBody>
              <CTable hover responsive bordered>
                <CTableHead className="table-light text-nowrap">
                  <CTableRow>
                    <CTableHeaderCell>N°</CTableHeaderCell>
                    <CTableHeaderCell>Matricule</CTableHeaderCell>
                    <CTableHeaderCell>Nom et Prénoms</CTableHeaderCell>
                    <CTableHeaderCell>Date séance</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Statut</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {MOCK_PRESENCES.map((p, index) => (
                    <CTableRow key={p.id}>
                      <CTableDataCell>{index + 1}</CTableDataCell>
                      <CTableDataCell>{p.matricule}</CTableDataCell>
                      <CTableDataCell>{p.nom}</CTableDataCell>
                      <CTableDataCell>{p.seance}</CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CBadge color={p.statut === 'present' ? 'success' : 'danger'}>
                          {p.statut === 'present' ? 'Présent' : 'Absent'}
                        </CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </>

      )}

    </div>
  )
}

export default TeacherDashboard