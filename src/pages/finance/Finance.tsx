
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFinance } from '../../hooks/useFinance';
import { StatCard } from '../../components/shared/StatCard';

export function Finance() {
    const [filter, setFilter] = useState('all'); // all, pending, paid, overdue
    const { payments, stats, loading } = useFinance(filter);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'Pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'Overdue': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-white/5 text-slate-400 border-white/10';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Paid': return 'Pago';
            case 'Pending': return 'Pendente';
            case 'Overdue': return 'Atrasado';
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-white text-3xl font-black leading-tight tracking-tight">Financeiro</h1>
                    <p className="text-muted text-sm font-medium">Controle de mensalidades e lançamentos do Dojo.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-main rounded-lg p-1 border border-border-slate">
                        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'all' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-white'}`}>Todos</button>
                        <button onClick={() => setFilter('pending')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'pending' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-white'}`}>Pendentes</button>
                        <button onClick={() => setFilter('paid')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'paid' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-white'}`}>Pagos</button>
                    </div>
                    <Link to="/finance/new" className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold leading-normal tracking-wide hover:bg-primary-hover transition-all">
                        <span className="material-symbols-outlined mr-2 text-[20px]">add_card</span>
                        <span className="truncate">Novo Lançamento</span>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Recebido (Total)"
                    value={formatCurrency(stats.totalPaid)}
                    className="border-emerald-500/20"
                />
                <StatCard
                    label="Pendente"
                    value={formatCurrency(stats.totalPending)}
                    className="border-amber-500/20"
                    trendType="neutral"
                />
                <StatCard
                    label="Em Atraso"
                    value={formatCurrency(stats.totalOverdue)}
                    className="border-red-500/20"
                    trendType="negative"
                />
            </div>

            <div className="bg-card rounded-xl border border-border-slate shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-main/50 border-b border-border-slate">
                                <th className="px-4 md:px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider">Aluno</th>
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider hidden sm:table-cell">Descrição</th>
                                <th className="px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider hidden lg:table-cell">Vencimento</th>
                                <th className="px-4 md:px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider">Valor</th>
                                <th className="px-4 md:px-6 py-4 text-slate-200 text-xs font-bold uppercase tracking-wider text-center">Status</th>
                                <th className="px-4 md:px-6 py-4 text-slate-400 text-xs font-bold uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-slate/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted">Carregando financeiro...</td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted">Nenhum lançamento encontrado.</td>
                                </tr>
                            ) : (
                                payments.map((pay) => (
                                    <tr key={pay.id} className="hover:bg-main/30 transition-colors">
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white text-sm font-bold truncate max-w-[120px] sm:max-w-none">{pay.members?.full_name || 'Aluno Removido'}</span>
                                                <span className="text-[10px] text-muted sm:hidden uppercase font-bold tracking-wider">{pay.description}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <span className="text-slate-300 text-sm">{pay.description}</span>
                                            <span className="block text-[10px] text-muted uppercase tracking-wider">{pay.type}</span>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <span className="text-slate-300 text-sm font-medium">{formatDate(pay.due_date)}</span>
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            <span className="text-white text-sm font-bold">{formatCurrency(pay.amount)}</span>
                                            <span className="block text-[9px] text-muted lg:hidden font-bold">{formatDate(pay.due_date)}</span>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${getStatusColor(pay.status)}`}>
                                                {getStatusLabel(pay.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-right">
                                            <Link to={`/finance/edit/${pay.id}`} className="text-slate-400 hover:text-white transition-colors text-[18px] md:text-[20px] font-bold material-symbols-outlined">edit</Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
