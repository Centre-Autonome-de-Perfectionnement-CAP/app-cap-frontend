import React from 'react'
import { CBadge } from '@coreui/react'
import type { Conflict } from '@/types/emploi-du-temps.types'

interface ConflictBadgeProps {
  conflicts: Conflict[]
  onClick?: () => void
}

export const ConflictBadge: React.FC<ConflictBadgeProps> = ({ conflicts, onClick }) => {
  if (!conflicts || conflicts.length === 0) return null

  const getConflictColor = (type: string) => {
    switch (type) {
      case 'room':
        return 'danger'
      case 'professor':
        return 'warning'
      case 'class_group':
        return 'info'
      case 'capacity':
        return 'dark'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="d-flex gap-1 flex-wrap">
      {conflicts.map((conflict, index) => (
        <CBadge
          key={index}
          color={getConflictColor(conflict.type)}
          style={{ cursor: onClick ? 'pointer' : 'default' }}
          onClick={onClick}
          title={conflict.message}
        >
          Conflit: {conflict.type}
        </CBadge>
      ))}
    </div>
  )
}
