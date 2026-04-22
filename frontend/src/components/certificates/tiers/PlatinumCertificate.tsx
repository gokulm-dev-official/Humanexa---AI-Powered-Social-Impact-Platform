
import React from 'react';
import { COLORS, CANVAS, mmToPx, FONTS } from '../../../constants/certificateDesign';

interface PlatinumCertificateProps {
    recipientName: string;
    date: string;
    metrics: {
        activities?: number;
        points?: number;
        livesImpacted?: number;
        trustScore?: string;
        activeDays?: number;
        ranking?: string;
    };
    certificateID: string;
    qrCodeDataUrl: string;
}

/**
 * 💎 PLATINUM TIER — "Silent Grandeur"
 * Design Language: Ultra-refined, near-monochrome palette with deep navy accents.
 * Inspired by Apple Pro product line — dark sophistication, architectural precision.
 */
export const PlatinumCertificate: React.FC<PlatinumCertificateProps> = ({
    recipientName,
    date,
    metrics,
    certificateID,
    qrCodeDataUrl,
}) => {
    const platinum = '#C0C0C0';
    const navy = '#0F172A';
    const slate = '#475569';
    const accent = '#6366F1';
    const subtle = '#E2E8F0';

    return (
        <div
            style={{
                width: `${CANVAS.WIDTH_PX}px`,
                height: `${CANVAS.HEIGHT_PX}px`,
                background: `linear-gradient(160deg, #FAFBFC 0%, #F1F5F9 30%, #E8ECF1 60%, #EEF2F7 100%)`,
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Inter', -apple-system, sans-serif",
            }}
        >
            {/* Ambient depth layers */}
            <div style={{
                position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
                width: '2200px', height: '2200px',
                background: `radial-gradient(circle, ${accent}04 0%, transparent 45%)`,
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '800px',
                background: `linear-gradient(to top, ${navy}06, transparent)`,
                pointerEvents: 'none',
            }} />

            {/* Architectural border – thick + thin */}
            <div style={{
                position: 'absolute', top: '80px', left: '80px', right: '80px', bottom: '80px',
                border: `3px solid ${navy}12`, borderRadius: '16px',
            }} />
            <div style={{
                position: 'absolute', top: '96px', left: '96px', right: '96px', bottom: '96px',
                border: `1px solid ${navy}08`, borderRadius: '12px',
            }} />

            {/* ═══ HEADER ═══ */}
            <div style={{ position: 'absolute', top: '200px', width: '100%', textAlign: 'center' }}>
                <p style={{
                    fontSize: '22px', fontWeight: 600, letterSpacing: '0.4em',
                    color: slate, textTransform: 'uppercase', opacity: 0.6,
                }}>
                    Social Kind Foundation
                </p>
            </div>

            {/* ═══ MAIN TITLE ═══ */}
            <div style={{ position: 'absolute', top: '320px', width: '100%', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '16px',
                    padding: '12px 32px', borderRadius: '100px',
                    background: `${navy}06`, marginBottom: '28px',
                }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent, opacity: 0.5 }} />
                    <p style={{
                        fontSize: '16px', fontWeight: 700, letterSpacing: '0.35em',
                        color: navy, textTransform: 'uppercase', opacity: 0.5,
                    }}>
                        Legendary Distinction
                    </p>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent, opacity: 0.5 }} />
                </div>

                <h1 style={{
                    fontSize: '86px', fontWeight: 800, color: navy,
                    letterSpacing: '-0.02em', lineHeight: 1.05,
                }}>
                    Platinum Luminary
                </h1>

                <p style={{
                    fontSize: '24px', fontWeight: 400, color: slate,
                    marginTop: '16px', fontStyle: 'italic',
                    fontFamily: "'Playfair Display', serif", opacity: 0.6,
                }}>
                    Of Legendary Social Luminance
                </p>
            </div>

            {/* ═══ EMBLEM ═══ */}
            <div style={{
                position: 'absolute', top: '680px', left: '50%', transform: 'translateX(-50%)',
            }}>
                <svg width="160" height="160" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="46" stroke={navy} strokeWidth="1" opacity="0.08" />
                    <circle cx="50" cy="50" r="38" stroke={navy} strokeWidth="0.8" opacity="0.06" />
                    <circle cx="50" cy="50" r="30" stroke={accent} strokeWidth="0.6" opacity="0.1" />
                    {/* Trophy icon */}
                    <path d="M36 30H64V42C64 52 58 58 50 60C42 58 36 52 36 42V30Z" stroke={navy} strokeWidth="1.5" fill="none" opacity="0.2" />
                    <line x1="50" y1="60" x2="50" y2="70" stroke={navy} strokeWidth="1.5" opacity="0.15" />
                    <line x1="40" y1="70" x2="60" y2="70" stroke={navy} strokeWidth="1.5" opacity="0.15" strokeLinecap="round" />
                    <text x="50" y="50" textAnchor="middle" fontSize="16" fontWeight="bold" fill={navy} opacity="0.2">100</text>
                </svg>
            </div>

            {/* ═══ RECIPIENT ═══ */}
            <div style={{
                position: 'absolute', top: '960px', width: '100%', textAlign: 'center',
            }}>
                <p style={{
                    fontSize: '20px', fontStyle: 'italic', color: slate,
                    fontFamily: "'Playfair Display', serif", marginBottom: '14px', opacity: 0.6,
                }}>
                    This legendary distinction is permanently bestowed upon
                </p>

                <h2 style={{
                    fontSize: '100px', fontFamily: "'Playfair Display', serif",
                    fontWeight: 500, color: navy, lineHeight: 1.15,
                }}>
                    {recipientName}
                </h2>

                <div style={{
                    width: '120px', height: '1.5px', margin: '40px auto',
                    background: `linear-gradient(90deg, transparent, ${navy}30, transparent)`,
                }} />

                <p style={{
                    fontSize: '22px', color: slate, lineHeight: 1.9, opacity: 0.7,
                    maxWidth: '1500px', margin: '0 auto', padding: '0 300px',
                }}>
                    For achieving legendary status through 100 verified acts of extraordinary compassion.
                    Your sustained excellence has created lasting systemic change and places you among
                    the distinguished few who redefine what it means to serve humanity.
                </p>
            </div>

            {/* ═══ METRICS GRID ═══ */}
            <div style={{
                position: 'absolute', bottom: '500px', left: '50%', transform: 'translateX(-50%)',
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3px',
                background: subtle, borderRadius: '16px', overflow: 'hidden',
                boxShadow: `0 2px 12px ${navy}08`,
            }}>
                {[
                    { label: 'Verified Acts', value: `${metrics.activities || 100}` },
                    { label: 'Impact Points', value: `${(metrics.points || 5000).toLocaleString()}` },
                    { label: 'Lives Changed', value: `${metrics.livesImpacted || 850}` },
                    { label: 'Trust Score', value: metrics.trustScore || 'Perfect' },
                ].map((item, i) => (
                    <div key={i} style={{
                        textAlign: 'center', padding: '32px 56px', background: 'white',
                    }}>
                        <p style={{ fontSize: '44px', fontWeight: 700, color: navy, lineHeight: 1 }}>
                            {item.value}
                        </p>
                        <p style={{
                            fontSize: '12px', fontWeight: 600, color: slate, opacity: 0.5,
                            letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '8px',
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
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            padding: '8px', background: '#fff',
                            border: `1px solid ${subtle}`, borderRadius: '12px',
                        }}>
                            <img src={qrCodeDataUrl} alt="Verify" width="110" height="110" style={{ display: 'block' }} />
                        </div>
                    </div>
                )}

                {/* Dual Signatures */}
                <div style={{ display: 'flex', gap: '80px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '90px', height: '1px', background: navy, marginBottom: '8px', opacity: 0.3 }} />
                        <p style={{ fontSize: '14px', fontWeight: 600, color: navy }}>Dr. Aisha Rahman</p>
                        <p style={{ fontSize: '11px', color: slate, opacity: 0.6 }}>Chief Impact Officer</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '90px', height: '1px', background: navy, marginBottom: '8px', opacity: 0.3 }} />
                        <p style={{ fontSize: '14px', fontWeight: 600, color: navy }}>Platform Director</p>
                        <p style={{ fontSize: '11px', color: slate, opacity: 0.6 }}>Social Kind Foundation</p>
                    </div>
                </div>

                {/* Meta */}
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", color: slate, opacity: 0.4 }}>
                        {certificateID}
                    </p>
                    <p style={{ fontSize: '13px', color: slate, marginTop: '4px', opacity: 0.5 }}>{date}</p>
                    <p style={{ fontSize: '11px', color: accent, marginTop: '4px', opacity: 0.4, fontWeight: 600, letterSpacing: '0.05em' }}>
                        Blockchain Verified
                    </p>
                </div>
            </div>
        </div>
    );
};
