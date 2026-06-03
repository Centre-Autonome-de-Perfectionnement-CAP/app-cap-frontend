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

// ── Ordre académique Sep(8) → Août(7) ─────────────────────────────────────
// Index JS : Jan=0 … Déc=11
const ACADEMIC_MONTHS        = ['Sep','Oct','Nov','Déc','Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août']
const ACADEMIC_MONTH_INDICES = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7]

// ── Tooltip doughnut : affiche % + nb ────────────────────────────────────
const doughnutTooltip = (total: number) => ({
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { font: { size: 12 }, padding: 16 },
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          const val = ctx.parsed as number
          const pct = total > 0 ? Math.round((val / total) * 100) : 0
          return ` ${ctx.label} : ${val} (${pct}%)`
        },
      },
    },
  },
})

const Dashboard = () => {
  const [filterOptions, setFilterOptions] = useState({
    annees: [] as string[], filieres: [] as string[], niveaux: [] as string[],
  })
  const [filters, setFilters] = useState<Filters>({ year: '', filiere: '', niveau: '' })
  const [stats, setStats] = useState({
    presence: 0,          // % global présence
    absence: 0,           // % global absence
    lateRate: 0,          // % global retard (sur présents)
    totalPresences: 0,
    totalAbsences: 0,
    totalOnTime: 0,
    totalLate: 0,
    // Ces 3 tableaux arrivent déjà en % depuis le backend (index 0=Jan … 11=Déc)
    monthlyPresence: Array(12).fill(0) as number[],
    monthlyAbsence:  Array(12).fill(0) as number[],
    monthlyLate:     Array(12).fill(0) as number[],
  })
  const [sensor, setSensor]   = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // ── Filtres disponibles ───────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE_URL}/filters`).then(r => r.json()).then(d => {
      if (d.success) setFilterOptions({
        annees:   d.data.annees   || [],
        filieres: d.data.filieres || [],
        niveaux:  d.data.niveaux  || [],
      })
    })
  }, [])

  // ── Statut capteur (rafraîchi toutes les 30s) ─────────────────────────
  useEffect(() => {
    const fetchSensor = () =>
      fetch(`${BASE_URL}/sensor-status`).then(r => r.json())
        .then(d => { if (d.success) setSensor(d.data) }).catch(() => {})
    fetchSensor()
    const t = setInterval(fetchSensor, 30000)
    return () => clearInterval(t)
  }, [])

  // ── Stats dashboard ───────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.year)    params.append('annee',   filters.year)
    if (filters.filiere) params.append('filiere', filters.filiere)
    if (filters.niveau)  params.append('niveau',  filters.niveau)
    fetch(`${BASE_URL}/dashboard?${params}`)
      .then(r => r.json())
      .then(d => {
        const v = d.data || d
        setStats(prev => ({
          ...prev,
          presence:        v.presence        ?? 0,
          absence:         v.absence         ?? 0,
          lateRate:        v.lateRate        ?? 0,
          totalPresences:  v.totalPresences  ?? 0,
          totalAbsences:   v.totalAbsences   ?? 0,
          totalOnTime:     v.totalOnTime     ?? 0,
          totalLate:       v.totalLate       ?? 0,
          monthlyPresence: v.monthlyPresence ?? Array(12).fill(0),
          monthlyAbsence:  v.monthlyAbsence  ?? Array(12).fill(0),
          monthlyLate:     v.monthlyLate     ?? Array(12).fill(0),
        }))
      })
      .finally(() => setLoading(false))
  }, [filters])

  const handleFilterChange = (name: string, option: SingleValue<SelectOption>) => {
    setFilters(prev => ({ ...prev, [name]: option?.value === 'all' ? '' : (option?.value || '') }))
  }

  const {
    presence, absence, lateRate,
    totalPresences, totalAbsences, totalOnTime, totalLate,
    monthlyPresence, monthlyAbsence, monthlyLate,
  } = stats

  // ── Réordonner en ordre académique Sep→Août ───────────────────────────
  // monthlyPresence / monthlyAbsence / monthlyLate sont déjà en %
  const acPresence = ACADEMIC_MONTH_INDICES.map(i => monthlyPresence[i] ?? 0)
  const acAbsence  = ACADEMIC_MONTH_INDICES.map(i => monthlyAbsence[i]  ?? 0)
  const acLate     = ACADEMIC_MONTH_INDICES.map(i => monthlyLate[i]     ?? 0)

  // ── % ponctualité ─────────────────────────────────────────────────────
  const pctOnTime = totalPresences > 0 ? Math.round((totalOnTime / totalPresences) * 100) : 0
  const pctLate   = totalPresences > 0 ? Math.round((totalLate   / totalPresences) * 100) : 0

  // Les 3 taux sont sur le même dénominateur (total enregistrements)
  // → présence + absence = 100%, lateRate = % de retardataires sur le total
  const totalAll = totalPresences + totalAbsences
  const kpiCards = [
    { label: 'Présence', value: `${presence}%`, sub: `${totalPresences} / ${totalAll} enreg.`,  bg: '#28a745', icon: cilUser  },
    { label: 'Retard',   value: `${lateRate}%`, sub: `${totalLate} en retard`,                   bg: '#fd7e14', icon: cilClock },
    { label: 'Absence',  value: `${absence}%`,  sub: `${totalAbsences} / ${totalAll} enreg.`,    bg: '#dc3545', icon: cilX    },
  ]

  return (
    <div style={{ padding: '24px', background: '#f4f6f9', minHeight: '100vh' }}>
      <h3 style={{ fontWeight: 700, marginBottom: '24px', color: '#212529' }}>Dashboard Présences</h3>

      {/* ── Bandeau capteur ─────────────────────────────────────────── */}
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

          {/* ── KPI cards ──────────────────────────────────────────── */}
          <CRow className="mb-4 g-3">
            {kpiCards.map(({ label, value, sub, bg, icon }) => (
              <CCol md={4} key={label}>
                <div style={{
                  background: bg, padding: '14px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  color: '#fff', minHeight: '80px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  borderRadius: '4px',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', opacity: 0.9 }}>{label}</div>
                    <div style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
                    <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.75 }}>{sub}</div>
                  </div>
                  <CIcon icon={icon} style={{ width: '40px', height: '40px', opacity: 0.4 }} />
                </div>
              </CCol>
            ))}
          </CRow>

          {/* ── Jauge ponctualité (avec %) ────────────────────────── */}
          {totalPresences > 0 && (
            <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
              <CCardBody style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#212529' }}>
                    Ponctualité des présents
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {totalPresences} présent(s) au total
                  </span>
                </div>
                {/* Barre de progression */}
                <div style={{ height: '14px', borderRadius: '8px', background: '#fee2e2', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    height: '100%', borderRadius: '8px',
                    width: `${pctOnTime}%`,
                    background: 'linear-gradient(90deg, #16a34a, #22c55e)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                {/* Labels % sous la barre */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a', marginRight: '6px' }} />
                    <strong style={{ color: '#15803d', fontSize: '13px' }}>{pctOnTime}%</strong>
                    <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '4px' }}>à l'heure ({totalOnTime})</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', marginRight: '6px' }} />
                    <strong style={{ color: '#92400e', fontSize: '13px' }}>{pctLate}%</strong>
                    <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '4px' }}>en retard ({totalLate})</span>
                  </div>
                </div>
              </CCardBody>
            </CCard>
          )}

          {/* ── Filtres ───────────────────────────────────────────── */}
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

          {loading && (
            <div className="text-center py-5">
              <CSpinner color="primary" />
              <div className="mt-2 text-muted" style={{ fontSize: '13px' }}>Chargement des données...</div>
            </div>
          )}

          {!loading && (
            <>
              {/* ── Bar chart Sep→Août (tout en %) ───────────────── */}
              <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                <div style={{ padding: '16px 20px 4px', fontWeight: 600, fontSize: '14px', color: '#212529' }}>
                  Taux mensuel — Présences · Retards · Absences
                  <span style={{ fontWeight: 400, fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>
                    (année académique Sep → Juil)
                  </span>
                </div>
                <CCardBody style={{ paddingTop: '8px' }}>
                  <CChartBar
                    style={{ height: '380px' }}
                    data={{
                      labels: ACADEMIC_MONTHS,
                      datasets: [
                        {
                          label: 'Présence (%)',
                          data: acPresence,
                          backgroundColor: '#28a745',
                          borderRadius: 2,
                          barPercentage: 0.55,
                          categoryPercentage: 0.75,
                        },
                        {
                          label: 'Retard (%)',
                          data: acLate,
                          backgroundColor: '#fd7e14',
                          borderRadius: 2,
                          barPercentage: 0.55,
                          categoryPercentage: 0.75,
                        },
                        {
                          label: 'Absence (%)',
                          data: acAbsence,
                          backgroundColor: '#dc3545',
                          borderRadius: 2,
                          barPercentage: 0.55,
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
                        tooltip: {
                          mode: 'index',
                          intersect: false,
                          callbacks: {
                            // Afficher le % dans le tooltip
                            label: (ctx: any) => ` ${ctx.dataset.label} : ${ctx.parsed.y}%`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: { font: { size: 11 } },
                        },
                        y: {
                          beginAtZero: true,
                          max: 100,
                          grid: { color: '#f0f0f0' },
                          ticks: {
                            font: { size: 11 },
                            callback: (v: any) => `${v}%`,
                            stepSize: 20,
                          },
                        },
                      },
                    }}
                  />
                </CCardBody>
              </CCard>

              {/* ── Doughnuts ─────────────────────────────────────── */}
              <CRow className="g-3">

                {/* Répartition globale Présents / Absents */}
                <CCol md={6}>
                  <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '14px', color: '#212529' }}>
                      Répartition globale
                      <span style={{ fontWeight: 400, fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>
                        {totalPresences + totalAbsences} enreg.
                      </span>
                    </div>
                    <CCardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <div style={{ width: '220px' }}>
                        <CChartDoughnut
                          data={{
                            // On passe les % directement pour que le graphe soit en %
                            labels: [`Présents (${presence}%)`, `Absents (${absence}%)`],
                            datasets: [{
                              data: [presence, absence],
                              backgroundColor: ['#22c55e', '#ef4444'],
                              borderWidth: 2,
                              borderColor: '#fff',
                            }],
                          }}
                          options={{
                            plugins: {
                              legend: {
                                position: 'bottom' as const,
                                labels: { font: { size: 12 }, padding: 14 },
                              },
                              tooltip: {
                                callbacks: {
                                  label: (ctx: any) => ` ${ctx.label} — ${ctx.parsed}%`,
                                },
                              },
                            },
                          }}
                        />
                      </div>
                      {/* Légende textuelle */}
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                        <span>
                          <strong style={{ color: '#16a34a' }}>{presence}%</strong>
                          <span style={{ color: '#64748b' }}> présents ({totalPresences})</span>
                        </span>
                        <span>
                          <strong style={{ color: '#dc2626' }}>{absence}%</strong>
                          <span style={{ color: '#64748b' }}> absents ({totalAbsences})</span>
                        </span>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>

                {/* Ponctualité À l'heure / En retard — tout en % */}
                <CCol md={6}>
                  <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '14px', color: '#212529' }}>
                      Ponctualité des présents
                      <span style={{ fontWeight: 400, fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>
                        {totalPresences} présent(s)
                      </span>
                    </div>
                    <CCardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      {totalPresences > 0 ? (
                        <>
                          <div style={{ width: '220px' }}>
                            <CChartDoughnut
                              data={{
                                // Données en % pour que le graphe reflète les proportions
                                labels: [`À l'heure (${pctOnTime}%)`, `En retard (${pctLate}%)`],
                                datasets: [{
                                  data: [pctOnTime, pctLate],
                                  backgroundColor: ['#16a34a', '#f59e0b'],
                                  borderWidth: 2,
                                  borderColor: '#fff',
                                }],
                              }}
                              options={{
                                plugins: {
                                  legend: {
                                    position: 'bottom' as const,
                                    labels: { font: { size: 12 }, padding: 14 },
                                  },
                                  tooltip: {
                                    callbacks: {
                                      label: (ctx: any) => ` ${ctx.label} — ${ctx.parsed}%`,
                                    },
                                  },
                                },
                              }}
                            />
                          </div>
                          {/* Légende textuelle avec % ET nb */}
                          <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                            <span>
                              <strong style={{ color: '#15803d' }}>{pctOnTime}%</strong>
                              <span style={{ color: '#64748b' }}> à l'heure ({totalOnTime})</span>
                            </span>
                            <span>
                              <strong style={{ color: '#92400e' }}>{pctLate}%</strong>
                              <span style={{ color: '#64748b' }}> en retard ({totalLate})</span>
                            </span>
                          </div>
                        </>
                      ) : (
                        <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>
                          Aucune donnée de présence
                        </div>
                      )}
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
