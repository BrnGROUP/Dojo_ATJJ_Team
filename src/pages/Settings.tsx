import { useState } from 'react';
import { maskCNPJ, maskPhone, maskCEP } from '../lib/masks';

export function Settings() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        dojoName: 'ATJJ Dojo v4',
        cnpj: '',
        email: 'contato@atjjdojo.com',
        phone: '',
        cep: '',
        address: '',
        city: '',
        state: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let maskedValue = value;

        if (name === 'cnpj') maskedValue = maskCNPJ(value);
        if (name === 'phone') maskedValue = maskPhone(value);
        if (name === 'cep') maskedValue = maskCEP(value);
        if (name === 'email') maskedValue = value.toLowerCase().trim();

        setFormData((prev) => ({ ...prev, [name]: maskedValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // This is a placeholder for actual saving logic
        setTimeout(() => {
            setLoading(false);
            alert('Configurações salvas (Simulação)');
        }, 1000);
    };

    return (
        <div className="max-w-[800px] w-full mx-auto space-y-6">
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-white text-3xl font-black leading-tight tracking-tight">Configurações do Dojo</h1>
                <p className="text-muted text-base font-normal leading-normal">Gerencie os dados institucionais e operacionais do seu Dojo.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-card p-6 rounded-2xl border border-border-slate space-y-6">
                    <div className="flex items-center gap-2 border-b border-border-slate pb-4">
                        <span className="material-symbols-outlined text-primary">domain</span>
                        <h2 className="text-white text-xl font-bold">Informações Institucionais</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="flex flex-col w-full">
                            <p className="text-white text-sm font-semibold mb-2">Nome do Dojo</p>
                            <input
                                name="dojoName"
                                value={formData.dojoName}
                                onChange={handleChange}
                                className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary h-12 px-4 outline-none"
                            />
                        </label>

                        <label className="flex flex-col w-full">
                            <p className="text-white text-sm font-semibold mb-2">CNPJ</p>
                            <input
                                name="cnpj"
                                value={formData.cnpj}
                                onChange={handleChange}
                                placeholder="00.000.000/0000-00"
                                className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary h-12 px-4 outline-none"
                            />
                        </label>

                        <label className="flex flex-col w-full">
                            <p className="text-white text-sm font-semibold mb-2">E-mail de Contato</p>
                            <input
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                type="email"
                                className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary h-12 px-4 outline-none"
                            />
                        </label>

                        <label className="flex flex-col w-full">
                            <p className="text-white text-sm font-semibold mb-2">Telefone Comercial</p>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="(00) 00000-0000"
                                className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary h-12 px-4 outline-none"
                            />
                        </label>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border-slate space-y-6">
                    <div className="flex items-center gap-2 border-b border-border-slate pb-4">
                        <span className="material-symbols-outlined text-primary">location_on</span>
                        <h2 className="text-white text-xl font-bold">Localização</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <label className="flex flex-col w-full">
                            <p className="text-white text-sm font-semibold mb-2">CEP</p>
                            <input
                                name="cep"
                                value={formData.cep}
                                onChange={handleChange}
                                placeholder="00000-000"
                                className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary h-12 px-4 outline-none"
                            />
                        </label>

                        <label className="flex flex-col md:col-span-2 w-full">
                            <p className="text-white text-sm font-semibold mb-2">Endereço</p>
                            <input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full rounded-lg text-white bg-main border border-border-slate focus:border-primary h-12 px-4 outline-none"
                            />
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-primary text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined">{loading ? 'sync' : 'save'}</span>
                        {loading ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </form>
        </div>
    );
}
