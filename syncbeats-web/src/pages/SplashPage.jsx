import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Music } from 'lucide-react';

const SplashPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          navigate('/home');
        } else {
          navigate('/login');
        }
      }, 2000); // Pulse transition delay
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at center, #0f1026, #05070f)'
    }}>
      <div 
        className="pulsing-glow"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          marginBottom: '24px'
        }}
      >
        <Music size={56} color="#fff" />
      </div>
      
      <h1 style={{
        fontSize: '36px',
        fontWeight: '800',
        margin: '0 0 8px 0',
        background: 'linear-gradient(135deg, #fff 30%, #94a3b8)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-1px'
      }}>
        SyncBeats
      </h1>
      
      <p style={{
        color: '#94a3b8',
        fontSize: '15px',
        margin: '0',
        fontWeight: '500'
      }}>
        Listen together, in perfect harmony
      </p>

      <div style={{
        marginTop: '40px',
        width: '140px',
        height: '4px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          height: '100%',
          width: '50%',
          background: 'linear-gradient(90deg, #8b5cf6, #3b82f6, #06b6d4)',
          borderRadius: '2px',
          animation: 'shimmer 1.5s infinite ease-in-out'
        }} />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { left: -100%; width: 100%; }
          100% { left: 100%; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SplashPage;
