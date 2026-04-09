import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormLabel,
  CFormSelect,
  CFormInput,
  CFormCheck,
  CButton,
  CSpinner,
  CAlert,
  CProgress,
  CListGroup,
  CListGroupItem,
} from '@coreui/react'
import { cilReload } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import EmploiDuTempsService from '@/services/emploi-du-temps.service'
import InscriptionService from '@/services/inscription.service'
import Swal from 'sweetalert2'

const RenewSchedule: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [sourceYearId, setSourceYearId] = useState<number>(0)
  const [targetYearId, setTargetYearId] = useState<number>(0)
  const [dateOffset, setDateOffset] = useState<number>(365)
  const [checkConflicts, setCheckConflicts] = useState<boolean>(true)
  const [ignoreConflicts, setIgnoreConflicts] = useState<boolean>(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    loadAcademicYears()
  }, [])

  const loadAcademicYears = async () => {
    try {
      const response = await InscriptionService.getAcademicYears({ per_page: 100 })
      setAcademicYears(response.data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des années académiques:', error)
    }
  }

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sourceYearId || !targetYearId) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez sélectionner les deux années académiques',
      })
      return
    }

    if (sourceYearId === targetYearId) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Les années source et cible doivent être différentes',
      })
      return
    }

    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Confirmer la reconduction',
      html: `
        <p>Vous êtes sur le point de reconduire l'emploi du temps.</p>
        <p><strong>Année source:</strong> ${academicYears.find((y) => y.id === sourceYearId)?.name}</p>
        <p><strong>Année cible:</strong> ${academicYears.find((y) => y.id === targetYearId)?.name}</p>
        <p><strong>Décalage:</strong> ${dateOffset} jours</p>
        ${checkConflicts ? '<p>✅ Vérification des conflits activée</p>' : '<p>⚠️ Vérification des conflits désactivée</p>'}
        ${ignoreConflicts ? '<p>⚠️ Les conflits seront ignorés</p>' : ''}
      `,
      showCancelButton: true,
      confirmButtonText: 'Oui, reconduire',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#0d6efd',
    })

    if (!confirm.isConfirmed) return

    setLoading(true)
    setResult(null)

    try {
      const response = await EmploiDuTempsService.renewSchedule({
        source_academic_year_id: sourceYearId,
        target_academic_year_id: targetYearId,
        date_offset: dateOffset,
        check_conflicts: checkConflicts,
        ignore_conflicts: ignoreConflicts,
      })

      setResult(response)

      Swal.fire({
        icon: response.created > 0 ? 'success' : 'warning',
        title: 'Reconduction terminée',
        html: `
          <p><strong>${response.created}</strong> cours créés</p>
          <p><strong>${response.skipped}</strong> cours ignorés</p>
          <p><strong>${response.total}</strong> cours traités</p>
        `,
      })
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || 'Erreur lors de la reconduction',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <CIcon icon={cilReload} className="me-2" />
            <strong>Reconduire l'Emploi du Temps</strong>
          </CCardHeader>
          <CCardBody>
            <CAlert color="info" className="mb-4">
              <strong>ℹ️ Information</strong>
              <p className="mb-0">
                Cette fonctionnalité permet de copier automatiquement l'emploi du temps d'une année
                académique vers une nouvelle année. Les cours seront recréés avec les mêmes
                créneaux, salles et professeurs, mais avec des dates décalées.
              </p>
            </CAlert>

            <CForm onSubmit={handleRenew}>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="sourceYear">Année académique source *</CFormLabel>
                  <CFormSelect
                    id="sourceYear"
                    value={sourceYearId}
                    onChange={(e) => setSourceYearId(parseInt(e.target.value))}
                    required
                  >
                    <option value={0}>Sélectionner l'année source...</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name} ({year.start_date} - {year.end_date})
                      </option>
                    ))}
                  </CFormSelect>
                  <small className="text-muted">
                    L'année dont vous voulez copier l'emploi du temps
                  </small>
                </CCol>

                <CCol md={6}>
                  <CFormLabel htmlFor="targetYear">Année académique cible *</CFormLabel>
                  <CFormSelect
                    id="targetYear"
                    value={targetYearId}
                    onChange={(e) => setTargetYearId(parseInt(e.target.value))}
                    required
                  >
                    <option value={0}>Sélectionner l'année cible...</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id} disabled={year.id === sourceYearId}>
                        {year.name} ({year.start_date} - {year.end_date})
                      </option>
                    ))}
                  </CFormSelect>
                  <small className="text-muted">
                    L'année vers laquelle copier l'emploi du temps
                  </small>
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="dateOffset">Décalage en jours</CFormLabel>
                  <CFormInput
                    type="number"
                    id="dateOffset"
                    value={dateOffset}
                    onChange={(e) => setDateOffset(parseInt(e.target.value))}
                    min="1"
                    required
                  />
                  <small className="text-muted">
                    Nombre de jours à ajouter aux dates (365 = 1 an)
                  </small>
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormCheck
                    id="checkConflicts"
                    label="Vérifier les conflits avant création"
                    checked={checkConflicts}
                    onChange={(e) => setCheckConflicts(e.target.checked)}
                  />
                  <small className="text-muted">
                    Recommandé : vérifie les conflits de salle, professeur et groupe
                  </small>
                </CCol>

                {checkConflicts && (
                  <CCol md={6}>
                    <CFormCheck
                      id="ignoreConflicts"
                      label="Ignorer les conflits et créer quand même"
                      checked={ignoreConflicts}
                      onChange={(e) => setIgnoreConflicts(e.target.checked)}
                    />
                    <small className="text-muted text-danger">
                      ⚠️ Attention : peut créer des doublons
                    </small>
                  </CCol>
                )}
              </CRow>

              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <CButton
                  color="primary"
                  type="submit"
                  disabled={loading || !sourceYearId || !targetYearId}
                >
                  {loading ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Reconduction en cours...
                    </>
                  ) : (
                    <>
                      <CIcon icon={cilReload} className="me-2" />
                      Lancer la reconduction
                    </>
                  )}
                </CButton>
              </div>
            </CForm>

            {result && (
              <div className="mt-4">
                <CAlert color={result.created > 0 ? 'success' : 'warning'}>
                  <h5>Résultat de la reconduction</h5>
                  <CProgress className="mb-3">
                    <CProgress
                      color="success"
                      value={(result.created / result.total) * 100}
                      label={`${result.created} créés`}
                    />
                    <CProgress
                      color="warning"
                      value={(result.skipped / result.total) * 100}
                      label={`${result.skipped} ignorés`}
                    />
                  </CProgress>
                  <p>
                    <strong>{result.created}</strong> cours créés sur <strong>{result.total}</strong>{' '}
                    cours traités
                  </p>
                  <p>
                    <strong>{result.skipped}</strong> cours ignorés
                  </p>
                </CAlert>

                {result.errors && result.errors.length > 0 && (
                  <CAlert color="danger">
                    <h6>Erreurs rencontrées ({result.errors.length})</h6>
                    <CListGroup>
                      {result.errors.slice(0, 10).map((error: string, index: number) => (
                        <CListGroupItem key={index}>
                          <small>{error}</small>
                        </CListGroupItem>
                      ))}
                      {result.errors.length > 10 && (
                        <CListGroupItem>
                          <small className="text-muted">
                            ... et {result.errors.length - 10} autres erreurs
                          </small>
                        </CListGroupItem>
                      )}
                    </CListGroup>
                  </CAlert>
                )}
              </div>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default RenewSchedule
