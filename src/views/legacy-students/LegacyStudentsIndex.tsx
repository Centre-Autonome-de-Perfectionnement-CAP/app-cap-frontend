/**
 * Vue principale : Module Gestion des Anciens Étudiants (< 2023)
 * Rôle: Développeur 6 (et base pour Développeur 5)
 */

import React, { useState } from 'react';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CButton,
  CFormInput,
  CFormSelect,
  CBadge,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormTextarea,
  CPagination,
  CPaginationItem,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilCheckCircle,
  cilXCircle,
  cilCloudDownload,
  cilCloudUpload,
  cilUserPlus,
  cilPencil,
  cilPrint,
  cilInfo,
  cilSearch,
  cilReload,
} from '@coreui/icons';
import { useLegacyStudents } from './hooks/useLegacyStudents';
import { ImportExcelModal } from './components/ImportExcelModal';
import type { LegacyStudent, LegacyStudentFormData } from '@/types/legacyStudent.types';

export const LegacyStudentsIndex: React.FC = () => {
  const {
    students,
    stats,
    filieres,
    loading,
    filters,
    setFilters,
    pagination,
    selectedIds,
    fetchStudents,
    handleValidate,
    handleReject,
    handleBulkValidate,
    handleBulkReject,
    handleCreate,
    handleUpdate,
    handleExport,
    handlePrintPdf,
    toggleSelectAll,
    toggleSelectOne,
  } = useLegacyStudents();

  // État des modales
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<LegacyStudent | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Formulaire local pour création / édition
  const [formData, setFormData] = useState<LegacyStudentFormData>({
    matricule: '',
    last_name: '',
    first_name: '',
    email: '',
    phone: '',
    enrollment_year: 2018,
    department_ids: [],
    notes_admin: '',
  });

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedStudent(null);
    setFormData({
      matricule: '',
      last_name: '',
      first_name: '',
      email: '',
      phone: '',
      enrollment_year: 2018,
      department_ids: filieres.length > 0 ? [filieres[0].id] : [],
      notes_admin: '',
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (student: LegacyStudent) => {
    setIsEditing(true);
    setSelectedStudent(student);
    setFormData({
      matricule: student.matricule,
      last_name: student.last_name,
      first_name: student.first_name,
      email: student.email,
      phone: student.phone,
      enrollment_year: student.enrollment_year,
      department_ids: student.filieres.map((f) => f.id),
      notes_admin: student.notes_admin || '',
    });
    setIsFormModalOpen(true);
  };

  const openDetailModal = (student: LegacyStudent) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.department_ids.length === 0) {
      alert('Veuillez sélectionner au moins une filière.');
      return;
    }

    if (isEditing && selectedStudent) {
      const ok = await handleUpdate(selectedStudent.id, formData);
      if (ok) setIsFormModalOpen(false);
    } else {
      const ok = await handleCreate(formData);
      if (ok) setIsFormModalOpen(false);
    }
  };

  const handleFiliereToggle = (filiereId: number | string) => {
    setFormData((prev) => {
      const exists = prev.department_ids.includes(filiereId);
      return {
        ...prev,
        department_ids: exists
          ? prev.department_ids.filter((id) => id !== filiereId)
          : [...prev.department_ids, filiereId],
      };
    });
  };

  return (
    <div className="container-fluid p-0">
      {/* ── 1. EN-TÊTE & ACTIONS PRINCIPALES ─────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1 text-primary">
            📁 Archives & Anciens Étudiants (&lt; 2023)
          </h2>
          <p className="text-muted mb-0">
            Gestion, régularisation, multi-filières et validation des dossiers d’anciens étudiants.
          </p>
        </div>
        <div className="d-flex gap-2">
          <CButton color="primary" onClick={openCreateModal} className="d-flex align-items-center gap-1 shadow-sm">
            <CIcon icon={cilUserPlus} />
            + Enregistrer au Guichet
          </CButton>
          <CButton color="success" className="text-white d-flex align-items-center gap-1 shadow-sm" onClick={() => setIsImportModalOpen(true)}>
            <CIcon icon={cilCloudUpload} />
            Importer Excel
          </CButton>
          <CButton color="secondary" variant="outline" className="d-flex align-items-center gap-1" onClick={handleExport}>
            <CIcon icon={cilCloudDownload} />
            Exporter CSV
          </CButton>
        </div>
      </div>

      {/* ── 2. CARTES STATISTIQUES (KPIs) ────────────────────────────────────── */}
      <CRow className="g-3 mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="border-start border-4 border-primary shadow-sm h-100">
            <CCardBody className="p-3">
              <div className="text-muted small text-uppercase fw-bold">Total Déclarations</div>
              <div className="fs-3 fw-bold text-primary mt-1">{stats.total}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="border-start border-4 border-warning shadow-sm h-100">
            <CCardBody className="p-3">
              <div className="text-muted small text-uppercase fw-bold">En Attente de Contrôle</div>
              <div className="fs-3 fw-bold text-warning mt-1">{stats.pending}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="border-start border-4 border-success shadow-sm h-100">
            <CCardBody className="p-3">
              <div className="text-muted small text-uppercase fw-bold">Dossiers Validés</div>
              <div className="fs-3 fw-bold text-success mt-1">{stats.validated}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="border-start border-4 border-danger shadow-sm h-100">
            <CCardBody className="p-3">
              <div className="text-muted small text-uppercase fw-bold">Dossiers Rejetés</div>
              <div className="fs-3 fw-bold text-danger mt-1">{stats.rejected}</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ── 3. FILTRES ET RECHERCHE ─────────────────────────────────────────── */}
      <CCard className="shadow-sm border-0 mb-4">
        <CCardBody className="p-3">
          <CRow className="g-3 align-items-center">
            <CCol md={4}>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <CIcon icon={cilSearch} />
                </span>
                <CFormInput
                  placeholder="Rechercher par Matricule, Nom, Email, Téléphone..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                />
              </div>
            </CCol>
            <CCol md={3}>
              <CFormSelect
                value={filters.status || 'all'}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any, page: 1 })}
              >
                <option value="all">🔍 Tous les statuts</option>
                <option value="pending">⏳ En attente ({stats.pending})</option>
                <option value="validated">✅ Validés ({stats.validated})</option>
                <option value="rejected">❌ Rejetés ({stats.rejected})</option>
              </CFormSelect>
            </CCol>
            <CCol md={3}>
              <CFormSelect
                value={filters.department_id || ''}
                onChange={(e) => setFilters({ ...filters, department_id: e.target.value, page: 1 })}
              >
                <option value="">🎓 Toutes les filières</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.abbreviation || f.cycle})
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={2} className="text-end">
              <CButton color="light" className="border w-100" onClick={fetchStudents} disabled={loading}>
                <CIcon icon={cilReload} className="me-1" />
                Actualiser
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* ── 4. BARRE D'ACTIONS GROUPÉES (BULK) ───────────────────────────────── */}
      {selectedIds.length > 0 && (
        <div className="alert alert-info d-flex justify-content-between align-items-center shadow-sm mb-3">
          <div>
            <strong>{selectedIds.length}</strong> dossier(s) sélectionné(s)
          </div>
          <div className="d-flex gap-2">
            <CButton size="sm" color="success" className="text-white" onClick={handleBulkValidate}>
              <CIcon icon={cilCheckCircle} className="me-1" />
              Valider la sélection
            </CButton>
            <CButton size="sm" color="danger" className="text-white" onClick={handleBulkReject}>
              <CIcon icon={cilXCircle} className="me-1" />
              Rejeter la sélection
            </CButton>
          </div>
        </div>
      )}

      {/* ── 5. TABLEAU PRINCIPAL ────────────────────────────────────────────── */}
      <CCard className="shadow-sm border-0 mb-4">
        <CCardBody className="p-0">
          <div className="table-responsive">
            <CTable hover align="middle" className="mb-0">
              <CTableHead className="bg-light">
                <CTableRow>
                  <CTableHeaderCell style={{ width: '40px' }} className="text-center">
                    <CFormCheck
                      checked={students.length > 0 && selectedIds.length === students.length}
                      onChange={toggleSelectAll}
                    />
                  </CTableHeaderCell>
                  <CTableHeaderCell>Matricule</CTableHeaderCell>
                  <CTableHeaderCell>Nom & Prénoms</CTableHeaderCell>
                  <CTableHeaderCell>Contact</CTableHeaderCell>
                  <CTableHeaderCell>Année</CTableHeaderCell>
                  <CTableHeaderCell>Filière(s) choisie(s)</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Statut</CTableHeaderCell>
                  <CTableHeaderCell className="text-end pe-3">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {loading ? (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center py-5">
                      <CSpinner color="primary" />
                      <div className="text-muted mt-2">Chargement des données...</div>
                    </CTableDataCell>
                  </CTableRow>
                ) : students.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center py-5 text-muted">
                      Aucun ancien étudiant trouvé avec ces filtres.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  students.map((student) => (
                    <CTableRow key={student.id}>
                      <CTableDataCell className="text-center">
                        <CFormCheck
                          checked={selectedIds.includes(student.id)}
                          onChange={() => toggleSelectOne(student.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>
                        <span className="fw-bold font-monospace text-primary">{student.matricule}</span>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="fw-bold">{student.last_name} {student.first_name}</div>
                        <small className="text-muted">Inscrit en {student.enrollment_year}</small>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div><small className="text-muted">✉️</small> {student.email}</div>
                        <div><small className="text-muted">📞</small> {student.phone}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="secondary" className="px-2 py-1">
                          {student.enrollment_year}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell style={{ maxWidth: '280px' }}>
                        <div className="d-flex flex-wrap gap-1">
                          {student.filieres.map((f) => (
                            <CBadge key={f.id} color="info" className="text-dark bg-opacity-25 border border-info">
                              {f.name}
                            </CBadge>
                          ))}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        {student.status === 'validated' && (
                          <CBadge color="success" className="px-2 py-1">
                            ✅ Validé
                          </CBadge>
                        )}
                        {student.status === 'pending' && (
                          <CBadge color="warning" className="px-2 py-1 text-dark">
                            ⏳ En attente
                          </CBadge>
                        )}
                        {student.status === 'rejected' && (
                          <CBadge color="danger" className="px-2 py-1" title={student.rejection_reason || ''}>
                            ❌ Rejeté
                          </CBadge>
                        )}
                      </CTableDataCell>
                      <CTableDataCell className="text-end pe-3">
                        <div className="d-flex justify-content-end gap-1">
                          <CButton
                            size="sm"
                            color="info"
                            variant="ghost"
                            title="Voir les détails"
                            onClick={() => openDetailModal(student)}
                          >
                            <CIcon icon={cilInfo} />
                          </CButton>
                          <CButton
                            size="sm"
                            color="dark"
                            variant="ghost"
                            title="Imprimer Fiche PDF"
                            onClick={() => handlePrintPdf(student)}
                          >
                            <CIcon icon={cilPrint} />
                          </CButton>
                          <CButton
                            size="sm"
                            color="primary"
                            variant="ghost"
                            title="Modifier"
                            onClick={() => openEditModal(student)}
                          >
                            <CIcon icon={cilPencil} />
                          </CButton>
                          {student.status !== 'validated' && (
                            <CButton
                              size="sm"
                              color="success"
                              variant="ghost"
                              title="Valider le dossier"
                              onClick={() => handleValidate(student.id)}
                            >
                              <CIcon icon={cilCheckCircle} />
                            </CButton>
                          )}
                          {student.status !== 'rejected' && (
                            <CButton
                              size="sm"
                              color="danger"
                              variant="ghost"
                              title="Rejeter le dossier"
                              onClick={() => handleReject(student.id)}
                            >
                              <CIcon icon={cilXCircle} />
                            </CButton>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <small className="text-muted">
                Affichage de {pagination.from || 0} à {pagination.to || 0} sur {pagination.total} dossiers
              </small>
              <CPagination align="end" className="mb-0">
                <CPaginationItem
                  disabled={pagination.current_page === 1}
                  onClick={() => setFilters({ ...filters, page: pagination.current_page - 1 })}
                >
                  Précédent
                </CPaginationItem>
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((p) => (
                  <CPaginationItem
                    key={p}
                    active={p === pagination.current_page}
                    onClick={() => setFilters({ ...filters, page: p })}
                  >
                    {p}
                  </CPaginationItem>
                ))}
                <CPaginationItem
                  disabled={pagination.current_page === pagination.last_page}
                  onClick={() => setFilters({ ...filters, page: pagination.current_page + 1 })}
                >
                  Suivant
                </CPaginationItem>
              </CPagination>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* ── MODALE FORMULAIRE (AJOUT GUICHET & ÉDITION) ────────────────────── */}
      <CModal visible={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} size="lg" backdrop="static">
        <CModalHeader closeButton>
          <CModalTitle className="fw-bold text-primary">
            {isEditing ? '✏️ Rectifier un Ancien Étudiant' : '➕ Enregistrement Direct au Guichet'}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleFormSubmit}>
          <CModalBody>
            <CRow className="g-3">
              <CCol md={6}>
                <CFormLabel className="fw-bold">Numéro Matricule *</CFormLabel>
                <CFormInput
                  required
                  placeholder="Ex: 18-0452-EPAC"
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-bold">Année d'inscription (&lt; 2023) *</CFormLabel>
                <CFormInput
                  type="number"
                  required
                  max={2022}
                  min={1990}
                  value={formData.enrollment_year}
                  onChange={(e) => setFormData({ ...formData, enrollment_year: Number(e.target.value) })}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-bold">Nom de famille *</CFormLabel>
                <CFormInput
                  required
                  placeholder="Ex: DOSSA"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-bold">Prénoms *</CFormLabel>
                <CFormInput
                  required
                  placeholder="Ex: Jean-Baptiste"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-bold">Adresse Email *</CFormLabel>
                <CFormInput
                  type="email"
                  required
                  placeholder="Ex: jean.dossa@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-bold">Numéro de Téléphone *</CFormLabel>
                <CFormInput
                  required
                  placeholder="Ex: +229 97 00 00 00"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </CCol>

              <CCol md={12}>
                <CFormLabel className="fw-bold">
                  🎓 Filières suivies (Sélection multiple possible) * :
                </CFormLabel>
                <div className="p-3 bg-light rounded border">
                  <CRow className="g-2">
                    {filieres.map((filiere) => {
                      const isChecked = formData.department_ids.includes(filiere.id);
                      return (
                        <CCol sm={6} key={filiere.id}>
                          <div
                            className={`p-2 rounded border cursor-pointer ${
                              isChecked ? 'bg-primary text-white border-primary' : 'bg-white'
                            }`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleFiliereToggle(filiere.id)}
                          >
                            <CFormCheck
                              id={`filiere-${filiere.id}`}
                              label={
                                <span>
                                  <strong>{filiere.name}</strong>{' '}
                                  <small className={isChecked ? 'text-white-50' : 'text-muted'}>
                                    ({filiere.cycle || filiere.abbreviation})
                                  </small>
                                </span>
                              }
                              checked={isChecked}
                              onChange={() => {}}
                            />
                          </div>
                        </CCol>
                      );
                    })}
                  </CRow>
                </div>
              </CCol>

              <CCol md={12}>
                <CFormLabel className="fw-bold">Notes administratives / Observations</CFormLabel>
                <CFormTextarea
                  rows={2}
                  placeholder="Observations sur le registre ou pièces fournies..."
                  value={formData.notes_admin}
                  onChange={(e) => setFormData({ ...formData, notes_admin: e.target.value })}
                />
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setIsFormModalOpen(false)}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : isEditing ? '💾 Sauvegarder les modifications' : '✅ Enregistrer et Valider'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* ── MODALE FICHE DÉTAIL D'UN ÉTUDIANT ────────────────────────────────── */}
      {selectedStudent && (
        <CModal visible={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} size="lg">
          <CModalHeader closeButton>
            <CModalTitle className="fw-bold">
              👤 Dossier Ancien Étudiant : {selectedStudent.matricule}
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CRow className="g-3">
              <CCol md={6}>
                <div className="p-3 bg-light rounded">
                  <h6 className="fw-bold text-primary mb-3">Informations Générales</h6>
                  <div className="mb-2"><strong>Nom & Prénoms :</strong> {selectedStudent.last_name} {selectedStudent.first_name}</div>
                  <div className="mb-2"><strong>Matricule :</strong> <span className="font-monospace">{selectedStudent.matricule}</span></div>
                  <div className="mb-2"><strong>Année d'inscription :</strong> {selectedStudent.enrollment_year}</div>
                  <div className="mb-2"><strong>Email :</strong> {selectedStudent.email}</div>
                  <div className="mb-2"><strong>Téléphone :</strong> {selectedStudent.phone}</div>
                  <div><strong>Date de déclaration :</strong> {new Date(selectedStudent.created_at).toLocaleString('fr-FR')}</div>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="p-3 bg-light rounded h-100">
                  <h6 className="fw-bold text-primary mb-3">Statut & Contrôle Scolarité</h6>
                  <div className="mb-2">
                    <strong>Statut : </strong>
                    {selectedStudent.status === 'validated' && <CBadge color="success">Validé</CBadge>}
                    {selectedStudent.status === 'pending' && <CBadge color="warning" className="text-dark">En attente</CBadge>}
                    {selectedStudent.status === 'rejected' && <CBadge color="danger">Rejeté</CBadge>}
                  </div>
                  {selectedStudent.validated_by && (
                    <div className="mb-2"><strong>Traité par :</strong> {selectedStudent.validated_by}</div>
                  )}
                  {selectedStudent.rejection_reason && (
                    <div className="mb-2 text-danger"><strong>Motif du rejet :</strong> {selectedStudent.rejection_reason}</div>
                  )}
                  {selectedStudent.notes_admin && (
                    <div className="mb-2"><strong>Notes scolarité :</strong> {selectedStudent.notes_admin}</div>
                  )}
                </div>
              </CCol>
              <CCol md={12}>
                <div className="p-3 bg-light rounded">
                  <h6 className="fw-bold text-primary mb-2">Filières rattachées ({selectedStudent.filieres.length})</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedStudent.filieres.map((f) => (
                      <CBadge key={f.id} color="primary" className="p-2 fs-6">
                        🎓 {f.name} {f.cycle && `(${f.cycle})`}
                      </CBadge>
                    ))}
                  </div>
                </div>
              </CCol>
              {selectedStudent.services_requested && selectedStudent.services_requested.length > 0 && (
                <CCol md={12}>
                  <div className="p-3 bg-light rounded">
                    <h6 className="fw-bold text-primary mb-2">Historique des services sollicités sur le site vitrine</h6>
                    <ul className="mb-0">
                      {selectedStudent.services_requested.map((srv) => (
                        <li key={srv.id} className="small">
                          <strong>{srv.service_name}</strong> — Demandé le {srv.requested_at} ({srv.status})
                        </li>
                      ))}
                    </ul>
                  </div>
                </CCol>
              )}
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton color="dark" onClick={() => handlePrintPdf(selectedStudent)}>
              <CIcon icon={cilPrint} className="me-1" />
              Imprimer la Fiche PDF
            </CButton>
            <CButton color="secondary" onClick={() => setIsDetailModalOpen(false)}>
              Fermer
            </CButton>
          </CModalFooter>
        </CModal>
      )}

      {/* ── MODALE IMPORT EXCEL ──────────────────────────────────────────────── */}
      <ImportExcelModal
        visible={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchStudents}
      />
    </div>
  );
};

export default LegacyStudentsIndex;
