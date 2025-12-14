'use client';

import { createClient } from '@/utils/supabase/client';
import type { QuotaCheck } from '@/types';

export { formatDate, getTimeRemaining } from '../lib/utils';

export async function getMyQuota(): Promise<QuotaCheck> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        const res = await fetch('/api/quota');
        return res.json();
    }

    const { data, error } = await supabase
        .rpc('check_user_quota', { p_user_id: user.id });

    if (error) return { can_use: false, remaining: 0, used: 5 };
    return data[0] || { can_use: false, remaining: 0, used: 5 };
}