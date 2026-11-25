import React, { useState, useEffect } from 'react';
import { Search, SkipForward, Clock, Music, Loader2, ArrowLeft, CheckCircle2, Users, LogOut, ArrowRight, Heart, Zap, Skull, Bell } from 'lucide-react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import AudioCluePlayer from '../../components/AudioCluePlayer.jsx';
import SongSearchModal from '../../components/SongSearchModal.jsx';
import LiveLeaderboard from '../../components/LiveLeaderboard.jsx';
import PreparingGameModal from '../../components/PreparingGameModal.jsx';
import RoundResultModal from '../Result/RoundResultModal.jsx';
import FinalResultPage from '../Result/FinalResultPage.jsx';
import { VinylDiscStage } from '../../components/VinylArt.jsx';
import { getSpotifyTrackUrl, SpotifyIcon } from '../../utils/spotifyLink.jsx';
import useGame from '../../hooks/useGame.js';
import { useLanguage } from '../../hooks/useLanguage.jsx';
import ApiClient from '../../services/api.js';
import socketService from '../../services/socket.js';
import audioPlayer from '../../services/audioPlayer.js';

export function GamePage({ gameId, user, onExitToDashboard, onGameFinished }) {
  const { t, tx, tCategory } = useLanguage();
  const {
    gameState,
    loading,
    error,
    isInitialGameReady,
    initialProgress,
    isPlayingAudio,
    isAudioReady,
    isAudioLoading,
    revealLevel,
    remainingAttempts,
    roundStatus,
    feedbackMessage,
    thinkingSeconds,
    isRoundResultOpen,
    revealedTrack,
    isWaitingForOthers,
    speedBuzzState,
    emitSpeedBuzz,
    submitSpeedBuzzGuess,
    playClue,
    revealNext,
    submitGuess,
    skipRound,
    nextRound
  } = useGame(gameId, user);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleQuitGame = async () => {
    audioPlayer.stop();
    try {
      await ApiClient.post(`/game/${gameId}/leave`);
    } catch (e) {}
    try {
      socketService.getSocket().emit('game:leave_room', { gameId });
    } catch (e) {}
    try {
      sessionStorage.removeItem('spotinize_active_session');
    } catch (e) {}
    onExitToDashboard?.();
  };

  useEffect(() => {
    if (gameState?.isFinished || gameState?.status === 'FINISHED') {
      onGameFinished?.();
    }
  }, [gameState?.isFinished, gameState?.status, onGameFinished]);

  if (loading && !gameState) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <Loader2 className="spin" size={36} color="var(--color-primary)" />
        <p style={{ fontWeight: 700 }}>{tx('Preparing Game Arena...', 'Menyiapkan Arena Game...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-narrow" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--color-danger)', marginBottom: '12px' }}>{tx('An Error Occurred', 'Terjadi Kesalahan')}</h3>
        <p style={{ marginBottom: '20px' }}>{error}</p>
        <Button variant="secondary" onClick={onExitToDashboard} icon={<ArrowLeft size={18} />}>
          {tx('Back to Menu', 'Kembali ke Menu')}
        </Button>
      </div>
    );
  }

  // If game is finished, show Final Result Screen
  if (gameState?.isFinished || gameState?.status === 'FINISHED') {
    return (
      <FinalResultPage
        gameState={gameState}
        user={user}
        onPlayAgain={onExitToDashboard}
      />
    );
  }

  const isMultiplayer = gameState?.mode === 'MULTIPLAYER';
  const isSpeedBuzz = gameState?.gameSubtype === 'SPEED_BUZZ';
  const isSurvival = gameState?.gameSubtype === 'SURVIVAL';
  const isEliminated = Boolean(gameState?.player?.isEliminated);
  const myLives = gameState?.player?.lives ?? 3;
  const isBuzzLockedByOther = Boolean(speedBuzzState?.activeBuzzUserId && speedBuzzState.activeBuzzUserId !== user?.id);
  const isMyBuzzActive = Boolean(speedBuzzState?.activeBuzzUserId === user?.id);
  const isBuzzCooldown = Boolean(speedBuzzState?.lockoutUntil && new Date(speedBuzzState.lockoutUntil) > new Date());

  // Dedicated waiting view for fastest player who finished all rounds in Multiplayer
  if (isWaitingForOthers && !isRoundResultOpen) {
    const remainingPlayersCount = (gameState?.leaderboard || []).filter(p =>
      p.userId !== user?.id &&
      p.status !== 'LEFT' &&
      ((p.currentRound || 1) < (gameState?.numberOfSongs || 1) || p.status === 'THINKING')
    ).length;

    return (
      <div className="container mobile-page-container" style={{ paddingTop: '20px', paddingBottom: '64px' }}>
        <div className="game-layout-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
            <Card style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              padding: '36px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-subtle)',
                border: '2px solid var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}>
                <CheckCircle2 size={36} />
              </div>

              <div>
                <span className="badge badge-green" style={{ marginBottom: '8px' }}>
                  <Loader2 className="spin" size={12} /> {tx('Waiting for Other Players', 'Menunggu Pemain Lain')}
                </span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '6px' }}>
                  {tx('All Songs Completed!', 'Semua Lagu Selesai!')}
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
                  {tx('Waiting for other players to finish the final round...', 'Menunggu pemain lain menyelesaikan ronde terakhir...')}
                </p>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-bg-alt)',
                border: '1px solid var(--color-border)',
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)'
              }}>
                <Users size={15} color="var(--color-primary)" />
                <span>
                  {remainingPlayersCount > 0
                    ? tx(
                        `${remainingPlayersCount} player${remainingPlayersCount === 1 ? '' : 's'} still finishing songs`,
                        `${remainingPlayersCount} pemain masih menyelesaikan lagu`
                      )
                    : tx('Calculating final rankings...', 'Menghitung peringkat akhir...')}
                </span>
              </div>

              <div style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginTop: '8px'
              }}>
                <div style={{
                  backgroundColor: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginBottom: '4px' }}>{tx('Your Score', 'Skor Kamu')}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-primary)' }}>
                    {gameState?.player?.score ?? 0}
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginBottom: '4px' }}>Thinking Time</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-text-bright)' }}>
                    {gameState?.player?.totalThinkingTime ?? 0}s
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {isMultiplayer && (
            <div style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px'
            }}>
              <LiveLeaderboard
                leaderboard={gameState.leaderboard}
                currentUserId={user?.id}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mobile-page-container" style={{ paddingTop: '20px', paddingBottom: '64px' }}>
      <div className={isMultiplayer ? 'game-layout-grid' : 'game-layout-solo'}>
        {/* Main Gameplay Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
          
          {/* Header Status Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)'
          }}>
            {/* Round info */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase', display: 'block' }}>
                {tCategory(gameState?.category)} {gameState?.gameSubtype && gameState.gameSubtype !== 'CLASSIC' ? `· ${gameState.gameSubtype}` : ''}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-text-bright)' }}>
                ROUND {gameState?.currentRound} / {gameState?.numberOfSongs}
              </span>
              {isSurvival && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                  {[1, 2, 3].map(h => (
                    <Heart key={h} size={13} color={h <= myLives ? '#fb7185' : '#3f3f46'} fill={h <= myLives ? '#fb7185' : 'none'} />
                  ))}
                </div>
              )}
            </div>

            {/* Thinking Timer ticker (Section 31) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--color-bg-alt)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)'
            }}>
              <Clock size={16} color="var(--color-primary)" />
              <span className="timer-text" style={{ fontSize: '1rem', minWidth: '50px' }}>
                {thinkingSeconds.toFixed(1)}s
              </span>
            </div>

            {/* Attempts Dots (Section 26) & Settings Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>
                  {t('gameAttempts')}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3].map(attemptNum => (
                    <div
                      key={attemptNum}
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: attemptNum <= remainingAttempts ? 'var(--color-primary)' : 'var(--color-border)'
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleQuitGame}
                className="btn btn-secondary btn-sm"
                title={t('leaveGame') || 'Leave Game'}
                style={{
                  padding: '6px 12px',
                  height: '34px',
                  borderRadius: 'var(--radius-full)',
                  flexShrink: 0,
                  gap: '5px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#f87171',
                  borderColor: 'rgba(239, 68, 68, 0.35)'
                }}
              >
                <LogOut size={14} />
                <span>Leave</span>
              </button>
            </div>
          </div>

          {/* Eliminated Spectator Banner (Survival / Elimination) */}
          {isEliminated && (
            <div style={{
              backgroundColor: 'rgba(244, 63, 94, 0.14)',
              border: '1px solid #fb7185',
              color: '#fda4af',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <Skull size={18} />
              <span>{tx('Eliminated! You are now spectating until the match ends.', 'Kamu tereliminasi! Mode Spectator aktif hingga game selesai.')}</span>
            </div>
          )}

          {/* Speed Buzz Countdown / Status Banner */}
          {isSpeedBuzz && (
            <div style={{
              backgroundColor: '#14141d',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              fontWeight: 800
            }}>
              {speedBuzzState?.countdown > 0 ? (
                <span style={{ color: '#facc15', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> {tx('Starting synchronized round...', 'Memulai ronde serentak...')}
                </span>
              ) : speedBuzzState?.roundWinner ? (
                <span style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} /> {speedBuzzState.roundWinner.displayName} +{speedBuzzState.roundWinner.pointsAwarded} PTS!
                </span>
              ) : speedBuzzState?.activeBuzzUserId ? (
                <span style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={14} /> {speedBuzzState.activeBuzzName} {tx('buzzed in!', 'menekan BUZZ!')}
                </span>
              ) : (
                <span style={{ color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} /> Speed Buzz · Auto-reveal {revealLevel}s
                </span>
              )}
            </div>
          )}

          {/* Feedback Message Banner (if wrong or error) */}
          {feedbackMessage && (
            <div style={{
              backgroundColor: feedbackMessage.isCorrect ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              border: `1px solid ${feedbackMessage.isCorrect ? 'var(--color-success)' : 'var(--color-danger)'}`,
              color: feedbackMessage.isCorrect ? 'var(--color-success)' : 'var(--color-danger)',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.95rem'
            }}>
              {feedbackMessage.text}
            </div>
          )}

          {/* Clue Audio Player Card (Same card transitions seamlessly on GUESSED) */}
          <Card
            className={roundStatus === 'GUESSED' ? 'game-card-correct-anim' : ''}
            style={{
              backgroundColor: 'var(--color-surface)',
              padding: '28px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '22px'
            }}
          >
            {/* Vinyl Disc: applies equipped vinyl skin both while THINKING and when GUESSED */}
            <VinylDiscStage
              skin={user?.equippedVinyl}
              spinning={isPlayingAudio}
              showArtwork={roundStatus === 'GUESSED' && Boolean(revealedTrack)}
              coverSrc={revealedTrack?.albumArt || revealedTrack?.coverUrl}
              coverAlt={revealedTrack?.title}
              fadeIn
              placeholderIcon={<Music size={34} color="var(--color-text-dim)" style={{ opacity: 0.45 }} />}
            />

            {roundStatus === 'GUESSED' && revealedTrack ? (
              <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                {/* 15s Playback Progress Bar */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    <span>{tx('Playing Preview', 'Memutar Lagu')}</span>
                    <span style={{ color: 'var(--color-primary)' }}>15s</span>
                  </div>
                  <div className="reveal-15s-bar-track">
                    <div key={revealedTrack.id || gameState?.currentRound} className="reveal-15s-bar-fill" />
                  </div>
                </div>

                {/* Spotify & Next Song Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
                  <a
                    href={getSpotifyTrackUrl(revealedTrack)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => audioPlayer.stop()}
                    className="btn btn-secondary btn-md"
                    style={{ textDecoration: 'none', gap: '7px', padding: '0 16px', height: '42px', fontWeight: 800 }}
                  >
                    <SpotifyIcon size={16} color="var(--color-primary)" />
                    <span>Spotify</span>
                  </a>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={nextRound}
                    icon={<ArrowRight size={17} />}
                    style={{ height: '42px', padding: '0 22px', fontWeight: 800 }}
                  >
                    {(gameState?.currentRound || 1) >= (gameState?.numberOfSongs || 1)
                      ? tx('Finish Game', 'Lihat Hasil')
                      : tx('Next Song', 'Next Song')}
                  </Button>
                </div>
              </div>
            ) : (
              /* Progressive Reveal Bar + Clue Controls */
              <AudioCluePlayer
                revealLevel={revealLevel}
                isPlaying={isPlayingAudio}
                isAudioReady={isAudioReady}
                isAudioLoading={isAudioLoading}
                disabled={roundStatus !== 'THINKING'}
                onPlay={playClue}
                onRevealNext={revealNext}
              />
            )}
          </Card>

          {/* Below Card: Guess + Skip while THINKING, or Song Title & Artist when GUESSED */}
          {roundStatus === 'GUESSED' && revealedTrack ? (
            <div style={{ textAlign: 'center', padding: '8px 12px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-text-bright)' }}>
                {revealedTrack.title}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-muted)', marginTop: '3px' }}>
                {revealedTrack.artist}
              </div>
            </div>
          ) : isSpeedBuzz ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {isMyBuzzActive ? (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => setIsSearchModalOpen(true)}
                  icon={<Search size={20} fill="#000" />}
                  style={{ height: '56px', fontSize: '1.15rem' }}
                >
                  {tx('Answer Now!', 'Pilih Jawaban Sekarang!')}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isBuzzLockedByOther || isBuzzCooldown || roundStatus !== 'THINKING'}
                  onClick={() => {
                    emitSpeedBuzz();
                    setIsSearchModalOpen(true);
                  }}
                  icon={<Zap size={20} fill="#000" />}
                  style={{ height: '58px', fontSize: '1.2rem', fontWeight: 900 }}
                >
                  {isBuzzCooldown
                    ? tx('Locked Out (3s)...', 'Terkunci (3s)...')
                    : isBuzzLockedByOther
                      ? `${speedBuzzState.activeBuzzName} Answering...`
                      : 'BUZZ!'}
                </Button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={isEliminated || roundStatus !== 'THINKING' || remainingAttempts <= 0}
                onClick={() => setIsSearchModalOpen(true)}
                icon={<Search size={20} fill="#000" />}
                style={{ height: '56px', fontSize: '1.15rem' }}
              >
                {t('gameGuessBtn')}
              </Button>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isEliminated || roundStatus !== 'THINKING'}
                  onClick={skipRound}
                  icon={<SkipForward size={16} />}
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  {t('gameSkipBtn')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Multiplayer Live Sidebar (if Multiplayer) */}
        {isMultiplayer && (
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px'
          }}>
            <LiveLeaderboard
              leaderboard={gameState.leaderboard}
              currentUserId={user?.id}
              gameSubtype={gameState?.gameSubtype || 'CLASSIC'}
              teamStandings={gameState?.teamStandings || null}
            />
          </div>
        )}
      </div>

      {/* Song Search Guess Modal */}
      <SongSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        remainingAttempts={remainingAttempts}
        onSelectSong={(track) => {
          if (isSpeedBuzz) {
            submitSpeedBuzzGuess(track);
            setIsSearchModalOpen(false);
          } else {
            submitGuess(track);
          }
        }}
      />

      {/* Round Result Modal (Between rounds) */}
      <RoundResultModal
        isOpen={isRoundResultOpen}
        status={roundStatus}
        revealedTrack={revealedTrack}
        currentRound={gameState?.currentRound}
        totalRounds={gameState?.numberOfSongs}
        onNextRound={nextRound}
      />

      {/* Preparing Game Modal Popup (Shows ONLY ONCE at game start until 100% ready) */}
      <PreparingGameModal
        isOpen={!isInitialGameReady && !gameState?.isFinished && !isWaitingForOthers}
        progress={initialProgress}
        category={gameState?.category || 'Global Trends'}
      />
    </div>
  );
}

export default GamePage;
