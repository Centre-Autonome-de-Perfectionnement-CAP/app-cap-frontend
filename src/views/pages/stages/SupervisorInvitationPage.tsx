// src/views/pages/stages/SupervisorInvitationPage.tsx
// Page publique : le superviseur invité crée son compte à partir du lien
// reçu sur WhatsApp. Pensée d'abord pour le téléphone.

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CButton, CCard, CCardBody, CFormInput, CFormLabel, CSpinner } from '@coreui/react'
import stageService from '@/services/stage.service'
import { friendlyError } from '@/components/common/ActionResult'
import { FRONTEND_ROUTES } from '@/constants'

const SupervisorInvitationPage = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const [info, setInfo] = useState<{ phone: string; name: string | null } | null>(null)
  const [invalid, setInvalid] = useState<string | null>(null)
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', password: '', password_confirmation: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  // Lien rouvert après l'inscription : le compte existe déjà.
  const [used, setUsed] = useState<string | null>(null)

  useEffect(() => {
    if (!/^[A-Za-z0-9]{48}$/.test(token)) { setInvalid("Ce lien d'invitation est incomplet. Ouvrez-le à nouveau depuis le message WhatsApp."); return }
    stageService.invitationInfo(token).then(setInfo).catch((e: any) => {
      if ((e?.status ?? e?.response?.status) === 409) setUsed(friendlyError(e))
      else setInvalid(friendlyError(e))
    })
  }, [token])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.prenom.trim() || !form.nom.trim() || !form.email.trim()) { setError('Tous les champs sont obligatoires.'); return }
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      setError('Le mot de passe doit faire au moins 8 caractères, avec des lettres et des chiffres.'); return
    }
    if (form.password !== form.password_confirmation) { setError('Les deux mots de passe ne correspondent pas.'); return }
    setBusy(true); setError(null)
    try {
      await stageService.acceptInvitation({ token, ...form, prenom: form.prenom.trim(), nom: form.nom.trim(), email: form.email.trim() })
      setDone(true)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0fdfa 0%, #f8fafc 60%)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px' }}>
      <CCard className="border-0 shadow-sm" style={{ width: '100%', maxWidth: 460, borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ height: 5, background: 'linear-gradient(90deg, #0f766e, #10b981, #0ea5e9)' }} />
        <CCardBody style={{ padding: 24 }}>
          <p style={{ margin: 0, fontSize: '.875rem', fontWeight: 800, letterSpacing: 1.4, color: '#0f766e', textTransform: 'uppercase' }}>CAP-EPAC · Stages</p>
          <h4 style={{ margin: '6px 0 4px', fontWeight: 800 }}>Créer mon compte superviseur</h4>

          {!info && !invalid && !used && <div style={{ padding: 24, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}

          {invalid && (
            <div style={{ marginTop: 12, background: '#fff1f2', border: '1px solid #fecdd3', color: '#9f1239', borderRadius: 12, padding: '12px 14px' }}>
              {invalid}
            </div>
          )}

          {(done || used) && (
            <div style={{ marginTop: 12 }}>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: 12, padding: '12px 14px' }}>
                <span>{used ?? 'Votre compte est créé. Connectez-vous avec votre email et votre mot de passe.'}</span>
              </div>
              <CButton color="success" className="w-100 mt-3" style={{ color: '#fff', height: 46, fontWeight: 700 }} onClick={() => navigate(FRONTEND_ROUTES.LOGIN)}>
                Se connecter
              </CButton>
            </div>
          )}

          {info && !done && (
            <form onSubmit={submit} style={{ marginTop: 8 }}>
              <p style={{ color: '#475569', fontSize: '.9rem' }}>
                <span>{info.name ? `Bonjour ${info.name}, ` : ''}invitation reçue sur le numéro WhatsApp se terminant par </span><strong>{info.phone.slice(-4)}</strong><span>.</span>
              </p>
              <div className="mb-3">
                <CFormLabel className="small fw-semibold">Prénom(s)</CFormLabel>
                <CFormInput value={form.prenom} onChange={set('prenom')} maxLength={80} autoComplete="given-name" />
              </div>
              <div className="mb-3">
                <CFormLabel className="small fw-semibold">Nom</CFormLabel>
                <CFormInput value={form.nom} onChange={set('nom')} maxLength={80} autoComplete="family-name" />
              </div>
              <div className="mb-3">
                <CFormLabel className="small fw-semibold">Email (pour vous connecter)</CFormLabel>
                <CFormInput type="email" inputMode="email" value={form.email} onChange={set('email')} maxLength={150} autoComplete="email" />
              </div>
              <div className="mb-3">
                <CFormLabel className="small fw-semibold">Mot de passe</CFormLabel>
                <CFormInput type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
                <span style={{ fontSize: '.875rem', color: '#64748b' }}>8 caractères minimum, avec des lettres et des chiffres.</span>
              </div>
              <div className="mb-3">
                <CFormLabel className="small fw-semibold">Confirmer le mot de passe</CFormLabel>
                <CFormInput type="password" value={form.password_confirmation} onChange={set('password_confirmation')} autoComplete="new-password" />
              </div>
              {error && <div style={{ marginBottom: 12, background: '#fff1f2', border: '1px solid #fecdd3', color: '#9f1239', borderRadius: 10, padding: '10px 12px', fontSize: '.88rem' }}>{error}</div>}
              <CButton type="submit" color="success" className="w-100" style={{ color: '#fff', height: 46, fontWeight: 700 }} disabled={busy}>
                {busy && <CSpinner size="sm" className="me-2" />}<span>Créer mon compte</span>
              </CButton>
            </form>
          )}
        </CCardBody>
      </CCard>
    </div>
  )
}

export default SupervisorInvitationPage
