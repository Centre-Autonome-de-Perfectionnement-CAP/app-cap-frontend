// src/views/pages/demandes/components/ui/StatCard.tsx
// REFONTE : cartes plus larges, mieux espacées, libellés non tronqués, rendu aéré et moderne.

interface Props {
  label: string
  count: number
  color: string
  bg: string
  text?: string
  icon?: React.ReactNode
  urgent?: boolean
  onClick?: () => void
}

const StatCard = ({
  label,
  count,
  color,
  bg,
  text,
  icon,
  urgent = false,
  onClick,
}: Props) => {
  const labelColor  = text ?? color
  const isAlerting  = urgent && count > 0

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
      style={{
        background: bg,
        border: `1px solid ${color}30`,
        borderLeft: `5px solid ${color}`,
        borderRadius: 12,
        /* Padding plus généreux — libellés respirent */
        padding: '14px 18px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        outline: 'none',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        /* Hauteur min augmentée pour éviter la compression verticale */
        minHeight: 80,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        ['--pulse-color' as any]: color,
      }}
      className={isAlerting ? 'stat-card-pulse' : ''}
      onMouseEnter={e => {
        if (!onClick) return
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-2px)'
        if (!isAlerting) el.style.boxShadow = `0 8px 24px ${color}33`
      }}
      onMouseLeave={e => {
        if (!onClick) return
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'none'
        if (!isAlerting) el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
      }}
    >
      <style>{`
        .stat-card-pulse {
          animation: statPulse 1.6s ease-in-out infinite;
        }
        @keyframes statPulse {
          0%, 100% {
            box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 0 0 0 var(--pulse-color);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 4px 14px rgba(0,0,0,0.12), 0 0 0 12px transparent;
            transform: scale(1.03);
          }
        }
      `}</style>

      {/* HEADER — label + icône */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        /* wrap autorisé pour libellés longs */
        flexWrap: 'wrap',
        color: labelColor,
        marginBottom: 8,
        fontWeight: 700,
        opacity: 0.92,
      }}>
        {icon && (
          <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 1 }}>
            {icon}
          </span>
        )}
        <span style={{
          fontSize: '0.875rem',
          lineHeight: 1.3,
          /* Pas de white-space: nowrap — on laisse le texte passer à la ligne */
        }}>
          {label}
        </span>
      </div>

      {/* COUNT */}
      <div style={{
        fontSize: isAlerting ? '2.6rem' : '2.2rem',
        fontWeight: 900,
        color,
        lineHeight: 1,
        transition: 'font-size 0.2s',
        letterSpacing: '-0.03em',
      }}>
        {count}
      </div>
    </div>
  )
}

export default StatCard
