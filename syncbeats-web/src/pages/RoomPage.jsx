import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoom } from '../contexts/RoomContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useChat } from '../hooks/useChat';
import { useQueue } from '../hooks/useQueue';
import SongScannerService from '../services/songScanner';
import ApiService from '../services/api';

import { 
  Play, Pause, SkipForward, Volume2, Users, MessageSquare, 
  Send, Smile, Copy, LogOut, ShieldAlert, Award, FileAudio, 
  Search, Plus, ArrowUp, ArrowDown, Trash, ShieldAlert as AlertIcon, Laptop, Smartphone, Globe
} from 'lucide-react';

const RoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentRoom, setCurrentRoom, members, setMembers, leaveRoom } = useRoom();
  const { socket, connected } = useRoom(); // socket instance
  
  const { 
    currentSong, isPlaying, positionMs, durationMs, syncStatus,
    localSongs, setLocalSongs, emitPlay, emitPause, emitSeek, changeVolume 
  } = usePlayer();

  const { messages, reactions, setReactions, sendMessage, sendReaction } = useChat();
  const { queue, addToQueue, removeFromQueue, voteOnItem, reorderQueue } = useQueue();

  const [chatTab, setChatTab] = useState('chat'); // 'chat' | 'members'
  const [inputText, setInputText] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Subscribe user to Socket Room events upon mounting
  const { socket: rawSocket, connected: isSocketConnected } = usePlayer(); // grab from player context

  useEffect(() => {
    if (!rawSocket || !isSocketConnected) return;
    
    // Join room event handshake
    rawSocket.emit('room:join', { roomId: id, deviceType: 'web' });
    rawSocket.emit('room:join_track', id); // presence tracker

    return () => {
      // Cleanup leave
      rawSocket.emit('room:leave', { roomId: id });
    };
  }, [rawSocket, isSocketConnected, id]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleSendReaction = (emoji) => {
    sendReaction(emoji);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    if (window.confirm('Are you sure you want to leave the room?')) {
      await leaveRoom(id);
      navigate('/home');
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const scanned = await SongScannerService.scanBatch(files);
      if (scanned.length === 0) return;

      // Filter out fileRef as it's a binary reference and cannot be serialized
      const songsToSync = scanned.map(({ fileRef, artwork_url, ...s }) => s);
      const res = await ApiService.post('/library/sync', { songs: songsToSync });

      if (res.success && res.data.songs) {
        // Map backend IDs and keep fileRef / artwork_url for local playback/UI
        const synced = res.data.songs.map(syncedSong => {
          const original = scanned.find(s => s.file_hash === syncedSong.file_hash);
          return {
            ...syncedSong,
            fileRef: original ? original.fileRef : null,
            artwork_url: original ? original.artwork_url : null
          };
        });

        // Register file references inside context to make it play locally
        setLocalSongs(prev => {
          const updated = [...prev];
          for (const s of synced) {
            if (!updated.some(item => item.file_hash === s.file_hash)) {
              updated.push(s);
            }
          }
          return updated;
        });

        console.log('Local library synced & updated:', synced);
      }
    } catch (err) {
      console.error('Failed to sync library:', err);
      alert('Failed to sync songs with server. Please try again.');
    } finally {
      setShowScanner(false);
    }
  };

  const formatTime = (ms) => {
    const s = Math.floor((ms / 1000) % 60);
    const m = Math.floor((ms / (1000 * 60)) % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isHost = currentRoom?.host_id === user?.id;

  const handleProgressBarClick = (e) => {
    if (!isHost) return; // Only host can seek
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekPos = Math.round(percent * durationMs);
    emitSeek(seekPos);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: '#02040a',
      boxSizing: 'border-box'
    }}>
      {/* Top Bar Room Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(15, 23, 42, 0.25)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0' }}>{currentRoom?.name || 'Loading Session...'}</h2>
          <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Room Code: <strong>{currentRoom?.code}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          {/* Sync Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: syncStatus === 'synced' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
            border: `1px solid ${syncStatus === 'synced' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)'}`,
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            color: syncStatus === 'synced' ? '#22c55e' : '#eab308'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: syncStatus === 'synced' ? '#22c55e' : '#eab308'
            }} />
            {syncStatus === 'synced' ? 'Perfect Sync' : syncStatus === 'drifting' ? 'Sync Adjusting' : 'Local File Missing'}
          </div>

          <button 
            className="ghost-btn" 
            onClick={handleCopyLink}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <Copy size={14} />
            {copied ? 'Copied!' : 'Share Room'}
          </button>

          <button 
            className="ghost-btn" 
            onClick={handleLeave}
            style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
          >
            <LogOut size={14} />
            Leave Room
          </button>
        </div>
      </div>

      {/* Main Content Layout Panels */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        width: '100%'
      }}>
        {/* PANEL 1: PLAYER & CONTROLS */}
        <div style={{
          flex: '1.2',
          padding: '36px',
          borderRight: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto'
        }}>
          {currentSong ? (
            <>
              {/* Artwork container */}
              <div 
                className="pulsing-glow"
                style={{
                  width: '280px',
                  height: '280px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #1e1b4b, #030712)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '32px',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {currentSong.artwork_url ? (
                  <img 
                    src={currentSong.artwork_url} 
                    alt="Artwork" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <FileAudio size={72} color="rgba(255,255,255,0.1)" />
                )}
              </div>

              {/* Song details */}
              <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 6px 0', textAlign: 'center' }}>
                {currentSong.title}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 32px 0', fontWeight: '500', textAlign: 'center' }}>
                {currentSong.artist}
              </p>

              {/* Progress bar */}
              <div style={{ width: '100%', maxWidth: '400px', marginBottom: '24px' }}>
                <div 
                  onClick={handleProgressBarClick}
                  style={{
                    width: '100%',
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '3px',
                    position: 'relative',
                    cursor: isHost ? 'pointer' : 'default',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${durationMs > 0 ? (positionMs / durationMs) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
                    borderRadius: '3px'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'between', fontSize: '11px', color: '#94a3b8' }}>
                  <span>{formatTime(positionMs)}</span>
                  <span style={{ marginLeft: 'auto' }}>{formatTime(durationMs)}</span>
                </div>
              </div>

              {/* Player control buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                <button 
                  disabled={!isHost}
                  onClick={() => {
                    // Back logic or skip prev
                  }}
                  style={{ background: 'transparent', border: 'none', color: isHost ? '#fff' : '#475569', cursor: isHost ? 'pointer' : 'default' }}
                >
                  <SkipForward size={20} style={{ transform: 'rotate(180deg)' }} />
                </button>

                <button 
                  disabled={!isHost}
                  onClick={() => {
                    if (isPlaying) {
                      emitPause(positionMs);
                    } else {
                      emitPlay(currentSong.id, positionMs);
                    }
                  }}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: isHost ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'rgba(255,255,255,0.02)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: isHost ? 'pointer' : 'default',
                    boxShadow: isHost ? '0 4px 15px rgba(139,92,246,0.3)' : 'none'
                  }}
                >
                  {isPlaying ? <Pause size={24} fill="#fff" /> : <Play size={24} fill="#fff" style={{ marginLeft: '4px' }} />}
                </button>

                <button 
                  disabled={!isHost}
                  onClick={() => {
                    // skip forward
                  }}
                  style={{ background: 'transparent', border: 'none', color: isHost ? '#fff' : '#475569', cursor: isHost ? 'pointer' : 'default' }}
                >
                  <SkipForward size={20} />
                </button>
              </div>

              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '120px' }}>
                <Volume2 size={16} color="#94a3b8" />
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  defaultValue="0.5"
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: '#8b5cf6', cursor: 'pointer' }}
                />
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <FileAudio size={64} color="rgba(255,255,255,0.06)" style={{ marginBottom: '16px' }} />
              <p style={{ margin: '0 0 20px 0' }}>No song is currently loaded</p>
              {isHost && (
                <button className="gradient-btn" onClick={() => setShowScanner(true)}>
                  Add Local Music
                </button>
              )}
            </div>
          )}
        </div>

        {/* PANEL 2: QUEUE & LIBRARY */}
        <div style={{
          flex: '1.3',
          padding: '24px',
          borderRight: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Queue Section */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1.2, overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0' }}>Shared Queue</h3>
              
              <button 
                className="gradient-btn"
                onClick={() => setShowScanner(true)}
                style={{
                  marginLeft: 'auto',
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '8px'
                }}
              >
                <Plus size={14} />
                Add Songs
              </button>
            </div>

            {/* Queue List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {queue.length > 0 ? (
                queue.map((item, idx) => {
                  const hasLocal = localSongs.some(s => s.file_hash === item.file_hash);
                  return (
                    <div 
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.title}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {item.artist} • added by {item.added_by_name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
                        {/* Local Availability Badge */}
                        <div style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '700',
                          background: hasLocal ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: hasLocal ? '#22c55e' : '#ef4444',
                          border: `1px solid ${hasLocal ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                        }}>
                          {hasLocal ? 'LOCAL' : 'MISSING'}
                        </div>

                        {/* Play Button for Host */}
                        {isHost && hasLocal && (
                          <button 
                            onClick={() => emitPlay(item.song_id, 0)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8b5cf6', display: 'flex', alignItems: 'center', padding: '4px' }}
                            title="Play Song Now"
                          >
                            <Play size={14} fill="#8b5cf6" />
                          </button>
                        )}

                        {/* Vote Buttons */}
                        <button 
                          onClick={() => voteOnItem(item.id, 'up')}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: '700' }}>
                          {(item.upvotes || 0) - (item.downvotes || 0)}
                        </span>
                        <button 
                          onClick={() => voteOnItem(item.id, 'down')}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          <ArrowDown size={16} />
                        </button>

                        {isHost && (
                          <button 
                            onClick={() => removeFromQueue(item.id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: '6px' }}
                          >
                            <Trash size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', color: '#475569', marginTop: '30px' }}>
                  <p>Queue is empty.</p>
                </div>
              )}
            </div>
          </div>

          {/* Library Section */}
          <div style={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
            paddingTop: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 0.8, 
            overflow: 'hidden' 
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>My Library</h3>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {localSongs.length > 0 ? (
                localSongs.map((song) => (
                  <div 
                    key={song.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{song.title}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {song.artist}
                      </span>
                    </div>

                    <button
                      onClick={() => addToQueue(song.id)}
                      className="ghost-btn"
                      style={{
                        marginLeft: 'auto',
                        padding: '4px 8px',
                        fontSize: '11px',
                        borderRadius: '6px',
                        borderColor: 'rgba(139, 92, 246, 0.3)',
                        color: '#8b5cf6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        flexShrink: 0
                      }}
                    >
                      <Plus size={10} />
                      Queue
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#475569', marginTop: '20px' }}>
                  <p style={{ fontSize: '12px', margin: 0 }}>Scan local music to add them here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL 3: MEMBERS AND CHAT */}
        <div style={{
          flex: '1.1',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'rgba(5, 7, 15, 0.4)'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(15, 23, 42, 0.2)'
          }}>
            <button 
              onClick={() => setChatTab('chat')}
              style={{
                flex: 1, padding: '14px', border: 'none', background: 'transparent',
                fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                color: chatTab === 'chat' ? 'var(--accent-primary)' : '#94a3b8',
                borderBottom: chatTab === 'chat' ? '2px solid var(--accent-primary)' : 'none'
              }}
            >
              Room Chat
            </button>
            <button 
              onClick={() => setChatTab('members')}
              style={{
                flex: 1, padding: '14px', border: 'none', background: 'transparent',
                fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                color: chatTab === 'members' ? 'var(--accent-primary)' : '#94a3b8',
                borderBottom: chatTab === 'members' ? '2px solid var(--accent-primary)' : 'none'
              }}
            >
              Members ({members.length})
            </button>
          </div>

          {/* Tab content panel */}
          {chatTab === 'chat' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Message Board */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', gap: '10px' }}>
                    <img src={msg.avatarUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                        {msg.displayName}
                      </span>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        padding: '8px 12px',
                        borderRadius: '0 8px 8px 8px',
                        color: '#f8fafc',
                        fontSize: '13px',
                        marginTop: '4px',
                        wordBreak: 'break-word',
                        maxWidth: '220px'
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Live floating reactions overlay animations render container */}
              <div style={{ position: 'relative', width: '100%' }}>
                {reactions.map((rx) => (
                  <div 
                    key={rx.id} 
                    className="floating-emoji"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      '--rotate-angle': `${-20 + Math.random() * 40}deg`
                    }}
                  >
                    {rx.emoji}
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(15, 23, 42, 0.2)' }}>
                {/* Emoji reactions drawer */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '12px' }}>
                  {['❤️', '🔥', '😂', '😭', '👍'].map((emoji) => (
                    <button 
                      key={emoji}
                      onClick={() => handleSendReaction(emoji)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '50%', width: '32px', height: '32px', display: 'flex',
                        alignItems: 'center', justify: 'center', fontSize: '16px', cursor: 'pointer'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Send a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    style={{ flex: 1, padding: '10px 14px' }}
                  />
                  <button type="submit" className="gradient-btn" style={{ padding: '10px' }}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Members tab view */
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {members.map((member) => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={member.avatar_url} 
                      alt="" 
                      style={{ width: '36px', height: '36px', borderRadius: '50%', opacity: member.is_online ? 1 : 0.4 }} 
                    />
                    <div style={{
                      position: 'absolute', bottom: '0', right: '0', width: '8px', height: '8px',
                      borderRadius: '50%', background: member.is_online ? '#22c55e' : '#475569',
                      border: '2px solid #05070f'
                    }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: member.is_online ? '#f8fafc' : '#475569' }}>
                      {member.display_name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {member.device_type === 'android' || member.device_type === 'ios' ? <Smartphone size={10} /> : <Globe size={10} />}
                      {member.device_type || 'web'}
                    </span>
                  </div>

                  {member.role === 'host' && (
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: '#eab308' }} title="Host Crown Badge">
                      <Award size={14} />
                      <span style={{ fontSize: '10px', fontWeight: '700' }}>HOST</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* LOCAL LIBRARY SCANNER MODAL DRAWER */}
      {showScanner && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justify: 'center', zIndex: 1000,
          padding: '20px', boxSizing: 'border-box'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px', margin: 'auto' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 12px 0' }}>Scan Local Library</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 24px 0', lineHeight: '1.5' }}>
              Select audio files (MP3, WAV, M4A, FLAC) from your device. Metadata tags and hash calculations will register locally.
            </p>

            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '36px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.01)',
                marginBottom: '24px'
              }}
            >
              <FileAudio size={40} color="var(--accent-primary)" style={{ marginBottom: '12px' }} />
              <span style={{ fontSize: '14px', fontWeight: '600', display: 'block' }}>Choose Files to scan</span>
              <span style={{ fontSize: '11px', color: '#475569', marginTop: '4px', display: 'block' }}>MP3, WAV, M4A, AAC, FLAC</span>
              
              <input 
                type="file"
                multiple
                accept="audio/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="ghost-btn" 
                onClick={() => setShowScanner(false)}
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;
