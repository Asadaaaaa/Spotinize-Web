import React, { useState, useEffect } from 'react';
import { X, Target, CheckCircle2, Loader2, Sparkles, Ticket, Music } from 'lucide-react';
import Button from './Button.jsx';
import ApiClient from '../services/api.js';
import soundFx from '../services/soundFx.js';
import haptics from '../services/haptics.js';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function QuestsModal({ isOpen, onClose, onQuestClaimed }) {
  const { tx } = useLanguage();
  const [tab, setTab] = useState('DAILY');
  const [data, setData] = useState({ daily: [], weekly: [] });
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [error, setError] = useState(null);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get('/quests');
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadQuests();
  }, [isOpen]);

  if (!isOpen) return null;

  const list = tab === 'DAILY' ? (data.daily || []) : (data.weekly || []);

  const handleClaim = async (questId) => {
    try {
      setClaimingId(questId);
      setError(null);
      const res = await ApiClient.post(`/quests/${questId}/claim`);
      soundFx.playReward();
      haptics.reward();
      await loadQuests();
      onQuestClaimed?.(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          width: '95%',
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: '22px',
          backgroundColor: '#111115',
          border: '1px solid #262630',
          borderRadius: '18px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Quests & Misi</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            className={`btn btn-sm ${tab === 'DAILY' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('DAILY')}
          >
            {tx('Daily Quests', 'Misi Harian')}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${tab === 'WEEKLY' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('WEEKLY')}
          >
            {tx('Weekly Quests', 'Misi Mingguan')}
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.12)', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
            <Loader2 className="spin" size={28} color="var(--color-primary)" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {list.map(q => {
              const pct = Math.min(100, Math.round(((q.progressValue || 0) / Math.max(1, q.targetValue)) * 100));
              const isCompleted = q.status === 'COMPLETED';
              const isClaimed = q.status === 'CLAIMED';

              return (
                <div
                  key={q.id}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#181820',
                    border: isCompleted ? '1px solid var(--color-primary)' : '1px solid #262632',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--color-text-bright)' }}>
                        {q.title}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px', fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                        {q.rewardNotes > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--color-primary)' }}><Music size={12} /> +{q.rewardNotes} Notes</span>}
                        {q.rewardXp > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#c084fc' }}><Sparkles size={12} /> +{q.rewardXp} XP</span>}
                        {q.rewardTickets > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#38bdf8' }}><Ticket size={12} /> +{q.rewardTickets} Ticket</span>}
                      </div>
                    </div>

                    {isClaimed ? (
                      <span className="badge badge-green" style={{ flexShrink: 0 }}><CheckCircle2 size={12} /> Claimed</span>
                    ) : isCompleted ? (
                      <Button size="sm" variant="primary" onClick={() => handleClaim(q.id)} disabled={claimingId === q.id}>
                        {claimingId === q.id ? '...' : tx('Claim', 'Klaim')}
                      </Button>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-dim)', flexShrink: 0 }}>
                        {q.progressValue}/{q.targetValue}
                      </span>
                    )}
                  </div>

                  <div style={{ height: '6px', borderRadius: '999px', backgroundColor: '#0c0c10', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor: isClaimed || isCompleted ? 'var(--color-primary)' : '#38bdf8',
                      transition: 'width 0.25s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestsModal;
