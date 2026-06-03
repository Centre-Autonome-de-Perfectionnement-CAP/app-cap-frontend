import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  CCard, CCardBody, CRow, CCol, CFormInput, CButton,
  CInputGroup, CInputGroupText, CTable, CTableHead, CTableRow,
  CTableHeaderCell, CTableBody, CTableDataCell,
  CSpinner, CContainer,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilPhone, cilClock, cilReload } from '@coreui/icons'
import Select, { SingleValue } from 'react-select'
import AttendanceFilter from '@/components/Attendance/AttendanceFilter'

const BASE_URL       = 'http://localhost:8000/api/attendance'
const ITEMS_PER_PAGE = 20

interface SelectOption { value: string; label: string }

// ── Badge statut ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status, lateType }: { status: string; lateType: string | null }) => {
  if (status !== 'present') return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#fee2e2', color:'#991b1b', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:600 }}>
      <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#dc2626' }} />Absent
    </span>
  )
  if (lateType !== null) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#fff3cd', color:'#92400e', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:600 }}>
      <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#f59e0b' }} />Retard
    </span>
  )
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#dcfce7', color:'#15803d', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:600 }}>
      <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#16a34a' }} />Présent
    </span>
  )
}

// ── Durée ─────────────────────────────────────────────────────────────────────
const DurationBadge = ({ minutes }: { minutes: number }) => {
  if (!minutes) return <span className="text-muted">—</span>
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return (
    <span style={{ fontSize:'12px', color:'#475569', display:'inline-flex', alignItems:'center', gap:'4px' }}>
      <CIcon icon={cilClock} size="sm" />
      {h > 0 ? `${h}h${m.toString().padStart(2,'0')}` : `${m}min`}
    </span>
  )
}

// ── Icônes export ─────────────────────────────────────────────────────────────
const ExportIcon = ({ format }: { format: string }) => {
  if (format === 'pdf') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  )
  if (format === 'excel') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="12" y1="9" x2="12" y2="21"/>
    </svg>
  )
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  )
}

// ── Modal Pointage Manuel ──────────────────────────────────────────────────────
const ScanModal = ({
  student, onClose, onSuccess,
}: { student: any; onClose: () => void; onSuccess: () => void }) => {
  const now   = new Date()
  const pad   = (n: number) => String(n).padStart(2, '0')
  const today = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`
  const hhmm  = `${pad(now.getHours())}:${pad(now.getMinutes())}`

  const [date,    setDate]    = useState(today)
  const [time,    setTime]    = useState(hhmm)
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<any>(null)
  const [error,   setError]   = useState('')

  const handleScan = async () => {
    if (!student.fingerprint_index) {
      setError("Cet étudiant n'a pas d'empreinte enregistrée.")
      return
    }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch(`${BASE_URL}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint_index: student.fingerprint_index,
          date,
          time: time + ':00',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data)
        onSuccess()
      } else {
        setError(data.message || 'Pointage refusé')
      }
    } catch {
      setError('Erreur réseau — vérifiez que Laravel est démarré.')
    } finally { setLoading(false) }
  }

  const statusColor = result?.late_type ? '#f59e0b' : '#16a34a'
  const statusLabel = result?.late_type ? 'Retard' : (result?.scan_type === 'exit' ? 'Sortie enregistrée' : 'Présent à l\'heure')

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:'14px', padding:'28px 32px', maxWidth:'440px', width:'90%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* En-tête */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:'15px', color:'#1e293b' }}>Pointage Manuel</div>
            <div style={{ fontSize:'12px', color:'#64748b' }}>Simule un scan d'empreinte</div>
          </div>
          <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:'20px' }}>×</button>
        </div>

        {/* Info étudiant */}
        <div style={{ background:'#f8fafc', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px', border:'1px solid #e2e8f0' }}>
          <div style={{ fontWeight:700, fontSize:'14px', color:'#1e293b' }}>{student.name}</div>
          <div style={{ fontSize:'12px', color:'#64748b', marginTop:'3px' }}>
            {student.matricule} · {student.filiere} · {student.niveau}
          </div>
          {student.fingerprint_index ? (
            <div style={{ fontSize:'11px', color:'#16a34a', marginTop:'4px', fontWeight:600 }}>
              ✓ Empreinte enregistrée — Slot {student.fingerprint_index}
            </div>
          ) : (
            <div style={{ fontSize:'11px', color:'#dc2626', marginTop:'4px', fontWeight:600 }}>
              ✗ Aucune empreinte — enrôlement requis
            </div>
          )}
        </div>

        {/* Date + Heure */}
        {!result && (
          <>
            <CRow className="g-2 mb-3">
              <CCol md={6}>
                <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Date</label>
                <CFormInput type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{ borderRadius:'6px', fontSize:'13px' }} />
              </CCol>
              <CCol md={6}>
                <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Heure</label>
                <CFormInput type="time" value={time} onChange={e => setTime(e.target.value)}
                  style={{ borderRadius:'6px', fontSize:'13px' }} />
              </CCol>
            </CRow>

            <div style={{ background:'#fefce8', border:'1px solid #fde68a', borderRadius:'8px', padding:'10px 12px', marginBottom:'16px', fontSize:'12px', color:'#92400e' }}>
              ⏱ Le statut sera calculé automatiquement selon l'emploi du temps et l'heure choisie.
            </div>

            {error && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', padding:'10px 12px', marginBottom:'16px', fontSize:'13px', color:'#991b1b' }}>
                {error}
              </div>
            )}

            <div style={{ display:'flex', gap:'10px' }}>
              <CButton color="light" onClick={onClose}
                style={{ border:'1px solid #dee2e6', borderRadius:'8px', fontWeight:600, flex:1 }}>
                Annuler
              </CButton>
              <CButton color="primary" onClick={handleScan} disabled={loading || !student.fingerprint_index}
                style={{ borderRadius:'8px', fontWeight:600, flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                {loading ? <CSpinner size="sm" style={{ width:'14px', height:'14px' }} /> : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                )}
                {loading ? 'Pointage...' : 'Pointer maintenant'}
              </CButton>
            </div>
          </>
        )}

        {/* Résultat succès */}
        {result && (
          <div>
            <div style={{ textAlign:'center', padding:'16px 0 12px' }}>
              <div style={{ width:'56px', height:'56px', borderRadius:'50%', background: result.late_type ? '#fef3c7' : '#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontWeight:700, fontSize:'16px', color:'#1e293b', marginBottom:'4px' }}>Pointage enregistré</div>
              <div style={{ fontSize:'13px', color:'#64748b' }}>{result.matiere}</div>
            </div>

            <div style={{ background:'#f8fafc', borderRadius:'10px', padding:'14px', marginBottom:'16px' }}>
              {[
                { label:'Étudiant',  value: result.student },
                { label:'Type',      value: result.scan_type === 'entry' ? '↗ Entrée' : '↙ Sortie' },
                { label:'Heure',     value: result.scan_time?.substring(0,5) },
                { label:'Statut',    value: statusLabel },
                { label:'Durée',     value: result.total_minutes > 0 ? `${Math.floor(result.total_minutes/60)}h${String(result.total_minutes%60).padStart(2,'0')}` : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #f1f5f9' }}>
                  <span style={{ fontSize:'12px', color:'#6b7280' }}>{label}</span>
                  <span style={{ fontSize:'12px', fontWeight:600, color:'#1e293b' }}>{value}</span>
                </div>
              ))}
            </div>

            <CButton color="primary" onClick={onClose} style={{ borderRadius:'8px', fontWeight:600, width:'100%' }}>
              Fermer
            </CButton>
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════
// ── Style animation pulse pour le point LIVE ──────────────────────────────
const liveStyle = `
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(1.4); }
  }
  @keyframes highlight {
    0%   { background-color: #dcfce7; }
    100% { background-color: transparent; }
  }
  .new-scan-row {
    animation: highlight 4s ease-out forwards;
  }
`

const Management = () => {
  const [filterOptions, setFilterOptions] = useState({
    annees: [] as string[], filieres: [] as string[], niveaux: [] as string[],
    matieres: [] as string[], heures: [] as string[],
  })
  const [students,       setStudents]       = useState<any[]>([])
  const [filters,        setFilters]        = useState({ year:'', filiere:'', niveau:'', matiere:'', heure:'' })
  const [search,         setSearch]         = useState('')
  const [currentPage,    setCurrentPage]    = useState(1)
  const [loading,        setLoading]        = useState(false)
  const [exportLoading,  setExportLoading]  = useState<string|null>(null)
  const [scanStudent,    setScanStudent]     = useState<any>(null)  // modal pointage
  const [lastRefresh,    setLastRefresh]    = useState<Date>(new Date())
  const [closeModal,     setCloseModal]     = useState(false)
  const [profileStudent, setProfileStudent] = useState<any>(null)
  const [profileData,    setProfileData]    = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileFilter,  setProfileFilter]  = useState('all')
  const [closing,        setClosing]        = useState(false)
  const [closeResult,    setCloseResult]    = useState<any>(null)

  // Options Select
  const matiereOptions = useMemo(() => [
    { value:'all', label:'Toutes les matières' },
    ...filterOptions.matieres.map(m => ({ value:m, label:m })),
  ], [filterOptions.matieres])

  const heureOptions = useMemo(() => [
    { value:'all', label:'Tous les créneaux' },
    ...filterOptions.heures.map(h => ({ value:h, label:h })),
  ], [filterOptions.heures])

  useEffect(() => {
    fetch(`${BASE_URL}/filters`).then(r => r.json()).then(d => {
      if (d.success) setFilterOptions({
        annees:   d.data.annees   || [],
        filieres: d.data.filieres || [],
        niveaux:  d.data.niveaux  || [],
        matieres: d.data.matieres || [],
        heures:   d.data.heures   || [],
      })
    })
  }, [])

  // ── Ouvrir le profil d'un étudiant ───────────────────────────────────────
  const openProfile = async (student: any) => {
    setProfileStudent(student)
    setProfileData(null)
    setProfileFilter('all')
    setProfileLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/student-profile/${student.id}`)
      const data = await res.json()
      if (data.success) setProfileData(data.data)
    } catch { /* silencieux */ }
    finally { setProfileLoading(false) }
  }

  // ── Clôturer le cours : marquer absents tous les non-pointeurs ──────────
  const handleCloseCourse = async () => {
    if (!filters.matiere) return
    setClosing(true); setCloseResult(null)
    const today = new Date()
    const pad   = (n: number) => String(n).padStart(2,'0')
    const date  = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`
    try {
      const res  = await fetch(`${BASE_URL}/close-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_element_id: filters.matiere, date }),
      })
      const data = await res.json()
      setCloseResult(data)
      if (data.success) fetchStudents()
    } catch {
      setCloseResult({ success: false, message: 'Erreur réseau' })
    } finally { setClosing(false) }
  }

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.year)    params.append('annee',   filters.year)
      if (filters.filiere) params.append('filiere', filters.filiere)
      if (filters.niveau)  params.append('niveau',  filters.niveau)
      if (filters.matiere) params.append('matiere', filters.matiere)
      if (filters.heure)   params.append('heure',   filters.heure)
      const res  = await fetch(`${BASE_URL}/management?${params}`)
      const data = await res.json()
      setStudents(data.data || [])
      setCurrentPage(1)
      setLastRefresh(new Date())
    } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  // ── Rafraîchissement en temps réel via Server-Sent Events ──────────────
  // SSE : le serveur pousse les mises à jour dès qu'un pointage est enregistré
  // Fallback : polling toutes les 10s si SSE non supporté
  const [newScanIds,  setNewScanIds]  = useState<number[]>([])
  const [liveActive,  setLiveActive]  = useState(false)
  const [liveMatiere, setLiveMatiere] = useState('')

  useEffect(() => {
    let es: EventSource | null = null
    let fallback: ReturnType<typeof setInterval> | null = null

    const connectSSE = () => {
      try {
        es = new EventSource(`${BASE_URL}/live-stream`)

        es.onopen = () => {
          setLiveActive(true)
          if (fallback) { clearInterval(fallback); fallback = null }
        }

        es.addEventListener('scan', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data)
            // Rafraîchir immédiatement + surligner la nouvelle ligne
            setNewScanIds(prev => [...prev, data.student_id])
            setLiveMatiere(data.matiere || '')
            fetchStudents()
            // Retirer le surlignage après 4s
            setTimeout(() => {
              setNewScanIds(prev => prev.filter(id => id !== data.student_id))
            }, 4000)
          } catch {}
        })

        es.addEventListener('ping', () => {
          setLiveActive(true)
        })

        es.onerror = () => {
          setLiveActive(false)
          es?.close()
          // Fallback polling toutes les 10s
          if (!fallback) fallback = setInterval(fetchStudents, 10000)
        }
      } catch {
        // SSE non supporté → polling
        if (!fallback) fallback = setInterval(fetchStudents, 10000)
      }
    }

    connectSSE()

    return () => {
      es?.close()
      if (fallback) clearInterval(fallback)
    }
  }, [fetchStudents])

  const handleFilterChange = (name: string, option: SingleValue<SelectOption>) => {
    setFilters(prev => ({ ...prev, [name]: option && option.value !== 'all' ? option.value : '' }))
  }

  const handleExport = (format: string) => {
    setExportLoading(format)
    const params = new URLSearchParams()
    params.append('format', format)
    if (filters.year)    params.append('annee',   filters.year)
    if (filters.filiere) params.append('filiere', filters.filiere)
    if (filters.niveau)  params.append('niveau',  filters.niveau)
    if (filters.matiere) params.append('matiere', filters.matiere)
    if (filters.heure)   params.append('heure',   filters.heure)
    window.open(`${BASE_URL}/management/export?${params}`, '_blank')
    setTimeout(() => setExportLoading(null), 1500)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return students
    return students.filter(s =>
      (s.name      || '').toLowerCase().includes(q) ||
      (s.matricule || '').toLowerCase().includes(q) ||
      (s.matiere   || '').toLowerCase().includes(q)
    )
  }, [search, students])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Stats
  const stats = useMemo(() => ({
    present: students.filter(s => s.status === 'present' && !s.late_type).length,
    late:    students.filter(s => s.status === 'present' && s.late_type !== null).length,
    absent:  students.filter(s => s.status !== 'present').length,
    total:   students.length,
  }), [students])

  const selectStyles = {
    control: (b: any) => ({ ...b, borderRadius:'6px', fontSize:'13px', minHeight:'38px', borderColor:'#dee2e6' }),
    option:  (b: any) => ({ ...b, fontSize:'13px' }),
  }

  const pad = (n: number) => String(n).padStart(2,'0')
  const refreshTime = `${pad(lastRefresh.getHours())}:${pad(lastRefresh.getMinutes())}:${pad(lastRefresh.getSeconds())}`

  return (
    <CContainer fluid className="p-4">

      {/* ── Modal Profil Étudiant ─────────────────────────────────────────── */}
      {profileStudent && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'780px', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 24px 80px rgba(0,0,0,0.25)' }}>

            {/* Header modal */}
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:'14px', flexShrink:0 }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'16px', fontWeight:800, flexShrink:0 }}>
                {profileStudent?.name?.split(' ').map((n:string) => n[0]).slice(0,2).join('')}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:'16px', color:'#1e293b' }}>{profileStudent?.name}</div>
                <div style={{ fontSize:'12px', color:'#64748b', marginTop:'2px', display:'flex', gap:'12px', flexWrap:'wrap' }}>
                  <span>{profileStudent?.matricule}</span>
                  <span>·</span>
                  <span>{profileStudent?.filiere}</span>
                  <span>·</span>
                  <span>{profileStudent?.niveau}</span>
                  {profileStudent?.fingerprint_index && (
                    <span style={{ color:'#15803d', fontWeight:600 }}>✓ Slot {profileStudent.fingerprint_index}</span>
                  )}
                </div>
              </div>
              <button onClick={() => setProfileStudent(null)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:'22px', lineHeight:1, padding:'4px' }}>×</button>
            </div>

            {/* Corps modal */}
            <div style={{ overflowY:'auto', flex:1, padding:'20px 24px' }}>
              {profileLoading ? (
                <div style={{ textAlign:'center', padding:'40px 0' }}>
                  <CSpinner color="primary" size="sm" />
                  <div style={{ marginTop:'8px', fontSize:'13px', color:'#94a3b8' }}>Chargement de l'historique...</div>
                </div>
              ) : !profileData ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#94a3b8', fontSize:'13px' }}>Aucune donnée disponible</div>
              ) : (() => {
                const history = profileData.history || []
                const total   = history.length
                const present = history.filter((h:any) => h.status === 'present' && !h.late_type).length
                const retard  = history.filter((h:any) => h.status === 'present' && h.late_type).length
                const absent  = history.filter((h:any) => h.status !== 'present').length
                const pctP    = total > 0 ? Math.round(present/total*100) : 0
                const pctR    = total > 0 ? Math.round(retard/total*100)  : 0
                const pctA    = total > 0 ? Math.round(absent/total*100)  : 0
                const totalMin = history.reduce((acc:number,h:any) => acc+(h.total_minutes||0), 0)
                const filtered = profileFilter === 'all' ? history
                  : profileFilter === 'present' ? history.filter((h:any) => h.status==='present'&&!h.late_type)
                  : profileFilter === 'retard'  ? history.filter((h:any) => h.status==='present'&&h.late_type)
                  : history.filter((h:any) => h.status!=='present')

                return (
                  <>
                    {/* KPI */}
                    <div style={{ display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
                      {[
                        { label:'Séances', value:total,       bg:'#f8fafc', color:'#334155' },
                        { label:`Présent ${pctP}%`, value:present, bg:'#dcfce7', color:'#15803d' },
                        { label:`Retard ${pctR}%`,  value:retard,  bg:'#fff3cd', color:'#92400e' },
                        { label:`Absent ${pctA}%`,  value:absent,  bg:'#fee2e2', color:'#991b1b' },
                      ].map(st => (
                        <div key={st.label} style={{ background:st.bg, color:st.color, borderRadius:'10px', padding:'10px 16px', minWidth:'90px', textAlign:'center' }}>
                          <div style={{ fontSize:'22px', fontWeight:800, lineHeight:1 }}>{st.value}</div>
                          <div style={{ fontSize:'11px', marginTop:'3px', opacity:0.8 }}>{st.label}</div>
                        </div>
                      ))}
                      {totalMin > 0 && (
                        <div style={{ background:'#eff6ff', color:'#1d4ed8', borderRadius:'10px', padding:'10px 16px', textAlign:'center' }}>
                          <div style={{ fontSize:'22px', fontWeight:800, lineHeight:1 }}>
                            {Math.floor(totalMin/60)}h{String(totalMin%60).padStart(2,'0')}
                          </div>
                          <div style={{ fontSize:'11px', marginTop:'3px', opacity:0.8 }}>Temps total</div>
                        </div>
                      )}
                    </div>

                    {/* Barre de progression globale */}
                    {total > 0 && (
                      <div style={{ marginBottom:'20px' }}>
                        <div style={{ height:'10px', borderRadius:'6px', overflow:'hidden', display:'flex', background:'#f1f5f9' }}>
                          <div style={{ width:`${pctP}%`, background:'#22c55e' }} />
                          <div style={{ width:`${pctR}%`, background:'#f59e0b' }} />
                          <div style={{ width:`${pctA}%`, background:'#ef4444' }} />
                        </div>
                        <div style={{ display:'flex', gap:'16px', marginTop:'6px', fontSize:'11px' }}>
                          <span style={{ color:'#16a34a' }}>● {pctP}% présent</span>
                          <span style={{ color:'#f59e0b' }}>● {pctR}% retard</span>
                          <span style={{ color:'#dc2626' }}>● {pctA}% absent</span>
                        </div>
                      </div>
                    )}

                    {/* Filtres historique */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                      <span style={{ fontSize:'13px', fontWeight:700, color:'#1e293b' }}>
                        Historique des séances
                      </span>
                      <div style={{ display:'flex', gap:'6px' }}>
                        {[
                          { key:'all',     label:'Tous'    },
                          { key:'present', label:'Présent' },
                          { key:'retard',  label:'Retard'  },
                          { key:'absent',  label:'Absent'  },
                        ].map(f => (
                          <button key={f.key} onClick={() => setProfileFilter(f.key)}
                            style={{
                              border:'none', borderRadius:'20px', padding:'3px 10px',
                              fontSize:'11px', fontWeight:600, cursor:'pointer',
                              background: profileFilter===f.key ? '#1d4ed8' : '#f1f5f9',
                              color:      profileFilter===f.key ? '#fff'    : '#475569',
                            }}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tableau historique */}
                    <CTable hover responsive className="mb-0" style={{ fontSize:'12px' }}>
                      <CTableHead style={{ background:'#f8f9fa' }}>
                        <CTableRow>
                          <CTableHeaderCell>Date</CTableHeaderCell>
                          <CTableHeaderCell>Matière</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Entrée</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Sortie</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Durée</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Statut</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {filtered.length === 0 ? (
                          <CTableRow>
                            <CTableDataCell colSpan={6} className="text-center py-3 text-muted">
                              Aucun enregistrement
                            </CTableDataCell>
                          </CTableRow>
                        ) : filtered.map((h:any, i:number) => (
                          <CTableRow key={i} style={{ background: h.status!=='present' ? '#fffafa' : 'transparent' }}>
                            <CTableDataCell style={{ fontWeight:600, whiteSpace:'nowrap' }}>{h.date}</CTableDataCell>
                            <CTableDataCell style={{ color:'#475569', maxWidth:'130px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.matiere}</CTableDataCell>
                            <CTableDataCell className="text-center" style={{ color:'#15803d', fontWeight:600 }}>
                              {h.first_entry ? h.first_entry.substring(0,5) : <span className="text-muted">—</span>}
                            </CTableDataCell>
                            <CTableDataCell className="text-center" style={{ color:'#dc2626', fontWeight:600 }}>
                              {h.last_exit ? h.last_exit.substring(0,5) : <span className="text-muted">—</span>}
                            </CTableDataCell>
                            <CTableDataCell className="text-center" style={{ color:'#475569' }}>
                              {h.total_minutes > 0
                                ? `${Math.floor(h.total_minutes/60)}h${String(h.total_minutes%60).padStart(2,'0')}`
                                : <span className="text-muted">—</span>}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              <StatusBadge status={h.status} lateType={h.late_type} />
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  </>
                )
              })()}
            </div>

          </div>
        </div>
      )}

      {/* ── Modal Clôturer le cours ───────────────────────────────────────── */}
      {closeModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:'14px', padding:'28px 32px', maxWidth:'460px', width:'90%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>

            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:'15px', color:'#1e293b' }}>Clôturer le cours</div>
                <div style={{ fontSize:'12px', color:'#64748b' }}>Marquer absents tous les non-pointeurs</div>
              </div>
              <button onClick={() => setCloseModal(false)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:'20px' }}>×</button>
            </div>

            {!closeResult ? (
              <>
                <div style={{ background:'#fefce8', border:'1px solid #fde68a', borderRadius:'10px', padding:'14px 16px', marginBottom:'20px', fontSize:'13px', color:'#92400e', lineHeight:1.6 }}>
                  Cette action va marquer comme <strong>ABSENT</strong> tous les étudiants de la classe
                  qui n'ont <strong>pas encore pointé</strong> aujourd'hui pour la matière sélectionnée.<br/><br/>
                  Les étudiants déjà <strong>Présents ou Retard</strong> ne seront pas modifiés.
                </div>
                <div style={{ display:'flex', gap:'10px' }}>
                  <CButton color="light" onClick={() => setCloseModal(false)}
                    style={{ border:'1px solid #dee2e6', borderRadius:'8px', fontWeight:600, flex:1 }}>
                    Annuler
                  </CButton>
                  <CButton color="warning" onClick={handleCloseCourse} disabled={closing}
                    style={{ borderRadius:'8px', fontWeight:600, flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px', color:'#92400e' }}>
                    {closing ? <CSpinner size="sm" style={{ width:'14px', height:'14px' }} /> : null}
                    {closing ? 'Clôture en cours...' : 'Confirmer la clôture'}
                  </CButton>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  padding:'16px', borderRadius:'10px', marginBottom:'20px',
                  background: closeResult.success ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${closeResult.success ? '#bbf7d0' : '#fecaca'}`,
                }}>
                  <div style={{ fontWeight:700, fontSize:'14px', color: closeResult.success ? '#15803d' : '#991b1b', marginBottom:'12px' }}>
                    {closeResult.success ? '✅ Cours clôturé avec succès' : '❌ Erreur'}
                  </div>
                  {closeResult.success && (
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                      {[
                        { label:'Cours',           value: closeResult.cours },
                        { label:'Date',            value: closeResult.date },
                        { label:'Total étudiants', value: closeResult.total_etudiants },
                        { label:'Déjà présents',   value: closeResult.deja_presents },
                        { label:'Absents marqués', value: closeResult.absents_marques },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', padding:'3px 0', borderBottom:'1px solid #dcfce7' }}>
                          <span style={{ color:'#64748b' }}>{label}</span>
                          <span style={{ fontWeight:700, color:'#1e293b' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!closeResult.success && (
                    <div style={{ fontSize:'13px', color:'#991b1b' }}>{closeResult.message}</div>
                  )}
                </div>
                <CButton color="primary" onClick={() => setCloseModal(false)}
                  style={{ borderRadius:'8px', fontWeight:600, width:'100%' }}>
                  Fermer
                </CButton>
              </>
            )}
          </div>
        </div>
      )}

      <style>{liveStyle}</style>

      {/* Modal pointage manuel */}
      {scanStudent && (
        <ScanModal
          student={scanStudent}
          onClose={() => setScanStudent(null)}
          onSuccess={() => { setScanStudent(null); fetchStudents() }}
        />
      )}

      <CCard className="shadow-sm border-0" style={{ borderRadius:'8px' }}>
        <CCardBody className="p-4">

          {/* En-tête */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
            <h5 style={{ fontWeight:700, color:'#212529', margin:0 }}>Gestion des présences</h5>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
              {/* Indicateur temps réel */}
              <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:600,
                color: liveActive ? '#15803d' : '#94a3b8' }}>
                <span style={{
                  width:'8px', height:'8px', borderRadius:'50%',
                  background: liveActive ? '#16a34a' : '#94a3b8',
                  animation: liveActive ? 'pulse 1.5s infinite' : 'none',
                  display:'inline-block',
                }} />
                {liveActive ? 'LIVE' : `Actualisé à ${refreshTime}`}
                {liveActive && liveMatiere && (
                  <span style={{ color:'#64748b', fontWeight:400 }}>— {liveMatiere}</span>
                )}
              </div>
              <CButton size="sm" color="light" onClick={fetchStudents} disabled={loading}
                style={{ border:'1px solid #dee2e6', borderRadius:'6px', display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'12px' }}>
                <CIcon icon={cilReload} size="sm" />
                Actualiser
              </CButton>
              <CButton size="sm" color="warning"
                onClick={() => { setCloseModal(true); setCloseResult(null) }}
                disabled={!filters.matiere}
                title={!filters.matiere ? 'Sélectionnez une matière d\'abord' : 'Clôturer le cours et marquer les absents'}
                style={{ borderRadius:'6px', display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'12px', fontWeight:600, color:'#92400e' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>
                </svg>
                Clôturer le cours
              </CButton>
            </div>
          </div>

          {/* Stats rapides */}
          {stats.total > 0 && (
            <div style={{ display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
              {[
                { label:'Présents', value:stats.present, bg:'#dcfce7', color:'#15803d', pct: Math.round(stats.present/stats.total*100) },
                { label:'Retards',  value:stats.late,    bg:'#fff3cd', color:'#92400e', pct: Math.round(stats.late/stats.total*100)    },
                { label:'Absents',  value:stats.absent,  bg:'#fee2e2', color:'#991b1b', pct: Math.round(stats.absent/stats.total*100)  },
                { label:'Total',    value:stats.total,   bg:'#f1f5f9', color:'#475569', pct: 100 },
              ].map(st => (
                <div key={st.label} style={{ background:st.bg, color:st.color, borderRadius:'10px', padding:'10px 18px', fontSize:'13px', fontWeight:600, minWidth:'90px' }}>
                  <div style={{ fontSize:'22px', fontWeight:800, lineHeight:1 }}>{st.value}</div>
                  <div style={{ fontSize:'11px', marginTop:'2px', opacity:0.8 }}>{st.label} {st.pct < 100 ? `(${st.pct}%)` : ''}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filtres */}
          <CCard className="mb-3 border-0 shadow-sm">
            <CCardBody>
              <AttendanceFilter
                filterOptions={filterOptions}
                selectedYear={filters.year} selectedFiliere={filters.filiere}
                selectedNiveau={filters.niveau} onFilterChange={handleFilterChange}
              />
              <CRow className="mt-3 g-2">
                <CCol md={6}>
                  <label className="form-label fw-semibold" style={{ fontSize:'13px' }}>Matière</label>
                  <Select options={matiereOptions}
                    value={matiereOptions.find(o => o.value === (filters.matiere || 'all')) || null}
                    onChange={opt => handleFilterChange('matiere', opt as SelectOption)}
                    placeholder="Toutes les matières" styles={selectStyles}
                    noOptionsMessage={() => 'Aucune matière'} />
                </CCol>
                <CCol md={6}>
                  <label className="form-label fw-semibold" style={{ fontSize:'13px' }}>Créneau</label>
                  <Select options={heureOptions}
                    value={heureOptions.find(o => o.value === (filters.heure || 'all')) || null}
                    onChange={opt => handleFilterChange('heure', opt as SelectOption)}
                    placeholder="Tous les créneaux" styles={selectStyles}
                    noOptionsMessage={() => 'Aucun créneau'} />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* Exports + Recherche */}
          <CRow className="mb-3 align-items-end g-3">
            <CCol xs={12} md={8}>
              <div className="d-flex gap-2 flex-wrap">
                {(['pdf','excel','word'] as const).map(fmt => (
                  <CButton key={fmt} color="primary" variant="outline" size="sm"
                    onClick={() => handleExport(fmt)} disabled={!!exportLoading}
                    style={{ borderRadius:'6px', fontSize:'13px', display:'inline-flex', alignItems:'center', gap:'6px' }}>
                    {exportLoading === fmt
                      ? <CSpinner size="sm" style={{ width:'14px', height:'14px' }} />
                      : <ExportIcon format={fmt} />}
                    Exporter {fmt.toUpperCase()}
                  </CButton>
                ))}
              </div>
            </CCol>
            <CCol xs={12} md={4}>
              <label className="form-label fw-semibold" style={{ fontSize:'14px' }}>Recherche</label>
              <CInputGroup>
                <CInputGroupText style={{ background:'#fff', border:'1px solid #dee2e6', borderRight:'none' }}>
                  <CIcon icon={cilSearch} size="sm" className="text-muted" />
                </CInputGroupText>
                <CFormInput placeholder="Nom, matricule ou matière..."
                  value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                  style={{ borderLeft:'none', borderRadius:'0 6px 6px 0' }} />
              </CInputGroup>
            </CCol>
          </CRow>

          {/* Tableau */}
          <CCard className="border-0" style={{ borderRadius:'6px', border:'1px solid #e2e8f0' }}>
            <CCardBody className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <CSpinner color="primary" size="sm" />
                  <span className="ms-2 text-muted">Chargement...</span>
                </div>
              ) : (
                <CTable hover responsive striped className="mb-0" style={{ fontSize:'13px' }}>
                  <CTableHead style={{ background:'#f8f9fa' }}>
                    <CTableRow>
                      <CTableHeaderCell className="ps-3">#</CTableHeaderCell>
                      <CTableHeaderCell>Matricule</CTableHeaderCell>
                      <CTableHeaderCell>Noms et Prénoms</CTableHeaderCell>
                      <CTableHeaderCell>Contact</CTableHeaderCell>
                      <CTableHeaderCell>Matière</CTableHeaderCell>
                      <CTableHeaderCell>Date</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Entrée</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Sortie</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Durée</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Statut</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Action</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {paginated.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={11} className="text-center py-5 text-muted">
                          <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'4px' }}>Aucun enregistrement</div>
                          <div style={{ fontSize:'13px' }}>Modifiez les filtres ou lancez un pointage.</div>
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      paginated.map((s, i) => (
                        <CTableRow key={s.id}
                          className={newScanIds.includes(s.id) ? 'new-scan-row' : ''}
                          style={{ background: s.status !== 'present' ? '#fffafa' : 'transparent' }}>
                          <CTableDataCell className="ps-3 text-muted">
                            {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                          </CTableDataCell>
                          <CTableDataCell><strong>{s.matricule || 'N/A'}</strong></CTableDataCell>
                          <CTableDataCell style={{ fontWeight:500 }}>{s.name}</CTableDataCell>
                          <CTableDataCell>
                            {s.phone
                              ? <a href={`tel:${s.phone}`} style={{ color:'#0d6efd', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                                  <CIcon icon={cilPhone} size="sm" />{s.phone}
                                </a>
                              : <span className="text-muted">—</span>}
                          </CTableDataCell>
                          <CTableDataCell style={{ fontSize:'12px' }}>{s.matiere || '—'}</CTableDataCell>
                          <CTableDataCell style={{ fontSize:'12px', whiteSpace:'nowrap' }}>{s.date || '—'}</CTableDataCell>
                          <CTableDataCell className="text-center" style={{ fontSize:'12px', color:'#15803d', fontWeight:600 }}>
                            {s.first_entry ? s.first_entry.substring(0,5) : <span className="text-muted">—</span>}
                          </CTableDataCell>
                          <CTableDataCell className="text-center" style={{ fontSize:'12px', color:'#dc2626', fontWeight:600 }}>
                            {s.last_exit ? s.last_exit.substring(0,5) : <span className="text-muted">—</span>}
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <DurationBadge minutes={s.total_minutes || 0} />
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <StatusBadge status={s.status} lateType={s.late_type} />
                          </CTableDataCell>

                          {/* ── Icône historique + Bouton Pointer ── */}
                          <CTableDataCell className="text-center" style={{ whiteSpace:'nowrap' }}>
                            {/* Icône historique */}
                            <button
                              onClick={() => openProfile(s)}
                              title="Voir l'historique de présences"
                              style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#15803d', borderRadius:'8px', padding:'6px 8px', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', marginRight:'6px' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                              </svg>
                            </button>
                            <button
                              title={s.fingerprint_index ? `Enregistrer la présence — Slot ${s.fingerprint_index}` : 'Empreinte non enregistrée — enrôlement requis'}
                              disabled={!s.fingerprint_index}
                              onClick={() => s.fingerprint_index && setScanStudent(s)}
                              style={{
                                background: s.fingerprint_index ? '#eff6ff' : '#f8fafc',
                                border: `1px solid ${s.fingerprint_index ? '#bfdbfe' : '#e2e8f0'}`,
                                color: s.fingerprint_index ? '#1d4ed8' : '#cbd5e1',
                                borderRadius:'8px',
                                padding:'6px 8px',
                                cursor: s.fingerprint_index ? 'pointer' : 'not-allowed',
                                display:'inline-flex',
                                alignItems:'center',
                                justifyContent:'center',
                                transition:'all 0.15s ease',
                              }}>
                              {/* Icône empreinte digitale SVG */}
                              <svg width="18" height="18" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M32 6C17.641 6 6 17.641 6 32c0 4.398 1.12 8.535 3.094 12.133C9.035 44.09 9 44.047 9 44c0-1.656 1.344-3 3-3s3 1.344 3 3c0 .39-.078.758-.211 1.102A25.928 25.928 0 0 1 12 32C12 20.953 20.953 12 32 12s20 8.953 20 20c0 3.543-.883 6.875-2.441 9.793A2.988 2.988 0 0 0 52 41c-1.656 0-3 1.344-3 3 0 .543.148 1.05.402 1.488C47.004 49.18 44.156 51.668 41 53.3V44c0-4.965-4.035-9-9-9s-9 4.035-9 9v12.695A25.867 25.867 0 0 1 12.895 49" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                <path d="M32 20c-6.617 0-12 5.383-12 12 0 1.656 1.344 3 3 3s3-1.344 3-3c0-3.309 2.691-6 6-6s6 2.691 6 6v18.332C36.719 51.398 34.398 52 32 52a19.9 19.9 0 0 1-3-.23V44c0-1.656-1.344-3-3-3s-3 1.344-3 3v6.367C19.883 47.133 16 39.996 16 32c0-1.656-1.344-3-3-3s-3 1.344-3 3c0 12.133 9.867 22 22 22 1.39 0 2.742-.129 4.055-.371" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                <path d="M32 28c-2.207 0-4 1.793-4 4v22.797a21.67 21.67 0 0 0 4 .371 21.67 21.67 0 0 0 4-.371V32c0-2.207-1.793-4-4-4z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-muted" style={{ fontSize:'13px' }}>
                Page {currentPage} / {totalPages} — {filtered.length} enregistrement(s)
              </span>
              <div className="d-flex gap-2">
                <CButton size="sm" color="light" disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  style={{ borderRadius:'6px', border:'1px solid #dee2e6', fontWeight:600 }}>Précédent</CButton>
                <CButton size="sm" color="light" disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  style={{ borderRadius:'6px', border:'1px solid #dee2e6', fontWeight:600 }}>Suivant</CButton>
              </div>
            </div>
          )}

        </CCardBody>
      </CCard>
    </CContainer>
  )
}

export default Management