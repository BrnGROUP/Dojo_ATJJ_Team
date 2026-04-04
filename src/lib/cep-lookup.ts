import { toast } from 'react-hot-toast';

export interface AddressData {
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
    erro?: boolean;
}

export async function fetchAddressByCEP(cep: string): Promise<AddressData | null> {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return null;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        
        if (data.erro) {
            toast.error('CEP não encontrado.');
            return null;
        }

        return data as AddressData;
    } catch (err) {
        console.error('Erro ao buscar CEP:', err);
        // toast.error('Erro ao conectar com serviço de CEP.'); // Quiet failure on network errors
        return null;
    }
}
