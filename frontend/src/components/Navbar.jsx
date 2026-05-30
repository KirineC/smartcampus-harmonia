import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import './Navbar.css';
import './Notifications.css'; // Inclusion du fichier de style de la cloche

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  
  // 🎯 Lecture dynamique du localStorage
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  // 🔔 SYNC NOTIFICATIONS SECURISEE
  const chargerNotifications = async () => {
    const tokenCheck = localStorage.getItem('user');
    if (!tokenCheck || !user) return; 

    try {
      const response = await api.get('/index.php?mes_notifs=1');
      if (Array.isArray(response.data)) {
        setNotifs(response.data);
      } else {
        setNotifs([]);
      }
    } catch (err) {
      console.warn("Alerte API : Session non initialisée ou expirée.");
      setNotifs([]);
    }
  };

  // 🎯 HOOK UNIQUE : S'exécute TOUJOURS, éliminant l'erreur de changement d'ordre
  useEffect(() => {
    if (location.pathname === '/') {
      setNotifs([]);
      setOpen(false);
      return;
    }

    const tokenCheck = localStorage.getItem('user');
    if (tokenCheck && user) {
      chargerNotifications();
      const interval = setInterval(chargerNotifications, 45000); // 45000 ms = 45 secondes
      return () => clearInterval(interval); 
    } else {
      setNotifs([]);
    }
  }, [location.pathname, user]); 

  // 🎯 SÉCURITÉ COMPTAGE
  const nbNonLues = Array.isArray(notifs) 
    ? notifs.filter(n => n && parseInt(n.lu, 10) === 0).length 
    : 0;

  const handleToggleCloche = async () => {
    setOpen(!open);
    if (!open && nbNonLues > 0) {
      try {
        await api.post('/index.php', { action: 'marquer_lu' });
        if (Array.isArray(notifs)) {
          setNotifs(notifs.map(n => ({ ...n, lu: 1 })));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLogout = () => {
    setOpen(false);
    setNotifs([]); 
    localStorage.removeItem('user');
    navigate('/', { replace: true });
    window.location.reload(); 
  };
  
  // 🎯 SÉCURITÉ ABSOLUE POUR LES HOOKS : 
  // Si on est sur la page de connexion, on affiche un fragment vide plutôt que de faire un return bloquant plus haut.
  if (location.pathname === '/') {
    return <></>;
  }

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
        
        {/* ============================================================ */}
        {/* 🔔 BLOC CLOCHE DE NOTIFICATION INTÉGRÉ                        */}
        {/* ============================================================ */}
        {user && user?.role !== 'admin' && (
          <div className="notif-bell-container" style={{ marginRight: '15px', alignSelf: 'center' }}>
            <div className="bell-icon-wrapper" onClick={handleToggleCloche} style={{ position: 'relative', fontSize: '20px', cursor: 'pointer' }}>
              <span className="bell-emoji">🔔</span>
              {nbNonLues > 0 && (
                <span className="bell-badge-count" style={{ position: 'absolute', top: '-5px', right: '-8px', background: '#b3261e', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                  {nbNonLues}
                </span>
              )}
            </div>

            {open && (
              <div className="notif-dropdown-menu" style={{ position: 'absolute', top: '45px', right: '120px', width: '320px', background: '#ffffff', border: '1px solid #eae9e4', boxshadow: '0px 10px 30px rgba(0,0,0,0.1)', zIndex: 2000, textAlign: 'left' }}>
                <div className="notif-dropdown-header" style={{ padding: '12px', fontWeight: '600', background: '#f5f4f0', fontSize: '12px', color: '#555', borderBottom: '1px solid #eae9e4', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Dernières Alertes Académiques
                </div>
                <div className="notif-dropdown-menu-list" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {!Array.isArray(notifs) || notifs.length === 0 ? (
                    <div className="notif-empty-state" style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
                      Le pupitre des alertes est vide.
                    </div>
                  ) : (
                    notifs.map(n => (
                      <div key={n.id} className="notif-item-row" style={{ padding: '12px', borderBottom: '1px solid #f5f4f0', backgroundColor: n && parseInt(n.lu, 10) === 0 ? '#fffdf7' : '#ffffff', borderLeft: n && parseInt(n.lu, 10) === 0 ? '3px solid #a39264' : '3px solid transparent' }}>
                        <p className="notif-text" style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#222', lineHeight: '1.4' }}>{n.message}</p>
                        <span className="notif-date" style={{ fontSize: '10px', color: '#aaa' }}>
                          {n.date_creation ? new Date(n.date_creation).toLocaleDateString('fr-FR') : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={handleLogout} className="logout-btn">
          Quitter la session
        </button>
      </div>
    </nav>
  );
}