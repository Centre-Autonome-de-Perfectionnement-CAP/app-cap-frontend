// src/components/forms/PasswordInput.tsx
// Champ mot de passe avec le bouton « œil » pour afficher ou masquer la saisie.

import { useState, type ComponentProps, type ReactNode } from 'react'
import { CButton, CFormInput, CInputGroup, CInputGroupText } from '@coreui/react'

type Props = Omit<ComponentProps<typeof CFormInput>, 'type' | 'prefix'> & {
  /** Élément affiché avant le champ (ex. icône de cadenas). */
  startIcon?: ReactNode
  groupClassName?: string
}

const Eye = ({ open }: { open: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {!open && <line x1="3" y1="3" x2="21" y2="21" />}
  </svg>
)

const PasswordInput = ({ startIcon, groupClassName, disabled, ...input }: Props) => {
  const [visible, setVisible] = useState(false)

  return (
    <CInputGroup className={groupClassName}>
      {startIcon && <CInputGroupText>{startIcon}</CInputGroupText>}
      <CFormInput {...input} disabled={disabled} type={visible ? 'text' : 'password'} />
      <CButton
        type="button"
        color="secondary"
        variant="outline"
        disabled={disabled}
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        title={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        <Eye open={!visible} />
      </CButton>
    </CInputGroup>
  )
}

export default PasswordInput
