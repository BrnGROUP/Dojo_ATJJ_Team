
import { useDashboard } from '../hooks/useDashboard';
import { DynamicDiv } from '../components/DynamicDiv';
import { getBeltColor } from '../lib/ui-utils';
import { BeltAvatar } from '../components/shared/BeltAvatar';
import { StatCard } from '../components/shared/StatCard';

export function Dashboard() {
    const { stats, recentMembers, topStudents, birthdays, classes, highlightStudent, loading } = useDashboard();

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

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total de Alunos" value={stats.totalStudents} trend="+12%" />
                <StatCard label="Aulas no Mês" value="42" trend="ESTÁVEL" trendType="neutral" />
                <StatCard label="Média de XP" value="1,240" trend="+8%" />
                <StatCard label="Faturamento (Est.)" value={`R$ ${(stats.monthlyRevenue / 1000).toFixed(1)}k`} trend="+5%" />
            </div>

            <div className="bg-card rounded-3xl p-4 sm:p-8 border border-border-slate shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Mural de Destaques</h2>
                        <p className="text-muted text-xs sm:text-sm font-medium leading-normal">Reconhecimento e conquistas da semana</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Novos Membros */}
                    <div className="lg:col-span-6 flex flex-col">
                        <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-sm">person_add</span>
                            Novos Integrantes
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {recentMembers.map((member) => (
                                <div key={member.id} className="flex items-center gap-4 p-4 rounded-2xl bg-main border border-border-slate hover:border-primary/50 transition-all group shadow-sm">
                                    <BeltAvatar name={member.full_name} belt={member.belt} size="lg" />
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
                                        <BeltAvatar name={highlightStudent.full_name} belt={highlightStudent.belt} size="xl" />
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
                                    <BeltAvatar name={b.full_name} belt={b.belt} size="md" showGlow={false} />
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
                                            <tr key={c.id} className="hover:bg-main/20 transition-colors group">
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
                                                        <div className="w-16 sm:w-24 bg-main h-1.5 rounded-full overflow-hidden border border-border-slate">
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
                        <div className="mb-8 p-4 bg-main rounded-2xl border border-border-slate">
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Caminho Suave</p>
                                    <h3 className="text-xl font-black text-white">Nível 42</h3>
                                </div>
                                <span className="text-[9px] font-bold text-muted px-2 py-0.5 bg-card rounded-lg">75%</span>
                            </div>
                            <div className="h-2 w-full bg-card rounded-full overflow-hidden border border-border-slate">
                                <div className="h-full bg-gradient-to-r from-primary to-primary/40 rounded-full w-[75%] shadow-[0_0_10px_rgba(215,38,54,0.3)]"></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {topStudents.slice(0, 4).map((student, index) => (
                                <div key={student.id} className="flex items-center justify-between group p-2 hover:bg-main/50 rounded-2xl transition-all border border-transparent hover:border-border-slate">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 text-[10px] font-black ${index === 0 ? 'text-yellow-400' : 'text-muted'} italic`}>{(index + 1).toString().padStart(2, '0')}</div>
                                        <BeltAvatar name={student.full_name} belt={student.belt} size="md" className={index === 0 ? 'ring-2 ring-yellow-400/30' : ''} />
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-white truncate max-w-[120px]">{student.full_name}</p>
                                            <p className={`text-[9px] font-black uppercase ${getBeltColor(student.belt)}`}>{student.belt}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-white bg-main border border-border-slate px-2 py-1 rounded-lg tabular-nums">{student.xp} XP</span>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
                            Ver Placar de Líderes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
