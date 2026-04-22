
import React from 'react';
import { COLORS, CANVAS, mmToPx, FONTS, TYPOGRAPHY, GOLD_LAYOUT } from '../../../constants/certificateDesign';

interface GoldCertificateProps {
    recipientName: string;
    date: string;
    metrics: {
        activities?: number;
        points?: number;
        livesImpacted?: number;
        territories?: string;
        categories?: string;
        trustScore?: string;
        activeDays?: number;
        ranking?: string;
        verificationSuccess?: string;
    };
    certificateID: string;
    qrCodeDataUrl: string;
}

/**
 * 🏆 GOLD TIER — "The Pinnacle"
 * Design Language: Prestigious warmth, regal restraint, Apple keynote gravitas.
 * Warm gold accents against deep ivory, with a commanding medal emblem.
 */
export const GoldCertificate: React.FC<GoldCertificateProps> = ({
    recipientName,
    date,
    metrics,
    certificateID,
    qrCodeDataUrl,
}) => {
    const gold = '#D4AF37';
    const goldDark = '#92400E';
    const goldDeep = '#78350F';
    const warm = '#B8860B';
    const ivory = '#FFFEF5';

    return (
        <div
            style={{
                width: `${CANVAS.WIDTH_PX}px`,
                height: `${CANVAS.HEIGHT_PX}px`,
                background: `linear-gradient(165deg, ${ivory} 0%, #FFF9E8 30%, #FFFEF0 60%, #FFF5DC 100%)`,
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Inter', -apple-system, sans-serif",
            }}
        >
            {/* Subtle gold radiance */}
            <div style={{
                position: 'absolute', top: '-10%', left: '20%',
                width: '1800px', height: '1800px',
                background: `radial-gradient(circle, ${gold}08 0%, transparent 50%)`,
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-10%', right: '30%',
                width: '1200px', height: '1200px',
                background: `radial-gradient(circle, ${warm}06 0%, transparent 50%)`,
                pointerEvents: 'none',
            }} />

            {/* Ornate triple border */}
            <div style={{
                position: 'absolute', top: '90px', left: '90px', right: '90px', bottom: '90px',
                border: `2.5px solid ${gold}50`, borderRadius: '14px',
            }} />
            <div style={{
                position: 'absolute', top: '104px', left: '104px', right: '104px', bottom: '104px',
                border: `1px solid ${gold}25`, borderRadius: '10px',
            }} />
            <div style={{
                position: 'absolute', top: '114px', left: '114px', right: '114px', bottom: '114px',
                border: `1.5px solid ${gold}35`, borderRadius: '8px',
            }} />

            {/* Corner ornaments — minimal acanthus */}
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => {
                const [v, h] = pos.split('-');
                const rot = pos === 'top-left' ? 0 : pos === 'top-right' ? 90 : pos === 'bottom-left' ? 270 : 180;
                return (
                    <div key={pos} style={{
                        position: 'absolute', [v]: '76px', [h]: '76px',
                        width: '60px', height: '60px',
                    }}>
                        <svg viewBox="0 0 50 50" style={{ transform: `rotate(${rot}deg)`, opacity: 0.25 }}>
                            <path d="M5,5 Q25,5 25,25 Q5,25 5,5Z" fill={gold} />
                            <path d="M8,8 Q22,8 22,22" stroke={goldDark} strokeWidth="1" fill="none" opacity="0.5" />
                        </svg>
                    </div>
                );
            })}

            {/* ═══ HEADER ═══ */}
            <div style={{ position: 'absolute', top: '200px', width: '100%', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                    <span style={{ fontSize: '24px', color: gold, opacity: 0.6 }}>✦</span>
                    <h1 style={{
                        fontSize: '38px', fontWeight: 800, letterSpacing: '0.12em',
                        background: `linear-gradient(90deg, ${gold}, ${warm}, ${goldDark})`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        textTransform: 'uppercase',
                    }}>
                        Social Kind
                    </h1>
                    <span style={{ fontSize: '24px', color: gold, opacity: 0.6 }}>✦</span>
                </div>
                <p style={{
                    fontSize: '14px', fontWeight: 700, letterSpacing: '0.3em',
                    color: goldDark, textTransform: 'uppercase', marginTop: '8px', opacity: 0.6,
                }}>
                    International Foundation for Humanity
                </p>
            </div>

            {/* ═══ CERTIFICATE TITLE ═══ */}
            <div style={{ position: 'absolute', top: '380px', width: '100%', textAlign: 'center' }}>
                <p style={{
                    fontSize: '20px', fontWeight: 600, letterSpacing: '0.5em',
                    color: goldDeep, textTransform: 'uppercase', marginBottom: '16px',
                    fontFamily: "'Playfair Display', serif", opacity: 0.6,
                }}>
                    The Pinnacle Honor
                </p>
                <h2 style={{
                    fontSize: '72px', fontWeight: 800, letterSpacing: '0.06em',
                    background: `linear-gradient(135deg, ${gold} 0%, ${warm} 40%, #FFD700 60%, ${gold} 100%)`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    textTransform: 'uppercase',
                }}>
                    Gold Guardian
                </h2>
            </div>

            {/* ═══ MEDAL EMBLEM ═══ */}
            <div style={{
                position: 'absolute', top: '640px', left: '50%', transform: 'translateX(-50%)',
            }}>
                <svg width="180" height="180" viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 4px 12px ${gold}40)` }}>
                    {/* Sunburst */}
                    {Array.from({ length: 16 }).map((_, i) => (
                        <line key={i}
                            x1="50" y1="50"
                            x2={50 + Math.cos((i / 16) * 2 * Math.PI) * (40 + (i % 2 === 0 ? 8 : 4))}
                            y2={50 + Math.sin((i / 16) * 2 * Math.PI) * (40 + (i % 2 === 0 ? 8 : 4))}
                            stroke="#FEF3C7" strokeWidth="2" opacity="0.5"
                        />
                    ))}
                    <defs>
                        <linearGradient id="goldMedal" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={gold} />
                            <stop offset="50%" stopColor="#FFD700" />
                            <stop offset="100%" stopColor={warm} />
                        </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="32" fill="url(#goldMedal)" stroke={warm} strokeWidth="2" />
                    <circle cx="50" cy="50" r="26" stroke="white" strokeWidth="1" opacity="0.3" fill="none" />
                    <text x="50" y="56" textAnchor="middle" fontSize="26" fontWeight="bold" fill="white" opacity="0.9">50</text>
                </svg>
            </div>

            {/* ═══ RECIPIENT ═══ */}
            <div style={{
                position: 'absolute', top: '920px', width: '100%', textAlign: 'center',
            }}>
                <p style={{
                    fontSize: '20px', fontStyle: 'italic', color: goldDark,
                    marginBottom: '14px', opacity: 0.7,
                }}>
                    This exceptional distinction is bestowed upon
                </p>

                <h3 style={{
                    fontSize: '96px', fontFamily: "'Playfair Display', serif",
                    fontWeight: 500, color: '#1C1917', lineHeight: 1.15,
                }}>
                    {recipientName}
                </h3>

                <div style={{
                    width: '200px', height: '1.5px', margin: '40px auto',
                    background: `linear-gradient(90deg, transparent, ${gold}, transparent)`,
                }} />

                <p style={{
                    fontSize: '22px', color: '#57534E', lineHeight: 1.9,
                    maxWidth: '1500px', margin: '0 auto', padding: '0 250px',
                }}>
                    In extraordinary recognition of transformative impact through 50 meticulously
                    verified acts of compassion. Your sustained excellence exemplifies the highest
                    ideals of human solidarity.
                </p>
            </div>

            {/* ═══ IMPACT RECORD ═══ */}
            <div style={{
                position: 'absolute', bottom: '520px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: '2px', background: 'white', borderRadius: '16px',
                border: `1.5px solid ${gold}30`,
                boxShadow: `0 4px 20px ${gold}15`,
                overflow: 'hidden',
            }}>
                {[
                    { label: 'Verified Acts', value: `${metrics.activities || 50}` },
                    { label: 'Impact Points', value: `${(metrics.points || 2500).toLocaleString()}` },
                    { label: 'Lives Impacted', value: `${metrics.livesImpacted || 412}` },
                    { label: 'Trust Score', value: metrics.trustScore || '994' },
                ].map((item, i) => (
                    <div key={i} style={{
                        textAlign: 'center', padding: '30px 50px',
                        borderRight: i < 3 ? `1px solid ${gold}15` : 'none',
                    }}>
                        <p style={{ fontSize: '42px', fontWeight: 700, color: '#1C1917', lineHeight: 1 }}>
                            {item.value}
                        </p>
                        <p style={{
                            fontSize: '13px', fontWeight: 600, color: goldDark, opacity: 0.6,
                            letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '8px',
                        }}>
                            {item.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* ═══ FOOTER ═══ */}
            <div style={{
                position: 'absolute', bottom: '180px', width: '100%',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                padding: '0 180px',
            }}>
                {/* QR */}
                {qrCodeDataUrl && (
                    <div>
                        <div style={{
                            padding: '8px', background: '#fff',
                            border: `1.5px solid ${gold}25`, borderRadius: '12px',
                        }}>
                            <img src={qrCodeDataUrl} alt="Verify" width="120" height="120" style={{ display: 'block' }} />
                        </div>
                        <p style={{ fontSize: '12px', color: goldDark, opacity: 0.5, marginTop: '8px', textAlign: 'center', fontWeight: 600, letterSpacing: '0.08em' }}>
                            Verification
                        </p>
                    </div>
                )}

                {/* Signatures */}
                <div style={{ display: 'flex', gap: '100px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '100px', height: '1px', background: '#1C1917', marginBottom: '8px' }} />
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#1C1917' }}>Dr. Aisha Rahman</p>
                        <p style={{ fontSize: '12px', color: '#57534E' }}>Chief Impact Officer</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '100px', height: '1px', background: '#1C1917', marginBottom: '8px' }} />
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#1C1917' }}>Platform Director</p>
                        <p style={{ fontSize: '12px', color: '#57534E' }}>Social Kind Foundation</p>
                    </div>
                </div>

                {/* Meta */}
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', fontFamily: "'JetBrains Mono', monospace", color: goldDark, opacity: 0.5 }}>
                        {certificateID}
                    </p>
                    <p style={{ fontSize: '14px', color: '#57534E', marginTop: '4px' }}>
                        {date}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Removed BaroqueCornerOrnament, GoldMedalIllustration, GoldSealDesign, ImpactMetric
// as all decorative elements are now inline SVG for cleanliness
