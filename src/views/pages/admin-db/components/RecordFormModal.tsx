// src/views/pages/admin-db/components/RecordFormModal.tsx
//
// Formulaire généré dynamiquement à partir des colonnes de la table
// (aucun champ codé en dur). id / created_at / updated_at sont en lecture
// seule et donc absents du formulaire.

import { useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CFormInput, CFormLabel, CSpinner, CAlert,
} from '@coreui/react'

interface Props {
  columns: string[]
  initialValues: Record<string, any> | null
  onClose: () => void
  onSubmit: (values: Record<string, any>) => Promise<void>
}

const READONLY_COLUMNS = ['id', 'created_at', 'updated_at']

const RecordFormModal = ({ columns, initialValues, onClose, onSubmit }: Props) => {
  const editableColumns = columns.filter((c) => !READONLY_COLUMNS.includes(c))

  const [values, setValues] = useState<Record<string, any>>(() => {
    const base: Record<string, any> = {}
    editableColumns.forEach((c) => {
      base[c] = initialValues?.[c] ?? ''
    })
    return base
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSubmit(values)
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <CModal visible onClose={onClose} alignment="center" size="lg">
      <CModalHeader>
        <CModalTitle style={{ fontSize: '1.35rem', fontWeight: 800 }}>
          {initialValues ? 'Modifier la ligne' : 'Nouvelle entrée'}
        </CModalTitle>
      </CModalHeader>
      <CModalBody style={{ maxHeight: '65vh', overflowY: 'auto' }}>
        {error && (
          <CAlert color="danger" style={{ fontSize: '1rem', fontWeight: 600 }}>
            {error}
          </CAlert>
        )}
        {editableColumns.map((col) => (
          <div key={col} style={{ marginBottom: 18 }}>
            <CFormLabel style={{ fontSize: '1.02rem', fontWeight: 700, color: '#374151' }}>
              {col}
            </CFormLabel>
            <CFormInput
              style={{ fontSize: '1.02rem', padding: '10px 14px', border: '2px solid #e5e7eb' }}
              value={values[col] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [col]: e.target.value }))}
            />
          </div>
        ))}
        {editableColumns.length === 0 && (
          <div style={{ fontSize: '1rem', color: '#6b7280' }}>
            Aucun champ modifiable pour cette table.
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton
          color="light"
          style={{ fontWeight: 700, fontSize: '1rem', border: '2px solid #e5e7eb' }}
          onClick={onClose}
          disabled={saving}
        >
          Annuler
        </CButton>
        <CButton
          color="primary"
          style={{ fontWeight: 700, fontSize: '1rem' }}
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? <CSpinner size="sm" /> : 'Enregistrer'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default RecordFormModal
