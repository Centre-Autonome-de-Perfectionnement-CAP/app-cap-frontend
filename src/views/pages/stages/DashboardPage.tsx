// src/views/pages/stages/DashboardPage.tsx
// Tableau de bord du module Stages : chiffres clés, tâches en attente,
// assiduité, points d'attention ; demandes reçues sur 12 mois (responsable).
// Le superviseur voit ses propres stagiaires.

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CButton, CCard, CCardBody, CSpinner } from '@coreui/react'
import { CChartBar } from '@coreui/react-chartjs'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import CIcon from '@coreui/icons-react'
import {
  cilReload, cilBriefcase, cilMediaPlay, cilCalendar, cilClock, cilUserX, cilDescription, cilTask, cilBadge,
  cilWarning, cilChevronRight,
} from '@coreui/icons'
import StatCard from '@/views/pages/demandes/components/ui/StatCard'
import stageService, { type StagesDashboard, type DashboardAlert } from '@/services/stage.service'
import { friendlyError } from '@/components/common/ActionResult'
import StageDetailModal from './StageDetailModal'
import { PageHead, Empty, Pill, StagesStyles } from './StagesUi'
import { frDate } from './stageUtils'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const ALERT: Record<DashboardAlert['type'], { label: string; color: string; bg: string }> = {
  non_active:       { label: 'Non présenté',     color: '#be123c', bg: '#fff1f2' },
  assiduite:        { label: 'Assiduité',        color: '#c2410c', bg: '#fff7ed' },
  fin_proche:       { label: 'Fin proche',       color: '#7c3aed', bg: '#f5f3ff' },
  rapports:         { label: 'Rapports',         color: '#b45309', bg: '#fffbeb' },
  sans_superviseur: { label: 'Sans superviseur', color: '#475569', bg: '#f1f5f9' },
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

const DashboardPage = () => {
  const navigate = useNavigate()
  const [d, setD] = useState<StagesDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setD(await stageService.dashboard()) } catch (e) { setError(friendlyError(e)) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const todo = d ? [
    { label: 'Rapports à examiner', n: d.a_faire.rapports, icon: cilDescription, to: '/stages/rapports' },
    { label: 'Demandes des stagiaires', n: d.a_faire.demandes_stagiaires, icon: cilTask, to: '/stages/demandes-stagiaires' },
    ...(d.a_faire.attestations !== null ? [{ label: 'Attestations à valider', n: d.a_faire.attestations, icon: cilBadge, to: '/stages/attestations' }] : []),
    ...(d.lead ? [{ label: 'Demandes de stage à traiter', n: d.demandes.a_traiter, icon: cilBriefcase, to: '/stages/demandes' }] : []),
  ] : []

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title="Tableau de bord"
        subtitle={d ? `${frDate(d.today, true)}${d.lead ? '' : ' · vos stagiaires'}` : undefined}
        actions={<>
          {d?.lead && (
            <Pill color={d.requests_open ? '#047857' : '#b45309'} bg={d.requests_open ? '#ecfdf5' : '#fffbeb'}>
              {d.requests_open ? 'Demandes de stage ouvertes' : 'Demandes de stage fermées'}
            </Pill>
          )}
          <CButton color="secondary" variant="outline" size="sm" onClick={load} disabled={loading} title="Actualiser"><CIcon icon={cilReload} /></CButton>
        </>}
      />

      {error && <div className="stg-err">{error}</div>}
      {!d && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}

      {d && <>
        <div className="stg-cards">
          {d.lead && <StatCard label="Demandes à traiter" count={d.demandes.a_traiter} color="#2563eb" bg="#eff6ff"
            icon={<CIcon icon={cilBriefcase} style={{ width: 17 }} />} onClick={() => navigate('/stages/demandes')} />}
          <StatCard label="Stagiaires en cours" count={d.stagiaires.en_cours} color="#059669" bg="#ecfdf5"
            icon={<CIcon icon={cilMediaPlay} style={{ width: 17 }} />} onClick={() => navigate('/stages/suivi')} />
          <StatCard label="Fin dans 14 jours" count={d.stagiaires.fin_proche} color="#7c3aed" bg="#f5f3ff"
            icon={<CIcon icon={cilClock} style={{ width: 17 }} />} onClick={() => navigate('/stages/suivi')} />
          <StatCard label="À venir" count={d.stagiaires.a_venir} color="#0284c7" bg="#f0f9ff"
            icon={<CIcon icon={cilCalendar} style={{ width: 17 }} />} onClick={() => navigate('/stages/suivi?scope=upcoming')} />
          {d.stagiaires.sans_superviseur !== null && <StatCard label="Sans superviseur" count={d.stagiaires.sans_superviseur} color="#d97706" bg="#fffbeb"
            icon={<CIcon icon={cilUserX} style={{ width: 17 }} />} onClick={() => navigate('/stages/stagiaires')} />}
        </div>

        <div className="dash-grid">
          <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
            <CCardBody>
              <div className="dash-h">À faire</div>
              {todo.map(t => (
                <button key={t.to} type="button" className="dash-todo" onClick={() => navigate(t.to)}>
                  <CIcon icon={t.icon} style={{ width: 17, color: '#0f766e' }} />
                  <span style={{ flex: 1 }}>{t.label}</span>
                  <strong style={{ color: t.n > 0 ? '#0f172a' : '#94a3b8' }}>{t.n}</strong>
                  <CIcon icon={cilChevronRight} style={{ width: 14, color: '#94a3b8' }} />
                </button>
              ))}
            </CCardBody>
          </CCard>

          <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
            <CCardBody>
              <div className="dash-h">Assiduité des stagiaires en cours</div>
              {d.assiduite.moyenne === null
                ? <p className="stg-muted" style={{ margin: 0 }}>Pas encore assez de jours pour la mesurer.</p>
                : <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ whiteSpace: 'nowrap', fontSize: '2rem', fontWeight: 800, color: d.assiduite.moyenne >= d.seuil ? '#047857' : '#c2410c' }}>{d.assiduite.moyenne} %</span>
                    <span className="stg-muted">en moyenne (minimum attendu : {d.seuil} %)</span>
                  </div>
                  <div className="dash-bar"><span style={{ width: `${Math.min(100, d.assiduite.moyenne)}%`, background: d.assiduite.moyenne >= d.seuil ? '#10b981' : '#f97316' }} />
                    <i style={{ left: `${d.seuil}%` }} title={`Seuil : ${d.seuil} %`} /></div>
                  <p style={{ margin: '10px 0 0', fontSize: '.88rem' }}>
                    <strong style={{ color: d.assiduite.sous_seuil ? '#c2410c' : '#047857' }}>{d.assiduite.sous_seuil}</strong> stagiaire(s) sous le seuil, sur {d.assiduite.mesures} mesuré(s).
                  </p>
                </>}
              {d.lead && (
                <p className="stg-muted" style={{ margin: '10px 0 0' }}>
                  Cette année : {d.stagiaires.termines_annee} stage(s) terminé(s) · {d.demandes.acceptees} demande(s) acceptée(s) au total.
                </p>
              )}
            </CCardBody>
          </CCard>
        </div>

        <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <CCardBody>
            <div className="dash-h" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CIcon icon={cilWarning} style={{ width: 17, color: '#d97706' }} />Points d'attention
              {d.alertes_total > d.alertes.length && <span className="stg-muted" style={{ fontWeight: 500 }}>({d.alertes.length} sur {d.alertes_total})</span>}
            </div>
            {d.alertes.length === 0 && <Empty text="Rien à signaler pour les stagiaires en cours." />}
            <div className="stg-list">
              {d.alertes.map((a, i) => (
                <button key={`${a.type}-${a.stage_id}-${i}`} type="button" className="dash-alert" onClick={() => setOpenId(a.stage_id)}>
                  <Pill color={ALERT[a.type].color} bg={ALERT[a.type].bg}>{ALERT[a.type].label}</Pill>
                  <strong style={{ color: '#0f172a' }}>{a.nom}</strong>
                  <span className="stg-muted" style={{ flex: 1, minWidth: 180 }}>{a.detail}</span>
                  <CIcon icon={cilChevronRight} style={{ width: 14, color: '#94a3b8' }} />
                </button>
              ))}
            </div>
          </CCardBody>
        </CCard>

        {d.lead && d.mensuel.length > 0 && (
          <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
            <CCardBody>
              <div className="dash-h">Demandes de stage reçues (12 derniers mois)</div>
              <CChartBar
                style={{ height: 260 }}
                data={{
                  labels: d.mensuel.map(m => `${MONTHS[Number(m.mois.slice(5)) - 1]} ${m.mois.slice(2, 4)}`),
                  datasets: [
                    { label: 'Reçues', data: d.mensuel.map(m => m.recues), backgroundColor: '#93c5fd', borderRadius: 4, barPercentage: 0.6 },
                    { label: 'Acceptées', data: d.mensuel.map(m => m.acceptees), backgroundColor: '#0f766e', borderRadius: 4, barPercentage: 0.6 },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                  scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } },
                }}
              />
            </CCardBody>
          </CCard>
        )}
      </>}

      <StageDetailModal idOrRef={openId} onClose={() => setOpenId(null)} onChanged={load} />
      <style>{`
        .dash-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; }
        .dash-h { font-weight: 800; margin-bottom: 10px; color: #0f172a; }
        .dash-todo { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 4px; border-bottom: 1px solid #f1f5f9; cursor: pointer; font-size: .92rem; color: #334155; }
        .dash-todo:last-child { border-bottom: 0; }
        .dash-todo:hover, .dash-alert:hover { background: #f8fafc; }
        .dash-todo:focus-visible, .dash-alert:focus-visible { outline: 2px solid #0f766e; outline-offset: 2px; border-radius: 8px; }
        .dash-alert { all: unset; box-sizing: border-box; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border: 1px solid #eef2f7; border-radius: 12px; cursor: pointer; font-size: .9rem; }
        .dash-bar { position: relative; height: 10px; border-radius: 999px; background: #f1f5f9; margin-top: 8px; }
        .dash-bar span { position: absolute; inset: 0 auto 0 0; border-radius: 999px; }
        .dash-bar i { position: absolute; top: -4px; bottom: -4px; width: 2px; background: #334155; }
      `}</style>
    </div>
  )
}

export default DashboardPage
