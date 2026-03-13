import React from 'react';
import { X } from 'lucide-react';

interface PassCardPurchaseModalProps {
  onClose: () => void;
  onPurchase: (amount: number, price: string) => void;
}

interface PassCardPackage {
  id: string;
  name: string;
  amount: number;
  price: string;
  badge?: string;
  highlight?: 'popular' | 'best';
}

const PASS_PACKAGES: PassCardPackage[] = [
  { id: 'basic', name: "Basic Pass Pouch", amount: 1, price: '$0.99' },
  { id: 'popular', name: "Popular Pass Sack", amount: 5, price: '$3.99', badge: 'MOST POPULAR', highlight: 'popular' },
  { id: 'pro', name: "Captain's Pass Chest", amount: 15, price: '$8.99', badge: 'BEST VALUE', highlight: 'best' },
];

export const PassCardPurchaseModal: React.FC<PassCardPurchaseModalProps> = ({ onClose, onPurchase }) => {
  return (
    <>
      <style>{`
        @keyframes pcShopSlideIn {
          0% { opacity: 0; transform: translateY(60px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pcShimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%) skewX(-15deg); }
        }
        @keyframes pcGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.15); }
          50% { box-shadow: 0 0 30px rgba(34, 211, 238, 0.7), 0 0 60px rgba(34, 211, 238, 0.3); }
        }
        @keyframes pcGlowBest {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.4), 0 0 40px rgba(255, 215, 0, 0.15); }
          50% { box-shadow: 0 0 35px rgba(255, 215, 0, 0.8), 0 0 70px rgba(255, 215, 0, 0.4); }
        }
        .pc-shop-modal { animation: pcShopSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .pc-btn-popular { animation: pcGlow 2.5s ease-in-out infinite; }
        .pc-btn-best { animation: pcGlowBest 2s ease-in-out infinite; }
        .pc-shimmer { position: absolute; top: 0; left: 0; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent); transform: skewX(-15deg); animation: pcShimmer 2.5s infinite; }
      `}</style>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-3"
        style={{ background: 'rgba(0, 10, 30, 0.85)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Modal container */}
        <div
          className="pc-shop-modal relative w-full max-w-[450px] rounded-[28px] overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)',
            border: '1.5px solid rgba(255,215,0,0.35)',
            maxHeight: 'calc(100vh - 24px)',
          }}
        >
          {/* Inner glow top edge */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.7), transparent)' }} />

          {/* Background radial glows */}
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Close button */}
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          >
            <X style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.7)' }} />
          </button>

          {/* Scrollable content */}
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 24px)', padding: '24px 16px 32px' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                <img src="/assets/pass_card.png" alt="Pass Card" style={{ width: '40px', height: '52px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.8))' }} />
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#FFD700', letterSpacing: '-0.5px', textShadow: '0 0 20px rgba(255,215,0,0.5)', margin: 0 }}>
                  Out of Passes!
                </h2>
                <img src="/assets/pass_card.png" alt="Pass Card" style={{ width: '40px', height: '52px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.8))' }} />
              </div>
              <p style={{ color: 'rgba(180,210,255,0.75)', fontSize: '13px', margin: 0 }}>
                Get a Pass Card to keep your catch and continue fishing!
              </p>
            </div>

            {/* Package list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PASS_PACKAGES.map((pkg) => {
                const isPopular = pkg.highlight === 'popular';
                const isBest = pkg.highlight === 'best';
                const isHighlighted = isPopular || isBest;

                return (
                  <div key={pkg.id} style={{ position: 'relative' }}>
                    {/* Badge */}
                    {pkg.badge && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 2,
                        background: isPopular ? 'linear-gradient(90deg, #22d3ee, #0ea5e9)' : 'linear-gradient(90deg, #FFD700, #FFA500)',
                        color: isPopular ? '#fff' : '#000',
                        fontSize: '10px',
                        fontWeight: '800',
                        letterSpacing: '1px',
                        padding: '3px 12px',
                        borderRadius: '99px',
                        whiteSpace: 'nowrap',
                        boxShadow: isPopular ? '0 2px 12px rgba(34,211,238,0.5)' : '0 2px 12px rgba(255,215,0,0.5)',
                      }}>
                        {pkg.badge}
                      </div>
                    )}

                    <button
                      onClick={() => { onPurchase(pkg.amount, pkg.price); onClose(); }}
                      className={isPopular ? 'pc-btn-popular' : isBest ? 'pc-btn-best' : ''}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: isHighlighted ? '14px 16px' : '12px 16px',
                        borderRadius: '16px',
                        border: isPopular
                          ? '1.5px solid rgba(34,211,238,0.6)'
                          : isBest
                            ? '1.5px solid rgba(255,215,0,0.6)'
                            : '1px solid rgba(255,255,255,0.12)',
                        background: isPopular
                          ? 'linear-gradient(135deg, rgba(34,211,238,0.12) 0%, rgba(14,165,233,0.08) 100%)'
                          : isBest
                            ? 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,165,0,0.08) 100%)'
                            : 'rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.15s ease',
                        marginTop: pkg.badge ? '8px' : '0',
                      }}
                    >
                      {/* Shimmer on highlighted */}
                      {isHighlighted && <div className="pc-shimmer" />}

                      {/* Left: icon + info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: isHighlighted ? '48px' : '42px',
                          height: isHighlighted ? '58px' : '52px',
                          borderRadius: '12px',
                          background: isPopular ? 'rgba(34,211,238,0.15)' : isBest ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.06)',
                          border: isPopular ? '1px solid rgba(34,211,238,0.3)' : isBest ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <img
                            src="/assets/pass_card.png"
                            alt="Pass Card"
                            style={{
                              width: isHighlighted ? '32px' : '28px',
                              height: isHighlighted ? '42px' : '38px',
                              objectFit: 'contain',
                              filter: isHighlighted ? 'drop-shadow(0 0 6px rgba(34,211,238,0.9))' : 'drop-shadow(0 0 3px rgba(34,211,238,0.5))',
                            }}
                          />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{
                            color: isPopular ? '#22d3ee' : isBest ? '#FFD700' : 'rgba(255,255,255,0.85)',
                            fontWeight: isHighlighted ? '800' : '700',
                            fontSize: isHighlighted ? '13px' : '12px',
                            lineHeight: '1.2',
                            marginBottom: '3px',
                          }}>
                            {pkg.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <img src="/assets/pass_card.png" alt="" style={{ width: '14px', height: '18px', objectFit: 'contain' }} />
                            <span style={{
                              color: isPopular ? '#22d3ee' : isBest ? '#FFD700' : 'rgba(200,230,255,0.9)',
                              fontWeight: '800',
                              fontSize: isHighlighted ? '16px' : '14px',
                            }}>
                              x{pkg.amount}
                            </span>
                            <span style={{ color: 'rgba(150,190,255,0.6)', fontSize: '11px' }}>Pass Cards</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: price button */}
                      <div style={{
                        flexShrink: 0,
                        marginLeft: '10px',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: isPopular
                          ? 'linear-gradient(135deg, #06b6d4, #0891b2)'
                          : isBest
                            ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                            : 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(14,165,233,0.15))',
                        border: isHighlighted ? 'none' : '1px solid rgba(34,211,238,0.3)',
                        color: isPopular ? '#fff' : isBest ? '#000' : '#22d3ee',
                        fontWeight: '800',
                        fontSize: '15px',
                        boxShadow: isPopular ? '0 2px 8px rgba(34,211,238,0.4)' : isBest ? '0 2px 8px rgba(255,215,0,0.4)' : 'none',
                      }}>
                        {pkg.price}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* No thanks, I'll give up */}
            <button
              onClick={onClose}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: 'rgba(120, 160, 210, 0.5)',
                fontSize: '12px',
                fontWeight: '700',
                marginTop: '24px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              No thanks, I'll give up
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
