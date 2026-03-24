import { useState, FormEvent } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { useAuth } from '@/contexts/AuthContext'
import AuthService from '@/services/auth.service'
import type { LoginCredentials } from '@/types'
import { getAssetUrl } from '@/utils/assets'

const Login = () => {
  const { login } = useAuth()

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
  })

  const validateForm = (): boolean => {
    const errors = {
      email: '',
      password: '',
    }

    if (!credentials.email.trim()) {
      errors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      errors.email = 'Email invalide'
    }

    if (!credentials.password) {
      errors.password = 'Le mot de passe est requis'
    } else if (credentials.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    setValidationErrors(errors)
    return !errors.email && !errors.password
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await AuthService.login(credentials)
      const { access_token, user } = response.data!
      login(
        access_token,
        user.last_name || user.name || '',
        user.first_name || '',
        user.role as any
      )

    }
      catch (err: any) {
  console.error('Erreur de connexion:', err)

  // L'erreur vient de HttpService sous forme d'ApiError
  // donc err.status et err.message sont directement disponibles
  const status = err?.status
  const message = err?.message

  if (status === 401) {
    setError('Email ou mot de passe incorrect')
  } else if (status === 422) {
    setError('Données de connexion invalides')
  } else if (status === 500) {
    setError('Erreur serveur. Veuillez réessayer plus tard.')
  } else if (message) {
    setError(message)
  } else {
    setError('Une erreur est survenue lors de la connexion. Veuillez réessayer.')
  }
}
  finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value,
    }))

    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: '',
      }))
    }

    if (error) {
      setError(null)
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={handleSubmit}>
                    <h1>Se Connecter</h1>
                    <p className="text-body-secondary mb-4">Connectez-vous à votre compte</p>

                    {error && (
                      <CAlert color="danger" dismissible onClose={() => setError(null)}>
                        {error}
                      </CAlert>
                    )}

                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        type="email"
                        placeholder="Email"
                        autoComplete="email"
                        value={credentials.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        invalid={!!validationErrors.email}
                        disabled={loading}
                      />
                    </CInputGroup>
                    {validationErrors.email && (
                      <div className="text-danger small mb-3">{validationErrors.email}</div>
                    )}

                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Mot de passe"
                        autoComplete="current-password"
                        value={credentials.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        invalid={!!validationErrors.password}
                        disabled={loading}
                      />
                    </CInputGroup>
                    {validationErrors.password && (
                      <div className="text-danger small mb-3">{validationErrors.password}</div>
                    )}

                    <CRow>
                      <CCol xs={6}>
                        <CButton
                          color="primary"
                          className="px-4"
                          type="submit"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <CSpinner size="sm" className="me-2" />
                              Connexion...
                            </>
                          ) : (
                            'Se connecter'
                          )}
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-end">
                        {/* Future: Mot de passe oublié */}
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
              <CCard className="text-white bg-primary py-5" style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <div>
                    <img
                      src={getAssetUrl('images/cap-1.png')}
                      alt="logo-cap"
                      style={{ maxWidth: '150px', marginBottom: '20px' }}
                    />
                    <h5>Centre Autonome de Perfectionnement</h5>
                    <p className="mt-3">
                      École Polytechnique d'Abomey-Calavi
                    </p>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
