import React, { useState } from 'react';
import { Search, SkipForward, Clock, Heart, Volume2, Music, Loader2, ArrowLeft } from 'lucide-react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import AudioCluePlayer from '../../components/AudioCluePlayer.jsx';
import SongSearchModal from '../../components/SongSearchModal.jsx';
import LiveLeaderboard from '../../components/LiveLeaderboard.jsx';
import PreparingGameModal from '../../components/PreparingGameModal.jsx';
import RoundResultModal from '../Result/RoundResultModal.jsx';
import FinalResultPage from '../Result/FinalResultPage.jsx';
import useGame from '../../hooks/useGame.js';

export function GamePage({ gameId, user, onExitToDashboard }) {
  const {
    gameState,
    loading,
    error,
    isInitialGameReady,
    initialProgress,
    loadedTracksCount,
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
    playClue,
    revealNext,
    submitGuess,
    skipRound,
    nextRound,
    setIsRoundResultOpen
  } = useGame(gameId, user);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  if (loading && !gameState) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <Loader2 className="spin" size={36} color="var(--color-primary)" />
        <p style={{ fontWeight: 700 }}>Menyiapkan Arena Game...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-narrow" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--color-danger)', marginBottom: '12px' }}>Terjadi Kesalahan</h3>
        <p style={{ marginBottom: '20px' }}>{error}</p>
        <Button variant="secondary" onClick={onExitToDashboard} icon={<ArrowLeft size={18} />}>
          Kembali ke Menu
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
                {gameState?.category}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-text-bright)' }}>
                ROUND {gameState?.currentRound} / {gameState?.numberOfSongs}
              </span>
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

            {/* Attempts Dots (Section 26) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>
                Kesempatan
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
          </div>

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

          {/* Clue Audio Player Card */}
          <Card style={{
            backgroundColor: 'var(--color-surface)',
            padding: '32px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px'
          }}>
            <div style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-bg-alt)',
              border: '2px dashed var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-dim)'
            }}>
              <Music size={40} />
            </div>

            {/* Audio Clue Action Controller */}
            <AudioCluePlayer
              revealLevel={revealLevel}
              isPlaying={isPlayingAudio}
              isAudioReady={isAudioReady}
              isAudioLoading={isAudioLoading}
              disabled={roundStatus !== 'THINKING'}
              onPlay={playClue}
              onRevealNext={revealNext}
            />
          </Card>

          {/* Player Guess & Action Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={roundStatus !== 'THINKING' || remainingAttempts <= 0}
              onClick={() => setIsSearchModalOpen(true)}
              icon={<Search size={20} fill="#000" />}
              style={{ height: '56px', fontSize: '1.15rem' }}
            >
              Tebak Judul Lagu
            </Button>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="ghost"
                size="sm"
                disabled={roundStatus !== 'THINKING'}
                onClick={skipRound}
                icon={<SkipForward size={16} />}
                style={{ color: 'var(--color-text-dim)' }}
              >
                Skip Lagu Ini (Skor: 0)
              </Button>
            </div>
          </div>
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
            />
          </div>
        )}
      </div>

      {/* Song Search Guess Modal */}
      <SongSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        remainingAttempts={remainingAttempts}
        onSelectSong={submitGuess}
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
        isOpen={!isInitialGameReady && !gameState?.isFinished}
        progress={initialProgress}
        category={gameState?.category || 'Global Trends'}
      />
    </div>
  );
}

export default GamePage;
