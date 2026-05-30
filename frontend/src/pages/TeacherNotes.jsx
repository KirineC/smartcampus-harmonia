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

  // 📥 FONCTION D'EXPORTATION CSV (Format Excel Haute Couture)
  const handleExporterCSV = () => {
    if (inscriptionsValidees.length === 0) {
      alert("Aucune donnée disponible à exporter.");
      return;
    }

    // 1. Définition des entêtes du tableau (Séparateur point-virgule pour Excel France)
    const entetes = ["ID Inscription", "Nom", "Prénom", "Enseignement / Cours", "Note Évaluation /20"];
    
    // 2. Construction des lignes de données
    const lignes = inscriptionsValidees.map(et => [
      et.inscription_id,
      et.nom.toUpperCase(),
      et.prenom,
      et.cours,
      et.note !== null && et.note !== '' ? et.note : "Non noté"
    ]);

    // 3. Assemblage du contenu CSV
    // Utilisation du point-virgule ';' comme séparateur pour que Microsoft Excel l'ouvre directement en colonnes sans configuration
    const contenuCSV = [entetes, ...lignes]
      .map(ligne => ligne.map(valeur => `"${String(valeur).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    // 4. Ajout du BOM UTF-8 (\uFEFF) pour forcer Excel à reconnaître l'encodage et afficher correctement les accents français
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), contenuCSV], { type: 'text/csv;charset=utf-8;' });
    
    // 5. Création du lien de téléchargement éphémère
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    
    // Format du nom de fichier : Carnet_Notes_Nom_Prenom_Date.csv
    const nomFichier = `Carnet_Notes_${user?.nom || 'Chaire'}_${new Date().toISOString().split('T')[0]}.csv`;
    
    lien.setAttribute('href', url);
    lien.setAttribute('download', nomFichier);
    lien.style.visibility = 'hidden';
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
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
        {/* En-tête de carte avec le bouton d'exportation aligné à droite */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', // 👈 Correction ici
          alignItems: 'center', 
          marginBottom: '35px', // Plus d'espace sous l'en-tête pour aérer le tableau
          borderBottom: '1px solid #eae9e4', 
          paddingBottom: '20px' 
        }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontWeight: 'normal' }}>
              Bulletins de Notes Numériques
            </h2>
            <p className="card-sub" style={{ margin: '6px 0 0 0', color: '#666' }}>
              Saisie et extraction des résultats de votre chaire.
            </p>
          </div>
          
          {/* Le bouton d'exportation repoussé à droite avec de la marge */}
          {inscriptionsValidees.length > 0 && (
            <button 
              onClick={handleExporterCSV}
              style={{
                background: '#ffffff',
                border: '1px solid #111111',
                color: '#111111',
                padding: '10px 20px',
                fontSize: '13px',
                cursor: 'pointer',
                borderRadius: '2px',
                fontFamily: 'sans-serif',
                letterSpacing: '0.5px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginLeft: '20px' // Sécurité pour qu'il ne colle jamais le texte
              }}
              onMouseOver={(e) => { e.target.style.background = '#111111'; e.target.style.color = '#ffffff'; }}
              onMouseOut={(e) => { e.target.style.background = '#ffffff'; e.target.style.color = '#111111'; }}
            >
              📥 Exporter le registre (.CSV)
            </button>
          )}
        </div>

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
            {inscriptionsValidees.length === 0 && (
              <tr><td colSpan="3" style={{ textAlign: 'center', fontStyle: 'italic', color: '#888', padding: '30px' }}>Aucun étudiant validé disponible pour la saisie des notes.</td></tr>
            )}
          </tbody>
        </table>

        {inscriptionsValidees.length > 0 && (
          <button className="teacher-btn-dark" style={{ marginTop: '25px' }} onClick={handlePublierNotes}>
            Confirmer et publier les notes
          </button>
        )}
      </div>
    </div>
  );
}