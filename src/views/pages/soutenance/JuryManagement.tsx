import React, { useState, useEffect, useCallback } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CAlert,
  CRow,
  CCol,
  CBadge,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilTrash, cilPencil } from '@coreui/icons'
import Select from 'react-select'
import Swal from 'sweetalert2'
import soutenanceService from '../../../services/soutenance.service'
import { LoadingSpinner } from '@/components'

interface JurySubmission {
  id: number
  student_name: string
  thesis_title: string
  professor_name: string
  professor_id: number
  defense_type: string
  jury_status: string
  room: string
  defense_date: string
  jury_members: JuryMember[]
}

interface JuryMember {
  id?: number
  professor_id: number | string
  role: string
  external_name?: string
}

interface FilterOption {
  value: string | number
  label: string
}

const JuryManagement: React.FC = () => {
  const [submissions, setSubmissions] = useState<JurySubmission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<JurySubmission[]>([])
  const [academicYears, setAcademicYears] = useState<FilterOption[]>([])
  const [professors, setProfessors] = useState<FilterOption[]>([])
  const [rooms, setRooms] = useState<FilterOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [selectedYear, setSelectedYear] = useState<FilterOption | null>(null)
  const [selectedType, setSelectedType] = useState<FilterOption | null>(null)
  const [selectedJuryStatus, setSelectedJuryStatus] = useState<FilterOption | null>(null)
  const [selectedScheduled, setSelectedScheduled] = useState<FilterOption | null>(null)
  
  const [showJuryModal, setShowJuryModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<JurySubmission | null>(null)
  const [juryMembers, setJuryMembers] = useState<JuryMember[]>([])
  const [roomId, setRoomId] = useState<FilterOption | null>(null)
  const [defenseDate, setDefenseDate] = useState('')

  const typeOptions: FilterOption[] = [
    { value: '', label: 'Tous' },
    { value: 'licence', label: 'Licence' },
    { value: 'master', label: 'Master' },
    { value: 'engineering', label: 'Ingénieur' },
  ]

  const juryStatusOptions: FilterOption[] = [
    { value: '', label: 'Tous' },
    { value: 'complete', label: 'Complet' },
    { value: 'incomplete', label: 'Incomplet' },
  ]

  const scheduledOptions: FilterOption[] = [
    { value: '', label: 'Tous' },
    { value: 'scheduled', label: 'Planifiés' },
    { value: 'unscheduled', label: 'Non planifiés' },
  ]

  const roleOptions: FilterOption[] = [
    { value: '', label: 'Sélectionner un rôle' },
    { value: 'Président du Jury', label: 'Président du Jury' },
    { value: 'Maitre de mémoire', label: 'Maître de mémoire' },
    { value: 'Examinateur', label: 'Examinateur' },
    { value: 'Membre du Jury', label: 'Membre du Jury' },
  ]

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterSubmissions()
  }, [submissions, selectedYear, selectedType, selectedJuryStatus, selectedScheduled])

  const loadData = async () => {
    try {
      setLoading(true)
      const [submissionsData, yearsData, profsData, roomsData] = await Promise.all([
        soutenanceService.getJurySubmissions(),
        soutenanceService.getAcademicYears(),
        soutenanceService.getProfessors(),
        soutenanceService.getRooms(),
      ])
      
      setSubmissions(submissionsData)
      setAcademicYears([
        { value: '', label: 'Toutes' },
        ...yearsData.map((y: any) => ({ value: y.id, label: y.academic_year })),
      ])
      setProfessors(
        profsData.map((p: any) => ({
          value: p.id,
          label: `${p.first_name} ${p.last_name}${p.grade ? ' - ' + p.grade.abbreviation : ''}`,
        }))
      )
      setRooms(roomsData.map((r: any) => ({ value: r.id, label: r.name })))
      
      if (yearsData.length > 0) {
        setSelectedYear({ value: yearsData[0].id, label: yearsData[0].academic_year })
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const filterSubmissions = useCallback(() => {
    let filtered = [...submissions]
    
    if (selectedType && selectedType.value) {
      filtered = filtered.filter((s) => s.defense_type === selectedType.value)
    }
    if (selectedJuryStatus && selectedJuryStatus.value) {
      filtered = filtered.filter((s) => s.jury_status === selectedJuryStatus.value)
    }
    if (selectedScheduled && selectedScheduled.value === 'scheduled') {
      filtered = filtered.filter((s) => s.defense_date)
    } else if (selectedScheduled && selectedScheduled.value === 'unscheduled') {
      filtered = filtered.filter((s) => !s.defense_date)
    }
    
    setFilteredSubmissions(filtered)
  }, [submissions, selectedType, selectedJuryStatus, selectedScheduled])

  const getJuryCountByType = (type: string) => {
    const requirements: Record<string, number> = {
      licence: 3,
      master: 3,
      engineering: 4,
      ingénieur: 4,
    }
    return requirements[type.toLowerCase()] || 3
  }

  const handleConfigureJury = async (submission: JurySubmission) => {
    setSelectedSubmission(submission)
    
    try {
      const juryData = await soutenanceService.getJury(submission.id)
      
      if (juryData.members && juryData.members.length > 0) {
        setJuryMembers(juryData.members)
      } else {
        const requiredCount = getJuryCountByType(submission.defense_type)
        const initialMembers: JuryMember[] = []
        
        if (submission.professor_id) {
          initialMembers.push({
            professor_id: submission.professor_id,
            role: 'Maitre de mémoire',
          })
        }
        
        const remaining = requiredCount - initialMembers.length
        for (let i = 0; i < remaining; i++) {
          initialMembers.push({ professor_id: '', role: '' })
        }
        
        setJuryMembers(initialMembers)
      }
      
      if (juryData.room) {
        const room = rooms.find((r) => r.value === juryData.room)
        setRoomId(room || null)
      }
      if (juryData.defense_date) {
        setDefenseDate(juryData.defense_date)
      }
    } catch (err) {
      const requiredCount = getJuryCountByType(submission.defense_type)
      const initialMembers: JuryMember[] = []
      
      if (submission.professor_id) {
        initialMembers.push({
          professor_id: submission.professor_id,
          role: 'Maitre de mémoire',
        })
      }
      
      const remaining = requiredCount - initialMembers.length
      for (let i = 0; i < remaining; i++) {
        initialMembers.push({ professor_id: '', role: '' })
      }
      
      setJuryMembers(initialMembers)
    }
    
    setShowJuryModal(true)
  }

  const addJuryMember = () => {
    if (!selectedSubmission) return
    const requiredCount = getJuryCountByType(selectedSubmission.defense_type)
    if (juryMembers.length >= requiredCount) {
      Swal.fire('Attention', `Un jury ${selectedSubmission.defense_type} requiert ${requiredCount} membres maximum.`, 'warning')
      return
    }
    setJuryMembers([...juryMembers, { professor_id: '', role: '' }])
  }

  const removeMember = (index: number) => {
    setJuryMembers(juryMembers.filter((_, i) => i !== index))
  }

  const updateMember = (index: number, field: 'professor_id' | 'role', value: any) => {
    const updated = [...juryMembers]
    updated[index] = { ...updated[index], [field]: value }
    setJuryMembers(updated)
  }

  const handleSubmitJury = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubmission) return

    try {
      await soutenanceService.saveJury(selectedSubmission.id, {
        room_id: roomId?.value,
        defense_date: defenseDate,
        jury_members: juryMembers,
      })
      Swal.fire('Succès', 'Le jury a été enregistré avec succès', 'success')
      setShowJuryModal(false)
      loadData()
    } catch (err: any) {
      Swal.fire('Erreur', err.message || 'Une erreur est survenue', 'error')
    }
  }

  const handleExport = async (type: 'proposals' | 'notes') => {
    if (!selectedType || !selectedType.value) {
      Swal.fire('Attention', 'Veuillez sélectionner un type de soutenance pour l\'export.', 'warning')
      return
    }

    try {
      const blob = await soutenanceService.exportJury(type, selectedYear?.value, selectedType.value)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}_${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      Swal.fire('Erreur', err.message || 'Erreur lors de l\'export', 'error')
    }
  }

  if (loading) return <LoadingSpinner fullPage message="Chargement..." />

  return (
    <>
      <CCard className="mb-4 shadow-sm">
        <CCardHeader>
          <h4 className="mb-0">Constitution des Jurys de Soutenance</h4>
        </CCardHeader>
        <CCardBody>
          {error && <CAlert color="danger">{error}</CAlert>}

          {/* Filtres */}
          <div className="mb-3 p-3 bg-light rounded">
            <CRow>
              <CCol md={3}>
                <label className="form-label">Année Académique</label>
                <Select
                  options={academicYears}
                  value={selectedYear}
                  onChange={setSelectedYear}
                  placeholder="Sélectionner..."
                />
              </CCol>
              <CCol md={3}>
                <label className="form-label">Type de Soutenance</label>
                <Select
                  options={typeOptions}
                  value={selectedType}
                  onChange={setSelectedType}
                  placeholder="Tous"
                />
              </CCol>
              <CCol md={3}>
                <label className="form-label">Statut Jury</label>
                <Select
                  options={juryStatusOptions}
                  value={selectedJuryStatus}
                  onChange={setSelectedJuryStatus}
                  placeholder="Tous"
                />
              </CCol>
              <CCol md={3}>
                <label className="form-label">Planification</label>
                <Select
                  options={scheduledOptions}
                  value={selectedScheduled}
                  onChange={setSelectedScheduled}
                  placeholder="Tous"
                />
              </CCol>
            </CRow>
          </div>

          {/* Boutons Export */}
          <div className="mb-3">
            <CButton color="info" className="me-2" onClick={() => handleExport('proposals')}>
              Exporter Propositions Jury
            </CButton>
            <CButton color="success" onClick={() => handleExport('notes')}>
              Exporter Notes de Service
            </CButton>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <CTable striped hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Étudiant</CTableHeaderCell>
                  <CTableHeaderCell>Titre du Mémoire</CTableHeaderCell>
                  <CTableHeaderCell>Encadreur</CTableHeaderCell>
                  <CTableHeaderCell>Type</CTableHeaderCell>
                  <CTableHeaderCell>Statut Jury</CTableHeaderCell>
                  <CTableHeaderCell>Salle</CTableHeaderCell>
                  <CTableHeaderCell>Date/Heure</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredSubmissions.map((submission, index) => (
                  <CTableRow key={submission.id}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{submission.student_name}</CTableDataCell>
                    <CTableDataCell>{submission.thesis_title}</CTableDataCell>
                    <CTableDataCell>{submission.professor_name}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color="info">{submission.defense_type}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={submission.jury_status === 'complete' ? 'success' : 'danger'}>
                        {submission.jury_status}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>{submission.room || '-'}</CTableDataCell>
                    <CTableDataCell>{submission.defense_date || '-'}</CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="primary"
                        size="sm"
                        onClick={() => handleConfigureJury(submission)}
                      >
                        <CIcon icon={cilPencil} /> Configurer
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>

      {/* Modal Configuration Jury */}
      <CModal size="lg" visible={showJuryModal} onClose={() => setShowJuryModal(false)}>
        <CModalHeader className="bg-primary text-white">
          <CModalTitle>
            Constitution du Jury
            {selectedSubmission && (
              <CBadge color="info" className="ms-2">
                {selectedSubmission.defense_type}
              </CBadge>
            )}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmitJury}>
          <CModalBody>
            {/* Planification */}
            <CCard className="mb-3 border-0 shadow-sm">
              <CCardHeader className="bg-light">
                <h6 className="mb-0">Planification de la Soutenance</h6>
              </CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol md={6}>
                    <CFormLabel>Salle de Soutenance</CFormLabel>
                    <Select
                      options={rooms}
                      value={roomId}
                      onChange={setRoomId}
                      placeholder="Sélectionner une salle"
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel>Date et Heure</CFormLabel>
                    <CFormInput
                      type="datetime-local"
                      value={defenseDate}
                      onChange={(e) => setDefenseDate(e.target.value)}
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* Membres du Jury */}
            <CCard className="border-0 shadow-sm">
              <CCardHeader className="bg-light d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Composition du Jury</h6>
                <CButton color="primary" size="sm" onClick={addJuryMember}>
                  <CIcon icon={cilPlus} /> Ajouter un membre
                </CButton>
              </CCardHeader>
              <CCardBody>
                {juryMembers.map((member, index) => (
                  <CRow key={index} className="mb-3 align-items-end">
                    <CCol md={5}>
                      <label className="form-label small">Professeur</label>
                      <Select
                        options={professors}
                        value={professors.find((p) => p.value === member.professor_id)}
                        onChange={(option) => updateMember(index, 'professor_id', option?.value || '')}
                        placeholder="Sélectionner..."
                      />
                    </CCol>
                    <CCol md={5}>
                      <label className="form-label small">Rôle</label>
                      <Select
                        options={roleOptions}
                        value={roleOptions.find((r) => r.value === member.role)}
                        onChange={(option) => updateMember(index, 'role', option?.value || '')}
                        placeholder="Sélectionner..."
                      />
                    </CCol>
                    <CCol md={2}>
                      <CButton color="danger" size="sm" onClick={() => removeMember(index)}>
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CCol>
                  </CRow>
                ))}
              </CCardBody>
            </CCard>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowJuryModal(false)}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit">
              Enregistrer
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default JuryManagement
