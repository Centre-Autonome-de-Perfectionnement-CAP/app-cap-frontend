// src/views/pages/rh/Contrats.tsx
//
// REFACTOR (découpage de maintenabilité, aucune régression fonctionnelle) :
// ce fichier faisait 2573 lignes (17 composants/hooks empilés dans un seul
// fichier). Toute la logique métier est inchangée — seule l'organisation en
// fichiers a changé. Le détail de chaque brique déplacée est dans
// src/views/pages/rh/contrats/.
import React, { useCallback, useEffect, useState } from 'react';
import rhService from '@/services/rh.service';
import type {
  Contrat,
  AcademicYear,
  Cycle,
  ContratStatus,
  CreateContratPayload,
  UpdateContratPayload,
} from '@/types/rh.types';

import Icon from './contrats/Contrats.icons';
import GLOBAL_STYLE from './contrats/Contrats.styles';
import { STATUS_CONFIG } from './contrats/Contrats.constants';
import {
  formatDate,
  formatAmount,
  extractError,
  validateDatesInAcademicYear,
  normalizeDivision,
  applyFilters,
} from './contrats/Contrats.helpers';
import type { Professor, FormState, FilterState } from './contrats/Contrats.types';
import { emptyForm, emptyFilters } from './contrats/Contrats.types';

import useToasts from './contrats/hooks/useToasts';

import Modal from './contrats/components/Modal';
import ConfirmModal from './contrats/components/ConfirmModal';
import SuccessModal from './contrats/components/SuccessModal';
import ToastContainer from './contrats/components/ToastContainer';
import ContratFormFields from './contrats/components/ContratFormFields';
import AdminCourseSupportModal from './contrats/components/AdminCourseSupportModal';
import UploadPdfModal from './contrats/components/UploadPdfModal';
import FilterBar from './contrats/components/FilterBar';

// ─── CSS global injecté une fois (identique au comportement d'origine) ───────
if (typeof document !== 'undefined' && !document.getElementById('ctr-styles')) {
  const s = document.createElement('style');
  s.id = 'ctr-styles';
  s.textContent = GLOBAL_STYLE;
  document.head.appendChild(s);
}
if (typeof document !== 'undefined' && !document.getElementById('ctr-spin')) {
  const s = document.createElement('style');
  s.id = 'ctr-spin';
  s.textContent = '@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }';
  document.head.appendChild(s);
}

const Contrats: React.FC = () => {
  // ─── Rôle de l'utilisateur connecté (récupéré via /auth/me) ────────────────
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    import('@/services/http.service').then(({ default: http }) => {
      (http as any).get('auth/me')
        .then((res: any) => {
          const u = res?.data ?? res ?? null;
          setCurrentUser(u);
        })
        .catch(() => { /* silencieux — pas de restriction */ });
    });
  }, []);

  const userRole = currentUser?.role ?? localStorage.getItem('role') ?? '';
  const userDivision = currentUser?.chef_division_type ?? null;

  const isResponsableDivision =
    userRole === 'responsable-division' ||
    userRole === 'chef-division' ||
    userRole === 'responsable';

  const isChefCAP = userRole === 'chef-cap';
  const isAdmin = userRole === 'admin' || isChefCAP;

  // Actions administratives restreintes pour le Responsable Division
  const isRestricted = isResponsableDivision;

  const supportDivisionFilter: string | null =
    userDivision ? normalizeDivision(userDivision) : null;

  const [contrats, setContrats]           = useState<Contrat[]>([]);
  const [professors, setProfessors]       = useState<Professor[]>([]);
  const [cycles, setCycles]               = useState<{ id: number; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  const [filters, setFilters] = useState<FilterState>({ ...emptyFilters });

  // Modal states
  const [showCreate, setShowCreate]             = useState(false);
  const [editingContrat, setEditingContrat]     = useState<Contrat | null>(null);
  const [uploadPdfContrat, setUploadPdfContrat] = useState<Contrat | null>(null);
  const [supportContrat, setSupportContrat]     = useState<Contrat | null>(null);
  const [modalOpenKey, setModalOpenKey]         = useState(0);

  // Confirm modals
  const [deleteConfirm, setDeleteConfirm]       = useState<Contrat | null>(null);
  const [transferConfirm, setTransferConfirm]   = useState<Contrat | null>(null);
  const [authorizeConfirm, setAuthorizeConfirm] = useState<Contrat | null>(null);
  const [relaunchConfirm, setRelaunchConfirm]   = useState<Contrat | null>(null);

  // Success modal
  type SuccessInfo = { title: string; message: string; detail?: string; iconBg?: string; iconColor?: string; icon?: React.ReactNode };
  const [successModal, setSuccessModal] = useState<SuccessInfo | null>(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const showSuccess = useCallback((info: SuccessInfo) => setSuccessModal(info), []);

  const [deleteLoading, setDeleteLoading]       = useState(false);
  const [transferLoading, setTransferLoading]   = useState(false);
  const [authorizeLoading, setAuthorizeLoading] = useState(false);
  const [relaunchLoading, setRelaunchLoading]   = useState(false);

  // Forms
  const [createForm, setCreateForm]         = useState<FormState>({ ...emptyForm });
  const [editForm, setEditForm]             = useState<FormState>({ ...emptyForm });
  const [createLoading, setCreateLoading]   = useState(false);
  const [editLoading, setEditLoading]       = useState(false);
  const [createError, setCreateError]       = useState('');
  const [editError, setEditError]           = useState('');

  const { toasts, add: addToast, remove: removeToast } = useToasts();

  const reload = useCallback((onDone?: (freshContrats: Contrat[]) => void) => {
    setLoading(true);
    rhService.getContrats()
      .then(r => {
        const list = r.data || [];
        setContrats(list);
        setLoading(false);
        onDone?.(list);
      })
      .catch(() => { setError('Impossible de charger les contrats'); setLoading(false); });
  }, []);

  useEffect(() => {
    reload();
    rhService.getProfessorsForSelect().then(r => setProfessors((r.data || []) as Professor[])).catch(() => {});
    rhService.getCycles().then(setCycles).catch(() => {});
    rhService.getAcademicYears().then(setAcademicYears).catch(() => {});
  }, [reload]);

  // Récupérer l'année académique sélectionnée pour le formulaire
  const getSelectedAcademicYear = (academicYearId: string) => {
    return academicYears.find(y => String(y.id) === academicYearId);
  };

  // Validation des dates pour la création/modification
  const validateContractDates = (formData: FormState): string | null => {
    if (!formData.academic_year_id) return null;
    const selectedYear = academicYears.find(y => String(y.id) === formData.academic_year_id);
    // Utilisation de year_start et year_end
    if (!selectedYear || !selectedYear.year_start || !selectedYear.year_end) {
      return "L'année académique sélectionnée n'a pas de dates valides";
    }

    return validateDatesInAcademicYear(
      formData.start_date,
      formData.end_date || null,
      selectedYear.year_start,
      selectedYear.year_end
    );
  };

  // ─── Ouvrir PDF stocké ───────────────────────────────────────────────────────
  const openPdf = useCallback((c: Contrat) => {
    if (c.pdf_url) {
      window.open(c.pdf_url, '_blank');
    } else {
      addToast('info', 'Aucun PDF stocké',
        'Le PDF sera disponible après validation du contrat par le professeur. Vous pouvez aussi l\'uploader via le bouton "Autoriser".');
    }
  }, [addToast]);

  const openEdit = (c: Contrat) => {
    if (c.is_locked) {
      addToast('warning', 'Contrat verrouillé', 'Ce contrat a été validé ou autorisé. Aucune modification n\'est possible.');
      return;
    }
    // Pré-remplir les montants/heure existants depuis les programmes du contrat
    const existingAmounts: Record<number, string> = {};
    (c.course_element_professors ?? []).forEach(p => {
      const amt = (p as any).amount_program;
      if (amt !== undefined && amt !== null) {
        existingAmounts[p.id] = String(amt);
      }
    });
    setEditForm({
      division:         c.division ?? '',
      professor_id:     String(c.professor_id),
      academic_year_id: String(c.academic_year_id),
      cycle_id:         c.cycle_id ? String(c.cycle_id) : '',
      regroupement:     c.regroupement ?? '',
      start_date:       c.start_date?.substring(0, 10) ?? '',
      end_date:         c.end_date?.substring(0, 10) ?? '',
      amount:           '0',
      notes:            c.notes ?? '',
      status:           c.status,
      program_ids:      (c.course_element_professors ?? []).map(p => p.id),
      program_amounts:  existingAmounts,
    });
    setEditingContrat(c);
    setEditError('');
  };

  const closeEdit   = () => { setEditingContrat(null); setEditError(''); };
  const closeCreate = () => { setShowCreate(false); setCreateError(''); setCreateForm({ ...emptyForm }); };

  const onFieldChange = (setter: React.Dispatch<React.SetStateAction<FormState>>) =>
    (name: string, value: string | number[] | Record<number, string>) => setter(f => ({ ...f, [name]: value }));

  const buildCreate = (f: FormState): CreateContratPayload => {
    console.log('program_amounts envoyé:', f.program_amounts);
    // Calcul automatique du montant total = somme des (montant/heure × heures) par programme
    // Si aucun montant renseigné, on envoie 0
    const filteredAmounts = Object.fromEntries(
      Object.entries(f.program_amounts)
        .filter(([, v]) => v !== '' && !isNaN(parseFloat(v)))
        .map(([k, v]) => [k, parseFloat(v)])
    );
    const totalAmount = Object.values(filteredAmounts).reduce((sum, v) => sum + v, 0);

    return {
      division:                     f.division || null,
      professor_id:                 Number(f.professor_id),
      academic_year_id:             Number(f.academic_year_id),
      cycle_id:                     f.cycle_id ? Number(f.cycle_id) : null,
      regroupement:                 f.regroupement || null,
      start_date:                   f.start_date,
      end_date:                     f.end_date || null,
      amount:                       totalAmount,
      notes:                        f.notes || null,
      course_element_professor_ids: f.program_ids.length ? f.program_ids : undefined,
      program_amounts:              Object.keys(filteredAmounts).length ? filteredAmounts : undefined,
    };
  };
  const buildUpdate = (f: FormState): UpdateContratPayload => ({
    ...buildCreate(f), status: f.status as ContratStatus,
    course_element_professor_ids: f.program_ids,
  });

  const validate = (f: FormState): string | null => {
    if (!f.division)         return 'Veuillez sélectionner une division.';
    if (!f.professor_id)     return 'Veuillez sélectionner un professeur.';
    if (!f.academic_year_id) return 'Veuillez sélectionner une année académique.';
    if (!f.regroupement)     return 'Veuillez sélectionner un regroupement.';
    if (!f.cycle_id)         return 'Veuillez sélectionner un cycle.';
    if (!f.program_ids || f.program_ids.length === 0) return 'Veuillez sélectionner au moins un programme (ECUE).';

    if (!f.start_date)       return 'La date de début est obligatoire.';

    // Validation des dates par rapport à l'année académique
    const dateValidationError = validateContractDates(f);
    if (dateValidationError) return dateValidationError;

    return null;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(createForm);
    if (err) { setCreateError(err); return; }
    setCreateLoading(true); setCreateError('');
    try {
      await rhService.createContrat(buildCreate(createForm));
      reload();
      closeCreate();
      showSuccess({
        title: 'Contrat créé avec succès',
        message: 'Le nouveau contrat de prestation a bien été enregistré.',
        detail: 'Vous pouvez maintenant le transférer au professeur pour signature.',
        iconBg: '#f0fdf4', iconColor: '#16a34a', icon: <Icon.Check />,
      });
    } catch (err: any) {
      setCreateError(err?.response?.data ? extractError(err.response.data, err?.response?.status || 500) : err.message || 'Erreur');
    } finally { setCreateLoading(false); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContrat) return;
    const err = validate(editForm);
    if (err) { setEditError(err); return; }
    setEditLoading(true); setEditError('');
    try {
      await rhService.updateContrat(editingContrat.id, buildUpdate(editForm));
      reload();
      closeEdit();
      showSuccess({
        title: 'Contrat modifié',
        message: 'Les modifications ont été enregistrées avec succès.',
        iconBg: '#eff6ff', iconColor: '#2563eb', icon: <Icon.Check />,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? (err?.response?.data ? extractError(err.response.data, err?.response?.status || 500) : err.message || 'Erreur');
      setEditError(msg);
    } finally { setEditLoading(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await rhService.deleteContrat(deleteConfirm.id);
      const num = deleteConfirm.contrat_number;
      setDeleteConfirm(null);
      reload();
      showSuccess({
        title: 'Contrat supprimé',
        message: `Le contrat ${num} a été supprimé définitivement.`,
        iconBg: '#fef2f2', iconColor: '#dc2626', icon: <Icon.Trash />,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message ?? 'Une erreur est survenue';
      addToast('error', 'Erreur de suppression', msg);
      setDeleteConfirm(null);
    } finally { setDeleteLoading(false); }
  };

 const handleTransferConfirm = async () => {
  const c = transferConfirm;
  if (!c) return;
  setTransferLoading(true);
  try {
    await rhService.updateContrat(c.id, {
      division:                     c.division ?? null,
      professor_id:                 c.professor_id,
      academic_year_id:             c.academic_year_id,
      cycle_id:                     c.cycle_id ?? null,
      regroupement:                 c.regroupement ?? null,
      start_date:                   c.start_date?.substring(0, 10) ?? '',
      end_date:                     c.end_date?.substring(0, 10) ?? null,
      amount:                       Number(c.amount),
      notes:                        c.notes ?? null,
      status:                       'transfered' as ContratStatus,
      course_element_professor_ids: (c.course_element_professors ?? []).map(p => p.id),
    });
    await rhService.sendTransferEmail(c.id);
    const profName = c.professor?.full_name ?? "l'enseignant";

    setTransferConfirm(null);
    reload();
    showSuccess({
      title: 'Contrat transféré',
      message: `Le contrat N° ${c.contrat_number} a été transféré à ${profName}.`,
      detail: `Un e-mail et un message WhatsApp de notification (avec le contrat en pièce jointe) ont été envoyés automatiquement à ${profName}.`,
      iconBg: '#faf5ff', iconColor: '#7c3aed', icon: <Icon.Mail />,
    });
  } catch (err: any) {
    addToast('error', 'Erreur de transfert', err?.response?.data?.message ?? err.message ?? 'Une erreur est survenue');
  } finally {
    setTransferLoading(false);
  }
};
  const handleAuthorizeConfirm = async () => {
    const c = authorizeConfirm;
    if (!c) return;
    setAuthorizeLoading(true);
    try {
      await rhService.authorizeContrat(c.id);
      setAuthorizeConfirm(null);
      reload();
      showSuccess({
        title: 'Contrat autorisé',
        message: `Le contrat N° ${c.contrat_number} est maintenant autorisé et verrouillé.`,
        detail: 'Le contrat est passé au statut « En cours ». Cette action est irréversible.',
        iconBg: '#f0fdf4', iconColor: '#059669', icon: <Icon.ShieldCheck />,
      });
    } catch (err: any) {
      addToast('error', 'Erreur d\'autorisation', err?.response?.data?.message ?? err.message ?? 'Une erreur est survenue');
      setAuthorizeConfirm(null);
    } finally {
      setAuthorizeLoading(false);
    }
  };

  const handleRelaunchConfirm = async () => {
    const c = relaunchConfirm;
    if (!c) return;
    setRelaunchLoading(true);
    try {
      await rhService.updateContrat(c.id, {
        division:                     c.division ?? null,
        professor_id:                 c.professor_id,
        academic_year_id:             c.academic_year_id,
        cycle_id:                     c.cycle_id ?? null,
        regroupement:                 c.regroupement ?? null,
        start_date:                   c.start_date?.substring(0, 10) ?? '',
        end_date:                     c.end_date?.substring(0, 10) ?? null,
        amount:                       Number(c.amount),
        notes:                        c.notes ?? null,
        status:                       'pending' as ContratStatus,
        course_element_professor_ids: (c.course_element_professors ?? []).map(p => p.id),
      });
      setRelaunchConfirm(null);
      reload();
      showSuccess({
        title: 'Contrat relancé',
        message: `Le contrat N° ${c.contrat_number} est de nouveau en attente.`,
        detail: "Vous pouvez le modifier puis le retransférer à l'enseignant.",
        iconBg: '#fff7ed', iconColor: '#ea580c', icon: <Icon.Refresh />,
      });
    } catch (err: any) {
      addToast('error', 'Erreur', err?.response?.data?.message ?? err.message ?? 'Une erreur est survenue');
      setRelaunchConfirm(null);
    } finally {
      setRelaunchLoading(false);
    }
  };

  const filteredContrats = applyFilters(contrats, filters);

  const COLS = ['N° Contrat', 'Division', 'Cycle', 'Regroupement', 'Professeur', 'Année', 'Programmes', 'Début', 'Fin', 'Montant', 'Statut', 'Actions'];

  return (
    <div className="ctr-root" style={{ padding: '28px 32px', minHeight: '100vh', background: '#f8f9fb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-.02em' }}>Contrats d'enseignement</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6c648b' }}>
            {loading ? 'Chargement…' : filteredContrats.length !== contrats.length
              ? `${filteredContrats.length} / ${contrats.length} contrat${contrats.length !== 1 ? 's' : ''}`
              : `${contrats.length} contrat${contrats.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {!isRestricted && (
          <button
            className="ctr-btn"
            style={{ height: 38, background: '#4F46E5', color: '#fff', border: 'none' }}
            onClick={() => { setShowCreate(true); setCreateError(''); setCreateForm({ ...emptyForm }); }}
          >
            <Icon.Plus /> Nouveau contrat
          </button>
        )}
      </div>

      {!loading && !error && (
        <FilterBar
          filters={filters}
          professors={professors}
          cycles={cycles}
          academicYears={academicYears}
          total={contrats.length}
          filtered={filteredContrats.length}
          onChange={setFilters}
          onReset={() => setFilters({ ...emptyFilters })}
        />
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: '#6b7280' }}>
          <Icon.Loader /><span style={{ marginLeft: 10 }}>Chargement des contrats…</span>
        </div>
      ) : error ? (
        <div style={{ padding: '20px 24px', borderRadius: 10, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b', fontSize: 14 }}>
          {error}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #f1f5f9', boxShadow: '0 1px 8px rgba(0,0,0,.04)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="ctr-table">
              <thead>
                <tr>
                  {COLS.map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredContrats.length === 0 ? (
                  <tr>
                    <td colSpan={COLS.length} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                      <div style={{ fontSize: 13 }}>
                        {contrats.length === 0
                          ? 'Aucun contrat enregistré'
                          : 'Aucun contrat ne correspond aux filtres sélectionnés.'}
                      </div>
                    </td>
                  </tr>
                ) : filteredContrats.map(c => {
                  const st            = STATUS_CONFIG[c.status] ?? { label: c.status, color: '#374151', bg: '#f9fafb', dot: '#9ca3af' };
                  const isTransferred = c.status === 'transfered';
                  const isCancelled   = c.status === 'cancelled';
                  const isLocked      = c.is_locked === true;
                  const isValidated   = c.is_validated === true;
                  const isAuthorized  = (c as any).is_authorized === true;
                  const hasPdf        = !!c.pdf_url;

                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>{c.contrat_number || `#${c.id}`}</span>
                          {isLocked && (
                            <span className="ctr-lock-badge">
                              <Icon.Lock /> Verrouillé
                            </span>
                          )}
                          {isCancelled && (
                            <span className="ctr-reject-badge">
                              <Icon.MessageX /> Rejeté
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{c.division ? <span style={{ background: c.division === 'RD-FC' ? '#faf5ff' : '#fdf2f8', color: c.division === 'RD-FC' ? '#7c3aed' : '#9d174d', padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700 }}>{c.division}</span> : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td style={{ color: '#64748b', fontSize: 13 }}>{c.cycle?.name ?? <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td style={{ color: '#64748b', fontSize: 13 }}>{c.regroupement ? `Reg. ${c.regroupement === '1' ? 'I' : 'II'}` : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td><span style={{ fontWeight: 500, color: '#0f172a', fontSize: 13 }}>{c.professor?.full_name ?? `Prof. #${c.professor_id}`}</span></td>
                      <td style={{ color: '#64748b', fontSize: 13, whiteSpace: 'nowrap' }}>{(c as any).academic_year?.academic_year ?? <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td style={{ maxWidth: 190 }}>
                        {c.course_element_professors && c.course_element_professors.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {c.course_element_professors.slice(0, 2).map(p => (
                              <span key={p.id} style={{ fontSize: 11, background: '#f0fdf4', color: '#166534', padding: '2px 7px', borderRadius: 4, border: '1px solid #dcfce7', fontWeight: 600 }}>
                                {p.course_element?.code ?? p.label}
                              </span>
                            ))}
                            {c.course_element_professors.length > 2 && (
                              <span style={{ fontSize: 11, color: '#9ca3af', alignSelf: 'center' }}>+{c.course_element_professors.length - 2}</span>
                            )}
                          </div>
                        ) : <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      <td style={{ color: '#64748b', fontSize: 12.5, whiteSpace: 'nowrap' }}>{formatDate(c.start_date)}</td>
                      <td style={{ color: '#64748b', fontSize: 12.5, whiteSpace: 'nowrap' }}>{formatDate(c.end_date)}</td>
                      <td>
  <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: '#0f172a', fontSize: 12.5 }}>
    {(() => {
  const progs = c.course_element_professors ?? [];
  const total = progs.reduce((sum, p) => {
    const hours = (p as any).hours ?? p.course_element?.hours ?? 0;
    const amt   = (p as any).amount_program ?? 0;
    return sum + (parseFloat(amt) * Number(hours));
  }, 0);
  return total > 0 ? formatAmount(total) : formatAmount(c.amount);
})()}
  </span>
</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className="ctr-badge" style={{ background: st.bg, color: st.color }}>
                            <span className="ctr-badge-dot" style={{ background: st.dot }} />
                            {st.label}
                          </span>
                          {isCancelled && c.rejection_reason && (
                            <span
                              title={c.rejection_reason}
                              style={{
                                fontSize: 10.5,
                                color: '#b91c1c',
                                fontStyle: 'italic',
                                maxWidth: 150,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                                cursor: 'help',
                              }}
                            >
                              ↳ {c.rejection_reason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>

                          {/* PDF — visible pour tous */}
                          <button
                            className="ctr-btn-icon"
                            title={hasPdf ? 'Voir le PDF stocké' : 'Aperçu du contrat (PDF non encore disponible)'}
                            onClick={() => openPdf(c)}
                            style={hasPdf ? { borderColor: '#86efac', color: '#16a34a', background: '#f0fdf4' } : {}}
                          >
                            {hasPdf ? <Icon.FilePdf /> : <Icon.FileText />}
                          </button>

                          {/* Relancer / Transférer — visible mais désactivé si restreint */}
                          {isCancelled ? (
                            <button
                              className="ctr-btn-icon"
                              title={
                                isRestricted ? "Droit d'accès non requis"
                                  : c.rejection_reason
                                  ? `Relancer ce contrat (motif : ${c.rejection_reason})`
                                  : 'Relancer ce contrat rejeté'
                              }
                              disabled={isRestricted}
                              onClick={() => { if (!isRestricted) setRelaunchConfirm(c); }}
                              style={isRestricted ? { opacity: 0.4 } : { borderColor: '#fed7aa', color: '#ea580c', background: '#fff7ed' }}
                            >
                              <Icon.Refresh />
                            </button>
                          ) : (
                            <button
                              className="ctr-btn-icon"
                              title={
                                isRestricted ? "Droit d'accès non requis"
                                  : isLocked ? 'Contrat verrouillé'
                                  : isTransferred ? 'Contrat déjà transféré'
                                  : "Transférer et notifier l'enseignant"
                              }
                              disabled={isTransferred || isLocked || isRestricted}
                              onClick={() => { if (!isTransferred && !isLocked && !isRestricted) setTransferConfirm(c); }}
                              style={(!isTransferred && !isLocked && !isRestricted) ? { borderColor: '#c4b5fd', color: '#7c3aed' } : (isRestricted ? { opacity: 0.4 } : {})}
                            >
                              <Icon.Send />
                            </button>
                          )}

                          {/* Autoriser / Upload — visible mais désactivé si restreint */}
                          <button
                            className="ctr-btn-icon"
                            title={
                              isRestricted ? "Droit d'accès non requis"
                                : isAuthorized ? 'Contrat déjà autorisé — uploader un nouveau PDF'
                                : isValidated ? 'Autoriser le contrat / Uploader le PDF final'
                                : "Le contrat doit d'abord être signé par le professeur"
                            }
                            disabled={isRestricted || (!isValidated && !isAuthorized)}
                            onClick={() => { if (!isRestricted) setUploadPdfContrat(c); }}
                            style={
                              isRestricted ? { opacity: 0.4 }
                                : isAuthorized ? { borderColor: '#86efac', color: '#16a34a', background: '#f0fdf4' }
                                : isValidated  ? { borderColor: '#fed7aa', color: '#ea580c', background: '#fff7ed' }
                                : {}
                            }
                          >
                            <Icon.ShieldCheck />
                          </button>

                          {/* Supports de cours & Monographies */}
                          <button
                            className="ctr-btn-icon"
                            title="Supports de cours & Monographies — voir et gérer les PDFs et monographies"
                            onClick={() => {
                              setSupportContrat(c);
                              setModalOpenKey(k => k + 1);
                            }}
                            style={{ borderColor: '#c7d2fe', color: '#4338ca', background: '#eef2ff' }}
                          >
                            <Icon.BookOpen />
                          </button>

                          {/* Modifier — visible mais désactivé si restreint */}
                          <button
                            className="ctr-btn-icon"
                            title={
                              isRestricted ? "Droit d'accès non requis"
                                : isLocked ? 'Contrat verrouillé — modification impossible'
                                : 'Modifier'
                            }
                            disabled={isLocked || isRestricted}
                            onClick={() => { if (!isRestricted) openEdit(c); }}
                            style={isRestricted ? { opacity: 0.4 } : {}}
                          >
                            <Icon.Edit />
                          </button>

                          {/* Supprimer — visible mais désactivé si restreint */}
                          <button
                            className="ctr-btn-icon"
                            title={
                              isRestricted ? "Droit d'accès non requis"
                                : isLocked ? 'Contrat verrouillé — suppression impossible'
                                : 'Supprimer'
                            }
                            disabled={isLocked || isRestricted}
                            onClick={() => { if (!isLocked && !isRestricted) setDeleteConfirm(c); }}
                            style={
                              isRestricted ? { opacity: 0.4 }
                                : isLocked ? {}
                                : { borderColor: '#fecaca', color: '#dc2626' }
                            }
                          >
                            <Icon.Trash />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals CRUD */}
      {showCreate && (
        <Modal title="Nouveau contrat" subtitle="Renseigner les informations du contrat de prestation" onClose={closeCreate}>
          <ContratFormFields
            form={createForm}
            professors={professors}
            selectedAcademicYear={getSelectedAcademicYear(createForm.academic_year_id)}
            onFieldChange={onFieldChange(setCreateForm)}
            onSubmit={handleCreateSubmit}
            onCancel={closeCreate}
            loading={createLoading}
            error={createError}
            submitLabel="Créer le contrat"
            isEdit={false}
          />
        </Modal>
      )}

      {editingContrat && (
        <Modal title="Modifier le contrat" subtitle={`Contrat N° ${editingContrat.contrat_number || `#${editingContrat.id}`}`} onClose={closeEdit}>
          <ContratFormFields
            form={editForm}
            professors={professors}
            selectedAcademicYear={getSelectedAcademicYear(editForm.academic_year_id)}
            onFieldChange={onFieldChange(setEditForm)}
            onSubmit={handleEditSubmit}
            onCancel={closeEdit}
            loading={editLoading}
            error={editError}
            submitLabel="Enregistrer les modifications"
            isEdit={true}
          />
        </Modal>
      )}

      {/* Modal Upload PDF / Autoriser */}
      {uploadPdfContrat && (
        <UploadPdfModal
          contrat={uploadPdfContrat}
          onClose={() => setUploadPdfContrat(null)}
          onSuccess={(updated) => {
            setUploadPdfContrat(null);
            showSuccess({
              title: 'PDF enregistré',
              message: 'Le PDF du contrat a été mis à jour avec succès.',
              iconBg: '#fff7ed', iconColor: '#ea580c', icon: <Icon.FilePdf />,
            });
            if (!uploadPdfContrat.is_authorized && uploadPdfContrat.is_validated) {
              setAuthorizeConfirm(updated);
            } else {
              reload();
            }
          }}
        />
      )}

      {/* Modal accès refusé — role_id = 3 sur bouton supports */}
      {showAccessDenied && (
        <div className="ctr-modal-backdrop" onClick={() => setShowAccessDenied(false)}>
          <div className="ctr-modal" style={{ width: 'min(90vw, 420px)' }} onClick={e => e.stopPropagation()}>
            <div className="ctr-modal-header">
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Accès refusé</div>
              </div>
              <button className="ctr-modal-close" onClick={() => setShowAccessDenied(false)}>
                <Icon.X />
              </button>
            </div>
            <div className="ctr-modal-body">
              <div className="ctr-confirm-body">
                <div className="ctr-confirm-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', margin: '0 0 8px' }}>
                  Droit d'accès non requis
                </p>
                <p style={{ fontSize: 13.5, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                  Vous n'avez pas les permissions nécessaires pour accéder aux supports de cours.
                </p>
              </div>
            </div>
            <div className="ctr-modal-footer" style={{ justifyContent: 'center' }}>
              <button className="ctr-btn ctr-btn-ghost" onClick={() => setShowAccessDenied(false)} style={{ minWidth: 100 }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Supports de cours (Admin) */}
      {supportContrat && (
        <AdminCourseSupportModal
          key={`support-${supportContrat.id}-${modalOpenKey}`}
          contrat={supportContrat}
          divisionFilter={supportDivisionFilter}
          onClose={() => setSupportContrat(null)}
          onSaved={() => {
            reload(freshList => {
              const fresh = freshList.find(c => c.id === supportContrat.id);
              if (fresh) setSupportContrat(fresh);
            });
          }}
        />
      )}

      {/* Confirm : Supprimer */}
      {deleteConfirm && (
        <ConfirmModal
          title="Supprimer le contrat"
          message={`Le contrat N° ${deleteConfirm.contrat_number} sera définitivement supprimé.`}
          detail="Cette action est irréversible."
          confirmLabel="Supprimer définitivement"
          confirmClass="ctr-btn-danger"
          loading={deleteLoading}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Confirm : Transférer */}
      {transferConfirm && (
        <ConfirmModal
          title="Transférer le contrat"
          message={`Le contrat N° ${transferConfirm.contrat_number} passera au statut « Transféré ».`}
          detail={`Un e-mail de notification sera automatiquement envoyé à ${transferConfirm.professor?.full_name ?? "l'enseignant"} avec un lien pour consulter et valider le contrat.`}
          confirmLabel="Confirmer le transfert"
          confirmClass="ctr-btn-purple"
          iconBg="#faf5ff" iconColor="#7c3aed"
          icon={<Icon.Mail />}
          loading={transferLoading}
          onConfirm={handleTransferConfirm}
          onCancel={() => setTransferConfirm(null)}
        />
      )}

      {/* Confirm : Autoriser */}
      {authorizeConfirm && (
        <ConfirmModal
          title="Autoriser le contrat"
          message={`Confirmez-vous l'autorisation du contrat N° ${authorizeConfirm.contrat_number} ?`}
          detail="Le contrat passera au statut « En cours » et sera définitivement verrouillé. Cette action est irréversible."
          confirmLabel="Autoriser le contrat"
          confirmClass="ctr-btn-success"
          iconBg="#f0fdf4" iconColor="#059669"
          icon={<Icon.ShieldCheck />}
          loading={authorizeLoading}
          onConfirm={handleAuthorizeConfirm}
          onCancel={() => { setAuthorizeConfirm(null); reload(); }}
        />
      )}

      {/* Confirm : Relancer un contrat rejeté */}
      {relaunchConfirm && (
        <ConfirmModal
          title="Relancer le contrat rejeté"
          message={`Remettre le contrat N° ${relaunchConfirm.contrat_number} en statut « En attente » ?`}
          detail={
            relaunchConfirm.rejection_reason
              ? `Motif du rejet : « ${relaunchConfirm.rejection_reason} ». Vous pourrez le modifier puis le retransférer à l'enseignant.`
              : "Vous pourrez modifier le contrat puis le retransférer à l'enseignant."
          }
          confirmLabel="Relancer le contrat"
          confirmClass="ctr-btn-orange"
          iconBg="#fff7ed" iconColor="#ea580c"
          icon={<Icon.Refresh />}
          loading={relaunchLoading}
          onConfirm={handleRelaunchConfirm}
          onCancel={() => setRelaunchConfirm(null)}
        />
      )}

      {/* Success Modal */}
      {successModal && (
        <SuccessModal
          title={successModal.title}
          message={successModal.message}
          detail={successModal.detail}
          iconBg={successModal.iconBg}
          iconColor={successModal.iconColor}
          icon={successModal.icon}
          onClose={() => setSuccessModal(null)}
        />
      )}

      <ToastContainer toasts={toasts} remove={removeToast} />
    </div>
  );
};


export default Contrats;
