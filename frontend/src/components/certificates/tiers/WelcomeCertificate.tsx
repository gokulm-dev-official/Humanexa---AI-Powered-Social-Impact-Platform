
import React from 'react';

interface WelcomeCertificateProps {
    recipientName: string;
    date: string;
    metrics: {
        activities?: number;
        points?: number;
        impact?: string;
    };
    certificateID: string;
    qrCodeDataUrl?: string;
}

/**
 * WELCOME TIER — "First Light"
 * Design Language: Clean, airy, optimistic. Soft warm gradients.
 * Inspired by Apple's product launch aesthetics with generous whitespace.
 */
export const WelcomeCertificate: React.FC<WelcomeCertificateProps> = ({
    recipientName,
    date,
    metrics,
    certificateID,
    qrCodeDataUrl,
}) => {
    return (
        <div
            style={{
                width: '3508px',
                height: '2480px',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFB 40%, #F0F4F8 100%)',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
            }}
        >
            {/* Ambient gradient orbs */}
            <div style={{
                position: 'absolute', top: '-400px', right: '-200px',
                width: '1600px', height: '1600px',
                background: 'radial-gradient(circle, rgba(0,113,227,0.04) 0%, transparent 65%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-300px', left: '-100px',
                width: '1200px', height: '1200px',
                background: 'radial-gradient(circle, rgba(52,199,89,0.03) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            {/* Minimal border frame */}
            <div style={{
                position: 'absolute',
                top: '120px', left: '120px', right: '120px', bottom: '120px',
                border: '1.5px solid rgba(0,0,0,0.06)',
                borderRadius: '16px',
            }} />

            {/* ═══ HEADER ═══ */}
            <div style={{ position: 'absolute', top: '220px', width: '100%', textAlign: 'center' }}>
                <p style={{
                    fontSize: '28px', fontWeight: 600, letterSpacing: '0.25em',
                    color: '#86868B', textTransform: 'uppercase', marginBottom: '20px',
                }}>
                    Social Kind Foundation
                </p>
                <div style={{
                    width: '60px', height: '1.5px', margin: '0 auto 40px',
                    background: 'rgba(0,0,0,0.1)',
                }} />
                <h1 style={{
                    fontSize: '84px', fontWeight: 700, letterSpacing: '-0.02em',
                    color: '#1D1D1F', lineHeight: 1.1, marginBottom: '16px',
                }}>
                    Certificate of Humanity
                </h1>
                <p style={{
                    fontSize: '32px', fontWeight: 400, color: '#86868B',
                    fontStyle: 'italic', letterSpacing: '0.02em',
                    fontFamily: "'Playfair Display', serif",
                }}>
                    — The Courage to Care —
                </p>
            </div>

            {/* ═══ EMBLEM ═══ */}
            <div style={{
                position: 'absolute', top: '680px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
                <svg width="160" height="160" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="48" stroke="#0071E3" strokeWidth="1" opacity="0.15" />
                    <circle cx="50" cy="50" r="38" stroke="#0071E3" strokeWidth="0.8" opacity="0.1" />
                    {/* Sunrise motif */}
                    <path d="M20 65H80" stroke="#0071E3" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                    <path d="M28 65C28 42 38 28 50 28C62 28 72 42 72 65" stroke="#0071E3" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
                    <line x1="50" y1="24" x2="50" y2="18" stroke="#0071E3" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                    <line x1="30" y1="32" x2="26" y2="28" stroke="#0071E3" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                    <line x1="70" y1="32" x2="74" y2="28" stroke="#0071E3" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                </svg>
                <span style={{
                    marginTop: '24px', fontSize: '22px', fontWeight: 600,
                    letterSpacing: '0.3em', color: '#0071E3', textTransform: 'uppercase',
                }}>
                    Welcome Tier
                </span>
            </div>

            {/* ═══ RECIPIENT ═══ */}
            <div style={{
                position: 'absolute', top: '1050px', width: '100%', textAlign: 'center',
            }}>
                <p style={{
                    fontSize: '26px', color: '#86868B', marginBottom: '20px',
                    fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
                }}>
                    This certificate honors
                </p>

                <h2 style={{
                    fontSize: '120px', fontFamily: "'Playfair Display', serif",
                    fontWeight: 500, color: '#1D1D1F', lineHeight: 1.15,
                    letterSpacing: '-0.01em',
                }}>
                    {recipientName}
                </h2>

                <div style={{
                    width: '200px', height: '1px', margin: '50px auto',
                    background: 'linear-gradient(90deg, transparent, rgba(0,113,227,0.3), transparent)',
                }} />

                <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '0 200px' }}>
                    <p style={{
                        fontSize: '30px', fontFamily: "'Playfair Display', serif",
                        color: '#1D1D1F', lineHeight: 1.7, marginBottom: '24px',
                    }}>
                        for choosing compassion when it mattered.
                    </p>
                    <p style={{
                        fontSize: '26px', color: '#86868B', lineHeight: 1.8,
                    }}>
                        With your first act of kindness, you reminded the world
                        that humanity still lives in everyday actions.
                        This is not a beginning of points — it is the beginning of care.
                    </p>
                </div>
            </div>

            {/* ═══ QUOTE ═══ */}
            <div style={{
                position: 'absolute', bottom: '480px', width: '100%', textAlign: 'center',
            }}>
                <p style={{
                    fontSize: '28px', fontFamily: "'Playfair Display', serif",
                    fontStyle: 'italic', color: '#0071E3', fontWeight: 500,
                    opacity: 0.7,
                }}>
                    "One human choice can light many lives."
                </p>
            </div>

            {/* ═══ FOOTER ═══ */}
            {/* Seal */}
            <div style={{
                position: 'absolute', bottom: '180px', left: '200px',
                width: '200px', height: '200px', borderRadius: '50%',
                border: '1.5px solid rgba(0,0,0,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.8)',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: '#86868B', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        Official
                    </p>
                    <p style={{ fontSize: '28px', fontWeight: 300, color: '#1D1D1F', margin: '4px 0' }}>
                        Est. 2024
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#86868B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Verified
                    </p>
                </div>
            </div>

            {/* QR Code */}
            {qrCodeDataUrl && (
                <div style={{
                    position: 'absolute', bottom: '200px', right: '200px',
                    textAlign: 'center',
                }}>
                    <div style={{
                        padding: '12px', background: '#fff',
                        border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px',
                    }}>
                        <img src={qrCodeDataUrl} alt="Verify" width="140" height="140" style={{ display: 'block' }} />
                    </div>
                    <p style={{ fontSize: '13px', color: '#86868B', marginTop: '10px', fontWeight: 500 }}>
                        Scan to verify
                    </p>
                </div>
            )}

            {/* Central metadata */}
            <div style={{
                position: 'absolute', bottom: '220px', left: '50%', transform: 'translateX(-50%)',
                textAlign: 'center',
            }}>
                <p style={{ fontSize: '16px', color: '#86868B', marginBottom: '6px' }}>
                    Certificate ID: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{certificateID}</span>
                </p>
                <p style={{ fontSize: '16px', color: '#86868B' }}>Issued: {date}</p>
                <div style={{ width: '300px', height: '1px', background: 'rgba(0,0,0,0.06)', margin: '16px auto' }} />
                <p style={{
                    fontSize: '14px', letterSpacing: '0.15em', color: '#0071E3',
                    textTransform: 'uppercase', fontWeight: 600, opacity: 0.6,
                }}>
                    Social Kind — Growing Humanity Through Kindness
                </p>
            </div>
        </div>
    );
};
