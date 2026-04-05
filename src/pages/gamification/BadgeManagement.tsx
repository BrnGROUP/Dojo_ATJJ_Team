import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../lib/auth';
import { awardBadgeManually, fetchBadgeMemberCounts } from '../../hooks/useBadgeEngine';

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
    badge_group: string | null;
    is_active: boolean;
}

interface MemberOption {
    id: string;
    full_name: string;
    belt: string;
}

export function BadgeManagement() {
    const { profile } = useAuth();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [members, setMembers] = useState<MemberOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showAwardModal, setShowAwardModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
    const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

    // Filters
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterLevel, setFilterLevel] = useState('all');

    // Award modal state
    const [awardBadgeId, setAwardBadgeId] = useState('');
    const [awardMemberId, setAwardMemberId] = useState('');
    const [awardNote, setAwardNote] = useState('');
    const [awardSearchTerm, setAwardSearchTerm] = useState('');
    const [awarding, setAwarding] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'Presence',
        level: 'Bronze',
        icon: 'workspace_premium',
        xp_reward: 50,
        criteria_type: 'manual',
        criteria_value: 0,
        badge_group: '',
        is_active: true
    });

    const [refreshKey, setRefreshKey] = useState(0);
    const refresh = () => setRefreshKey(k => k + 1);

    useEffect(() => {
        let cancelled = false;
        const fetchAll = async () => {
            setLoading(true);
            const [badgesRes, membersRes, counts] = await Promise.all([
                supabase
                    .from('badges')
                    .select('*')
                    .order('badge_group', { ascending: true })
                    .order('level', { ascending: true }),
                supabase
                    .from('members')
                    .select('id, full_name, belt')
                    .ilike('status', 'active')
                    .order('full_name'),
                fetchBadgeMemberCounts()
            ]);
            if (cancelled) return;
            if (!badgesRes.error) setBadges(badgesRes.data || []);
            if (!membersRes.error) setMembers(membersRes.data || []);
            setBadgeCounts(counts);
            setLoading(false);
        };
        fetchAll();
        return () => { cancelled = true; };
    }, [refreshKey]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked
                : (name === 'xp_reward' || name === 'criteria_value') ? Number(value)
                    : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            ...formData,
            badge_group: formData.badge_group.trim() || null
        };

        const { error } = editingBadge
            ? await supabase.from('badges').update(payload).eq('id', editingBadge.id)
            : await supabase.from('badges').insert([payload]);

        if (error) {
            console.error('Error saving badge:', error);
            toast.error('Erro ao salvar insígnia.');
        } else {
            toast.success(editingBadge ? 'Insígnia atualizada!' : 'Insígnia criada!');
            setShowForm(false);
            setEditingBadge(null);
            resetForm();
            refresh();
        }
        setSaving(false);
    };

    const resetForm = () => setFormData({
        name: '', description: '', category: 'Presence', level: 'Bronze',
        icon: 'workspace_premium', xp_reward: 50, criteria_type: 'manual',
        criteria_value: 0, badge_group: '', is_active: true
    });

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
            criteria_value: badge.criteria_value || 0,
            badge_group: badge.badge_group || '',
            is_active: badge.is_active ?? true
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta insígnia? Todos os registros de alunos com ela serão removidos.')) return;
        const { error } = await supabase.from('badges').delete().eq('id', id);
        if (error) {
            toast.error('Erro ao excluir insígnia.');
        } else {
            toast.success('Insígnia excluída.');
            refresh();
        }
    };

    const handleToggleActive = async (badge: Badge) => {
        const { error } = await supabase
            .from('badges')
            .update({ is_active: !badge.is_active })
            .eq('id', badge.id);
        if (!error) {
            toast.success(badge.is_active ? 'Insígnia desativada.' : 'Insígnia reativada.');
            refresh();
        }
    };

    const handleAward = async () => {
        if (!awardMemberId || !awardBadgeId) {
            toast.error('Selecione um aluno e uma insígnia.');
            return;
        }
        setAwarding(true);
        const success = await awardBadgeManually(
            awardMemberId,
            awardBadgeId,
            profile?.id || '',
            awardNote
        );
        if (success) {
            setShowAwardModal(false);
            setAwardMemberId('');
            setAwardBadgeId('');
            setAwardNote('');
            setAwardSearchTerm('');
            refresh();
        }
        setAwarding(false);
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
        'star', 'rewarded_ads', 'new_releases', 'diamond'
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

    const getLevelGlow = (level: string) => {
        switch (level) {
            case 'Bronze': return 'shadow-[0_0_15px_rgba(205,127,50,0.2)]';
            case 'Prata': return 'shadow-[0_0_15px_rgba(192,192,192,0.2)]';
            case 'Ouro': return 'shadow-[0_0_20px_rgba(255,215,0,0.3)]';
            case 'Diamante': return 'shadow-[0_0_25px_rgba(185,242,255,0.4)]';
            default: return '';
        }
    };

    // Filtered badges
    const filteredBadges = badges.filter(b => {
        if (filterCategory !== 'all' && b.category !== filterCategory) return false;
        if (filterLevel !== 'all' && b.level !== filterLevel) return false;
        return true;
    });


    const filteredMembers = members.filter(m =>
        m.full_name.toLowerCase().includes(awardSearchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-[#FFD700]">workspace_premium</span>
                        Gestão de Insígnias
                    </h1>
                    <p className="text-muted text-base">Crie, gerencie e outorgue conquistas do sistema gamificado.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setAwardBadgeId(''); setAwardMemberId(''); setAwardNote(''); setShowAwardModal(true); }}
                        className="flex items-center gap-2 px-5 h-12 rounded-xl bg-green-600 text-white font-bold uppercase tracking-widest text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                    >
                        <span className="material-symbols-outlined">redeem</span>
                        Outorgar
                    </button>
                    <button
                        onClick={() => { setEditingBadge(null); resetForm(); setShowForm(true); }}
                        className="flex items-center gap-2 px-5 h-12 rounded-xl bg-primary text-white font-bold uppercase tracking-widest text-sm hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined">add_circle</span>
                        Nova Insígnia
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl border border-border-slate p-4 text-center">
                    <p className="text-2xl font-black text-white">{badges.length}</p>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Total</p>
                </div>
                <div className="bg-card rounded-2xl border border-border-slate p-4 text-center">
                    <p className="text-2xl font-black text-green-500">{badges.filter(b => b.is_active).length}</p>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Ativas</p>
                </div>
                <div className="bg-card rounded-2xl border border-border-slate p-4 text-center">
                    <p className="text-2xl font-black text-blue-400">{badges.filter(b => b.criteria_type !== 'manual').length}</p>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Automáticas</p>
                </div>
                <div className="bg-card rounded-2xl border border-border-slate p-4 text-center">
                    <p className="text-2xl font-black text-[#FFD700]">{Object.values(badgeCounts).reduce((s, c) => s + c, 0)}</p>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Outorgadas</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex flex-wrap gap-2 py-2 border-y border-border-slate/50 flex-1">
                    <button onClick={() => setFilterCategory('all')} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border", filterCategory === 'all' ? "bg-white text-black border-white" : "bg-card text-muted border-border-slate hover:border-white/50")}>
                        Todas
                    </button>
                    {categories.map(c => (
                        <button key={c.id} onClick={() => setFilterCategory(c.id)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-1.5", filterCategory === c.id ? "bg-primary text-white border-primary" : "bg-card text-muted border-border-slate hover:border-primary/50")}>
                            <span className="material-symbols-outlined text-xs">{c.icon}</span>
                            {c.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    {levels.map(l => (
                        <button key={l} onClick={() => setFilterLevel(filterLevel === l ? 'all' : l)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border", filterLevel === l ? getLevelColor(l) : "bg-card text-muted border-border-slate hover:border-white/20")}>
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Badge Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-muted font-bold uppercase tracking-widest text-xs">Carregando Insígnias...</p>
                    </div>
                ) : filteredBadges.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-card rounded-3xl border border-border-slate">
                        <span className="material-symbols-outlined text-5xl text-muted mb-4 opacity-20">workspace_premium</span>
                        <p className="text-muted font-bold">Nenhuma insígnia encontrada com esses filtros.</p>
                    </div>
                ) : (
                    filteredBadges.map(badge => (
                        <div
                            key={badge.id}
                            className={cn(
                                "bg-card rounded-3xl border p-6 transition-all group relative flex flex-col h-full",
                                badge.is_active
                                    ? `border-border-slate hover:border-primary/50 ${getLevelGlow(badge.level)}`
                                    : "border-border-slate/30 opacity-50"
                            )}
                        >
                            <div className="flex justify-between items-start mb-5">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-inner transition-transform group-hover:scale-110",
                                    getLevelColor(badge.level)
                                )}>
                                    <span className="material-symbols-outlined text-[32px]">{badge.icon || 'workspace_premium'}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleToggleActive(badge)} className="p-2 hover:bg-main rounded-xl text-muted hover:text-yellow-500 transition-colors" title={badge.is_active ? 'Desativar' : 'Reativar'}>
                                        <span className="material-symbols-outlined text-[20px]">{badge.is_active ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                    <button onClick={() => handleEdit(badge)} className="p-2 hover:bg-main rounded-xl text-muted hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(badge.id)} className="p-2 hover:bg-main rounded-xl text-muted hover:text-red-500 transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 flex-1">
                                <div>
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">{badge.name}</h3>
                                        <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded uppercase border", getLevelColor(badge.level))}>
                                            {badge.level}
                                        </span>
                                        {!badge.is_active && (
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                                                Inativa
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{badge.description}</p>
                                </div>

                                {badge.badge_group && (
                                    <span className="text-[9px] font-bold text-muted/50 uppercase tracking-widest flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[10px]">link</span>
                                        Grupo: {badge.badge_group}
                                    </span>
                                )}

                                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-border-slate/30">
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg uppercase border border-primary/20">
                                        <span className="material-symbols-outlined text-xs">bolt</span>
                                        +{badge.xp_reward} XP
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-muted bg-white/5 px-2 py-1 rounded-lg uppercase border border-white/10">
                                        <span className="material-symbols-outlined text-xs">
                                            {categories.find(c => c.id === badge.category)?.icon}
                                        </span>
                                        {categories.find(c => c.id === badge.category)?.label}
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-lg uppercase border border-blue-400/20">
                                        <span className="material-symbols-outlined text-xs">
                                            {badge.criteria_type === 'manual' ? 'person' : 'smart_toy'}
                                        </span>
                                        {badge.criteria_type === 'manual' ? 'Manual' : `Auto (${badge.criteria_value})`}
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg uppercase border border-green-500/20">
                                        <span className="material-symbols-outlined text-xs">group</span>
                                        {badgeCounts[badge.id] || 0} alunos
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create/Edit Modal */}
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
                                    <input name="name" value={formData.name} onChange={handleChange} required className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none" placeholder="Ex: Guerreiro de Tatame" />
                                </label>
                                <label className="flex flex-col gap-2 md:col-span-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Descrição</span>
                                    <textarea name="description" value={formData.description} onChange={handleChange} className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-24 p-4 transition-all outline-none resize-none" placeholder="Descreva como o aluno conquista esta insígnia..." />
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Categoria</span>
                                    <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary h-12 px-4 outline-none">
                                        {categories.map(c => (<option key={c.id} value={c.id}>{c.label}</option>))}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Nível (Raridade)</span>
                                    <select name="level" value={formData.level} onChange={handleChange} className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary h-12 px-4 outline-none">
                                        {levels.map(l => (<option key={l} value={l}>{l}</option>))}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Grupo (Progressão)</span>
                                    <input name="badge_group" value={formData.badge_group} onChange={handleChange} className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary h-12 px-4 outline-none" placeholder="Ex: assiduo (mesmo grupo = mesma progressão)" />
                                    <span className="text-[9px] text-muted">Insígnias do mesmo grupo seguem a hierarquia Bronze→Prata→Ouro→Diamante. O aluno só mantém o nível mais alto.</span>
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Recompensa (XP)</span>
                                    <input type="number" name="xp_reward" value={formData.xp_reward} onChange={handleChange} className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary h-12 px-4 outline-none" />
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Tipo de Critério</span>
                                    <select name="criteria_type" value={formData.criteria_type} onChange={handleChange} className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary h-12 px-4 outline-none">
                                        <option value="manual">Manual (Professor)</option>
                                        <option value="consecutive_presence">Presenças Consecutivas</option>
                                        <option value="total_presence">Total de Presenças</option>
                                    </select>
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Valor do Critério</span>
                                    <input type="number" name="criteria_value" value={formData.criteria_value} onChange={handleChange} disabled={formData.criteria_type === 'manual'} className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary h-12 px-4 outline-none disabled:opacity-30" />
                                </label>

                                {/* Icon Picker */}
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Símbolo (Ícone)</span>
                                    <div className="bg-main border border-border-slate rounded-xl p-4 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-dashed", getLevelColor(formData.level))}>
                                                <span className="material-symbols-outlined text-[32px]">{formData.icon || 'help'}</span>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <input name="icon" value={formData.icon} onChange={handleChange} className="w-full rounded-lg text-white bg-card border border-border-slate focus:border-primary h-10 px-3 text-sm outline-none" placeholder="Nome do Material Symbol (ex: bolt)" />
                                                <p className="text-[10px] text-muted">Digite ou selecione. <a href="https://fonts.google.com/icons" target="_blank" rel="noopener noreferrer" className="text-primary underline">Ver todos</a></p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                                            {commonIcons.map(icon => (
                                                <button key={icon} type="button" onClick={() => setFormData(prev => ({ ...prev, icon }))} className={cn("w-10 h-10 rounded-lg flex items-center justify-center border transition-all hover:scale-110", formData.icon === icon ? "bg-primary border-primary text-white" : "bg-card border-border-slate text-muted hover:text-white")}>
                                                    <span className="material-symbols-outlined text-xl">{icon}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Active Toggle */}
                                <div className="md:col-span-2 flex items-center gap-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="sr-only peer" title="Ativar ou desativar insígnia" />
                                        <div className="w-11 h-6 bg-border-slate peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                    <span className="text-sm text-white font-bold">Insígnia ativa</span>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setShowForm(false)} className="px-6 h-12 rounded-xl text-white font-bold hover:bg-white/5 transition-all">Cancelar</button>
                                <button type="submit" disabled={saving} className="px-8 h-12 bg-primary text-white font-black uppercase tracking-widest rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
                                    {saving ? 'Salvando...' : 'Salvar Insígnia'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Award Badge Modal */}
            {showAwardModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-lg rounded-3xl border border-border-slate shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-border-slate flex justify-between items-center">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-500">redeem</span>
                                Outorgar Insígnia
                            </h2>
                            <button onClick={() => setShowAwardModal(false)} className="text-muted hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                            {/* Select Badge */}
                            <label className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Insígnia</span>
                                <select value={awardBadgeId} onChange={e => setAwardBadgeId(e.target.value)} className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary h-12 px-4 outline-none">
                                    <option value="">Selecionar insígnia...</option>
                                    {badges.filter(b => b.is_active).map(b => (
                                        <option key={b.id} value={b.id}>{b.name} ({b.level}) — +{b.xp_reward} XP</option>
                                    ))}
                                </select>
                            </label>

                            {/* Search & Select Member */}
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Aluno</span>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted">search</span>
                                    <input type="text" placeholder="Buscar aluno..." value={awardSearchTerm} onChange={e => setAwardSearchTerm(e.target.value)} className="w-full bg-main border border-border-slate rounded-xl pl-10 pr-4 h-12 text-white outline-none focus:border-primary transition-all" />
                                </div>
                                <div className="bg-main border border-border-slate rounded-xl max-h-48 overflow-y-auto custom-scrollbar">
                                    {filteredMembers.slice(0, 20).map(m => (
                                        <button key={m.id} type="button" onClick={() => { setAwardMemberId(m.id); setAwardSearchTerm(m.full_name); }} className={cn("w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center justify-between border-b border-border-slate/30 last:border-0", awardMemberId === m.id && "bg-primary/10 text-primary")}>
                                            <span className="font-bold text-sm text-white">{m.full_name}</span>
                                            <span className="text-[10px] text-muted uppercase">{m.belt}</span>
                                        </button>
                                    ))}
                                    {filteredMembers.length === 0 && (
                                        <p className="p-4 text-center text-muted text-sm">Nenhum aluno encontrado.</p>
                                    )}
                                </div>
                            </div>

                            {/* Note */}
                            <label className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Observação (Opcional)</span>
                                <textarea value={awardNote} onChange={e => setAwardNote(e.target.value)} className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary h-20 p-4 outline-none resize-none text-sm" placeholder="Motivo da outorga..." />
                            </label>

                            {/* Confirm */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-border-slate">
                                <button type="button" onClick={() => setShowAwardModal(false)} className="px-6 h-12 rounded-xl text-white font-bold hover:bg-white/5 transition-all">Cancelar</button>
                                <button onClick={handleAward} disabled={awarding || !awardBadgeId || !awardMemberId} className="px-8 h-12 bg-green-600 text-white font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50">
                                    {awarding ? 'Outorgando...' : '🏅 Outorgar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
