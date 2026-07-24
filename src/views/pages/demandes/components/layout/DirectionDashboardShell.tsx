// src/views/pages/demandes/components/layout/DirectionDashboardShell.tsx
//
// Enveloppe commune aux 4 rôles direction.
// Fournit :
//   - Header institutionnel avec profil acteur bien visible (nom, rôle, avatar)
//   - Rangée de StatCards adaptées selon le rôle (cliquables → filtre actif)
//   - Zone principale (children)
//   - Pas de bouton portail — ces acteurs n'ont pas accès au portail

import React, { useState } from 'react'
import { CRow, CCol } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilUser, cilSync, cilWarning, cilFlagAlt,
  cilCheckCircle, cilXCircle, cilClock,
} from '@coreui/icons'
import { useAuth } from '@/contexts'
import capLogo from '@/assets/images/cap.png'
import type { DirectionStatsData } from '../../hooks/useDirectionStats'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatDef {
  key: keyof DirectionStatsData
  label: string
  icon: object
  color: string
  bg: string
  border: string
  urgent?: boolean
}

interface Props {
  /** Intitulé du rôle (affiché dans le header) */
  roleLabel: string
  /** Couleur accent du rôle (barre header + stat principale) */
  accentColor: string
  /** Action du rôle — ex: "Documents à transmettre" */
  actionLabel: string
  /** Stats calculées par useDirectionStats */
  stats: DirectionStatsData
  statsLoading: boolean
  /** Définitions des StatCards à afficher pour ce rôle */
  statDefs: StatDef[]
  children: React.ReactNode
  /** Filtre actif (clé de stat) — contrôlé depuis le parent */
  activeFilter?: keyof DirectionStatsData | null
  /** Callback quand une StatCard est cliquée */
  onFilterChange?: (key: keyof DirectionStatsData | null) => void
}

// ─── Utilitaire ───────────────────────────────────────────────────────────────

const getInitials = (nom: string, prenoms: string) => {
  const parts = [prenoms.split(' ')[0], nom].filter(Boolean)
  return parts.map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ─── StatCard ────────────────────────────────────────────────────────────────

interface StatCardProps extends StatDef {
  value: number
  loading: boolean
  active?: boolean
  onClick?: () => void
}

const StatCard = ({ label, icon, color, bg, border, urgent, value, loading, active, onClick }: StatCardProps) => {
  const isAlerting = urgent && value > 0
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
      style={{
        background: active ? color : bg,
        border: active ? `2px solid ${color}` : `1px solid ${border}`,
        /* Bordure gauche épaissie pour plus de présence */
        borderLeft: `5px solid ${color}`,
        borderRadius: 12,
        /* Padding généreux — libellés non compressés */
        padding: '14px 18px',
        /* Hauteur min augmentée */
        minHeight: 86,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        outline: 'none',
        transition: 'all 0.15s',
        boxShadow: isAlerting
          ? `0 2px 12px ${color}44`
          : active
            ? `0 6px 20px ${color}55`
            : '0 2px 8px rgba(0,0,0,0.06)',
        animation: isAlerting ? 'dirStatPulse 1.8s ease-in-out infinite' : 'none',
        ['--pulse-color' as any]: color,
        transform: active ? 'translateY(-3px)' : 'none',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        /* wrap autorisé — libellés longs passent à la ligne */
        flexWrap: 'wrap',
        color: active ? '#fff' : color,
        fontWeight: 700,
        opacity: 0.92,
        marginBottom: 8,
      }}>
        <CIcon icon={icon as any} style={{ width: 15, flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: '0.875rem', lineHeight: 1.3 }}>{label}</span>
      </div>
      <div style={{
        fontSize: isAlerting ? '2.6rem' : '2.2rem',
        fontWeight: 900,
        color: active ? '#fff' : color,
        lineHeight: 1,
        transition: 'font-size 0.2s',
        letterSpacing: '-0.03em',
      }}>
        {loading ? '—' : value}
      </div>
    </div>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────────

const DirHeader = ({
  roleLabel, accentColor, actionLabel,
}: { roleLabel: string; accentColor: string; actionLabel: string }) => {
  const { nom, prenoms, logout } = useAuth() as any
  const fullNom    = nom    ?? ''
  const fullPrenom = prenoms ?? ''
  const displayName = [fullPrenom, fullNom].filter(Boolean).join(' ') || 'Utilisateur'
  const initials    = getInitials(fullNom, fullPrenom)

  return (
    <>
      <style>{`
        @keyframes dirStatPulse {
          0%, 100% { box-shadow: 0 2px 8px rgba(0,0,0,0.07), 0 0 0 0 var(--pulse-color); transform: scale(1); }
          50%       { box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 0 0 8px transparent; transform: scale(1.025); }
        }
        .dir-logout-btn:hover {
          background: #dc2626 !important;
          color: #fff !important;
          border-color: #dc2626 !important;
        }
      `}</style>

      <header style={{
        background: 'linear-gradient(135deg, #0c1e3e 0%, #1a3a6b 60%, #0f4c8a 100%)',
        borderBottom: `3px solid ${accentColor}`,
        padding: '0 32px',
        height: 76,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}>

        {/* Gauche — logos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{
            background: '#fff', borderRadius: 10, padding: '5px 10px',
            display: 'flex', alignItems: 'center', height: 50,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <img src={capLogo} alt="CAP" style={{ height: 38, width: 'auto', objectFit: 'contain' }} />
          </div>
          <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.2)' }} />
          <div style={{
            border: `1.5px solid ${accentColor}99`,
            borderRadius: 8, padding: '5px 12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          }}>
            <span style={{
              fontSize: '1.05rem', fontWeight: 900,
              color: accentColor, letterSpacing: '0.12em', lineHeight: 1,
            }}>EPAC</span>
            <span style={{
              fontSize: '0.62rem', color: `${accentColor}99`,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              lineHeight: 1, textAlign: 'center',
            }}>École Polytechnique</span>
          </div>
        </div>

        {/* Centre — titre */}
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <div style={{
            fontSize: '1.25rem', fontWeight: 800, color: '#fff',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            letterSpacing: '-0.02em',
          }}>
            {actionLabel}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginTop: 1, fontWeight: 500 }}>
            CAP Demandes — Gestion documentaire
          </div>
        </div>

        {/* Droite — profil acteur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>

          {/* Bloc identité — bien visible */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.07)',
            border: `1px solid ${accentColor}55`,
            borderRadius: 10,
            padding: '8px 14px',
          }}>
            {/* Avatar */}
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
              border: `2px solid ${accentColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.82rem', fontWeight: 900, color: '#fff',
              flexShrink: 0,
              boxShadow: `0 2px 8px ${accentColor}66`,
            }}>
              {initials || <CIcon icon={cilUser} style={{ width: 18 }} />}
            </div>

            {/* Nom + rôle */}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.85rem', fontWeight: 800, color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: 180,
              }}>
                {displayName}
              </div>
              <div style={{
                fontSize: '0.875rem', color: accentColor,
                fontWeight: 600, marginTop: 1,
                whiteSpace: 'nowrap',
              }}>
                {roleLabel}
              </div>
            </div>
          </div>

          {/* Déconnexion */}
          <button
            className="dir-logout-btn"
            onClick={() => logout?.()}
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.25)',
              color: 'rgba(255,255,255,0.7)',
              borderRadius: 7,
              padding: '7px 15px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            Déconnexion
          </button>
        </div>
      </header>
    </>
  )
}

// ─── Shell principal ──────────────────────────────────────────────────────────

const DirectionDashboardShell = ({
  roleLabel, accentColor, actionLabel,
  stats, statsLoading, statDefs, children,
  activeFilter = null, onFilterChange,
}: Props) => (
  <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
    <DirHeader roleLabel={roleLabel} accentColor={accentColor} actionLabel={actionLabel} />

    <main style={{ flex: 1, padding: '32px 40px' }}>

      {/* Rangée de StatCards — colonnes adaptatives, gouttières généreuses */}
      <CRow className="mb-5 g-4">
        {statDefs.map(def => {
          const n  = statDefs.length
          const xs = 12
          const sm = n >= 6 ? 4 : 6
          const md = n >= 5 ? 4 : n >= 4 ? 6 : Math.floor(12 / n) || 4
          const lg = n >= 6 ? 2 : Math.floor(12 / n) || 3
          return (
          <CCol key={def.key} xs={xs} sm={sm} md={md} lg={lg}>
            <StatCard
              {...def}
              value={stats[def.key]}
              loading={statsLoading}
              active={activeFilter === def.key}
              onClick={onFilterChange ? () => onFilterChange(activeFilter === def.key ? null : def.key) : undefined}
            />
          </CCol>
          )
        })}
      </CRow>

      {/* Bandeau filtre actif */}
      {activeFilter && onFilterChange && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: 8, padding: '8px 16px', marginBottom: 16,
        }}>
          <span style={{ fontSize: '0.875rem', color: '#1d4ed8', fontWeight: 600 }}>
            Filtre actif : {statDefs.find(d => d.key === activeFilter)?.label ?? activeFilter}
          </span>
          <button
            onClick={() => onFilterChange(null)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: '#1d4ed8', cursor: 'pointer', fontSize: '0.875rem',
              fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            }}
          >
            ✕ Effacer
          </button>
        </div>
      )}

      {children}
    </main>
  </div>
)

// ─── Exports des définitions de stats par rôle ────────────────────────────────

export const SEC_DA_STAT_DEFS: StatDef[] = [
  {
    key: 'pendingAtMyLevel',
    label: 'À transmettre',
    icon: cilClock,
    color: '#9333ea', bg: '#faf5ff', border: '#d8b4fe',
  },
  {
    key: 'inCircuit',
    label: 'En circuit de correction',
    icon: cilSync,
    color: '#f97316', bg: '#fff7ed', border: '#fed7aa',
    urgent: true,
  },
  {
    key: 'hasFlag',
    label: 'Avec réserve',
    icon: cilFlagAlt,
    color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    urgent: true,
  },
  {
    key: 'totalInProgress',
    label: 'En circulation totale',
    icon: cilSync,
    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
  },
  {
    key: 'totalValidated',
    label: 'Transmis',
    icon: cilCheckCircle,
    color: '#059669', bg: '#ecfdf5', border: '#6ee7b7',
  },
  {
    key: 'totalRejected',
    label: 'Rejetés',
    icon: cilXCircle,
    color: '#dc2626', bg: '#fef2f2', border: '#fca5a5',
  },
]

export const DIRECTRICE_ADJOINTE_STAT_DEFS: StatDef[] = [
  {
    key: 'pendingAtMyLevel',
    label: 'À signer',
    icon: cilClock,
    color: '#6d28d9', bg: '#f5f3ff', border: '#c4b5fd',
  },
  {
    key: 'inCircuit',
    label: 'En circuit de correction',
    icon: cilSync,
    color: '#f97316', bg: '#fff7ed', border: '#fed7aa',
    urgent: true,
  },
  {
    key: 'hasFlag',
    label: 'Avec réserve',
    icon: cilFlagAlt,
    color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    urgent: true,
  },
  {
    key: 'totalInProgress',
    label: 'En circulation totale',
    icon: cilSync,
    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
  },
  {
    key: 'totalValidated',
    label: 'Signés',
    icon: cilCheckCircle,
    color: '#059669', bg: '#ecfdf5', border: '#6ee7b7',
  },
  {
    key: 'totalRejected',
    label: 'Rejetés',
    icon: cilXCircle,
    color: '#dc2626', bg: '#fef2f2', border: '#fca5a5',
  },
]

export const SEC_DIR_STAT_DEFS: StatDef[] = [
  {
    key: 'pendingAtMyLevel',
    label: 'À transmettre',
    icon: cilClock,
    color: '#c2410c', bg: '#fff7ed', border: '#fdba74',
  },
  {
    key: 'inCircuit',
    label: 'En circuit de correction',
    icon: cilSync,
    color: '#f97316', bg: '#fff7ed', border: '#fed7aa',
    urgent: true,
  },
  {
    key: 'hasFlag',
    label: 'Avec réserve',
    icon: cilFlagAlt,
    color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    urgent: true,
  },
  {
    key: 'totalInProgress',
    label: 'En circulation totale',
    icon: cilSync,
    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
  },
  {
    key: 'totalValidated',
    label: 'Transmis',
    icon: cilCheckCircle,
    color: '#059669', bg: '#ecfdf5', border: '#6ee7b7',
  },
  {
    key: 'totalRejected',
    label: 'Rejetés',
    icon: cilXCircle,
    color: '#dc2626', bg: '#fef2f2', border: '#fca5a5',
  },
]

export const DIRECTEUR_STAT_DEFS: StatDef[] = [
  {
    key: 'pendingAtMyLevel',
    label: 'À signer',
    icon: cilClock,
    color: '#15803d', bg: '#f0fdf4', border: '#6ee7b7',
  },
  {
    key: 'inCircuit',
    label: 'En circuit de correction',
    icon: cilSync,
    color: '#f97316', bg: '#fff7ed', border: '#fed7aa',
    urgent: true,
  },
  {
    key: 'hasFlag',
    label: 'Avec réserve',
    icon: cilFlagAlt,
    color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    urgent: true,
  },
  {
    key: 'totalInProgress',
    label: 'En circulation totale',
    icon: cilSync,
    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
  },
  {
    key: 'totalValidated',
    label: 'Documents prêts',
    icon: cilCheckCircle,
    color: '#059669', bg: '#ecfdf5', border: '#6ee7b7',
  },
  {
    key: 'totalRejected',
    label: 'Rejetés',
    icon: cilXCircle,
    color: '#dc2626', bg: '#fef2f2', border: '#fca5a5',
  },
]

export default DirectionDashboardShell
