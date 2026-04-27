import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CFormSelect,
  CFormInput,
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CSpinner,
  CBadge,
} from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import CIcon from '@coreui/icons-react'
import CahierService from '@/services/cahier.service'
import InscriptionService from '@/services/inscription.service'
import type { TextbookEntry, TextbookEntryStatus } from '@/types/cahier-texte.types'

const ViewByClass: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [classGroups, setClassGroups] = useState<any[]>([])
  const [selectedClassGroup, setSelectedClassGroup] = useState<number>(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [entries, setEntries] = useState<TextbookEntry[]>([])

  useEffect(() => {
    loadClassGroups()
  }, [])

  const loadClassGroups = async () => {
    try {
      // Get current academic year and default values
      const years = await InscriptionService.academicYears()
      const currentYear = years.find((y: any) => y.is_current)
      if (!currentYear) return
      
      const response = await InscriptionService.getClassGroups(
        currentYear.id,
        1, // default department
        'L1' // default level
      )
      setClassGroups(response.data || [])
    } catch (error) {
      console.error('Erreur chargement groupes:', error)
    }
  }

  const loadEntries = async () => {
    if (!selectedClassGroup) return

    setLoading(true)
    try {
      const { data } = await CahierService.getEntriesByClassGroup(selectedClassGroup, {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status: 'published',
        per_page: 1000,
      })
      setEntries(data)
    } catch (error) {
      console.error('Erreur chargement entrées:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: TextbookEntryStatus) => {
    const badges = {
      draft: { color: 'warning', text: 'Brouillon' },
      published: { color: 'info', text: 'Publié' },
      validated: { color: 'success', text: 'Validé' },
    }
    const badge = badges[status] || badges.draft
    return <CBadge color={badge.color}>{badge.text}</CBadge>
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Cahier de Texte par Classe</strong>
          </CCardHeader>
          <CCardBody>
            <CRow className="mb-3">
              <CCol md={4}>
                <CFormSelect
                  value={selectedClassGroup}
                  onChange={(e) => setSelectedClassGroup(parseInt(e.target.value))}
                >
                  <option value={0}>Sélectionner une classe...</option>
                  {classGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.group_name} - {group.study_level}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormInput
                  type="date"
                  placeholder="Date début"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </CCol>
              <CCol md={3}>
                <CFormInput
                  type="date"
                  placeholder="Date fin"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </CCol>
              <CCol md={2}>
                <CButton
                  color="primary"
                  onClick={loadEntries}
                  disabled={!selectedClassGroup || loading}
                  className="w-100"
                >
                  {loading ? <CSpinner size="sm" /> : 'Afficher'}
                </CButton>
              </CCol>
            </CRow>

            {loading ? (
              <div className="text-center p-4">
                <CSpinner color="primary" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center p-4 text-muted">
                {selectedClassGroup
                  ? 'Aucune entrée trouvée pour cette classe'
                  : 'Sélectionnez une classe pour voir les entrées'}
              </div>
            ) : (
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Titre</CTableHeaderCell>
                    <CTableHeaderCell>Cours</CTableHeaderCell>
                    <CTableHeaderCell>Professeur</CTableHeaderCell>
                    <CTableHeaderCell>Heures</CTableHeaderCell>
                    <CTableHeaderCell>Devoirs</CTableHeaderCell>
                    <CTableHeaderCell>Statut</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {entries.map((entry) => (
                    <CTableRow key={entry.id}>
                      <CTableDataCell>
                        {new Date(entry.session_date).toLocaleDateString('fr-FR')}
                      </CTableDataCell>
                      <CTableDataCell>{entry.session_title}</CTableDataCell>
                      <CTableDataCell>{entry.course_element?.name || '-'}</CTableDataCell>
                      <CTableDataCell>
                        {entry.professor
                          ? `${entry.professor.first_name} ${entry.professor.last_name}`
                          : '-'}
                      </CTableDataCell>
                      <CTableDataCell>{entry.hours_taught}h</CTableDataCell>
                      <CTableDataCell>
                        {entry.homework ? (
                          <CBadge color="warning">Oui</CBadge>
                        ) : (
                          <CBadge color="secondary">Non</CBadge>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>{getStatusBadge(entry.status)}</CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="info"
                          size="sm"
                          onClick={() => navigate(`/cahier-texte/detail/${entry.id}`)}
                        >
                          👁️
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ViewByClass
