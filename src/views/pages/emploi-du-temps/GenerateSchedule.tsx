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
  CButton,
  CSpinner,
  CAlert,
  CProgress,
  CListGroup,
  CListGroupItem,
} from '@coreui/react'
import { cilLightbulb } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import EmploiDuTempsService from '@/services/emploi-du-temps.service'
import InscriptionService from '@/services/inscription.service'
import Swal from 'sweetalert2'

const GenerateSchedule: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [academicYearId, setAcademicYearId] = useState<number>(0)
  const [startDate, setStartDate] = useState<string>('')
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!academicYearId) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez sélectionner une année académique',
      })
      return
    }

    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Confirmer la génération automatique',
      html: `
        <p>Vous êtes sur le point de générer automatiquement l'emploi du temps.</p>
        <p><strong>Année académique:</strong> ${academicYears.find((y) => y.id === academicYearId)?.name}</p>
        <p><strong>Date de début:</strong> ${startDate || 'Aujourd\'hui'}</p>
        <br/>
        <p class="text-muted">
          <strong>ℹ️ Comment ça marche ?</strong><br/>
          L'algorithme va automatiquement :
        </p>
        <ul class="text-start text-muted">
          <li>Analyser tous les cours à planifier</li>
          <li>Trouver les meilleurs créneaux disponibles</li>
          <li>Assigner les salles adaptées (capacité suffisante)</li>
          <li>Éviter tous les conflits (salle, professeur, groupe)</li>
          <li>Optimiser l'utilisation des ressources</li>
        </ul>
      `,
      showCancelButton: true,
      confirmButtonText: 'Oui, générer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#0d6efd',
      width: '600px',
    })

    if (!confirm.isConfirmed) return

    setLoading(true)
    setResult(null)

    try {
      const response = await EmploiDuTempsService.generateSchedule({
        academic_year_id: academicYearId,
        start_date: startDate || undefined,
      })

      setResult(response)

      Swal.fire({
        icon: response.created > 0 ? 'success' : 'warning',
        title: 'Génération terminée',
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
        text: error.message || 'Erreur lors de la génération',
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
            <CIcon icon={cilLightbulb} className="me-2" />
            <strong>Génération Automatique d'Emploi du Temps</strong>
          </CCardHeader>
          <CCardBody>
            <CAlert color="info" className="mb-4">
              <h5>🤖 Génération Intelligente par Contraintes</h5>
              <p>
                Cette fonctionnalité utilise un algorithme de programmation par contraintes pour
                générer automatiquement un emploi du temps optimal.
              </p>
              <p className="mb-0">
                <strong>Contraintes respectées :</strong>
              </p>
              <ul className="mb-0">
                <li>✅ Aucun conflit de salle (une salle = un cours à la fois)</li>
                <li>✅ Aucun conflit de professeur (un prof = un cours à la fois)</li>
                <li>✅ Aucun conflit de groupe (un groupe = un cours à la fois)</li>
                <li>✅ Capacité des salles respectée (nombre d'étudiants ≤ capacité)</li>
                <li>✅ Priorité aux cours avec plus d'heures</li>
                <li>✅ Répartition équilibrée sur la semaine</li>
              </ul>
            </CAlert>

            <CForm onSubmit={handleGenerate}>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="academicYear">Année académique *</CFormLabel>
                  <CFormSelect
                    id="academicYear"
                    value={academicYearId}
                    onChange={(e) => setAcademicYearId(parseInt(e.target.value))}
                    required
                  >
                    <option value={0}>Sélectionner une année...</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name} ({year.start_date} - {year.end_date})
                      </option>
                    ))}
                  </CFormSelect>
                  <small className="text-muted">
                    L'année pour laquelle générer l'emploi du temps
                  </small>
                </CCol>

                <CCol md={6}>
                  <CFormLabel htmlFor="startDate">Date de début (optionnel)</CFormLabel>
                  <CFormInput
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <small className="text-muted">
                    Laisser vide pour commencer aujourd'hui
                  </small>
                </CCol>
              </CRow>

              <CAlert color="warning" className="mb-3">
                <strong>⚠️ Attention</strong>
                <p className="mb-0">
                  Cette opération va créer de nombreux cours planifiés. Assurez-vous d'avoir
                  configuré :
                </p>
                <ul className="mb-0">
                  <li>Les bâtiments et salles</li>
                  <li>Les créneaux horaires</li>
                  <li>Les programmes (cours + professeurs + groupes)</li>
                </ul>
              </CAlert>

              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <CButton
                  color="primary"
                  type="submit"
                  disabled={loading || !academicYearId}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <CIcon icon={cilLightbulb} className="me-2" />
                      Générer l'Emploi du Temps
                    </>
                  )}
                </CButton>
              </div>
            </CForm>

            {result && (
              <div className="mt-4">
                <CAlert color={result.created > 0 ? 'success' : 'warning'}>
                  <h5>✨ Résultat de la génération</h5>
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
                    cours à planifier
                  </p>
                  <p>
                    <strong>{result.skipped}</strong> cours ignorés (pas de créneau disponible ou
                    contraintes non satisfaites)
                  </p>
                  {result.created > 0 && (
                    <p className="text-success mb-0">
                      ✅ L'emploi du temps a été généré avec succès ! Vous pouvez maintenant le
                      consulter dans le calendrier.
                    </p>
                  )}
                </CAlert>

                {result.errors && result.errors.length > 0 && (
                  <CAlert color="danger">
                    <h6>⚠️ Cours non planifiés ({result.errors.length})</h6>
                    <p className="mb-2">
                      Les cours suivants n'ont pas pu être planifiés automatiquement. Vous devrez
                      les planifier manuellement :
                    </p>
                    <CListGroup>
                      {result.errors.slice(0, 10).map((error: string, index: number) => (
                        <CListGroupItem key={index}>
                          <small>{error}</small>
                        </CListGroupItem>
                      ))}
                      {result.errors.length > 10 && (
                        <CListGroupItem>
                          <small className="text-muted">
                            ... et {result.errors.length - 10} autres cours
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

export default GenerateSchedule
