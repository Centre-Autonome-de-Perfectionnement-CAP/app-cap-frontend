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
  CSpinner,
  CAlert,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTrash, cilSearch, cilPeople } from '@coreui/icons'
import AlumniService from '@/services/alumni.service'
import type { Alumni } from '@/services/alumni.service'
import Swal from 'sweetalert2'

const TYPE_COLORS: Record<string, string> = {
  Employeur: 'success',
  Employe: 'primary',
  Aucun: 'secondary',
}

const AlumniList = () => {
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filtres
  const [search, setSearch] = useState('')
  const [filterEcole, setFilterEcole] = useState('')
  const [filterTypeEmploi, setFilterTypeEmploi] = useState('')
  const [filterAnneeSortie, setFilterAnneeSortie] = useState('')

  // Modal détail
  const [selected, setSelected] = useState<Alumni | null>(null)

  useEffect(() => {
    loadAlumni()
  }, [currentPage, search, filterEcole, filterTypeEmploi, filterAnneeSortie])

  const loadAlumni = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, meta } = await AlumniService.getAll({
        search: search || undefined,
        ecole: filterEcole || undefined,
        type_emploi: filterTypeEmploi || undefined,
        annee_sortie: filterAnneeSortie || undefined,
        page: currentPage,
        per_page: 20,
      })
      setAlumni(data)
      setTotalPages(meta?.last_page || 1)
      setTotal(meta?.total || 0)
    } catch (e: any) {
      setError(e.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, nom: string) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: `Supprimer ${nom} ?`,
      text: 'Cette action est irréversible.',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
    })
    if (!confirm.isConfirmed) return
    try {
      await AlumniService.delete(id)
      Swal.fire({ icon: 'success', title: 'Supprimé', timer: 1500, showConfirmButton: false })
      loadAlumni()
    } catch {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de supprimer cet alumni' })
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4 border-0 shadow-sm">
          <CCardHeader className="d-flex justify-content-between align-items-center bg-transparent">
            <div>
              <CIcon icon={cilPeople} className="me-2 text-primary" />
              <strong>Liste des Alumni</strong>
              {total > 0 && <CBadge color="primary" className="ms-2">{total}</CBadge>}
            </div>
          </CCardHeader>
          <CCardBody>
            {/* Filtres */}
            <CRow className="mb-3 g-2">
              <CCol md={4}>
                <CFormInput
                  type="text"
                  placeholder="Rechercher par nom, email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadAlumni()}
                />
              </CCol>
              <CCol md={2}>
                <CFormSelect value={filterEcole} onChange={e => setFilterEcole(e.target.value)}>
                  <option value="">Toutes écoles</option>
                  <option value="CAP">CAP</option>
                  <option value="EPAC">EPAC</option>
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={filterTypeEmploi} onChange={e => setFilterTypeEmploi(e.target.value)}>
                  <option value="">Tout type emploi</option>
                  <option value="Employeur">Employeur</option>
                  <option value="Employe">Employé</option>
                  <option value="Aucun">Sans emploi</option>
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <CFormInput
                  type="text"
                  placeholder="Année sortie"
                  maxLength={4}
                  value={filterAnneeSortie}
                  onChange={e => setFilterAnneeSortie(e.target.value)}
                />
              </CCol>
              <CCol md={1}>
                <CButton color="primary" className="w-100" onClick={() => { setCurrentPage(1); loadAlumni() }}>
                  <CIcon icon={cilSearch} />
                </CButton>
              </CCol>
            </CRow>

            {error && <CAlert color="danger">{error}</CAlert>}

            {loading ? (
              <div className="text-center p-5">
                <CSpinner color="primary" />
              </div>
            ) : alumni.length === 0 ? (
              <div className="text-center p-5 text-muted">
                <CIcon icon={cilPeople} size="3xl" className="mb-3 opacity-25" />
                <p>Aucun alumni trouvé pour ces critères.</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <CTable hover small>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>#</CTableHeaderCell>
                        <CTableHeaderCell>Nom & Prénom</CTableHeaderCell>
                        <CTableHeaderCell>École</CTableHeaderCell>
                        <CTableHeaderCell>Formation</CTableHeaderCell>
                        <CTableHeaderCell>Promo</CTableHeaderCell>
                        <CTableHeaderCell>Sortie</CTableHeaderCell>
                        <CTableHeaderCell>Type emploi</CTableHeaderCell>
                        <CTableHeaderCell>Entreprise</CTableHeaderCell>
                        <CTableHeaderCell>Actions</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {alumni.map((a, i) => (
                        <CTableRow key={a.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(a)}>
                          <CTableDataCell className="text-muted small">
                            {(currentPage - 1) * 20 + i + 1}
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="fw-semibold">{a.nom} {a.prenom}</div>
                            <small className="text-muted">{a.mail}</small>
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={a.ecole === 'CAP' ? 'info' : 'warning'}>{a.ecole}</CBadge>
                          </CTableDataCell>
                          <CTableDataCell>
                            <small>{a.formation}</small>
                          </CTableDataCell>
                          <CTableDataCell>{a.promotion}</CTableDataCell>
                          <CTableDataCell>{a.annee_sortie}</CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={TYPE_COLORS[a.type_emploi] as any || 'secondary'}>
                              {a.type_emploi}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>
                            <small>{a.nom_entreprise || '—'}</small>
                          </CTableDataCell>
                          <CTableDataCell onClick={e => e.stopPropagation()}>
                            <CButton
                              color="danger"
                              size="sm"
                              variant="outline"
                              title="Supprimer"
                              onClick={() => handleDelete(a.id, `${a.nom} ${a.prenom}`)}
                            >
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>

                {totalPages > 1 && (
                  <CPagination className="justify-content-center mt-3">
                    <CPaginationItem disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                      Précédent
                    </CPaginationItem>
                    {[...Array(Math.min(totalPages, 10))].map((_, i) => (
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

      {/* Modal détail alumni */}
      <CModal visible={!!selected} onClose={() => setSelected(null)} size="lg">
        <CModalHeader>
          <CModalTitle>
            {selected?.civilite} {selected?.nom} {selected?.prenom}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selected && (
            <CRow className="g-3">
              <CCol md={6}>
                <strong>École</strong>
                <p><CBadge color={selected.ecole === 'CAP' ? 'info' : 'warning'}>{selected.ecole}</CBadge></p>
              </CCol>
              <CCol md={6}>
                <strong>Email</strong>
                <p>{selected.mail}</p>
              </CCol>
              <CCol md={6}>
                <strong>Téléphone</strong>
                <p>{selected.telephone}</p>
              </CCol>
              <CCol md={6}>
                <strong>Formation</strong>
                <p>{selected.formation}</p>
              </CCol>
              <CCol md={4}>
                <strong>Promotion</strong>
                <p>{selected.promotion}</p>
              </CCol>
              <CCol md={4}>
                <strong>Entrée</strong>
                <p>{selected.annee_entree}</p>
              </CCol>
              <CCol md={4}>
                <strong>Sortie</strong>
                <p>{selected.annee_sortie}</p>
              </CCol>
              <CCol md={6}>
                <strong>Situation professionnelle</strong>
                <p>{selected.situation_professionnelle}</p>
              </CCol>
              <CCol md={6}>
                <strong>Type d'emploi</strong>
                <p>
                  <CBadge color={TYPE_COLORS[selected.type_emploi] as any || 'secondary'}>
                    {selected.type_emploi}
                  </CBadge>
                </p>
              </CCol>
              {selected.nom_entreprise && (
                <CCol md={6}>
                  <strong>Entreprise</strong>
                  <p>{selected.nom_entreprise}</p>
                </CCol>
              )}
              <CCol md={6}>
                <strong>Secteur d'emploi</strong>
                <p>{selected.secteur_emploi}</p>
              </CCol>
              <CCol md={6}>
                <strong>Secteur professionnel</strong>
                <p>{selected.secteur_professionnel}</p>
              </CCol>
              <CCol xs={12}>
                <small className="text-muted">
                  Inscrit le {new Date(selected.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </small>
              </CCol>
            </CRow>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setSelected(null)}>Fermer</CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default AlumniList
