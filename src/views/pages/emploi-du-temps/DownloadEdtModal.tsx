import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CForm, CFormLabel, CFormSelect, CFormInput,
  CRow, CCol, CAlert, CSpinner, CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload, cilCalendar, cilWarning, cilInfo,
} from '@coreui/icons'
import axios from 'axios'

// ─── URLs ────────────────────────────────────────────────────────────────────
const API     = '/emploi-temps'
const API_SEL = '/emploi-temps/selects'

// ─── Types ───────────────────────────────────────────────────────────────────
interface AcademicYear { id: number; academic_year: string; libelle: string; is_current: boolean }
interface Department   { id: number; name: string; abbreviation: string }
interface ClassGroup   { id: number; group_name: string; study_level: string }

// ─── Constantes ──────────────────────────────────────────────────────────────
const DAYS_FR: Record<string, string> = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
  thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
}

/** Retourne le lundi de la semaine contenant la date donnée */
function getMondayOf(dateStr: string): Date {
  const d = new Date(dateStr)
  const day = d.getDay()                   // 0=dim, 1=lun…
  const diff = (day === 0 ? -6 : 1 - day) // décalage vers lundi
  d.setDate(d.getDate() + diff)
  return d
}

/** Formate une Date en YYYY-MM-DD */
function fmt(d: Date): string {
  return d.toISOString().split('T')[0]
}

/** Formate une Date en DD/MM/YYYY */
function fmtFR(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Retourne le dimanche d'une semaine dont le lundi est donné */
function getSundayOf(monday: Date): Date {
  const d = new Date(monday)
  d.setDate(d.getDate() + 6)
  return d
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean
  onClose: () => void
}

const DownloadEdtModal: React.FC<Props> = ({ visible, onClose }) => {

  // ── Données de référence ──────────────────────────────────────────────
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [departments, setDepartments]     = useState<Department[]>([])
  const [classGroups, setClassGroups]     = useState<ClassGroup[]>([])
  const [refsLoaded, setRefsLoaded]       = useState(false)
  const [cgLoading, setCgLoading]         = useState(false)

  // ── Formulaire ────────────────────────────────────────────────────────
  const today = new Date()
  const defaultMonday = fmt(getMondayOf(fmt(today)))

  const [academicYearId, setAcademicYearId] = useState('')
  const [departmentId,   setDepartmentId]   = useState('')
  const [classGroupId,   setClassGroupId]   = useState('')
  const [weekDate,       setWeekDate]       = useState(defaultMonday) // une date quelconque dans la semaine

  // ── Statut ────────────────────────────────────────────────────────────
  const [downloading, setDownloading] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [info, setInfo]               = useState<string | null>(null)

  // ─── Semaine calculée (lundi → dimanche) ─────────────────────────────
  const monday = useMemo(() => {
    try { return getMondayOf(weekDate) } catch { return getMondayOf(defaultMonday) }
  }, [weekDate])

  const sunday = useMemo(() => getSundayOf(monday), [monday])

  const weekLabel = useMemo(
    () => `${fmtFR(monday)} → ${fmtFR(sunday)}`,
    [monday, sunday]
  )

  // ─── Chargement références ────────────────────────────────────────────
  const loadRefs = useCallback(async () => {
    if (refsLoaded) return
    try {
      const [ay, dep] = await Promise.all([
        axios.get(`${API_SEL}/academic-years`),
        axios.get(`${API_SEL}/departments`),
      ])
      setAcademicYears(ay.data.data ?? [])
      setDepartments(dep.data.data  ?? [])

      // Pré-sélectionner l'année courante
      const current = (ay.data.data ?? []).find((a: AcademicYear) => a.is_current)
      if (current) setAcademicYearId(String(current.id))

      setRefsLoaded(true)
    } catch { /* silently ignore */ }
  }, [refsLoaded])

  useEffect(() => {
    if (visible) loadRefs()
  }, [visible, loadRefs])

  // ─── Cascade Année + Département → Classes ────────────────────────────
  const loadClassGroups = useCallback(async (ayId: string, depId: string) => {
    setClassGroups([]); setClassGroupId('')
    if (!ayId && !depId) return
    setCgLoading(true)
    try {
      const { data } = await axios.get(`${API_SEL}/class-groups`, {
        params: { ...(ayId ? { academic_year_id: ayId } : {}), ...(depId ? { department_id: depId } : {}) },
      })
      setClassGroups(data.data ?? [])
    } catch { setClassGroups([]) }
    finally { setCgLoading(false) }
  }, [])

  useEffect(() => {
    loadClassGroups(academicYearId, departmentId)
  }, [academicYearId, departmentId, loadClassGroups])

  // ─── Téléchargement ───────────────────────────────────────────────────
  const handleDownload = async () => {
    setError(null); setInfo(null)

    if (!weekDate) {
      setError('Veuillez sélectionner une semaine.')
      return
    }

    setDownloading(true)
    try {
      const payload: Record<string, string | number> = {
        week_start: fmt(monday),
      }
      if (academicYearId) payload.academic_year_id = Number(academicYearId)
      if (classGroupId)   payload.class_group_id   = Number(classGroupId)

      const response = await axios.post(
        `${API}/pdf/download`,
        payload,
        { responseType: 'blob' }
      )

      // Déclenchement du téléchargement navigateur
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url

      // Nom du fichier depuis les headers ou généré
      const cd       = response.headers['content-disposition'] ?? ''
      const nameMatch = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      const filename  = nameMatch?.[1]?.replace(/['"]/g, '') ?? `emploi_du_temps_${fmt(monday)}.pdf`

      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setInfo('PDF téléchargé avec succès.')
      setTimeout(() => { setInfo(null); onClose() }, 2000)

    } catch (e: any) {
      if (e.response?.status === 422) {
        setError("Données invalides. Vérifiez votre sélection.")
      } else if (e.response?.status === 500) {
        setError("Erreur serveur lors de la génération du PDF.")
      } else {
        setError(e.response?.data?.message ?? "Erreur lors du téléchargement.")
      }
    } finally {
      setDownloading(false)
    }
  }

  const handleClose = () => {
    if (downloading) return
    setError(null); setInfo(null)
    onClose()
  }

  // ─────────────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────────────

  return (
    <CModal visible={visible} onClose={handleClose} size="md" backdrop="static">
      <CModalHeader>
        <CModalTitle>
          <CIcon icon={cilCloudDownload} className="me-2 text-primary" />
          Télécharger l'emploi du temps (PDF)
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        {error && (
          <CAlert color="danger" dismissible onClose={() => setError(null)}>
            <CIcon icon={cilWarning} className="me-2" />{error}
          </CAlert>
        )}
        {info && (
          <CAlert color="success">
            <CIcon icon={cilInfo} className="me-2" />{info}
          </CAlert>
        )}

        <CForm>
          <CRow className="g-3">

            {/* ── Sélection de la semaine ── */}
            <CCol xs={12}>
              <CFormLabel className="fw-semibold">
                <CIcon icon={cilCalendar} className="me-1" />
                Semaine <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                type="date"
                value={weekDate}
                onChange={e => setWeekDate(e.target.value)}
              />
              {/* Affichage de la période calculée */}
              {weekDate && (
                <div className="mt-2 d-flex align-items-center gap-2">
                  <CBadge color="info" className="px-3 py-2" style={{ fontSize: '0.85rem' }}>
                    <CIcon icon={cilCalendar} className="me-1" />
                    Lundi {fmtFR(monday)} → Dimanche {fmtFR(sunday)}
                  </CBadge>
                </div>
              )}
              <small className="text-muted">
                Sélectionnez n'importe quelle date dans la semaine souhaitée (max. 7 jours, lundi→dimanche).
              </small>
            </CCol>

            {/* ── Année académique ── */}
            <CCol xs={12} md={6}>
              <CFormLabel className="fw-semibold">Année académique</CFormLabel>
              <CFormSelect
                value={academicYearId}
                onChange={e => setAcademicYearId(e.target.value)}
              >
                <option value="">— Toutes les années —</option>
                {academicYears.map(ay => (
                  <option key={ay.id} value={ay.id}>
                    {ay.libelle ?? ay.academic_year}{ay.is_current ? ' ★' : ''}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            {/* ── Département ── */}
            <CCol xs={12} md={6}>
              <CFormLabel className="fw-semibold">Département</CFormLabel>
              <CFormSelect
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
              >
                <option value="">— Tous les départements —</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.abbreviation})</option>
                ))}
              </CFormSelect>
            </CCol>

            {/* ── Classe ── */}
            <CCol xs={12}>
              <CFormLabel className="fw-semibold">
                Classe
                {cgLoading && <CSpinner size="sm" className="ms-2" />}
              </CFormLabel>
              <CFormSelect
                value={classGroupId}
                onChange={e => setClassGroupId(e.target.value)}
                disabled={cgLoading}
              >
                <option value="">— Toutes les classes —</option>
                {classGroups.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.group_name} — {c.study_level}
                  </option>
                ))}
              </CFormSelect>
              <small className="text-muted">
                Laissez vide pour inclure toutes les classes dans le PDF.
              </small>
            </CCol>

            {/* ── Aperçu de la semaine ── */}
            <CCol xs={12}>
              <div
                className="p-3 rounded border"
                style={{ background: '#f8f9fa' }}
              >
                <div className="fw-semibold mb-2 small text-muted">APERÇU DE LA PÉRIODE</div>
                <div className="d-flex gap-1 flex-wrap">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => {
                    const d = new Date(monday)
                    d.setDate(d.getDate() + i)
                    return (
                      <div
                        key={day}
                        className="text-center rounded px-2 py-1"
                        style={{
                          background: '#0d6efd',
                          color: 'white',
                          minWidth: '68px',
                          fontSize: '0.75rem',
                        }}
                      >
                        <div className="fw-bold">{day}</div>
                        <div>{d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CCol>

          </CRow>
        </CForm>
      </CModalBody>

      <CModalFooter>
        <CButton
          color="secondary"
          variant="ghost"
          onClick={handleClose}
          disabled={downloading}
        >
          Annuler
        </CButton>
        <CButton
          color="primary"
          onClick={handleDownload}
          disabled={downloading || !weekDate}
          style={{ minWidth: 180 }}
        >
          {downloading ? (
            <><CSpinner size="sm" className="me-2" />Génération en cours…</>
          ) : (
            <><CIcon icon={cilCloudDownload} className="me-2" />Télécharger le PDF</>
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default DownloadEdtModal