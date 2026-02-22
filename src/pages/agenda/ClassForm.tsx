import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { AttendanceTab } from '../../components/AttendanceTab';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { toast } from 'react-hot-toast';

export function ClassForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        group_id: '',
        title: '',
        instructor: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '19:00',
        end_time: '20:30',
        max_students: 20,
        type: 'Gi',
        lesson_plan: '',
        allowed_groups: [] as string[],
    });
    const [groups, setGroups] = useState<{ id: string, name: string }[]>([]);
    const [activeTab, setActiveTab] = useState<'details' | 'plan' | 'attendance'>('details');

    useEffect(() => {
        fetchInitialData();
        if (id) {
            fetchClass();
        }
    }, [id]);

    async function fetchInitialData() {
        try {
            const { data } = await supabase.from('groups').select('id, name');
            if (data) setGroups(data);
        } catch (err) {
            console.error('Error fetching groups:', err);
        }
    }

    async function fetchClass() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                toast.error('Aula não encontrada');
                navigate('/agenda');
            } else if (data) {
                const startDate = new Date(data.start_time);
                const endDate = new Date(data.end_time);

                setFormData({
                    group_id: '',
                    allowed_groups: data.allowed_groups || [],
                    title: data.title,
                    instructor: data.instructor,
                    date: startDate.toISOString().split('T')[0],
                    start_time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                    end_time: endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                    max_students: data.max_students,
                    type: data.type,
                    lesson_plan: data.lesson_plan || '',
                });
            }
        } catch (err) {
            toast.error('Erro ao buscar dados da aula');
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleGroupToggle = (groupName: string) => {
        setFormData(prev => {
            const current = prev.allowed_groups || [];
            if (current.includes(groupName)) {
                return { ...prev, allowed_groups: current.filter(g => g !== groupName) };
            } else {
                return { ...prev, allowed_groups: [...current, groupName] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);

        try {
            // Combine date and time
            const startDateTime = new Date(`${formData.date}T${formData.start_time}:00`);
            const endDateTime = new Date(`${formData.date}T${formData.end_time}:00`);

            const classData = {
                title: formData.title,
                instructor: formData.instructor,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                max_students: Number(formData.max_students),
                type: formData.type,
                status: 'Scheduled',
                lesson_plan: formData.lesson_plan,
                allowed_groups: formData.allowed_groups,
            };

            const { error } = id
                ? await supabase.from('classes').update(classData).eq('id', id)
                : await supabase.from('classes').insert([classData]);

            if (error) throw error;

            toast.success(id ? 'Aula atualizada!' : 'Aula criada!');
            navigate('/agenda');
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
                <p className="text-muted font-black uppercase tracking-widest text-xs animate-pulse">Sincronizando Agenda...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[900px] w-full mx-auto space-y-6 pb-20 px-4 sm:px-0">
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 mb-2">
                <Link to="/agenda" className="text-muted hover:text-primary text-sm font-bold transition-colors">Agenda</Link>
                <span className="material-symbols-outlined text-muted text-sm">chevron_right</span>
                <span className="text-white text-sm font-bold">{id ? 'Editar Aula' : 'Nova Aula'}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-10">
                <div className="flex flex-col gap-2">
                    <h1 className="text-white text-3xl sm:text-5xl font-black leading-none tracking-tighter uppercase italic">
                        {id ? 'Editar Aula' : 'Agendar Aula'}
                    </h1>
                    <p className="text-muted text-sm sm:text-base font-medium max-w-xl">
                        {id ? 'Modifique os detalhes da sessão de treinamento.' : 'Configure os detalhes da nova sessão de treinamento.'}
                    </p>
                </div>
                <Link to="/agenda">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <span className="material-symbols-outlined mr-2 text-lg">arrow_back</span>
                        Voltar
                    </Button>
                </Link>
            </div>

            {/* Responsive Tabs Container */}
            <div className="flex bg-card border border-border-slate p-1 gap-1 sticky top-0 z-20 rounded-2xl mb-6 overflow-x-auto scrollbar-hide no-scrollbar shadow-xl backdrop-blur-md bg-card/90">
                {[
                    { id: 'details', label: 'Detalhes', icon: 'edit' },
                    { id: 'plan', label: 'Plano de Aula', icon: 'menu_book' },
                    { id: 'attendance', label: 'Frequência', icon: 'how_to_reg', disabled: !id }
                ].map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                        disabled={tab.disabled}
                        className={cn(
                            "flex items-center justify-center gap-2 px-4 sm:px-6 h-12 rounded-xl transition-all font-bold text-sm whitespace-nowrap flex-1",
                            activeTab === tab.id
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "text-muted hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                        )}
                    >
                        <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                        <span className={cn(
                            "transition-all",
                            activeTab === tab.id ? "opacity-100 translate-x-0" : "opacity-80 transition-all duration-300"
                        )}>
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {activeTab === 'details' && (
                    <Card>
                        <CardContent className="p-6 sm:p-8 space-y-8">
                            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="md:col-span-2 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-primary">groups</span>
                                            </div>
                                            <h2 className="text-white text-xl font-black uppercase tracking-tight italic">Turmas Participantes</h2>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-main rounded-2xl border border-border-slate">
                                            {groups.map(grp => (
                                                <button
                                                    key={grp.id}
                                                    type="button"
                                                    onClick={() => handleGroupToggle(grp.name)}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                                        formData.allowed_groups.includes(grp.name)
                                                            ? 'bg-primary/10 border-primary text-white'
                                                            : 'bg-card border-border-slate text-muted hover:border-slate-500'
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-5 h-5 rounded flex items-center justify-center border transition-all",
                                                        formData.allowed_groups.includes(grp.name) ? 'bg-primary border-primary' : 'border-slate-700'
                                                    )}>
                                                        {formData.allowed_groups.includes(grp.name) && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                                                    </div>
                                                    <span className="text-sm font-bold">{grp.name}</span>
                                                </button>
                                            ))}
                                            {groups.length === 0 && <p className="text-muted text-xs p-2">Nenhuma turma cadastrada.</p>}
                                        </div>
                                        <p className="text-muted text-[10px] mt-2 italic flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[14px]">info</span>
                                            Selecione quais turmas podem participar desta aula para controle de acesso automático.
                                        </p>
                                    </div>

                                    <div className="md:col-span-2">
                                        <Input
                                            label="Título da Aula"
                                            name="title"
                                            icon="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ex: Treino de Competição ou Nome da Turma"
                                        />
                                    </div>

                                    <Input
                                        label="Instrutor Responsável"
                                        name="instructor"
                                        icon="person"
                                        value={formData.instructor}
                                        onChange={handleChange}
                                        required
                                        placeholder="Nome do Professor"
                                    />

                                    <Input
                                        label="Data"
                                        name="date"
                                        type="date"
                                        icon="calendar_month"
                                        value={formData.date}
                                        onChange={handleChange}
                                        required
                                    />

                                    <Input
                                        label="Início"
                                        name="start_time"
                                        type="time"
                                        icon="schedule"
                                        value={formData.start_time}
                                        onChange={handleChange}
                                        required
                                    />

                                    <Input
                                        label="Término"
                                        name="end_time"
                                        type="time"
                                        icon="history"
                                        value={formData.end_time}
                                        onChange={handleChange}
                                        required
                                    />

                                    <div className="space-y-2">
                                        <p className="text-white text-sm font-semibold leading-normal pb-2 ml-1">Modalidade / Tipo</p>
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted text-xl group-focus-within:text-primary transition-colors">category</span>
                                            <select
                                                name="type"
                                                title="Selecione o tipo de aula"
                                                value={formData.type}
                                                onChange={handleChange}
                                                className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-14 pl-12 pr-4 text-base font-bold transition-all outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="Gi">Gi (Com Kimono)</option>
                                                <option value="No-Gi">No-Gi (Sem Kimono)</option>
                                                <option value="Kids">Infantil</option>
                                                <option value="Private">Particular</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none">expand_more</span>
                                        </div>
                                    </div>

                                    <Input
                                        label="Capacidade Máxima"
                                        name="max_students"
                                        type="number"
                                        icon="group"
                                        value={formData.max_students}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 border-t border-border-slate mt-4">
                                    <Link to="/agenda" className="w-full sm:w-auto">
                                        <Button variant="outline" className="w-full px-8">Cancelar</Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        loading={saving}
                                        className="w-full sm:min-w-[200px]"
                                        icon={<span className="material-symbols-outlined">save</span>}
                                    >
                                        {id ? 'Salvar Alterações' : 'Criar Aula'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'plan' && (
                    <Card>
                        <CardContent className="p-6 sm:p-8 space-y-6">
                            <div className="flex justify-between items-center sm:items-end gap-4">
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase italic">
                                        <span className="material-symbols-outlined text-primary text-2xl">menu_book</span>
                                        Plano de Aula
                                    </h3>
                                    <p className="text-muted text-sm font-medium">Descreva o conteúdo técnico, aquecimento e objetivos.</p>
                                </div>
                                <Button
                                    onClick={handleSubmit}
                                    loading={saving}
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:bg-primary/10"
                                >
                                    Salvar Plano
                                </Button>
                            </div>

                            <textarea
                                name="lesson_plan"
                                value={formData.lesson_plan}
                                onChange={(e) => setFormData(prev => ({ ...prev, lesson_plan: e.target.value }))}
                                className="w-full h-[450px] bg-main border border-border-slate rounded-2xl p-6 text-white text-base leading-relaxed outline-none resize-none focus:border-primary font-medium shadow-inner transition-all sm:text-lg"
                                placeholder="# Aquecimento\n- Corrida leve\n- Mobilidade de quadril\n\n# Técnica do Dia\n- Passagem de guarda emborcando\n- Variação para as costas\n\n# Rola (Sparring)\n- 5 rolas de 5 minutos"
                            />
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'attendance' && id && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <AttendanceTab classId={id} date={formData.date} classTitle={formData.title} />
                    </div>
                )}
            </div>
        </div>
    );
}
