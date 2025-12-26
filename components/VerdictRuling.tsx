'use client';

import { useRef, useState } from 'react';
import type { Case, Verdict, EvidenceQuality, GaslightingSeverity, DetectedFallacy, FallacyEntry } from '@/types';
import { JUDGE_PERSONAS, CATEGORY_OPTIONS, TONE_OPTIONS, LOGICAL_FALLACIES, GASLIGHTING_SEVERITY_CONFIG } from '@/types';
import { formatDate } from '@/lib/utils';

// Color constants for html2canvas compatibility
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

// ============================================
// HELPER FUNCTIONS
// ============================================

function getFallacyIcon(fallacyName: string): string {
    const fallacy = LOGICAL_FALLACIES.find(f =>
        fallacyName.toLowerCase().includes(f.name.toLowerCase())
    );
    return fallacy?.icon || '⚠️';
}

function isDetectedFallacy(fallacy: FallacyEntry): fallacy is DetectedFallacy {
    return typeof fallacy === 'object' && 'name' in fallacy;
}

function getFallacyName(fallacy: FallacyEntry): string {
    if (isDetectedFallacy(fallacy)) {
        return fallacy.name;
    }
    return fallacy;
}

// ============================================
// EVIDENCE QUALITY BADGE
// ============================================

function EvidenceQualityBadge({ quality }: { quality?: EvidenceQuality }) {
    if (!quality) return null;

    const config = {
        strong: { color: COLORS.verdictGreen, bg: 'rgba(16, 185, 129, 0.1)', label: '💪 Strong Evidence' },
        moderate: { color: COLORS.cyberBlue, bg: 'rgba(59, 130, 246, 0.1)', label: '📊 Moderate Evidence' },
        weak: { color: COLORS.cautionAmber, bg: 'rgba(245, 158, 11, 0.1)', label: '⚠️ Weak Evidence' },
        none: { color: COLORS.objectionRed, bg: 'rgba(239, 68, 68, 0.1)', label: '❌ No Evidence' },
    }[quality];

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '6px',
            backgroundColor: config.bg,
            color: config.color,
            fontSize: '11px',
            fontWeight: '600',
        }}>
            {config.label}
        </span>
    );
}

// ============================================
// GASLIGHTING SEVERITY BADGE
// ============================================

function GaslightingSeverityBadge({ severity }: { severity: GaslightingSeverity }) {
    const config = GASLIGHTING_SEVERITY_CONFIG[severity];

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: `${config.color}20`,
            color: config.color,
            fontSize: '11px',
            fontWeight: '600',
            border: `1px solid ${config.color}40`,
        }}>
            {config.icon} {config.label}
        </span>
    );
}

// ============================================
// FALLACY CARD COMPONENT
// ============================================

function FallacyCard({ fallacy }: { fallacy: FallacyEntry }) {
    const isDetailed = isDetectedFallacy(fallacy);
    const name = getFallacyName(fallacy);
    const icon = getFallacyIcon(name);

    if (isDetailed) {
        return (
            <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '8px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px' }}>{icon}</span>
                    <span style={{ color: COLORS.objectionRed, fontWeight: '600', fontSize: '13px' }}>
                        {fallacy.name}
                    </span>
                </div>
                {fallacy.instance && (
                    <p style={{
                        color: COLORS.steelGrey,
                        fontSize: '12px',
                        fontStyle: 'italic',
                        margin: '0 0 6px 0',
                        paddingLeft: '24px',
                    }}>
                        &ldquo;{fallacy.instance}&rdquo;
                    </p>
                )}
                {fallacy.impact && (
                    <p style={{
                        color: COLORS.starlightWhite,
                        fontSize: '12px',
                        margin: 0,
                        paddingLeft: '24px',
                        opacity: 0.9,
                    }}>
                        → {fallacy.impact}
                    </p>
                )}
            </div>
        );
    }

    // Legacy string fallacy
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '6px',
            marginBottom: '4px',
        }}>
            <span style={{ fontSize: '14px' }}>{icon}</span>
            <span style={{ color: COLORS.objectionRed, fontSize: '12px', fontWeight: '500' }}>
                {name}
            </span>
        </div>
    );
}

// ============================================
// GASLIGHTING ANALYSIS SECTION
// ============================================

function GaslightingSection({
    gaslighting,
    partyName
}: {
    gaslighting: { detected: boolean; severity: GaslightingSeverity; instances: string[]; explanation: string } | undefined;
    partyName: string;
}) {
    if (!gaslighting) return null;

    const { detected, severity, instances, explanation } = gaslighting;

    if (!detected || severity === 'none') {
        return null;
    }

    const severityConfig = GASLIGHTING_SEVERITY_CONFIG[severity];

    return (
        <div style={{
            backgroundColor: `${severityConfig.color}15`,
            border: `1px solid ${severityConfig.color}30`,
            borderRadius: '12px',
            padding: '16px',
            marginTop: '12px',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
            }}>
                <span style={{
                    color: COLORS.starlightWhite,
                    fontWeight: '700',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    💡 Gaslighting Detected
                </span>
                <GaslightingSeverityBadge severity={severity} />
            </div>

            {instances && instances.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                    <p style={{
                        color: COLORS.steelGrey,
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                    }}>
                        Instances Found:
                    </p>
                    {instances.map((instance, idx) => (
                        <div key={idx} style={{
                            padding: '8px 12px',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '6px',
                            marginBottom: '6px',
                            borderLeft: `3px solid ${severityConfig.color}`,
                        }}>
                            <p style={{
                                color: COLORS.starlightWhite,
                                fontSize: '12px',
                                margin: 0,
                                fontStyle: 'italic',
                            }}>
                                &ldquo;{instance}&rdquo;
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {explanation && (
                <p style={{
                    color: COLORS.steelGrey,
                    fontSize: '12px',
                    margin: 0,
                    lineHeight: '1.5',
                }}>
                    {explanation}
                </p>
            )}
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface VerdictRulingProps {
    caseData: Case;
    verdict: Verdict;
}

export function VerdictRuling({ caseData, verdict }: VerdictRulingProps) {
    const rulingRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [expandedSection, setExpandedSection] = useState<'a' | 'b' | 'fallacies' | 'gaslighting' | null>(null);

    const judge = JUDGE_PERSONAS[caseData.category];
    const category = CATEGORY_OPTIONS.find(c => c.value === caseData.category);
    const tone = TONE_OPTIONS.find(t => t.value === caseData.tone);

    const winnerName = verdict.winner === 'partyA'
        ? caseData.party_a_name
        : verdict.winner === 'partyB'
            ? caseData.party_b_name
            : null;

    const winnerColor = verdict.winner === 'draw' ? COLORS.cautionAmber : COLORS.verdictGreen;

    // Count total fallacies
    const partyAFallacies = verdict.party_a_analysis?.fallacies || [];
    const partyBFallacies = verdict.party_b_analysis?.fallacies || [];
    const totalFallacies = partyAFallacies.length + partyBFallacies.length;

    // Check for gaslighting
    const partyAGaslighting = verdict.party_a_analysis?.gaslighting;
    const partyBGaslighting = verdict.party_b_analysis?.gaslighting;
    const hasGaslighting = (partyAGaslighting?.detected && partyAGaslighting.severity !== 'none') ||
        (partyBGaslighting?.detected && partyBGaslighting.severity !== 'none');

    const downloadImage = async () => {
        if (!rulingRef.current || isDownloading) return;
        setIsDownloading(true);

        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(rulingRef.current, {
                backgroundColor: COLORS.background,
                scale: 2,
                logging: false,
                useCORS: true,
            });

            const link = document.createElement('a');
            link.download = `ruling-${caseData.code}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Failed to download image:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div>
            {/* Download Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button
                    onClick={downloadImage}
                    disabled={isDownloading}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        backgroundColor: COLORS.electricViolet,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: isDownloading ? 'not-allowed' : 'pointer',
                        opacity: isDownloading ? 0.7 : 1,
                    }}
                >
                    {isDownloading ? '⏳ Generating...' : '📥 Download Ruling'}
                </button>
            </div>

            {/* Main Ruling Card */}
            <div
                ref={rulingRef}
                style={{
                    backgroundColor: COLORS.background,
                    padding: '24px',
                    borderRadius: '16px',
                    border: `1px solid ${COLORS.borderDark}`,
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: `1px solid ${COLORS.borderDark}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '32px' }}>{judge.icon}</span>
                        <div>
                            <div style={{ color: COLORS.starlightWhite, fontWeight: '700', fontSize: '18px' }}>
                                {judge.name}
                            </div>
                            <div style={{ color: COLORS.steelGrey, fontSize: '12px' }}>
                                {category?.label} • {tone?.label} Tone
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: COLORS.steelGrey, fontSize: '11px' }}>Case #{caseData.code}</div>
                        <div style={{ color: COLORS.steelGrey, fontSize: '11px' }}>{formatDate(verdict.created_at)}</div>
                    </div>
                </div>

                {/* Verdict Banner */}
                <div style={{
                    backgroundColor: `${winnerColor}15`,
                    border: `2px solid ${winnerColor}`,
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    marginBottom: '24px',
                }}>
                    <div style={{ color: COLORS.steelGrey, fontSize: '12px', marginBottom: '8px' }}>
                        THE VERDICT
                    </div>
                    <div style={{ color: winnerColor, fontSize: '28px', fontWeight: '800' }}>
                        {verdict.winner === 'draw' ? '⚖️ DRAW' : `🏆 ${winnerName} WINS`}
                    </div>
                    <div style={{ color: COLORS.steelGrey, fontSize: '14px', marginTop: '8px' }}>
                        Confidence: {verdict.confidence}%
                    </div>
                </div>

                {/* Fallacy & Gaslighting Summary */}
                {(totalFallacies > 0 || hasGaslighting) && (
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '24px',
                        flexWrap: 'wrap',
                    }}>
                        {totalFallacies > 0 && (
                            <div style={{
                                flex: '1',
                                minWidth: '200px',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '12px',
                                padding: '16px',
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '8px',
                                }}>
                                    <span style={{ fontSize: '20px' }}>🎭</span>
                                    <span style={{
                                        color: COLORS.objectionRed,
                                        fontWeight: '700',
                                        fontSize: '14px',
                                    }}>
                                        Logical Fallacies Detected
                                    </span>
                                </div>
                                <div style={{
                                    color: COLORS.starlightWhite,
                                    fontSize: '24px',
                                    fontWeight: '800',
                                }}>
                                    {totalFallacies}
                                </div>
                                <div style={{
                                    color: COLORS.steelGrey,
                                    fontSize: '12px',
                                }}>
                                    {partyAFallacies.length} from {caseData.party_a_name} • {partyBFallacies.length} from {caseData.party_b_name}
                                </div>
                            </div>
                        )}

                        {hasGaslighting && (
                            <div style={{
                                flex: '1',
                                minWidth: '200px',
                                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                                border: '1px solid rgba(124, 58, 237, 0.2)',
                                borderRadius: '12px',
                                padding: '16px',
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '8px',
                                }}>
                                    <span style={{ fontSize: '20px' }}>💡</span>
                                    <span style={{
                                        color: COLORS.electricViolet,
                                        fontWeight: '700',
                                        fontSize: '14px',
                                    }}>
                                        Gaslighting Analysis
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {partyAGaslighting?.detected && partyAGaslighting.severity !== 'none' && (
                                        <div>
                                            <div style={{ color: COLORS.steelGrey, fontSize: '11px', marginBottom: '4px' }}>
                                                {caseData.party_a_name}:
                                            </div>
                                            <GaslightingSeverityBadge severity={partyAGaslighting.severity} />
                                        </div>
                                    )}
                                    {partyBGaslighting?.detected && partyBGaslighting.severity !== 'none' && (
                                        <div>
                                            <div style={{ color: COLORS.steelGrey, fontSize: '11px', marginBottom: '4px' }}>
                                                {caseData.party_b_name}:
                                            </div>
                                            <GaslightingSeverityBadge severity={partyBGaslighting.severity} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Score Comparison */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '24px',
                }}>
                    {/* Party A */}
                    <div style={{
                        backgroundColor: COLORS.charcoalLayer,
                        borderRadius: '12px',
                        padding: '16px',
                        border: verdict.winner === 'partyA' ? `2px solid ${COLORS.verdictGreen}` : `1px solid ${COLORS.borderDark}`,
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px',
                        }}>
                            <span style={{ color: COLORS.starlightWhite, fontWeight: '700' }}>
                                {caseData.party_a_name}
                            </span>
                            {verdict.winner === 'partyA' && (
                                <span style={{ fontSize: '16px' }}>🏆</span>
                            )}
                        </div>
                        <div style={{
                            color: verdict.winner === 'partyA' ? COLORS.verdictGreen : COLORS.cyberBlue,
                            fontSize: '32px',
                            fontWeight: '800',
                        }}>
                            {verdict.party_a_score}
                        </div>
                        <EvidenceQualityBadge quality={verdict.party_a_analysis?.evidenceQuality} />

                        {/* Fallacies for Party A */}
                        {partyAFallacies.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                                <button
                                    onClick={() => setExpandedSection(expandedSection === 'a' ? null : 'a')}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '6px',
                                        color: COLORS.objectionRed,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <span>🎭 {partyAFallacies.length} Fallacies</span>
                                    <span>{expandedSection === 'a' ? '▲' : '▼'}</span>
                                </button>
                                {expandedSection === 'a' && (
                                    <div style={{ marginTop: '8px' }}>
                                        {partyAFallacies.map((f, i) => (
                                            <FallacyCard key={i} fallacy={f} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Gaslighting for Party A */}
                        <GaslightingSection
                            gaslighting={partyAGaslighting}
                            partyName={caseData.party_a_name}
                        />
                    </div>

                    {/* Party B */}
                    <div style={{
                        backgroundColor: COLORS.charcoalLayer,
                        borderRadius: '12px',
                        padding: '16px',
                        border: verdict.winner === 'partyB' ? `2px solid ${COLORS.verdictGreen}` : `1px solid ${COLORS.borderDark}`,
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px',
                        }}>
                            <span style={{ color: COLORS.starlightWhite, fontWeight: '700' }}>
                                {caseData.party_b_name}
                            </span>
                            {verdict.winner === 'partyB' && (
                                <span style={{ fontSize: '16px' }}>🏆</span>
                            )}
                        </div>
                        <div style={{
                            color: verdict.winner === 'partyB' ? COLORS.verdictGreen : COLORS.cyberBlue,
                            fontSize: '32px',
                            fontWeight: '800',
                        }}>
                            {verdict.party_b_score}
                        </div>
                        <EvidenceQualityBadge quality={verdict.party_b_analysis?.evidenceQuality} />

                        {/* Fallacies for Party B */}
                        {partyBFallacies.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                                <button
                                    onClick={() => setExpandedSection(expandedSection === 'b' ? null : 'b')}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '6px',
                                        color: COLORS.objectionRed,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <span>🎭 {partyBFallacies.length} Fallacies</span>
                                    <span>{expandedSection === 'b' ? '▲' : '▼'}</span>
                                </button>
                                {expandedSection === 'b' && (
                                    <div style={{ marginTop: '8px' }}>
                                        {partyBFallacies.map((f, i) => (
                                            <FallacyCard key={i} fallacy={f} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Gaslighting for Party B */}
                        <GaslightingSection
                            gaslighting={partyBGaslighting}
                            partyName={caseData.party_b_name || 'Party B'}
                        />
                    </div>
                </div>

                {/* Summary */}
                <div style={{
                    backgroundColor: COLORS.charcoalLayer,
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                }}>
                    <div style={{
                        color: COLORS.electricViolet,
                        fontSize: '12px',
                        fontWeight: '600',
                        marginBottom: '8px',
                    }}>
                        SUMMARY
                    </div>
                    <p style={{
                        color: COLORS.starlightWhite,
                        fontSize: '14px',
                        lineHeight: '1.6',
                        margin: 0,
                    }}>
                        {verdict.summary}
                    </p>
                </div>

                {/* Reasoning */}
                <div style={{
                    backgroundColor: COLORS.charcoalLayer,
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                }}>
                    <div style={{
                        color: COLORS.cyberBlue,
                        fontSize: '12px',
                        fontWeight: '600',
                        marginBottom: '8px',
                    }}>
                        REASONING
                    </div>
                    <p style={{
                        color: COLORS.steelGrey,
                        fontSize: '14px',
                        lineHeight: '1.6',
                        margin: 0,
                    }}>
                        {verdict.reasoning}
                    </p>
                </div>

                {/* Advice */}
                <div style={{
                    backgroundColor: COLORS.charcoalLayer,
                    borderRadius: '12px',
                    padding: '16px',
                }}>
                    <div style={{
                        color: COLORS.verdictGreen,
                        fontSize: '12px',
                        fontWeight: '600',
                        marginBottom: '8px',
                    }}>
                        💡 ADVICE
                    </div>
                    <p style={{
                        color: COLORS.steelGrey,
                        fontSize: '14px',
                        lineHeight: '1.6',
                        margin: 0,
                    }}>
                        {verdict.advice}
                    </p>
                </div>

                {/* Evidence Impact (if any) */}
                {verdict.evidence_impact && (
                    <div style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginTop: '16px',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                    }}>
                        <div style={{
                            color: COLORS.cyberBlue,
                            fontSize: '12px',
                            fontWeight: '600',
                            marginBottom: '8px',
                        }}>
                            📎 EVIDENCE IMPACT
                        </div>
                        <p style={{
                            color: COLORS.steelGrey,
                            fontSize: '14px',
                            lineHeight: '1.6',
                            margin: 0,
                        }}>
                            {verdict.evidence_impact}
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: `1px solid ${COLORS.borderDark}`,
                }}>
                    <div style={{ color: COLORS.steelGrey, fontSize: '11px' }}>
                        Generated by Right It Up • AI-Powered Dispute Resolution
                    </div>
                    <div style={{ color: COLORS.electricViolet, fontSize: '11px', marginTop: '4px' }}>
                        rightitup.vercel.app
                    </div>
                </div>
            </div>
        </div>
    );
}