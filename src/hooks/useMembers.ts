
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Member {
    id: string;
    full_name: string;
    email: string;
    belt: string;
    stripes: number;
    plan: string;
    enrolled_classes: string[];
    status: string;
    xp: number;
    type?: string;
    role?: string; 
    avatar_url?: string;
}

export function useMembers() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMembers();
    }, []);

    async function fetchMembers() {
        setLoading(true);
        try {
            const [profilesRes, membersRes] = await Promise.all([
                supabase.from('profiles').select('*'),
                supabase.from('members').select('*')
            ]);

            if (profilesRes.error) console.error('Erro perfis:', profilesRes.error);
            if (membersRes.error) console.error('Erro membros:', membersRes.error);

            const profiles = profilesRes.data || [];
            const membersData = membersRes.data || [];

            // Mapas para busca eficiente
            const mByUserId = new Map();
            const mByEmail = new Map();
            const mById = new Map();

            membersData.forEach(m => {
                if (m.user_id) mByUserId.set(m.user_id, m);
                if (m.email) mByEmail.set(m.email.toLowerCase().trim(), m);
                mById.set(m.id, m);
            });

            const processedMemberIds = new Set();
            const unifiedList: Member[] = [];

            // 1. Processar perfis (Prioridade: Staff/Admins que tem conta)
            profiles.forEach(p => {
                // Tenta achar o membro correspondente por UUID ou Email
                const m = mByUserId.get(p.id) || mByEmail.get(p.email?.toLowerCase().trim());
                
                if (m) {
                    processedMemberIds.add(m.id);
                }

                unifiedList.push({
                    id: p.id, // Preferir o ID do profile (UUID) como chave principal
                    full_name: p.full_name || m?.full_name || 'Sem nome',
                    email: p.email || m?.email || '',
                    role: p.role,
                    belt: m?.belt || 'Branca',
                    stripes: m?.stripes || 0,
                    plan: m?.plan || 'Nenhum',
                    enrolled_classes: m?.enrolled_classes || [],
                    status: m?.status || 'Active',
                    xp: m?.xp || 0,
                    type: m?.type || (p.role === 'admin' || p.role === 'manager' ? 'staff' : 'student'),
                    avatar_url: m?.avatar_url || p.avatar_url || ''
                });
            });

            // 2. Adicionar membros que NÃO foram vinculados a um profile ainda (Alunos sem login)
            membersData.forEach(m => {
                if (!processedMemberIds.has(m.id)) {
                    unifiedList.push({
                        id: m.id,
                        full_name: m.full_name || 'Membro sem perfil',
                        email: m.email || '',
                        role: 'student',
                        belt: m.belt || 'Branca',
                        stripes: m.stripes || 0,
                        plan: m.plan || 'Nenhum',
                        enrolled_classes: m.enrolled_classes || [],
                        status: m.status || 'Active',
                        xp: m.xp || 0,
                        type: m.type || 'student',
                        avatar_url: m.avatar_url || ''
                    });
                }
            });

            const finalUnifiedList = unifiedList.map(item => ({
                ...item,
                full_name: item.full_name?.toUpperCase() || '',
                plan: item.plan?.toUpperCase() || ''
            }));

            finalUnifiedList.sort((a, b) => a.full_name.localeCompare(b.full_name));
            setMembers(finalUnifiedList);
        } catch (err) {
            console.error('Erro unificação:', err);
        } finally {
            setLoading(false);
        }
    }

    async function deleteMember(id: string) {
        try {
            // Deletar usando ambos para garantir limpeza
            await Promise.all([
                supabase.from('members').delete().eq('id', id),
                supabase.from('members').delete().eq('user_id', id),
                supabase.from('profiles').delete().eq('id', id)
            ]);
            await fetchMembers();
            return true;
        } catch (err) {
            console.error('Error deleting member:', err);
            return false;
        }
    }

    async function updateMemberStatus(id: string, currentStatus: string) {
        const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        try {
            // Tenta or de id ou user_id
            const { error } = await supabase
                .from('members')
                .update({ 
                    status: nextStatus
                })
                .or(`id.eq.${id},user_id.eq.${id}`);

            if (error) throw error;
            await fetchMembers();
            return true;
        } catch (err) {
            console.error('Error updating status:', err);
            return false;
        }
    }

    return {
        members,
        loading,
        refresh: fetchMembers,
        updateMemberStatus,
        deleteMember
    };
}
