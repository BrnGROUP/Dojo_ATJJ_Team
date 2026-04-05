import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface Badge {
    id: string;
    name: string;
    description: string;
    category: string;
    level: string;
    icon: string;
    xp_reward: number;
    criteria_type: string;
    criteria_value: number;
    badge_group: string | null;
    is_active: boolean;
}

interface MemberBadge {
    id: string;
    badge_id: string;
    badge: Badge;
}

const LEVEL_ORDER = ['Bronze', 'Prata', 'Ouro', 'Diamante'];

function getLevelIndex(level: string): number {
    return LEVEL_ORDER.indexOf(level);
}

/**
 * Badge Engine — Real-time badge checking and awarding.
 * Called after each attendance check-in or manual XP award.
 */
export async function checkAndAwardBadges(memberId: string, awardedBy?: string): Promise<void> {
    try {
        // 1. Fetch all active auto-awarding badges
        const { data: allBadges, error: badgeErr } = await supabase
            .from('badges')
            .select('*')
            .eq('is_active', true)
            .neq('criteria_type', 'manual');

        if (badgeErr || !allBadges) return;

        // 2. Fetch member's already-earned badges with badge details
        const { data: earnedRaw } = await supabase
            .from('member_badges')
            .select('id, badge_id, badge:badges(*)')
            .eq('member_id', memberId);

        const earned: MemberBadge[] = (earnedRaw || []).map((e: any) => ({
            id: e.id,
            badge_id: e.badge_id,
            badge: e.badge
        }));
        const earnedBadgeIds = new Set(earned.map(e => e.badge_id));

        // 3. Fetch member attendance data
        const { count: totalAttendance } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('member_id', memberId);

        const consecutiveStreak = await calculateConsecutiveStreak(memberId);

        // 4. Evaluate each badge
        for (const badge of allBadges) {
            // Skip if already earned
            if (earnedBadgeIds.has(badge.id)) continue;

            let qualifies = false;

            if (badge.criteria_type === 'total_presence') {
                qualifies = (totalAttendance || 0) >= badge.criteria_value;
            } else if (badge.criteria_type === 'consecutive_presence') {
                qualifies = consecutiveStreak >= badge.criteria_value;
            }

            if (qualifies) {
                await awardBadge(memberId, badge, earned, awardedBy);
            }
        }
    } catch (error) {
        console.error('[BadgeEngine] Error checking badges:', error);
    }
}

/**
 * Awards a badge to a member, handling level progression.
 * If the badge belongs to a group, removes lower-level badges from the same group.
 */
async function awardBadge(
    memberId: string,
    badge: Badge,
    existingBadges: MemberBadge[],
    awardedBy?: string
): Promise<void> {
    try {
        // Handle badge group progression (only one level per group)
        if (badge.badge_group) {
            const sameGroupBadges = existingBadges.filter(
                e => e.badge?.badge_group === badge.badge_group
            );

            for (const existing of sameGroupBadges) {
                const existingLevel = getLevelIndex(existing.badge.level);
                const newLevel = getLevelIndex(badge.level);

                // Don't award if they already have same or higher level
                if (existingLevel >= newLevel) return;

                // Remove lower-level badge
                await supabase
                    .from('member_badges')
                    .delete()
                    .eq('id', existing.id);
            }
        }

        // Insert new badge
        const { error: insertErr } = await supabase
            .from('member_badges')
            .insert({
                member_id: memberId,
                badge_id: badge.id,
                awarded_by: awardedBy || null,
                awarded_note: awardedBy ? null : 'Conquista automática pelo sistema'
            });

        if (insertErr) {
            // Unique constraint violation = already awarded (race condition safety)
            if (insertErr.code === '23505') return;
            throw insertErr;
        }

        // Grant XP reward
        if (badge.xp_reward > 0) {
            await supabase.from('xp_logs').insert({
                member_id: memberId,
                amount: badge.xp_reward,
                reason: `🏅 Insígnia "${badge.name}" conquistada`
            });

            // Update member XP
            const { data: member } = await supabase
                .from('members')
                .select('xp')
                .eq('id', memberId)
                .single();

            if (member) {
                await supabase
                    .from('members')
                    .update({ xp: (member.xp || 0) + badge.xp_reward })
                    .eq('id', memberId);
            }
        }

        // Show achievement toast
        showBadgeToast(badge);

    } catch (error) {
        console.error(`[BadgeEngine] Error awarding badge "${badge.name}":`, error);
    }
}

/**
 * Manually award a badge to a member (used by instructors/admins).
 */
export async function awardBadgeManually(
    memberId: string,
    badgeId: string,
    awardedBy: string,
    note?: string
): Promise<boolean> {
    try {
        // Fetch badge details
        const { data: badge, error: badgeErr } = await supabase
            .from('badges')
            .select('*')
            .eq('id', badgeId)
            .single();

        if (badgeErr || !badge) {
            toast.error('Insígnia não encontrada.');
            return false;
        }

        // Fetch existing badges
        const { data: earnedRaw } = await supabase
            .from('member_badges')
            .select('id, badge_id, badge:badges(*)')
            .eq('member_id', memberId);

        const earned: MemberBadge[] = (earnedRaw || []).map((e: any) => ({
            id: e.id,
            badge_id: e.badge_id,
            badge: e.badge
        }));

        // Check group-level progression
        if (badge.badge_group) {
            const sameGroupBadges = earned.filter(
                e => e.badge?.badge_group === badge.badge_group
            );

            for (const existing of sameGroupBadges) {
                const existingLevel = getLevelIndex(existing.badge.level);
                const newLevel = getLevelIndex(badge.level);

                if (existingLevel >= newLevel) {
                    toast.error(`Aluno já possui nível ${existing.badge.level} desta insígnia.`);
                    return false;
                }

                // Remove lower-level
                await supabase
                    .from('member_badges')
                    .delete()
                    .eq('id', existing.id);
            }
        } else {
            // No group — check if already has exact badge
            if (earned.some(e => e.badge_id === badgeId)) {
                toast.error('Aluno já possui esta insígnia.');
                return false;
            }
        }

        // Insert
        const { error: insertErr } = await supabase
            .from('member_badges')
            .insert({
                member_id: memberId,
                badge_id: badgeId,
                awarded_by: awardedBy,
                awarded_note: note || null
            });

        if (insertErr) {
            toast.error('Erro ao outorgar insígnia.');
            return false;
        }

        // Grant XP
        if (badge.xp_reward > 0) {
            await supabase.from('xp_logs').insert({
                member_id: memberId,
                amount: badge.xp_reward,
                reason: `🏅 Insígnia "${badge.name}" outorgada manualmente`
            });

            const { data: member } = await supabase
                .from('members')
                .select('xp')
                .eq('id', memberId)
                .single();

            if (member) {
                await supabase
                    .from('members')
                    .update({ xp: (member.xp || 0) + badge.xp_reward })
                    .eq('id', memberId);
            }
        }

        showBadgeToast(badge);
        return true;

    } catch (error) {
        console.error('[BadgeEngine] Manual award error:', error);
        toast.error('Erro inesperado ao outorgar insígnia.');
        return false;
    }
}

/**
 * Calculate consecutive training streak (consecutive days with attendance).
 */
async function calculateConsecutiveStreak(memberId: string): Promise<number> {
    const { data: attendance } = await supabase
        .from('attendance')
        .select('created_at')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(365);

    if (!attendance || attendance.length === 0) return 0;

    // Group by date (YYYY-MM-DD)
    const dates = [...new Set(
        attendance.map(a => new Date(a.created_at).toISOString().split('T')[0])
    )].sort((a, b) => b.localeCompare(a)); // descending

    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
        const curr = new Date(dates[i]);
        const prev = new Date(dates[i - 1]);
        const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Show a premium toast notification for badge achievement.
 */
function showBadgeToast(badge: Badge): void {
    const levelEmoji: Record<string, string> = {
        'Bronze': '🥉',
        'Prata': '🥈',
        'Ouro': '🥇',
        'Diamante': '💎'
    };

    toast.success(
        `${levelEmoji[badge.level] || '🏅'} ${badge.name} conquistada! +${badge.xp_reward} XP`,
        {
            duration: 6000,
            style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #d72638',
                borderRadius: '16px',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: '700',
                boxShadow: '0 0 30px rgba(215, 38, 56, 0.3)',
            },
            iconTheme: {
                primary: '#d72638',
                secondary: '#fff',
            },
        }
    );
}

/**
 * Fetch all badges earned by a specific member.
 */
export async function fetchMemberBadges(memberId: string) {
    const { data, error } = await supabase
        .from('member_badges')
        .select('*, badge:badges(*)')
        .eq('member_id', memberId)
        .order('awarded_at', { ascending: false });

    if (error) {
        console.error('[BadgeEngine] Error fetching member badges:', error);
        return [];
    }

    return data || [];
}

/**
 * Count how many members have each badge (for admin stats).
 */
export async function fetchBadgeMemberCounts(): Promise<Record<string, number>> {
    const { data, error } = await supabase
        .from('member_badges')
        .select('badge_id');

    if (error || !data) return {};

    return data.reduce((acc, row) => {
        acc[row.badge_id] = (acc[row.badge_id] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
}
