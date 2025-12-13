"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Subscription {
    id: string;
    user_id: string;
    plan_tier: 'free' | 'pro' | 'business';
    status: string;
    current_period_end: string;
}

export function useSubscription() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionsThisMonth, setSessionsThisMonth] = useState(0);

    useEffect(() => {
        loadSubscription();
    }, []);

    async function loadSubscription() {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            // Get subscription
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            setSubscription(sub);

            // Get usage count for this month
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count } = await supabase
                .from('usage_tracking')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('session_start', startOfMonth.toISOString());

            setSessionsThisMonth(count || 0);
            setLoading(false);

        } catch (error) {
            console.error('Failed to load subscription:', error);
            setLoading(false);
        }
    }

    function canCreateSession(): { allowed: boolean; reason?: string } {
        if (!subscription) {
            return { allowed: false, reason: 'No subscription found' };
        }

        if (subscription.plan_tier === 'free' && sessionsThisMonth >= 5) {
            return {
                allowed: false,
                reason: 'Free plan limit reached (5 sessions/month). Upgrade to Pro for unlimited sessions.'
            };
        }

        return { allowed: true };
    }

    return {
        subscription,
        loading,
        sessionsThisMonth,
        canCreateSession,
        reload: loadSubscription,
    };
}
