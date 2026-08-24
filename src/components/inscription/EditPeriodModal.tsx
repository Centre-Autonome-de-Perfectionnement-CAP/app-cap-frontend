import React, { useState, useEffect } from 'react'
import {
  CRow,
  CCol,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CFormCheck,
  CFormLabel,
} from '@coreui/react'
import { FormModal } from '../modals'
import { FormDatePicker } from '../forms'

interface EditPeriodModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: {
    id?: number
    type: string
    old_start_date?: string
    old_end_date?: string
    start_date: string
    end_date: string
    departments: number[]
  }) => Promise<void>
  period: any
  filieres: any[]
  loading?: boolean
}

/**
 * EditPeriodModal - Modal de modification d'une période existante
 */
export const EditPeriodModal: React.FC<EditPeriodModalProps> = ({
  visible,
  onClose,
  onSubmit,
  period,
  filieres,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState('depot')
  const [periodStartDate, setPeriodStartDate] = useState<Date | null>(null)
  const [periodStartTime, setPeriodStartTime] = useState<Date | null>(null)
  const [periodEndDate, setPeriodEndDate] = useState<Date | null>(null)
  const [periodEndTime, setPeriodEndTime] = useState<Date | null>(null)
  const [selectedFilieres, setSelectedFilieres] = useState<number[]>([])

  useEffect(() => {
    if (period && visible) {
      setActiveTab(period.type || 'depot')

      // Helper: parse une date ISO "YYYY-MM-DD" sans décalage UTC
      const parseLocalDate = (raw: string): Date => {
        // Ajouter T12:00:00 pour éviter le décalage UTC→local qui peut changer le jour
        return new Date(raw.includes('T') ? raw : `${raw}T12:00:00`)
      }

      // Date de début
      if (period.start_raw) {
        setPeriodStartDate(parseLocalDate(period.start_raw))
      } else if (period.start) {
        const parts = period.start.split('/')
        if (parts.length === 3) {
          setPeriodStartDate(new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12))
        }
      }

      // Date de fin
      if (period.end_raw) {
        setPeriodEndDate(parseLocalDate(period.end_raw))
      } else if (period.end) {
        const parts = period.end.split('/')
        if (parts.length === 3) {
          setPeriodEndDate(new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12))
        }
      }

      // Heures par défaut
      const defaultStartTime = new Date()
      defaultStartTime.setHours(8, 0, 0, 0)
      setPeriodStartTime(defaultStartTime)

      const defaultEndTime = new Date()
      defaultEndTime.setHours(23, 59, 0, 0)
      setPeriodEndTime(defaultEndTime)

      // Filières
      if (Array.isArray(period.department_ids) && period.department_ids.length > 0) {
        setSelectedFilieres(period.department_ids)
      } else if (Array.isArray(period.departments) && period.departments.length > 0) {
        setSelectedFilieres(period.departments.map((d: any) => d.id || d))
      } else if (Array.isArray(period.filieres) && period.filieres.length > 0) {
        const matched = filieres
          .filter((f: any) => period.filieres.includes(f.abbreviation) || period.filieres.includes(f.name))
          .map((f: any) => f.id)
        setSelectedFilieres(matched.length > 0 ? matched : filieres.map((f: any) => f.id))
      } else {
        setSelectedFilieres(filieres.map((f: any) => f.id))
      }
    }
  }, [period, visible, filieres])

  const handleFiliereToggle = (filiereId: number) => {
    setSelectedFilieres((prev) =>
      prev.includes(filiereId) ? prev.filter((id) => id !== filiereId) : [...prev, filiereId]
    )
  }

  const handleSelectAllFilieres = () => {
    if (selectedFilieres.length === filieres.length) {
      setSelectedFilieres([])
    } else {
      setSelectedFilieres(filieres.map((f: any) => f.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!periodStartDate || !periodEndDate) return

    const formatDateTime = (date: Date, time: Date | null, defaultHour: number, defaultMinute: number) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const h = time ? String(time.getHours()).padStart(2, '0') : String(defaultHour).padStart(2, '0')
      const m = time ? String(time.getMinutes()).padStart(2, '0') : String(defaultMinute).padStart(2, '0')
      return `${year}-${month}-${day} ${h}:${m}:00`
    }

    // old_start_date doit être au format YYYY-MM-DD (pas dd/mm/yyyy)
    const toRaw = (raw: string | undefined, formatted: string | undefined) => {
      if (raw) return raw
      if (formatted) {
        const parts = formatted.split('/')
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`
      }
      return undefined
    }

    await onSubmit({
      id: period.id,
      type: activeTab,
      old_start_date: toRaw(period.start_raw, period.start),
      old_end_date:   toRaw(period.end_raw,   period.end),
      start_date: formatDateTime(periodStartDate, periodStartTime, 8, 0),
      end_date:   formatDateTime(periodEndDate,   periodEndTime,  23, 59),
      departments: selectedFilieres,
    })
  }

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={`Modifier la période (${activeTab === 'depot' ? 'Dépôt de dossiers' : 'Réclamation'})`}
      submitText="Enregistrer les modifications"
      loading={loading}
      size="lg"
    >
      {/* Onglets Type de période */}
      <CNav variant="tabs" className="mb-3">
        <CNavItem>
          <CNavLink
            active={activeTab === 'depot'}
            onClick={() => setActiveTab('depot')}
            style={{ cursor: 'pointer' }}
          >
            Dépôt de dossiers
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink
            active={activeTab === 'reclamation'}
            onClick={() => setActiveTab('reclamation')}
            style={{ cursor: 'pointer' }}
          >
            Période de réclamation
          </CNavLink>
        </CNavItem>
      </CNav>

      <CTabContent>
        <CTabPane visible={true}>
          {/* Dates et heures */}
          <CRow>
            <CCol md={6}>
              <FormDatePicker
                id="editPeriodStartDate"
                label="Date de début"
                selected={periodStartDate}
                onChange={setPeriodStartDate}
                required
              />
            </CCol>
            <CCol md={6}>
              <FormDatePicker
                id="editPeriodStartTime"
                label="Heure de début"
                selected={periodStartTime}
                onChange={setPeriodStartTime}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="HH:mm"
                required
              />
            </CCol>
          </CRow>

          <CRow>
            <CCol md={6}>
              <FormDatePicker
                id="editPeriodEndDate"
                label="Date de fin"
                selected={periodEndDate}
                onChange={setPeriodEndDate}
                minDate={periodStartDate || undefined}
                required
              />
            </CCol>
            <CCol md={6}>
              <FormDatePicker
                id="editPeriodEndTime"
                label="Heure de fin"
                selected={periodEndTime}
                onChange={setPeriodEndTime}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="HH:mm"
                required
              />
            </CCol>
          </CRow>

          {/* Sélection des filières (uniquement pour le dépôt) */}
          {activeTab === 'depot' && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <CFormLabel className="mb-0">Filières concernées</CFormLabel>
                <button
                  type="button"
                  onClick={handleSelectAllFilieres}
                  className="btn btn-sm btn-link p-0 text-decoration-none"
                >
                  {selectedFilieres.length === filieres.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>
              <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {filieres.map((filiere: any) => (
                  <CFormCheck
                    key={filiere.id || filiere}
                    id={`edit-filiere-${filiere.id || filiere}`}
                    label={filiere.name || filiere.title || filiere}
                    checked={selectedFilieres.includes(filiere.id || filiere)}
                    onChange={() => handleFiliereToggle(filiere.id || filiere)}
                    className="mb-2"
                  />
                ))}
              </div>
            </div>
          )}
        </CTabPane>
      </CTabContent>
    </FormModal>
  )
}

export default EditPeriodModal
