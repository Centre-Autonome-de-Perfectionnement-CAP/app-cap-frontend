import { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormSelect,
  CFormCheck,
  CAlert,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash } from '@coreui/icons'
import { LoadingSpinner } from '@/components'
import useTarifs from '@/hooks/finance/useTarifs'
import useTarifForm from '@/hooks/finance/useTarifForm'
import financeService from '@/services/finance.service'

const Tarifs = () => {
  const {
    tarifs,
    loading,
    error,
    createTarif,
    updateTarif,
    deleteTarif,
  } = useTarifs()

  const [showModal, setShowModal] = useState(false)
  const [editingTarif, setEditingTarif] = useState<any>(null)
  const [formData, setFormData] = useState({
    type: 'inscription',
    libelle: '',
    amount: '',
    academic_year_id: '',
    is_active: true,
    penalty_amount: '',
    penalty_type: 'fixed',
    penalty_active: false,
    class_groups: [] as any[],
  })

  const {
    academicYears,
    availableClasses,
    loadingClasses,
    loadAvailableClasses,
  } = useTarifForm()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingTarif) {
        await updateTarif(editingTarif.id, formData)
      } else {
        await createTarif(formData)
      }
      
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      type: 'inscription',
      libelle: '',
      amount: '',
      academic_year_id: '',
      is_active: true,
      penalty_amount: '',
      penalty_type: 'fixed',
      penalty_active: false,
      class_groups: [],
    })
    setEditingTarif(null)
  }

  const handleAcademicYearChange = async (academicYearId: string) => {
    setFormData({ ...formData, academic_year_id: academicYearId, class_groups: [] })
    
    if (academicYearId) {
      const classes = await loadAvailableClasses(parseInt(academicYearId))
      // Cocher toutes les classes par défaut
      setFormData(prev => ({
        ...prev,
        class_groups: classes.map((c: any) => ({
          academic_year_id: c.academic_year_id,
          department_id: c.department_id,
          study_level: c.study_level,
        }))
      }))
    }
  }



  const toggleClassSelection = (classItem: any) => {
    const key = `${classItem.academic_year_id}-${classItem.department_id}-${classItem.study_level}`
    const exists = formData.class_groups.some(
      c => `${c.academic_year_id}-${c.department_id}-${c.study_level}` === key
    )

    if (exists) {
      setFormData({
        ...formData,
        class_groups: formData.class_groups.filter(
          c => `${c.academic_year_id}-${c.department_id}-${c.study_level}` !== key
        )
      })
    } else {
      setFormData({
        ...formData,
        class_groups: [...formData.class_groups, {
          academic_year_id: classItem.academic_year_id,
          department_id: classItem.department_id,
          study_level: classItem.study_level,
        }]
      })
    }
  }

  const isClassSelected = (classItem: any) => {
    const key = `${classItem.academic_year_id}-${classItem.department_id}-${classItem.study_level}`
    return formData.class_groups.some(
      c => `${c.academic_year_id}-${c.department_id}-${c.study_level}` === key
    )
  }

  const handleEdit = async (tarif: any) => {
    setEditingTarif(tarif)
    
    // Charger les détails complets du tarif avec ses classes
    try {
      const response = await financeService.getTarifById(tarif.id)
      const tarifData = response.data
      
      // Charger les classes disponibles pour cette année AVANT de définir formData
      if (tarifData.academic_year_id) {
        await loadAvailableClasses(tarifData.academic_year_id)
      }
      
      // Maintenant définir formData avec les class_groups du tarif
      setFormData({
        type: tarifData.type || 'inscription',
        libelle: tarifData.libelle || '',
        amount: tarifData.amount?.toString() || '',
        academic_year_id: tarifData.academic_year_id?.toString()
      }))
    }
    
    setShowModal(true)
  }

  const handleEdit = async (tarif: any) => {
    setEditingTarif(tarif)
    
    // Charger les détails complets du tarif avec ses classes
    try {
      const response = await financeService.getTarifById(tarif.id)
      const tarifData = response.data
      
      setFormData({
        type: tarifData.type || 'inscription',
        libelle: tarifData.libelle || '',
        amount: tarifData.amount?.toString() || '',
        academic_year_id: tarifData.academic_year_id?.toString() || '',
        is_active: tarifData.is_active ?? true,
        penalty_amount: tarifData.penalty_amount?.toString() || '',
        penalty_type: tarifData.penalty_type || 'fixed',
        penalty_active: tarifData.penalty_active ?? false,
        class_groups: tarifData.class_groups || [],
      })
      
      // Charger les classes disponibles pour cette année
      if (tarifData.academic_year_id) {
        await loadAvailableClasses(tarifData.academic_year_id)
      }
      
      setShowModal(true)
    } catch (error) {
      console.error('Erreur chargement tarif:', error)
    }
  }
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce tarif ?')) {
      try {
        await deleteTarif(id)
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }

  if (loading) {
    return <LoadingSpinner fullPage message="Chargement des tarifs..." />
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Gestion des Tarifs</h5>
          <CButton
            color="primary"
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
          >
            <CIcon icon={cilPlus} className="me-2" />
            Nouveau Tarif
          </CButton>
        </CCardHeader>
        <CCardBody>
          {error && (
            <CAlert color="danger" className="mb-3">
              {error}
            </CAlert>
          )}

          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Type</CTableHeaderCell>
                <CTableHeaderCell>Libellé</CTableHeaderCell>
                <CTableHeaderCell>Montant</CTableHeaderCell>
                <CTableHeaderCell>Classes</CTableHeaderCell>
                <CTableHeaderCell>Statut</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {Array.isArray(tarifs) && tarifs.length > 0 ? tarifs.map((tarif: any) => (
                <CTableRow key={tarif.id}>
                  <CTableDataCell>
                    <CBadge color="info">{tarif.type}</CBadge>
                  </CTableDataCell>
                  <CTableDataCell>{tarif.libelle}</CTableDataCell>
                  <CTableDataCell>{tarif.amount?.toLocaleString()} FCFA</CTableDataCell>
                  <CTableDataCell>
                    <small className="text-muted">{tarif.classes_list || '-'}</small>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={tarif.is_active ? 'success' : 'secondary'}>
                      {tarif.is_active ? 'Actif' : 'Inactif'}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CButton
                      color="warning"
                      variant="ghost"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(tarif)}
                    >
                      <CIcon icon={cilPencil} />
                    </CButton>
                    <CButton
                      color="danger"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tarif.id)}
                    >
                      <CIcon icon={cilTrash} />
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              )) : (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center text-muted py-4">
                    Aucun tarif défini
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CModal visible={showModal} onClose={() => setShowModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>
            {editingTarif ? 'Modifier le tarif' : 'Nouveau tarif'}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <div className="row">
              <div className="col-md-6 mb-3">
                <CFormSelect
                  label="Année académique"
                  value={formData.academic_year_id}
                  onChange={(e) => handleAcademicYearChange(e.target.value)}
                  required
                >
                  <option value="">Sélectionner une année</option>
                  {academicYears.map((year: any) => (
                    <option key={year.id} value={year.id}>{year.libelle}</option>
                  ))}
                </CFormSelect>
              </div>
              <div className="col-md-6 mb-3">
                <CFormSelect
                  label="Type de tarif"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="inscription">Frais d'inscription</option>
                  <option value="formation">Frais de formation</option>
                  <option value="penalty">Pénalité de retard</option>
                </CFormSelect>
              </div>
              <div className="col-md-6 mb-3">
                <CFormInput
                  label="Libellé"
                  value={formData.libelle}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <CFormInput
                  type="number"
                  label="Montant (FCFA)"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-12 mb-3">
                <CFormCheck
                  id="is_active"
                  label="Tarif actif"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              </div>
              
              {formData.academic_year_id && (
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Classes concernées</label>
                  {loadingClasses ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Chargement...</span>
                      </div>
                    </div>
                  ) : availableClasses.length > 0 ? (
                    <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <div className="row">
                        {availableClasses.map((classItem: any, idx: number) => (
                          <div key={idx} className="col-md-6 mb-2">
                            <CFormCheck
                              id={`class-${idx}`}
                              label={classItem.label}
                              checked={isClassSelected(classItem)}
                              onChange={() => toggleClassSelection(classItem)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-info mb-0">
                      Aucune classe disponible pour cette année
                    </div>
                  )}
                  {formData.class_groups.length === 0 && formData.academic_year_id && (
                    <small className="text-danger">Veuillez sélectionner au moins une classe</small>
                  )}
                </div>
              )}
              
              {formData.type === 'penalty' && (
                <>
                  <div className="col-md-6 mb-3">
                    <CFormInput
                      type="number"
                      label="Montant de pénalité"
                      value={formData.penalty_amount}
                      onChange={(e) => setFormData({ ...formData, penalty_amount: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <CFormSelect
                      label="Type de pénalité"
                      value={formData.penalty_type}
                      onChange={(e) => setFormData({ ...formData, penalty_type: e.target.value })}
                    >
                      <option value="fixed">Montant fixe</option>
                      <option value="percentage">Pourcentage</option>
                    </CFormSelect>
                  </div>
                  <div className="col-md-12 mb-3">
                    <CFormCheck
                      id="penalty_active"
                      label="Activer les pénalités de retard"
                      checked={formData.penalty_active}
                      onChange={(e) => setFormData({ ...formData, penalty_active: e.target.checked })}
                    />
                  </div>
                </>
              )}
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </CButton>
            <CButton 
              color="primary" 
              type="submit"
              disabled={formData.class_groups.length === 0}
            >
              {editingTarif ? 'Modifier' : 'Créer'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default Tarifs