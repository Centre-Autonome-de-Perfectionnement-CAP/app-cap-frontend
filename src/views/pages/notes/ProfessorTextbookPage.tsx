/**
 * ProfessorTextbookPage.tsx — Page Cahier de texte (vue Professeur)
 *
 * CORRECTIONS APPLIQUÉES :
 * 1. handlePublish / handleUnpublish retournent désormais une vraie Promise<void>
 *    → le .then(() => setDetailEntry(null)) dans la modal fonctionne correctement.
 * 2. CAlert "dismissible" remplacé par fermeture manuelle (compatibilité CoreUI v4/v5).
 * 3. Toutes les classes Bootstrap 5.3 "subtle" remplacées par des variantes inline
 *    compatibles avec CoreUI (bg-opacity, etc.).
 * 4. Gestion du cas où res.data est un tableau enveloppé dans { data: [] } ou pas.
 * 5. useCallback ajouté sur loadStats / loadPrograms / loadEntries pour éviter
 *    les boucles de re-render avec useEffect.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import Select from 'react-select'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CAlert,
  CButton,
  CBadge,
  CCol,
  CRow,
  CSpinner,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBook,
  cilCheckCircle,
  cilClock,
  cilDescription,
  cilReload,
  cilWarning,
  cilX,
} from '@coreui/icons'
import NotesService from '@/services/notes.service'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TextbookStats {
  total_hours_published: number
  total_hours_draft: number
  count_published: number
  count_draft: number
  programs_count: number
}

interface TextbookProgram {
  id: number
  uuid: string
  course_name: string
  course_code: string
  class_name: string
  department_name: string
  academic_year: string
  semester: number | null
  entries_published: number
  entries_draft: number
  entries_total: number
}

interface TextbookEntry {
  id: number
  program_id: number
  session_date: string | null
  start_time: string | null
  end_time: string | null
  hours_taught: number | null
  session_title: string
  content_covered: string
  objectives: string | null
  teaching_methods: string | null
  homework: string | null
  homework_due_date: string | null
  students_present: number | null
  students_absent: number | null
  observations: string | null
  status: 'draft' | 'published' | 'validated'
  published_at: string | null
  validated_at: string | null
  created_at: string | null
}

interface ProgramStats {
  total_hours: number
  hours_published: number
  hours_draft: number
  count_published: number
  count_draft: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  published: { label: 'Signé',   color: 'success' } as const,
  validated: { label: 'Validé',   color: 'info'    } as const,
  draft:     { label: 'En attente',color: 'warning'  } as const,
}

const statusLabel = (status: TextbookEntry['status']) =>
  STATUS_CONFIG[status] ?? STATUS_CONFIG.draft

const formatDate = (d: string | null) => {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  } catch {
    return d
  }
}

const formatTime = (t: string | null) => {
  if (!t) return '—'
  return t.slice(0, 5)
}

/** Extrait le tableau de données depuis la réponse API quelle que soit l'enveloppe */
const extractArray = (res: any): any[] => {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res.data)) return res.data
  if (res.success && Array.isArray(res.data)) return res.data
  return []
}

/** Extrait un objet depuis la réponse API */
const extractData = (res: any): any => {
  if (!res) return null
  if (res.success !== undefined) return res.data ?? null
  return res
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant StatCard
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: any
  iconBg: string
  iconColor: string
  label: string
  value: string | number
  sub?: string
  loading: boolean
}

const StatCard = ({ icon, iconBg, iconColor, label, value, sub, loading }: StatCardProps) => (
  <CCard className="border-0 shadow-sm h-100">
    <CCardBody className="d-flex align-items-center gap-3">
      <div
        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: 48, height: 48, background: iconBg }}
      >
        <CIcon icon={icon} style={{ color: iconColor, width: 24, height: 24 }} />
      </div>
      <div>
        <div className="text-muted small">{label}</div>
        <div className="fw-bold fs-4" style={{ color: iconColor }}>
          {loading ? <CSpinner size="sm" color="secondary" /> : value}
        </div>
        {sub && !loading && (
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{sub}</div>
        )}
      </div>
    </CCardBody>
  </CCard>
)

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const ProfessorTextbookPage = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [stats,         setStats]         = useState<TextbookStats | null>(null)
  const [statsLoading,  setStatsLoading]  = useState(true)

  const [programs,         setPrograms]         = useState<TextbookProgram[]>([])
  const [programsLoading,  setProgramsLoading]  = useState(true)
  const [selectedProgramId,setSelectedProgramId]= useState<number | null>(null)

  const [entries,        setEntries]        = useState<TextbookEntry[]>([])
  const [programStats,   setProgramStats]   = useState<ProgramStats | null>(null)
  const [entriesLoading, setEntriesLoading] = useState(false)

  const [publishingId,   setPublishingId]   = useState<number | null>(null)
  const [unpublishingId, setUnpublishingId] = useState<number | null>(null)
  const [detailEntry,    setDetailEntry]    = useState<TextbookEntry | null>(null)

  const [error,    setError]    = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState(0)   // force remount CAlert pour reset

  // ── Loaders ────────────────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res: any = await NotesService.getTextbookStats()
      const data = extractData(res)
      if (data) setStats(data)
    } catch {
      // non bloquant
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const loadPrograms = useCallback(async () => {
    setProgramsLoading(true)
    try {
      const res: any = await NotesService.getTextbookPrograms()
      setPrograms(extractArray(res))
    } catch {
      setError('Impossible de charger les programmes.')
    } finally {
      setProgramsLoading(false)
    }
  }, [])

  const loadEntries = useCallback(async (programId: number) => {
    setEntriesLoading(true)
    setError(null)
    try {
      const res: any = await NotesService.getTextbookEntries(programId)
      const data = extractData(res)
      setEntries(Array.isArray(data?.entries) ? data.entries : [])
      setProgramStats(data?.stats ?? null)
    } catch {
      setError('Impossible de charger les entrées.')
      setErrorKey(k => k + 1)
    } finally {
      setEntriesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    loadPrograms()
  }, [loadStats, loadPrograms])

  // ── Sélection programme ────────────────────────────────────────────────────

  const handleSelectProgram = (programId: number | null) => {
    setSelectedProgramId(programId)
    setEntries([])
    setProgramStats(null)
    setError(null)
    if (programId) loadEntries(programId)
  }

  // ── Publier ────────────────────────────────────────────────────────────────
  // ⚠️ CORRECTION : retourne une Promise<void> explicite pour permettre .then() dans la modal

  const handlePublish = useCallback(async (entry: TextbookEntry): Promise<void> => {
    setPublishingId(entry.id)
    try {
      const res: any = await NotesService.publishTextbookEntry(entry.id)
      const updated = extractData(res)
      if (updated) {
        setEntries(prev => prev.map(e => e.id === entry.id ? updated : e))
      }
      await loadStats()
      if (selectedProgramId) await loadEntries(selectedProgramId)
    } catch {
      setError('Erreur lors de la signature.')
      setErrorKey(k => k + 1)
    } finally {
      setPublishingId(null)
    }
  }, [loadStats, loadEntries, selectedProgramId])

  // ── Dépublier ──────────────────────────────────────────────────────────────

  const handleUnpublish = useCallback(async (entry: TextbookEntry): Promise<void> => {
    setUnpublishingId(entry.id)
    try {
      const res: any = await NotesService.unpublishTextbookEntry(entry.id)
      const updated = extractData(res)
      if (updated) {
        setEntries(prev => prev.map(e => e.id === entry.id ? updated : e))
      }
      await loadStats()
      if (selectedProgramId) await loadEntries(selectedProgramId)
    } catch {
      setError('Erreur lors de la dépublication.')
      setErrorKey(k => k + 1)
    } finally {
      setUnpublishingId(null)
    }
  }, [loadStats, loadEntries, selectedProgramId])

  // ── Options Select ─────────────────────────────────────────────────────────

  const programOptions = useMemo(
    () => programs.map(p => ({
      value: p.id,
      label: `${p.course_name}${p.course_code ? ` (${p.course_code})` : ''} - ${p.department_name} - ${p.class_name} - ${p.academic_year} - Semestre ${p.semester} `,
    })),
    [programs],
  )

  const selectedProgram = useMemo(
    () => programs.find(p => p.id === selectedProgramId) ?? null,
    [programs, selectedProgramId],
  )

  // ── Stats calculées ────────────────────────────────────────────────────────

  const totalHours = ((stats?.total_hours_published ?? 0) + (stats?.total_hours_draft ?? 0)).toFixed(1)
  const totalSeances = (stats?.count_published ?? 0) + (stats?.count_draft ?? 0)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── En-tête ────────────────────────────────────────────────────────── */}
      <CRow className="mb-4 align-items-center">
        <CCol>
          <h2 className="mb-1 d-flex align-items-center gap-2">
            <CIcon icon={cilBook} style={{ width: 28, height: 28 }} />
            Cahier de texte
          </h2>
          <p className="text-muted mb-0">
            Consultez vos séances et publiez-les pour les rendre visibles à l'administration.
          </p>
        </CCol>
      </CRow>

      {/* ── Cartes statistiques ─────────────────────────────────────────────── */}
      <CRow className="mb-4 g-3">
        <CCol xs={12} sm={6} lg={3}>
          <StatCard
            icon={cilCheckCircle}
            iconBg="#e8f5e9"
            iconColor="#2e7d32"
            label="Heures Signées"
            value={`${stats?.total_hours_published ?? 0}h`}
            sub={`${stats?.count_published ?? 0} séance(s)`}
            loading={statsLoading}
          />
        </CCol>
        <CCol xs={12} sm={6} lg={3}>
          <StatCard
            icon={cilClock}
            iconBg="#fff8e1"
            iconColor="#f57f17"
            label="Heures en attente"
            value={`${stats?.total_hours_draft ?? 0}h`}
            sub={`${stats?.count_draft ?? 0} En attente(s)`}
            loading={statsLoading}
          />
        </CCol>
        <CCol xs={12} sm={6} lg={3}>
          <StatCard
            icon={cilBook}
            iconBg="#e3f2fd"
            iconColor="#1565c0"
            label="Total séances"
            value={totalSeances}
            sub={`${stats?.programs_count ?? 0} programme(s)`}
            loading={statsLoading}
          />
        </CCol>
      </CRow>

      {/* ── Sélecteur de programme ──────────────────────────────────────────── */}
      <CCard className="mb-4">
        <CCardHeader>
          <h5 className="mb-0">Sélectionner un programme</h5>
        </CCardHeader>
        <CCardBody>
          {programsLoading ? (
            <div className="d-flex align-items-center gap-2 py-2">
              <CSpinner size="sm" />
              <span className="text-muted">Chargement des programmes…</span>
            </div>
          ) : programs.length === 0 ? (
            <CAlert color="info" className="mb-0">
              Aucun programme trouvé. Vérifiez votre affectation avec l'administration.
            </CAlert>
          ) : (
            <CRow className="align-items-end g-3">
              <CCol md={8}>
                <label className="form-label fw-semibold">Programme / Matière</label>
                <Select
                  options={programOptions}
                  value={programOptions.find(o => o.value === selectedProgramId) ?? null}
                  onChange={(opt: any) => handleSelectProgram(opt?.value ?? null)}
                  placeholder="Choisissez un programme…"
                  isClearable
                  isSearchable
                  noOptionsMessage={() => 'Aucun programme'}
                />
              </CCol>
              {selectedProgram && (
                <CCol md={4}>
                  <div className="p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                    <div className="small text-muted mb-2">
                      {selectedProgram.department_name} · {selectedProgram.academic_year}
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <CBadge color="success" shape="rounded-pill">
                        {selectedProgram.entries_published} Signé(s)
                      </CBadge>
                      <CBadge color="warning" shape="rounded-pill">
                        {selectedProgram.entries_draft} En attente(s)
                      </CBadge>
                    </div>
                  </div>
                </CCol>
              )}
            </CRow>
          )}
        </CCardBody>
      </CCard>

      {/* ── Tableau des entrées ─────────────────────────────────────────────── */}
      {selectedProgramId && (
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              Historique des séances
              {selectedProgram && (
                <span className="ms-2 text-muted fw-normal" style={{ fontSize: '0.9rem' }}>
                  — {selectedProgram.course_name}
                </span>
              )}
            </h5>
            <CButton
              size="sm"
              color="light"
              title="Rafraîchir"
              onClick={() => loadEntries(selectedProgramId)}
              disabled={entriesLoading}
            >
              <CIcon icon={cilReload} className={entriesLoading ? 'spin' : ''} />
            </CButton>
          </CCardHeader>

          <CCardBody>
            {/* Mini stats du programme */}
            {programStats && (
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span
                  className="px-3 py-2 rounded small fw-semibold"
                  style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' }}
                >
                  ✓ {programStats.hours_published}h Signées
                  ({programStats.count_published} séance{programStats.count_published !== 1 ? 's' : ''})
                </span>
                <span
                  className="px-3 py-2 rounded small fw-semibold"
                  style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}
                >
                  ⏳ {programStats.hours_draft}h en attente
                  ({programStats.count_draft} En attente {programStats.count_draft !== 1 ? 's' : ''})
                </span>
                <span
                  className="px-3 py-2 rounded small fw-semibold"
                  style={{ background: '#dbeafe', color: '#1e3a8a', border: '1px solid #93c5fd' }}
                >
                  Σ {programStats.total_hours}h au total
                </span>
              </div>
            )}

            {/* ⚠️ CORRECTION : CAlert sans "dismissible" pour compatibilité CoreUI v4/v5
                On gère la fermeture manuellement */}
            {error && (
              <CAlert color="danger" className="d-flex align-items-center justify-content-between mb-3">
                <span>
                  <CIcon icon={cilWarning} className="me-2" />
                  {error}
                </span>
                <CButton
                  size="sm"
                  color="danger"
                  variant="ghost"
                  onClick={() => setError(null)}
                  className="p-0 ms-2"
                >
                  <CIcon icon={cilX} />
                </CButton>
              </CAlert>
            )}

            {entriesLoading ? (
              <div className="text-center py-5">
                <CSpinner />
                <div className="mt-2 text-muted">Chargement des séances…</div>
              </div>
            ) : entries.length === 0 ? (
              <CAlert color="info" className="mb-0">
                Aucune entrée enregistrée pour ce programme.
              </CAlert>
            ) : (
              <CTable hover responsive className="align-middle mb-0">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Titre de la séance</CTableHeaderCell>
                    <CTableHeaderCell>Horaires</CTableHeaderCell>
                    <CTableHeaderCell>Heures</CTableHeaderCell>
                    <CTableHeaderCell>Présents / Absents</CTableHeaderCell>
                    <CTableHeaderCell>Statut</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {entries.map(entry => {
                    const { label, color } = statusLabel(entry.status)
                    const isPublishing   = publishingId   === entry.id
                    const isUnpublishing = unpublishingId === entry.id
                    const isBusy         = isPublishing || isUnpublishing

                    return (
                      <CTableRow key={entry.id}>
                        <CTableDataCell className="text-nowrap">
                          {formatDate(entry.session_date)}
                        </CTableDataCell>

                        <CTableDataCell style={{ maxWidth: 300 }}>
                          <div className="fw-semibold">{entry.session_title}</div>
                          {entry.content_covered && (
                            <div
                              className="text-muted small"
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={entry.content_covered}
                            >
                              {entry.content_covered}
                            </div>
                          )}
                        </CTableDataCell>

                        <CTableDataCell className="text-nowrap">
                          {formatTime(entry.start_time)} – {formatTime(entry.end_time)}
                        </CTableDataCell>

                        <CTableDataCell className="text-nowrap">
                          {entry.hours_taught != null ? `${entry.hours_taught}h` : '—'}
                        </CTableDataCell>

                        <CTableDataCell className="text-nowrap">
                          {entry.students_present != null || entry.students_absent != null
                            ? `${entry.students_present ?? '?'} / ${entry.students_absent ?? '?'}`
                            : '—'}
                        </CTableDataCell>

                        <CTableDataCell>
                          <CBadge color={color}>{label}</CBadge>
                          {entry.published_at && (
                            <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                              {entry.published_at}
                            </div>
                          )}
                        </CTableDataCell>

                        <CTableDataCell className="text-nowrap">
                          {/* Détail */}
                          <CButton
                            size="sm"
                            color="light"
                            className="me-1"
                            title="Voir le détail"
                            onClick={() => setDetailEntry(entry)}
                          >
                            <CIcon icon={cilDescription} />
                          </CButton>

                          {/* Publier */}
                          {entry.status === 'draft' && (
                            <CButton
                              size="sm"
                              color="success"
                              disabled={isBusy}
                              onClick={() => handlePublish(entry)}
                            >
                              {isPublishing
                                ? <CSpinner size="sm" />
                                : <><CIcon icon={cilCheckCircle} className="me-1" />Signer</>}
                            </CButton>
                          )}

                          {/* Dépublier */}
                          {entry.status === 'published' && (
                            <CButton
                              size="sm"
                              color="warning"
                              disabled={isBusy}
                              onClick={() => handleUnpublish(entry)}
                            >
                              {isUnpublishing
                                ? <CSpinner size="sm" />
                                : <><CIcon icon={cilReload} className="me-1" />Retirer signature</>}
                            </CButton>
                          )}

                          {/* Validé — non modifiable */}
                          {entry.status === 'validated' && (
                            <CBadge color="info">Validé</CBadge>
                          )}
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      )}

      {/* ── Modal détail ────────────────────────────────────────────────────── */}
      <CModal
        visible={!!detailEntry}
        onClose={() => setDetailEntry(null)}
        size="lg"
        scrollable
        alignment="center"
      >
        <CModalHeader closeButton>
          <CModalTitle className="d-flex align-items-center gap-2">
            <CIcon icon={cilBook} />
            {detailEntry?.session_title ?? ''}
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          {detailEntry && (
            <div className="d-flex flex-column gap-3">
              {/* Infos rapides */}
              <CRow className="g-2">
                <CCol md={4}>
                  <div className="p-2 rounded" style={{ background: '#f8f9fa' }}>
                    <div className="text-muted small mb-1">Date</div>
                    <div className="fw-semibold">{formatDate(detailEntry.session_date)}</div>
                  </div>
                </CCol>
                <CCol md={4}>
                  <div className="p-2 rounded" style={{ background: '#f8f9fa' }}>
                    <div className="text-muted small mb-1">Horaires</div>
                    <div className="fw-semibold">
                      {formatTime(detailEntry.start_time)} – {formatTime(detailEntry.end_time)}
                      {detailEntry.hours_taught != null && (
                        <span className="text-muted ms-1">({detailEntry.hours_taught}h)</span>
                      )}
                    </div>
                  </div>
                </CCol>
                <CCol md={4}>
                  <div className="p-2 rounded" style={{ background: '#f8f9fa' }}>
                    <div className="text-muted small mb-1">Statut</div>
                    <CBadge color={statusLabel(detailEntry.status).color}>
                      {statusLabel(detailEntry.status).label}
                    </CBadge>
                  </div>
                </CCol>
              </CRow>

              {/* Contenu couvert */}
              <div>
                <div className="text-muted small fw-semibold mb-1">Contenu couvert</div>
                <div className="p-2 border rounded" style={{ whiteSpace: 'pre-wrap', minHeight: 60 }}>
                  {detailEntry.content_covered || '—'}
                </div>
              </div>

              {detailEntry.objectives && (
                <div>
                  <div className="text-muted small fw-semibold mb-1">Objectifs</div>
                  <div className="p-2 border rounded" style={{ whiteSpace: 'pre-wrap' }}>
                    {detailEntry.objectives}
                  </div>
                </div>
              )}

              {detailEntry.teaching_methods && (
                <div>
                  <div className="text-muted small fw-semibold mb-1">Méthodes pédagogiques</div>
                  <div className="p-2 border rounded" style={{ whiteSpace: 'pre-wrap' }}>
                    {detailEntry.teaching_methods}
                  </div>
                </div>
              )}

              {detailEntry.homework && (
                <div>
                  <div className="text-muted small fw-semibold mb-1">
                    Devoir à rendre
                    {detailEntry.homework_due_date && (
                      <span className="fw-normal text-muted ms-2">
                        (pour le {formatDate(detailEntry.homework_due_date)})
                      </span>
                    )}
                  </div>
                  <div className="p-2 border rounded" style={{ whiteSpace: 'pre-wrap' }}>
                    {detailEntry.homework}
                  </div>
                </div>
              )}

              {/* Présences */}
              {(detailEntry.students_present != null || detailEntry.students_absent != null) && (
                <div className="d-flex gap-2 flex-wrap">
                  <span className="px-3 py-2 rounded small fw-semibold"
                    style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' }}>
                    Présents : {detailEntry.students_present ?? '—'}
                  </span>
                  <span className="px-3 py-2 rounded small fw-semibold"
                    style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                    Absents : {detailEntry.students_absent ?? '—'}
                  </span>
                </div>
              )}

              {detailEntry.observations && (
                <div>
                  <div className="text-muted small fw-semibold mb-1">Observations</div>
                  <div className="p-2 border rounded" style={{ whiteSpace: 'pre-wrap' }}>
                    {detailEntry.observations}
                  </div>
                </div>
              )}

              {/* Audit */}
              <div className="d-flex gap-3 flex-wrap pt-1" style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                <span>Créé le : {detailEntry.created_at ?? '—'}</span>
                {detailEntry.published_at  && <span>Signé le : {detailEntry.published_at}</span>}
                {detailEntry.validated_at  && <span>Validé le : {detailEntry.validated_at}</span>}
              </div>
            </div>
          )}
        </CModalBody>

        <CModalFooter className="d-flex justify-content-between">
          <div className="d-flex gap-2">
            {/* ⚠️ CORRECTION : .then() sur handlePublish qui retourne bien Promise<void> */}
            {detailEntry?.status === 'draft' && (
              <CButton
                color="success"
                disabled={publishingId === detailEntry?.id}
                onClick={() =>
                  detailEntry &&
                  handlePublish(detailEntry).then(() => setDetailEntry(null))
                }
              >
                {publishingId === detailEntry?.id
                  ? <CSpinner size="sm" />
                  : <><CIcon icon={cilCheckCircle} className="me-1" />Signer</>}
              </CButton>
            )}
            {detailEntry?.status === 'published' && (
              <CButton
                color="warning"
                disabled={unpublishingId === detailEntry?.id}
                onClick={() =>
                  detailEntry &&
                  handleUnpublish(detailEntry).then(() => setDetailEntry(null))
                }
              >
                {unpublishingId === detailEntry?.id
                  ? <CSpinner size="sm" />
                  : <><CIcon icon={cilReload} className="me-1" />Retirer Signature</>}
              </CButton>
            )}
            {detailEntry?.status === 'validated' && (
              <CBadge color="info" className="px-3 py-2">
                ✓ Entrée validée — non modifiable
              </CBadge>
            )}
          </div>
          <CButton color="secondary" variant="outline" onClick={() => setDetailEntry(null)}>
            Fermer
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Keyframes pour l'icône reload */}
      <style>{`
        @keyframes _spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: _spin 0.9s linear infinite; display: inline-block; }
      `}</style>
    </>
  )
}

export default ProfessorTextbookPage