/**
 * Générateur de Fiche Officielle PDF pour Ancien Étudiant (< 2023)
 * Rôle: Développeur 6
 */

import { jsPDF } from 'jspdf';
import type { LegacyStudent } from '@/types/legacyStudent.types';

export function generateLegacyStudentPdf(student: LegacyStudent): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. En-tête Institutionnel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 50, 90);
  doc.text('RÉPUBLIQUE DU BÉNIN', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text('UNIVERSITÉ D’ABOMEY-CALAVI (UAC)', pageWidth / 2, 26, { align: 'center' });
  doc.text('ÉCOLE POLYTECHNIQUE D’ABOMEY-CALAVI (EPAC)', pageWidth / 2, 32, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(70, 70, 70);
  doc.text('CENTRE AUTONOME DE PERFECTIONNEMENT (CAP-EPAC)', pageWidth / 2, 38, { align: 'center' });

  // Ligne de séparation
  doc.setDrawColor(20, 50, 90);
  doc.setLineWidth(0.8);
  doc.line(20, 42, pageWidth - 20, 42);

  // 2. Titre du Document
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 50, 90);
  doc.text("FICHE D'IDENTIFICATION & DE RÉGULARISATION", pageWidth / 2, 52, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('(Archives & Promotions antérieures à 2023)', pageWidth / 2, 58, { align: 'center' });

  // 3. Cadre des informations de l'étudiant
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, 65, pageWidth - 40, 85, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 50, 90);
  doc.text('I. INFORMATIONS PERSONNELLES & ACADÉMIQUES', 25, 74);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);

  const startY = 82;
  const lineSpacing = 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Numéro Matricule :', 25, startY);
  doc.setFont('helvetica', 'normal');
  doc.text(student.matricule, 75, startY);

  doc.setFont('helvetica', 'bold');
  doc.text('Nom & Prénoms :', 25, startY + lineSpacing);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.last_name} ${student.first_name}`, 75, startY + lineSpacing);

  doc.setFont('helvetica', 'bold');
  doc.text("Année d'inscription :", 25, startY + lineSpacing * 2);
  doc.setFont('helvetica', 'normal');
  doc.text(String(student.enrollment_year), 75, startY + lineSpacing * 2);

  doc.setFont('helvetica', 'bold');
  doc.text('Email :', 25, startY + lineSpacing * 3);
  doc.setFont('helvetica', 'normal');
  doc.text(student.email, 75, startY + lineSpacing * 3);

  doc.setFont('helvetica', 'bold');
  doc.text('Téléphone :', 25, startY + lineSpacing * 4);
  doc.setFont('helvetica', 'normal');
  doc.text(student.phone, 75, startY + lineSpacing * 4);

  doc.setFont('helvetica', 'bold');
  doc.text('Statut du dossier :', 25, startY + lineSpacing * 5);
  doc.setFont('helvetica', 'bold');
  if (student.status === 'validated') {
    doc.setTextColor(16, 140, 40);
    doc.text('VALIDÉ PAR LA SCOLARITÉ', 75, startY + lineSpacing * 5);
  } else if (student.status === 'rejected') {
    doc.setTextColor(200, 30, 30);
    doc.text('REJETÉ', 75, startY + lineSpacing * 5);
  } else {
    doc.setTextColor(200, 140, 0);
    doc.text('EN ATTENTE DE CONTRÔLE', 75, startY + lineSpacing * 5);
  }

  // 4. Cadre de la Filière Suivie
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, 155, pageWidth - 40, 30, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 50, 90);
  doc.text('II. FILIÈRE SUIVIE AU CAP-EPAC', 25, 164);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);

  if (student.department) {
    const f = student.department;
    doc.text(
      `• ${f.name} ${f.cycle ? `(${f.cycle})` : ''} ${f.abbreviation ? `[${f.abbreviation}]` : ''}`,
      30,
      174
    );
  } else {
    doc.text('• Aucune filière enregistrée', 30, 174);
  }

  // 5. Cadre de Validation & Signature
  doc.setDrawColor(180, 180, 180);
  doc.rect(20, 195, pageWidth - 40, 55);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('III. VISA DU SECRÉTARIAT / SERVICE DE LA SCOLARITÉ', 25, 203);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Établi à Abomey-Calavi, le ${new Date().toLocaleDateString('fr-FR')}`, 25, 212);
  if (student.validated_by) {
    doc.text(`Validé par : ${student.validated_by}`, 25, 218);
  }
  if (student.notes_admin) {
    doc.text(`Observations : ${student.notes_admin}`, 25, 224);
  }

  doc.setFont('helvetica', 'italic');
  doc.text('Cachet et Signature de l’autorité compétente :', pageWidth - 90, 212);

  // 6. Pied de page
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 130);
  doc.text(
    'Centre Autonome de Perfectionnement (CAP-EPAC) — Université d’Abomey-Calavi — République du Bénin',
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  // Téléchargement automatique
  doc.save(`Fiche_Ancien_Etudiant_${student.matricule}.pdf`);
}
