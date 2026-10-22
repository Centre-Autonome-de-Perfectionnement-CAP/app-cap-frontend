// src/views/pages/stages/PhoneListField.tsx
// Saisie de numéros WhatsApp : un champ par numéro (invitations).

import { CButton, CFormInput } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilX } from '@coreui/icons'

export const MAX_PHONES = 30

/** Numéros renseignés (champs vides ignorés). */
export const filledPhones = (list: string[]) => list.map(s => s.trim()).filter(Boolean)

export const PhoneListField = ({ value, onChange, disabled }: {
  value: string[]
  onChange: (v: string[]) => void
  disabled?: boolean
}) => {
  const set = (i: number, v: string) => onChange(value.map((x, j) => (j === i ? v : x)))
  const remove = (i: number) => onChange(value.length > 1 ? value.filter((_, j) => j !== i) : [''])
  const add = () => { if (value.length < MAX_PHONES) onChange([...value, '']) }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {value.map((v, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <CFormInput
              type="tel"
              inputMode="tel"
              autoComplete="off"
              maxLength={20}
              value={v}
              disabled={disabled}
              aria-label={`Numéro WhatsApp ${i + 1}`}
              placeholder="Exemple : 01 97 00 00 00"
              onChange={e => set(i, e.target.value.replace(/[^\d+\s.-]/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
              autoFocus={i > 0 && i === value.length - 1 && v === ''}
            />
            {(value.length > 1 || v !== '') && (
              <CButton color="secondary" variant="ghost" size="sm" disabled={disabled}
                onClick={() => remove(i)} aria-label="Retirer ce numéro" title="Retirer ce numéro">
                <CIcon icon={cilX} />
              </CButton>
            )}
          </div>
        ))}
      </div>
      {value.length < MAX_PHONES && (
        <CButton color="primary" variant="ghost" size="sm" className="mt-2 px-1" disabled={disabled} onClick={add}>
          <CIcon icon={cilPlus} className="me-1" />Ajouter un numéro
        </CButton>
      )}
    </div>
  )
}
