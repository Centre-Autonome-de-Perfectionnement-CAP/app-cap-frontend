import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CBadge,
  CButton,
  CAlert,
  CSpinner,
  CInputGroup,
  CInputGroupText,
  CFormInput,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilFile,
  cilSearch,
  cilWarning,
  cilCheckCircle,
  cilXCircle,
  cilClock,
} from '@coreui/icons';
import HttpService from '@/services/http.service';
import type { Contrat } from '@/types/rh.types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:    { label: 'En attente',  color: 'warning', icon: cilClock        },
  transfered: { label: 'En attente',   color: 'info',    icon: cilFile         },
  signed:     { label: 'Signé',       color: 'success', icon: cilCheckCircle  },
  ongoing:    { label: 'En cours',    color: 'primary', icon: cilFile         },
  completed:  { label: 'Complété',    color: 'dark',    icon: cilCheckCircle  },
  cancelled:  { label: 'Rejeté',      color: 'danger',  icon: cilXCircle      },
};

const formatDate = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

const ProfessorContratsList = () => {
  const navigate                 = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');

  // Lire le filtre de statut depuis l'URL (?status=pending ou ?status=signed)
  const statusFilter = searchParams.get('status') ?? 'all';

  useEffect(() => {
    const fetchContrats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await HttpService.get<{ success: boolean; data: Contrat[] }>(
          'rh/professor/my-contrats',
        );
        setContrats(response.data ?? []);
      } catch (err: any) {
        setError(err.message || 'Impossible de charger vos contrats. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    fetchContrats();
  }, []);

  // Filtrage : par statut (query param) puis par recherche texte
  const filtered = contrats.filter((c) => {
    // Filtre par statut URL
    if (statusFilter === 'pending') {
      if (!['pending', 'transfered'].includes(c.status)) return false;
    } else if (statusFilter === 'signed') {
      if (!['signed', 'ongoing', 'completed'].includes(c.status)) return false;
    }

    // Filtre par recherche texte
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.contrat_number?.toLowerCase().includes(q) ||
        c.academicYear?.academic_year?.toLowerCase().includes(q) ||
        c.cycle?.name?.toLowerCase().includes(q) ||
        (c.status && STATUS_CONFIG[c.status]?.label.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const pendingCount = contrats.filter((c) =>
    ['pending', 'transfered'].includes(c.status),
  ).length;

  const goToDashboard = () => navigate('/notes/professor/dashboard');
  const goToContrat   = (uuid?: string) => uuid && navigate(`/notes/professor/contrats/${uuid}`);

  const setStatusFilter = (status: string) => {
    if (status === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const filterLabel =
    statusFilter === 'pending'
      ? 'Contrats en attente'
      : statusFilter === 'signed'
      ? 'Contrats signés / en cours'
      : 'Tous les contrats';

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Mes contrats</h1>
          <p className="text-muted">
            Consultez et gérez l'ensemble de vos contrats d'enseignement.
          </p>
        </div>
        <CButton color="secondary" onClick={goToDashboard}>
          Tableau de bord
        </CButton>
      </div>

      {pendingCount > 0 && (
        <CAlert color="warning" className="mb-4">
          <CIcon icon={cilWarning} className="me-2" />
          Vous avez {pendingCount} contrat{pendingCount > 1 ? 's' : ''} en attente de votre
          signature.
        </CAlert>
      )}

      {/* Filtres de statut rapides */}
      <div className="mb-3 d-flex gap-2 flex-wrap">
        <CButton
          color={statusFilter === 'all' ? 'primary' : 'outline-primary'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          Tous
        </CButton>
        <CButton
          color={statusFilter === 'pending' ? 'warning' : 'outline-warning'}
          size="sm"
          onClick={() => setStatusFilter('pending')}
        >
          <CIcon icon={cilClock} className="me-1" />
          En attente
          {pendingCount > 0 && (
            <CBadge color="dark" className="ms-1">{pendingCount}</CBadge>
          )}
        </CButton>
        <CButton
          color={statusFilter === 'signed' ? 'success' : 'outline-success'}
          size="sm"
          onClick={() => setStatusFilter('signed')}
        >
          <CIcon icon={cilCheckCircle} className="me-1" />
          Signés / En cours
        </CButton>
      </div>

      <CCard>
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{filterLabel}</h5>
            <CInputGroup style={{ width: '300px' }}>
              <CInputGroupText>
                <CIcon icon={cilSearch} />
              </CInputGroupText>
              <CFormInput
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </CInputGroup>
          </div>
        </CCardHeader>

        <CCardBody>
          {loading ? (
            <div className="text-center py-5">
              <CSpinner />
              <p className="mt-2">Chargement...</p>
            </div>
          ) : error ? (
            <CAlert color="danger">{error}</CAlert>
          ) : filtered.length === 0 ? (
            <CAlert color="info">
              {search
                ? 'Aucun contrat ne correspond à votre recherche.'
                : statusFilter !== 'all'
                ? `Aucun contrat dans cette catégorie.`
                : "Vous n'avez pas encore de contrat."}
            </CAlert>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Année académique</th>
                    <th>Cycle</th>
                    <th>Montant</th>
                    <th>Date de début</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contrat) => {
                    const statusCfg = STATUS_CONFIG[contrat.status] ?? {
                      label: contrat.status,
                      color: 'secondary',
                      icon: cilFile,
                    };
                    const isPending = ['pending', 'transfered'].includes(contrat.status);

                    return (
                      <tr
                        key={contrat.uuid ?? contrat.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => goToContrat(contrat.uuid)}
                      >
                        <td>
                          <strong>N° {contrat.contrat_number}</strong>
                          {isPending && (
                            <CBadge color="warning" className="ms-2">
                              Signature requise
                            </CBadge>
                          )}
                        </td>
                        <td>{contrat.academic_year?.academic_year ?? '—'}</td>
                        <td>{contrat.cycle?.name ?? '—'}</td>
                        <td>{formatAmount(contrat.amount)}</td>
                        <td>{formatDate(contrat.start_date)}</td>
                        <td>
                          <CBadge color={statusCfg.color}>{statusCfg.label}</CBadge>
                        </td>
                        <td>
                          <CButton
                            size="sm"
                            color={isPending ? 'warning' : 'primary'}
                            onClick={(e) => {
                              e.stopPropagation();
                              goToContrat(contrat.uuid);
                            }}
                          >
                            {isPending ? 'Consulter' : 'Voir'}
                          </CButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CCardBody>
      </CCard>
    </>
  );
};

export default ProfessorContratsList;
