/**
 * Onglet : Gestion des Demandes de Services Étudiants Rétroactifs (< 2023)
 * Gère les Quitus de Mémoire, Attestations, Bulletins, Corrections de mémoire etc.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CCard,
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
  CSpinner,
  CPagination,
  CPaginationItem,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSearch, cilReload, cilCheckAlt, cilX, cilPrint, cilTask } from '@coreui/icons';
import Swal from 'sweetalert2';
import legacyStudentAdminService from '@/services/legacyStudentAdminService';
import { generateLegacyStudentPdf } from '../utils/generateLegacyStudentPdf';
import type {
  LegacyStudentServiceRequest,
  LegacyServiceFilters,
  LegacyServiceStatus,
  LegacyStudent,
} from '@/types/legacyStudent.types';

export const LegacyServicesRequestsTab: React.FC = () => {
  const [services, setServices] = useState<LegacyStudentServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<LegacyServiceFilters>({
    search: '',
    service_type: 'all',
    status: 'all',
    page: 1,
    per_page: 10,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1,
  });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await legacyStudentAdminService.getServices(filters);
      if (response && response.data) {
        setServices(response.data);
        if (response.meta) setPagination(response.meta);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleUpdateStatus = async (service: LegacyStudentServiceRequest, newStatus: LegacyServiceStatus) => {
    let reason = '';
    if (newStatus === 'rejected') {
      const { value } = await Swal.fire({
        title: 'Rejeter cette demande de service',
        input: 'textarea',
        inputLabel: 'Motif du refus (obligatoire) :',
        inputPlaceholder: 'Ex: Documents incomplets ou archive non trouvée...',
        showCancelButton: true,
        confirmButtonColor: '#e55353',
        confirmButtonText: 'Confirmer le rejet',
        cancelButtonText: 'Annuler',
        inputValidator: (val) => (!val ? 'Un motif est requis.' : null),
      });
      if (!value) return;
      reason = value;
    }

    const actionLabels: Record<string, string> = {
      in_progress: 'Passer en cours de traitement',
      delivered: 'Marquer comme Délivré / Terminé',
      approved: 'Approuver la demande',
      rejected: 'Rejeter la demande',
    };

    const confirm = await Swal.fire({
      title: `${actionLabels[newStatus] || 'Modifier le statut'} ?`,
      text: `Service : ${service.service_name} pour ${service.student_name}`,
      icon: newStatus === 'rejected' ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: newStatus === 'delivered' ? '#2eb85c' : '#321fdb',
    });

    if (confirm.isConfirmed) {
      setLoading(true);
      try {
        await legacyStudentAdminService.updateServiceStatus(service.id, newStatus, undefined, reason);
        Swal.fire({
          icon: 'success',
          title: 'Statut mis à jour !',
          timer: 1500,
          showConfirmButton: false,
        });
        await fetchServices();
      } catch (e: any) {
        Swal.fire('Erreur', e.message || 'Échec de la mise à jour', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrintDocument = (service: LegacyStudentServiceRequest) => {
    const dummyStudent: LegacyStudent = {
      id: service.legacy_student_id || 1,
      matricule: service.matricule || 'N/A',
      last_name: service.student_name ? service.student_name.split(' ')[0] : 'ANCIEN',
      first_name: service.student_name ? service.student_name.split(' ').slice(1).join(' ') : 'Étudiant',
      email: service.email || 'etudiant@cap-epac.bj',
      phone: service.phone || '+229 00 00 00 00',
      enrollment_year: service.enrollment_year || 2018,
      department: { id: 1, name: service.filiere_name || 'Génie Civil', cycle: 'Licence' },
      status: 'validated',
      validated_by: 'Scolarité CAP',
      created_at: service.requested_at,
    };

    if (service.service_type === 'quitus_memoire') {
      generateLegacyStudentPdf(dummyStudent, 'quitus_memoire');
    } else if (service.service_type === 'attestation_diplome') {
      generateLegacyStudentPdf(dummyStudent, 'attestation_diplome');
    } else {
      generateLegacyStudentPdf(dummyStudent, 'fiche_identification');
    }
  };

  const pendingCount = services.filter((s) => s.status === 'pending').length;
  const inProgressCount = services.filter((s) => s.status === 'in_progress').length;
  const deliveredCount = services.filter((s) => s.status === 'delivered').length;

  return (
    <div>
      {/* ── 1. STATS RAPIDES SERVICES ────────────────────────────────────────── */}
      <CRow className="g-3 mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="border-start border-4 border-primary shadow-sm">
            <CCardBody className="p-3">
              <div className="text-muted small text-uppercase fw-bold">Total Demandes Services</div>
              <div className="fs-3 fw-bold text-primary mt-1">{services.length}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="border-start border-4 border-warning shadow-sm">
            <CCardBody className="p-3">
              <div className="text-muted small text-uppercase fw-bold">En Attente de Traitement</div>
              <div className="fs-3 fw-bold text-warning mt-1">{pendingCount}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="border-start border-4 border-info shadow-sm">
            <CCardBody className="p-3">
              <div className="text-muted small text-uppercase fw-bold">En Cours de Traitement</div>
              <div className="fs-3 fw-bold text-info mt-1">{inProgressCount}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="border-start border-4 border-success shadow-sm">
            <CCardBody className="p-3">
              <div className="text-muted small text-uppercase fw-bold">Documents Délivrés</div>
              <div className="fs-3 fw-bold text-success mt-1">{deliveredCount}</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ── 2. BARRE DE FILTRES ──────────────────────────────────────────────── */}
      <CCard className="shadow-sm border-0 mb-4">
        <CCardBody className="p-3">
          <CRow className="g-3 align-items-center">
            <CCol md={4}>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <CIcon icon={cilSearch} />
                </span>
                <CFormInput
                  placeholder="Rechercher par étudiant, matricule, service..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                />
              </div>
            </CCol>
            <CCol md={4}>
              <CFormSelect
                value={filters.service_type || 'all'}
                onChange={(e) => setFilters({ ...filters, service_type: e.target.value as any, page: 1 })}
              >
                <option value="all">📑 Tous les services étudiants</option>
                <option value="quitus_memoire">🎓 Quitus de Mémoire de Soutenance</option>
                <option value="attestation_diplome">📜 Attestation de Diplôme / Réussite</option>
                <option value="demande_bulletin">📋 Demande de Bulletin / Relevé</option>
                <option value="correction_memoire">📝 Dépôt Mémoire Après Correction</option>
              </CFormSelect>
            </CCol>
            <CCol md={3}>
              <CFormSelect
                value={filters.status || 'all'}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any, page: 1 })}
              >
                <option value="all">🔍 Tous les statuts</option>
                <option value="pending">⏳ En attente</option>
                <option value="in_progress">⚙️ En cours de traitement</option>
                <option value="delivered">✅ Délivré / Terminé</option>
                <option value="rejected">❌ Rejeté</option>
              </CFormSelect>
            </CCol>
            <CCol md={1} className="text-end">
              <CButton color="light" className="border w-100" onClick={fetchServices} disabled={loading}>
                <CIcon icon={cilReload} />
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* ── 3. TABLEAU DES DEMANDES DE SERVICES ──────────────────────────────── */}
      <CCard className="shadow-sm border-0">
        <CCardBody className="p-0">
          <div className="table-responsive">
            <CTable hover align="middle" className="mb-0">
              <CTableHead className="bg-light">
                <CTableRow>
                  <CTableHeaderCell>Service Demandé</CTableHeaderCell>
                  <CTableHeaderCell>Ancien Étudiant</CTableHeaderCell>
                  <CTableHeaderCell>Filière & Promo</CTableHeaderCell>
                  <CTableHeaderCell>Date Demande</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Statut</CTableHeaderCell>
                  <CTableHeaderCell className="text-end pe-3">Actions Scolarité</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {loading ? (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className="text-center py-5">
                      <CSpinner color="primary" />
                      <div className="text-muted mt-2">Chargement des demandes de services...</div>
                    </CTableDataCell>
                  </CTableRow>
                ) : services.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className="text-center py-5 text-muted">
                      Aucune demande de service trouvée pour les anciens étudiants.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  services.map((service) => (
                    <CTableRow key={service.id}>
                      <CTableDataCell>
                        <div className="fw-bold text-primary">{service.service_name}</div>
                        <small className="text-muted font-monospace">{service.service_type || 'service_cap'}</small>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="fw-bold">{service.student_name}</div>
                        <small className="text-muted font-monospace">{service.matricule}</small>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{service.filiere_name || 'Génie Civil'}</div>
                        <small className="text-muted">Promotion {service.enrollment_year || 'Archive'}</small>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{new Date(service.requested_at).toLocaleDateString('fr-FR')}</div>
                        {service.processed_by && (
                          <small className="text-muted">Traité par: {service.processed_by}</small>
                        )}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        {service.status === 'pending' && (
                          <CBadge color="warning" className="px-2 py-1 text-dark">
                            ⏳ En attente
                          </CBadge>
                        )}
                        {service.status === 'in_progress' && (
                          <CBadge color="info" className="px-2 py-1">
                            ⚙️ En traitement
                          </CBadge>
                        )}
                        {service.status === 'delivered' && (
                          <CBadge color="success" className="px-2 py-1">
                            ✅ Délivré
                          </CBadge>
                        )}
                        {service.status === 'rejected' && (
                          <CBadge color="danger" className="px-2 py-1" title={service.rejection_reason || ''}>
                            ❌ Rejeté
                          </CBadge>
                        )}
                      </CTableDataCell>
                      <CTableDataCell className="text-end pe-3">
                        <div className="d-flex justify-content-end gap-1">
                          <CButton
                            size="sm"
                            color="dark"
                            variant="ghost"
                            title="Générer & Imprimer le document officiel"
                            onClick={() => handlePrintDocument(service)}
                          >
                            <CIcon icon={cilPrint} />
                          </CButton>
                          {service.status === 'pending' && (
                            <CButton
                              size="sm"
                              color="info"
                              variant="ghost"
                              title="Prendre en charge (En traitement)"
                              onClick={() => handleUpdateStatus(service, 'in_progress')}
                            >
                              <CIcon icon={cilTask} />
                            </CButton>
                          )}
                          {service.status !== 'delivered' && (
                            <CButton
                              size="sm"
                              color="success"
                              variant="ghost"
                              title="Valider et marquer comme Délivré"
                              onClick={() => handleUpdateStatus(service, 'delivered')}
                            >
                              <CIcon icon={cilCheckAlt} />
                            </CButton>
                          )}
                          {service.status !== 'rejected' && (
                            <CButton
                              size="sm"
                              color="danger"
                              variant="ghost"
                              title="Rejeter la demande"
                              onClick={() => handleUpdateStatus(service, 'rejected')}
                            >
                              <CIcon icon={cilX} />
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
                Page {pagination.current_page} sur {pagination.last_page} ({pagination.total} demandes)
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
    </div>
  );
};

export default LegacyServicesRequestsTab;
