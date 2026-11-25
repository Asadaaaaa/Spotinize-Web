import React, { useState, useEffect } from 'react';
import { ArrowRight, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import Button from './Button.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function AuthModal({ mode = null, onChangeMode, onClose, onSuccess }) {
  const { register, login } = useAuth();
  const { tx } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode) {
      setErrorMsg('');
      setUsername('');
      setPassword('');
      setDisplayName('');
    }
  }, [mode]);

  if (!mode) return null;

  const isRegister = mode === 'REGISTER';

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
      onClose?.();
      onSuccess?.();
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
      onClose?.();
      onSuccess?.();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || tx('Invalid username or password', 'Username atau password salah'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1110 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', padding: '28px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '6px' }}>
            {isRegister ? 'Create Account' : tx('Log In to Spotinize', 'Masuk ke Spotinize')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {isRegister
              ? tx('Sign up with just a username & password — no email required.', 'Daftar dengan username & password tanpa perlu email.')
              : tx('Enter your account username and password.', 'Masukkan username dan password akun kamu.')}
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

        <form onSubmit={isRegister ? handleRegisterSubmit : handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-muted)' }}>
              USERNAME
            </label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
              <input
                type="text"
                className="input"
                placeholder="john_doe_123"
                value={username}
                onChange={e => setUsername(isRegister ? e.target.value.replace(/[^a-zA-Z0-9_]/g, '') : e.target.value)}
                style={{ paddingLeft: '38px', fontSize: '0.95rem' }}
                autoFocus
                required
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-muted)' }}>
                {tx('DISPLAY NAME (OPTIONAL)', 'NAMA LENGKAP / PANGGILAN (OPSIONAL)')}
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
                placeholder={tx('Minimum 4 characters...', 'Minimal 4 karakter...')}
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
              ? tx('Processing...', 'Memproses...')
              : (isRegister ? tx('Register', 'Daftar') : tx('Log In', 'Masuk'))}
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          {isRegister ? (
            <span>
              {tx('Already have an account?', 'Sudah punya akun?')}{' '}
              <button
                type="button"
                onClick={() => onChangeMode?.('LOGIN')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                {tx('Log in here', 'Masuk di sini')}
              </button>
            </span>
          ) : (
            <span>
              {tx("Don't have an account?", 'Belum punya akun?')}{' '}
              <button
                type="button"
                onClick={() => onChangeMode?.('REGISTER')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                {tx('Sign up here', 'Daftar di sini')}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
