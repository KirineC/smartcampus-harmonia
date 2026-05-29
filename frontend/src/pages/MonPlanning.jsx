import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './MonPlanning.css';

export default function MonPlanning() {
  const [inscriptions, setInscriptions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Icons pour chaque jour
  const dayIcons = {
    1: '🌙',  // Lundi
    2: '🎻',  // Mardi
    3: '🎹',  // Mercredi
    4: '🎺',  // Jeudi
    5: '🎸',  // Vendredi
    6: '🎼',  // Samedi
    0: '⭐'   // Dimanche
  };

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        navigate('/login');
        return;
      }
      const userObj = JSON.parse(userData);
      setUser(userObj);
      
      // Vérifier que c'est un étudiant
      if (userObj.role !== 'etudiant') {
        setError('Accès réservé aux étudiants');
        return;
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchInscriptions = async () => {
      try {
        setLoading(true);
        const response = await api.get('/inscriptions');
        
        if (Array.isArray(response.data)) {
          // Trier par jour puis heure
          const sorted = response.data.sort((a, b) => {
            if (a.jour_semaine !== b.jour_semaine) {
              return a.jour_semaine - b.jour_semaine;
            }
            return a.heure_debut.localeCompare(b.heure_debut);
          });
          setInscriptions(sorted);
        } else {
          setInscriptions([]);
        }
      } catch (err) {
        console.error('Erreur chargement inscriptions:', err);
        setError('Impossible de charger votre planning');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchInscriptions();
    }
  }, [user]);

  // Grouper par jour
  const groupByDay = () => {
    const grouped = {};
    inscriptions.forEach(ins => {
      const day = ins.jour_semaine || 1;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(ins);
    });
    return grouped;
  };

  const groupedCourses = groupByDay();

  // Badge statut
  const getStatusBadge = (statut) => {
    if (statut === 'Validée') {
      return <span className="badge badge-validated">✓ Validée</span>;
    } else {
      return <span className="badge badge-pending">⏳ En attente</span>;
    }
  };

  // Format heure (14:00:00 → 14h00)
  const formatTime = (time) => {
    if (!time) return '?';
    return time.substring(0, 5).replace(':', 'h');
  };

  if (loading) {
    return (
      <div className="planning-container loading">
        <p>Chargement de votre planning... 🎵</p>
      </div>
    );
  }

  return (
    <div className="planning-container">
      {/* Header */}
      <header className="planning-header">
        <div className="header-content">
          <h1>🎼 Mon Planning</h1>
          <p className="subtitle">Bienvenue, {user?.prenom} 🎹</p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-number">{inscriptions.length}</span>
            <span className="stat-label">Cours inscrits</span>
          </div>
          <div className="stat">
            <span className="stat-number">
              {inscriptions.filter(i => i.statut_inscription === 'Validée').length}
            </span>
            <span className="stat-label">Validés</span>
          </div>
        </div>
      </header>

      {error && <div className="error-alert">{error}</div>}

      {/* Planning */}
      {inscriptions.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">🎭</p>
          <h2>Aucun cours inscrit</h2>
          <p>Commencez par explorer le catalogue pour vous inscrire à des cours!</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/catalogue')}
          >
            Voir le catalogue →
          </button>
        </div>
      ) : (
        <div className="planning-schedule">
          {/* Affichage par jour */}
          {[1, 2, 3, 4, 5].map(dayNum => (
            <div key={dayNum} className="day-section">
              {/* Header jour */}
              <div className="day-header">
                <span className="day-icon">{dayIcons[dayNum]}</span>
                <h2 className="day-name">{dayNames[dayNum]}</h2>
                <span className="course-count">
                  {groupedCourses[dayNum]?.length || 0} cours
                </span>
              </div>

              {/* Cours du jour */}
              <div className="courses-list">
                {groupedCourses[dayNum] ? (
                  groupedCourses[dayNum].map(cours => (
                    <div key={cours.id} className="course-item">
                      {/* Temps */}
                      <div className="time-block">
                        <span className="start-time">
                          {formatTime(cours.heure_debut)}
                        </span>
                        {cours.heure_fin && (
                          <span className="duration">
                            {formatTime(cours.heure_fin)}
                          </span>
                        )}
                      </div>

                      {/* Contenu cours */}
                      <div className="course-content">
                        <h3 className="course-title">{cours.titre}</h3>
                        <div className="course-meta">
                          <span className="meta-item">
                            📍 <strong>Salle</strong>
                          </span>
                          <span className="meta-item">
                            👨‍🏫 <strong>Prof</strong>
                          </span>
                        </div>
                      </div>

                      {/* Statut */}
                      <div className="course-status">
                        {getStatusBadge(cours.statut_inscription)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-courses-day">
                    <p>Pas de cours ce jour</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer actions */}
      {inscriptions.length > 0 && (
        <footer className="planning-footer">
          <button 
            className="btn-secondary"
            onClick={() => navigate('/catalogue')}
          >
            ➕ Ajouter un cours
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            ← Retour tableau de bord
          </button>
        </footer>
      )}
    </div>
  );
}