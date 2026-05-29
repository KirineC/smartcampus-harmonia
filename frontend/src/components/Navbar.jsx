import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // On n'affiche pas la Navbar sur la page de Login
  if (location.pathname === '/') return null;

  const handleLogout = () => {
    localStorage.removeItem('user'); // On efface la session
    navigate('/'); // Retour au login
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 40px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e4e0',
      fontFamily: 'Georgia, serif'
    }}>
      <div style={{ letterSpacing: '2px', fontSize: '18px', cursor: 'pointer' }} onClick={() => navigate('/catalogue')}>
        H A R M O N I A
      </div>
      
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <span 
          onClick={() => navigate('/catalogue')} 
          style={{
            cursor: 'pointer',
            fontSize: '14px',
            color: location.pathname === '/catalogue' ? '#d4af37' : '#111',
            fontWeight: location.pathname === '/catalogue' ? 'bold' : 'normal'
          }}
        >
          Grand Catalogue
        </span>
        <span 
          onClick={() => navigate('/planning')} 
          style={{
            cursor: 'pointer',
            fontSize: '14px',
            color: location.pathname === '/planning' ? '#d4af37' : '#111',
            fontWeight: location.pathname === '/planning' ? 'bold' : 'normal'
          }}
        >
          Mon Planning
        </span>
        <button 
          onClick={handleLogout}
          style={{
            background: 'none',
            border: '1px solid #111',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.borderColor = '#d4af37'}
          onMouseLeave={(e) => e.target.style.borderColor = '#111'}
        >
          Quitter la session
        </button>
      </div>
    </nav>
  );
}