import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkQuota, getClientIp } from '@/lib/db';
import type { QuotaCheck } from '@/types';

export async function GET(request: Request): Promise<NextResponse<QuotaCheck>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const clientIp = getClientIp(request);
        
        const quota = await checkQuota(user?.id || null, clientIp);
        
        return NextResponse.json(quota);
        
    } catch (error) {
        console.error('Error checking quota:', error);
        // Return restrictive quota on error
        return NextResponse.json({
            can_use: false,
            remaining: 0,
            used: 5
        });
    }
}
