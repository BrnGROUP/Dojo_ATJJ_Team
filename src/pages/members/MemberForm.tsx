import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { maskPhone, maskCPF } from '../../lib/masks';
import { EvaluationsList } from './EvaluationsList';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { toast } from 'react-hot-toast';

export function MemberForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        cpf: '',
        birth_date: '',
        plan: '',
        enrolled_classes: [] as string[],
        belt: 'Branca',
        stripes: 0,
        status: 'Active',
        xp: 0,
    });
    const [groups, setGroups] = useState<{ id: string, name: string }[]>([]);
    const [belts, setBelts] = useState<{ id: string, name: string, color: string, color_secondary?: string, min_xp: number }[]>([]);

    useEffect(() => {
        async function fetchInitialData() {
            try {
                const { data: groupsData } = await supabase.from('groups').select('id, name');
                if (groupsData) setGroups(groupsData);

                const { data: beltsData } = await supabase.from('belts').select('*').order('order_index', { ascending: true });
                if (beltsData) setBelts(beltsData);
            } catch (err) {
                console.error('Initial data fetch error:', err);
            }
        }

        fetchInitialData();

        if (id) {
            fetchMember();
        }
    }, [id]);

    async function fetchMember() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                toast.error('Aluno não encontrado');
                navigate('/members');
            } else if (data) {
                setFormData({
                    full_name: data.full_name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    cpf: data.cpf || '',
                    birth_date: data.birth_date || '',
                    plan: data.plan || '',
                    enrolled_classes: data.enrolled_classes || [],
                    belt: data.belt || 'Branca',
                    stripes: data.stripes || 0,
                    status: data.status || 'Active',
                    xp: data.xp || 0,
                });
            }
        } catch (err) {
            toast.error('Erro ao buscar dados');
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let maskedValue = value;

        if (name === 'phone') maskedValue = maskPhone(value);
        if (name === 'cpf') maskedValue = maskCPF(value);
        if (name === 'email') maskedValue = value.toLowerCase().trim();

        setFormData((prev) => ({ ...prev, [name]: maskedValue }));
    };

    const handleClassToggle = (className: string) => {
        setFormData(prev => {
            const current = prev.enrolled_classes || [];
            if (current.includes(className)) {
                return { ...prev, enrolled_classes: current.filter(c => c !== className) };
            } else {
                return { ...prev, enrolled_classes: [...current, className] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const dataToSave = {
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            cpf: formData.cpf,
            birth_date: formData.birth_date || null,
            plan: formData.plan,
            enrolled_classes: formData.enrolled_classes,
            belt: formData.belt,
            stripes: formData.stripes,
            status: formData.status,
        };

        try {
            const { error } = id
                ? await supabase.from('members').update(dataToSave).eq('id', id)
                : await supabase.from('members').insert([dataToSave]);

            if (error) throw error;

            toast.success(id ? 'Aluno atualizado!' : 'Aluno cadastrado!');
            navigate('/members');
        } catch (err: any) {
            toast.error(`Erro: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted font-black uppercase tracking-widest text-xs animate-pulse">Sincronizando Ficha...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1000px] w-full mx-auto space-y-6 pb-20 px-4 sm:px-0">
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 mb-2">
                <Link to="/members" className="text-muted hover:text-primary text-sm font-bold transition-colors">Alunos</Link>
                <span className="material-symbols-outlined text-muted text-sm">chevron_right</span>
                <span className="text-white text-sm font-bold">{id ? 'Editar Cadastro' : 'Nova Ficha'}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-10">
                <div className="flex flex-col gap-2">
                    <h1 className="text-white text-3xl sm:text-5xl font-black leading-none tracking-tighter uppercase italic">
                        {id ? 'Editar Aluno' : 'Cadastrar Aluno'}
                    </h1>
                    <p className="text-muted text-sm sm:text-base font-medium max-w-xl">
                        Mantenha os dados do aluno atualizados para o sistema de graduação e frequência automática.
                    </p>
                </div>
                <Link to="/members">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <span className="material-symbols-outlined mr-2 text-lg">arrow_back</span>
                        Voltar
                    </Button>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Coluna Principal: Dados Pessoais */}
                <div className="lg:col-span-7 space-y-8">
                    <Card>
                        <CardContent className="p-6 sm:p-8 space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">person</span>
                                </div>
                                <h2 className="text-white text-xl font-black uppercase tracking-tight italic">Dados Pessoais</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <Input
                                    label="Nome Completo"
                                    name="full_name"
                                    icon="person"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    placeholder="Ex: Hélio Gracie"
                                    required
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <Input
                                        label="E-mail"
                                        name="email"
                                        type="email"
                                        icon="mail"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="aluno@email.com"
                                    />
                                    <Input
                                        label="CPF"
                                        name="cpf"
                                        icon="badge"
                                        value={formData.cpf}
                                        onChange={handleChange}
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <Input
                                        label="Telefone / WhatsApp"
                                        name="phone"
                                        icon="call"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="(00) 00000-0000"
                                    />
                                    <Input
                                        label="Data de Nascimento"
                                        name="birth_date"
                                        type="date"
                                        icon="calendar_month"
                                        value={formData.birth_date}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Frequência & Avaliações (Apenas Edição) */}
                    {id && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <EvaluationsList memberId={id} currentBelt={formData.belt} />
                        </div>
                    )}
                </div>

                {/* Coluna Lateral: Dados do Dojo */}
                <div className="lg:col-span-5 space-y-8">
                    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                        <CardContent className="p-6 sm:p-8 space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                    <span className="material-symbols-outlined text-white">sports_kabaddi</span>
                                </div>
                                <h2 className="text-white text-xl font-black uppercase tracking-tight italic">Status Oficial</h2>
                            </div>

                            {/* Status Pill Selector */}
                            <div className="flex bg-main/50 p-1 rounded-2xl border border-border-slate gap-1 h-16 relative">
                                {[
                                    { id: 'Active', label: 'Ativo', icon: 'check_circle', color: 'text-green-500', activeBg: 'bg-green-500/10 border-green-500/30' },
                                    { id: 'Paused', label: 'Pausa', icon: 'pause_circle', color: 'text-yellow-500', activeBg: 'bg-yellow-500/10 border-yellow-500/30' },
                                    { id: 'Inactive', label: 'Inativo', icon: 'cancel', color: 'text-red-500', activeBg: 'bg-red-500/10 border-red-500/30' }
                                ].map((status) => (
                                    <button
                                        key={status.id}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, status: status.id }))}
                                        className={cn(
                                            "flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-300 border border-transparent",
                                            formData.status === status.id
                                                ? `${status.activeBg} ${status.color} shadow-lg scale-[1.02] z-10 font-black`
                                                : "text-muted hover:bg-white/5 font-bold"
                                        )}
                                    >
                                        <span className="material-symbols-outlined text-lg">{status.icon}</span>
                                        <span className="text-[9px] uppercase tracking-widest">{status.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* XP Display */}
                            <div className="stats-card-premium p-6 rounded-2xl relative overflow-hidden group border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/10">
                                    <span className="material-symbols-outlined text-primary text-2xl animate-pulse">bolt</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-70">Experiência</span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-3xl font-black text-white leading-none">{formData.xp.toLocaleString()}</span>
                                        <span className="text-xs font-bold text-muted uppercase">XP</span>
                                    </div>
                                </div>
                            </div>

                            {/* Turmas Assignment */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Turmas Designadas</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {groups.map(grp => (
                                        <button
                                            key={grp.id}
                                            type="button"
                                            onClick={() => handleClassToggle(grp.name)}
                                            className={cn(
                                                "flex items-center gap-3 p-4 rounded-xl border transition-all text-left group",
                                                formData.enrolled_classes.includes(grp.name)
                                                    ? 'bg-primary/10 border-primary text-white'
                                                    : 'bg-main border-border-slate text-muted hover:border-slate-500'
                                            )}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded flex items-center justify-center border transition-all",
                                                formData.enrolled_classes.includes(grp.name) ? 'bg-primary border-primary' : 'border-slate-700'
                                            )}>
                                                {formData.enrolled_classes.includes(grp.name) && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                                            </div>
                                            <span className="text-sm font-bold truncate">{grp.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Faixa Selection - Using Sharp Geometry */}
                    <Card>
                        <CardContent className="p-6 sm:p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">military_tech</span>
                                <h3 className="text-white text-lg font-black uppercase tracking-tight">Graduação</h3>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {belts.map(belt => (
                                    <button
                                        key={belt.id}
                                        onClick={() => setFormData(prev => ({ ...prev, belt: belt.name }))}
                                        type="button"
                                        className={cn(
                                            "h-20 rounded-xl border-2 transition-all flex flex-col items-center justify-center p-2 relative group active:scale-95",
                                            formData.belt === belt.name
                                                ? "border-primary bg-primary/10 shadow-lg"
                                                : "border-border-slate bg-main hover:border-slate-500"
                                        )}
                                    >
                                        {/* Belt Strip */}
                                        <div className="w-full h-4 rounded-sm border border-black/20 mb-2 flex overflow-hidden shadow-inner">
                                            <div
                                                className={cn("h-full flex-1", `belt-bg-${belt.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`)}
                                            />
                                            {belt.color_secondary && (
                                                <div
                                                    className={cn("h-full flex-1", `belt-bg-${belt.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}-secondary`)}
                                                />
                                            )}
                                        </div>
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-widest text-center truncate w-full",
                                            formData.belt === belt.name ? "text-primary" : "text-muted"
                                        )}>
                                            {belt.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer Fixo Mobile / Estático Desktop */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-main/80 backdrop-blur-xl border-t border-border-slate z-30 sm:static sm:p-0 sm:bg-transparent sm:border-none lg:col-span-12">
                    <div className="flex flex-col sm:flex-row justify-end gap-3 max-w-[1000px] mx-auto">
                        <Link to="/members" className="hidden sm:block">
                            <Button variant="outline" className="w-full sm:min-w-[120px]">Descartar</Button>
                        </Link>
                        <Button
                            type="submit"
                            loading={saving}
                            className="w-full sm:min-w-[240px]"
                            icon={<span className="material-symbols-outlined">save</span>}
                        >
                            Salvar Ficha do Aluno
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
