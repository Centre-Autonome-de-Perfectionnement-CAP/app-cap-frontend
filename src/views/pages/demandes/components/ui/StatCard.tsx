// src/views/pages/demandes/components/ui/StatCard.tsx
// Carte de statistique des tableaux de bord Demandes : compacte, claire,
// pastille d'icône colorée, grand chiffre, libellé dessous.
// `blink` (secrétaire uniquement) : la carte clignote doucement tant qu'il y
// a des dossiers à traiter (count > 0).

interface Props {
  label: string
  count: number
  color: string
  bg: string
  text?: string
  icon?: React.ReactNode
  /** Clignote quand count > 0 (réservé au tableau de bord de la secrétaire). */
  blink?: boolean
  /** @deprecated conservé pour compatibilité : n'a plus d'effet visuel. */
  urgent?: boolean
  /** Carte correspondant à l'onglet affiché. */
  active?: boolean
  onClick?: () => void
}

const StatCard = ({
  label, count, color, bg, icon,
  blink = false, active = false, onClick,
}: Props) => {
  const alerting = blink && count > 0

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
      className={`dmd-stat${onClick ? ' dmd-stat--click' : ''}${alerting ? ' dmd-stat--blink' : ''}`}
      style={{
        ['--stat-color' as any]: color,
        ['--stat-bg' as any]: bg,
        position: 'relative',
        height: '100%',
        minHeight: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: '#fff',
        borderRadius: 12,
        border: `1px solid ${active || alerting ? color : '#e6ebf2'}`,
        boxShadow: active ? `0 0 0 3px ${color}22, 0 6px 18px rgba(15,23,42,0.06)` : '0 1px 3px rgba(15,23,42,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        outline: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .dmd-stat { transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
        .dmd-stat::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
          background: var(--stat-color); opacity: .9;
        }
        .dmd-stat--click:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(15,23,42,0.09); }
        .dmd-stat--click:focus-visible { box-shadow: 0 0 0 3px rgba(37,99,235,.35); }
        .dmd-stat--blink { animation: dmdStatBlink 1.4s ease-in-out infinite; }
        @keyframes dmdStatBlink {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--stat-color) 45%, transparent); background: #fff; }
          50%      { box-shadow: 0 0 0 5px color-mix(in srgb, var(--stat-color) 0%, transparent); background: var(--stat-bg); }
        }
        .dmd-stat-dot {
          position: absolute; top: 8px; right: 8px; width: 8px; height: 8px; border-radius: 50%;
          background: var(--stat-color);
        }
        .dmd-stat-dot::after {
          content: ''; position: absolute; inset: 0; border-radius: 50%;
          background: var(--stat-color); animation: dmdStatDot 1.4s ease-out infinite;
        }
        @keyframes dmdStatDot { from { transform: scale(1); opacity: .7 } to { transform: scale(2.6); opacity: 0 } }
        @media (prefers-reduced-motion: reduce) {
          .dmd-stat--blink, .dmd-stat-dot::after { animation: none; }
        }
      `}</style>

      {icon && (
        <span style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: bg, color,
        }}>
          {icon}
        </span>
      )}

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: '1.3rem', fontWeight: 800, lineHeight: 1.05,
          color: count > 0 ? '#0f172a' : '#94a3b8', letterSpacing: '-0.02em',
        }}>
          {count}
        </div>
        <div style={{
          marginTop: 2, fontSize: '0.74rem', fontWeight: 600, lineHeight: 1.2,
          color: '#64748b',
        }}>
          {label}
        </div>
      </div>

      {alerting && <span className="dmd-stat-dot" aria-hidden="true" />}
    </div>
  )
}

export default StatCard
