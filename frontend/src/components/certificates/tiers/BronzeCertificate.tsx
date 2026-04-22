
import React from 'react';
import { COLORS, CANVAS, mmToPx, FONTS } from '../../../constants/certificateDesign';

interface BronzeCertificateProps {
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
 * BRONZE TIER — "Rising Warmth"
 * Design Language: Warm earth tones, refined craft, tactile warmth.
 * Unique geometric pattern borders with terracotta palette.
 */
export const BronzeCertificate: React.FC<BronzeCertificateProps> = ({
    recipientName,
    date,
    metrics,
    certificateID,
    qrCodeDataUrl,
}) => {
    const primaryColor = '#A77C52';
    const darkColor = '#6B4C30';
    const lightColor = '#F5EDE4';
    const accentColor = '#C9955A';

    return (
        <div
            style={{
                width: '3508px',
                height: '2480px',
                background: `linear-gradient(170deg, #FFFCF8 0%, ${lightColor} 50%, #FFF8F0 100%)`,
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Inter', -apple-system, sans-serif",
            }}
        >
            {/* Subtle texture grain */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
                opacity: 0.4, pointerEvents: 'none',
            }} />

            {/* Warm ambient glow */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '2400px', height: '2400px',
                background: `radial-gradient(circle, ${primaryColor}08 0%, transparent 55%)`,
                pointerEvents: 'none',
            }} />

            {/* Elegant double-line border */}
            <div style={{
                position: 'absolute', top: '100px', left: '100px', right: '100px', bottom: '100px',
                border: `2px solid ${primaryColor}30`, borderRadius: '12px',
            }} />
            <div style={{
                position: 'absolute', top: '118px', left: '118px', right: '118px', bottom: '118px',
                border: `1px solid ${primaryColor}18`, borderRadius: '8px',
            }} />

            {/* Corner accents — geometric brass studs */}
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => {
                const [v, h] = pos.split('-');
                return (
                    <div key={pos} style={{
                        position: 'absolute',
                        [v]: '88px', [h]: '88px',
                        width: '24px', height: '24px', borderRadius: '50%',
                        border: `2px solid ${primaryColor}40`,
                        background: `radial-gradient(circle at 35% 35%, ${accentColor}40, ${primaryColor}15)`,
                    }} />
                );
            })}

            {/* ═══ HEADER ═══ */}
            <div style={{ position: 'absolute', top: '220px', width: '100%', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                    <div style={{ width: '200px', height: '1px', background: `linear-gradient(to right, transparent, ${primaryColor}40)` }} />
                    <p style={{
                        fontSize: '26px', fontWeight: 600, letterSpacing: '0.3em',
                        color: primaryColor, textTransform: 'uppercase',
                    }}>
                        Social Kind Foundation
                    </p>
                    <div style={{ width: '200px', height: '1px', background: `linear-gradient(to left, transparent, ${primaryColor}40)` }} />
                </div>
            </div>

            {/* Title */}
            <div style={{ position: 'absolute', top: '340px', width: '100%', textAlign: 'center' }}>
                <h1 style={{
                    fontSize: '78px', fontWeight: 700, letterSpacing: '-0.01em',
                    color: darkColor, marginBottom: '14px',
                }}>
                    Certificate of Achievement
                </h1>
                <p style={{
                    fontSize: '28px', fontFamily: "'Playfair Display', serif",
                    fontStyle: 'italic', color: primaryColor, opacity: 0.8,
                }}>
                    Bronze Distinction — Rising Momentum
                </p>
            </div>

            {/* ═══ EMBLEM ═══ */}
            <div style={{
                position: 'absolute', top: '600px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
                <svg width="180" height="180" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="46" stroke={primaryColor} strokeWidth="1.5" opacity="0.2" />
                    <circle cx="50" cy="50" r="36" stroke={primaryColor} strokeWidth="1" opacity="0.12" />
                    <circle cx="50" cy="50" r="26" fill={primaryColor} fillOpacity="0.06" />
                    {/* Shield motif */}
                    <path d="M50 22L70 34V52C70 64 60 74 50 78C40 74 30 64 30 52V34L50 22Z"
                        stroke={primaryColor} strokeWidth="1.5" fill="none" opacity="0.35" />
                    <path d="M42 50L48 56L58 44" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                </svg>
            </div>

            {/* ═══ RECIPIENT ═══ */}
            <div style={{
                position: 'absolute', top: '920px', width: '100%', textAlign: 'center',
            }}>
                <p style={{
                    fontSize: '24px', color: primaryColor, marginBottom: '20px',
                    fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
                }}>
                    In recognition of demonstrated commitment
                </p>

                <h2 style={{
                    fontSize: '110px', fontFamily: "'Playfair Display', serif",
                    fontWeight: 500, color: darkColor, lineHeight: 1.15,
                }}>
                    {recipientName}
                </h2>

                <div style={{
                    width: '180px', height: '1px', margin: '50px auto',
                    background: `linear-gradient(90deg, transparent, ${primaryColor}50, transparent)`,
                }} />

                <p style={{
                    fontSize: '26px', color: '#6B6B6B', lineHeight: 1.8,
                    maxWidth: '1400px', margin: '0 auto', padding: '0 200px',
                }}>
                    For building a foundation of intentional kindness through 5 verified acts
                    of compassion. Your consistency in care demonstrates genuine commitment
                    to positive social change.
                </p>
            </div>

            {/* ═══ METRICS BAR ═══ */}
            <div style={{
                position: 'absolute', bottom: '520px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: '80px', alignItems: 'center',
            }}>
                {[
                    { label: 'Verified Acts', value: `${metrics.activities || 5}` },
                    { label: 'Impact Points', value: `${metrics.points || 250}` },
                    { label: 'Lives Touched', value: `${metrics.livesImpacted || 15}` },
                ].map((item, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '48px', fontWeight: 700, color: darkColor, lineHeight: 1 }}>
                            {item.value}
                        </p>
                        <p style={{
                            fontSize: '15px', fontWeight: 600, color: primaryColor,
                            letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '8px',
                        }}>
                            {item.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* ═══ FOOTER ═══ */}
            <div style={{
                position: 'absolute', bottom: '180px', left: '200px',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            }}>
                <div style={{ width: '80px', height: '1px', background: darkColor, marginBottom: '10px' }} />
                <p style={{ fontSize: '18px', fontWeight: 600, color: darkColor }}>Authorized Representative</p>
                <p style={{ fontSize: '14px', color: primaryColor }}>Platform Director</p>
            </div>

            {qrCodeDataUrl && (
                <div style={{ position: 'absolute', bottom: '180px', right: '200px', textAlign: 'center' }}>
                    <div style={{
                        padding: '10px', background: '#fff',
                        border: `1px solid ${primaryColor}20`, borderRadius: '10px',
                    }}>
                        <img src={qrCodeDataUrl} alt="Verify" width="130" height="130" style={{ display: 'block' }} />
                    </div>
                </div>
            )}

            <div style={{
                position: 'absolute', bottom: '200px', left: '50%', transform: 'translateX(-50%)',
                textAlign: 'center',
            }}>
                <p style={{ fontSize: '15px', color: '#86868B', fontFamily: "'JetBrains Mono', monospace" }}>
                    {certificateID}
                </p>
                <p style={{ fontSize: '15px', color: '#86868B', marginTop: '4px' }}>
                    Issued: {date}
                </p>
            </div>
        </div>
    );
};
