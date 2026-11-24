import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import ApiClient from '../services/api.js';
import socketService from '../services/socket.js';
import audioPlayer from '../services/audioPlayer.js';
import { useLanguage } from './useLanguage.jsx';

export function useGame(gameId, user) {
  const { tx } = useLanguage();
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial Game Audio Preloading states (0% to 100%)
  const [isInitialGameReady, setIsInitialGameReady] = useState(false);
  const [initialProgress, setInitialProgress] = useState(0);
  const [loadedTracksCount, setLoadedTracksCount] = useState(0);
  const hasPreloadedGameRef = useRef(false);

  // Playback & Reveal states
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [revealLevel, setRevealLevel] = useState(0.1);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [roundStatus, setRoundStatus] = useState('THINKING'); // 'THINKING', 'GUESSED', 'WRONG', 'SKIPPED'
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Thinking Timer
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Round over / result modal
  const [isRoundResultOpen, setIsRoundResultOpen] = useState(false);
  const [revealedTrack, setRevealedTrack] = useState(null);

  // Track if component is mounted to prevent stale setState
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Sync with audio player state
  useEffect(() => {
    audioPlayer.onStateChange = (playing) => {
      if (isMountedRef.current) setIsPlayingAudio(playing);
    };
    return () => {
      audioPlayer.stop();
    };
  }, []);

  const stopTimer = useCallback(() => {
    setIsTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startTimer = useCallback(() => {
    if (!isTimerRunning && roundStatus === 'THINKING') {
      startTimeRef.current = Date.now();
      setIsTimerRunning(true);
    }
  }, [isTimerRunning, roundStatus]);

  const resetRoundUI = useCallback(() => {
    stopTimer();
    setThinkingSeconds(0);
    setRevealLevel(0.1);
    setRemainingAttempts(3);
    setRoundStatus('THINKING');
    setFeedbackMessage(null);
    setIsRoundResultOpen(false);
    setRevealedTrack(null);
    setIsAudioReady(true);
    setIsAudioLoading(false);
  }, [stopTimer]);

  // Fetch initial game state
  const loadGame = useCallback(async () => {
    if (!gameId || !user?.id) return null;
    try {
      setLoading(true);
      const state = await ApiClient.get(`/game/${gameId}`);
      if (!isMountedRef.current) return null;
      setGameState(state);
      if (state.player) {
        setRevealLevel(state.player.currentRevealLevel || 0.1);
        setRemainingAttempts(state.player.remainingAttempts ?? 3);
        setRoundStatus(state.player.status || 'THINKING');
      }
      return state;
    } catch (err) {
      if (isMountedRef.current) setError(err.message);
      return null;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [gameId, user?.id]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  // Initial full-game audio preloading (Only runs ONCE at game start)
  useEffect(() => {
    if (hasPreloadedGameRef.current || !gameState) return;

    if (gameState.isFinished || gameState.status === 'FINISHED' || gameState.isWaitingForOthers) {
      hasPreloadedGameRef.current = true;
      setIsInitialGameReady(true);
      setIsAudioReady(true);
      setIsAudioLoading(false);
      return;
    }

    const trackIds = gameState.gameTrackIds?.length
      ? gameState.gameTrackIds
      : (gameState.currentTrack?.id ? [gameState.currentTrack.id] : []);

    if (trackIds.length === 0) return;

    hasPreloadedGameRef.current = true;
    setInitialProgress(5);
    setLoadedTracksCount(0);

    let completed = 0;
    const total = trackIds.length;
    const DURATIONS = [0.1, 0.5, 1.0, 2.0, 3.0, 4.0, 5.0];

    const preloadAllTracks = async () => {
      for (const trackId of trackIds) {
        try {
          await audioPlayer.preload(`/api/audio/clue/${trackId}?duration=0.1`);

          DURATIONS.slice(1).forEach(dur => {
            audioPlayer.preload(`/api/audio/clue/${trackId}?duration=${dur}`);
          });

          completed++;
          if (!isMountedRef.current) return;
          setLoadedTracksCount(completed);
          const percent = Math.min(100, Math.round((completed / total) * 100));
          setInitialProgress(percent);
        } catch (err) {
          console.warn('Track prefetch notice for:', trackId, err.message);
          completed++;
          if (!isMountedRef.current) return;
          setLoadedTracksCount(completed);
          setInitialProgress(Math.min(100, Math.round((completed / total) * 100)));
        }
      }

      setTimeout(() => {
        if (!isMountedRef.current) return;
        setIsInitialGameReady(true);
        setIsAudioReady(true);
        setIsAudioLoading(false);
      }, 400);
    };

    preloadAllTracks();
  }, [gameState]);

  // Real-time Socket Subscriptions + Auto-Reconnect + Clean Unmount
  useEffect(() => {
    if (!gameId || !user?.id) return;

    const socket = socketService.getSocket();

    const joinRoom = () => {
      socket.emit('game:join_room', { gameId });
    };

    joinRoom();

    const handleReconnect = () => {
      console.log('[useGame] Socket reconnected, rejoining room...');
      joinRoom();
      socket.emit('player:reconnect', { gameId });
    };

    const handlePlayerReconnected = (state) => {
      if (!isMountedRef.current) return;
      console.log('[useGame] Player reconnected, restoring state');
      if (state) {
        setGameState(state);
        if (state.player) {
          setRevealLevel(state.player.currentRevealLevel || 0.1);
          setRemainingAttempts(state.player.remainingAttempts ?? 3);
          setRoundStatus(state.player.status || 'THINKING');
        }
      }
    };

    const handleScoreUpdate = ({ userId: targetUserId, score, status, totalThinkingTime }) => {
      if (!isMountedRef.current) return;
      setGameState(prev => {
        if (!prev) return prev;
        const updatedLeaderboard = prev.leaderboard.map(p =>
          p.userId === targetUserId
            ? {
                ...p,
                score,
                status,
                ...(typeof totalThinkingTime === 'number' ? { totalThinkingTime } : {})
              }
            : p
        );
        return { ...prev, leaderboard: updatedLeaderboard };
      });
    };

    const handleRankingUpdate = ({ leaderboard }) => {
      if (!isMountedRef.current) return;
      setGameState(prev => prev ? { ...prev, leaderboard } : prev);
    };

    const handleStatusUpdate = ({ userId: targetUserId, status, currentRound }) => {
      if (!isMountedRef.current) return;
      setGameState(prev => {
        if (!prev) return prev;
        const updated = prev.leaderboard.map(p =>
          p.userId === targetUserId
            ? {
                ...p,
                status,
                ...(typeof currentRound === 'number' ? { currentRound } : {})
              }
            : p
        );
        return { ...prev, leaderboard: updated };
      });
    };

    const handlePlayerStatusChange = ({ userId: targetUserId, connectionStatus }) => {
      if (!isMountedRef.current) return;
      setGameState(prev => {
        if (!prev) return prev;
        const updated = prev.leaderboard.map(p =>
          p.userId === targetUserId ? { ...p, connectionStatus } : p
        );
        return { ...prev, leaderboard: updated };
      });
    };

    const handlePlayerLeft = ({ userId: targetUserId }) => {
      if (!isMountedRef.current) return;
      setGameState(prev => {
        if (!prev) return prev;
        const updated = prev.leaderboard.map(p =>
          p.userId === targetUserId ? { ...p, status: 'LEFT', connectionStatus: 'DISCONNECTED' } : p
        );
        return { ...prev, leaderboard: updated };
      });
    };

    const handleGameFinish = ({ leaderboard, winner }) => {
      if (!isMountedRef.current) return;
      setIsRoundResultOpen(false);
      stopTimer();
      ApiClient.get(`/game/${gameId}`).then(freshState => {
        if (!isMountedRef.current) return;
        setGameState({
          ...freshState,
          status: 'FINISHED',
          isFinished: true,
          isWaitingForOthers: false,
          leaderboard: leaderboard || freshState.leaderboard,
          winner
        });
      }).catch(() => {
        if (!isMountedRef.current) return;
        setGameState(prev => prev ? {
          ...prev,
          status: 'FINISHED',
          isFinished: true,
          isWaitingForOthers: false,
          leaderboard: leaderboard || prev.leaderboard,
          winner
        } : prev);
      });
    };

    socket.on('connect', handleReconnect);
    socket.on('player:reconnected', handlePlayerReconnected);
    socket.on('score:update', handleScoreUpdate);
    socket.on('ranking:update', handleRankingUpdate);
    socket.on('status:update', handleStatusUpdate);
    socket.on('player:status_change', handlePlayerStatusChange);
    socket.on('player:left', handlePlayerLeft);
    socket.on('game:finish', handleGameFinish);

    return () => {
      socket.off('connect', handleReconnect);
      socket.off('player:reconnected', handlePlayerReconnected);
      socket.off('score:update', handleScoreUpdate);
      socket.off('ranking:update', handleRankingUpdate);
      socket.off('status:update', handleStatusUpdate);
      socket.off('player:status_change', handlePlayerStatusChange);
      socket.off('player:left', handlePlayerLeft);
      socket.off('game:finish', handleGameFinish);
      socket.emit('game:leave_room', { gameId });
      audioPlayer.cleanup();
    };
  }, [gameId, user?.id, stopTimer]);

  // Timer Tick
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setThinkingSeconds(Math.round(elapsed * 10) / 10);
        }
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Play clue audio (Unlocks Web Audio synchronously & waits for clue if still fetching)
  const playClue = async () => {
    if (!gameState?.currentTrack || isAudioLoading) return;

    audioPlayer.unlock();

    if (!isTimerRunning && roundStatus === 'THINKING') {
      startTimer();
      ApiClient.post(`/game/${gameId}/timer/start`).catch(() => {});
    }

    const clueAudioUrl = `/api/audio/clue/${gameState.currentTrack.id}?duration=${revealLevel}`;
    if (!audioPlayer.isReady(clueAudioUrl)) {
      setIsAudioLoading(true);
      try {
        await audioPlayer.preload(clueAudioUrl);
      } finally {
        if (isMountedRef.current) setIsAudioLoading(false);
      }
    }

    await audioPlayer.playClue(clueAudioUrl, revealLevel);
  };

  // Progressive Reveal
  const revealNext = async () => {
    if (isPlayingAudio || isAudioLoading || revealLevel >= 5.0 || roundStatus !== 'THINKING') return;

    audioPlayer.unlock();

    try {
      const res = await ApiClient.post(`/game/${gameId}/reveal`);
      const nextLevel = res.player?.currentRevealLevel || revealLevel;
      setRevealLevel(nextLevel);

      if (!isTimerRunning) startTimer();

      if (gameState?.currentTrack) {
        const clueAudioUrl = `/api/audio/clue/${gameState.currentTrack.id}?duration=${nextLevel}`;
        if (!audioPlayer.isReady(clueAudioUrl)) {
          setIsAudioLoading(true);
          try {
            await audioPlayer.preload(clueAudioUrl);
          } finally {
            if (isMountedRef.current) setIsAudioLoading(false);
          }
        }
        await audioPlayer.playClue(clueAudioUrl, nextLevel);
      }
    } catch (err) {
      console.error('Failed to reveal next:', err.message);
    }
  };

  // Submit Guess
  const submitGuess = async (selectedTrack) => {
    if (roundStatus !== 'THINKING' || remainingAttempts <= 0) return;

    audioPlayer.stop();

    try {
      const res = await ApiClient.post(`/game/${gameId}/guess`, {
        track: selectedTrack
      });

      setRemainingAttempts(res.remainingAttempts);
      const feedbackText = res.isCorrect
        ? tx('CORRECT!', 'CORRECT!')
        : res.isRoundOver
          ? tx('Out of attempts!', 'Kesempatan habis!')
          : tx(
              `Not quite! ${res.remainingAttempts} guess${res.remainingAttempts === 1 ? '' : 'es'} left.`,
              `Kurang tepat! ${res.remainingAttempts} tebakan tersisa.`
            );
      setFeedbackMessage({ isCorrect: res.isCorrect, text: feedbackText });

      if (res.isCorrect) {
        stopTimer();
        setRoundStatus('GUESSED');
        setRevealedTrack(res.targetTrack);
        setIsRoundResultOpen(false);
        try {
          confetti({
            particleCount: 70,
            spread: 65,
            origin: { y: 0.55 },
            colors: ['#1db954', '#4ade80', '#ffffff', '#facc15']
          });
        } catch (e) {}
        const playId = res.targetTrack?.id || gameState?.currentTrack?.id;
        if (playId) {
          audioPlayer.playClue(`/api/audio/clue/${playId}?duration=15`, 15.0).catch(() => {});
        }
      } else if (res.isRoundOver) {
        stopTimer();
        setRoundStatus('WRONG');
        setRevealedTrack(res.targetTrack);
        setIsRoundResultOpen(true);
      }

      loadGame();
    } catch (err) {
      setFeedbackMessage({ isCorrect: false, text: err.message });
    }
  };

  // Skip Round
  const skipRound = async () => {
    if (roundStatus !== 'THINKING') return;
    audioPlayer.stop();
    stopTimer();

    try {
      const res = await ApiClient.post(`/game/${gameId}/skip`);
      setRoundStatus('SKIPPED');
      setRemainingAttempts(0);
      setRevealedTrack(res.targetTrack);
      setIsRoundResultOpen(true);
      loadGame();
    } catch (err) {
      console.error('Skip failed:', err.message);
    }
  };

  // Next Round (with retry for mobile network reliability)
  const nextRound = async () => {
    audioPlayer.stop();
    setIsRoundResultOpen(false);

    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const newState = await ApiClient.post(`/game/${gameId}/next`);
        if (!isMountedRef.current) return;
        setGameState(newState);

        if (newState.isFinished || newState.status === 'FINISHED' || newState.isWaitingForOthers) {
          stopTimer();
          setIsRoundResultOpen(false);
          return;
        }

        resetRoundUI();
        return;
      } catch (err) {
        console.warn(`[nextRound] Attempt ${attempt + 1} failed:`, err.message);
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        }
      }
    }

    // All retries failed — fallback: re-fetch state from server
    console.error('[nextRound] All retries failed, falling back to loadGame');
    try {
      const fallbackState = await loadGame();
      if (!isMountedRef.current) return;
      if (fallbackState && !fallbackState.isFinished && !fallbackState.isWaitingForOthers && fallbackState.player?.status === 'THINKING') {
        resetRoundUI();
      }
    } catch (e) {
      if (isMountedRef.current) {
        setError(tx('Connection lost. Please refresh the page.', 'Koneksi terputus. Silakan refresh halaman.'));
      }
    }
  };

  const isWaitingForOthers = Boolean(gameState?.isWaitingForOthers);

  return {
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
    isTimerRunning,
    isRoundResultOpen,
    revealedTrack,
    isWaitingForOthers,
    playClue,
    revealNext,
    submitGuess,
    skipRound,
    nextRound,
    setIsRoundResultOpen,
    loadGame
  };
}

export default useGame;
