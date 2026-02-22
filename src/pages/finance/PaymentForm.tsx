
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { maskCurrency } from '../../lib/masks';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { toast } from 'react-hot-toast';

export function PaymentForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditing);
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
        async function fetchInitialData() {
            // Fetch Members
            const { data: memberData } = await supabase.from('members').select('id, full_name').order('full_name');
            if (memberData) setMembers(memberData);

            // If editing, fetch payment data
            if (isEditing) {
                const { data: payment, error } = await supabase
                    .from('payments')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (payment && !error) {
                    setFormData({
                        member_id: payment.member_id,
                        description: payment.description,
                        amount: `R$ ${payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        due_date: payment.due_date,
                        type: payment.type,
                        status: payment.status,
                    });
                } else {
                    toast.error('Erro ao carregar dados do pagamento.');
                    navigate('/finance');
                }
                setFetching(false);
            }
        }

        fetchInitialData();
    }, [id, isEditing, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let maskedValue = value;

        if (name === 'amount') maskedValue = maskCurrency(value);

        setFormData((prev) => ({ ...prev, [name]: maskedValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const amountNumeric = parseFloat(formData.amount.replace("R$ ", "").replace(/\./g, "").replace(",", "."));

        const payload = {
            member_id: formData.member_id,
            description: formData.description,
            amount: amountNumeric,
            due_date: formData.due_date,
            type: formData.type,
            status: formData.status,
            paid_date: formData.status === 'Paid' ? new Date().toISOString().split('T')[0] : null,
        };

        const { error } = isEditing
            ? await supabase.from('payments').update(payload).eq('id', id)
            : await supabase.from('payments').insert([payload]);

        setLoading(false);

        if (error) {
            console.error('Error saving payment:', error);
            toast.error(isEditing ? 'Erro ao atualizar pagamento.' : 'Erro ao registrar pagamento.');
        } else {
            toast.success(isEditing ? 'Pagamento atualizado!' : 'Pagamento registrado!');
            navigate('/finance');
        }
    };

    if (fetching) return <div className="p-10 text-center text-muted animate-pulse">Carregando dados...</div>;

    return (
        <div className="max-w-[768px] w-full mx-auto space-y-6">
            <div className="flex flex-wrap gap-2 mb-2">
                <Link to="/finance" className="text-muted hover:text-primary text-sm font-medium leading-normal">Financeiro</Link>
                <span className="text-muted text-sm font-medium leading-normal">/</span>
                <span className="text-white text-sm font-medium leading-normal">{isEditing ? 'Editar' : 'Novo Lançamento'}</span>
            </div>

            <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-white text-3xl font-black leading-tight tracking-tight">
                        {isEditing ? 'Editar Lançamento' : 'Registrar Pagamento'}
                    </h1>
                    <p className="text-muted text-base font-normal leading-normal">
                        {isEditing ? 'Atualize os detalhes da cobrança.' : 'Crie uma nova cobrança ou registre um pagamento recebido.'}
                    </p>
                </div>
                <Link to="/finance" className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary/10 text-primary hover:bg-primary/20 text-sm font-bold leading-normal transition-all">
                    <span className="material-symbols-outlined mr-2 text-lg">arrow_back</span>
                    <span>Voltar</span>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card>
                    <CardContent className="p-6 sm:p-8 space-y-8">
                        <div className="flex items-center gap-3 border-b border-border-slate pb-6">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">payments</span>
                            </div>
                            <h2 className="text-white text-xl font-black uppercase tracking-tight italic">Dados do Pagamento</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Aluno</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                        person
                                    </span>
                                    <select
                                        name="member_id"
                                        title="Selecione o Aluno"
                                        value={formData.member_id}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-main border border-border-slate rounded-xl py-3 px-12 text-white text-sm outline-none transition-all duration-300 focus:border-primary focus:ring-1 focus:ring-primary/30 appearance-none cursor-pointer"
                                    >
                                        <option value="" className="bg-zinc-900">Selecione o aluno...</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id} className="bg-zinc-900">{m.full_name}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                        expand_more
                                    </span>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <Input
                                    label="Descrição"
                                    name="description"
                                    icon="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: Mensalidade Janeiro"
                                />
                            </div>

                            <Input
                                label="Valor (R$)"
                                name="amount"
                                icon="monetization_on"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                placeholder="R$ 0,00"
                            />

                            <Input
                                label="Data de Vencimento"
                                name="due_date"
                                type="date"
                                icon="calendar_today"
                                value={formData.due_date}
                                onChange={handleChange}
                                required
                            />

                            <div className="space-y-2">
                                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Tipo de Cobrança</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                        category
                                    </span>
                                    <select
                                        name="type"
                                        title="Tipo de Cobrança"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full bg-main border border-border-slate rounded-xl py-3 px-12 text-white text-sm outline-none transition-all duration-300 focus:border-primary focus:ring-1 focus:ring-primary/30 appearance-none cursor-pointer"
                                    >
                                        <option value="Monthly" className="bg-zinc-900">Mensalidade</option>
                                        <option value="Product" className="bg-zinc-900">Produto (Kimono, etc)</option>
                                        <option value="Registration" className="bg-zinc-900">Matrícula</option>
                                        <option value="Event" className="bg-zinc-900">Evento/Seminário</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                        expand_more
                                    </span>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-4 pt-4 border-t border-border-slate">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Status do Pagamento</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { id: 'Pending', label: 'Pendente', icon: 'schedule', activeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-500' },
                                        { id: 'Paid', label: 'Pago', icon: 'check_circle', activeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' },
                                        { id: 'Overdue', label: 'Atrasado', icon: 'error', activeBg: 'bg-red-500/10 border-red-500/30 text-red-500' }
                                    ].map((status) => (
                                        <button
                                            key={status.id}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, status: status.id }))}
                                            className={cn(
                                                "flex items-center gap-3 p-4 rounded-xl border transition-all text-left group",
                                                formData.status === status.id
                                                    ? `${status.activeBg} font-black shadow-lg shadow-black/20`
                                                    : "bg-main border-border-slate text-muted hover:border-slate-500"
                                            )}
                                        >
                                            <span className="material-symbols-outlined">{status.icon}</span>
                                            <span className="text-sm font-bold uppercase tracking-widest">{status.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4 mt-4">
                    <Link to="/finance" className="flex-1 sm:flex-none">
                        <Button variant="outline" className="w-full sm:min-w-[140px]">Cancelar</Button>
                    </Link>
                    <Button
                        type="submit"
                        loading={loading}
                        className="flex-1 sm:flex-none sm:min-w-[240px]"
                        icon={<span className="material-symbols-outlined">{isEditing ? 'update' : 'save'}</span>}
                    >
                        {isEditing ? 'Atualizar Lançamento' : 'Salvar Pagamento'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
