import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getAssetUrl } from '@/utils/assets';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Programme {
  id: number;
  course_element?: { id: number; name: string; code: string; teaching_unit?: { name: string } };
  class_group?: { id: number; name: string };
}

interface ContratData {
  id: number;
  uuid: string;
  contrat_number: string;
  division?: string;
  regroupement?: string;
  start_date: string;
  end_date?: string;
  amount: number;
  status: string;
  notes?: string;
  professor?: {
    id: number; full_name: string; nationality?: string; profession?: string;
    city?: string; district?: string; plot_number?: string; house_number?: string;
    ifu_number?: string; rib_number?: string; bank?: string; email?: string; phone?: string;
  };
  academicYear?: { id: number; academic_year: string };
  cycle?: { id: number; name: string };
  course_element_professors?: Programme[];
}

type BtnState = 'idle' | 'loading' | 'done' | 'error';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d?: string) => {
  if (!d) return '—';
  const [y, m, day] = d.substring(0, 10).split('-');
  return `${day}/${m}/${y}`;
};
const money = (a: number) => Number(a).toLocaleString('fr-FR') + ' FCFA';
const getToken = () =>
  localStorage.getItem('token') ?? localStorage.getItem('auth_token') ?? localStorage.getItem('sanctum_token') ?? '';

const STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: 'En attente',  color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  transfered:{ label: 'Transféré',   color: '#3b0764', bg: '#faf5ff', border: '#ddd6fe' },
  signed:    { label: '✅ Validé',    color: '#065f46', bg: '#f0fdf4', border: '#a7f3d0' },
  cancelled: { label: '❌ Rejeté',   color: '#7f1d1d', bg: '#fef2f2', border: '#fca5a5' },
  ongoing:   { label: 'En cours',    color: '#1e3a8a', bg: '#eff6ff', border: '#bfdbfe' },
  completed: { label: 'Terminé',     color: '#374151', bg: '#f9fafb', border: '#e5e7eb' },
};

const EPAC_LOGO = getAssetUrl('images/epac.png');
const CAP_LOGO  = getAssetUrl('images/cap-1.png');

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ size = 20, color = '#6366f1' }: { size?: number; color?: string }) => (
  <span style={{ display: 'inline-block', width: size, height: size, border: `3px solid ${color}22`, borderTop: `3px solid ${color}`, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const ProfessorContratView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [contrat, setContrat]     = useState<ContratData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [fetchErr, setFetchErr]   = useState('');
  const [validateSt, setValidateSt] = useState<BtnState>('idle');
  const [rejectSt, setRejectSt]   = useState<BtnState>('idle');
  const [isValidated, setIsValidated] = useState(false);
  const [banner, setBanner]       = useState<{ msg: string; type: 'ok' | 'err' | 'info' } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // ── Auto-action from email link (?action=validate / ?action=reject) ─────────
  const autoAction = searchParams.get('action');

  // ── Fetch contrat by UUID token ──────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setFetchErr('Lien invalide.'); setLoading(false); return; }
    const tok = getToken();
    if (!tok) {
      // Not authenticated → redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?redirect=${returnUrl}`, { replace: true });
      return;
    }
    fetch(`/api/rh/contrats/by-token/${token}`, {
      headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${tok}` },
    })
      .then(async r => {
        if (r.status === 401) {
          const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
          navigate(`/login?redirect=${returnUrl}`, { replace: true });
          return;
        }
        if (!r.ok) throw new Error('Contrat introuvable ou lien expiré.');
        const data = await r.json();
        const c: ContratData = data.data ?? data;
        setContrat(c);
        const alreadyValidated = c.status === 'signed';
        setIsValidated(alreadyValidated);
        if (alreadyValidated) setBanner({ msg: 'Ce contrat a déjà été validé. Vous pouvez télécharger le PDF.', type: 'ok' });
        if (c.status === 'cancelled') setBanner({ msg: 'Ce contrat a été rejeté.', type: 'err' });
      })
      .catch(e => setFetchErr(e.message))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  // ── Auto-trigger action from email link ──────────────────────────────────────
  useEffect(() => {
    if (!contrat || !autoAction) return;
    if (contrat.status !== 'pending' && contrat.status !== 'transfered') return;
    if (autoAction === 'validate') handleValidate();
    if (autoAction === 'reject')   handleReject();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contrat, autoAction]);

  // ── API action helper ────────────────────────────────────────────────────────
  const callAction = async (action: 'validate' | 'reject') => {
    const tok = getToken();
    const r = await fetch(`/api/rh/contrats/by-token/${token}/${action}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
    });
    const data = await r.json();
    if (!r.ok || !data.success) throw new Error(data.message ?? 'Erreur serveur.');
    return data;
  };

  const handleValidate = async () => {
    if (!contrat || validateSt === 'loading') return;
    setValidateSt('loading'); setBanner(null);
    try {
      await callAction('validate');
      setIsValidated(true);
      setValidateSt('done');
      setContrat(p => p ? { ...p, status: 'signed' } : p);
      setBanner({ msg: '✅ Contrat validé avec succès ! Vous pouvez maintenant télécharger le PDF.', type: 'ok' });
    } catch (e: any) {
      setValidateSt('error');
      setBanner({ msg: '❌ ' + (e.message ?? 'Erreur lors de la validation.'), type: 'err' });
    }
  };

  const handleReject = async () => {
    if (!contrat || rejectSt === 'loading') return;
    setRejectSt('loading'); setBanner(null);
    try {
      await callAction('reject');
      setRejectSt('done');
      setContrat(p => p ? { ...p, status: 'cancelled' } : p);
      setBanner({ msg: 'Contrat rejeté. Votre réponse a bien été enregistrée.', type: 'info' });
    } catch (e: any) {
      setRejectSt('error');
      setBanner({ msg: '❌ ' + (e.message ?? 'Erreur lors du rejet.'), type: 'err' });
    }
  };

  // ── Download PDF ─────────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!isValidated || !contrat) return;
    const html = printRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title></title><style>
      @page{size:A4;margin:1.8cm 2cm 2cm;}
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Times New Roman',serif;font-size:10.5pt;color:#000;line-height:1.55;}
      p{margin:3px 0 7px;text-align:justify;}
      table{width:100%;border-collapse:collapse;margin:8px 0;font-size:9.5pt;}
      th{border:1px solid #999;padding:5px 6px;background:#efefef;font-weight:bold;text-align:center;}
      td{border:1px solid #999;padding:4px 6px;}
      ul{margin:4px 0;padding-left:22px;}
      @media print{html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
    </style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  // ── States ───────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={S.center}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <Spinner size={40} /><p style={{ marginTop: 16, fontSize: 14 }}>Chargement du contrat…</p>
      </div>
    </div>
  );

  if (fetchErr) return (
    <div style={S.center}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '48px 40px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,.1)', maxWidth: 420 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ marginBottom: 12, color: '#1a202c', fontSize: 20 }}>Lien invalide</h2>
        <p style={{ color: '#64748b', marginBottom: 28, fontSize: 14, lineHeight: 1.6 }}>{fetchErr}</p>
        <button onClick={() => navigate('/login')} style={S.btnPrimary}>Se connecter</button>
      </div>
    </div>
  );

  if (!contrat) return null;

  const st = STATUS[contrat.status] ?? STATUS.pending;
  const prof = contrat.professor;
  const reg = contrat.regroupement === '1' ? 'I' : contrat.regroupement === '2' ? 'II' : '—';
  const programmes = contrat.course_element_professors ?? [];
  const daysCount = (() => {
    if (!contrat.start_date || !contrat.end_date) return '…';
    return Math.max(1, Math.round((new Date(contrat.end_date).getTime() - new Date(contrat.start_date).getTime()) / 86400000));
  })();
  const isActionDone = ['signed', 'cancelled'].includes(contrat.status);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Top bar ── */}
      <div style={S.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={CAP_LOGO} alt="CAP" style={{ height: 38, objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Centre Autonome de Perfectionnement</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Contrat de Prestation d'Enseignement N° {contrat.contrat_number}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/professor/contrats')} style={S.topBtn}>📄 Mes contrats</button>
          <button onClick={() => navigate('/professor/dashboard')} style={S.topBtn}>🏠 Tableau de bord</button>
        </div>
      </div>

      {/* ── Action banner ── */}
      <div style={S.actionBar}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <div>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.8px' }}>Statut</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 999, padding: '4px 14px', fontSize: 12.5, fontWeight: 700 }}>{st.label}</span>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>Contrat N° {contrat.contrat_number}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Validate */}
          <button
            onClick={handleValidate}
            disabled={isActionDone || validateSt === 'loading'}
            style={{
              ...S.actionBtn,
              background: isActionDone ? '#e2e8f0' : 'linear-gradient(135deg,#059669,#10b981)',
              color: isActionDone ? '#9ca3af' : '#fff',
              cursor: isActionDone ? 'not-allowed' : 'pointer',
              boxShadow: isActionDone ? 'none' : '0 4px 14px rgba(5,150,105,.3)',
            }}
          >
            {validateSt === 'loading' ? <><Spinner size={14} color="#fff" /> Validation…</> : '✅ Valider'}
          </button>

          {/* Reject */}
          <button
            onClick={handleReject}
            disabled={isActionDone || rejectSt === 'loading'}
            style={{
              ...S.actionBtn,
              background: isActionDone ? '#e2e8f0' : 'linear-gradient(135deg,#dc2626,#ef4444)',
              color: isActionDone ? '#9ca3af' : '#fff',
              cursor: isActionDone ? 'not-allowed' : 'pointer',
              boxShadow: isActionDone ? 'none' : '0 4px 14px rgba(220,38,38,.3)',
            }}
          >
            {rejectSt === 'loading' ? <><Spinner size={14} color="#fff" /> Traitement…</> : '❌ Rejeter'}
          </button>

          {/* Download PDF — unlocked only after validation */}
          <button
            onClick={handleDownload}
            disabled={!isValidated}
            title={isValidated ? 'Télécharger le contrat en PDF' : 'Validez d\'abord le contrat pour activer le téléchargement'}
            style={{
              ...S.actionBtn,
              background: isValidated ? 'linear-gradient(135deg,#1e1b4b,#312e81)' : '#f1f5f9',
              color: isValidated ? '#fff' : '#9ca3af',
              border: isValidated ? 'none' : '1.5px dashed #cbd5e0',
              cursor: isValidated ? 'pointer' : 'not-allowed',
              boxShadow: isValidated ? '0 4px 14px rgba(49,46,129,.3)' : 'none',
              position: 'relative',
            }}
          >
            ⬇️ Télécharger PDF
            {!isValidated && (
              <span style={{ display: 'block', fontSize: 10, fontWeight: 400, color: '#94a3b8', marginTop: 1 }}>après validation</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Banner message ── */}
      {banner && (
        <div style={{
          animation: 'fadeIn .25s ease',
          padding: '14px 32px',
          fontSize: 14, fontWeight: 600,
          background: banner.type === 'ok' ? '#f0fdf4' : banner.type === 'err' ? '#fef2f2' : '#eff6ff',
          borderTop: `3px solid ${banner.type === 'ok' ? '#10b981' : banner.type === 'err' ? '#ef4444' : '#6366f1'}`,
          color: banner.type === 'ok' ? '#065f46' : banner.type === 'err' ? '#7f1d1d' : '#1e3a8a',
        }}>
          {banner.msg}
        </div>
      )}

      {/* ── Contract document ── */}
      <div style={{ padding: '28px 20px', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 24px rgba(0,0,0,.08)', padding: '32px 40px 40px' }}>
          <div ref={printRef} style={{ fontFamily: 'Times New Roman, serif', fontSize: '10.5pt', lineHeight: 1.55, color: '#000' }}>

            {/* ── Doc header ── */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #000' }}>
              <div style={{ width: 74, flexShrink: 0 }}>
                <img src={EPAC_LOGO} alt="EPAC" style={{ width: 72, height: 72, objectFit: 'contain', display: 'block' }} />
              </div>
              <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase' as const, lineHeight: 1.7 }}>
                <div>UNIVERSITE D'ABOMEY-CALAVI</div>
                <div>ECOLE POLYTECHNIQUE D'ABOMEY –CALAVI</div>
                <div>CENTRE AUTONOME DE PERFECTIONNEMENT</div>
                <div style={{ letterSpacing: '5px', fontWeight: 'normal', fontSize: '9.5pt', marginTop: 2 }}>………………………………</div>
              </div>
              <div style={{ width: 74, flexShrink: 0 }}>
                <img src={CAP_LOGO} alt="CAP" style={{ width: 72, height: 72, objectFit: 'contain', display: 'block', marginLeft: 'auto' }} />
              </div>
            </div>

            {/* ── Title ── */}
            <div style={{ textAlign: 'center', margin: '10px 0 4px' }}>
              <span style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase' as const }}>
                (Regroupement {reg} — Cycle : {contrat.cycle?.name ?? '—'}) CONTRAT DE PRESTATION D'ENSEIGNEMENT
              </span>
            </div>

            {/* ── Ref ── */}
            <p style={{ textAlign: 'center', fontStyle: 'italic', margin: '6px 0 18px' }}>
              <strong>N° {contrat.contrat_number} /UAC/ EPAC/CAP/{contrat.division ?? '—'}/</strong> du {fmt(contrat.start_date)}
            </p>

            {/* ── Parties ── */}
            <p style={{ marginBottom: 10 }}><strong>Entre :</strong></p>
            <p style={{ marginBottom: 10, textAlign: 'justify' }}>
              Le Centre Autonome de Perfectionnement de l'École Polytechnique d'Abomey-Calavi de l'Université d'Abomey-Calavi,
              Représenté par son Chef, Monsieur <strong>Fidèle Paul TCHOBO</strong>, Tél : (229) 01 99 54 62 67,{' '}
              <strong>E-mail professionnel</strong> : <strong>contact@cap-epac.online</strong>, ci-après dénommé <strong>CAP</strong> d'une part,
            </p>
            <p><strong>Et</strong></p>
            <p style={{ marginBottom: 4 }}><strong>Monsieur / Madame :</strong> <strong>{prof?.full_name ?? '…………………………………………'}</strong></p>
            <p style={{ marginBottom: 4 }}><strong>Nationalité :</strong> <strong>{prof?.nationality ?? '…………………………………'}</strong></p>
            <p style={{ marginBottom: 4 }}><strong>Profession :</strong> <strong>{prof?.profession ?? '……………………………………'}</strong></p>
            <p style={{ marginBottom: 4 }}><strong>Domicilié(e) à :</strong> <strong>{prof?.city ?? '……………'}</strong> / Parcelle <strong>{prof?.plot_number ?? '…………'}</strong>, Maison : <strong>{prof?.house_number ?? '…………'}</strong></p>
            <p style={{ marginBottom: 4 }}><strong>IFU :</strong> <strong>{prof?.ifu_number ?? '…………………………………'}</strong></p>
            <p style={{ marginBottom: 4 }}><strong>RIB :</strong> N° <strong>[{prof?.rib_number ?? 'Code banque – Code guichet – N° compte – Clé RIB'}]</strong> / <strong>Banque :</strong> <strong>{prof?.bank ?? '…………'}</strong></p>
            <p style={{ marginBottom: 10 }}><strong>Adresse :</strong> {[prof?.city, prof?.district].filter(Boolean).join(', ') || '…………………'} / <strong>Email :</strong> {prof?.email ?? '……………'} / <strong>Tél. :</strong> <strong>{prof?.phone ?? '……………'}</strong></p>
            <p style={{ marginBottom: 10 }}>ci-après dénommé « <strong>L'ENSEIGNANT PRESTATAIRE</strong> » d'autre part.</p>
            <p style={{ marginBottom: 16 }}>Les parties au présent contrat ont convenu de ce qui suit :</p>

            {/* Art. 1 */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 }}>1. Objet du contrat</p>
              <p style={{ marginLeft: 20, textAlign: 'justify' }}>Le présent contrat a pour objet la fourniture de prestations d'enseignement au CAP dans les conditions de délai, normes académiques et de qualité conformément aux clauses et conditions ci-après énoncées.</p>
            </div>

            {/* Art. 2 */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 }}>2. Nature des prestations</p>
              <p style={{ marginLeft: 20 }}>Le Centre retient par la présente les prestations de l'enseignant pour l'exécution des cours de :</p>
              {programmes.length > 0 ? (
                <ul style={{ marginLeft: 20 }}>
                  {programmes.map(p => (
                    <li key={p.id}><strong>({p.course_element?.code ?? '—'})</strong> : {p.course_element?.name ?? '—'}{p.class_group ? ` en ${p.class_group.name}` : ''}</li>
                  ))}
                </ul>
              ) : <p style={{ marginLeft: 20, fontStyle: 'italic', color: '#666' }}>Aucun programme associé.</p>}
              <p style={{ marginLeft: 20, fontStyle: 'italic' }}>conformément aux exigences énumérées dans le cahier de charges joint au présent contrat.</p>
            </div>

            {/* Art. 3 */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 }}>3. Date de démarrage et calendrier</p>
              <p style={{ marginLeft: 20 }}>La durée de la prestation est de <strong>{daysCount}</strong> jours ouvrables à partir du <strong>{fmt(contrat.start_date)}</strong>.</p>
              {programmes.length > 0 && (
                <table style={{ marginTop: 8 }}>
                  <thead>
                    <tr>
                      {['Département', "Année d'étude", 'ECUE¹', "Nbre d'heures", 'Date de démarrage', 'Date de fin'].map(h => (
                        <th key={h} style={{ border: '1px solid #999', padding: '5px 6px', background: '#efefef', fontWeight: 'bold', textAlign: 'center' as const }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {programmes.map((p, i) => (
                      <tr key={p.id}>
                        {[
                          p.course_element?.teaching_unit?.name ?? '—',
                          p.class_group?.name ?? '—',
                          p.course_element?.name ?? '—',
                          '—',
                          fmt(contrat.start_date),
                          fmt(contrat.end_date),
                        ].map((val, j) => (
                          <td key={j} style={{ border: '1px solid #999', padding: '4px 6px', background: i % 2 === 1 ? '#f8f8f8' : undefined, textAlign: j === 3 ? 'center' as const : undefined }}>{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Art. 4 */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 }}>4- Temps de présence</p>
              <p style={{ marginLeft: 20, textAlign: 'justify' }}>
                Dans l'exécution du présent contrat, « L'ENSEIGNANT PRESTATAIRE », <strong>{prof?.full_name ?? '…'}</strong>, assurera également la surveillance des évaluations.
                Conformément à l'arrêté N°0388/MESRS/DC/SGM/DPAF/DGES/CJ/SA/05 du 03/08/2022 :
              </p>
              <ul style={{ marginLeft: 20 }}>
                <li>1h de Cours Théorique = 1h30 de Travaux Dirigés ;</li>
                <li>1h de Cours Théorique = 2h de Travaux Pratiques ;</li>
                <li>1h de Cours Théorique = 5h d'ateliers / sorties pédagogiques / Stage</li>
              </ul>
            </div>

            {/* Art. 5 */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 }}>5- Termes de paiement et prélèvements</p>
              <p style={{ marginLeft: 20, textAlign: 'justify' }}>
                Les honoraires sont de <strong>{money(contrat.amount)}</strong> brut par heure exécutée, par virement bancaire après prélèvement de l'AIB.
              </p>
            </div>

            {/* Art. 6-8 */}
            {[
              { n: '6.', t: 'Normes de Performance', body: "L'enseignant prestataire s'engage à fournir les prestations conformément aux normes professionnelles, d'éthique et déontologiques les plus exigeantes." },
              { n: '7.', t: 'Droit de propriété, de devoir de réserve et de non-concurrence', body: "Pendant la durée d'exécution du présent contrat et les cinq années suivant son expiration, l'enseignant prestataire ne divulguera aucune information exclusive ou confidentielle concernant la prestation, le présent contrat, les affaires ou les documents du CAP." },
              { n: '8.', t: 'Règlement des litiges', body: "Pour tout ce qui n'est pas prévu au présent contrat, les parties se référeront aux lois béninoises en la matière. Tout litige sera soumis aux juridictions compétentes, s'il n'est pas réglé à l'amiable." },
            ].map(a => (
              <div key={a.n} style={{ marginBottom: 12 }}>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 }}>{a.n} {a.t}</p>
                <p style={{ marginLeft: 20, textAlign: 'justify' }}>{a.body}</p>
              </div>
            ))}

            <p style={{ marginBottom: 28, marginTop: 16 }}>
              Fait en Trois (03) copies originales à l'Université d'Abomey-Calavi, le <strong>{fmt(contrat.start_date)}</strong>
            </p>

            {/* ── Signatures ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, alignItems: 'flex-start' }}>
              <div style={{ width: '40%', textAlign: 'center' }}>
                <p style={{ fontStyle: 'italic', fontSize: '10.5pt', margin: '0 0 48px' }}>L'enseignant (e) prestataire,</p>
                <div style={{ borderBottom: '1px dotted #555', width: '80%', margin: '0 auto 6px' }} />
                <p style={{ fontWeight: 'bold', margin: 0 }}>{prof?.full_name ?? '……………………………'}</p>
              </div>
              <div style={{ width: '34%', textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 1px' }}>Pour le CAP,</p>
                <p style={{ fontStyle: 'italic', fontSize: '10pt', margin: '0 0 48px' }}>Le Chef,</p>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: '0 0 1px' }}>Fidèle Paul TCHOBO</p>
                <p style={{ fontSize: '9.5pt', margin: 0 }}>Professeur Titulaire de Chimie Alimentaire</p>
                <p style={{ fontSize: '9.5pt', margin: 0 }}><u>et</u> Chimie Analytique</p>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 28, width: '38%', marginLeft: 'auto', marginRight: 'auto' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 48px' }}>Le Directeur</p>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: '0 0 1px' }}>Guy Alain ALITONOU</p>
              <p style={{ fontSize: '9.5pt', margin: 0 }}>Professeur Titulaire de Chimie organique</p>
              <p style={{ fontSize: '9.5pt', margin: 0 }}>et chimie des substances naturelles</p>
            </div>

            {/* Footnote */}
            <div style={{ borderTop: '1px solid #888', marginTop: 16, paddingTop: 4, fontSize: '8pt', color: '#555' }}>
              ¹ ECUE : Élément Constitutif de l'Unité d'Enseignement
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  center: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#f0f4f8',
  } as React.CSSProperties,
  topbar: {
    background: 'linear-gradient(135deg,#0f172a,#1e1b4b)',
    color: '#fff', padding: '14px 28px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    boxShadow: '0 2px 16px rgba(0,0,0,.2)',
  } as React.CSSProperties,
  topBtn: {
    background: 'rgba(255,255,255,.1)', color: '#e2e8f0',
    border: '1px solid rgba(255,255,255,.2)', borderRadius: 8,
    padding: '8px 16px', fontWeight: 700, fontSize: 13,
    cursor: 'pointer', letterSpacing: '.2px',
    transition: 'all .15s',
  } as React.CSSProperties,
  actionBar: {
    background: '#fff', borderBottom: '1px solid #e2e8f0',
    padding: '16px 28px',
    display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center',
    justifyContent: 'space-between', gap: 16,
    boxShadow: '0 1px 8px rgba(0,0,0,.05)',
  } as React.CSSProperties,
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    border: 'none', borderRadius: 10,
    padding: '11px 20px', fontWeight: 700, fontSize: 13.5,
    transition: 'all .18s', letterSpacing: '.2px',
    flexDirection: 'column' as const, lineHeight: 1.2,
  } as React.CSSProperties,
  btnPrimary: {
    background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
    color: '#fff', border: 'none', borderRadius: 10,
    padding: '12px 28px', fontWeight: 700, fontSize: 14,
    cursor: 'pointer',
  } as React.CSSProperties,
};

export default ProfessorContratView;