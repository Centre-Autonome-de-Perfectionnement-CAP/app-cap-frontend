// src/views/pages/demandes/components/modal/ConfirmCheckbox.tsx

import { CFormCheck } from '@coreui/react'

interface Props {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
}

const ConfirmCheckbox = ({ id, checked, onChange, label }: Props) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
    <CFormCheck id={id} checked={checked} onChange={e => onChange(e.target.checked)} />
    <label htmlFor={id} style={{ marginBottom: 0, fontSize: '0.85rem', cursor: 'pointer' }}>{label}</label>
  </div>
)

export default ConfirmCheckbox
