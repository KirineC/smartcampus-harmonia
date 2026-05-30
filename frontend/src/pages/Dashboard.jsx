import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // ⏳ États pour le Métronome et le Modal
  const [tempsPratique, setTempsPratique] = useState(210); // 3.5h de base (210 min)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    duree: '',
    instrument_id: '1', // Piano par défaut
    repertoire: '',
    notes: ''
  });

  const navigate = useNavigate();
  const objectifMinutes = 600; // 10 heures

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

  // 📥 Soumission du formulaire de pratique
  const handleSubmitPratique = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/index.php', {
        action: 'enregistrer_pratique',
        etudiant_id: user.etudiant_id || 1, // Utilise l'ID de Sophie
        duree_minutes: parseInt(formData.duree),
        instrument_id: parseInt(formData.instrument_id),
        repertoire_travaille: formData.repertoire,
        notes: formData.notes
      });

      if (response.data.success) {
        // Mise à jour visuelle instantanée du métronome
        setTempsPratique(prev => prev + parseInt(formData.duree));
        setIsModalOpen(false); // Ferme la pop-up
        // Réinitialisation du formulaire
        setFormData({ duree: '', instrument_id: '1', repertoire: '', notes: '' });
        alert("Votre séance d'étude a été consignée au registre.");
      } else {
        alert("Erreur lors de l'enregistrement.");
      }
    } catch (err) {
      console.error(err);
      alert("Impossible de joindre le registre de pratique actuellement.");
    }
  };

  if (loading) {
    return <div className="conservatoire-loading">Ouverture des portes du Conservatoire...</div>;
  }

  const progressionPourcentage = Math.min((tempsPratique / objectifMinutes) * 100, 100);
  const heuresPratiquees = (tempsPratique / 60).toFixed(1);

  return (
    <div className="dashboard-wrapper">
      
      {/* 1. Grand En-tête de Bienvenue */}
      <section className="welcome-section">
        <span className="sc-tag">CONSERVATOIRE NATIONAL SUPÉRIEUR DE MUSIQUE</span>
        <h1 className="welcome-title">Salutations, {user?.prenom} {user?.nom}</h1>
        <p className="academic-status">Membre de l'Académie • Classe de Musique {user?.filiere || 'Classique'}</p>
      </section>

      <div className="dashboard-grid">
        
        {/* 2. Le Métronome de Pratique avec son nouveau bouton */}
        <div className="dashboard-card metronome-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="card-title">🎼 Le Métronome de Pratique</h2>
              <p className="card-subtitle">Suivi de votre discipline hebdomadaire</p>
            </div>
            <button className="add-practice-btn" onClick={() => setIsModalOpen(true)}>
              + Déclarer une séance
            </button>
          </div>
          
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progressionPourcentage}%` }}></div>
          </div>
          
          <div className="metronome-meta">
            <span><strong>{heuresPratiquees} heures</strong> enregistrées</span>
            <span>Objectif : 10 heures</span>
          </div>
        </div>

        {/* 3. Les Répétitions du Jour */}
        <div className="dashboard-card daily-program">
          <h2 className="card-title">📅 Programme du Jour</h2>
          <p className="card-subtitle">Vos séances de répétition pour ce jour</p>
          <div className="mini-program-row">
            <span className="program-time">14h00</span>
            <div className="program-details">
              <h3>Harmonie Avancée</h3>
              <p>Pr. Bach • Salle Debussy</p>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Les Portes de l'Académie */}
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

      {/* 🪙 5. LE MODAL LUXE (FENÊTRE POP-UP) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Consigner une Séance d'Étude</h2>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmitPratique}>
              <div className="form-group-chic">
                <label>Durée de la pratique (en minutes)</label>
                <input 
                  type="number" 
                  placeholder="ex: 90" 
                  value={formData.duree}
                  onChange={(e) => setFormData({...formData, duree: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group-chic">
                <label>Instrument Étudié</label>
                <select 
                  value={formData.instrument_id}
                  onChange={(e) => setFormData({...formData, instrument_id: e.target.value})}
                >
                  <option value="1">Piano</option>
                  <option value="2">Violon</option>
                  <option value="3">Violoncelle</option>
                  <option value="4">Flûte Traversière</option>
                </select>
              </div>

              <div className="form-group-chic">
                <label>Répertoire & Œuvres Travaillées</label>
                <input 
                  type="text" 
                  placeholder="ex: Nocturne Op. 9 No. 2 - Chopin" 
                  value={formData.repertoire}
                  onChange={(e) => setFormData({...formData, repertoire: e.target.value})}
                />
              </div>

              <div className="form-group-chic">
                <label>Notes personnelles / Objectifs atteints</label>
                <textarea 
                  rows="3" 
                  placeholder="Aptitudes techniques, difficultés sur le tempo..." 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <button type="submit" className="submit-practice-btn">
                Inscrire au registre officiel
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}