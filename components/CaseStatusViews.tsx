import Link from 'next/link';
import type { Case } from '@/types';
import type { User } from '@supabase/supabase-js';

// ============================================
// EXPIRED VIEW
// ============================================

interface CaseExpiredViewProps {
    caseCode: string;
}

export function CaseExpiredView({ caseCode }: CaseExpiredViewProps) {
    return (
        <div className="text-center">
            <div className="text-6xl mb-6">⏰</div>
            <h1 className="text-4xl font-black text-starlight-white mb-4">
                Case Expired
            </h1>
            <p className="text-steel-grey mb-8">
                Case <span className="text-electric-violet font-mono">{caseCode}</span> has expired because the other party didn&apos;t respond within 2 days.
            </p>
            <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-electric-violet to-cyber-blue text-white font-bold rounded-xl hover:shadow-electric-glow transition-all"
            >
                Start a New Case
            </Link>
        </div>
    );
}

// ============================================
// BLOCKED VIEW (Quota Issue)
// ============================================

interface CaseBlockedViewProps {
    caseData: Case;
    isPartyA: boolean;
    isPartyB: boolean;
    user: User | null;
}

export function CaseBlockedView({ caseData, isPartyA, isPartyB, user }: CaseBlockedViewProps) {
    // Determine who needs to sign in
    const partyANeedsSignIn = !caseData.party_a_id;
    const partyBNeedsSignIn = !caseData.party_b_id;

    // Am I the one blocking?
    const iAmBlocking = (isPartyA && partyANeedsSignIn) || (isPartyB && partyBNeedsSignIn);

    return (
        <div className="text-center">
            <div className="text-6xl mb-6">🔒</div>
            <h1 className="text-4xl font-black text-starlight-white mb-4">
                Verdict Locked
            </h1>

            {iAmBlocking && !user ? (
                <>
                    <p className="text-steel-grey mb-8">
                        You need to sign in to unlock this verdict.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-electric-violet to-cyber-blue text-white font-bold rounded-xl hover:shadow-electric-glow transition-all"
                    >
                        Sign In to Unlock
                    </Link>
                </>
            ) : isPartyA && partyANeedsSignIn ? (
                <>
                    <p className="text-steel-grey mb-8">
                        Sign in to unlock this verdict and get 5 verdicts per day!
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-electric-violet to-cyber-blue text-white font-bold rounded-xl hover:shadow-electric-glow transition-all"
                    >
                        Sign In to Unlock
                    </Link>
                </>
            ) : (
                <>
                    <p className="text-steel-grey mb-8">
                        The other party ({partyANeedsSignIn ? caseData.party_a_name : caseData.party_b_name}) needs to sign in to unlock this verdict.
                    </p>
                    <div className="bg-charcoal-layer/50 border border-white/10 rounded-xl p-6 max-w-md mx-auto">
                        <p className="text-steel-grey text-sm">
                            Let them know they need to sign in at{' '}
                            <span className="text-electric-violet font-mono">
                                {process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ?
                                    'http://localhost:3000' : 'https://rightitup.vercel.app'}/login</span>
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
