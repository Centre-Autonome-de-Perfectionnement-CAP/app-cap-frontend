import { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CBadge,
  CFormInput,
  CFormSelect,
  CPagination,
  CPaginationItem,
} from '@coreui/react'
import { cilPlus, cilPencil, cilTrash, cilCheckAlt } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import CahierService from '@/services/cahier.service'
import type { TextbookEntry, TextbookEntryStatus } from '@/types/cahier-texte.types'

const TextbookList = () => {
  const [entries, setEntries] = useState<TextbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    loadEntries()
  }, [currentPage, search, statusFilter])

  const loadEntries = async () => {
    try {
      setLoading(true)
      const { data, meta } = await CahierService.getEntries({
        page: currentPage,
        per_page: 15,
        search: search || undefined,
        status: statusFilter || undefined,
      })
      setEntries(data)
      setTotalPages(meta.last_page)
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

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
      try {
        await CahierService.deleteEntry(id)
        loadEntries()
      } catch (error) {
        console.error('Erreur suppression:', error)
      }
    }
  }

  const handlePublish = async (id: number) => {
    try {
      await CahierService.publishEntry(id)
      loadEntries()
    } catch (error) {
      console.error('Erreur publication:', error)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Liste des entrées du cahier de texte</strong>
            <CButton color="primary" size="sm">
              <CIcon icon={cilPlus} className="me-2" />
              Nouvelle entrée
            </CButton>
          </CCardHeader>
          <CCardBody>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormInput
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                  <option value="validated">Validé</option>
                </CFormSelect>
              </CCol>
            </CRow>

            {loading ? (
              <div>Chargement...</div>
            ) : (
              <>
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Date</CTableHeaderCell>
                      <CTableHeaderCell>Titre</CTableHeaderCell>
                      <CTableHeaderCell>Cours</CTableHeaderCell>
                      <CTableHeaderCell>Classe</CTableHeaderCell>
                      <CTableHeaderCell>Heures</CTableHeaderCell>
                      <CTableHeaderCell>Statut</CTableHeaderCell>
                      <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {entries.map((entry) => (
                      <CTableRow key={entry.id}>
                        <CTableDataCell>{entry.session_date}</CTableDataCell>
                        <CTableDataCell>{entry.session_title}</CTableDataCell>
                        <CTableDataCell>
                          {entry.course_element?.name || '-'}
                        </CTableDataCell>
                        <CTableDataCell>
                          {entry.class_group?.group_name || '-'}
                        </CTableDataCell>
                        <CTableDataCell>{entry.hours_taught}h</CTableDataCell>
                        <CTableDataCell>{getStatusBadge(entry.status)}</CTableDataCell>
                        <CTableDataCell>
                          <CButton
                            color="info"
                            size="sm"
                            className="me-2"
                            title="Modifier"
                          >
                            <CIcon icon={cilPencil} />
                          </CButton>
                          {entry.status === 'draft' && (
                            <CButton
                              color="success"
                              size="sm"
                              className="me-2"
                              title="Publier"
                              onClick={() => handlePublish(entry.id)}
                            >
                              <CIcon icon={cilCheckAlt} />
                            </CButton>
                          )}
                          <CButton
                            color="danger"
                            size="sm"
                            title="Supprimer"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>

                {totalPages > 1 && (
                  <CPagination className="justify-content-center">
                    <CPaginationItem
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Précédent
                    </CPaginationItem>
                    {[...Array(totalPages)].map((_, i) => (
                      <CPaginationItem
                        key={i + 1}
                        active={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </CPaginationItem>
                    ))}
                    <CPaginationItem
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Suivant
                    </CPaginationItem>
                  </CPagination>
                )}
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default TextbookList
