import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { DynamicDiv } from '../../components/DynamicDiv';

interface Belt {
    id: string;
    name: string;
    color: string;
    color_secondary?: string;
    min_xp: number;
    requirements: string;
    order_index: number;
    kyu_dan_label?: string;
}

interface BeltRequirement {
    belt_id: string;
    min_total_xp: number;
    min_attendance: number;
    min_technique_domina_pct: number;
    min_technique_executa_pct: number;
}

export function BeltManagement() {
    const [belts, setBelts] = useState<Belt[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingBelt, setEditingBelt] = useState<Belt | null>(null);

    const [requirements, setRequirements] = useState<Record<string, BeltRequirement>>({});

    const [formData, setFormData] = useState({
        name: '',
        color: '#ffffff',
        color_secondary: '',
        min_xp: 0,
        requirements: '',
        order_index: 0,
        kyu_dan_label: ''
    });

    const [reqFormData, setReqFormData] = useState({
        min_total_xp: 0,
        min_attendance: 0,
        min_technique_domina_pct: 50,
        min_technique_executa_pct: 50
    });

    const [refreshKey, setRefreshKey] = useState(0);
    const refresh = () => setRefreshKey(k => k + 1);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            supabase.from('belts').select('*').order('order_index', { ascending: true }),
            supabase.from('belt_requirements').select('*')
        ]).then(([beltsRes, reqsRes]) => {
            if (cancelled) return;
            if (!beltsRes.error) setBelts(beltsRes.data || []);
            if (!reqsRes.error && reqsRes.data) {
                const map: Record<string, BeltRequirement> = {};
                reqsRes.data.forEach((r: any) => { map[r.belt_id] = r; });
                setRequirements(map);
            }
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, [refreshKey]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'min_xp' || name === 'order_index' ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const beltPayload = { ...formData, kyu_dan_label: formData.kyu_dan_label || null };

        let savedBeltId = editingBelt?.id;

        if (editingBelt) {
            const { error } = await supabase.from('belts').update(beltPayload).eq('id', editingBelt.id);
            if (error) { alert(`Erro ao salvar faixa: ${error.message}`); setSaving(false); return; }
        } else {
            const { data, error } = await supabase.from('belts').insert([beltPayload]).select('id').single();
            if (error) { alert(`Erro ao salvar faixa: ${error.message}`); setSaving(false); return; }
            savedBeltId = data.id;
        }

        // Save requirements
        if (savedBeltId) {
            await supabase.from('belt_requirements').upsert({
                belt_id: savedBeltId,
                ...reqFormData
            }, { onConflict: 'belt_id' });
        }

        setShowForm(false);
        setEditingBelt(null);
        setFormData({
            name: '', color: '#ffffff', color_secondary: '', min_xp: 0,
            requirements: '', order_index: (belts.length > 0 ? belts[belts.length - 1].order_index + 1 : 1),
            kyu_dan_label: ''
        });
        setReqFormData({ min_total_xp: 0, min_attendance: 0, min_technique_domina_pct: 50, min_technique_executa_pct: 50 });
        refresh();
        setSaving(false);
    };

    const handleEdit = (belt: Belt) => {
        setEditingBelt(belt);
        setFormData({
            name: belt.name,
            color: belt.color,
            color_secondary: belt.color_secondary || '',
            min_xp: belt.min_xp,
            requirements: belt.requirements || '',
            order_index: belt.order_index,
            kyu_dan_label: belt.kyu_dan_label || ''
        });
        const req = requirements[belt.id];
        setReqFormData(req ? {
            min_total_xp: req.min_total_xp,
            min_attendance: req.min_attendance,
            min_technique_domina_pct: req.min_technique_domina_pct,
            min_technique_executa_pct: req.min_technique_executa_pct
        } : { min_total_xp: 0, min_attendance: 0, min_technique_domina_pct: 50, min_technique_executa_pct: 50 });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta faixa?')) return;

        const { error } = await supabase.from('belts').delete().eq('id', id);
        if (error) {
            console.error('Error deleting belt:', error);
            alert('Erro ao excluir faixa.');
        } else {
            refresh();
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-white text-3xl font-black uppercase tracking-tight">Caminho da Graduação</h1>
                    <p className="text-muted text-base">Defina as faixas, cores e requisitos de XP para a evolução dos alunos.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingBelt(null);
                        setFormData({
                            name: '', color: '#ffffff', color_secondary: '', min_xp: 0,
                            requirements: '', order_index: (belts.length > 0 ? belts[belts.length - 1].order_index + 1 : 1),
                            kyu_dan_label: ''
                        });
                        setReqFormData({ min_total_xp: 0, min_attendance: 0, min_technique_domina_pct: 50, min_technique_executa_pct: 50 });
                        setShowForm(true);
                    }}
                    className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-primary text-white text-sm font-black uppercase tracking-widest hover:bg-primary-hover shadow-[0_0_20px_rgba(215,38,56,0.3)] transition-all"
                >
                    <span className="material-symbols-outlined mr-2">add_circle</span>
                    Nova Faixa
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-xl rounded-3xl border border-border-slate shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-border-slate flex justify-between items-center bg-card/50">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">
                                {editingBelt ? 'Editar Faixa' : 'Nova Faixa'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-muted hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                            {/* Dados da Faixa */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Nome da Faixa</span>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none"
                                        placeholder="Ex: Faixa Roxa"
                                    />
                                </label>

                                <label className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Classificação (Kyu/Dan)</span>
                                    <input
                                        name="kyu_dan_label"
                                        value={formData.kyu_dan_label}
                                        onChange={handleChange}
                                        className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none"
                                        placeholder="Ex: 9º Kyu, 1º Dan"
                                    />
                                </label>

                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Cor Principal</span>
                                    <div className="flex items-center gap-4 h-12">
                                        <DynamicDiv
                                            className="w-12 h-12 rounded-xl border border-border-slate shadow-inner bg-dynamic-color"
                                            dynamicStyle={{ '--dynamic-color': formData.color }}
                                        />
                                        <input
                                            type="color"
                                            name="color"
                                            id="belt-color"
                                            value={formData.color}
                                            onChange={handleChange}
                                            title="Selecione a cor principal"
                                            className="h-10 w-full rounded-xl bg-main border border-border-slate cursor-pointer p-1"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Cor Secundária (Opcional)</span>
                                    <div className="flex items-center gap-4 h-12">
                                        <DynamicDiv
                                            className="w-12 h-12 rounded-xl border border-border-slate shadow-inner relative overflow-hidden bg-dynamic-color"
                                            dynamicStyle={{ '--dynamic-color': formData.color_secondary || 'transparent' }}
                                        >
                                            {!formData.color_secondary && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-[10px] text-muted opacity-50">N/A</span>
                                                </div>
                                            )}
                                        </DynamicDiv>
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                type="color"
                                                name="color_secondary"
                                                id="belt-color-2"
                                                value={formData.color_secondary || '#ffffff'}
                                                onChange={handleChange}
                                                disabled={!formData.color_secondary && formData.color_secondary !== '' && formData.color_secondary !== null}
                                                title="Selecione a cor secundária"
                                                className={cn(
                                                    "h-10 flex-1 rounded-xl bg-main border border-border-slate cursor-pointer p-1",
                                                    !formData.color_secondary && "opacity-30"
                                                )}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, color_secondary: prev.color_secondary ? '' : '#ffffff' }))}
                                                className={cn(
                                                    "h-10 px-3 rounded-xl border transition-all text-[10px] font-bold uppercase",
                                                    formData.color_secondary
                                                        ? "border-red-500/30 text-red-500 hover:bg-red-500/10"
                                                        : "border-primary/30 text-primary hover:bg-primary/10"
                                                )}
                                            >
                                                {formData.color_secondary ? 'Remover' : 'Bicolor'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <label className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">XP Base da Faixa</span>
                                    <input
                                        type="number"
                                        name="min_xp"
                                        value={formData.min_xp}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none"
                                    />
                                </label>

                                <label className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Ordem na Graduação</span>
                                    <input
                                        type="number"
                                        name="order_index"
                                        value={formData.order_index}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none"
                                    />
                                </label>

                                <label className="flex flex-col gap-2 md:col-span-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Descrição dos Requisitos</span>
                                    <textarea
                                        name="requirements"
                                        value={formData.requirements}
                                        onChange={handleChange}
                                        className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-20 p-4 transition-all outline-none resize-none"
                                        placeholder="Ex: Domínio de 5 raspagens, 3 presenças semanais..."
                                    />
                                </label>
                            </div>

                            {/* Critérios de Promoção */}
                            <div className="border-t border-border-slate pt-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">tune</span>
                                    Critérios de Promoção (Kyu)
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex flex-col gap-2">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">XP Total Mínimo</span>
                                        <input
                                            type="number"
                                            value={reqFormData.min_total_xp}
                                            onChange={e => setReqFormData(p => ({ ...p, min_total_xp: Number(e.target.value) }))}
                                            className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-2">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Presenças Mínimas</span>
                                        <input
                                            type="number"
                                            value={reqFormData.min_attendance}
                                            onChange={e => setReqFormData(p => ({ ...p, min_attendance: Number(e.target.value) }))}
                                            className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-2">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">% Técnicas "Domina"</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={reqFormData.min_technique_domina_pct}
                                            onChange={e => setReqFormData(p => ({ ...p, min_technique_domina_pct: Number(e.target.value) }))}
                                            className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-2">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">% Técnicas "Executa sozinho"</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={reqFormData.min_technique_executa_pct}
                                            onChange={e => setReqFormData(p => ({ ...p, min_technique_executa_pct: Number(e.target.value) }))}
                                            className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none"
                                        />
                                    </label>
                                </div>
                                <p className="text-[10px] text-muted italic mt-3">Estes critérios definem o que o aluno precisa atingir nesta faixa para poder evoluir para a próxima.</p>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-6 h-12 rounded-xl text-white font-bold hover:bg-white/5 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 h-12 bg-primary text-white font-black uppercase tracking-widest rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Salvando...' : 'Salvar Faixa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }

            <div className="bg-card rounded-3xl border border-border-slate overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-border-slate bg-main/30">
                                <th className="px-6 py-5 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em] w-20">Ordem</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Faixa / Kyu</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">XP Base</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em] hidden lg:table-cell">Critérios de Promoção</th>
                                <th className="px-6 py-5 text-right text-[10px] font-black text-muted uppercase tracking-[0.2em]">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-slate/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-muted font-bold uppercase tracking-widest text-[10px]">Carregando Jornada...</p>
                                    </td>
                                </tr>
                            ) : belts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <p className="text-muted font-medium italic">Nenhuma faixa definida no sistema.</p>
                                    </td>
                                </tr>
                            ) : (
                                belts.map((belt) => (
                                    <tr key={belt.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-primary bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center border border-primary/20">
                                                {belt.order_index}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-12 h-5 rounded-full border border-white/20 shadow-sm overflow-hidden flex">
                                                    <DynamicDiv
                                                        className="h-full flex-1"
                                                        dynamicStyle={{ backgroundColor: belt.color }}
                                                    />
                                                    {belt.color_secondary && (
                                                        <DynamicDiv
                                                            className="h-full flex-1"
                                                            dynamicStyle={{ backgroundColor: belt.color_secondary }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-black uppercase text-sm tracking-tight">{belt.name}</span>
                                                    {belt.kyu_dan_label && <span className="text-[10px] text-primary font-bold">{belt.kyu_dan_label}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-lg">bolt</span>
                                                <span className="text-white font-bold">{belt.min_xp.toLocaleString()} XP</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            {requirements[belt.id] ? (
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">{requirements[belt.id].min_total_xp} XP</span>
                                                    <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-bold">{requirements[belt.id].min_attendance} presenças</span>
                                                    <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">{requirements[belt.id].min_technique_domina_pct}% domina</span>
                                                </div>
                                            ) : (
                                                <p className="text-slate-400 text-xs italic">Sem critérios definidos</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 text-slate-400">
                                                <button onClick={() => handleEdit(belt)} className="p-2 hover:bg-main rounded-xl hover:text-white transition-all">
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button onClick={() => handleDelete(belt.id)} className="p-2 hover:bg-main rounded-xl hover:text-red-500 transition-all">
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
