import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CButton,
  CSpinner,
  CAlert,
  CFormCheck,
} from '@coreui/react'
import { cilSave, cilArrowLeft } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import CahierService from '@/services/cahier.service'
import CoursService from '@/services/cours.service'
import { useAuth } from '@/contexts'
import type { CreateTextbookEntryRequest, TextbookEntry } from '@/types/cahier-texte.types'
import { TextbookEntryStatus } from '@/types/cahier-texte.types'
import Swal from 'sweetalert2'

const EntryForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const { role, userId } = useAuth()
  const isProfesseur = (role as any) === 'professeur'

  const [loading, setLoading] = useState(false)
  const [programs, setPrograms] = useState<any[]>([])
  const [formData, setFormData] = useState<CreateTextbookEntryRequest>({
    program_id: 0,
    session_date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '10:00',
    hours_taught: 2,
    session_title: '',
    content_covered: '',
    objectives: '',
    teaching_methods: '',
    homework: '',
    homework_due_date: '',
    students_present: 0,
    students_absent: 0,
    observations: '',
    status: TextbookEntryStatus.DRAFT,
  })

  useEffect(() => {
    loadPrograms()
    if (isEdit) {
      loadEntry()
    }
  }, [id])

  const loadPrograms = async () => {
    try {
      if (isProfesseur && userId) {
        // Pour un professeur, charger uniquement ses programmes assignés
        const data = await CoursService.getProfessorPrograms(userId)
        setPrograms(data || [])
      } else {
        const response = await CoursService.getPrograms({ per_page: 1000 })
        setPrograms(response.data || [])
      }
    } catch (error) {
      console.error('Erreur chargement programmes:', error)
    }
  }

  const loadEntry = async () => {
    if (!id) return
    try {
      setLoading(true)
      const entry = await CahierService.getEntry(parseInt(id))
      setFormData({
        program_id: entry.program_id,
        session_date: entry.session_date,
        start_time: entry.start_time,
        end_time: entry.end_time,
        hours_taught: entry.hours_taught,
        session_title: entry.session_title,
        content_covered: entry.content_covered,
        objectives: entry.objectives,
        teaching_methods: entry.teaching_methods,
        homework: entry.homework,
        homework_due_date: entry.homework_due_date,
        students_present: entry.students_present,
        students_absent: entry.students_absent,
        observations: entry.observations,
        status: entry.status,
      })
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger l\'entrée',
      })
      navigate(isProfesseur ? '/cahier-texte/mes-entrees' : '/cahier-texte/list')
    } finally {
      setLoading(false)
    }
  }

  const calculateHours = () => {
    const start = formData.start_time.split(':')
    const end = formData.end_time.split(':')
    const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1])
    const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1])
    const hours = (endMinutes - startMinutes) / 60
    setFormData({ ...formData, hours_taught: hours })
  }

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault()

    if (!formData.program_id || !formData.session_title || !formData.content_covered) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez remplir tous les champs obligatoires',
      })
      return
    }

    setLoading(true)
    try {
      const dataToSend = {
        ...formData,
        status: publish ? TextbookEntryStatus.PUBLISHED : formData.status,
      }

      if (isEdit) {
        await CahierService.updateEntry(parseInt(id!), dataToSend)
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Entrée mise à jour avec succès',
          timer: 2000,
        })
      } else {
        await CahierService.createEntry(dataToSend)
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Entrée créée avec succès',
          timer: 2000,
        })
      }
      navigate(isProfesseur ? '/cahier-texte/mes-entrees' : '/cahier-texte/list')
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || 'Erreur lors de l\'enregistrement',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>{isEdit ? 'Modifier' : 'Nouvelle'} Entrée du Cahier de Texte</strong>
            <CButton
              color="secondary"
              size="sm"
              onClick={() => navigate(isProfesseur ? '/cahier-texte/mes-entrees' : '/cahier-texte/list')}
            >
              <CIcon icon={cilArrowLeft} className="me-2" />
              Retour
            </CButton>
          </CCardHeader>
          <CCardBody>
            {loading && !isEdit ? (
              <div className="text-center p-4">
                <CSpinner color="primary" />
              </div>
            ) : (
              <CForm onSubmit={(e) => handleSubmit(e, false)}>
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="program_id">Programme (Cours + Classe) *</CFormLabel>
                    <CFormSelect
                      id="program_id"
                      value={formData.program_id}
                      onChange={(e) =>
                        setFormData({ ...formData, program_id: parseInt(e.target.value) })
                      }
                      required
                    >
                      <option value={0}>Sélectionner un programme...</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.course_element?.name} - {program.class_group?.group_name}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="session_date">Date de la séance *</CFormLabel>
                    <CFormInput
                      type="date"
                      id="session_date"
                      value={formData.session_date}
                      onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                      required
                    />
                  </CCol>
                </CRow>

                <CRow className="mb-3">
                  <CCol md={4}>
                    <CFormLabel htmlFor="start_time">Heure de début *</CFormLabel>
                    <CFormInput
                      type="time"
                      id="start_time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      onBlur={calculateHours}
                      required
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="end_time">Heure de fin *</CFormLabel>
                    <CFormInput
                      type="time"
                      id="end_time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      onBlur={calculateHours}
                      required
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="hours_taught">Heures enseignées</CFormLabel>
                    <CFormInput
                      type="number"
                      id="hours_taught"
                      value={formData.hours_taught}
                      onChange={(e) =>
                        setFormData({ ...formData, hours_taught: parseFloat(e.target.value) })
                      }
                      step="0.5"
                      min="0"
                      readOnly
                    />
                  </CCol>
                </CRow>

                <div className="mb-3">
                  <CFormLabel htmlFor="session_title">Titre de la séance *</CFormLabel>
                  <CFormInput
                    type="text"
                    id="session_title"
                    value={formData.session_title}
                    onChange={(e) => setFormData({ ...formData, session_title: e.target.value })}
                    placeholder="Ex: Introduction aux algorithmes de tri"
                    required
                  />
                </div>

                <div className="mb-3">
                  <CFormLabel htmlFor="content_covered">Contenu couvert *</CFormLabel>
                  <CFormTextarea
                    id="content_covered"
                    rows={4}
                    value={formData.content_covered}
                    onChange={(e) => setFormData({ ...formData, content_covered: e.target.value })}
                    placeholder="Décrivez le contenu de la séance..."
                    required
                  />
                </div>

                <div className="mb-3">
                  <CFormLabel htmlFor="objectives">Objectifs pédagogiques</CFormLabel>
                  <CFormTextarea
                    id="objectives"
                    rows={3}
                    value={formData.objectives}
                    onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                    placeholder="Quels sont les objectifs de cette séance ?"
                  />
                </div>

                <div className="mb-3">
                  <CFormLabel htmlFor="teaching_methods">Méthodes pédagogiques</CFormLabel>
                  <CFormTextarea
                    id="teaching_methods"
                    rows={3}
                    value={formData.teaching_methods}
                    onChange={(e) =>
                      setFormData({ ...formData, teaching_methods: e.target.value })
                    }
                    placeholder="Ex: Cours magistral, travaux pratiques, études de cas..."
                  />
                </div>

                <div className="mb-3">
                  <CFormLabel htmlFor="homework">Devoirs à faire</CFormLabel>
                  <CFormTextarea
                    id="homework"
                    rows={3}
                    value={formData.homework}
                    onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                    placeholder="Décrivez les devoirs à faire..."
                  />
                </div>

                {formData.homework && (
                  <div className="mb-3">
                    <CFormLabel htmlFor="homework_due_date">Date limite des devoirs</CFormLabel>
                    <CFormInput
                      type="date"
                      id="homework_due_date"
                      value={formData.homework_due_date}
                      onChange={(e) =>
                        setFormData({ ...formData, homework_due_date: e.target.value })
                      }
                    />
                  </div>
                )}

                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="students_present">Étudiants présents</CFormLabel>
                    <CFormInput
                      type="number"
                      id="students_present"
                      value={formData.students_present}
                      onChange={(e) =>
                        setFormData({ ...formData, students_present: parseInt(e.target.value) })
                      }
                      min="0"
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="students_absent">Étudiants absents</CFormLabel>
                    <CFormInput
                      type="number"
                      id="students_absent"
                      value={formData.students_absent}
                      onChange={(e) =>
                        setFormData({ ...formData, students_absent: parseInt(e.target.value) })
                      }
                      min="0"
                    />
                  </CCol>
                </CRow>

                <div className="mb-3">
                  <CFormLabel htmlFor="observations">Observations</CFormLabel>
                  <CFormTextarea
                    id="observations"
                    rows={3}
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    placeholder="Remarques, incidents, points à noter..."
                  />
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <CButton
                    color="secondary"
                    onClick={() => navigate(isProfesseur ? '/cahier-texte/mes-entrees' : '/cahier-texte/list')}
                    disabled={loading}
                  >
                    Annuler
                  </CButton>
                  <CButton color="warning" type="submit" disabled={loading}>
                    {loading ? <CSpinner size="sm" className="me-2" /> : null}
                    <CIcon icon={cilSave} className="me-2" />
                    Enregistrer comme brouillon
                  </CButton>
                  <CButton
                    color="success"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={loading}
                  >
                    {loading ? <CSpinner size="sm" className="me-2" /> : null}
                    <CIcon icon={cilSave} className="me-2" />
                    Enregistrer et publier
                  </CButton>
                </div>
              </CForm>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default EntryForm
