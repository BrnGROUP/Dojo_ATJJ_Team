import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { DynamicDiv } from '../../components/DynamicDiv';

const EVALUATION_LEVELS = [
    { value: 'not_seen', label: 'Não visto', short: 'NV', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20', weight: 0 },
    { value: 'learning', label: 'Em aprendizado', short: 'EA', color: 'bg-red-500/10 text-red-500 border-red-500/20', weight: 0.25 },
    { value: 'with_help', label: 'Executa c/ ajuda', short: 'EH', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', weight: 0.5 },
    { value: 'alone', label: 'Executa sozinho', short: 'ES', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', weight: 0.75 },
    { value: 'mastered', label: 'Domina', short: 'DM', color: 'bg-green-500/10 text-green-500 border-green-500/20', weight: 1 }
];

interface Technique {
    id: string;
    name: string;
    category: string;
    subcategory?: string;
    description?: string;
    image_url?: string;
    pedagogical_layer?: string;
}

interface TechniqueChecklistProps {
    memberId: string;
    beltName: string; // The member's current belt name (or targeted belt)
}

export function TechniqueChecklist({ memberId, beltName }: TechniqueChecklistProps) {
    const [techniques, setTechniques] = useState<Technique[]>([]);
    const [memberProgress, setMemberProgress] = useState<Record<string, string>>({}); // techId -> status
    const [loading, setLoading] = useState(true);
    const [beltId, setBeltId] = useState<string | null>(null);
    const [openSelectId, setOpenSelectId] = useState<string | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    // Normalize belt name just in case, similar to previous fix
    const normalizeBeltName = (name: string) => {
        const map: Record<string, string> = { 'White': 'Branca', 'Blue': 'Azul', 'Purple': 'Roxa', 'Brown': 'Marrom', 'Black': 'Preta' };
        return map[name] || name;
    };

    useEffect(() => {
        fetchData();
    }, [memberId, beltName]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Find Belt ID
            const effectiveName = normalizeBeltName(beltName);
            // Search belt by name (or partial)
            // We need to fetch all belts to find the best match if 'like' queries are tricky, or just use ilike
            const { data: belts } = await supabase.from('belts').select('id, name');
            const targetBelt = belts?.find(b => b.name.toLowerCase() === effectiveName.toLowerCase())
                || belts?.find(b => effectiveName.toLowerCase().includes(b.name.toLowerCase()));

            if (!targetBelt) {
                setLoading(false);
                return;
            }
            setBeltId(targetBelt.id);

            // 2. Fetch Techniques for this belt
            const { data: techData } = await supabase
                .from('techniques')
                .select('*')
                .eq('belt_id', targetBelt.id)
                .order('category');

            setTechniques(techData || []);

            // 3. Fetch Member Progress
            const { data: progressData } = await supabase
                .from('member_techniques')
                .select('technique_id, status')
                .eq('member_id', memberId);

            const progressMap: Record<string, string> = {};
            if (progressData) {
                progressData.forEach((p: any) => {
                    progressMap[p.technique_id] = p.status || 'not_seen';
                });
            }
            setMemberProgress(progressMap);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (techId: string, newStatus: string) => {
        setOpenSelectId(null);
        // Optimistic Update
        const oldStatus = memberProgress[techId];
        setMemberProgress(prev => ({ ...prev, [techId]: newStatus }));

        try {
            // Upsert mechanism manually since we might not have ID
            // First try to delete existing to avoid conflict if constraint is tricky, or use upsert if unique constraint exists
            // Assuming unique(member_id, technique_id)
            const { error } = await supabase.from('member_techniques').upsert({
                member_id: memberId,
                technique_id: techId,
                status: newStatus,
                checked: newStatus !== 'not_seen', // keep legacy compat
                checked_at: new Date()
            }, { onConflict: 'member_id,technique_id' });

            if (error) throw error;
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Erro ao salvar.');
            setMemberProgress(prev => ({ ...prev, [techId]: oldStatus })); // Revert
        }
    };

    const getStatusInfo = (status: string) => {
        return EVALUATION_LEVELS.find(l => l.value === status) || EVALUATION_LEVELS[0];
    };

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            'Base & Movimento': 'text-slate-400 bg-slate-500/10 border-slate-500/20',
            'Quedas & Projeções': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
            'Guarda': 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
            'Raspagens': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
            'Passagens': 'text-green-500 bg-green-500/10 border-green-500/20',
            'Controles': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
            'Finalizações': 'text-red-500 bg-red-500/10 border-red-500/20',
            'Defesas': 'text-pink-500 bg-pink-500/10 border-pink-500/20',
            'Transições & Estratégia': 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
            'Conduta & Consciência': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
        };
        return colors[cat] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    };

    if (loading) return <div className="py-8 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

    if (!beltId || techniques.length === 0) {
        return (
            <div className="bg-card rounded-3xl border border-border-slate p-8 text-center opacity-70">
                <span className="material-symbols-outlined text-4xl mb-2 text-muted">menu_book</span>
                <p className="text-muted text-sm">Nenhum currículo técnico cadastrado para a faixa <strong>{normalizeBeltName(beltName)}</strong>.</p>
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400 inline-block text-left">
                    <strong>Dica:</strong> Cadastre as técnicas em "Gamificação &gt; Currículo" para habilitar o checklist.
                    <br />
                    <span className="opacity-50 mt-1 block">SQL necessário: Tabela 'techniques' e 'member_techniques'.</span>
                </div>
            </div>
        );
    }

    const calculateWeightedProgress = () => {
        if (techniques.length === 0) return 0;
        const totalWeight = techniques.reduce((acc, tech) => {
            const status = memberProgress[tech.id] || 'not_seen';
            const info = getStatusInfo(status);
            return acc + info.weight;
        }, 0);
        return Math.round((totalWeight / techniques.length) * 100);
    };

    const progressPercent = calculateWeightedProgress();

    return (
        <div className="bg-card rounded-3xl border border-border-slate p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">check_circle</span>
                        Checklist Técnico ({progressPercent}%)
                    </h3>
                    <p className="text-sm text-muted">Requisitos técnicos para a faixa {normalizeBeltName(beltName)}.</p>
                </div>
                <div className="w-32 h-2.5 bg-main rounded-full overflow-hidden border border-white/5">
                    <DynamicDiv className="h-full bg-green-500 transition-all duration-500" dynamicStyle={{ width: `${progressPercent}%` }} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {techniques.map(tech => {
                    const status = memberProgress[tech.id] || 'not_seen';
                    const statusInfo = getStatusInfo(status);
                    const isMastered = status === 'mastered';
                    const isSelected = openSelectId === tech.id;

                    return (
                        <div
                            key={tech.id}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-xl border transition-all relative",
                                isMastered
                                    ? "bg-green-500/5 border-green-500/20"
                                    : "bg-main border-border-slate hover:border-white/20"
                            )}
                        >
                            {/* Status Indicator / Selector Trigger */}
                            <div className="relative shrink-0 mt-0.5">
                                <button
                                    onClick={() => setOpenSelectId(isSelected ? null : tech.id)}
                                    className={cn(
                                        "w-8 h-8 rounded-lg border flex items-center justify-center transition-colors text-xs font-bold",
                                        statusInfo.color
                                    )}
                                >
                                    {statusInfo.short}
                                </button>

                                {/* Status Selection Popup */}
                                {isSelected && (
                                    <div className="absolute top-10 left-0 z-20 w-48 bg-card border border-border-slate rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                                        <div className="bg-white/5 px-3 py-2 text-[10px] font-bold text-muted uppercase tracking-wider border-b border-white/5">
                                            Avaliação
                                        </div>
                                        {EVALUATION_LEVELS.map((level) => (
                                            <button
                                                key={level.value}
                                                onClick={() => handleStatusChange(tech.id, level.value)}
                                                className={cn(
                                                    "w-full text-left px-3 py-2.5 text-xs font-bold flex items-center gap-2 hover:bg-white/5 transition-colors",
                                                    status === level.value ? "text-white bg-white/5" : "text-muted"
                                                )}
                                            >
                                                <div className={cn("w-2 h-2 rounded-full", level.color.split(' ')[0].replace('text-', 'bg-').replace('/10', ''))} />
                                                {level.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Click outside handler could be added here or simplified by just closing on selection */}
                                {isSelected && (
                                    <div className="fixed inset-0 z-10" onClick={() => setOpenSelectId(null)} />
                                )}
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-white/10 shrink-0", getCategoryColor(tech.category))}>
                                        {tech.category}
                                    </span>
                                    {tech.subcategory && (
                                        <span className="text-[8px] bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/5">
                                            {tech.subcategory.split(' ')[0]}
                                        </span>
                                    )}
                                </div>
                                <h4 className={cn("text-xs font-bold transition-colors leading-tight", isMastered ? "text-green-400" : "text-slate-200")}>
                                    {tech.name}
                                </h4>
                                {tech.pedagogical_layer && (
                                    <span className="inline-block mt-1 mb-0.5 text-[8px] px-1.5 py-0 rounded border border-white/10 bg-white/5 text-muted uppercase tracking-wider">
                                        Camada {tech.pedagogical_layer}
                                    </span>
                                )}
                                {tech.description && <p className="text-[10px] text-muted leading-tight mt-0.5 line-clamp-2">{tech.description}</p>}
                                <div className="mt-1">
                                    Nível: <span className={statusInfo.color.split(' ')[1]}>{statusInfo.label}</span>
                                </div>
                                {tech.image_url && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setViewingImage(tech.image_url || null);
                                        }}
                                        className="ml-3 text-[9px] text-primary hover:text-primary-hover underline font-bold"
                                    >
                                        Ver Foto
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Image Viewer Modal */}
            {
                viewingImage && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in"
                        onClick={() => setViewingImage(null)}
                    >
                        <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
                            <button
                                onClick={() => setViewingImage(null)}
                                className="absolute -top-10 right-0 text-white/50 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-3xl">close</span>
                            </button>
                            <img
                                src={viewingImage}
                                alt="Execução Técnica"
                                className="rounded-xl shadow-2xl max-w-full max-h-[85vh] object-contain border border-white/10"
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
}
