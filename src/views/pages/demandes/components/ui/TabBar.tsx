// src/views/pages/demandes/components/ui/TabBar.tsx
// Barre d'onglets. Puise les couleurs dans STATUS_COLORS pour cohérence totale.

import CIcon from '@coreui/icons-react'
import { STATUS_COLORS, type TabConfig } from '../../constants/workflow'

interface Props {
  tabs: TabConfig[]
  activeKey: string
  counts: Record<string, number>
  onSelect: (key: string) => void
}

const TabBar = ({ tabs, activeKey, counts, onSelect }: Props) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '2px 0' }}>
    {tabs.map(tab => {
      const palette = STATUS_COLORS[tab.key] ?? { color: '#6b7280', bg: '#f9fafb', text: '#374151' }
      const isActive = activeKey === tab.key
      const count = counts[tab.key] || 0

      return (
        <button
          key={tab.key}
          onClick={() => onSelect(tab.key)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 11px',
            borderRadius: 20,
            cursor: 'pointer',
            fontSize: '0.74rem',
            fontWeight: isActive ? 700 : 400,
            border: `1.5px solid ${isActive ? palette.color : '#e5e7eb'}`,
            background: isActive ? palette.color : 'white',
            color: isActive ? 'white' : '#64748b',
            transition: 'all 0.15s ease',
            boxShadow: isActive ? `0 2px 10px ${palette.color}44` : 'none',
          }}
        >
          <CIcon icon={tab.icon} style={{ width: 12, height: 12, flexShrink: 0 }} />
          <span>{tab.label}</span>
          {count > 0 && (
            <span style={{
              background: isActive ? 'rgba(255,255,255,0.25)' : `${palette.color}20`,
              color: isActive ? 'white' : palette.color,
              borderRadius: 10,
              padding: '0 6px',
              fontSize: '0.66rem',
              fontWeight: 700,
              minWidth: 18,
              textAlign: 'center',
              lineHeight: '16px',
              display: 'inline-block',
            }}>
              {count}
            </span>
          )}
        </button>
      )
    })}
  </div>
)

export default TabBar
