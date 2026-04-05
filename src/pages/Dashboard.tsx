import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useDashboard } from '../hooks/useDashboard';
import { useFinanceAlerts } from '../hooks/useFinanceAlerts';
import { DynamicDiv } from '../components/DynamicDiv';
import { getBeltColor, calculateLevel } from '../lib/ui-utils';
import { BeltAvatar } from '../components/shared/BeltAvatar';
import { StatCard } from '../components/shared/StatCard';

// Extrai primeiro e segundo nome
function getDisplayName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts.slice(0, 2).join(' ');
}

export function Dashboard() {
    const navigate = useNavigate();
    const { stats, recentMembers, topStudents, birthdays, classes, highlightStudent, loading } = useDashboard();
    const { overdueMembers } = useFinanceAlerts();
    const { profile } = useAuth();
    const isStudent = profile?.role === 'student';
    const displayName = getDisplayName(profile?.full_name || 'Guerreiro');

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted text-sm font-medium animate-pulse">Carregando métricas reais...</p>
                </div>
            </div>
        );
    }

    if (isStudent) {
        return (
            <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
                {/* Cabeçalho de Boas Vindas Personalizado */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900/40 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-6">
                        <BeltAvatar
                            name={(profile?.member as any)?.full_name || profile?.full_name || 'Usuário'}
                            belt={String((profile?.member as any)?.belt || 'Branca')}
                            size="xl"
                            avatarUrl={(profile?.member as any)?.avatar_url || profile?.avatar_url}
                            showGlow={true}
                        />
                        <div>
                            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                                OSS, {displayName}!
                            </h1>
                            <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mt-1">Sua jornada no tatame continua.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-main border border-border-slate p-4 rounded-2xl text-center min-w-[100px]">
                            <p className="text-[10px] text-muted font-bold uppercase mb-1">Seu XP</p>
                            <p className="text-xl font-black text-white tabular-nums">{Number(profile?.member?.xp) || 0}</p>
                        </div>
                        <div className="bg-main border border-border-slate p-4 rounded-2xl text-center min-w-[100px]">
                            <p className="text-[10px] text-muted font-bold uppercase mb-1">Nível</p>
                            <p className="text-xl font-black text-white tabular-nums">{calculateLevel(Number(profile?.member?.xp) || 0).level}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Próximas Aulas */}
                    <div className="lg:col-span-8 flex flex-col space-y-6">
                        <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">calendar_month</span>
                            Minha Agenda de Hoje
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {classes.length > 0 ? classes.map(c => (
                                <div key={c.id} className="bg-card border border-border-slate p-6 rounded-3xl hover:border-primary/50 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-main flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-3xl">exercise</span>
                                        </div>
                                        <span className="text-[10px] font-black text-white bg-primary px-3 py-1 rounded-lg">
                                            {new Date(c.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-1">{c.title}</h4>
                                    <p className="text-xs text-muted font-medium mb-4">{c.instructor}</p>
                                    <button className="w-full py-2 bg-main border border-border-slate rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-primary transition-colors">Marcar Presença</button>
                                </div>
                            )) : (
                                <div className="col-span-full p-12 text-center bg-white/5 rounded-3xl border border-dashed border-border-slate">
                                    <p className="text-muted text-sm italic">Nenhuma aula programada para hoje.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Situação Financeira / Planos */}
                    <div className="lg:col-span-4 space-y-6">
                        <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500 text-sm">shield_person</span>
                            Minha Graduação
                        </h3>
                        <div className="bg-card border border-border-slate p-8 rounded-3xl text-center space-y-6 relative overflow-hidden">
                            {/* Background Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/10 blur-3xl -z-10 rounded-full"></div>

                            <div className="flex justify-center">
                                <div className="relative">
                                    <BeltAvatar
                                        name={(profile?.member as any)?.full_name || profile?.full_name || 'Aluno'}
                                        belt={String((profile?.member as any)?.belt || 'Branca')}
                                        size="xl"
                                        avatarUrl={(profile?.member as any)?.avatar_url || profile?.avatar_url}
                                    />
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-main text-[8px] font-black px-3 py-0.5 rounded-full border-2 border-card uppercase whitespace-nowrap">
                                        Faixa {(profile?.member as any)?.belt || 'Branca'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold text-muted uppercase tracking-widest">
                                    <span>Progresso atual</span>
                                    <span>{Math.floor(calculateLevel(Number(profile?.member?.xp) || 0).progress)}%</span>
                                </div>
                                <div className="h-2 w-full bg-main rounded-full overflow-hidden p-[1px]">
                                    <DynamicDiv
                                        className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(215,38,54,0.3)]"
                                        dynamicStyle={{ width: `${calculateLevel(Number(profile?.member?.xp) || 0).progress}%` }}
                                    />
                                </div>
                            </div>

                            <button className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
                                Ver Requisitos de Troca
                            </button>
                        </div>
                    </div>
                </div>

                {/* Ranking Contextual */}
                <div className="bg-card border border-border-slate rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Ranking de Elite</h3>
                            <p className="text-muted text-xs font-medium">Veja quem está dominando o tatame este mês</p>
                        </div>
                        <Link to="/gamification/leaderboard" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Ver Tabela Completa</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {topStudents.slice(0, 3).map((student, idx) => (
                            <div key={student.id} className={`p-6 rounded-2xl border ${idx === 0 ? 'bg-primary/5 border-primary/20' : 'bg-main border-border-slate'} flex items-center gap-4`}>
                                <span className={`text-xl font-black italic ${idx === 0 ? 'text-primary' : 'text-muted'}`}>#{idx + 1}</span>
                                <BeltAvatar
                                    name={student.full_name}
                                    belt={student.belt}
                                    size="md"
                                    showGlow={idx === 0}
                                    avatarUrl={student.avatar_url}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{student.full_name}</p>
                                    <p className="text-[10px] text-muted font-bold uppercase">{student.xp} XP</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4 gap-6">
                <StatCard label="Total de Alunos" value={stats.totalStudents} trend="+12%" />
                <StatCard label="Alunos Ativos" value={stats.activeStudents} trend="ESTÁVEL" trendType="neutral" />
                <StatCard label="Mensalidades em Atraso" value={overdueMembers.length} trend={overdueMembers.length > 0 ? "ATENÇÃO" : "OK"} trendType={overdueMembers.length > 0 ? "negative" : "positive"} />
                <StatCard
                    label="Faturamento Mensal"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlyRevenue)}
                    trend="+15%"
                />
            </div>

            {overdueMembers.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 sm:p-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="material-symbols-outlined text-red-500">warning</span>
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Pendências Críticas</h2>
                    </div>
                    <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4 custom-scrollbar">
                        {overdueMembers.map(member => (
                            <div key={member.id} className="flex-none w-[280px] bg-main border border-red-500/10 p-4 rounded-2xl flex items-center gap-3 hover:border-red-500/30 transition-all">
                                <BeltAvatar
                                    name={member.full_name}
                                    belt={member.belt}
                                    size="sm"
                                    showGlow={false}
                                    avatarUrl={member.avatar_url}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white uppercase truncate">{member.full_name}</p>
                                    <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">
                                        Vencimento: Dia {member.billing_day}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-red-500 text-sm animate-pulse">priority_high</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-card rounded-3xl p-4 sm:p-8 border border-border-slate shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Mural de Destaques</h2>
                        <p className="text-muted text-xs sm:text-sm font-medium leading-normal">Reconhecimento e conquistas da semana</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Novos Membros */}
                    <div className="xl:col-span-6 flex flex-col">
                        <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-sm">person_add</span>
                            Novos Integrantes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recentMembers.map((member) => (
                                <div key={member.id} className="flex items-center gap-4 p-4 rounded-2xl bg-main border border-border-slate hover:border-primary/50 transition-all group shadow-sm">
                                    <BeltAvatar
                                        name={member.full_name}
                                        belt={member.belt}
                                        size="lg"
                                        avatarUrl={member.avatar_url}
                                    />
                                    <div>
                                        <p className="font-bold text-white text-sm leading-tight">{member.full_name}</p>
                                        <span className={`text-[10px] font-black uppercase ${getBeltColor(member.belt)}`}>Faixa {member.belt}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Aluno Destaque */}
                    <div className="lg:col-span-3 flex flex-col">
                        <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-yellow-500 text-sm">stars</span>
                            Mestre do Tatame
                        </h3>
                        <div className="bg-gradient-to-br from-primary/10 to-transparent rounded-3xl p-6 text-center border border-primary/20 flex-1 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                            {highlightStudent ? (
                                <div className="relative z-10 w-full flex flex-col items-center">
                                    <div className="relative inline-block mb-4">
                                        <BeltAvatar
                                            name={highlightStudent.full_name}
                                            belt={highlightStudent.belt}
                                            size="xl"
                                            avatarUrl={highlightStudent.avatar_url}
                                        />
                                        <div className="absolute -bottom-1 right-0 bg-yellow-400 text-main font-black text-[9px] px-2 py-0.5 rounded-full border-2 border-card">#1 XP</div>
                                    </div>
                                    <h4 className="text-base sm:text-lg font-bold text-white leading-tight">{highlightStudent.full_name}</h4>
                                    <p className="text-primary font-black text-[11px] uppercase tracking-wider mt-1">{highlightStudent.xp} Total XP</p>
                                </div>
                            ) : (
                                <p className="text-muted text-sm italic">Processando dados...</p>
                            )}
                        </div>
                    </div>

                    {/* Aniversariantes */}
                    <div className="lg:col-span-3 flex flex-col">
                        <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-pink-500 text-sm">cake</span>
                            Aniversários
                        </h3>
                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[200px] sm:max-h-none">
                            {birthdays.length > 0 ? birthdays.map(b => (
                                <div key={b.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border-slate bg-main/30 shadow-sm">
                                    <BeltAvatar
                                        name={b.full_name}
                                        belt={b.belt}
                                        size="md"
                                        showGlow={false}
                                        avatarUrl={b.avatar_url}
                                    />
                                    <div className="flex-1">
                                        <p className="text-xs sm:text-sm font-bold text-white truncate">{b.full_name}</p>
                                        <p className="text-[10px] text-muted font-bold">{new Date(b.birth_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-pink-500 text-lg">celebration</span>
                                </div>
                            )) : (
                                <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-border-slate">
                                    <p className="text-muted text-xs font-medium">Sem aniversários no período.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 pb-10">
                {/* Agenda */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-white tracking-tight uppercase">Agenda de Hoje</h2>
                        <button className="text-primary font-bold text-xs hover:brightness-125 transition-all">Ver Detalhes</button>
                    </div>
                    <div className="bg-card rounded-3xl border border-border-slate overflow-hidden shadow-sm">
                        <div className="overflow-x-auto overflow-y-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-main/40 border-b border-border-slate">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest whitespace-nowrap">Hora</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest whitespace-nowrap">Aula / Modalidade</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest hidden md:table-cell">Instrutor</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Ocupação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-slate/50">
                                    {classes.map(c => {
                                        const startTime = new Date(c.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        const occupancy = Math.round((c.enrolled_count / c.max_students) * 100);
                                        return (
                                            <tr
                                                key={c.id}
                                                onClick={() => navigate(`/agenda/edit/${c.id}`)}
                                                className="hover:bg-main/40 transition-all group cursor-pointer border-b border-border-slate last:border-0"
                                            >
                                                <td className="px-6 py-4 text-sm font-bold text-white whitespace-nowrap">{startTime}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs sm:text-sm font-bold text-white group-hover:text-primary transition-colors">{c.title}</span>
                                                        <span className="text-[9px] font-black text-muted uppercase mt-0.5">{c.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-muted hidden md:table-cell">{c.instructor}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="inline-flex items-center gap-3">
                                                        <div className="w-16 sm:w-24 bg-card h-2 rounded-full overflow-hidden border border-border-slate">
                                                            <DynamicDiv
                                                                className="bg-primary h-full progress-fill shadow-[0_0_8px_rgba(215,38,54,0.4)]"
                                                                dynamicStyle={{ '--w': `${occupancy}%` }}
                                                            ></DynamicDiv>
                                                        </div>
                                                        <span className="text-[10px] font-black text-white">{occupancy}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Ranking */}
                <div className="xl:col-span-4 space-y-6">
                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Ranking Elite</h2>
                    <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border-slate shadow-sm">
                        {highlightStudent && (() => {
                            const { level, progress } = calculateLevel(highlightStudent.xp);
                            return (
                                <div className="mb-8 p-4 bg-main rounded-2xl border border-border-slate">
                                    <div className="flex justify-between items-end mb-3">
                                        <div>
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{highlightStudent.full_name}</p>
                                            <h3 className="text-xl font-black text-white">Nível {level}</h3>
                                        </div>
                                        <span className="text-[9px] font-bold text-muted px-2 py-0.5 bg-card rounded-lg">{Math.floor(progress)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-card rounded-full overflow-hidden border border-border-slate">
                                        <DynamicDiv
                                            className="h-full bg-gradient-to-r from-primary to-primary/40 rounded-full shadow-[0_0_10px_rgba(215,38,54,0.3)] transition-all duration-1000"
                                            dynamicStyle={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })()}
                        <div className="space-y-4">
                            {topStudents.slice(0, 4).map((student, index) => (
                                <div key={student.id} className="flex items-center justify-between group p-2 hover:bg-main/50 rounded-2xl transition-all border border-transparent hover:border-border-slate">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 text-[10px] font-black ${index === 0 ? 'text-yellow-400' : 'text-muted'} italic`}>{(index + 1).toString().padStart(2, '0')}</div>
                                        <BeltAvatar
                                            name={student.full_name}
                                            belt={student.belt}
                                            size="md"
                                            className={index === 0 ? 'ring-2 ring-yellow-400/30' : ''}
                                            avatarUrl={student.avatar_url}
                                        />
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-white truncate max-w-[120px]">{student.full_name}</p>
                                            <p className={`text-[9px] font-black uppercase ${getBeltColor(student.belt)}`}>{student.belt}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-white bg-main border border-border-slate px-2 py-1 rounded-lg tabular-nums">{student.xp} XP</span>
                                        <span className="text-[8px] font-bold text-muted uppercase mt-1">Lvl {calculateLevel(student.xp).level}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link to="/gamification/leaderboard">
                            <button className="w-full mt-8 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
                                Ver Placar de Líderes
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
