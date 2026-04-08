import React, { useState, useEffect } from 'react'
import { CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CFormTextarea, CFormCheck, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CRow, CSpinner, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CBadge, CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilSend } from '@coreui/icons'
import rhService from '@/services/rh.service'
import inscriptionService from '@/services/inscription.service'
import Swal from 'sweetalert2'

const InformationsManagement: React.FC = () => {
  const [informations, setInformations] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [editingInfo, setEditingInfo] = useState<any | null>(null)
  const [broadcastingInfo, setBroadcastingInfo] = useState<any | null>(null)
  const [broadcasting, setBroadcasting] = useState(false)
  
  // Données pour la diffusion
  const [cycles, setCycles] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [filteredDepartments, setFilteredDepartments] = useState<any[]>([])
  const [classGroups, setClassGroups] = useState<any[]>([])
  
  const [broadcastData, setBroadcastData] = useState({
    cycle_id: '',
    department_ids: [] as number[],
    levels: [] as string[],
    all_departments: false,
    all_levels: false,
  })

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'bi-info-circle',
    color: 'primary',
    link: '',
    file_id: null as number | null,
    file: null as File | null,
    files: [] as File[], // Nouveau: pour plusieurs fichiers
    is_active: true,
    order: 0,
  })

  const icons = [
    'bi-info-circle', 'bi-calendar-check', 'bi-calendar-event', 'bi-headset',
    'bi-cash-coin', 'bi-book', 'bi-trophy', 'bi-bell', 'bi-megaphone',
  ]

  useEffect(() => {
    loadData()
    loadReferenceData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [infos, docs] = await Promise.all([
        rhService.getImportantInformationsAdmin(),
        rhService.getDocuments(),
      ])
      setInformations(infos)
      setDocuments(docs.filter((d: any) => d.type === 'pdf'))
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReferenceData = async () => {
    try {
      const cyclesData = await inscriptionService.getCycles()
      setCycles(cyclesData || [])
      
      // Extraire tous les départements de tous les cycles
      const allDepartments: any[] = []
      if (cyclesData && Array.isArray(cyclesData)) {
        cyclesData.forEach((cycle: any) => {
          if (cycle.departments && Array.isArray(cycle.departments)) {
            cycle.departments.forEach((dept: any) => {
              allDepartments.push({
                ...dept,
                cycle_id: cycle.id, // S'assurer que cycle_id est présent
                cycle_name: cycle.name,
              })
            })
          }
        })
      }
      setDepartments(allDepartments)
    } catch (error) {
      console.error('Erreur chargement données de référence:', error)
    }
  }

  // Charger les class groups pour un cycle/département spécifique
  const loadClassGroupsForSelection = async () => {
    if (!broadcastData.cycle_id) return
    
    try {
      // Définir les niveaux standards selon le cycle
      const selectedCycle = cycles.find((c: any) => c.id === parseInt(broadcastData.cycle_id))
      
      if (!selectedCycle) return

      let levels: string[] = []
      
      // Les niveaux sont stockés comme 1, 2, 3, 4 dans la BD
      // Peu importe le cycle, on utilise juste les chiffres
      const yearsCount = selectedCycle.years_count || 4
      for (let i = 1; i <= yearsCount; i++) {
        levels.push(i.toString())
      }
      
      setClassGroups(levels.map((level, idx) => ({ 
        id: idx, 
        study_level: level,
        display_name: getLevelDisplayName(level, selectedCycle.type)
      })))
    } catch (error) {
      console.error('Erreur chargement class groups:', error)
    }
  }

  // Fonction pour afficher le nom du niveau selon le type de cycle
  const getLevelDisplayName = (level: string, cycleType: string) => {
    if (cycleType === 'dlp') {
      return `Licence ${level}`
    } else if (cycleType === 'dmp') {
      return `Master ${level}`
    } else if (cycleType === 'dic') {
      // Pour ingénierie, 1-2 = Prépa, 3-6 = Ingénieur
      const levelNum = parseInt(level)
      if (levelNum <= 2) {
        return `Prépa ${level}`
      } else {
        return `Ingénieur ${levelNum - 2}`
      }
    }
    return `Année ${level}`
  }

  useEffect(() => {
    if (broadcastData.cycle_id) {
      const filtered = departments.filter((d: any) => d.cycle_id === parseInt(broadcastData.cycle_id))
      setFilteredDepartments(filtered)
      
      // Reset selections si le cycle change
      setBroadcastData(prev => ({
        ...prev,
        department_ids: [],
        levels: [],
        all_departments: false,
        all_levels: false,
      }))
      
      loadClassGroupsForSelection()
    } else {
      setFilteredDepartments([])
      setClassGroups([])
    }
  }, [broadcastData.cycle_id, departments, cycles])

  const getAvailableLevels = () => {
    // Retourner les niveaux standards depuis classGroups
    if (!classGroups || classGroups.length === 0) {
      return []
    }
    return classGroups.map((cg: any) => ({
      value: cg.study_level, // Le chiffre pour la BD
      label: cg.display_name || cg.study_level // Le nom d'affichage
    }))
  }

  const handleBroadcast = async () => {
    if (!broadcastData.cycle_id) {
      Swal.fire('Erreur', 'Veuillez sélectionner un cycle', 'error')
      return
    }

    if (!broadcastData.all_departments && broadcastData.department_ids.length === 0) {
      Swal.fire('Erreur', 'Veuillez sélectionner au moins une filière', 'error')
      return
    }

    if (!broadcastData.all_levels && broadcastData.levels.length === 0) {
      Swal.fire('Erreur', 'Veuillez sélectionner au moins un niveau', 'error')
      return
    }

    const result = await Swal.fire({
      title: 'Confirmer la diffusion',
      text: 'Êtes-vous sûr de vouloir envoyer cette information par email aux étudiants sélectionnés ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, diffuser',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#3085d6',
    })

    if (!result.isConfirmed) return

    try {
      setBroadcasting(true)
      
      // Préparer les niveaux
      const levelsToSend = broadcastData.all_levels 
        ? getAvailableLevels().map(l => l.value)
        : broadcastData.levels

      // Vérifier que les niveaux ne sont pas vides
      if (!levelsToSend || levelsToSend.length === 0) {
        Swal.fire('Erreur', 'Aucun niveau sélectionné. Veuillez réessayer.', 'error')
        setBroadcasting(false)
        return
      }
      
      const payload = {
        cycle_id: parseInt(broadcastData.cycle_id),
        department_ids: broadcastData.all_departments 
          ? filteredDepartments.map((d: any) => d.id)
          : broadcastData.department_ids,
        levels: levelsToSend,
        all_departments: broadcastData.all_departments,
        all_levels: broadcastData.all_levels,
      }

      console.log('Payload envoyé:', payload) // Debug

      const response = await rhService.broadcastImportantInformation(broadcastingInfo!.id, payload)
      
      setShowBroadcastModal(false)
      resetBroadcastForm()

      // Afficher un message de succès avec suivi du statut
      Swal.fire({
        title: 'Diffusion lancée !',
        html: `
          <p>La diffusion a été mise en file d'attente</p>
          <ul style="text-align: left; margin-top: 15px;">
            <li>Total étudiants: ${response.total_students}</li>
            <li>Statut: ${response.status === 'queued' ? 'En attente' : response.status}</li>
          </ul>
          <p style="margin-top: 15px; color: #666; font-size: 14px;">
            Les emails seront envoyés progressivement. Vous pouvez consulter les logs pour suivre l'avancement.
          </p>
        `,
        icon: 'success',
        confirmButtonText: 'OK',
      })

      // Optionnel : Polling pour suivre le statut
      if (response.broadcast_id) {
        pollBroadcastStatus(response.broadcast_id, response.total_students)
      }
      
    } catch (error: any) {
      console.error('Erreur diffusion:', error)
      Swal.fire('Erreur', error.response?.data?.message || 'Erreur lors de la diffusion', 'error')
    } finally {
      setBroadcasting(false)
    }
  }

  const pollBroadcastStatus = async (broadcastId: string, totalStudents: number) => {
    let attempts = 0
    const maxAttempts = 20 // 20 tentatives = ~2 minutes
    
    const checkStatus = async () => {
      try {
        const status = await rhService.getBroadcastStatus(broadcastId)
        
        if (status.status === 'completed') {
          // Afficher une notification de succès
          Swal.fire({
            title: 'Diffusion terminée !',
            html: `
              <ul style="text-align: left;">
                <li>Total étudiants: ${status.total_students}</li>
                <li>Emails envoyés: ${status.emails_sent}</li>
                ${status.emails_failed > 0 ? `<li style="color: red;">Emails échoués: ${status.emails_failed}</li>` : ''}
              </ul>
            `,
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 5000,
          })
          return
        }
        
        if (status.status === 'failed') {
          Swal.fire({
            title: 'Erreur de diffusion',
            text: status.error || 'La diffusion a échoué',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 5000,
          })
          return
        }
        
        // Continuer le polling si pas terminé
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 6000) // Vérifier toutes les 6 secondes
        }
      } catch (error) {
        console.error('Erreur polling status:', error)
      }
    }
    
    // Démarrer le polling après 5 secondes
    setTimeout(checkStatus, 5000)
  }

  const openBroadcastModal = (info: any) => {
    setBroadcastingInfo(info)
    resetBroadcastForm()
    setShowBroadcastModal(true)
  }

  const resetBroadcastForm = () => {
    setBroadcastData({
      cycle_id: '',
      department_ids: [],
      levels: [],
      all_departments: false,
      all_levels: false,
    })
  }

  const handleDepartmentChange = (deptId: number, checked: boolean) => {
    if (checked) {
      setBroadcastData(prev => ({
        ...prev,
        department_ids: [...prev.department_ids, deptId],
      }))
    } else {
      setBroadcastData(prev => ({
        ...prev,
        department_ids: prev.department_ids.filter(id => id !== deptId),
      }))
    }
  }

  const handleLevelChange = (level: string, checked: boolean) => {
    if (checked) {
      setBroadcastData(prev => ({
        ...prev,
        levels: [...prev.levels, level],
      }))
    } else {
      setBroadcastData(prev => ({
        ...prev,
        levels: prev.levels.filter(l => l !== level),
      }))
    }
  }

  const handleAllDepartmentsChange = (checked: boolean) => {
    setBroadcastData(prev => ({
      ...prev,
      all_departments: checked,
      department_ids: checked ? filteredDepartments.map((d: any) => d.id) : [],
    }))
  }

  const handleAllLevelsChange = (checked: boolean) => {
    const allLevelValues = getAvailableLevels().map(l => l.value)
    setBroadcastData(prev => ({
      ...prev,
      all_levels: checked,
      levels: checked ? allLevelValues : [],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingInfo) {
        await rhService.updateImportantInformation(editingInfo.id, formData)
      } else {
        await rhService.createImportantInformation(formData)
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette information ?')) return
    try {
      await rhService.deleteImportantInformation(id)
      loadData()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      icon: 'bi-info-circle',
      color: 'primary',
      link: '',
      file_id: null,
      file: null,
      files: [],
      is_active: true,
      order: 0,
    })
    setEditingInfo(null)
  }

  const openEditModal = (info: any) => {
    setEditingInfo(info)
    setFormData({
      title: info.title,
      description: info.description,
      icon: info.icon,
      color: info.color,
      link: info.link || '',
      file_id: info.file_id || null,
      file: null,
      files: [],
      is_active: info.is_active ?? true,
      order: info.order ?? 0,
    })
    setShowModal(true)
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Gestion des Informations Importantes</h5>
          <CButton color="primary" onClick={() => { resetForm(); setShowModal(true) }}>
            <CIcon icon={cilPlus} className="me-2" />
            Nouvelle Information
          </CButton>
        </CCardHeader>
        <CCardBody>
          {loading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />
            </div>
          ) : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Ordre</CTableHeaderCell>
                  <CTableHeaderCell>Titre</CTableHeaderCell>
                  <CTableHeaderCell>Couleur</CTableHeaderCell>
                  <CTableHeaderCell>Icône</CTableHeaderCell>
                  <CTableHeaderCell>Fichier</CTableHeaderCell>
                  <CTableHeaderCell>Statut</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {informations.map(info => (
                  <CTableRow key={info.id}>
                    <CTableDataCell>{info.order}</CTableDataCell>
                    <CTableDataCell>{info.title}</CTableDataCell>
                    <CTableDataCell><CBadge color={info.color}>{info.color}</CBadge></CTableDataCell>
                    <CTableDataCell>
                      <i className={`bi ${info.icon}`} style={{ fontSize: '1.5rem' }}></i>
                    </CTableDataCell>
                    <CTableDataCell>{info.file ? <CBadge color="info">{info.file.name}</CBadge> : '-'}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={info.is_active ? 'success' : 'secondary'}>
                        {info.is_active ? 'Actif' : 'Inactif'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton color="primary" variant="ghost" size="sm" className="me-2" onClick={() => openEditModal(info)}>
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton color="info" variant="ghost" size="sm" className="me-2" onClick={() => openBroadcastModal(info)} title="Diffuser par email">
                        <CIcon icon={cilSend} />
                      </CButton>
                      <CButton color="danger" variant="ghost" size="sm" onClick={() => handleDelete(info.id)}>
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <CModal visible={showModal} onClose={() => setShowModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>{editingInfo ? 'Modifier' : 'Nouvelle'} Information</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Titre *</CFormLabel>
                <CFormInput value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Description *</CFormLabel>
                <CFormTextarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={4}>
                <CFormLabel>Icône *</CFormLabel>
                <CFormSelect value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} required>
                  {icons.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel>Couleur *</CFormLabel>
                <CFormSelect value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} required>
                  <option value="primary">Bleu</option>
                  <option value="success">Vert</option>
                  <option value="info">Cyan</option>
                  <option value="warning">Jaune</option>
                  <option value="danger">Rouge</option>
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel>Ordre</CFormLabel>
                <CFormInput type="number" value={formData.order} onChange={e => setFormData({...formData, order: parseInt(e.target.value)})} />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Lien</CFormLabel>
                <CFormInput value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="/enroll" />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Documents PDF</CFormLabel>
                <small className="text-muted d-block mb-2">
                  Vous pouvez soit uploader un nouveau fichier PDF, soit sélectionner un document existant, ou uploader plusieurs fichiers
                </small>
                
                <div className="mb-3">
                  <CFormLabel className="fw-semibold">Option 1: Uploader un nouveau PDF (fichier principal)</CFormLabel>
                  <CFormInput 
                    type="file" 
                    accept=".pdf"
                    onChange={e => {
                      const file = (e.target as HTMLInputElement).files?.[0] || null
                      setFormData({...formData, file, file_id: null})
                    }}
                  />
                  {formData.file && (
                    <small className="text-success d-block mt-1">
                      Fichier sélectionné: {formData.file.name}
                    </small>
                  )}
                </div>

                <div className="text-center my-2 text-muted">OU</div>

                <div className="mb-3">
                  <CFormLabel className="fw-semibold">Option 2: Sélectionner un document existant</CFormLabel>
                  <CFormSelect 
                    value={formData.file_id || ''} 
                    onChange={e => setFormData({...formData, file_id: e.target.value ? parseInt(e.target.value) : null, file: null})}
                    disabled={!!formData.file}
                  >
                    <option value="">Aucun document</option>
                    {documents.map((doc: any) => (
                      <option key={doc.id} value={doc.id}>{doc.titre}</option>
                    ))}
                  </CFormSelect>
                  {formData.file && (
                    <small className="text-muted d-block mt-1">
                      Désactivé car un nouveau fichier est sélectionné
                    </small>
                  )}
                </div>

                <div className="border-top pt-3 mt-3">
                  <CFormLabel className="fw-semibold">Option 3: Uploader plusieurs fichiers additionnels</CFormLabel>
                  <CFormInput 
                    type="file" 
                    accept=".pdf"
                    multiple
                    onChange={e => {
                      const files = Array.from((e.target as HTMLInputElement).files || [])
                      setFormData({...formData, files})
                    }}
                  />
                  {formData.files.length > 0 && (
                    <div className="mt-2">
                      <small className="text-success d-block mb-1">
                        {formData.files.length} fichier(s) sélectionné(s):
                      </small>
                      <ul className="small mb-0">
                        {formData.files.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormCheck checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} label="Actif" />
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowModal(false)}>Annuler</CButton>
            <CButton color="primary" type="submit">Enregistrer</CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* Modal de diffusion */}
      <CModal visible={showBroadcastModal} onClose={() => setShowBroadcastModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Diffuser l'information par email</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {broadcastingInfo && (
            <CAlert color="info" className="mb-4">
              <strong>{broadcastingInfo.title}</strong>
              <p className="mb-0 mt-2">{broadcastingInfo.description}</p>
            </CAlert>
          )}

          <CRow className="mb-3">
            <CCol>
              <CFormLabel>Cycle *</CFormLabel>
              <CFormSelect 
                value={broadcastData.cycle_id} 
                onChange={e => setBroadcastData({...broadcastData, cycle_id: e.target.value})}
                required
              >
                <option value="">Sélectionner un cycle</option>
                {cycles.map((cycle: any) => (
                  <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>

          {broadcastData.cycle_id && (
            <>
              <CRow className="mb-3">
                <CCol>
                  <CFormLabel>Filières *</CFormLabel>
                  <div className="mb-2">
                    <CFormCheck
                      id="all-departments"
                      label="Toutes les filières de ce cycle"
                      checked={broadcastData.all_departments}
                      onChange={e => handleAllDepartmentsChange(e.target.checked)}
                    />
                  </div>
                  <div style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    border: '1px solid #d8dbe0', 
                    borderRadius: '4px', 
                    padding: '10px',
                    backgroundColor: broadcastData.all_departments ? '#f0f0f0' : 'white'
                  }}>
                    {filteredDepartments.length === 0 ? (
                      <p className="text-muted mb-0">Aucune filière disponible pour ce cycle</p>
                    ) : (
                      filteredDepartments.map((dept: any) => (
                        <CFormCheck
                          key={dept.id}
                          id={`dept-${dept.id}`}
                          label={dept.name}
                          checked={broadcastData.department_ids.includes(dept.id)}
                          onChange={e => handleDepartmentChange(dept.id, e.target.checked)}
                          disabled={broadcastData.all_departments}
                        />
                      ))
                    )}
                  </div>
                </CCol>
              </CRow>

              {(broadcastData.all_departments || broadcastData.department_ids.length > 0) && (
                <CRow className="mb-3">
                  <CCol>
                    <CFormLabel>Niveaux *</CFormLabel>
                    <div className="mb-2">
                      <CFormCheck
                        id="all-levels"
                        label="Tous les niveaux"
                        checked={broadcastData.all_levels}
                        onChange={e => handleAllLevelsChange(e.target.checked)}
                      />
                    </div>
                    <div style={{ 
                      maxHeight: '150px', 
                      overflowY: 'auto', 
                      border: '1px solid #d8dbe0', 
                      borderRadius: '4px', 
                      padding: '10px',
                      backgroundColor: broadcastData.all_levels ? '#f0f0f0' : 'white'
                    }}>
                      {getAvailableLevels().length === 0 ? (
                        <p className="text-muted mb-0">Aucun niveau disponible</p>
                      ) : (
                        getAvailableLevels().map((level: any) => (
                          <CFormCheck
                            key={level.value}
                            id={`level-${level.value}`}
                            label={level.label}
                            checked={broadcastData.levels.includes(level.value)}
                            onChange={e => handleLevelChange(level.value, e.target.checked)}
                            disabled={broadcastData.all_levels}
                          />
                        ))
                      )}
                    </div>
                  </CCol>
                </CRow>
              )}
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowBroadcastModal(false)} disabled={broadcasting}>
            Annuler
          </CButton>
          <CButton color="primary" onClick={handleBroadcast} disabled={broadcasting}>
            {broadcasting ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Diffusion en cours...
              </>
            ) : (
              <>
                <CIcon icon={cilSend} className="me-2" />
                Diffuser
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default InformationsManagement
