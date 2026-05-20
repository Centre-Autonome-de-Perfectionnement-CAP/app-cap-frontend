/**
 * CourseSupportModal.tsx
 *
 * Modal permettant à un professeur d'ajouter / consulter les supports de cours
 * associés aux programmes d'un contrat.
 *
 * Structure JSON stockée dans `contrat_programs.course_support_file` :
 * [
 *   { title: "Chapitre 1", file: "supports/uuid-xxxx.pdf", url: "https://..." },
 *   ...
 * ]
 */

import { useState, useEffect, useRef } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CBadge,
  CSpinner,
  CAlert,
  CFormInput,
  CFormLabel,
  CFormSelect,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilFile,
  cilPlus,
  cilExternalLink,
  cilTrash,
  cilCloudUpload,
  cilX,
  cilCheckCircle,
} from '@coreui/icons'
import type { Contrat, ProfessorProgram, CourseSupport } from '@/types/rh.types'
import HttpService from '@/services/http.service'

// ─── Types internes ──────────────────────────────────────────────────────────

interface CourseSupportEntry {
  title: string
  file?: string   // chemin serveur
  url?: string    // URL publique
}

interface ProgramWithSupports {
  program: ProfessorProgram
  supports: CourseSupportEntry[]
  loading: boolean
  error: string | null
}

interface Props {
  visible: boolean
  onClose: () => void
  contrat: Contrat
  /**
   * inlineMode=true : le composant est déjà rendu dans un CModal parent.
   * Il rend alors uniquement son contenu (header + body + footer) sans CModal wrapper.
   */
  inlineMode?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const programLabel = (p: ProfessorProgram): string => {
  const ecue      = p.course_element?.name ?? p.label ?? '—'
  const classe    = p.class_group?.name ?? '—'
  return `${ecue} — ${classe}`
}

// ─── Composant principal ─────────────────────────────────────────────────────

const CourseSupportModal = ({ visible, onClose, contrat, inlineMode = false }: Props) => {
  const programs: ProfessorProgram[] = contrat.course_element_professors ?? []

  // Index du programme sélectionné dans la liste déroulante
  const [selectedIdx, setSelectedIdx] = useState<number>(0)

  // État par programme : { [programId]: ProgramWithSupports }
  const [programStates, setProgramStates] = useState<Record<number, ProgramWithSupports>>({})

  // Formulaire d'ajout
  const [newTitle, setNewTitle]   = useState('')
  const [newFile, setNewFile]     = useState<File | null>(null)
  const [adding, setAdding]       = useState(false)
  const [addError, setAddError]   = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Initialisation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return
    setSelectedIdx(0)
    setNewTitle('')
    setNewFile(null)
    setAddError(null)
    setAddSuccess(false)

    // Charger les supports existants pour chaque programme
    programs.forEach((p) => {
      loadSupports(p)
    })
  }, [visible, contrat.id])

  const loadSupports = async (program: ProfessorProgram) => {
    setProgramStates((prev) => ({
      ...prev,
      [program.id]: {
        program,
        supports: prev[program.id]?.supports ?? [],
        loading: true,
        error: null,
      },
    }))

    try {
      const res = await HttpService.get<{
        success: boolean
        data: CourseSupportEntry[]
      }>(`rh/contrats/${contrat.id}/programs/${program.id}/supports`)

      setProgramStates((prev) => ({
        ...prev,
        [program.id]: {
          program,
          supports: res.data ?? [],
          loading: false,
          error: null,
        },
      }))
    } catch (err: any) {
      setProgramStates((prev) => ({
        ...prev,
        [program.id]: {
          program,
          supports: [],
          loading: false,
          error: err?.message ?? 'Erreur de chargement',
        },
      }))
    }
  }

  // ── Programme courant ────────────────────────────────────────────────────
  const currentProgram   = programs[selectedIdx]
  const currentState     = currentProgram ? programStates[currentProgram.id] : undefined
  const currentSupports  = currentState?.supports ?? []
  const isLoadingSupport = currentState?.loading ?? false

  // ── Upload d'un support ──────────────────────────────────────────────────
  const handleAddSupport = async () => {
    if (!currentProgram) return
    if (!newTitle.trim()) { setAddError('Veuillez saisir un titre.'); return }
    if (!newFile)         { setAddError('Veuillez sélectionner un fichier PDF.'); return }

    setAddError(null)
    setAdding(true)
    setAddSuccess(false)

    try {
      const formData = new FormData()
      formData.append('title', newTitle.trim())
      formData.append('pdf_file', newFile)
      formData.append('program_id', String(currentProgram.id))

      await HttpService.post(
        `rh/contrats/${contrat.id}/programs/${currentProgram.id}/supports`,
        formData,
      )

      // Réinitialiser le formulaire
      setNewTitle('')
      setNewFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setAddSuccess(true)
      setTimeout(() => setAddSuccess(false), 3000)

      // Recharger les supports de ce programme
      await loadSupports(currentProgram)
    } catch (err: any) {
      setAddError(err?.message ?? "Erreur lors de l'ajout du support.")
    } finally {
      setAdding(false)
    }
  }

  // ── Suppression d'un support ─────────────────────────────────────────────
  const handleDeleteSupport = async (supportIdx: number) => {
    if (!currentProgram) return
    if (!window.confirm('Supprimer ce support de cours ?')) return

    try {
      await HttpService.delete(
        `rh/contrats/${contrat.id}/programs/${currentProgram.id}/supports/${supportIdx}`,
      )
      await loadSupports(currentProgram)
    } catch (err: any) {
      alert('Erreur lors de la suppression : ' + (err?.message ?? ''))
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const modalContent = (
    <>
      <CModalHeader>
        <CModalTitle>
          <CIcon icon={cilFile} className="me-2" />
          Supports de cours — Contrat N° {contrat.contrat_number}
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        {programs.length === 0 ? (
          <CAlert color="info">
            Aucun programme n'est associé à ce contrat.
          </CAlert>
        ) : (
          <>
            {/* ── Sélection du programme ───────────────────────────────── */}
            <div className="mb-4">
              <CFormLabel className="fw-semibold">
                Programme / Cours concerné
              </CFormLabel>
              <CFormSelect
                value={selectedIdx}
                onChange={(e) => {
                  setSelectedIdx(Number(e.target.value))
                  setNewTitle('')
                  setNewFile(null)
                  setAddError(null)
                  setAddSuccess(false)
                }}
              >
                {programs.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    {programLabel(p)}
                  </option>
                ))}
              </CFormSelect>
              {currentProgram && (
                <div className="mt-2 d-flex gap-2 flex-wrap">
                  {currentProgram.course_element?.teaching_unit?.name && (
                    <CBadge color="light" textColor="dark" className="border">
                      UE : {currentProgram.course_element.teaching_unit.name}
                    </CBadge>
                  )}
                  {currentProgram.class_group?.name && (
                    <CBadge color="light" textColor="dark" className="border">
                      Classe : {currentProgram.class_group.name}
                    </CBadge>
                  )}
                </div>
              )}
            </div>

            <hr />

            {/* ── Supports existants ──────────────────────────────────── */}
            <div className="mb-4">
              <h6 className="fw-semibold mb-3">
                Supports existants
                {!isLoadingSupport && (
                  <CBadge color="secondary" className="ms-2">
                    {currentSupports.length}
                  </CBadge>
                )}
              </h6>

              {isLoadingSupport ? (
                <div className="text-center py-3">
                  <CSpinner size="sm" /> Chargement…
                </div>
              ) : currentState?.error ? (
                <CAlert color="danger" className="py-2">
                  {currentState.error}
                </CAlert>
              ) : currentSupports.length === 0 ? (
                <CAlert color="light" className="border text-muted py-2">
                  Aucun support de cours pour ce programme.
                </CAlert>
              ) : (
                <div className="list-group">
                  {currentSupports.map((support, idx) => (
                    <div
                      key={idx}
                      className="list-group-item list-group-item-action d-flex align-items-center justify-content-between gap-2"
                    >
                      <div className="d-flex align-items-center gap-2 overflow-hidden">
                        <CIcon icon={cilFile} className="text-danger flex-shrink-0" />
                        <span className="text-truncate fw-medium">{support.title}</span>
                      </div>
                      <div className="d-flex gap-1 flex-shrink-0">
                        {support.url && (
                          <CButton
                            size="sm"
                            color="primary"
                            variant="outline"
                            href={support.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Ouvrir le PDF"
                          >
                            <CIcon icon={cilExternalLink} className="me-1" />
                            Ouvrir
                          </CButton>
                        )}
                        <CButton
                          size="sm"
                          color="danger"
                          variant="outline"
                          onClick={() => handleDeleteSupport(idx)}
                          title="Supprimer ce support"
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr />

            {/* ── Formulaire d'ajout ───────────────────────────────────── */}
            <div>
              <h6 className="fw-semibold mb-3">
                <CIcon icon={cilPlus} className="me-1" />
                Ajouter un support de cours
              </h6>

              {addSuccess && (
                <CAlert color="success" className="py-2">
                  <CIcon icon={cilCheckCircle} className="me-2" />
                  Support ajouté avec succès !
                </CAlert>
              )}
              {addError && (
                <CAlert color="danger" className="py-2">
                  {addError}
                </CAlert>
              )}

              <div className="mb-3">
                <CFormLabel>Titre du support <span className="text-danger">*</span></CFormLabel>
                <CFormInput
                  placeholder="Ex : Cours Chapitre 1 — Introduction"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  disabled={adding}
                />
              </div>

              <div className="mb-3">
                <CFormLabel>Fichier PDF <span className="text-danger">*</span></CFormLabel>
                <div
                  className="border rounded p-3 text-center"
                  style={{
                    borderStyle: 'dashed',
                    cursor: 'pointer',
                    background: newFile ? '#f0fdf4' : '#fafafa',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="d-none"
                    onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                    disabled={adding}
                  />
                  {newFile ? (
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <CIcon icon={cilFile} className="text-danger" />
                      <span className="fw-medium">{newFile.name}</span>
                      <CButton
                        size="sm"
                        color="light"
                        onClick={(e) => {
                          e.stopPropagation()
                          setNewFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                      >
                        <CIcon icon={cilX} />
                      </CButton>
                    </div>
                  ) : (
                    <div className="text-muted">
                      <CIcon icon={cilCloudUpload} size="xl" className="mb-2 d-block mx-auto" />
                      <span>Cliquer pour sélectionner un PDF</span>
                    </div>
                  )}
                </div>
              </div>

              <CButton
                color="primary"
                onClick={handleAddSupport}
                disabled={adding || !newTitle.trim() || !newFile}
              >
                {adding ? (
                  <><CSpinner size="sm" className="me-2" />Envoi en cours…</>
                ) : (
                  <><CIcon icon={cilPlus} className="me-2" />Ajouter le support</>
                )}
              </CButton>
            </div>
          </>
        )}
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>
          Fermer
        </CButton>
      </CModalFooter>
    </>
  )

  // En mode inline, on est déjà dans un CModal parent — on rend juste le contenu
  if (inlineMode) return modalContent

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      size="lg"
      backdrop="static"
      scrollable
    >
      {modalContent}
    </CModal>
  )
}

export default CourseSupportModal