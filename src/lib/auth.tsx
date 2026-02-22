import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    profile: any | null;
    loading: boolean;
    isAdmin: boolean;
    isManager: boolean;
    isCoordinator: boolean;
    isInstructor: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Pegar sessão inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchProfile(currentUser.id);
            } else {
                setLoading(false);
            }
        });

        // 2. Ouvir mudanças
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchProfile(currentUser.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    async function fetchProfile(userId: string) {
        try {
            console.log('Buscando perfil para ID:', userId);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Erro detalhado do Supabase:', error);
                // PGRST116 is "no rows returned" for .single()
                if (error.code === 'PGRST116') {
                    console.warn('Perfil não encontrado. Criando perfil base...');

                    // Buscar metadados do usuário
                    const { data: { user: authUser } } = await supabase.auth.getUser();

                    if (authUser) {
                        const newProfile = {
                            id: userId,
                            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
                            email: authUser.email,
                            role: authUser.email?.includes('claudio.bruno') ? 'admin' : 'student',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };

                        const { data: createdData, error: createError } = await supabase
                            .from('profiles')
                            .insert([newProfile])
                            .select()
                            .single();

                        if (createError) {
                            console.error('Erro ao criar perfil inicial:', createError);
                            setProfile(null);
                        } else {
                            console.log('Perfil criado com sucesso:', createdData);
                            setProfile(createdData);
                        }
                    } else {
                        setProfile(null);
                    }
                } else {
                    setProfile(null);
                }
            } else {
                console.log('Perfil carregado com sucesso:', data);
                setProfile(data);
            }
        } catch (error) {
            console.error('Falha catastrófica ao buscar perfil:', error);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }

    // Lógica de Admin Forçado (Seguro para Debug)
    // Se o perfil falhar mas o email for o seu, garantimos o acesso.
    const effectiveRole = profile?.role || (user?.email?.includes('claudio.bruno') ? 'admin' : 'student');

    const value = {
        user,
        profile: profile || (user ? { id: user.id, full_name: user.email?.split('@')[0], role: effectiveRole } : null),
        loading,
        isAdmin: effectiveRole === 'admin',
        isManager: effectiveRole === 'manager',
        isCoordinator: effectiveRole === 'coordinator',
        isInstructor: effectiveRole === 'instructor',
        signOut: async () => {
            await supabase.auth.signOut();
            window.location.href = '/login';
        },
        refreshProfile: async () => {
            if (user) await fetchProfile(user.id);
        }
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
