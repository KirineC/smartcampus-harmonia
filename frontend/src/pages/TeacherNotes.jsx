import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './TeacherDashboard.css';

export default function TeacherNotes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [etudiants, setEtudiants] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/'); return; }
    const userObj = JSON.parse(userData);
    setUser(userObj);
    chargerElevesValides(userObj.id);
  }, []);

  const chargerElevesValides = async (profUserId) => {
    try {
      setLoading(true);
      const response = await api.get(`/index.php?liste_eleves_prof=${profUserId}`);
      if (response.data && response.data.success) {
        setEtudiants(response.data.etudiants || []);
      }
    } catch (err) {
      setErrorMsg("Erreur lors de la liaison académique.");
    } finally { setLoading(false); }
  };

  const handleNoteChange = (inscriptionId, valeur) => {
    setEtudiants(prev => prev.map(et => et.inscription_id === inscriptionId ? { ...et, note: valeur } : et));
  };

  const handlePublierNotes = async () => {
    setErrorMsg(''); setSuccessMsg('');
    const validStudents = etudiants.filter(et => et.statut?.toLowerCase().includes('valid'));
    const notesAEnvoyer = validStudents
      .filter(et => et.note !== null && et.note !== '')
      .map(et => ({ inscription_id: et.inscription_id, note: et.note }));

    if (notesAEnvoyer.length === 0) { alert("Aucune note saisie."); return; }

    try {
      const response = await api.post('/index.php', { action: 'publier_notes', notes: notesAEnvoyer });
      if (response.data && response.data.success) {
        setSuccessMsg("✨ Les notes ont été publiées avec succès sur les bulletins !");
        await chargerElevesValides(user.id);
      }
    } catch (err) { setErrorMsg("Erreur de transmission."); }
  };

  const inscriptionsValidees = etudiants.filter(et => et.statut?.toLowerCase().includes('valid'));

  if (loading) return <div className="conservatoire-loading">Ouverture du Carnet de Notes...</div>;

  return (
    <div className="teacher-wrapper" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={() => navigate('/enseignant/dashboard')} className="logout-btn" style={{ marginBottom: '20px', border: '1px solid #eae9e4' }}>
        ← Retour au Registre
      </button>

      <h1 style={{ fontFamily: 'Georgia', fontWeight: 'normal', marginBottom: '30px' }}>Saisie des Évaluations d'Audition</h1>

      {successMsg && <div style={{ background: '#e8f5e9', border: '1px solid #137333', color: '#137333', padding: '12px', marginBottom: '20px' }}>{successMsg}</div>}
      {errorMsg && <div style={{ background: '#fdecea', border: '1px solid #b3261e', color: '#b3261e', padding: '12px', marginBottom: '20px' }}>{errorMsg}</div>}

      <div className="teacher-card">
        <h2>Bulletins de Notes Numériques</h2>
        <table className="chic-table">
          <thead>
            <tr><th>Étudiant</th><th>Cours de Chaire</th><th>Note de l'Audition (/20)</th></tr>
          </thead>
          <tbody>
            {inscriptionsValidees.map(et => (
              <tr key={et.inscription_id}>
                <td>{et.prenom} {et.nom}</td>
                <td>{et.cours}</td>
                <td>
                  <input
                    type="number" min="0" max="20" className="chic-note-input"
                    value={et.note || ''}
                    onChange={(e) => handleNoteChange(et.inscription_id, e.target.value)}
                    placeholder="Non noté"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button className="teacher-btn-dark" style={{ marginTop: '25px' }} onClick={handlePublierNotes}>
          Confirmer et publier les notes
        </button>
      </div>
    </div>
  );
}