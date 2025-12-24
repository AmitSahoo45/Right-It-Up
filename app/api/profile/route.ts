import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/lib/db-profile';
import type { GetProfileResponse } from '@/types/profile';

export async function GET(): Promise<NextResponse<GetProfileResponse>> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const profile = await getUserProfile(user.id);

        if (!profile) {
            // Return empty profile for new users
            return NextResponse.json({
                success: true,
                profile: {
                    stats: null,
                    badges: [],
                    recent_cases: []
                }
            });
        }

        return NextResponse.json({
            success: true,
            profile
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}