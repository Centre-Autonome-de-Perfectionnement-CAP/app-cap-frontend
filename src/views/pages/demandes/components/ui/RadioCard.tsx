// src/views/pages/demandes/components/ui/RadioCard.tsx
// Carte-radio cliquable partagée : ChefCapDashboard, ResendModal…

interface Props {
  value: string
  selected: string
  onSelect: (v: string) => void
  label: React.ReactNode
  description?: string
  color?: string
  icon?: object
}

import CIcon from '@coreui/icons-react'

const RadioCard = ({ value, selected, onSelect, label, description, color = '#3b82f6', icon }: Props) => {
  const isSelected = selected === value
  return (
    <div
      onClick={() => onSelect(value)}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(value)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        border: `2px solid ${isSelected ? color : '#e5e7eb'}`,
        background: isSelected ? `${color}0d` : 'white',
        borderRadius: 10,
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        outline: 'none',
      }}
    >
      {/* Indicateur radio */}
      <div style={{
        marginTop: 2, width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${isSelected ? color : '#d1d5db'}`,
        background: isSelected ? color : 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {isSelected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />}
      </div>

      <div>
        <div style={{
          fontWeight: 600,
          fontSize: '0.87rem',
          color: isSelected ? color : '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: description ? 4 : 0,
        }}>
          {icon && <CIcon icon={icon} style={{ width: 14, height: 14 }} />}
          {label}
        </div>
        {description && (
          <div style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.5 }}>{description}</div>
        )}
      </div>
    </div>
  )
}

export default RadioCard
