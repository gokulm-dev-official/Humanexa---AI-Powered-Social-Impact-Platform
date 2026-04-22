
import React from 'react';
import { COLORS, CANVAS, mmToPx, FONTS } from '../../../constants/certificateDesign';

interface DiamondCertificateProps {
    recipientName: string;
    date: string;
    metrics: {
        activities?: number;
        points?: number;
        livesImpacted?: number;
        continents?: string;
        countries?: string;
        categories?: string;
        trustScore?: string;
        activeDays?: number;
        globalRank?: string;
        impactScore?: string;
        verificationRate?: string;
        innovationIndex?: string;
        legacyProjects?: string;
        awardsReceived?: string;
    };
    certificateID: string;
    qrCodeDataUrl: string;
}

/**
 * ✨ DIAMOND TIER — "Eternal Resonance"
 * Design Language: The apex of minimalism. Near-black elegance with
 * a single prismatic accent. Inspired by Apple's most exclusive
 * special editions — dark, commanding, otherworldly.
 */
export const DiamondCertificate: React.FC<DiamondCertificateProps> = ({
    recipientName,
    date,
    metrics,
    certificateID,
    qrCodeDataUrl,
}) => {
    const bg = '#0A0A0B';
    const surface = '#141416';
    const border = '#1E1E22';
    const textPrimary = '#FAFAFA';
    const textSecondary = '#71717A';
    const textMuted = '#52525B';

    // Prismatic accent gradient
    const prismGrad = 'linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899, #F59E0B, #10B981, #3B82F6)';
    const prismGradHorizontal = 'linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899, #F59E0B, #10B981)';

    return (
        <div
            style={{
                width: '3508px',
                height: '2480px',
                background: bg,
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Inter', -apple-system, sans-serif",
            }}
        >
            {/* Ambient prismatic glow — very subtle */}
            <div style={{
                position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '1600px', height: '1600px',
                background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, rgba(59,130,246,0.02) 30%, transparent 60%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '10%', right: '20%',
                width: '1000px', height: '1000px',
                background: 'radial-gradient(circle, rgba(236,72,153,0.03) 0%, transparent 50%)',
                pointerEvents: 'none',
            }} />

            {/* Border — prismatic gradient line */}
            <div style={{
                position: 'absolute', top: '80px', left: '80px', right: '80px', bottom: '80px',
                borderRadius: '20px', padding: '1.5px',
                background: prismGrad, opacity: 0.2,
            }}>
                <div style={{
                    width: '100%', height: '100%', background: bg, borderRadius: '18px',
                }} />
            </div>

            {/* Inner subtle border */}
            <div style={{
                position: 'absolute', top: '100px', left: '100px', right: '100px', bottom: '100px',
                border: `1px solid ${border}`, borderRadius: '14px',
            }} />

            {/* ═══ TOP PRISMATIC LINE ═══ */}
            <div style={{
                position: 'absolute', top: '80px', left: '600px', right: '600px',
                height: '2px', background: prismGradHorizontal, opacity: 0.25,
                borderRadius: '2px',
            }} />

            {/* ═══ HEADER ═══ */}
            <div style={{ position: 'absolute', top: '200px', width: '100%', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                    <span style={{ fontSize: '18px' }}>💎</span>
                    <p style={{
                        fontSize: '22px', fontWeight: 700, letterSpacing: '0.35em',
                        color: textSecondary, textTransform: 'uppercase',
                    }}>
                        Social Kind Foundation
                    </p>
                    <span style={{ fontSize: '18px' }}>💎</span>
                </div>
            </div>

            {/* ═══ MAIN TITLE ═══ */}
            <div style={{ position: 'absolute', top: '320px', width: '100%', textAlign: 'center' }}>
                <p style={{
                    fontSize: '18px', fontWeight: 700, letterSpacing: '0.5em',
                    color: textMuted, textTransform: 'uppercase', marginBottom: '20px',
                }}>
                    Eternal Distinction
                </p>

                <h1 style={{
                    fontSize: '92px', fontWeight: 800, letterSpacing: '-0.02em',
                    background: prismGrad,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    lineHeight: 1.05,
                }}>
                    Diamond Icon
                </h1>

                <p style={{
                    fontSize: '20px', fontWeight: 400, color: textSecondary,
                    marginTop: '16px', fontStyle: 'italic',
                    fontFamily: "'Playfair Display', serif",
                }}>
                    The Highest Honor in Verified Social Impact
                </p>
            </div>

            {/* ═══ BRILLIANT DIAMOND EMBLEM ═══ */}
            <div style={{
                position: 'absolute', top: '650px', left: '50%', transform: 'translateX(-50%)',
            }}>
                <svg width="200" height="200" viewBox="0 0 100 100" fill="none" style={{
                    filter: 'drop-shadow(0 0 30px rgba(139,92,246,0.15))',
                }}>
                    <defs>
                        <linearGradient id="diamondPrism" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="25%" stopColor="#8B5CF6" />
                            <stop offset="50%" stopColor="#EC4899" />
                            <stop offset="75%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                    </defs>
                    {/* Outer rings */}
                    <circle cx="50" cy="50" r="46" stroke="url(#diamondPrism)" strokeWidth="0.8" opacity="0.2" />
                    <circle cx="50" cy="50" r="38" stroke="url(#diamondPrism)" strokeWidth="0.5" opacity="0.12" />
                    {/* Diamond shape */}
                    <polygon points="50,18 72,40 50,82 28,40" stroke="url(#diamondPrism)" strokeWidth="1.5" fill="none" opacity="0.35" />
                    {/* Inner facets */}
                    <line x1="28" y1="40" x2="50" y2="50" stroke="url(#diamondPrism)" strokeWidth="0.8" opacity="0.15" />
                    <line x1="72" y1="40" x2="50" y2="50" stroke="url(#diamondPrism)" strokeWidth="0.8" opacity="0.15" />
                    <line x1="50" y1="18" x2="50" y2="50" stroke="url(#diamondPrism)" strokeWidth="0.8" opacity="0.15" />
                    {/* Center point */}
                    <circle cx="50" cy="50" r="3" fill="url(#diamondPrism)" opacity="0.3" />
                </svg>
            </div>

            {/* ═══ RECIPIENT ═══ */}
            <div style={{
                position: 'absolute', top: '960px', width: '100%', textAlign: 'center',
            }}>
                <p style={{
                    fontSize: '18px', fontStyle: 'italic', color: textMuted,
                    fontFamily: "'Playfair Display', serif", marginBottom: '16px',
                }}>
                    This supreme and eternal honor is bestowed upon
                </p>

                <h2 style={{
                    fontSize: '104px', fontFamily: "'Playfair Display', serif",
                    fontWeight: 500, lineHeight: 1.15,
                    background: prismGrad,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    {recipientName}
                </h2>

                <div style={{
                    width: '140px', height: '1.5px', margin: '40px auto',
                    background: prismGradHorizontal, opacity: 0.3,
                    borderRadius: '2px',
                }} />

                <p style={{
                    fontSize: '20px', color: textSecondary, lineHeight: 1.9,
                    maxWidth: '1500px', margin: '0 auto', padding: '0 350px',
                }}>
                    For achieving the pinnacle of human excellence through 250+ verified acts
                    of transformative compassion across multiple communities. Your legacy
                    transcends contribution — you are a living testament to what humanity can become.
                </p>
            </div>

            {/* ═══ METRICS GRID ═══ */}
            <div style={{
                position: 'absolute', bottom: '500px', left: '50%', transform: 'translateX(-50%)',
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px',
                background: border, borderRadius: '16px', overflow: 'hidden',
            }}>
                {[
                    { label: 'Verified Acts', value: `${metrics.activities || 250}` },
                    { label: 'Impact Points', value: `${(metrics.points || 12500).toLocaleString()}` },
                    { label: 'Lives Changed', value: `${metrics.livesImpacted || 2500}+` },
                    { label: 'Trust Score', value: metrics.trustScore || '1000' },
                    { label: 'Global Rank', value: metrics.globalRank || '#1' },
                ].map((item, i) => (
                    <div key={i} style={{
                        textAlign: 'center', padding: '30px 44px', background: surface,
                    }}>
                        <p style={{ fontSize: '40px', fontWeight: 700, color: textPrimary, lineHeight: 1 }}>
                            {item.value}
                        </p>
                        <p style={{
                            fontSize: '11px', fontWeight: 600, color: textMuted,
                            letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '8px',
                        }}>
                            {item.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* ═══ BOTTOM PRISMATIC LINE ═══ */}
            <div style={{
                position: 'absolute', bottom: '80px', left: '600px', right: '600px',
                height: '2px', background: prismGradHorizontal, opacity: 0.2,
                borderRadius: '2px',
            }} />

            {/* ═══ FOOTER ═══ */}
            <div style={{
                position: 'absolute', bottom: '180px', width: '100%',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                padding: '0 180px',
            }}>
                {/* QR */}
                {qrCodeDataUrl && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            padding: '8px', borderRadius: '12px',
                            background: surface, border: `1px solid ${border}`,
                        }}>
                            <img src={qrCodeDataUrl} alt="Verify" width="110" height="110"
                                style={{ display: 'block', filter: 'invert(1)', opacity: 0.8 }} />
                        </div>
                        <p style={{ fontSize: '11px', color: textMuted, marginTop: '8px', fontWeight: 600, letterSpacing: '0.1em' }}>
                            Verify
                        </p>
                    </div>
                )}

                {/* Signatures */}
                <div style={{ display: 'flex', gap: '80px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '1px', background: textMuted, marginBottom: '8px', opacity: 0.3 }} />
                        <p style={{ fontSize: '14px', fontWeight: 600, color: textPrimary, opacity: 0.7 }}>Dr. Aisha Rahman</p>
                        <p style={{ fontSize: '11px', color: textMuted }}>Global Chief Impact Officer</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '1px', background: textMuted, marginBottom: '8px', opacity: 0.3 }} />
                        <p style={{ fontSize: '14px', fontWeight: 600, color: textPrimary, opacity: 0.7 }}>Platform Director</p>
                        <p style={{ fontSize: '11px', color: textMuted }}>Social Kind Foundation</p>
                    </div>
                </div>

                {/* Meta */}
                <div style={{ textAlign: 'right' }}>
                    <p style={{
                        fontSize: '13px', fontFamily: "'JetBrains Mono', monospace",
                        background: prismGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        opacity: 0.5,
                    }}>
                        {certificateID}
                    </p>
                    <p style={{ fontSize: '12px', color: textMuted, marginTop: '4px' }}>{date}</p>
                    <p style={{ fontSize: '11px', color: textMuted, marginTop: '6px', opacity: 0.4, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Eternal · Blockchain Verified
                    </p>
                </div>
            </div>
        </div>
    );
};
