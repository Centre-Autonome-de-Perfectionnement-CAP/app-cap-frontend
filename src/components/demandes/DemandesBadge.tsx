// src/components/demandes/DemandesBadge.tsx
//
// Tâche 11.2 — Badge numérique style notification mobile sur la carte du portail.
// Tâche 11.4 — Rendu nul si count est null (0 dossiers en attente).

import React from 'react'

interface DemandesBadgeProps {
  /** Nombre à afficher. null = badge masqué (tâche 11.4). */
  count: number | null
}

/**
 * Badge de notification discret mais bien visible, style "bulle iOS".
 * Se positionne en absolu dans le coin supérieur droit de son parent.
 * Le parent doit avoir position: relative (géré dans Portail.tsx).
 */
export const DemandesBadge: React.FC<DemandesBadgeProps> = ({ count }) => {
  // Tâche 11.4 : pas de badge si aucun dossier en attente
  if (!count) return null

  // Affiche "99+" au-delà de 99 pour ne pas écraser la carte
  const label = count > 99 ? '99+' : String(count)

  return (
    <span
      aria-label={`${count} dossier${count > 1 ? 's' : ''} en attente`}
      style={{
        // Positionnement absolu dans le coin supérieur droit de la carte
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10,

        // Style bulle notification
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: count > 9 ? '26px' : '22px',
        height: '22px',
        padding: '0 6px',
        borderRadius: '11px',

        // Couleurs : rouge vif — signal d'attention clair
        backgroundColor: '#dc3545',
        color: '#ffffff',
        fontSize: '0.72rem',
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '0.01em',

        // Ombre légère pour ressortir sur l'image
        boxShadow: '0 2px 6px rgba(220, 53, 69, 0.5)',

        // Animation d'entrée discrète
        animation: 'demandeBadgePop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
    >
      {label}

      {/* Keyframe inline — évite d'avoir besoin d'un fichier CSS global */}
      <style>{`
        @keyframes demandeBadgePop {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </span>
  )
}

export default DemandesBadge
