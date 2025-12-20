import { createClient } from '@/utils/supabase/server';
import { getCaseWithVerdict, checkQuota } from '@/lib/db';
import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { CaseCreatedView } from '@/components/CaseCreatedView';
import { CaseResponseForm } from '@/components/CaseResponseForm';
import { CaseWaitingView } from '@/components/CaseWaitingView';
import { CaseBlockedView, CaseExpiredView } from '@/components/CaseStatusViews';

interface CasePageProps {
    params: Promise<{ code: string }>;
    searchParams: Promise<{ created?: string }>;
}

export default async function CasePage({ params, searchParams }: CasePageProps) {
    const { code } = await params;
    const { created } = await searchParams;
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get client IP
    const headersList = await headers();
    const clientIp = headersList.get('x-forwarded-for')?.split(',')[0] ||
                     headersList.get('x-real-ip') ||
                     '0.0.0.0';
    
    // Get case data
    const result = await getCaseWithVerdict(code);
    
    if (!result) {
        notFound();
    }
    
    const { case: caseData, verdict } = result;
    
    // If case is complete, redirect to verdict page
    if (caseData.status === 'complete' && verdict) {
        redirect(`/verdict/${code}`);
    }
    
    // Determine user's role
    const isPartyA = user
        ? caseData.party_a_id === user.id
        : caseData.party_a_ip === clientIp;
    
    const isPartyB = user
        ? caseData.party_b_id === user.id
        : caseData.party_b_ip === clientIp;
    
    // Get quota for current user
    const quota = await checkQuota(user?.id || null, clientIp);
    
    return (
        <div className="min-h-screen">
            <Navbar user={user} quota={quota} />
            
            <main className="pt-28 md:pt-32 px-4 md:px-10 pb-20">
                <div className="max-w-2xl mx-auto">
                    {/* Case Expired */}
                    {caseData.status === 'expired' && (
                        <CaseExpiredView caseCode={code} />
                    )}
                    
                    {/* Case blocked due to quota */}
                    {caseData.status === 'blocked_quota' && (
                        <CaseBlockedView
                            caseData={caseData}
                            isPartyA={isPartyA}
                            isPartyB={isPartyB}
                            user={user}
                        />
                    )}
                    
                    {/* Party A just created - show share screen */}
                    {caseData.status === 'pending_response' && isPartyA && created === 'true' && (
                        <CaseCreatedView caseCode={code} caseData={caseData} />
                    )}
                    
                    {/* Party A checking status - show waiting screen */}
                    {caseData.status === 'pending_response' && isPartyA && created !== 'true' && (
                        <CaseWaitingView caseCode={code} caseData={caseData} />
                    )}
                    
                    {/* Party B (or new visitor) - show response form */}
                    {caseData.status === 'pending_response' && !isPartyA && (
                        <CaseResponseForm
                            caseCode={code}
                            caseData={caseData}
                        />
                    )}
                    
                    {/* Analyzing state */}
                    {caseData.status === 'analyzing' && (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-6 animate-pulse">⚖️</div>
                            <h1 className="text-3xl font-black text-starlight-white mb-4">
                                Analyzing Arguments...
                            </h1>
                            <p className="text-steel-grey mb-8">
                                The AI judge is reviewing both sides. This usually takes less than 30 seconds.
                            </p>
                            <div className="flex justify-center">
                                <div className="w-64 h-2 bg-charcoal-layer rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-electric-violet to-cyber-blue animate-shimmer"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
