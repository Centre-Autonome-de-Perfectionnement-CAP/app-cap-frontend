/**
 * Composant Modal d'Importation Excel / CSV pour les Anciens Étudiants
 * Rôle: Développeur 6
 */

import React, { useState } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormInput,
  CAlert,
  CSpinner,
} from '@coreui/react';
import Swal from 'sweetalert2';
import legacyStudentAdminService from '@/services/legacyStudentAdminService';

interface ImportExcelModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

      if (!validExtensions.includes(fileExt)) {
        setError('Veuillez sélectionner un fichier valide (.xlsx, .xls ou .csv)');
        setFile(null);
        return;
      }

      setError(null);
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier à importer.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await legacyStudentAdminService.importExcel(file);
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Importation Réussie !',
          text: `${result.importedCount || 'Les'} dossiers d'anciens étudiants ont été importés avec succès.`,
        });
        setFile(null);
        onSuccess();
        onClose();
      } else {
        setError("Erreur lors de l'importation du fichier.");
      }
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue lors de l'importation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CModal visible={visible} onClose={onClose} size="lg" alignment="center">
      <CModalHeader closeButton>
        <CModalTitle className="fw-bold text-primary">
          📂 Importer des Anciennes Promotions (Excel / CSV)
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        <CAlert color="info" className="mb-4">
          <h6 className="alert-heading fw-bold">ℹ️ Format attendu du fichier :</h6>
          <p className="mb-1 small">
            Le fichier Excel ou CSV doit comporter les colonnes suivantes :
          </p>
          <ul className="small mb-0">
            <li><strong>Matricule</strong> (ex: 18-0452-EPAC)</li>
            <li><strong>Nom</strong> & <strong>Prénoms</strong></li>
            <li><strong>Email</strong> & <strong>Téléphone</strong></li>
            <li><strong>Annee_Inscription</strong> (ex: 2018)</li>
            <li><strong>Filieres</strong> (Séparées par une virgule ou point-virgule)</li>
          </ul>
        </CAlert>

        {error && <CAlert color="danger">{error}</CAlert>}

        <div className="mb-3">
          <label className="form-label fw-bold">Sélectionner le fichier :</label>
          <CFormInput
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>

        {file && (
          <div className="p-3 bg-light rounded border text-muted small">
            <div><strong>Fichier sélectionné :</strong> {file.name}</div>
            <div><strong>Taille :</strong> {(file.size / 1024).toFixed(2)} Ko</div>
          </div>
        )}
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" onClick={onClose} disabled={loading}>
          Annuler
        </CButton>
        <CButton color="primary" onClick={handleImport} disabled={!file || loading}>
          {loading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Importation en cours...
            </>
          ) : (
            '🚀 Lancer l’importation'
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};
