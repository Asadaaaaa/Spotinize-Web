import React, { useState, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import {
  Play, Sparkles, Zap, Users, ArrowRight, Lock, User as UserIcon,
  LogIn, UserPlus, AlertCircle, Disc3, Flame, Headphones, Bookmark,
  CheckCircle2, Trophy, EyeOff, ChevronDown, ShoppingBag, Swords, Gift, Package
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import Logo from '../../components/Logo.jsx';
import AuthModal from '../../components/AuthModal.jsx';
import LandingDemoSection from '../../components/LandingDemoSection.jsx';
import ApiClient from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLanguage } from '../../hooks/useLanguage.jsx';
import '../../styles/landing.css';

function InstagramIcon({ size = 16, color = '#E1306C' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

const REVEAL_BARS = [
  { label: '0.1s', height: 14, pts: '+1000' },
  { label: '0.5s', height: 22, pts: '+900' },
  { label: '1.0s', height: 30, pts: '+750' },
  { label: '2.0s', height: 36, pts: '+600' },
  { label: '3.0s', height: 42, pts: '+450' },
  { label: '4.0s', height: 48, pts: '+300' },
  { label: '5.0s', height: 54, pts: '+150' }
];

export function LandingPage({ onStart, authModal: externalAuthModal = null, setAuthModal: setExternalAuthModal = null }) {
  const { register, login, loginAsGuest, isAuthenticated } = useAuth();
  const { tx } = useLanguage();
  const [guestStarting, setGuestStarting] = useState(false);

  // Modal states: null | 'LOGIN' | 'REGISTER'
  const [internalAuthModal, setInternalAuthModal] = useState(null);
  const authModal = externalAuthModal !== null ? externalAuthModal : internalAuthModal;
  const setAuthModal = setExternalAuthModal || setInternalAuthModal;

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Trending covers for Pinterest-style masonry collage
  const [trendingCovers, setTrendingCovers] = useState([]);

  // Live animated Bento states
  const [activeRevealStep, setActiveRevealStep] = useState(0);
  const [aiTickerIdx, setAiTickerIdx] = useState(0);

  const lenisRef = useRef(null);
  const masonryRef = useRef(null);
  const hScrollOuterRef = useRef(null);
  const hScrollTrackRef = useRef(null);
  const hScrollProgressRef = useRef(null);

  const aiTickerItems = [
    {
      tag: tx('Hardest Song', 'Lagu Tersulit'),
      text: tx('Only 14% guessed this track under 1.0s this week. Think you can beat it?', 'Cuma 14% pemain yang bisa nebak lagu ini di bawah 1 detik minggu ini!')
    },
    {
      tag: tx('New Release', 'Rilis Baru'),
      text: tx('Fresh Friday drop added to Global & Indonesia Trends — ready to play now.', 'Rilisan baru Jumat ini sudah masuk Global & Indonesia Trends, siap dimainkan.')
    },
    {
      tag: tx('Music Fun Fact', 'Fun Fact Musik'),
      text: tx('This iconic intro was recorded in a single take — tap to hear & bookmark!', 'Intro ikonik lagu ini direkam cuma dalam 1 take — klik buat dengerin & simpan!')
    }
  ];

  // Cycle live animations inside Bento section
  useEffect(() => {
    const revealTimer = setInterval(() => {
      setActiveRevealStep((prev) => (prev + 1) % REVEAL_BARS.length);
    }, 1150);

    const tickerTimer = setInterval(() => {
      setAiTickerIdx((prev) => (prev + 1) % 3);
    }, 3400);

    return () => {
      clearInterval(revealTimer);
      clearInterval(tickerTimer);
    };
  }, []);

  // Initialize Lenis Smooth Scrolling + Scroll-linked Masonry Parallax
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4
    });
    lenisRef.current = lenis;

    const handleScroll = ({ scroll }) => {
      if (masonryRef.current) {
        const clamped = Math.max(-44, Math.min(44, (scroll - 160) * 0.08));
        masonryRef.current.style.setProperty('--lp-parallax', `${clamped.toFixed(1)}px`);
      }

      if (hScrollOuterRef.current && hScrollTrackRef.current && window.innerWidth > 780) {
        const rect = hScrollOuterRef.current.getBoundingClientRect();
        const scrollableDist = Math.max(1, rect.height - window.innerHeight);
        const progress = Math.max(0, Math.min(1, -rect.top / scrollableDist));
        const maxShift = Math.max(0, hScrollTrackRef.current.scrollWidth - window.innerWidth + 32);
        const shiftX = -(progress * maxShift);
        hScrollTrackRef.current.style.transform = `translate3d(${shiftX.toFixed(1)}px, 0, 0)`;
        if (hScrollProgressRef.current) {
          hScrollProgressRef.current.style.setProperty('--h-progress', progress.toFixed(3));
        }
      }
    };

    lenis.on('scroll', handleScroll);

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.off('scroll', handleScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Pause Lenis background scroll when Auth Modal is open
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (authModal) {
      lenis.stop();
    } else {
      lenis.start();
    }
  }, [authModal]);

  // IntersectionObserver for smooth scroll-reveal sections
  useEffect(() => {
    const elements = document.querySelectorAll('.lp-reveal');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Fetch cached trending tracks for authentic album art pins
  useEffect(() => {
    let cancelled = false;
    ApiClient.get('/search/trending')
      .then((res) => {
        if (cancelled) return;
        const combined = [...(res.globalTrends || []), ...(res.indonesiaTrends || [])]
          .filter((t) => t?.albumArt);
        setTrendingCovers(combined);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleBentoMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mx', `${x}px`);
    e.currentTarget.style.setProperty('--my', `${y}px`);
  };

  const openRegister = () => {
    setErrorMsg('');
    setUsername('');
    setPassword('');
    setDisplayName('');
    setAuthModal('REGISTER');
  };

  const handleGuestPlay = async () => {
    if (guestStarting) return;
    try {
      setGuestStarting(true);
      await loginAsGuest();
      onStart();
    } catch (err) {
      setErrorMsg(err.message || tx('Failed to start guest mode', 'Gagal memulai mode guest'));
    } finally {
      setGuestStarting(false);
    }
  };

  const openLogin = () => {
    setErrorMsg('');
    setUsername('');
    setPassword('');
    setAuthModal('LOGIN');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const clean = username.trim();
    if (!clean) {
      setErrorMsg(tx('Username is required', 'Username wajib diisi'));
      return;
    }
    if (clean.length < 3) {
      setErrorMsg(tx('Username must be at least 3 characters', 'Username minimal 3 karakter'));
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setErrorMsg(tx('Username can only contain letters, numbers, and underscores (_)', 'Username hanya boleh berisi huruf, angka, dan underscore (_)'));
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg(tx('Password must be at least 4 characters', 'Password minimal 4 karakter'));
      return;
    }

    try {
      setSubmitting(true);
      await register(clean, password, displayName.trim());
      setAuthModal(null);
      onStart();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || tx('Failed to create account', 'Gagal mendaftarkan akun'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim() || !password) {
      setErrorMsg(tx('Username and password are required', 'Username dan password wajib diisi'));
      return;
    }

    try {
      setSubmitting(true);
      await login(username.trim(), password);
      setAuthModal(null);
      onStart();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || tx('Invalid username or password', 'Username atau password salah'));
    } finally {
      setSubmitting(false);
    }
  };

  const coverAt = (idx) => trendingCovers[idx] || null;
  const pin0 = coverAt(0);
  const pin1 = coverAt(1);
  const pin2 = coverAt(5) || coverAt(2);
  const pin3 = coverAt(6) || coverAt(3);
  const currentBar = REVEAL_BARS[activeRevealStep];
  const currentTicker = aiTickerItems[aiTickerIdx];

  return (
    <div className="lp-root">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', flex: 1, paddingBottom: '68px' }}>
        {/* HERO SECTION */}
        <section className="lp-hero">
          <div className="lp-hero-glow" />
          <div className="container-narrow" style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ margin: '0 0 14px 0', lineHeight: 1.06 }}>
              <Logo size="hero" />
            </h1>

            <p className="lp-hero-slogan">
              "How fast you recognize this song?"
            </p>

            <p className="lp-hero-subtitle">
              {tx(
                'Guess songs from 0.1s, conquer Daily Challenges & Ranked 1v1 Duels, open Cosmetic Crates in the Store, and connect on the Music Feed.',
                'Tebak lagu mulai dari 0.1 detik, taklukkan Daily Challenge & Ranked 1v1 Duel, buka Crate Kosmetik di Store, dan seru-seruan di Music Feed.'
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {isAuthenticated ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onStart}
                  icon={<Play size={20} fill="#000" />}
                  style={{ padding: '16px 36px', fontSize: '1.12rem', fontWeight: 800 }}
                >
                  {tx('Start Playing', 'Mulai Main')}
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={openRegister}
                    icon={<UserPlus size={20} />}
                    style={{ padding: '16px 34px', fontSize: '1.1rem', fontWeight: 800 }}
                  >
                    {tx('Create Account', 'Daftar Akun Baru')}
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    disabled={guestStarting}
                    onClick={handleGuestPlay}
                    icon={<Play size={18} color="var(--color-primary)" />}
                    style={{ padding: '16px 24px', fontSize: '1.02rem', fontWeight: 800, border: '1px solid var(--color-border)' }}
                  >
                    {guestStarting ? tx('Entering...', 'Masuk...') : tx('Try as Guest', 'Coba Main (Guest)')}
                  </Button>
                </>
              )}
            </div>

            <div className="lp-scroll-cue">
              <span>{tx('Scroll to explore', 'Scroll untuk jelajahi')}</span>
              <ChevronDown size={14} />
            </div>
          </div>
        </section>

        {/* PINTEREST-STYLE MASONRY COLLAGE */}
        <section ref={masonryRef} className="lp-masonry-stage" aria-label="Spotinize Visual Showcase">
          <div className="lp-masonry-grid">
            {/* Column 1 */}
            <div className="lp-masonry-col" style={{ '--col-speed': '-0.65' }}>
              <div className="lp-pin-card">
                <div className="lp-pin-cover-wrap lp-pin-cover-wrap--tall">
                  {pin0?.albumArt ? (
                    <img src={pin0.albumArt} alt={pin0.title} className="lp-pin-cover-img" />
                  ) : (
                    <div className="lp-pin-cover-fallback">
                      <Disc3 size={42} />
                    </div>
                  )}
                  <span className="lp-pin-float-pill">
                    <Zap size={11} color="var(--color-primary)" /> 0.1s Guess
                  </span>
                  <div className="lp-pin-play-fab">
                    <Play size={14} fill="#000" />
                  </div>
                </div>
                <div className="lp-pin-meta-row">
                  <div style={{ minWidth: 0 }}>
                    <div className="lp-pin-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pin0?.title || 'Global Trends #1'}
                    </div>
                    <div className="lp-pin-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pin0?.artist || 'Progressive Reveal'}
                    </div>
                  </div>
                  <span className="lp-pin-chip lp-pin-chip--green">+1000</span>
                </div>
              </div>

              <div className="lp-pin-card">
                <div className="lp-pin-meta-row">
                  <span className="lp-pin-chip" style={{ color: 'var(--color-warning)', borderColor: 'rgba(255, 164, 43, 0.35)', backgroundColor: 'rgba(255, 164, 43, 0.12)' }}>
                    <Flame size={11} /> 14 Day Streak
                  </span>
                  <span className="lp-pin-chip lp-pin-chip--green">94% Match</span>
                </div>
                <div className="lp-pin-title">
                  {tx('Taste Compatibility', 'Kecocokan Selera')}
                </div>
                <div className="lp-taste-bar-track">
                  <div className="lp-taste-bar-fill" />
                </div>
                <div className="lp-pin-sub">
                  {tx('Compare pinned tracks & fastest guesses on any profile.', 'Bandingkan Top 5 lagu & rekor tebakan di setiap profil.')}
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="lp-masonry-col lp-masonry-col--offset" style={{ '--col-speed': '0.55' }}>
              <div className="lp-pin-card">
                <div className="lp-pin-cover-wrap">
                  {pin1?.albumArt ? (
                    <img src={pin1.albumArt} alt="Blind Song Drop" className="lp-pin-cover-img lp-pin-cover-img--blurred" />
                  ) : (
                    <div className="lp-pin-cover-fallback">
                      <EyeOff size={36} />
                    </div>
                  )}
                  <span className="lp-pin-float-pill">
                    <EyeOff size={11} color="#3d91f4" /> Blind Drop
                  </span>
                  <div className="lp-pin-blind-overlay">
                    <Disc3 size={28} color="#fff" className="lp-spin-slow" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff' }}>
                      {tx('0.5s Clue Ready', 'Clue 0.5s Siap')}
                    </span>
                  </div>
                </div>
                <div className="lp-pin-title">
                  {tx('"Bet you know this chorus!"', '"Yakin lo tau reff lagu ini!"')}
                </div>
                <div className="lp-pin-meta-row">
                  <span className="lp-pin-sub">🔥 18 · 🎧 9</span>
                  <span className="lp-pin-chip">Bookmark <Bookmark size={10} /></span>
                </div>
              </div>

              <div className="lp-pin-card">
                <div className="lp-pin-meta-row">
                  <span className="lp-pin-chip">Song of the Day</span>
                  <Bookmark size={14} color="var(--color-primary)" />
                </div>
                <div className="lp-pin-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pin2?.title || 'On Repeat Today'}
                </div>
                <div className="lp-pin-sub">
                  {pin2?.artist || 'Indies & Pop'} · {tx('Preview & save to Saved Songs', 'Putar & simpan ke Saved Songs')}
                </div>
              </div>
            </div>

            {/* Column 3 */}
            <div className="lp-masonry-col" style={{ '--col-speed': '-0.45' }}>
              <div className="lp-pin-card">
                <div className="lp-pin-meta-row">
                  <span className="lp-pin-chip lp-pin-chip--green">
                    <Trophy size={11} /> Beat My Score
                  </span>
                  <span className="lp-pin-sub">5 Songs</span>
                </div>
                <div className="lp-pin-title">
                  {tx('Indonesia Trends Challenge', 'Tantangan Indonesia Trends')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div className="lp-mini-lb-row">
                    <span>#1 @asada</span>
                    <strong style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>4,620</strong>
                  </div>
                  <div className="lp-mini-lb-row">
                    <span>#2 @raka</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>4,180</strong>
                  </div>
                </div>
                <div className="lp-pin-sub">
                  {tx('Play the exact same 5-song round order.', 'Mainkan urutan 5 lagu yang persis sama.')}
                </div>
              </div>

              <div className="lp-pin-card">
                <div className="lp-pin-meta-row">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 800, fontSize: '0.8rem', color: 'var(--color-text-bright)' }}>
                    @spotinize <CheckCircle2 size={13} color="var(--color-primary)" />
                  </span>
                  <span className="lp-pin-chip" style={{ color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.35)', backgroundColor: 'rgba(168, 85, 247, 0.12)' }}>
                    <Sparkles size={10} /> AI Pulse
                  </span>
                </div>
                <div className="lp-pin-title">
                  {tx('Hardest Song This Week', 'Lagu Tersulit Minggu Ini')}
                </div>
                <div className="lp-pin-sub">
                  {tx('Only 18% of players guessed this under 2s. Can you?', 'Cuma 18% pemain yang bisa nebak di bawah 2 detik!')}
                </div>
              </div>
            </div>

            {/* Column 4 */}
            <div className="lp-masonry-col lp-masonry-col--offset" style={{ '--col-speed': '0.6' }}>
              <div className="lp-pin-card">
                <div className="lp-pin-meta-row">
                  <span className="lp-pin-chip lp-pin-chip--green">Live Room</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    SPOT42
                  </span>
                </div>
                <div className="lp-pin-title">
                  {tx('Duel Mutual Friends', 'Duel Teman Mutual')}
                </div>
                <div className="lp-pin-sub">
                  {tx('Real-time Socket.IO room with live round leaderboard.', 'Room Socket.IO real-time dengan papan skor langsung.')}
                </div>
              </div>

              <div className="lp-pin-card">
                <div className="lp-pin-cover-wrap">
                  {pin3?.albumArt ? (
                    <img src={pin3.albumArt} alt={pin3.title} className="lp-pin-cover-img" />
                  ) : (
                    <div className="lp-pin-cover-fallback">
                      <Package size={36} />
                    </div>
                  )}
                  <span className="lp-pin-float-pill">
                    <ShoppingBag size={11} color="var(--color-primary)" /> Store &amp; Crates
                  </span>
                </div>
                <div className="lp-pin-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tx('Cosmetic Crates & Locker', 'Crate Kosmetik & Locker')}
                </div>
                <div className="lp-pin-sub">
                  {tx('Unlock Avatar Frames, Vinyl Skins & Titles with Notes.', 'Buka Avatar Frame, Vinyl Skin & Title pakai Notes.')}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HORIZONTAL SCROLL-DRIVEN FEATURE SHOWCASE */}
        <section ref={hScrollOuterRef} className="lp-hscroll-outer">
          <div className="lp-hscroll-sticky">
            <div className="lp-hscroll-head">
              <div>
                <h2 className="lp-section-title" style={{ textAlign: 'left', marginBottom: '6px' }}>
                  {tx('Built for music heads & fast ears.', 'Dibuat untuk telinga cepat & pecinta musik.')}
                </h2>
                <p className="lp-section-desc" style={{ textAlign: 'left', margin: 0, maxWidth: '520px' }}>
                  {tx(
                    'A fast-paced music guessing arena at the core, wrapped in a lightweight social feed.',
                    'Arena tebak lagu cepat sebagai inti permainan, dipadukan dengan feed sosial musik yang ringan.'
                  )}
                </p>
              </div>
            </div>

            <div className="lp-hscroll-viewport">
              <div ref={hScrollTrackRef} className="lp-hscroll-track">
                {/* Feature Card 1: Live Cycling Progressive Reveal */}
                <div
                  className="lp-hscroll-card lp-hscroll-card--wide"
                  onMouseMove={handleBentoMouseMove}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div className="lp-bento-icon" style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)', marginBottom: 0 }}>
                        <Zap size={21} />
                      </div>
                      <span className="lp-pin-chip lp-pin-chip--green" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>
                        {currentBar.label} · {currentBar.pts} PTS
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.18rem', fontWeight: 900, marginBottom: '6px' }}>
                      Progressive Reveal (0.1s → 5.0s)
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {tx(
                        'Start from a 0.1s audio flash across Global & Indonesia Trends, Genre Hits, Release Years, Nostalgia < 2000, or Artist Mode.',
                        'Mulai dari potongan 0.1 detik lintas Global & Indonesia Trends, Genre Hits, Era & Tahun, Nostalgia < 2000, hingga Artist Mode.'
                      )}
                    </p>
                  </div>

                  <div className="lp-bento-visual">
                    <div className="lp-reveal-bars">
                      {REVEAL_BARS.map((bar, idx) => {
                        const barState = idx === activeRevealStep ? 'active' : idx < activeRevealStep ? 'passed' : '';
                        return (
                          <div key={bar.label} className="lp-reveal-bar">
                            <div
                              className={`lp-reveal-bar-fill ${barState}`}
                              style={{ height: `${bar.height}px` }}
                            />
                            <span style={{
                              fontSize: '0.66rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: idx === activeRevealStep ? 800 : 600,
                              color: idx === activeRevealStep ? 'var(--color-primary)' : 'var(--color-text-dim)'
                            }}>
                              {bar.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Feature Card 2: Music Feed & Blind Drop */}
                <div
                  className="lp-hscroll-card"
                  onMouseMove={handleBentoMouseMove}
                >
                  <div>
                    <div className="lp-bento-icon" style={{ backgroundColor: 'rgba(61, 145, 244, 0.15)', color: '#3d91f4' }}>
                      <Disc3 size={21} className="lp-spin-slow" />
                    </div>
                    <h3 style={{ fontSize: '1.18rem', fontWeight: 900, marginBottom: '6px' }}>
                      Music Feed & Blind Drop
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {tx(
                        'Post Song of the Day or hide a track behind a blurred Blind Drop card for followers to guess right inside the timeline.',
                        'Posting Song of the Day atau sembunyikan lagu di kartu Blind Drop tersensor agar followers menebaknya langsung di feed.'
                      )}
                    </p>
                  </div>

                  <div className="lp-bento-visual" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div className="lp-blind-scan" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '11px', backgroundColor: 'rgba(61, 145, 244, 0.15)', color: '#3d91f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <EyeOff size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--color-text-bright)' }}>
                          ??? — ???
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                          {tx('Solved by 12 · Fastest 0.5s', 'Ditebak 12 orang · Tercepat 0.5s')}
                        </div>
                      </div>
                    </div>
                    <div className="lp-eq-bars" aria-hidden="true">
                      <span className="lp-eq-bar" />
                      <span className="lp-eq-bar" />
                      <span className="lp-eq-bar" />
                      <span className="lp-eq-bar" />
                    </div>
                  </div>
                </div>

                {/* Feature Card 3: Live Multiplayer & Async Challenge */}
                <div
                  className="lp-hscroll-card lp-hscroll-card--wide"
                  onMouseMove={handleBentoMouseMove}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div className="lp-bento-icon" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)', marginBottom: 0 }}>
                        <Users size={21} />
                      </div>
                      <span className="lp-pin-chip lp-pin-chip--green">
                        <span className="lp-live-dot" /> LIVE ROOM · SPOT42
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.18rem', fontWeight: 900, marginBottom: '6px' }}>
                      {tx('Multiplayer, Speed Buzz & Ranked 1v1', 'Multiplayer, Speed Buzz & Ranked 1v1')}
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {tx(
                        'Play Classic, Speed Buzz, Survival, or Ranked 1v1 Duels in real time — plus Async Beat My Score challenges.',
                        'Mainkan mode Classic, Speed Buzz, Survival, hingga Ranked 1v1 Duel secara real-time — plus Async Beat My Score challenge.'
                      )}
                    </p>
                  </div>

                  <div className="lp-bento-visual" style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <div className="lp-mini-lb-row">
                      <div className="lp-mini-lb-bg" style={{ width: `${82 + (activeRevealStep % 2) * 10}%` }} />
                      <span>#1 · @asada <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>(Host)</span></span>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>4,850 pts</strong>
                    </div>
                    <div className="lp-mini-lb-row">
                      <div className="lp-mini-lb-bg" style={{ width: `${66 + ((activeRevealStep + 1) % 2) * 10}%`, backgroundColor: 'rgba(255, 255, 255, 0.05)' }} />
                      <span>#2 · @budi</span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>4,310 pts</strong>
                    </div>
                  </div>
                </div>

                {/* Feature Card 4: Official @spotinize AI & Daily Streak */}
                <div
                  className="lp-hscroll-card"
                  onMouseMove={handleBentoMouseMove}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div className="lp-bento-icon" style={{ backgroundColor: 'rgba(168, 85, 247, 0.14)', color: '#c084fc', marginBottom: 0 }}>
                        <Sparkles size={21} />
                      </div>
                      <span className="streak-pill lp-streak-pulse">
                        <Flame size={12} /> 14 Streak
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.18rem', fontWeight: 900, marginBottom: '6px' }}>
                      {tx('Daily Challenge, Quests & Streaks', 'Daily Challenge, Quests & Streak')}
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {tx(
                        'Conquer the 5-song Daily Challenge, claim 7-day Daily Login & Quest rewards, and follow @spotinize official pulse.',
                        'Taklukkan Daily Challenge 5 lagu, klaim hadiah Daily Login 7 hari & Quest, serta ikuti update resmi @spotinize.'
                      )}
                    </p>
                  </div>

                  <div className="lp-bento-visual">
                    <div key={aiTickerIdx} className="lp-ticker-box">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-bright)' }}>
                          @spotinize <CheckCircle2 size={12} color="var(--color-primary)" />
                        </span>
                        <span className="lp-pin-chip" style={{ color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.3)', backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                          {currentTicker.tag}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                        {currentTicker.text}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Card 5: Store, Crates & Music Identity */}
                <div
                  className="lp-hscroll-card lp-hscroll-card--wide"
                  onMouseMove={handleBentoMouseMove}
                >
                  <div>
                    <div className="lp-bento-icon" style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
                      <ShoppingBag size={21} />
                    </div>
                    <h3 style={{ fontSize: '1.18rem', fontWeight: 900, marginBottom: '6px' }}>
                      {tx('Store, Crates & Music Identity', 'Store, Crate & Identitas Musik')}
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {tx(
                        'Open 3 tiers of Cosmetic Crates, equip Avatar Frames, Vinyl Skins & Titles, unlock Achievements, and compare Taste Compatibility %.',
                        'Buka 3 tier Crate Kosmetik, pasang Avatar Frame, Vinyl Skin & Title, raih Achievements, dan cek Taste Compatibility %.'
                      )}
                    </p>
                  </div>

                  <div className="lp-bento-visual" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-bright)' }}>
                        Taste Compatibility
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: 'var(--color-primary)' }}>94%</span>
                    </div>
                    <div className="lp-taste-bar-track">
                      <div className="lp-taste-bar-fill" />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="badge badge-green" style={{ fontSize: '0.66rem' }}>Cosmetic Crates</span>
                      <span className="badge badge-gray" style={{ fontSize: '0.66rem' }}>Avatar Frames</span>
                      <span className="badge badge-gray" style={{ fontSize: '0.66rem' }}>Achievements</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div ref={hScrollProgressRef} className="lp-hscroll-progress-wrap">
              <div className="lp-hscroll-progress-track">
                <div className="lp-hscroll-progress-fill" />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-dim)' }}>
                01 — 05
              </span>
            </div>
          </div>
        </section>

        {/* REDESIGNED INTERACTIVE DEMO GAME (BELOW BENTO SECTION) */}
        <div className="lp-reveal" style={{ '--delay': '60ms' }}>
          <LandingDemoSection
            onRegisterClick={isAuthenticated ? onStart : openRegister}
            ctaLabel={isAuthenticated ? tx('Continue Playing Now', 'Lanjut Main Sekarang') : tx('Sign Up & Play Full Game', 'Daftar & Main Lengkap')}
          />
        </div>

        {/* CLOSING CTA BAND */}
        <section className="container lp-reveal">
          <div className="lp-cta-band">
            <h2 style={{ fontSize: 'clamp(1.35rem, 3.2vw, 1.85rem)', fontWeight: 900, margin: 0 }}>
              {tx('Ready to prove how fast your ears are?', 'Siap buktiin seberapa cepat telingamu?')}
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', maxWidth: '480px', margin: 0 }}>
              {tx(
                'Jump straight into Solo, Daily Challenge, Ranked 1v1, Multiplayer, Store Crates, and the Music Feed with a quick username signup.',
                'Langsung masuk ke mode Solo, Daily Challenge, Ranked 1v1, Multiplayer, Crate Store, dan Music Feed cukup dengan username.'
              )}
            </p>
            <div style={{ marginTop: '6px' }}>
              {isAuthenticated ? (
                <Button variant="primary" size="lg" onClick={onStart} icon={<Play size={18} fill="#000" />}>
                  {tx('Go to Home', 'Buka Home')}
                </Button>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <Button variant="primary" size="lg" onClick={openRegister} icon={<UserPlus size={18} />}>
                    {tx('Create Free Account', 'Buat Akun Sekarang')}
                  </Button>
                  <Button variant="secondary" size="lg" disabled={guestStarting} onClick={handleGuestPlay} icon={<Play size={18} color="var(--color-primary)" />}>
                    {guestStarting ? tx('Entering...', 'Masuk...') : tx('Try as Guest', 'Coba Main (Guest)')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Credits & Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'rgba(18, 18, 18, 0.65)',
        backdropFilter: 'blur(12px)',
        padding: '36px 24px 28px 24px',
        marginTop: 'auto',
        marginBottom: 0,
        textAlign: 'center',
        width: '100%'
      }}>
        <div className="container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px'
        }}>
          <Logo size="md" />

          {/* Creators Credits */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '4px'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Crafted with ❤️ by
            </span>

            <a
              href="https://instagram.com/mikailasada"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-bright)',
                textDecoration: 'none',
                fontSize: '0.88rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              <InstagramIcon size={16} color="#E1306C" />
              <span>Mikail Asada</span>
            </a>

            <a
              href="https://instagram.com/rafiharefa"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-bright)',
                textDecoration: 'none',
                fontSize: '0.88rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              <InstagramIcon size={16} color="#E1306C" />
              <span>Risyad Rafi</span>
            </a>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', marginTop: '8px' }}>
            © 2026 Spotinize
          </div>
        </div>
      </footer>

      {/* Auth Modal (Register / Login) */}
      <AuthModal
        mode={authModal}
        onChangeMode={setAuthModal}
        onClose={() => setAuthModal(null)}
        onSuccess={onStart}
      />
    </div>
  );
}

export default LandingPage;
