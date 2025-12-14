'use client';

import { useState } from 'react';
import type { Case } from '@/types';
import { getTimeRemaining } from '@/lib/db';

interface CaseWaitingViewProps {
    caseCode: string;
    caseData: Case;
}

export function CaseWaitingView({ caseCode, caseData }: CaseWaitingViewProps) {
    const [copied, setCopied] = useState(false);
    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/case/${caseCode}`
        : `/case/${caseCode}`;
    
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };
    
    return (
        <div className="text-center">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-caution-amber/20 text-caution-amber text-sm font-bold rounded-full mb-6">
                <span className="w-2 h-2 bg-caution-amber rounded-full animate-pulse"></span>
                <span>AWAITING RESPONSE</span>
            </div>
            
            {/* Main Content */}
            <div className="mb-8">
                <h1 className="text-4xl md:text-5xl font-black text-starlight-white mb-4">
                    Waiting for Them...
                </h1>
                <p className="text-steel-grey text-lg">
                    The other party hasn&apos;t submitted their response yet
                </p>
            </div>
            
            {/* Status Card */}
            <div className="bg-charcoal-layer/50 border border-white/10 rounded-2xl p-8 mb-8">
                {/* Case Info */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
                    <div>
                        <div className="text-steel-grey text-xs uppercase tracking-wider">Case</div>
                        <div className="text-electric-violet font-mono font-bold">{caseCode}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-steel-grey text-xs uppercase tracking-wider">Time Left</div>
                        <div className="text-caution-amber font-medium">{getTimeRemaining(caseData.expires_at)}</div>
                    </div>
                </div>
                
                {/* Your Submission */}
                <div className="text-left mb-6 p-4 bg-midnight-void/50 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-steel-grey mb-2">
                        <span className="text-verdict-green">✓</span>
                        Your submission
                    </div>
                    <div className="text-starlight-white font-medium mb-1">{caseData.party_a_name}</div>
                    <div className="text-steel-grey text-sm line-clamp-2">{caseData.party_a_argument}</div>
                </div>
                
                {/* Waiting Animation */}
                <div className="flex items-center justify-center gap-4 py-6 mb-6">
                    <div className="w-12 h-12 bg-verdict-green/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">✍️</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-steel-grey rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-steel-grey rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-steel-grey rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border-2 border-dashed border-white/20">
                        <span className="text-steel-grey text-xl">?</span>
                    </div>
                </div>
                
                {/* Share Link Again */}
                <div>
                    <p className="text-steel-grey text-sm mb-3">Share the link again:</p>
                    <div className="flex items-center gap-2 p-2 bg-midnight-void/50 rounded-lg">
                        <div className="flex-1 font-mono text-xs text-starlight-white truncate">
                            {shareUrl}
                        </div>
                        <button
                            onClick={copyToClipboard}
                            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                                copied
                                    ? 'bg-verdict-green text-white'
                                    : 'bg-electric-violet/20 text-electric-violet hover:bg-electric-violet/30'
                            }`}
                        >
                            {copied ? '✓' : 'Copy'}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Refresh Hint */}
            <p className="text-steel-grey text-sm">
                Refresh this page to check for updates
            </p>
        </div>
    );
}
