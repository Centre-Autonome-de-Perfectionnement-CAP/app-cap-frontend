/**
 * Onglet : Générateur Direct de Documents et Attestations Rétroactives (< 2023)
 * Permet à la scolarité d'émettre des attestations officielles et quitus rétroactifs.
 */

import React, { useState } from 'react';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CButton,
  CFormSelect,
  CFormInput,
  CAlert,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPrint, cilDescription, cilCheckAlt, cilFile } from '@coreui/icons';
import Swal from 'sweetalert2';
import { generateLegacyStudentPdf, RetroactiveDocType } from '../utils/generateLegacyStudentPdf';
import type { LegacyStudent } from '@/types/legacyStudent.types';

interface LegacyDocumentGeneratorTabProps {
  students: LegacyStudent[];
}

export const LegacyDocumentGeneratorTab: React.FC<LegacyDocumentGeneratorTabProps> = ({ students }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [docType, setDocType] = useState<RetroactiveDocType>('attestation_diplome');
  const [mention, setMention] = useState<string>('Bien');
  const [session, setSession] = useState<string>('Session Unique');

  const selectedStudent = students.find((s) => String(s.id) === String(selectedStudentId));

  const handleGenerate = () => {
    if (!selectedStudent) {
      Swal.fire('Attention', 'Veuillez sélectionner un ancien étudiant dans la liste.', 'warning');
      return;
    }

    generateLegacyStudentPdf(selectedStudent, docType, {
      mention,
      session,
      annee_diplome: selectedStudent.enrollment_year + 3,
    });

    Swal.fire({
      icon: 'success',
      title: 'Document Officiel Généré !',
      text: `Le document ${docType} pour ${selectedStudent.last_name} ${selectedStudent.first_name} a été téléchargé.`,
      timer: 2500,
      showConfirmButton: false,
    });
  };

  return (
    <div>
      <CRow className="g-4">
        <CCol lg={6}>
          <CCard className="shadow-sm border-0 h-100">
            <CCardHeader className="bg-primary text-white fw-bold py-3">
              <CIcon icon={cilDescription} className="me-2" />
              1. Paramètres du Document à Délivrer
            </CCardHeader>
            <CCardBody className="p-4">
              <div className="mb-3">
                <label className="form-label fw-bold">Sélectionner l'Ancien Étudiant * :</label>
                <CFormSelect
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">-- Choisir un étudiant enregistré --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.matricule}] {s.last_name} {s.first_name} (Promo {s.enrollment_year} - {s.department?.name || 'Génie Civil'})
                    </option>
                  ))}
                </CFormSelect>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Type de Document Officiel Rétroactif * :</label>
                <CFormSelect
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as RetroactiveDocType)}
                >
                  <option value="attestation_diplome">📜 Attestation Rétroactive de Diplôme / Réussite</option>
                  <option value="quitus_memoire">🎓 Quitus Officiel de Validation de Mémoire</option>
                  <option value="fiche_identification">👤 Fiche Complète d'Identification & Régularisation</option>
                </CFormSelect>
              </div>

              {docType === 'attestation_diplome' && (
                <CRow className="g-3 mb-3">
                  <CCol sm={6}>
                    <label className="form-label fw-bold">Mention accordée :</label>
                    <CFormSelect value={mention} onChange={(e) => setMention(e.target.value)}>
                      <option value="Passable">Passable</option>
                      <option value="Assez-Bien">Assez-Bien</option>
                      <option value="Bien">Bien</option>
                      <option value="Très-Bien">Très-Bien</option>
                    </CFormSelect>
                  </CCol>
                  <CCol sm={6}>
                    <label className="form-label fw-bold">Session d'examen :</label>
                    <CFormInput
                      value={session}
                      onChange={(e) => setSession(e.target.value)}
                      placeholder="Ex: Session de Juillet"
                    />
                  </CCol>
                </CRow>
              )}

              <CButton
                color="primary"
                size="lg"
                className="w-100 mt-3 d-flex align-items-center justify-content-center gap-2"
                onClick={handleGenerate}
                disabled={!selectedStudent}
              >
                <CIcon icon={cilPrint} />
                Générer et Imprimer le Document PDF
              </CButton>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={6}>
          <CCard className="shadow-sm border-0 h-100">
            <CCardHeader className="bg-light fw-bold py-3 text-secondary">
              <CIcon icon={cilFile} className="me-2" />
              2. Aperçu des Informations du Titulaire
            </CCardHeader>
            <CCardBody className="p-4">
              {selectedStudent ? (
                <div>
                  <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded">
                    <div className="fs-1 text-primary">🎓</div>
                    <div>
                      <h5 className="fw-bold mb-1 text-primary">
                        {selectedStudent.last_name} {selectedStudent.first_name}
                      </h5>
                      <div className="font-monospace text-muted">Matricule : {selectedStudent.matricule}</div>
                    </div>
                  </div>

                  <div className="mb-2"><strong>Filière suivie :</strong> {selectedStudent.department?.name || 'Génie Civil'} ({selectedStudent.department?.cycle || 'Licence'})</div>
                  <div className="mb-2"><strong>Année d'inscription :</strong> Promotion {selectedStudent.enrollment_year}</div>
                  <div className="mb-2"><strong>Email :</strong> {selectedStudent.email}</div>
                  <div className="mb-2"><strong>Téléphone :</strong> {selectedStudent.phone}</div>
                  <div className="mb-3">
                    <strong>Statut dossier : </strong>
                    <span className="badge bg-success">Validé en Scolarité</span>
                  </div>

                  <CAlert color="info" className="small mb-0">
                    <CIcon icon={cilCheckAlt} className="me-1" />
                    Ce document PDF comportera l'en-tête officiel du CAP-EPAC, les références de la promotion et le cadre réservé pour le visa de la direction.
                  </CAlert>
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <div className="fs-1 mb-2">📋</div>
                  <p>Veuillez sélectionner un ancien étudiant à gauche pour prévisualiser les données du document.</p>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  );
};

export default LegacyDocumentGeneratorTab;
