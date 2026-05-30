import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [bulletin, setBulletin] = useState(null);
  const [bulletinLoading, setBulletinLoading] = useState(true);
  const [hasNewNote, setHasNewNote] = useState(false);

  const [tempsPratique, setTempsPratique] = useState(210);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    duree: '',
    instrument_id: '1',
    repertoire: '',
    notes: ''
  });

  const navigate = useNavigate();
  const objectifMinutes = 600;

  const gateCardStyle = {
    height: '160px',
    minHeight: '160px',
    boxSizing: 'border-box'
  };

  const getLatestNote = (notes = []) => {
    const notesPubliees = notes.filter(
      n => n.valeur_note !== null && n.valeur_note !== undefined
    );

    if (notesPubliees.length === 0) return null;

    return notesPubliees.sort((a, b) => {
      const dateA = a.date_evaluation || '';
      const dateB = b.date_evaluation || '';
      return dateB.localeCompare(dateA);
    })[0];
  };

  const getLatestSignature = (notes = []) => {
    const latest = getLatestNote(notes);

    if (!latest) return null;

    return `${latest.inscription_id}-${latest.valeur_note}-${latest.date_evaluation || 'sans-date'}`;
  };

  const chargerBulletinEtudiant = async (userObj) => {
    try {
      setBulletinLoading(true);

      const response = await api.get('/index.php?mes_notes=1');

      if (response.data && response.data.success) {
        setBulletin(response.data);

        const signature = getLatestSignature(response.data.notes || []);
        const seenKey = `harmonia_notes_seen_${userObj.id}`;
        const lastSeen = localStorage.getItem(seenKey);

        setHasNewNote(Boolean(signature && signature !== lastSeen));
      }
    } catch (err) {
      console.error("Erreur chargement bulletin:", err);
    } finally {
      setBulletinLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');

    if (!userData) {
      navigate('/');
      return;
    }

    const userObj = JSON.parse(userData);

    if (userObj.role === 'enseignant' || userObj.role === 'admin') {
      navigate('/enseignant/dashboard');
      return;
    }

    setUser(userObj);
    setLoading(false);

    if (userObj.role === 'etudiant') {
      chargerBulletinEtudiant(userObj);
    }
  }, [navigate]);

  const handleOpenBulletin = () => {
    if (user && bulletin?.notes) {
      const signature = getLatestSignature(bulletin.notes);

      if (signature) {
        localStorage.setItem(`harmonia_notes_seen_${user.id}`, signature);
      }
    }

    setHasNewNote(false);
    navigate('/mes-notes');
  };

  const handleSubmitPratique = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/index.php', {
        action: 'enregistrer_pratique',
        etudiant_id: user.etudiant_id || 1,
        duree_minutes: parseInt(formData.duree),
        instrument_id: parseInt(formData.instrument_id),
        repertoire_travaille: formData.repertoire,
        notes: formData.notes
      });

      if (response.data.success) {
        setTempsPratique(prev => prev + parseInt(formData.duree));
        setIsModalOpen(false);
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

  const stats = bulletin?.stats || {};
  const notes = bulletin?.notes || [];
  const latestNote = getLatestNote(notes);

  return (
    <div className="dashboard-wrapper">

      <section className="welcome-section">
        <span className="sc-tag">CONSERVATOIRE NATIONAL SUPÉRIEUR DE MUSIQUE</span>
        <h1 className="welcome-title">Salutations, {user?.prenom} {user?.nom}</h1>
        <p className="academic-status">
          Membre de l'Académie • Classe de Musique {user?.filiere || 'Classique'}
        </p>
      </section>

      <div className="dashboard-grid">
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

      <section className="academy-gates">
        <h2 className="section-subtitle">Démarches Académiques</h2>

        <div className="gates-grid">
          <div
            className="gate-card"
            onClick={() => navigate('/catalogue')}
            style={gateCardStyle}
          >
            <div className="gate-content">
              <span className="gate-number">I</span>
              <h3>Grand Catalogue</h3>
              <p>
                Consulter les enseignements disponibles et solliciter une inscription auprès des maîtres de classe.
              </p>
            </div>

            <span className="gate-arrow">→</span>
          </div>

          <div
            className="gate-card"
            onClick={() => navigate('/planning')}
            style={gateCardStyle}
          >
            <div className="gate-content">
              <span className="gate-number">II</span>
              <h3>Registre d'Études</h3>
              <p>
                Ouvrir votre emploi du temps personnalisé et vérifier le statut de vos confirmations de cours.
              </p>
            </div>

            <span className="gate-arrow">→</span>
          </div>

          <div
            className="gate-card"
            onClick={handleOpenBulletin}
            style={{
              ...gateCardStyle,
              position: 'relative',
              borderColor: hasNewNote ? '#d4af37' : undefined,
              boxShadow: hasNewNote ? '0 0 0 1px rgba(212, 175, 55, 0.35)' : undefined,
              backgroundImage: "linear-gradient(rgba(255,255,255,0.76), rgba(255,255,255,0.88)), url('/img/partition.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {hasNewNote && (
              <span
                title="Nouvelle note disponible"
                style={{
                  position: 'absolute',
                  top: '18px',
                  right: '22px',
                  width: '11px',
                  height: '11px',
                  borderRadius: '50%',
                  background: '#d4af37',
                  boxShadow: '0 0 0 4px rgba(212, 175, 55, 0.18)'
                }}
              />
            )}

            <div className="gate-content">
              <span className="gate-number">III</span>
              <h3>Bulletin de Pupitre</h3>

              {bulletinLoading ? (
                <p>Chargement de vos résultats académiques...</p>
              ) : (
                <p>
                  Moyenne : <strong>{stats.moyenne !== null && stats.moyenne !== undefined ? `${stats.moyenne}/20` : '—'}</strong>
                  <br />
                  Progression académique : <strong>{stats.cours_notes || 0}/{stats.total_cours || 0}</strong>
                  <br />
                  {latestNote
                    ? `Dernière publication : ${latestNote.titre} — ${Number(latestNote.valeur_note)}/20`
                    : 'Aucune note publiée pour le moment.'}
                </p>
              )}
            </div>

            <span className="gate-arrow">→</span>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Consigner une Séance d'Étude</h2>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSubmitPratique}>
              <div className="form-group-chic">
                <label>Durée de la pratique en minutes</label>
                <input
                  type="number"
                  placeholder="ex: 90"
                  value={formData.duree}
                  onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                  required
                />
              </div>

              <div className="form-group-chic">
                <label>Instrument étudié</label>
                <select
                  value={formData.instrument_id}
                  onChange={(e) => setFormData({ ...formData, instrument_id: e.target.value })}
                >
                  <option value="1">Piano</option>
                  <option value="2">Violon</option>
                  <option value="3">Violoncelle</option>
                  <option value="4">Flûte Traversière</option>
                </select>
              </div>

              <div className="form-group-chic">
                <label>Répertoire & œuvres travaillées</label>
                <input
                  type="text"
                  placeholder="ex: Nocturne Op. 9 No. 2 - Chopin"
                  value={formData.repertoire}
                  onChange={(e) => setFormData({ ...formData, repertoire: e.target.value })}
                />
              </div>

              <div className="form-group-chic">
                <label>Notes personnelles / objectifs atteints</label>
                <textarea
                  rows="3"
                  placeholder="Aptitudes techniques, difficultés sur le tempo..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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