import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CBadge,
  CButton,
  CAlert,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormTextarea,
  CFormLabel,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilCheckCircle,
  cilXCircle,
  cilCloudDownload,
  cilWarning,
  cilBan,
  cilArrowLeft,
} from '@coreui/icons';
import HttpService from '@/services/http.service';
import { useAuth } from '@/contexts/AuthContext';
import type { Contrat } from '@/types/rh.types';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'En attente', color: 'warning' },
  transfered: { label: 'Transféré',  color: 'info'    },
  signed:     { label: 'Signé',      color: 'success' },
  ongoing:    { label: 'En cours',   color: 'primary' },
  completed:  { label: 'Complété',   color: 'dark'    },
  cancelled:  { label: 'Rejeté',     color: 'danger'  },
};

const formatDate = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—';

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

const ProfessorContratDetail = () => {
  const { uuid }           = useParams();
  const navigate           = useNavigate();
  const [searchParams]     = useSearchParams();
  const { isAuthenticated, role } = useAuth();

  const [contrat, setContrat]               = useState<Contrat | null>(null);
  const [loading, setLoading]               = useState(true);
  const [actionLoading, setActionLoading]   = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showRejectModal, setShowRejectModal]     = useState(false);
  const [rejectionReason, setRejectionReason]     = useState('');
  const [rejectionError, setRejectionError]       = useState<string | null>(null);

  // ─── Chargement du contrat ─────────────────────────────────────────────────
  //
  // Stratégie :
  //   1. Professeur authentifié → GET rh/contrats/{uuid}  (route protégée Sanctum)
  //      Le backend vérifie que le contrat appartient bien au professeur connecté.
  //   2. Non authentifié (lien email) → GET rh/contrats/by-token/{uuid}  (route publique)
  //   3. Si la route protégée retourne 401/403 (token expiré), fallback automatique
  //      vers la route publique.
  //
  const fetchContrat = useCallback(async () => {
    if (!uuid) return;
    setLoading(true);
    setError(null);

    try {
      let response: { success: boolean; data: Contrat };

      if (isAuthenticated && role === 'professeur') {
        // Route authentifiée — le header Authorization est envoyé automatiquement
        // par HttpService (il lit le token depuis le localStorage/contexte).
        response = await HttpService.get<{ success: boolean; data: Contrat }>(
          `rh/contrats/${uuid}`,
        );
      } else {
        // Route publique : accès par UUID (lien email, pas de token requis)
        response = await HttpService.get<{ success: boolean; data: Contrat }>(
          `rh/contrats/by-token/${uuid}`,
        );
      }

      setContrat(response.data ?? null);
    } catch (err: any) {
      // Fallback : si 401/403 on tente la route publique
      if (err?.status === 401 || err?.status === 403) {
        try {
          const fallback = await HttpService.get<{ success: boolean; data: Contrat }>(
            `rh/contrats/by-token/${uuid}`,
          );
          setContrat(fallback.data ?? null);
        } catch (fallbackErr: any) {
          setError(fallbackErr.message || "Ce contrat est invalide ou n'existe pas.");
        }
      } else {
        setError(err.message || "Ce contrat est invalide ou n'existe pas.");
      }
    } finally {
      setLoading(false);
    }
  }, [uuid, isAuthenticated, role]);

  useEffect(() => {
    fetchContrat();
  }, [fetchContrat]);

  // Ouvre la modale si l'URL contient ?action=validate ou ?action=reject
  useEffect(() => {
    if (!contrat) return;
    const action = searchParams.get('action');
    if (action === 'validate') setShowValidateModal(true);
    if (action === 'reject')   setShowRejectModal(true);
  }, [searchParams, contrat]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleValidate = async () => {
    if (!uuid) return;
    setActionLoading(true);
    setError(null);
    try {
      await HttpService.post(`rh/contrats/by-token/${uuid}/validate`, {});
      setSuccessMessage('Votre contrat a été validé avec succès. Merci.');
      setShowValidateModal(false);
      await fetchContrat();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la validation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!uuid) return;
    if (rejectionReason.trim().length < 10) {
      setRejectionError("Veuillez fournir un motif d'au moins 10 caractères.");
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await HttpService.post(`rh/contrats/by-token/${uuid}/reject`, {
        rejection_reason: rejectionReason,
      });
      setSuccessMessage('Votre contrat a été rejeté. Le motif a été transmis au CAP.');
      setShowRejectModal(false);
      await fetchContrat();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors du rejet.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!uuid || !contrat) return;
    try {
      const result = await HttpService.downloadFile(`rh/contrats/${uuid}/download`);
      if (result.success && result.url) {
        const a = document.createElement('a');
        a.href     = result.url;
        a.download = result.filename || `contrat-${contrat.contrat_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(result.url);
      }
    } catch (err: any) {
      setError(err.message || 'Impossible de télécharger le contrat.');
    }
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const canAct      = contrat && ['transfered', 'pending'].includes(contrat.status);
  const canDownload = contrat?.is_validated === true && contrat?.is_authorized === true;
  const statusCfg   = contrat
    ? STATUS_CONFIG[contrat.status] ?? { label: contrat.status, color: 'secondary' }
    : null;

  // Chemins de navigation corrigés
  const goToList      = () => navigate('/notes/professor/contrats');
  const goToDashboard = () => navigate('/notes/professor/dashboard');
  const goToLogin     = () =>
    navigate('/login', {
      state: { redirectAfterLogin: window.location.pathname + window.location.search },
    });

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner size="lg" />
        <p className="mt-3">Chargement du contrat...</p>
      </div>
    );
  }

  if (error && !contrat) {
    return (
      <CCard className="text-center">
        <CCardBody className="py-5">
          <CIcon icon={cilBan} size="4xl" className="text-danger mb-3" />
          <h3>Lien invalide ou expiré</h3>
          <p className="text-muted">{error}</p>
          {isAuthenticated ? (
            <CButton color="primary" onClick={goToDashboard}>
              Retour au tableau de bord
            </CButton>
          ) : (
            <CButton color="primary" onClick={goToLogin}>
              Se connecter
            </CButton>
          )}
        </CCardBody>
      </CCard>
    );
  }

  if (!contrat) return null;

  return (
    <>
      {/* Navigation */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          {isAuthenticated && (
            <>
              <CButton color="link" className="p-0 me-3" onClick={goToList}>
                <CIcon icon={cilArrowLeft} /> Mes contrats
              </CButton>
              <CButton color="link" className="p-0" onClick={goToDashboard}>
                Tableau de bord
              </CButton>
            </>
          )}
        </div>
      </div>

      {/* Alertes globales */}
      {successMessage && (
        <CAlert color="success" className="mb-4" dismissible onClose={() => setSuccessMessage(null)}>
          <CIcon icon={cilCheckCircle} className="me-2" />
          {successMessage}
        </CAlert>
      )}
      {error && (
        <CAlert color="danger" className="mb-4" dismissible onClose={() => setError(null)}>
          <CIcon icon={cilWarning} className="me-2" />
          {error}
        </CAlert>
      )}

      {/* Carte principale */}
      <CCard className="mb-4">
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">Contrat N°{contrat.contrat_number}</h4>
              {statusCfg && (
                <CBadge color={statusCfg.color} className="mt-2">
                  {statusCfg.label}
                </CBadge>
              )}
              {contrat.is_validated && (
                <CBadge color="success" className="ms-2">Validé</CBadge>
              )}
              {contrat.is_authorized && (
                <CBadge color="primary" className="ms-2">Autorisé</CBadge>
              )}
            </div>
            <CButton
              color="success"
              variant="outline"
              onClick={handleDownload}
              disabled={!canDownload}
            >
              <CIcon icon={cilCloudDownload} className="me-2" />
              Télécharger le PDF
            </CButton>
          </div>
          {!canDownload && (
            <small className="text-muted d-block mt-2">
              Le téléchargement sera disponible une fois le contrat validé par vous et autorisé
              par le CAP.
            </small>
          )}
        </CCardHeader>

        <CCardBody>
          <CRow>
            {/* Infos contrat */}
            <CCol md={6}>
              <CCard className="mb-3">
                <CCardHeader>Informations du contrat</CCardHeader>
                <CCardBody>
                  <table className="table table-sm table-borderless">
                    <tbody>
                      <tr><th>Numéro</th><td>N° {contrat.contrat_number}</td></tr>
                      <tr><th>Année</th><td>{contrat.academicYear?.academic_year ?? '—'}</td></tr>
                      <tr><th>Cycle</th><td>{contrat.cycle?.name ?? '—'}</td></tr>
                      <tr><th>Division</th><td>{contrat.division ?? '—'}</td></tr>
                      <tr>
                        <th>Regroupement</th>
                        <td>
                          {contrat.regroupement === '1'
                            ? 'I'
                            : contrat.regroupement === '2'
                            ? 'II'
                            : '—'}
                        </td>
                      </tr>
                      <tr><th>Début</th><td>{formatDate(contrat.start_date)}</td></tr>
                      <tr><th>Fin</th><td>{formatDate(contrat.end_date)}</td></tr>
                      <tr><th>Montant</th><td>{formatAmount(contrat.amount)}</td></tr>
                      {contrat.notes && (
                        <tr><th>Notes</th><td>{contrat.notes}</td></tr>
                      )}
                    </tbody>
                  </table>
                </CCardBody>
              </CCard>
            </CCol>

            {/* Infos personnelles */}
            <CCol md={6}>
              <CCard className="mb-3">
                <CCardHeader>Informations personnelles</CCardHeader>
                <CCardBody>
                  {contrat.professor ? (
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr><th>Nom complet</th><td>{contrat.professor.full_name}</td></tr>
                        <tr><th>Email</th><td>{contrat.professor.email ?? '—'}</td></tr>
                        <tr><th>Téléphone</th><td>{contrat.professor.phone ?? '—'}</td></tr>
                        <tr><th>Nationalité</th><td>{contrat.professor.nationality ?? '—'}</td></tr>
                        <tr><th>Profession</th><td>{contrat.professor.profession ?? '—'}</td></tr>
                        <tr><th>Ville</th><td>{contrat.professor.city ?? '—'}</td></tr>
                        <tr><th>N° IFU</th><td>{contrat.professor.ifu_number ?? '—'}</td></tr>
                        <tr>
                          <th>N° RIB / Banque</th>
                          <td>
                            {contrat.professor.rib_number
                              ? `${contrat.professor.rib_number} — ${contrat.professor.bank ?? ''}`
                              : '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-muted mb-0">Informations non disponibles.</p>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* Programmes associés */}
          {contrat.course_element_professors && contrat.course_element_professors.length > 0 && (
            <CCard className="mb-3">
              <CCardHeader>Programmes associés</CCardHeader>
              <CCardBody>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Matière</th>
                        <th>Unité d'enseignement</th>
                        <th>Classe</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contrat.course_element_professors.map((prog, idx) => (
                        <tr key={idx}>
                          <td>{prog.course_element.code}</td>
                          <td>{prog.course_element.name}</td>
                          <td>{prog.course_element.teaching_unit?.name}</td>
                          <td>{prog.class_group?.name ?? '—'}</td>
                          <td>{prog.is_primary ? 'Titulaire' : 'Remplaçant'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CCardBody>
            </CCard>
          )}

          {/* Motif de rejet */}
          {contrat.status === 'cancelled' && contrat.rejection_reason && (
            <CCard className="mb-3 border-danger">
              <CCardHeader className="bg-danger text-white">
                Motif de rejet transmis au CAP
              </CCardHeader>
              <CCardBody>{contrat.rejection_reason}</CCardBody>
            </CCard>
          )}

          {/* Boutons Valider / Rejeter */}
          {canAct && (
            <CCard className="mb-3">
              <CCardBody>
                <div className="text-center">
                  <p className="mb-3">
                    Veuillez lire attentivement votre contrat avant de prendre une décision.
                    Cette action est définitive.
                  </p>
                  <CButton
                    color="success"
                    className="me-3"
                    onClick={() => setShowValidateModal(true)}
                    disabled={actionLoading}
                    style={{ minWidth: 160 }}
                  >
                    <CIcon icon={cilCheckCircle} className="me-2" />
                    Valider le contrat
                  </CButton>
                  <CButton
                    color="danger"
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    style={{ minWidth: 160 }}
                  >
                    <CIcon icon={cilXCircle} className="me-2" />
                    Rejeter le contrat
                  </CButton>
                </div>
              </CCardBody>
            </CCard>
          )}
        </CCardBody>
      </CCard>

      {/* ── Modale : Valider ───────────────────────────────────────────────── */}
      <CModal
        visible={showValidateModal}
        onClose={() => setShowValidateModal(false)}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>Confirmer la validation</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>Vous êtes sur le point de valider le contrat N°{contrat.contrat_number}.</p>
          <p>Cette action confirme votre accord avec les termes du contrat.</p>
          <p className="text-warning mb-0">
            Une fois validé, votre contrat sera transmis au CAP pour autorisation définitive.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowValidateModal(false)}
            disabled={actionLoading}
          >
            Annuler
          </CButton>
          <CButton color="success" onClick={handleValidate} disabled={actionLoading}>
            {actionLoading
              ? <CSpinner size="sm" className="me-2" />
              : <CIcon icon={cilCheckCircle} className="me-2" />}
            Confirmer la validation
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Modale : Rejeter ───────────────────────────────────────────────── */}
      <CModal
        visible={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRejectionError(null); }}
        alignment="center"
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Rejeter le contrat</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Veuillez indiquer le motif de votre rejet. Ce motif sera transmis directement
            au service RH du CAP.
          </p>
          <CFormLabel>
            Motif du rejet <span className="text-danger">*</span>
          </CFormLabel>
          <CFormTextarea
            rows={5}
            value={rejectionReason}
            onChange={(e) => {
              setRejectionReason(e.target.value);
              setRejectionError(null);
            }}
            placeholder="Décrivez précisément la raison pour laquelle vous rejetez ce contrat..."
            invalid={!!rejectionError}
          />
          {rejectionError && (
            <div className="text-danger mt-1 small">{rejectionError}</div>
          )}
          <div className="text-muted mt-1 small">
            {rejectionReason.length} / 1000 caractères (minimum 10)
          </div>
          <p className="text-danger mt-3 mb-0">
            Cette action est définitive. Le contrat sera marqué comme rejeté et votre motif
            transmis au CAP.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => { setShowRejectModal(false); setRejectionError(null); }}
            disabled={actionLoading}
          >
            Annuler
          </CButton>
          <CButton color="danger" onClick={handleReject} disabled={actionLoading}>
            {actionLoading
              ? <CSpinner size="sm" className="me-2" />
              : <CIcon icon={cilXCircle} className="me-2" />}
            Confirmer le rejet
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default ProfessorContratDetail;
