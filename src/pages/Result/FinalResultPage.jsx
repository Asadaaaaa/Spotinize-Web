import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Share2, Swords, Check, Loader2, Sparkles, Music, Shield, Copy, UserPlus } from 'lucide-react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import ShareInstagramModal from '../../components/ShareInstagramModal.jsx';
import Avatar from '../../components/Avatar.jsx';
import { RankedTierBadge } from '../../components/ItemRarityBadge.jsx';
import ApiClient from '../../services/api.js';
import soundFx from '../../services/soundFx.js';
import haptics from '../../services/haptics.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLanguage } from '../../hooks/useLanguage.jsx';

export function FinalResultPage({ gameState, user, onPlayAgain }) {
  const { isGuest, markGuestDailyPlayed } = useAuth();
  const { tx, tCategory } = useLanguage();
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingChallenge, setSharingChallenge] = useState(false);
  const [challengeShared, setChallengeShared] = useState(false);
  const [copiedGrid, setCopiedGrid] = useState(false);

  const player = gameState?.player || {};
  const isMultiplayer = gameState?.mode === 'MULTIPLAYER';
  const isDaily = gameState?.gameSubtype === 'DAILY';
  const v07 = gameState?.v07Summary || null;
  const leaderboard = gameState?.leaderboard || [];

  const myEntry = leaderboard.find(p => p.userId === user?.id);
  const myRank = myEntry ? leaderboard.indexOf(myEntry) + 1 : 0;
  const myScore = myEntry?.score ?? player.score ?? 0;
  const myThinkingTime = myEntry?.totalThinkingTime ?? player.totalThinkingTime ?? 0;
  const isWinner = myRank === 1;

  useEffect(() => {
    if (isGuest) {
      markGuestDailyPlayed?.();
    }
    soundFx.playVictory();
    haptics.victory();
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
            {tx('Category:', 'Kategori:')} {tCategory(gameState?.category)}
          </span>
        </Card>

        {isGuest && (
          <Card style={{
            width: '100%',
            backgroundColor: '#13141a',
            border: '1px solid rgba(29, 185, 84, 0.35)',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            textAlign: 'left'
          }}>
            <div style={{ minWidth: 0, flex: '1 1 220px' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#ffffff' }}>
                {tx('Enjoyed Spotinize Daily?', 'Suka Main Spotinize Daily?')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {tx(
                  'Create a free account to unlock all modes, save your future scores, and climb the Leaderboard.',
                  'Buat akun gratis untuk membuka semua mode, simpan skor berikutnya, dan masuk Leaderboard.'
                )}
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<UserPlus size={15} />}
              onClick={() => window.dispatchEvent(new CustomEvent('spotinize:open-guest-upgrade'))}
              style={{ fontWeight: 800, whiteSpace: 'nowrap' }}
            >
              {tx('Register', 'Daftar')}
            </Button>
          </Card>
        )}

        {/* Stats Grid */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px'
        }}>
          <Card style={{ padding: '16px 12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginBottom: '4px' }}>{tx('Total Songs', 'Total Lagu')}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{gameState?.numberOfSongs || 5}</div>
          </Card>

          <Card style={{ padding: '16px 12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginBottom: '4px' }}>Thinking Time</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-bright)' }}>
              {myThinkingTime}s
            </div>
          </Card>

          {v07 && (
            <>
              <Card style={{ padding: '16px 12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginBottom: '4px' }}>XP Earned</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Sparkles size={15} /> +{v07.xpEarned || 0}
                </div>
              </Card>
              <Card style={{ padding: '16px 12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginBottom: '4px' }}>Notes Earned</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Music size={15} /> +{v07.notesEarned || 0}
                </div>
              </Card>
            </>
          )}
        </div>

        {/* v0.7 Badges: Perfect Run, Ranked RP Delta, Team Standings */}
        {(v07?.perfectRun || v07?.rankedSummary || gameState?.teamStandings) && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {v07?.perfectRun && (
              <Card style={{ padding: '12px 16px', backgroundColor: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.45)', fontWeight: 800, color: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Sparkles size={16} />
                <span>PERFECT RUN! 5/5 tanpa salah & tanpa skip (+50 Bonus PTS)</span>
              </Card>
            )}

            {v07?.rankedSummary && (
              <Card style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={18} color="#38bdf8" />
                  <RankedTierBadge tier={v07.rankedSummary.tier} rp={v07.rankedSummary.rp} />
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: (v07.rpDelta || 0) >= 0 ? 'var(--color-primary)' : '#fb7185' }}>
                  {v07.rankedSummary.isInPlacement
                    ? `Placement ${v07.rankedSummary.placementGamesPlayed}/5`
                    : `${(v07.rpDelta || 0) >= 0 ? '+' : ''}${v07.rpDelta || 0} RP`}
                </div>
              </Card>
            )}

            {gameState?.teamStandings && (
              <Card style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>TEAM A</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{gameState.teamStandings.A?.avgScore || 0} AVG</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fb7185' }}>TEAM B</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{gameState.teamStandings.B?.avgScore || 0} AVG</div>
                </div>
              </Card>
            )}
          </div>
        )}

        {isDaily && v07?.dailyResult?.emojiGrid && (
          <Card style={{ width: '100%', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-bright)' }}>{v07.dailyResult.emojiGrid}</div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(v07.dailyResult.emojiGrid);
                setCopiedGrid(true);
                setTimeout(() => setCopiedGrid(false), 2000);
              }}
              icon={copiedGrid ? <Check size={14} color="var(--color-primary)" /> : <Copy size={14} />}
            >
              {copiedGrid ? tx('Copied!', 'Tersalin!') : tx('Copy Spoiler-Free Grid', 'Salin Emoji Grid')}
            </Button>
          </Card>
        )}

        {/* Multiplayer Leaderboard List (if Multiplayer) */}
        {isMultiplayer && leaderboard.length > 0 && (
          <div style={{ width: '100%', textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
              {tx('Final Rankings', 'Peringkat Akhir')}
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
                      frame={p.equippedFrame}
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
            {tx('Share to Instagram Story', 'Share ke Instagram Story')}
          </Button>

          {gameState?.id && (
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              disabled={sharingChallenge || challengeShared}
              onClick={async () => {
                try {
                  setSharingChallenge(true);
                  await ApiClient.post('/feed/challenges', { sourceGameId: gameState.id });
                  setChallengeShared(true);
                } catch (e) {
                } finally {
                  setSharingChallenge(false);
                }
              }}
              icon={
                sharingChallenge ? <Loader2 size={18} className="spin" /> :
                challengeShared ? <Check size={18} color="var(--color-primary)" /> :
                <Swords size={18} color="var(--color-primary)" />
              }
            >
              {challengeShared
                ? tx('Challenge Shared to Feed', 'Tantangan Dibagikan ke Feed')
                : tx('Share Challenge to Feed', 'Bagikan Tantangan ke Feed')}
            </Button>
          )}

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onPlayAgain}
            icon={<RotateCcw size={18} />}
          >
            {tx('Play Again', 'Main Lagi')}
          </Button>
        </div>
      </div>

      <ShareInstagramModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        user={user}
        score={myScore}
        isWinner={isWinner}
        mode={isDaily ? 'DAILY' : (gameState?.mode || 'SOLO')}
        category={gameState?.category}
        totalSongs={gameState?.numberOfSongs || 5}
        thinkingTime={myThinkingTime}
        leaderboard={leaderboard}
        rank={myRank}
        tracks={gameState?.tracks || gameState?.gameTracks || []}
        emojiGrid={v07?.dailyResult?.emojiGrid || null}
      />
    </div>
  );
}

export default FinalResultPage;
