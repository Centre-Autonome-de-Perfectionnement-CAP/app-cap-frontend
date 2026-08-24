import { useMemo } from 'react'
import Select from 'react-select'
import { CCard, CCardBody, CButton, CCol, CRow } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMoney, cilClock, cilCalculator, cilUser } from '@coreui/icons'
import { StatsCard, ChartCard, DashboardTable } from '@/components/dashboard'
import { LoadingSpinner } from '@/components'
import useFinanceDashboard from '@/hooks/finance/useFinanceDashboard'
import useAnneeAcademiquesData from '@/hooks/inscription/useAnneeAcademiqueData'

const Dashboard = () => {
  const {
    stats,
    pendingPayments,
    selectedYear,
    setSelectedYear,
    loading,
    error,
  } = useFinanceDashboard()

  const { academicYears } = useAnneeAcademiquesData()

  const yearOptions = useMemo(() => {
    return academicYears.map((year: any) => ({
      value: year.id,
      label: year.libelle
    }))
  }, [academicYears])

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

  const monthlyPaymentsData = useMemo(
    () => ({
      labels: stats?.monthly_payments?.map((item: any) => item.month_name) || [],
      datasets: [
        {
          label: 'Montant encaissé (FCFA)',
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 1,
          data: stats?.monthly_payments?.map((item: any) => item.total) || [],
        },
      ],
    }),
    [stats?.monthly_payments]
  )



  const pendingPaymentsColumns = [
    {
      key: 'student_id_number',
      label: 'Matricule',
      align: 'center' as const,
    },
    {
      key: 'student_name',
      label: 'Nom et Prénoms',
      align: 'center' as const,
      render: (_: any, item: any) => 
        item.student_full_name
          || (item.student ? `${item.student.first_name || ''} ${item.student.last_name || ''}`.trim() : '')
          || (item.legacy_student ? `${item.legacy_student.first_name || ''} ${item.legacy_student.last_name || ''}`.trim() : '')
          || 'N/A',
    },
    {
      key: 'amount',
      label: 'Montant',
      align: 'center' as const,
      render: (value: number) => `${value?.toLocaleString()} FCFA`,
    },
    {
      key: 'payment_date',
      label: 'Date de paiement',
      align: 'center' as const,
      render: (value: string) => new Date(value).toLocaleDateString('fr-FR'),
    },
  ]

  if (loading) {
    return (
      <LoadingSpinner fullPage message="Chargement du tableau de bord financier..." />
    )
  }

  if (error) {
    return (
      <CCard className="text-center">
        <CCardBody>
          <div className="text-danger mb-3">
            <CIcon icon={cilMoney} size="xxl" />
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
          value={stats?.pending_payments_count || 0}
          label="Paiements en attente"
          icon={cilClock}
          color="warning"
        />
        <StatsCard
          value={`${(stats?.collected_amount || 0).toLocaleString()} FCFA`}
          label="Frais encaissés"
          icon={cilMoney}
          color="success"
        />
        <StatsCard
          value={`${(stats?.expected_amount || 0).toLocaleString()} FCFA`}
          label="Montant attendu"
          icon={cilCalculator}
          color="info"
        />
        <StatsCard
          value={`${(stats?.collected_amount && stats?.expected_amount) ? ((stats.collected_amount / stats.expected_amount) * 100).toFixed(1) : 0}%`}
          label="Taux de recouvrement"
          icon={cilUser}
          color="danger"
        />
      </CRow>

      <CRow className="mb-3">
        <CCol xs={12} md={4}>
          <label className="form-label fw-semibold">Filtrer par Année</label>
          <Select
            options={yearOptions}
            value={yearOptions.find((opt) => opt.value === selectedYear)}
            onChange={(option: any) => setSelectedYear(option?.value?.toString() || null)}
            placeholder="Sélectionner une année..."
            isSearchable
          />
        </CCol>
      </CRow>

      <CRow className="mb-4">
        <ChartCard
          title="Évolution des encaissements par mois"
          type="bar"
          data={monthlyPaymentsData}
          options={chartOptions}
        />
      </CRow>



      <DashboardTable
        title="Paiements en attente de validation"
        columns={pendingPaymentsColumns}
        data={pendingPayments || []}
        linkTo="/finance/validation"
      />
    </>
  )
}

export default Dashboard