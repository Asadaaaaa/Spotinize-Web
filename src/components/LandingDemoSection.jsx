import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Square, Sparkles, Check, X, ArrowRight,
  Music, Loader2, Trophy, FastForward, Zap
} from 'lucide-react';
import Button from './Button.jsx';
import ApiClient from '../services/api.js';
import { useLanguage } from '../hooks/useLanguage.jsx';

const SCORE_TABLE = [1000, 850, 700, 550, 400, 250];
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const VIZ_DELAYS = [0.05, 0.22, 0.12, 0.34, 0.08, 0.28, 0.16, 0.4, 0.1, 0.26, 0.18, 0.32];

export function LandingDemoSection({ onRegisterClick, ctaLabel }) {
  const { tx } = useLanguage();
  const resolvedCtaLabel = ctaLabel || tx('Sign Up & Play Full Game', 'Daftar & Main Lengkap');

  const [loading, setLoading] = useState(true);
  const [demoData, setDemoData] = useState(null);
  const [clueIndex, setClueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [wrongHint, setWrongHint] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [score, setScore] = useState(0);

  const audioRef = useRef(null);
  const playTimeoutRef = useRef(null);

  const stopAudio = () => {
    clearTimeout(playTimeoutRef.current);
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {}
    }
    setIsPlaying(false);
  };

  const loadDemo = async () => {
    try {
      setLoading(true);
      stopAudio();
      setClueIndex(0);
      setSelectedOptionId(null);
      setWrongHint(null);
      setIsFinished(false);
      setIsSuccess(false);
      setScore(0);

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
  const potentialPoints = SCORE_TABLE[clueIndex] || 250;

  const handlePlayClue = () => {
    if (!demoData?.track?.previewUrl) return;

    if (isPlaying) {
      stopAudio();
      return;
    }

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(demoData.track.previewUrl);
      } else if (audioRef.current.src !== demoData.track.previewUrl) {
        audioRef.current.src = demoData.track.previewUrl;
      }

      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          clearTimeout(playTimeoutRef.current);
          if (!isFinished) {
            playTimeoutRef.current = setTimeout(() => {
              stopAudio();
            }, currentDuration * 1000);
          }
        })
        .catch(() => {
          setIsPlaying(false);
        });
    } catch (e) {
      setIsPlaying(false);
    }
  };

  const handleNextClue = () => {
    if (clueIndex >= clueDurations.length - 1 || isFinished) return;
    stopAudio();
    setClueIndex(prev => prev + 1);
    setSelectedOptionId(null);
    setWrongHint(null);
  };

  const handleOptionClick = (option) => {
    if (isFinished || selectedOptionId) return;

    setSelectedOptionId(option.id);
    setWrongHint(null);

    if (option.isCorrect) {
      const points = SCORE_TABLE[clueIndex] || 250;
      setScore(points);
      setIsSuccess(true);
      setIsFinished(true);

      if (demoData?.track?.previewUrl) {
        try {
          if (!audioRef.current) {
            audioRef.current = new Audio(demoData.track.previewUrl);
          } else if (audioRef.current.src !== demoData.track.previewUrl) {
            audioRef.current.src = demoData.track.previewUrl;
          }
          clearTimeout(playTimeoutRef.current);
          audioRef.current.onended = () => setIsPlaying(false);
          audioRef.current.currentTime = 0;
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        } catch (e) {}
      }
    } else {
      stopAudio();
      if (clueIndex < clueDurations.length - 1) {
        const nextDur = clueDurations[clueIndex + 1];
        setWrongHint(
          tx(
            `Not quite! Clue unlocked to ${nextDur}s — give it another listen.`,
            `Kurang tepat! Petunjuk dibuka ke ${nextDur}s — coba dengarkan lagi.`
          )
        );
        setTimeout(() => {
          setClueIndex(prev => prev + 1);
          setSelectedOptionId(null);
        }, 850);
      } else {
        setTimeout(() => {
          setIsFinished(true);
          setIsSuccess(false);
        }, 850);
      }
    }
  };

  if (loading) {
    return (
      <section className="lp-demo-section" style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--color-text-dim)' }}>
          <Loader2 className="spin" size={28} color="var(--color-primary)" />
          <span style={{ fontSize: '0.88rem' }}>{tx('Loading live demo round...', 'Memuat ronde demo...')}</span>
        </div>
      </section>
    );
  }

  if (!demoData) return null;

  return (
    <section className="lp-demo-section">
      {/* Section Heading */}
      <div className="lp-section-head">
        <h2 className="lp-section-title">
          {tx('Try a 0.1s Round Right Now', 'Coba Ronde 0.1 Detik Sekarang')}
        </h2>
        <p className="lp-section-desc">
          {tx(
            'Press Play, listen to the ultra-short clip, and lock in your guess before unlocking longer clues.',
            'Tekan Play, dengarkan potongan super singkat, dan tebak judulnya sebelum membuka petunjuk lebih panjang.'
          )}
        </p>
      </div>

      {/* Redesigned 2-Column Studio Turntable Card */}
      <div className="lp-demo-card">
        <div className="lp-demo-grid">
          {/* LEFT COLUMN: Vinyl Turntable & Progressive Timeline */}
          <div className="lp-demo-stage">
            <div className="lp-demo-telemetry">
              <span className="lp-pin-chip lp-pin-chip--green">
                <Zap size={11} /> {isFinished ? tx('Full Preview', 'Preview Penuh') : `${currentDuration}s Clue`}
              </span>
            </div>

            {/* Spinning Vinyl Disc */}
            <div className={`lp-turntable-wrap ${isPlaying ? 'is-playing' : ''}`}>
              <div className="lp-vinyl-pulse" />
              <div className="lp-vinyl-pulse" />

              <div className="lp-vinyl-disc">
                <div className="lp-vinyl-groove" style={{ inset: '10px' }} />
                <div className="lp-vinyl-groove" style={{ inset: '20px' }} />
                <div className="lp-vinyl-groove" style={{ inset: '30px' }} />

                <div className="lp-vinyl-label">
                  {demoData.track.albumArt ? (
                    <img
                      src={demoData.track.albumArt}
                      alt="Demo Track"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: isFinished ? 'none' : 'blur(10px) brightness(0.65)',
                        transform: isFinished ? 'scale(1)' : 'scale(1.15)',
                        transition: 'filter 0.55s ease, transform 0.55s ease'
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#1e1e24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Music size={20} color="var(--color-primary)" />
                    </div>
                  )}
                </div>

                <div className="lp-vinyl-spindle" />
              </div>
            </div>

            {/* 12-Bar Audio Visualizer */}
            <div className={`lp-viz-bars ${isPlaying ? 'is-playing' : ''}`}>
              {VIZ_DELAYS.map((delay, idx) => (
                <span
                  key={idx}
                  className="lp-viz-bar"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>

            {/* 6-Step Progressive Reveal Pills */}
            <div className="lp-clue-steps">
              {clueDurations.map((dur, idx) => {
                const stateClass = idx === clueIndex ? 'active' : idx < clueIndex ? 'passed' : '';
                return (
                  <div key={dur} className={`lp-clue-step ${stateClass}`}>
                    {dur}s
                  </div>
                );
              })}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              <Button
                variant="primary"
                size="md"
                onClick={handlePlayClue}
                icon={isPlaying ? <Square size={15} fill="#000" /> : <Play size={15} fill="#000" />}
                style={{ flex: 1, height: '42px', fontWeight: 800, fontSize: '0.88rem' }}
              >
                {isPlaying
                  ? tx('Stop Audio', 'Berhenti')
                  : isFinished
                    ? tx('Play Preview', 'Putar Lagu')
                    : `Play ${currentDuration}s`}
              </Button>

              {!isFinished && clueIndex < clueDurations.length - 1 && (
                <Button
                  variant="secondary"
                  size="md"
                  disabled={isPlaying}
                  onClick={handleNextClue}
                  icon={<FastForward size={14} />}
                  style={{ height: '42px', fontSize: '0.82rem', fontWeight: 700, padding: '0 14px' }}
                >
                  +{clueDurations[clueIndex + 1]}s
                </Button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Guess Arena OR Result Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
            {!isFinished ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {tx('Pick the matching song', 'Pilih lagu yang tepat')}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}>
                    Level {clueIndex + 1}/{clueDurations.length}
                  </span>
                </div>

                {wrongHint && (
                  <div className="lp-demo-hint-banner">
                    <Sparkles size={14} style={{ flexShrink: 0 }} />
                    <span>{wrongHint}</span>
                  </div>
                )}

                <div className="lp-demo-choices">
                  {demoData.options.map((option, idx) => {
                    const isSelected = selectedOptionId === option.id;
                    const stateClass = isSelected ? (option.isCorrect ? 'is-correct' : 'is-wrong') : '';
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleOptionClick(option)}
                        disabled={selectedOptionId !== null}
                        className={`lp-choice-btn ${stateClass}`}
                      >
                        <span className="lp-choice-letter">{OPTION_LETTERS[idx] || idx + 1}</span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {option.title}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {option.artist}
                          </div>
                        </div>
                        {isSelected && (
                          <span style={{ flexShrink: 0, color: option.isCorrect ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                            {option.isCorrect ? <Check size={18} /> : <X size={18} />}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className={`lp-demo-result ${isSuccess ? 'is-win' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {demoData.track.albumArt ? (
                    <img
                      src={demoData.track.albumArt}
                      alt={demoData.track.title}
                      style={{ width: '74px', height: '74px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--color-border)' }}
                    />
                  ) : (
                    <div style={{ width: '74px', height: '74px', borderRadius: '14px', backgroundColor: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Music size={26} color="var(--color-primary)" />
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span className={`badge ${isSuccess ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.68rem' }}>
                        {isSuccess ? tx('Correct Guess!', 'Tebakan Benar!') : tx('Out of Clues', 'Kesempatan Habis')}
                      </span>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.08rem', color: 'var(--color-text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {demoData.track.title}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {demoData.track.artist}
                    </div>
                  </div>
                </div>

                {isSuccess && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--color-primary-subtle)',
                    border: '1px solid rgba(29, 185, 84, 0.3)',
                    fontSize: '0.82rem',
                    color: 'var(--color-text-bright)'
                  }}>
                    <Trophy size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                    <span>
                      {tx(
                        `Recognized in just ${currentDuration}s! Imagine climbing the global leaderboard with that speed.`,
                        `Tertebak hanya dalam ${currentDuration}s! Bayangkan skor kamu di Global Leaderboard.`
                      )}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={onRegisterClick}
                    icon={<ArrowRight size={16} />}
                    style={{ flex: '1 1 180px', fontWeight: 800 }}
                  >
                    {resolvedCtaLabel}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingDemoSection;
