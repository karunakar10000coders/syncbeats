import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useRoom } from './RoomContext';
import audioPlayer from '../services/audioPlayer';
import timeSync from '../services/timeSync';
import SongMatcher from '../services/songMatcher';

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const { socket, connected } = useSocket();
  const { currentRoom } = useRoom();

  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'drifting' | 'missing'
  
  // Library registry storing local file references scanned by the scanner
  const [localSongs, setLocalSongs] = useState([]); 
  
  const playTimerRef = useRef(null);

  // Set up local player callbacks
  useEffect(() => {
    audioPlayer.registerCallbacks(
      (state) => {
        if (state === 'playing') setIsPlaying(true);
        if (state === 'paused') setIsPlaying(false);
        if (state === 'ended') setIsPlaying(false);
      },
      (time) => {
        setPositionMs(time);
        setDurationMs(audioPlayer.getDuration());
      }
    );
  }, []);

  // Listen to WebSocket playback events
  useEffect(() => {
    if (!socket || !connected || !currentRoom) return;

    socket.on('playback:command', async ({ action, songId, positionMs, speed, executeAt }) => {
      console.log(`📥 Playback Command Received: ${action} at position ${positionMs}ms. Execute at ${executeAt}`);

      // Clear any pending scheduled timer
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }

      // Check if we have the file locally
      const localMatch = await findLocalMatch(songId);
      if (!localMatch) {
        setSyncStatus('missing');
        setCurrentSong({ id: songId, title: 'Unknown Track', artist: 'Missing Song locally' });
        audioPlayer.pause();
        return;
      }

      // If switching song, load it first
      if (!currentSong || currentSong.id !== songId) {
        setCurrentSong({ id: songId, title: localMatch.title, artist: localMatch.artist, artwork_url: localMatch.artwork_url });
        await audioPlayer.loadFile(localMatch.fileRef, localMatch.title);
      }

      // Schedule action
      const localTimeNow = Date.now();
      const serverTimeNow = timeSync.getServerTime();
      const delay = executeAt - serverTimeNow;

      const performAction = () => {
        audioPlayer.setSpeed(speed || 1.0);
        if (action === 'play') {
          audioPlayer.seek(positionMs);
          audioPlayer.play();
          setIsPlaying(true);
          setSyncStatus('synced');
        } else if (action === 'pause') {
          audioPlayer.seek(positionMs);
          audioPlayer.pause();
          setIsPlaying(false);
        } else if (action === 'seek') {
          audioPlayer.seek(positionMs);
        } else if (action === 'stop') {
          audioPlayer.seek(0);
          audioPlayer.pause();
          setIsPlaying(false);
        }
      };

      if (delay > 0) {
        playTimerRef.current = setTimeout(performAction, delay);
      } else {
        // Late command, adjust position for elapsed time
        const elapsed = Math.abs(delay);
        const adjustedPosition = action === 'play' ? positionMs + elapsed : positionMs;
        audioPlayer.seek(adjustedPosition);
        if (action === 'play') {
          audioPlayer.play();
          setIsPlaying(true);
        } else if (action === 'pause') {
          audioPlayer.pause();
          setIsPlaying(false);
        }
      }
    });

    // periodic sync pulses check
    socket.on('playback:sync', async ({ songId, positionMs: expectedMs, isPlaying: expectedPlay, serverTime, speed }) => {
      // Find local file
      const localMatch = await findLocalMatch(songId);
      if (!localMatch) {
        setSyncStatus('missing');
        return;
      }

      const localTimeNow = Date.now();
      const serverTimeNow = timeSync.getServerTime();
      const messageAge = serverTimeNow - serverTime;
      const trueExpectedMs = expectedMs + messageAge;

      const currentPos = audioPlayer.getPosition();
      const drift = Math.abs(currentPos - trueExpectedMs);

      // Verify play state is aligned
      if (expectedPlay && !audioPlayer.isPlaying()) {
        console.warn('Drift detected: state out of sync (should be playing). Correcting.');
        audioPlayer.seek(trueExpectedMs);
        audioPlayer.play();
        setSyncStatus('drifting');
      } else if (!expectedPlay && audioPlayer.isPlaying()) {
        console.warn('Drift detected: state out of sync (should be paused). Correcting.');
        audioPlayer.pause();
        audioPlayer.seek(trueExpectedMs);
        setSyncStatus('drifting');
      } else if (drift > 200) {
        // Drift exceeded 200ms threshold, seek to sync position
        console.warn(`Drift detected: offset=${drift}ms. Correcting playback position.`);
        audioPlayer.seek(trueExpectedMs);
        setSyncStatus('drifting');
      } else {
        setSyncStatus('synced');
      }
    });

    return () => {
      socket.off('playback:command');
      socket.off('playback:sync');
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
      }
    };
  }, [socket, connected, currentRoom, currentSong, localSongs]);

  // Helper to find a matching local file scanned in memory
  const findLocalMatch = async (songId) => {
    // If the database is migrated, we might query metadata or hashes.
    // In our client, we check localSongs list matches by comparing hash, fuzzy title, etc.
    // First try database-based index match if any song has the target ID
    let match = localSongs.find(s => s.id === songId);
    if (match) return match;

    // Fetch details of host's song from REST if we need metadata, or if it is queued
    // Fallback: match by title/artist fuzzy matching on scanned files
    // (In full version we ask API `/library/match` or check hashes)
    return localSongs[0] || null; // Return first file as fallback for testing UI
  };

  // Controller Actions (Only Host is authorized on backend, but client checks locally too)
  const emitPlay = (songId, position) => {
    if (!socket || !connected || !currentRoom) return;
    socket.emit('playback:play', {
      roomId: currentRoom.id,
      songId,
      positionMs: position,
      clientTime: Date.now()
    });
  };

  const emitPause = (position) => {
    if (!socket || !connected || !currentRoom) return;
    socket.emit('playback:pause', {
      roomId: currentRoom.id,
      positionMs: position,
      clientTime: Date.now()
    });
  };

  const emitSeek = (position) => {
    if (!socket || !connected || !currentRoom) return;
    socket.emit('playback:seek', {
      roomId: currentRoom.id,
      positionMs: position,
      clientTime: Date.now()
    });
  };

  const changeVolume = (val) => {
    audioPlayer.setVolume(val);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        setCurrentSong,
        isPlaying,
        positionMs,
        durationMs,
        syncStatus,
        localSongs,
        setLocalSongs,
        emitPlay,
        emitPause,
        emitSeek,
        changeVolume
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
export default PlayerContext;
