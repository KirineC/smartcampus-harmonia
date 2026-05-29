import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pratique: 0, objectif: 600 });
  const navigate = useNavigate();

  // 🔐 Sécurisation de la page (Route protégée)
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return <div className="conservatoire-loading">Ouverture des portes du Conservatoire...</div>;
  }

  // Calcul du pourcentage pour la barre de progression (Métronome)
  const progressionPourcentage = Math.min((stats.pratique / stats.objectif) * 100, 100);

  return (
    <div className="dashboard-wrapper">
      
      {/* 1. Grand En-tête de Bienvenue */}
      <section className="welcome-section">
        <span className="sc-tag">CONSERVATOIRE NATIONAL SUPÉRIEUR DE MUSIQUE</span>
        <h1 className="welcome-title">Salutations, {user?.prenom} {user?.nom}</h1>
        <p className="academic-status">Membre de l'Académie • Classe de Musique {user?.filiere || 'Classique'}</p>
      </section>

      <div className="dashboard-grid">
        
        {/* 2. Le Métronome de Pratique (Objectif Hebdomadaire) */}
        <div className="dashboard-card metronome-box">
          <h2 className="card-title">🎼 Le Métronome de Pratique</h2>
          <p className="card-subtitle">Suivi de votre discipline hebdomadaire</p>
          
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progressionPourcentage}%` }}></div>
          </div>
          
          <div className="metronome-meta">
            <span><strong>3.5 heures</strong> enregistrées</span>
            <span>Objectif : 10 heures</span>
          </div>
        </div>

        {/* 3. Les Répétitions du Jour (Aperçu rapide) */}
        <div className="dashboard-card daily-program">
          <h2 className="card-title">📅 Programme du Jour</h2>
          <p className="card-subtitle">Vos séances de répétition pour ce jour</p>
          
          {/* Exemple statique en attendant le lien PHP, très chic */}
          <div className="mini-program-row">
            <span className="program-time">14h00</span>
            <div className="program-details">
              <h3>Harmonie Avancée</h3>
              <p>Pr. Bach • Salle Debussy</p>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Les Portes de l'Académie (Navigation) */}
      <section className="academy-gates">
        <h2 className="section-subtitle">Démarches Académiques</h2>
        <div className="gates-grid">
          
          <div className="gate-card" onClick={() => navigate('/catalogue')}>
            <div className="gate-content">
              <span className="gate-number">I</span>
              <h3>Grand Catalogue</h3>
              <p>Consulter les enseignements disponibles et solliciter une inscription auprès des maîtres de classe.</p>
            </div>
            <span className="gate-arrow">→</span>
          </div>

          <div className="gate-card" onClick={() => navigate('/planning')}>
            <div className="gate-content">
              <span className="gate-number">II</span>
              <h3>Registre d'Études</h3>
              <p>Ouvrir votre emploi du temps personnalisé et vérifier le statut de vos confirmations de cours.</p>
            </div>
            <span className="gate-arrow">→</span>
          </div>

        </div>
      </section>

    </div>
  );
}