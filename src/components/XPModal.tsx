import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

interface XPModalProps {
    isOpen: boolean;
    onClose: () => void;
    memberId: string;
    memberName: string;
    currentXP: number;
    onSuccess: () => void;
}

const XP_PRESETS = [
    { label: '🥇 1º Lugar', value: 100, description: 'Primeiro lugar em competição' },
    { label: '🥈 2º Lugar', value: 75, description: 'Segundo lugar em competição' },
    { label: '🥉 3º Lugar', value: 50, description: 'Terceiro lugar em competição' },
    { label: '🤝 Ajudou Colega', value: 25, description: 'Auxiliou outro aluno' },
    { label: '🎯 Participação Evento', value: 30, description: 'Participou de evento do dojo' },
    { label: '⚡ Bônus Especial', value: 50, description: 'Prêmio especial' },
    { label: '📉 Ajuste', value: -10, description: 'Ajuste administrativo' },
];

export function XPModal({ isOpen, onClose, memberId, memberName, currentXP, onSuccess }: XPModalProps) {
    const [amount, setAmount] = useState(0);
    const [reason, setReason] = useState('');
    const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handlePresetClick = (preset: typeof XP_PRESETS[0], index: number) => {
        setAmount(preset.value);
        setReason(preset.description);
        setSelectedPreset(index);
    };

    const handleSubmit = async () => {
        if (amount === 0) {
            toast.error('Digite uma quantidade de XP válida!');
            return;
        }

        if (!reason.trim()) {
            toast.error('Informe o motivo do ajuste de XP!');
            return;
        }

        setLoading(true);

        try {
            // 1. Insert XP log
            const { error: logError } = await supabase.from('xp_logs').insert({
                member_id: memberId,
                amount: amount,
                reason: reason.trim()
            });

            if (logError) throw logError;

            // 2. Update member's total XP
            const newTotal = Math.max(0, currentXP + amount); // Prevent negative XP
            const { error: updateError } = await supabase.from('members').update({
                xp: newTotal
            }).eq('id', memberId);

            if (updateError) throw updateError;

            toast.success(`${amount > 0 ? '+' : ''}${amount} XP ${amount > 0 ? 'adicionado' : 'removido'} para ${memberName}!`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating XP:', error);
            toast.error('Erro ao atualizar XP.');
        } finally {
            setLoading(false);
        }
    };

    const newTotal = Math.max(0, currentXP + amount);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-2xl rounded-3xl border border-border-slate p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">bolt</span>
                            Gerenciar XP
                        </h3>
                        <p className="text-sm text-muted mt-1">{memberName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Current XP Display */}
                <div className="bg-main rounded-2xl p-4 mb-6 border border-border-slate">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">XP Atual</p>
                            <p className="text-3xl font-black text-white">{currentXP.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <span className="material-symbols-outlined text-5xl text-primary/20">trending_flat</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Novo Total</p>
                            <p className={cn(
                                "text-3xl font-black transition-colors",
                                amount > 0 ? "text-green-500" : amount < 0 ? "text-red-500" : "text-white"
                            )}>
                                {newTotal.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Presets */}
                <div className="mb-6">
                    <p className="text-sm font-bold text-muted mb-3">Ações Rápidas</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {XP_PRESETS.map((preset, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handlePresetClick(preset, index)}
                                className={cn(
                                    "p-3 rounded-xl text-left border transition-all hover:scale-105 active:scale-95",
                                    selectedPreset === index
                                        ? "bg-primary/20 border-primary text-white"
                                        : "bg-main border-border-slate text-muted hover:border-white/20"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{preset.label.split(' ')[0]}</span>
                                    <span className={cn(
                                        "text-xs font-black",
                                        preset.value > 0 ? "text-green-500" : "text-red-500"
                                    )}>
                                        {preset.value > 0 ? '+' : ''}{preset.value}
                                    </span>
                                </div>
                                <p className="text-[10px] opacity-70 truncate">{preset.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Manual Input */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-muted mb-2">Quantidade de XP</label>
                        <input
                            type="number"
                            value={amount || ''}
                            onChange={(e) => {
                                setAmount(parseInt(e.target.value) || 0);
                                setSelectedPreset(null);
                            }}
                            placeholder="Ex: 100 ou -50"
                            className="w-full bg-main border border-border-slate rounded-xl p-3 text-white text-center text-2xl font-black outline-none focus:border-primary"
                        />
                        <p className="text-[10px] text-muted mt-1 text-center italic">Use valores negativos para subtrair XP</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-muted mb-2">Motivo</label>
                        <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-main border border-border-slate rounded-xl p-3 text-white outline-none focus:border-primary resize-none"
                            placeholder="Descreva o motivo deste ajuste de XP..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            type="button"
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors border border-white/10"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || amount === 0 || !reason.trim()}
                            className={cn(
                                "flex-1 font-bold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
                                amount > 0
                                    ? "bg-green-600 hover:bg-green-700 text-white shadow-green-900/20"
                                    : amount < 0
                                        ? "bg-red-600 hover:bg-red-700 text-white shadow-red-900/20"
                                        : "bg-gray-600 text-white"
                            )}
                        >
                            {loading ? 'Salvando...' : amount > 0 ? `Adicionar +${amount} XP` : amount < 0 ? `Remover ${amount} XP` : 'Confirmar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
