// src/views/pages/demandes/components/ui/StatCard.tsx

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
  const labelColor = text ?? color
  const isAlerting = urgent && count > 0

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
      style={{
        background: bg,
        border: `1px solid ${color}30`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 10,
        padding: '14px 18px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        outline: 'none',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 88,

        // 👉 variable CSS pour animation
        ['--pulse-color' as any]: color,
      }}
      className={isAlerting ? 'stat-card-pulse' : ''}
      onMouseEnter={e => {
        if (!onClick) return
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-2px)'
        if (!isAlerting) el.style.boxShadow = `0 6px 20px ${color}33`
      }}
      onMouseLeave={e => {
        if (!onClick) return
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'none'
        if (!isAlerting) el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'
      }}
    >
      {/* CSS GLOBAL UNE SEULE FOIS */}
      <style>{`
        .stat-card-pulse {
          animation: statPulse 1.6s ease-in-out infinite;
        }

        @keyframes statPulse {
          0%, 100% {
            box-shadow:
              0 2px 8px rgba(0,0,0,0.08),
              0 0 0 0 var(--pulse-color);
            transform: scale(1);
          }

          50% {
            box-shadow:
              0 4px 14px rgba(0,0,0,0.12),
              0 0 0 12px transparent;
            transform: scale(1.03);
          }
        }
      `}</style>

      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.73rem',
          color: labelColor,
          marginBottom: 6,
          fontWeight: 600,
          opacity: 0.85,
        }}
      >
        {icon && (
          <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {icon}
          </span>
        )}
        {label}
      </div>

      {/* COUNT */}
      <div
        style={{
          fontSize: isAlerting ? '2.4rem' : '2rem',
          fontWeight: 800,
          color,
          lineHeight: 1,
          transition: 'font-size 0.2s',
        }}
      >
        {count}
      </div>
    </div>
  )
}

export default StatCard