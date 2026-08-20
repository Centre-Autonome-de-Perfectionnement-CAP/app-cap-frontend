// SecretaryFileUploader.tsx — correction erreur 500 + responsivité
// - Suppression du slash initial dans l'URL (double slash avec baseURL)
// - Changement du format FormData : files[] au lieu de files[0][file]
// - UI responsive

import { useState, useRef } from 'react'
import { CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudUpload, cilFile } from '@coreui/icons'
import HttpService from '@/services/http.service'
import { useToast } from '@/contexts'

interface Props {
  demandeId: number
  onSuccess: () => Promise<void>
}

export const SecretaryFileUploader = ({ demandeId, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setSelectedFiles(Array.from(e.target.files))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    setLoading(true)

    // Format accepté par Laravel : files[] (tableau simple)
    const formData = new FormData()
    selectedFiles.forEach((file) => {
      formData.append('files[]', file, file.name)
    })

    try {
      // Pas de slash initial — le baseURL est déjà "https://xxx/api/"
      await HttpService.post(`attestations/document-requests/${demandeId}/secretary-files`, formData)

      if (fileInputRef.current) fileInputRef.current.value = ''
      setSelectedFiles([])

      toast.success('Pièce(s) jointe(s) ajoutée(s) avec succès.')
      await onSuccess()
    } catch (err: any) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      setSelectedFiles([])

      let errMsg = 'Une erreur inattendue est survenue'
      if (err.status === 401) {
        errMsg = 'Session expirée ou non autorisée.'
      } else if (err.status === 403) {
        errMsg = 'Action non autorisée pour ce statut.'
      } else if (err.status === 422) {
        errMsg = err.message || 'Données invalides. Vérifiez le type/taille des fichiers.'
      } else if (err.message) {
        errMsg = err.message
      }
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setSelectedFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
      padding: '14px 16px', marginTop: '16px',
    }}>
      <div style={{
        fontWeight: 700, fontSize: '0.9rem', color: '#1e293b',
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
      }}>
        <CIcon icon={cilCloudUpload} style={{ width: 16, color: '#6366f1' }} />
        Ajouter des pièces jointes
      </div>

      {/* Zone sélection */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
      }}>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept=".pdf,.jpg,.jpeg,.png"
        />
        <CButton
          color="light"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          style={{
            fontSize: '0.8rem', fontWeight: 600,
            color: '#4f46e5', border: '1px dashed #a5b4fc',
            background: '#e0e7ff', whiteSpace: 'nowrap',
          }}
        >
          Sélectionner des fichiers
        </CButton>

        {selectedFiles.length > 0 && !loading && (
          <>
            <CButton
              color="success"
              size="sm"
              onClick={handleUpload}
              style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}
            >
              <CIcon icon={cilCloudUpload} style={{ width: 13, marginRight: 5 }} />
              Envoyer ({selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''})
            </CButton>
            <CButton
              color="secondary"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
            >
              Annuler
            </CButton>
          </>
        )}

        {loading && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#6366f1' }}>
            <CSpinner size="sm" color="primary" />
            Envoi en cours…
          </span>
        )}
      </div>

      {/* Liste fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {selectedFiles.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#f8fafc', borderRadius: 6, padding: '5px 10px',
              border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#374151',
            }}>
              <CIcon icon={cilFile} style={{ width: 12, color: '#6366f1', flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </span>
              <span style={{ color: '#94a3b8', flexShrink: 0 }}>
                {(f.size / 1024).toFixed(0)} Ko
              </span>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: 8, marginBottom: 0 }}>
        Formats acceptés : PDF, JPG, PNG — Taille max : 10 Mo par fichier
      </p>
    </div>
  )
}
