import React, { createContext, useContext, useState, useCallback } from 'react';
import TrackDetailModal from '../components/TrackDetailModal.jsx';

const TrackDetailContext = createContext(null);

export function TrackDetailProvider({ children }) {
  const [selectedTrack, setSelectedTrack] = useState(null);

  const openTrackDetail = useCallback((track) => {
    if (!track || !track.title) return;
    setSelectedTrack(track);
  }, []);

  const closeTrackDetail = useCallback(() => {
    setSelectedTrack(null);
  }, []);

  return (
    <TrackDetailContext.Provider value={{ openTrackDetail, closeTrackDetail }}>
      {children}
      <TrackDetailModal track={selectedTrack} onClose={closeTrackDetail} />
    </TrackDetailContext.Provider>
  );
}

export function useTrackDetail() {
  const ctx = useContext(TrackDetailContext);
  if (!ctx) {
    return { openTrackDetail: () => {}, closeTrackDetail: () => {} };
  }
  return ctx;
}

export default useTrackDetail;
