import { useState, useEffect } from 'react';
import InscriptionService from '../../services/inscription.service.ts'; 
import { format, parseISO } from 'date-fns'; 
import { fr } from 'date-fns/locale'; 
import type { DashboardStats, GraphesData, AcademicYear, PendingStudentData } from '@/types/inscription.types';

const useDashboardData = () => {
    const [stats, setStats] = useState<DashboardStats>({
        inscritsCap: 0,
        dossiersAttente: 0,
        anneeAcademique: '',
        nombreFilieres: 0,
        nombreCycles: 0
    });
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [pendingStudents, setPendingStudents] = useState<PendingStudentData[]>([]);
    const [graphesData, setGraphesData] = useState<GraphesData>({ 
        inscritsParFiliere: [],
        inscritsParCycle: [],
        dossiersParStatut: [],
        anneeAcademique: ''
    });
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Format une date ISO (YYYY-MM-DD) en format français lisible
     */
    const formatDate = (dateStr: string | null | undefined): string => {
        if (!dateStr) return '';
        try {
            const date = parseISO(dateStr);
            return format(date, 'd MMMM yyyy', { locale: fr });
        } catch (error) {
            console.error('Erreur lors du formatage de la date:', dateStr, error);
            return dateStr; 
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. R\u00e9cup\u00e9rer les stats
                const statsRes = await InscriptionService.stats();
                setStats(statsRes);
                setSelectedYear(statsRes.anneeAcademique);
                
                // 2. R\u00e9cup\u00e9rer les ann\u00e9es acad\u00e9miques
                const yearsRes = await InscriptionService.academicYears();
                const formattedYears = yearsRes.map(year => ({
                    ...year,
                    date_debut: formatDate(year.date_debut),
                    date_fin: formatDate(year.date_fin),
                }));
                setAcademicYears(formattedYears);

                // 3. R\u00e9cup\u00e9rer les pending students (limit\u00e9 \u00e0 10 pour le dashboard)
                const studentsRes = await InscriptionService.pendingStudents({ per_page: 10 });
                console.log('Pending students:', studentsRes);
                setPendingStudents(studentsRes.data || []);

                // 4. R\u00e9cup\u00e9rer les donn\u00e9es des graphiques
                const graphesRes = await InscriptionService.graphes(statsRes.anneeAcademique);
                setGraphesData(graphesRes);
            } catch (error: any) {
                console.error('Erreur lors du fetch des donn\u00e9es:', error);
                setError(error?.message || 'Une erreur est survenue lors du chargement des donn\u00e9es');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Refetch graphes quand l'année change
    useEffect(() => {
        if (selectedYear) {
            const fetchGraphes = async () => {
                const graphesRes = await InscriptionService.graphes(selectedYear);
                setGraphesData(graphesRes);
            };
            fetchGraphes();
        }
    }, [selectedYear]);

    return { stats, academicYears, pendingStudents, graphesData, selectedYear, setSelectedYear, loading, error };
};

export default useDashboardData;