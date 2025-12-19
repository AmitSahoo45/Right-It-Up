'use client';

import { useRef, useState } from 'react';
import type { Case, Verdict } from '@/types';
import { JUDGE_PERSONAS, CATEGORY_OPTIONS, TONE_OPTIONS } from '@/types';
import { formatDate } from '@/lib/utils';

// Color constants for html2canvas compatibility (no oklab)
const COLORS = {
    background: '#0F172A',
    charcoalLayer: '#1E293B',
    starlightWhite: '#F8FAFC',
    steelGrey: '#94A3B8',
    electricViolet: '#7C3AED',
    cyberBlue: '#3B82F6',
    verdictGreen: '#10B981',
    objectionRed: '#EF4444',
    cautionAmber: '#F59E0B',
    borderLight: 'rgba(255, 255, 255, 0.2)',
    borderDark: 'rgba(255, 255, 255, 0.1)',
    borderFaint: 'rgba(255, 255, 255, 0.05)',
};

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

    const isDraw = verdict.winner === 'draw';

    const downloadAsImage = async () => {
        if (!rulingRef.current) return;
        setIsDownloading(true);

        try {
            const html2canvas = (await import('html2canvas')).default;

            const canvas = await html2canvas(rulingRef.current, {
                backgroundColor: COLORS.background,
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
                style={{
                    backgroundColor: COLORS.background,
                    border: `1px solid ${COLORS.borderDark}`,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}
            >
                {/* Header */}
                <div style={{
                    background: `linear-gradient(to right, rgba(124, 58, 237, 0.2), rgba(59, 130, 246, 0.2))`,
                    padding: '24px',
                    borderBottom: `1px solid ${COLORS.borderDark}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ fontSize: '32px' }}>{judge.icon}</div>
                            <div>
                                <div style={{ color: COLORS.starlightWhite, fontWeight: 'bold' }}>{judge.name}</div>
                                <div style={{ color: COLORS.steelGrey, fontSize: '14px' }}>Presiding</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: COLORS.steelGrey }}>CASE #{caseData.code}</div>
                            <div style={{ fontSize: '12px', color: COLORS.steelGrey }}>{formatDate(verdict.created_at)}</div>
                        </div>
                    </div>
                </div>

                {/* Case Info */}
                <div style={{ padding: '24px', borderBottom: `1px solid ${COLORS.borderFaint}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                        <div>
                            <span style={{ color: COLORS.steelGrey }}>Category:</span>
                            <span style={{ marginLeft: '8px', color: COLORS.starlightWhite }}>{category?.icon} {category?.label}</span>
                        </div>
                        <div>
                            <span style={{ color: COLORS.steelGrey }}>Tone:</span>
                            <span style={{ marginLeft: '8px', color: COLORS.starlightWhite }}>{tone?.icon} {tone?.label}</span>
                        </div>
                    </div>
                </div>

                {/* Main Verdict */}
                <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    borderBottom: `1px solid ${COLORS.borderFaint}`,
                    backgroundColor: isDraw ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                }}>
                    <div style={{ fontSize: '12px', color: COLORS.steelGrey, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                        Official Ruling
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '900', marginBottom: '8px', color: isDraw ? COLORS.cautionAmber : COLORS.verdictGreen }}>
                        {isDraw ? '🤝 DRAW' : `🏆 ${winnerName?.toUpperCase()} WINS`}
                    </div>
                    <div style={{ color: COLORS.steelGrey, fontSize: '14px' }}>
                        Confidence Level: <span style={{
                            fontWeight: 'bold',
                            color: verdict.confidence >= 80 ? COLORS.verdictGreen :
                                verdict.confidence >= 60 ? COLORS.cautionAmber : COLORS.objectionRed
                        }}>{verdict.confidence}%</span>
                    </div>
                </div>

                {/* Summary */}
                <div style={{ padding: '24px', borderBottom: `1px solid ${COLORS.borderFaint}` }}>
                    <h3 style={{ color: COLORS.starlightWhite, fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
                        <span>📋</span> Summary
                    </h3>
                    <p style={{ color: COLORS.steelGrey, lineHeight: '1.6', margin: 0 }}>{verdict.summary}</p>
                </div>

                {/* Reasoning */}
                <div style={{ padding: '24px', borderBottom: `1px solid ${COLORS.borderFaint}` }}>
                    <h3 style={{ color: COLORS.starlightWhite, fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
                        <span>🧠</span> Reasoning
                    </h3>
                    <p style={{ color: COLORS.steelGrey, lineHeight: '1.6', margin: 0 }}>{verdict.reasoning}</p>
                </div>

                {/* Party Analysis - Collapsible */}
                <div style={{ padding: '24px', borderBottom: `1px solid ${COLORS.borderFaint}` }}>
                    <h3 style={{ color: COLORS.starlightWhite, fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
                        <span>📊</span> Detailed Analysis
                    </h3>

                    {/* Party A */}
                    <div style={{ marginBottom: '16px' }}>
                        <button
                            onClick={() => setExpandedSection(expandedSection === 'a' ? null : 'a')}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: `1px solid ${verdict.winner === 'partyA' ? 'rgba(16, 185, 129, 0.3)' : COLORS.borderFaint}`,
                                backgroundColor: verdict.winner === 'partyA' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(30, 41, 59, 0.3)',
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '20px' }}>{verdict.winner === 'partyA' ? '🏆' : '👤'}</span>
                                    <div>
                                        <div style={{ color: COLORS.starlightWhite, fontWeight: '500' }}>{caseData.party_a_name}</div>
                                        <div style={{ color: COLORS.steelGrey, fontSize: '14px' }}>Score: {verdict.party_a_score}/100</div>
                                    </div>
                                </div>
                                <svg style={{ width: '20px', height: '20px', color: COLORS.steelGrey, transform: expandedSection === 'a' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        {expandedSection === 'a' && (
                            <div style={{ marginTop: '8px', padding: '16px', backgroundColor: 'rgba(30, 41, 59, 0.2)', borderRadius: '12px' }}>
                                {verdict.party_a_analysis.strengths?.length > 0 && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ color: COLORS.verdictGreen, fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>✓ Strengths</div>
                                        <ul style={{ color: COLORS.steelGrey, fontSize: '14px', margin: 0, paddingLeft: '0', listStyle: 'none' }}>
                                            {verdict.party_a_analysis.strengths.map((s, i) => (
                                                <li key={i} style={{ marginBottom: '4px' }}>• {s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {verdict.party_a_analysis.weaknesses?.length > 0 && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ color: COLORS.objectionRed, fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>✗ Weaknesses</div>
                                        <ul style={{ color: COLORS.steelGrey, fontSize: '14px', margin: 0, paddingLeft: '0', listStyle: 'none' }}>
                                            {verdict.party_a_analysis.weaknesses.map((w, i) => (
                                                <li key={i} style={{ marginBottom: '4px' }}>• {w}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {verdict.party_a_analysis.fallacies?.length > 0 && (
                                    <div>
                                        <div style={{ color: COLORS.cautionAmber, fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>⚠ Fallacies</div>
                                        <ul style={{ color: COLORS.steelGrey, fontSize: '14px', margin: 0, paddingLeft: '0', listStyle: 'none' }}>
                                            {verdict.party_a_analysis.fallacies.map((f, i) => (
                                                <li key={i} style={{ marginBottom: '4px' }}>• {f}</li>
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
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: `1px solid ${verdict.winner === 'partyB' ? 'rgba(16, 185, 129, 0.3)' : COLORS.borderFaint}`,
                                backgroundColor: verdict.winner === 'partyB' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(30, 41, 59, 0.3)',
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '20px' }}>{verdict.winner === 'partyB' ? '🏆' : '👤'}</span>
                                    <div>
                                        <div style={{ color: COLORS.starlightWhite, fontWeight: '500' }}>{caseData.party_b_name}</div>
                                        <div style={{ color: COLORS.steelGrey, fontSize: '14px' }}>Score: {verdict.party_b_score}/100</div>
                                    </div>
                                </div>
                                <svg style={{ width: '20px', height: '20px', color: COLORS.steelGrey, transform: expandedSection === 'b' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        {expandedSection === 'b' && (
                            <div style={{ marginTop: '8px', padding: '16px', backgroundColor: 'rgba(30, 41, 59, 0.2)', borderRadius: '12px' }}>
                                {verdict.party_b_analysis.strengths?.length > 0 && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ color: COLORS.verdictGreen, fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>✓ Strengths</div>
                                        <ul style={{ color: COLORS.steelGrey, fontSize: '14px', margin: 0, paddingLeft: '0', listStyle: 'none' }}>
                                            {verdict.party_b_analysis.strengths.map((s, i) => (
                                                <li key={i} style={{ marginBottom: '4px' }}>• {s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {verdict.party_b_analysis.weaknesses?.length > 0 && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ color: COLORS.objectionRed, fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>✗ Weaknesses</div>
                                        <ul style={{ color: COLORS.steelGrey, fontSize: '14px', margin: 0, paddingLeft: '0', listStyle: 'none' }}>
                                            {verdict.party_b_analysis.weaknesses.map((w, i) => (
                                                <li key={i} style={{ marginBottom: '4px' }}>• {w}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {verdict.party_b_analysis.fallacies?.length > 0 && (
                                    <div>
                                        <div style={{ color: COLORS.cautionAmber, fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>⚠ Fallacies</div>
                                        <ul style={{ color: COLORS.steelGrey, fontSize: '14px', margin: 0, paddingLeft: '0', listStyle: 'none' }}>
                                            {verdict.party_b_analysis.fallacies.map((f, i) => (
                                                <li key={i} style={{ marginBottom: '4px' }}>• {f}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Advice */}
                <div style={{ padding: '24px' }}>
                    <h3 style={{ color: COLORS.starlightWhite, fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
                        <span>💡</span> Advice
                    </h3>
                    <p style={{ color: COLORS.steelGrey, lineHeight: '1.6', margin: 0 }}>{verdict.advice}</p>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px',
                    backgroundColor: 'rgba(30, 41, 59, 0.3)',
                    borderTop: `1px solid ${COLORS.borderFaint}`,
                    textAlign: 'center',
                }}>
                    <div style={{ color: COLORS.steelGrey, fontSize: '12px' }}>
                        This verdict is final • Generated by AI • For entertainment purposes only
                    </div>
                    <div style={{ color: COLORS.steelGrey, fontSize: '10px', marginTop: '4px' }}>
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