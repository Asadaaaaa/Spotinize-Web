import React, { useState, useEffect } from 'react';
import {
  Settings, X, Volume2, VolumeX, Music, Smartphone, Bell, Globe, Send
} from 'lucide-react';
import Button from './Button.jsx';
import audioPlayer from '../services/audioPlayer.js';
import feedAudioManager from '../services/feedAudioManager.js';
import soundFx from '../services/soundFx.js';
import haptics from '../services/haptics.js';
import pushNotifications from '../services/pushNotifications.js';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function SettingsModal({ isOpen, onClose }) {
  const { lang, toggleLang, t, tx } = useLanguage();
  const [volume, setVolume] = useState(() => audioPlayer.getVolume());
  const [muted, setMuted] = useState(() => audioPlayer.isMuted());
  const [sfxEnabled, setSfxEnabled] = useState(() => soundFx.isEnabled());
  const [hapticsEnabled, setHapticsEnabled] = useState(() => haptics.isEnabled());
  const [pushPerm, setPushPerm] = useState(() => pushNotifications.getPermission());
  const [pushEnabled, setPushEnabled] = useState(() => pushNotifications.isEnabled());
  const [pushStatusMsg, setPushStatusMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setVolume(audioPlayer.getVolume());
      setMuted(audioPlayer.isMuted());
      setSfxEnabled(soundFx.isEnabled());
      setHapticsEnabled(haptics.isEnabled());
      setPushPerm(pushNotifications.getPermission());
      setPushEnabled(pushNotifications.isEnabled());
      setPushStatusMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const effectivePercent = muted ? 0 : Math.round(volume * 100);

  const handleVolumeChange = (nextVol) => {
    const clamped = Math.max(0, Math.min(1, Number(nextVol)));
    setVolume(clamped);
    if (clamped > 0 && muted) setMuted(false);
    audioPlayer.setVolume(clamped);
    feedAudioManager.setVolume(clamped);
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    audioPlayer.setMuted(nextMuted);
    feedAudioManager.setMuted(nextMuted);
  };

  const handleToggleSfx = () => {
    const next = !sfxEnabled;
    soundFx.setEnabled(next);
    setSfxEnabled(next);
    if (next) soundFx.playTap();
  };

  const handleToggleHaptics = () => {
    const next = !hapticsEnabled;
    haptics.setEnabled(next);
    setHapticsEnabled(next);
    if (next) haptics.tap();
  };

  const handleTogglePush = async () => {
    setPushStatusMsg('');
    if (!pushNotifications.isSupported()) {
      setPushStatusMsg(tx('Browser does not support notifications.', 'Browser tidak mendukung notifikasi.'));
      return;
    }

    if (pushEnabled) {
      pushNotifications.setEnabled(false);
      setPushEnabled(false);
      return;
    }

    if (pushPerm === 'granted') {
      pushNotifications.setEnabled(true);
      setPushEnabled(true);
      await pushNotifications.registerWorker();
      return;
    }

    if (pushPerm === 'denied') {
      setPushStatusMsg(tx('Blocked by browser. Enable notifications in site settings.', 'Diblokir browser. Aktifkan izin notifikasi di pengaturan situs.'));
      return;
    }

    const perm = await pushNotifications.requestPermission();
    setPushPerm(perm);
    setPushEnabled(perm === 'granted');
    if (perm !== 'granted') {
      setPushStatusMsg(tx('Notification permission was not granted.', 'Izin notifikasi belum diberikan.'));
    }
  };

  const handleTestPush = async () => {
    soundFx.playNotif();
    haptics.reward();
    const ok = await pushNotifications.show({
      title: 'Spotinize',
      body: tx('Push notifications are active!', 'Push notification Spotinize aktif!'),
      tag: 'spotinize-test',
      force: true
    });
    if (!ok) {
      setPushStatusMsg(tx('Enable push permission first to test OS notification.', 'Aktifkan izin notifikasi terlebih dahulu untuk mengetes.'));
    } else {
      setPushStatusMsg(tx('Test notification sent!', 'Notifikasi uji terkirim!'));
    }
  };

  const renderSwitch = (active, onToggle, label) => (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      onClick={onToggle}
      style={{
        width: '42px',
        height: '24px',
        borderRadius: '999px',
        border: active ? '1px solid rgba(29,185,84,0.5)' : '1px solid rgba(255,255,255,0.12)',
        backgroundColor: active ? 'var(--color-primary)' : '#1c1c26',
        padding: '2px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: active ? 'flex-end' : 'flex-start',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        flexShrink: 0
      }}
    >
      <span
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: active ? '#000' : '#9ca3af',
          transition: 'all 0.15s ease'
        }}
      />
    </button>
  );

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '420px',
          width: '94%',
          backgroundColor: '#111116',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.08rem', fontWeight: 900, margin: 0 }}>
              {tx('Settings', 'Pengaturan')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: '#16161e',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Master Volume */}
        <div style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#16161e', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="volume-mute-btn"
              onClick={handleToggleMute}
              title={muted ? tx('Unmute', 'Bunyikan') : tx('Mute', 'Bisukan')}
            >
              {muted || volume === 0 ? <VolumeX size={16} color="var(--color-danger)" /> : <Volume2 size={16} color="var(--color-primary)" />}
            </button>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#f3f4f6' }}>
                <span>{t('gameVolume')}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>{effectivePercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={muted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="volume-range-input"
                aria-label={t('gameVolume')}
              />
            </div>
          </div>
        </div>

        {/* Sound Effects (Modern Clean Synth) */}
        <div style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#16161e', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <Music size={17} color="#c084fc" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f3f4f6' }}>
                {tx('Sound Effects', 'Efek Suara (SFX)')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                {tx('Modern Clean Synth UI & game feedback', 'Synth modern untuk reaksi, tebakan, dan crate')}
              </div>
            </div>
          </div>
          {renderSwitch(sfxEnabled, handleToggleSfx, 'Toggle Sound Effects')}
        </div>

        {/* Haptic Feedback */}
        <div style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#16161e', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <Smartphone size={17} color="#38bdf8" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f3f4f6' }}>
                {tx('Haptic Feedback', 'Getar Haptic')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                {tx('Vibration feedback on mobile devices', 'Getaran sentuh saat bermain di perangkat mobile')}
              </div>
            </div>
          </div>
          {renderSwitch(hapticsEnabled, handleToggleHaptics, 'Toggle Haptic Feedback')}
        </div>

        {/* Push Notifications */}
        <div style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#16161e', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <Bell size={17} color="#facc15" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f3f4f6' }}>
                  {tx('Push Notifications', 'Push Notification')}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                  {pushPerm === 'denied'
                    ? tx('Blocked in browser settings', 'Diblokir di pengaturan browser')
                    : tx('Alerts for invites, reactions & followers', 'Notifikasi undangan, reaksi, dan follower baru')}
                </div>
              </div>
            </div>
            {renderSwitch(pushEnabled, handleTogglePush, 'Toggle Push Notifications')}
          </div>

          {pushEnabled && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleTestPush}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#0e0e14',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
              >
                <Send size={11} />
                <span>{tx('Test Notification', 'Tes Notifikasi')}</span>
              </button>
            </div>
          )}

          {pushStatusMsg && (
            <div style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 600 }}>
              {pushStatusMsg}
            </div>
          )}
        </div>

        {/* Language */}
        <div style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#16161e', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={17} color="var(--color-primary)" />
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f3f4f6' }}>
              {lang === 'en' ? 'Language' : 'Bahasa'}
            </span>
          </div>
          <div className="segmented-pill">
            <button
              type="button"
              className={`segmented-pill-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => lang !== 'en' && toggleLang()}
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            >
              EN
            </button>
            <button
              type="button"
              className={`segmented-pill-btn ${lang === 'id' ? 'active' : ''}`}
              onClick={() => lang !== 'id' && toggleLang()}
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            >
              ID
            </button>
          </div>
        </div>

        <Button variant="primary" size="sm" onClick={onClose} style={{ width: '100%', marginTop: '2px' }}>
          {tx('Done', 'Selesai')}
        </Button>
      </div>
    </div>
  );
}

export default SettingsModal;
