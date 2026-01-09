'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVerdictPolling } from '@/hooks/useVerdictPolling';

interface AnalyzingViewProps {
    caseCode: string;
}

export function AnalyzingView({ caseCode }: AnalyzingViewProps) {
    const router = useRouter();
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const { status, error, isPolling } = useVerdictPolling({
        code: caseCode,
        enabled: true,
        interval: 3000,
        maxAttempts: 40
    });

    // Timer for elapsed time
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-redirect when complete
    useEffect(() => {
        if (status?.status === 'complete') {
            router.push(`/verdict/${caseCode}`);
        }
    }, [status, caseCode, router]);

    const steps = [
        { label: 'Reading arguments', threshold: 2 },
        { label: 'Analyzing evidence', threshold: 8 },
        { label: 'Evaluating positions', threshold: 15 },
        { label: 'Generating verdict', threshold: 22 },
    ];

    return (
        <div className="text-center py-20">
            <div className="text-6xl mb-6 animate-pulse">⚖️</div>
            <h1 className="text-3xl font-black text-starlight-white mb-4">
                Analyzing Arguments...
            </h1>
            <p className="text-steel-grey mb-8">
                The AI judge is reviewing both sides.
            </p>

            {/* Progress Steps */}
            <div className="max-w-xs mx-auto mb-8 text-left">
                {steps.map((step, i) => {
                    const isComplete = elapsedSeconds > step.threshold;
                    const isCurrent = !isComplete && (i === 0 || elapsedSeconds > steps[i - 1].threshold);

                    return (
                        <div key={i} className="flex items-center gap-3 py-2">
                            <span className={`text-lg ${isComplete ? 'text-green-500' : isCurrent ? 'text-electric-violet animate-pulse' : 'text-steel-grey'}`}>
                                {isComplete ? '✓' : isCurrent ? '●' : '○'}
                            </span>
                            <span className={`${isComplete ? 'text-starlight-white' : isCurrent ? 'text-starlight-white' : 'text-steel-grey'}`}>
                                {step.label}
                                {isCurrent && <span className="ml-2 text-steel-grey">...</span>}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Timer */}
            <p className="text-steel-grey text-sm mb-4">
                {elapsedSeconds < 30
                    ? `Processing... (${elapsedSeconds}s)`
                    : elapsedSeconds < 60
                        ? `Almost there... (${elapsedSeconds}s)`
                        : `Taking longer than expected. Please wait... (${elapsedSeconds}s)`}
            </p>

            {/* Shimmer progress bar */}
            <div className="flex justify-center mb-4">
                <div className="w-64 h-2 bg-charcoal-layer rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-electric-violet to-cyber-blue animate-shimmer"></div>
                </div>
            </div>

            {/* Polling status indicator */}
            {isPolling && (
                <p className="text-steel-grey text-xs">
                    Auto-refreshing...
                </p>
            )}

            {error && (
                <p className="text-amber-500 text-sm mt-2">
                    {error} - Will retry automatically
                </p>
            )}
        </div>
    );
}
