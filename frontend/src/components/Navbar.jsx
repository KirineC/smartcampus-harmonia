import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css'; // 👈 On importe le nouveau fichier CSS

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
    <nav className="navbar-container">
      {/* 🎼 Clic sur le logo -> Retour au Hub central */}
      <div className="navbar-logo" onClick={() => navigate('/dashboard')}>
        H A R M O N I A
      </div>
      
      <div className="navbar-links">
        {/* 🏛️ Onglet Tableau de Bord */}
        <span 
          onClick={() => navigate('/dashboard')} 
          className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          Tableau de Bord
        </span>

        <span 
          onClick={() => navigate('/catalogue')} 
          className={`nav-link ${location.pathname === '/catalogue' ? 'active' : ''}`}
        >
          Grand Catalogue
        </span>

        <span 
          onClick={() => navigate('/planning')} 
          className={`nav-link ${location.pathname === '/planning' ? 'active' : ''}`}
        >
          Mon Planning
        </span>

        <button onClick={handleLogout} className="logout-btn">
          Quitter la session
        </button>
      </div>
    </nav>
  );
}