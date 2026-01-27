import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { maskCurrency } from '../../lib/masks';

export function PaymentForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<{ id: string, full_name: string }[]>([]);
    const [formData, setFormData] = useState({
        member_id: '',
        description: '',
        amount: '',
        due_date: new Date().toISOString().split('T')[0],
        type: 'Monthly',
        status: 'Pending',
    });

    useEffect(() => {
        async function fetchMembers() {
            const { data } = await supabase.from('members').select('id, full_name').order('full_name');
            if (data) setMembers(data);
        }

        fetchMembers();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let maskedValue = value;

        if (name === 'amount') maskedValue = maskCurrency(value);

        setFormData((prev) => ({ ...prev, [name]: maskedValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from('payments').insert([
            {
                member_id: formData.member_id,
                description: formData.description,
                amount: parseFloat(formData.amount.replace("R$ ", "").replace(/\./g, "").replace(",", ".")),
                due_date: formData.due_date,
                type: formData.type,
                status: formData.status,
                paid_date: formData.status === 'Paid' ? new Date().toISOString().split('T')[0] : null,
            },
        ]);

        setLoading(false);

        if (error) {
            console.error('Error saving payment:', error);
            alert('Erro ao registrar pagamento.');
        } else {
            navigate('/finance');
        }
    };

    return (
        <div className="max-w-[768px] w-full mx-auto space-y-6">
            <div className="flex flex-wrap gap-2 mb-2">
                <Link to="/finance" className="text-muted hover:text-primary text-sm font-medium leading-normal">Financeiro</Link>
                <span className="text-muted text-sm font-medium leading-normal">/</span>
                <span className="text-white text-sm font-medium leading-normal">Novo Lançamento</span>
            </div>

            <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-white text-3xl font-black leading-tight tracking-tight">Registrar Pagamento</h1>
                    <p className="text-muted text-base font-normal leading-normal">Crie uma nova cobrança ou registre um pagamento recebido.</p>
                </div>
                <Link to="/finance" className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary/10 text-primary hover:bg-primary/20 text-sm font-bold leading-normal transition-all">
                    <span className="material-symbols-outlined mr-2 text-lg">arrow_back</span>
                    <span>Voltar</span>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-card p-6 rounded-xl shadow-sm border border-border-slate">
                <div className="flex items-center gap-2 border-b border-border-slate pb-4">
                    <span className="material-symbols-outlined text-primary">payments</span>
                    <h2 className="text-white text-xl font-bold leading-tight tracking-tight">Dados do Pagamento</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="flex flex-col w-full md:col-span-2">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Aluno</p>
                        <select
                            name="member_id"
                            value={formData.member_id}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                        >
                            <option value="">Selecione o aluno...</option>
                            {members.map(m => (
                                <option key={m.id} value={m.id}>{m.full_name}</option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col w-full">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Descrição</p>
                        <input
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                            placeholder="Ex: Mensalidade Janeiro"
                            type="text"
                        />
                    </label>

                    <label className="flex flex-col w-full">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Valor (R$)</p>
                        <input
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                            placeholder="R$ 0,00"
                            type="text"
                        />
                    </label>

                    <label className="flex flex-col w-full">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Data de Vencimento</p>
                        <input
                            name="due_date"
                            value={formData.due_date}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                            type="date"
                        />
                    </label>

                    <label className="flex flex-col w-full">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Tipo de Cobrança</p>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base font-normal transition-all outline-none"
                        >
                            <option value="Monthly">Mensalidade</option>
                            <option value="Product">Produto (Kimono, etc)</option>
                            <option value="Registration">Matrícula</option>
                            <option value="Event">Evento/Seminário</option>
                        </select>
                    </label>

                    <label className="flex flex-col w-full md:col-span-2">
                        <p className="text-white text-sm font-semibold leading-normal pb-2">Status Inicial</p>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="status" value="Pending" checked={formData.status === 'Pending'} onChange={handleChange} className="accent-primary w-5 h-5" />
                                <span className="text-white text-sm">Pendente (A Receber)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="status" value="Paid" checked={formData.status === 'Paid'} onChange={handleChange} className="accent-emerald-500 w-5 h-5" />
                                <span className="text-white text-sm">Pago (Recebido hoje)</span>
                            </label>
                        </div>
                    </label>
                </div>

                <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-border-slate">
                    <Link to="/finance" className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-card text-white text-sm font-bold leading-normal hover:bg-card/80 transition-all border border-border-slate">
                        Cancelar
                    </Link>
                    <button
                        disabled={loading}
                        className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold leading-normal shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                    >
                        <span className="material-symbols-outlined mr-2">save</span>
                        {loading ? 'Salvando...' : 'Salvar Lançamento'}
                    </button>
                </div>
            </form>
        </div>
    );
}
