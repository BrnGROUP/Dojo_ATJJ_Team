import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { maskPhone, maskCPF, maskCEP } from '../../lib/masks';
import { useCities } from '../../hooks/useCities';
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
        billing_day: 10,
        monthly_fee: 150.00,
        address: '',
        cep: '',
        city: '',
        state: 'SP',
        type: 'student',
    });

    const [createAccess, setCreateAccess] = useState(false);
    const [password, setPassword] = useState('');

    const { cities, loadingCities } = useCities(formData.state);
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
                    billing_day: data.billing_day || 10,
                    monthly_fee: data.monthly_fee || 150.00,
                    address: data.address || '',
                    cep: data.cep || '',
                    city: data.city || '',
                    state: data.state || 'SP',
                    type: data.type || 'student',
                });
            }
        } catch {
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
        if (name === 'cep') maskedValue = maskCEP(value);
        if (name === 'email') maskedValue = value.toLowerCase().trim();

        setFormData((prev) => {
            const next = { ...prev, [name]: maskedValue };
            // Regra da Academia: Professores são Faixa Preta
            if (name === 'type' && value === 'teacher') {
                next.belt = 'Preta';
            }
            return next;
        });
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
            billing_day: Number(formData.billing_day),
            monthly_fee: Number(formData.monthly_fee),
            address: formData.address,
            cep: formData.cep,
            city: formData.city,
            state: formData.state,
            type: formData.type,
        };

        try {
            let userId = null;

            // Se for novo membro e quiser criar acesso do sistema
            if (!id && createAccess && formData.email && password) {
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: password,
                    options: {
                        data: {
                            full_name: formData.full_name,
                            role: formData.type === 'staff' ? 'admin' : formData.type // simplificado
                        }
                    }
                });

                if (authError) {
                    toast.error(`Erro ao criar acesso: ${authError.message}`);
                    setSaving(false);
                    return;
                }

                if (authData.user) {
                    userId = authData.user.id;
                }
            }

            const finalDataToSave = userId ? { ...dataToSave, user_id: userId } : dataToSave;

            const { error } = id
                ? await supabase.from('members').update(finalDataToSave).eq('id', id)
                : await supabase.from('members').insert([finalDataToSave]);

            if (error) throw error;

            toast.success(id ? 'Aluno atualizado!' : 'Aluno cadastrado!');
            navigate('/members');
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

                                {!id && (
                                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                <h4 className="text-white text-sm font-bold flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary">key</span>
                                                    Acesso ao Sistema
                                                </h4>
                                                <p className="text-muted text-[10px] font-medium uppercase tracking-wider">Permitir que o aluno(a) acesse o painel</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer" htmlFor="create-access-toggle">
                                                <input
                                                    id="create-access-toggle"
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={createAccess}
                                                    onChange={(e) => setCreateAccess(e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-main peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white"></div>
                                                <span className="sr-only">Ativar acesso ao sistema</span>
                                            </label>
                                        </div>

                                        {createAccess && (
                                            <div className="animate-in slide-in-from-top-2 duration-300 pt-2">
                                                <Input
                                                    label="Senha Inicial"
                                                    type="password"
                                                    icon="lock"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Mínimo 6 caracteres"
                                                    required={createAccess}
                                                />
                                                <p className="text-[10px] text-muted italic mt-2 ml-1">* O usuário poderá logar imediatamente com este e-mail e senha.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="w-full space-y-2">
                                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Categoria / Vínculo</label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                            groups_3
                                        </span>
                                        <select
                                            name="type"
                                            title="Selecione a Categoria"
                                            value={formData.type}
                                            onChange={handleChange}
                                            className="w-full bg-main border border-border-slate rounded-xl py-3 px-12 text-white text-sm outline-none transition-all duration-300 focus:border-primary focus:ring-1 focus:ring-primary/30 appearance-none cursor-pointer"
                                        >
                                            <option value="student" className="bg-zinc-900">Aluno(a)</option>
                                            <option value="instructor" className="bg-zinc-900">Instrutor(a)</option>
                                            <option value="teacher" className="bg-zinc-900">Professor(a)</option>
                                            <option value="staff" className="bg-zinc-900">Colaborador / Staff</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                            expand_more
                                        </span>
                                    </div>
                                </div>
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

                    <Card>
                        <CardContent className="p-6 sm:p-8 space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">location_on</span>
                                </div>
                                <h2 className="text-white text-xl font-black uppercase tracking-tight italic">Endereço de Residência</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="CEP"
                                    name="cep"
                                    icon="local_post_office"
                                    value={formData.cep}
                                    onChange={handleChange}
                                    placeholder="00000-000"
                                    maxLength={9}
                                />
                                <div className="md:col-span-2">
                                    <Input
                                        label="Endereço"
                                        name="address"
                                        icon="home"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Rua, Número, Bairro"
                                    />
                                </div>
                                <div className="w-full space-y-2">
                                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Cidade</label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                            location_city
                                        </span>
                                        <select
                                            name="city"
                                            title="Selecione a Cidade"
                                            value={formData.city}
                                            onChange={handleChange}
                                            disabled={loadingCities}
                                            className="w-full bg-main border border-border-slate rounded-xl py-3 px-12 text-white text-sm outline-none transition-all duration-300 focus:border-primary focus:ring-1 focus:ring-primary/30 appearance-none cursor-pointer disabled:opacity-50"
                                        >
                                            <option value="" className="bg-zinc-900">{loadingCities ? 'Carregando cidades...' : 'Selecione a cidade...'}</option>
                                            {cities.map(city => (
                                                <option key={city} value={city} className="bg-zinc-900">{city}</option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                            expand_more
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full space-y-2">
                                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Estado (UF)</label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                            public
                                        </span>
                                        <select
                                            name="state"
                                            title="Estado (UF)"
                                            value={formData.state}
                                            onChange={handleChange}
                                            className="w-full bg-main border border-border-slate rounded-xl py-3 px-12 text-white text-sm outline-none transition-all duration-300 focus:border-primary focus:ring-1 focus:ring-primary/30 appearance-none cursor-pointer"
                                        >
                                            {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                                <option key={uf} value={uf} className="bg-zinc-900">{uf}</option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                            expand_more
                                        </span>
                                    </div>
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

                    {/* Financeiro Selection */}
                    <Card>
                        <CardContent className="p-6 sm:p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">payments</span>
                                <h3 className="text-white text-lg font-black uppercase tracking-tight italic">Gestão Financeira</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Dia de Vencimento"
                                    name="billing_day"
                                    type="number"
                                    icon="calendar_today"
                                    min="1"
                                    max="31"
                                    value={formData.billing_day}
                                    onChange={handleChange}
                                    required
                                />
                                <Input
                                    label="Valor Mensalidade"
                                    name="monthly_fee"
                                    type="number"
                                    icon="monetization_on"
                                    min="0"
                                    step="0.01"
                                    value={formData.monthly_fee}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <p className="text-muted text-[10px] italic">
                                Estes dados serão usados para gerar alertas automáticos de pendências no Dashboard.
                            </p>
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
