import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { toast } from 'react-hot-toast';

interface Competition {
    id: string;
    title: string;
    organization: string;
    date: string;
    location: string;
    status: 'Scheduled' | 'Ongoing' | 'Finished' | 'Cancelled';
}

export function CompetitionsList() {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCompetitions();
    }, []);

    async function fetchCompetitions() {
        try {
            const { data, error } = await supabase
                .from('competitions')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            setCompetitions(data || []);
        } catch (err) {
            toast.error('Erro ao carregar competições.');
        } finally {
            setLoading(false);
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Scheduled': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'Ongoing': return 'bg-green-500/10 text-green-500 border-green-500/20 animate-pulse';
            case 'Finished': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'Cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-muted/10 text-muted border-muted/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Scheduled': return 'Agendado';
            case 'Ongoing': return 'Em Andamento';
            case 'Finished': return 'Finalizado';
            case 'Cancelled': return 'Cancelado';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted font-black uppercase tracking-widest text-xs animate-pulse">Sincronizando Torneios...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-white text-4xl sm:text-6xl font-black uppercase italic leading-none tracking-tighter">
                        Competições
                    </h1>
                    <p className="text-muted text-sm sm:text-base font-medium max-w-xl">
                        Acompanhe o calendário de torneios e o desempenho dos nossos atletas no tatame competitivo.
                    </p>
                </div>
                <Link to="/competitions/new">
                    <Button icon={<span className="material-symbols-outlined">add</span>}>
                        Novo Torneio
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {competitions.map((comp) => (
                    <Link key={comp.id} to={`/competitions/${comp.id}`}>
                        <Card className="group hover:border-primary/50 transition-all cursor-pointer h-full">
                            <CardContent className="p-6 flex flex-col h-full space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className={cn(
                                        "px-2 py-1 rounded text-[10px] font-black uppercase border",
                                        getStatusColor(comp.status)
                                    )}>
                                        {getStatusLabel(comp.status)}
                                    </div>
                                    <span className="material-symbols-outlined text-muted group-hover:text-primary transition-colors">trophy</span>
                                </div>

                                <div className="space-y-1 flex-1">
                                    <h3 className="text-xl font-black text-white leading-tight uppercase italic group-hover:text-primary transition-colors">
                                        {comp.title}
                                    </h3>
                                    <p className="text-primary text-xs font-bold uppercase tracking-wider">{comp.organization}</p>
                                </div>

                                <div className="pt-4 border-t border-border-slate/50 space-y-3">
                                    <div className="flex items-center gap-2 text-muted">
                                        <span className="material-symbols-outlined text-lg">calendar_month</span>
                                        <span className="text-xs font-bold">{new Date(comp.date).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted">
                                        <span className="material-symbols-outlined text-lg">location_on</span>
                                        <span className="text-xs font-bold truncate">{comp.location}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {competitions.length === 0 && (
                    <div className="col-span-full py-20 bg-card/50 rounded-3xl border border-dashed border-border-slate flex flex-col items-center justify-center gap-4">
                        <span className="material-symbols-outlined text-5xl text-muted">emoji_events</span>
                        <p className="text-muted font-bold">Nenhuma competição cadastrada no momento.</p>
                        <Link to="/competitions/new">
                            <Button variant="outline" size="sm">Começar Agendamento</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
