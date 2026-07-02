import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  CSpinner,
  CAlert,
} from '@coreui/react'
import { cilPlus, cilPencil, cilTrash, cilCheckAlt, cilNotes } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import CahierService from '@/services/cahier.service'
import { useAuth } from '@/contexts'
import type { TextbookEntry, TextbookEntryStatus } from '@/types/cahier-texte.types'
import Swal from 'sweetalert2'

const MesEntrees = () => {
  const navigate = useNavigate()
  const { userId, nom, prenoms } = useAuth()

  const [entries, setEntries] = useState<TextbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    loadEntries()
  }, [currentPage, search, statusFilter, userId])

  const loadEntries = async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError(null)
      const { data, meta } = await CahierService.getEntriesByProfessor(userId, {
        per_page: 15,
        status: statusFilter || undefined,
      })

      // Filtrer localement sur la recherche (search)
      const filtered = search
        ? data.filter(e =>
            e.session_title?.toLowerCase().includes(search.toLowerCase()) ||
            e.content_covered?.toLowerCase().includes(search.toLowerCase())
          )
        : data

      setEntries(filtered)
      setTotalPages(meta?.last_page || 1)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de vos entrées')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: TextbookEntryStatus) => {
    const map = {
      draft: { color: 'warning', text: 'Brouillon' },
      published: { color: 'info', text: 'Publié' },
      validated: { color: 'success', text: 'Validé' },
    }
    const b = map[status] || map.draft
    return <CBadge color={b.color}>{b.text}</CBadge>
  }

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Supprimer cette entrée ?',
      text: 'Cette action est irréversible',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
    })
    if (!confirm.isConfirmed) return
    try {
      await CahierService.deleteEntry(id)
      Swal.fire({ icon: 'success', title: 'Supprimé', timer: 2000, showConfirmButton: false })
      loadEntries()
    } catch {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Erreur lors de la suppression' })
    }
  }

  const handlePublish = async (id: number) => {
    try {
      await CahierService.publishEntry(id)
      Swal.fire({ icon: 'success', title: 'Publié', timer: 2000, showConfirmButton: false })
      loadEntries()
    } catch {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Erreur lors de la publication' })
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div>
              <CIcon icon={cilNotes} className="me-2 text-warning" />
              <strong>Mes entrées du cahier de texte</strong>
              {(nom || prenoms) && (
                <span className="ms-2 text-muted small">— {prenoms} {nom}</span>
              )}
            </div>
            <CButton color="primary" size="sm" onClick={() => navigate('/cahier-texte/new')}>
              <CIcon icon={cilPlus} className="me-1" />
              Nouvelle entrée
            </CButton>
          </CCardHeader>
          <CCardBody>
            {error && <CAlert color="danger" className="mb-3">{error}</CAlert>}

            <CRow className="mb-3 g-2">
              <CCol md={6}>
                <CFormInput
                  type="text"
                  placeholder="Rechercher par titre ou contenu..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </CCol>
              <CCol md={3}>
                <CFormSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">Tous les statuts</option>
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                  <option value="validated">Validé</option>
                </CFormSelect>
              </CCol>
            </CRow>

            {loading ? (
              <div className="text-center p-5">
                <CSpinner color="primary" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center p-5 text-muted">
                <CIcon icon={cilNotes} size="3xl" className="mb-3 opacity-25" />
                <p>Aucune entrée trouvée.</p>
                <CButton color="primary" size="sm" onClick={() => navigate('/cahier-texte/new')}>
                  Créer ma première entrée
                </CButton>
              </div>
            ) : (
              <>
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Date</CTableHeaderCell>
                      <CTableHeaderCell>Titre de la séance</CTableHeaderCell>
                      <CTableHeaderCell>Cours</CTableHeaderCell>
                      <CTableHeaderCell>Classe</CTableHeaderCell>
                      <CTableHeaderCell>Heures</CTableHeaderCell>
                      <CTableHeaderCell>Statut</CTableHeaderCell>
                      <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {entries.map(entry => (
                      <CTableRow key={entry.id}>
                        <CTableDataCell>
                          {new Date(entry.session_date).toLocaleDateString('fr-FR')}
                        </CTableDataCell>
                        <CTableDataCell>
                          <strong>{entry.session_title}</strong>
                        </CTableDataCell>
                        <CTableDataCell>
                          {entry.course_element?.name || '—'}
                        </CTableDataCell>
                        <CTableDataCell>
                          {entry.class_group?.group_name || '—'}
                        </CTableDataCell>
                        <CTableDataCell>{entry.hours_taught}h</CTableDataCell>
                        <CTableDataCell>{getStatusBadge(entry.status)}</CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex gap-1">
                            <CButton
                              color="info"
                              size="sm"
                              title="Voir le détail"
                              onClick={() => navigate(`/cahier-texte/detail/${entry.id}`)}
                            >
                              👁️
                            </CButton>
                            {entry.status !== 'validated' && (
                              <CButton
                                color="warning"
                                size="sm"
                                title="Modifier"
                                onClick={() => navigate(`/cahier-texte/edit/${entry.id}`)}
                              >
                                <CIcon icon={cilPencil} />
                              </CButton>
                            )}
                            {entry.status === 'draft' && (
                              <CButton
                                color="success"
                                size="sm"
                                title="Publier"
                                onClick={() => handlePublish(entry.id)}
                              >
                                <CIcon icon={cilCheckAlt} />
                              </CButton>
                            )}
                            {entry.status === 'draft' && (
                              <CButton
                                color="danger"
                                size="sm"
                                title="Supprimer"
                                onClick={() => handleDelete(entry.id)}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            )}
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>

                {totalPages > 1 && (
                  <CPagination className="justify-content-center mt-3">
                    <CPaginationItem disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
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
                    <CPaginationItem disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
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

export default MesEntrees
