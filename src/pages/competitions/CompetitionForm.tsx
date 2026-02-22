import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { toast } from 'react-hot-toast';

export function CompetitionForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        organization: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        status: 'Scheduled',
        description: '',
    });

    useEffect(() => {
        if (id) {
            fetchCompetition();
        }
    }, [id]);

    async function fetchCompetition() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('competitions')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    title: data.title,
                    organization: data.organization || '',
                    date: data.date,
                    location: data.location || '',
                    status: data.status,
                    description: data.description || '',
                });
            }
        } catch {
            toast.error('Torneio não encontrado');
            navigate('/competitions');
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = id
                ? await supabase.from('competitions').update(formData).eq('id', id)
                : await supabase.from('competitions').insert([formData]);

            if (error) throw error;
            toast.success(id ? 'Torneio atualizado!' : 'Torneio agendado!');
            navigate('/competitions');
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(`Erro: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted font-black uppercase tracking-widest text-xs animate-pulse">Carregando Detalhes...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[800px] w-full mx-auto space-y-6 pb-20 px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-10">
                <div className="flex flex-col gap-2">
                    <h1 className="text-white text-3xl sm:text-5xl font-black leading-none tracking-tighter uppercase italic">
                        {id ? 'Editar Torneio' : 'Novo Torneio'}
                    </h1>
                    <p className="text-muted text-sm sm:text-base font-medium">
                        Configure as informações oficiais da competição.
                    </p>
                </div>
                <Link to="/competitions">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <span className="material-symbols-outlined mr-2 text-lg">arrow_back</span>
                        Voltar
                    </Button>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card>
                    <CardContent className="p-6 sm:p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2">
                                <Input
                                    label="Título do Evento"
                                    name="title"
                                    icon="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: Campeonato Estadual IBJJF"
                                />
                            </div>

                            <Input
                                label="Organização"
                                name="organization"
                                icon="business"
                                value={formData.organization}
                                onChange={handleChange}
                                required
                                placeholder="CBJJ, IBJJF, AJP, etc."
                            />

                            <Input
                                label="Data do Evento"
                                name="date"
                                type="date"
                                icon="calendar_month"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />

                            <div className="md:col-span-2">
                                <Input
                                    label="Localização / Arena"
                                    name="location"
                                    icon="location_on"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                    placeholder="Nome do Ginásio, Cidade, UF"
                                />
                            </div>

                            <div className="space-y-2">
                                <p className="text-white text-sm font-semibold leading-normal pb-2 ml-1">Status</p>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted text-xl group-focus-within:text-primary transition-colors">flag</span>
                                    <select
                                        name="status"
                                        title="Status da Competição"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-14 pl-12 pr-4 text-base font-bold transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Scheduled">Agendado</option>
                                        <option value="Ongoing">Em Andamento</option>
                                        <option value="Finished">Finalizado</option>
                                        <option value="Cancelled">Cancelado</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-white text-sm font-semibold ml-1">Descrição / Notas</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full h-32 bg-main border border-border-slate rounded-2xl p-4 text-white text-sm font-medium outline-none focus:border-primary transition-all resize-none"
                                    placeholder="Detalhes sobre inscrições, cronograma, etc."
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 pt-4">
                    <Link to="/competitions">
                        <Button variant="outline" className="px-8">Cancelar</Button>
                    </Link>
                    <Button
                        type="submit"
                        loading={saving}
                        className="sm:min-w-[200px]"
                        icon={<span className="material-symbols-outlined">save</span>}
                    >
                        {id ? 'Salvar Alterações' : 'Agendar Torneio'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
