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
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 0' }}>
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
            gap: 9,
            padding: '7px 14px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '0.92rem',
            fontWeight: isActive ? 800 : 600,
            border: `1.5px solid ${isActive ? palette.color : '#cbd5e1'}`,
            background: isActive ? palette.color : 'white',
            color: isActive ? 'white' : '#334155',
            transition: 'all 0.15s ease',
            boxShadow: isActive ? `0 3px 12px ${palette.color}38` : 'none',
          }}
        >
          <CIcon icon={tab.icon} style={{ width: 15, height: 15, flexShrink: 0 }} />
          <span>{tab.label}</span>
          {count > 0 && (
            <span style={{
              background: isActive ? 'rgba(255,255,255,0.3)' : `${palette.color}20`,
              color: isActive ? 'white' : palette.color,
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: '0.85rem',
              fontWeight: 800,
              minWidth: 20,
              textAlign: 'center',
              lineHeight: '14px',
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
