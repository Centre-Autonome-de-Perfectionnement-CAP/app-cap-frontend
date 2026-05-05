import { useState, useEffect } from 'react'
import { CCard, CCardBody, CRow, CCol, CSpinner } from '@coreui/react'
import { CChartBar, CChartDoughnut } from '@coreui/react-chartjs'
import { Chart as ChartJS, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { SingleValue } from 'react-select'
import AttendanceFilter from '@/components/Attendance/AttendanceFilter'
import CIcon from '@coreui/icons-react'
import { cilUser, cilX, cilClock, cilWifiSignal4, cilWifiSignalOff } from '@coreui/icons'

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend)

const BASE_URL = 'http://localhost:8000/api/attendance'

interface SelectOption { value: string; label: string }
type Filters = { year: string; filiere: string; niveau: string }

const Dashboard = () => {
  const [filterOptions, setFilterOptions] = useState({ annees: [] as string[], filieres: [] as string[], niveaux: [] as string[] })
  const [filters, setFilters]             = useState<Filters>({ year: '', filiere: '', niveau: '' })
  const [stats, setStats]                 = useState({
    presence: 0, absence: 0, lateRate: 0,
    totalPresences: 0, totalAbsences: 0, totalOnTime: 0, totalLate: 0,
    monthlyPresence: Array(12).fill(0), monthlyAbsence: Array(12).fill(0), monthlyLate: Array(12).fill(0),
  })
  const [sensor, setSensor]   = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${BASE_URL}/filters`).then(r => r.json()).then(d => {
      if (d.success) setFilterOptions({ annees: d.data.annees || [], filieres: d.data.filieres || [], niveaux: d.data.niveaux || [] })
    })
  }, [])

  const fetchSensor = () => {
    fetch(`${BASE_URL}/sensor-status`).then(r => r.json()).then(d => { if (d.success) setSensor(d.data) }).catch(() => {})
  }
  useEffect(() => { fetchSensor(); const t = setInterval(fetchSensor, 30000); return () => clearInterval(t) }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.year)    params.append('annee',   filters.year)
    if (filters.filiere) params.append('filiere', filters.filiere)
    if (filters.niveau)  params.append('niveau',  filters.niveau)
    fetch(`${BASE_URL}/dashboard?${params}`)
      .then(r => r.json()).then(d => { const v = d.data || d; setStats({ ...stats, ...v }) })
      .finally(() => setLoading(false))
  }, [filters])

  const handleFilterChange = (name: string, option: SingleValue<SelectOption>) => {
    setFilters(prev => ({ ...prev, [name]: option?.value === 'all' ? '' : (option?.value || '') }))
  }

  const { presence, absence, lateRate, totalPresences, totalAbsences, totalLate, totalOnTime, monthlyPresence, monthlyAbsence, monthlyLate } = stats
  const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']

  const kpiCards = [
    { label: 'Présence',  value: `${presence}%`,  sub: `${totalPresences} présent(s)`,  bg: '#28a745', icon: cilUser  },
    { label: 'Retard',    value: `${lateRate}%`,   sub: `${totalLate} en retard`,         bg: '#fd7e14', icon: cilClock },
    { label: 'Absence',   value: `${absence}%`,    sub: `${totalAbsences} absent(s)`,     bg: '#dc3545', icon: cilX    },
  ]

  return (
    <div style={{ padding: '24px', background: '#f4f6f9', minHeight: '100vh' }}>
      <h3 style={{ fontWeight: 700, marginBottom: '24px', color: '#212529' }}>Dashboard Présences</h3>

      {/* ── Bandeau statut capteur ─────────────────────────────────── */}
      {sensor && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: sensor.active ? '#f0fdf4' : '#f8fafc',
          border: `1px solid ${sensor.active ? '#bbf7d0' : '#e2e8f0'}`,
          borderLeft: `4px solid ${sensor.active ? '#16a34a' : '#94a3b8'}`,
          borderRadius: '10px', padding: '12px 18px', marginBottom: '20px',
        }}>
          <CIcon icon={sensor.active ? cilWifiSignal4 : cilWifiSignalOff}
            style={{ color: sensor.active ? '#16a34a' : '#94a3b8', fontSize: '20px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: '13px', color: sensor.active ? '#15803d' : '#64748b' }}>
              Capteur {sensor.active ? 'actif' : 'inactif'}
              {sensor.active && sensor.matiere && ` — ${sensor.matiere} · ${sensor.start_time}–${sensor.end_time}`}
            </span>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>{sensor.message}</div>
          </div>
          {sensor.active && (
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
              background: sensor.on_time ? '#dcfce7' : '#fef3c7',
              color:      sensor.on_time ? '#15803d' : '#92400e',
            }}>
              {sensor.on_time ? "À l'heure" : 'Retards en cours'}
            </span>
          )}
        </div>
      )}

      <CCard className="shadow-sm border-0">
        <CCardBody>

          {/* ── KPI cards — 3 cards style photo ──────────────────────── */}
          <CRow className="mb-4 g-3">
            {kpiCards.map(({ label, value, sub, bg, icon }) => (
              <CCol md={4} key={label}>
                <div style={{
                  background: bg,
                  borderRadius: '0px',
                  padding: '14px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#fff',
                  minHeight: '80px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', opacity: 0.9 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1.1 }}>
                      {value}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.75 }}>
                      {sub}
                    </div>
                  </div>
                  <CIcon
                    icon={icon}
                    style={{ width: '40px', height: '40px', opacity: 0.4 }}
                  />
                </div>
              </CCol>
            ))}
          </CRow>

          {/* ── Jauge ponctualité ─────────────────────────────────────── */}
          {(totalPresences > 0) && (
            <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <CCardBody style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#212529' }}>Ponctualité des présents</span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {totalOnTime} à l'heure · {totalLate} en retard sur {totalPresences} présents
                  </span>
                </div>
                <div style={{ height: '12px', borderRadius: '8px', background: '#fee2e2', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '8px',
                    width: `${totalPresences > 0 ? Math.round((totalOnTime / totalPresences) * 100) : 0}%`,
                    background: 'linear-gradient(90deg, #16a34a, #22c55e)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 500 }}>
                    {totalPresences > 0 ? Math.round((totalOnTime / totalPresences) * 100) : 0}% à l'heure
                  </span>
                  <span style={{ color: '#dc2626', fontWeight: 500 }}>
                    {lateRate}% en retard
                  </span>
                </div>
              </CCardBody>
            </CCard>
          )}

          {/* ── Filtres ───────────────────────────────────────────────── */}
          <CCard className="mb-4 border-0 shadow-sm">
            <CCardBody>
              <AttendanceFilter
                filterOptions={filterOptions}
                selectedYear={filters.year}
                selectedFiliere={filters.filiere}
                selectedNiveau={filters.niveau}
                onFilterChange={handleFilterChange}
              />
            </CCardBody>
          </CCard>

          {loading && <div className="text-center py-4"><CSpinner color="primary" /></div>}

          {!loading && (
            <>
              {/* ── Bar chart — 3 datasets, style photo ───────────────── */}
              <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                <div style={{ padding: '16px 20px', fontWeight: 600, fontSize: '14px', color: '#212529' }}>
                  Tendance mensuelle — Présences, Retards &amp; Absences
                </div>
                <CCardBody style={{ paddingTop: 0 }}>
                  <CChartBar
                    style={{ height: '380px' }}
                    data={{
                      labels: MONTHS,
                      datasets: [
                        {
                          label: 'Présence (%)',
                          data: monthlyPresence,
                          backgroundColor: '#28a745',
                          borderRadius: 0,
                          barPercentage: 0.5,
                          categoryPercentage: 0.75,
                        },
                        {
                          label: 'Retards (nb)',
                          data: monthlyLate,
                          backgroundColor: '#fd7e14',
                          borderRadius: 0,
                          barPercentage: 0.5,
                          categoryPercentage: 0.75,
                        },
                        {
                          label: 'Absence (%)',
                          data: monthlyAbsence,
                          backgroundColor: '#dc3545',
                          borderRadius: 0,
                          barPercentage: 0.5,
                          categoryPercentage: 0.75,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            usePointStyle: true,
                            pointStyle: 'rect',
                            padding: 20,
                            font: { size: 12 },
                          },
                        },
                        tooltip: { mode: 'index', intersect: false },
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: { font: { size: 11 } },
                        },
                        y: {
                          beginAtZero: true,
                          grid: { color: '#f0f0f0' },
                          ticks: { font: { size: 11 } },
                        },
                      },
                    }}
                  />
                </CCardBody>
              </CCard>

              {/* ── Doughnut présence/absence ──────────────────────────── */}
              <CRow className="g-3">
                <CCol md={6}>
                  <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '14px', color: '#212529' }}>
                      Répartition globale
                    </div>
                    <CCardBody style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ width: '260px' }}>
                        <CChartDoughnut
                          data={{
                            labels: ['Présents', 'Absents'],
                            datasets: [{ data: [presence, absence], backgroundColor: ['#22c55e', '#ef4444'], borderWidth: 0 }],
                          }}
                          options={{ plugins: { legend: { position: 'bottom' } } }}
                        />
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={6}>
                  <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '14px', color: '#212529' }}>
                      Ponctualité des présents
                    </div>
                    <CCardBody style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ width: '260px' }}>
                        <CChartDoughnut
                          data={{
                            labels: ["À l'heure", 'En retard'],
                            datasets: [{ data: [totalOnTime, totalLate], backgroundColor: ['#16a34a', '#f59e0b'], borderWidth: 0 }],
                          }}
                          options={{ plugins: { legend: { position: 'bottom' } } }}
                        />
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
            </>
          )}

        </CCardBody>
      </CCard>
    </div>
  )
}

export default Dashboard
