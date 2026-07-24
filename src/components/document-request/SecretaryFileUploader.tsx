import { useState, useRef } from 'react'
import { CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudUpload } from '@coreui/icons'
import HttpService from '@/services/http.service'
import { useToast } from '@/contexts'

interface Props {
  demandeId: number
  onSuccess: () => Promise<void>
}

export const SecretaryFileUploader = ({ demandeId, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    setLoading(true)

    const formData = new FormData()
    Array.from(e.target.files).forEach((file, index) => {
      formData.append(`files[${index}][file]`, file)
      formData.append(`files[${index}][name]`, file.name)
    })

    try {
      await HttpService.post(`/attestations/document-requests/${demandeId}/secretary-files`, formData)
      
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      toast.success("Pièce(s) jointe(s) ajoutée(s) avec succès.")
      await onSuccess()
    } catch (err: any) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      let errMsg = 'Une erreur inattendue est survenue'
      if (err.status === 401) {
        errMsg = 'Session expirée ou non autorisée.'
      } else if (err.status === 403) {
        errMsg = 'Action non autorisée pour ce statut.'
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message
      } else if (err.message) {
        errMsg = err.message
      }
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
      padding: '16px', marginTop: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
          <CIcon icon={cilCloudUpload} style={{ width: 16, marginRight: 8, color: '#6366f1' }} />
          Ajouter des pièces jointes
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {loading && <CSpinner size="sm" color="primary" />}
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
            style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4f46e5', border: '1px dashed #a5b4fc', background: '#e0e7ff' }}
          >
            Sélectionner des fichiers
          </CButton>
        </div>
      </div>
    </div>
  )
}
