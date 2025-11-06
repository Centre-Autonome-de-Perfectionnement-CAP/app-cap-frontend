import React from 'react'
import { CSpinner } from '@coreui/react'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'lg'
  color?: string
  fullPage?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Chargement des données...',
  size,
  color = 'primary',
  fullPage = false,
}) => {
  const spinnerSize = size || (fullPage ? 'lg' : undefined)

  const content = (
    <div className="text-center">
      <CSpinner color={color} size={spinnerSize} />
      {message && <p className="mt-3 text-muted">{message}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '400px' }}
      >
        {content}
      </div>
    )
  }

  return content
}

export default LoadingSpinner
