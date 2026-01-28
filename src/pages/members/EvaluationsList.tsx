
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

interface Evaluation {
    id: string;
    type: string;
    status: 'Aprovado' | 'Reprovado' | 'Pendente';
    score: number;
    notes: string;
    belt_snapshot: string;
    evaluated_at: string;
}

interface EvaluationsListProps {
    memberId: string;
    currentBelt: string;
}

export function EvaluationsList({ memberId, currentBelt }: EvaluationsListProps) {
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Evaluation Form State
    const [newEval, setNewEval] = useState({
        type: 'Técnica',
        status: 'Aprovado',
        score: 100,
        notes: ''
    });

    useEffect(() => {
        fetchEvaluations();
    }, [memberId]);

    const fetchEvaluations = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('evaluations')
                .select('*')
                .eq('member_id', memberId)
                .order('evaluated_at', { ascending: false });

            if (error) throw error;
            setEvaluations(data || []);
        } catch (error) {
            console.error('Error fetching evaluations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const { error } = await supabase.from('evaluations').insert({
                member_id: memberId,
                type: newEval.type,
                status: newEval.status,
                score: newEval.score,
                notes: newEval.notes,
                belt_snapshot: currentBelt
            });

            if (error) throw error;

            toast.success('Avaliação registrada com sucesso!');
            setIsModalOpen(false);
            setNewEval({ type: 'Técnica', status: 'Aprovado', score: 100, notes: '' });
            fetchEvaluations();
        } catch (error) {
            console.error('Error saving evaluation:', error);
            toast.error('Erro ao salvar avaliação.');
        }
    };

    const getStatusColor = (status: string) => {
        if (status === 'Aprovado') return 'text-green-500 bg-green-500/10 border-green-500/20';
        if (status === 'Reprovado') return 'text-red-500 bg-red-500/10 border-red-500/20';
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    };

    return (
        <div className="bg-card rounded-3xl border border-border-slate p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">assignment_turned_in</span>
                        Avaliações & Testes
                    </h3>
                    <p className="text-sm text-muted">Histórico de desempenho técnico e físico.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    type="button"
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-colors font-semibold border border-white/10"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Nova Avaliação
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            ) : evaluations.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <span className="material-symbols-outlined text-4xl text-muted mb-2">history_edu</span>
                    <p className="text-muted">Nenhuma avaliação registrada ainda.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {evaluations.map((ev) => (
                        <div key={ev.id} className="bg-main border border-border-slate rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group hover:border-primary/50 transition-colors">
                            <div className="flex gap-4">
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                    ev.type === 'Técnica' ? 'bg-blue-500/10 text-blue-500' :
                                        ev.type === 'Física' ? 'bg-orange-500/10 text-orange-500' :
                                            'bg-purple-500/10 text-purple-500'
                                )}>
                                    <span className="material-symbols-outlined">
                                        {ev.type === 'Técnica' ? 'sports_martial_arts' : ev.type === 'Física' ? 'fitness_center' : 'psychology'}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-lg">{ev.type}</h4>
                                    <div className="flex items-center gap-2 text-xs text-muted">
                                        <span>{new Date(ev.evaluated_at).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>Faixa na época: {ev.belt_snapshot || 'N/A'}</span>
                                    </div>
                                    {ev.notes && <p className="text-sm text-slate-400 mt-1 italic">"{ev.notes}"</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-center">
                                    <span className="text-[10px] uppercase text-muted font-bold block">Nota</span>
                                    <span className="font-black text-xl text-white">{ev.score}</span>
                                </div>
                                <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase", getStatusColor(ev.status))}>
                                    {ev.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Nova Avaliação */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-lg rounded-3xl border border-border-slate p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Nova Avaliação</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-muted mb-2">Tipo de Avaliação</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Técnica', 'Física', 'Comportamental'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setNewEval({ ...newEval, type })}
                                            className={cn("p-2 rounded-xl text-sm font-bold border transition-all",
                                                newEval.type === type
                                                    ? "bg-primary text-white border-primary"
                                                    : "bg-main border-border-slate text-muted hover:border-white/20"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-muted mb-2">Status</label>
                                    <select
                                        value={newEval.status}
                                        onChange={(e) => setNewEval({ ...newEval, status: e.target.value as any })}
                                        title="Status da Avaliação"
                                        className="w-full bg-main border border-border-slate rounded-xl p-3 text-white outline-none focus:border-primary"
                                    >
                                        <option value="Aprovado">Aprovado</option>
                                        <option value="Pendente">Pendente</option>
                                        <option value="Reprovado">Reprovado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-muted mb-2">Nota (0-100)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        title="Nota da Avaliação"
                                        value={newEval.score}
                                        onChange={(e) => setNewEval({ ...newEval, score: parseInt(e.target.value) })}
                                        className="w-full bg-main border border-border-slate rounded-xl p-3 text-white outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-muted mb-2">Observações</label>
                                <textarea
                                    rows={3}
                                    value={newEval.notes}
                                    onChange={(e) => setNewEval({ ...newEval, notes: e.target.value })}
                                    className="w-full bg-main border border-border-slate rounded-xl p-3 text-white outline-none focus:border-primary resize-none"
                                    placeholder="Comentários sobre o desempenho..."
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full bg-primary hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors mt-4 shadow-lg shadow-red-900/20"
                            >
                                Salvar Avaliação
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
