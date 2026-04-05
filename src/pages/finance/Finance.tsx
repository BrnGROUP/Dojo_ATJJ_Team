import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFinance } from '../../hooks/useFinance';
import { StatCard } from '../../components/shared/StatCard';
import { DynamicDiv } from '../../components/DynamicDiv';
import { toast } from 'react-hot-toast';

export function Finance() {
    const [filter, setFilter] = useState('all'); // all, pending, paid, overdue
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [period, setPeriod] = useState<'month' | 'semester1' | 'semester2' | 'year'>('month');
    const [page, setPage] = useState(1);
    
    const { payments, stats, totalCount, loading, deletePayment, markAsPaid, generateMonthlyFees } = useFinance(filter, selectedMonth, selectedYear, page, 50, period);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        setPage(1);
    }, [filter, selectedMonth, selectedYear, period]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === payments.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(payments.map(p => p.id));
        }
    };

    const handleBulkMarkAsPaid = async () => {
        if (!window.confirm(`Deseja marcar ${selectedIds.length} lançamentos como pagos?`)) return;
        try {
            await markAsPaid(selectedIds);
            toast.success(`${selectedIds.length} lançamentos atualizados!`);
            setSelectedIds([]);
        } catch (err) {
            toast.error('Erro ao atualizar lançamentos.');
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Deseja excluir ${selectedIds.length} lançamentos? Esta ação é irreversível.`)) return;
        try {
            await deletePayment(selectedIds);
            toast.success(`${selectedIds.length} lançamentos excluídos!`);
            setSelectedIds([]);
        } catch (err) {
            toast.error('Erro ao excluir lançamentos.');
        }
    };

    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const years = Array.from({ length: 8 }, (_, i) => now.getFullYear() - 2 + i);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        // Evita fuso horário ao usar string simples YYYY-MM-DD
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const [y, m, d] = parts;
            return `${d}/${m}/${y}`;
        }
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'Monthly': 'Mensalidade',
            'Mensalidade': 'Mensalidade',
            'Product': 'Produto',
            'Produto': 'Produto',
            'Registration': 'Matrícula',
            'Matrícula': 'Matrícula',
            'Event': 'Evento',
            'Evento': 'Evento'
        };
        return labels[type] || type;
    };

    const handleGenerateMonthlyFees = async () => {
        const monthName = months[selectedMonth - 1];
        if (!window.confirm(`Deseja gerar a mensalidade de ${monthName}/${selectedYear} para todos os alunos ativos que ainda não possuem lançamento?`)) return;
        
        setGenerating(true);
        try {
            const result = await generateMonthlyFees(selectedYear, selectedMonth);
            if (result.count > 0) {
                toast.success(`${result.count} mensalidades geradas para ${monthName}!`);
            } else {
                if (result.reason === 'no_active_members') {
                    toast.error('Nenhum aluno ativo encontrado no sistema.');
                } else {
                    toast.success(`Todos os alunos já possuem lançamento para ${monthName}.`);
                }
            }
        } catch (err: any) {
            toast.error('Erro ao gerar mensalidades.');
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Deseja realmente excluir este lançamento?')) return;
        try {
            await deletePayment(id);
            toast.success('Lançamento excluído!');
        } catch (err: any) {
            toast.error('Erro ao excluir lançamento.');
        }
    };

    const handleMarkAsPaid = async (id: string) => {
        if (!window.confirm('Confirmar recebimento deste valor?')) return;
        try {
            await markAsPaid(id);
            toast.success('Lançamento marcado como pago!');
        } catch (err: any) {
            toast.error('Erro ao atualizar lançamento.');
        }
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
                <div className="flex flex-wrap gap-3">
                    {selectedIds.length > 0 && (
                        <div className="flex bg-main border border-primary/30 rounded-lg p-1 h-10 items-center overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                             <div className="px-3 border-r border-border-slate">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest whitespace-nowrap">
                                    {selectedIds.length} selecionados
                                </span>
                             </div>
                             <button 
                                onClick={handleBulkMarkAsPaid}
                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-emerald-500/10 text-emerald-500 transition-colors"
                             >
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Marcar Pago</span>
                             </button>
                             <button 
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 text-red-500 transition-colors"
                             >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Excluir</span>
                             </button>
                        </div>
                    )}

                    <div className="flex bg-main rounded-lg p-1 border border-border-slate h-10">
                        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'all' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-white'}`}>Todos</button>
                        <button onClick={() => setFilter('pending')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'pending' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-white'}`}>Pendentes</button>
                        <button onClick={() => setFilter('paid')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'paid' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-white'}`}>Pagos</button>
                        <button onClick={() => setFilter('overdue')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'overdue' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-white'}`}>Atrasados</button>
                    </div>

                    <div className="flex bg-main rounded-lg p-1 border border-border-slate h-10 gap-1">
                        <select 
                            value={period} 
                            onChange={(e) => setPeriod(e.target.value as any)}
                            title="Período de Visualização"
                            className="bg-transparent text-white text-[10px] font-black uppercase outline-none px-1 cursor-pointer border-r border-border-slate/30 mr-1"
                        >
                            <option value="month" className="bg-zinc-900">Mensal</option>
                            <option value="semester1" className="bg-zinc-900">1º Semestre</option>
                            <option value="semester2" className="bg-zinc-900">2º Semestre</option>
                            <option value="year" className="bg-zinc-900">Anual</option>
                        </select>

                        {period === 'month' && (
                            <select 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                title="Mês da Mensalidade"
                                className="bg-transparent text-white text-xs font-bold outline-none px-1 cursor-pointer"
                            >
                                {months.map((m, i) => (
                                    <option key={m} value={i + 1} className="bg-zinc-900">{m}</option>
                                ))}
                            </select>
                        )}
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            title="Ano da Mensalidade"
                            className="bg-transparent text-white text-xs font-bold outline-none px-1 cursor-pointer"
                        >
                            {years.map(y => (
                                <option key={y} value={y} className="bg-zinc-900">{y}</option>
                            ))}
                        </select>
                    </div>

                    {period === 'month' && (
                        <button
                            onClick={handleGenerateMonthlyFees}
                            disabled={generating}
                            className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-white/5 border border-border-slate text-slate-300 text-sm font-bold hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generating ? (
                                <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2"></span>
                            ) : (
                                <span className="material-symbols-outlined mr-2 text-[20px]">sync</span>
                            )}
                            <span>Mensalidades do Mês</span>
                        </button>
                    )}

                    <Link to="/finance/new" className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold leading-normal tracking-wide hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined mr-2 text-[20px]">add_card</span>
                        <span className="truncate">Novo Lançamento</span>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4 gap-6">
                <StatCard
                    label={period === 'month' ? "Recebido (Mês)" : "Recebido (Total)"}
                    value={formatCurrency(stats.totalPaid)}
                    className="border-emerald-500/20"
                    trendType="positive"
                    trend="Confirmado"
                />
                <StatCard
                    label={period === 'month' ? "Previsão Próx. Mês" : "Lançado no Período"}
                    value={formatCurrency(stats.projectedRevenue)}
                    className="border-blue-500/20"
                    trendType="neutral"
                    trend="Meta"
                />
                <StatCard
                    label="Em Atraso"
                    value={formatCurrency(stats.totalOverdue)}
                    className="border-red-500/20"
                    trendType="negative"
                    trend="Atrasado"
                />
                <div className="bg-card rounded-3xl border border-border-slate p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="material-symbols-outlined text-4xl">monitoring</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Taxa de Conversão</p>
                        <h4 className="text-2xl font-black text-white italic">
                            {stats.projectedRevenue > 0
                                ? Math.round((stats.totalPaid / stats.projectedRevenue) * 100)
                                : 0}%
                        </h4>
                        <div className="w-full h-1 bg-main rounded-full mt-2 overflow-hidden">
                            <DynamicDiv
                                className="h-full bg-primary"
                                dynamicStyle={{ width: `${stats.projectedRevenue > 0 ? (stats.totalPaid / stats.projectedRevenue) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border-slate shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-slate">
                                <th className="w-12 text-left py-4 px-4">
                                    <input 
                                        type="checkbox" 
                                        title="Selecionar Todos"
                                        className="w-4 h-4 rounded border-border-slate bg-main text-primary focus:ring-primary/30 cursor-pointer"
                                        checked={payments.length > 0 && selectedIds.length === payments.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="text-left py-4 px-4 text-muted text-[10px] font-black uppercase tracking-widest">Aluno</th>
                                <th className="text-left py-4 px-4 text-muted text-[10px] font-black uppercase tracking-widest">Descrição</th>
                                <th className="text-left py-4 px-4 text-muted text-[10px] font-black uppercase tracking-widest">Vencimento</th>
                                <th className="text-left py-4 px-4 text-muted text-[10px] font-black uppercase tracking-widest text-right">Valor</th>
                                <th className="text-center py-4 px-4 text-muted text-[10px] font-black uppercase tracking-widest">Status</th>
                                <th className="text-right py-4 px-4 text-muted text-[10px] font-black uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-slate/10">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-muted">Carregando financeiro...</td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-muted">Nenhum lançamento encontrado.</td>
                                </tr>
                            ) : (
                                payments.map((pay) => (
                                    <tr key={pay.id} className="hover:bg-main/30 transition-colors">
                                        <td className="py-4 px-4">
                                            <input 
                                                type="checkbox" 
                                                title={`Selecionar ${pay.members?.full_name}`}
                                                className="w-4 h-4 rounded border-border-slate bg-main text-primary focus:ring-primary/30 cursor-pointer"
                                                checked={selectedIds.includes(pay.id)}
                                                onChange={() => toggleSelect(pay.id)}
                                            />
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white text-sm font-bold truncate max-w-[120px] sm:max-w-none">{pay.members?.full_name || 'Aluno Removido'}</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] text-muted sm:hidden uppercase font-bold tracking-wider">{pay.description}</span>
                                                    <span className="text-[9px] bg-white/5 text-slate-500 px-1 rounded sm:hidden">{pay.type}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <div className="flex items-start gap-2">
                                                <span className="material-symbols-outlined text-muted text-sm mt-0.5">
                                                    {pay.type === 'Mensalidade' ? 'payments' : 'reorder'}
                                                </span>
                                                <div>
                                                    <span className="text-slate-300 text-sm font-medium">{pay.description}</span>
                                                    <span className="block text-[10px] text-muted uppercase tracking-wider font-bold">{getTypeLabel(pay.type)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <span className="material-symbols-outlined text-sm opacity-50">calendar_month</span>
                                                <span className="text-sm font-medium">{formatDate(pay.due_date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white text-sm font-black italic">{formatCurrency(pay.amount)}</span>
                                                <span className="text-[9px] text-muted lg:hidden font-bold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[10px]">event</span>
                                                    {formatDate(pay.due_date)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${getStatusColor(pay.status)}`}>
                                                {getStatusLabel(pay.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 md:gap-3">
                                                {pay.status !== 'Paid' && (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(pay.id)}
                                                        className="text-emerald-500 hover:text-emerald-400 transition-colors material-symbols-outlined text-[20px] md:text-[22px]"
                                                        title="Marcar como Pago"
                                                    >
                                                        check_circle
                                                    </button>
                                                )}
                                                <Link
                                                    to={`/finance/edit/${pay.id}`}
                                                    className="text-slate-400 hover:text-white transition-colors material-symbols-outlined text-[20px] md:text-[22px]"
                                                    title="Editar"
                                                >
                                                    edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(pay.id)}
                                                    className="text-slate-500 hover:text-red-500 transition-colors material-symbols-outlined text-[20px] md:text-[22px]"
                                                    title="Excluir"
                                                >
                                                    delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="px-6 py-4 border-t border-border-slate flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">
                        {totalCount} REGISTROS ENCONTRADOS
                    </span>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="flex items-center gap-1 px-3 py-1 bg-main border border-border-slate rounded-lg text-xs font-bold text-white hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                            ANTERIOR
                        </button>
                        <span className="text-xs font-bold text-white px-2">PÁGINA {page}</span>
                        <button 
                            disabled={payments.length < 50}
                            onClick={() => setPage(p => p + 1)}
                            className="flex items-center gap-1 px-3 py-1 bg-main border border-border-slate rounded-lg text-xs font-bold text-white hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            PRÓXIMA
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
