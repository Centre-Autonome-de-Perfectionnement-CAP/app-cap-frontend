import { useState, useEffect, useRef, useCallback } from 'react'
import {
  CCard, CCardBody, CRow, CCol,
  CFormInput, CButton, CInputGroup, CInputGroupText,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CBadge, CSpinner, CContainer, CFormSelect, CProgress,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch, cilPhone, cilCheckCircle, cilXCircle,
  cilFingerprint, cilPencil, cilTrash, cilUser,
} from '@coreui/icons'
import { SingleValue } from 'react-select'
import AttendanceFilter from '@/components/Attendance/AttendanceFilter'

// ─── Configuration ────────────────────────────────────────────────────────────
const BASE_URL       = 'http://localhost:8000/api/attendance'
const ARDUINO_URL    = 'http://192.168.137.166'   // ← IP ESP32 (Serial Monitor)
const ITEMS_PER_PAGE = 15
const TIMEOUT_SEC    = 30  // secondes avant redirection automatique

interface SelectOption { value: string; label: string }
type ActiveView  = 'list' | 'enroll' | 'edit' | 'delete'
type EnrollPhase =
  | 'launching'   // connexion à l'ESP32 en cours
  | 'waiting'     // en attente du doigt (compteur actif)
  | 'capturing'   // doigt détecté, traitement en cours
  | 'saving'      // empreinte capturée, sauvegarde Laravel
  | 'done'        // succès
  | 'timeout'     // 30s dépassées sans doigt
  | 'cancelled'   // annulé par l'utilisateur
  | 'error'       // erreur technique

// ════════════════════════════════════════════════════════════════════════════
//  PAGE D'ENRÔLEMENT — UX simplifiée
//
//  Flux :
//  1. Clic "Lancer" → GET /api/reenroll?student_id=X (ESP32 démarre)
//  2. Polling GET /api/enroll-status toutes les 600ms
//     • step1/wait_up/step2 → afficher countdown 30s
//     • done → sauvegarder Laravel → afficher succès → retour liste après 3s
//  3. Timeout 30s → annuler ESP32 → afficher message → retour liste après 2s
//  4. Bouton Annuler → annuler ESP32 → retour liste immédiat
// ════════════════════════════════════════════════════════════════════════════
const EnrollPage = ({
  student, onBack, onSuccess,
}: {
  student: any
  onBack: () => void
  onSuccess: () => void
}) => {
  const [phase,       setPhase]       = useState<EnrollPhase>('launching')
  const [errorMsg,    setErrorMsg]    = useState('')
  const [timeLeft,    setTimeLeft]    = useState(TIMEOUT_SEC)
  const [successInfo, setSuccessInfo] = useState<{ slot: number } | null>(null)

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef   = useRef(true)

  // ── Nettoyer les intervalles ───────────────────────────────────────────
  const stopAll = useCallback(() => {
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopAll()
    }
  }, [stopAll])

  // ── Annuler proprement côté ESP32 ─────────────────────────────────────
  const cancelArduino = useCallback(() => {
    fetch(`${ARDUINO_URL}/api/enroll-cancel`).catch(() => {})
  }, [])

  // ── Démarrer le countdown 30s ─────────────────────────────────────────
  const startCountdown = useCallback(() => {
    setTimeLeft(TIMEOUT_SEC)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Timeout atteint
          stopAll()
          cancelArduino()
          if (mountedRef.current) setPhase('timeout')
          // Redirection automatique vers la liste après 2s
          setTimeout(() => {
            if (mountedRef.current) onBack()
          }, 2000)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [stopAll, cancelArduino, onBack])

  // ── Lancer l'enrôlement dès le montage du composant ──────────────────
  useEffect(() => {
    const launch = async () => {
      try {
        const r = await fetch(`${ARDUINO_URL}/api/reenroll?student_id=${student.id}`)
        const d = await r.json()

        if (!mountedRef.current) return

        if (!d.success) {
          setPhase('error')
          setErrorMsg(d.message || 'Impossible de démarrer le capteur')
          return
        }

        // ESP32 prêt — démarrer le countdown et le polling
        setPhase('waiting')
        startCountdown()

        pollRef.current = setInterval(async () => {
          if (!mountedRef.current) return
          try {
            const rs = await fetch(`${ARDUINO_URL}/api/enroll-status`)
            const ds = await rs.json()
            const state: string = ds.state || 'idle'

            if (!mountedRef.current) return

            // Doigt détecté (step2 = 2e pose en cours = capturing)
            if (state === 'step2' || state === 'wait_up') {
              setPhase('capturing')
              // Stopper le countdown pendant la capture
              if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
            }

            if (state === 'done') {
              stopAll()
              setPhase('saving')

              const fingerprintIndex: number = ds.fingerprint_index ?? 0

              // Sauvegarder dans Laravel
              await fetch(`${BASE_URL}/fingerprint/${student.id}`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                  fingerprint:       true,
                  fingerprint_index: fingerprintIndex,
                }),
              })

              if (!mountedRef.current) return

              setSuccessInfo({ slot: fingerprintIndex })
              setPhase('done')
              onSuccess() // Rafraîchir la liste en arrière-plan

              // Retour automatique à la liste après 3 secondes
              setTimeout(() => {
                if (mountedRef.current) onBack()
              }, 3000)
            }

            if (state === 'error') {
              stopAll()
              if (mountedRef.current) {
                setPhase('error')
                setErrorMsg(ds.message || 'Échec de la capture. Veuillez réessayer.')
              }
            }

          } catch {
            // ESP32 occupé, on réessaie au prochain tick
          }
        }, 600)

      } catch {
        if (!mountedRef.current) return
        setPhase('error')
        setErrorMsg(
          `Impossible de joindre l'ESP32 à ${ARDUINO_URL}. ` +
          `Vérifiez que l'IP est correcte et que l'ESP32 est sur le même réseau Wi-Fi.`
        )
      }
    }

    launch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Une seule fois au montage

  // ── Annuler manuellement ──────────────────────────────────────────────
  const handleCancel = () => {
    stopAll()
    cancelArduino()
    onBack() // Retour immédiat à la liste
  }

  // ── Contenu selon la phase ─────────────────────────────────────────────
  const phaseConfig: Record<EnrollPhase, {
    icon: any; iconColor: string; bg: string; border: string; title: string; sub: string
  }> = {
    launching: {
      icon: cilFingerprint, iconColor: '#3b82f6',
      bg: '#eff6ff', border: '#bfdbfe',
      title: 'Connexion au capteur...',
      sub: "L'ESP32 initialise le mode enrôlement",
    },
    waiting: {
      icon: cilFingerprint, iconColor: '#1d4ed8',
      bg: '#eff6ff', border: '#bfdbfe',
      title: 'En attente — posez le doigt',
      sub: "Placez le doigt de l'étudiant sur le capteur",
    },
    capturing: {
      icon: cilFingerprint, iconColor: '#15803d',
      bg: '#f0fdf4', border: '#86efac',
      title: 'Capture en cours...',
      sub: 'Maintenez le doigt, ne bougez pas',
    },
    saving: {
      icon: cilCheckCircle, iconColor: '#15803d',
      bg: '#f0fdf4', border: '#86efac',
      title: 'Empreinte capturée — sauvegarde...',
      sub: 'Enregistrement dans la base de données',
    },
    done: {
      icon: cilCheckCircle, iconColor: '#15803d',
      bg: '#f0fdf4', border: '#86efac',
      title: 'Enrôlement réussi !',
      sub: 'Redirection automatique dans 3 secondes...',
    },
    timeout: {
      icon: cilXCircle, iconColor: '#dc2626',
      bg: '#fef2f2', border: '#fecaca',
      title: 'Délai dépassé — aucune empreinte détectée',
      sub: 'Redirection automatique...',
    },
    cancelled: {
      icon: cilXCircle, iconColor: '#64748b',
      bg: '#f8fafc', border: '#e2e8f0',
      title: 'Enrôlement annulé',
      sub: 'Retour à la liste...',
    },
    error: {
      icon: cilXCircle, iconColor: '#dc2626',
      bg: '#fef2f2', border: '#fecaca',
      title: 'Erreur de connexion',
      sub: errorMsg,
    },
  }

  const c = phaseConfig[phase]
  const isActive  = ['launching', 'waiting', 'capturing', 'saving'].includes(phase)
  const isDone    = phase === 'done'
  const isTimeout = phase === 'timeout'
  const isError   = phase === 'error'

  const progressPct = Math.round(((TIMEOUT_SEC - timeLeft) / TIMEOUT_SEC) * 100)

  return (
    <CContainer fluid className="p-4">
      <CCard className="shadow-sm border-0" style={{ borderRadius: '10px', maxWidth: '540px', margin: '0 auto' }}>
        <CCardBody className="p-4">

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <CButton color="light" size="sm" onClick={handleCancel}
              style={{ border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' }}>
              ← Retour
            </CButton>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Gestion des empreintes</span>
            <span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#212529' }}>
              Enrôlement
            </span>
          </div>

          <h5 style={{ fontWeight: 700, marginBottom: '20px', color: '#212529' }}>
            Enregistrement empreinte digitale
          </h5>

          {/* ── Carte étudiant ──────────────────────────────────────────── */}
          <div style={{
            background: '#f8fafc', borderRadius: '10px', padding: '14px 16px',
            marginBottom: '24px', border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: '#dbeafe', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <CIcon icon={cilUser} style={{ color: '#1d4ed8', fontSize: '20px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
                {student.name}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                {student.matricule} · {student.filiere} · {student.niveau}
              </div>
            </div>
            <CBadge style={{
              background: student.fingerprint ? '#fef3c7' : '#dcfce7',
              color:      student.fingerprint ? '#92400e' : '#15803d',
              padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {student.fingerprint ? 'Re-enrôlement' : '1ère empreinte'}
            </CBadge>
          </div>

          {/* ── Zone d'état centrale ────────────────────────────────────── */}
          <div style={{
            background: c.bg, border: `1.5px solid ${c.border}`,
            borderRadius: '14px', padding: '32px 24px', textAlign: 'center',
            marginBottom: '20px', transition: 'all 0.3s ease',
          }}>
            {/* Icône / Spinner */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              {(phase === 'launching' || phase === 'capturing' || phase === 'saving') ? (
                <CSpinner style={{ color: c.iconColor, width: '48px', height: '48px' }} />
              ) : phase === 'waiting' ? (
                <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                  {/* Cercle pulsant */}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    border: `3px solid ${c.iconColor}`, opacity: 0.3,
                    animation: 'ping 1.5s ease-in-out infinite',
                  }} />
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: '#dbeafe', border: `2px solid ${c.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CIcon icon={cilFingerprint} style={{ color: c.iconColor, fontSize: '30px' }} />
                  </div>
                </div>
              ) : (
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: c.bg, border: `2px solid ${c.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CIcon icon={c.icon} style={{ color: c.iconColor, fontSize: '30px' }} />
                </div>
              )}
            </div>

            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              {c.title}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '16px' }}>
              {c.sub}
            </div>

            {/* ── Countdown 30s visible uniquement pendant l'attente ── */}
            {phase === 'waiting' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                  <span>Délai restant</span>
                  <span style={{
                    fontWeight: 700,
                    color: timeLeft <= 10 ? '#dc2626' : timeLeft <= 20 ? '#d97706' : '#16a34a',
                  }}>
                    {timeLeft}s
                  </span>
                </div>
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '4px',
                    width: `${100 - progressPct}%`,
                    background: timeLeft <= 10 ? '#dc2626' : timeLeft <= 20 ? '#f59e0b' : '#16a34a',
                    transition: 'width 1s linear, background 0.3s',
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                  Redirection automatique si aucun doigt détecté
                </div>
              </div>
            )}

            {/* ── Fiche de succès ── */}
            {isDone && successInfo && (
              <div style={{
                background: '#fff', border: '1px solid #bbf7d0', borderRadius: '10px',
                padding: '14px', textAlign: 'left', marginTop: '4px',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                  Étudiant enregistré
                </div>
                {[
                  { label: 'Nom',          value: student.name       },
                  { label: 'Matricule',    value: student.matricule   },
                  { label: 'Filière',      value: student.filiere     },
                  { label: 'Niveau',       value: student.niveau      },
                  { label: 'Slot capteur', value: `Slot n°${successInfo.slot}` },
                ].map(({ label, value }, idx, arr) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '7px 0',
                    borderBottom: idx < arr.length - 1 ? '1px solid #f0fdf4' : 'none',
                  }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{value ?? '—'}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Conseil si erreur réseau ── */}
            {isError && (
              <div style={{
                marginTop: '10px', background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#92400e',
                textAlign: 'left',
              }}>
                <strong>IP configurée :</strong>{' '}
                <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: '4px' }}>
                  {ARDUINO_URL}
                </code>
                <br />
                Vérifiez l'IP dans le Serial Monitor d'Arduino IDE au démarrage de l'ESP32.
              </div>
            )}
          </div>

          {/* ── Bouton Annuler — toujours disponible sauf si done/timeout ── */}
          {!isDone && !isTimeout && (
            <CButton
              color={isError ? 'primary' : 'light'}
              onClick={handleCancel}
              style={{
                border: isError ? 'none' : '1px solid #dee2e6',
                borderRadius: '6px', fontWeight: 600, width: '100%',
              }}>
              {isError ? '← Retour à la liste' : 'Annuler l\'enrôlement'}
            </CButton>
          )}

          {/* Animation CSS */}
          <style>{`
            @keyframes ping {
              0%, 100% { transform: scale(1); opacity: 0.3; }
              50%       { transform: scale(1.25); opacity: 0.1; }
            }
          `}</style>

        </CCardBody>
      </CCard>
    </CContainer>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE D'ÉDITION DU STATUT
// ════════════════════════════════════════════════════════════════════════════
const EditPage = ({
  student, onBack, onSuccess,
}: { student: any; onBack: () => void; onSuccess: () => void }) => {
  const [value, setValue]   = useState(student.fingerprint ? 'true' : 'false')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`${BASE_URL}/fingerprint/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: value === 'true' }),
      })
      onSuccess(); onBack()
    } finally { setSaving(false) }
  }

  return (
    <CContainer fluid className="p-4">
      <CCard className="shadow-sm border-0" style={{ borderRadius: '8px', maxWidth: '460px', margin: '0 auto' }}>
        <CCardBody className="p-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <CButton color="light" size="sm" onClick={onBack}
              style={{ border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' }}>← Retour</CButton>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Gestion des empreintes</span>
            <span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Modifier statut</span>
          </div>

          <h5 style={{ fontWeight: 700, marginBottom: '20px' }}>Modifier le statut de l'empreinte</h5>

          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#1e293b', marginBottom: '2px' }}>{student.name}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{student.matricule} · {student.filiere}</div>
            {student.fingerprint_index && (
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Slot capteur : {student.fingerprint_index}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold" style={{ fontSize: '14px', marginBottom: '6px', display: 'block' }}>Statut empreinte</label>
            <CFormSelect value={value} onChange={e => setValue(e.target.value)} style={{ borderRadius: '6px' }}>
              <option value="true">Enregistrée</option>
              <option value="false">Non enregistrée</option>
            </CFormSelect>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <CButton color="light" onClick={onBack} style={{ border: '1px solid #dee2e6', borderRadius: '6px', fontWeight: 600 }}>Annuler</CButton>
            <CButton color="primary" onClick={handleSave} disabled={saving} style={{ borderRadius: '6px', fontWeight: 600 }}>
              {saving && <CSpinner size="sm" className="me-1" />}Enregistrer
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    </CContainer>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE DE CONFIRMATION SUPPRESSION
// ════════════════════════════════════════════════════════════════════════════
const DeletePage = ({
  student, onBack, onSuccess,
}: { student: any; onBack: () => void; onSuccess: () => void }) => {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetch(`${BASE_URL}/fingerprint/${student.id}`, { method: 'DELETE' })
      onSuccess(); onBack()
    } finally { setDeleting(false) }
  }

  return (
    <CContainer fluid className="p-4">
      <CCard className="shadow-sm border-0" style={{ borderRadius: '8px', maxWidth: '460px', margin: '0 auto' }}>
        <CCardBody className="p-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <CButton color="light" size="sm" onClick={onBack}
              style={{ border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' }}>← Retour</CButton>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Gestion des empreintes</span>
            <span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b' }}>Réinitialiser</span>
          </div>

          <h5 style={{ fontWeight: 700, marginBottom: '8px', color: '#991b1b' }}>Réinitialiser l'empreinte</h5>
          <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px' }}>
            Le statut et le slot capteur seront réinitialisés. L'étudiant devra être ré-enrôlé.
          </p>

          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#1e293b', marginBottom: '2px' }}>{student.name}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{student.matricule} · {student.filiere} · {student.niveau}</div>
            {student.fingerprint_index && (
              <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '6px', fontWeight: 500 }}>
                Slot {student.fingerprint_index} sera libéré dans le capteur
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <CButton color="light" onClick={onBack} style={{ border: '1px solid #dee2e6', borderRadius: '6px', fontWeight: 600 }}>Annuler</CButton>
            <CButton color="danger" onClick={handleDelete} disabled={deleting} style={{ borderRadius: '6px', fontWeight: 600 }}>
              {deleting && <CSpinner size="sm" className="me-1" />}Confirmer la réinitialisation
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    </CContainer>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE LISTE PRINCIPALE
// ════════════════════════════════════════════════════════════════════════════
const Fingerprint = () => {
  const [filterOptions, setFilterOptions] = useState({
    annees: [] as string[], filieres: [] as string[], niveaux: [] as string[],
  })
  const [students, setStudents]           = useState<any[]>([])
  const [filters, setFilters]             = useState({ year: '', filiere: '', niveau: '' })
  const [search, setSearch]               = useState('')
  const [currentPage, setCurrentPage]     = useState(1)
  const [loading, setLoading]             = useState(false)
  const [activeView, setActiveView]       = useState<ActiveView>('list')
  const [activeStudent, setActiveStudent] = useState<any>(null)

  useEffect(() => {
    fetch(`${BASE_URL}/filters`).then(r => r.json()).then(d => {
      if (d.success) setFilterOptions({
        annees: d.data.annees || [], filieres: d.data.filieres || [], niveaux: d.data.niveaux || [],
      })
    })
  }, [])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.year)    params.append('annee',   filters.year)
      if (filters.filiere) params.append('filiere', filters.filiere)
      if (filters.niveau)  params.append('niveau',  filters.niveau)
      const res  = await fetch(`${BASE_URL}/fingerprint?${params}`)
      const data = await res.json()
      setStudents(data.data || [])
      setCurrentPage(1)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchStudents() }, [filters])

  const handleFilterChange = (name: string, option: SingleValue<SelectOption>) => {
    setFilters(prev => ({ ...prev, [name]: option && option.value !== 'all' ? option.value : '' }))
  }

  const goTo   = (view: ActiveView, s: any) => { setActiveStudent(s); setActiveView(view) }
  const goBack = () => { setActiveView('list'); setActiveStudent(null) }

  const handleExport = (format: string) => {
    window.open(`${BASE_URL}/fingerprint/export?${new URLSearchParams({ format, ...filters })}`, '_blank')
  }

  const filteredStudents = students.filter(s =>
    (s.name      || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.matricule || '').toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  const paginated  = filteredStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const nbEnrolled = students.filter(s => s.fingerprint).length

  if (activeView === 'enroll' && activeStudent) return (
    <EnrollPage student={activeStudent} onBack={goBack} onSuccess={fetchStudents} />
  )
  if (activeView === 'edit'   && activeStudent) return <EditPage   student={activeStudent} onBack={goBack} onSuccess={fetchStudents} />
  if (activeView === 'delete' && activeStudent) return <DeletePage student={activeStudent} onBack={goBack} onSuccess={fetchStudents} />

  return (
    <CContainer fluid className="p-4">
      <CCard className="shadow-sm border-0" style={{ borderRadius: '8px' }}>
        <CCardBody className="p-4">

          <h5 style={{ fontWeight: 700, color: '#212529', marginBottom: '20px' }}>
            Gestion des empreintes digitales
          </h5>

          {students.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ background: '#dcfce7', color: '#15803d', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600 }}>
                {nbEnrolled} enregistrée(s)
              </div>
              <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600 }}>
                {students.length - nbEnrolled} non enregistrée(s)
              </div>
              <div style={{ background: '#f1f5f9', color: '#475569', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600 }}>
                {students.length} total
              </div>
            </div>
          )}

          <AttendanceFilter
            filterOptions={filterOptions}
            selectedYear={filters.year} selectedFiliere={filters.filiere}
            selectedNiveau={filters.niveau} onFilterChange={handleFilterChange}
          />

          <CRow className="mb-3 align-items-end g-3">
            <CCol xs={12} md={8}>
              <div className="d-flex gap-2 flex-wrap">
                {(['pdf', 'excel', 'word'] as const).map(fmt => (
                  <CButton key={fmt} color="primary" variant="outline" size="sm"
                    onClick={() => handleExport(fmt)} style={{ borderRadius: '6px', fontSize: '13px' }}>
                    Exporter {fmt.toUpperCase()}
                  </CButton>
                ))}
              </div>
            </CCol>
            <CCol xs={12} md={4}>
              <label className="form-label fw-semibold" style={{ fontSize: '14px' }}>Recherche</label>
              <CInputGroup>
                <CInputGroupText style={{ background: '#fff', border: '1px solid #dee2e6', borderRight: 'none' }}>
                  <CIcon icon={cilSearch} size="sm" className="text-muted" />
                </CInputGroupText>
                <CFormInput placeholder="Nom ou matricule..."
                  value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                  style={{ borderLeft: 'none', borderRadius: '0 6px 6px 0' }}
                />
              </CInputGroup>
            </CCol>
          </CRow>

          <CCard className="border-0" style={{ borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <CCardBody className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <CSpinner color="primary" size="sm" />
                  <span className="ms-2 text-muted">Chargement...</span>
                </div>
              ) : (
                <CTable hover responsive striped className="mb-0" style={{ fontSize: '14px' }}>
                  <CTableHead style={{ background: '#f8f9fa' }}>
                    <CTableRow>
                      <CTableHeaderCell className="ps-3">#</CTableHeaderCell>
                      <CTableHeaderCell>Matricule</CTableHeaderCell>
                      <CTableHeaderCell>Noms et Prénoms</CTableHeaderCell>
                      <CTableHeaderCell>Contact</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Empreinte</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {paginated.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={6} className="text-center py-5 text-muted">
                          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Aucun étudiant trouvé</div>
                          <div style={{ fontSize: '13px' }}>Modifiez les filtres ou la recherche.</div>
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      paginated.map((s, i) => (
                        <CTableRow key={s.id}>
                          <CTableDataCell className="ps-3 text-muted">
                            {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                          </CTableDataCell>
                          <CTableDataCell><strong>{s.matricule || 'N/A'}</strong></CTableDataCell>
                          <CTableDataCell>{s.name}</CTableDataCell>
                          <CTableDataCell>
                            {s.phone ? (
                              <a href={`tel:${s.phone}`} style={{ color: '#0d6efd', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CIcon icon={cilPhone} size="sm" />{s.phone}
                              </a>
                            ) : <span className="text-muted">—</span>}
                          </CTableDataCell>

                          <CTableDataCell className="text-center">
                            {s.fingerprint ? (
                              <CBadge style={{ background: '#dcfce7', color: '#15803d', padding: '5px 12px', borderRadius: '20px', fontSize: '12px' }}>
                                <CIcon icon={cilCheckCircle} size="sm" className="me-1" />
                                Enregistrée{s.fingerprint_index ? ` · slot ${s.fingerprint_index}` : ''}
                              </CBadge>
                            ) : (
                              <CBadge style={{ background: '#fee2e2', color: '#991b1b', padding: '5px 12px', borderRadius: '20px', fontSize: '12px' }}>
                                <CIcon icon={cilXCircle} size="sm" className="me-1" />Non enregistrée
                              </CBadge>
                            )}
                          </CTableDataCell>

                          <CTableDataCell className="text-center">
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                              <CButton size="sm"
                                title={s.fingerprint ? "Re-enregistrer" : "Enregistrer l'empreinte"}
                                onClick={() => goTo('enroll', s)}
                                style={{
                                  background: s.fingerprint ? '#eff6ff' : '#f0fdf4',
                                  border: 'none',
                                  color: s.fingerprint ? '#1d4ed8' : '#15803d',
                                  borderRadius: '6px', padding: '6px 10px',
                                }}>
                                <CIcon icon={cilFingerprint} size="sm" />
                              </CButton>
                              <CButton size="sm" title="Modifier le statut" onClick={() => goTo('edit', s)}
                                style={{ background: '#fffbeb', border: 'none', color: '#92400e', borderRadius: '6px', padding: '6px 10px' }}>
                                <CIcon icon={cilPencil} size="sm" />
                              </CButton>
                              <CButton size="sm" title="Réinitialiser" onClick={() => goTo('delete', s)}
                                style={{ background: '#fef2f2', border: 'none', color: '#991b1b', borderRadius: '6px', padding: '6px 10px' }}>
                                <CIcon icon={cilTrash} size="sm" />
                              </CButton>
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>

          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-muted" style={{ fontSize: '13px' }}>
                Page {currentPage} / {totalPages} — {filteredStudents.length} étudiant(s)
              </span>
              <div className="d-flex gap-2">
                <CButton size="sm" color="light" disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  style={{ borderRadius: '6px', border: '1px solid #dee2e6', fontWeight: 600 }}>Précédent</CButton>
                <CButton size="sm" color="light" disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  style={{ borderRadius: '6px', border: '1px solid #dee2e6', fontWeight: 600 }}>Suivant</CButton>
              </div>
            </div>
          )}

        </CCardBody>
      </CCard>
    </CContainer>
  )
}

export default Fingerprint
