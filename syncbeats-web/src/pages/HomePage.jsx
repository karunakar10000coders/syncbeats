import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoom } from '../contexts/RoomContext';
import { PlusCircle, Link, Music, LogOut, Radio, User, Code, Shield } from 'lucide-react';

const HomePage = () => {
  const { user, logout } = useAuth();
  const { createRoom, joinRoom, setCurrentRoom, setMembers } = useRoom();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Settings states
  const [maxMembers, setMaxMembers] = useState(10);
  const [democratic, setDemocratic] = useState(false);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await createRoom(roomName, {
        max_members: maxMembers,
        democratic_queue: democratic,
        allow_guest_queue: true,
        require_song_match: true
      });
      if (res.success) {
        setCurrentRoom(res.data);
        // Add host as local first member
        setMembers([{
          id: user.id,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          role: 'host',
          is_online: true
        }]);
        navigate(`/room/${res.data.id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await joinRoom(roomCode);
      if (res.success) {
        setCurrentRoom(res.data.room);
        navigate(`/room/${res.data.room.id}`);
      }
    } catch (err) {
      setError(err.message || 'Room code is invalid or room is full.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#05070f',
      padding: '40px 24px',
      boxSizing: 'border-box'
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'between',
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto 48px auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)'
          }}>
            <Music size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>SyncBeats</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src={user?.avatar_url} 
              alt="Avatar" 
              style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)' }} 
            />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>{user?.display_name}</span>
          </div>

          <button 
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#94a3b8'
            }}
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Contents */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '800',
          margin: '0 0 12px 0',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #fff, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px'
        }}>
          Create or Join a Room
        </h2>
        <p style={{
          color: '#94a3b8',
          fontSize: '15px',
          margin: '0 0 40px 0',
          textAlign: 'center',
          maxWidth: '500px',
          lineHeight: '1.5'
        }}>
          Get your local music files ready! Creating a room generates a code and link you can share with friends.
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '30px',
            maxWidth: '500px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {error}
          </div>
        )}

        {/* CTA cards */}
        <div style={{
          display: 'flex',
          gap: '24px',
          width: '100%',
          maxWidth: '680px',
          flexWrap: 'wrap'
        }}>
          {/* Create room card */}
          <div 
            className="glass-panel"
            onClick={() => setShowCreateModal(true)}
            style={{
              flex: 1,
              minWidth: '280px',
              padding: '36px',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(139, 92, 246, 0.05)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(139, 92, 246, 0.15)',
              color: '#8b5cf6',
              marginBottom: '20px'
            }}>
              <PlusCircle size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>Create Room</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0', lineHeight: '1.5' }}>
              Host a new room, upload your library, and invite your friends. You have full controls.
            </p>
          </div>

          {/* Join room card */}
          <div 
            className="glass-panel"
            onClick={() => setShowJoinModal(true)}
            style={{
              flex: 1,
              minWidth: '280px',
              padding: '36px',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(6, 182, 212, 0.05)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#06b6d4',
              marginBottom: '20px'
            }}>
              <Radio size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>Join Room</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0', lineHeight: '1.5' }}>
              Enter a 6-digit room code or paste a link from a friend to sync instantly.
            </p>
          </div>
        </div>
      </div>

      {/* CREATE ROOM MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justify: 'center', zIndex: 1000,
          padding: '20px', boxSizing: 'border-box'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '32px', margin: 'auto' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 20px 0' }}>Create a New Room</h3>
            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>ROOM NAME</label>
                <input
                  type="text"
                  required
                  className="glass-input"
                  placeholder="My Epic listening Room"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>MAX USERS</label>
                <input
                  type="number"
                  className="glass-input"
                  min="2"
                  max="100"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(parseInt(e.target.value, 10))}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="democratic"
                  checked={democratic}
                  onChange={(e) => setDemocratic(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="democratic" style={{ fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                  Enable Democratic Queue Mode
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="ghost-btn" 
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="gradient-btn" 
                  disabled={loading}
                  style={{ flex: 2 }}
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN ROOM MODAL */}
      {showJoinModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justify: 'center', zIndex: 1000,
          padding: '20px', boxSizing: 'border-box'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '32px', margin: 'auto' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 20px 0' }}>Join a Listening Room</h3>
            <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>ROOM CODE (6-DIGITS)</label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  className="glass-input"
                  placeholder="EX: CODE12"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase', fontSize: '18px', letterSpacing: '2px', textAlign: 'center' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="ghost-btn" 
                  onClick={() => setShowJoinModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="gradient-btn" 
                  disabled={loading}
                  style={{ flex: 2 }}
                >
                  {loading ? 'Joining...' : 'Join Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
