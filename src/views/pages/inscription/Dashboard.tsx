
import Select from 'react-select'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { CChart } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import { cilUser, cilFolderOpen, cilSchool, cilLayers } from '@coreui/icons'

import useDashboardData from '@/hooks/inscription/useDashboardData'
import { Link } from 'react-router-dom'
import { LoadingSpinner } from '@/components'

const Dashboard = () => {
  const {
    stats,
    academicYears,
    pendingStudents,
    graphesData,
    selectedYear,
    setSelectedYear,
    loading,
    error,
  } = useDashboardData()

  if (loading) {
    return <LoadingSpinner fullPage message="Chargement des données du tableau de bord..." />
  }

  if (error) {
    return (
      <CCard className="text-center">
        <CCardBody>
          <div className="text-danger mb-3">
            <CIcon icon={cilFolderOpen} size="xxl" />
          </div>
          <h4 className="text-danger">Erreur de chargement</h4>
          <p className="text-muted">{error}</p>
          <CButton color="primary" onClick={() => window.location.reload()}>
            Réessayer
          </CButton>
        </CCardBody>
      </CCard>
    )
  }

  // Options communes pour tous les graphiques
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          boxWidth: 12,
        }
      }
    }
  }

  // Données pour le premier graphique (inscrits par filière - histogramme)
  const inscritsChartData = {
    labels: graphesData.inscritsParFiliere.map((item) => item.filiere),
    datasets: [
      {
        label: "Nombre d'inscrits",
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
        data: graphesData.inscritsParFiliere.map((item) => item.nombre),
      },
    ],
  }

  // Données pour le deuxième graphique (dossiers par filière - camembert)
  const dossiersParFiliereChartData = {
    labels: graphesData.inscritsParFiliere.map((item) => item.filiere),
    datasets: [
      {
        data: graphesData.inscritsParFiliere.map((item) => item.nombre),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#7CFFB2', '#6B7FD7', '#BCED09', '#2C4251',
          '#B6C649', '#F77088', '#D8DBE2', '#FF6B6B', '#4ECDC4'
        ],
        hoverBackgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#7CFFB2', '#6B7FD7', '#BCED09', '#2C4251',
          '#B6C649', '#F77088', '#D8DBE2', '#FF6B6B', '#4ECDC4'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      },
    ],
  }

  // Options spécifiques pour le camembert
  const doughnutOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  }

  // Données pour le troisième graphique (inscrits par cycle - histogramme)
  const cyclesChartData = {
    labels: graphesData.inscritsParCycle.map((item) => item.cycle),
    datasets: [
      {
        label: "Nombre d'inscrits par cycle",
        backgroundColor: 'rgba(153,102,255,0.4)',
        borderColor: 'rgba(153,102,255,1)',
        borderWidth: 1,
        data: graphesData.inscritsParCycle.map((item) => item.nombre),
      },
    ],
  }

  const yearOptions = academicYears.map((year) => ({
    value: year.id,
    label: year.libelle,
  }))

  return (
    <>
      {/* Cards dynamiques en haut */}  
      <CRow className="mb-4">
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="shadow-sm border-0 text-white bg-success">
            <CCardBody className="d-flex align-items-center justify-content-between">
              <div>
                <div className="fs-3 fw-bold">{stats.inscritsCap}</div>
                <div>Inscrits au CAP</div>
              </div>
              <CIcon icon={cilUser} size="xxl" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="shadow-sm border-0 text-white bg-info">
            <CCardBody className="d-flex align-items-center justify-content-between">
              <div>
                <div className="fs-3 fw-bold">{stats.dossiersAttente}</div>
                <div>Dossiers en Attente</div>
              </div>
              <CIcon icon={cilFolderOpen} size="xxl" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="shadow-sm border-0 text-white bg-warning">
            <CCardBody className="d-flex align-items-center justify-content-between">
              <div>
                <div className="fs-3 fw-bold">{stats.anneeAcademique}</div>
                <div>Année Académique</div>
              </div>
              <CIcon icon={cilSchool} size="xxl" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="shadow-sm border-0 text-white bg-danger">
            <CCardBody className="d-flex align-items-center justify-content-between">
              <div>
                <div className="fs-3 fw-bold">{stats.nombreFilieres}</div>
                <div>Nombre de Filières</div>
              </div>
              <CIcon icon={cilLayers} size="xxl" />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Combobox avec recherche */}
      <CRow className="mb-3">
        <CCol xs={12} md={4}>
          <label className="form-label fw-semibold">Filtrer par Année Académique</label>
          <Select
            options={yearOptions}
            value={yearOptions.find((opt) => opt.value.toString() === selectedYear.toString())}
            onChange={(option: any) => setSelectedYear(option?.value?.toString() || '')}
            placeholder="Sélectionner une année..."
            isSearchable
          />
        </CCol>
      </CRow>

      {/* Première ligne : Graphique des inscrits par filière (histogramme) */}
      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard>
            <CCardHeader>Nombre d'inscrits par Filière</CCardHeader>
            <CCardBody>
                <CChart type="bar" data={inscritsChartData} options={chartOptions} style={{ height: '500px'}}/>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Deuxième ligne : Graphique des dossiers par filière (camembert) */}
      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard>
            <CCardHeader>Répartition des Dossiers par Filière</CCardHeader>
            <CCardBody>
                <CChart type="doughnut" data={dossiersParFiliereChartData} options={doughnutOptions} style={{ height: '500px'}}/>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Troisième ligne : Graphique des inscrits par cycle (histogramme) */}
      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard>
            <CCardHeader>Nombre d'Inscrits par Cycle</CCardHeader>
            <CCardBody>
                <CChart type="bar" data={cyclesChartData} options={chartOptions} style={{ height: '500px'}}/>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Premier tableau : Années Académiques */}
      <CCard className="mb-4 shadow-sm">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <span>Années Académiques</span>
          <Link to="/inscription/academics-years">
            <CButton color="primary" size="sm" variant="outline">
              Voir plus
            </CButton>
          </Link>
        </CCardHeader>
        <CCardBody>
          <CTable align="middle" bordered responsive>
            <CTableHead className="text-nowrap table-light">
              <CTableRow>
                <CTableHeaderCell>N°</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Année Académique</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Début</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Fin</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {academicYears.slice(0, 5).map((item, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>{index + 1}</CTableDataCell>
                  <CTableDataCell className="text-center">{item.libelle}</CTableDataCell>
                  <CTableDataCell className="text-center">{item.date_debut}</CTableDataCell>
                  <CTableDataCell className="text-center">{item.date_fin}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CCard className="mb-4 shadow-sm">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <span>Étudiants en Attente</span>
          <Link to="/inscription/pending-students">
            <CButton color="primary" size="sm" variant="outline">
              Voir plus
            </CButton>
          </Link>
        </CCardHeader>
        <CCardBody>
          <CTable align="middle" bordered responsive>
            <CTableHead className="text-nowrap table-light">
              <CTableRow>
                <CTableHeaderCell>N°</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Nom et Prénoms</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Filière</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Date de Dépôt</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Sexe</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {pendingStudents.slice(0, 5).map((item, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>{index + 1}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    {`${item.first_name} ${item.last_name}`}
                  </CTableDataCell>
                  <CTableDataCell className="text-center">
                    {item.department || 'N/A'}
                  </CTableDataCell>
                  <CTableDataCell className="text-center">
                    {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('fr-FR') : 'N/A'}
                  </CTableDataCell>
                  <CTableDataCell className="text-center">
                    {item.gender || 'N/A'}
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default Dashboard