import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { maskPhone, maskCPF, maskCEP } from '../../lib/masks';
import { useCities } from '../../hooks/useCities';
import { PhotoUpload } from '../../components/ui/PhotoUpload';
import { fetchAddressByCEP } from '../../lib/cep-lookup';
import { EvaluationsList } from './EvaluationsList';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../lib/auth';
import { BeltAvatar } from '../../components/shared/BeltAvatar';
import { BadgeShowcase } from '../../components/shared/BadgeShowcase';

export function MemberForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
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
        avatar_url: '',
        role: 'student' as 'admin' | 'manager' | 'coordinator' | 'instructor' | 'student',
        user_id: null as string | null,
        next_belt_override: null as string | null
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

    useEffect(() => {
        const cleanCEP = formData.cep.replace(/\D/g, '');
        if (cleanCEP.length === 8) {
            // Don't auto-lookup for initial load to avoid overwriting existing address details (number, etc)
            if (isInitialLoad) {
                setIsInitialLoad(false);
                return;
            }

            const timer = setTimeout(async () => {
                const addressData = await fetchAddressByCEP(cleanCEP);
                if (addressData) {
                    const formattedAddress = `${addressData.logradouro || ''}${addressData.bairro ? `, ${addressData.bairro}` : ''}`.toUpperCase().trim();
                    setFormData(prev => ({
                        ...prev,
                        address: formattedAddress,
                        city: addressData.localidade.toUpperCase(),
                        state: addressData.uf
                    }));
                    toast.success('Endereço preenchido via CEP');
                }
            }, 500);
            return () => clearTimeout(timer);
        } else if (cleanCEP.length > 0) {
            // If user cleared or typed something else, it's no longer initial load behavior
            setIsInitialLoad(false);
        }
    }, [formData.cep]);

    async function fetchMember() {
        if (!id) return;
        setLoading(true);
        try {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            
            // Busca por ID do registro OU user_id (contas de acesso)
            let query = supabase.from('members').select('*');
            
            if (isUuid) {
                query = query.or(`id.eq.${id},user_id.eq.${id}`);
            } else {
                query = query.eq('id', id);
            }

            const { data, error } = await query.maybeSingle();

            if (error) {
                console.error('Erro ao buscar membro:', error);
                throw error;
            }

            if (!data) {
                // Se não existir em 'members' ainda e for UUID, buscar dados básicos de 'profiles'
                if (isUuid) {
                    const { data: profileBase, error: profileErr } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', id)
                        .maybeSingle();

                    if (profileErr) throw profileErr;

                    if (profileBase) {
                        setFormData(prev => ({
                            ...prev,
                            full_name: profileBase.full_name || '',
                            email: profileBase.email || '',
                            role: profileBase.role || 'student',
                            type: (profileBase.role === 'admin' || profileBase.role === 'manager' ? 'staff' : 'student'),
                            avatar_url: profileBase.avatar_url || ''
                        }));
                        setLoading(false);
                        return;
                    }
                }
                
                toast.error('Membro/Usuário não encontrado');
                navigate('/members');
                return;
            }

            const mappedData: any = {
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
                avatar_url: data.avatar_url || '',
                role: 'student' as any,
                user_id: data.user_id || null,
                next_belt_override: data.next_belt_override || null
            };

            // Garantir que pegamos o Role mais atualizado do Profiles
            const profileQuery = supabase.from('profiles').select('role');
            if (data.user_id) {
                profileQuery.or(`id.eq.${id},id.eq.${data.user_id}`);
            } else if (isUuid) {
                profileQuery.eq('id', id);
            } else if (data.email) {
                profileQuery.eq('email', data.email);
            }
            
            const { data: profileFinal } = await profileQuery.maybeSingle();
            
            if (profileFinal) {
                mappedData.role = profileFinal.role;
            }

            setFormData(mappedData);
        } catch (err: any) {
            console.error('Falha geral ao carregar:', err);
            toast.error('Erro ao carregar dados');
            navigate('/members');
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const dataToSave = {
            full_name: formData.full_name.toUpperCase().trim(),
            email: formData.email.toLowerCase().trim(),
            phone: formData.phone,
            cpf: formData.cpf,
            birth_date: formData.birth_date || null,
            belt: formData.belt,
            stripes: Number(formData.stripes),
            status: formData.status,
            billing_day: Number(formData.billing_day),
            monthly_fee: Number(formData.monthly_fee),
            address: formData.address.toUpperCase().trim(),
            cep: formData.cep,
            city: formData.city.toUpperCase().trim(),
            state: formData.state,
            type: formData.type,
            plan: formData.plan.toUpperCase().trim(),
            enrolled_classes: formData.enrolled_classes,
            avatar_url: formData.avatar_url,
            user_id: formData.user_id,
            xp: Number(formData.xp),
            next_belt_override: formData.next_belt_override
        };

        try {
            let userId = formData.user_id;

            // Criar acesso se solicitado e ainda não possuir um user_id
            if (!userId && createAccess && formData.email) {
                if (!password || password.length < 6) {
                    toast.error('Informe uma senha de pelo menos 6 caracteres.');
                    setSaving(false);
                    return;
                }

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: password,
                    options: {
                        data: {
                            full_name: formData.full_name,
                            role: formData.role
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

            const finalDataToSave = { ...dataToSave };
            if (userId) {
                finalDataToSave.user_id = userId;
                // Para novos membros com acesso, forçar o ID do registro a ser o mesmo UUID do Auth
                if (!id) (finalDataToSave as any).id = userId;
            }

            const { data: result, error: saveError } = id
                ? await supabase.from('members').upsert({ id, ...finalDataToSave }).select().single()
                : await supabase.from('members').insert([finalDataToSave]).select().single();

            if (saveError) throw saveError;

            // 2. Sincronizar dados em 'profiles'
            const finalId = id || result?.id || userId;
            if (finalId) {
                await supabase.from('profiles').upsert({
                    id: userId || finalId, // Prioridade para o userId se existir
                    full_name: formData.full_name,
                    email: formData.email,
                    role: formData.role,
                    avatar_url: formData.avatar_url,
                    updated_at: new Date().toISOString()
                });

                // Se estivermos editando o perfil do próprio usuário logado, atualizamos o AuthContext
                if ((userId || finalId) === profile?.id) {
                    await refreshProfile();
                }
            }

            toast.success(id ? 'Perfil atualizado!' : 'Membro cadastrado!');
            navigate('/members');
        } catch (err: any) {
            toast.error(`Erro ao salvar: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-white text-3xl font-black leading-tight tracking-tight uppercase">
                        {id ? 'Editar Perfil' : 'Novo Membro & Equipe'}
                    </h1>
                    <p className="text-muted text-sm font-medium">Preencha todos os dados pessoais e profissionais do membro.</p>
                </div>
                <Link to="/members" className="px-4 py-2 text-muted hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Voltar
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="bg-card border-border-slate shadow-xl overflow-hidden rounded-2xl">
                    <div className="p-6 bg-main/50 border-b border-border-slate flex flex-col items-center sm:flex-row sm:items-start gap-8">
                        <PhotoUpload
                            url={formData.avatar_url}
                            onUpload={(url: string) => setFormData(prev => ({ ...prev, avatar_url: url }))}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 w-full">
                            <Input
                                label="Nome Completo"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value.toUpperCase() })}
                                required
                                placeholder="JOÃO DA SILVA"
                                className="uppercase font-bold"
                            />
                            <Input
                                label="E-mail Principal"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase().trim() })}
                                required
                                placeholder="joao@exemplo.com"
                                className="font-bold"
                            />
                            <div className="space-y-2">
                                <label htmlFor="role-select" className="text-muted text-[10px] font-black uppercase tracking-widest ml-1">Nível de Acesso (Sistema)</label>
                                <select
                                    id="role-select"
                                    className="w-full bg-main border border-border-slate rounded-xl px-4 h-12 text-white focus:ring-2 focus:ring-primary/20 appearance-none outline-none font-bold text-sm"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any, type: (e.target.value === 'admin' || e.target.value === 'manager') ? 'staff' : 'student' })}
                                >
                                    <option value="student">Apenas Aluno</option>
                                    <option value="instructor">Instrutor</option>
                                    <option value="coordinator">Coordenador</option>
                                    <option value="manager">Gerente</option>
                                    <option value="admin">Administrador Geral</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="type-select" className="text-muted text-[10px] font-black uppercase tracking-widest ml-1">Categoria (Listagem)</label>
                                <select
                                    id="type-select"
                                    className="w-full bg-main border border-border-slate rounded-xl px-4 h-12 text-white focus:ring-2 focus:ring-primary/20 appearance-none outline-none font-bold text-sm"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="student">Aluno</option>
                                    <option value="instructor">Instrutor</option>
                                    <option value="teacher">Professor</option>
                                    <option value="staff">Equipe Administrativa</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-8 space-y-10">
                        {/* Seção Dados Pessoais */}
                        <div className="space-y-6">
                            <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-4 border-l-2 border-primary pl-3">
                                Dados Pessoais & Contato
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                <Input
                                    label="CPF"
                                    placeholder="000.000.000-00"
                                    value={formData.cpf}
                                    onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                                />
                                <Input
                                    label="Telefone / WhatsApp"
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                                />
                                <Input
                                    label="Data de Nascimento"
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                />
                                <Input
                                    label="CEP"
                                    placeholder="00000-000"
                                    value={formData.cep}
                                    onChange={(e) => setFormData({ ...formData, cep: maskCEP(e.target.value) })}
                                />
                                <div className="sm:col-span-2">
                                    <Input
                                        label="Endereço Completo"
                                        placeholder="RUA, NÚMERO, BAIRRO..."
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value.toUpperCase() })}
                                        className="uppercase font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="state-select" className="text-muted text-[10px] font-black uppercase tracking-widest ml-1">Estado (UF)</label>
                                    <select
                                        id="state-select"
                                        className="w-full bg-main border border-border-slate rounded-xl px-4 h-12 text-white outline-none font-bold text-sm"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    >
                                        <option value="AC">Acre</option>
                                        <option value="AL">Alagoas</option>
                                        <option value="AP">Amapá</option>
                                        <option value="AM">Amazonas</option>
                                        <option value="BA">Bahia</option>
                                        <option value="CE">Ceará</option>
                                        <option value="DF">Distrito Federal</option>
                                        <option value="ES">Espírito Santo</option>
                                        <option value="GO">Goiás</option>
                                        <option value="MA">Maranhão</option>
                                        <option value="MT">Mato Grosso</option>
                                        <option value="MS">Mato Grosso do Sul</option>
                                        <option value="MG">Minas Gerais</option>
                                        <option value="PA">Pará</option>
                                        <option value="PB">Paraíba</option>
                                        <option value="PR">Paraná</option>
                                        <option value="PE">Pernambuco</option>
                                        <option value="PI">Piauí</option>
                                        <option value="RJ">Rio de Janeiro</option>
                                        <option value="RN">Rio Grande do Norte</option>
                                        <option value="RS">Rio Grande do Sul</option>
                                        <option value="RO">Rondônia</option>
                                        <option value="RR">Roraima</option>
                                        <option value="SC">Santa Catarina</option>
                                        <option value="SP">São Paulo</option>
                                        <option value="SE">Sergipe</option>
                                        <option value="TO">Tocantins</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="city-select" className="text-muted text-[10px] font-black uppercase tracking-widest ml-1">Cidade</label>
                                    <select
                                        id="city-select"
                                        className="w-full bg-main border border-border-slate rounded-xl px-4 h-12 text-white outline-none font-bold text-sm"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    >
                                        <option value="">{loadingCities ? 'Carregando cidades...' : 'Selecione a cidade'}</option>
                                        {cities.map(cityName => (
                                            <option key={cityName} value={cityName}>{cityName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Seção Graduação */}
                        <div className="space-y-6 pt-4">
                            <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-4 border-l-2 border-primary pl-3">
                                Graduação & Performance
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="belt-select" className="text-muted text-[10px] font-black uppercase tracking-widest ml-1">Faixa Atual</label>
                                    <select
                                        id="belt-select"
                                        className="w-full bg-main border border-border-slate rounded-xl px-4 h-12 text-white outline-none font-bold text-sm"
                                        value={formData.belt}
                                        onChange={(e) => setFormData({ ...formData, belt: e.target.value })}
                                    >
                                        {belts.map(b => (
                                            <option key={b.id} value={b.name}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <Input
                                    label="Graus"
                                    type="number"
                                    min="0"
                                    max="4"
                                    value={formData.stripes}
                                    onChange={(e) => setFormData({ ...formData, stripes: Number(e.target.value) })}
                                />
                                <Input
                                    label="XP Atual"
                                    type="number"
                                    value={formData.xp}
                                    onChange={(e) => setFormData({ ...formData, xp: Number(e.target.value) })}
                                />
                                <div className="space-y-2">
                                    <label htmlFor="status-select" className="text-muted text-[10px] font-black uppercase tracking-widest ml-1">Status</label>
                                    <select
                                        id="status-select"
                                        className="w-full bg-main border border-border-slate rounded-xl px-4 h-12 text-white outline-none font-bold text-sm"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Active">Ativo</option>
                                        <option value="Inactive">Inativo</option>
                                        <option value="Paused">Pausado</option>
                                    </select>
                                </div>
                                <div className="space-y-2 sm:col-span-2 md:col-span-4">
                                    <label htmlFor="next-belt-select" className="text-muted text-[10px] font-black uppercase tracking-widest ml-1">Próxima Faixa (Override Manual)</label>
                                    <select
                                        id="next-belt-select"
                                        className="w-full bg-main border border-border-slate rounded-xl px-4 h-12 text-white outline-none font-bold text-sm"
                                        value={formData.next_belt_override || ''}
                                        onChange={(e) => setFormData({ ...formData, next_belt_override: e.target.value || null })}
                                    >
                                        <option value="">Automático (pela turma)</option>
                                        {belts.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-muted italic ml-1">Deixe como "Automático" para seguir a progressão da turma. Selecione para definir manualmente (ex: pular faixas).</p>
                                </div>
                            </div>
                        </div>

                        {/* Seção Financeiro */}
                        <div className="space-y-6 pt-4">
                            <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-4 border-l-2 border-primary pl-3">
                                Plano & Financeiro
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                <Input
                                    label="Plano / Matrícula"
                                    placeholder="EX: MENSAL GOLD"
                                    value={formData.plan}
                                    onChange={(e) => setFormData({ ...formData, plan: e.target.value.toUpperCase() })}
                                    className="uppercase font-bold"
                                />
                                <Input
                                    label="Valor da Mensalidade"
                                    type="number"
                                    step="0.01"
                                    value={formData.monthly_fee}
                                    onChange={(e) => setFormData({ ...formData, monthly_fee: Number(e.target.value) })}
                                />
                                <Input
                                    label="Dia de Vencimento"
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={formData.billing_day}
                                    onChange={(e) => setFormData({ ...formData, billing_day: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* Seção Turmas */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-4 border-l-2 border-primary pl-3">
                                Turmas & Treinos
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {groups.map((group) => (
                                    <button
                                        key={group.id}
                                        type="button"
                                        onClick={() => {
                                            const updated = formData.enrolled_classes.includes(group.name)
                                                ? formData.enrolled_classes.filter(c => c !== group.name)
                                                : [...formData.enrolled_classes, group.name];
                                            setFormData({ ...formData, enrolled_classes: updated });
                                        }}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                            formData.enrolled_classes.includes(group.name)
                                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                                : "bg-main border-border-slate text-muted hover:border-primary/50"
                                        )}
                                    >
                                        {group.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Seção Login do Sistema (Apenas se ainda não tiver acesso) */}
                        {!formData.user_id && (
                            <div className="flex items-center gap-4 mt-8 bg-zinc-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                                <BeltAvatar
                                    name={formData.full_name || 'Membro'}
                                    belt={formData.belt}
                                    avatarUrl={formData.avatar_url}
                                    size="lg"
                                    showGlow={true}
                                />
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/20 p-2 rounded-lg">
                                            <span className="material-symbols-outlined text-primary">key</span>
                                        </div>
                                        <div>
                                            <h4 className="text-white text-sm font-black uppercase tracking-wider">Acesso ao Sistema</h4>
                                            <p className="text-muted text-[11px]">Deseja criar um login para este membro?</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <label htmlFor="access-switch" className="sr-only">Habilitar Acesso</label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                id="access-switch"
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={createAccess}
                                                onChange={(e) => setCreateAccess(e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-main peer-focus:outline-none rounded-full peer border border-border-slate peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                </div>

                                {createAccess && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 animate-in slide-in-from-top-2 duration-300">
                                        <Input
                                            label="Senha Inicial"
                                            type="password"
                                            placeholder="Mínimo 6 caracteres"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required={createAccess}
                                        />
                                        <div className="flex items-center p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                                            <span className="material-symbols-outlined text-yellow-500 mr-3 text-2xl">info</span>
                                            <p className="text-yellow-500/80 text-[10px] font-medium leading-relaxed">
                                                Certifique-se de que o e-mail informado acima é válido. O usuário poderá alterar a senha depois no primeiro acesso.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-4 pt-10 border-t border-border-slate">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/members')}
                                className="h-12 px-8 font-black uppercase tracking-widest text-xs"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="h-12 px-10 font-black uppercase tracking-widest text-xs bg-primary hover:bg-primary-hover shadow-xl shadow-primary/20"
                            >
                                {saving ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Salvando...
                                    </div>
                                ) : (
                                    'Salvar Alterações'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {id && (
                    <Card>
                        <CardContent className="p-6">
                            <BadgeShowcase memberId={id} />
                        </CardContent>
                    </Card>
                )}

                {id && (
                    <EvaluationsList memberId={id} currentBelt={formData.belt} />
                )}
            </form>
        </div>
    );
}
