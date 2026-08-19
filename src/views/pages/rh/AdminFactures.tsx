import React, { useCallback, useEffect, useState } from 'react'
import {
  CSpinner, CAlert, CBadge,
} from '@coreui/react'
import RhService from '@/services/rh.service'
import type { FactureFile } from '@/types/rh.types'

// ─── CSS ──────────────────────────────────────────────────────────────────────

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
  .af-root * { box-sizing: border-box; }
  .af-root { font-family: 'DM Sans', sans-serif; color: #111827; }

  .af-btn { display:inline-flex; align-items:center; gap:6px; padding:0 16px; height:38px; border-radius:8px; border:none; font-size:13.5px; font-weight:600; cursor:pointer; transition:all .18s; white-space:nowrap; }
  .af-btn:disabled { opacity:.5; cursor:not-allowed; }
  .af-btn-ghost { background:transparent; color:#6b7280; border:1.5px solid #e5e7eb; }
  .af-btn-ghost:hover:not(:disabled) { background:#f9fafb; color:#111827; }

  .af-input { height:38px; padding:0 12px; border-radius:8px; border:1.5px solid #e5e7eb; font-size:13.5px; font-family:inherit; background:#fff; color:#111827; outline:none; transition:border-color .15s; }
  .af-input:focus { border-color:#1a1a2e; box-shadow:0 0 0 3px rgba(26,26,46,.08); }
  .af-select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; padding-right:36px; cursor:pointer; }

  .af-card { background:#fff; border-radius:14px; border:1px solid #e9ecef; overflow:hidden; }

  .af-table { width:100%; border-collapse:collapse; font-size:13.5px; }
  .af-table th { background:#f8f9ff; padding:13px 16px; font-size:11px; font-weight:700; color:#4a5568; text-transform:uppercase; letter-spacing:.05em; text-align:left; border-bottom:1px solid #e9ecef; }
  .af-table td { padding:15px 16px; border-bottom:1px solid #f3f4f6; vertical-align:middle; }
  .af-table tr:last-child td { border-bottom:none; }
  .af-table tr:hover td { background:#fafbff; }

  .af-file-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; text-decoration:none; transition:opacity .15s; margin-right:6px; margin-bottom:3px; }
  .af-file-badge:hover { opacity:.8; }

  .af-empty { text-align:center; padding:60px 32px; }
  .af-empty-icon { width:64px; height:64px; border-radius:50%; background:#f0f1ff; margin:0 auto 16px; display:flex; align-items:center; justify-content:center; }

  .af-filter-bar { display:flex; flex-wrap:wrap; gap:10px; align-items:flex-end; margin-bottom:20px; }
  .af-filter-group { display:flex; flex-direction:column; gap:4px; }
  .af-filter-label { font-size:11.5px; font-weight:600; color:#374151; }

  .af-stats { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:22px; }
  .af-stat-card { background:#fff; border:1px solid #e9ecef; border-radius:12px; padding:14px 20px; min-width:140px; }
  .af-stat-val { font-size:22px; font-weight:800; color:#1a1a2e; line-height:1; }
  .af-stat-lbl { font-size:12px; color:#718096; margin-top:4px; }
`

// ─── Types ────────────────────────────────────────────────────────────────────

interface FactureRow {
  contrat_id: number
  contrat_number: string
  status: string
  amount: number
  academic_year?: string
  cycle?: string
  professor_name: string
  professor_id?: number
  factures: FactureFile[]
  uploaded_at: string
  // Champs pour les filtres — récupérés via contrats enrichis
  department?: string
  filiere?: string
  class_name?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  signed:     { label: 'Signé',      color: '#065f46', bg: '#f0fdf4' },
  ongoing:    { label: 'En cours',   color: '#1e3a8a', bg: '#eff6ff' },
  pending:    { label: 'En attente', color: '#92400e', bg: '#fffbeb' },
  completed:  { label: 'Terminé',   color: '#374151', bg: '#f9fafb' },
  transfered: { label: 'Transféré', color: '#3b0764', bg: '#faf5ff' },
  cancelled:  { label: 'Rejeté',    color: '#7f1d1d', bg: '#fef2f2' },
}

const formatAmount = (a: number) => Number(a).toLocaleString('fr-FR') + ' FCFA'
const formatDate   = (d?: string) => {
  if (!d) return '—'
  const [y, m, day] = d.substring(0, 10).split('-')
  return `${day}/${m}/${y}`
}

// ─── Icônes SVG inline ────────────────────────────────────────────────────────
const Ico = {
  File:         () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  ExternalLink: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Filter:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  X:            () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
}

// ─── Composant badge fichier ──────────────────────────────────────────────────
const FileBadge: React.FC<{ fichier: FactureFile }> = ({ fichier }) => (
  <a
    href={fichier.url}
    target="_blank"
    rel="noopener noreferrer"
    className="af-file-badge"
    title={fichier.name}
    style={{
      background: '#f0f1ff',
      border: '1px solid #c7d2fe',
      color: '#3730a3',
    }}
  >
    <Ico.File />
    {fichier.type === 'facture' ? 'Facture' : fichier.type === 'rib' ? 'RIB' : 'Fichier'}
    <Ico.ExternalLink />
  </a>
)

// ─── Page principale ──────────────────────────────────────────────────────────

const AdminFactures: React.FC = () => {
  const [rows, setRows]       = useState<FactureRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // ── Filtres ────────────────────────────────────────────────────────────────
  const [searchProfessor, setSearchProfessor]   = useState('')
  const [filterYear, setFilterYear]             = useState('')
  const [filterCycle, setFilterCycle]           = useState('')
  const [filterStatus, setFilterStatus]         = useState('')

  // ── Options de filtres déduites des données ────────────────────────────────
  const [years, setYears]   = useState<string[]>([])
  const [cycles, setCycles] = useState<string[]>([])

  // ─── Chargement ─────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // On utilise getContrats (admin) et on filtre ceux qui ont des factures
      const res = await RhService.getContrats()
      const all = (res.data || []) as any[]

      const withFactures = all.filter((c: any) => {
        const f = c.factures_normalisees
        return f && Array.isArray(f) && f.length > 0
      })

      const mapped: FactureRow[] = withFactures.map((c: any) => {
        // Normaliser les entrées (compat string ou objet)
        const factures: FactureFile[] = (c.factures_normalisees || []).map((f: any) => {
          if (typeof f === 'string') {
            return { name: f, path: 'factures_normalisees/' + f, type: 'facture' as const, url: f }
          }
          return f as FactureFile
        })

        return {
          contrat_id:     c.id,
          contrat_number: c.contrat_number,
          status:         c.status,
          amount:         c.amount,
          academic_year:  c.academicYear?.academic_year ?? c.academic_year?.academic_year,
          cycle:          c.cycle?.name,
          professor_name: c.professor?.full_name ?? '—',
          professor_id:   c.professor?.id,
          factures,
          uploaded_at:    c.updated_at ?? '',
        }
      })

      setRows(mapped)

      // Dédupliquer les options de filtres
      setYears([...new Set(mapped.map(r => r.academic_year).filter(Boolean) as string[])])
      setCycles([...new Set(mapped.map(r => r.cycle).filter(Boolean) as string[])])
    } catch {
      setError('Impossible de charger les factures.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Filtrage local ─────────────────────────────────────────────────────────
  const filtered = rows.filter(r => {
    if (filterYear   && r.academic_year !== filterYear) return false
    if (filterCycle  && r.cycle !== filterCycle)        return false
    if (filterStatus && r.status !== filterStatus)      return false
    if (searchProfessor && !r.professor_name.toLowerCase().includes(searchProfessor.toLowerCase())) return false
    return true
  })

  const resetFilters = () => {
    setSearchProfessor('')
    setFilterYear('')
    setFilterCycle('')
    setFilterStatus('')
  }

  const hasFilters = searchProfessor || filterYear || filterCycle || filterStatus

  // ─── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div className="af-root" style={{ padding: '24px 0' }}>
      <style>{STYLE}</style>

      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontWeight: 800, fontSize: 22, color: '#1a1a2e', margin: 0 }}>
          Factures Normalisées
        </h4>
        <p style={{ color: '#718096', margin: '4px 0 0', fontSize: 14 }}>
          Toutes les factures déposées par les enseignants
        </p>
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="af-stats">
          <div className="af-stat-card">
            <div className="af-stat-val">{filtered.length}</div>
            <div className="af-stat-lbl">Contrat{filtered.length > 1 ? 's' : ''} avec facture</div>
          </div>
          <div className="af-stat-card">
            <div className="af-stat-val">
              {filtered.reduce((acc, r) => acc + r.factures.length, 0)}
            </div>
            <div className="af-stat-lbl">Fichier{filtered.reduce((a, r) => a + r.factures.length, 0) > 1 ? 's' : ''} déposé{filtered.reduce((a, r) => a + r.factures.length, 0) > 1 ? 's' : ''}</div>
          </div>
          <div className="af-stat-card">
            <div className="af-stat-val">
              {new Set(filtered.map(r => r.professor_name)).size}
            </div>
            <div className="af-stat-lbl">Enseignant{new Set(filtered.map(r => r.professor_name)).size > 1 ? 's' : ''}</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="af-filter-bar">
        {/* Recherche professeur */}
        <div className="af-filter-group" style={{ flex: '1 1 200px', minWidth: 180 }}>
          <div className="af-filter-label">Professeur</div>
          <input
            className="af-input"
            style={{ width: '100%' }}
            placeholder="Rechercher un professeur…"
            value={searchProfessor}
            onChange={e => setSearchProfessor(e.target.value)}
          />
        </div>

        {/* Année académique */}
        <div className="af-filter-group" style={{ minWidth: 160 }}>
          <div className="af-filter-label">Année académique</div>
          <select className="af-input af-select" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">Toutes les années</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Cycle */}
        <div className="af-filter-group" style={{ minWidth: 140 }}>
          <div className="af-filter-label">Cycle</div>
          <select className="af-input af-select" value={filterCycle} onChange={e => setFilterCycle(e.target.value)}>
            <option value="">Tous les cycles</option>
            {cycles.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Statut */}
        <div className="af-filter-group" style={{ minWidth: 150 }}>
          <div className="af-filter-label">Statut contrat</div>
          <select className="af-input af-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => (
              <option key={v} value={v}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Reset */}
        {hasFilters && (
          <div className="af-filter-group" style={{ justifyContent: 'flex-end' }}>
            <div className="af-filter-label" style={{ visibility: 'hidden' }}>.</div>
            <button className="af-btn af-btn-ghost" onClick={resetFilters}>
              <Ico.X /> Réinitialiser
            </button>
          </div>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <CAlert color="danger" style={{ borderRadius: 10, marginBottom: 20 }}>
          {error}
        </CAlert>
      )}

      {/* Chargement */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <CSpinner color="primary" />
          <p style={{ marginTop: 12, color: '#718096' }}>Chargement des factures…</p>
        </div>

      ) : filtered.length === 0 ? (
        <div className="af-card">
          <div className="af-empty">
            <div className="af-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#321fdb" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#2d3748', margin: '0 0 6px' }}>
              {hasFilters ? 'Aucun résultat pour ces filtres' : 'Aucune facture déposée'}
            </p>
            <p style={{ color: '#718096', fontSize: 13, margin: 0 }}>
              {hasFilters
                ? 'Essayez de modifier ou réinitialiser les filtres.'
                : 'Les factures déposées par les enseignants apparaîtront ici.'}
            </p>
          </div>
        </div>

      ) : (
        <div className="af-card">
          <div style={{ overflowX: 'auto' }}>
            <table className="af-table">
              <thead>
                <tr>
                  <th>Contrat</th>
                  <th>Professeur</th>
                  <th>Année / Cycle</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Fichiers</th>
                  <th>Déposé le</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const sc = STATUS_CONFIG[row.status] ?? { label: row.status, color: '#374151', bg: '#f9fafb' }
                  return (
                    <tr key={row.contrat_id}>

                      {/* Contrat */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 14 }}>
                          N° {row.contrat_number}
                        </div>
                      </td>

                      {/* Professeur */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#2d3748', fontSize: 13 }}>
                          {row.professor_name}
                        </div>
                      </td>

                      {/* Année / Cycle */}
                      <td>
                        <div style={{ fontSize: 13, color: '#4a5568' }}>{row.academic_year ?? '—'}</div>
                        {row.cycle && (
                          <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 2 }}>{row.cycle}</div>
                        )}
                      </td>

                      {/* Montant */}
                      <td>
                        <span style={{ fontWeight: 700, color: '#2d3748' }}>{formatAmount(row.amount)}</span>
                      </td>

                      {/* Statut */}
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 999,
                          fontSize: 12, fontWeight: 600,
                          color: sc.color, background: sc.bg,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
                          {sc.label}
                        </span>
                      </td>

                      {/* Fichiers */}
                      <td style={{ maxWidth: 260 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                          {row.factures.map((f, i) => <FileBadge key={i} fichier={f} />)}
                        </div>
                      </td>

                      {/* Date */}
                      <td>
                        <span style={{ fontSize: 13, color: '#718096' }}>
                          {formatDate(row.uploaded_at)}
                        </span>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminFactures