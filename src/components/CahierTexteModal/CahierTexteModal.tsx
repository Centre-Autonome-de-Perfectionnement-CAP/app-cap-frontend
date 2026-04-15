// components/CahierTexteModal/CahierTexteModal.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CForm, CFormLabel, CFormInput, CFormTextarea,
  CRow, CCol, CBadge, CSpinner, CAlert, CTable,
  CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CTooltip,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilPlus, cilPencil, cilTrash, cilDescription,
  cilClock, cilUser, cilWarning, cilCheckCircle,
  cilXCircle, cilInfo,
} from '@coreui/icons';
import Swal from 'sweetalert2';
import inscriptionService from '@/services/inscription.service';
import type {
  ProgramRow,
  TextbookEntry,
  TextbookEntryPayload,
  CanAddResult,
} from '@/services/inscription.service';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CahierTexteModalProps {
  visible: boolean;
  onClose: () => void;
  program: ProgramRow;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONTRACT_LABELS: Record<string, { label: string; color: string }> = {
  validated: { label: 'Contrat validé',    color: 'success' },
  pending:   { label: 'Contrat en attente', color: 'warning' },
  rejected:  { label: 'Contrat rejeté',    color: 'danger'  },
  expired:   { label: 'Contrat expiré',    color: 'secondary' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Brouillon',  color: 'secondary' },
  published: { label: 'Publié',     color: 'info'      },
  validated: { label: 'Validé',     color: 'success'   },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '—';
  return timeStr.slice(0, 5); // HH:mm
}

// ─── Empty form ───────────────────────────────────────────────────────────────

const emptyForm = (): TextbookEntryPayload => ({
  session_title: '',
  content_covered: '',
  objectives: '',
  teaching_methods: '',
  homework: '',
  homework_due_date: '',
  students_present: undefined,
  students_absent: undefined,
  observations: '',
});

// ─── Component ────────────────────────────────────────────────────────────────

const CahierTexteModal: React.FC<CahierTexteModalProps> = ({ visible, onClose, program }) => {
  const [entries, setEntries]           = useState<TextbookEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [canAddInfo, setCanAddInfo]     = useState<CanAddResult | null>(null);
  const [loadingCanAdd, setLoadingCanAdd] = useState(false);

  // Form state
  const [showForm, setShowForm]         = useState(false);
  const [editingEntry, setEditingEntry] = useState<TextbookEntry | null>(null);
  const [form, setForm]                 = useState<TextbookEntryPayload>(emptyForm());
  const [formErrors, setFormErrors]     = useState<Record<string, string>>({});
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState<number | null>(null);

  // ── Load entries & can-add check ─────────────────────────────────────────
  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      const res = await inscriptionService.getTextbookEntries(program.id);
      setEntries(res.entries || []);
    } catch {
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  }, [program.id]);

  const checkCanAdd = useCallback(async () => {
    if (!program.can_add_textbook) {
      setCanAddInfo({ can_add: false, reason: 'contract', contract_status: program.contract_status });
      return;
    }
    setLoadingCanAdd(true);
    try {
      const res = await inscriptionService.canAddTextbook(program.id);
      setCanAddInfo(res);
    } catch {
      setCanAddInfo({ can_add: false, reason: 'no_schedule_today' });
    } finally {
      setLoadingCanAdd(false);
    }
  }, [program.id, program.can_add_textbook, program.contract_status]);

  useEffect(() => {
    if (visible) {
      loadEntries();
      checkCanAdd();
    } else {
      // reset
      setShowForm(false);
      setEditingEntry(null);
      setForm(emptyForm());
      setFormErrors({});
    }
  }, [visible, loadEntries, checkCanAdd]);

  // ── Form helpers ─────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const openAddForm = () => {
    setEditingEntry(null);
    setForm(emptyForm());
    setFormErrors({});
    setShowForm(true);
  };

  const openEditForm = (entry: TextbookEntry) => {
    setEditingEntry(entry);
    setForm({
      session_title:     entry.session_title,
      content_covered:   entry.content_covered,
      objectives:        entry.objectives        ?? '',
      teaching_methods:  entry.teaching_methods  ?? '',
      homework:          entry.homework          ?? '',
      homework_due_date: entry.homework_due_date ?? '',
      students_present:  entry.students_present  ?? undefined,
      students_absent:   entry.students_absent   ?? undefined,
      observations:      entry.observations      ?? '',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingEntry(null);
    setForm(emptyForm());
    setFormErrors({});
  };

  // Client-side validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.session_title?.trim()) errors.session_title = 'Le titre de la séance est obligatoire.';
    if (!form.content_covered?.trim()) errors.content_covered = 'Le contenu du cours est obligatoire.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: TextbookEntryPayload = {
        ...form,
        students_present: form.students_present ? Number(form.students_present) : undefined,
        students_absent:  form.students_absent  ? Number(form.students_absent)  : undefined,
      };

      if (editingEntry) {
        await inscriptionService.updateTextbookEntry(editingEntry.id, payload);
        Swal.fire({ icon: 'success', title: 'Mis à jour', text: 'Entrée modifiée avec succès.', timer: 1800, showConfirmButton: false });
      } else {
        await inscriptionService.createTextbookEntry(program.id, payload);
        Swal.fire({ icon: 'success', title: 'Créée', text: 'Entrée ajoutée (brouillon).', timer: 1800, showConfirmButton: false });
      }
      cancelForm();
      await loadEntries();
    } catch (err: any) {
      const serverErrors = err?.response?.data?.errors;
      if (serverErrors) {
        const mapped: Record<string, string> = {};
        Object.entries(serverErrors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? (v as string[])[0] : String(v);
        });
        setFormErrors(mapped);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err?.response?.data?.message || 'Une erreur est survenue.',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (entry: TextbookEntry) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Supprimer cette entrée ?',
      text: `"${entry.session_title}" sera définitivement supprimée.`,
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
    });
    if (!result.isConfirmed) return;

    setDeleting(entry.id);
    try {
      await inscriptionService.deleteTextbookEntry(entry.id);
      Swal.fire({ icon: 'success', title: 'Supprimé', timer: 1500, showConfirmButton: false });
      setEntries(prev => prev.filter(e => e.id !== entry.id));
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err?.response?.data?.message || 'Impossible de supprimer cette entrée.',
      });
    } finally {
      setDeleting(null);
    }
  };

  // ── Render: can-add banner ────────────────────────────────────────────────
  const renderCanAddBanner = () => {
    if (!program.can_add_textbook) {
      const cs = program.contract_status;
      const info = cs ? CONTRACT_LABELS[cs] : null;
      return (
        <CAlert color="warning" className="d-flex align-items-center gap-2 mb-3">
          <CIcon icon={cilWarning} />
          <div>
            <strong>Saisie désactivée</strong>
            {info && <> — {info.label}</>}
            {!cs && <> — Aucun contrat enregistré pour cet enseignant.</>}
          </div>
        </CAlert>
      );
    }

    if (loadingCanAdd) return null;

    if (!canAddInfo) return null;

    if (!canAddInfo.can_add) {
      if (canAddInfo.reason === 'no_schedule_today') {
        return (
          <CAlert color="info" className="d-flex align-items-center gap-2 mb-3">
            <CIcon icon={cilClock} />
            <span>Aucun cours prévu aujourd'hui pour ce programme.</span>
          </CAlert>
        );
      }
      if (canAddInfo.reason === 'outside_window') {
        return (
          <CAlert color="warning" className="d-flex align-items-center gap-2 mb-3">
            <CIcon icon={cilClock} />
            <div>
              <strong>Fenêtre de saisie fermée.</strong>
              {' '}Cours de {canAddInfo.slot_start} à {canAddInfo.slot_end}.
              {' '}Saisie autorisée jusqu'à {canAddInfo.deadline}.
              {' '}Il est actuellement {canAddInfo.now}.
            </div>
          </CAlert>
        );
      }
    }

    if (canAddInfo.can_add) {
      return (
        <CAlert color="success" className="d-flex align-items-center gap-2 mb-3">
          <CIcon icon={cilCheckCircle} />
          <div>
            Cours en cours : {canAddInfo.slot_start} – {canAddInfo.slot_end}.
            {' '}Saisie ouverte jusqu'à {canAddInfo.deadline}.
          </div>
        </CAlert>
      );
    }

    return null;
  };

  // ── Render: form ─────────────────────────────────────────────────────────
  const renderForm = () => (
    <div className="cahier-texte-form border rounded p-3 mb-4 bg-light">
      <h6 className="mb-3 text-primary">
        <CIcon icon={editingEntry ? cilPencil : cilPlus} className="me-2" />
        {editingEntry ? 'Modifier l\'entrée' : 'Nouvelle entrée'}
        {!editingEntry && (
          <CBadge color="secondary" className="ms-2">Brouillon</CBadge>
        )}
      </h6>

      <CForm>
        <CRow className="mb-3">
          <CCol xs={12}>
            <CFormLabel htmlFor="session_title">
              Titre de la séance <span className="text-danger">*</span>
            </CFormLabel>
            <CFormInput
              id="session_title"
              name="session_title"
              value={form.session_title}
              onChange={handleChange}
              placeholder="Ex: Introduction aux algorithmes de tri"
              invalid={!!formErrors.session_title}
            />
            {formErrors.session_title && (
              <div className="invalid-feedback d-block">{formErrors.session_title}</div>
            )}
          </CCol>
        </CRow>

        <CRow className="mb-3">
          <CCol xs={12}>
            <CFormLabel htmlFor="content_covered">
              Contenu du cours <span className="text-danger">*</span>
            </CFormLabel>
            <CFormTextarea
              id="content_covered"
              name="content_covered"
              rows={3}
              value={form.content_covered}
              onChange={handleChange}
              placeholder="Décrivez le contenu traité pendant la séance..."
              invalid={!!formErrors.content_covered}
            />
            {formErrors.content_covered && (
              <div className="invalid-feedback d-block">{formErrors.content_covered}</div>
            )}
          </CCol>
        </CRow>

        <CRow className="mb-3">
          <CCol xs={12} md={6}>
            <CFormLabel htmlFor="objectives">Objectifs pédagogiques</CFormLabel>
            <CFormTextarea
              id="objectives"
              name="objectives"
              rows={2}
              value={form.objectives || ''}
              onChange={handleChange}
              placeholder="Objectifs visés..."
            />
          </CCol>
          <CCol xs={12} md={6}>
            <CFormLabel htmlFor="teaching_methods">Méthodes pédagogiques</CFormLabel>
            <CFormTextarea
              id="teaching_methods"
              name="teaching_methods"
              rows={2}
              value={form.teaching_methods || ''}
              onChange={handleChange}
              placeholder="Ex: cours magistral, TD, TP..."
            />
          </CCol>
        </CRow>

        <CRow className="mb-3">
          <CCol xs={12} md={8}>
            <CFormLabel htmlFor="homework">Devoirs / Travaux à faire</CFormLabel>
            <CFormTextarea
              id="homework"
              name="homework"
              rows={2}
              value={form.homework || ''}
              onChange={handleChange}
              placeholder="Description des travaux à rendre..."
            />
          </CCol>
          <CCol xs={12} md={4}>
            <CFormLabel htmlFor="homework_due_date">Date de rendu</CFormLabel>
            <CFormInput
              type="date"
              id="homework_due_date"
              name="homework_due_date"
              value={form.homework_due_date || ''}
              onChange={handleChange}
            />
          </CCol>
        </CRow>

        <CRow className="mb-3">
          <CCol xs={6} md={3}>
            <CFormLabel htmlFor="students_present">Présents</CFormLabel>
            <CFormInput
              type="number"
              id="students_present"
              name="students_present"
              min={0}
              value={form.students_present ?? ''}
              onChange={handleChange}
              placeholder="0"
            />
          </CCol>
          <CCol xs={6} md={3}>
            <CFormLabel htmlFor="students_absent">Absents</CFormLabel>
            <CFormInput
              type="number"
              id="students_absent"
              name="students_absent"
              min={0}
              value={form.students_absent ?? ''}
              onChange={handleChange}
              placeholder="0"
            />
          </CCol>
          <CCol xs={12} md={6}>
            <CFormLabel htmlFor="observations">Observations</CFormLabel>
            <CFormInput
              id="observations"
              name="observations"
              value={form.observations || ''}
              onChange={handleChange}
              placeholder="Remarques éventuelles..."
            />
          </CCol>
        </CRow>

        <div className="d-flex gap-2 justify-content-end">
          <CButton color="secondary" variant="outline" onClick={cancelForm} disabled={saving}>
            Annuler
          </CButton>
          <CButton color="primary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <><CSpinner size="sm" className="me-2" />Enregistrement...</>
            ) : (
              <><CIcon icon={editingEntry ? cilPencil : cilPlus} className="me-2" />
                {editingEntry ? 'Mettre à jour' : 'Enregistrer (brouillon)'}</>
            )}
          </CButton>
        </div>
      </CForm>
    </div>
  );

  // ── Render: entries table ─────────────────────────────────────────────────
  const renderEntriesTable = () => {
    if (loadingEntries) {
      return (
        <div className="text-center py-4">
          <CSpinner size="sm" color="primary" className="me-2" />
          Chargement des entrées...
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="text-center py-5 text-muted">
          <CIcon icon={cilDescription} size="xl" className="mb-3 opacity-50" />
          <p className="mb-0">Aucune entrée dans le cahier de texte pour ce programme.</p>
        </div>
      );
    }

    return (
      <CTable hover responsive className="mb-0">
        <CTableHead>
          <CTableRow className="table-light">
            <CTableHeaderCell>Date</CTableHeaderCell>
            <CTableHeaderCell>Horaire</CTableHeaderCell>
            <CTableHeaderCell>Titre de la séance</CTableHeaderCell>
            <CTableHeaderCell>Présents</CTableHeaderCell>
            <CTableHeaderCell>Statut</CTableHeaderCell>
            <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {entries.map(entry => {
            const st = STATUS_LABELS[entry.status] || { label: entry.status, color: 'secondary' };
            const isDraft = entry.status === 'draft';
            return (
              <CTableRow key={entry.id}>
                <CTableDataCell className="text-nowrap">
                  {formatDate(entry.session_date)}
                </CTableDataCell>
                <CTableDataCell className="text-nowrap text-muted small">
                  {formatTime(entry.start_time)} – {formatTime(entry.end_time)}
                </CTableDataCell>
                <CTableDataCell>
                  <div className="fw-semibold">{entry.session_title}</div>
                  {entry.content_covered && (
                    <small className="text-muted text-truncate d-block" style={{ maxWidth: 220 }}>
                      {entry.content_covered}
                    </small>
                  )}
                </CTableDataCell>
                <CTableDataCell>
                  {entry.students_present != null ? (
                    <span>
                      <span className="text-success fw-bold">{entry.students_present}</span>
                      {entry.students_absent != null && (
                        <span className="text-muted"> / {entry.students_absent} abs.</span>
                      )}
                    </span>
                  ) : '—'}
                </CTableDataCell>
                <CTableDataCell>
                  <CBadge color={st.color}>{st.label}</CBadge>
                </CTableDataCell>
                <CTableDataCell className="text-end">
                  <div className="d-flex gap-1 justify-content-end">
                    {isDraft ? (
                      <>
                        <CTooltip content="Modifier">
                          <CButton
                            size="sm"
                            color="warning"
                            variant="outline"
                            onClick={() => openEditForm(entry)}
                          >
                            <CIcon icon={cilPencil} />
                          </CButton>
                        </CTooltip>
                        <CTooltip content="Supprimer">
                          <CButton
                            size="sm"
                            color="danger"
                            variant="outline"
                            onClick={() => handleDelete(entry)}
                            disabled={deleting === entry.id}
                          >
                            {deleting === entry.id
                              ? <CSpinner size="sm" />
                              : <CIcon icon={cilTrash} />
                            }
                          </CButton>
                        </CTooltip>
                      </>
                    ) : (
                      <CTooltip content="Non modifiable (statut : publié/validé)">
                        <span>
                          <CButton size="sm" color="secondary" variant="outline" disabled>
                            <CIcon icon={cilXCircle} />
                          </CButton>
                        </span>
                      </CTooltip>
                    )}
                  </div>
                </CTableDataCell>
              </CTableRow>
            );
          })}
        </CTableBody>
      </CTable>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────
  const addButtonEnabled = !loadingCanAdd && canAddInfo?.can_add === true && !showForm;
  const contractInfo = program.contract_status ? CONTRACT_LABELS[program.contract_status] : null;

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      size="xl"
      scrollable
      className="cahier-texte-modal"
    >
      <CModalHeader>
        <CModalTitle>
          <CIcon icon={cilDescription} className="me-2 text-primary" />
          Cahier de texte —{' '}
          <span className="text-primary">{program.course_element_name || 'Programme'}</span>
          {program.course_element_code && (
            <CBadge color="light" textColor="dark" className="ms-2">
              {program.course_element_code}
            </CBadge>
          )}
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        {/* Info du programme */}
        <div className="program-info-bar d-flex flex-wrap gap-3 align-items-center mb-4 p-3 bg-light rounded border">
          <div>
            <small className="text-muted d-block">Unité d'enseignement</small>
            <span className="fw-semibold">{program.teaching_unit_name || '—'}</span>
          </div>
          <div className="vr" />
          <div>
            <small className="text-muted d-block">Enseignant</small>
            <span className="fw-semibold">
              <CIcon icon={cilUser} size="sm" className="me-1 text-muted" />
              {program.professor_name || '—'}
            </span>
          </div>
          <div className="vr" />
          <div>
            <small className="text-muted d-block">Semestre</small>
            <span className="fw-semibold">{program.semester || '—'}</span>
          </div>
          <div className="vr" />
          <div>
            <small className="text-muted d-block">Contrat</small>
            {contractInfo ? (
              <CBadge color={contractInfo.color}>{contractInfo.label}</CBadge>
            ) : (
              <CBadge color="secondary">Aucun contrat</CBadge>
            )}
          </div>
          <div className="ms-auto">
            <small className="text-muted d-block">Entrées</small>
            <span className="fw-bold fs-5 text-primary">{entries.length}</span>
          </div>
        </div>

        {/* Bannière can-add */}
        {renderCanAddBanner()}

        {/* Formulaire */}
        {showForm && renderForm()}

        {/* Bouton ajouter */}
        {!showForm && (
          <div className="d-flex justify-content-end mb-3">
            {loadingCanAdd ? (
              <CButton color="primary" disabled>
                <CSpinner size="sm" className="me-2" />Vérification...
              </CButton>
            ) : (
              <CButton
                color="primary"
                onClick={openAddForm}
                disabled={!addButtonEnabled}
              >
                <CIcon icon={cilPlus} className="me-2" />
                Ajouter une entrée
              </CButton>
            )}
          </div>
        )}

        {/* Tableau des entrées */}
        {renderEntriesTable()}
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>
          Fermer
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default CahierTexteModal;