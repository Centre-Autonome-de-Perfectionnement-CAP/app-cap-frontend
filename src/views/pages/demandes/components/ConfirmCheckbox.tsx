// src/views/pages/demandes/components/ConfirmCheckbox.tsx
// Checkbox "J'ai vérifié" partagée par ChefCap et Directeur.

import { CFormCheck } from '@coreui/react'

interface Props {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
}

const ConfirmCheckbox = ({ id, checked, onChange, label }: Props) => (
  <div className="d-flex align-items-center gap-2 mt-3">
    <CFormCheck id={id} checked={checked} onChange={e => onChange(e.target.checked)} />
    <label htmlFor={id} className="mb-0 small">{label}</label>
  </div>
)

export default ConfirmCheckbox
