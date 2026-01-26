import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function MemberForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        birth_date: '',
        plan: '',
        enrolled_classes: [] as string[],
        belt: 'White',
        stripes: 0,
        status: 'Active',
    });
    const [groups, setGroups] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        if (id) {
            fetchMember();
        }
        fetchGroups();

        async function fetchGroups() {
            const { data } = await supabase.from('groups').select('id, name');
            if (data) setGroups(data);
        }

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
                    birth_date: data.birth_date || '',
                    plan: data.plan || '',
                    enrolled_classes: data.enrolled_classes || [],
                    belt: data.belt || 'White',
                    stripes: data.stripes || 0,
                    status: data.status || 'Active',
                });
            }
            setLoading(false);
        }
    }, [id, navigate]);



    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
                            <div className="grid grid-cols-5 gap-2">
                                <button
                                    onClick={() => handleBeltSelect('White')}
                                    type="button"
                                    className={`h-10 rounded border-2 transition-all flex items-center justify-center cursor-pointer ${formData.belt === 'White' ? 'border-primary bg-white/20' : 'border-gray-200 bg-white hover:border-primary/50'}`}
                                >
                                    <div className="w-full h-3 bg-white border border-gray-300 mx-2"></div>
                                </button>
                                <button
                                    onClick={() => handleBeltSelect('Blue')}
                                    type="button"
                                    className={`h-10 rounded border-2 transition-all flex items-center justify-center cursor-pointer ${formData.belt === 'Blue' ? 'border-primary bg-blue-500/20' : 'border-transparent bg-blue-500 hover:opacity-80'}`}
                                >
                                    <div className="w-full h-3 bg-blue-600 mx-2 shadow-sm"></div>
                                </button>
                                <button
                                    onClick={() => handleBeltSelect('Purple')}
                                    type="button"
                                    className={`h-10 rounded border-2 transition-all flex items-center justify-center cursor-pointer ${formData.belt === 'Purple' ? 'border-primary bg-purple-600/20' : 'border-transparent bg-purple-600 hover:border-primary/50'}`}
                                >
                                    <div className="w-full h-3 bg-purple-700 mx-2"></div>
                                </button>
                                <button
                                    onClick={() => handleBeltSelect('Brown')}
                                    type="button"
                                    className={`h-10 rounded border-2 transition-all flex items-center justify-center cursor-pointer ${formData.belt === 'Brown' ? 'border-primary bg-[#5C4033]/20' : 'border-transparent bg-[#5C4033] hover:border-primary/50'}`}
                                >
                                    <div className="w-full h-3 bg--[#422e25] mx-2"></div>
                                </button>
                                <button
                                    onClick={() => handleBeltSelect('Black')}
                                    type="button"
                                    className={`h-10 rounded border-2 transition-all flex items-center justify-center cursor-pointer ${formData.belt === 'Black' ? 'border-primary bg-black/20' : 'border-transparent bg-black hover:border-primary/50'}`}
                                >
                                    <div className="w-full h-3 bg-neutral-900 border-l-4 border-red-600 mx-2"></div>
                                </button>
                            </div>
                            <p className="text-muted text-xs mt-2 italic">Selecione a graduação atual do aluno: {
                                formData.belt === 'White' ? 'Faixa Branca' :
                                    formData.belt === 'Blue' ? 'Faixa Azul' :
                                        formData.belt === 'Purple' ? 'Faixa Roxa' :
                                            formData.belt === 'Brown' ? 'Faixa Marrom' :
                                                'Faixa Preta'
                            }</p>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex flex-col">
                                <p className="text-white text-sm font-semibold leading-normal pb-2">Status</p>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                                >
                                    <option value="Active">Ativo</option>
                                    <option value="Paused">Em Pausa</option>
                                    <option value="Inactive">Inativo</option>
                                </select>
                            </label>
                            <div className="flex flex-col">
                                <p className="text-white text-sm font-semibold leading-normal pb-2">Experiência (XP)</p>
                                <div className="flex items-center h-12 gap-3 px-4 bg-primary/10 rounded-lg border border-primary/20">
                                    <span className="material-symbols-outlined text-primary">military_tech</span>
                                    <span className="font-bold text-primary">Nível 1</span>
                                    <span className="text-xs text-muted">(0 XP)</span>
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
