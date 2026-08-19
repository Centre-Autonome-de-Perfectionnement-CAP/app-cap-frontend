// src/views/pages/admin-db/TablesList.tsx
//
// Dashboard du panneau admin : liste et recherche sur toutes les tables de la base de données.

import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CCard, CCardBody, CSpinner, CAlert, CFormInput } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilDescription, cilSearch, cilStorage } from '@coreui/icons'
import adminDbService, { type AdminTableSummary } from '@/services/adminDb.service'
import { ADMIN_DB_BASE_PATH } from './constants'

// Icône par défaut ou spécialisée
const TABLE_ICONS: Record<string, any> = {
  document_requests: cilDescription,
  users: cilPeople,
  personal_informations: cilPeople,
  students: cilPeople,
  professors: cilPeople,
}

const TablesList = () => {
  const navigate = useNavigate()
  const [tables, setTables]   = useState<AdminTableSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    adminDbService
      .getTables()
      .then((res) => setTables(res.data ?? []))
      .catch(() => setError('Impossible de charger la liste des tables.'))
      .finally(() => setLoading(false))
  }, [])

  const filteredTables = useMemo(() => {
    if (!search.trim()) return tables
    const q = search.toLowerCase().trim()
    return tables.filter((t) => t.name.toLowerCase().includes(q))
  }, [tables, search])

  return (
    <div style={{ padding: '32px 40px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Base de Données — Gestion Totale
            </h1>
            <p style={{ fontSize: '1.05rem', color: '#64748b', marginTop: 6, marginBottom: 0 }}>
              Accès CRUD complet à toutes les tables ({tables.length} tables disponibles).
            </p>
          </div>

          <div style={{ width: 340 }}>
            <div style={{ position: 'relative' }}>
              <CIcon
                icon={cilSearch}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', width: 18, height: 18 }}
              />
              <CFormInput
                type="text"
                placeholder="Rechercher une table..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: 42,
                  height: 44,
                  fontSize: '0.98rem',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                }}
              />
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <CSpinner color="primary" style={{ width: 44, height: 44 }} />
            <p style={{ marginTop: 16, color: '#64748b', fontWeight: 600 }}>Chargement des tables...</p>
          </div>
        )}

        {error && (
          <CAlert color="danger" style={{ fontSize: '1.05rem', fontWeight: 600, borderRadius: 10 }}>
            {error}
          </CAlert>
        )}

        {!loading && !error && (
          <>
            <div style={{ marginBottom: 16, fontSize: '0.92rem', color: '#64748b', fontWeight: 600 }}>
              {filteredTables.length} table{filteredTables.length > 1 ? 's' : ''} affichée{filteredTables.length > 1 ? 's' : ''}
              {search && ` (sur ${tables.length})`}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 20,
              }}
            >
              {filteredTables.map((t) => (
                <CCard
                  key={t.name}
                  onClick={() => navigate(`${ADMIN_DB_BASE_PATH}/${t.name}`)}
                  style={{
                    cursor: 'pointer',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    background: '#ffffff',
                    transition: 'all 0.15s ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4f46e5'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(79, 70, 229, 0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <CCardBody style={{ padding: '20px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: '#eef2ff',
                          color: '#4f46e5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CIcon icon={TABLE_ICONS[t.name] ?? cilStorage} style={{ width: 20, height: 20 }} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 20,
                          background: '#f1f5f9',
                          color: '#475569',
                        }}
                      >
                        {t.count} ligne{t.count > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '1.08rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        fontFamily: 'monospace',
                        wordBreak: 'break-word',
                      }}
                    >
                      {t.name}
                    </div>
                  </CCardBody>
                </CCard>
              ))}

              {filteredTables.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                  Aucune table ne correspond à « {search} ».
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default TablesList
