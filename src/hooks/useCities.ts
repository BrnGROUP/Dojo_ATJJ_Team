import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function useCities(selectedState: string) {
    const [cities, setCities] = useState<string[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);

    useEffect(() => {
        if (selectedState) {
            fetchCities(selectedState);
        } else {
            setCities([]);
        }
    }, [selectedState]);

    async function fetchCities(uf: string) {
        setLoadingCities(true);
        try {
            const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
            const data = await response.json();
            const cityNames = data.map((c: { nome: string }) => c.nome.toUpperCase()).sort();
            setCities(cityNames);
        } catch (err) {
            console.error('Erro ao buscar cidades:', err);
            toast.error('Erro ao carregar lista de cidades.');
        } finally {
            setLoadingCities(false);
        }
    }

    return { cities, loadingCities };
}
