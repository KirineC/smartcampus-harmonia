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

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // 🔐 Authentification réelle restaurée
  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        navigate('/'); // Renvoie au Login si pas connecté
        return;
      }
      const userObj = JSON.parse(userData);
      setUser(userObj);
      
      if (userObj.role !== 'etudiant') {
        setError('Accès réservé aux membres de l’Académie.');
        return;
      }
    };

    checkAuth();
  }, [navigate]);

  // 🔄 Récupération des cours via le PHP
  useEffect(() => {
    const fetchInscriptions = async () => {
      try {
        setLoading(true);
        const response = await api.get('/index.php?mes_inscriptions=1');
        
        if (Array.isArray(response.data)) {
          const sorted = response.data.sort((a, b) => {
            if (a.jour_semaine !== b.jour_semaine) return a.jour_semaine - b.jour_semaine;
            return a.heure_debut.localeCompare(b.heure_debut);
          });
          setInscriptions(sorted);
        }
      } catch (err) {
        console.error(err);
        setError('Le registre des partitions est momentanément inaccessible.');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchInscriptions();
  }, [user]);

  // Regroupement des cours par jour
  const groupedCourses = inscriptions.reduce((acc, current) => {
    const day = current.jour_semaine || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(current);
    return acc;
  }, {});

  // Fonction pour calculer le temps total de cours par jour (En heures)
  const calculateDailyTempo = (courses) => {
    if (!courses) return 0;
    return courses.reduce((total, c) => {
      const duration = (new Date(`1970-01-01T${c.heure_fin}`) - new Date(`1970-01-01T${c.heure_debut}`)) / 3600000;
      return total + duration;
    }, 0).toFixed(1);
  };

  const formatTime = (time) => time ? time.substring(0, 5).replace(':', 'h') : '?';

  if (loading) return <div className="conservatoire-loading">Chargement de votre pupitre...</div>;

  return (
    <div className="harmonia-art-wrapper">
      {/* Grand En-tête Haute Couture */}
      <header className="art-header">
        <div className="brand-block">
          <span className="sc-tag">SMARTCAMPUS // HARMONIA</span>
          <h1 className="main-art-title">Mon Registre d'Études</h1>
          <p className="student-signature">Pupitre virtuel de {user?.prenom} — Session Académique</p>
        </div>
        <div className="quick-actions">
          <button className="minimal-btn" onClick={() => navigate('/catalogue')}>
            + Solliciter une Masterclass
          </button>
        </div>
      </header>

      {error && <div className="art-error">{error}</div>}

      {/* Liste Chronologique Style Partition */}
      <main className="partition-stream">
        {[1, 2, 3, 4, 5].map(dayNum => {
          const dailyCourses = groupedCourses[dayNum] || [];
          const tempoHours = calculateDailyTempo(dailyCourses);

          return (
            <div key={dayNum} className="measure-row">
              {/* Colonne de gauche : Le Jour et son "Tempo" */}
              <div className="measure-meta">
                <h2 className="measure-day">{dayNames[dayNum]}</h2>
                <span className="measure-tempo-indicator">
                  Tempo : {tempoHours}h de pratique
                </span>
              </div>

              {/* Colonne de droite : Les lignes de portée (Cours) */}
              <div className="measure-staff">
                {dailyCourses.length === 0 ? (
                  <div className="empty-measure-text">Silence — Aucune répétition programmée.</div>
                ) : (
                  dailyCourses.map(cours => (
                    <div key={cours.id} className="staff-node">
                      {/* Heure */}
                      <div className="node-time">
                        {formatTime(cours.heure_debut)} — {formatTime(cours.heure_fin)}
                      </div>

                      {/* Infos de la discipline */}
                      <div className="node-details">
                        <h3 className="node-title">{cours.titre}</h3>
                        <p className="node-sub">
                          <span>🏛️ Lieu : <strong>{cours.nom_salle || 'Studio libre'}</strong></span>
                          <span className="separator">•</span>
                          <span>👨‍🏫 Maître : <strong>Pr. {cours.prof_nom}</strong></span>
                        </p>
                      </div>

                      {/* Statut Élégant */}
                      <div className="node-status">
                        <span className={`status-dot ${cours.statut_inscription === 'Validée' ? 'approved' : 'pending'}`}>
                          {cours.statut_inscription === 'Validée' ? 'Confirmé' : 'En attente'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}