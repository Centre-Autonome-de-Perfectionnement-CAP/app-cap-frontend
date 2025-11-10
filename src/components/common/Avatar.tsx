import React from 'react'
import { CAvatar } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser } from '@coreui/icons'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallbackIcon?: string[]
  className?: string
  shape?: 'rounded' | 'rounded-circle'
}

/**
 * Composant Avatar réutilisable
 * Affiche une photo ou un icône par défaut si aucune photo n'est fournie
 */
const Avatar: React.FC<AvatarProps> = ({
  src,
  size = 'md',
  fallbackIcon = cilUser,
  className = '',
  shape = 'rounded-circle',
}) => {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72,
  }

  const iconSizeMap: Record<'sm' | 'md' | 'lg' | 'xl', 'sm' | 'lg' | 'xl' | 'xxl'> = {
    sm: 'sm',
    md: 'lg',
    lg: 'xl',
    xl: 'xxl',
  }

  const avatarSize = sizeMap[size]
  const iconSize = iconSizeMap[size]

  if (src) {
    return (
      <CAvatar
        src={src}
        size={size}
        shape={shape}
        className={className}
        style={{ width: avatarSize, height: avatarSize }}
      />
    )
  }

  return (
    <CAvatar
      color="secondary"
      textColor="white"
      shape={shape}
      className={className}
      style={{ width: avatarSize, height: avatarSize }}
    >
      <CIcon icon={fallbackIcon} size={iconSize} />
    </CAvatar>
  )
}

export default Avatar
