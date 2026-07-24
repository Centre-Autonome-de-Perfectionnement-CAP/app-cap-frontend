// src/components/document-request/WorkflowBadge.tsx

import { CBadge } from '@coreui/react'
import type { DocumentRequestStatus } from '@/types/document-request.types'
import { STATUS_LABELS, STATUS_COLORS } from '@/types/document-request.types'

interface Props {
  status: DocumentRequestStatus
  size?: 'sm' | 'md'
}

export const WorkflowBadge = ({ status, size }: Props) => (
  <CBadge
    color={STATUS_COLORS[status] as any}
    shape="rounded-pill"
    style={{ fontSize: size === 'sm' ? '0.7rem' : '0.8rem', padding: '4px 10px' }}
  >
    {STATUS_LABELS[status] ?? status}
  </CBadge>
)

// ─────────────────────────────────────────────────────────────────────────────

// src/components/document-request/WorkflowTimeline.tsx
import { WORKFLOW_STEPS } from '@/types/document-request.types'

interface TimelineProps {
  currentStatus: DocumentRequestStatus
  isRejected?: boolean
}

export const WorkflowTimeline = ({ currentStatus, isRejected }: TimelineProps) => {
  const stepIndex = WORKFLOW_STEPS.findIndex(s => s.status === currentStatus)

  return (
    <div className="d-flex align-items-center gap-1 flex-wrap my-2">
      {WORKFLOW_STEPS.map((step, idx) => {
        const isDone    = isRejected ? false : idx < stepIndex
        const isCurrent = step.status === currentStatus && !isRejected
        const color = isRejected && isCurrent
          ? '#dc2626'
          : isDone
          ? '#16a34a'
          : isCurrent
          ? '#005043'
          : '#d1d5db'

        return (
          <div key={step.status} className="d-flex align-items-center">
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: color, margin: '0 auto 2px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isDone && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
                {isCurrent && !isRejected && <span style={{ color: '#fff', fontSize: 10 }}>●</span>}
                {isRejected && isCurrent && <span style={{ color: '#fff', fontSize: 11 }}>✕</span>}
              </div>
              <div style={{ fontSize: '0.6rem', color: isCurrent ? color : '#9ca3af', whiteSpace: 'nowrap' }}>
                {step.label}
              </div>
            </div>
            {idx < WORKFLOW_STEPS.length - 1 && (
              <div style={{
                width: 20, height: 2,
                background: idx < stepIndex && !isRejected ? '#16a34a' : '#e5e7eb',
                marginBottom: 14, flexShrink: 0,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
