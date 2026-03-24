import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CFormSwitch,
  CAlert,
  CBadge,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus, cilPencil, cilTrash, cilUser, cilOptions, cilInfo, cilSearch, cilFile } from '@coreui/icons';
import { useProfessors } from '@/hooks/rh';
import { openFileInNewTab } from '@/utils/fileViewer';
import { validateIFU, validateRIB } from '@/utils/validation.utils';
import type { Professor } from '@/types/cours.types';

const Professors: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bankFilter, setBankFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  const {
    professors,
    loading,
    error,
    grades,
    banks,
    createProfessor,
    updateProfessor,
    deleteProfessor,
    refreshProfessors,
    setError,
  } = useProfessors({ search, status: statusFilter, bank: bankFilter, grade_id: gradeFilter });

  const [showModal, setShowModal] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    rib_number: '',
    ifu_number: '',
    bank: '',
    speciality: '',
    status: 'active',
    grade_id: '',
    bio: '',
    nationality: '',
    profession: '',
    city: '',
    district: '',
    plot_number: '',
    house_number: '',
  });
  const [ribFile, setRibFile] = useState<File | null>(null);
  const [ifuFile, setIfuFile] = useState<File | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ rib?: string; ifu?: string }>({});

  useEffect(() => {
    refreshProfessors();
  }, [search, statusFilter, bankFilter, gradeFilter]);

  const handleShowModal = (professor?: Professor) => {
    if (professor) {
      setEditingProfessor(professor);
      setFormData({
        first_name: professor.first_name,
        last_name: professor.last_name,
        email: professor.email || '',
        phone: professor.phone || '',
        rib_number: professor.rib_number || '',
        ifu_number: professor.ifu_number || '',
        bank: professor.bank || '',
        speciality: professor.speciality || '',
        status: professor.status || 'active',
        grade_id: professor.grade_id?.toString() || '',
        bio: professor.bio || '',
        nationality: professor.nationality || '',
        profession: professor.profession || '',
        city: professor.city || '',
        district: professor.district || '',
        plot_number: professor.plot_number || '',
        house_number: professor.house_number || '',
      });
    } else {
      setEditingProfessor(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        rib_number: '',
        ifu_number: '',
        bank: '',
        speciality: '',
        status: 'active',
        grade_id: '',
        bio: '',
        nationality: '',
        profession: '',
        city: '',
        district: '',
        plot_number: '',
        house_number: '',
      });
    }
    setRibFile(null);
    setIfuFile(null);
    setShowModal(true);
  };

  const handleShowDetails = (professor: Professor) => {
    setSelectedProfessor(professor);
    setShowDetailsModal(true);
  };

  const handleToggleStatus = async (professor: Professor) => {
    try {
      const newStatus = professor.status === 'active' ? 'inactive' : 'active';
      await updateProfessor(professor.id, { status: newStatus });
      setAlert({ type: 'success', message: 'Statut mis à jour avec succès!' });
      setTimeout(() => setAlert(null), 5000);
    } catch (error) {
      setAlert({ type: 'danger', message: 'Erreur lors de la mise à jour du statut' });
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProfessor(null);
    setRibFile(null);
    setIfuFile(null);
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const errors: { rib?: string; ifu?: string } = {};

  // ✅ Rendre la validation obligatoire (retirer le "&&")
  if (!formData.rib_number) {
    errors.rib = 'Le RIB est obligatoire';
  } else if (!validateRIB(formData.rib_number)) {
    errors.rib = 'Le RIB doit contenir entre 22 et 27 caractères alphanumériques';
  }

  if (!formData.ifu_number) {
    errors.ifu = 'Le numéro IFU est obligatoire';
  } else if (!validateIFU(formData.ifu_number)) {
    errors.ifu = 'Le numéro IFU doit contenir exactement 13 chiffres';
  }

  if (Object.keys(errors).length > 0) {
    setValidationErrors(errors);
    return; // ✅ bloque l'envoi avant même d'appeler Laravel
  }


    setValidationErrors({});

    try {
      const submitData = new FormData();

// ✅ liste SANS status
const fields = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'rib_number',
  'ifu_number',
  'bank',
  'speciality',
  'grade_id',
  'bio',
  'nationality',
  'profession',
  'city',
  'district',
  'plot_number',
  'house_number'
];

// ✅ envoyer seulement les champs remplis
fields.forEach(field => {
  const value = formData[field as keyof typeof formData];

  if (value !== null && value !== undefined && value !== '') {
    submitData.append(field, value.toString());
  }
});

// ✅ AJOUTER statut ici (IMPORTANT)
submitData.append(
  'statut',
  formData.statut === 'active'
    ? 'active'
    : formData.statut === 'inactive'
    ? 'inactive'
    : 'suspended'
);
      if (ribFile) submitData.append('rib', ribFile);
      if (ifuFile) submitData.append('ifu', ifuFile);

      console.log('Form Data:', Object.fromEntries(submitData.entries()));

      if (editingProfessor) {
        await updateProfessor(editingProfessor.id, submitData);
        setAlert({ type: 'success', message: 'Professeur mis à jour avec succès!' });
      } else {
        await createProfessor(submitData);
        setAlert({ type: 'success', message: 'Professeur créé avec succès!' });
      }
      handleCloseModal();
      setTimeout(() => setAlert(null), 5000);
    } catch (error: any) {
      console.log('FULL ERROR:', error);
      console.log('LARAVEL ERRORS:', error.errors);
      console.log('MESSAGE:', error.message);
      setAlert({
        type: 'danger',
        message: error.response?.data?.message || error.message || 'Une erreur est survenue'
      });
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handleDelete = async (professor: Professor) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${professor.full_name} ?`)) {
      try {
        await deleteProfessor(professor.id);
        setAlert({ type: 'success', message: 'Professeur supprimé avec succès!' });
        setTimeout(() => setAlert(null), 5000);
      } catch (error) {
        setAlert({ type: 'danger', message: 'Erreur lors de la suppression' });
        setTimeout(() => setAlert(null), 5000);
      }
    }
  };

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>
                <CIcon icon={cilUser} className="me-2" />
                Gestion des Professeurs
              </strong>
              <CButton color="primary" onClick={() => handleShowModal()}>
                <CIcon icon={cilPlus} className="me-2" />
                Nouveau Professeur
              </CButton>
            </CCardHeader>
            <CCardBody>
              {alert && (
                <CAlert color={alert.type} dismissible onClose={() => setAlert(null)}>
                  {alert.message}
                </CAlert>
              )}

              {error && (
                <CAlert color="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </CAlert>
              )}

              <CRow className="mb-3">
                <CCol md={4}>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Rechercher..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={2}>
                  <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={bankFilter} onChange={(e) => setBankFilter(e.target.value)}>
                    <option value="">Toutes les banques</option>
                    {banks.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                    <option value="">Tous les grades</option>
                    {grades.map((grade) => (
                      <option key={grade.id} value={grade.id}>{grade.name}</option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Nom complet</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Téléphone</CTableHeaderCell>
                    <CTableHeaderCell>Grade</CTableHeaderCell>
                    <CTableHeaderCell>Banque</CTableHeaderCell>
                    <CTableHeaderCell>RIB</CTableHeaderCell>
                    <CTableHeaderCell>IFU</CTableHeaderCell>
                    <CTableHeaderCell>Statut</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan={9} className="text-center">
                        Chargement...
                      </CTableDataCell>
                    </CTableRow>
                  ) : professors.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={9} className="text-center text-muted">
                        Aucun professeur trouvé
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    professors.map((professor) => (
                      <CTableRow key={professor.id}>
                        <CTableDataCell>{professor.full_name}</CTableDataCell>
                        <CTableDataCell>{professor.email}</CTableDataCell>
                        <CTableDataCell>{professor.phone || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{professor.grade?.name || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{professor.bank || 'N/A'}</CTableDataCell>
                        <CTableDataCell>
                          {professor.rib_url ? (
                            <CButton color="link" size="sm" onClick={() => openFileInNewTab(professor.rib_url!)}>
                              <CIcon icon={cilFile} />
                            </CButton>
                          ) : 'N/A'}
                        </CTableDataCell>
                        <CTableDataCell>
                          {professor.ifu_url ? (
                            <CButton color="link" size="sm" onClick={() => openFileInNewTab(professor.ifu_url!)}>
                              <CIcon icon={cilFile} />
                            </CButton>
                          ) : 'N/A'}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CFormSwitch
                            checked={professor.status === 'active'}
                            onChange={() => handleToggleStatus(professor)}
                            label={professor.status === 'active' ? 'Actif' : 'Inactif'}
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          <CDropdown>
                            <CDropdownToggle color="ghost" size="sm">
                              <CIcon icon={cilOptions} />
                            </CDropdownToggle>
                            <CDropdownMenu>
                              <CDropdownItem onClick={() => handleShowDetails(professor)}>
                                <CIcon icon={cilInfo} className="me-2" />
                                Voir détails
                              </CDropdownItem>
                              <CDropdownItem onClick={() => handleShowModal(professor)}>
                                <CIcon icon={cilPencil} className="me-2" />
                                Modifier
                              </CDropdownItem>
                              <CDropdownItem
                                onClick={() => handleDelete(professor)}
                                className="text-danger"
                              >
                                <CIcon icon={cilTrash} className="me-2" />
                                Supprimer
                              </CDropdownItem>
                            </CDropdownMenu>
                          </CDropdown>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

       <CModal size="lg" visible={showModal} onClose={handleCloseModal} backdrop="static">
  <CModalHeader closeButton>
    <CModalTitle>
      {editingProfessor ? 'Modifier le professeur' : 'Nouveau Professeur'}
    </CModalTitle>
  </CModalHeader>

  {/* ✅ Key pour forcer reset du formulaire */}
  <CForm key={editingProfessor?.id || 'new'} onSubmit={handleSubmit}>
    <CModalBody>
      <CRow>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="first_name">Prénom *</CFormLabel>
            <CFormInput
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
          </div>
        </CCol>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="last_name">Nom *</CFormLabel>
            <CFormInput
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>
        </CCol>
      </CRow>

      <CRow>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="email">Email *</CFormLabel>
            <CFormInput
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
        </CCol>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="phone">Téléphone</CFormLabel>
            <CFormInput
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </CCol>
      </CRow>

      <CRow>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="grade_id">Grade</CFormLabel>
            <CFormSelect
              id="grade_id"
              value={formData.grade_id}
              onChange={(e) => setFormData({ ...formData, grade_id: e.target.value })}
            >
              <option value="">Sélectionner un grade</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>{grade.name}</option>
              ))}
            </CFormSelect>
          </div>
        </CCol>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="speciality">Spécialité</CFormLabel>
            <CFormInput
              id="speciality"
              value={formData.speciality}
              onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
            />
          </div>
        </CCol>
      </CRow>

      <CRow>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="statut">Statut *</CFormLabel>
            <CFormSelect
              id="statut"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </CFormSelect>
          </div>
        </CCol>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="bank">Banque</CFormLabel>
            <CFormInput
              id="bank"
              value={formData.bank}
              onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
              placeholder="Nom de la banque"
            />
          </div>
        </CCol>
      </CRow>

      <CRow>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="rib_number">Numéro RIB</CFormLabel>
            <CFormInput
              id="rib_number"
              value={formData.rib_number}
              onChange={(e) => {
                setFormData({ ...formData, rib_number: e.target.value });
                if (validationErrors.rib) setValidationErrors({ ...validationErrors, rib: undefined });
              }}
              invalid={!!validationErrors.rib}
            />
            {validationErrors.rib && <CFormFeedback invalid>{validationErrors.rib}</CFormFeedback>}
            <small className="text-muted d-block">22 à 27 caractères alphanumériques</small>
          </div>
        </CCol>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="rib_file">Document RIB</CFormLabel>
            <CFormInput
              type="file"
              id="rib_file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setRibFile(e.target.files?.[0] || null)}
            />
            <small className="text-muted">PDF, JPG ou PNG</small>
          </div>
        </CCol>
      </CRow>

      <CRow>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="ifu_number">Numéro IFU</CFormLabel>
            <CFormInput
              id="ifu_number"
              value={formData.ifu_number}
              onChange={(e) => {
                setFormData({ ...formData, ifu_number: e.target.value });
                if (validationErrors.ifu) setValidationErrors({ ...validationErrors, ifu: undefined });
              }}
              invalid={!!validationErrors.ifu}
            />
            {validationErrors.ifu && <CFormFeedback invalid>{validationErrors.ifu}</CFormFeedback>}
            <small className="text-muted d-block">13 chiffres exactement</small>
          </div>
        </CCol>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="ifu_file">Document IFU</CFormLabel>
            <CFormInput
              type="file"
              id="ifu_file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setIfuFile(e.target.files?.[0] || null)}
            />
            <small className="text-muted">PDF, JPG ou PNG</small>
          </div>
        </CCol>
      </CRow>

      <CRow>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="nationality">Nationalité</CFormLabel>
            <CFormInput
              id="nationality"
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            />
          </div>
        </CCol>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="profession">Profession</CFormLabel>
            <CFormInput
              id="profession"
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
            />
          </div>
        </CCol>
      </CRow>

      <CRow>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="city">Ville</CFormLabel>
            <CFormInput
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
        </CCol>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="district">District</CFormLabel>
            <CFormInput
              id="district"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            />
          </div>
        </CCol>
      </CRow>

      <CRow>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="plot_number">Numéro de parcelle</CFormLabel>
            <CFormInput
              id="plot_number"
              value={formData.plot_number}
              onChange={(e) => setFormData({ ...formData, plot_number: e.target.value })}
            />
          </div>
        </CCol>
        <CCol md={6}>
          <div className="mb-3">
            <CFormLabel htmlFor="house_number">Numéro de maison</CFormLabel>
            <CFormInput
              id="house_number"
              value={formData.house_number}
              onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
            />
          </div>
        </CCol>
      </CRow>

      <div className="mb-3">
        <CFormLabel htmlFor="bio">Biographie</CFormLabel>
        <CFormTextarea
          id="bio"
          rows={3}
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
        />
      </div>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" onClick={handleCloseModal}>
        Annuler
      </CButton>
      <CButton color="primary" type="submit">
        {editingProfessor ? 'Mettre à jour' : 'Créer'}
      </CButton>
    </CModalFooter>
  </CForm>
</CModal>

      <CModal size="lg" visible={showDetailsModal} onClose={() => setShowDetailsModal(false)} backdrop="static">
        <CModalHeader closeButton>
          <CModalTitle>Détails du Professeur</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedProfessor && (
            <>
              <CRow className="mb-3">
                <CCol md={6}>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Nom complet</strong>
                    <span>{selectedProfessor.full_name}</span>
                  </div>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Email</strong>
                    <span>{selectedProfessor.email}</span>
                  </div>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Téléphone</strong>
                    <span>{selectedProfessor.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Spécialité</strong>
                    <span>{selectedProfessor.speciality || 'Non renseignée'}</span>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Grade</strong>
                    <span>{selectedProfessor.grade?.name || 'Non renseigné'}</span>
                  </div>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Statut</strong>
                    <CBadge color={selectedProfessor.status === 'active' ? 'success' : 'secondary'}>
                      {selectedProfessor.status}
                    </CBadge>
                  </div>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Banque</strong>
                    <span>{selectedProfessor.bank || 'Non renseignée'}</span>
                  </div>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Numéro RIB</strong>
                    <span>{selectedProfessor.rib_number || 'Non renseigné'}</span>
                  </div>
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={12}>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Numéro IFU</strong>
                    <span>{selectedProfessor.ifu_number || 'Non renseigné'}</span>
                  </div>
                  {selectedProfessor.bio && (
                    <div className="mb-3">
                      <strong className="text-muted d-block mb-1">Biographie</strong>
                      <p className="mb-0">{selectedProfessor.bio}</p>
                    </div>
                  )}
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Nationalité</strong>
                    <span>{selectedProfessor.nationality || 'Non renseignée'}</span>
                  </div>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Profession</strong>
                    <span>{selectedProfessor.profession || 'Non renseignée'}</span>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Ville</strong>
                    <span>{selectedProfessor.city || 'Non renseignée'}</span>
                  </div>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">District</strong>
                    <span>{selectedProfessor.district || 'Non renseigné'}</span>
                  </div>
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Numéro de parcelle</strong>
                    <span>{selectedProfessor.plot_number || 'Non renseigné'}</span>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Numéro de maison</strong>
                    <span>{selectedProfessor.house_number || 'Non renseigné'}</span>
                  </div>
                </CCol>
              </CRow>

              <div className="border-top pt-3">
                {selectedProfessor.created_at && (
                  <div className="mb-2">
                    <strong className="text-muted d-block mb-1">Date de création</strong>
                    <span>{new Date(selectedProfessor.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                )}
                {selectedProfessor.updated_at && (
                  <div>
                    <strong className="text-muted d-block mb-1">Dernière modification</strong>
                    <span>{new Date(selectedProfessor.updated_at).toLocaleString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDetailsModal(false)}>
            Fermer
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default Professors;
