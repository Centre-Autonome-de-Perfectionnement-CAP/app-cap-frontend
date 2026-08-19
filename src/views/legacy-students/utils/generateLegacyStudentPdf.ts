/**
 * Générateur de Documents Officiels PDF pour Anciens Étudiants (< 2023)
 * Supporte : Fiche d'identification, Attestation Rétroactive, Quitus Mémoire, Attestation de Fréquentation.
 */

import { jsPDF } from 'jspdf';
import type { LegacyStudent } from '@/types/legacyStudent.types';

export type RetroactiveDocType =
  | 'fiche_identification'
  | 'attestation_diplome'
  | 'quitus_memoire'
  | 'attestation_frequentation';

export function generateLegacyStudentPdf(
  student: LegacyStudent,
  docType: RetroactiveDocType = 'fiche_identification',
  customOptions?: { mention?: string; numero_quittance?: string; session?: string; annee_diplome?: number }
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const filiereName = student.department ? student.department.name : (student.filieres?.[0]?.name || 'Filière non spécifiée');
  const cycleName = student.cycle || student.department?.cycle || student.filieres?.[0]?.cycle || 'Licence Professionnelle';

  // 1. En-tête Institutionnel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 50, 90);
  doc.text('RÉPUBLIQUE DU BÉNIN', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text('MINISTÈRE DE L’ENSEIGNEMENT SUPÉRIEUR ET DE LA RECHERCHE SCIENTIFIQUE', pageWidth / 2, 23, { align: 'center' });
  doc.text('UNIVERSITÉ D’ABOMEY-CALAVI (UAC) — ÉCOLE POLYTECHNIQUE (EPAC)', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 80, 140);
  doc.text('CENTRE AUTONOME DE PERFECTIONNEMENT (CAP-EPAC)', pageWidth / 2, 33, { align: 'center' });

  // Ligne de séparation
  doc.setDrawColor(20, 50, 90);
  doc.setLineWidth(0.7);
  doc.line(20, 36, pageWidth - 20, 36);

  // ── CAS 1 : ATTESTATION DE DIPLÔME RÉTROACTIVE ─────────────────────────
  if (docType === 'attestation_diplome') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(20, 50, 90);
    doc.text('ATTESTATION RÉTROACTIVE DE SUCCÈS & DE DIPLÔME', pageWidth / 2, 48, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Régularisation Archives — Promotion ${student.enrollment_year}`, pageWidth / 2, 53, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 30, 30);

    const bodyText = `Le Directeur du Centre Autonome de Perfectionnement de l’École Polytechnique d’Abomey-Calavi (CAP-EPAC), soussigné, atteste que :`;
    doc.text(bodyText, 25, 68);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`M./Mme : ${student.last_name.toUpperCase()} ${student.first_name}`, pageWidth / 2, 80, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.text(`Numéro Matricule : `, 25, 92);
    doc.setFont('helvetica', 'bold');
    doc.text(student.matricule, 70, 92);

    doc.setFont('helvetica', 'normal');
    doc.text(`Année d'entrée au CAP : `, 25, 100);
    doc.setFont('helvetica', 'bold');
    doc.text(String(student.enrollment_year), 70, 100);

    doc.setFont('helvetica', 'normal');
    doc.text(`Filière / Spécialité : `, 25, 108);
    doc.setFont('helvetica', 'bold');
    doc.text(filiereName, 70, 108);

    doc.setFont('helvetica', 'normal');
    doc.text(`Cycle de formation : `, 25, 116);
    doc.setFont('helvetica', 'bold');
    doc.text(cycleName, 70, 116);

    const attestationParagraph =
      `A satisfait avec succès à toutes les exigences académiques et pédagogiques des programmes du CAP-EPAC selon les registres physiques d'archives et est déclaré(e) titulaire du diplôme correspondant.`;
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(attestationParagraph, pageWidth - 50), 25, 130);

    const mentionParagraph = `En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.`;
    doc.text(mentionParagraph, 25, 150);

    // Cadre Signature
    doc.setFontSize(9.5);
    doc.text(`Fait à Abomey-Calavi, le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 90, 175);
    doc.setFont('helvetica', 'bold');
    doc.text('Le Directeur du CAP-EPAC', pageWidth - 80, 185);
    doc.setFont('helvetica', 'italic');
    doc.text('(Cachet et Signature)', pageWidth - 75, 215);

    doc.save(`Attestation_Diplome_${student.matricule}.pdf`);
    return;
  }

  // ── CAS 2 : QUITUS DE MÉMOIRE / SOUTENANCE ──────────────────────────────
  if (docType === 'quitus_memoire') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(20, 50, 90);
    doc.text('QUITUS DE VALIDATION DE MÉMOIRE', pageWidth / 2, 48, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Autorisation de dépôt & régularisation de soutenance', pageWidth / 2, 53, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);

    doc.text(`La scolarité du Centre Autonome de Perfectionnement certifie par la présente que :`, 25, 68);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text(`L'étudiant(e) : ${student.last_name.toUpperCase()} ${student.first_name}`, 25, 78);
    doc.text(`Matricule : ${student.matricule}`, 25, 86);
    doc.text(`Filière : ${filiereName} (${cycleName})`, 25, 94);
    doc.text(`Promotion : ${student.enrollment_year}`, 25, 102);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const textQuitus =
      `Est en règle vis-à-vis des exigences administratives, financières et documentaires requises pour la régularisation de son dossier de mémoire et de soutenance au titre des archives antérieures à 2023.`;
    doc.text(doc.splitTextToSize(textQuitus, pageWidth - 50), 25, 115);

    doc.text('Le présent quitus est délivré pour faire valoir ses droits administratifs.', 25, 135);

    // Cadre signature
    doc.text(`Abomey-Calavi, le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 90, 160);
    doc.setFont('helvetica', 'bold');
    doc.text('Le Responsable de la Scolarité', pageWidth - 85, 170);

    doc.save(`Quitus_Memoire_${student.matricule}.pdf`);
    return;
  }

  // ── CAS 3 : FICHE D'IDENTIFICATION PAR DÉFAUT ───────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 50, 90);
  doc.text("FICHE D'IDENTIFICATION & DE RÉGULARISATION", pageWidth / 2, 48, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('(Archives & Promotions antérieures à 2023)', pageWidth / 2, 53, { align: 'center' });

  // Cadre infos
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, 60, pageWidth - 40, 92, 3, 3, 'FD');

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 50, 90);
  doc.text('I. INFORMATIONS PERSONNELLES & ACADÉMIQUES', 25, 68);

  doc.setFontSize(9.5);
  doc.setTextColor(40, 40, 40);
  const startY = 76;
  const spacing = 7;

  doc.text('Numéro Matricule :', 25, startY);
  doc.setFont('helvetica', 'normal');
  doc.text(student.matricule, 75, startY);

  doc.setFont('helvetica', 'bold');
  doc.text('Nom & Prénoms :', 25, startY + spacing);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.last_name} ${student.first_name}`, 75, startY + spacing);

  doc.setFont('helvetica', 'bold');
  doc.text('Né(e) le / à :', 25, startY + spacing * 2);
  doc.setFont('helvetica', 'normal');
  const birthInfo = `${student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('fr-FR') : '—'}${student.place_of_birth ? ` à ${student.place_of_birth}` : ''}`;
  doc.text(birthInfo, 75, startY + spacing * 2);

  doc.setFont('helvetica', 'bold');
  doc.text("Année d'inscription :", 25, startY + spacing * 3);
  doc.setFont('helvetica', 'normal');
  doc.text(String(student.enrollment_year), 75, startY + spacing * 3);

  doc.setFont('helvetica', 'bold');
  doc.text('Cycle d\'études :', 25, startY + spacing * 4);
  doc.setFont('helvetica', 'normal');
  doc.text(cycleName, 75, startY + spacing * 4);

  doc.setFont('helvetica', 'bold');
  doc.text('Filière :', 25, startY + spacing * 5);
  doc.setFont('helvetica', 'normal');
  doc.text(filiereName, 75, startY + spacing * 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Email :', 25, startY + spacing * 6);
  doc.setFont('helvetica', 'normal');
  doc.text(student.email, 75, startY + spacing * 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Téléphone :', 25, startY + spacing * 7);
  doc.setFont('helvetica', 'normal');
  doc.text(student.phone, 75, startY + spacing * 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Statut scolarité :', 25, startY + spacing * 8);
  if (student.status === 'validated') {
    doc.setTextColor(16, 140, 40);
    doc.text('VALIDÉ', 75, startY + spacing * 8);
  } else if (student.status === 'rejected') {
    doc.setTextColor(200, 30, 30);
    doc.text('REJETÉ', 75, startY + spacing * 8);
  } else {
    doc.setTextColor(200, 140, 0);
    doc.text('EN ATTENTE DE CONTRÔLE', 75, startY + spacing * 8);
  }

  // Visa
  doc.setDrawColor(180, 180, 180);
  doc.rect(20, 160, pageWidth - 40, 50);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('II. VISA & CERTIFICATION DU SERVICE DE LA SCOLARITÉ', 25, 168);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fait à Abomey-Calavi, le ${new Date().toLocaleDateString('fr-FR')}`, 25, 176);
  if (student.validated_by) {
    doc.text(`Traité par : ${student.validated_by}`, 25, 182);
  }
  doc.text('Cachet et signature de l’autorité :', pageWidth - 85, 176);

  doc.save(`Fiche_Identification_${student.matricule}.pdf`);
}
