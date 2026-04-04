import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface MemberSnapshot {
    id?: string;
    belt?: string;
    stripes?: number;
    xp?: number;
    [key: string]: unknown;
}

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string;
    member?: MemberSnapshot;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    isAdmin: boolean;
    isManager: boolean;
    isCoordinator: boolean;
    isInstructor: boolean;
    signOut: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
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
            
            // 1. Buscar perfil básico (sem join que pode falhar por RLS)
            const { data: profileRow, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (profileError) throw profileError;

            // 2. Pegar o e-mail do usuário autenticado
            const userEmail = profileRow?.email || user?.email;

            // 3. Buscar o membro - tentar múltiplas estratégias
            let memberData: any = null;
            
            // Estratégia A: Busca direta por e-mail
            if (userEmail) {
                const { data: memberRow } = await supabase
                    .from('members')
                    .select('*')
                    .eq('email', userEmail.toLowerCase().trim())
                    .maybeSingle();
                memberData = memberRow;
            }

            // Estratégia B: Busca direta por user_id
            if (!memberData) {
                const { data: memberById } = await supabase
                    .from('members')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();
                memberData = memberById;
            }

            // Estratégia C: RPC SECURITY DEFINER (ignora RLS - funciona para alunos)
            if (!memberData) {
                console.warn('Queries diretas em members falharam (RLS?). Usando RPC...');
                const { data: rpcResult } = await supabase.rpc('get_my_member_info');
                if (rpcResult) {
                    memberData = rpcResult;
                    console.log('Member recuperado via RPC:', memberData?.full_name);
                }
            }

            // 5. Montar perfil
            let profileData = profileRow;

            // Se perfil não existe, criar
            if (!profileData) {
                console.warn('Perfil não encontrado. Criando perfil base...');
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (authUser) {
                    const displayName = memberData?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário';
                    const newProfile: any = {
                        id: userId,
                        full_name: displayName,
                        email: authUser.email,
                        role: authUser.user_metadata?.role || (authUser.email?.includes('claudio.bruno') ? 'admin' : 'student'),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    const { data: createdData, error: createError } = await supabase
                        .from('profiles')
                        .insert([newProfile])
                        .select('*')
                        .maybeSingle();

                    if (createError) throw createError;
                    profileData = createdData;
                }
            }

            if (profileData) {
                // Vincular o member ao perfil
                (profileData as any).member = memberData || null;

                // Sobrescrever o full_name com o nome real do membro (se existir)
                if (memberData?.full_name) {
                    profileData.full_name = memberData.full_name;
                }

                // Sincronizar user_id no member se estiver ausente
                if (memberData && !memberData.user_id) {
                    await supabase
                        .from('members')
                        .update({ user_id: userId })
                        .eq('id', memberData.id);
                }

                console.log('Perfil final:', { name: profileData.full_name, member: memberData?.full_name });
                setProfile(profileData as UserProfile);
            } else {
                setProfile(null);
            }
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }

    // Lógica de Admin Forçado (Seguro para Debug)
    const effectiveRole = profile?.role || (user?.email?.includes('claudio.bruno') ? 'admin' : 'student');

    // Buscar nome do membro vinculado para o fallback
    const fallbackName = (profile?.member as any)?.full_name || profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';

    const value = {
        user,
        profile: profile || (user ? {
            id: user.id,
            full_name: fallbackName,
            email: user.email || '',
            role: effectiveRole
        } : null),
        loading,
        isAdmin: effectiveRole === 'admin',
        isManager: effectiveRole === 'manager',
        isCoordinator: effectiveRole === 'coordinator',
        isInstructor: effectiveRole === 'instructor',
        signOut: async () => {
            await supabase.auth.signOut();
            window.location.href = '/login';
        },
        signIn: async (email: string, password: string) => {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            return { error: error as Error | null };
        },
        signUp: async (email: string, password: string, fullName: string) => {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'admin' // Default to admin for now as requested
                    }
                }
            });
            return { error: error as Error | null };
        },
        refreshProfile: async () => {
            if (user) await fetchProfile(user.id);
        }
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
