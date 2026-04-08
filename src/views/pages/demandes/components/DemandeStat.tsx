// src/views/pages/demandes/components/DemandeStat.tsx
// Carte statistique cliquable, partagée par tous les dashboards.

interface Props {
  label: string
  count: number
  color: string
  bg: string
  onClick?: () => void
}

const DemandeStat = ({ label, count, color, bg, onClick }: Props) => (
  <div
    onClick={onClick}
    style={{
      background: bg,
      border: `1px solid ${color}22`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 8,
      padding: '12px 16px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.1s',
    }}
    onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
    onMouseLeave={e => onClick && (e.currentTarget.style.transform = 'none')}
  >
    <div className="text-muted small mb-1">{label}</div>
    <div className="fw-bold" style={{ fontSize: '2rem', color, lineHeight: 1 }}>
      {count}
    </div>
  </div>
)

export default DemandeStat
