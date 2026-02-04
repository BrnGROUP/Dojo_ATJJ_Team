import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { DynamicDiv } from '../../components/DynamicDiv';

interface Belt {
    id: string;
    name: string;
    color: string;
    order_index: number;
}

interface Technique {
    id: string;
    belt_id: string;
    name: string;
    category: string;
    subcategory?: string;
    description?: string;
    video_url?: string;
    image_url?: string;
    pedagogical_layer?: string;
}

const FAMILIES: Record<string, string[]> = {
    'Base & Movimento': ['BM-01 Postura', 'BM-02 Base', 'BM-03 Deslocamento', 'BM-04 Quedas de segurança', 'BM-05 Transições básicas', 'BM-06 Coordenação motora'],
    'Quedas & Projeções': ['QP-01 Pegadas', 'QP-02 Kuzushi', 'QP-03 Entradas', 'QP-04 Projeções de perna', 'QP-05 Projeções de quadril', 'QP-06 Quedas adaptadas'],
    'Guarda': ['GD-01 Guarda fechada', 'GD-02 Guarda aberta', 'GD-03 Meia-guarda', 'GD-04 Guarda sentada', 'GD-05 Guarda avançada', 'GD-06 Retenção de guarda'],
    'Raspagens': ['RS-01 Raspagens básicas', 'RS-02 Raspagens por desequilíbrio', 'RS-03 Raspagens da meia-guarda', 'RS-04 Raspagens da guarda aberta', 'RS-05 Raspagens em sequência', 'RS-06 Raspagens adaptadas'],
    'Passagens': ['PS-01 Passagem ajoelhada', 'PS-02 Passagem em pé', 'PS-03 Passagem em pressão', 'PS-04 Passagem dinâmica', 'PS-05 Passagem por encadeamento', 'PS-06 Estabilização pós-passagem'],
    'Controles': ['CT-01 Montada', 'CT-02 100kg', 'CT-03 Costas', 'CT-04 Norte-sul', 'CT-05 Transições de controle', 'CT-06 Retenção de controle'],
    'Finalizações': ['FN-01 Estrangulamentos', 'FN-02 Chaves de braço', 'FN-03 Chaves de ombro', 'FN-04 Chaves de perna', 'FN-05 Finalizações em sequência', 'FN-06 Finalizações adaptadas'],
    'Defesas': ['DF-01 Defesa de finalizações', 'DF-02 Defesa de guarda', 'DF-03 Saídas de controle', 'DF-04 Recuperação de guarda', 'DF-05 Defesa ativa', 'DF-06 Defesa adaptada'],
    'Transições & Estratégia': ['TE-01 Encadeamentos', 'TE-02 Ataque em cadeia', 'TE-03 Defesa → ataque', 'TE-04 Leitura de jogo', 'TE-05 Adaptação', 'TE-06 Gestão de ritmo'],
    'Conduta & Consciência': ['CC-01 Disciplina', 'CC-02 Respeito', 'CC-03 Autocontrole', 'CC-04 Ética marcial', 'CC-05 Frequência', 'CC-06 Espírito esportivo']
};

const PEDAGOGICAL_LAYERS = [
    { id: 'Técnica', label: 'Técnica', description: 'Execução mecânica', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { id: 'Cognitiva', label: 'Cognitiva', description: 'Compreensão e decisão', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    { id: 'Motora', label: 'Motora', description: 'Coordenação e equilíbrio', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    { id: 'Emocional', label: 'Emocional', description: 'Autocontrole e confiança', color: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
    { id: 'Ética', label: 'Ética', description: 'Comportamento e valores', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' }
];



export function CurriculumManagement() {
    const [belts, setBelts] = useState<Belt[]>([]);
    const [techniques, setTechniques] = useState<Technique[]>([]);
    const [selectedBelt, setSelectedBelt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: 'Base & Movimento',
        subcategory: '',
        description: '',
        video_url: '',
        image_url: '',
        pedagogical_layer: 'Técnica'
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedBelt) fetchTechniques(selectedBelt);
    }, [selectedBelt]);

    const fetchData = async () => {
        try {
            const { data: beltsData } = await supabase.from('belts').select('*').order('order_index');
            setBelts(beltsData || []);
            if (beltsData && beltsData.length > 0) {
                setSelectedBelt(beltsData[0].id);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTechniques = async (beltId: string) => {
        const { data } = await supabase
            .from('techniques')
            .select('*')
            .eq('belt_id', beltId)
            .order('category');
        setTechniques(data || []);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = event.target.files?.[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('technique-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('technique-images').getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
            toast.success('Imagem enviada com sucesso!');
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Erro ao enviar imagem. Verifique se o bucket "technique-images" existe e é público.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedBelt) return;
        if (!formData.name) return toast.error('Nome da técnica é obrigatório');

        try {
            if (editingId) {
                const { error } = await supabase.from('techniques').update({
                    belt_id: selectedBelt,
                    ...formData
                }).eq('id', editingId);

                if (error) throw error;
                toast.success('Técnica atualizada!');
            } else {
                const { error } = await supabase.from('techniques').insert({
                    belt_id: selectedBelt,
                    ...formData
                });

                if (error) throw error;
                toast.success('Técnica adicionada!');
            }

            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ name: '', category: 'Base & Movimento', subcategory: '', description: '', video_url: '', image_url: '', pedagogical_layer: 'Técnica' });
            fetchTechniques(selectedBelt);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar técnica.');
        }
    };

    const handleEdit = (tech: Technique) => {
        setEditingId(tech.id);
        setFormData({
            name: tech.name,
            category: tech.category,
            subcategory: tech.subcategory || '',
            description: tech.description || '',
            video_url: tech.video_url || '',
            image_url: tech.image_url || '',
            pedagogical_layer: tech.pedagogical_layer || 'Técnica'
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir técnica?')) return;
        try {
            await supabase.from('techniques').delete().eq('id', id);
            toast.success('Técnica removida.');
            if (selectedBelt) fetchTechniques(selectedBelt);
        } catch (error) {
            console.error(error);
        }
    };

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            'Base & Movimento': 'text-slate-400 bg-slate-500/10 border-slate-500/20',
            'Quedas & Projeções': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
            'Guarda': 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
            'Raspagens': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
            'Passagens': 'text-green-500 bg-green-500/10 border-green-500/20',
            'Controles': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
            'Finalizações': 'text-red-500 bg-red-500/10 border-red-500/20',
            'Defesas': 'text-pink-500 bg-pink-500/10 border-pink-500/20',
            'Transições & Estratégia': 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
            'Conduta & Consciência': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
        };
        return colors[cat] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    };

    return (
        <div className="p-6 md:p-10 space-y-8 animate-fade-in pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-primary">menu_book</span>
                        Currículo Técnico
                    </h1>
                    <p className="text-muted mt-1">Gerencie os requisitos técnicos para cada faixa.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', category: 'Base & Movimento', subcategory: '', description: '', video_url: '', image_url: '', pedagogical_layer: 'Técnica' });
                        setIsModalOpen(true);
                    }}
                    className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined">add</span>
                    Nova Técnica
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Belt Selector */}
                <div className="md:col-span-1 space-y-3">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-widest px-2">Faixas</h3>
                    {belts.map(belt => (
                        <button
                            key={belt.id}
                            onClick={() => setSelectedBelt(belt.id)}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
                                selectedBelt === belt.id
                                    ? "bg-card border-primary ring-1 ring-primary"
                                    : "bg-transparent border-transparent hover:bg-white/5 text-muted hover:text-white"
                            )}
                        >
                            <DynamicDiv
                                className="w-8 h-8 rounded-lg shadow-sm border border-white/10 shrink-0"
                                dynamicStyle={{ backgroundColor: belt.color }}
                            />
                            <span className={cn("font-bold text-sm", selectedBelt === belt.id ? "text-white" : "")}>{belt.name}</span>
                            {selectedBelt === belt.id && <span className="material-symbols-outlined text-primary ml-auto text-sm">chevron_right</span>}
                        </button>
                    ))}
                </div>

                {/* Techniques List */}
                <div className="md:col-span-3 bg-card rounded-3xl border border-border-slate p-6 min-h-[500px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">
                            Técnicas: {belts.find(b => b.id === selectedBelt)?.name}
                        </h2>
                        <span className="text-xs font-bold text-muted bg-white/5 px-3 py-1 rounded-full">{techniques.length} técnicas</span>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                    ) : techniques.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <span className="material-symbols-outlined text-6xl text-muted mb-4">history_edu</span>
                            <p className="text-muted">Nenhuma técnica cadastrada para esta faixa.</p>
                            <p className="text-xs text-slate-500 mt-2">Clique em "Nova Técnica" para começar.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {techniques.map(tech => (
                                <div key={tech.id} className="group flex items-center justify-between p-4 rounded-xl bg-main border border-border-slate hover:border-white/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        {tech.image_url ? (
                                            <img src={tech.image_url} alt={tech.name} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                                        ) : (
                                            <div className={cn("w-12 h-12 rounded-lg border border-white/5 flex items-center justify-center bg-white/5", getCategoryColor(tech.category))}>
                                                <span className="material-symbols-outlined text-xl opacity-50">sports_martial_arts</span>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0", getCategoryColor(tech.category))}>
                                                    {tech.category}
                                                </span>
                                                {tech.subcategory && (
                                                    <span className="text-[9px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded border border-white/5">
                                                        {tech.subcategory.split(' ')[0]}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-white text-sm">{tech.name}</h4>
                                            {tech.description && <p className="text-xs text-muted mt-0.5 line-clamp-1">{tech.description}</p>}
                                            {tech.pedagogical_layer && (
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="text-[9px] text-muted uppercase tracking-wider">Camada:</span>
                                                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border", PEDAGOGICAL_LAYERS.find(l => l.id === tech.pedagogical_layer)?.color)}>
                                                        {tech.pedagogical_layer}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(tech)} className="p-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors">
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(tech.id)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors">
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-lg rounded-3xl border border-border-slate p-8 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">{editingId ? 'Editar Técnica' : 'Adicionar Técnica'}</h3>
                            <button onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ name: '', category: 'Base & Movimento', subcategory: '', description: '', video_url: '', image_url: '', pedagogical_layer: 'Técnica' }); }} className="text-muted hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Categoria</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {Object.keys(FAMILIES).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setFormData({ ...formData, category: cat, subcategory: '' })}
                                            className={cn(
                                                "p-2 rounded-lg text-[9px] font-bold uppercase transition-all border whitespace-nowrap truncate",
                                                formData.category === cat ? "bg-primary text-white border-primary" : "bg-main border-border-slate text-muted hover:border-white/20"
                                            )}
                                            title={cat}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Subcategory Selector */}
                            {FAMILIES[formData.category] && FAMILIES[formData.category].length > 0 && (
                                <div>
                                    <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Subfamília / Subcategoria</label>
                                    <select
                                        title="Subcategoria"
                                        value={formData.subcategory}
                                        onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                                        className="w-full bg-main border border-border-slate rounded-xl p-3 text-white outline-none focus:border-primary text-sm"
                                    >
                                        <option value="">Selecione uma subcategoria...</option>
                                        {FAMILIES[formData.category]?.map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Camada Pedagógica</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {PEDAGOGICAL_LAYERS.map(layer => (
                                        <button
                                            key={layer.id}
                                            onClick={() => setFormData({ ...formData, pedagogical_layer: layer.id })}
                                            className={cn(
                                                "p-2 rounded-lg text-left transition-all border group",
                                                formData.pedagogical_layer === layer.id
                                                    ? "bg-card border-primary ring-1 ring-primary"
                                                    : "bg-main border-border-slate text-muted hover:border-white/20"
                                            )}
                                        >
                                            <div className="font-bold text-[10px] uppercase mb-0.5 text-white">{layer.label}</div>
                                            <div className="text-[9px] opacity-70 group-hover:opacity-100 truncate" title={layer.description}>{layer.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Nome da Técnica</label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Armlock da Guarda Fechada"
                                    className="w-full bg-main border border-border-slate rounded-xl p-3 text-white outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Descrição / Detalhes</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detalhes importantes, variações..."
                                    className="w-full bg-main border border-border-slate rounded-xl p-3 text-white outline-none focus:border-primary resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Imagem da Técnica (Opcional)</label>
                                <div className="flex items-center gap-4">
                                    {formData.image_url && (
                                        <img src={formData.image_url} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-border-slate" />
                                    )}
                                    <label className="flex-1 cursor-pointer">
                                        <div className="w-full bg-main border border-border-slate rounded-xl p-3 text-muted hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2">
                                            {uploading ? (
                                                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <span className="material-symbols-outlined">add_a_photo</span>
                                            )}
                                            <span className="text-sm font-bold">{formData.image_url ? 'Trocar Imagem' : 'Enviar Foto'}</span>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={uploading}
                                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-colors mt-4 shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {editingId ? 'Atualizar Técnica' : 'Salvar Técnica'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
