// src/views/pages/demandes/components/ui/ActionButton.tsx

import { useRef } from 'react'
import { CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'

interface Props {
  label: string
  icon?: string | string[]
  color?: string
  customBg?: string
  variant?: 'solid' | 'outline' | 'ghost'
  loading?: boolean
  disabled?: boolean
  onClick: () => void
  size?: 'sm' | 'lg'
}

const COLOR_HEX: Record<string, string> = {
  primary:   '#2563eb',
  success:   '#059669',
  danger:    '#dc2626',
  warning:   '#d97706',
  secondary: '#6b7280',
}

const ActionButton = ({
  label, icon,
  color = 'primary', customBg,
  variant = 'solid', loading = false, disabled = false,
  onClick, size,
}: Props) => {
  const ref = useRef<HTMLButtonElement>(null)
  const isDisabled = disabled || loading
  const hex = customBg ?? COLOR_HEX[color] ?? '#2563eb'
  const pad = size === 'sm' ? '4px 10px' : '6px 14px'
  const fs  = size === 'sm' ? '0.78rem'  : '0.88rem'

  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    borderRadius: 7, fontWeight: 600, fontSize: fs,
    padding: pad, cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', outline: 'none', opacity: isDisabled ? 0.7 : 1,
  }

  const styles: Record<string, React.CSSProperties> = {
    solid: {
      ...base,
      background: isDisabled ? '#d1d5db' : hex,
      border: `2px solid ${isDisabled ? '#d1d5db' : hex}`,
      color: '#ffffff',
    },
    outline: {
      ...base,
      background: 'transparent',
      border: `2px solid ${isDisabled ? '#d1d5db' : hex}`,
      color: isDisabled ? '#9ca3af' : hex,
    },
    ghost: {
      ...base,
      background: 'transparent',
      border: '2px solid transparent',
      color: isDisabled ? '#9ca3af' : hex,
    },
  }

  const handleEnter = () => {
    if (isDisabled || !ref.current) return
    if (variant === 'outline') {
      ref.current.style.background = hex
      ref.current.style.color = '#ffffff'  // blanc — jamais noir sur fond coloré
    } else if (variant === 'solid') {
      ref.current.style.opacity = '0.85'
    }
  }

  const handleLeave = () => {
    if (isDisabled || !ref.current) return
    if (variant === 'outline') {
      ref.current.style.background = 'transparent'
      ref.current.style.color = hex
    } else if (variant === 'solid') {
      ref.current.style.opacity = '1'
    }
  }

  return (
    <button
      ref={ref}
      style={styles[variant]}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {loading
        ? <><CSpinner size="sm" style={{ width: 14, height: 14 }} />En cours…</>
        : <>{icon && <CIcon icon={icon} style={{ width: 14, height: 14 }} />}{label}</>
      }
    </button>
  )
}

export default ActionButton
