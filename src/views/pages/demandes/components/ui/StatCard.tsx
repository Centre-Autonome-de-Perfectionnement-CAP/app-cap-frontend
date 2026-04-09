// src/views/pages/demandes/components/ui/StatCard.tsx
// Carte statistique cliquable. Reçoit color/bg/text depuis STATUS_COLORS ou inline.

interface Props {
  label: string
  count: number
  color: string
  bg: string
  text?: string
  onClick?: () => void
}

const StatCard = ({ label, count, color, bg, text, onClick }: Props) => {
  const labelColor = text ?? color

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
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        outline: 'none',
      }}
      onMouseEnter={e => {
        if (!onClick) return
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = `0 6px 20px ${color}33`
      }}
      onMouseLeave={e => {
        if (!onClick) return
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'none'
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ fontSize: '0.73rem', color: labelColor, marginBottom: 5, fontWeight: 600, opacity: 0.85 }}>
        {label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>
        {count}
      </div>
    </div>
  )
}

export default StatCard
