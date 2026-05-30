import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // On n'affiche pas la Navbar sur la page de Login
  if (location.pathname === '/') return null;

  // On récupère le rôle de l'utilisateur connecté
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  const handleLogout = () => {
    localStorage.removeItem('user'); // On efface la session
    navigate('/'); // Retour au login
  };

  return (
    <nav className="navbar-container">
      {/* 🎼 Redirection intelligente au clic sur le logo selon le chemin exact d'App.jsx */}
      <div 
        className="navbar-logo" 
        onClick={() => navigate(user?.role === 'enseignant' ? '/enseignant/dashboard' : '/dashboard')}
      >
        H A R M O N I A
      </div>
      
      <div className="navbar-links">
        
        {/* 🎻 MENU ÉTUDIANT */}
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
          </>
        )}

        {/* 👨‍🏫 MENU ENSEIGNANT */}
        {user?.role === 'enseignant' && (
          <>
            <span 
              onClick={() => navigate('/enseignant/dashboard')} 
              className={`nav-link ${location.pathname === '/enseignant/dashboard' ? 'active' : ''}`}
            >
              Registre des Maîtres
            </span>

            <span 
              onClick={() => navigate('/planning')} // En attendant de voir si vous créez une page dédiée ou si c'est géré dedans !
              className={`nav-link ${location.pathname === '/planning' ? 'active' : ''}`}
            >
              Mon Emploi du Temps
            </span>
          </>
        )}

        {/* 🚪 Bouton Quitter */}
        <button onClick={handleLogout} className="logout-btn">
          Quitter la session
        </button>
      </div>
    </nav>
  );
}