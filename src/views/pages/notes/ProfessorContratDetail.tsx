import { useState, useEffect, useCallback, useRef } from 'react';
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
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilCheckCircle,
  cilXCircle,
  cilCloudDownload,
  cilWarning,
  cilBan,
  cilArrowLeft,
  cilPencil,
  cilImage,
  cilReload,
  cilPrint,
} from '@coreui/icons';
import HttpService from '@/services/http.service';
import { useAuth } from '@/contexts/AuthContext';
import type { Contrat } from '@/types/rh.types';

// ─── Types ────────────────────────────────────────────────────────────────────

type SignatureMode = 'drawn' | 'uploaded' | 'manual';

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'En attente', color: 'warning' },
  transfered: { label: 'En attente',  color: 'info'    },
  signed:     { label: 'Signé',      color: 'success' },
  ongoing:    { label: 'En cours',   color: 'primary' },
  completed:  { label: 'Complété',   color: 'dark'    },
  cancelled:  { label: 'Rejeté',     color: 'danger'  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—';

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

// ─── Composant SignatureCanvas ─────────────────────────────────────────────────

interface SignatureCanvasProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

const SignatureCanvas = ({ onSignatureChange }: SignatureCanvasProps) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const isDrawing  = useRef(false);
  const isEmpty    = useRef(true);
  const lastPos    = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a3a8f';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    lastPos.current   = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !lastPos.current) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    isEmpty.current = false;
    onSignatureChange(canvas.toDataURL('image/png'));
  };

  const stopDrawing = () => { isDrawing.current = false; lastPos.current = null; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    isEmpty.current = true;
    onSignatureChange(null);
  };

  return (
    <div>
      <div style={{ border: '2px solid #d0d8e8', borderRadius: '8px', overflow: 'hidden', background: '#fff', touchAction: 'none', cursor: 'crosshair', position: 'relative' }}>
        <canvas
          ref={canvasRef} width={560} height={180}
          style={{ display: 'block', width: '100%', height: 'auto' }}
          onMouseDown={startDrawing} onMouseMove={draw}
          onMouseUp={stopDrawing}   onMouseLeave={stopDrawing}
          onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
        />
        <div style={{ position: 'absolute', bottom: '30%', left: '5%', right: '5%', borderBottom: '1px dashed #c0c8d8', pointerEvents: 'none' }} />
      </div>
      <div className="d-flex justify-content-between align-items-center mt-2">
        <small className="text-muted">
          <CIcon icon={cilPencil} size="sm" className="me-1" />
          Signez dans le cadre ci-dessus avec votre doigt ou souris
        </small>
        <CButton color="light" size="sm" onClick={clearCanvas} title="Effacer la signature">
          <CIcon icon={cilReload} className="me-1" /> Effacer
        </CButton>
      </div>
    </div>
  );
};

// ─── Composant SignatureUpload ──────────────────────────────────────────────────

interface SignatureUploadProps {
  onFileChange: (file: File | null) => void;
  previewUrl: string | null;
}

const SignatureUpload = ({ onFileChange, previewUrl }: SignatureUploadProps) => {
  const inputRef      = useRef<HTMLInputElement>(null);
  const [error, setError]           = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File | null) => {
    setError(null);
    if (!file) { onFileChange(null); return; }
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (PNG, JPG, JPEG, GIF, WEBP).');
      return;
    }
    if (file.size > 100 * 1024) {
      setError(`L'image est trop lourde (${Math.round(file.size / 1024)} Ko). Maximum : 100 Ko.`);
      return;
    }
    onFileChange(file);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0] ?? null); }}
        style={{
          border: `2px dashed ${isDragging ? '#1a3a8f' : '#d0d8e8'}`,
          borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer',
          background: isDragging ? '#eef2fb' : '#fafbff', transition: 'all 0.2s',
          minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {previewUrl ? (
          <div>
            <img src={previewUrl} alt="Aperçu signature"
              style={{ maxWidth: '280px', maxHeight: '120px', objectFit: 'contain', border: '1px solid #e0e6f0', borderRadius: '4px', padding: '8px', background: '#fff' }} />
            <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.82rem' }}>Cliquez pour changer l'image</p>
          </div>
        ) : (
          <>
            <CIcon icon={cilImage} size="3xl" className="text-muted mb-2" />
            <p className="mb-1 fw-semibold" style={{ color: '#1a3a8f' }}>Cliquez ou glissez votre image ici</p>
            <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>PNG, JPG, JPEG — maximum <strong>100 Ko</strong></p>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      {error && (
        <div className="text-danger mt-2 small">
          <CIcon icon={cilWarning} size="sm" className="me-1" />{error}
        </div>
      )}
      {previewUrl && (
        <div className="d-flex justify-content-end mt-2">
          <CButton color="light" size="sm"
            onClick={(e) => { e.stopPropagation(); onFileChange(null); if (inputRef.current) inputRef.current.value = ''; }}>
            <CIcon icon={cilReload} className="me-1" /> Supprimer
          </CButton>
        </div>
      )}
    </div>
  );
};

// ─── Modal de signature ────────────────────────────────────────────────────────

interface SignatureModalProps {
  visible: boolean;
  contratNumber: string;
  onClose: () => void;
  onConfirm: (signatureData: string | null, signatureFile: File | null, mode: SignatureMode) => Promise<void>;
  loading: boolean;
}

const SignatureModal = ({ visible, contratNumber, onClose, onConfirm, loading }: SignatureModalProps) => {
  const [activeTab,    setActiveTab]    = useState<SignatureMode>('drawn');
  const [drawnData,    setDrawnData]    = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl,   setPreviewUrl]   = useState<string | null>(null);
  const [localError,   setLocalError]   = useState<string | null>(null);

  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [uploadedFile]);

  const reset = () => {
    setDrawnData(null); setUploadedFile(null);
    setPreviewUrl(null); setLocalError(null); setActiveTab('drawn');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleConfirm = async () => {
    setLocalError(null);
    if (activeTab === 'drawn') {
      if (!drawnData) { setLocalError('Veuillez dessiner votre signature avant de confirmer.'); return; }
      await onConfirm(drawnData, null, 'drawn');
    } else if (activeTab === 'uploaded') {
      if (!uploadedFile) { setLocalError('Veuillez sélectionner une image de signature.'); return; }
      await onConfirm(null, uploadedFile, 'uploaded');
    } else {
      // mode 'manual' : signer après impression — on valide sans signature numérique
      await onConfirm(null, null, 'manual');
    }
  };

  const hasSignature =
    activeTab === 'drawn'    ? !!drawnData :
    activeTab === 'uploaded' ? !!uploadedFile :
    true; // manual : toujours prêt

  return (
    <CModal visible={visible} onClose={handleClose} alignment="center" size="lg" backdrop="static">
      <CModalHeader className="border-bottom-0 pb-0">
        <CModalTitle style={{ color: '#1a3a8f', fontWeight: 700 }}>
          ✍️ Valider le contrat N°{contratNumber}
        </CModalTitle>
      </CModalHeader>

      <CModalBody className="pt-2">
        <div style={{ background: '#f0f4ff', border: '1px solid #c7d4f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
          <p className="mb-1 fw-semibold" style={{ color: '#1a3a8f', fontSize: '0.92rem' }}>
            Votre accord sur les termes du contrat est requis.
          </p>
          <p className="mb-0 text-muted" style={{ fontSize: '0.83rem' }}>
            Choisissez votre mode de validation. Cette action est <strong>définitive</strong>.
          </p>
        </div>

        {/* 3 onglets */}
        <CNav variant="tabs" className="mb-3">
          <CNavItem>
            <CNavLink active={activeTab === 'drawn'} onClick={() => { setActiveTab('drawn'); setLocalError(null); }}
              style={{ cursor: 'pointer', fontWeight: activeTab === 'drawn' ? 600 : 400 }}>
              <CIcon icon={cilPencil} className="me-2" /> Signer à la main
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink active={activeTab === 'uploaded'} onClick={() => { setActiveTab('uploaded'); setLocalError(null); }}
              style={{ cursor: 'pointer', fontWeight: activeTab === 'uploaded' ? 600 : 400 }}>
              <CIcon icon={cilImage} className="me-2" /> Importer une signature
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink active={activeTab === 'manual'} onClick={() => { setActiveTab('manual'); setLocalError(null); }}
              style={{ cursor: 'pointer', fontWeight: activeTab === 'manual' ? 600 : 400 }}>
              <CIcon icon={cilPrint} className="me-2" /> Signer après impression
            </CNavLink>
          </CNavItem>
        </CNav>

        <CTabContent>
          {/* Onglet : Dessin */}
          <CTabPane visible={activeTab === 'drawn'}>
            <SignatureCanvas onSignatureChange={setDrawnData} />
            {drawnData && (
              <div className="mt-3 text-center">
                <small className="text-success fw-semibold">
                  <CIcon icon={cilCheckCircle} size="sm" className="me-1" />
                  Signature capturée — aperçu :
                </small>
                <div className="mt-2">
                  <img src={drawnData} alt="Aperçu signature"
                    style={{ maxWidth: '200px', maxHeight: '70px', border: '1px solid #e0e6f0', borderRadius: '4px', background: '#fff', padding: '4px' }} />
                </div>
              </div>
            )}
          </CTabPane>

          {/* Onglet : Upload */}
          <CTabPane visible={activeTab === 'uploaded'}>
            <SignatureUpload onFileChange={setUploadedFile} previewUrl={previewUrl} />
          </CTabPane>

          {/* Onglet : Signer manuellement après impression */}
          <CTabPane visible={activeTab === 'manual'}>
            <div style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🖨️</div>
              <h6 style={{ color: '#1a3a8f', fontWeight: 700, marginBottom: 8 }}>
                Signature manuelle après impression
              </h6>
              <p className="text-muted" style={{ fontSize: '0.88rem', maxWidth: 420, margin: '0 auto 16px' }}>
                En cliquant sur <strong>« Confirmer »</strong>, vous acceptez les termes du contrat.
                Le contrat sera marqué comme validé. Vous devrez ensuite l'imprimer et le signer physiquement,
                puis le remettre au service RH du CAP.
              </p>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', display: 'inline-block', textAlign: 'left', maxWidth: 400 }}>
                <p className="mb-1 fw-semibold" style={{ color: '#92400e', fontSize: '0.85rem' }}>⚠️ Important</p>
                <ul style={{ color: '#92400e', fontSize: '0.82rem', margin: 0, paddingLeft: 18 }}>
                  <li>Cette validation électronique vaut acceptation du contrat.</li>
                  <li>Imprimez le contrat et apposez votre signature manuscrite.</li>
                  <li>Remettez l'exemplaire signé au CAP dans les meilleurs délais.</li>
                </ul>
              </div>
            </div>
          </CTabPane>
        </CTabContent>

        {localError && (
          <CAlert color="danger" className="mt-3 mb-0 py-2">
            <CIcon icon={cilWarning} className="me-2" />{localError}
          </CAlert>
        )}
      </CModalBody>

      <CModalFooter className="border-top-0 pt-0">
        <CButton color="light" onClick={handleClose} disabled={loading}>Annuler</CButton>
        <CButton color="success" onClick={handleConfirm} disabled={loading || !hasSignature} style={{ minWidth: 200 }}>
          {loading ? (
            <><CSpinner size="sm" className="me-2" />Validation en cours…</>
          ) : (
            <><CIcon icon={cilCheckCircle} className="me-2" />Confirmer et valider</>
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

// ─── Composant principal ───────────────────────────────────────────────────────

const ProfessorContratDetail = () => {
  const { uuid }            = useParams();
  const navigate            = useNavigate();
  const [searchParams]      = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [contrat, setContrat]                 = useState<Contrat | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [actionLoading, setActionLoading]     = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [successMessage, setSuccessMessage]   = useState<string | null>(null);

  const [showSignModal, setShowSignModal]     = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError]   = useState<string | null>(null);

  // ─── Chargement du contrat ─────────────────────────────────────────────────

  const fetchContrat = useCallback(async () => {
    if (!uuid) return;
    setLoading(true);
    setError(null);
    try {
      const response = await HttpService.get<{ success: boolean; data: Contrat }>(
        `rh/contrats/by-token/${uuid}`,
      );
      setContrat(response.data ?? null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Ce contrat est invalide ou n'existe pas.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => { fetchContrat(); }, [fetchContrat]);

  useEffect(() => {
    if (!contrat) return;
    const action = searchParams.get('action');
    if (action === 'validate') setShowSignModal(true);
    if (action === 'reject')   setShowRejectModal(true);
  }, [searchParams, contrat]);

  // ─── Action : Valider avec signature ──────────────────────────────────────

  const handleValidate = async (
    signatureData: string | null,
    signatureFile: File | null,
    mode: SignatureMode,
  ) => {
    if (!uuid) return;
    setActionLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('signature_type', mode);

      if (mode === 'drawn' && signatureData) {
        formData.append('signature_data', signatureData);
      } else if (mode === 'uploaded' && signatureFile) {
        formData.append('signature_file', signatureFile);
      }
      // Pour 'manual' : on envoie uniquement signature_type=manual

      await HttpService.post(
        `rh/contrats/by-token/${uuid}/validate`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      const modeMsg =
        mode === 'manual'
          ? 'Votre acceptation a été enregistrée. Pensez à imprimer le contrat et à le signer physiquement avant de le remettre au CAP.'
          : 'Votre contrat a été signé et validé avec succès. Merci !';

      setSuccessMessage(modeMsg);
      setShowSignModal(false);
      await fetchContrat();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Une erreur est survenue lors de la validation.';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Action : Rejeter ─────────────────────────────────────────────────────

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
      setRejectionReason('');
      await fetchContrat();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Une erreur est survenue lors du rejet.';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Action : Télécharger le PDF stocké ───────────────────────────────────

  const handleDownload = async () => {
    if (!uuid || !contrat) return;

    // Si un PDF est directement stocké, l'ouvrir
    if ((contrat as any).pdf_url) {
      window.open((contrat as any).pdf_url, '_blank');
      return;
    }

    setDownloadLoading(true);
    setError(null);
    try {
      const result = await HttpService.downloadFile(`rh/contrats/by-token/${uuid}/download`);
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
      const msg = err?.response?.data?.message || err?.message || 'Impossible de télécharger le contrat.';
      setError(msg);
    } finally {
      setDownloadLoading(false);
    }
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const canAct      = contrat && ['transfered', 'pending'].includes(contrat.status) && !contrat.is_validated;
  const isRejected  = contrat?.status === 'cancelled';
  const hasPdf      = !!(contrat as any)?.pdf_url;
  const canDownload = !isRejected && (contrat?.is_validated === true || hasPdf);
  const statusCfg   = contrat
    ? STATUS_CONFIG[contrat.status] ?? { label: contrat.status, color: 'secondary' }
    : null;

  const goToList      = () => navigate('/notes/professor/contrats');
  const goToDashboard = () => navigate('/notes/professor/dashboard');
  const goToLogin     = () =>
    navigate('/login', {
      state: { redirectAfterLogin: window.location.pathname + window.location.search },
    });

  // ─── Render : chargement ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner size="lg" style={{ color: '#1a3a8f' }} />
        <p className="mt-3 text-muted">Chargement du contrat…</p>
      </div>
    );
  }

  if (error && !contrat) {
    return (
      <CCard className="text-center shadow-sm">
        <CCardBody className="py-5">
          <CIcon icon={cilBan} size="4xl" className="text-danger mb-3" />
          <h3>Contrat introuvable</h3>
          <p className="text-muted">{error}</p>
          {isAuthenticated ? (
            <CButton color="primary" onClick={goToDashboard}>Retour au tableau de bord</CButton>
          ) : (
            <CButton color="primary" onClick={goToLogin}>Se connecter</CButton>
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
          <CIcon icon={cilCheckCircle} className="me-2" />{successMessage}
        </CAlert>
      )}
      {error && (
        <CAlert color="danger" className="mb-4" dismissible onClose={() => setError(null)}>
          <CIcon icon={cilWarning} className="me-2" />{error}
        </CAlert>
      )}

      {/* Carte principale */}
      <CCard className="mb-4 shadow-sm">
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h4 className="mb-0" style={{ color: '#1a3a8f' }}>
                Contrat N°{contrat.contrat_number}
              </h4>
              <div className="mt-2 d-flex gap-2 flex-wrap">
                {statusCfg && <CBadge color={statusCfg.color}>{statusCfg.label}</CBadge>}
                {contrat.is_validated && <CBadge color="success">Validé par vous</CBadge>}
                {(contrat as any).is_authorized && <CBadge color="primary">Autorisé par le CAP</CBadge>}
                {isRejected && <CBadge color="danger">Rejeté</CBadge>}
              </div>
            </div>

            {/* Bouton Télécharger */}
            <div className="d-flex flex-column align-items-end">
              <CButton
                color="success"
                variant={canDownload ? undefined : 'outline'}
                onClick={handleDownload}
                disabled={!canDownload || downloadLoading}
                title={
                  isRejected
                    ? 'Téléchargement impossible : contrat rejeté'
                    : !contrat.is_validated && !hasPdf
                    ? 'Vous devez d\'abord valider le contrat'
                    : hasPdf
                    ? 'Ouvrir le PDF officiel du contrat'
                    : 'Télécharger le PDF du contrat signé'
                }
              >
                {downloadLoading
                  ? <CSpinner size="sm" className="me-2" />
                  : <CIcon icon={cilCloudDownload} className="me-2" />}
                {hasPdf ? 'Voir le PDF officiel' : 'Télécharger le PDF'}
              </CButton>
              {!canDownload && !isRejected && (
                <small className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                  Disponible après votre validation
                </small>
              )}
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <CRow>
            {/* Infos contrat */}
            <CCol md={6}>
              <CCard className="mb-3 border-0 bg-light">
                <CCardHeader className="bg-transparent border-0 fw-semibold">
                  Informations du contrat
                </CCardHeader>
                <CCardBody>
                  <table className="table table-sm table-borderless">
                    <tbody>
                      <tr><th>Numéro</th><td>N° {contrat.contrat_number}</td></tr>
                      <tr><th>Année</th><td>{(contrat as any).academic_year?.academic_year ?? '—'}</td></tr>
                      <tr><th>Cycle</th><td>{(contrat as any).cycle?.name ?? '—'}</td></tr>
                      <tr><th>Division</th><td>{contrat.division ?? '—'}</td></tr>
                      <tr>
                        <th>Regroupement</th>
                        <td>{contrat.regroupement === '1' ? 'I' : contrat.regroupement === '2' ? 'II' : '—'}</td>
                      </tr>
                      <tr><th>Début</th><td>{formatDate(contrat.start_date)}</td></tr>
                      <tr><th>Fin</th><td>{formatDate(contrat.end_date)}</td></tr>
                      <tr><th>Montant</th><td className="fw-bold text-success">{formatAmount(contrat.amount)}</td></tr>
                      {contrat.notes && <tr><th>Notes</th><td>{contrat.notes}</td></tr>}
                    </tbody>
                  </table>
                </CCardBody>
              </CCard>
            </CCol>

            {/* Infos personnelles */}
            <CCol md={6}>
              <CCard className="mb-3 border-0 bg-light">
                <CCardHeader className="bg-transparent border-0 fw-semibold">
                  Informations personnelles
                </CCardHeader>
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
                          <td>{contrat.professor.rib_number ? `${contrat.professor.rib_number} — ${contrat.professor.bank ?? ''}` : '—'}</td>
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

          {/* Signature existante */}
          {contrat.is_validated && (contrat as any).professor_signature_url && (
            <CCard className="mb-3 border-success">
              <CCardHeader className="bg-success bg-opacity-10 text-success fw-semibold">
                <CIcon icon={cilCheckCircle} className="me-2" />
                Signature électronique enregistrée
              </CCardHeader>
              <CCardBody className="text-center py-3">
                <img
                  src={(contrat as any).professor_signature_url}
                  alt="Votre signature"
                  style={{ maxWidth: '280px', maxHeight: '120px', objectFit: 'contain', border: '1px solid #d0e8d0', borderRadius: '8px', background: '#f8fff8', padding: '12px' }}
                />
                {(contrat as any).professor_signed_at && (
                  <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.82rem' }}>
                    Signé le {formatDate((contrat as any).professor_signed_at)}
                    {(contrat as any).professor_signature_type === 'drawn'
                      ? ' (signature manuscrite numérique)'
                      : (contrat as any).professor_signature_type === 'uploaded'
                      ? ' (signature importée)'
                      : ''}
                  </p>
                )}
              </CCardBody>
            </CCard>
          )}

          {/* Validation manuelle (pas de signature numérique) */}
          {contrat.is_validated && !(contrat as any).professor_signature_url && (
            <CCard className="mb-3 border-warning">
              <CCardHeader className="bg-warning bg-opacity-10 text-warning fw-semibold">
                <CIcon icon={cilPrint} className="me-2" />
                Validation acceptée — signature manuelle requise
              </CCardHeader>
              <CCardBody>
                <p className="mb-0 text-muted" style={{ fontSize: '0.88rem' }}>
                  Vous avez accepté les termes du contrat. Veuillez imprimer le contrat, apposer votre
                  signature manuscrite et le remettre au service RH du CAP dans les meilleurs délais.
                </p>
                {(contrat as any).pdf_url && (
                  <div className="mt-2">
                    <CButton color="warning" variant="outline" size="sm"
                      onClick={() => window.open((contrat as any).pdf_url, '_blank')}>
                      <CIcon icon={cilPrint} className="me-1" /> Imprimer le contrat
                    </CButton>
                  </div>
                )}
              </CCardBody>
            </CCard>
          )}

          {/* Programmes associés */}
          {contrat.course_element_professors && contrat.course_element_professors.length > 0 && (
            <CCard className="mb-3 border-0 bg-light">
              <CCardHeader className="bg-transparent border-0 fw-semibold">Programmes associés</CCardHeader>
              <CCardBody>
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Code</th><th>Matière</th><th>Unité d'enseignement</th><th>Classe</th><th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contrat.course_element_professors.map((prog, idx) => (
                        <tr key={idx}>
                          <td><code>{prog.course_element.code}</code></td>
                          <td>{prog.course_element.name}</td>
                          <td>{prog.course_element.teaching_unit?.name}</td>
                          <td>{prog.class_group?.name ?? '—'}</td>
                          <td>
                            <CBadge color={prog.is_primary ? 'primary' : 'secondary'}>
                              {prog.is_primary ? 'Titulaire' : 'Remplaçant'}
                            </CBadge>
                          </td>
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
              <CCardHeader className="bg-danger text-white fw-semibold">
                <CIcon icon={cilXCircle} className="me-2" />
                Motif de rejet transmis au CAP
              </CCardHeader>
              <CCardBody>{contrat.rejection_reason}</CCardBody>
            </CCard>
          )}

          {/* ── Boutons d'action ── */}
          {canAct && !isRejected && (
            <CCard className="mb-3 border-0" style={{ background: '#f5f8ff' }}>
              <CCardBody>
                <p className="text-center text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                  Veuillez lire attentivement votre contrat avant de prendre une décision.
                  <br /><strong>Cette action est définitive.</strong>
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <CButton color="success" onClick={() => setShowSignModal(true)} disabled={actionLoading} style={{ minWidth: 180 }}>
                    <CIcon icon={cilPencil} className="me-2" /> Valider le contrat
                  </CButton>
                  <CButton color="danger" variant="outline" onClick={() => setShowRejectModal(true)} disabled={actionLoading} style={{ minWidth: 180 }}>
                    <CIcon icon={cilXCircle} className="me-2" /> Rejeter le contrat
                  </CButton>
                </div>
              </CCardBody>
            </CCard>
          )}
        </CCardBody>
      </CCard>

      {/* ── Modal : Signature/Validation ── */}
      <SignatureModal
        visible={showSignModal}
        contratNumber={contrat.contrat_number}
        onClose={() => setShowSignModal(false)}
        onConfirm={handleValidate}
        loading={actionLoading}
      />

      {/* ── Modal : Rejeter ── */}
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
          <p>Veuillez indiquer le motif de votre rejet. Ce motif sera transmis directement au service RH du CAP.</p>
          <CFormLabel>Motif du rejet <span className="text-danger">*</span></CFormLabel>
          <CFormTextarea
            rows={5}
            value={rejectionReason}
            onChange={(e) => { setRejectionReason(e.target.value); setRejectionError(null); }}
            placeholder="Décrivez précisément la raison pour laquelle vous rejetez ce contrat…"
            invalid={!!rejectionError}
          />
          {rejectionError && <div className="text-danger mt-1 small">{rejectionError}</div>}
          <div className="text-muted mt-1 small">{rejectionReason.length} / 1000 caractères (minimum 10)</div>
          <CAlert color="danger" className="mt-3 mb-0 py-2">
            <CIcon icon={cilWarning} className="me-2" />
            Cette action est définitive. Le contrat sera marqué comme rejeté.
          </CAlert>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => { setShowRejectModal(false); setRejectionError(null); }} disabled={actionLoading}>
            Annuler
          </CButton>
          <CButton color="danger" onClick={handleReject} disabled={actionLoading}>
            {actionLoading ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilXCircle} className="me-2" />}
            Confirmer le rejet
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default ProfessorContratDetail;
