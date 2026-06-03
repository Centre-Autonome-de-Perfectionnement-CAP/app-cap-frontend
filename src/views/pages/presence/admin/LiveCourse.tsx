import { useState, useEffect, useRef } from 'react'
import {
  CCard, CCardBody, CRow, CCol, CSpinner, CContainer, CTable,
  CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
} from '@coreui/react'

const BASE_URL = 'http://localhost:8000/api/attendance'

// ── Animation CSS ─────────────────────────────────────────────────────────────
const liveCSS = `
  @keyframes pulse      { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
  @keyframes slideIn    { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes flashGreen { 0%{background:#dcfce7} 100%{background:transparent} }
  @keyframes flashOrange{ 0%{background:#fff3cd} 100%{background:transparent} }
  .row-new-present { animation: slideIn .4s ease, flashGreen 3s ease forwards; }
  .row-new-retard  { animation: slideIn .4s ease, flashOrange 3s ease forwards; }
`

// ── Badge statut ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status, lateType }: { status: string; lateType: string | null }) => {
  if (status !== 'present') return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#fee2e2', color:'#991b1b', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:600 }}>
      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#dc2626' }} />Absent
    </span>
  )
  if (lateType) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#fff3cd', color:'#92400e', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:600 }}>
      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#f59e0b' }} />Retard
    </span>
  )
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#dcfce7', color:'#15803d', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:600 }}>
      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#16a34a' }} />Présent
    </span>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE COURS EN DIRECT
// ════════════════════════════════════════════════════════════════════════════
const LiveCourse = () => {
  const [courseInfo,   setCourseInfo]   = useState<any>(null)
  const [students,     setStudents]     = useState<any[]>([])
  const [recentScans,  setRecentScans]  = useState<any[]>([])
  const [newIds,       setNewIds]       = useState<number[]>([])
  const [newRetardIds, setNewRetardIds] = useState<number[]>([])
  const [loading,      setLoading]      = useState(true)
  const [liveOk,       setLiveOk]       = useState(false)
  const [currentTime,  setCurrentTime]  = useState(new Date())
  const esRef = useRef<EventSource | null>(null)
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Horloge temps réel
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Charger les données du cours actif
  const fetchLiveData = async () => {
    try {
      const [sensorRes, studentsRes] = await Promise.all([
        fetch(`${BASE_URL}/sensor-status`),
        fetch(`${BASE_URL}/live-course`),
      ])
      const sensorData   = await sensorRes.json()
      const studentsData = await studentsRes.json()

      if (sensorData.success) setCourseInfo(sensorData.data)
      if (studentsData.success) setStudents(studentsData.data || [])
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLiveData() }, [])

  // SSE pour les nouveaux pointages
  useEffect(() => {
    const connect = () => {
      try {
        const es = new EventSource(`${BASE_URL}/live-stream`)
        esRef.current = es

        es.onopen = () => {
          setLiveOk(true)
          if (fallbackRef.current) { clearInterval(fallbackRef.current); fallbackRef.current = null }
        }

        es.addEventListener('scan', (e: MessageEvent) => {
          try {
            const scan = JSON.parse(e.data)

            // Ajouter au fil des scans récents
            setRecentScans(prev => [scan, ...prev].slice(0, 10))

            // Surligner la ligne selon le statut
            if (scan.late_type) {
              setNewRetardIds(prev => [...prev, scan.student_id])
              setTimeout(() => setNewRetardIds(prev => prev.filter(id => id !== scan.student_id)), 3000)
            } else {
              setNewIds(prev => [...prev, scan.student_id])
              setTimeout(() => setNewIds(prev => prev.filter(id => id !== scan.student_id)), 3000)
            }

            // Rafraîchir la liste
            fetchLiveData()
          } catch {}
        })

        es.onerror = () => {
          setLiveOk(false)
          es.close()
          if (!fallbackRef.current) fallbackRef.current = setInterval(fetchLiveData, 8000)
        }
      } catch {
        if (!fallbackRef.current) fallbackRef.current = setInterval(fetchLiveData, 8000)
      }
    }

    connect()
    return () => {
      esRef.current?.close()
      if (fallbackRef.current) clearInterval(fallbackRef.current)
    }
  }, [])

  // Stats en temps réel
  const present = students.filter(s => s.status === 'present' && !s.late_type).length
  const retard  = students.filter(s => s.status === 'present' && s.late_type).length
  const absent  = students.filter(s => s.status !== 'present').length
  const total   = students.length
  const pctP    = total > 0 ? Math.round(present / total * 100) : 0

  const pad = (n: number) => String(n).padStart(2, '0')
  const timeStr = `${pad(currentTime.getHours())}:${pad(currentTime.getMinutes())}:${pad(currentTime.getSeconds())}`

  return (
    <CContainer fluid className="p-4" style={{ background:'#f4f6f9', minHeight:'100vh' }}>
      <style>{liveCSS}</style>

      {/* ── En-tête ────────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h4 style={{ fontWeight:800, color:'#1e293b', margin:0 }}>
            Cours en Direct
          </h4>
          <div style={{ fontSize:'13px', color:'#64748b', marginTop:'2px' }}>
            Suivi des présences en temps réel
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          {/* Horloge */}
          <div style={{ background:'#1e293b', color:'#fff', borderRadius:'10px', padding:'8px 16px', fontFamily:'monospace', fontSize:'18px', fontWeight:700, letterSpacing:'2px' }}>
            {timeStr}
          </div>
          {/* Indicateur LIVE */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background: liveOk ? '#dcfce7' : '#f1f5f9', border:`1px solid ${liveOk ? '#bbf7d0' : '#e2e8f0'}`, borderRadius:'20px', padding:'6px 14px' }}>
            <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: liveOk ? '#16a34a' : '#94a3b8', animation: liveOk ? 'pulse 1.5s infinite' : 'none', display:'inline-block' }} />
            <span style={{ fontSize:'12px', fontWeight:700, color: liveOk ? '#15803d' : '#94a3b8' }}>
              {liveOk ? 'LIVE' : 'Connexion...'}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <CSpinner color="primary" />
          <div style={{ marginTop:'12px', color:'#94a3b8', fontSize:'14px' }}>Chargement...</div>
        </div>
      ) : (
        <>
          {/* ── Infos cours actif ─────────────────────────────────────────── */}
          {courseInfo?.active ? (
            <CCard className="shadow-sm border-0 mb-4" style={{ borderRadius:'12px', borderLeft:'4px solid #16a34a' }}>
              <CCardBody style={{ padding:'16px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'18px', fontWeight:800, color:'#1e293b' }}>{courseInfo.matiere}</div>
                    <div style={{ fontSize:'13px', color:'#64748b', marginTop:'3px' }}>
                      {courseInfo.start_time} → {courseInfo.end_time} · {courseInfo.salle}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <span style={{ background:'#dcfce7', color:'#15803d', borderRadius:'20px', padding:'4px 14px', fontSize:'12px', fontWeight:700 }}>
                      Cours actif
                    </span>
                    <span style={{ background: courseInfo.on_time ? '#dcfce7' : '#fff3cd', color: courseInfo.on_time ? '#15803d' : '#92400e', borderRadius:'20px', padding:'4px 14px', fontSize:'12px', fontWeight:700 }}>
                      {courseInfo.on_time ? "Pointages à l'heure" : 'Retards en cours'}
                    </span>
                  </div>
                </div>
              </CCardBody>
            </CCard>
          ) : (
            <CCard className="shadow-sm border-0 mb-4" style={{ borderRadius:'12px', borderLeft:'4px solid #94a3b8' }}>
              <CCardBody style={{ padding:'16px 24px', display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:'#94a3b8', flexShrink:0 }} />
                <div style={{ fontSize:'14px', color:'#64748b', fontWeight:600 }}>
                  Aucun cours actif en ce moment — les pointages seront enregistrés dès le début du prochain cours.
                </div>
              </CCardBody>
            </CCard>
          )}

          {/* ── KPI temps réel ────────────────────────────────────────────── */}
          <CRow className="g-3 mb-4">
            {[
              { label:'Total inscrits', value:total,   bg:'#f8fafc', color:'#334155', border:'#e2e8f0' },
              { label:'Présents',       value:present, bg:'#dcfce7', color:'#15803d', border:'#bbf7d0' },
              { label:'Retards',        value:retard,  bg:'#fff3cd', color:'#92400e', border:'#fde68a' },
              { label:'Absents',        value:absent,  bg:'#fee2e2', color:'#991b1b', border:'#fecaca' },
            ].map(({ label, value, bg, color, border }) => (
              <CCol key={label} xs={6} md={3}>
                <div style={{ background:bg, color, border:`1px solid ${border}`, borderRadius:'12px', padding:'16px 20px', textAlign:'center' }}>
                  <div style={{ fontSize:'36px', fontWeight:800, lineHeight:1 }}>{value}</div>
                  <div style={{ fontSize:'12px', marginTop:'4px', opacity:0.8 }}>{label}</div>
                </div>
              </CCol>
            ))}
          </CRow>

          {/* ── Barre progression présence ────────────────────────────────── */}
          {total > 0 && (
            <CCard className="shadow-sm border-0 mb-4" style={{ borderRadius:'12px' }}>
              <CCardBody style={{ padding:'16px 24px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                  <span style={{ fontSize:'13px', fontWeight:700, color:'#1e293b' }}>Progression des présences</span>
                  <span style={{ fontSize:'13px', fontWeight:700, color:'#1d4ed8' }}>{pctP}%</span>
                </div>
                <div style={{ height:'16px', borderRadius:'8px', overflow:'hidden', display:'flex', background:'#fee2e2' }}>
                  <div style={{ width:`${pctP}%`, background:'linear-gradient(90deg,#16a34a,#22c55e)', transition:'width 0.5s ease', borderRadius:'8px 0 0 8px' }} />
                  <div style={{ width:`${Math.round(retard/total*100)}%`, background:'#f59e0b', transition:'width 0.5s ease' }} />
                </div>
                <div style={{ display:'flex', gap:'16px', marginTop:'6px', fontSize:'11px' }}>
                  <span style={{ color:'#16a34a', fontWeight:600 }}>● {pctP}% présents</span>
                  <span style={{ color:'#f59e0b', fontWeight:600 }}>● {Math.round(retard/total*100)}% retards</span>
                  <span style={{ color:'#dc2626', fontWeight:600 }}>● {Math.round(absent/total*100)}% absents</span>
                </div>
              </CCardBody>
            </CCard>
          )}

          <CRow className="g-4">
            {/* ── Liste étudiants ───────────────────────────────────────── */}
            <CCol md={8}>
              <CCard className="shadow-sm border-0" style={{ borderRadius:'12px' }}>
                <CCardBody style={{ padding:'16px 24px' }}>
                  <h6 style={{ fontWeight:700, color:'#1e293b', marginBottom:'16px' }}>
                    Liste de présence
                    <span style={{ fontSize:'12px', color:'#94a3b8', fontWeight:400, marginLeft:'8px' }}>{total} étudiants</span>
                  </h6>
                  <div style={{ maxHeight:'500px', overflowY:'auto' }}>
                    <CTable hover responsive className="mb-0" style={{ fontSize:'13px' }}>
                      <CTableHead style={{ background:'#f8f9fa', position:'sticky', top:0 }}>
                        <CTableRow>
                          <CTableHeaderCell>Matricule</CTableHeaderCell>
                          <CTableHeaderCell>Nom et Prénoms</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Entrée</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Statut</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {students.length === 0 ? (
                          <CTableRow>
                            <CTableDataCell colSpan={4} className="text-center py-5 text-muted">
                              <div style={{ fontSize:'32px', marginBottom:'8px' }}>📋</div>
                              <div style={{ fontWeight:600 }}>En attente des pointages...</div>
                              <div style={{ fontSize:'12px', marginTop:'4px' }}>Les étudiants apparaîtront ici dès qu'ils poseront le doigt</div>
                            </CTableDataCell>
                          </CTableRow>
                        ) : (
                          // Trier : présents en haut, absents en bas
                          [...students]
                            .sort((a, b) => {
                              if (a.status === 'present' && b.status !== 'present') return -1
                              if (a.status !== 'present' && b.status === 'present') return 1
                              return 0
                            })
                            .map((s, i) => (
                              <CTableRow key={i}
                                className={
                                  newIds.includes(s.id)       ? 'row-new-present' :
                                  newRetardIds.includes(s.id) ? 'row-new-retard'  : ''
                                }
                                style={{ background: s.status !== 'present' ? '#fffafa' : 'transparent' }}>
                                <CTableDataCell><strong>{s.matricule}</strong></CTableDataCell>
                                <CTableDataCell>{s.name}</CTableDataCell>
                                <CTableDataCell className="text-center" style={{ color:'#15803d', fontWeight:600 }}>
                                  {s.first_entry ? s.first_entry.substring(0,5) : <span className="text-muted">—</span>}
                                </CTableDataCell>
                                <CTableDataCell className="text-center">
                                  <StatusBadge status={s.status} lateType={s.late_type} />
                                </CTableDataCell>
                              </CTableRow>
                            ))
                        )}
                      </CTableBody>
                    </CTable>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            {/* ── Fil des pointages récents ─────────────────────────────── */}
            <CCol md={4}>
              <CCard className="shadow-sm border-0" style={{ borderRadius:'12px' }}>
                <CCardBody style={{ padding:'16px 24px' }}>
                  <h6 style={{ fontWeight:700, color:'#1e293b', marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                    Pointages récents
                    {liveOk && (
                      <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#16a34a', animation:'pulse 1.5s infinite', display:'inline-block' }} />
                    )}
                  </h6>

                  {recentScans.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'32px 0', color:'#94a3b8' }}>
                      <div style={{ fontSize:'28px', marginBottom:'8px' }}>👆</div>
                      <div style={{ fontSize:'13px', fontWeight:600 }}>En attente...</div>
                      <div style={{ fontSize:'12px', marginTop:'4px' }}>Les pointages apparaîtront ici</div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {recentScans.map((scan, i) => (
                        <div key={i} style={{
                          padding:'10px 14px', borderRadius:'10px',
                          background: i === 0 ? (scan.late_type ? '#fff3cd' : '#dcfce7') : '#f8fafc',
                          border: `1px solid ${i === 0 ? (scan.late_type ? '#fde68a' : '#bbf7d0') : '#e2e8f0'}`,
                          animation: i === 0 ? 'slideIn .3s ease' : 'none',
                        }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:'13px', fontWeight:700, color:'#1e293b' }}>
                              {scan.student}
                            </span>
                            <span style={{ fontSize:'11px', color:'#94a3b8' }}>
                              {scan.scan_time?.substring(0,5)}
                            </span>
                          </div>
                          <div style={{ display:'flex', gap:'6px', marginTop:'4px', alignItems:'center' }}>
                            <span style={{ fontSize:'11px', color:'#64748b' }}>
                              {scan.scan_type === 'entry' ? '↗ Entrée' : '↙ Sortie'}
                            </span>
                            {scan.late_type && (
                              <span style={{ fontSize:'10px', background:'#fef3c7', color:'#92400e', borderRadius:'10px', padding:'1px 7px', fontWeight:600 }}>
                                Retard
                              </span>
                            )}
                            {!scan.late_type && scan.scan_type === 'entry' && (
                              <span style={{ fontSize:'10px', background:'#dcfce7', color:'#15803d', borderRadius:'10px', padding:'1px 7px', fontWeight:600 }}>
                                À l'heure
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </>
      )}
    </CContainer>
  )
}

export default LiveCourse
