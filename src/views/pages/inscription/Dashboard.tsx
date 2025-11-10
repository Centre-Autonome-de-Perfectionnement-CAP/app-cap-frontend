import { useMemo } from 'react'
import Select from 'react-select'
import { CCard, CCardBody, CButton, CCol, CRow } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilFolderOpen, cilSchool, cilLayers } from '@coreui/icons'
import { StatsCard, ChartCard, DashboardTable } from '@/components/dashboard'
import { LoadingSpinner } from '@/components'
import useDashboardData from '@/hooks/inscription/useDashboardData'

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

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            padding: 15,
            usePointStyle: true,
            boxWidth: 12,
          },
        },
      },
    }),
    []
  )

  const doughnutOptions = useMemo(
    () => ({
      ...chartOptions,
      plugins: {
        ...chartOptions.plugins,
        tooltip: {
          callbacks: {
            label: function (context: any) {
              const label = context.label || ''
              const value = context.parsed
              const total = context.dataset.data.reduce(
                (a: number, b: number) => a + b,
                0
              )
              const percentage = Math.round((value / total) * 100)
              return `${label}: ${value} (${percentage}%)`
            },
          },
        },
      },
    }),
    [chartOptions]
  )

  const inscritsChartData = useMemo(
    () => ({
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
    }),
    [graphesData.inscritsParFiliere]
  )

  const dossiersParFiliereChartData = useMemo(
    () => ({
      labels: graphesData.inscritsParFiliere.map((item) => item.filiere),
      datasets: [
        {
          data: graphesData.inscritsParFiliere.map((item) => item.nombre),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#7CFFB2',
            '#6B7FD7',
            '#BCED09',
            '#2C4251',
            '#B6C649',
            '#F77088',
            '#D8DBE2',
            '#FF6B6B',
            '#4ECDC4',
          ],
          hoverBackgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#7CFFB2',
            '#6B7FD7',
            '#BCED09',
            '#2C4251',
            '#B6C649',
            '#F77088',
            '#D8DBE2',
            '#FF6B6B',
            '#4ECDC4',
          ],
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    }),
    [graphesData.inscritsParFiliere]
  )

  const cyclesChartData = useMemo(
    () => ({
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
    }),
    [graphesData.inscritsParCycle]
  )

  const yearOptions = useMemo(
    () =>
      academicYears.map((year) => ({
        value: year.id,
        label: year.libelle,
      })),
    [academicYears]
  )

  const academicYearsColumns = [
    { key: 'libelle', label: 'Année Académique', align: 'center' as const },
    { key: 'date_debut', label: 'Début', align: 'center' as const },
    { key: 'date_fin', label: 'Fin', align: 'center' as const },
  ]

  const pendingStudentsColumns = [
    {
      key: 'name',
      label: 'Nom et Prénoms',
      align: 'center' as const,
      render: (_: any, item: any) => `${item.first_name} ${item.last_name}`,
    },
    { key: 'department', label: 'Filière', align: 'center' as const },
    {
      key: 'submitted_at',
      label: 'Date de Dépôt',
      align: 'center' as const,
      render: (value: any) =>
        value ? new Date(value).toLocaleDateString('fr-FR') : 'N/A',
    },
    { key: 'gender', label: 'Sexe', align: 'center' as const },
  ]

  if (loading) {
    return (
      <LoadingSpinner fullPage message="Chargement des données du tableau de bord..." />
    )
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

  return (
    <>
      <CRow className="mb-4">
        <StatsCard
          value={stats.inscritsCap}
          label="Inscrits au CAP"
          icon={cilUser}
          color="success"
        />
        <StatsCard
          value={stats.dossiersAttente}
          label="Dossiers en Attente"
          icon={cilFolderOpen}
          color="info"
        />
        <StatsCard
          value={stats.anneeAcademique}
          label="Année Académique"
          icon={cilSchool}
          color="warning"
        />
        <StatsCard
          value={stats.nombreFilieres}
          label="Nombre de Filières"
          icon={cilLayers}
          color="danger"
        />
      </CRow>

      <CRow className="mb-3">
        <CCol xs={12} md={4}>
          <label className="form-label fw-semibold">Filtrer par Année Académique</label>
          <Select
            options={yearOptions}
            value={yearOptions.find(
              (opt) => opt.value.toString() === selectedYear.toString()
            )}
            onChange={(option: any) => setSelectedYear(option?.value?.toString() || '')}
            placeholder="Sélectionner une année..."
            isSearchable
          />
        </CCol>
      </CRow>
      <CRow className="mb-4">
        <ChartCard
          title="Nombre d'inscrits par Filière"
          type="bar"
          data={inscritsChartData}
          options={chartOptions}
        />
      </CRow>

      <CRow className="mb-4">
        <ChartCard
          title="Répartition des Dossiers par Filière"
          type="doughnut"
          data={dossiersParFiliereChartData}
          options={doughnutOptions}
        />
      </CRow>

      <CRow className="mb-4">
        <ChartCard
          title="Nombre d'Inscrits par Cycle"
          type="bar"
          data={cyclesChartData}
          options={chartOptions}
        />
      </CRow>

      <DashboardTable
        title="Années Académiques"
        columns={academicYearsColumns}
        data={academicYears}
        linkTo="/inscription/academics-years"
      />

      <DashboardTable
        title="Étudiants en Attente"
        columns={pendingStudentsColumns}
        data={pendingStudents}
        linkTo="/inscription/pending-students"
      />
    </>
  )
}

export default Dashboard
