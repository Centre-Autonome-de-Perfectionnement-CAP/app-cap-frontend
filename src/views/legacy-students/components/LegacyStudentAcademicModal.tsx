import React, { useCallback, useEffect, useState } from "react"
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CForm, CFormLabel, CFormInput, CFormSelect,
  CFormTextarea, CFormCheck, CTable, CTableHead, CTableBody,
  CTableRow, CTableHeaderCell, CTableDataCell,
  CBadge, CSpinner, CAlert, CRow, CCol, CCard, CCardBody, CCardHeader,
} from "@coreui/react"
import CIcon from "@coreui/icons-react"
import { cilPlus, cilTrash, cilPencil, cilSave, cilX, cilBook, cilEducation, cilWarning } from "@coreui/icons"
import { legacyStudentAdminService } from "@/services/legacyStudentAdminService"
import type { LegacyStudent, AcademicRecord, AcademicCourse } from "@/types/legacyStudent.types"

// ── Types / Constantes ────────────────────────────────────────────────────────

interface Props {
  student: LegacyStudent | null
  onClose: () => void
}

const EMPTY_COURSE: AcademicCourse = { name: "", code: "", professor: "", credits: 3, coefficient: 1, grade: 0, retake_grade: null, semester: "" }
const EMPTY_RECORD: Omit<AcademicRecord, "id"> = { academic_year: "", level: "", semester: "", general_average: null, total_credits: null, obtained_credits: null, decision: "", mention: "", thesis_title: "", thesis_grade: null, thesis_date: "", quitus_accorded: false, courses: [], notes: "" }
const DECISION_OPTIONS = [{ value: "", label: "— Décision —" }, { value: "pass", label: "Admis(e)" }, { value: "fail", label: "Ajourné(e)" }, { value: "repeat", label: "Redouble" }, { value: "excluded", label: "Exclu(e)" }]
const MENTION_OPTIONS = [{ value: "", label: "— Mention —" }, { value: "Passable", label: "Passable" }, { value: "Assez Bien", label: "Assez Bien" }, { value: "Bien", label: "Bien" }, { value: "Très Bien", label: "Très Bien" }, { value: "Excellent", label: "Excellent" }]

function getDecisionLabel(val?: string | null) { return DECISION_OPTIONS.find((d) => d.value === val)?.label ?? val ?? "—" }
function getDecisionColor(val?: string | null) { switch (val) { case "pass": return "success"; case "fail": return "warning"; case "repeat": return "danger"; case "excluded": return "dark"; default: return "secondary" } }
function calcAverage(courses: AcademicCourse[]) { const tc = courses.reduce((s, c) => s + (Number(c.coefficient) || 1), 0); if (!tc) return 0; return Math.round((courses.reduce((s, c) => s + (Number(c.grade) || 0) * (Number(c.coefficient) || 1), 0) / tc) * 100) / 100 }
function calcObtained(courses: AcademicCourse[]) { return courses.reduce((s, c) => s + (Number(c.grade) >= 10 ? Number(c.credits) : 0), 0) }

// ── Formulaire d un relevé ────────────────────────────────────────────────────

interface RecordFormProps { initial: Partial<AcademicRecord>; onSave: (d: Omit<AcademicRecord, "id">) => Promise<void>; onCancel: () => void; saving: boolean }

const RecordForm: React.FC<RecordFormProps> = ({ initial, onSave, onCancel, saving }) => {
  const [form, setForm] = useState<Omit<AcademicRecord, "id">>({ ...EMPTY_RECORD, ...initial, courses: initial.courses ? [...initial.courses] : [] })
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const addCourse = () => setForm((f) => ({ ...f, courses: [...f.courses, { ...EMPTY_COURSE }] }))
  const removeCourse = (i: number) => setForm((f) => ({ ...f, courses: f.courses.filter((_, idx) => idx !== i) }))
  const updateCourse = (i: number, k: keyof AcademicCourse, v: string | number | null) => setForm((f) => { const cs = [...f.courses]; cs[i] = { ...cs[i], [k]: v }; return { ...f, courses: cs } })

  useEffect(() => {
    if (!form.courses.length) return
    set("general_average", calcAverage(form.courses))
    set("obtained_credits", calcObtained(form.courses))
    set("total_credits", form.courses.reduce((s, c) => s + (Number(c.credits) || 0), 0))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(form.courses)])

  return (
    <CForm onSubmit={(e) => { e.preventDefault(); onSave(form) }}>
      <CCard className="mb-3">
        <CCardHeader className="py-2 fw-semibold small text-muted"><CIcon icon={cilEducation} className="me-1" /> Informations générales</CCardHeader>
        <CCardBody>
          <CRow className="g-2">
            <CCol md={3}><CFormLabel className="small mb-1">Année académique *</CFormLabel><CFormInput placeholder="ex: 2018-2019" value={form.academic_year} onChange={(e) => set("academic_year", e.target.value)} required /></CCol>
            <CCol md={3}><CFormLabel className="small mb-1">Niveau</CFormLabel><CFormInput placeholder="ex: Licence 3" value={form.level ?? ""} onChange={(e) => set("level", e.target.value)} /></CCol>
            <CCol md={2}><CFormLabel className="small mb-1">Semestre</CFormLabel><CFormSelect value={form.semester ?? ""} onChange={(e) => set("semester", e.target.value)}><option value="">Annuel</option><option value="S1">Semestre 1</option><option value="S2">Semestre 2</option><option value="S1+S2">S1 + S2</option></CFormSelect></CCol>
            <CCol md={2}><CFormLabel className="small mb-1">Décision</CFormLabel><CFormSelect value={form.decision ?? ""} onChange={(e) => set("decision", e.target.value)}>{DECISION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</CFormSelect></CCol>
            <CCol md={2}><CFormLabel className="small mb-1">Mention</CFormLabel><CFormSelect value={form.mention ?? ""} onChange={(e) => set("mention", e.target.value)}>{MENTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</CFormSelect></CCol>
          </CRow>
          <CRow className="g-2 mt-1">
            <CCol md={3}><CFormLabel className="small mb-1">Moyenne générale /20</CFormLabel><CFormInput type="number" step="0.01" min="0" max="20" value={form.general_average ?? ""} onChange={(e) => set("general_average", e.target.value ? parseFloat(e.target.value) : null)} placeholder="Auto-calculée" /></CCol>
            <CCol md={2}><CFormLabel className="small mb-1">Crédits total</CFormLabel><CFormInput type="number" min="0" value={form.total_credits ?? ""} onChange={(e) => set("total_credits", e.target.value ? parseInt(e.target.value) : null)} /></CCol>
            <CCol md={2}><CFormLabel className="small mb-1">Crédits obtenus</CFormLabel><CFormInput type="number" min="0" value={form.obtained_credits ?? ""} onChange={(e) => set("obtained_credits", e.target.value ? parseInt(e.target.value) : null)} /></CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CCard className="mb-3">
        <CCardHeader className="py-2 d-flex justify-content-between align-items-center">
          <span className="fw-semibold small text-muted"><CIcon icon={cilBook} className="me-1" /> Matières / UE</span>
          <CButton size="sm" color="primary" variant="outline" onClick={addCourse} type="button"><CIcon icon={cilPlus} className="me-1" /> Ajouter</CButton>
        </CCardHeader>
        <CCardBody className="p-0">
          {form.courses.length === 0 ? (
            <p className="text-muted small text-center py-3 mb-0">Aucune matière. Cliquez sur "Ajouter" pour saisir les notes.</p>
          ) : (
            <div className="table-responsive">
              <CTable small bordered className="mb-0 align-middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ minWidth: 150 }}>Intitulé</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 80 }}>Code</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: 110 }}>Enseignant</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 60 }}>Sem.</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 65 }}>Crédits</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 60 }}>Coeff.</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 75 }}>Note /20</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 85 }}>Rattrap.</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 40 }}></CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {form.courses.map((c, i) => (
                    <CTableRow key={i}>
                      <CTableDataCell><CFormInput size="sm" value={c.name} onChange={(e) => updateCourse(i, "name", e.target.value)} placeholder="Matière" /></CTableDataCell>
                      <CTableDataCell><CFormInput size="sm" value={c.code ?? ""} onChange={(e) => updateCourse(i, "code", e.target.value)} /></CTableDataCell>
                      <CTableDataCell><CFormInput size="sm" value={c.professor ?? ""} onChange={(e) => updateCourse(i, "professor", e.target.value)} /></CTableDataCell>
                      <CTableDataCell>
                        <CFormSelect size="sm" value={c.semester ?? ""} onChange={(e) => updateCourse(i, "semester", e.target.value)}>
                          <option value="">—</option><option value="S1">S1</option><option value="S2">S2</option>
                        </CFormSelect>
                      </CTableDataCell>
                      <CTableDataCell><CFormInput size="sm" type="number" min="0" value={c.credits} onChange={(e) => updateCourse(i, "credits", parseInt(e.target.value) || 0)} /></CTableDataCell>
                      <CTableDataCell><CFormInput size="sm" type="number" min="0" value={c.coefficient} onChange={(e) => updateCourse(i, "coefficient", parseInt(e.target.value) || 1)} /></CTableDataCell>
                      <CTableDataCell><CFormInput size="sm" type="number" min="0" max="20" step="0.25" value={c.grade} onChange={(e) => updateCourse(i, "grade", parseFloat(e.target.value) || 0)} style={{ color: Number(c.grade) < 10 ? "crimson" : "green", fontWeight: 600 }} /></CTableDataCell>
                      <CTableDataCell><CFormInput size="sm" type="number" min="0" max="20" step="0.25" value={c.retake_grade ?? ""} placeholder="—" onChange={(e) => updateCourse(i, "retake_grade", e.target.value ? parseFloat(e.target.value) : null)} /></CTableDataCell>
                      <CTableDataCell><CButton size="sm" color="danger" variant="ghost" onClick={() => removeCourse(i)} type="button"><CIcon icon={cilTrash} /></CButton></CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          )}
        </CCardBody>
      </CCard>

      <CCard className="mb-3">
        <CCardHeader className="py-2 fw-semibold small text-muted">Mémoire / Soutenance (optionnel)</CCardHeader>
        <CCardBody>
          <CRow className="g-2">
            <CCol md={7}><CFormLabel className="small mb-1">Thème du mémoire</CFormLabel><CFormInput placeholder="Intitulé du mémoire" value={form.thesis_title ?? ""} onChange={(e) => set("thesis_title", e.target.value)} /></CCol>
            <CCol md={2}><CFormLabel className="small mb-1">Note /20</CFormLabel><CFormInput type="number" min="0" max="20" step="0.25" value={form.thesis_grade ?? ""} onChange={(e) => set("thesis_grade", e.target.value ? parseFloat(e.target.value) : null)} /></CCol>
            <CCol md={3}><CFormLabel className="small mb-1">Date de soutenance</CFormLabel><CFormInput type="date" value={form.thesis_date ?? ""} onChange={(e) => set("thesis_date", e.target.value)} /></CCol>
            <CCol md={12}><CFormCheck label="Quitus accordé (autorisation de soutenance / de sortie)" checked={form.quitus_accorded ?? false} onChange={(e) => set("quitus_accorded", e.target.checked)} /></CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CRow className="mb-3"><CCol><CFormLabel className="small mb-1">Notes administratives</CFormLabel><CFormTextarea rows={2} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Remarques..." /></CCol></CRow>

      <div className="d-flex justify-content-end gap-2">
        <CButton color="secondary" variant="outline" onClick={onCancel} type="button" disabled={saving}><CIcon icon={cilX} className="me-1" /> Annuler</CButton>
        <CButton color="primary" type="submit" disabled={saving}>{saving ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilSave} className="me-1" />}Enregistrer</CButton>
      </div>
    </CForm>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

const LegacyStudentAcademicModal: React.FC<Props> = ({ student, onClose }) => {
  const [records, setRecords] = useState<AcademicRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mode, setMode] = useState<"list" | "new" | "edit">("list")
  const [editRecord, setEditRecord] = useState<AcademicRecord | null>(null)

  const fetchRecords = useCallback(async () => {
    if (!student) return
    setLoading(true); setError(null)
    try { setRecords(await legacyStudentAdminService.getAcademicRecords(student.id)) }
    catch { setError("Impossible de charger les relevés.") }
    finally { setLoading(false) }
  }, [student])

  useEffect(() => {
    if (student) { setMode("list"); setEditRecord(null); setError(null); setSuccess(null); fetchRecords() }
  }, [student, fetchRecords])

  const handleSave = async (data: Omit<AcademicRecord, "id">) => {
    if (!student) return
    setSaving(true); setError(null); setSuccess(null)
    try {
      if (mode === "edit" && editRecord?.id) {
        await legacyStudentAdminService.updateAcademicRecord(student.id, editRecord.id, data)
        setSuccess("Relevé mis à jour avec succès.")
      } else {
        await legacyStudentAdminService.saveAcademicRecord(student.id, data)
        setSuccess("Relevé créé avec succès.")
      }
      await fetchRecords(); setMode("list"); setEditRecord(null)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Erreur lors de la sauvegarde.")
    } finally { setSaving(false) }
  }

  const handleDelete = async (record: AcademicRecord) => {
    if (!student || !record.id) return
    if (!window.confirm(`Supprimer le relevé "${record.academic_year}" ?`)) return
    setError(null)
    try { await legacyStudentAdminService.deleteAcademicRecord(student.id, record.id); setSuccess("Relevé supprimé."); await fetchRecords() }
    catch { setError("Erreur lors de la suppression.") }
  }

  return (
    <CModal visible={Boolean(student)} onClose={onClose} size="xl" scrollable backdrop="static">
      <CModalHeader>
        <CModalTitle className="d-flex align-items-center gap-2">
          <CIcon icon={cilBook} />
          Dossier académique — {student ? `${student.last_name} ${student.first_name} (${student.matricule})` : ""}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {error && <CAlert color="danger" className="py-2"><CIcon icon={cilWarning} className="me-1" />{error}</CAlert>}
        {success && <CAlert color="success" className="py-2" dismissible onClose={() => setSuccess(null)}>{success}</CAlert>}

        {mode === "list" && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-semibold">Relevés académiques ({records.length})</h6>
              <CButton color="primary" size="sm" onClick={() => { setMode("new"); setEditRecord(null) }}>
                <CIcon icon={cilPlus} className="me-1" /> Ajouter un relevé
              </CButton>
            </div>
            {loading ? (
              <div className="text-center py-4"><CSpinner size="sm" /> Chargement...</div>
            ) : records.length === 0 ? (
              <CAlert color="info" className="py-3 text-center">
                Aucun relevé académique enregistré.<br />
                <small className="text-muted">Cliquez sur "Ajouter un relevé" pour saisir les notes d'une année.</small>
              </CAlert>
            ) : (
              <div className="table-responsive">
                <CTable hover bordered small className="align-middle">
                  <CTableHead color="light">
                    <CTableRow>
                      <CTableHeaderCell>Année</CTableHeaderCell>
                      <CTableHeaderCell>Niveau</CTableHeaderCell>
                      <CTableHeaderCell>Moyenne</CTableHeaderCell>
                      <CTableHeaderCell>Crédits</CTableHeaderCell>
                      <CTableHeaderCell>Décision</CTableHeaderCell>
                      <CTableHeaderCell>Mention</CTableHeaderCell>
                      <CTableHeaderCell>UE</CTableHeaderCell>
                      <CTableHeaderCell>Mémoire</CTableHeaderCell>
                      <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {records.map((r) => (
                      <CTableRow key={r.id}>
                        <CTableDataCell className="fw-semibold text-nowrap">{r.academic_year}</CTableDataCell>
                        <CTableDataCell className="small">{r.level || "—"}</CTableDataCell>
                        <CTableDataCell>
                          {r.general_average != null ? (
                            <span className={`fw-bold ${Number(r.general_average) >= 10 ? "text-success" : "text-danger"}`}>
                              {Number(r.general_average).toFixed(2)} /20
                            </span>
                          ) : "—"}
                        </CTableDataCell>
                        <CTableDataCell className="small">{r.obtained_credits ?? "—"} / {r.total_credits ?? "—"}</CTableDataCell>
                        <CTableDataCell>
                          {r.decision ? <CBadge color={getDecisionColor(r.decision)}>{getDecisionLabel(r.decision)}</CBadge> : "—"}
                        </CTableDataCell>
                        <CTableDataCell className="small">{r.mention || "—"}</CTableDataCell>
                        <CTableDataCell className="text-center small">{r.courses?.length ?? 0}</CTableDataCell>
                        <CTableDataCell className="small">
                          {r.thesis_title ? `✓ ${r.thesis_grade != null ? `${r.thesis_grade}/20` : ""}${r.quitus_accorded ? " · Quitus ✓" : ""}` : "—"}
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex gap-1">
                            <CButton size="sm" color="primary" variant="outline" title="Modifier" onClick={() => { setEditRecord(r); setMode("edit") }}><CIcon icon={cilPencil} /></CButton>
                            <CButton size="sm" color="danger" variant="outline" title="Supprimer" onClick={() => handleDelete(r)}><CIcon icon={cilTrash} /></CButton>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </div>
            )}
          </>
        )}

        {(mode === "new" || mode === "edit") && (
          <>
            <div className="d-flex align-items-center gap-2 mb-3">
              <CButton size="sm" color="secondary" variant="ghost" onClick={() => { setMode("list"); setEditRecord(null) }}>← Retour</CButton>
              <h6 className="mb-0 fw-semibold">{mode === "new" ? "Nouveau relevé académique" : `Modifier — ${editRecord?.academic_year}`}</h6>
            </div>
            <RecordForm
              initial={mode === "edit" && editRecord ? editRecord : EMPTY_RECORD}
              onSave={handleSave}
              onCancel={() => { setMode("list"); setEditRecord(null) }}
              saving={saving}
            />
          </>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>Fermer</CButton>
      </CModalFooter>
    </CModal>
  )
}

export default LegacyStudentAcademicModal
