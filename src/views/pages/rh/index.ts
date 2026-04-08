import React from 'react'

const Dashboard = React.lazy(() => import('./Dashboard'))
const Professors = React.lazy(() => import('./Professors'))
const AdminUsers = React.lazy(() => import('./AdminUsers'))
const Signataires = React.lazy(() => import('./Signataires'))
const ContentManagement = React.lazy(() => import('./ContentManagement'))
const WhatsAppGroups = React.lazy(() => import('./WhatsAppGroups'))

export { Dashboard, Professors, AdminUsers, Signataires, ContentManagement, WhatsAppGroups }
