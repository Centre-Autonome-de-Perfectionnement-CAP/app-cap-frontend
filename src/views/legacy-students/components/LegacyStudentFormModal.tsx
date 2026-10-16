import { useState, useEffect } from 'react'
import {
  CAlert,
  CButton,
  CCol,
  CForm,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from '@coreui/react'
import type { LegacyStudent, LegacyStudentFormData, LegacyFiliere } from '@/types/legacyStudent.types'

interface LegacyStudentFormModalProps {
  visible: boolean
  mode: 'create' | 'edit'
  student?: LegacyStudent | null
  filieres: LegacyFiliere[]
  onClose: () => void
  onSaved: (data: LegacyStudentFormData) => Promise<boolean>
}

const LegacyStudentFormModal = ({ visible, mode, student, filieres, onClose, onSaved }: LegacyStudentFormModalProps) => {
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [form, setForm] = useState<LegacyStudentFormData>({
    matricule: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    place_of_birth: '',
    cycle: '',
    email: '',
    phone: '',
    enrollment_year: '' as unknown as number,
    department_id: '',
    notes_admin: ''
  })

  // Réinitialiser le formulaire
  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && student) {
        setForm({
          matricule: student.matricule || '',
          first_name: student.first_name || '',
          last_name: student.last_name || '',
          date_of_birth: student.date_of_birth || '',
          place_of_birth: student.place_of_birth || '',
          cycle: student.cycle || '',
          email: student.email || '',
          phone: student.phone || '',
          enrollment_year: student.enrollment_year || '' as unknown as number,
          department_id: student.department?.id || '',
          notes_admin: student.notes_admin || ''
        })
      } else {
        setForm({
          matricule: '',
          first_name: '',
          last_name: '',
          date_of_birth: '',
          place_of_birth: '',
          cycle: '',
          email: '',
          phone: '',
          enrollment_year: '' as unknown as number,
          department_id: '',
          notes_admin: ''
        })
      }
      setErrors({})
    }
  }, [visible, mode, student])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!form.matricule.trim()) newErrors.matricule = 'Ce champ est requis.'
    if (!form.first_name.trim()) newErrors.first_name = 'Ce champ est requis.'
    if (!form.last_name.trim()) newErrors.last_name = 'Ce champ est requis.'
    
    if (!form.email.trim()) {
      newErrors.email = 'Ce champ est requis.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Format d\'email invalide.'
    }
    
    if (!form.phone.trim()) {
      newErrors.phone = 'Ce champ est requis.'
    } else {
      const phoneNoSpaces = form.phone.replace(/\s+/g, '')
      if (!/^\+?[0-9]{8,15}$/.test(phoneNoSpaces)) {
        newErrors.phone = 'Numéro de téléphone invalide (chiffres uniquement, 8 à 15 chiffres)'
      }
    }    

    if (!form.enrollment_year) {
      newErrors.enrollment_year = 'Ce champ est requis.'
    } else {
      const year = Number(form.enrollment_year)
      if (year > 2025) {
        newErrors.enrollment_year = 'L\'année doit être inférieure ou égale à 2025.'
      }
    }
    
    if (form.department_id === '') newErrors.department_id = 'La filière est obligatoire.'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    
    setSaving(true)
    try {
      const payload: LegacyStudentFormData = {
        ...form,
        enrollment_year: Number(form.enrollment_year)
      }
      
      const success = await onSaved(payload)
      if (success) {
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg" backdrop="static">
      <CModalHeader>
        <CModalTitle>
          {mode === 'create' ? 'Ajouter un ancien étudiant' : 'Modifier le dossier'}
        </CModalTitle>
      </CModalHeader>
      
      <CModalBody>
        {mode === 'create' && (
          <CAlert color="info" className="mb-4">
            Ce dossier sera créé avec le statut <strong>'Validé'</strong> directement.
          </CAlert>
        )}
        
        <CForm>
          <CRow className="g-3">
            <CCol md={6}>
              <CFormInput
                type="number"
                label="Année d'inscription (≤ 2025)"
                value={form.enrollment_year}
                onChange={e => setForm({ ...form, enrollment_year: e.target.value as unknown as number })}
                invalid={!!errors.enrollment_year}
              />
              {errors.enrollment_year && <div className="invalid-feedback d-block">{errors.enrollment_year}</div>}
            </CCol>
            
            <CCol md={6}>
              <CFormInput
                type="text"
                label="Matricule"
                value={form.matricule}
                onChange={e => setForm({ ...form, matricule: e.target.value.toUpperCase() })}
                invalid={!!errors.matricule}
              />
              {errors.matricule && <div className="invalid-feedback d-block">{errors.matricule}</div>}
            </CCol>
            
            <CCol md={6}>
              <CFormInput
                type="text"
                label="Nom de famille"
                value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value.toUpperCase() })}
                invalid={!!errors.last_name}
              />
              {errors.last_name && <div className="invalid-feedback d-block">{errors.last_name}</div>}
            </CCol>
            
            <CCol md={6}>
              <CFormInput
                type="text"
                label="Prénoms"
                value={form.first_name}
                onChange={e => setForm({ ...form, first_name: e.target.value })}
                invalid={!!errors.first_name}
              />
              {errors.first_name && <div className="invalid-feedback d-block">{errors.first_name}</div>}
            </CCol>

            <CCol md={6}>
              <CFormInput
                type="date"
                label="Date de naissance"
                value={form.date_of_birth || ''}
                onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                invalid={!!errors.date_of_birth}
              />
              {errors.date_of_birth && <div className="invalid-feedback d-block">{errors.date_of_birth}</div>}
            </CCol>

            <CCol md={6}>
              <CFormInput
                type="text"
                label="Lieu de naissance"
                placeholder="Ex: Cotonou, Porto-Novo..."
                value={form.place_of_birth || ''}
                onChange={e => setForm({ ...form, place_of_birth: e.target.value })}
                invalid={!!errors.place_of_birth}
              />
              {errors.place_of_birth && <div className="invalid-feedback d-block">{errors.place_of_birth}</div>}
            </CCol>
            
            <CCol md={6}>
              <CFormInput
                type="tel"
                label="Téléphone"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                invalid={!!errors.phone}
              />
              {errors.phone && <div className="invalid-feedback d-block">{errors.phone}</div>}
            </CCol>
            
            <CCol md={6}>
              <CFormInput
                type="email"
                label="Email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                invalid={!!errors.email}
              />
              {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
            </CCol>

            <CCol md={6}>
              <label className="form-label">Cycle d'études</label>
              <CFormSelect
                value={form.cycle || ''}
                onChange={(e) => {
                  const newCycle = e.target.value || undefined
                  const isDeptValid = filieres.some((f) => {
                    if (String(f.id) !== String(form.department_id)) return false
                    if (newCycle === 'Licence Professionnelle') return f.cycle_id === 1
                    if (newCycle === 'Master Professionnel') return f.cycle_id === 2
                    if (newCycle === 'Cycle Ingénieur - Prépa') return f.cycle_id === 3 && f.name.toLowerCase().startsWith('prépa')
                    if (newCycle === 'Cycle Ingénieur - Spécialité') return f.cycle_id === 3 && !f.name.toLowerCase().startsWith('prépa')
                    return true
                  })
                  setForm({
                    ...form,
                    cycle: newCycle,
                    department_id: isDeptValid ? form.department_id : '',
                  })
                }}
                invalid={!!errors.cycle}
              >
                <option value="">-- Choisir un cycle --</option>
                <option value="Licence Professionnelle">Licence Professionnelle</option>
                <option value="Master Professionnel">Master Professionnel</option>
                <option value="Cycle Ingénieur - Prépa">Cycle Ingénieur - Prépa</option>
                <option value="Cycle Ingénieur - Spécialité">Cycle Ingénieur - Spécialité</option>
              </CFormSelect>
              {errors.cycle && <div className="invalid-feedback d-block">{errors.cycle}</div>}
            </CCol>

            <CCol xs={12}>
              <label className="form-label">Filière</label>
              <CFormSelect
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value ? Number(e.target.value) : '' })}
                invalid={!!errors.department_id}
              >
                <option value="">-- Choisir une filière --</option>
                {filieres
                  .filter((f) => {
                    if (!form.cycle) return true
                    if (form.cycle === 'Licence Professionnelle') return f.cycle_id === 1
                    if (form.cycle === 'Master Professionnel') return f.cycle_id === 2
                    if (form.cycle === 'Cycle Ingénieur - Prépa') return f.cycle_id === 3 && f.name.toLowerCase().startsWith('prépa')
                    if (form.cycle === 'Cycle Ingénieur - Spécialité') return f.cycle_id === 3 && !f.name.toLowerCase().startsWith('prépa')
                    return true
                  })
                  .map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} {f.abbreviation ? `(${f.abbreviation})` : ''}
                    </option>
                  ))}
              </CFormSelect>
              {errors.department_id && <div className="invalid-feedback d-block">{errors.department_id}</div>}
            </CCol>

            <CCol xs={12}>
              <CFormTextarea
                label="Notes de l'administration (optionnel)"
                rows={3}
                value={form.notes_admin}
                onChange={e => setForm({ ...form, notes_admin: e.target.value })}
                invalid={!!errors.notes_admin}
              />
              {errors.notes_admin && <div className="invalid-feedback d-block">{errors.notes_admin}</div>}
            </CCol>
          </CRow>
        </CForm>
      </CModalBody>
      
      <CModalFooter>
        <CButton color="secondary" onClick={onClose} disabled={saving}>
          Annuler
        </CButton>
        <CButton color="primary" onClick={handleSave} disabled={saving}>
          {saving ? <CSpinner size="sm" className="me-2" /> : null}
          Enregistrer
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default LegacyStudentFormModal
