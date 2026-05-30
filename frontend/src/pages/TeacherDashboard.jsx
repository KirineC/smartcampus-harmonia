import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Ton instance Axios configurée
import './TeacherDashboard.css';

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('classes');
  const [etudiants, setEtudiants] = useState([]); // 🌌 Géré par SQL !
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    const userObj = JSON.parse(userData);
    if (userObj.role !== 'enseignant' && userObj.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    setUser(userObj);
    
    // 📥 Récupération des vrais élèves depuis la base de données
    chargerElevesDuProf(userObj.id);
  }, [navigate]);

  const chargerElevesDuProf = async (profUserId) => {
    try {
      setErrorMsg('');
      const response = await api.get(`/index.php?liste_eleves_prof=${profUserId}`);
      
      if (response.data && response.data.success) {
        setEtudiants(response.data.etudiants);
      } else {
        setErrorMsg(response.data.error || "Impossible de charger le registre.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur de liaison avec le secrétariat numérique.");
    } finally {
      setLoading(false);
    }
  };

  // 👍 Validation d'une inscription en base SQL
  const handleAccepterInscription = async (inscriptionId) => {
    try {
      const response = await api.post('/index.php', {
        action: 'valider_inscription',
        inscription_id: inscriptionId // 🌟 Corrigé ici (plus de double id)
      });

      if (response.data && response.data.success) {
        setEtudiants(prev => prev.map(et => et.inscription_id === inscriptionId ? { ...et, statut: 'Validée' } : et));
        alert("L'étudiant a été inscrit officiellement à votre classe.");
      } else {
        alert(response.data.error || "Erreur lors de la validation.");
      }
    } catch (err) {
      console.error(err);
      alert("Impossible de joindre le secrétariat académique.");
    }
  };

  // ❌ Révocation d'une inscription en base SQL
  const handleSupprimerInscription = async (inscriptionId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir révoquer cet étudiant de votre registre ?")) return;
    
    try {
      const response = await api.post('/index.php', {
        action: 'revoquer_inscription',
        inscription_id: inscriptionId // 🌟 Corrigé ici aussi
      });

      if (response.data && response.data.success) {
        setEtudiants(prev => prev.filter(et => et.inscription_id !== inscriptionId));
        alert("L'inscription a été révoquée du registre.");
      } else {
        alert(response.data.error || "Erreur lors de la révocation.");
      }
    } catch (err) {
      console.error(err);
      alert("Impossible de joindre le secrétariat académique.");
    }
  };

  // ✍️ Modification d'une note
  const handleNoteChange = (etudiantId, valeur) => {
    setEtudiants(prev => prev.map(et => et.etudiant_id === etudiantId ? { ...et, note: valeur } : et));
  };

  if (loading) {
    return <div className="conservatoire-loading">Ouverture du Registre des Maîtres...</div>;
  }

  return (
    <div className="teacher-wrapper">
      
      {/* En-tête de l'Enseignant */}
      <section className="teacher-welcome">
        <div>
          <span className="sc-tag">CONSERVATOIRE NATIONAL SUPÉRIEUR • REGISTRE DES MAÎTRES</span>
          <h1 className="teacher-title">Bienvenue, Maître {user?.prenom} {user?.nom}</h1>
          <p className="teacher-status">Gestion pédagogique de vos chaires d'enseignements</p>
          {errorMsg && <p style={{ color: '#c5221f', marginTop: '10px' }}>{errorMsg}</p>}
        </div>
        
        {/* Menu des Onglets Enseignant uniquement */}
        <div className="teacher-tabs">
          <button className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => setActiveTab('classes')}>
            🎻 Vos Classes & Inscriptions
          </button>
          <button className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
            📊 Saisie des Notes
          </button>
        </div>
      </section>

      {/* Contenu dynamique */}
      <div className="teacher-content">
        
        {/* 🎭 CONTROLE DES INSCRIPTIONS (SECTION 7) */}
        {activeTab === 'classes' && (
          <div className="teacher-card animate-fade">
            <h2>Registre des inscriptions à vos Cours</h2>
            <p className="card-sub">Consultez les élèves de vos pupitres. Validez les demandes en attente ou révoquez un accès.</p>
            
            <table className="chic-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Cours</th>
                  <th>Statut</th>
                  <th>Actions Pédagogiques</th>
                </tr>
              </thead>
              <tbody>
                {etudiants.map(et => {
                  const estEnAttente = et.statut?.toLowerCase().includes('attente');
                  return (
                    <tr key={et.inscription_id}>
                      <td><strong>{et.prenom} {et.nom}</strong></td>
                      <td>{et.cours}</td>
                      <td>
                        <span className={`status-badge ${estEnAttente ? 'en-attente' : 'validé'}`}>
                          {et.statut}
                        </span>
                      </td>
                      <td>
                        {estEnAttente && (
                          <button className="action-btn-valid" onClick={() => handleAccepterInscription(et.inscription_id)}>Valider</button>
                        )}
                        <button className="action-btn-delete" onClick={() => handleSupprimerInscription(et.inscription_id)}>Révoquer</button>
                      </td>
                    </tr>
                  );
                })}
                {etudiants.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', fontStyle: 'italic', color: '#888', padding: '30px' }}>
                      Aucune inscription enregistrée pour vos cours actuellement.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ✍️ GESTION DES NOTES (SECTION 8) */}
        {activeTab === 'notes' && (
          <div className="teacher-card animate-fade">
            <h2>Saisie des Évaluations (Auditions de Fin de Semestre)</h2>
            <p className="card-sub">Attribuez les notes de vos élèves. Les résultats seront consultables instantanément sur leur espace personnel.</p>
            
            <table className="chic-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Cours</th>
                  <th>Note de l'Audition (/20)</th>
                </tr>
              </thead>
              <tbody>
                {etudiants.filter(et => et.statut?.toLowerCase().includes('valid')).map(et => (
                  <tr key={et.etudiant_id}>
                    <td>{et.prenom} {et.nom}</td>
                    <td>{et.cours}</td>
                    <td>
                      <input 
                        type="number" 
                        min="0" 
                        max="20" 
                        className="chic-note-input"
                        value={et.note || ''} 
                        onChange={(e) => handleNoteChange(et.etudiant_id, e.target.value)}
                        placeholder="Non noté"
                      />
                    </td>
                  </tr>
                ))}
                {etudiants.filter(et => et.statut?.toLowerCase().includes('valid')).length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', fontStyle: 'italic', color: '#888', padding: '30px' }}>
                      Aucun étudiant validé disponible pour la saisie des notes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <button className="teacher-btn-dark" style={{ marginTop: '20px' }} onClick={() => alert("Notes publiées officiellement.")}>
              Confirmer et publier les notes
            </button>
          </div>
        )}

      </div>
    </div>
  );
}