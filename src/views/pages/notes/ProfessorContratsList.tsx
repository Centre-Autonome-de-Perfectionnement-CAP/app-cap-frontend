import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  pending:    { label: 'En attente', color: 'warning', icon: cilClock        },
  transfered: { label: 'En attente',  color: 'info',    icon: cilFile         },
  signed:     { label: 'Signé',      color: 'success', icon: cilCheckCircle  },
  ongoing:    { label: 'En cours',   color: 'primary', icon: cilFile         },
  completed:  { label: 'Complété',   color: 'dark',    icon: cilCheckCircle  },
  cancelled:  { label: 'Rejeté',     color: 'danger',  icon: cilXCircle      },
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
  const navigate = useNavigate();

  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');

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

  const filtered = contrats.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.contrat_number?.toLowerCase().includes(q) ||
      c.academicYear?.academic_year?.toLowerCase().includes(q) ||
      c.cycle?.name?.toLowerCase().includes(q) ||
      (c.status && STATUS_CONFIG[c.status]?.label.toLowerCase().includes(q))
    );
  });

  const pendingCount = contrats.filter((c) =>
    ['pending', 'transfered'].includes(c.status),
  ).length;

  // Chemins corrigés : /notes/professor/… (basename /services → route réelle /services/notes/…)
  const goToDashboard = () => navigate('/notes/professor/dashboard');
  const goToContrat   = (uuid?: string) => uuid && navigate(`/notes/professor/contrats/${uuid}`);

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

      <CCard>
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Historique des contrats</h5>
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
                        <td>{contrat.academicYear?.academic_year ?? '—'}</td>
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
                            {isPending ? 'Signer' : 'Voir'}
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

