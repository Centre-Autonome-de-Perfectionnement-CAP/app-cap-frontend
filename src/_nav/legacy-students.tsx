import CIcon from '@coreui/icons-react';
import {
  cilFolderOpen,
  cilBook,
  cilTask,
  cilPrint,
} from '@coreui/icons';
import { CNavItem, CNavTitle } from '@coreui/react';

const legacyStudentsNavigation = [
  {
    component: CNavTitle,
    name: 'Anciens Étudiants (< 2023)',
  },
  {
    component: CNavItem,
    name: 'Registres & Fiches',
    to: '/legacy-students/registres',
    icon: <CIcon icon={cilFolderOpen} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Dossiers Académiques',
    to: '/legacy-students/dossiers',
    icon: <CIcon icon={cilBook} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Demandes de Services',
    to: '/legacy-students/services',
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Délivrance Documents',
    to: '/legacy-students/documents',
    icon: <CIcon icon={cilPrint} customClassName="nav-icon" />,
  },
];

export default legacyStudentsNavigation;
