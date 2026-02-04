import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { DynamicDiv } from '../../components/DynamicDiv';
import { EvaluationsList } from '../members/EvaluationsList';
import { TechniqueChecklist } from './TechniqueChecklist';

interface MemberEvolution {
    id: string;
    full_name: string;
    belt: string;
    xp: number;
    photo_url?: string;
    stripes: number;
    attendance_count: number;
    last_presence?: string;
    next_belt?: {
        name: string;
        min_xp: number;
        color: string;
    };
    current_belt_obj?: {
        color: string;
    };
    xp_progress: number;
    stripes_earned: number; // 0-4
    next_stripe_progress: number; // 0-100% to next individual stripe
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

    const fetchEvolutionData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Basic Data
            const { data: membersData, error: membError } = await supabase
                .from('members')
                .select('id, full_name, belt, xp, photo_url, stripes')
                .eq('status', 'Active')
                .order('full_name');

            if (membError) throw membError;

            // 2. Fetch Belts for Logic
            const { data: beltsData } = await supabase.from('belts').select('*').order('order_index');
            const belts = beltsData || [];

            // 3. Fetch Attendance Counts (Last 90 days for trend)
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            const { data: attendanceData } = await supabase
                .from('attendance')
                .select('member_id, created_at')
                .gte('created_at', ninetyDaysAgo.toISOString());

            // Process Data
            const evolutionList = membersData?.map(m => {
                // Attendance
                const memberAttendance = attendanceData?.filter(a => a.member_id === m.id) || [];
                const lastPres = memberAttendance.length > 0
                    ? memberAttendance.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
                    : undefined;

                // Belt Logic
                // Normalize legacy English names to Portuguese
                const beltMap: Record<string, string> = {
                    'White': 'Branca',
                    'Gray': 'Cinza',
                    'Grey': 'Cinza',
                    'Yellow': 'Amarela',
                    'Orange': 'Laranja',
                    'Green': 'Verde',
                    'Blue': 'Azul',
                    'Purple': 'Roxa',
                    'Brown': 'Marrom',
                    'Black': 'Preta'
                };

                // Try to find exact match or mapped match
                let effectiveBeltName = m.belt;
                if (beltMap[m.belt]) {
                    effectiveBeltName = beltMap[m.belt];
                }

                // Try to find the belt object
                let currentBeltIdx = belts.findIndex(b => b.name.toLowerCase() === effectiveBeltName.toLowerCase());

                // If still not found, try partial match (e.g. "Cinza c/ Preto" matching "Cinza")
                if (currentBeltIdx === -1) {
                    currentBeltIdx = belts.findIndex(b => effectiveBeltName.toLowerCase().includes(b.name.toLowerCase()));
                }

                const currentBeltObj = belts[currentBeltIdx];
                const nextBelt = belts[currentBeltIdx + 1];

                let progress = 0;
                let stripesEarned = 0;
                let nextStripeProgress = 0;

                if (nextBelt && currentBeltObj) {
                    const totalNeeded = nextBelt.min_xp - currentBeltObj.min_xp; // e.g. 2000 XP gap
                    const current = m.xp - currentBeltObj.min_xp; // e.g. 1000 XP earned in this belt

                    // Cap at limits
                    const safeCurrent = Math.max(0, current);
                    progress = Math.min(100, (safeCurrent / totalNeeded) * 100);

                    // Stripe Logic (Assumes 4 stripes per belt = 5 segments)
                    // Segment size = TotalGap / 5. (Start -> 1st -> 2nd -> 3rd -> 4th -> NextBelt)
                    // Or simpler: 4 stripes. TotalGap divided into 4 chunks?
                    // Usually: White (0) -> 1 Stripe (25%) -> 2 Stripes (50%) -> 3 Stripes (75%) -> 4 Stripes (90%+) -> Next Belt (100%)
                    // Let's use 4 Chunks for Stripes. The 5th state is "Ready for Exam".

                    // Actually, let's map it linearly to 4 degrees. 
                    // Gap / 4. 
                    // 0-25% = 0 stripes working towards 1st.
                    // 25-50% = 1 stripe working towards 2nd.
                    // 50-75% = 2 stripes working towards 3rd.
                    // 75-100% = 3 stripes working towards 4th.
                    // >100% = 4 stripes/Ready.

                    const xpPerStripe = totalNeeded / 4;
                    stripesEarned = Math.min(4, Math.floor(safeCurrent / xpPerStripe));

                    // Calculate progress to NEXT stripe
                    // If 1 stripe earned (accumulated 1 chunk), remain is current - (1 * chunk)
                    const xpInCurrentStripe = safeCurrent - (stripesEarned * xpPerStripe);
                    nextStripeProgress = Math.min(100, (xpInCurrentStripe / xpPerStripe) * 100);

                    if (stripesEarned >= 4) {
                        stripesEarned = 4;
                        nextStripeProgress = 100;
                    }

                } else if (!nextBelt) {
                    progress = 100;
                    stripesEarned = 4;
                    nextStripeProgress = 100;
                }

                return {
                    ...m,
                    belt: currentBeltObj ? currentBeltObj.name : m.belt, // Use the official name from belts table if found
                    attendance_count: memberAttendance.length,
                    last_presence: lastPres,
                    next_belt: nextBelt,
                    current_belt_obj: currentBeltObj,
                    xp_progress: Math.round(progress),
                    stripes_earned: stripesEarned,
                    next_stripe_progress: Math.round(nextStripeProgress)
                };
            });

            setMembers(evolutionList || []);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                                        {member.photo_url ? (
                                            <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-muted text-xs">{member.full_name.substring(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={cn("font-bold text-sm truncate", selectedMember?.id === member.id ? "text-white" : "text-slate-200")}>{member.full_name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-muted mt-1">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[10px]">military_tech</span>
                                                {member.belt}
                                            </span>
                                            <span>•</span>
                                            <span className={cn("font-bold", member.attendance_count > 20 ? "text-green-500" : member.attendance_count > 10 ? "text-yellow-500" : "text-red-500")}>
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
                <div className="lg:col-span-2">
                    {selectedMember ? (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            {/* Header Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-card p-5 rounded-2xl border border-border-slate flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">calendar_month</span>
                                    </div>
                                    <span className="text-2xl font-black text-white">{selectedMember.attendance_count}</span>
                                    <span className="text-[10px] uppercase font-bold text-muted tracking-widest">Presenças (90 dias)</span>
                                </div>

                                <div className="bg-card p-5 rounded-2xl border border-border-slate flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">bolt</span>
                                    </div>
                                    <span className="text-2xl font-black text-white">{selectedMember.xp.toLocaleString()}</span>
                                    <span className="text-[10px] uppercase font-bold text-muted tracking-widest">XP Total Acumulado</span>
                                </div>

                                <div className="bg-card p-5 rounded-2xl border border-border-slate flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-colors relative overflow-hidden">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform z-10">
                                        <span className="material-symbols-outlined">upgrade</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-1 z-10 w-full px-4">
                                        <div className="flex justify-between w-full items-center">
                                            <span className="text-[10px] uppercase font-bold text-muted tracking-widest">
                                                {selectedMember.stripes_earned}º Grau
                                            </span>
                                            <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded font-bold">
                                                {selectedMember.next_stripe_progress}% do próx.
                                            </span>
                                        </div>

                                        {/* Stripes Visual */}
                                        <div className="flex gap-1 w-full h-2 mt-1">
                                            {[0, 1, 2, 3].map(idx => (
                                                <div key={idx} className="flex-1 bg-black/40 rounded-sm overflow-hidden relative border border-white/5">
                                                    {/* Filled Stripes */}
                                                    {idx < selectedMember.stripes_earned && (
                                                        <div className="absolute inset-0 bg-white" />
                                                    )}
                                                    {/* Progressing Stripe */}
                                                    {idx === selectedMember.stripes_earned && (
                                                        <DynamicDiv
                                                            className="absolute inset-y-0 left-0 bg-primary opacity-50"
                                                            dynamicStyle={{ width: `${selectedMember.next_stripe_progress}%` }}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between w-full text-[9px] text-muted font-bold mt-1 uppercase tracking-widest opacity-50">
                                            <span>Faixa Atual ({selectedMember.belt})</span>
                                            <span className="text-primary">{selectedMember.next_belt?.name || 'Graduação Máxima'}</span>
                                        </div>
                                    </div>

                                    {/* Overall Progress Bar Background (Subtle) */}
                                    <DynamicDiv className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent transition-all duration-1000 opacity-30" dynamicStyle={{ width: `${selectedMember.xp_progress}%` }} />
                                </div>
                            </div>

                            {/* Technical Checklist */}
                            <TechniqueChecklist memberId={selectedMember.id} beltName={selectedMember.belt} />

                            {/* Technical Evolution (Evaluations) */}
                            <EvaluationsList memberId={selectedMember.id} currentBelt={selectedMember.belt} />

                            {/* Additional Gamification / Notes could go here */}
                            <div className="bg-card rounded-3xl border border-border-slate p-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-primary">history</span>
                                    Última Atividade
                                </h3>
                                <p className="text-muted text-sm">
                                    {selectedMember.last_presence
                                        ? `Última presença registrada em ${new Date(selectedMember.last_presence).toLocaleDateString()} às ${new Date(selectedMember.last_presence).toLocaleTimeString()}.`
                                        : "Nhuma presença registrada nos últimos 90 dias."}
                                </p>
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
