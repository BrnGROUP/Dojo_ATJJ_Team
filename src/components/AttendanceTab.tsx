
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface AttendanceTabProps {
    classId: string;
    date: string;
    classTitle: string;
}

interface Member {
    id: string;
    full_name: string;
    belt: string;
    status: string;
    enrolled_classes: string[];
}

export function AttendanceTab({ classId, date, classTitle }: AttendanceTabProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [attendance, setAttendance] = useState<Record<string, { present: boolean, onTime: boolean, goodBehavior: boolean }>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (classId) {
            fetchMembersAndAttendance();
        }
    }, [classId]);

    const fetchMembersAndAttendance = async () => {
        setLoading(true);
        try {
            // Fetch active members
            const { data: membersData, error: membersError } = await supabase
                .from('members')
                .select('id, full_name, belt, status, enrolled_classes', { count: 'exact' })
                .eq('status', 'Active')
                .order('full_name', { ascending: true });

            if (membersError) throw membersError;
            setMembers(membersData || []);

            // Fetch existing attendance
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .select('member_id, status, on_time, good_behavior')
                .eq('class_id', classId);

            if (attendanceError) throw attendanceError;

            const initialAttendance: Record<string, { present: boolean, onTime: boolean, goodBehavior: boolean }> = {};
            attendanceData?.forEach((rec: any) => {
                initialAttendance[rec.member_id] = {
                    present: rec.status === 'Present',
                    onTime: rec.on_time,
                    goodBehavior: rec.good_behavior
                };
            });
            setAttendance(initialAttendance);

        } catch (error) {
            console.error('Error fetching attendance data:', error);
            toast.error('Erro ao carregar lista de presença.');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = (memberId: string, field: 'present' | 'onTime' | 'goodBehavior') => {
        setAttendance(prev => {
            const current = prev[memberId] || { present: false, onTime: false, goodBehavior: false };
            let updated = { ...current };

            if (field === 'present') {
                updated.present = !current.present;
                // If unmarking present, reset extras
                if (current.present) {
                    updated.onTime = false;
                    updated.goodBehavior = false;
                }
            } else {
                // If marking extra, ensure present is true
                updated[field] = !current[field];
                if (updated[field]) updated.present = true;
            }

            return { ...prev, [memberId]: updated };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        const attendanceToSave = Object.entries(attendance)
            .filter(([_, data]) => data.present)
            .map(([memberId, data]) => ({
                class_id: classId,
                member_id: memberId,
                status: 'Present',
                on_time: data.onTime,
                good_behavior: data.goodBehavior
            }));

        try {
            // 1. Delete old records
            await supabase.from('attendance').delete().eq('class_id', classId);

            // 2. Insert new records
            if (attendanceToSave.length > 0) {
                const { error } = await supabase.from('attendance').insert(attendanceToSave);
                if (error) throw error;
            }

            // 3. Process XP (Simplified for now - just ensure log exists)
            // Ideally this should be a backend trigger or robust service, keeping it client-side for now per existing architecture
            for (const rec of attendanceToSave) {
                const reasonStr = `Presença: ${classTitle} (${date})`;
                // Check duplicate log
                const { data: existing } = await supabase.from('xp_logs')
                    .select('id').eq('member_id', rec.member_id).like('reason', `${reasonStr}%`).single();

                if (!existing) {
                    let xp = 10;
                    if (rec.on_time) xp += 5;
                    if (rec.good_behavior) xp += 5;

                    await supabase.from('xp_logs').insert({
                        member_id: rec.member_id,
                        amount: xp,
                        reason: reasonStr
                    });

                    // Update total XP
                    const { data: m } = await supabase.from('members').select('xp').eq('id', rec.member_id).single();
                    if (m) {
                        await supabase.from('members').update({ xp: (m.xp || 0) + xp }).eq('id', rec.member_id);
                    }
                }
            }

            toast.success('Presença salva com sucesso!');
        } catch (error) {
            console.error('Error saving attendance:', error);
            toast.error('Erro ao salvar presença.');
        } finally {
            setSaving(false);
        }
    };

    const getBeltColor = (belt: string) => {
        const b = belt?.toLowerCase() || '';
        if (b.includes('azul') || b === 'blue') return 'text-blue-500';
        if (b.includes('roxa') || b === 'purple') return 'text-purple-500';
        if (b.includes('marrom') || b === 'brown') return 'text-amber-700';
        if (b.includes('preta') || b === 'black') return 'text-white border border-white/20 bg-black/50 px-2 rounded';
        return 'text-white/70';
    };

    const filteredMembers = members.filter(m =>
        m.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const presentCount = Object.values(attendance).filter(a => a.present).length;

    if (loading) return <div className="p-8 text-center text-muted">Carregando alunos...</div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-4 rounded-xl border border-border-slate">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-lg">search</span>
                        <input
                            type="text"
                            placeholder="Buscar aluno..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-main border border-border-slate rounded-lg pl-10 pr-4 py-2 text-white text-sm outline-none focus:border-primary"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-muted block">Presentes</span>
                        <span className="text-2xl font-black text-white">{presentCount} <span className="text-sm text-muted font-normal">/ {members.length}</span></span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <span className="animate-spin material-symbols-outlined">sync</span> : <span className="material-symbols-outlined">save</span>}
                        Salvar Chamada
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {filteredMembers.map(member => {
                    const status = attendance[member.id] || { present: false, onTime: false, goodBehavior: false };
                    return (
                        <div
                            key={member.id}
                            onClick={() => toggleStatus(member.id, 'present')}
                            className={cn(
                                "p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between group relative overflow-hidden",
                                status.present
                                    ? "bg-green-500/10 border-green-500/50"
                                    : "bg-card border-border-slate hover:border-white/20"
                            )}
                        >
                            <div className="flex items-center gap-3 z-10 relative">
                                <div className={cn(
                                    "w-5 h-5 rounded flex items-center justify-center border transition-colors",
                                    status.present
                                        ? "bg-green-500 border-green-500 text-white"
                                        : "border-muted group-hover:border-white"
                                )}>
                                    {status.present && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                                </div>
                                <div>
                                    <p className={cn("text-sm font-bold transition-colors", status.present ? "text-white" : "text-muted group-hover:text-white")}>
                                        {member.full_name}
                                    </p>
                                    <p className={cn("text-[10px] uppercase font-bold flex items-center gap-1", getBeltColor(member.belt))}>
                                        <span className="material-symbols-outlined text-[10px]">military_tech</span>
                                        {member.belt}
                                    </p>
                                </div>
                            </div>

                            {status.present && (
                                <div className="flex items-center gap-1 z-10 relative" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        onClick={() => toggleStatus(member.id, 'onTime')}
                                        className={cn(
                                            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors tooltip-trigger",
                                            status.onTime ? "bg-blue-500 text-white" : "bg-black/20 text-muted hover:text-white hover:bg-black/40"
                                        )}
                                        title="No Horário (+5 XP)"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toggleStatus(member.id, 'goodBehavior')}
                                        className={cn(
                                            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                                            status.goodBehavior ? "bg-yellow-500 text-white" : "bg-black/20 text-muted hover:text-white hover:bg-black/40"
                                        )}
                                        title="Bom Comportamento (+5 XP)"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
