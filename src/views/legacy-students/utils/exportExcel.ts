/**
 * Utilitaire d'Export Excel / CSV pour le module Anciens Étudiants
 * Rôle: Développeur 6
 */

import type { LegacyStudent } from '@/types/legacyStudent.types';

/**
 * Exporte la liste des anciens étudiants au format CSV/Excel compatible
 */
export function exportLegacyStudentsToCSV(
  students: LegacyStudent[],
  filename = 'anciens_etudiants_cap.csv'
): void {
  if (!students || students.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  // En-têtes des colonnes
  const headers = [
    'Matricule',
    'Nom',
    'Prénoms',
    'Email',
    'Téléphone',
    "Année d'inscription",
    'Filière',
    'Statut',
    'Services demandés',
    'Motif de rejet',
    'Validé par',
    'Date de validation',
    'Date de déclaration',
  ];

  // Construction des lignes
  const rows = students.map((s) => {
    const filiereStr = s.department?.name || '';
    const statusLabel =
      s.status === 'validated'
        ? 'Validé'
        : s.status === 'rejected'
        ? 'Rejeté'
        : 'En attente';

    return [
      s.matricule,
      s.last_name,
      s.first_name,
      s.email,
      s.phone,
      s.enrollment_year,
      filiereStr,
      statusLabel,
      s.services_count || (s.services_requested ? s.services_requested.length : 0),
      s.rejection_reason || '',
      s.validated_by || '',
      s.validated_at ? new Date(s.validated_at).toLocaleDateString('fr-FR') : '',
      s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '',
    ];
  });

  // Échappement des caractères spéciaux CSV (séparateur point-virgule pour Excel français)
  const csvContent =
    '\uFEFF' + // UTF-8 BOM pour assurer le bon affichage des accents dans Excel
    [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '');
            if (str.includes(';') || str.includes('\n') || str.includes('"')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(';')
      )
      .join('\r\n');

  // Déclenchement du téléchargement dans le navigateur
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
