import { Component, ReactNode, ErrorInfo } from 'react'
import { CCard, CCardBody, CButton, CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilWarning } from '@coreui/icons'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary - Composant de gestion d'erreurs
 * Capture les erreurs JavaScript dans l'arbre de composants enfants
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })

    // Vous pouvez envoyer l'erreur à un service de logging ici
    // Example: logErrorToService(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Si un fallback personnalisé est fourni, l'utiliser
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Sinon, afficher l'UI d'erreur par défaut
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center p-3">
          <CCard style={{ maxWidth: '600px' }}>
            <CCardBody className="text-center p-5">
              <CIcon
                icon={cilWarning}
                size="4xl"
                className="text-danger mb-4"
              />
              <h3 className="mb-3">Une erreur s'est produite</h3>
              <CAlert color="danger" className="text-start">
                <strong>Erreur :</strong>
                <pre className="mb-0 mt-2" style={{ fontSize: '0.875rem' }}>
                  {this.state.error?.toString()}
                </pre>
              </CAlert>
              
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <CAlert color="warning" className="text-start">
                  <strong>Stack Trace :</strong>
                  <pre
                    className="mb-0 mt-2"
                    style={{ fontSize: '0.75rem', maxHeight: '200px', overflow: 'auto' }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                </CAlert>
              )}

              <div className="d-flex gap-2 justify-content-center mt-4">
                <CButton color="primary" onClick={this.handleReset}>
                  Réessayer
                </CButton>
                <CButton
                  color="secondary"
                  onClick={() => window.location.reload()}
                >
                  Recharger la page
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
