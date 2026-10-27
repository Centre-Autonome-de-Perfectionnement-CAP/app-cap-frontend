// src/views/pages/rh/contrats/components/AdminCourseSupportModal.tsx
// Extrait tel quel de Contrats.tsx (aucune modification de logique).
import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { Contrat, ProfessorProgram } from '@/types/rh.types'
import Icon from '../Contrats.icons'
import { formatAmount, normalizeDivision } from '../Contrats.helpers'
import Modal from './Modal'

const AdminCourseSupportModal: React.FC<{
  contrat: Contrat;
  onClose: () => void;
  onSaved: () => void;
  divisionFilter?: string | null;
}> = ({ contrat, onClose, onSaved, divisionFilter = null }) => {

  const contratDiv = normalizeDivision(contrat.division);
  const filterDiv  = normalizeDivision(divisionFilter);
  const divisionMismatch = filterDiv !== null && contratDiv !== null && contratDiv !== filterDiv;
  const programs = contrat.course_element_professors ?? [];

  type SupportEntry = { title: string; file?: string; url?: string };
  type MonoData = {
    number_monographie: string;
    amount_monographie: string;
    saving: boolean;
    saved: boolean;
    error: string | null;
    hasExisting: boolean;      // true si des valeurs existent déjà en BDD
    isEditing: boolean;        // true si l'utilisateur est en train de modifier
  };
  type ProgState = { supports: SupportEntry[]; loading: boolean; error: string | null; mono: MonoData };

  const defaultMono = (existingNumber?: number | null, existingAmount?: number | null): MonoData => {
    const hasNumber = existingNumber !== null && existingNumber !== undefined && existingNumber !== 0;
    const hasAmount = existingAmount !== null && existingAmount !== undefined && existingAmount !== 0;
    const hasValues = hasNumber || hasAmount;

    return {
      number_monographie: hasNumber ? String(existingNumber) : '',
      amount_monographie: hasAmount ? String(existingAmount) : '',
      saving: false,
      saved: false,
      error: null,
      hasExisting: hasValues,
      isEditing: !hasValues, // Si des valeurs existent, on est en lecture seule
    };
  };

  // État principal
  const [progStates, setProgStates] = useState<Record<number, ProgState>>({});
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [newTitle, setNewTitle] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fonction pour charger les supports ET les monographies depuis l'API
  const loadProgramData = useCallback(async (program: ProfessorProgram) => {
    // Initialiser l'état du programme avec les valeurs du contrat (si disponibles)
    const existingNumber = program.number_monographie ?? null;
    const existingAmount = program.amount_monographie ?? null;

    setProgStates(prev => ({
      ...prev,
      [program.id]: {
        supports: [],
        loading: true,
        error: null,
        mono: defaultMono(existingNumber, existingAmount),
      },
    }));

    try {
      const http = (await import('@/services/http.service')).default;

      // Appel API qui retourne : { success, data, number_monographie, amount_monographie }
      const res = await (http as any).get(
        `rh/contrats/${contrat.id}/programs/${program.id}/supports`
      );

      const body = res ?? {};
      const supports: SupportEntry[] = Array.isArray(body.data) ? body.data : [];

      // Récupérer les valeurs de monographie depuis la réponse API
      const nbRaw = body.number_monographie ?? existingNumber ?? null;
      const amtRaw = body.amount_monographie ?? existingAmount ?? null;

      const hasNumber = nbRaw !== null && nbRaw !== undefined && nbRaw !== 0;
      const hasAmount = amtRaw !== null && amtRaw !== undefined && amtRaw !== 0;
      const hasExisting = hasNumber || hasAmount;

      setProgStates(prev => ({
        ...prev,
        [program.id]: {
          supports,
          loading: false,
          error: null,
          mono: {
            number_monographie: hasNumber ? String(nbRaw) : '',
            amount_monographie: hasAmount ? String(amtRaw) : '',
            saving: false,
            saved: false,
            error: null,
            hasExisting: hasExisting,
            isEditing: !hasExisting, // Si valeurs existent, mode lecture seule
          },
        },
      }));
    } catch (err: any) {
      setProgStates(prev => ({
        ...prev,
        [program.id]: {
          supports: [],
          loading: false,
          error: err?.message ?? 'Erreur de chargement',
          mono: defaultMono(program.number_monographie ?? null, program.amount_monographie ?? null),
        },
      }));
    }
  }, [contrat.id]);

  // Charger tous les programmes à l'ouverture
  useEffect(() => {
    setProgStates({});
    setSelectedIdx(0);
    setNewTitle('');
    setNewFile(null);
    setAddError(null);
    setAddSuccess(false);

    programs.forEach(program => loadProgramData(program));
  }, [contrat.id, programs, loadProgramData]);

  // Recharger un programme spécifique
  const reloadProgram = useCallback((program: ProfessorProgram) => {
    loadProgramData(program);
  }, [loadProgramData]);

  const currentProg = programs[selectedIdx];
  const currentState = currentProg ? progStates[currentProg.id] : undefined;
  const currentSupports = currentState?.supports ?? [];
  const isLoading = currentState?.loading ?? false;
  const mono = currentState?.mono ?? defaultMono(null, null);

  const setMono = (key: 'number_monographie' | 'amount_monographie', value: string) => {
    if (!currentProg) return;
    setProgStates(prev => ({
      ...prev,
      [currentProg.id]: {
        ...prev[currentProg.id],
        mono: {
          ...(prev[currentProg.id]?.mono ?? defaultMono(null, null)),
          [key]: value,
          saved: false,
          error: null,
        },
      },
    }));
  };

  // Activer le mode édition (rendre les champs modifiables)
  const enableEditing = () => {
    if (!currentProg) return;
    setProgStates(prev => ({
      ...prev,
      [currentProg.id]: {
        ...prev[currentProg.id],
        mono: {
          ...(prev[currentProg.id]?.mono ?? defaultMono(null, null)),
          isEditing: true,
          error: null,
        },
      },
    }));
  };

  // Annuler l'édition et revenir aux valeurs originales
  const cancelEditing = () => {
    if (!currentProg) return;
    const existingNumber = currentProg.number_monographie ?? null;
    const existingAmount = currentProg.amount_monographie ?? null;
    const hasNumber = existingNumber !== null && existingNumber !== undefined && existingNumber !== 0;
    const hasAmount = existingAmount !== null && existingAmount !== undefined && existingAmount !== 0;

    setProgStates(prev => ({
      ...prev,
      [currentProg.id]: {
        ...prev[currentProg.id],
        mono: {
          ...(prev[currentProg.id]?.mono ?? defaultMono(null, null)),
          number_monographie: hasNumber ? String(existingNumber) : '',
          amount_monographie: hasAmount ? String(existingAmount) : '',
          isEditing: false,
          saved: false,
          error: null,
        },
      },
    }));
  };

  // Sauvegarder la monographie
  const handleSaveMono = async () => {
    if (!currentProg) return;

    const nb = parseInt(mono.number_monographie, 10);
    const amt = parseFloat(mono.amount_monographie);

    if (isNaN(nb) || nb < 0) {
      setMono('number_monographie', mono.number_monographie);
      setProgStates(prev => ({
        ...prev,
        [currentProg.id]: {
          ...prev[currentProg.id],
          mono: { ...prev[currentProg.id]!.mono, error: 'Nombre de monographies invalide.' },
        },
      }));
      return;
    }
    if (isNaN(amt) || amt < 0) {
      setProgStates(prev => ({
        ...prev,
        [currentProg.id]: {
          ...prev[currentProg.id],
          mono: { ...prev[currentProg.id]!.mono, error: 'Montant invalide.' },
        },
      }));
      return;
    }

    setProgStates(prev => ({
      ...prev,
      [currentProg.id]: {
        ...prev[currentProg.id],
        mono: { ...prev[currentProg.id]!.mono, saving: true, error: null, saved: false },
      },
    }));

    try {
      const http = (await import('@/services/http.service')).default;
      await (http as any).put(
        `rh/contrats/${contrat.id}/programs/${currentProg.id}/monographie`,
        { number_monographie: nb, amount_monographie: amt }
      );

      // Mettre à jour le programme courant avec les nouvelles valeurs
      const updatedProgram = { ...currentProg, number_monographie: nb, amount_monographie: amt };

      setProgStates(prev => ({
        ...prev,
        [currentProg.id]: {
          ...prev[currentProg.id],
          mono: {
            ...prev[currentProg.id]!.mono,
            saving: false,
            saved: true,
            hasExisting: true,
            isEditing: false, // Retour en mode lecture seule après sauvegarde
            error: null,
          },
        },
      }));

      // Mettre à jour le contrat parent
      onSaved();

      setTimeout(() => {
        setProgStates(prev => ({
          ...prev,
          [currentProg.id]: {
            ...prev[currentProg.id],
            mono: { ...prev[currentProg.id]!.mono, saved: false },
          },
        }));
      }, 3000);
    } catch (err: any) {
      setProgStates(prev => ({
        ...prev,
        [currentProg.id]: {
          ...prev[currentProg.id],
          mono: {
            ...prev[currentProg.id]!.mono,
            saving: false,
            error: err?.response?.data?.message ?? err.message ?? 'Erreur lors de la sauvegarde.',
          },
        },
      }));
    }
  };

  // Ajouter un support
  const handleAdd = async () => {
    if (!currentProg) return;
    if (!newTitle.trim()) { setAddError('Veuillez saisir un titre.'); return; }
    if (!newFile) { setAddError('Veuillez sélectionner un fichier PDF.'); return; }

    setAddError(null);
    setAdding(true);
    setAddSuccess(false);

    try {
      const fd = new FormData();
      fd.append('title', newTitle.trim());
      fd.append('pdf_file', newFile);

      const http = (await import('@/services/http.service')).default;
      await http.post(`rh/contrats/${contrat.id}/programs/${currentProg.id}/supports`, fd);

      setNewTitle('');
      setNewFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 3500);

      await reloadProgram(currentProg);
    } catch (err: any) {
      setAddError(err?.message ?? "Erreur lors de l'ajout.");
    } finally {
      setAdding(false);
    }
  };

  // Supprimer un support
  const handleDelete = async (idx: number) => {
    if (!currentProg) return;
    setDeleting(idx);
    try {
      const http = (await import('@/services/http.service')).default;
      await http.delete(`rh/contrats/${contrat.id}/programs/${currentProg.id}/supports/${idx}`);
      await reloadProgram(currentProg);
    } catch (err: any) {
      alert('Erreur de suppression : ' + (err?.message ?? ''));
    } finally {
      setDeleting(null);
    }
  };

  const progLabel = (p: ProfessorProgram) =>
    `${p.course_element?.name ?? p.label ?? '—'} `;

  // Icônes
  const IcoPdf = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><path d="M9 11h1.5a1.5 1.5 0 0 1 0 3H9v-3z"/></svg>;
  const IcoLink = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
  const IcoUp = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
  const IcoSave = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
  const IcoCoin = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/><line x1="9" y1="12" x2="15" y2="12"/></svg>;
  const IcoHash = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>;
  const IcoEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
  const IcoLock = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;

  const SectionHead = ({ icon, label, count }: { icon: React.ReactNode; label: string; count?: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{label}</span>
      {count !== undefined && (
        <span style={{ marginLeft: 2, background: '#e2e8f0', color: '#64748b', borderRadius: 999, padding: '1px 9px', fontSize: 11.5, fontWeight: 700 }}>
          {count}
        </span>
      )}
    </div>
  );

  const Divider = () => <div style={{ height: 1, background: '#f1f5f9', margin: '20px 0' }} />;

  // Blocage si division ne correspond pas
  if (divisionMismatch) {
    const divLabel = filterDiv === 'RD-FC' ? 'Formation Continue (RD-FC)' : 'Formation à Distance (RD-FAD)';
    return (
      <Modal
        title="Supports de cours"
        subtitle={`Contrat N° ${contrat.contrat_number} - ${contrat.professor?.full_name ?? ''}`}
        onClose={onClose}
        wide
        footer={<button className="ctr-btn ctr-btn-ghost" onClick={onClose}>Fermer</button>}
      >
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#dc2626' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <p style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', margin: '0 0 8px' }}>Accès restreint</p>
          <p style={{ fontSize: 14, color: '#374151', margin: '0 0 6px' }}>
            Vous n'avez accès qu'aux supports de la division <strong>{divLabel}</strong>.
          </p>
          <p style={{ fontSize: 12.5, color: '#9ca3af', margin: 0 }}>
            Ce contrat appartient à la division <strong>{contrat.division ?? 'non définie'}</strong>.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Supports de cours"
      subtitle={`Contrat N° ${contrat.contrat_number} - ${contrat.professor?.full_name ?? ''}`}
      onClose={onClose}
      wide
      footer={<button className="ctr-btn ctr-btn-ghost" onClick={onClose}>Fermer</button>}
    >
      {programs.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#94a3b8' }}>
            <Icon.FileText />
          </div>
          Aucun programme associé à ce contrat.
        </div>
      ) : (
        <>
          {/* Sélecteur de programme */}
          <div style={{ marginBottom: 20 }}>
            <label className="ctr-label">Programme sélectionné</label>
            <select
              className="ctr-input ctr-select"
              value={selectedIdx}
              onChange={e => {
                setSelectedIdx(Number(e.target.value));
                setNewTitle('');
                setNewFile(null);
                setAddError(null);
                setAddSuccess(false);
              }}
            >
              {programs.map((p, idx) => (
                <option key={p.id} value={idx}>{progLabel(p)}</option>
              ))}
            </select>
            {currentProg && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {currentProg.course_element?.teaching_unit?.name && (
                  <span style={{ fontSize: 11.5, fontWeight: 600, background: '#eff6ff', color: '#1d4ed8', padding: '2px 9px', borderRadius: 999, border: '1px solid #bfdbfe' }}>
                    UE : {currentProg.course_element.teaching_unit.name}
                  </span>
                )}
                {currentProg.class_group?.name && (
                  <span style={{ fontSize: 11.5, fontWeight: 600, background: '#f0fdf4', color: '#166534', padding: '2px 9px', borderRadius: 999, border: '1px solid #bbf7d0' }}>
                    {currentProg.class_group.name}
                  </span>
                )}
                <span style={{ fontSize: 11.5, fontWeight: 600, background: '#f5f3ff', color: '#5b21b6', padding: '2px 9px', borderRadius: 999, border: '1px solid #ddd6fe' }}>
                  {currentSupports.length} support{currentSupports.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          <Divider />

          {/* Layout 2 colonnes : supports + upload */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 4 }}>

            {/* Colonne gauche : supports existants */}
            <div>
              <SectionHead icon={<IcoPdf />} label="Supports existants" count={isLoading ? undefined : currentSupports.length} />

              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9ca3af', fontSize: 13, padding: '12px 0' }}>
                  <Icon.Loader /> Chargement…
                </div>
              ) : currentState?.error ? (
                <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12.5 }}>
                  {currentState.error}
                </div>
              ) : currentSupports.length === 0 ? (
                <div style={{ border: '1.5px dashed #e2e8f0', borderRadius: 10, padding: '28px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#cbd5e1' }}>
                    <IcoPdf />
                  </div>
                  Aucun support uploadé
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {currentSupports.map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: '1.5px solid #f1f5f9', background: '#fff' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', flexShrink: 0 }}>
                        <IcoPdf />
                      </div>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.title}
                      </span>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {/* CORRECTIF : on passe par la route API sécurisée au lieu
                            de l'URL directe /storage/supports/... qui retournait
                            une page blanche (PDF vide ou headers manquants). */}
                        <button
                          className="ctr-btn-icon"
                          style={{ width: 28, height: 28, borderColor: '#bfdbfe', color: '#2563eb', background: '#eff6ff' }}
                          title="Ouvrir"
                          onClick={() => {
                            const apiUrl = import.meta.env.VITE_API_URL || '';
                            const token  = localStorage.getItem('token') ?? '';
                            const url = `${apiUrl}/api/rh/contrats/${contrat.id}/programs/${currentProg?.id}/supports/${idx}/stream`;
                            fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' } })
                              .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); })
                              .then(blob => {
                                const blobUrl = URL.createObjectURL(blob);
                                window.open(blobUrl, '_blank');
                                setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
                              })
                              .catch(() => alert('Impossible d\'ouvrir le support.'));
                          }}
                        >
                          <IcoLink />
                        </button>
                        <button className="ctr-btn-icon"
                          style={{ width: 28, height: 28, borderColor: '#fecaca', color: '#dc2626' }}
                          disabled={deleting === idx}
                          onClick={() => handleDelete(idx)}
                          title="Supprimer">
                          {deleting === idx ? <Icon.Loader /> : <Icon.Trash />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Colonne droite : ajouter un support */}
            <div>
              <SectionHead icon={<IcoUp />} label="Ajouter un support" />

              {addSuccess && (
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: 12.5, fontWeight: 600 }}>
                  <Icon.Check /> Support ajouté avec succès
                </div>
              )}
              {addError && (
                <div style={{ marginBottom: 12, padding: '9px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12.5 }}>
                  {addError}
                </div>
              )}

              <div style={{ marginBottom: 10 }}>
                <label className="ctr-label">Titre du support <span style={{ color: '#dc2626' }}>*</span></label>
                <input className="ctr-input" placeholder="Exemple : Cours Chapitre 1 - Introduction"
                  value={newTitle} onChange={e => setNewTitle(e.target.value)} disabled={adding} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="ctr-label">Fichier PDF <span style={{ color: '#dc2626' }}>*</span></label>
                <div
                  style={{ border: `1.5px dashed ${newFile ? '#059669' : '#d1d5db'}`, borderRadius: 9, padding: '16px', textAlign: 'center', cursor: 'pointer', background: newFile ? '#f0fdf4' : '#fafafa', transition: 'all .18s' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {newFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                        <IcoPdf />
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#065f46' }}>{newFile.name}</span>
                      <span style={{ fontSize: 11.5, color: '#6b7280' }}>{(newFile.size / 1024).toFixed(1)} Ko - Cliquer pour changer</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <IcoUp />
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>Cliquer pour sélectionner</span>
                      <span style={{ fontSize: 11.5, color: '#9ca3af' }}>PDF uniquement</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: 'none' }}
                  onChange={e => setNewFile(e.target.files?.[0] ?? null)} disabled={adding} />
              </div>

              <button className="ctr-btn ctr-btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleAdd} disabled={adding || !newTitle.trim() || !newFile}>
                {adding ? <><Icon.Loader /> Envoi en cours…</> : <><Icon.Plus /> Ajouter le support</>}
              </button>
            </div>
          </div>

          <Divider />

          {/* Section Monographie */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>

            {/* En-tête avec badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <SectionHead icon={<IcoCoin />} label="Monographie - Programme courant" />
              {mono.hasExisting && !mono.isEditing && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: '#fef9c3', color: '#713f12', border: '1px solid #fde68a' }}>
                  <IcoLock /> Déjà définie
                </span>
              )}
            </div>

            <p style={{ fontSize: 12.5, color: '#64748b', marginTop: -6, marginBottom: 16 }}>
              Nombre de monographies et montant pour le programme sélectionné. Stockés par programme dans le contrat.
            </p>

            {/* Bandeau d'info si des valeurs existent et qu'on est en lecture seule */}
            {mono.hasExisting && !mono.isEditing && (
              <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 9, background: '#fffbeb', border: '1.5px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#78350f', fontWeight: 500 }}>
                  <IcoLock />
                  Monographie déjà définie - souhaitez-vous modifier ces valeurs ?
                </div>
                <button
                  className="ctr-btn"
                  style={{ height: 32, padding: '0 14px', fontSize: 12.5, background: '#d97706', color: '#fff', flexShrink: 0 }}
                  onClick={enableEditing}
                >
                  <IcoEdit /> Modifier
                </button>
              </div>
            )}

            {/* Affichage des valeurs si elles existent et qu'on est en lecture seule */}
            {mono.hasExisting && !mono.isEditing && (
              <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 9, background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#166534' }}>Nombre de monographies actuel :</span>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#065f46', margin: '4px 0 0' }}>{mono.number_monographie || '—'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#166534' }}>Montant monographie actuel :</span>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#065f46', margin: '4px 0 0' }}>{mono.amount_monographie ? formatAmount(parseFloat(mono.amount_monographie)) : '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Champs de saisie - visibles uniquement si pas de valeurs existantes OU en mode édition */}
            {(!mono.hasExisting || mono.isEditing) && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label className="ctr-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <IcoHash /> Nombre de monographies
                    </label>
                    <input
                      className="ctr-input"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Exemple : 3"
                      value={mono.number_monographie}
                      onChange={e => setMono('number_monographie', e.target.value)}
                      disabled={mono.saving}
                      style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label className="ctr-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <IcoCoin /> Montant monographie (FCFA)
                    </label>
                    <input
                      className="ctr-input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Exemple : 15000"
                      value={mono.amount_monographie}
                      onChange={e => setMono('amount_monographie', e.target.value)}
                      disabled={mono.saving}
                      style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }}
                    />
                  </div>
                </div>

                {mono.saved && (
                  <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: 12.5, fontWeight: 600 }}>
                    <Icon.Check /> Monographie enregistrée avec succès
                  </div>
                )}
                {mono.error && (
                  <div style={{ marginBottom: 12, padding: '9px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12.5 }}>
                    {mono.error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  {mono.hasExisting && mono.isEditing && (
                    <button className="ctr-btn ctr-btn-ghost" onClick={cancelEditing} disabled={mono.saving}>
                      Annuler
                    </button>
                  )}
                  <button
                    className="ctr-btn ctr-btn-primary"
                    onClick={handleSaveMono}
                    disabled={mono.saving || mono.number_monographie === '' || mono.amount_monographie === ''}
                  >
                    {mono.saving
                      ? <><Icon.Loader /> Enregistrement…</>
                      : <><IcoSave /> Enregistrer la monographie</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </Modal>
  );
};

export default AdminCourseSupportModal
