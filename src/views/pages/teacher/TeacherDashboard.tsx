import React from "react"
import { useNavigate } from "react-router-dom"
import {
  CCard,
  CCardBody,
  CCardTitle,
  CRow,
  CCol,
  CButton
} from "@coreui/react"
import CIcon from "@coreui/icons-react"
import {
  cilUser,
  cilPeople,
  cilChart
} from "@coreui/icons"

const TeacherDashboard = () => {
  const navigate = useNavigate()

  const stats = {
    students: 120,
    present: 95,
    absent: 15,
    reports: 8
  }

  return (
    <div className="container mt-4">

      <h2 className="mb-4"> Tableau de Bord Enseignant</h2>

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

      {/* SECTION PRESENCES UNIQUEMENT */}
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
                onClick={() => navigate('/presence/teacher/liste')}
              >
                Voir les présences
              </CButton>

            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

    </div>
  )
}

export default TeacherDashboard