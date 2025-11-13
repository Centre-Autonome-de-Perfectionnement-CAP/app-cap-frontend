import React from 'react'
import { CProgress, CProgressBar } from '@coreui/react'

interface ProgressBarProps {
  percentage: number
  showLabel?: boolean
  color?: string
  height?: number
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  showLabel = true,
  color,
  height = 20,
}) => {
  const getColor = () => {
    if (color) return color
    if (percentage >= 100) return 'success'
    if (percentage >= 75) return 'info'
    if (percentage >= 50) return 'warning'
    return 'danger'
  }

  return (
    <CProgress height={height} className="mb-2">
      <CProgressBar
        value={percentage}
        color={getColor()}
      >
        {showLabel && `${percentage.toFixed(0)}%`}
      </CProgressBar>
    </CProgress>
  )
}
