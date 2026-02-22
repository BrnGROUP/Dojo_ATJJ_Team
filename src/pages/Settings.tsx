import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { maskCNPJ, maskPhone, maskCEP } from '../lib/masks';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { toast } from 'react-hot-toast';

export function Settings() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        dojoName: '',
        cnpj: '',
        email: '',
        phone: '',
        cep: '',
        address: '',
        city: '',
        state: '',
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setFormData({
                    id: data.id,
                    dojoName: data.dojo_name || '',
                    cnpj: maskCNPJ(data.cnpj || ''),
                    email: data.email || '',
                    phone: maskPhone(data.phone || ''),
                    cep: maskCEP(data.cep || ''),
                    address: data.address || '',
                    city: data.city || '',
                    state: data.state || '',
                });
            }
        } catch (err: any) {
            console.error('Erro ao buscar configurações:', err);
            toast.error('Não foi possível carregar as configurações.');
        } finally {
            setLoading(false);
        }
    }

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
        setSaving(true);
        try {
            const updateData = {
                dojo_name: formData.dojoName,
                cnpj: formData.cnpj.replace(/\D/g, ''),
                email: formData.email,
                phone: formData.phone.replace(/\D/g, ''),
                cep: formData.cep.replace(/\D/g, ''),
                address: formData.address,
                city: formData.city,
                state: formData.state,
                updated_at: new Date().toISOString(),
            };

            const { error } = formData.id
                ? await supabase.from('settings').update(updateData).eq('id', formData.id)
                : await supabase.from('settings').insert([updateData]);

            if (error) throw error;

            toast.success('Configurações salvas com sucesso!');
            fetchSettings();
        } catch (err: any) {
            console.error('Erro ao salvar configurações:', err);
            toast.error('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted font-black uppercase tracking-widest text-xs animate-pulse">Carregando Configurações...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[800px] w-full mx-auto space-y-6 pb-20">
            <div className="flex flex-col gap-2 mb-10">
                <h1 className="text-white text-3xl sm:text-5xl font-black leading-none tracking-tighter uppercase italic">
                    Configurações
                </h1>
                <p className="text-muted text-sm sm:text-base font-medium">
                    Gerencie a identidade e dados institucionais do seu Dojo.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card>
                    <CardContent className="p-6 sm:p-8 space-y-8">
                        <div className="flex items-center gap-3 border-b border-border-slate pb-6">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">domain</span>
                            </div>
                            <h2 className="text-white text-xl font-black uppercase tracking-tight italic">Informações do Dojo</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2">
                                <Input
                                    label="Nome do Dojo"
                                    name="dojoName"
                                    icon="store"
                                    value={formData.dojoName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: My Dojo Training Center"
                                />
                            </div>

                            <Input
                                label="CNPJ"
                                name="cnpj"
                                icon="badge"
                                value={formData.cnpj}
                                onChange={handleChange}
                                placeholder="00.000.000/0000-00"
                            />

                            <Input
                                label="E-mail de Contato"
                                name="email"
                                type="email"
                                icon="mail"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="contato@dojo.com"
                            />

                            <Input
                                label="Telefone Comercial"
                                name="phone"
                                icon="call"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="(00) 00000-0000"
                            />

                            <Input
                                label="CEP"
                                name="cep"
                                icon="location_on"
                                value={formData.cep}
                                onChange={handleChange}
                                placeholder="00000-000"
                            />

                            <div className="md:col-span-2">
                                <Input
                                    label="Endereço Completo"
                                    name="address"
                                    icon="map"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Rua, Número, Bairro"
                                />
                            </div>

                            <Input
                                label="Cidade"
                                name="city"
                                icon="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Sua Cidade"
                            />

                            <Input
                                label="Estado (UF)"
                                name="state"
                                icon="public"
                                value={formData.state}
                                onChange={handleChange}
                                placeholder="Estado"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        loading={saving}
                        className="w-full sm:min-w-[250px]"
                        icon={<span className="material-symbols-outlined">save</span>}
                    >
                        Salvar Configurações
                    </Button>
                </div>
            </form>
        </div>
    );
}
