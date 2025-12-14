'use client';

import { useRef, useState } from 'react';
import type { Case, Verdict } from '@/types';
import { JUDGE_PERSONAS, CATEGORY_OPTIONS, TONE_OPTIONS } from '@/types';
import { formatDate } from '@/lib/db';

interface VerdictRulingProps {
    caseData: Case;
    verdict: Verdict;
}

export function VerdictRuling({ caseData, verdict }: VerdictRulingProps) {
    const rulingRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [expandedSection, setExpandedSection] = useState<'a' | 'b' | null>(null);
    
    const judge = JUDGE_PERSONAS[caseData.category];
    const category = CATEGORY_OPTIONS.find(c => c.value === caseData.category);
    const tone = TONE_OPTIONS.find(t => t.value === caseData.tone);
    
    const winnerName = verdict.winner === 'partyA'
        ? caseData.party_a_name
        : verdict.winner === 'partyB'
            ? caseData.party_b_name
            : null;
    
    const loserName = verdict.winner === 'partyA'
        ? caseData.party_b_name
        : verdict.winner === 'partyB'
            ? caseData.party_a_name
            : null;
    
    const isDraw = verdict.winner === 'draw';
    
    const downloadAsImage = async () => {
        if (!rulingRef.current) return;
        setIsDownloading(true);
        
        try {
            const html2canvas = (await import('html2canvas')).default;
            
            const canvas = await html2canvas(rulingRef.current, {
                backgroundColor: '#0F172A',
                scale: 2,
                logging: false,
                useCORS: true
            });
            
            const link = document.createElement('a');
            link.download = `ruling-${caseData.code}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Failed to download:', error);
        }
        
        setIsDownloading(false);
    };
    
    return (
        <div>
            {/* Ruling Document */}
            <div
                ref={rulingRef}
                className="bg-midnight-void border border-white/10 rounded-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-electric-violet/20 to-cyber-blue/20 p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="text-4xl">{judge.icon}</div>
                            <div>
                                <div className="text-starlight-white font-bold">{judge.name}</div>
                                <div className="text-steel-grey text-sm">Presiding</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-steel-grey">CASE #{caseData.code}</div>
                            <div className="text-xs text-steel-grey">{formatDate(verdict.created_at)}</div>
                        </div>
                    </div>
                </div>
                
                {/* Case Info */}
                <div className="p-6 border-b border-white/5">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-steel-grey">Category:</span>
                            <span className="ml-2 text-starlight-white">{category?.icon} {category?.label}</span>
                        </div>
                        <div>
                            <span className="text-steel-grey">Tone:</span>
                            <span className="ml-2 text-starlight-white">{tone?.icon} {tone?.label}</span>
                        </div>
                    </div>
                </div>
                
                {/* Main Verdict */}
                <div className={`p-6 text-center border-b border-white/5 ${
                    isDraw ? 'bg-caution-amber/5' : 'bg-verdict-green/5'
                }`}>
                    <div className="text-xs text-steel-grey uppercase tracking-wider mb-2">
                        Official Ruling
                    </div>
                    <div className={`text-3xl font-black mb-2 ${
                        isDraw ? 'text-caution-amber' : 'text-verdict-green'
                    }`}>
                        {isDraw ? '🤝 DRAW' : `🏆 ${winnerName?.toUpperCase()} WINS`}
                    </div>
                    <div className="text-steel-grey text-sm">
                        Confidence Level: <span className={`font-bold ${
                            verdict.confidence >= 80 ? 'text-verdict-green' :
                            verdict.confidence >= 60 ? 'text-caution-amber' :
                            'text-objection-red'
                        }`}>{verdict.confidence}%</span>
                    </div>
                </div>
                
                {/* Summary */}
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-starlight-white font-bold mb-3 flex items-center gap-2">
                        <span>📋</span> Summary
                    </h3>
                    <p className="text-steel-grey leading-relaxed">{verdict.summary}</p>
                </div>
                
                {/* Reasoning */}
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-starlight-white font-bold mb-3 flex items-center gap-2">
                        <span>🧠</span> Reasoning
                    </h3>
                    <p className="text-steel-grey leading-relaxed">{verdict.reasoning}</p>
                </div>
                
                {/* Party Analysis - Collapsible */}
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-starlight-white font-bold mb-4 flex items-center gap-2">
                        <span>📊</span> Detailed Analysis
                    </h3>
                    
                    {/* Party A */}
                    <div className="mb-4">
                        <button
                            onClick={() => setExpandedSection(expandedSection === 'a' ? null : 'a')}
                            className={`w-full p-4 rounded-xl border transition-all text-left ${
                                verdict.winner === 'partyA'
                                    ? 'bg-verdict-green/10 border-verdict-green/30'
                                    : 'bg-charcoal-layer/30 border-white/5'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{verdict.winner === 'partyA' ? '🏆' : '👤'}</span>
                                    <div>
                                        <div className="text-starlight-white font-medium">{caseData.party_a_name}</div>
                                        <div className="text-steel-grey text-sm">Score: {verdict.party_a_score}/100</div>
                                    </div>
                                </div>
                                <svg className={`w-5 h-5 text-steel-grey transition-transform ${expandedSection === 'a' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>
                        
                        {expandedSection === 'a' && (
                            <div className="mt-2 p-4 bg-charcoal-layer/20 rounded-xl space-y-3">
                                {verdict.party_a_analysis.strengths?.length > 0 && (
                                    <div>
                                        <div className="text-verdict-green text-xs font-medium mb-1">✓ Strengths</div>
                                        <ul className="text-steel-grey text-sm space-y-1">
                                            {verdict.party_a_analysis.strengths.map((s, i) => (
                                                <li key={i}>• {s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {verdict.party_a_analysis.weaknesses?.length > 0 && (
                                    <div>
                                        <div className="text-objection-red text-xs font-medium mb-1">✗ Weaknesses</div>
                                        <ul className="text-steel-grey text-sm space-y-1">
                                            {verdict.party_a_analysis.weaknesses.map((w, i) => (
                                                <li key={i}>• {w}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {verdict.party_a_analysis.fallacies?.length > 0 && (
                                    <div>
                                        <div className="text-caution-amber text-xs font-medium mb-1">⚠ Fallacies</div>
                                        <ul className="text-steel-grey text-sm space-y-1">
                                            {verdict.party_a_analysis.fallacies.map((f, i) => (
                                                <li key={i}>• {f}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Party B */}
                    <div>
                        <button
                            onClick={() => setExpandedSection(expandedSection === 'b' ? null : 'b')}
                            className={`w-full p-4 rounded-xl border transition-all text-left ${
                                verdict.winner === 'partyB'
                                    ? 'bg-verdict-green/10 border-verdict-green/30'
                                    : 'bg-charcoal-layer/30 border-white/5'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{verdict.winner === 'partyB' ? '🏆' : '👤'}</span>
                                    <div>
                                        <div className="text-starlight-white font-medium">{caseData.party_b_name}</div>
                                        <div className="text-steel-grey text-sm">Score: {verdict.party_b_score}/100</div>
                                    </div>
                                </div>
                                <svg className={`w-5 h-5 text-steel-grey transition-transform ${expandedSection === 'b' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>
                        
                        {expandedSection === 'b' && (
                            <div className="mt-2 p-4 bg-charcoal-layer/20 rounded-xl space-y-3">
                                {verdict.party_b_analysis.strengths?.length > 0 && (
                                    <div>
                                        <div className="text-verdict-green text-xs font-medium mb-1">✓ Strengths</div>
                                        <ul className="text-steel-grey text-sm space-y-1">
                                            {verdict.party_b_analysis.strengths.map((s, i) => (
                                                <li key={i}>• {s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {verdict.party_b_analysis.weaknesses?.length > 0 && (
                                    <div>
                                        <div className="text-objection-red text-xs font-medium mb-1">✗ Weaknesses</div>
                                        <ul className="text-steel-grey text-sm space-y-1">
                                            {verdict.party_b_analysis.weaknesses.map((w, i) => (
                                                <li key={i}>• {w}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {verdict.party_b_analysis.fallacies?.length > 0 && (
                                    <div>
                                        <div className="text-caution-amber text-xs font-medium mb-1">⚠ Fallacies</div>
                                        <ul className="text-steel-grey text-sm space-y-1">
                                            {verdict.party_b_analysis.fallacies.map((f, i) => (
                                                <li key={i}>• {f}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Advice */}
                <div className="p-6">
                    <h3 className="text-starlight-white font-bold mb-3 flex items-center gap-2">
                        <span>💡</span> Advice
                    </h3>
                    <p className="text-steel-grey leading-relaxed">{verdict.advice}</p>
                </div>
                
                {/* Footer */}
                <div className="p-4 bg-charcoal-layer/30 border-t border-white/5 text-center">
                    <div className="text-steel-grey text-xs">
                        This verdict is final • Generated by AI • For entertainment purposes only
                    </div>
                    <div className="text-steel-grey text-[10px] mt-1">
                        rightitup.vercel.app
                    </div>
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
                        📥 Download Full Ruling
                    </span>
                )}
            </button>
        </div>
    );
}
