import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/') return null;

  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <nav className="navbar-container">
      <div
        className="navbar-logo"
        onClick={() => navigate(user?.role === 'enseignant' ? '/enseignant/dashboard' : '/dashboard')}
      >
        H A R M O N I A
      </div>

      <div className="navbar-links">

        {user?.role === 'etudiant' && (
          <>
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

            <span
              onClick={() => navigate('/mes-notes')}
              className={`nav-link ${location.pathname === '/mes-notes' ? 'active' : ''}`}
            >
              Mes Notes
            </span>
          </>
        )}

        {user?.role === 'enseignant' && (
          <>
            <span
              onClick={() => navigate('/enseignant/dashboard')}
              className={`nav-link ${location.pathname === '/enseignant/dashboard' ? 'active' : ''}`}
            >
              Vue d'ensemble
            </span>

            <span
              onClick={() => navigate('/enseignant/inscriptions')}
              className={`nav-link ${location.pathname === '/enseignant/inscriptions' ? 'active' : ''}`}
            >
              Classes & Pupitres
            </span>

            <span
              onClick={() => navigate('/enseignant/notes')}
              className={`nav-link ${location.pathname === '/enseignant/notes' ? 'active' : ''}`}
            >
              Saisie des Notes
            </span>

            <span
              onClick={() => navigate('/planning')}
              className={`nav-link ${location.pathname === '/planning' ? 'active' : ''}`}
            >
              Mon Emploi du Temps
            </span>
          </>
        )}

        {/* 🏛️ MENU ADMINISTRATEUR */}
        {user?.role === 'admin' && (
          <>
            <span 
              onClick={() => navigate('/admin/secretariat')} 
              className={`nav-link ${location.pathname === '/admin/secretariat' ? 'active' : ''}`}
            >
              Secrétariat & Chaires
            </span>
          </>
        )}
        
        <button onClick={handleLogout} className="logout-btn">
          Quitter la session
        </button>
      </div>
    </nav>
  );
}