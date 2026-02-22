import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface DojoSettings {
    dojo_name: string;
    cnpj?: string;
    email?: string;
    phone?: string;
}

export function useSettings() {
    const [settings, setSettings] = useState<DojoSettings>({
        dojo_name: 'ATJJ Dojov4'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const { data } = await supabase
                    .from('settings')
                    .select('dojo_name, cnpj, email, phone')
                    .maybeSingle();

                if (data) {
                    setSettings(data);
                }
            } catch (err) {
                console.error('Error fetching settings:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchSettings();
    }, []);

    return { settings, loading };
}
