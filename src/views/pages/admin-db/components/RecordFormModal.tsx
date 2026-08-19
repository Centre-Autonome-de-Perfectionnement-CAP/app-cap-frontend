// src/views/pages/admin-db/components/RecordFormModal.tsx
//
// Formulaire généré dynamiquement à partir des colonnes de la table
// (aucun champ codé en dur). id / created_at / updated_at sont en lecture
// seule et donc absents du formulaire.

import { useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CFormInput, CFormLabel, CFormTextarea, CFormSelect, CSpinner, CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSave, cilPencil, cilPlus } from '@coreui/icons'

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

  const isLongField = (colName: string) => {
    const n = colName.toLowerCase()
    return n.includes('description') || n.includes('bio') || n.includes('notes') || n.includes('comment') || n.includes('data') || n.includes('content')
  }

  return (
    <CModal visible onClose={onClose} alignment="center" size="xl">
      <CModalHeader style={{ borderBottom: '1.5px solid #f1f5f9', padding: '20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: initialValues ? '#eef2ff' : '#ecfdf5',
              color: initialValues ? '#4f46e5' : '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CIcon icon={initialValues ? cilPencil : cilPlus} style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <CModalTitle style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {initialValues ? `Modifier la ligne #${initialValues.id ?? ''}` : 'Ajouter une nouvelle entrée'}
            </CModalTitle>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Remplissez les champs ci-dessous puis validez l'enregistrement.
            </span>
          </div>
        </div>
      </CModalHeader>

      <CModalBody style={{ maxHeight: '68vh', overflowY: 'auto', padding: '24px 28px', background: '#f8fafc' }}>
        {error && (
          <CAlert color="danger" style={{ fontSize: '0.95rem', fontWeight: 600, borderRadius: 8, marginBottom: 20 }}>
            {error}
          </CAlert>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: editableColumns.length > 4 ? 'repeat(2, 1fr)' : '1fr',
            gap: 18,
          }}
        >
          {editableColumns.map((col) => {
            const isLong = isLongField(col)
            return (
              <div
                key={col}
                style={{
                  gridColumn: isLong && editableColumns.length > 4 ? 'span 2' : 'span 1',
                  background: '#ffffff',
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: '1.5px solid #e2e8f0',
                }}
              >
                <CFormLabel
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: '#334155',
                    fontFamily: 'monospace',
                    marginBottom: 6,
                    display: 'block',
                  }}
                >
                  {col}
                </CFormLabel>

                {col === 'chef_division_type' ? (
                  <CFormSelect
                    style={{
                      height: 38,
                      fontSize: '0.92rem',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      padding: '0 12px',
                    }}
                    value={values[col] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [col]: e.target.value }))}
                  >
                    <option value="">(Non défini)</option>
                    <option value="formation_distance">Formation à Distance (FAD)</option>
                    <option value="formation_continue">Formation Continue (FC)</option>
                  </CFormSelect>
                ) : isLong ? (
                  <CFormTextarea
                    rows={3}
                    style={{
                      fontSize: '0.92rem',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      padding: '8px 12px',
                    }}
                    value={values[col] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [col]: e.target.value }))}
                  />
                ) : (
                  <CFormInput
                    style={{
                      height: 38,
                      fontSize: '0.92rem',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      padding: '0 12px',
                    }}
                    value={values[col] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [col]: e.target.value }))}
                  />
                )}
              </div>
            )
          })}
        </div>

        {editableColumns.length === 0 && (
          <div style={{ fontSize: '1rem', color: '#6b7280', textAlign: 'center', padding: 24 }}>
            Aucun champ modifiable pour cette table.
          </div>
        )}
      </CModalBody>

      <CModalFooter style={{ borderTop: '1.5px solid #f1f5f9', padding: '16px 28px', background: '#ffffff' }}>
        <CButton
          color="light"
          style={{
            fontWeight: 700,
            fontSize: '0.95rem',
            border: '1.5px solid #cbd5e1',
            borderRadius: 8,
            padding: '8px 18px',
          }}
          onClick={onClose}
          disabled={saving}
        >
          Annuler
        </CButton>
        <CButton
          color="primary"
          style={{
            fontWeight: 700,
            fontSize: '0.95rem',
            borderRadius: 8,
            padding: '8px 20px',
            background: '#4f46e5',
            borderColor: '#4f46e5',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? <CSpinner size="sm" /> : <><CIcon icon={cilSave} /> Enregistrer</>}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default RecordFormModal
