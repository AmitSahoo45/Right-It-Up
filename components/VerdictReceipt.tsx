'use client';

import { useRef, useState } from 'react';
import type { Case, Verdict } from '@/types';
import { JUDGE_PERSONAS, CATEGORY_OPTIONS } from '@/types';
import { formatDate } from '@/lib/db';

interface VerdictReceiptProps {
    caseData: Case;
    verdict: Verdict;
}

export function VerdictReceipt({ caseData, verdict }: VerdictReceiptProps) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    
    const judge = JUDGE_PERSONAS[caseData.category];
    const category = CATEGORY_OPTIONS.find(c => c.value === caseData.category);
    
    const winnerName = verdict.winner === 'partyA' 
        ? caseData.party_a_name 
        : verdict.winner === 'partyB' 
            ? caseData.party_b_name 
            : null;
    
    const isDraw = verdict.winner === 'draw';
    
    const downloadAsImage = async () => {
        if (!receiptRef.current) return;
        setIsDownloading(true);
        
        try {
            // Dynamic import html2canvas
            const html2canvas = (await import('html2canvas')).default;
            
            const canvas = await html2canvas(receiptRef.current, {
                backgroundColor: '#1a1a2e',
                scale: 2,
                logging: false,
                useCORS: true
            });
            
            const link = document.createElement('a');
            link.download = `verdict-${caseData.code}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Failed to download:', error);
        }
        
        setIsDownloading(false);
    };
    
    return (
        <div>
            {/* Receipt Card */}
            <div
                ref={receiptRef}
                className="bg-[#1a1a2e] rounded-2xl p-6 font-mono text-sm border border-white/10 shadow-2xl"
            >
                {/* Header */}
                <div className="text-center border-b border-dashed border-white/20 pb-4 mb-4">
                    <div className="text-2xl mb-1">⚖️</div>
                    <div className="text-starlight-white font-bold text-lg tracking-wider">RIGHT IT UP</div>
                    <div className="text-steel-grey text-xs">OFFICIAL VERDICT RECEIPT</div>
                    <div className="text-steel-grey text-xs mt-1">Case #{caseData.code}</div>
                </div>
                
                {/* Parties */}
                <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                        <span className="text-steel-grey">Party A:</span>
                        <span className={verdict.winner === 'partyA' ? 'text-verdict-green' : 'text-cyber-blue'}>
                            {caseData.party_a_name}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-steel-grey">Party B:</span>
                        <span className={verdict.winner === 'partyB' ? 'text-verdict-green' : 'text-objection-red'}>
                            {caseData.party_b_name}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-steel-grey">Category:</span>
                        <span className="text-caution-amber">{category?.icon} {category?.label}</span>
                    </div>
                </div>
                
                {/* Divider */}
                <div className="border-t border-dashed border-white/20 my-4"></div>
                
                {/* Scores */}
                <div className="space-y-3 mb-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-steel-grey">{caseData.party_a_name}&apos;s Score:</span>
                            <span className={`font-bold ${verdict.winner === 'partyA' ? 'text-verdict-green' : 'text-starlight-white'}`}>
                                {verdict.party_a_score}/100
                            </span>
                        </div>
                        <div className="w-full bg-charcoal-layer rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${verdict.winner === 'partyA' ? 'bg-gradient-to-r from-verdict-green to-cyber-blue' : 'bg-cyber-blue'}`}
                                style={{ width: `${verdict.party_a_score}%` }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-steel-grey">{caseData.party_b_name}&apos;s Score:</span>
                            <span className={`font-bold ${verdict.winner === 'partyB' ? 'text-verdict-green' : 'text-starlight-white'}`}>
                                {verdict.party_b_score}/100
                            </span>
                        </div>
                        <div className="w-full bg-charcoal-layer rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${verdict.winner === 'partyB' ? 'bg-gradient-to-r from-verdict-green to-cyber-blue' : 'bg-objection-red'}`}
                                style={{ width: `${verdict.party_b_score}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
                
                {/* Divider */}
                <div className="border-t border-dashed border-white/20 my-4"></div>
                
                {/* Verdict Box */}
                <div className={`text-center py-4 rounded-xl border mb-4 ${
                    isDraw
                        ? 'bg-caution-amber/10 border-caution-amber/30'
                        : 'bg-verdict-green/10 border-verdict-green/30'
                }`}>
                    <div className="text-steel-grey text-xs mb-1">THE VERDICT IS IN</div>
                    <div className={`font-black text-2xl ${isDraw ? 'text-caution-amber' : 'text-verdict-green'}`}>
                        {isDraw ? '🤝 IT\'S A DRAW' : `🏆 ${winnerName} WINS`}
                    </div>
                    <div className="text-steel-grey text-xs mt-1">Confidence: {verdict.confidence}%</div>
                </div>
                
                {/* Summary */}
                <div className="text-steel-grey text-xs leading-relaxed mb-4">
                    &quot;{verdict.summary}&quot;
                </div>
                
                {/* Footer */}
                <div className="text-center border-t border-dashed border-white/20 pt-4">
                    <div className="text-steel-grey text-xs">════════════════════</div>
                    <div className="text-steel-grey text-[10px] mt-2">
                        Judged by {judge.name} {judge.icon} • {formatDate(verdict.created_at)}
                    </div>
                    <div className="text-steel-grey text-[10px]">rightitup.vercel.app</div>
                </div>
            </div>
            
            {/* Download Button */}
            <button
                onClick={downloadAsImage}
                disabled={isDownloading}
                className="w-full mt-4 py-3 bg-charcoal-layer border border-white/10 rounded-xl text-starlight-white font-medium hover:bg-charcoal-layer/70 hover:border-electric-violet/30 transition-all disabled:opacity-50"
            >
                {isDownloading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating...
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        📥 Download Receipt
                    </span>
                )}
            </button>
        </div>
    );
}
