import { useState, useEffect, useMemo } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CAlert,
  CWidgetStatsF,
  CBadge,
  CFormSelect,
  CProgress,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPeople,
  cilBriefcase,
  cilArrowTop,
  cilStar,
  cilGroup,
  cilBuilding,
  cilBook,
  cilBarChart,
  cilReload,
} from '@coreui/icons'
import AlumniService from '@/services/alumni.service'
import type { AlumniDashboardStats } from '@/services/alumni.service'

// ── Palette de couleurs pour les graphiques ──────────────────────────────────
const PALETTE = ['primary', 'success', 'warning', 'danger', 'info', 'secondary']

// ── Barre horizontale simple ──────────────────────────────────────────────────
const HBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mb-2">
      <div className="d-flex justify-content-between mb-1">
        <span className="small" style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <span className="small fw-semibold">{value}</span>
      </div>
      <CProgress value={pct} color={color} style={{ height: 6 }} />
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({
  title, value, subtitle, icon, color, suffix = ''
}: {
  title: string; value: string | number; subtitle?: string; icon: any; color: string; suffix?: string
}) => (
  <CWidgetStatsF
    className="mb-0 h-100"
    color={color}
    icon={<CIcon icon={icon} height={24} />}
    title={title}
    value={`${value}${suffix}`}
    footer={subtitle ? <small className="text-medium-emphasis">{subtitle}</small> : undefined}
  />
)

// ── Composant principal ───────────────────────────────────────────────────────
const AlumniDashboard = () => {
  const [stats, setStats] = useState<AlumniDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterEcole, setFilterEcole] = useState('')
  const [filterAnnee, setFilterAnnee] = useState('')

  const anneesDisponibles = useMemo(() => {
    if (!stats) return []
    return stats.par_annee_sortie.map(a => a.annee).sort((a, b) => Number(b) - Number(a))
  }, [stats])

  const loadStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await AlumniService.getDashboard({
        ecole: filterEcole || undefined,
        annee_sortie: filterAnnee || undefined,
      })
      setStats(data)
    } catch (e: any) {
      setError(e.message || 'Impossible de charger les statistiques Alumni')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStats() }, [filterEcole, filterAnnee])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error) {
    return (
      <CAlert color="danger">
        {error}
        <CButton color="danger" variant="outline" size="sm" className="ms-3" onClick={loadStats}>
          <CIcon icon={cilReload} className="me-1" /> Réessayer
        </CButton>
      </CAlert>
    )
  }

  if (!stats) return null

  const { totaux } = stats
  const maxFormation = Math.max(...stats.top_formations.map(f => f.total), 1)
  const maxSecteur   = Math.max(...stats.top_secteurs_emploi.map(s => s.total), 1)
  const maxSituation = Math.max(...stats.par_situation.map(s => s.total), 1)
  const maxAnnee     = Math.max(...stats.par_annee_sortie.map(a => a.total), 1)

  return (
    <>
      {/* En-tête + filtres */}
      <CRow className="mb-4 align-items-end g-3">
        <CCol>
          <h4 className="fw-bold mb-0">Dashboard Alumni</h4>
          <p className="text-muted small mb-0">Suivi et indicateurs de la communauté Alumni CAP-EPAC</p>
        </CCol>
        <CCol xs="auto" className="d-flex gap-2">
          <CFormSelect
            size="sm"
            value={filterEcole}
            onChange={e => setFilterEcole(e.target.value)}
            style={{ width: 130 }}
          >
            <option value="">Toutes écoles</option>
            <option value="CAP">CAP</option>
            <option value="EPAC">EPAC</option>
          </CFormSelect>
          <CFormSelect
            size="sm"
            value={filterAnnee}
            onChange={e => setFilterAnnee(e.target.value)}
            style={{ width: 130 }}
          >
            <option value="">Toutes années</option>
            {anneesDisponibles.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </CFormSelect>
          <CButton size="sm" color="secondary" variant="outline" onClick={loadStats}>
            <CIcon icon={cilReload} />
          </CButton>
        </CCol>
      </CRow>

      {/* ── KPI principaux ── */}
      <CRow className="g-3 mb-4">
        <CCol sm={6} xl={3}>
          <KpiCard
            title="Total Alumni"
            value={totaux.total}
            subtitle={`+${totaux.recents_30j} ces 30 derniers jours`}
            icon={cilPeople}
            color="primary"
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <KpiCard
            title="Taux d'insertion"
            value={totaux.taux_insertion}
            suffix="%"
            subtitle={`${totaux.inseres} alumni insérés`}
            icon={cilArrowTop}
            color="success"
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <KpiCard
            title="Alumni CAP"
            value={totaux.cap}
            subtitle={totaux.total > 0 ? `${Math.round((totaux.cap / totaux.total) * 100)}% du total` : ''}
            icon={cilStar}
            color="info"
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <KpiCard
            title="Alumni EPAC"
            value={totaux.epac}
            subtitle={totaux.total > 0 ? `${Math.round((totaux.epac / totaux.total) * 100)}% du total` : ''}
            icon={cilGroup}
            color="warning"
          />
        </CCol>
      </CRow>

      {/* ── Ligne 2 : Situation pro + Répartition école ── */}
      <CRow className="g-3 mb-4">
        {/* Situation professionnelle */}
        <CCol lg={8}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="bg-transparent border-0 pb-0">
              <CIcon icon={cilBriefcase} className="me-2 text-primary" />
              <strong>Situation professionnelle</strong>
            </CCardHeader>
            <CCardBody>
              {stats.par_situation.length === 0 ? (
                <p className="text-muted">Aucune donnée</p>
              ) : (
                <CRow className="g-2 mb-3">
                  {stats.par_situation.map((s, i) => {
                    const pct = totaux.total > 0 ? Math.round((s.total / totaux.total) * 100) : 0
                    return (
                      <CCol xs={6} md={4} key={i}>
                        <div className={`p-3 rounded-2 bg-${PALETTE[i % PALETTE.length]} bg-opacity-10 text-center`}>
                          <h4 className={`fw-bold text-${PALETTE[i % PALETTE.length]} mb-0`}>{s.total}</h4>
                          <small className="text-muted d-block" style={{ fontSize: '0.72rem', lineHeight: 1.2 }}>
                            {s.situation}
                          </small>
                          <CBadge color={PALETTE[i % PALETTE.length] as any} className="mt-1">{pct}%</CBadge>
                        </div>
                      </CCol>
                    )
                  })}
                </CRow>
              )}

              <div className="mt-2">
                {stats.par_situation.slice(0, 6).map((s, i) => (
                  <HBar
                    key={i}
                    label={s.situation}
                    value={s.total}
                    max={maxSituation}
                    color={PALETTE[i % PALETTE.length]}
                  />
                ))}
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Type d'emploi + Civilité */}
        <CCol lg={4}>
          <CRow className="g-3 h-100">
            <CCol xs={12}>
              <CCard className="border-0 shadow-sm">
                <CCardHeader className="bg-transparent border-0 pb-0">
                  <strong>Type d'emploi</strong>
                </CCardHeader>
                <CCardBody className="pt-2">
                  {Object.entries(stats.par_type_emploi).map(([type, count], i) => {
                    const pct = totaux.total > 0 ? Math.round((count / totaux.total) * 100) : 0
                    const colors: Record<string, string> = {
                      Employeur: 'success',
                      Employe: 'primary',
                      Aucun: 'secondary',
                    }
                    return (
                      <div key={type} className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <CBadge color={colors[type] || 'secondary' as any}>{type}</CBadge>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <strong>{count}</strong>
                          <small className="text-muted">({pct}%)</small>
                        </div>
                      </div>
                    )
                  })}
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12}>
              <CCard className="border-0 shadow-sm">
                <CCardHeader className="bg-transparent border-0 pb-0">
                  <strong>Répartition Hommes / Femmes</strong>
                </CCardHeader>
                <CCardBody className="pt-2">
                  {Object.entries(stats.par_civilite).map(([civ, count]) => {
                    const pct = totaux.total > 0 ? Math.round((count / totaux.total) * 100) : 0
                    return (
                      <div key={civ} className="mb-2">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small">{civ === 'Monsieur' ? 'Hommes' : 'Femmes'}</span>
                          <span className="small fw-semibold">{count} ({pct}%)</span>
                        </div>
                        <CProgress
                          value={pct}
                          color={civ === 'Monsieur' ? 'info' : 'danger'}
                          style={{ height: 8 }}
                        />
                      </div>
                    )
                  })}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CCol>
      </CRow>

      {/* ── Ligne 3 : Formations + Secteurs ── */}
      <CRow className="g-3 mb-4">
        {/* Top formations */}
        <CCol md={6}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="bg-transparent border-0 pb-0">
              <CIcon icon={cilBook} className="me-2 text-warning" />
              <strong>Top formations</strong>
            </CCardHeader>
            <CCardBody>
              {stats.top_formations.length === 0 ? (
                <p className="text-muted">Aucune donnée</p>
              ) : (
                stats.top_formations.map((f, i) => (
                  <HBar
                    key={i}
                    label={f.formation}
                    value={f.total}
                    max={maxFormation}
                    color={PALETTE[i % PALETTE.length]}
                  />
                ))
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* Top secteurs d'emploi */}
        <CCol md={6}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="bg-transparent border-0 pb-0">
              <CIcon icon={cilBuilding} className="me-2 text-success" />
              <strong>Secteurs d'emploi</strong>
            </CCardHeader>
            <CCardBody>
              {stats.top_secteurs_emploi.length === 0 ? (
                <p className="text-muted">Aucune donnée</p>
              ) : (
                stats.top_secteurs_emploi.map((s, i) => (
                  <HBar
                    key={i}
                    label={s.secteur}
                    value={s.total}
                    max={maxSecteur}
                    color={PALETTE[i % PALETTE.length]}
                  />
                ))
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ── Ligne 4 : Évolution par année de sortie ── */}
      <CRow className="g-3 mb-4">
        <CCol xs={12}>
          <CCard className="border-0 shadow-sm">
            <CCardHeader className="bg-transparent border-0 pb-0">
              <CIcon icon={cilBarChart} className="me-2 text-info" />
              <strong>Évolution par année de sortie</strong>
            </CCardHeader>
            <CCardBody>
              {stats.par_annee_sortie.length === 0 ? (
                <p className="text-muted">Aucune donnée</p>
              ) : (
                <CTable hover small responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Promotion (sortie)</CTableHeaderCell>
                      <CTableHeaderCell>Nombre d'alumni</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '50%' }}>Répartition</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {stats.par_annee_sortie
                      .slice()
                      .sort((a, b) => Number(b.annee) - Number(a.annee))
                      .map((row, i) => {
                        const pct = maxAnnee > 0 ? Math.round((row.total / maxAnnee) * 100) : 0
                        return (
                          <CTableRow key={i}>
                            <CTableDataCell className="fw-semibold">{row.annee}</CTableDataCell>
                            <CTableDataCell>
                              <CBadge color="primary">{row.total}</CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              <CProgress value={pct} color="primary" style={{ height: 8 }} />
                            </CTableDataCell>
                          </CTableRow>
                        )
                      })}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ── Ligne 5 : Secteurs professionnels ── */}
      {stats.top_secteurs_prof.length > 0 && (
        <CRow className="g-3">
          <CCol xs={12}>
            <CCard className="border-0 shadow-sm">
              <CCardHeader className="bg-transparent border-0 pb-0">
                <CIcon icon={cilBriefcase} className="me-2 text-danger" />
                <strong>Secteurs professionnels</strong>
              </CCardHeader>
              <CCardBody>
                <CRow className="g-2">
                  {stats.top_secteurs_prof.map((s, i) => (
                    <CCol xs={6} md={4} lg={3} key={i}>
                      <div className={`p-2 rounded bg-${PALETTE[i % PALETTE.length]} bg-opacity-10 text-center`}>
                        <div className={`fw-bold text-${PALETTE[i % PALETTE.length]}`}>{s.total}</div>
                        <small className="text-muted" style={{ fontSize: '0.72rem' }}>{s.secteur}</small>
                      </div>
                    </CCol>
                  ))}
                </CRow>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}
    </>
  )
}

export default AlumniDashboard
