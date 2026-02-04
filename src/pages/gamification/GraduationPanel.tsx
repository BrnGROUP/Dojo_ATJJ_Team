
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { DynamicDiv } from '../../components/DynamicDiv';

interface Member {
    id: string;
    full_name: string;
    belt: string;
    xp: number;
    photo_url?: string;
    stripes: number;
}

interface Belt {
    id: string;
    name: string;
    min_xp: number;
    order_index: number;
    color: string;
}

export function GraduationPanel() {
    const [loading, setLoading] = useState(true);
    const [eligibleMembers, setEligibleMembers] = useState<{ member: Member, currentBelt: Belt, nextBelt: Belt }[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [examData, setExamData] = useState<{
        [memberId: string]: {
            status: 'Aprovado' | 'Reprovado';
            score: number;
            notes: string;
        }
    }>({});

    const [masteryMap, setMasteryMap] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [membersRes, beltsRes] = await Promise.all([
                supabase.from('members').select('*').eq('status', 'active'), // Only active members
                supabase.from('belts').select('*').order('order_index', { ascending: true })
            ]);

            if (membersRes.error) throw membersRes.error;
            if (beltsRes.error) throw beltsRes.error;

            const eligible = calculateEligibility(membersRes.data || [], beltsRes.data || []);
            setEligibleMembers(eligible);
            setSelectedMembers([]);

            // Fetch Mastery Data for Eligible Members
            if (eligible.length > 0) {
                await fetchMasteryData(eligible);
            }

        } catch (error) {
            console.error('Error fetching graduation data:', error);
            toast.error('Erro ao carregar dados de graduação.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMasteryData = async (eligible: { member: Member, currentBelt: Belt }[]) => {
        const mastery: Record<string, number> = {};

        // Optimisation: Fetch all techniques once (lightweight: id, belt_id)
        const { data: allTechniques } = await supabase.from('techniques').select('id, belt_id');
        if (!allTechniques) return;

        // Fetch all mastered techniques for eligible members
        const memberIds = eligible.map(e => e.member.id);
        const { data: allMemberTechniques } = await supabase
            .from('member_techniques')
            .select('member_id, technique_id, status')
            .in('member_id', memberIds)
            .in('status', ['mastered', 'alone']);

        eligible.forEach(({ member, currentBelt }) => {
            // Filter techniques for this belt
            const beltTechniqueIds = allTechniques
                .filter(t => t.belt_id === currentBelt.id)
                .map(t => t.id);

            if (beltTechniqueIds.length === 0) {
                mastery[member.id] = 100; // No techniques to master? Assume 100%
                return;
            }

            // Count mastered
            const masteredCount = allMemberTechniques?.filter(mt =>
                mt.member_id === member.id &&
                beltTechniqueIds.includes(mt.technique_id)
            ).length || 0;

            mastery[member.id] = Math.round((masteredCount / beltTechniqueIds.length) * 100);
        });

        setMasteryMap(mastery);
    };

    const calculateEligibility = (membersList: Member[], beltsList: Belt[]) => {
        const eligible: { member: Member, currentBelt: Belt, nextBelt: Belt }[] = [];

        membersList.forEach(member => {
            const currentBeltIndex = beltsList.findIndex(b =>
                member.belt?.toLowerCase() === b.name.toLowerCase() ||
                member.belt?.toLowerCase().includes(b.name.toLowerCase())
            );

            if (currentBeltIndex !== -1 && currentBeltIndex < beltsList.length - 1) {
                const currentBelt = beltsList[currentBeltIndex];
                const nextBelt = beltsList[currentBeltIndex + 1];

                if (member.xp >= nextBelt.min_xp) {
                    eligible.push({
                        member,
                        currentBelt,
                        nextBelt
                    });
                }
            }
        });

        return eligible;
    };

    const handleSelectMember = (memberId: string) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleSelectAll = () => {
        if (selectedMembers.length === eligibleMembers.length) {
            setSelectedMembers([]);
        } else {
            setSelectedMembers(eligibleMembers.map(i => i.member.id));
        }
    };

    const handleOpenExamModal = () => {
        const initialExamData: any = {};
        selectedMembers.forEach(id => {
            initialExamData[id] = { status: 'Aprovado', score: 100, notes: '' };
        });
        setExamData(initialExamData);
        setIsExamModalOpen(true);
    };

    const handleExamChange = (memberId: string, field: string, value: any) => {
        setExamData(prev => ({
            ...prev,
            [memberId]: { ...prev[memberId], [field]: value }
        }));
    };

    const handleBatchPromotion = async () => {
        try {
            setLoading(true);
            const selectedEligible = eligibleMembers.filter(e => selectedMembers.includes(e.member.id));

            for (const { member, nextBelt, currentBelt } of selectedEligible) {
                const result = examData[member.id];

                // 1. Record Evaluation
                await supabase.from('evaluations').insert({
                    member_id: member.id,
                    type: 'Exame de Faixa',
                    status: result.status,
                    score: result.score,
                    notes: result.notes,
                    belt_snapshot: currentBelt.name
                });

                // 2. If Approved, Promote
                if (result.status === 'Aprovado') {
                    await supabase
                        .from('members')
                        .update({
                            belt: nextBelt.name,
                            stripes: 0
                        })
                        .eq('id', member.id);

                    await supabase.from('xp_logs').insert({
                        member_id: member.id,
                        amount: 0,
                        reason: `Exame de Faixa: Promovido para ${nextBelt.name}`
                    });
                }
            }

            toast.success('Exame concluído com sucesso!');
            setIsExamModalOpen(false);
            fetchData();

        } catch (error) {
            console.error('Error in batch promotion:', error);
            toast.error('Erro ao processar exame em massa.');
        } finally {
            setLoading(false);
        }
    };

    // Keep individual promote for quick actions
    const handleIndividualPromote = async (memberId: string, nextBeltName: string) => {
        if (!confirm(`Confirma a graduação deste aluno para ${nextBeltName}?`)) return;
        try {
            await supabase.from('members').update({ belt: nextBeltName, stripes: 0 }).eq('id', memberId);
            await supabase.from('xp_logs').insert({ member_id: memberId, amount: 0, reason: `Graduação para ${nextBeltName}` });
            toast.success('Aluno graduado com sucesso!');
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao graduar aluno.');
        }
    };

    if (loading && !isExamModalOpen) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 space-y-8 animate-fade-in pb-24 relative">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-primary">military_tech</span>
                        Painel de Graduação
                    </h1>
                    <p className="text-muted mt-1">Alunos elegíveis para a próxima faixa com base no XP.</p>
                </div>

                {eligibleMembers.length > 0 && (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSelectAll}
                            className="text-sm font-bold text-muted hover:text-white transition-colors"
                        >
                            {selectedMembers.length === eligibleMembers.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </button>
                        <button
                            disabled={selectedMembers.length === 0}
                            onClick={handleOpenExamModal}
                            className="bg-primary hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined">assignment_turned_in</span>
                            Iniciar Exame ({selectedMembers.length})
                        </button>
                    </div>
                )}
            </header>

            {eligibleMembers.length === 0 ? (
                <div className="bg-card rounded-3xl border border-border-slate p-12 flex flex-col items-center justify-center text-center opacity-50">
                    <span className="material-symbols-outlined text-6xl mb-4">sentiment_satisfied</span>
                    <h3 className="text-xl font-bold text-white mb-2">Ninguém por enquanto!</h3>
                    <p className="max-w-md">Nenhum aluno atingiu os requisitos de XP para a próxima graduação no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {eligibleMembers.map(({ member, currentBelt, nextBelt }) => {
                        const isSelected = selectedMembers.includes(member.id);
                        return (
                            <div
                                key={member.id}
                                onClick={() => handleSelectMember(member.id)} // Select on card click
                                className={cn(
                                    "bg-card rounded-3xl border p-6 relative overflow-hidden group transition-all cursor-pointer select-none",
                                    isSelected ? "border-primary ring-1 ring-primary" : "border-border-slate hover:border-white/20"
                                )}
                            >
                                <div className="absolute top-4 right-4 z-20">
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        isSelected ? "bg-primary border-primary" : "border-muted bg-transparent group-hover:border-white"
                                    )}>
                                        {isSelected && <span className="material-symbols-outlined text-sm text-white font-bold">check</span>}
                                    </div>
                                </div>

                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <span className="material-symbols-outlined text-8xl">upgrade</span>
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-border-slate flex items-center justify-center overflow-hidden">
                                            {member.photo_url ? (
                                                <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-muted text-lg">{member.full_name.substring(0, 2).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white">{member.full_name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted">
                                                <span className="material-symbols-outlined text-base">bolt</span>
                                                {member.xp.toLocaleString()} XP Total
                                            </div>
                                            {typeof masteryMap[member.id] === 'number' && (
                                                <div className="flex items-center gap-2 text-[10px] uppercase font-bold mt-1 tracking-wide">
                                                    <div className={cn("w-2 h-2 rounded-full",
                                                        masteryMap[member.id] >= 70 ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-orange-500 animate-pulse"
                                                    )} />
                                                    <span className={cn(
                                                        masteryMap[member.id] >= 70 ? "text-green-500" : "text-orange-500"
                                                    )}>
                                                        {masteryMap[member.id]}% Domínio Técnico
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-zinc-900/50 rounded-2xl p-4 mb-6 relative">
                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-[2px] bg-slate-700"></div>

                                        <div className="flex flex-col items-center gap-2 z-10">
                                            <span className="text-[10px] font-bold uppercase text-muted tracking-widest">Atual</span>
                                            <DynamicDiv
                                                className="w-8 h-8 rounded-full shadow-lg border border-white/10 bg-dynamic-color"
                                                dynamicStyle={{ '--dynamic-color': currentBelt.color }}
                                                title={currentBelt.name}
                                            />
                                            <span className="text-xs font-bold text-slate-300 max-w-[80px] text-center truncate">{currentBelt.name}</span>
                                        </div>

                                        <div className="z-10 bg-zinc-900 p-1 rounded-full">
                                            <span className="material-symbols-outlined text-primary text-xl">arrow_forward</span>
                                        </div>

                                        <div className="flex flex-col items-center gap-2 z-10">
                                            <span className="text-[10px] font-bold uppercase text-primary tracking-widest">Próxima</span>
                                            <DynamicDiv
                                                className="w-10 h-10 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)] border-2 border-primary bg-dynamic-color"
                                                dynamicStyle={{ '--dynamic-color': nextBelt.color }}
                                                title={nextBelt.name}
                                            />
                                            <span className="text-xs font-bold text-white max-w-[80px] text-center truncate">{nextBelt.name}</span>
                                        </div>
                                    </div>

                                    {/* Individual Promote Button (Secondary Action now) */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleIndividualPromote(member.id, nextBelt.name);
                                        }}
                                        className="w-full h-10 bg-white/5 hover:bg-white/10 text-muted hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-border-slate text-sm"
                                    >
                                        Graduar Individualmente
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Batch Exam Modal */}
            {isExamModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-card w-full max-w-4xl rounded-3xl border border-border-slate p-8 animate-in fade-in zoom-in duration-200 my-8">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase flex items-center gap-3">
                                    <span className="material-symbols-outlined text-3xl text-primary">assignment_turned_in</span>
                                    Sessão de Exame de Faixa
                                </h3>
                                <p className="text-muted mt-1">Avaliando {selectedMembers.length} alunos selecionados.</p>
                            </div>
                            <button onClick={() => setIsExamModalOpen(false)} className="text-muted hover:text-white">
                                <span className="material-symbols-outlined text-2xl">close</span>
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-widest border-b border-border-slate">
                                <div className="col-span-4">Aluno / Graduação</div>
                                <div className="col-span-2 text-center">Nota (0-100)</div>
                                <div className="col-span-2 text-center">Status</div>
                                <div className="col-span-4">Observação</div>
                            </div>

                            {eligibleMembers.filter(e => selectedMembers.includes(e.member.id)).map(({ member, nextBelt }) => (
                                <div key={member.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white/5 p-4 rounded-xl border border-border-slate">
                                    <div className="md:col-span-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-border-slate flex items-center justify-center overflow-hidden shrink-0">
                                            {member.photo_url ? (
                                                <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-muted text-xs">{member.full_name.substring(0, 2).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{member.full_name}</h4>
                                            <div className="flex items-center gap-1 text-xs text-muted">
                                                <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                                                <span className="font-semibold text-primary">{nextBelt.name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <input
                                            type="number"
                                            min="0" max="100"
                                            title="Nota do Exame"
                                            placeholder="0"
                                            value={examData[member.id]?.score || 0}
                                            onChange={(e) => handleExamChange(member.id, 'score', parseInt(e.target.value))}
                                            className="w-full bg-main border border-border-slate rounded-lg px-3 py-2 text-white text-center font-bold focus:border-primary outline-none"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <select
                                            value={examData[member.id]?.status || 'Aprovado'}
                                            onChange={(e) => handleExamChange(member.id, 'status', e.target.value)}
                                            title="Status do Exame"
                                            className={cn(
                                                "w-full rounded-lg px-2 py-2 text-xs font-bold uppercase outline-none border cursor-pointer",
                                                examData[member.id]?.status === 'Aprovado'
                                                    ? "bg-green-500/10 text-green-500 border-green-500/30"
                                                    : "bg-red-500/10 text-red-500 border-red-500/30"
                                            )}
                                        >
                                            <option value="Aprovado">Aprovado</option>
                                            <option value="Reprovado">Reprovado</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-4">
                                        <input
                                            type="text"
                                            title="Observações"
                                            placeholder="Obs: Técnica excelente..."
                                            value={examData[member.id]?.notes || ''}
                                            onChange={(e) => handleExamChange(member.id, 'notes', e.target.value)}
                                            className="w-full bg-main border border-border-slate rounded-lg px-3 py-2 text-white text-sm focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-border-slate">
                            <button
                                onClick={() => setIsExamModalOpen(false)}
                                className="px-6 py-3 rounded-xl font-bold text-white hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleBatchPromotion}
                                disabled={loading}
                                className="bg-primary hover:bg-red-600 px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                            >
                                {loading ? 'Processando...' : 'Concluir Exame & Graduar Aprovados'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
