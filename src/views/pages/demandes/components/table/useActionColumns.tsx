// src/views/pages/demandes/components/table/useActionColumns.tsx
// Ajoute automatiquement la colonne "Actions" à n'importe quelle liste de colonnes.
// Usage : const columns = useActionColumns(baseColumns, openDetail)

import type { ColumnDef } from './DemandeTable'
import { ActionCell } from './TableCells'
import type { DocumentRequest } from '@/types/document-request.types'

/**
 * Prend un tableau de colonnes et ajoute la colonne Actions à la fin.
 * @param base   Les colonnes métier sans la colonne action.
 * @param onOpen Callback appelé quand l'utilisateur clique sur Ouvrir.
 */
const useActionColumns = (
  base: Omit<ColumnDef, 'isAction'>[],
  onOpen: (d: DocumentRequest) => void,
): ColumnDef[] => [
  ...base,
  {
    header: 'Actions',
    width: 100,
    isAction: true,
    render: (d: DocumentRequest) => <ActionCell onOpen={() => onOpen(d)} />,
  },
]

export default useActionColumns
