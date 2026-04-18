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
// ✅ CORRIGÉ : cilPencil remplacé par cilCheckCircle pour l'icône "Valider"
import { cilCheckCircle, cilTrash, cilCheckAlt } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import CahierService from '@/services/cahier.service'
// ✅ CORRIGÉ : TextbookEntryStatus importé en tant que valeur (pas seulement type)
//    pour pouvoir l'utiliser dans les comparaisons et l'objet badges
import { TextbookEntryStatus } from '@/types/cahier-texte.types'
import type { TextbookEntry } from '@/types/cahier-texte.types'

const TextbookList = () => {
  const [entries, setEntries] = useState<TextbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  // ✅ CORRIGÉ : statusFilter vide = affiche published + validated par défaut
  //    (le backend filtre automatiquement, pas besoin de passer un statut)
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, statusFilter])

  const loadEntries = async () => {
    try {
      setLoading(true)
      const { data, meta } = await CahierService.getEntries({
        page: currentPage,
        per_page: 15,
        search: search || undefined,
        // ✅ CORRIGÉ : on passe le filtre tel quel — quand vide, le backend
        //    applique le filtre par défaut (published + validated)
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

  // ✅ CORRIGÉ : utilise l'enum importé comme valeur (plus de type-only)
  const getStatusBadge = (status: TextbookEntryStatus) => {
    const badges: Record<TextbookEntryStatus, { color: string; text: string }> = {
      [TextbookEntryStatus.DRAFT]:     { color: 'warning', text: 'Brouillon' },
      [TextbookEntryStatus.PUBLISHED]: { color: 'info',    text: 'Signé' },
      [TextbookEntryStatus.VALIDATED]: { color: 'success', text: 'Validé' },
    }
    const badge = badges[status] ?? badges[TextbookEntryStatus.DRAFT]
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

  // ✅ CORRIGÉ : fonction handleValidate connectée au service
  const handleValidate = async (id: number) => {
    if (window.confirm('Confirmer la validation de cette entrée ?')) {
      try {
        await CahierService.validateEntry(id)
        loadEntries()
      } catch (error) {
        console.error('Erreur validation:', error)
      }
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Liste des entrées du cahier de texte</strong>
          </CCardHeader>
          <CCardBody>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormInput
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setCurrentPage(1) // reset page on new search
                  }}
                />
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setCurrentPage(1) // reset page on filter change
                  }}
                >
                  {/*
                    ✅ CORRIGÉ : l'option vide déclenche le filtre par défaut
                    du backend (published + validated uniquement)
                  */}
                  <option value="">Signé &amp; Validé (défaut)</option>
                  <option value="published">Signé</option>
                  <option value="validated">Validé</option>
                  <option value="draft">Brouillon</option>
                </CFormSelect>
              </CCol>
            </CRow>

            {loading ? (
              <div>Chargement...</div>
            ) : entries.length === 0 ? (
              <div className="text-center text-muted py-4">
                Aucune entrée trouvée.
              </div>
            ) : (
              <>
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Date</CTableHeaderCell>
                      <CTableHeaderCell>Titre</CTableHeaderCell>
                      {/* ✅ CORRIGÉ : affiché via course_element.name (relation chargée côté backend) */}
                      <CTableHeaderCell>Cours (ECUE)</CTableHeaderCell>
                      {/* ✅ CORRIGÉ : affiché via class_group.group_name (relation chargée côté backend) */}
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
                        {/* ✅ CORRIGÉ : course_element et class_group maintenant renseignés */}
                        <CTableDataCell>
                          {entry.course_element?.name ?? '-'}
                        </CTableDataCell>
                        <CTableDataCell>
                          {entry.class_group?.group_name ?? '-'}
                        </CTableDataCell>
                        <CTableDataCell>{entry.hours_taught}h</CTableDataCell>
                        <CTableDataCell>{getStatusBadge(entry.status)}</CTableDataCell>
                        <CTableDataCell>
                          {/*
                            ✅ CORRIGÉ :
                            - L'icône est cilCheckCircle (valider) et non cilPencil (modifier)
                            - Le bouton "Valider" n'apparaît que pour les entrées published
                            - handleValidate() est bien appelé au clic
                          */}
                          {entry.status === TextbookEntryStatus.PUBLISHED && (
                            <CButton
                              color="info"
                              size="sm"
                              className="me-2"
                              title="Valider"
                              onClick={() => handleValidate(entry.id)}
                            >
                              <CIcon icon={cilCheckCircle} />
                            </CButton>
                          )}

                          {/* Publier : uniquement pour les brouillons */}
                          {entry.status === TextbookEntryStatus.DRAFT && (
                            <CButton
                              color="success"
                              size="sm"
                              className="me-2"
                              title="Signer / Publier"
                              onClick={() => handlePublish(entry.id)}
                            >
                              <CIcon icon={cilCheckAlt} />
                            </CButton>
                          )}

                          {/* Supprimer : uniquement pour les brouillons */}
                          {entry.status === TextbookEntryStatus.DRAFT && (
                            <CButton
                              color="danger"
                              size="sm"
                              title="Supprimer"
                              onClick={() => handleDelete(entry.id)}
                            >
                              <CIcon icon={cilTrash} />
                            </CButton>
                          )}
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