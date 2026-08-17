import React, { useState } from 'react';
import { Play, Sparkles, Zap, Users, Music2, ArrowRight, Lock, User as UserIcon, LogIn, UserPlus, AlertCircle, Share2 } from 'lucide-react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Logo from '../../components/Logo.jsx';
import LandingDemoSection from '../../components/LandingDemoSection.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';

function InstagramIcon({ size = 16, color = '#E1306C' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

export function LandingPage({ onStart, authModal: externalAuthModal = null, setAuthModal: setExternalAuthModal = null }) {
  const { register, login } = useAuth();
  
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

  const openRegister = () => {
    setErrorMsg('');
    setUsername('');
    setPassword('');
    setDisplayName('');
    setAuthModal('REGISTER');
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
    if (!username.trim()) {
      setErrorMsg('Username wajib diisi');
      return;
    }
    if (username.trim().length < 3) {
      setErrorMsg('Username minimal 3 karakter');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Password minimal 4 karakter');
      return;
    }

    try {
      setSubmitting(true);
      await register(username.trim(), password, displayName.trim());
      setAuthModal(null);
      onStart();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Gagal mendaftarkan akun');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim() || !password) {
      setErrorMsg('Username dan password wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      await login(username.trim(), password);
      setAuthModal(null);
      onStart();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Username atau password salah');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', minHeight: '100%', paddingBottom: 0, margin: 0 }}>
      {/* Main Sections Wrapper */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '56px', flex: 1, paddingBottom: '48px' }}>
        {/* Hero Section */}
        <section style={{
          textAlign: 'center',
          paddingTop: '60px',
          paddingBottom: '40px',
          position: 'relative'
        }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '340px',
          height: '340px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(29, 185, 84, 0.22) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div className="container-narrow" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            margin: '0 0 16px 0',
            lineHeight: 1.08
          }}>
            <Logo size="hero" />
          </h1>

          <p style={{
            fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)',
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: '32px',
            letterSpacing: '-0.01em'
          }}>
            "How fast you recognize this song?"
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="lg"
              onClick={openRegister}
              icon={<UserPlus size={20} />}
              style={{ padding: '16px 36px', fontSize: '1.15rem', fontWeight: 800 }}
            >
              Daftar Akun Baru
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={openLogin}
              icon={<LogIn size={20} color="var(--color-primary)" />}
              style={{ padding: '16px 30px', fontSize: '1.15rem', fontWeight: 700 }}
            >
              Masuk / Login
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      {/* Feature Pillars (2x2 Grid on Desktop & Mobile) */}
      <section className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '14px'
        }}>
          {/* Card 1: Progressive Reveal */}
          <Card style={{ padding: 'clamp(14px, 3vw, 22px)', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-primary-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
              marginBottom: '12px'
            }}>
              <Zap size={20} />
            </div>
            <h3 style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)', fontWeight: 800, marginBottom: '6px' }}>
              Progressive Reveal
            </h3>
            <p style={{ fontSize: 'clamp(0.76rem, 2vw, 0.88rem)', color: 'var(--color-text-muted)', lineHeight: 1.45, margin: 0 }}>
              Dengarkan potongan audio dari <strong>0.1s → 5.0s</strong>. Makin cepat lo tebak, makin besar skor lo!
            </p>
          </Card>

          {/* Card 2: Multiplayer Live */}
          <Card style={{ padding: 'clamp(14px, 3vw, 22px)', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-warning-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-warning)',
              marginBottom: '12px'
            }}>
              <Users size={20} />
            </div>
            <h3 style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)', fontWeight: 800, marginBottom: '6px' }}>
              Multiplayer Live
            </h3>
            <p style={{ fontSize: 'clamp(0.76rem, 2vw, 0.88rem)', color: 'var(--color-text-muted)', lineHeight: 1.45, margin: 0 }}>
              Ajak circle tongkrongan lo buat duel tebak lagu real-time lewat room code & live leaderboard.
            </p>
          </Card>

          {/* Card 3: Spotify Connected */}
          <Card style={{ padding: 'clamp(14px, 3vw, 22px)', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(61, 145, 244, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3d91f4',
              marginBottom: '12px'
            }}>
              <Music2 size={20} />
            </div>
            <h3 style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)', fontWeight: 800, marginBottom: '6px' }}>
              Spotify Connected
            </h3>
            <p style={{ fontSize: 'clamp(0.76rem, 2vw, 0.88rem)', color: 'var(--color-text-muted)', lineHeight: 1.45, margin: 0 }}>
              Hubungkan akun Spotify untuk sinkronisasi profil, ranking global, dan akses jutaan lagu.
            </p>
          </Card>

          {/* Card 4: Social & Flex */}
          <Card style={{ padding: 'clamp(14px, 3vw, 22px)', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(225, 48, 108, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E1306C',
              marginBottom: '12px'
            }}>
              <Share2 size={20} />
            </div>
            <h3 style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)', fontWeight: 800, marginBottom: '6px' }}>
              Social & Flex
            </h3>
            <p style={{ fontSize: 'clamp(0.76rem, 2vw, 0.88rem)', color: 'var(--color-text-muted)', lineHeight: 1.45, margin: 0 }}>
              Pamerkan kartu skor & pencapaian aesthetic lo langsung ke Instagram Stories & teman.
            </p>
          </Card>
        </div>
      </section>

      {/* Interactive 1-Song Quick Demo Section */}
      <LandingDemoSection onRegisterClick={openRegister} />
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

            {/* Mikail Asada */}
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

            {/* Risyad Rafi */}
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
      {authModal && (
        <div className="modal-backdrop" onClick={() => setAuthModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', padding: '28px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '6px' }}>
                {authModal === 'REGISTER' ? 'Daftar Akun Baru' : 'Masuk ke Spotinize'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {authModal === 'REGISTER' 
                  ? 'Daftar dengan username & password tanpa perlu email.' 
                  : 'Masukkan username dan password akun kamu.'}
              </p>
            </div>

            {errorMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(235, 87, 87, 0.15)',
                border: '1px solid rgba(235, 87, 87, 0.3)',
                color: '#ff6b6b',
                fontSize: '0.85rem',
                marginBottom: '16px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={authModal === 'REGISTER' ? handleRegisterSubmit : handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-muted)' }}>
                  USERNAME
                </label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                  <input
                    type="text"
                    className="input"
                    placeholder="john_doe"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={{ paddingLeft: '38px', fontSize: '0.95rem' }}
                    autoFocus
                    required
                  />
                </div>
              </div>

              {authModal === 'REGISTER' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-muted)' }}>
                    NAMA LENGKAP / PANGGILAN (OPSIONAL)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    style={{ fontSize: '0.95rem' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-muted)' }}>
                  PASSWORD
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                  <input
                    type="password"
                    className="input"
                    placeholder="Minimal 4 karakter..."
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingLeft: '38px', fontSize: '0.95rem' }}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={submitting}
                icon={<ArrowRight size={18} />}
                style={{ height: '48px', fontSize: '1rem', fontWeight: 800, marginTop: '8px' }}
              >
                {submitting 
                  ? 'Memproses...' 
                  : (authModal === 'REGISTER' ? 'Daftar & Lanjut ke Spotify' : 'Masuk Sekarang')}
              </Button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {authModal === 'REGISTER' ? (
                <span>
                  Sudah punya akun?{' '}
                  <button 
                    onClick={openLogin}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Masuk di sini
                  </button>
                </span>
              ) : (
                <span>
                  Belum punya akun?{' '}
                  <button 
                    onClick={openRegister}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Daftar di sini
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
