import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Music, Mail, Lock, User, Sparkles } from 'lucide-react';

const LoginPage = () => {
  const { login, register, guestLogin } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isGuest) {
        await guestLogin(name);
      } else if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      background: '#05070f'
    }}>
      {/* Left Branding View */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0f112a, #070913)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        borderRight: '1px solid rgba(255, 255, 255, 0.03)',
        position: 'relative',
        overflow: 'hidden'
      }} className="desktop-only">
        {/* Floating gradient orb in background */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', zIndex: 2 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)'
          }}>
            <Music size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>SyncBeats</span>
        </div>

        <h2 style={{
          fontSize: '44px',
          fontWeight: '800',
          lineHeight: '1.2',
          margin: '0 0 20px 0',
          background: 'linear-gradient(135deg, #fff, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-1.5px',
          zIndex: 2
        }}>
          Synchronized Music Listening
        </h2>
        <p style={{
          color: '#94a3b8',
          fontSize: '17px',
          lineHeight: '1.6',
          margin: '0',
          maxWidth: '480px',
          fontWeight: '400',
          zIndex: 2
        }}>
          Listen to your local files with your friends anywhere, in real time. Perfectly synchronized play, pause, seeks, and shared queue controls.
        </p>
      </div>

      {/* Right Login Card Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 2
      }}>
        <div 
          className="glass-panel" 
          style={{
            width: '100%',
            maxWidth: '420px',
            padding: '40px',
            background: 'rgba(15, 23, 42, 0.65)'
          }}
        >
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>
              {isGuest ? 'Enter as Guest' : isRegister ? 'Create Account' : 'Welcome Back'}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0' }}>
              {isGuest ? 'No password required, join instantly' : 'Access your synced listening rooms'}
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {(isRegister || isGuest) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>DISPLAY NAME</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#475569" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    className="glass-input"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '44px' }}
                  />
                </div>
              </div>
            )}

            {!isGuest && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>EMAIL ADDRESS</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#475569" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      required
                      className="glass-input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '44px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#475569" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="password"
                      required
                      className="glass-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '44px' }}
                    />
                  </div>
                </div>
              </>
            )}

            <button 
              type="submit" 
              className="gradient-btn"
              disabled={loading}
              style={{ width: '100%', height: '46px', marginTop: '10px' }}
            >
              {loading ? 'Processing...' : isGuest ? 'Enter Room' : isRegister ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!isGuest && (
              <span 
                style={{ fontSize: '13px', color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
              </span>
            )}

            <span 
              style={{ 
                fontSize: '13px', 
                color: 'var(--accent-tertiary)', 
                cursor: 'pointer', 
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onClick={() => {
                setIsGuest(!isGuest);
                setError('');
              }}
            >
              <Sparkles size={14} />
              {isGuest ? 'Sign in with email account' : 'Continue as Guest instead'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
