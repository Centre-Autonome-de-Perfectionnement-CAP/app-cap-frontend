import React from 'react'
import type { RouteConfig } from './types'

export type { RouteConfig }

/* =========================
   THEME
========================= */
const Colors = React.lazy(() => import('./views/pages/theme/colors/Colors'))
const Typography = React.lazy(() => import('./views/pages/theme/typography/Typography'))
/* =========================
   BASE
========================= */
const Accordion = React.lazy(() => import('./views/base/accordion/Accordion'))
const Breadcrumbs = React.lazy(() => import('./views/base/breadcrumbs/Breadcrumbs'))
const Cards = React.lazy(() => import('./views/base/cards/Cards'))
const Carousels = React.lazy(() => import('./views/base/carousels/Carousels'))
const Collapses = React.lazy(() => import('./views/base/collapses/Collapses'))
const ListGroups = React.lazy(() => import('./views/base/list-groups/ListGroups'))
const Navs = React.lazy(() => import('./views/base/navs/Navs'))
const Paginations = React.lazy(() => import('./views/base/paginations/Paginations'))
const Placeholders = React.lazy(() => import('./views/base/placeholders/Placeholders'))
const Popovers = React.lazy(() => import('./views/base/popovers/Popovers'))
const Progress = React.lazy(() => import('./views/base/progress/Progress'))
const Spinners = React.lazy(() => import('./views/base/spinners/Spinners'))
const Tabs = React.lazy(() => import('./views/base/tabs/Tabs'))
const Tables = React.lazy(() => import('./views/base/tables/Tables'))
const Tooltips = React.lazy(() => import('./views/base/tooltips/Tooltips'))

/* =========================
   BUTTONS
========================= */
const Buttons = React.lazy(() => import('./views/buttons/buttons/Buttons'))
const ButtonGroups = React.lazy(() => import('./views/buttons/button-groups/ButtonGroups'))
const Dropdowns = React.lazy(() => import('./views/buttons/dropdowns/Dropdowns'))

/* =========================
   FORMS
========================= */
const ChecksRadios = React.lazy(() => import('./views/forms/checks-radios/ChecksRadios'))
const FloatingLabels = React.lazy(() => import('./views/forms/floating-labels/FloatingLabels'))
const FormControl = React.lazy(() => import('./views/forms/form-control/FormControl'))
const InputGroup = React.lazy(() => import('./views/forms/input-group/InputGroup'))
const Layout = React.lazy(() => import('./views/forms/layout/Layout'))
const Range = React.lazy(() => import('./views/forms/range/Range'))
const Select = React.lazy(() => import('./views/forms/select/Select'))
const Validation = React.lazy(() => import('./views/forms/validation/Validation'))

/* =========================
   CHARTS
========================= */
const Charts = React.lazy(() => import('./views/charts/Charts'))

/* =========================
   ICONS
========================= */
const CoreUIIcons = React.lazy(() => import('./views/icons/coreui-icons/CoreUIIcons'))
const Flags = React.lazy(() => import('./views/icons/flags/Flags'))
const Brands = React.lazy(() => import('./views/icons/brands/Brands'))

/* =========================
   NOTIFICATIONS
========================= */
const Alerts = React.lazy(() => import('./views/notifications/alerts/Alerts'))
const Badges = React.lazy(() => import('./views/notifications/badges/Badges'))
const Modals = React.lazy(() => import('./views/notifications/modals/Modals'))
const Toasts = React.lazy(() => import('./views/notifications/toasts/Toasts'))

/* =========================
   WIDGETS
========================= */
const Widgets = React.lazy(() => import('./views/widgets/Widgets'))

/* =========================
   ADMIN PRESENCE
========================= */
const Dashboard   = React.lazy(() => import('./views/pages/presence/admin/Dashboard'))
const Management  = React.lazy(() => import('./views/pages/presence/admin/Management'))
const Fingerprint = React.lazy(() => import('./views/pages/presence/admin/Fingerprint'))
const CourseAttendance = React.lazy(() => import('./views/pages/presence/admin/CourseAttendance'))

/* =========================
   ROUTES
========================= */
const routes: RouteConfig[] = [

  { path: '/', exact: true, name: 'Home' },

  // THEME
  { path: '/theme/colors', name: 'Colors', element: Colors, exact: true },
  { path: '/theme/typography', name: 'Typography', element: Typography, exact: true },

  // BASE
  { path: '/base/accordion', name: 'Accordion', element: Accordion, exact: true },
  { path: '/base/breadcrumbs', name: 'Breadcrumbs', element: Breadcrumbs, exact: true },
  { path: '/base/cards', name: 'Cards', element: Cards, exact: true },
  { path: '/base/carousels', name: 'Carousels', element: Carousels, exact: true },
  { path: '/base/collapses', name: 'Collapses', element: Collapses, exact: true },
  { path: '/base/list-groups', name: 'List Groups', element: ListGroups, exact: true },
  { path: '/base/navs', name: 'Navs', element: Navs, exact: true },
  { path: '/base/paginations', name: 'Paginations', element: Paginations, exact: true },
  { path: '/base/placeholders', name: 'Placeholders', element: Placeholders, exact: true },
  { path: '/base/popovers', name: 'Popovers', element: Popovers, exact: true },
  { path: '/base/progress', name: 'Progress', element: Progress, exact: true },
  { path: '/base/spinners', name: 'Spinners', element: Spinners, exact: true },
  { path: '/base/tabs', name: 'Tabs', element: Tabs, exact: true },
  { path: '/base/tables', name: 'Tables', element: Tables, exact: true },
  { path: '/base/tooltips', name: 'Tooltips', element: Tooltips, exact: true },

  // BUTTONS
  { path: '/buttons/buttons', name: 'Buttons', element: Buttons, exact: true },
  { path: '/buttons/button-groups', name: 'Button Groups', element: ButtonGroups, exact: true },
  { path: '/buttons/dropdowns', name: 'Dropdowns', element: Dropdowns, exact: true },

  // FORMS
  { path: '/forms/checks-radios', name: 'Checks & Radios', element: ChecksRadios, exact: true },
  { path: '/forms/floating-labels', name: 'Floating Labels', element: FloatingLabels, exact: true },
  { path: '/forms/form-control', name: 'Form Control', element: FormControl, exact: true },
  { path: '/forms/input-group', name: 'Input Group', element: InputGroup, exact: true },
  { path: '/forms/layout', name: 'Layout', element: Layout, exact: true },
  { path: '/forms/range', name: 'Range', element: Range, exact: true },
  { path: '/forms/select', name: 'Select', element: Select, exact: true },
  { path: '/forms/validation', name: 'Validation', element: Validation, exact: true },

  // CHARTS
  { path: '/charts', name: 'Charts', element: Charts, exact: true },

  // ICONS
  { path: '/icons/coreui-icons', name: 'CoreUI Icons', element: CoreUIIcons, exact: true },
  { path: '/icons/flags', name: 'Flags', element: Flags, exact: true },
  { path: '/icons/brands', name: 'Brands', element: Brands, exact: true },

  // NOTIFICATIONS
  { path: '/notifications/alerts', name: 'Alerts', element: Alerts, exact: true },
  { path: '/notifications/badges', name: 'Badges', element: Badges, exact: true },
  { path: '/notifications/modals', name: 'Modals', element: Modals, exact: true },
  { path: '/notifications/toasts', name: 'Toasts', element: Toasts, exact: true },

  // WIDGETS
  { path: '/widgets', name: 'Widgets', element: Widgets, exact: true },

  // =========================
  // ADMIN PRESENCE (IMPORTANT)
  // =========================
  { path: '/presence/admin/dashboard', name: 'Dashboard', element: Dashboard, exact: true },
  { path: '/presence/admin/management', name: 'Management', element: Management, exact: true },
  { path: '/presence/admin/fingerprint', name: 'Fingerprint', element: Fingerprint, exact: true },
  { path: '/presence/admin/course-attendance', name: 'Course Attendance', element: CourseAttendance, exact: true }

]

export default routes