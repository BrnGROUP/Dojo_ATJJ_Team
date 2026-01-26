import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function GroupForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        schedule_description: '',
        color: 'white',
        selectedDays: [] as string[],
        time: '19:00',
    });

    const daysOfWeek = [
        { id: 'Seg', label: 'Segunda' },
        { id: 'Ter', label: 'Terça' },
        { id: 'Qua', label: 'Quarta' },
        { id: 'Qui', label: 'Quinta' },
        { id: 'Sex', label: 'Sexta' },
        { id: 'Sab', label: 'Sábado' },
        { id: 'Dom', label: 'Domingo' },
    ];

    useEffect(() => {
        async function fetchGroup() {
            setLoading(true);
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching group:', error);
                navigate('/groups');
            } else if (data) {
                setFormData({
                    name: data.name || '',
                    description: data.description || '',
                    schedule_description: data.schedule_description || '',
                    color: data.color || 'white',
                    selectedDays: [], // We might parse this from description if possible, but for now reset or keep simple
                    time: '',
                });

                // Try to parse existing schedule string if it follows pattern "Seg/Qua 19:00"
                if (data.schedule_description) {
                    const parts = data.schedule_description.split(' ');
                    if (parts.length >= 2) {
                        const days = parts[0].split('/');
                        const time = parts[1];
                        setFormData(prev => ({
                            ...prev,
                            selectedDays: days.filter((d: string) => daysOfWeek.some(dow => dow.id === d)),
                            time: time
                        }));
                    }
                }
            }
            setLoading(false);
        }

        if (id) {
            fetchGroup();
        }
    }, [id, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleColorSelect = (color: string) => {
        setFormData((prev) => ({ ...prev, color }));
    };

    const handleDayToggle = (dayId: string) => {
        setFormData(prev => {
            const current = prev.selectedDays;
            const updated = current.includes(dayId)
                ? current.filter(d => d !== dayId)
                : [...current, dayId];

            // Sort days based on week order
            const order = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
            updated.sort((a, b) => order.indexOf(a) - order.indexOf(b));

            return { ...prev, selectedDays: updated };
        });
    };

    // Update schedule_description whenever days or time changes
    useEffect(() => {
        const { selectedDays, time } = formData;
        if (selectedDays.length > 0 && time) {
            const desc = `${selectedDays.join('/')} ${time}`;
            setFormData(prev => ({ ...prev, schedule_description: desc }));
        }
    }, [formData.selectedDays, formData.time]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const dataToSave = {
            name: formData.name,
            description: formData.description,
            schedule_description: formData.schedule_description,
            color: formData.color,
        };

        const { error } = id
            ? await supabase.from('groups').update(dataToSave).eq('id', id)
            : await supabase.from('groups').insert([dataToSave]);

        setLoading(false);

        if (error) {
            console.error('Error saving group:', error);
            alert('Erro ao salvar turma.');
        } else {
            navigate('/groups');
        }
    };

    const colors = [
        { id: 'white', label: 'Padrão (Branco)', class: 'bg-white' },
        { id: 'blue', label: 'Azul', class: 'bg-blue-500' },
        { id: 'purple', label: 'Roxo', class: 'bg-purple-500' },
        { id: 'green', label: 'Verde', class: 'bg-emerald-500' },
        { id: 'orange', label: 'Laranja', class: 'bg-amber-500' },
    ];

    return (
        <div className="max-w-[768px] w-full mx-auto space-y-6">
            <div className="flex flex-wrap gap-2 mb-2">
                <Link to="/groups" className="text-muted hover:text-primary text-sm font-medium leading-normal">Turmas</Link>
                <span className="text-muted text-sm font-medium leading-normal">/</span>
                <span className="text-white text-sm font-medium leading-normal">{id ? 'Editar Turma' : 'Nova Turma'}</span>
            </div>

            <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-white text-3xl font-black leading-tight tracking-tight">{id ? 'Editar Turma' : 'Cadastro de Turma'}</h1>
                    <p className="text-muted text-base font-normal leading-normal">Defina as características e horários padrão desta turma.</p>
                </div>
                <Link to="/groups" className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary/10 text-primary hover:bg-primary/20 text-sm font-bold leading-normal transition-all">
                    <span className="material-symbols-outlined mr-2 text-lg">arrow_back</span>
                    <span>Voltar</span>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-card p-6 rounded-xl shadow-sm border border-border-slate">
                <div className="flex items-center gap-2 border-b border-border-slate pb-4">
                    <span className="material-symbols-outlined text-primary">groups</span>
                    <h2 className="text-white text-xl font-bold leading-tight tracking-tight">Dados da Turma</h2>
                </div>

                <div className="flex flex-col gap-6">
                    <label className="flex flex-col w-full">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Nome da Turma</p>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                            placeholder="Ex: Jiu-Jitsu Avançado"
                            type="text"
                        />
                    </label>

                    <label className="flex flex-col w-full">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Descrição</p>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-24 p-4 text-base font-normal transition-all outline-none resize-none"
                            placeholder="Descreva o foco desta turma..."
                        />
                    </label>

                    <div className="flex flex-col w-full gap-4">
                        <label className="flex flex-col w-full">
                            <p className="text-white text-sm font-semibold leading-normal pb-2">Dias da Semana</p>
                            <div className="flex flex-wrap gap-2">
                                {daysOfWeek.map(day => (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => handleDayToggle(day.id)}
                                        className={`h-10 px-4 rounded-lg text-sm font-bold border transition-all ${formData.selectedDays.includes(day.id)
                                            ? 'bg-primary border-primary text-white shadow-md'
                                            : 'bg-main border-border-slate text-muted hover:text-white hover:border-gray-500'
                                            }`}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="flex flex-col w-full">
                                <p className="text-white text-sm font-semibold leading-normal pb-2">Horário Padrão</p>
                                <input
                                    name="time"
                                    value={formData.time}
                                    onChange={handleChange}
                                    className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                                    type="time"
                                />
                            </label>

                            <label className="flex flex-col w-full">
                                <p className="text-white text-sm font-semibold leading-normal pb-2">Resumo (Automático)</p>
                                <input
                                    name="schedule_description"
                                    value={formData.schedule_description}
                                    readOnly
                                    className="w-full rounded-lg text-white bg-main/50 border border-border-slate h-12 px-4 text-base font-normal outline-none cursor-not-allowed text-muted"
                                    placeholder="Selecione dias e horário..."
                                />
                                <p className="text-[10px] text-muted mt-1">Este texto será exibido nos cartões de turma.</p>
                            </label>
                        </div>
                    </div>

                    <label className="flex flex-col w-full">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Cor Identificadora</p>
                        <div className="flex flex-wrap gap-3">
                            {colors.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => handleColorSelect(c.id)}
                                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${formData.color === c.id ? 'border-white scale-110' : 'border-transparent hover:scale-105'} ${c.class}`}
                                    title={c.label}
                                >
                                    {formData.color === c.id && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                </button>
                            ))}
                        </div>
                    </label>
                </div>

                <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-border-slate">
                    <Link to="/groups" className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-card text-white text-sm font-bold leading-normal hover:bg-card/80 transition-all border border-border-slate">
                        Cancelar
                    </Link>
                    <button
                        disabled={loading}
                        className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold leading-normal shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                    >
                        <span className="material-symbols-outlined mr-2">save</span>
                        {loading ? 'Salvando...' : 'Salvar Turma'}
                    </button>
                </div>
            </form>
        </div>
    );
}
