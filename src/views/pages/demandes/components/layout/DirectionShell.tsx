// src/views/pages/demandes/components/layout/DirectionShell.tsx
// Enveloppe les 4 dashboards direction : header institutionnel + zone de travail.

import DirectionHeader from './DirectionHeader'

interface Props {
  title: string
  subtitle: string
  children: React.ReactNode
}

const DirectionShell = ({ title, subtitle, children }: Props) => (
  <div style={{
    minHeight: '100vh',
    background: '#f1f5f9',
    display: 'flex',
    flexDirection: 'column',
  }}>
    <DirectionHeader title={title} subtitle={subtitle} />
    <main style={{ flex: 1, padding: '32px 36px' }}>
      {children}
    </main>
  </div>
)

export default DirectionShell
