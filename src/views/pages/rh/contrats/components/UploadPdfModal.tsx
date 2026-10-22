// src/views/pages/rh/contrats/components/UploadPdfModal.tsx
// Extrait tel quel de Contrats.tsx
import React, { useRef, useState } from 'react'
import rhService from '@/services/rh.service'
import type { Contrat } from '@/types/rh.types'
import Icon from '../Contrats.icons'
import { formatDate } from '../Contrats.helpers'
import Modal from './Modal'

const UploadPdfModal: React.FC<{
  contrat: Contrat;
  onClose: () => void;
  onSuccess: (updated: Contrat) => void;
}> = ({ contrat, onClose, onSuccess }) => {
  const [file, setFile]         = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const inputRef                = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    setError('');
    if (!f) { setFile(null); return; }
    if (f.type !== 'application/pdf') { setError('Veuillez sélectionner un fichier PDF.'); return; }
    if (f.size > 10 * 1024 * 1024) { setError('Le fichier est trop volumineux (max 10 Mo).'); return; }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) { setError('Veuillez sélectionner un fichier PDF.'); return; }
    setLoading(true); setError('');
    try {
      const updated = await rhService.uploadContratPdf(contrat.id, file);
      onSuccess(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err.message ?? "Erreur lors de l'upload.");
    } finally { setLoading(false); }
  };

  return (
    <Modal
      title="Uploader le PDF final"
      subtitle={`Contrat N° ${contrat.contrat_number} - remplace le PDF actuel`}
      onClose={onClose}
      footer={
        <>
          <button className="ctr-btn ctr-btn-ghost" onClick={onClose} disabled={loading}>Annuler</button>
          <button className="ctr-btn ctr-btn-orange" onClick={handleSubmit} disabled={loading || !file}>
            {loading ? <><Icon.Loader /> Upload en cours…</> : <><Icon.FileUpload /> Enregistrer le PDF</>}
          </button>
        </>
      }
    >
      <div
        className={`ctr-upload-zone${dragging ? ' drag' : ''}${file ? ' has-file' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0] ?? null); }}
      >
        {file ? (
          <div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', margin: '0 auto 8px' }}>
              <Icon.FilePdf />
            </div>
            <div style={{ fontWeight: 700, color: '#065f46', fontSize: 14 }}>{file.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} Ko - Cliquez pour changer</div>
          </div>
        ) : (
          <div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', margin: '0 auto 8px' }}>
              <Icon.FileUpload />
            </div>
            <div style={{ fontWeight: 600, color: '#ea580c', fontSize: 14 }}>Cliquez ou glissez le PDF ici</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Format PDF uniquement - max 10 Mo</div>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0] ?? null)} />
      {contrat.pdf_url && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#f0f9ff', border: '1px solid #bae6fd', fontSize: 12.5, color: '#0369a1' }}>
          <strong>PDF actuel :</strong>{' '}
          <a href={contrat.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0369a1' }}>
            Voir le PDF stocké <Icon.ExternalLink />
          </a>
          {contrat.pdf_uploaded_at && (
            <span style={{ marginLeft: 8, color: '#6b7280' }}>(uploadé le {formatDate(contrat.pdf_uploaded_at)})</span>
          )}
        </div>
      )}
      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b', fontSize: 13 }}>
          {error}
        </div>
      )}
    </Modal>
  );
};

export default UploadPdfModal
