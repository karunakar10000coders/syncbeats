import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { User, Volume2, Moon, Disc, Shield, LogOut, ArrowLeft } from 'lucide-react';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { localSongs, changeVolume } = usePlayer();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#05070f',
      padding: '40px 24px',
      boxSizing: 'border-box'
    }}>
      <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
        {/* Back Link */}
        <button 
          onClick={() => navigate('/home')}
          style={{
            background: 'transparent', border: 'none', color: '#94a3b8',
            fontSize: '14px', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '8px', marginBottom: '32px', padding: 0
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '32px', letterSpacing: '-0.5px' }}>
          Settings
        </h2>

        {/* Profile Card Section */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src={user?.avatar_url} alt="" style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '18px', fontWeight: '700' }}>{user?.display_name}</span>
            <span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>{user?.email || 'Guest user session'}</span>
          </div>
          {user?.is_guest && (
            <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: '#94a3b8' }}>
              GUEST
            </div>
          )}
        </div>

        {/* Settings options list */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Preferences */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>
              Audio Preferences
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', justify: 'between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Volume2 size={18} color="#94a3b8" />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Default Output Volume</span>
              </div>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                defaultValue="0.5"
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                style={{ marginLeft: 'auto', accentColor: '#8b5cf6', cursor: 'pointer', width: '120px' }}
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

          {/* Library Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>
              Local Library Storage
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Disc size={18} color="#94a3b8" />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Scanned Local Tracks</span>
              <span style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                {localSongs.length} songs
              </span>
            </div>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

          {/* Logout button */}
          <button 
            onClick={handleLogout}
            className="ghost-btn"
            style={{ 
              borderColor: 'rgba(239, 68, 68, 0.2)', 
              color: '#ef4444',
              width: '100%',
              justifyContent: 'center',
              padding: '12px'
            }}
          >
            <LogOut size={16} />
            Log Out Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
