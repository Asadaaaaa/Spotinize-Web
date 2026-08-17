import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Sparkles, Check, X, ArrowRight, RotateCcw, Volume2, Music, Loader2, Trophy, FastForward } from 'lucide-react';
import Button from './Button.jsx';
import Card from './Card.jsx';
import ApiClient from '../services/api.js';

export function LandingDemoSection({ onRegisterClick }) {
  const [loading, setLoading] = useState(true);
  const [demoData, setDemoData] = useState(null);
  const [clueIndex, setClueIndex] = useState(0); // 0 (0.1s) to 5 (5.0s)
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [score, setScore] = useState(0);

  const audioRef = useRef(null);
  const playTimeoutRef = useRef(null);

  // Fetch #1 trending song for demo
  const loadDemo = async () => {
    try {
      setLoading(true);
      setClueIndex(0);
      setSelectedOptionId(null);
      setIsFinished(false);
      setIsSuccess(false);
      setScore(0);
      setIsPlaying(false);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      clearTimeout(playTimeoutRef.current);

      const data = await ApiClient.get('/game/demo-track');
      setDemoData(data);
    } catch (err) {
      console.error('Failed to load demo track:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemo();
    return () => {
      clearTimeout(playTimeoutRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const clueDurations = demoData?.clueDurations || [0.1, 0.5, 1.0, 2.0, 3.0, 5.0];
  const currentDuration = clueDurations[clueIndex] || 0.1;

  // Play sliced audio clue
  const handlePlayClue = () => {
    if (!demoData?.track?.previewUrl) return;

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      clearTimeout(playTimeoutRef.current);
      setIsPlaying(false);
      return;
    }

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(demoData.track.previewUrl);
      } else {
        audioRef.current.src = demoData.track.previewUrl;
      }

      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          clearTimeout(playTimeoutRef.current);
          playTimeoutRef.current = setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            setIsPlaying(false);
          }, currentDuration * 1000);
        })
        .catch(err => {
          console.warn('Playback error:', err.message);
          setIsPlaying(false);
        });
    } catch (e) {
      setIsPlaying(false);
    }
  };

  // Stop audio on end
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  }, [demoData]);

  // Handle Guess Option Click
  const handleOptionClick = (option) => {
    if (isFinished || selectedOptionId) return;

    setSelectedOptionId(option.id);

    if (option.isCorrect) {
      // Calculate score based on clueIndex
      const points = [1000, 850, 700, 550, 400, 250][clueIndex] || 250;
      setScore(points);
      setIsSuccess(true);
      setIsFinished(true);

      // Play full preview celebration
      if (audioRef.current) {
        clearTimeout(playTimeoutRef.current);
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } else {
      // Wrong guess
      if (clueIndex < clueDurations.length - 1) {
        // Unlock next clue automatically
        setTimeout(() => {
          setClueIndex(prev => prev + 1);
          setSelectedOptionId(null);
        }, 900);
      } else {
        // Final clue failed
        setTimeout(() => {
          setIsFinished(true);
          setIsSuccess(false);
        }, 900);
      }
    }
  };

  // Next clue manually
  const handleNextClue = () => {
    if (clueIndex < clueDurations.length - 1) {
      setClueIndex(prev => prev + 1);
      setSelectedOptionId(null);
    }
  };

  if (loading) {
    return (
      <section className="container-narrow" style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--color-text-dim)' }}>
          <Loader2 className="spin" size={32} color="var(--color-primary)" />
          <span style={{ fontSize: '0.9rem' }}>Memuat lagu demo...</span>
        </div>
      </section>
    );
  }

  if (!demoData) return null;

  return (
    <section style={{ maxWidth: '460px', width: '100%', margin: '0 auto', padding: '0 16px', position: 'relative' }}>
      <Card style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        padding: '20px 18px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 16px 36px rgba(0,0,0,0.35)'
      }}>
        {/* Glow Accent */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(29, 185, 84, 0.15) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Demo Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Demo game
          </h2>
        </div>

        {/* Vinyl / Album Art Disc Player */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          
          <div style={{
            position: 'relative',
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            backgroundColor: '#111',
            border: '3px solid #222',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isPlaying ? '0 0 24px rgba(29, 185, 84, 0.35)' : '0 6px 16px rgba(0,0,0,0.4)',
            transition: 'all 0.3s ease'
          }}>
            {/* Spinning Grooves Effect */}
            <div style={{
              position: 'absolute',
              inset: '6px',
              borderRadius: '50%',
              border: '1px dashed rgba(255,255,255,0.08)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              inset: '14px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.04)',
              pointerEvents: 'none'
            }} />

            {/* Center Album Art (Blurred until guessed or revealed) */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 0 8px rgba(0,0,0,0.8)'
            }}>
              {demoData.track.albumArt ? (
                <img 
                  src={demoData.track.albumArt} 
                  alt="Album" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: isFinished ? 'none' : 'blur(8px) grayscale(50%)',
                    transition: 'filter 0.5s ease'
                  }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', backgroundColor: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Music size={18} color="var(--color-primary)" />
                </div>
              )}
            </div>

            {/* Center Spindle Hole */}
            <div style={{
              position: 'absolute',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#000',
              border: '2px solid #333',
              zIndex: 2
            }} />
          </div>

          {/* Clue Level Progress Bar */}
          <div style={{ width: '100%', maxWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-dim)', marginBottom: '4px' }}>
              <span>Petunjuk: {currentDuration} Detik</span>
              <span>Level {clueIndex + 1} / {clueDurations.length}</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${clueDurations.length}, 1fr)`,
              gap: '4px',
              height: '5px'
            }}>
              {clueDurations.map((dur, idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: '3px',
                    backgroundColor: idx <= clueIndex ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                    boxShadow: idx === clueIndex ? '0 0 6px rgba(29, 185, 84, 0.7)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons: Play Clue + Reveal Next Clue */}
          {!isFinished && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              maxWidth: '320px'
            }}>
              <Button
                variant="primary"
                size="md"
                onClick={handlePlayClue}
                icon={isPlaying ? <Square size={16} fill="#000" /> : <Play size={16} fill="#000" />}
                style={{
                  borderRadius: 'var(--radius-full)',
                  padding: '8px 18px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  height: '40px',
                  flex: '1 1 130px',
                  boxShadow: isPlaying ? '0 0 16px rgba(29, 185, 84, 0.5)' : 'none'
                }}
              >
                {isPlaying ? `Putar (${currentDuration}s)` : `Play ${currentDuration}s`}
              </Button>

              {clueIndex < clueDurations.length - 1 && (
                <Button
                  variant="secondary"
                  size="md"
                  disabled={isPlaying}
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.pause();
                      audioRef.current.currentTime = 0;
                    }
                    clearTimeout(playTimeoutRef.current);
                    setIsPlaying(false);
                    setClueIndex(prev => prev + 1);
                    setSelectedOptionId(null);
                  }}
                  icon={<FastForward size={15} />}
                  style={{
                    borderRadius: 'var(--radius-full)',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    height: '40px',
                    flex: '1 1 110px'
                  }}
                >
                  Reveal {clueDurations[clueIndex + 1]}s
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Multiple Choice Options */}
        {!isFinished ? (
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>
              Pilih Jawaban yang Benar:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {demoData.options.map(option => {
                const isSelected = selectedOptionId === option.id;
                let btnStyle = {
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  cursor: isSelected ? 'default' : 'pointer',
                  minHeight: '52px'
                };

                let variant = 'btn-secondary';
                if (isSelected) {
                  variant = option.isCorrect ? 'btn-primary' : 'btn-danger';
                }

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleOptionClick(option)}
                    disabled={selectedOptionId !== null}
                    className={`btn ${variant}`}
                    style={btnStyle}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.84rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isSelected && !option.isCorrect ? '#fff' : 'inherit' }}>
                        {option.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', opacity: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {option.artist}
                      </div>
                    </div>

                    {isSelected && (
                      <span style={{ marginLeft: '4px', flexShrink: 0 }}>
                        {option.isCorrect ? <Check size={16} /> : <X size={16} />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Result Feedback Card */
          <div style={{
            backgroundColor: isSuccess ? 'rgba(29, 185, 84, 0.12)' : 'rgba(235, 87, 87, 0.12)',
            border: `1px solid ${isSuccess ? 'var(--color-primary)' : 'var(--color-error)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: isSuccess ? 'var(--color-primary)' : 'var(--color-error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000'
            }}>
              {isSuccess ? <Trophy size={20} /> : <X size={20} color="#fff" />}
            </div>

            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '2px' }}>
                {isSuccess ? '🎉 Tebakan Benar!' : 'Tebakan Salah!'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-bright)', fontWeight: 700, margin: 0 }}>
                {demoData.track.artist} - {demoData.track.title}
              </p>
              {isSuccess && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.74rem', padding: '2px 8px' }}>
                    +{score} pts ({currentDuration}s)
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={onRegisterClick}
                icon={<ArrowRight size={15} />}
                style={{ fontWeight: 800, padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Daftar & Main Lengkap
              </Button>

              {!isSuccess && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadDemo}
                  icon={<RotateCcw size={14} />}
                  style={{ fontSize: '0.85rem', padding: '8px 14px' }}
                >
                  Coba Lagi
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}

export default LandingDemoSection;
