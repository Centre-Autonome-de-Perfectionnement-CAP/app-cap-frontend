import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CForm,
  CAlert,
  CBadge,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilLink, cilOptions } from '@coreui/icons'
import { useCourseElementProfessors } from '@/hooks/cours'
import SearchableSelect from '@/components/forms/SearchableSelect'
import type { CourseElementProfessor } from '@/types/cours.types'

const CourseElementProfessors: React.FC = () => {
  const {
    assignments,
    courseElements,
    professors,
    classGroups, // ← ajouté
    loading,
    error,
    createAssignment,
    deleteAssignment,
    setError,
  } = useCourseElementProfessors()

  const [showModal, setShowModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<CourseElementProfessor | null>(null)
  const [formData, setFormData] = useState({
    course_element_id: '',
    principal_professor_id: '',
    secondary_professor_ids: [] as number[],
    class_group_id: '', // ← ajouté
  })
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)

  const handleShowModal = (assignment?: CourseElementProfessor) => {
    if (assignment) {
      setEditingAssignment(assignment)
      setFormData({
        course_element_id: assignment.course_element_id.toString(),
        principal_professor_id: assignment.principal_professor_id.toString(),
        secondary_professor_ids: [],
        class_group_id: (assignment as any).class_group_id?.toString() ?? '', // ← ajouté
      })
    } else {
      setEditingAssignment(null)
      setFormData({
        course_element_id: '',
        principal_professor_id: '',
        secondary_professor_ids: [],
        class_group_id: '', // ← ajouté
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAssignment(null)
    setFormData({
      course_element_id: '',
      principal_professor_id: '',
      secondary_professor_ids: [],
      class_group_id: '', // ← ajouté
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      console.log('FormData avant soumission:', formData)

      const principalData = {
        course_element_id: parseInt(formData.course_element_id),
        professor_id: parseInt(formData.principal_professor_id),
        is_primary: true,
        class_group_id: formData.class_group_id ? parseInt(formData.class_group_id) : null, // ← ajouté
      }

      console.log('Création professeur principal:', principalData)
      await createAssignment(principalData)

      console.log('Professeurs secondaires à créer:', formData.secondary_professor_ids)
      for (const secId of formData.secondary_professor_ids) {
        const secondaryData = {
          course_element_id: parseInt(formData.course_element_id),
          professor_id: secId,
          is_primary: false,
          class_group_id: formData.class_group_id ? parseInt(formData.class_group_id) : null, // ← ajouté
        }
        console.log('Création professeur secondaire:', secondaryData)
        await createAssignment(secondaryData)
      }

      setAlert({ type: 'success', message: 'Associations créées avec succès!' })
      handleCloseModal()
      setTimeout(() => setAlert(null), 5000)
    } catch (error: any) {
      setAlert({
        type: 'danger',
        message: error.response?.data?.message || 'Une erreur est survenue',
      })
      setTimeout(() => setAlert(null), 5000)
    }
  }

  const handleDelete = async (assignment: CourseElementProfessor) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette association ?')) {
      try {
        await deleteAssignment(assignment.id)
        setAlert({ type: 'success', message: 'Association supprimée avec succès!' })
        setTimeout(() => setAlert(null), 5000)
      } catch (error) {
        setAlert({ type: 'danger', message: 'Erreur lors de la suppression' })
        setTimeout(() => setAlert(null), 5000)
      }
    }
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>
                <CIcon icon={cilLink} className="me-2" />
                Associations Matière-Professeur
              </strong>
              <CButton color="primary" onClick={() => handleShowModal()}>
                <CIcon icon={cilPlus} className="me-2" />
                Nouvelle Association
              </CButton>
            </CCardHeader>
            <CCardBody>
              {alert && (
                <CAlert color={alert.type} dismissible onClose={() => setAlert(null)}>
                  {alert.message}
                </CAlert>
              )}

              {error && (
                <CAlert color="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </CAlert>
              )}

              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Matière (ECUE)</CTableHeaderCell>
                    <CTableHeaderCell>Code</CTableHeaderCell>
                    <CTableHeaderCell>UE</CTableHeaderCell>
                    <CTableHeaderCell>Classe</CTableHeaderCell> {/* ← ajouté */}
                    <CTableHeaderCell>Professeur</CTableHeaderCell>
                    <CTableHeaderCell>Type</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center">
                        Chargement...
                      </CTableDataCell>
                    </CTableRow>
                  ) : assignments.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center text-muted">
                        Aucune association trouvée
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    assignments.map((assignment) => (
                      <CTableRow key={assignment.id}>
                        <CTableDataCell>{assignment.course_element?.name}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="primary">{assignment.course_element?.code}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="info">
                            {assignment.course_element?.teaching_unit?.code}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell> {/* ← ajouté */}
                          {(assignment as any).class_group?.name ?? '—'}
                        </CTableDataCell>
                        <CTableDataCell>{assignment.professor?.full_name}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={assignment.is_primary ? 'success' : 'secondary'}>
                            {assignment.is_primary ? 'Principal' : 'Secondaire'}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CDropdown>
                            <CDropdownToggle color="ghost" size="sm">
                              <CIcon icon={cilOptions} />
                            </CDropdownToggle>
                            <CDropdownMenu>
                              <CDropdownItem onClick={() => handleShowModal(assignment)}>
                                <CIcon icon={cilPencil} className="me-2" />
                                Modifier
                              </CDropdownItem>
                              <CDropdownItem
                                onClick={() => handleDelete(assignment)}
                                className="text-danger"
                              >
                                <CIcon icon={cilTrash} className="me-2" />
                                Supprimer
                              </CDropdownItem>
                            </CDropdownMenu>
                          </CDropdown>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CModal visible={showModal} onClose={handleCloseModal}>
        <CModalHeader>
          <CModalTitle>
            {editingAssignment ? "Modifier l'association" : 'Nouvelle Association Matière-Professeur'}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <SearchableSelect
              id="course_element_id"
              label="Matière (ECUE)"
              value={formData.course_element_id}
              onChange={(value) => setFormData({ ...formData, course_element_id: value.toString() })}
              options={courseElements.map((el) => ({ value: el.id, label: `${el.code} - ${el.name}` }))}
              placeholder="Sélectionner une matière"
              required
            />
            {/* ── Classe ── ajouté */}
            <SearchableSelect
              id="class_group_id"
              label="Classe"
              value={formData.class_group_id}
              onChange={(value) => setFormData({ ...formData, class_group_id: value.toString() })}
              options={classGroups.map((g) => ({ value: g.id, label: g.group_name }))}
              placeholder="Sélectionner une classe"
            />
            <SearchableSelect
              id="principal_professor_id"
              label="Professeur Principal"
              value={formData.principal_professor_id}
              onChange={(value) =>
                setFormData({ ...formData, principal_professor_id: value.toString() })
              }
              options={professors.map((p) => ({ value: p.id, label: p.full_name }))}
              placeholder="Sélectionner le professeur principal"
              required
            />
            <SearchableSelect
              id="secondary_professor_ids"
              label="Professeurs Secondaires (optionnel)"
              value={formData.secondary_professor_ids}
              onChange={(values) => {
                const ids = Array.isArray(values) ? values.map((v) => Number(v)) : []
                console.log('Professeurs secondaires sélectionnés:', ids)
                setFormData({ ...formData, secondary_professor_ids: ids })
              }}
              options={professors
                .filter((p) => p.id.toString() !== formData.principal_professor_id)
                .map((p) => ({ value: p.id, label: p.full_name }))}
              placeholder="Sélectionner les professeurs secondaires"
              multiple
            />
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={handleCloseModal}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit">
              {editingAssignment ? 'Mettre à jour' : 'Créer'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default CourseElementProfessors
