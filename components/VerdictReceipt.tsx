'use client';

import { useRef, useState } from 'react';
import type { Case, Verdict } from '@/types';
import { JUDGE_PERSONAS, CATEGORY_OPTIONS } from '@/types';
import { formatDate } from '@/lib/utils';

// Color constants for html2canvas compatibility (no oklab)
const COLORS = {
    background: '#1a1a2e',
    charcoalLayer: '#1E293B',
    starlightWhite: '#F8FAFC',
    steelGrey: '#94A3B8',
    cyberBlue: '#3B82F6',
    verdictGreen: '#10B981',
    objectionRed: '#EF4444',
    cautionAmber: '#F59E0B',
    borderLight: 'rgba(255, 255, 255, 0.2)',
    borderDark: 'rgba(255, 255, 255, 0.1)',
};

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
            const html2canvas = (await import('html2canvas')).default;

            const canvas = await html2canvas(receiptRef.current, {
                backgroundColor: COLORS.background,
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
                style={{
                    backgroundColor: COLORS.background,
                    borderRadius: '16px',
                    padding: '24px',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '14px',
                    border: `1px solid ${COLORS.borderDark}`,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
            >
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    borderBottom: `1px dashed ${COLORS.borderLight}`,
                    paddingBottom: '16px',
                    marginBottom: '16px',
                }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>⚖️</div>
                    <div style={{ color: COLORS.starlightWhite, fontWeight: 'bold', fontSize: '18px', letterSpacing: '0.1em' }}>
                        RIGHT IT UP
                    </div>
                    <div style={{ color: COLORS.steelGrey, fontSize: '12px' }}>OFFICIAL VERDICT RECEIPT</div>
                    <div style={{ color: COLORS.steelGrey, fontSize: '12px', marginTop: '4px' }}>Case #{caseData.code}</div>
                </div>

                {/* Parties */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: COLORS.steelGrey }}>Party A:</span>
                        <span style={{ color: verdict.winner === 'partyA' ? COLORS.verdictGreen : COLORS.cyberBlue }}>
                            {caseData.party_a_name}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: COLORS.steelGrey }}>Party B:</span>
                        <span style={{ color: verdict.winner === 'partyB' ? COLORS.verdictGreen : COLORS.objectionRed }}>
                            {caseData.party_b_name}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: COLORS.steelGrey }}>Category:</span>
                        <span style={{ color: COLORS.cautionAmber }}>{category?.icon} {category?.label}</span>
                    </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop: `1px dashed ${COLORS.borderLight}`, margin: '16px 0' }}></div>

                {/* Scores */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ color: COLORS.steelGrey }}>{caseData.party_a_name}&apos;s Score:</span>
                            <span style={{ fontWeight: 'bold', color: verdict.winner === 'partyA' ? COLORS.verdictGreen : COLORS.starlightWhite }}>
                                {verdict.party_a_score}/100
                            </span>
                        </div>
                        <div style={{ width: '100%', backgroundColor: COLORS.charcoalLayer, borderRadius: '9999px', height: '8px' }}>
                            <div
                                style={{
                                    height: '8px',
                                    borderRadius: '9999px',
                                    background: verdict.winner === 'partyA'
                                        ? `linear-gradient(to right, ${COLORS.verdictGreen}, ${COLORS.cyberBlue})`
                                        : COLORS.cyberBlue,
                                    width: `${verdict.party_a_score}%`,
                                }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ color: COLORS.steelGrey }}>{caseData.party_b_name}&apos;s Score:</span>
                            <span style={{ fontWeight: 'bold', color: verdict.winner === 'partyB' ? COLORS.verdictGreen : COLORS.starlightWhite }}>
                                {verdict.party_b_score}/100
                            </span>
                        </div>
                        <div style={{ width: '100%', backgroundColor: COLORS.charcoalLayer, borderRadius: '9999px', height: '8px' }}>
                            <div
                                style={{
                                    height: '8px',
                                    borderRadius: '9999px',
                                    background: verdict.winner === 'partyB'
                                        ? `linear-gradient(to right, ${COLORS.verdictGreen}, ${COLORS.cyberBlue})`
                                        : COLORS.objectionRed,
                                    width: `${verdict.party_b_score}%`,
                                }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop: `1px dashed ${COLORS.borderLight}`, margin: '16px 0' }}></div>

                {/* Verdict Box */}
                <div style={{
                    textAlign: 'center',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    backgroundColor: isDraw ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    border: `1px solid ${isDraw ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                }}>
                    <div style={{ color: COLORS.steelGrey, fontSize: '12px', marginBottom: '4px' }}>THE VERDICT IS IN</div>
                    <div style={{ fontWeight: '900', fontSize: '24px', color: isDraw ? COLORS.cautionAmber : COLORS.verdictGreen }}>
                        {isDraw ? '🤝 IT\'S A DRAW' : `🏆 ${winnerName} WINS`}
                    </div>
                    <div style={{ color: COLORS.steelGrey, fontSize: '12px', marginTop: '4px' }}>Confidence: {verdict.confidence}%</div>
                </div>

                {/* Summary */}
                <div style={{ color: COLORS.steelGrey, fontSize: '12px', lineHeight: '1.6', marginBottom: '16px' }}>
                    &quot;{verdict.summary}&quot;
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', borderTop: `1px dashed ${COLORS.borderLight}`, paddingTop: '16px' }}>
                    <div style={{ color: COLORS.steelGrey, fontSize: '12px' }}>════════════════════</div>
                    <div style={{ color: COLORS.steelGrey, fontSize: '10px', marginTop: '8px' }}>
                        Judged by {judge.name} {judge.icon} • {formatDate(verdict.created_at)}
                    </div>
                    <div style={{ color: COLORS.steelGrey, fontSize: '10px' }}>rightitup.vercel.app</div>
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
