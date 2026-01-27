import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface Badge {
    id: string;
    name: string;
    description: string;
    category: string;
    level: string;
    icon: string;
    xp_reward: number;
    criteria_type: string;
    criteria_value: number;
}

export function BadgeManagement() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'Presence',
        level: 'Bronze',
        icon: 'workspace_premium',
        xp_reward: 50,
        criteria_type: 'manual',
        criteria_value: 0
    });

    useEffect(() => {
        fetchBadges();
    }, []);

    async function fetchBadges() {
        setLoading(true);
        const { data, error } = await supabase
            .from('badges')
            .select('*')
            .order('category', { ascending: true })
            .order('xp_reward', { ascending: true });

        if (error) {
            console.error('Error fetching badges:', error);
        } else {
            setBadges(data || []);
        }
        setLoading(false);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'xp_reward' || name === 'criteria_value' ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const { error } = editingBadge
            ? await supabase.from('badges').update(formData).eq('id', editingBadge.id)
            : await supabase.from('badges').insert([formData]);

        if (error) {
            console.error('Error saving badge:', error);
            alert('Erro ao salvar insígnia.');
        } else {
            setShowForm(false);
            setEditingBadge(null);
            setFormData({
                name: '',
                description: '',
                category: 'Presence',
                level: 'Bronze',
                icon: 'workspace_premium',
                xp_reward: 50,
                criteria_type: 'manual',
                criteria_value: 0
            });
            fetchBadges();
        }
        setSaving(false);
    };

    const handleEdit = (badge: Badge) => {
        setEditingBadge(badge);
        setFormData({
            name: badge.name,
            description: badge.description || '',
            category: badge.category,
            level: badge.level,
            icon: badge.icon || 'workspace_premium',
            xp_reward: badge.xp_reward,
            criteria_type: badge.criteria_type || 'manual',
            criteria_value: badge.criteria_value || 0
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta insígnia?')) return;

        const { error } = await supabase.from('badges').delete().eq('id', id);
        if (error) {
            console.error('Error deleting badge:', error);
            alert('Erro ao excluir insígnia.');
        } else {
            fetchBadges();
        }
    };

    const categories = [
        { id: 'Presence', label: 'Presença', icon: 'how_to_reg' },
        { id: 'Technical', label: 'Técnica', icon: 'psychology' },
        { id: 'Behavior', label: 'Comportamento', icon: 'self_improvement' },
        { id: 'Achievement', label: 'Conquista', icon: 'military_tech' },
        { id: 'Special', label: 'Especial', icon: 'star' }
    ];

    const commonIcons = [
        'workspace_premium', 'military_tech', 'stars', 'bolt', 'self_improvement',
        'fitness_center', 'emoji_events', 'verified', 'shield', 'local_fire_department',
        'groups', 'school', 'timer', 'calendar_today', 'smart_toy', 'psychology',
        'military_tech', 'star', 'rewarded_ads', 'new_releases'
    ];

    const levels = ['Bronze', 'Prata', 'Ouro', 'Diamante'];

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'Bronze': return 'text-[#CD7F32] bg-[#CD7F32]/10 border-[#CD7F32]/20';
            case 'Prata': return 'text-[#C0C0C0] bg-[#C0C0C0]/10 border-[#C0C0C0]/20';
            case 'Ouro': return 'text-[#FFD700] bg-[#FFD700]/10 border-[#FFD700]/20';
            case 'Diamante': return 'text-[#B9F2FF] bg-[#B9F2FF]/10 border-[#B9F2FF]/20';
            default: return 'text-white bg-white/10 border-white/20';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-white text-3xl font-black uppercase tracking-tight">Gestão de Insígnias</h1>
                    <p className="text-muted text-base">Crie e gerencie as conquistas e recompensas do sistema gamificado.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingBadge(null);
                        setFormData({
                            name: '',
                            description: '',
                            category: 'Presence',
                            level: 'Bronze',
                            icon: 'workspace_premium',
                            xp_reward: 50,
                            criteria_type: 'manual',
                            criteria_value: 0
                        });
                        setShowForm(true);
                    }}
                    className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-primary text-white text-sm font-black uppercase tracking-widest hover:bg-primary-hover shadow-[0_0_20px_rgba(215,38,56,0.3)] transition-all"
                >
                    <span className="material-symbols-outlined mr-2">add_circle</span>
                    Nova Insígnia
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-2xl rounded-3xl border border-border-slate shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-border-slate flex justify-between items-center bg-card/50">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">
                                {editingBadge ? 'Editar Insígnia' : 'Nova Insígnia'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-muted hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="flex flex-col gap-2 md:col-span-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Nome da Insígnia</span>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none"
                                        placeholder="Ex: Guerreiro de Tatame"
                                    />
                                </label>
                                <label className="flex flex-col gap-2 md:col-span-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Descrição</span>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-24 p-4 transition-all outline-none resize-none"
                                        placeholder="Descreva como o aluno conquista esta insígnia..."
                                    />
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Categoria</span>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none"
                                    >
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Nível (Raridade)</span>
                                    <select
                                        name="level"
                                        value={formData.level}
                                        onChange={handleChange}
                                        className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none"
                                    >
                                        {levels.map(l => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </select>
                                </label>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Símbolo (Ícone)</span>
                                    <div className="bg-main border border-border-slate rounded-xl p-4 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-dashed border-border-slate shrink-0",
                                                getLevelColor(formData.level)
                                            )}>
                                                <span className="material-symbols-outlined text-[32px]">{formData.icon || 'help'}</span>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    name="icon"
                                                    value={formData.icon}
                                                    onChange={handleChange}
                                                    className="w-full rounded-lg text-white bg-card border border-border-slate focus:border-primary h-10 px-3 text-sm outline-none"
                                                    placeholder="Nome do Material Symbol (ex: bolt)"
                                                />
                                                <p className="text-[10px] text-muted">Digite o nome do ícone ou selecione abaixo. <a href="https://fonts.google.com/icons" target="_blank" rel="noopener noreferrer" className="text-primary underline">Ver todos</a></p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                                            {commonIcons.map(icon => (
                                                <button
                                                    key={icon}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                                                    className={cn(
                                                        "w-10 h-10 rounded-lg flex items-center justify-center border transition-all hover:scale-110",
                                                        formData.icon === icon
                                                            ? "bg-primary border-primary text-white shadow-[0_0_10px_rgba(215,38,56,0.3)]"
                                                            : "bg-card border-border-slate text-muted hover:text-white"
                                                    )}
                                                >
                                                    <span className="material-symbols-outlined text-xl">{icon}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <label className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Recompensa (XP)</span>
                                    <input
                                        type="number"
                                        name="xp_reward"
                                        value={formData.xp_reward}
                                        onChange={handleChange}
                                        className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none"
                                    />
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Tipo de Critério</span>
                                    <select
                                        name="criteria_type"
                                        value={formData.criteria_type}
                                        onChange={handleChange}
                                        className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none"
                                    >
                                        <option value="manual">Manual (Avaliação do Professor)</option>
                                        <option value="consecutive_presence">Presenças Consecutivas</option>
                                        <option value="total_presence">Total de Presenças</option>
                                    </select>
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Valor do Critério</span>
                                    <input
                                        type="number"
                                        name="criteria_value"
                                        value={formData.criteria_value}
                                        onChange={handleChange}
                                        disabled={formData.criteria_type === 'manual'}
                                        className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none disabled:opacity-30"
                                    />
                                </label>
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
                                    {saving ? 'Salvando...' : 'Salvar Insígnia'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-muted font-bold uppercase tracking-widest text-xs">Carregando Insígnias...</p>
                    </div>
                ) : badges.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-card rounded-3xl border border-border-slate">
                        <span className="material-symbols-outlined text-5xl text-muted mb-4 opacity-20">workspace_premium</span>
                        <p className="text-muted font-bold">Nenhuma insígnia cadastrada.</p>
                    </div>
                ) : (
                    badges.map(badge => (
                        <div key={badge.id} className="bg-card rounded-3xl border border-border-slate p-6 hover:border-primary/50 transition-all group relative flex flex-col h-full shadow-sm hover:shadow-primary/5">
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-inner",
                                    getLevelColor(badge.level)
                                )}>
                                    <span className="material-symbols-outlined text-[32px]">{badge.icon || 'workspace_premium'}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(badge)} className="p-2 hover:bg-main rounded-xl text-muted hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(badge.id)} className="p-2 hover:bg-main rounded-xl text-muted hover:text-red-500 transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">{badge.name}</h3>
                                        <span className={cn(
                                            "text-[8px] font-black px-1.5 py-0.5 rounded uppercase border",
                                            getLevelColor(badge.level)
                                        )}>
                                            {badge.level}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">{badge.description}</p>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-border-slate/30">
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg uppercase border border-primary/20">
                                        <span className="material-symbols-outlined text-xs">add</span>
                                        {badge.xp_reward} XP
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-muted bg-white/5 px-2 py-1 rounded-lg uppercase border border-white/10">
                                        <span className="material-symbols-outlined text-xs">
                                            {categories.find(c => c.id === badge.category)?.icon}
                                        </span>
                                        {categories.find(c => c.id === badge.category)?.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
