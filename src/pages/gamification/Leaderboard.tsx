
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface Member {
    id: string;
    full_name: string;
    belt: string;
    xp: number;
    photo_url?: string;
}

type RankingType = 'xp_all_time' | 'xp_month' | 'frequency';

export function Leaderboard() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [rankingType, setRankingType] = useState<RankingType>('xp_all_time');

    useEffect(() => {
        fetchLeaderboard();
    }, [rankingType]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            if (rankingType === 'xp_all_time') {
                // All-time XP ranking
                const { data, error } = await supabase
                    .from('members')
                    .select('id, full_name, belt, xp, photo_url')
                    .order('xp', { ascending: false })
                    .limit(50);

                if (error) throw error;
                setMembers(data || []);

            } else if (rankingType === 'xp_month') {
                // XP gained in last 30 days
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const { data: logs } = await supabase
                    .from('xp_logs')
                    .select('member_id, amount')
                    .gte('created_at', thirtyDaysAgo.toISOString());

                const xpByMember = logs?.reduce((acc, log) => {
                    acc[log.member_id] = (acc[log.member_id] || 0) + log.amount;
                    return acc;
                }, {} as Record<string, number>) || {};

                const memberIds = Object.keys(xpByMember);
                if (memberIds.length === 0) {
                    setMembers([]);
                    return;
                }

                const { data: membersData } = await supabase
                    .from('members')
                    .select('id, full_name, belt, photo_url')
                    .in('id', memberIds);

                const rankedMembers = membersData?.map(m => ({
                    ...m,
                    xp: xpByMember[m.id] || 0
                }))
                    .sort((a, b) => b.xp - a.xp)
                    .slice(0, 50) || [];

                setMembers(rankedMembers);

            } else if (rankingType === 'frequency') {
                // Most frequent attendees in last 30 days
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const { data: attendance } = await supabase
                    .from('attendance')
                    .select('member_id')
                    .gte('created_at', thirtyDaysAgo.toISOString());

                const attendanceByMember = attendance?.reduce((acc, att) => {
                    acc[att.member_id] = (acc[att.member_id] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>) || {};

                const memberIds = Object.keys(attendanceByMember);
                if (memberIds.length === 0) {
                    setMembers([]);
                    return;
                }

                const { data: membersData } = await supabase
                    .from('members')
                    .select('id, full_name, belt, photo_url')
                    .in('id', memberIds);

                const rankedMembers = membersData?.map(m => ({
                    ...m,
                    xp: attendanceByMember[m.id] || 0 // Using xp field for display purposes
                })).sort((a, b) => b.xp - a.xp).slice(0, 50) || [];

                setMembers(rankedMembers);
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getBeltBg = (belt: string) => {
        const b = belt?.toLowerCase() || '';
        if (b.includes('branca')) return 'bg-white';
        if (b.includes('azul')) return 'bg-blue-600';
        if (b.includes('roxa')) return 'bg-purple-600';
        if (b.includes('marrom')) return 'bg-[#422e25]';
        if (b.includes('preta')) return 'bg-black border-red-600 border-r-4';
        if (b.includes('cinza')) return 'bg-slate-500';
        if (b.includes('amarela')) return 'bg-yellow-400';
        if (b.includes('laranja')) return 'bg-orange-500';
        if (b.includes('verde')) return 'bg-green-600';
        return 'bg-slate-300';
    };

    const getMedalColor = (index: number) => {
        if (index === 0) return 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]'; // Gold
        if (index === 1) return 'text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.5)]'; // Silver
        if (index === 2) return 'text-amber-700 drop-shadow-[0_0_10px_rgba(180,83,9,0.5)]'; // Bronze
        return 'text-slate-600';
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 space-y-8 animate-fade-in pb-24">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-yellow-500">trophy</span>
                        Ranking de Alunos
                    </h1>
                    <p className="text-muted mt-1">Os guerreiros mais dedicados do Dojo.</p>
                </div>
            </header>

            {/* Ranking Type Filters */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setRankingType('xp_all_time')}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2",
                        rankingType === 'xp_all_time'
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                            : "bg-card text-muted border-border-slate hover:border-primary/50 hover:text-white"
                    )}
                >
                    <span>👑</span>
                    <span>Top XP Geral</span>
                </button>
                <button
                    onClick={() => setRankingType('xp_month')}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2",
                        rankingType === 'xp_month'
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                            : "bg-card text-muted border-border-slate hover:border-primary/50 hover:text-white"
                    )}
                >
                    <span>🏆</span>
                    <span>XP do Mês</span>
                </button>
                <button
                    onClick={() => setRankingType('frequency')}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2",
                        rankingType === 'frequency'
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                            : "bg-card text-muted border-border-slate hover:border-primary/50 hover:text-white"
                    )}
                >
                    <span>🔥</span>
                    <span>Mais Frequentes</span>
                </button>
            </div>

            {/* Ranking Info */}
            <div className="bg-card rounded-2xl border border-border-slate p-4">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">
                        {rankingType === 'xp_all_time' && '👑'}
                        {rankingType === 'xp_month' && '🏆'}
                        {rankingType === 'frequency' && '🔥'}
                    </span>
                    <div>
                        <h2 className="text-white text-xl font-bold">
                            {rankingType === 'xp_all_time' && 'Campeões Gerais'}
                            {rankingType === 'xp_month' && 'Top XP do Mês'}
                            {rankingType === 'frequency' && 'Mais Frequentes'}
                        </h2>
                        <p className="text-sm text-muted">
                            {rankingType === 'xp_all_time' && 'Top XP de todos os tempos'}
                            {rankingType === 'xp_month' && 'Maior XP ganho nos últimos 30 dias'}
                            {rankingType === 'frequency' && 'Maior número de presenças no mês'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Top 3 Podium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-end">
                {/* 2nd Place */}
                {members[1] && (
                    <div className="md:order-1 bg-card/50 backdrop-blur-sm border border-border-slate rounded-3xl p-6 flex flex-col items-center relative overflow-hidden transform hover:-translate-y-1 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <span className="material-symbols-outlined text-9xl">military_tech</span>
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                            <span className="material-symbols-outlined text-5xl mb-2 text-slate-300 drop-shadow-[0_0_15px_rgba(203,213,225,0.3)]">military_tech</span>
                            <div className="w-20 h-20 rounded-full border-4 border-slate-300 bg-zinc-800 flex items-center justify-center mb-3 text-xl font-bold text-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.2)]">
                                {members[1].photo_url ? (
                                    <img src={members[1].photo_url} alt={members[1].full_name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    members[1].full_name.substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <h3 className="font-bold text-lg text-white text-center">{members[1].full_name}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={cn("inline-block w-3 h-3 rounded-full", getBeltBg(members[1].belt))}></span>
                                <span className="text-xs uppercase font-bold text-muted">{members[1].belt}</span>
                            </div>
                            <div className="mt-4 bg-slate-500/10 px-4 py-1 rounded-full border border-slate-500/20">
                                <span className="font-black text-slate-300">{members[1].xp.toLocaleString()} XP</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 1st Place */}
                {members[0] && (
                    <div className="md:order-2 bg-gradient-to-b from-yellow-500/10 to-card/50 backdrop-blur-sm border border-yellow-500/30 rounded-3xl p-8 flex flex-col items-center relative overflow-hidden transform scale-110 shadow-[0_0_40px_rgba(234,179,8,0.1)] z-10">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-9xl">emoji_events</span>
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                            <span className="material-symbols-outlined text-6xl mb-2 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]">emoji_events</span>
                            <div className="w-24 h-24 rounded-full border-4 border-yellow-400 bg-zinc-800 flex items-center justify-center mb-4 text-2xl font-bold text-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                                {members[0].photo_url ? (
                                    <img src={members[0].photo_url} alt={members[0].full_name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    members[0].full_name.substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <h3 className="font-black text-xl text-white text-center">{members[0].full_name}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={cn("inline-block w-3 h-3 rounded-full", getBeltBg(members[0].belt))}></span>
                                <span className="text-xs uppercase font-bold text-muted">{members[0].belt}</span>
                            </div>
                            <div className="mt-4 bg-yellow-500/20 px-6 py-2 rounded-full border border-yellow-500/30">
                                <span className="font-black text-yellow-400 text-lg">{members[0].xp.toLocaleString()} XP</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3rd Place */}
                {members[2] && (
                    <div className="md:order-3 bg-card/50 backdrop-blur-sm border border-border-slate rounded-3xl p-6 flex flex-col items-center relative overflow-hidden transform hover:-translate-y-1 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <span className="material-symbols-outlined text-9xl">military_tech</span>
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                            <span className="material-symbols-outlined text-5xl mb-2 text-amber-700 drop-shadow-[0_0_15px_rgba(180,83,9,0.3)]">military_tech</span>
                            <div className="w-20 h-20 rounded-full border-4 border-amber-700 bg-zinc-800 flex items-center justify-center mb-3 text-xl font-bold text-amber-700 shadow-[0_0_20px_rgba(180,83,9,0.2)]">
                                {members[2].photo_url ? (
                                    <img src={members[2].photo_url} alt={members[2].full_name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    members[2].full_name.substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <h3 className="font-bold text-lg text-white text-center">{members[2].full_name}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={cn("inline-block w-3 h-3 rounded-full", getBeltBg(members[2].belt))}></span>
                                <span className="text-xs uppercase font-bold text-muted">{members[2].belt}</span>
                            </div>
                            <div className="mt-4 bg-amber-700/10 px-4 py-1 rounded-full border border-amber-700/20">
                                <span className="font-black text-amber-700">{members[2].xp.toLocaleString()} XP</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Rest of the Leaderboard */}
            <div className="bg-card rounded-3xl border border-border-slate overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-border-slate">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-widest w-20">#</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-widest">Aluno</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-widest">Faixa</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold text-muted uppercase tracking-widest">
                                    {rankingType === 'frequency' ? 'Presenças' : 'XP'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-slate/50">
                            {members.slice(3).map((member, index) => (
                                <tr key={member.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={cn("font-black text-lg", getMedalColor(index + 3))}>{index + 4}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-muted border border-border-slate">
                                                {member.photo_url ? (
                                                    <img src={member.photo_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    member.full_name.substring(0, 2).toUpperCase()
                                                )}
                                            </div>
                                            <span className="font-bold text-white">{member.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("inline-block w-2 h-2 rounded-full", getBeltBg(member.belt))}></span>
                                            <span className="text-xs uppercase font-medium text-slate-300">{member.belt}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-black text-primary">{member.xp.toLocaleString()} XP</span>
                                    </td>
                                </tr>
                            ))}
                            {members.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted">Ainda não há dados suficientes para o ranking.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
