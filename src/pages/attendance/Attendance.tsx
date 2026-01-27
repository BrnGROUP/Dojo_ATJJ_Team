import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface Member {
    id: string;
    full_name: string;
    belt: string;
    status: string;
    enrolled_classes: string[];
}

interface ClassSession {
    id: string;
    title: string;
    instructor: string;
    start_time: string;
    status: string;
}

export function Attendance() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [members, setMembers] = useState<Member[]>([]);
    const [attendance, setAttendance] = useState<Record<string, { present: boolean, onTime: boolean, goodBehavior: boolean }>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, [selectedDate]);

    useEffect(() => {
        if (selectedClassId) {
            fetchMembersAndAttendance();
        } else {
            setMembers([]);
            setAttendance({});
        }
    }, [selectedClassId]);

    async function fetchClasses() {
        setLoading(true);
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .gte('start_time', `${selectedDate}T00:00:00`)
            .lte('start_time', `${selectedDate}T23:59:59`)
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Error fetching classes:', error);
        } else {
            setClasses(data || []);
            if (data && data.length > 0) {
                // Keep selected class if it still exists on this date, else pick first
                if (!data.find(c => c.id === selectedClassId)) {
                    setSelectedClassId(data[0].id);
                }
            } else {
                setSelectedClassId('');
            }
        }
        setLoading(false);
    }

    async function fetchMembersAndAttendance() {
        setLoading(true);
        // Fetch all active members
        const { data: membersData, error: membersError } = await supabase
            .from('members')
            .select('id, full_name, belt, status, enrolled_classes')
            .eq('status', 'Active')
            .order('full_name', { ascending: true });

        if (membersError) {
            console.error('Error fetching members:', membersError);
            return;
        }

        // Fetch attendance for this class
        const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance')
            .select('member_id, status')
            .eq('class_id', selectedClassId);

        if (attendanceError) {
            // It's possible the table doesn't exist yet, we'll handle this gracefully if it's the first time
            console.warn('Error fetching attendance (table might not exist):', attendanceError);
        }

        setMembers(membersData || []);

        const initialAttendance: Record<string, { present: boolean, onTime: boolean, goodBehavior: boolean }> = {};
        if (attendanceData) {
            attendanceData.forEach((rec: any) => {
                initialAttendance[rec.member_id] = {
                    present: rec.status === 'Present',
                    onTime: rec.on_time || false,
                    goodBehavior: rec.good_behavior || false
                };
            });
        }
        setAttendance(initialAttendance);
        setLoading(false);
    }

    const toggleStatus = (memberId: string, field: 'present' | 'onTime' | 'goodBehavior') => {
        setAttendance(prev => {
            const current = prev[memberId] || { present: false, onTime: false, goodBehavior: false };
            return {
                ...prev,
                [memberId]: { ...current, [field]: !current[field] }
            };
        });
    };

    const handleSave = async () => {
        if (!selectedClassId) return;

        setSaving(true);

        const attendanceToSave = Object.entries(attendance)
            .filter(([_, data]) => data.present)
            .map(([memberId, data]) => ({
                class_id: selectedClassId,
                member_id: memberId,
                status: 'Present',
                on_time: data.onTime,
                good_behavior: data.goodBehavior
            }));

        try {
            // 1. Delete old records
            const { error: deleteError } = await supabase
                .from('attendance')
                .delete()
                .eq('class_id', selectedClassId);

            if (deleteError) throw deleteError;

            // 2. Insert new records
            if (attendanceToSave.length > 0 && selectedClass) {
                const { error: insertError } = await supabase
                    .from('attendance')
                    .insert(attendanceToSave);

                if (insertError) throw insertError;

                // 3. Award XP/Points
                for (const rec of attendanceToSave) {
                    // Check if XP was already awarded for this member/class to avoid duplication
                    const { data: existingLog } = await supabase
                        .from('xp_logs')
                        .select('id')
                        .eq('member_id', rec.member_id)
                        .eq('reason', `Presença: ${selectedClass.title} (${selectedDate})`)
                        .single();

                    if (!existingLog) {
                        let totalXP = 10; // Base presence
                        let pointsReasons = ['Presença'];

                        if (rec.on_time) {
                            totalXP += 5;
                            pointsReasons.push('Pontualidade');
                        }
                        if (rec.good_behavior) {
                            totalXP += 5;
                            pointsReasons.push('Bom Comportamento');
                        }

                        const reasonStr = `Presença: ${selectedClass.title} (${selectedDate}) - [${pointsReasons.join(', ')}]`;

                        // Log XP
                        await supabase.from('xp_logs').insert({
                            member_id: rec.member_id,
                            amount: totalXP,
                            reason: reasonStr
                        });

                        // Update Member total XP
                        const { data: member } = await supabase.from('members').select('xp').eq('id', rec.member_id).single();
                        if (member) {
                            await supabase.from('members').update({ xp: (member.xp || 0) + totalXP }).eq('id', rec.member_id);
                        }
                    }
                }
            }

            alert('Frequência e Gamificação processadas com sucesso!');
        } catch (error: any) {
            console.error('Error saving attendance:', error);
            alert('Erro ao salvar frequência e Gamificação. Verifique o console.');
        } finally {
            setSaving(false);
        }
    };

    const translateBelt = (belt: string) => {
        const b = belt?.toLowerCase() || '';
        const mapper: Record<string, string> = {
            'white': 'Branca',
            'blue': 'Azul',
            'purple': 'Roxa',
            'brown': 'Marrom',
            'black': 'Preta',
            'gray': 'Cinza',
            'yellow': 'Amarela',
            'orange': 'Laranja',
            'green': 'Verde'
        };
        return mapper[b] || belt;
    };

    const getBeltColor = (belt: string) => {
        const b = belt?.toLowerCase() || '';
        if (b.includes('azul') || b === 'blue') return 'text-blue-500';
        if (b.includes('roxa') || b === 'purple') return 'text-purple-500';
        if (b.includes('marrom') || b === 'brown') return 'text-amber-700';
        if (b.includes('preta') || b === 'black') return 'text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]';
        if (b.includes('cinza') || b === 'gray') return 'text-slate-400';
        if (b.includes('amarela') || b === 'yellow') return 'text-yellow-400';
        if (b.includes('laranja') || b === 'orange') return 'text-orange-500';
        if (b.includes('verde') || b === 'green') return 'text-green-500';
        return 'text-slate-200';
    };

    const getBeltBg = (belt: string) => {
        const b = belt?.toLowerCase() || '';
        if (b.includes('branca') || b === 'white') return 'bg-white';
        if (b.includes('azul') || b === 'blue') return 'bg-blue-600';
        if (b.includes('roxa') || b === 'purple') return 'bg-purple-600';
        if (b.includes('marrom') || b === 'brown') return 'bg-[#422e25]';
        if (b.includes('preta') || b === 'black') return 'bg-black border-red-600 border-r-4';
        if (b.includes('cinza') || b === 'gray') return 'bg-slate-500';
        if (b.includes('amarela') || b === 'yellow') return 'bg-yellow-400';
        if (b.includes('laranja') || b === 'orange') return 'bg-orange-500';
        if (b.includes('verde') || b === 'green') return 'bg-green-600';
        return 'bg-slate-300';
    };

    const selectedClass = classes.find(c => c.id === selectedClassId);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-wrap justify-between items-end gap-3 mb-2">
                <div className="flex flex-col gap-2">
                    <h1 className="text-white text-3xl font-black leading-tight tracking-tight uppercase">Chamada de Alunos</h1>
                    <p className="text-muted text-base font-normal leading-normal">Registre a presença dos alunos nas aulas de hoje.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Filters Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-card p-6 rounded-2xl border border-border-slate space-y-6 shadow-sm">
                        <div className="space-y-4">
                            <label className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Data</span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none"
                                />
                            </label>

                            <label className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Aula / Horário</span>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    disabled={classes.length === 0}
                                    className="w-full rounded-xl text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all outline-none disabled:opacity-50"
                                >
                                    {classes.length === 0 ? (
                                        <option value="">Nenhuma aula para esta data</option>
                                    ) : (
                                        classes.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {new Date(c.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {c.title}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </label>
                        </div>

                        {selectedClass && (
                            <div className="pt-4 border-t border-border-slate space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Instrutor</p>
                                    <p className="text-white font-bold">{selectedClass.instructor}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Presentes</p>
                                        <p className="text-2xl font-black text-primary">
                                            {Object.values(attendance).filter(Boolean).length}
                                        </p>
                                    </div>
                                    <Link
                                        to="/agenda"
                                        className="p-2 bg-white/5 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-all"
                                        title="Editar Aula"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit_calendar</span>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={!selectedClassId || saving || loading}
                        className="w-full flex items-center justify-center gap-2 h-14 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(215,38,56,0.3)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined">{saving ? 'sync' : 'save_as'}</span>
                        {saving ? 'Salvando...' : 'Salvar Presenças'}
                    </button>
                </div>

                {/* Students List Card */}
                <div className="md:col-span-2">
                    <div className="bg-card rounded-3xl border border-border-slate overflow-hidden shadow-sm flex flex-col h-full max-h-[700px]">
                        <div className="p-6 border-b border-border-slate flex justify-between items-center bg-card/50 backdrop-blur-md sticky top-0 z-10">
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Lista de Alunos</h2>
                            <div className="flex gap-2">
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-extrabold border border-primary/20">
                                    {members.length} ATIVOS
                                </span>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            {loading ? (
                                <div className="p-20 flex flex-col items-center justify-center text-muted gap-4">
                                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="font-bold uppercase tracking-widest text-xs">Carregando dados...</p>
                                </div>
                            ) : members.length === 0 ? (
                                <div className="p-20 text-center text-muted">
                                    <span className="material-symbols-outlined text-5xl mb-4 block opacity-20">person_off</span>
                                    <p className="font-bold">Nenhum aluno encontrado ou aula não selecionada.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border-slate/30">
                                    {members.map((member) => (
                                        <div
                                            key={member.id}
                                            className={cn(
                                                "flex flex-col md:flex-row md:items-center justify-between p-4 px-6 border-l-4 transition-all hover:bg-white/5",
                                                attendance[member.id]?.present ? "bg-primary/5 border-primary" : "border-transparent"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 mb-4 md:mb-0" onClick={() => toggleStatus(member.id, 'present')}>
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm",
                                                    attendance[member.id]?.present ? "bg-primary text-white shadow-[0_0_15px_rgba(215,38,56,0.2)]" : "bg-zinc-800 text-muted"
                                                )}>
                                                    {member.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className={cn("font-bold text-sm", attendance[member.id]?.present ? "text-white" : "text-slate-300")}>
                                                        {member.full_name}
                                                    </p>
                                                    <div className="flex gap-2 items-center mt-1">
                                                        <span className={cn("size-2 rounded-full", getBeltBg(member.belt))} />
                                                        <span className={cn("text-[10px] font-black uppercase", getBeltColor(member.belt))}>
                                                            {translateBelt(member.belt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {/* Extra Points Controls */}
                                                <div className={cn(
                                                    "flex items-center gap-2 transition-opacity",
                                                    attendance[member.id]?.present ? "opacity-100" : "opacity-0 pointer-events-none"
                                                )}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleStatus(member.id, 'onTime'); }}
                                                        title="No Horário (+5 XP)"
                                                        className={cn(
                                                            "p-2 rounded-lg border transition-all flex items-center gap-1",
                                                            attendance[member.id]?.onTime
                                                                ? "bg-amber-500/20 border-amber-500/40 text-amber-500"
                                                                : "bg-white/5 border-white/10 text-muted hover:text-white"
                                                        )}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                                                        <span className="text-[10px] font-bold">HORÁRIO</span>
                                                    </button>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleStatus(member.id, 'goodBehavior'); }}
                                                        title="Comportamento (+5 XP)"
                                                        className={cn(
                                                            "p-2 rounded-lg border transition-all flex items-center gap-1",
                                                            attendance[member.id]?.goodBehavior
                                                                ? "bg-blue-500/20 border-blue-500/40 text-blue-500"
                                                                : "bg-white/5 border-white/10 text-muted hover:text-white"
                                                        )}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">verified</span>
                                                        <span className="text-[10px] font-bold">POSTURA</span>
                                                    </button>
                                                </div>

                                                <div
                                                    onClick={() => toggleStatus(member.id, 'present')}
                                                    className={cn(
                                                        "w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer",
                                                        attendance[member.id]?.present
                                                            ? "bg-primary border-primary text-white shadow-[0_0_10px_rgba(215,38,56,0.4)]"
                                                            : "border-border-slate text-transparent"
                                                    )}
                                                >
                                                    <span className="material-symbols-outlined text-xl">check</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
