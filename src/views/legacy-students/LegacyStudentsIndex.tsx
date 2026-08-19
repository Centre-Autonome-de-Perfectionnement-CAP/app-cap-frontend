import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  CButton,
  CBadge,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilUserPlus,
  cilCloudUpload,
  cilCloudDownload,
  cilFolderOpen,
} from '@coreui/icons';

import { useLegacyStudents } from './hooks/useLegacyStudents';

import LegacyStudentsStats from './components/LegacyStudentsStats';
import LegacyStudentsTable from './components/LegacyStudentsTable';
import LegacyStudentDetailModal from './components/LegacyStudentDetailModal';
import LegacyStudentFormModal from './components/LegacyStudentFormModal';
import LegacyStudentAcademicModal from './components/LegacyStudentAcademicModal';
import { LegacyAcademicDossiersTab } from './components/LegacyAcademicDossiersTab';
import RejectReasonModal from './components/RejectReasonModal';
import { ImportExcelModal } from './components/ImportExcelModal';
import { LegacyServicesRequestsTab } from './components/LegacyServicesRequestsTab';
import { LegacyDocumentGeneratorTab } from './components/LegacyDocumentGeneratorTab';

import type { LegacyStudent, LegacyStudentFormData } from '@/types/legacyStudent.types';

// ─── Sous-pages ─────────────────────────────────────────────────────────────

const RegistresPage: React.FC<{
  students: LegacyStudent[];
  stats: any;
  filieres: any[];
  loading: boolean;
  filters: any;
  setFilters: any;
  pagination: any;
  selectedIds: any[];
  fetchStudents: () => void;
  handleValidate: any;
  handleBulkValidate: any;
  handleBulkReject: any;
  handlePrintPdf: any;
  toggleSelectAll: any;
  toggleSelectOne: any;
  onOpenEdit: (s: LegacyStudent) => void;
  onOpenReject: (s: LegacyStudent) => void;
  onOpenDetail: (s: LegacyStudent) => void;
  onOpenAcademic: (s: LegacyStudent) => void;
}> = ({
  students, stats, filieres, loading, filters, setFilters,
  pagination, selectedIds, fetchStudents, handleValidate,
  handleBulkValidate, handleBulkReject, handlePrintPdf,
  toggleSelectAll, toggleSelectOne,
  onOpenEdit, onOpenReject, onOpenDetail, onOpenAcademic,
}) => (
  <div>
    <LegacyStudentsStats stats={stats} loading={loading} />
    <LegacyStudentsTable
      students={students}
      filieres={filieres}
      loading={loading}
      filters={filters}
      setFilters={setFilters}
      pagination={pagination}
      selectedIds={selectedIds}
      toggleSelectAll={toggleSelectAll}
      toggleSelectOne={toggleSelectOne}
      onValidateOne={handleValidate}
      onReject={onOpenReject}
      onEdit={onOpenEdit}
      onViewDetail={onOpenDetail}
      onPrintPdf={handlePrintPdf}
      onBulkValidate={handleBulkValidate}
      onBulkReject={handleBulkReject}
      onOpenAcademic={onOpenAcademic}
    />
  </div>
);

// ─── Composant racine ────────────────────────────────────────────────────────

const LegacyStudentsIndex: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
  } = useLegacyStudents();

  // Modales
  const [detailStudent, setDetailStudent] = useState<LegacyStudent | null>(null);
  const [academicStudent, setAcademicStudent] = useState<LegacyStudent | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formStudent, setFormStudent] = useState<LegacyStudent | null>(null);
  const [importVisible, setImportVisible] = useState(false);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectStudent, setRejectStudent] = useState<LegacyStudent | null>(null);

  const handleOpenCreate = () => {
    setFormMode('create');
    setFormStudent(null);
    setFormVisible(true);
  };

  const handleOpenEdit = (student: LegacyStudent) => {
    setFormMode('edit');
    setFormStudent(student);
    setFormVisible(true);
  };

  const handleSaveForm = async (data: LegacyStudentFormData): Promise<boolean> => {
    if (formMode === 'create') {
      const ok = await handleCreate(data);
      return Boolean(ok);
    } else {
      if (!formStudent) return false;
      const ok = await handleUpdate(formStudent.id, data);
      return Boolean(ok);
    }
  };

  const handleOpenReject = (student: LegacyStudent) => {
    setRejectStudent(student);
    setRejectVisible(true);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectStudent) return;
    await handleReject(rejectStudent.id, reason);
    setRejectVisible(false);
    setRejectStudent(null);
  };

  const isActive = (segment: string) =>
    location.pathname.includes(`/legacy-students/${segment}`);

  return (
    <div className="container-fluid p-0">
      {/* ── EN-TÊTE ──────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1 text-primary d-flex align-items-center gap-2">
            <CIcon icon={cilFolderOpen} size="lg" />
            {isActive('registres') && 'Registres & Fiches Étudiants (< 2023)'}
            {isActive('dossiers') && 'Dossiers Académiques des Anciens Étudiants Validés'}
            {isActive('services') && 'Demandes de Services Étudiants (< 2023)'}
            {isActive('documents') && 'Délivrance de Documents Rétroactifs'}
          </h2>
          <p className="text-muted mb-0 small">
            {isActive('registres') && 'Gérez les dossiers administratifs des anciens étudiants, validez ou rejetez les fiches déclarées.'}
            {isActive('dossiers') && 'Consultez et complétez les relevés de notes, moyennes, UE et mémoires des anciens étudiants validés.'}
            {isActive('services') && 'Suivez et traitez les demandes de services (Quitus Mémoire, Attestations, Bulletins...) des anciens étudiants.'}
            {isActive('documents') && 'Émettez des documents officiels rétroactifs: attestations, quitus de soutenance, fiches de régularisation.'}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <CButton color="primary" onClick={handleOpenCreate} className="d-flex align-items-center gap-1 shadow-sm">
            <CIcon icon={cilUserPlus} />
            + Enregistrer au Guichet
          </CButton>
          <CButton color="success" className="text-white d-flex align-items-center gap-1 shadow-sm" onClick={() => setImportVisible(true)}>
            <CIcon icon={cilCloudUpload} />
            Importer Excel
          </CButton>
          <CButton color="secondary" variant="outline" className="d-flex align-items-center gap-1" onClick={handleExport}>
            <CIcon icon={cilCloudDownload} />
            Exporter CSV
          </CButton>
        </div>
      </div>

      {/* ── CONTENU DES SOUS-ROUTES ──────────────────────────────────────────── */}
      <Routes>
        <Route path="registres" element={
          <RegistresPage
            students={students}
            stats={stats}
            filieres={filieres}
            loading={loading}
            filters={filters}
            setFilters={setFilters}
            pagination={pagination}
            selectedIds={selectedIds}
            fetchStudents={fetchStudents}
            handleValidate={handleValidate}
            handleBulkValidate={handleBulkValidate}
            handleBulkReject={handleBulkReject}
            handlePrintPdf={handlePrintPdf}
            toggleSelectAll={toggleSelectAll}
            toggleSelectOne={toggleSelectOne}
            onOpenEdit={handleOpenEdit}
            onOpenReject={handleOpenReject}
            onOpenDetail={(s) => setDetailStudent(s)}
            onOpenAcademic={(s) => setAcademicStudent(s)}
          />
        } />

        <Route path="dossiers" element={
          <LegacyAcademicDossiersTab
            filieres={filieres}
            onOpenAcademic={(s) => setAcademicStudent(s)}
            onOpenDetail={(s) => setDetailStudent(s)}
          />
        } />

        <Route path="services" element={<LegacyServicesRequestsTab />} />

        <Route path="documents" element={<LegacyDocumentGeneratorTab students={students} />} />

        {/* Redirection par défaut vers registres */}
        <Route path="*" element={<Navigate to="registres" replace />} />
      </Routes>

      {/* ── MODALES PARTAGÉES (accessibles peu importe l'onglet actif) ───────── */}
      <LegacyStudentDetailModal
        student={detailStudent}
        onClose={() => setDetailStudent(null)}
        onOpenAcademic={(s) => setAcademicStudent(s)}
      />

      <LegacyStudentAcademicModal
        student={academicStudent}
        onClose={() => setAcademicStudent(null)}
      />

      <LegacyStudentFormModal
        visible={formVisible}
        mode={formMode}
        student={formStudent}
        filieres={filieres}
        onClose={() => setFormVisible(false)}
        onSaved={handleSaveForm}
      />

      <RejectReasonModal
        visible={rejectVisible}
        studentName={rejectStudent ? `${rejectStudent.last_name} ${rejectStudent.first_name}` : undefined}
        onClose={() => {
          setRejectVisible(false);
          setRejectStudent(null);
        }}
        onConfirm={handleConfirmReject}
      />

      <ImportExcelModal
        visible={importVisible}
        onClose={() => setImportVisible(false)}
        onSuccess={fetchStudents}
      />
    </div>
  );
};

export default LegacyStudentsIndex;
