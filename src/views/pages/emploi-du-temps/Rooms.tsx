import React, { useState, useMemo } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CInputGroup,
  CFormInput,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CSpinner,
  CAlert,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CRow,
  CCol
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilSearch } from '@coreui/icons'
import { useRooms, useBuildings } from '@/hooks/emploi-du-temps'
import type { CreateRoomRequest, RoomType } from '@/types/emploi-du-temps.types'

const Rooms = () => {
  const { rooms, loading, error, fetchRooms, createRoom, updateRoom, deleteRoom } = useRooms()
  const { buildings } = useBuildings()

  const [showModal, setShowModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [formData, setFormData] = useState<CreateRoomRequest>({
    building_id: 0,
    name: '',
    code: '',
    capacity: 0,
    room_type: 'classroom' as RoomType,
    equipment: [],
    is_available: true,
  })

  // Filter and paginate rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           room.code.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesBuilding = selectedBuilding === 'all' || room.building_id.toString() === selectedBuilding
      const matchesType = selectedType === 'all' || room.room_type === selectedType
      
      return matchesSearch && matchesBuilding && matchesType
    })
  }, [rooms, searchTerm, selectedBuilding, selectedType])

  const paginatedRooms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredRooms.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredRooms, currentPage])

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, formData)
      } else {
        await createRoom(formData)
      }
      resetForm()
      fetchRooms()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      building_id: 0,
      name: '',
      code: '',
      capacity: 0,
      room_type: 'classroom' as RoomType,
      equipment: [],
      is_available: true,
    })
    setEditingRoom(null)
    setShowModal(false)
  }

  const handleEdit = (room: any) => {
    setEditingRoom(room)
    setFormData({
      building_id: room.building_id,
      name: room.name,
      code: room.code,
      capacity: room.capacity,
      room_type: room.room_type,
      equipment: room.equipment || [],
      is_available: room.is_available,
    })
    setShowModal(true)
  }

  const handleDelete = async (room: any) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette salle ?')) {
      try {
        await deleteRoom(room.id)
        fetchRooms()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }

  const roomTypeLabels = {
    amphitheater: 'Amphithéâtre',
    classroom: 'Salle de classe',
    lab: 'Laboratoire',
    computer_lab: 'Salle informatique',
    conference: 'Salle de conférence',
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Gestion des Salles</h5>
          <CButton 
            color="primary" 
            onClick={() => setShowModal(true)}
          >
            <CIcon icon={cilPlus} className="me-1" />
            Nouvelle Salle
          </CButton>
        </CCardHeader>
        <CCardBody>
          {/* Filters */}
          <CRow className="mb-3">
            <CCol md={4}>
              <CInputGroup>
                <CFormInput
                  placeholder="Rechercher une salle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <CButton variant="outline" color="secondary">
                  <CIcon icon={cilSearch} />
                </CButton>
              </CInputGroup>
            </CCol>
            <CCol md={4}>
              <CFormSelect
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
              >
                <option value="all">Tous les bâtiments</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id.toString()}>
                    {building.name}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={4}>
              <CFormSelect
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">Tous les types</option>
                {Object.entries(roomTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>

          {error && <CAlert color="danger">{error}</CAlert>}

          {loading ? (
            <div className="text-center">
              <CSpinner />
            </div>
          ) : (
            <>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Code</CTableHeaderCell>
                    <CTableHeaderCell>Nom</CTableHeaderCell>
                    <CTableHeaderCell>Bâtiment</CTableHeaderCell>
                    <CTableHeaderCell>Type</CTableHeaderCell>
                    <CTableHeaderCell>Capacité</CTableHeaderCell>
                    <CTableHeaderCell>Statut</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {paginatedRooms.map((room) => (
                    <CTableRow key={room.id}>
                      <CTableDataCell>{room.code}</CTableDataCell>
                      <CTableDataCell>{room.name}</CTableDataCell>
                      <CTableDataCell>
                        {room.building?.name || 'N/A'}
                      </CTableDataCell>
                      <CTableDataCell>
                        {roomTypeLabels[room.room_type as keyof typeof roomTypeLabels]}
                      </CTableDataCell>
                      <CTableDataCell>{room.capacity}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={room.is_available ? 'success' : 'danger'}>
                          {room.is_available ? 'Disponible' : 'Indisponible'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="info"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(room)}
                          className="me-1"
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="danger"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(room)}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              {totalPages > 1 && (
                <CPagination align="center">
                  <CPaginationItem
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                  >
                    Premier
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Précédent
                  </CPaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => Math.abs(page - currentPage) <= 2)
                    .map(page => (
                      <CPaginationItem
                        key={page}
                        active={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </CPaginationItem>
                    ))}
                  <CPaginationItem
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Suivant
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    Dernier
                  </CPaginationItem>
                </CPagination>
              )}
            </>
          )}
        </CCardBody>
      </CCard>

      {/* Modal for creating/editing rooms */}
      <CModal visible={showModal} onClose={resetForm} size="lg">
        <CModalHeader>
          <CModalTitle>
            {editingRoom ? 'Modifier la Salle' : 'Nouvelle Salle'}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="building_id">Bâtiment</CFormLabel>
                  <CFormSelect
                    id="building_id"
                    value={formData.building_id}
                    onChange={(e) => setFormData({ ...formData, building_id: Number(e.target.value) })}
                    required
                  >
                    <option value={0}>Sélectionnez un bâtiment</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.name}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="room_type">Type de salle</CFormLabel>
                  <CFormSelect
                    id="room_type"
                    value={formData.room_type}
                    onChange={(e) => setFormData({ ...formData, room_type: e.target.value as RoomType })}
                    required
                  >
                    {Object.entries(roomTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </CFormSelect>
                </div>
              </CCol>
            </CRow>
            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="code">Code</CFormLabel>
                  <CFormInput
                    type="text"
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="name">Nom</CFormLabel>
                  <CFormInput
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </CCol>
            </CRow>
            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="capacity">Capacité</CFormLabel>
                  <CFormInput
                    type="number"
                    id="capacity"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    required
                    min="1"
                  />
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="is_available">Disponible</CFormLabel>
                  <CFormSelect
                    id="is_available"
                    value={formData.is_available ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.value === 'true' })}
                  >
                    <option value="true">Oui</option>
                    <option value="false">Non</option>
                  </CFormSelect>
                </div>
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={resetForm}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit">
              {editingRoom ? 'Modifier' : 'Créer'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default Rooms
