import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { toast } from 'react-hot-toast';

export function Reports() {
    const [loading, setLoading] = useState<string | null>(null);

    const exportToCSV = (data: any[], filename: string) => {
        if (!data || data.length === 0) return;

        const csvRows = [];
        // Flatten headers recursively for a few levels if needed, or just focus on flat keys
        const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object' || data[0][k] === null);

        // Add specific nested fields if they exist
        if (data[0].student_name !== undefined) headers.push('student_name');
        if (data[0].class_name !== undefined) headers.push('class_name');

        csvRows.push(headers.join(','));

        for (const row of data) {
            const values = headers.map(header => {
                const val = row[header];
                const cleanVal = (val === null || val === undefined) ? '' : String(val).replace(/"/g, '""');
                return `"${cleanVal}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for Excel compatibility
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleExport = async (type: 'members' | 'payments' | 'attendance' | 'gamification') => {
        setLoading(type);
        try {
            let data: any[] | null = [];
            let error: any = null;

            if (type === 'members') {
                const result = await supabase.from('members').select('*');
                data = result.data;
                error = result.error;
            } else if (type === 'payments') {
                const result = await supabase.from('payments').select('*, members(full_name)');
                data = result.data?.map(p => ({
                    ...p,
                    student_name: p.members?.full_name
                })) || [];
                error = result.error;
            } else if (type === 'attendance') {
                const result = await supabase.from('attendance').select('*, members(full_name), classes(name)');
                data = result.data?.map(a => ({
                    ...a,
                    student_name: a.members?.full_name,
                    class_name: a.classes?.name
                })) || [];
                error = result.error;
            } else if (type === 'gamification') {
                const result = await supabase.from('members').select('full_name, belt, stripes, xp');
                data = result.data;
                error = result.error;
            }

            if (error) throw error;
            if (data && data.length > 0) {
                exportToCSV(data, `relatorio_${type}_${new Date().toISOString().split('T')[0]}`);
                toast.success(`Relatório de ${type} gerado com sucesso!`);
            } else {
                toast.error('Nenhum dado encontrado para este relatório.');
            }
        } catch (err: any) {
            toast.error(`Erro ao gerar relatório: ${err.message}`);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
            <div className="flex flex-col gap-2 mb-10">
                <h1 className="text-white text-4xl sm:text-6xl font-black uppercase italic leading-none tracking-tighter">
                    Relatórios
                </h1>
                <p className="text-muted text-sm sm:text-base font-medium max-w-xl">
                    Extraia dados estratégicos para análise e gestão do seu Dojo.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Alunos */}
                <Card className="hover:border-primary/30 transition-all">
                    <CardContent className="p-8 space-y-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-3xl">group</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase italic">Alunos Ativos</h3>
                            <p className="text-muted text-sm font-medium mt-1">Lista completa com dados de contato, faixa e status.</p>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            loading={loading === 'members'}
                            onClick={() => handleExport('members')}
                        >
                            Exportar CSV
                        </Button>
                    </CardContent>
                </Card>

                {/* Financeiro */}
                <Card className="hover:border-primary/30 transition-all">
                    <CardContent className="p-8 space-y-6">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-amber-500 text-3xl">payments</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase italic">Financeiro Mensal</h3>
                            <p className="text-muted text-sm font-medium mt-1">Histórico de pagamentos, mensalidades e taxas.</p>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            loading={loading === 'payments'}
                            onClick={() => handleExport('payments')}
                        >
                            Exportar CSV
                        </Button>
                    </CardContent>
                </Card>

                {/* Presença */}
                <Card className="hover:border-primary/30 transition-all">
                    <CardContent className="p-8 space-y-6">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-indigo-500 text-3xl">how_to_reg</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase italic">Frequência Geral</h3>
                            <p className="text-muted text-sm font-medium mt-1">Análise de assiduidade por aluno e turma.</p>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            loading={loading === 'attendance'}
                            onClick={() => handleExport('attendance')}
                        >
                            Exportar CSV
                        </Button>
                    </CardContent>
                </Card>

                {/* Gamificação */}
                <Card className="hover:border-primary/30 transition-all">
                    <CardContent className="p-8 space-y-6">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-rose-500 text-3xl">military_tech</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase italic">Evolução Técnica</h3>
                            <p className="text-muted text-sm font-medium mt-1">Ranking de XP, faixas atuais e graus conquistados.</p>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            loading={loading === 'gamification'}
                            onClick={() => handleExport('gamification')}
                        >
                            Exportar CSV
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
