// src/views/pages/admin-db/TablesList.tsx
//
// Dashboard du panneau admin : une grande carte par table autorisée.
// Style volontairement simple : fond blanc, texte gros, une seule
// couleur d'accent, pas d'ombre ni de dégradé.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CCard, CCardBody, CSpinner, CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilDescription } from '@coreui/icons'
import adminDbService, { type AdminTableSummary } from '@/services/adminDb.service'
import { ADMIN_DB_BASE_PATH } from './constants'

// Icône + libellé humain par table. Ajouter une ligne ici si une nouvelle
// table est un jour ajoutée à la whitelist backend.
const TABLE_ICONS: Record<string, any> = {
  document_requests: cilDescription,
  users: cilPeople,
}

const TABLE_LABELS: Record<string, string> = {
  document_requests: 'Demandes de documents',
  users: 'Utilisateurs',
}

const TablesList = () => {
  const navigate = useNavigate()
  const [tables, setTables]   = useState<AdminTableSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    adminDbService
      .getTables()
      .then((res) => setTables(res.data ?? []))
      .catch(() => setError('Impossible de charger la liste des tables.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: 32, background: '#ffffff', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: 0 }}>
        Panneau Base de Données
      </h1>
      <p style={{ fontSize: '1.15rem', color: '#4b5563', marginTop: 8, marginBottom: 36 }}>
        Accès direct réservé à l'administrateur. Choisissez une table pour la consulter et la modifier.
      </p>

      {loading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <CSpinner color="primary" style={{ width: 40, height: 40 }} />
        </div>
      )}

      {error && (
        <CAlert color="danger" style={{ fontSize: '1.05rem', fontWeight: 600 }}>
          {error}
        </CAlert>
      )}

      {!loading && !error && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {tables.map((t) => (
            <CCard
              key={t.name}
              onClick={() => navigate(`${ADMIN_DB_BASE_PATH}/${t.name}`)}
              style={{
                width: 300,
                cursor: 'pointer',
                border: '2px solid #e5e7eb',
                borderRadius: 14,
                boxShadow: 'none',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
              <CCardBody style={{ padding: 28, textAlign: 'center' }}>
                <CIcon
                  icon={TABLE_ICONS[t.name] ?? cilDescription}
                  style={{ width: 52, height: 52, color: '#2563eb' }}
                />
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', marginTop: 18 }}>
                  {TABLE_LABELS[t.name] ?? t.name}
                </div>
                <div style={{ fontSize: '1rem', color: '#6b7280', marginTop: 4, fontFamily: 'monospace' }}>
                  {t.name}
                </div>
                <div style={{ fontSize: '1.15rem', color: '#2563eb', fontWeight: 800, marginTop: 14 }}>
                  {t.count} ligne{t.count > 1 ? 's' : ''}
                </div>
              </CCardBody>
            </CCard>
          ))}

          {tables.length === 0 && (
            <div style={{ fontSize: '1.1rem', color: '#6b7280' }}>
              Aucune table disponible.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TablesList
