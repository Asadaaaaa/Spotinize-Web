import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Share2, Music2, Clock, CheckCircle2, XCircle, AlertCircle, Award } from 'lucide-react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import ShareInstagramModal from '../../components/ShareInstagramModal.jsx';
import Avatar from '../../components/Avatar.jsx';

export function FinalResultPage({ gameState, user, onPlayAgain }) {
  const [showShareModal, setShowShareModal] = useState(false);

  const player = gameState?.player || {};
  const isMultiplayer = gameState?.mode === 'MULTIPLAYER';
  const leaderboard = gameState?.leaderboard || [];

  const myEntry = leaderboard.find(p => p.userId === user?.id);
  const myRank = myEntry ? leaderboard.indexOf(myEntry) + 1 : 0;
  const myScore = myEntry?.score ?? player.score ?? 0;
  const myThinkingTime = myEntry?.totalThinkingTime ?? player.totalThinkingTime ?? 0;
  const isWinner = myRank === 1;

  useEffect(() => {
    // Launch celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="container-narrow" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', textAlign: 'center' }}>
        {/* Top Trophy Banner */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: isWinner ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
            border: isWinner ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isWinner ? 'var(--color-primary)' : 'var(--color-warning)'
          }}>
            <Trophy size={34} />
          </div>

          <span className="badge badge-green" style={{ fontSize: '0.85rem' }}>
            {isMultiplayer ? (isWinner ? 'YOU WON!' : `RANK #${myRank}`) : 'SOLO FINISHED'}
          </span>

          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
            FINAL RESULT
          </h2>
        </div>

        {/* Main Score Banner */}
        <Card style={{
          width: '100%',
          backgroundColor: 'var(--color-bg-alt)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '32px 24px'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Total Score
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 900,
            fontSize: '4rem',
            lineHeight: 1,
            color: 'var(--color-primary)',
            textShadow: '0 0 24px rgba(29, 185, 84, 0.35)'
          }}>
            {myScore}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
            Kategori: {gameState?.category}
          </span>
        </Card>

        {/* Stats Grid */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px'
        }}>
          <Card style={{ padding: '16px 12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginBottom: '4px' }}>Total Lagu</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{gameState?.numberOfSongs || 5}</div>
          </Card>

          <Card style={{ padding: '16px 12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginBottom: '4px' }}>Thinking Time</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-bright)' }}>
              {myThinkingTime}s
            </div>
          </Card>
        </div>

        {/* Multiplayer Leaderboard List (if Multiplayer) */}
        {isMultiplayer && leaderboard.length > 0 && (
          <div style={{ width: '100%', textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Peringkat Akhir
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {leaderboard.map((p, idx) => (
                <div
                  key={p.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: idx === 0 ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                    border: idx === 0 ? '1px solid var(--color-primary)' : '1px solid var(--color-border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, minWidth: '28px' }}>
                      #{idx + 1}
                    </span>
                    <Avatar
                      src={p.avatarUrl}
                      alt={p.displayName}
                      size="sm"
                      seed={p.userId || p.displayName}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                        {p.displayName} {p.userId === user?.id && '(You)'}
                      </div>
                      {p.status === 'LEFT' && (
                        <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>LEFT</span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.2rem' }}>
                      {p.score}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', display: 'block' }}>
                      PTS
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setShowShareModal(true)}
            icon={<Share2 size={20} />}
            style={{ height: '54px', fontSize: '1.15rem' }}
          >
            Share ke Instagram Story
          </Button>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onPlayAgain}
            icon={<RotateCcw size={18} />}
          >
            Main Lagi
          </Button>
        </div>
      </div>

      <ShareInstagramModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        user={user}
        score={myScore}
        isWinner={isWinner}
        mode={gameState?.mode || 'SOLO'}
        category={gameState?.category}
        totalSongs={gameState?.numberOfSongs || 5}
        thinkingTime={myThinkingTime}
        leaderboard={leaderboard}
        rank={myRank}
        tracks={gameState?.tracks || gameState?.gameTracks || []}
      />
    </div>
  );
}

export default FinalResultPage;
