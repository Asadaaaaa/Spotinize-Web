import { useState, useEffect, useRef, useCallback } from 'react';
import ApiClient from '../services/api.js';
import socketService from '../services/socket.js';
import audioPlayer from '../services/audioPlayer.js';

export function useGame(gameId, user) {
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

  // Fetch initial game state
  const loadGame = useCallback(async () => {
    if (!gameId || !user?.id) return;
    try {
      setLoading(true);
      const state = await ApiClient.get(`/game/${gameId}?userId=${user.id}`);
      if (!isMountedRef.current) return;
      setGameState(state);
      if (state.player) {
        setRevealLevel(state.player.currentRevealLevel || 0.1);
        setRemainingAttempts(state.player.remainingAttempts ?? 3);
        setRoundStatus(state.player.status || 'THINKING');
      }
    } catch (err) {
      if (isMountedRef.current) setError(err.message);
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
      // Preload first track first for fastest start
      for (const trackId of trackIds) {
        try {
          // Preload base 0.1s clue
          await audioPlayer.preload(`/api/audio/clue/${trackId}?duration=0.1`);
          
          // Preload other durations in background
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

      // Small delay for smooth visual transition at 100%
      setTimeout(() => {
        if (!isMountedRef.current) return;
        setIsInitialGameReady(true);
        setIsAudioReady(true);
        setIsAudioLoading(false);
      }, 400);
    };

    preloadAllTracks();
  }, [gameState]);

  // Real-time Socket Subscriptions + Auto-Reconnect
  useEffect(() => {
    if (!gameId || !user?.id) return;

    const socket = socketService.getSocket();

    // Join the game room
    const joinRoom = () => {
      socket.emit('game:join_room', { gameId, userId: user.id });
    };

    joinRoom();

    // Auto-rejoin room on reconnect (crucial for mobile!)
    const handleReconnect = () => {
      console.log('[useGame] Socket reconnected, rejoining room...');
      joinRoom();
      // Also emit reconnect event so server restores player state
      socket.emit('player:reconnect', { gameId, userId: user.id });
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

    socket.on('connect', handleReconnect);
    socket.on('player:reconnected', handlePlayerReconnected);

    socket.on('score:update', ({ userId, score, status }) => {
      if (!isMountedRef.current) return;
      setGameState(prev => {
        if (!prev) return prev;
        const updatedLeaderboard = prev.leaderboard.map(p =>
          p.userId === userId ? { ...p, score, status } : p
        );
        return { ...prev, leaderboard: updatedLeaderboard };
      });
    });

    socket.on('ranking:update', ({ leaderboard }) => {
      if (!isMountedRef.current) return;
      setGameState(prev => prev ? { ...prev, leaderboard } : prev);
    });

    socket.on('status:update', ({ userId, status }) => {
      if (!isMountedRef.current) return;
      setGameState(prev => {
        if (!prev) return prev;
        const updated = prev.leaderboard.map(p =>
          p.userId === userId ? { ...p, status } : p
        );
        return { ...prev, leaderboard: updated };
      });
    });

    socket.on('game:round:start', ({ currentRound }) => {
      if (!isMountedRef.current) return;
      loadGame();
      resetRoundUI();
    });

    socket.on('game:finish', ({ leaderboard, winner }) => {
      if (!isMountedRef.current) return;
      // Re-fetch full state from server to get accurate player score
      ApiClient.get(`/game/${gameId}?userId=${user.id}`).then(freshState => {
        if (!isMountedRef.current) return;
        setGameState({
          ...freshState,
          status: 'FINISHED',
          isFinished: true,
          leaderboard: leaderboard || freshState.leaderboard,
          winner
        });
      }).catch(() => {
        // Fallback: use socket data
        setGameState(prev => prev ? {
          ...prev,
          status: 'FINISHED',
          isFinished: true,
          leaderboard: leaderboard || prev.leaderboard,
          winner
        } : prev);
      });
      stopTimer();
    });

    return () => {
      socket.off('connect', handleReconnect);
      socket.off('player:reconnected', handlePlayerReconnected);
      socket.off('score:update');
      socket.off('ranking:update');
      socket.off('status:update');
      socket.off('game:round:start');
      socket.off('game:finish');
    };
  }, [gameId, user?.id, loadGame]);

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

  const startTimer = () => {
    if (!isTimerRunning && roundStatus === 'THINKING') {
      startTimeRef.current = Date.now();
      setIsTimerRunning(true);
    }
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetRoundUI = () => {
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
  };

  // Play clue audio (Starts timer ONLY when audio actually plays)
  const playClue = async () => {
    if (!gameState?.currentTrack) return;

    // Start timer at the exact instant playback triggers
    if (!isTimerRunning && roundStatus === 'THINKING') {
      startTimer();
      ApiClient.post(`/game/${gameId}/timer/start`, { userId: user.id }).catch(() => {});
      const socket = socketService.getSocket();
      socket.emit('player:play', { gameId, userId: user.id, roundNumber: gameState.currentRound });
    }

    const clueAudioUrl = `/api/audio/clue/${gameState.currentTrack.id}?duration=${revealLevel}`;
    await audioPlayer.playClue(clueAudioUrl, revealLevel);
  };

  // Progressive Reveal
  const revealNext = async () => {
    if (isPlayingAudio || revealLevel >= 5.0 || roundStatus !== 'THINKING') return;

    try {
      const res = await ApiClient.post(`/game/${gameId}/reveal`, { userId: user.id });
      const nextLevel = res.player?.currentRevealLevel || revealLevel;
      setRevealLevel(nextLevel);

      // Start timer if not running
      if (!isTimerRunning) startTimer();

      // Audio auto-plays from 0.0s to new reveal level
      if (gameState?.currentTrack) {
        const clueAudioUrl = `/api/audio/clue/${gameState.currentTrack.id}?duration=${nextLevel}`;
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
        userId: user.id,
        track: selectedTrack
      });

      setRemainingAttempts(res.remainingAttempts);
      setFeedbackMessage({ isCorrect: res.isCorrect, text: res.message });

      if (res.isCorrect) {
        stopTimer();
        setRoundStatus('GUESSED');
        setRevealedTrack(res.targetTrack);
        setIsRoundResultOpen(true);
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
      const res = await ApiClient.post(`/game/${gameId}/skip`, { userId: user.id });
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
    let lastErr = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const newState = await ApiClient.post(`/game/${gameId}/next`, { userId: user.id });
        if (!isMountedRef.current) return;
        setGameState(newState);
        resetRoundUI();
        return; // Success, exit
      } catch (err) {
        lastErr = err;
        console.warn(`[nextRound] Attempt ${attempt + 1} failed:`, err.message);
        // Wait briefly before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        }
      }
    }

    // All retries failed — fallback: re-fetch state from server
    console.error('[nextRound] All retries failed, falling back to loadGame');
    try {
      await loadGame();
      if (isMountedRef.current) resetRoundUI();
    } catch (e) {
      // Last resort: show error but don't blank-screen
      if (isMountedRef.current) {
        setError('Koneksi terputus. Silakan refresh halaman.');
      }
    }
  };

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
