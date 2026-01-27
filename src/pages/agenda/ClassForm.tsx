import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function ClassForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        group_id: '',
        title: '',
        instructor: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '19:00',
        end_time: '20:30',
        max_students: 20,
        type: 'Gi',
    });
    const [groups, setGroups] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        fetchGroups();
        if (id) {
            fetchClass();
        }
    }, [id]);

    async function fetchClass() {
        setLoading(true);
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching class:', error);
            navigate('/agenda');
        } else if (data) {
            const startDate = new Date(data.start_time);
            const endDate = new Date(data.end_time);

            setFormData({
                group_id: '', // Group ID isn't stored in classes table directly based on insert
                title: data.title,
                instructor: data.instructor,
                date: startDate.toISOString().split('T')[0],
                start_time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                end_time: endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                max_students: data.max_students,
                type: data.type,
            });
        }
        setLoading(false);
    }

    async function fetchGroups() {
        const { data } = await supabase.from('groups').select('id, name');
        if (data) setGroups(data);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Auto-fill title if group is selected
        if (name === 'group_id') {
            const group = groups.find(g => g.id === value);
            if (group) {
                setFormData(prev => ({
                    ...prev,
                    group_id: value,
                    title: group.name
                }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

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
        };

        const { error } = id
            ? await supabase.from('classes').update(classData).eq('id', id)
            : await supabase.from('classes').insert([classData]);

        setLoading(false);

        if (error) {
            console.error('Error saving class:', error);
            alert('Erro ao agendar aula. Verifique os dados.');
        } else {
            navigate('/agenda');
        }
    };

    return (
        <div className="max-w-[768px] w-full mx-auto space-y-6">
            <div className="flex flex-wrap gap-2 mb-2">
                <Link to="/agenda" className="text-muted hover:text-primary text-sm font-medium leading-normal">Agenda</Link>
                <span className="text-muted text-sm font-medium leading-normal">/</span>
                <span className="text-white text-sm font-medium leading-normal">{id ? 'Editar Aula' : 'Nova Aula'}</span>
            </div>

            <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-white text-3xl font-black leading-tight tracking-tight">{id ? 'Editar Aula' : 'Agendar Aula'}</h1>
                    <p className="text-muted text-base font-normal leading-normal">{id ? 'Modifique os detalhes da sessão de treinamento.' : 'Configure os detalhes da nova sessão de treinamento.'}</p>
                </div>
                <Link to="/agenda" className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary/10 text-primary hover:bg-primary/20 text-sm font-bold leading-normal transition-all">
                    <span className="material-symbols-outlined mr-2 text-lg">arrow_back</span>
                    <span>Voltar</span>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-card p-6 rounded-xl shadow-sm border border-border-slate">
                <div className="flex items-center gap-2 border-b border-border-slate pb-4">
                    <span className="material-symbols-outlined text-primary">fitness_center</span>
                    <h2 className="text-white text-xl font-bold leading-tight tracking-tight">Detalhes da Sessão</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="flex flex-col w-full md:col-span-2">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Turma / Modalidade</p>
                        <select
                            name="group_id"
                            value={formData.group_id}
                            onChange={handleChange}
                            className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none mb-2"
                        >
                            <option value="">Selecione uma turma (Opcional)...</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col w-full md:col-span-2">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Título da Aula</p>
                        <input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                            placeholder="Ex: Treino de Competição (ou preenchido pela turma)"
                            type="text"
                        />
                    </label>

                    <label className="flex flex-col w-full">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Instrutor</p>
                        <input
                            name="instructor"
                            value={formData.instructor}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                            placeholder="Nome do Professor"
                            type="text"
                        />
                    </label>

                    <label className="flex flex-col w-full">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Data</p>
                        <input
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                            type="date"
                        />
                    </label>

                    <label className="flex flex-col w-full">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Horário Início</p>
                        <input
                            name="start_time"
                            value={formData.start_time}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                            type="time"
                        />
                    </label>

                    <label className="flex flex-col w-full">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Horário Fim</p>
                        <input
                            name="end_time"
                            value={formData.end_time}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                            type="time"
                        />
                    </label>

                    <label className="flex flex-col w-full">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Tipo</p>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                        >
                            <option value="Gi">Gi (Com Kimono)</option>
                            <option value="No-Gi">No-Gi (Sem Kimono)</option>
                            <option value="Kids">Infantil</option>
                            <option value="Private">Particular</option>
                        </select>
                    </label>

                    <label className="flex flex-col w-full">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Capacidade Máxima</p>
                        <input
                            name="max_students"
                            value={formData.max_students}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                            type="number"
                            min="1"
                        />
                    </label>
                </div>

                <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-border-slate">
                    <Link to="/agenda" className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-card text-white text-sm font-bold leading-normal hover:bg-card/80 transition-all border border-border-slate">
                        Cancelar
                    </Link>
                    <button
                        disabled={loading}
                        className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold leading-normal shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                    >
                        <span className="material-symbols-outlined mr-2">save</span>
                        {loading ? 'Salvando...' : (id ? 'Salvar Alterações' : 'Agendar Aula')}
                    </button>
                </div>
            </form>
        </div>
    );
}
