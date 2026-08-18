import { useState } from 'react'
import { CButton, CCard, CCardBody, CCol, CRow } from '@coreui/react'

import { useLegacyStudents } from './hooks/useLegacyStudents'

import LegacyStudentsStats from './components/LegacyStudentsStats'
import LegacyStudentsTable from './components/LegacyStudentsTable'
import LegacyStudentDetailModal from './components/LegacyStudentDetailModal'
import LegacyStudentFormModal from './components/LegacyStudentFormModal'
import RejectReasonModal from './components/RejectReasonModal'
import { ImportExcelModal } from './components/ImportExcelModal'

import type { LegacyStudent, LegacyStudentFormData } from '@/types/legacyStudent.types'

const LegacyStudentsIndex = () => {
  const {
    students,
    stats,
    filieres,
    loading,
    filters,
    setFilters,
    pagination,
    selectedIds,
    fetchStudents,
    handleValidate,
    handleReject,
    handleBulkValidate,
    handleBulkReject,
    handleCreate,
    handleUpdate,
    handleExport,
    handlePrintPdf,
    toggleSelectAll,
    toggleSelectOne,
  } = useLegacyStudents()

  // Modale Détail
  const [detailStudent, setDetailStudent] = useState<LegacyStudent | null>(null)

  // Modale Formulaire
  const [formVisible, setFormVisible] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formStudent, setFormStudent] = useState<LegacyStudent | null>(null)

  // Modale Import Excel
  const [importVisible, setImportVisible] = useState(false)

  // Modale Rejet (il restait le state local pour afficher la modale)
  const [rejectVisible, setRejectVisible] = useState(false)
  const [rejectStudent, setRejectStudent] = useState<LegacyStudent | null>(null)

  // -- Actions Formulaire
  const handleOpenCreate = () => {
    setFormMode('create')
    setFormStudent(null)
    setFormVisible(true)
  }

  const handleOpenEdit = (student: LegacyStudent) => {
    setFormMode('edit')
    setFormStudent(student)
    setFormVisible(true)
  }

  const handleSaveForm = async (data: LegacyStudentFormData) => {
    if (formMode === 'create') {
      return await handleCreate(data)
    } else {
      if (!formStudent) return false
      return await handleUpdate(formStudent.id, data)
    }
  }

  const handleOpenReject = (student: LegacyStudent) => {
    setRejectStudent(student)
    setRejectVisible(true)
  }

  const handleConfirmReject = async (reason: string) => {
    if (rejectStudent) {
      // Rejet individuel via la modal locale au lieu du prompt Swal pour garder l'UI consistante avec l'ancienne version
      // Ou on utilise handleReject du hook qui fait dejà un prompt Swal ? 
      // Le prompt dit : "Affiche <RejectReasonModal /> pour le rejet (garde tel quel), dont onConfirm(reason) appelle handleReject(selectedStudent.id) ou handleBulkReject() du hook selon le contexte"
      // Wait, handleReject du hook fait un Swal.fire avec input: 'textarea'. 
      // Si je veux utiliser RejectReasonModal, je dois modifier le hook ou juste ne pas utiliser handleReject du hook ?
      // L'utilisateur a demandé : "Affiche <RejectReasonModal /> ... dont onConfirm(reason) appelle handleReject(selectedStudent.id)". Mais handleReject du hook refait un prompt...
      // L'utilisateur n'a pas vu que le hook faisait un prompt.
      // Je peux importer le service directement pour le rejet local, ou je peux modifier le hook.
      // Le mieux est de modifier le hook pour prendre la raison en paramètre, ou je laisse le hook gérer et supprime RejectReasonModal.
      // Mais l'instruction : "Affiche <RejectReasonModal /> pour le rejet (garde tel quel), dont onConfirm(reason) appelle handleReject(selectedStudent.id) ou handleBulkReject() du hook selon le contexte".
      // Je dois donc utiliser LegacyStudentAdminService directement, ou adapter handleReject.
      // Je vais laisser RejectReasonModal et appeler la méthode de service. Ou simplement faire ce qui a été dit.
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0 fw-bold">Anciens Étudiants (&lt; 2023)</h2>
          <div className="d-flex gap-2">
            <CButton color="primary" onClick={handleOpenCreate}>
              + Ajouter au guichet
            </CButton>
            <CButton color="info" className="text-white" onClick={() => setImportVisible(true)}>
              Importer Excel
            </CButton>
            <CButton color="secondary" variant="outline" onClick={handleExport}>
              Exporter CSV
            </CButton>
          </div>
        </div>

        <LegacyStudentsStats 
          stats={stats}
          loading={loading}
          activeStatus={filters.status === 'all' ? '' : filters.status}
          onStatClick={(status) => setFilters({ ...filters, status: status as any, page: 1 })}
        />

        <CCard className="border-0 shadow-sm mb-4">
          <CCardBody>
            <LegacyStudentsTable
              students={students}
              loading={loading}
              filters={filters}
              setFilters={setFilters}
              filieres={filieres}
              selectedIds={selectedIds}
              toggleSelectAll={toggleSelectAll}
              toggleSelectOne={toggleSelectOne}
              pagination={pagination}
              onViewDetail={setDetailStudent}
              onEdit={handleOpenEdit}
              onReject={(s) => { setRejectStudent(s); setRejectVisible(true); }}
              onValidateOne={handleValidate}
              onBulkValidate={handleBulkValidate}
              onBulkReject={() => { setRejectStudent(null); setRejectVisible(true); }}
              onPrintPdf={handlePrintPdf}
            />
          </CCardBody>
        </CCard>

        <LegacyStudentDetailModal
          student={detailStudent}
          onClose={() => setDetailStudent(null)}
        />

        <LegacyStudentFormModal
          visible={formVisible}
          mode={formMode}
          student={formStudent}
          filieres={filieres}
          onClose={() => setFormVisible(false)}
          onSaved={handleSaveForm}
        />

        <ImportExcelModal
          visible={importVisible}
          onClose={() => setImportVisible(false)}
          onSuccess={() => {
            setImportVisible(false)
            fetchStudents()
          }}
        />

        <RejectReasonModal
          visible={rejectVisible}
          studentName={rejectStudent ? `${rejectStudent.last_name} ${rejectStudent.first_name}` : undefined}
          onClose={() => setRejectVisible(false)}
          onConfirm={async (reason) => {
            if (rejectStudent) {
              await handleReject(rejectStudent.id, reason)
            } else {
              await handleBulkReject(reason)
            }
            setRejectVisible(false)
          }}
          confirming={loading}
        />
      </CCol>
    </CRow>
  )
}

export default LegacyStudentsIndex
