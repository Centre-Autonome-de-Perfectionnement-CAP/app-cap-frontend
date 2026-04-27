import { useState, useEffect, useCallback } from 'react'
import {
  CCard, CCardBody, CCardHeader, CBadge,
  CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CSpinner,
  CAlert, CFormSelect, CFormInput, CButton,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import alumniAdminService, { type AlumniRecord } from '@/services/alumni.admin.service'

const SECTEUR_LABELS: Record<string, string> = {
  enseignement_education: 'Enseignement / Éducation',
  informatique_digital_telecoms: 'Informatique / Digital / Télécoms',
  web_numerique_reseaux: 'Web / Numérique / Réseaux',
  industrie_energie_production_robotique: 'Industrie / Énergie / Robotique',
  fonction_publique_secteur_public: 'Fonction publique',
  administration_diplomatie: 'Administration / Diplomatie',
  banque_assurance_finance: 'Banque / Assurance / Finance',
  audit_comptabilite_conseil_gestion: 'Audit / Comptabilité / Conseil',
  medical_sante_hopital: 'Médical / Santé',
  recherche_publique: 'Recherche publique',
  batiment_travaux_publics_construction: 'BTP / Construction',
  environnement_climat_ecologie: 'Environnement / Écologie',
  commerce_distribution_vente: 'Commerce / Distribution / Vente',
  autres: 'Autres',
}

const AlumniList = () => {
  const [alumni, setAlumni] = useState<AlumniRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ecoleFilter, setEcoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<AlumniRecord | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await alumniAdminService.getAll({ ecole: ecoleFilter || undefined, search: search || undefined })
      setAlumni(res?.data ?? [])
      setTotal(res?.total ?? 0)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des alumni.')
    } finally {
      setLoading(false)
    }
  }, [ecoleFilter, search])

  useEffect(() => {
    load()
  }, [load])

  return (
    <>
      {error && (
        <CAlert color="danger" dismissible onClose={() => setError(null)}>
          {error}
        </CAlert>
      )}

      {/* Filtres */}
      <CCard className="mb-4">
        <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <strong>
            Fiches Alumni
            <CBadge color="primary" className="ms-2">{total} enregistrement{total > 1 ? 's' : ''}</CBadge>
          </strong>
          <div className="d-flex gap-2 flex-wrap">
            <CFormInput
              placeholder="Rechercher nom, prénom, email..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              style={{ width: 240 }}
              size="sm"
            />
            <CFormSelect
              value={ecoleFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEcoleFilter(e.target.value)}
              style={{ width: 150 }}
              size="sm"
            >
              <option value="">Toutes les écoles</option>
              <option value="CAP">CAP</option>
              <option value="EPAC">EPAC</option>
            </CFormSelect>
          </div>
        </CCardHeader>

        <CCardBody>
          {loading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />
              <p className="mt-2 text-muted">Chargement...</p>
            </div>
          ) : alumni.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <div style={{ fontSize: 40 }}>📭</div>
              <p>Aucune fiche alumni trouvée.</p>
            </div>
          ) : (
            <CTable hover responsive bordered small>
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>École</CTableHeaderCell>
                  <CTableHeaderCell>Nom & Prénom</CTableHeaderCell>
                  <CTableHeaderCell>Contact</CTableHeaderCell>
                  <CTableHeaderCell>Filière</CTableHeaderCell>
                  <CTableHeaderCell>Promo</CTableHeaderCell>
                  <CTableHeaderCell>Situation</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Détails</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {alumni.map((a, i) => (
                  <CTableRow key={a.id}>
                    <CTableDataCell style={{ fontSize: 12, color: '#888' }}>{i + 1}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={a.ecole === 'CAP' ? 'primary' : 'success'}>{a.ecole}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div>
                        <strong>{a.nom} {a.prenom}</strong>
                        <div style={{ fontSize: 11, color: '#888' }}>{a.civilite}</div>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell style={{ fontSize: 12 }}>
                      <div>{a.mail}</div>
                      <div style={{ color: '#888' }}>{a.telephone}</div>
                    </CTableDataCell>
                    <CTableDataCell style={{ fontSize: 12 }}>
                      <strong>{a.formation}</strong>
                    </CTableDataCell>
                    <CTableDataCell style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                      {a.annee_entree} → {a.annee_sortie}
                      <div style={{ color: '#888' }}>Promo {a.promotion}</div>
                    </CTableDataCell>
                    <CTableDataCell style={{ fontSize: 12 }}>
                      <div>{a.type_emploi}</div>
                      {a.nom_entreprise && (
                        <div style={{ color: '#555' }}>{a.nom_entreprise}</div>
                      )}
                    </CTableDataCell>
                    <CTableDataCell style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>
                      {new Date(a.created_at).toLocaleDateString('fr-FR')}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="info"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected(a)}
                      >
                        Voir
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* Modale détail */}
      <CModal visible={!!selected} onClose={() => setSelected(null)} size="lg">
        <CModalHeader>
          <CModalTitle>
            👤 Fiche Alumni — {selected?.nom} {selected?.prenom}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selected && (
            <div className="row g-3">
              {[
                { label: 'École', value: selected.ecole },
                { label: 'Civilité', value: selected.civilite },
                { label: 'Nom', value: selected.nom },
                { label: 'Prénom', value: selected.prenom },
                { label: 'Email', value: selected.mail },
                { label: 'Téléphone', value: selected.telephone },
                { label: 'Filière', value: selected.formation + (selected.autre_formation ? ` (${selected.autre_formation})` : '') },
                { label: 'Année d\'entrée', value: selected.annee_entree },
                { label: 'Année de sortie', value: selected.annee_sortie },
                { label: 'Promotion', value: `Promo ${selected.promotion}` },
                { label: 'Situation professionnelle', value: selected.situation_professionnelle + (selected.autre_situation ? ` (${selected.autre_situation})` : '') },
                { label: 'Secteur d\'emploi', value: SECTEUR_LABELS[selected.secteur_emploi] ?? selected.secteur_emploi },
                { label: 'Secteur professionnel', value: selected.secteur_professionnel },
                { label: 'Statut emploi', value: selected.type_emploi },
                { label: 'Entreprise / Structure', value: selected.nom_entreprise ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="col-sm-6">
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 14 }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setSelected(null)}>
            Fermer
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default AlumniList
