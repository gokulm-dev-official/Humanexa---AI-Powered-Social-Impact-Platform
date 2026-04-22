
import React from 'react';
import { COLORS, CANVAS, mmToPx, FONTS } from '../../../constants/certificateDesign';

interface SilverCertificateProps {
    recipientName: string;
    date: string;
    metrics: {
        activities?: number;
        points?: number;
        livesImpacted?: number;
    };
    certificateID: string;
    qrCodeDataUrl?: string;
}

/**
 * SILVER TIER — "Quiet Strength"
 * Design Language: Cool neutrals, silver metallic feel, sophisticated restraint.
 * Inspired by Apple's titanium product aesthetic: precise, quiet luxury.
 */
export const SilverCertificate: React.FC<SilverCertificateProps> = ({
    recipientName,
    date,
    metrics,
    certificateID,
    qrCodeDataUrl,
}) => {
    const primary = '#7C878E';
    const dark = '#334155';
    const accent = '#94A3B8';
    const subtle = '#E2E8F0';

    return (
        <div
            style={{
                width: '3508px',
                height: '2480px',
                background: 'linear-gradient(160deg, #FFFFFF 0%, #F1F5F9 35%, #E8ECF1 65%, #F8FAFC 100%)',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Inter', -apple-system, sans-serif",
            }}
        >
            {/* Metallic sheen overlay */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.4) 25%, transparent 50%, rgba(255,255,255,0.2) 75%, transparent 100%)',
                opacity: 0.5,
            }} />

            {/* Subtle ambient */}
            <div style={{
                position: 'absolute', top: '20%', left: '60%',
                width: '1400px', height: '1400px',
                background: `radial-gradient(circle, ${accent}08 0%, transparent 50%)`,
                pointerEvents: 'none',
            }} />

            {/* Border — single precise line */}
            <div style={{
                position: 'absolute', top: '110px', left: '110px', right: '110px', bottom: '110px',
                border: `1.5px solid ${subtle}`,
                borderRadius: '14px',
            }} />

            {/* Horizontal accent lines at top and bottom of frame */}
            <div style={{
                position: 'absolute', top: '110px', left: '400px', right: '400px',
                height: '3px', background: `linear-gradient(90deg, transparent 0%, ${accent}60 50%, transparent 100%)`,
            }} />
            <div style={{
                position: 'absolute', bottom: '110px', left: '400px', right: '400px',
                height: '3px', background: `linear-gradient(90deg, transparent 0%, ${accent}60 50%, transparent 100%)`,
            }} />

            {/* ═══ HEADER ═══ */}
            <div style={{ position: 'absolute', top: '240px', width: '100%', textAlign: 'center' }}>
                <p style={{
                    fontSize: '24px', fontWeight: 600, letterSpacing: '0.35em',
                    color: accent, textTransform: 'uppercase',
                }}>
                    Social Kind Foundation
                </p>
            </div>

            {/* ═══ MAIN TITLE ═══ */}
            <div style={{ position: 'absolute', top: '360px', width: '100%', textAlign: 'center' }}>
                <h1 style={{
                    fontSize: '72px', fontWeight: 300, color: dark,
                    letterSpacing: '-0.01em', lineHeight: 1.15,
                    marginBottom: '12px',
                }}>
                    Certificate of
                </h1>
                <h1 style={{
                    fontSize: '82px', fontWeight: 700, color: dark,
                    letterSpacing: '-0.02em', lineHeight: 1.1,
                }}>
                    Distinguished Impact
                </h1>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '20px', marginTop: '30px',
                }}>
                    <div style={{ width: '160px', height: '1px', background: `${accent}50` }} />
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z"
                            fill={accent} opacity="0.4" />
                    </svg>
                    <div style={{ width: '160px', height: '1px', background: `${accent}50` }} />
                </div>
                <p style={{
                    fontSize: '26px', fontWeight: 600, color: accent,
                    letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: '14px',
                }}>
                    Silver Tier
                </p>
            </div>

            {/* ═══ RECIPIENT ═══ */}
            <div style={{
                position: 'absolute', top: '860px', width: '100%', textAlign: 'center',
            }}>
                <p style={{
                    fontSize: '22px', fontStyle: 'italic', color: primary,
                    fontFamily: "'Playfair Display', serif", marginBottom: '16px',
                }}>
                    By virtue of extraordinary dedication, this distinction is bestowed upon
                </p>

                <h2 style={{
                    fontSize: '108px', fontFamily: "'Playfair Display', serif",
                    fontWeight: 500, color: '#0F172A', lineHeight: 1.15,
                }}>
                    {recipientName}
                </h2>

                <div style={{
                    width: '160px', height: '1px', margin: '40px auto',
                    background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                }} />
            </div>

            {/* ═══ BODY TEXT ═══ */}
            <div style={{
                position: 'absolute', top: '1300px', width: '100%', textAlign: 'center',
                padding: '0 400px',
            }}>
                <p style={{
                    fontSize: '24px', color: '#64748B', lineHeight: 1.9,
                }}>
                    In recognition of sustained commitment to transparent and verified social
                    contribution. Through 25 verified acts of compassion, this individual has
                    demonstrated the reliability of heart that defines true impact.
                </p>
            </div>

            {/* ═══ METRICS — Two-column ═══ */}
            <div style={{
                position: 'absolute', bottom: '560px', left: '50%', transform: 'translateX(-50%)',
                display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', gap: '60px',
                alignItems: 'center',
            }}>
                <div style={{ textAlign: 'center', padding: '0 40px' }}>
                    <p style={{ fontSize: '52px', fontWeight: 700, color: dark }}>{metrics.activities || 25}</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: accent, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '6px' }}>Verified Acts</p>
                </div>
                <div style={{ width: '1px', height: '60px', background: subtle }} />
                <div style={{ textAlign: 'center', padding: '0 40px' }}>
                    <p style={{ fontSize: '52px', fontWeight: 700, color: dark }}>{metrics.points?.toLocaleString() || '1,250'}</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: accent, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '6px' }}>Impact Points</p>
                </div>
                <div style={{ width: '1px', height: '60px', background: subtle }} />
                <div style={{ textAlign: 'center', padding: '0 40px' }}>
                    <p style={{ fontSize: '52px', fontWeight: 700, color: dark }}>{metrics.livesImpacted || 75}</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: accent, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '6px' }}>Lives Touched</p>
                </div>
            </div>

            {/* ═══ FOOTER ═══ */}
            <div style={{
                position: 'absolute', bottom: '200px', width: '100%',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                padding: '0 200px',
            }}>
                {/* Signature */}
                <div>
                    <div style={{ width: '100px', height: '1px', background: dark, marginBottom: '10px' }} />
                    <p style={{ fontSize: '17px', fontWeight: 600, color: dark }}>Authorized Signature</p>
                    <p style={{ fontSize: '14px', color: primary }}>Platform Director</p>
                </div>

                {/* Center metadata */}
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', fontFamily: "'JetBrains Mono', monospace", color: accent }}>
                        {certificateID}
                    </p>
                    <p style={{ fontSize: '14px', color: accent, marginTop: '4px' }}>
                        {date}
                    </p>
                </div>

                {/* QR */}
                {qrCodeDataUrl && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            padding: '8px', background: '#fff',
                            border: `1px solid ${subtle}`, borderRadius: '10px',
                        }}>
                            <img src={qrCodeDataUrl} alt="Verify" width="120" height="120" style={{ display: 'block' }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
