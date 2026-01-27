import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { maskPhone, maskCPF } from '../../lib/masks';

export function MemberForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
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
        if (id) {
            fetchMember();
        }
        async function fetchInitialData() {
            const { data: groupsData } = await supabase.from('groups').select('id, name');
            if (groupsData) setGroups(groupsData);

            const { data: beltsData } = await supabase.from('belts').select('*').order('order_index', { ascending: true });
            if (beltsData) setBelts(beltsData);
        }
        fetchInitialData();

        async function fetchMember() {
            setLoading(true);
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching member:', error);
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
            setLoading(false);
        }
    }, [id, navigate]);



    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let maskedValue = value;

        if (name === 'phone') maskedValue = maskPhone(value);
        if (name === 'cpf') maskedValue = maskCPF(value);
        if (name === 'email') maskedValue = value.toLowerCase().trim();

        setFormData((prev) => ({ ...prev, [name]: maskedValue }));
    };

    const handleBeltSelect = (belt: string) => {
        setFormData((prev) => ({ ...prev, belt }));
    };

    const handleClassToggle = (classId: string) => {
        setFormData(prev => {
            const current = prev.enrolled_classes || [];
            if (current.includes(classId)) {
                return { ...prev, enrolled_classes: current.filter(c => c !== classId) };
            } else {
                return { ...prev, enrolled_classes: [...current, classId] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

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

        const { error } = id
            ? await supabase.from('members').update(dataToSave).eq('id', id)
            : await supabase.from('members').insert([dataToSave]);

        setLoading(false);

        if (error) {
            console.error('Error saving member:', error);
            alert('Erro ao salvar aluno. Verifique os dados e tente novamente.');
        } else {
            navigate('/members');
        }
    };

    return (
        <div className="max-w-[960px] w-full mx-auto space-y-6">
            <div className="flex flex-wrap gap-2 mb-2">
                <Link to="/members" className="text-muted hover:text-primary text-sm font-medium leading-normal">Alunos</Link>
                <span className="text-muted text-sm font-medium leading-normal">/</span>
                <span className="text-white text-sm font-medium leading-normal">{id ? 'Editar Aluno' : 'Ficha de Cadastro'}</span>
            </div>

            <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-white text-3xl font-black leading-tight tracking-tight">{id ? 'Editar Aluno' : 'Ficha do Aluno'}</h1>
                    <p className="text-muted text-base font-normal leading-normal">Cadastre ou edite os detalhes do aluno no sistema de gestão.</p>
                </div>
                <Link to="/members" className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary/10 text-primary hover:bg-primary/20 text-sm font-bold leading-normal transition-all">
                    <span className="material-symbols-outlined mr-2 text-lg">arrow_back</span>
                    <span>Voltar</span>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col gap-6 bg-card p-6 rounded-xl shadow-sm border border-border-slate">
                    <div className="flex items-center gap-2 border-b border-border-slate pb-4">
                        <span className="material-symbols-outlined text-primary">person</span>
                        <h2 className="text-white text-xl font-bold leading-tight tracking-tight">Dados Pessoais</h2>
                    </div>
                    <div className="flex flex-col gap-4">
                        <label className="flex flex-col w-full">
                            <p className="text-white text-sm font-semibold leading-normal pb-2">Nome Completo</p>
                            <input
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                                placeholder="Digite o nome completo do aluno"
                                type="text"
                            />
                        </label>
                        <label className="flex flex-col w-full">
                            <p className="text-white text-sm font-semibold leading-normal pb-2">E-mail</p>
                            <input
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                                placeholder="exemplo@email.com"
                                type="email"
                            />
                        </label>
                        <label className="flex flex-col w-full">
                            <p className="text-white text-sm font-semibold leading-normal pb-2">CPF</p>
                            <input
                                name="cpf"
                                value={formData.cpf}
                                onChange={handleChange}
                                className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                                placeholder="000.000.000-00"
                                type="text"
                                maxLength={14}
                            />
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="flex flex-col">
                                <p className="text-white text-sm font-semibold leading-normal pb-2">Telefone</p>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                                    placeholder="(00) 00000-0000"
                                    type="tel"
                                    autoComplete='off'
                                />
                            </label>
                            <label className="flex flex-col">
                                <p className="text-white text-sm font-semibold leading-normal pb-2">Data de Nascimento</p>
                                <input
                                    name="birth_date"
                                    value={formData.birth_date}
                                    onChange={handleChange}
                                    className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                                    type="date"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6 bg-card p-6 rounded-xl shadow-sm border border-border-slate">
                    <div className="flex items-center gap-2 border-b border-border-slate pb-4">
                        <span className="material-symbols-outlined text-primary">sports_kabaddi</span>
                        <h2 className="text-white text-xl font-bold leading-tight tracking-tight">Dados do Dojo</h2>
                    </div>
                    <div className="flex flex-col gap-4">
                        <label className="flex flex-col w-full">
                            <p className="text-white text-sm font-semibold leading-normal pb-2">Turma Designada</p>
                            <div className="grid grid-cols-1 gap-3 mt-2">
                                {groups.map(grp => (
                                    <label key={grp.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all h-full ${formData.enrolled_classes.includes(grp.name) ? 'bg-primary/20 border-primary' : 'bg-main border-border-slate hover:border-gray-500'}`}>
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${formData.enrolled_classes.includes(grp.name) ? 'bg-primary border-primary' : 'border-gray-500'}`}>
                                            {formData.enrolled_classes.includes(grp.name) && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={formData.enrolled_classes.includes(grp.name)}
                                            onChange={() => handleClassToggle(grp.name)}
                                        />
                                        <span className="text-white text-sm font-medium leading-tight break-words line-clamp-2">{grp.name}</span>
                                    </label>
                                ))}
                                {groups.length === 0 && <p className="text-muted text-xs">Nenhuma turma cadastrada. <Link to="/groups/new" className="text-primary hover:underline">Criar Turma</Link></p>}
                            </div>
                        </label>
                        <label className="flex flex-col w-full">
                            <p className="text-white text-sm font-semibold leading-normal pb-2">Faixa Atual</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-2">
                                {belts.length === 0 ? (
                                    <>
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="h-16 rounded-2xl border border-border-slate/20 bg-white/5 animate-pulse flex flex-col items-center justify-center p-2">
                                                <div className="w-full h-3 rounded-full bg-white/10 mb-2" />
                                                <div className="w-1/2 h-2 rounded-full bg-white/5" />
                                            </div>
                                        ))}
                                        {/* <p className="text-muted text-[10px] col-span-full mt-2 italic">Dica: Se as faixas não aparecerem, verifique se a tabela 'belts' está populada no banco de dados.</p> */}
                                    </>
                                ) : (
                                    belts.map(belt => (
                                        <button
                                            key={belt.id}
                                            onClick={() => handleBeltSelect(belt.name)}
                                            type="button"
                                            title={`${belt.name} (Min: ${belt.min_xp} XP)`}
                                            className={cn(
                                                "h-16 rounded-2xl border-2 transition-all flex flex-col items-center justify-center cursor-pointer p-2 relative overflow-hidden group active:scale-95",
                                                formData.belt === belt.name
                                                    ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(215,38,56,0.1)]"
                                                    : "border-border-slate bg-main hover:border-gray-500 hover:bg-white/5"
                                            )}
                                        >
                                            <div
                                                className="w-full h-3 rounded-full border border-white/5 mb-2 shadow-inner transition-transform group-hover:scale-x-105 flex overflow-hidden"
                                            >
                                                <div
                                                    className="h-full flex-1"
                                                    style={{ backgroundColor: belt.color } as React.CSSProperties}
                                                />
                                                {belt.color_secondary && (
                                                    <div
                                                        className="h-full flex-1"
                                                        style={{ backgroundColor: belt.color_secondary } as React.CSSProperties}
                                                    />
                                                )}
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest truncate w-full text-center transition-colors",
                                                formData.belt === belt.name ? "text-primary" : "text-muted group-hover:text-white"
                                            )}>
                                                {belt.name}
                                            </span>
                                            {formData.belt === belt.name && (
                                                <div className="absolute top-1 right-1 animate-in zoom-in duration-300">
                                                    <span className="material-symbols-outlined text-[14px] text-primary fill-current">check_circle</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        </button>
                                    ))
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="material-symbols-outlined text-[14px] text-muted">info</span>
                                <p className="text-muted text-[10px] italic">Algumas faixas podem exigir critérios técnicos e XP mínimio para graduação.</p>
                            </div>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end mt-4">
                            <div className="flex flex-col w-full">
                                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] pb-3 ml-1 text-center sm:text-left">Status da Matrícula</p>
                                <div className="flex bg-white/5 p-1 rounded-2xl border border-border-slate gap-1 h-16 relative">
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
                                                "flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-300 relative group overflow-hidden border border-transparent",
                                                formData.status === status.id
                                                    ? `${status.activeBg} ${status.color} shadow-lg scale-[1.02] z-10 font-black`
                                                    : "text-muted hover:bg-white/5 font-bold"
                                            )}
                                        >
                                            <span className={cn(
                                                "material-symbols-outlined text-lg transition-transform",
                                                formData.status === status.id && "scale-110"
                                            )}>
                                                {status.icon}
                                            </span>
                                            <span className="text-[9px] uppercase tracking-widest">{status.label}</span>

                                            {formData.status === status.id && (
                                                <div className={cn(
                                                    "absolute inset-0 opacity-20 blur-xl -z-10",
                                                    status.color.replace('text-', 'bg-')
                                                )} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="stats-card-premium p-5 rounded-[2rem] overflow-hidden relative group border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent h-16 flex items-center">
                                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-all duration-700 rotate-12">
                                    <span className="material-symbols-outlined text-6xl text-primary">bolt</span>
                                </div>

                                <div className="relative z-10 flex items-center gap-4 w-full">
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/10 shrink-0">
                                        <span className="material-symbols-outlined text-primary text-xl animate-pulse">bolt</span>
                                    </div>

                                    <div className="flex flex-col justify-center overflow-hidden">
                                        <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-0.5 opacity-70 truncate">Experiência Acumulada</span>
                                        <div className="flex items-end gap-1.5">
                                            <span className="text-2xl font-black text-white tracking-tighter leading-none">
                                                {formData.xp.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest pb-0.5 opacity-50">XP</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 flex justify-end gap-4 mt-4 pt-6 border-t border-border-slate">
                    <Link to="/members" className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-card text-white text-sm font-bold leading-normal hover:bg-card/80 transition-all border border-border-slate">
                        Cancelar
                    </Link>
                    <button
                        disabled={loading}
                        className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold leading-normal shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                    >
                        <span className="material-symbols-outlined mr-2">save</span>
                        {loading ? 'Salvando...' : 'Salvar Aluno'}
                    </button>
                </div>
            </form>
        </div>
    );
}
