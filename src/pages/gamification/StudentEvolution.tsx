import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { DynamicDiv } from '../../components/DynamicDiv';
import { EvaluationsList } from '../members/EvaluationsList';
import { TechniqueChecklist } from './TechniqueChecklist';
import { BadgeShowcase } from '../../components/shared/BadgeShowcase';

interface BeltObj {
    id: string;
    name: string;
    min_xp: number;
    color: string;
    color_secondary?: string;
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

export interface MemberEvolution {
    id: string;
    full_name: string;
    belt: string;
    avatar_url?: string;
    xp: number;
    stripes: number;
    enrolled_classes: string[];
    next_belt_override?: string | null;
    attendance_count: number;
    total_attendance_count: number;
    last_presence?: string;
    current_belt_obj?: BeltObj;
    xp_progress: number;
    next_stripe_progress: number;
    stripes_earned: number;
    kyu_label?: string;
    next_belt?: BeltObj;
    promotion_ready: boolean;
    current_requirements?: BeltRequirement;
    student_domina_pct?: number;
    student_executa_pct?: number;
    xp_logs: {
        id: string;
        amount: number;
        reason: string;
        created_at: string;
        type: 'presence' | 'manual' | 'bonus';
    }[];
}


export function StudentEvolution() {
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<MemberEvolution[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<MemberEvolution[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMember, setSelectedMember] = useState<MemberEvolution | null>(null);

    useEffect(() => {
        fetchEvolutionData();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            setFilteredMembers(members.filter(m =>
                m.full_name.toLowerCase().includes(searchTerm.toLowerCase())
            ));
        } else {
            setFilteredMembers(members);
        }
    }, [searchTerm, members]);

    const fetchEvolutionData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // 1. Fetch members
            const { data: membersData, error: membError } = await supabase
                .from('members')
                .select('id, full_name, belt, xp, avatar_url, stripes, enrolled_classes, next_belt_override')
                .ilike('status', 'active')
                .not('belt', 'ilike', '%preta%')
                .not('belt', 'ilike', '%black%')
                .order('full_name');

            if (membError) throw membError;

            // 2. Fetch Belts, Requirements, Groups, Attendance, Techniques, and Member Techniques in parallel
            const [beltsRes, reqsRes, groupsRes, allAttRes, techRes, memTechRes] = await Promise.all([
                supabase.from('belts').select('*').order('order_index'),
                supabase.from('belt_requirements').select('*'),
                supabase.from('groups').select('id, name, belt_progression'),
                supabase.from('attendance').select('member_id, created_at'),
                supabase.from('techniques').select('id, belt_id'),
                supabase.from('member_techniques').select('member_id, technique_id, status')
            ]);

            const belts: BeltObj[] = beltsRes.data || [];
            const reqsMap: Record<string, BeltRequirement> = {};
            (reqsRes.data || []).forEach((r: any) => { reqsMap[r.belt_id] = r; });
            const groupsMap: Record<string, string[]> = {};
            (groupsRes.data || []).forEach((g: any) => { groupsMap[g.name] = g.belt_progression || []; });

            // Belt name normalization map
            const beltNameMap: Record<string, string> = {
                'White': 'Branca', 'Gray': 'Cinza', 'Grey': 'Cinza',
                'Yellow': 'Amarela', 'Orange': 'Laranja', 'Green': 'Verde',
                'Blue': 'Azul', 'Purple': 'Roxa', 'Brown': 'Marrom', 'Black': 'Preta'
            };

            // 90-day window for recent attendance
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            const membersWithEvolution = await Promise.all(membersData?.map(async (m) => {
                // --- Attendance ---
                const allMemberAttendance = (allAttRes.data || []).filter(a => a.member_id === m.id);
                const recentAttendance = allMemberAttendance.filter(a => new Date(a.created_at) >= ninetyDaysAgo);
                const lastPres = allMemberAttendance.length > 0
                    ? allMemberAttendance.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
                    : undefined;

                // --- Belt resolution ---
                let effectiveBeltName = beltNameMap[m.belt] || m.belt;
                let currentBeltIdx = belts.findIndex(b => b.name.toLowerCase() === effectiveBeltName.toLowerCase());
                if (currentBeltIdx === -1) {
                    currentBeltIdx = belts.findIndex(b => effectiveBeltName.toLowerCase().includes(b.name.toLowerCase()));
                }
                const currentBeltObj = belts[currentBeltIdx];

                // --- Next Belt (Override > Group Progression > Default order) ---
                let nextBelt: BeltObj | undefined;

                if (m.next_belt_override) {
                    nextBelt = belts.find(b => b.id === m.next_belt_override);
                } else if (currentBeltObj) {
                    // Try group progression
                    const enrolledClasses = m.enrolled_classes || [];
                    let groupProgression: string[] = [];
                    for (const className of enrolledClasses) {
                        if (groupsMap[className] && groupsMap[className].length > 0) {
                            groupProgression = groupsMap[className];
                            break;
                        }
                    }

                    if (groupProgression.length > 0) {
                        // Encontra a primeira faixa na progressão do grupo que tem um min_xp MAIOR que a faixa atual
                        const nextBeltId = groupProgression.find(id => {
                            const b = belts.find(x => x.id === id);
                            return b && b.min_xp > currentBeltObj.min_xp;
                        });

                        if (nextBeltId) {
                            nextBelt = belts.find(b => b.id === nextBeltId);
                        }
                    }

                    // Fallback to default order
                    if (!nextBelt) {
                        nextBelt = belts[currentBeltIdx + 1];
                    }
                }



                // --- Requirements for current belt ---
                const currentReqs = currentBeltObj ? reqsMap[currentBeltObj.id] : undefined;

                // --- Progress calculation ---
                let progress = 0;
                let stripesEarned = 0;
                let nextStripeProgress = 0;
                let promotionReady = false;
                let student_domina_pct = 0;
                let student_executa_pct = 0;

                const allStudentTechs = (memTechRes.data || []).filter((mt: any) => mt.member_id === m.id);
                let technique_xp = 0;
                allStudentTechs.forEach((mt: any) => {
                    if (mt.status === 'mastered') technique_xp += 50;
                    else if (mt.status === 'alone') technique_xp += 30;
                    else if (mt.status === 'with_help') technique_xp += 15;
                    else if (mt.status === 'learning') technique_xp += 5;
                });
                
                const total_computed_xp = m.xp + technique_xp;

                if (nextBelt && currentBeltObj) {
                    const totalNeeded = nextBelt.min_xp - currentBeltObj.min_xp;
                    const current = total_computed_xp - currentBeltObj.min_xp;
                    const safeCurrent = Math.max(0, current);
                    progress = totalNeeded > 0 ? Math.min(100, (safeCurrent / totalNeeded) * 100) : 100;

                    const xpPerStripe = totalNeeded / 4;
                    const calcStripesEarned = xpPerStripe > 0 ? Math.min(4, Math.floor(safeCurrent / xpPerStripe)) : 0;
                    
                    // Prioriza os graus cadastrados manualmente se o XP calculado for menor
                    stripesEarned = Math.min(4, Math.max(m.stripes || 0, calcStripesEarned));
                    
                    const xpInCurrentStripe = Math.max(0, safeCurrent - (stripesEarned * xpPerStripe));
                    nextStripeProgress = xpPerStripe > 0 ? Math.min(100, (xpInCurrentStripe / xpPerStripe) * 100) : 0;

                    if (stripesEarned >= 4) { stripesEarned = 4; nextStripeProgress = 100; }

                    if (currentReqs) {
                        const totalBeltTechs = (techRes.data || []).filter((t: any) => t.belt_id === currentBeltObj.id).length;
                        if (totalBeltTechs > 0) {
                            const studentTechsForBelt = (memTechRes.data || []).filter((mt: any) => 
                                mt.member_id === m.id && 
                                (techRes.data || []).some((t: any) => t.id === mt.technique_id && t.belt_id === currentBeltObj.id)
                            );

                            const dominaCount = studentTechsForBelt.filter((mt: any) => mt.status === 'mastered').length;
                            const executaCount = studentTechsForBelt.filter((mt: any) => mt.status === 'mastered' || mt.status === 'alone').length;

                            student_domina_pct = Math.round((dominaCount / totalBeltTechs) * 100);
                            student_executa_pct = Math.round((executaCount / totalBeltTechs) * 100);
                        }

                        const hasConfiguredReqs = currentReqs.min_total_xp > 0 
                            || currentReqs.min_attendance > 0 
                            || currentReqs.min_technique_domina_pct > 0 
                            || currentReqs.min_technique_executa_pct > 0;

                        const meetsXP = total_computed_xp >= currentReqs.min_total_xp;
                        const meetsAttendance = allMemberAttendance.length >= currentReqs.min_attendance;
                        const meetsDomina = student_domina_pct >= currentReqs.min_technique_domina_pct;
                        const meetsExecuta = student_executa_pct >= currentReqs.min_technique_executa_pct;

                        promotionReady = hasConfiguredReqs && meetsXP && meetsAttendance && meetsDomina && meetsExecuta;
                    }
                } else if (!nextBelt) {
                    progress = 100;
                    stripesEarned = 4;
                    nextStripeProgress = 100;
                }

                // --- XP Logs ---
                const { data: xpLogs } = await supabase
                    .from('xp_logs')
                    .select('*')
                    .eq('member_id', m.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                return {
                    ...m,
                    xp: total_computed_xp, // Substitui a XP base pela XP + Técnicas
                    avatar_url: m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=1f2937&color=fff`,
                    attendance_count: recentAttendance.length,
                    total_attendance_count: allMemberAttendance.length,
                    last_presence: lastPres,
                    next_belt: nextBelt,
                    current_belt_obj: currentBeltObj,
                    current_requirements: currentReqs,
                    xp_progress: Math.round(progress),
                    stripes_earned: stripesEarned,
                    next_stripe_progress: Math.round(nextStripeProgress),
                    kyu_label: currentBeltObj?.kyu_dan_label,
                    promotion_ready: promotionReady,
                    student_domina_pct,
                    student_executa_pct,
                    xp_logs: xpLogs || []
                } as MemberEvolution;
            }) || []);

            setMembers(membersWithEvolution);

            // Se existir um membro selecionado, atualiza as estatísticas dele na tela em tempo real
            setSelectedMember(currentSelected => {
                if (!currentSelected) return null;
                const updated = membersWithEvolution.find(m => m.id === currentSelected.id);
                return updated || currentSelected;
            });

        } catch (error) {
            console.error(error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleAwardStripe = async (member: MemberEvolution) => {
        if (member.stripes >= 4) {
            toast.error('Aluno já possui o limite máximo de graus nesta faixa.');
            return;
        }

        const confirmed = window.confirm(`Deseja conceder oficialmente o ${member.stripes + 1}º Grau para ${member.full_name}?`);
        if (!confirmed) return;

        try {
            // 1. Update Member
            const { error: membError } = await supabase
                .from('members')
                .update({ stripes: member.stripes + 1 })
                .eq('id', member.id);

            if (membError) throw membError;

            // 2. Log Evaluation
            const { error: evalError } = await supabase
                .from('evaluations')
                .insert({
                    member_id: member.id,
                    type: 'Outorga de Grau',
                    status: 'Aprovado',
                    score: 100,
                    notes: `Outorgado o ${member.stripes + 1}º Grau por mérito técnico e de presença.`,
                    belt_snapshot: member.belt
                });

            if (evalError) throw evalError;

            // 3. Log XP (optional bonus XP for degree)
            await supabase.from('xp_logs').insert({
                member_id: member.id,
                amount: 50,
                reason: `Bônus: Recebeu o ${member.stripes + 1}º Grau`
            });

            toast.success('Grau outorgado com sucesso!');
            fetchEvolutionData();
        } catch (error) {
            console.error('Error awarding stripe:', error);
            toast.error('Erro ao outorgar grau.');
        }
    };

    return (
        <div className="p-6 md:p-10 space-y-8 animate-fade-in pb-24 relative">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-primary">monitoring</span>
                        Evolução do Aluno
                    </h1>
                    <p className="text-muted mt-1">Acompanhe frequência, progresso técnico e gamificação.</p>
                </div>

                <div className="relative w-full md:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted">search</span>
                    <input
                        type="text"
                        placeholder="Buscar aluno..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-card border border-border-slate rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-primary transition-all"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* List Column */}
                <div className="lg:col-span-1 space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar pr-2">
                    {loading ? (
                        <div className="text-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                    ) : filteredMembers.length === 0 ? (
                        <p className="text-muted text-center py-10">Nenhum aluno encontrado.</p>
                    ) : (
                        filteredMembers.map(member => (
                            <div
                                key={member.id}
                                onClick={() => setSelectedMember(member)}
                                className={cn(
                                    "bg-card p-4 rounded-xl border cursor-pointer transition-all hover:border-white/20 relative overflow-hidden group",
                                    selectedMember?.id === member.id ? "border-primary ring-1 ring-primary" : "border-border-slate"
                                )}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-border-slate flex items-center justify-center overflow-hidden shrink-0">
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-muted text-xs">{member.full_name.substring(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className={cn("font-bold text-sm truncate", selectedMember?.id === member.id ? "text-white" : "text-slate-200")}>{member.full_name}</h4>
                                            {member.promotion_ready && (
                                                <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Pronto para promoção" />
                                            )}
                                        </div>
                                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted mt-1 leading-tight">
                                            <span className="flex items-center gap-1 whitespace-nowrap">
                                                <span className="material-symbols-outlined text-[10px]">military_tech</span>
                                                {member.belt}
                                                {member.kyu_label && <span className="text-primary font-bold">({member.kyu_label})</span>}
                                            </span>
                                            <span className="hidden sm:inline opacity-30">•</span>
                                            <span className={cn("font-bold whitespace-nowrap", member.attendance_count > 20 ? "text-green-500" : member.attendance_count > 10 ? "text-yellow-500" : "text-red-500")}>
                                                {member.attendance_count} treinos (90d)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 relative flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                            <path className="text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                            <path className="text-primary transition-all duration-1000 ease-out" strokeDasharray={`${member.xp_progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                        </svg>
                                        <span className="absolute text-[8px] font-bold text-white">{member.xp_progress}%</span>
                                    </div>
                                </div>
                                {selectedMember?.id === member.id && (
                                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Details Column */}
                <div className="xl:col-span-2">
                    {selectedMember ? (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            {/* Header Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                                <div className="bg-card p-5 rounded-2xl border border-border-slate flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">calendar_month</span>
                                    </div>
                                    <span className="text-2xl font-black text-white">{selectedMember.attendance_count}</span>
                                    <span className="text-[10px] uppercase font-bold text-muted tracking-widest">Presenças (90d)</span>
                                </div>

                                <div className="bg-card p-5 rounded-2xl border border-border-slate flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">event_available</span>
                                    </div>
                                    <span className="text-2xl font-black text-white">{selectedMember.total_attendance_count}</span>
                                    <span className="text-[10px] uppercase font-bold text-muted tracking-widest">Total Geral</span>
                                </div>

                                <div className="bg-card p-5 rounded-2xl border border-border-slate flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">bolt</span>
                                    </div>
                                    <span className="text-2xl font-black text-white">{selectedMember.xp.toLocaleString()}</span>
                                    <span className="text-[10px] uppercase font-bold text-muted tracking-widest">XP Total</span>
                                </div>

                                <div className="bg-card p-5 rounded-2xl border border-border-slate flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-colors relative overflow-hidden">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform z-10">
                                        <span className="material-symbols-outlined">upgrade</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-1 z-10 w-full px-4">
                                        <div className="flex justify-between w-full items-center">
                                            <span className="text-[10px] uppercase font-bold text-muted tracking-widest">
                                                {selectedMember.stripes_earned === 4 ? 'Pronto para Faixa' : `${selectedMember.stripes_earned}º Grau`}
                                            </span>
                                            <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded font-bold">
                                                {selectedMember.xp_progress}%
                                            </span>
                                            {selectedMember.stripes_earned > selectedMember.stripes && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAwardStripe(selectedMember);
                                                    }}
                                                    className="ml-2 text-[8px] bg-green-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                                                >
                                                    OUTORGAR {selectedMember.stripes + 1}º GRAU
                                                </button>
                                            )}
                                        </div>

                                        {/* Stripes Visual */}
                                        <div className="flex gap-1 w-full h-2 mt-1">
                                            {[0, 1, 2, 3].map(idx => (
                                                <div key={idx} className="flex-1 bg-black/40 rounded-sm overflow-hidden relative border border-white/5">
                                                    {idx < selectedMember.stripes_earned && (
                                                        <div className="absolute inset-0 bg-white shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                                                    )}
                                                    {idx === selectedMember.stripes_earned && (
                                                        <DynamicDiv
                                                            className="absolute inset-y-0 left-0 bg-primary/60"
                                                            dynamicStyle={{ width: `${selectedMember.next_stripe_progress}%` }}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between w-full text-[9px] text-muted font-bold mt-1 uppercase tracking-widest opacity-50">
                                            <span>{selectedMember.belt}</span>
                                            <span className="text-primary">{selectedMember.next_belt?.name || 'Graduação Máxima'}</span>
                                        </div>
                                    </div>

                                    <DynamicDiv className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent transition-all duration-1000" dynamicStyle={{ width: `${selectedMember.xp_progress}%` }} />
                                </div>
                            </div>

                            {/* Requisitos de Graduação Card */}
                            <div className="bg-card rounded-3xl border border-border-slate p-6 md:p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <span className="material-symbols-outlined text-8xl">military_tech</span>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="material-symbols-outlined text-primary text-3xl">target</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-bold text-white uppercase tracking-tight italic">Missão: {selectedMember.next_belt?.name || 'Lenda do Dojo'}</h3>
                                                {selectedMember.next_belt?.kyu_dan_label && (
                                                    <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">{selectedMember.next_belt.kyu_dan_label}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted">Requisitos para alcançar o próximo nível da jornada.</p>
                                        </div>
                                        {selectedMember.promotion_ready && (
                                            <div className="bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-500/30 flex items-center gap-1 animate-pulse">
                                                <span className="material-symbols-outlined text-sm">verified</span>
                                                Pronto p/ Promoção
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            {/* Critérios Configurados */}
                                            {selectedMember.current_requirements ? (
                                                <div className="space-y-3">
                                                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Critérios p/ Promoção</span>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="bg-main/50 rounded-xl p-3 border border-border-slate">
                                                            <p className="text-[9px] text-muted uppercase font-bold">XP Mínimo</p>
                                                            <p className={cn("text-lg font-black", selectedMember.xp >= selectedMember.current_requirements.min_total_xp ? "text-green-500" : "text-white")}>
                                                                {selectedMember.xp.toLocaleString()}
                                                                <span className="text-[10px] text-muted font-normal"> / {selectedMember.current_requirements.min_total_xp.toLocaleString()}</span>
                                                            </p>
                                                        </div>
                                                        <div className="bg-main/50 rounded-xl p-3 border border-border-slate">
                                                            <p className="text-[9px] text-muted uppercase font-bold">Presenças</p>
                                                            <p className={cn("text-lg font-black", selectedMember.total_attendance_count >= selectedMember.current_requirements.min_attendance ? "text-green-500" : "text-white")}>
                                                                {selectedMember.total_attendance_count}
                                                                <span className="text-[10px] text-muted font-normal"> / {selectedMember.current_requirements.min_attendance}</span>
                                                            </p>
                                                        </div>
                                                        <div className="bg-main/50 rounded-xl p-3 border border-border-slate">
                                                            <p className="text-[9px] text-muted uppercase font-bold">Técnicas "Domina"</p>
                                                            <p className={cn("text-lg font-black", (selectedMember.student_domina_pct || 0) >= selectedMember.current_requirements.min_technique_domina_pct ? "text-green-500" : "text-white")}>
                                                                {selectedMember.student_domina_pct || 0}%
                                                                <span className="text-[10px] text-muted font-normal"> / desc. {selectedMember.current_requirements.min_technique_domina_pct}%</span>
                                                            </p>
                                                        </div>
                                                        <div className="bg-main/50 rounded-xl p-3 border border-border-slate">
                                                            <p className="text-[9px] text-muted uppercase font-bold">Técnicas "Executa"</p>
                                                            <p className={cn("text-lg font-black", (selectedMember.student_executa_pct || 0) >= selectedMember.current_requirements.min_technique_executa_pct ? "text-green-500" : "text-white")}>
                                                                {selectedMember.student_executa_pct || 0}%
                                                                <span className="text-[10px] text-muted font-normal"> / desc. {selectedMember.current_requirements.min_technique_executa_pct}%</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Critérios Técnicos</span>
                                                    <p className="text-sm text-slate-200 leading-relaxed italic border-l-2 border-primary/30 pl-3">
                                                        {selectedMember.next_belt?.requirements || 'Continue treinando duro para alcançar o nível máximo!'}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Status da Jornada</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("material-symbols-outlined text-sm", selectedMember.attendance_count >= 12 ? "text-green-500" : "text-yellow-500")}>
                                                        {selectedMember.attendance_count >= 12 ? 'check_circle' : 'schedule'}
                                                    </span>
                                                    <span className="text-xs text-slate-300">Frequência (90 dias): <strong>{selectedMember.attendance_count} treinos</strong></span>
                                                </div>
                                                {selectedMember.next_belt_override && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="material-symbols-outlined text-amber-500 text-sm">edit_note</span>
                                                        <span className="text-xs text-amber-400">Próxima faixa definida manualmente pelo instrutor</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-main/50 rounded-2xl border border-border-slate p-5 space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-bold text-muted uppercase">Progresso de XP</p>
                                                    <h4 className="text-2xl font-black text-white">{selectedMember.xp.toLocaleString()} <span className="text-xs text-muted font-normal">/ {selectedMember.next_belt?.min_xp.toLocaleString() || 'MAX'} XP</span></h4>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-primary uppercase">Restam</p>
                                                    <p className="text-lg font-black text-primary">
                                                        {selectedMember.next_belt ? (selectedMember.next_belt.min_xp - selectedMember.xp).toLocaleString() : 0} XP
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="h-2 w-full bg-card rounded-full overflow-hidden border border-border-slate">
                                                <DynamicDiv
                                                    className="h-full bg-gradient-to-r from-primary to-primary/40 rounded-full shadow-[0_0_10px_rgba(215,38,54,0.3)] transition-all duration-1000"
                                                    dynamicStyle={{ width: `${selectedMember.xp_progress}%` }}
                                                />
                                            </div>
                                            <p className="text-[9px] text-muted italic text-center uppercase tracking-widest">Foco total nas técnicas do currículo abaixo para agilizar sua promoção.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Conquered Badges */}
                            <div className="bg-card rounded-3xl border border-border-slate p-6 md:p-8">
                                <BadgeShowcase memberId={selectedMember.id} />
                            </div>

                            {/* Technical Checklist */}
                            <TechniqueChecklist 
                                memberId={selectedMember.id} 
                                beltName={selectedMember.belt} 
                                onUpdate={() => fetchEvolutionData(true)}
                            />

                            {/* Technical Evolution (Evaluations) */}
                            <EvaluationsList 
                                memberId={selectedMember.id} 
                                currentBelt={selectedMember.belt} 
                                onUpdate={() => fetchEvolutionData(true)} 
                            />

                            {/* Evolution Timeline (XP Logs) */}
                            <div className="bg-card rounded-3xl border border-border-slate p-6 md:p-8">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                                    <span className="material-symbols-outlined text-primary">timeline</span>
                                    Linha do Tempo de XP
                                </h3>
                                {selectedMember.xp_logs.length > 0 ? (
                                    <div className="space-y-4 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
                                        {selectedMember.xp_logs.map(log => (
                                            <div key={log.id} className="relative pl-8 group">
                                                <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-zinc-900 border-2 border-primary group-hover:scale-110 transition-transform flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                </div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-200">{log.reason}</p>
                                                        <p className="text-[10px] text-muted uppercase font-bold tracking-widest">{new Date(log.created_at).toLocaleString('pt-BR')}</p>
                                                    </div>
                                                    <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full border border-primary/20">
                                                        +{log.amount} XP
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted text-sm italic">Nenhuma atividade de gamificação registrada recentemente.</p>
                                )}
                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 min-h-[400px] border-2 border-dashed border-border-slate rounded-3xl bg-white/5">
                            <span className="material-symbols-outlined text-6xl mb-4 text-muted">person_search</span>
                            <h3 className="text-xl font-bold text-white mb-2">Selecione um Aluno</h3>
                            <p className="max-w-xs text-muted">Clique em um aluno na lista ao lado para ver seus detalhes de evolução técnica, frequência e gamificação.</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
